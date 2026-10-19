using System.Text;
using System.Text.Json;
using CodexInstanceManager;
using Microsoft.Data.Sqlite;

internal static class AgentManagementTests
{
    private static int Count;

    #region Entry
    public static void Run() => Task.Run(VerifyAsync).GetAwaiter().GetResult();

    public static int LiveProbe()
    {
        var Instance = SettingsStore.Load().InstanceList.Single(Item => Item.IsPrimary);
        var Catalog = new AgentCatalog();
        var ProjectList = Catalog.ProjectsAsync(Instance, CancellationToken.None).GetAwaiter().GetResult();
        var Project = ProjectList.Single(Item => Item.Name == "MmCodexMgr");
        var SessionList = Catalog.Sessions(Instance, Project, null, 0);
        Require(SessionList.Any(Item => Item.Id == Environment.GetEnvironmentVariable("CODEX_THREAD_ID")), "read-only project lookup includes current renamed conversation via canonical cwd");
        var Current = Catalog.Session(Instance, Environment.GetEnvironmentVariable("CODEX_THREAD_ID")!);
        Require(Catalog.Sessions(Instance, Project, Current.Title, 0).Any(Item => Item.Id == Current.Id), "display name resolves to the actual session id");
        Console.WriteLine($"PASS agent catalog read-only live probe projects={ProjectList.Count} sessions={SessionList.Count}");
        return 0;
    }
    #endregion

