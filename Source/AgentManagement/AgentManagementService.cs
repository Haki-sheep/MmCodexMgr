using System.Text.Json;

namespace CodexInstanceManager;

public sealed class AgentManagementService
{
    private readonly Func<ManagerSettings> LoadSettings;
    private readonly RelayStore Store;
    private readonly RelayCoordinator Coordinator;
    private readonly IAgentCatalog Catalog;
    private readonly string CliPath;

    public AgentManagementService(RelayStore Store, RelayCoordinator Coordinator, IAgentCatalog Catalog, string CliPath, Func<ManagerSettings>? LoadSettings = null)
    {
        this.Store = Store;
        this.Coordinator = Coordinator;
        this.Catalog = Catalog;
        this.CliPath = CliPath;
        this.LoadSettings = LoadSettings ?? SettingsStore.Load;
    }

    public async Task<object> ExecuteAsync(RelayRequest Request, CancellationToken Cancellation)
    {
        var Settings = LoadSettings();
        var Caller = ResolveInstance(Settings, Request.InstanceId);
        if (Request.Command == "agent_ping") return new { ready = true };
        if (Request.Command == "agent_doctor") return await AgentDoctor.RunAsync(Settings, CliPath, Request.Arguments.TryGetProperty("instance", out var DoctorInstance) ? DoctorInstance.GetString() : Caller.Id, Cancellation);
        Catalog.Session(Caller, Request.ThreadId);
        var Arguments = Request.Arguments;
        switch (Request.Command)
        {
            case "agent_instances":
                return Settings.InstanceList.Select((Item, Index) => new { number = Index + 1, id = Item.Id, name = Item.Name, home = Item.HomePath }).ToArray();
            case "agent_projects":
                return await Catalog.ProjectsAsync(ResolveInstance(Settings, Text(Arguments, "instance")), Cancellation);
            case "agent_sessions":
            {
                var Target = ResolveInstance(Settings, Text(Arguments, "instance"));
                var Project = await ResolveProjectAsync(Target, Text(Arguments, "project"), Cancellation);
                return Catalog.Sessions(Target, Project, OptionalText(Arguments, "session"), Number(Arguments, "offset", 0));
            }
            case "agent_start": return await StartAsync(Settings, Caller, Request.ThreadId, Arguments, Cancellation);
            case "agent_task":
            case "agent_cancel":
            case "agent_tree":
            case "agent_retry_return":
            case "agent_reconcile":
            {
                var Item = Store.Get(Text(Arguments, "task_id"));
                bool Main = Item.Channel.MainInstance.Id == Caller.Id && Item.Channel.MainThreadId == Request.ThreadId;
                bool Worker = Item.Channel.WorkerInstance.Id == Caller.Id && Item.Channel.WorkerThreadId == Request.ThreadId;
                if (!Main && !Worker || Request.Command is "agent_cancel" or "agent_retry_return" or "agent_reconcile" && !Main) throw new InvalidOperationException("当前会话无权操作该任务");
                if (Request.Command == "agent_cancel") await Coordinator.CancelAsync(Item.Id);
                if (Request.Command == "agent_tree") return Store.TreePage(Item.Id, Number(Arguments, "offset", 0)).Select(Entry => new { task_id = Entry.Id, parent_task_id = Entry.ParentTaskId, title = Entry.Title, state = RelayLimits.StateText(Entry.State), children = Entry.ChildCount, main_instance = Entry.MainName, worker_instance = Entry.WorkerName, progress_at = Entry.ProgressAt }).ToArray();
                if (Request.Command is "agent_retry_return" or "agent_reconcile")
                {
                    if (!Arguments.TryGetProperty("confirmed", out var Confirmation) || !Confirmation.GetBoolean()) throw new InvalidOperationException("请先核对目标会话 再提供 confirmed=true");
                    if (Request.Command == "agent_retry_return") await Coordinator.RetryReturnAsync(Item.Id);
                    else
                    {
                        var Session = Catalog.Session(Item.Channel.WorkerInstance, Text(Arguments, "session_id"));
                        if (Item.Channel.ProjectId.Length != 0)
                        {
                            var Project = await ResolveProjectAsync(Item.Channel.WorkerInstance, Item.Channel.ProjectId, Cancellation);
                            if (Session.ProjectId.Length != 0 ? Session.ProjectId != Project.Id : AgentCatalog.NormalizePath(Session.Cwd) != AgentCatalog.NormalizePath(Project.Path)) throw new InvalidOperationException("核对的会话不属于原目标项目");
                        }
                        else if (Item.Channel.WorkerThreadId.Length == 0) throw new InvalidOperationException("历史任务缺少原目标项目 无法确认创建结果");
                        await Coordinator.ReconcileAsync(Caller.Id, Request.ThreadId, Item.Id, Session.Id, Session.Title);
                    }
                }
                return Describe(Store.Get(Item.Id));
            }
            default: throw new InvalidOperationException("未知跨Agent命令 " + Request.Command);
        }
    }

