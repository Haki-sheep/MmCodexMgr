using System.Runtime.InteropServices;
using System.Text.Json.Nodes;
using CodexInstanceManager;
using Tomlyn;
using Tomlyn.Model;

internal static class Tests
{
    private static int Count;
    private static readonly string Root = Path.Combine(Path.GetTempPath(), "CodexManagerTests-" + Guid.NewGuid().ToString("N"));

    [STAThread]
    private static int Main(string[] ArgumentList)
    {
        if (ArgumentList.Contains("--responses-compat-disconnect")) { System.Threading.Tasks.Task.Run(ResponsesCompatDisconnectTests.RunAsync).GetAwaiter().GetResult(); return 0; }
        if (ArgumentList.Length == 2 && ArgumentList[0] == "--responses-compat-supervisor") { System.Threading.Tasks.Task.Run(() => ResponsesCompatDisconnectTests.RunSupervisorAsync(ArgumentList[1])).GetAwaiter().GetResult(); return 0; }
        if (ArgumentList.Contains("--responses-compat")) return ResponsesCompatTests.Run();
        if (ArgumentList.Length == 2 && ArgumentList[0] == "--responses-compat-install") return ResponsesCompatTests.VerifyInstallation(ArgumentList[1]);
        if (ArgumentList.Contains("--memory-probe")) return MemoryTests.Run();
        if (ArgumentList.Contains("--relay-live")) return RelayTests.LiveProbe();
        if (ArgumentList.Contains("--agents-live")) return AgentManagementTests.LiveProbe();
        if (ArgumentList.Contains("--agents")) { AgentManagementTests.Run(); return 0; }
        if (ArgumentList.Contains("--collaboration")) { CollaborationTests.Run(); return 0; }
        if (ArgumentList.Contains("--events-live")) return CollaborationTests.EventProbe();
        if (ArgumentList.Contains("--instance-ui")) return InstancePageUiTests.Run();
        if (ArgumentList.Length == 2 && ArgumentList[0] == "--collaboration-render") return CollaborationTests.Render(ArgumentList[1], true);
        if (ArgumentList.Length == 2 && ArgumentList[0] == "--collaboration-render-light") return CollaborationTests.Render(ArgumentList[1], false);
        if (ArgumentList.Length == 2 && ArgumentList[0] == "--relay-render") return RelayTests.Render(ArgumentList[1]);
        if (ArgumentList.Length == 2 && ArgumentList[0] == "--relay-render-light") return RelayTests.Render(ArgumentList[1], false);
        if (ArgumentList.Contains("--relay")) { RelayTests.Run(); return 0; }
        if (ArgumentList.Contains("--conversation-import")) return ConversationImportTests.Run();
        if (ArgumentList.Contains("--project-sync")) return ProjectSyncTests.Run();
        if (ArgumentList.Contains("--conversation-cleanup")) return ConversationCleanupTests.Run();
        if (ArgumentList.Contains("--cleanup-ui")) return ConversationCleanupUiTests.Run();
        if (ArgumentList.Contains("--restore-second")) return WindowTests.RestoreSecond();
        if (ArgumentList.Contains("--live-icons"))
        {
            var Instances = InstanceService.ListRunning().Where(Item => Item.Window != IntPtr.Zero).ToList();
            var IconList = Instances.Select(Item => SendMessage(Item.Window, 0x007F, IntPtr.Zero, IntPtr.Zero)).ToList();
            Check(IconList.Count >= 2 && IconList.All(Icon => Icon != IntPtr.Zero), "live Codex windows have icons");
            Check(IconList.Distinct().Count() == IconList.Count, "live Codex windows use distinct icons");
            Console.WriteLine("PASS live window icons: " + string.Join(", ", Instances.Select((Item, Index) => Item.ProcessId + "=" + IconList[Index])));
            return 0;
        }
        Directory.CreateDirectory(Root);
        try
        {
            TestConfig(); TestCopy(); TestSyncIsolation(); TestRollback();
            if (ArgumentList.Contains("--config-sync"))
            {
                Console.WriteLine("PASS config sync " + Count + " assertions; fixture=" + Root);
                return 0;
            }
            TestCc(); TestDetection(); WindowTests.Run(); TestBranding(); RelayTests.Run(); AgentManagementTests.Run(); CollaborationTests.Run();
            Console.WriteLine("PASS " + Count + " assertions; fixture=" + Root);
            return 0;
        }
        catch (Exception Error) { Console.Error.WriteLine(Error); return 1; }
    }
    private static void Check(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED: " + Message);
        Count++;
    }
    private static void TestConfig()
    {
        string Source = "model='source-model'\n[model_providers.source]\nexperimental_bearer_token='SOURCE_SECRET'\n[mcp_servers.shared]\nurl='https://new.example/mcp'\n[mcp_servers.new]\ncommand='npx'\n[skills]\nconfig=[{path='C:/source/skills/a/SKILL.md',enabled=false}]\n";
        string Target = "# Keep this comment\nmodel='target-model'\n[model_providers.private]\nexperimental_bearer_token='TARGET_SECRET'\ntext=\"\"\"\n[mcp_servers.fake]\n\"\"\"\n[mcp_servers.shared]\ncommand='old'\n[mcp_servers.own]\ncommand='own'\n";
        string Result = ConfigSync.MergeConfig(Source, Target, new HashSet<string> { "mcp_servers", "skills" }, "C:/source", "C:/target");
        var Model = Toml.ToModel(Result);
        Check((string)Model["model"] == "target-model", "model preserved");
        Check(!Result.Contains("SOURCE_SECRET"), "source model token excluded");
        Check(Result.Contains("experimental_bearer_token='TARGET_SECRET'"), "target provider text unchanged");
        Check(Result.Contains("# Keep this comment"), "unrelated comments preserved");
        var Mcp = (TomlTable)Model["mcp_servers"];
        Check(Mcp.ContainsKey("own") && Mcp.ContainsKey("new"), "merge target-only server");
        Check(!((TomlTable)Mcp["shared"]).ContainsKey("command"), "replace old server definition completely");
        Check(!Mcp.ContainsKey("fake"), "multiline TOML text is not a section");
        Check(Result.Contains("C:/target/skills/a/SKILL.md"), "skill path remapping");
        string Repeated = ConfigSync.MergeConfig(Source, Result, new HashSet<string> { "mcp_servers", "skills" }, "C:/source", "C:/target");
        Check(Repeated == Result, "sync is idempotent");
        string Quoted = ConfigSync.MergeConfig("['mcp_servers'.'a.b']\ncommand='x'\n", "model='y'\n", new() { "mcp_servers" }, "C:/s", "C:/t");
        Check(((TomlTable)Toml.ToModel(Quoted)["mcp_servers"]).ContainsKey("a.b"), "quoted table keys");
        string Inline = ConfigSync.MergeConfig("mcp_servers={new={command='x'}}\n", "mcp_servers={old={command='z'}}\nmodel='m'\n", new() { "mcp_servers" }, "C:/s", "C:/t");
        Check(((TomlTable)Toml.ToModel(Inline)["mcp_servers"]).Count == 2, "inline table merge");
        string NoNewLine = ConfigSync.MergeConfig("[mcp_servers.x]\ncommand='x'", "model='m'", new() { "mcp_servers" }, "C:/s", "C:/t");
        Check((string)Toml.ToModel(NoNewLine)["model"] == "m", "missing final newline handled");
    }
    private static void TestCopy()
    {
        string Source = Path.Combine(Root, "source"); string Target = Path.Combine(Root, "target");
        Directory.CreateDirectory(Path.Combine(Source, "skills", "mine"));
        Directory.CreateDirectory(Path.Combine(Source, "skills", ".system")); Directory.CreateDirectory(Target);
        File.WriteAllText(Path.Combine(Source, "skills", "mine", "SKILL.md"), "my skill");
        File.WriteAllText(Path.Combine(Source, "skills", ".system", "SKILL.md"), "do not copy");
        File.WriteAllText(Path.Combine(Source, "auth.json"), "source auth");
        File.WriteAllText(Path.Combine(Target, "auth.json"), "target auth");
        File.WriteAllText(Path.Combine(Source, "config.toml"), "model='source'\n[mcp_servers.new]\ncommand='npx'\n");
        File.WriteAllText(Path.Combine(Target, "config.toml"), "model='target'\n");
        var Plan = ConfigSync.Preview(new() { HomePath = Source }, new() { HomePath = Target }, new());
        Check(Plan.FileList.Count == 2, "only desired files planned");
        string Backup = ConfigSync.Apply(Plan, Path.Combine(Root, "backups"));
        Check(File.ReadAllText(Path.Combine(Target, "auth.json")) == "target auth", "auth bytes preserved");
        Check(File.ReadAllText(Path.Combine(Target, "skills", "mine", "SKILL.md")) == "my skill", "skill copied");
        Check(!Directory.Exists(Path.Combine(Target, "skills", ".system")), "built-in system skills skipped");
        Check(File.ReadAllText(Path.Combine(Backup, "config.toml")) == "model='target'\n", "original config backed up");
        File.WriteAllText(Path.Combine(Source, "config.toml"), "model='source'\n[mcp_servers.changed]\ncommand='x'\n");
        var StalePlan = ConfigSync.Preview(new() { HomePath = Source }, new() { HomePath = Target }, new());
        File.WriteAllText(Path.Combine(Target, "config.toml"), "model='changed'\n");
        bool StaleThrew = false; try { ConfigSync.Apply(StalePlan, Path.Combine(Root, "backups")); } catch (IOException) { StaleThrew = true; }
        Check(StaleThrew, "stale plan rejected");
        bool OverlapRejected = false; try { ConfigSync.Preview(new() { HomePath = Source }, new() { HomePath = Path.Combine(Source, "child") }, new()); } catch (InvalidOperationException) { OverlapRejected = true; }
        Check(OverlapRejected, "overlapping directories rejected");
    }
    private static void TestSyncIsolation()
    {
        string Source = Path.Combine(Root, "scope-source");
        string Target = Path.Combine(Root, "scope-target");
        var ToolFileList = new[] { "skills/mine/SKILL.md", "AGENTS.md", "rules/default.rules", "plugins/cache/fixture/plugin.json" };
        var ProtectedFileList = new[] { "auth.json", "sessions/fixture.jsonl", "archived_sessions/fixture.jsonl", "history.jsonl", "session_index.jsonl", "state_5.sqlite", "thread_history_1.sqlite", "sqlite/codex-dev.db", ".codex-global-state.json" };
        foreach (string Relative in ToolFileList)
        {
            string FilePath = Path.Combine(Source, Relative);
            Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);
            File.WriteAllText(FilePath, "source tool " + Relative);
        }
        foreach (string Relative in ProtectedFileList)
        {
            foreach (string Home in new[] { Source, Target })
            {
                string FilePath = Path.Combine(Home, Relative);
                Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);
                File.WriteAllText(FilePath, Home + " protected " + Relative);
            }
        }
        File.WriteAllText(Path.Combine(Source, "sessions", "source-only.jsonl"), "source conversation");
        File.WriteAllText(Path.Combine(Source, "config.toml"), "model='source-model'\n[mcp_servers.fixture]\ncommand='fixture'\n[projects.'C:/source-project']\ntrust_level='trusted'\n");
        File.WriteAllText(Path.Combine(Target, "config.toml"), "model='target-model'\n[projects.'C:/target-project']\ntrust_level='untrusted'\n");
        var SourceHashDict = ProtectedFileList.ToDictionary(Relative => Relative, Relative => SettingsStore.FileHash(Path.Combine(Source, Relative)));
        var TargetHashDict = ProtectedFileList.ToDictionary(Relative => Relative, Relative => SettingsStore.FileHash(Path.Combine(Target, Relative)));
        var Plan = ConfigSync.Preview(new() { HomePath = Source }, new() { HomePath = Target }, new() { Skills = true, Mcp = true, Instructions = true, Plugins = true });
        var PlannedRelativeHashList = Plan.FileList.Select(File => Path.GetRelativePath(Target, File.Destination).Replace('\\', '/')).ToHashSet();
        Check(PlannedRelativeHashList.SetEquals(ToolFileList.Append("config.toml")), "all sync options preview only selected tools and configuration");
        Check(ProtectedFileList.All(Relative => SettingsStore.FileHash(Path.Combine(Target, Relative)) == TargetHashDict[Relative]), "sync preview leaves destination conversation and project data unchanged");
        ConfigSync.Apply(Plan, Path.Combine(Root, "scope-backups"));
        Check(ToolFileList.All(Relative => File.ReadAllText(Path.Combine(Target, Relative)) == "source tool " + Relative), "all selected tool categories synchronize successfully");
        Check(ProtectedFileList.All(Relative => SettingsStore.FileHash(Path.Combine(Target, Relative)) == TargetHashDict[Relative]), "sync execution preserves destination auth conversation databases history and sidebar state byte for byte");
        Check(ProtectedFileList.All(Relative => SettingsStore.FileHash(Path.Combine(Source, Relative)) == SourceHashDict[Relative]), "sync leaves source conversation and project data unchanged");
        Check(!File.Exists(Path.Combine(Target, "sessions", "source-only.jsonl")), "source-only conversations are not imported by configuration sync");
        var Config = Toml.ToModel(File.ReadAllText(Path.Combine(Target, "config.toml")));
        Check((string)Config["model"] == "target-model" && ((TomlTable)Config["projects"]).Keys.SequenceEqual(new[] { "C:/target-project" }), "configuration sync preserves destination model and project registration");
    }

    private static void TestRollback()
    {
        string Target = Path.Combine(Root, "rollback"); Directory.CreateDirectory(Target);
        string Existing = Path.Combine(Target, "existing.txt"); File.WriteAllText(Existing, "before");
        var Plan = new SyncPlan { DestinationRoot = Target };
        Plan.FileList.Add(new(Existing, null, System.Text.Encoding.UTF8.GetBytes("after"), SettingsStore.FileHash(Existing)));
        Plan.FileList.Add(new(Path.Combine(Target, "broken.txt"), Path.Combine(Root, "missing-source"), null, null));
        bool Threw = false; try { ConfigSync.Apply(Plan, Path.Combine(Root, "backups")); } catch (IOException) { Threw = true; }
        Check(Threw && File.ReadAllText(Existing) == "before", "mid-operation failure rolled back");
        Check(!File.Exists(Path.Combine(Target, "broken.txt")), "failed new file absent");
    }
    private static void TestCc()
    {
        string FilePath = Path.Combine(Root, "cc.json"); File.WriteAllText(FilePath, "{\"currentProviderCodex\":\"mine\",\"flag\":true}");
        string Backup = InstanceService.WriteCcTarget(Path.Combine(Root, "second"), FilePath, Path.Combine(Root, "cc-backups"));
        var Result = JsonNode.Parse(File.ReadAllText(FilePath))!;
        Check(Result["currentProviderCodex"]!.GetValue<string>() == "mine", "CC provider preserved");
        Check(Result["flag"]!.GetValue<bool>(), "CC other fields preserved");
        Check(ManagerPaths.Same(InstanceService.ReadCcTarget(FilePath), Path.Combine(Root, "second")), "CC target updated");
        Check(!File.ReadAllText(Backup).Contains("codexConfigDir"), "CC backup contains exact original");
    }
    private static void TestDetection()
    {
        var Secondary = new InstanceProfile { DataPath = @"C:\some path\data" };
        var List = new List<RunningInstance> { new(10, "\"C:\\ChatGPT.exe\"", IntPtr.Zero), new(11, "\"C:\\ChatGPT.exe\" --user-data-dir=\"C:\\some path\\data\"", IntPtr.Zero) };
        Check(InstanceService.Find(new() { IsPrimary = true }, List)!.ProcessId == 10, "primary process selected");
        Check(InstanceService.Find(Secondary, List)!.ProcessId == 11, "secondary process selected with spaced path");
    }
    private static void TestBranding()
    {
        using var Form = new Form { ShowInTaskbar = false };
        IntPtr Handle = Form.Handle;
        IntPtr Before = SendMessage(Handle, 0x007F, IntPtr.Zero, IntPtr.Zero);
        using (var Service = new BrandingService())
        {
            Service.Apply(new() { Id = "test-only", Badge = "T" }, Handle);
            Check(SendMessage(Handle, 0x007F, IntPtr.Zero, IntPtr.Zero) != IntPtr.Zero, "window icon applied");
        }
        Check(SendMessage(Handle, 0x007F, IntPtr.Zero, IntPtr.Zero) == Before, "window icon restored");
    }
    [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr Window, uint Message, IntPtr WParam, IntPtr LParam);
}
