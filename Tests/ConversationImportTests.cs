using System.Text.Json.Nodes;
using CodexInstanceManager;
using Microsoft.Data.Sqlite;

internal static class ConversationImportTests
{
    private static int Count;

    #region Cases
    public static int Run()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexConversationTests-" + Guid.NewGuid().ToString("N"));
        try
        {
            var Source = new InstanceProfile { HomePath = Path.Combine(Root, "source") };
            var Target = new InstanceProfile { HomePath = Path.Combine(Root, "target"), DataPath = Path.Combine(Root, "desktop") };
            CreateHome(Source.HomePath);
            CreateHome(Target.HomePath);
            Seed(Source.HomePath, Target.HomePath);
            string SourceConfig = SettingsStore.FileHash(Path.Combine(Source.HomePath, "config.toml"))!;
            string SourceState = SettingsStore.FileHash(Path.Combine(Source.HomePath, "state_5.sqlite"))!;
            string TargetState = SettingsStore.FileHash(Path.Combine(Target.HomePath, "state_5.sqlite"))!;
            string TargetConfig = SettingsStore.FileHash(Path.Combine(Target.HomePath, "config.toml"))!;
            string TargetAuth = SettingsStore.FileHash(Path.Combine(Target.HomePath, "auth.json"))!;
            RequireThrows(() => { using var Plan = ConversationImportService.Preview(Source, new() { HomePath = Target.HomePath, IsPrimary = true }); }, "primary destination rejected");
            RequireThrows(() => { using var Plan = ConversationImportService.Preview(Source, Source); }, "overlapping destination rejected");
            using (var Maintenance = new FileStream(Path.Combine(Target.HomePath, ".sqlite-maintenance.lock"), FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.ReadWrite))
            {
                Maintenance.Lock(0, 1);
                RequireThrows(() => { using var Plan = ConversationImportService.Preview(Source, Target); }, "target database owner blocks import");
            }
            string LockPath = Path.Combine(Source.HomePath, "thread-writer-locks", "active.lock");
            using var Lock = new FileStream(LockPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.ReadWrite);
            Lock.Lock(0, 1);
            using (var Plan = ConversationImportService.Preview(Source, Target))
            {
                Require(Plan.ConversationList.Count == 2, "new root and child planned");
                Require(Plan.TargetCount == 1, "original target count shown independently of duplicate IDs");
                Require(Plan.ExistingCount == 1, "duplicate ID preserved");
                Require(Plan.ProjectCount == 1, "same workspace project merged and new project planned");
                Require(Plan.SkippedList.Count == 2, "active thread and unsafe rollout skipped");
                Require(SettingsStore.FileHash(Path.Combine(Target.HomePath, "state_5.sqlite")) == TargetState, "preview does not write target");
                string Backup = ConversationImportService.Apply(Plan, Path.Combine(Root, "backups"));
                Require(File.Exists(Path.Combine(Backup, "manifest.json")), "backup manifest written");
                Require(Scalar(Backup, "state_5.sqlite", "SELECT COUNT(*) FROM threads") == 1, "backup contains original target database");
            }
            Require(Scalar(Target.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM threads") == 3, "target has existing and imported threads");
            Require(Text(Target.HomePath, "state_5.sqlite", "SELECT title FROM threads WHERE id='existing'") == "target title", "target title preserved");
            Require(Text(Target.HomePath, "state_5.sqlite", "SELECT model FROM threads WHERE id='root'") == "deepseek-test", "imported thread uses target model");
            Require(Text(Target.HomePath, "state_5.sqlite", "SELECT model_provider FROM threads WHERE id='root'") == "custom", "imported thread uses target provider");
            Require(Text(Target.HomePath, "state_5.sqlite", "SELECT reasoning_effort FROM threads WHERE id='root'") == "medium", "target reasoning applied");
            Require(Text(Target.HomePath, "state_5.sqlite", "SELECT project_id FROM threads WHERE id='root'") == "target-project", "project assignment remapped");
            Require(Text(Target.HomePath, "state_5.sqlite", "SELECT thread_section_id FROM threads WHERE id='root'") == "target-pinned", "pinned section remapped");
            Require(Scalar(Target.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM projects") == 2, "project deduplication retained target and appended new project");
            Require(Scalar(Target.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM thread_spawn_edges") == 1, "child relationship imported");
            Require(Scalar(Target.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM thread_dynamic_tools") == 1, "dynamic tool schema imported");
            Require(Scalar(Target.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM thread_attachments") == 1, "attachment metadata imported");
            Require(Scalar(Target.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM remote_control_enrollments") == 0, "source connection credentials excluded");
            Require(Scalar(Target.HomePath, "thread_history_1.sqlite", "SELECT COUNT(*) FROM thread_items") == 3, "history items merged");
            Require(Scalar(Target.HomePath, "thread_history_1.sqlite", "SELECT COUNT(*) FROM thread_turns") == 3, "history turns merged");
            Require(Text(Target.HomePath, "thread_history_1.sqlite", "SELECT item_json FROM thread_items WHERE thread_id='existing'") == "target history", "existing history preserved");
            Require(File.ReadAllBytes(Path.Combine(Source.HomePath, "sessions", "root.jsonl")).SequenceEqual(File.ReadAllBytes(Path.Combine(Target.HomePath, "sessions", "root.jsonl"))), "rollout bytes and history offsets preserved");
            Require(File.ReadAllBytes(Path.Combine(Source.HomePath, "sessions", "root-old-segment.jsonl")).SequenceEqual(File.ReadAllBytes(Path.Combine(Target.HomePath, "sessions", "root-old-segment.jsonl"))), "earlier history segments preserved");
            Require(Text(Target.HomePath, "state_5.sqlite", "SELECT rollout_path FROM threads WHERE id='root'") == Path.Combine(Target.HomePath, "sessions", "root.jsonl"), "rollout path points to target copy");
            Require(Scalar(Target.HomePath, "sqlite/codex-dev.db", "SELECT COUNT(*) FROM local_thread_catalog WHERE host_id='cloud'") == 0, "cloud catalog excluded");
            Require(Scalar(Target.HomePath, "sqlite/codex-dev.db", "SELECT COUNT(*) FROM local_thread_catalog WHERE host_id='local'") == 2, "local catalog merged");
            Require(Text(Target.HomePath, "sqlite/codex-dev.db", "SELECT model_provider FROM local_thread_catalog WHERE thread_id='root'") == "custom", "catalog provider remapped");
            Require(Text(Target.HomePath, "sqlite/codex-dev.db", "SELECT project_id FROM local_thread_catalog WHERE thread_id='root'") == "target-legacy", "catalog project remapped");
            Require(Scalar(Target.HomePath, "sqlite/codex-dev.db", "SELECT initial_build_complete FROM local_thread_catalog_sync_state WHERE host_id='local'") == 0, "local catalog refresh scheduled");
            var State = JsonNode.Parse(File.ReadAllText(Path.Combine(Target.HomePath, ".codex-global-state.json")))!;
            Require(State["thread-project-assignments"]!["root"]!["projectId"]!.GetValue<string>() == "target-legacy", "sidebar assignment remapped");
            Require(State["pinned-thread-ids"]!.AsArray().Select(Item => Item!.GetValue<string>()).SequenceEqual(new[] { "existing", "root" }), "target and imported pin order preserved");
            Require(State["project-order"]!.AsArray().Select(Item => Item!.GetValue<string>()).SequenceEqual(new[] { "target-legacy", "new-legacy" }), "target and imported project order preserved");
            Require(State["theme"]!.GetValue<string>() == "target-theme", "target UI settings preserved");
            Require(SettingsStore.FileHash(Path.Combine(Source.HomePath, "config.toml")) == SourceConfig && SettingsStore.FileHash(Path.Combine(Source.HomePath, "state_5.sqlite")) == SourceState, "source configuration and state unchanged");
            Require(SettingsStore.FileHash(Path.Combine(Target.HomePath, "config.toml")) == TargetConfig && SettingsStore.FileHash(Path.Combine(Target.HomePath, "auth.json")) == TargetAuth, "target authentication and configuration unchanged");
            using (var Repeated = ConversationImportService.Preview(Source, Target))
                Require(Repeated.ConversationList.Count == 0 && Repeated.ProjectCount == 0, "repeat import is idempotent");

            SeedThread(Source.HomePath, "later", "later", "later history");
            using (var Stale = ConversationImportService.Preview(Source, Target))
            {
                File.AppendAllText(Path.Combine(Target.HomePath, "config.toml"), "\n# changed after preview\n");
                RequireThrows(() => ConversationImportService.Apply(Stale, Path.Combine(Root, "stale-backups")), "stale target rejected");
                Require(Scalar(Target.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM threads WHERE id='later'") == 0, "stale rejection leaves target unchanged");
            }
            using (var Failure = ConversationImportService.Preview(Source, Target))
            {
                var BeforeDict = Failure.FileList.Where(Item => Item.PreparedPath is not null).ToDictionary(Item => Item.RelativePath, Item => SettingsStore.FileHash(Path.Combine(Target.HomePath, Item.RelativePath)));
                Failure.FileList.Add(new("failure.bin", Path.Combine(Failure.StageRoot, "absent.bin")));
                RequireThrows(() => ConversationImportService.Apply(Failure, Path.Combine(Root, "failure-backups")), "mid-commit failure reported");
                Require(BeforeDict.All(Item => SettingsStore.FileHash(Path.Combine(Target.HomePath, Item.Key)) == Item.Value), "mid-commit failure restores every changed target file");
                Require(!File.Exists(Path.Combine(Target.HomePath, "sessions", "later.jsonl")), "failed imported rollout removed");
            }
            using (var Database = Open(Source.HomePath, "state_5.sqlite")) Execute(Database, "ALTER TABLE threads ADD COLUMN unsupported_schema TEXT");
            RequireThrows(() => { using var Plan = ConversationImportService.Preview(Source, Target); }, "incompatible schema rejected");
            Console.WriteLine("PASS conversation import " + Count + " assertions; fixture=" + Root);
            return 0;
        }
        catch (Exception Error) { Console.Error.WriteLine(Error); Console.Error.WriteLine("fixture=" + Root); return 1; }
    }
    #endregion

    #region Fixtures
    private static void CreateHome(string Home)
    {
        Directory.CreateDirectory(Path.Combine(Home, "sessions"));
        Directory.CreateDirectory(Path.Combine(Home, "thread-writer-locks"));
        Directory.CreateDirectory(Path.Combine(Home, "sqlite"));
        foreach (var Pair in new[] { ("StateSchema.sql", "state_5.sqlite"), ("HistorySchema.sql", "thread_history_1.sqlite"), ("DesktopSchema.sql", "sqlite/codex-dev.db") })
        {
            using var Database = Open(Home, Pair.Item2);
            Execute(Database, File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", Pair.Item1)));
        }
        File.WriteAllText(Path.Combine(Home, "config.toml"), "model_provider='custom'\nmodel='deepseek-test'\nmodel_reasoning_effort='medium'\n");
        File.WriteAllText(Path.Combine(Home, "auth.json"), "target-private-key");
        File.WriteAllText(Path.Combine(Home, ".codex-global-state.json"), "{}");
    }

    private static void Seed(string Source, string Target)
    {
        SeedThread(Source, "root", "source root", "root history");
        SeedThread(Source, "child", "source child", "child history");
        SeedThread(Source, "active", "source active", "active history");
        SeedThread(Source, "unsafe", "unsafe", "unsafe history");
        SeedThread(Source, "existing", "source title", "source history");
        SeedThread(Target, "existing", "target title", "target history");
        File.Copy(Path.Combine(Source, "sessions", "root.jsonl"), Path.Combine(Source, "sessions", "root-old-segment.jsonl"));
        using (var Database = Open(Source, "state_5.sqlite"))
        {
            Execute(Database, "INSERT INTO projects VALUES('source-project','source project','{}',0,1,1),('new-project','new project','{}',1,1,1); INSERT INTO project_roots VALUES('source-project',0,'C:/repo/shared'),('new-project',0,'C:/repo/new'); INSERT INTO thread_sections VALUES('source-pinned','Pinned',NULL); UPDATE threads SET is_pinned=1,thread_section_id='source-pinned' WHERE id='root'; UPDATE threads SET archived=1,source='{\"subagent\":{}}' WHERE id='child'; INSERT INTO thread_spawn_edges VALUES('root','child','completed'); INSERT INTO thread_dynamic_tools(thread_id,position,name,description,input_schema) VALUES('root',0,'tool','test','{}'); INSERT INTO thread_attachments VALUES('attachment','root','reference','identity','{}',1); INSERT INTO remote_control_enrollments(websocket_url,account_id,app_server_client_name,server_id,environment_id,server_name,updated_at) VALUES('wss://private','private','client','server','env','name',1);");
            Execute(Database, "UPDATE threads SET rollout_path=$path WHERE id='unsafe'", ("$path", Path.Combine(Source, "auth.json")));
            Execute(Database, "UPDATE threads SET rollout_path=$path WHERE id='child'", ("$path", @"\\?\" + Path.Combine(Source, "sessions", "child.jsonl")));
        }
        using (var Database = Open(Target, "state_5.sqlite"))
            Execute(Database, "INSERT INTO projects VALUES('target-project','target project','{}',0,1,1); INSERT INTO project_roots VALUES('target-project',0,'C:/repo/shared'); INSERT INTO thread_sections VALUES('target-pinned','Pinned',NULL);");
        WriteState(Source, new JsonObject
        {
            ["local-projects"] = new JsonObject { ["source-legacy"] = Project("source-legacy", "source project", "C:/repo/shared"), ["new-legacy"] = Project("new-legacy", "new project", "C:/repo/new") },
            ["project-order"] = new JsonArray("source-legacy", "new-legacy"),
            ["thread-project-assignments"] = new JsonObject { ["root"] = new JsonObject { ["projectKind"] = "local", ["projectId"] = "source-legacy" } },
            ["pinned-thread-ids"] = new JsonArray("root"),
            ["app-server-project-id-by-legacy-project-id-by-host"] = new JsonObject { ["local:" + Source] = new JsonObject { ["source-legacy"] = "source-project", ["new-legacy"] = "new-project" } },
            ["theme"] = "source-theme"
        });
        WriteState(Target, new JsonObject
        {
            ["local-projects"] = new JsonObject { ["target-legacy"] = Project("target-legacy", "target project", "C:/repo/shared") },
            ["project-order"] = new JsonArray("target-legacy"),
            ["pinned-thread-ids"] = new JsonArray("existing"),
            ["app-server-project-id-by-legacy-project-id-by-host"] = new JsonObject { ["local:" + Target] = new JsonObject { ["target-legacy"] = "target-project" } },
            ["theme"] = "target-theme"
        });
        SeedCatalog(Source, "root", "source-legacy");
        SeedCatalog(Target, "existing", "target-legacy");
        using (var Database = Open(Source, "sqlite/codex-dev.db"))
            Execute(Database, "INSERT INTO local_thread_catalog SELECT 'cloud',thread_id,display_title,source_created_at,source_updated_at,cwd,source_kind,source_detail,model_provider,git_branch,observation_sequence,missing_candidate,thread_source,source_recency_at,pending_observed_title,project_id,conversation_origin,trial_conversation_type,chatgpt_async_status FROM local_thread_catalog;");
    }

    private static JsonObject Project(string Id, string Name, string PathValue) => new() { ["id"] = Id, ["name"] = Name, ["rootPaths"] = new JsonArray(PathValue), ["createdAt"] = 1, ["updatedAt"] = 1 };
    private static void WriteState(string Home, JsonObject State) => File.WriteAllText(Path.Combine(Home, ".codex-global-state.json"), State.ToJsonString());

    private static void SeedThread(string Home, string Id, string Title, string History)
    {
        string PathValue = Path.Combine(Home, "sessions", Id + ".jsonl");
        File.WriteAllText(PathValue, new JsonObject { ["type"] = "session_meta", ["payload"] = new JsonObject { ["id"] = Id, ["model_provider"] = "openai" } }.ToJsonString() + "\n");
        using (var Database = Open(Home, "state_5.sqlite"))
            Execute(Database, "INSERT INTO threads(id,rollout_path,created_at,updated_at,source,model_provider,cwd,title,sandbox_policy,approval_mode,model,history_mode) VALUES($id,$path,1,1,'vscode','openai','C:/repo',$title,'{}','never','source-model','paginated')", ("$id", Id), ("$path", PathValue), ("$title", Title));
        using (var Database = Open(Home, "thread_history_1.sqlite"))
        {
            Execute(Database, "INSERT INTO thread_turns(thread_id,turn_id,rollout_ordinal,status) VALUES($id,'turn',1,'completed'); INSERT INTO thread_items(thread_id,turn_id,item_id,rollout_ordinal,created_at_ms,item_json) VALUES($id,'turn','item',1,1,$history); INSERT INTO thread_history_projection_state VALUES($id,0,0)", ("$id", Id), ("$history", History));
        }
    }

    private static void SeedCatalog(string Home, string Id, string ProjectId)
    {
        using var Database = Open(Home, "sqlite/codex-dev.db");
        Execute(Database, "INSERT INTO local_thread_catalog(host_id,thread_id,display_title,source_created_at,source_updated_at,cwd,source_kind,model_provider,observation_sequence,project_id) VALUES('local',$id,'title',1,1,'C:/repo','vscode','openai',1,$project); INSERT INTO local_thread_catalog_hosts VALUES('local','local'); INSERT INTO local_thread_catalog_sync_state(host_id,initial_build_complete) VALUES('local',1); INSERT INTO local_thread_catalog_metadata(id,catalog_revision) VALUES(1,1)", ("$id", Id), ("$project", ProjectId));
    }
    #endregion

    #region Helpers
    private static SqliteConnection Open(string Home, string Relative)
    {
        var Database = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = Path.Combine(Home, Relative), Pooling = false }.ToString());
        Database.Open();
        return Database;
    }

    private static void Execute(SqliteConnection Database, string Sql, params (string Name, object Value)[] ParameterList)
    {
        using var Command = Database.CreateCommand();
        Command.CommandText = Sql;
        foreach (var Parameter in ParameterList) Command.Parameters.AddWithValue(Parameter.Name, Parameter.Value);
        Command.ExecuteNonQuery();
    }

    private static string? Text(string Home, string Relative, string Sql)
    {
        using var Database = Open(Home, Relative);
        using var Command = Database.CreateCommand();
        Command.CommandText = Sql;
        return Command.ExecuteScalar() as string;
    }

    private static long Scalar(string Home, string Relative, string Sql)
    {
        using var Database = Open(Home, Relative);
        using var Command = Database.CreateCommand();
        Command.CommandText = Sql;
        return Convert.ToInt64(Command.ExecuteScalar());
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new InvalidOperationException("FAILED: " + Message);
        Count++;
    }

    private static void RequireThrows(Action Operation, string Message)
    {
        bool Failed = false;
        try { Operation(); }
        catch (Exception Error) when (Error is IOException or InvalidOperationException) { Failed = true; }
        Require(Failed, Message);
    }
    #endregion
}