    #region Verification
    private static async Task VerifyAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexAgentTests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        var Settings = new ManagerSettings { InstanceList = new() { new() { Id = "main", Name = "主实例", HomePath = Path.Combine(Root, "main") }, new() { Id = "second", Name = "第二实例", HomePath = Path.Combine(Root, "second") } } };
        Require(AgentManagementService.ResolveInstance(Settings, "实例1").Id == "main" && AgentManagementService.ResolveInstance(Settings, "2").Id == "second", "instance numbers use registered order");
        Settings.InstanceList.Add(new() { Id = "duplicate", Name = "第二实例" });
        await RejectAsync(() => Task.FromResult(AgentManagementService.ResolveInstance(Settings, "第二实例")), "ambiguous instance name does not pick first match");
        Settings.InstanceList.RemoveAt(2);
        var Store = new RelayStore(Path.Combine(Root, "relay"));
        var Bridge = new FakeBridge();
        var Catalog = new FakeCatalog(Root);
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        var Service = new AgentManagementService(Store, Coordinator, Catalog, Environment.ProcessPath!, () => Settings);
        string PipeName = "CodexAgentTests-" + Guid.NewGuid().ToString("N");
        using var Host = new RelayHost(Coordinator, PipeName, Service);
        var Instances = await CliAsync(new[] { "instances" }, Root, PipeName, Settings);
        Require(Instances.GetArrayLength() == 2, "console CLI crosses real named pipe and returns registry");
        var Request = Start("mixed-same", "main", "session-a");
        var Same = await StartAsync(Request, Root, PipeName, Settings);
        string SameId = Same.GetProperty("task_id").GetString()!;
        var Cross = await StartAsync(Start("mixed-cross", "second", "session-b"), Root, PipeName, Settings);
        Require(Bridge.SentList.Count == 2 && Same.GetProperty("thread_id").GetString() == "session-a", "same-instance Session and cross-instance Agent run together");
        await StartAsync(Request, Root, PipeName, Settings);
        Require(Bridge.SentList.Count == 2, "same CLI request id does not resend");
        await RejectAsync(() => StartAsync(Start("over-same", "main", "session-c"), Root, PipeName, Settings), "same-instance concurrency cap enforced independently");
        await RejectAsync(() => StartAsync(Start("over-cross", "second", "session-d"), Root, PipeName, Settings), "cross-instance concurrency cap enforced independently");
        var Nested = await StartAsync(Start("nested", "main", "session-c"), Root, PipeName, Settings, "session-a");
        string NestedId = Nested.GetProperty("task_id").GetString()!;
        Require(Bridge.SentList.Last().Thread == "session-c" && Bridge.SentList.Last().Prompt.Contains("subagent_max=2"), "worker can delegate to another Session while retaining Subagent budget");
        await RejectAsync(() => StartAsync(Start("cycle", "main", "main-thread"), Root, PipeName, Settings, "session-c"), "descendant cannot form a wait cycle back to root");
        var Escalation = Start("escalate", "second", "session-d");
        Escalation["subagent_max"] = 3;
        await RejectAsync(() => StartAsync(Escalation, Root, PipeName, Settings, "session-c"), "descendant cannot raise inherited budget");
        await RejectAsync(() => Coordinator.ReportAsync("main", "session-a", SameId, "completed", "premature", new()), "parent cannot finish while its child is executing");
        await Coordinator.ReportAsync("main", "session-c", NestedId, "completed", "child evidence", new());
        await RejectAsync(() => Coordinator.ReportAsync("main", "session-a", SameId, "completed", "premature", new()), "child report still requires parent acceptance before forwarding to root");
        await Coordinator.ReviewAsync("main", "session-a", NestedId);
        await Coordinator.ReportAsync("main", "session-a", SameId, "completed", "integrated evidence", new());
        Require(Store.Get(SameId).State == eRelayState.Returned && Bridge.SentList.Last().Thread == "main-thread", "nested callback returns through immediate parents");
        await Coordinator.ReviewAsync("main", "main-thread", SameId);
        await Coordinator.CancelAsync(Cross.GetProperty("task_id").GetString()!);
        var NewRequest = Start("created", "second", null);
        NewRequest["create_title"] = "资源执行 子对话";
        var New = await StartAsync(NewRequest, Root, PipeName, Settings);
        int SentBefore = Bridge.SentList.Count;
        await StartAsync(NewRequest, Root, PipeName, Settings);
        Require(Catalog.CreateCount == 1 && Bridge.SentList.Count == SentBefore && New.GetProperty("thread_id").GetString() == "created-thread", "new conversation receives prompt in creation and retry never creates or sends twice");
        var Changed = new Dictionary<string, object>(NewRequest) { ["create_title"] = "another title" };
        await RejectAsync(() => StartAsync(Changed, Root, PipeName, Settings), "idempotency includes new conversation identity");
        await Coordinator.CancelAsync(New.GetProperty("task_id").GetString()!);
        Catalog.Busy = true;
        int BeforeBusy = Bridge.SentList.Count;
        await RejectAsync(() => StartAsync(Start("busy", "second", "session-b"), Root, PipeName, Settings), "busy conversation is not interrupted");
        Require(Bridge.SentList.Count == BeforeBusy, "busy check fails before delivery");
        Catalog.Busy = false;
        Catalog.Duplicate = true;
        await RejectAsync(() => StartAsync(Start("duplicate", "second", "duplicate"), Root, PipeName, Settings), "duplicate session names require explicit id");
        Catalog.Duplicate = false;
        var CancelRoot = await StartAsync(Start("cancel-tree", "main", "session-a"), Root, PipeName, Settings);
        var CancelChild = await StartAsync(Start("cancel-child", "second", "session-d"), Root, PipeName, Settings, "session-a");
        await Coordinator.CancelAsync(CancelRoot.GetProperty("task_id").GetString()!);
        string ChildId = CancelChild.GetProperty("task_id").GetString()!;
        Require(Store.Get(ChildId).State == eRelayState.Cancelled, "cancelling parent closes descendants without stopping models");
        await RejectAsync(() => Coordinator.ReportAsync("second", "session-d", ChildId, "completed", "late", new()), "cancelled descendant cannot wake parent later");
        Catalog.FailCreate = true;
        var UncertainRequest = Start("uncertain-create", "second", null);
        UncertainRequest["create_title"] = "创建结果待核对";
        await RejectAsync(() => StartAsync(UncertainRequest, Root, PipeName, Settings), "unconfirmed creation error remains visible");
        var UncertainRetry = await StartAsync(UncertainRequest, Root, PipeName, Settings);
        Require(Catalog.CreateCount == 2 && UncertainRetry.GetProperty("instruction").GetString()!.Contains("待核对"), "uncertain creation retry returns saved record and never creates again");
        string UncertainId = UncertainRetry.GetProperty("task_id").GetString()!;
        var Status = await CliAsync(new[] { "status", "--task-id", UncertainId }, Root, PipeName, Settings);
        Require(Status.GetProperty("state").GetString() == "派发待核对" && Status.GetProperty("worker").GetProperty("thread_id").GetString() == "", "CLI status exposes uncertainty and missing thread id without full task logs");
        await Coordinator.CancelAsync(UncertainId);
        await VerifyCatalogAsync(Root);
        VerifyCliRelocation(Path.Combine(Root, "cli-relocation"));
        Console.WriteLine($"PASS agent management {Count} assertions; fixture={Root}");
    }

    private static void VerifyCliRelocation(string Root)
    {
        var Instance = new InstanceProfile { Id = "relocated", HomePath = Path.Combine(Root, "home") };
        string SkillPath = Path.Combine(Instance.HomePath, "skills", "moremore-work");
        Directory.CreateDirectory(SkillPath);
        string ConfigPath = Path.Combine(Instance.HomePath, "config.toml");
        string SkillConfigPath = Path.Combine(SkillPath, "config.json");
        File.WriteAllText(ConfigPath, "model='keep-model'\n[mcp_servers.existing]\ncommand='keep-command'\n");
        File.WriteAllText(Path.Combine(SkillPath, "SKILL.md"), "fixture skill");
        File.WriteAllText(SkillConfigPath, "{\"cli_path\":\"old-cli.exe\",\"keep_setting\":true}");
        string OriginalDirectory = Path.Combine(Root, "original manager");
        string MovedDirectory = Path.Combine(Root, "迁移后的管理器");
        Directory.CreateDirectory(OriginalDirectory);
        Directory.CreateDirectory(MovedDirectory);
        string OriginalCli = Path.Combine(OriginalDirectory, "mmcodex.exe");
        string MovedCli = Path.Combine(MovedDirectory, "mmcodex.exe");
        File.Copy(Environment.ProcessPath!, OriginalCli);
        File.Copy(OriginalCli, MovedCli);
        AgentCliDeployment.Install(Instance, OriginalCli, null);
        string PreviousConfig = File.ReadAllText(ConfigPath);
        var Result = JsonSerializer.SerializeToElement(AgentCliDeployment.Install(Instance, MovedCli, null));
        using var SkillConfig = JsonDocument.Parse(File.ReadAllText(SkillConfigPath));
        var Config = Tomlyn.Toml.ToModel(File.ReadAllText(ConfigPath));
        var Servers = (Tomlyn.Model.TomlTable)Config["mcp_servers"];
        var Definition = (Tomlyn.Model.TomlTable)Servers[RelayLimits.McpName];
        Require((string)Definition["command"] == MovedCli && SkillConfig.RootElement.GetProperty("cli_path").GetString() == MovedCli, "reinstalling a relocated CLI updates both MCP and existing Skill paths");
        var Arguments = (Tomlyn.Model.TomlArray)Definition["args"];
        Require(Arguments.Cast<string>().SequenceEqual(new[] { "mcp", "--instance", Instance.Id }), "relocation retains the target instance identity");
        Require((string)Config["model"] == "keep-model" && Servers.ContainsKey("existing") && SkillConfig.RootElement.GetProperty("keep_setting").GetBoolean(), "relocation preserves model unrelated MCP servers and additional Skill settings");
        Require(File.ReadAllText(Result.GetProperty("config_backup").GetString()!) == PreviousConfig, "relocation retains the previous MCP configuration for recovery");
    }

    private static Dictionary<string, object> Start(string Key, string Instance, string? Session) => new()
    {
        ["request_id"] = Key, ["instance"] = Instance, ["project"] = "项目 有空格", ["session"] = Session!,
        ["title"] = "资源处理", ["instructions"] = "目的：提取资源\n任务分析：仅写输出目录", ["acceptance"] = "按清单验证",
        ["session_max"] = 1, ["subagent_max"] = 2, ["cross_agent_max"] = 1, ["workspace"] = new { access = "read_only" }
    };

    private static async Task<JsonElement> StartAsync(Dictionary<string, object> Request, string Root, string PipeName, ManagerSettings Settings, string CallerThread = "main-thread")
    {
        string FilePath = Path.Combine(Root, Guid.NewGuid().ToString("N") + " 请求.json");
        File.WriteAllText(FilePath, JsonSerializer.Serialize(Request), new UTF8Encoding(false));
        return await CliAsync(new[] { "start", "--json-file", FilePath }, Root, PipeName, Settings, CallerThread);
    }

    private static async Task<JsonElement> CliAsync(string[] Arguments, string Root, string PipeName, ManagerSettings Settings, string CallerThread = "main-thread")
    {
        using var Input = new MemoryStream();
        using var Output = new MemoryStream();
        using var Error = new StringWriter();
        int Exit = await AgentCli.RunAsync(Arguments.Concat(new[] { "--caller-instance", "main", "--caller-thread", CallerThread }).ToArray(), Input, Output, Error, Environment.ProcessPath!, CancellationToken.None, PipeName, () => Settings, Path.Combine(Root, "outbox"));
        if (Exit != 0) throw new InvalidOperationException("CLI exit=" + Exit + " " + Error);
        using var Result = JsonDocument.Parse(Output.ToArray());
        return Result.RootElement.Clone();
    }

    private static Task VerifyCatalogAsync(string Root)
    {
        var Instance = new InstanceProfile { HomePath = Path.Combine(Root, "catalog") };
        Directory.CreateDirectory(Instance.HomePath);
        using var Database = new SqliteConnection("Data Source=" + Path.Combine(Instance.HomePath, "state_5.sqlite"));
        Database.Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "CREATE TABLE threads(id TEXT,title TEXT,name TEXT,project_id TEXT,cwd TEXT,archived INTEGER,updated_at INTEGER); INSERT INTO threads VALUES('a','old','同名',NULL,$path,0,1),('b','old','同名','project',$other,0,2),('c','old','同名','other',$path,0,3),('d','old','同名',NULL,$path,1,4)";
        Command.Parameters.AddWithValue("$path", @"\\?\C:\project");
        Command.Parameters.AddWithValue("$other", @"C:\project-worktree");
        Command.ExecuteNonQuery();
        var Catalog = new AgentCatalog();
        var Project = new AgentProject("project", "项目", @"C:\project", true);
        var Matches = Catalog.Sessions(Instance, Project, "同名", 0);
        Require(Matches.Select(Item => Item.Id).ToHashSet().SetEquals(new[] { "a", "b" }), "project lookup supports explicit membership and legacy canonical cwd without including archived or other project sessions");
        return Task.CompletedTask;
    }
    #endregion

    #region Fixtures
    private sealed class FakeBridge : IRelayBridge
    {
        public List<(string Thread, string Prompt)> SentList { get; } = new();
        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation)
        {
            SentList.Add((ThreadId, Prompt));
            return Task.CompletedTask;
        }
    }

    private sealed class FakeCatalog : IAgentCatalog
    {
        private readonly string Root;
        public bool Busy { get; set; }
        public bool Duplicate { get; set; }
        public int CreateCount { get; private set; }
        public bool FailCreate { get; set; }
        public FakeCatalog(string Root) => this.Root = Root;
        public Task<List<AgentProject>> ProjectsAsync(InstanceProfile Instance, CancellationToken Cancellation) => Task.FromResult(new List<AgentProject> { new("project", "项目 有空格", Root, true) });
        public AgentSession Session(InstanceProfile Instance, string Id) => new(Id, Id, "project", Root);
        public List<AgentSession> Sessions(InstanceProfile Instance, AgentProject Project, string? Selector, int Offset) => Duplicate ? new() { Session(Instance, "dup-a"), Session(Instance, "dup-b") } : new() { Session(Instance, Selector!) };
        public Task RequireIdleAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation) => Busy ? Task.FromException(new InvalidOperationException("fixture active")) : Task.CompletedTask;
        public Task<RelayThread> CreateAsync(InstanceProfile Instance, AgentProject Project, string Title, string Prompt, CancellationToken Cancellation)
        {
            CreateCount++;
            Require(Prompt.Contains("目的：提取资源") && Prompt.Contains("report --json-file"), "structured user requirements and callback CLI are preserved in new session prompt");
            if (FailCreate) throw new IOException("fixture uncertain creation");
            return Task.FromResult(new RelayThread("created-thread", Title, "active"));
        }
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED agents: " + Message);
        Count++;
    }

    private static async Task RejectAsync(Func<Task> Action, string Message)
    {
        try { await Action(); }
        catch (InvalidOperationException) { Count++; return; }
        throw new Exception("FAILED agents: " + Message);
    }
    #endregion
}