    private async Task<object> StartAsync(ManagerSettings Settings, InstanceProfile Caller, string ThreadId, JsonElement Arguments, CancellationToken Cancellation)
    {
        string Key = Caller.Id + "/" + ThreadId + "/" + Text(Arguments, "request_id");
        var Existing = Store.FindRequest(Key);
        var Workspace = ReadWorkspace(Arguments);
        if (Existing is null && Workspace is null) throw new InvalidOperationException("新任务必须声明 workspace.access 只读任务填 read_only 写入任务同时提供 write_paths");
        var Target = ResolveInstance(Settings, Text(Arguments, "instance"));
        var Project = await ResolveProjectAsync(Target, Text(Arguments, "project"), Cancellation);
        string? CreateTitle = OptionalText(Arguments, "create_title");
        string? SessionSelector = OptionalText(Arguments, "session");
        if ((CreateTitle is null) == (SessionSelector is null)) throw new InvalidOperationException("session 与 create_title 必须且只能提供一个");
        if (CreateTitle?.Length > 120) throw new InvalidOperationException("create_title 最多 120 字符");
        var Main = Catalog.Session(Caller, ThreadId);
        AgentSession? Worker = SessionSelector is null ? null : Unique(Catalog.Sessions(Target, Project, SessionSelector, 0), "会话", Item => Item.Id, Item => Item.Title);
        if (Existing is null && Worker is not null) await Catalog.RequireIdleAsync(Target, Worker.Id, Cancellation);
        var Route = new RelayChannel
        {
            MainInstance = Caller, MainThreadId = ThreadId, MainTitle = Main.Title,
            WorkerInstance = Target, WorkerThreadId = Worker?.Id ?? "", WorkerTitle = Worker?.Title ?? CreateTitle!,
            ProjectId = Project.Id, CreateTitle = CreateTitle ?? "", CallbackCliPath = CliPath,
            TimeoutMinutes = Number(Arguments, "timeout_minutes", 60)
        };
        if (!File.Exists(CliPath)) throw new FileNotFoundException("回调 CLI 尚未部署", CliPath);
        var Item = await Coordinator.DispatchAsync(Caller.Id, ThreadId, Key, Text(Arguments, "title"), Text(Arguments, "instructions"), Text(Arguments, "acceptance"), Route,
            Number(Arguments, "session_max", 1), Number(Arguments, "subagent_max", 0),
            CreateTitle is null ? null : TaskItem => Catalog.CreateAsync(Target, Project, CreateTitle, RelayCoordinator.BuildWorkerPrompt(TaskItem), Cancellation),
            Number(Arguments, "cross_agent_max", 1), ReadWorkerLimits(Arguments), ReadTreeBudget(Arguments), Workspace);
        string Instruction = Item.State switch
        {
            eRelayState.Running => "结束当前回合 等待执行会话主动回传 不要轮询",
            eRelayState.DispatchUncertain or eRelayState.ReturnUncertain => "投递状态待核对 请查看任务记录与目标对话 不得自动重复创建或发送",
            _ => "按已保存的任务状态继续处理 不得重新执行已完成或终止的任务"
        };
        return new { task_id = Item.Id, state = RelayLimits.StateText(Item.State), instance_id = Target.Id, project_id = Project.Id, thread_id = Item.Channel.WorkerThreadId, session_max = Item.SessionMax, subagent_max = Item.SubagentMax, cross_agent_max = Item.CrossAgentMax, worker_limits = Item.WorkerLimits, tree_budget = Item.TreeBudget, tree_depth = Item.TreeDepth, workspace = Item.Workspace, instruction = Instruction };
    }

    private static RelayTreeBudget? ReadTreeBudget(JsonElement Arguments) => Arguments.TryGetProperty("tree_session_max", out _) || Arguments.TryGetProperty("max_depth", out _) ? new() { MaxSessions = Number(Arguments, "tree_session_max", RelayLimits.DefaultTreeSessionMax), MaxDepth = Number(Arguments, "max_depth", RelayLimits.DefaultTreeMaxDepth) } : null;

