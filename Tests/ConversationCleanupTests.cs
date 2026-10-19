using System.Diagnostics;
using System.Text.Json.Nodes;
using CodexInstanceManager;
using Microsoft.Data.Sqlite;

internal static class ConversationCleanupTests
{
    private static int Count;

    #region Cases
    public static int Run()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexCleanupTests-" + Guid.NewGuid().ToString("N"));
        try
        {
            foreach (bool RemoveProjects in new[] { false, true }) VerifyMode(Path.Combine(Root, RemoveProjects ? "all" : "threads"), RemoveProjects);
            VerifyRollback(Path.Combine(Root, "rollback"));
            VerifyGuards(Path.Combine(Root, "guards"));
            Console.WriteLine($"PASS conversation cleanup {Count} assertions; fixture={Root}");
            return 0;
        }
        catch (Exception Error) { Console.Error.WriteLine(Error); return 1; }
    }

    private static void VerifyMode(string Root, bool RemoveProjects)
    {
        var Profile = CreateFixture(Root);
        var OriginalState = ReadState(Profile.HomePath);
        var ProtectedHashDict = new[] { "auth.json", "config.toml", "skills/mine/SKILL.md", "rules/default.rules" }
            .ToDictionary(Relative => Relative, Relative => SettingsStore.FileHash(Path.Combine(Profile.HomePath, Relative)));
        string Backup = ConversationCleanupService.Apply(Profile, RemoveProjects, Path.Combine(Root, "backups"));
        Require(Scalar(Profile.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM threads") == 0, "all active and archived local threads are removed");
        foreach (string Table in new[] { "thread_attachments", "thread_dynamic_tools", "thread_spawn_edges", "guardian_review_feedback", "thread_read_receipts" })
            Require(Scalar(Profile.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM " + Table) == 0, "thread relations are removed without leaving stale references");
        Require(Scalar(Profile.HomePath, "thread_history_1.sqlite", "SELECT COUNT(*) FROM thread_turns") == 0, "conversation history projection is cleared");
        Require(Scalar(Profile.HomePath, "goals_1.sqlite", "SELECT COUNT(*) FROM thread_goals") == 0 && Scalar(Profile.HomePath, "queue_1.sqlite", "SELECT COUNT(*) FROM queued_items") == 0, "deleted threads do not retain goals or queued messages");
        Require(!Directory.EnumerateFiles(Path.Combine(Profile.HomePath, "sessions"), "*", SearchOption.AllDirectories).Any() && !Directory.EnumerateFiles(Path.Combine(Profile.HomePath, "archived_sessions"), "*", SearchOption.AllDirectories).Any(), "active archived and unindexed rollout segments are cleared");
        Require(!File.Exists(Path.Combine(Profile.HomePath, "history.jsonl")) && !File.Exists(Path.Combine(Profile.HomePath, "session_index.jsonl")), "legacy history and session indexes are cleared");
        Require(Scalar(Profile.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM projects") == (RemoveProjects ? 0 : 1), "selected cleanup mode controls project registration");
        Require(Scalar(Profile.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM project_roots") == (RemoveProjects ? 0 : 1), "project root references follow the selected mode");
        var State = ReadState(Profile.HomePath);
        Require(State["pinned-thread-ids"]!.AsArray().Select(Value => Value!.GetValue<string>()).SequenceEqual(new[] { "cloud-thread" }), "local pinned threads are removed while cloud references remain");
        Require(State["thread-project-assignments"]!.AsObject().Count == 0 && State["electron-persisted-atom-state"]!["thread-tab-routes-v1:live"] is null, "thread assignments and cached tabs are cleared");
        Require(State["electron-persisted-atom-state"]!["app-server-pinned-thread-order-v1"]!.AsArray().Single()!["threadId"]!.GetValue<string>() == "cloud-thread", "structured pinned identities are removed as whole entries while unrelated entries remain valid");
        Require(State["theme"]!.GetValue<string>() == "keep-theme" && State["electron-persisted-atom-state"]!["keep-preference"]!.GetValue<bool>(), "unrelated appearance and app preferences are preserved");
        if (RemoveProjects)
            Require(State["local-projects"]!.AsObject().Count == 0 && State["selected-project"] is null && State["project-order"]!.AsArray().Select(Value => Value!.GetValue<string>()).SequenceEqual(new[] { "cloud-project" }), "full cleanup clears local project selection and ordering without removing cloud projects");
        else
            foreach (string Key in new[] { "local-projects", "project-order", "project-appearances", "selected-project", "app-server-project-id-by-legacy-project-id-by-host" })
                Require(JsonNode.DeepEquals(State[Key], OriginalState[Key]), "conversation-only cleanup preserves project data and ordering exactly");
        Require(Scalar(Profile.HomePath, "sqlite/codex-dev.db", "SELECT COUNT(*) FROM local_thread_catalog WHERE host_id='local'") == 0 && Scalar(Profile.HomePath, "sqlite/codex-dev.db", "SELECT COUNT(*) FROM local_thread_catalog WHERE host_id='cloud'") == 1, "desktop cleanup removes only the local catalog");
        Require(Scalar(Profile.HomePath, "sqlite/codex-dev.db", "SELECT COUNT(*) FROM automation_runs") == 1 && Scalar(Profile.HomePath, "sqlite/codex-dev.db", "SELECT COUNT(*) FROM automations") == 1, "thread run records are cleaned while unrelated runs and automation definitions remain");
        Require(ProtectedHashDict.All(Pair => SettingsStore.FileHash(Path.Combine(Profile.HomePath, Pair.Key)) == Pair.Value) && File.ReadAllText(Path.Combine(Root, "repo", "main.cs")) == "project source", "account model tools and disk project files are untouched");
        Require(Scalar(Path.Combine(Backup, "original"), "state_5.sqlite", "SELECT COUNT(*) FROM threads") == 2 && JsonNode.DeepEquals(ReadState(Path.Combine(Backup, "original")), OriginalState), "automatic backup contains original threads and sidebar state");
        Require(File.Exists(Path.Combine(Backup, "manifest.json")) && File.Exists(Path.Combine(Backup, "original", "sessions", "live.jsonl")), "backup manifest and original conversation bodies are retained");
        ConversationCleanupService.Apply(Profile, RemoveProjects, Path.Combine(Root, "backups"));
        Require(Scalar(Profile.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM threads") == 0, "cleaning an already empty local history is stable");
    }

    private static void VerifyRollback(string Root)
    {
        var Profile = CreateFixture(Root);
        var HashDict = Snapshot(Profile.HomePath);
        bool CommitInterrupted = false;
        var Progress = new ImmediateProgress(Text =>
        {
            if (!Text.StartsWith("正在清理 ", StringComparison.Ordinal) || !Text.EndsWith("live.jsonl", StringComparison.Ordinal)) return;
            CommitInterrupted = true;
            throw new IOException("fixture cleanup failure");
        });
        RequireThrows(() => ConversationCleanupService.Apply(Profile, true, Path.Combine(Root, "backups"), Progress), "write failure is surfaced with backup context");
        Require(CommitInterrupted, "rollback fixture reaches database replacement and rollout deletion before injecting failure");
        Require(HashDict.All(Pair => SettingsStore.FileHash(Path.Combine(Profile.HomePath, Pair.Key)) == Pair.Value), "failure after database replacement and rollout deletion restores every original file");
        Require(Scalar(Profile.HomePath, "state_5.sqlite", "SELECT COUNT(*) FROM threads") == 2, "rolled back databases retain their original threads");
    }

    private static void VerifyGuards(string Root)
    {
        var Profile = CreateFixture(Root);
        string StateHash = SettingsStore.FileHash(Path.Combine(Profile.HomePath, "state_5.sqlite"))!;
        using (var Writer = new FileStream(Path.Combine(Profile.HomePath, "thread-writer-locks", "live.lock"), FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.ReadWrite))
        {
            Writer.Lock(0, 1);
            RequireThrows(() => ConversationCleanupService.Apply(Profile, true, Path.Combine(Root, "backups")), "an active thread writer prevents cleanup");
        }
        Require(SettingsStore.FileHash(Path.Combine(Profile.HomePath, "state_5.sqlite")) == StateHash, "rejected cleanup never changes original databases");
        string Outside = Path.Combine(Root, "outside");
        Directory.CreateDirectory(Outside);
        File.WriteAllText(Path.Combine(Outside, "keep.jsonl"), "outside file");
        var Info = new ProcessStartInfo("cmd.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
        foreach (string Argument in new[] { "/c", "mklink", "/J", Path.Combine(Profile.HomePath, "sessions", "external"), Outside }) Info.ArgumentList.Add(Argument);
        using (var Process = System.Diagnostics.Process.Start(Info)!)
        {
            string Output = Process.StandardOutput.ReadToEnd() + Process.StandardError.ReadToEnd();
            Process.WaitForExit();
            if (Process.ExitCode != 0) throw new IOException("junction fixture creation failed " + Output);
        }
        RequireThrows(() => ConversationCleanupService.Apply(Profile, true, Path.Combine(Root, "backups")), "directory junctions cannot redirect cleanup outside the instance home");
        Require(File.ReadAllText(Path.Combine(Outside, "keep.jsonl")) == "outside file", "linked external files remain untouched");
    }
    #endregion

    #region Fixtures
    private static InstanceProfile CreateFixture(string Root)
    {
        var Profile = new InstanceProfile { Id = "fixture", Name = "清理测试实例", HomePath = Path.Combine(Root, "home"), DataPath = Path.Combine(Root, "desktop") };
        foreach (string Relative in new[] { "sessions", "archived_sessions", "thread-writer-locks", "sqlite", "skills/mine", "rules" }) Directory.CreateDirectory(Path.Combine(Profile.HomePath, Relative));
        Directory.CreateDirectory(Path.Combine(Root, "repo"));
        File.WriteAllText(Path.Combine(Root, "repo", "main.cs"), "project source");
        foreach (var Pair in new[] { ("StateSchema.sql", "state_5.sqlite"), ("HistorySchema.sql", "thread_history_1.sqlite"), ("DesktopSchema.sql", "sqlite/codex-dev.db") })
            Execute(Profile.HomePath, Pair.Item2, File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", Pair.Item1)));
        foreach (string Relative in new[] { "auth.json", "config.toml", "skills/mine/SKILL.md", "rules/default.rules", "history.jsonl", "session_index.jsonl", "sessions/live.jsonl", "sessions/unindexed.jsonl", "archived_sessions/archived.jsonl" }) File.WriteAllText(Path.Combine(Profile.HomePath, Relative), "original " + Relative);
        Execute(Profile.HomePath, "state_5.sqlite", "INSERT INTO projects VALUES('project','project','{}',0,1,1); INSERT INTO project_roots VALUES('project',0,'C:/repo'); INSERT INTO project_idempotency_keys VALUES('key','project',1); INSERT INTO threads(id,rollout_path,created_at,updated_at,source,model_provider,cwd,title,sandbox_policy,approval_mode,archived,project_id) VALUES('live','sessions/live.jsonl',1,1,'vscode','openai','C:/repo','live','{}','never',0,'project'),('archived','archived_sessions/archived.jsonl',1,1,'vscode','openai','C:/repo','archived','{}','never',1,'project'); INSERT INTO thread_spawn_edges VALUES('live','archived','completed'); INSERT INTO thread_attachments VALUES('attachment','live','reference','identity','{}',1); INSERT INTO thread_dynamic_tools(thread_id,position,name,description,input_schema) VALUES('live',0,'tool','description','{}'); CREATE TABLE guardian_review_feedback(id TEXT,thread_id TEXT,record TEXT); INSERT INTO guardian_review_feedback VALUES('feedback','live','{}'); CREATE TABLE thread_read_receipts(thread_id TEXT PRIMARY KEY,revision INTEGER); INSERT INTO thread_read_receipts VALUES('live',1)");
        Execute(Profile.HomePath, "thread_history_1.sqlite", "INSERT INTO thread_turns(thread_id,turn_id,rollout_ordinal,status) VALUES('live','turn',1,'completed'); INSERT INTO thread_items(thread_id,turn_id,item_id,rollout_ordinal,created_at_ms,item_json) VALUES('live','turn','item',1,1,'{}')");
        Execute(Profile.HomePath, "goals_1.sqlite", "CREATE TABLE thread_goals(thread_id TEXT PRIMARY KEY,objective TEXT); INSERT INTO thread_goals VALUES('live','goal')");
        Execute(Profile.HomePath, "queue_1.sqlite", "CREATE TABLE queued_items(id TEXT PRIMARY KEY,thread_id TEXT,payload_json TEXT); INSERT INTO queued_items VALUES('item','live','{}')");
        Execute(Profile.HomePath, "sqlite/codex-dev.db", "INSERT INTO local_thread_catalog(host_id,thread_id,display_title,source_created_at,source_updated_at,source_kind,observation_sequence) VALUES('local','live','local',1,1,'vscode',1),('cloud','cloud-thread','cloud',1,1,'chatgpt',1); INSERT INTO automation_runs(thread_id,automation_id,status,created_at,updated_at) VALUES('live','automation','done',1,1),('cloud-thread','automation','done',1,1); INSERT INTO automations(id,name,prompt,created_at,updated_at,target_thread_id) VALUES('automation','keep','keep',1,1,'live'); INSERT INTO local_thread_catalog_metadata VALUES(1,1); INSERT INTO local_thread_catalog_sync_state(host_id,initial_build_complete) VALUES('local',1)");
        var State = new JsonObject
        {
            ["local-projects"] = new JsonObject { ["legacy-project"] = new JsonObject { ["id"] = "legacy-project", ["name"] = "keep project", ["rootPaths"] = new JsonArray(Path.Combine(Root, "repo")) } },
            ["project-order"] = new JsonArray("legacy-project", "cloud-project"),
            ["project-appearances"] = new JsonObject { ["legacy-project"] = "color" },
            ["selected-project"] = new JsonObject { ["type"] = "codex", ["projectId"] = "project" },
            ["app-server-project-id-by-legacy-project-id-by-host"] = new JsonObject { ["local:" + Profile.HomePath] = new JsonObject { ["legacy-project"] = "project" } },
            ["pinned-thread-ids"] = new JsonArray("live", "cloud-thread"),
            ["sidebar-project-thread-orders"] = new JsonObject { ["legacy-project"] = new JsonArray("live", "archived") },
            ["thread-project-assignments"] = new JsonObject { ["live"] = new JsonObject { ["projectId"] = "project" } },
            ["electron-persisted-atom-state"] = new JsonObject
            {
                ["thread-tab-routes-v1:live"] = new JsonObject(), ["sidebar-project-expanded-v1-codex:project"] = true, ["keep-preference"] = true,
                ["app-server-pinned-thread-order-v1"] = new JsonArray(new JsonObject { ["threadId"] = "live", ["hostId"] = "local" }, new JsonObject { ["threadId"] = "cloud-thread", ["hostId"] = "cloud" })
            },
            ["theme"] = "keep-theme"
        };
        File.WriteAllText(Path.Combine(Profile.HomePath, ".codex-global-state.json"), State.ToJsonString());
        return Profile;
    }
    #endregion

    #region Helpers
    private static Dictionary<string, string?> Snapshot(string Home) => Directory.EnumerateFiles(Home, "*", SearchOption.AllDirectories).ToDictionary(FilePath => Path.GetRelativePath(Home, FilePath), SettingsStore.FileHash);
    private static JsonObject ReadState(string Home) => JsonNode.Parse(File.ReadAllText(Path.Combine(Home, ".codex-global-state.json")))!.AsObject();

    private static void Execute(string Home, string Relative, string Sql)
    {
        using var Database = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = Path.Combine(Home, Relative), Pooling = false }.ToString());
        Database.Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = Sql;
        Command.ExecuteNonQuery();
    }

    private static long Scalar(string Home, string Relative, string Sql)
    {
        using var Database = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = Path.Combine(Home, Relative), Mode = SqliteOpenMode.ReadOnly, Pooling = false }.ToString());
        Database.Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = Sql;
        return Convert.ToInt64(Command.ExecuteScalar());
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new InvalidOperationException("FAILED cleanup: " + Message);
        Count++;
    }

    private static void RequireThrows(Action Operation, string Message)
    {
        try { Operation(); }
        catch (Exception Error) when (Error is IOException or InvalidOperationException or SqliteException) { Count++; return; }
        throw new InvalidOperationException("FAILED cleanup: " + Message);
    }

    private sealed class ImmediateProgress(Action<string> Action) : IProgress<string>
    {
        public void Report(string Value) => Action(Value);
    }
    #endregion
}
