using System.Text.Json.Nodes;
using CodexInstanceManager;
using Microsoft.Data.Sqlite;

internal static class ProjectSyncTests
{
    private static int Count;

    #region Cases
    public static int Run()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexProjectSyncTests-" + Guid.NewGuid().ToString("N"));
        try
        {
            var Source = new InstanceProfile { Id = "source", HomePath = Path.Combine(Root, "source") };
            var Target = new InstanceProfile { Id = "target", HomePath = Path.Combine(Root, "target") };
            CreateHome(Source.HomePath);
            CreateHome(Target.HomePath);
            Seed(Source.HomePath, Target.HomePath, Root);
            string SourceDatabase = SettingsStore.FileHash(Path.Combine(Source.HomePath, "state_5.sqlite"))!;
            string SourceSidebar = File.ReadAllText(Path.Combine(Source.HomePath, ".codex-global-state.json"));
            string TargetDatabase = SettingsStore.FileHash(Path.Combine(Target.HomePath, "state_5.sqlite"))!;
            var OriginalState = ReadState(Target.HomePath);
            var ProtectedDict = new[] { "auth.json", "config.toml", "thread_history_1.sqlite", "sqlite/codex-dev.db", "sessions/target.jsonl", "archived_sessions/target.jsonl", "history.jsonl", "session_index.jsonl" }
                .ToDictionary(Relative => Relative, Relative => SettingsStore.FileHash(Path.Combine(Target.HomePath, Relative)));
            RequireThrows(() => { using var Plan = ProjectSyncService.Preview(Source, Source); }, "same instance rejected");
            RequireThrows(() => { using var Plan = ProjectSyncService.Preview(Source, new() { HomePath = Target.HomePath, IsPrimary = true }); }, "primary destination rejected");
            using (var Lock = new FileStream(Path.Combine(Target.HomePath, ".sqlite-maintenance.lock"), FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.ReadWrite))
            {
                Lock.Lock(0, 1);
                RequireThrows(() => { using var Plan = ProjectSyncService.Preview(Source, Target); }, "database owner blocks synchronization");
            }
            using (var Plan = ProjectSyncService.Preview(Source, Target))
            {
                Require(Plan.ProjectsOnly && Plan.ConversationList.Count == 0, "project plan never enumerates conversations");
                Require(Plan.ProjectCount == 2 && Plan.ExistingProjectCount == 1, "directory duplicates reuse target identity and legacy-only projects are included");
                Require(Plan.FileList.Select(Item => Item.RelativePath).ToHashSet().SetEquals(new[] { "state_5.sqlite", "state_5.sqlite-wal", "state_5.sqlite-shm", ".codex-global-state.json" }), "only project storage is scheduled");
                Require(SettingsStore.FileHash(Path.Combine(Target.HomePath, "state_5.sqlite")) == TargetDatabase, "preview leaves target database unchanged");
                string Backup = ProjectSyncService.Apply(Plan, Path.Combine(Root, "backups"));
                Require(Path.GetFileName(Backup).StartsWith("projects-", StringComparison.Ordinal), "project backup is identifiable");
                Require(SettingsStore.FileHash(Path.Combine(Backup, "state_5.sqlite")) == TargetDatabase, "backup contains original database");
                Require(JsonNode.DeepEquals(ReadState(Backup), OriginalState), "backup contains original sidebar state");
            }
            Require(Scalar(Target.HomePath, "SELECT COUNT(*) FROM projects") == 4, "new projects appended while target-only projects remain");
            Require(Scalar(Target.HomePath, "SELECT COUNT(*) FROM projects WHERE id='source-shared'") == 0, "matching roots do not create a duplicate project");
            Require(Scalar(Target.HomePath, "SELECT COUNT(*) FROM project_roots WHERE project_id='legacy-new'") == 1, "legacy project receives database roots");
            Require(Scalar(Target.HomePath, "SELECT COUNT(*) FROM threads") == 1, "no source threads copied");
            Require(Scalar(Target.HomePath, "SELECT COUNT(*) FROM threads WHERE id='target-thread' AND title='目标会话' AND project_id='target-shared'") == 1, "existing thread data and membership preserved");
            var Result = ReadState(Target.HomePath);
            foreach (var Pair in OriginalState.Where(Pair => Pair.Key is not ("local-projects" or "project-order" or "project-appearances" or "app-server-project-id-by-legacy-project-id-by-host" or "app-server-projects-migration-by-host")))
                Require(JsonNode.DeepEquals(Result[Pair.Key], Pair.Value), "target setting preserved: " + Pair.Key);
            Require(!Result.ContainsKey("pinned-thread-ids"), "source pins are not copied");
            Require(Result["project-order"]!.AsArray().Select(Value => Value!.GetValue<string>()).SequenceEqual(new[] { "target-own", "target-shared", "source-new", "legacy-new" }), "target project order preserved and source additions follow source order");
            Require(Result["project-appearances"]!["source-new"]!["color"]!.GetValue<string>() == "blue", "project appearance copied");
            var Migration = Result["app-server-projects-migration-by-host"]!.AsObject().Single().Value!;
            Require(Migration["threadAssignmentsMigrated"] is null, "project synchronization never claims thread assignments were migrated");
            foreach (var Pair in ProtectedDict)
                Require(SettingsStore.FileHash(Path.Combine(Target.HomePath, Pair.Key)) == Pair.Value, "unrelated file bytes preserved: " + Pair.Key);
            Require(!File.Exists(Path.Combine(Target.HomePath, "sessions", "source.jsonl")), "source rollout is not copied");
            Require(SettingsStore.FileHash(Path.Combine(Source.HomePath, "state_5.sqlite")) == SourceDatabase && File.ReadAllText(Path.Combine(Source.HomePath, ".codex-global-state.json")) == SourceSidebar, "source files unchanged");
            using (var Plan = ProjectSyncService.Preview(Source, Target))
                Require(Plan.ProjectCount == 0 && Plan.FileList.Count == 0 && Plan.ExistingProjectCount == 3, "repeated synchronization is a no-op");
            TestStaleAndRollback(Source, Target, Root);
            TestDatabaseProjects(Root);
            Console.WriteLine($"PASS project sync {Count} assertions; fixture={Root}");
            return 0;
        }
        catch (Exception Error) { Console.Error.WriteLine(Error); return 1; }
    }

    private static void TestStaleAndRollback(InstanceProfile Source, InstanceProfile Target, string Root)
    {
        var NewProject = Project("next", "后续工程", Path.Combine(Root, "next-workspace"));
        var SourceState = ReadState(Source.HomePath);
        SourceState["local-projects"]!["next"] = NewProject;
        SourceState["project-order"]!.AsArray().Add("next");
        File.WriteAllText(Path.Combine(Source.HomePath, ".codex-global-state.json"), SourceState.ToJsonString());
        string SidebarPath = Path.Combine(Target.HomePath, ".codex-global-state.json");
        string Original = File.ReadAllText(SidebarPath);
        string DatabaseHash = SettingsStore.FileHash(Path.Combine(Target.HomePath, "state_5.sqlite"))!;
        using (var Plan = ProjectSyncService.Preview(Source, Target))
        {
            File.WriteAllText(SidebarPath, Original + "\n");
            RequireThrows(() => ProjectSyncService.Apply(Plan, Path.Combine(Root, "backups")), "stale target rejected before writing");
            Require(SettingsStore.FileHash(Path.Combine(Target.HomePath, "state_5.sqlite")) == DatabaseHash, "stale plan leaves database intact");
        }
        File.WriteAllText(SidebarPath, Original);
        using (var Plan = ProjectSyncService.Preview(Source, Target))
        {
            int Index = Plan.FileList.FindIndex(Item => Item.RelativePath == ".codex-global-state.json");
            Plan.FileList[Index] = Plan.FileList[Index] with { PreparedPath = Path.Combine(Plan.StageRoot, "missing.json") };
            RequireThrows(() => ProjectSyncService.Apply(Plan, Path.Combine(Root, "backups")), "write failure is surfaced");
            Require(SettingsStore.FileHash(Path.Combine(Target.HomePath, "state_5.sqlite")) == DatabaseHash && File.ReadAllText(SidebarPath) == Original, "failed write rolls back database and sidebar");
        }
    }

    private static void TestDatabaseProjects(string Root)
    {
        var Source = new InstanceProfile { Id = "database-source", HomePath = Path.Combine(Root, "database-source") };
        var Target = new InstanceProfile { Id = "database-target", HomePath = Path.Combine(Root, "database-target") };
        CreateHome(Source.HomePath);
        CreateHome(Target.HomePath);
        using (var Database = Open(Source.HomePath))
        {
            using var Command = Database.CreateCommand();
            Command.CommandText = "INSERT INTO projects VALUES('database-project','数据库工程','{}',0,0,0); INSERT INTO project_roots VALUES('database-project',0,'C:/database-workspace');";
            Command.ExecuteNonQuery();
        }
        using var Plan = ProjectSyncService.Preview(Source, Target);
        Require(Plan.ProjectCount == 1, "database-backed projects work without legacy sidebar entries");
        ProjectSyncService.Apply(Plan, Path.Combine(Root, "backups"));
        Require(Scalar(Target.HomePath, "SELECT COUNT(*) FROM projects") == 1 && Scalar(Target.HomePath, "SELECT COUNT(*) FROM threads") == 0, "database-only project synchronization imports no sessions");
    }
    #endregion

    #region Fixtures
    private static void CreateHome(string Home)
    {
        Directory.CreateDirectory(Home);
        using (var Database = Open(Home))
        {
            using var Command = Database.CreateCommand();
            Command.CommandText = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", "StateSchema.sql"));
            Command.ExecuteNonQuery();
        }
        File.WriteAllText(Path.Combine(Home, ".codex-global-state.json"), "{}");
        foreach (string Relative in new[] { "auth.json", "config.toml", "thread_history_1.sqlite", "sqlite/codex-dev.db", "sessions/target.jsonl", "archived_sessions/target.jsonl", "history.jsonl", "session_index.jsonl" })
        {
            string FilePath = Path.Combine(Home, Relative);
            Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);
            File.WriteAllText(FilePath, "protected " + Relative);
        }
    }

    private static void Seed(string Source, string Target, string Root)
    {
        string Shared = Path.Combine(Root, "共同工程");
        foreach (var Entry in new[] { (Home: Source, Id: "source-shared", Title: "来源会话"), (Home: Target, Id: "target-shared", Title: "目标会话") })
        {
            using var Database = Open(Entry.Home);
            using var Command = Database.CreateCommand();
            Command.CommandText = "INSERT INTO projects VALUES($id,'共享工程','{}',0,0,0); INSERT INTO project_roots VALUES($id,0,$path); INSERT INTO threads(id,rollout_path,created_at,updated_at,source,model_provider,cwd,title,sandbox_policy,approval_mode,project_id) VALUES($thread,'missing.jsonl',0,0,'cli','openai',$path,$title,'{}','never',$id);";
            Command.Parameters.AddWithValue("$id", Entry.Id);
            Command.Parameters.AddWithValue("$path", Shared);
            Command.Parameters.AddWithValue("$thread", Entry.Home == Source ? "source-thread" : "target-thread");
            Command.Parameters.AddWithValue("$title", Entry.Title);
            Command.ExecuteNonQuery();
        }
        var SourceState = new JsonObject
        {
            ["local-projects"] = new JsonObject { ["source-shared"] = Project("source-shared", "来源名称", Shared.ToUpperInvariant()), ["source-new"] = Project("source-new", "新增工程", Path.Combine(Root, "新增工程")), ["legacy-new"] = Project("legacy-new", "旧版工程", Path.Combine(Root, "旧版工程")) },
            ["project-order"] = new JsonArray("source-shared", "source-new", "legacy-new"),
            ["project-appearances"] = new JsonObject { ["source-new"] = new JsonObject { ["color"] = "blue" } },
            ["pinned-thread-ids"] = new JsonArray("source-thread"),
            ["thread-project-assignments"] = new JsonObject { ["source-thread"] = new JsonObject { ["projectKind"] = "local", ["projectId"] = "source-new" } }
        };
        var TargetState = new JsonObject
        {
            ["local-projects"] = new JsonObject { ["target-shared"] = Project("target-shared", "保留名称", Shared), ["target-own"] = Project("target-own", "已有工程", Path.Combine(Root, "目标工程")) },
            ["project-order"] = new JsonArray("target-own", "target-shared"),
            ["thread-project-assignments"] = new JsonObject { ["target-thread"] = new JsonObject { ["projectKind"] = "local", ["projectId"] = "target-shared" } },
            ["sidebar-project-thread-orders"] = new JsonObject { ["target-shared"] = new JsonArray("target-thread") },
            ["electron-persisted-atom-state"] = new JsonObject { ["enabled-reasoning-efforts"] = new JsonArray("low", "high", "max") },
            ["account-setting"] = "target-account"
        };
        using (var Database = Open(Target))
        {
            using var Command = Database.CreateCommand();
            Command.CommandText = "INSERT INTO projects VALUES('target-own','已有工程','{}',1,0,0); INSERT INTO project_roots VALUES('target-own',0,$path);";
            Command.Parameters.AddWithValue("$path", Path.Combine(Root, "目标工程"));
            Command.ExecuteNonQuery();
        }
        File.WriteAllText(Path.Combine(Source, ".codex-global-state.json"), SourceState.ToJsonString());
        File.WriteAllText(Path.Combine(Target, ".codex-global-state.json"), TargetState.ToJsonString());
        File.WriteAllText(Path.Combine(Source, "sessions", "source.jsonl"), "never copy this session");
    }

    private static JsonObject Project(string Id, string Name, string Root) => new() { ["id"] = Id, ["name"] = Name, ["rootPaths"] = new JsonArray(Root), ["createdAt"] = 0, ["updatedAt"] = 0 };
    private static JsonObject ReadState(string Home) => JsonNode.Parse(File.ReadAllText(Path.Combine(Home, ".codex-global-state.json")))!.AsObject();
    private static SqliteConnection Open(string Home) { var Database = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = Path.Combine(Home, "state_5.sqlite"), Pooling = false }.ToString()); Database.Open(); return Database; }
    private static long Scalar(string Home, string Sql) { using var Database = Open(Home); using var Command = Database.CreateCommand(); Command.CommandText = Sql; return Convert.ToInt64(Command.ExecuteScalar()); }
    private static void Require(bool Condition, string Message) { if (!Condition) throw new InvalidOperationException("FAILED: " + Message); Count++; }
    private static void RequireThrows(Action Action, string Message) { try { Action(); } catch (Exception Error) when (Error is IOException or InvalidOperationException) { Count++; return; } throw new InvalidOperationException("FAILED: " + Message); }
    #endregion
}