    private static RelayWorkspace? ReadWorkspace(JsonElement Arguments)
    {
        if (!Arguments.TryGetProperty("workspace", out var Value)) return null;
        foreach (var Property in Value.EnumerateObject())
            if (Property.Name is not ("access" or "write_paths")) throw new InvalidOperationException("未知工作区参数 " + Property.Name);
        return new() { Access = Text(Value, "access"), WritePathList = Value.TryGetProperty("write_paths", out var Paths) ? Paths.EnumerateArray().Select(PathValue => PathValue.GetString()!).ToList() : new() };
    }

    private static RelayAgentLimits? ReadWorkerLimits(JsonElement Arguments)
    {
        if (!Arguments.TryGetProperty("worker_limits", out var Limits)) return null;
        foreach (var Property in Limits.EnumerateObject())
            if (Property.Name is not ("subagent_max" or "session_max" or "cross_agent_max")) throw new InvalidOperationException("未知下级预算 " + Property.Name);
        return new() { SubagentMax = Number(Limits, "subagent_max", Number(Arguments, "subagent_max", 0)), SessionMax = Number(Limits, "session_max", Number(Arguments, "session_max", 1)), CrossAgentMax = Number(Limits, "cross_agent_max", Number(Arguments, "cross_agent_max", 1)) };
    }

    private static object Describe(RelayTask Item) => new
    {
        task_id = Item.Id, parent_task_id = Item.ParentTaskId, title = Item.Title,
        state = RelayLimits.StateText(Item.State), display_state = RelayLimits.ProgressStateText(Item.State, Item.Outcome, Item.ProgressStage),
        outcome = Item.Outcome, summary = Item.Result, artifacts = Item.ArtifactList,
        main = new { instance_id = Item.Channel.MainInstance.Id, thread_id = Item.Channel.MainThreadId },
        worker = new { instance_id = Item.Channel.WorkerInstance.Id, thread_id = Item.Channel.WorkerThreadId, project_id = Item.Channel.ProjectId, create_title = Item.Channel.CreateTitle },
        worker_limits = Item.WorkerLimits,
        tree_budget = Item.TreeBudget, tree_root_id = Item.TreeRootId, tree_depth = Item.TreeDepth,
        workspace = new { access = Item.Workspace.Access, write_path_count = Item.Workspace.WritePathList.Count },
        progress_stage = Item.ProgressStage, progress = Item.ProgressMessage, progress_at = Item.ProgressAt,
        recent_event_excerpts = Item.EventList.TakeLast(2).Select(Text => Text.Length > 512 ? Text[..512] + "…" : Text).ToArray()
    };

    public static InstanceProfile ResolveInstance(ManagerSettings Settings, string Selector)
    {
        string NumberText = Selector.StartsWith("实例", StringComparison.Ordinal) ? Selector[2..] : Selector;
        var MatchList = Settings.InstanceList.Where((Item, Index) => Item.Id == Selector || Item.Name == Selector || (Index + 1).ToString() == NumberText).Distinct().ToList();
        return Unique(MatchList, "实例", Item => Item.Id, Item => Item.Name);
    }

    private async Task<AgentProject> ResolveProjectAsync(InstanceProfile Instance, string Selector, CancellationToken Cancellation)
    {
        var ProjectList = await Catalog.ProjectsAsync(Instance, Cancellation);
        return Unique(ProjectList.Where(Item => Item.Id == Selector || Item.Name == Selector || Path.IsPathFullyQualified(Selector) && AgentCatalog.NormalizePath(Item.Path) == AgentCatalog.NormalizePath(Selector)).ToList(), "项目", Item => Item.Id, Item => Item.Name);
    }

    private static T Unique<T>(List<T> MatchList, string Kind, Func<T, string> Id, Func<T, string> Name)
    {
        if (MatchList.Count == 1) return MatchList[0];
        throw new InvalidOperationException(MatchList.Count == 0 ? Kind + "未找到 请先列出该范围内的候选" : Kind + "重名 请指定准确 ID " + string.Join(" | ", MatchList.Select(Item => Id(Item) + " " + Name(Item))));
    }

    private static string Text(JsonElement Arguments, string Name) => OptionalText(Arguments, Name) ?? throw new InvalidOperationException("缺少参数 " + Name);
    private static string? OptionalText(JsonElement Arguments, string Name) => Arguments.TryGetProperty(Name, out var Value) && Value.ValueKind != JsonValueKind.Null ? !string.IsNullOrWhiteSpace(Value.GetString()) ? Value.GetString() : throw new InvalidOperationException("参数不能为空 " + Name) : null;
    private static int Number(JsonElement Arguments, string Name, int Default) => Arguments.TryGetProperty(Name, out var Value) ? Value.GetInt32() : Default;
}
