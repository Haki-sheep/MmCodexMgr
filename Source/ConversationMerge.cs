using System.Text.Json.Nodes;
using Microsoft.Data.Sqlite;

namespace CodexInstanceManager;

internal static class ConversationMerge
{
    public static void Prepare(ConversationImportPlan Plan, JsonObject SourceState, JsonObject TargetState, string? ReasoningEffort)
    {
        ConversationSidebar Sidebar;
        using (var Database = OpenStage(Plan, "state_5.sqlite"))
        {
            ConversationDatabase.AttachSource(Database, SourcePath(Plan, "state_5.sqlite"));
            ConversationDatabase.AddThreadMap(Database, Plan);
            Sidebar = new ConversationSidebar(Database, SourceState, TargetState, Plan);
            Sidebar.WriteProjects(Database);
            ConversationDatabase.AddMap(Database, "import_projects", Sidebar.ProjectIdDict);
            var SectionDict = new Dictionary<string, string>();
            foreach (var Row in ConversationDatabase.Rows(Database, "SELECT * FROM source.thread_sections"))
            {
                string Id = (string)Row["id"]!;
                string? Existing = ConversationDatabase.Scalar(Database, "SELECT id FROM thread_sections WHERE id=$id OR name=$name ORDER BY id=$id DESC LIMIT 1", ("$id", Id), ("$name", Row["name"])) as string;
                if (Existing is null) ConversationDatabase.Execute(Database, "INSERT INTO thread_sections SELECT * FROM source.thread_sections WHERE id=$id", ("$id", Id));
                SectionDict[Id] = Existing ?? Id;
            }
            ConversationDatabase.AddMap(Database, "import_sections", SectionDict);
            ConversationDatabase.Execute(Database, "ALTER TABLE import_threads ADD COLUMN project_id TEXT;");
            foreach (var Thread in Plan.ConversationList)
                ConversationDatabase.Execute(Database, "UPDATE import_threads SET project_id=$project WHERE id=$id", ("$project", Sidebar.ProjectForThread(Thread.Id, SourceState)), ("$id", Thread.Id));
            ConversationDatabase.Execute(Database, "CREATE TEMP TABLE import_config(provider TEXT,model TEXT,reasoning TEXT); INSERT INTO import_config VALUES($provider,$model,$reasoning)", ("$provider", Plan.Provider), ("$model", Plan.Model), ("$reasoning", ReasoningEffort));
            var OverrideDict = new Dictionary<string, string>
            {
                ["rollout_path"] = "(SELECT rollout_path FROM import_threads WHERE id=s.id)",
                ["model_provider"] = "(SELECT provider FROM import_config)",
                ["model"] = "(SELECT model FROM import_config)",
                ["reasoning_effort"] = "(SELECT reasoning FROM import_config)",
                ["project_id"] = "COALESCE((SELECT project_id FROM import_threads WHERE id=s.id),(SELECT target_id FROM import_projects WHERE source_id=s.project_id))",
                ["thread_section_id"] = "(SELECT target_id FROM import_sections WHERE source_id=s.thread_section_id)"
            };
            ConversationDatabase.CopyRows(Database, "threads", "s.id IN (SELECT id FROM import_threads)", OverrideDict);
            foreach (string Table in new[] { "thread_dynamic_tools", "thread_attachments" })
                ConversationDatabase.CopyRows(Database, Table, "s.thread_id IN (SELECT id FROM import_threads)");
            ConversationDatabase.CopyRows(Database, "thread_spawn_edges", "(s.parent_thread_id IN (SELECT id FROM import_threads) OR s.child_thread_id IN (SELECT id FROM import_threads)) AND s.parent_thread_id IN (SELECT id FROM threads) AND s.child_thread_id IN (SELECT id FROM threads) AND NOT EXISTS(SELECT 1 FROM thread_spawn_edges t WHERE t.child_thread_id=s.child_thread_id)");
            ConversationDatabase.Verify(Database);
        }
        using (var Database = OpenStage(Plan, "thread_history_1.sqlite"))
        {
            ConversationDatabase.AttachSource(Database, SourcePath(Plan, "thread_history_1.sqlite"));
            ConversationDatabase.AddThreadMap(Database, Plan);
            foreach (string Table in new[] { "thread_turns", "thread_items", "thread_history_projection_state", "thread_realtime_items" })
                ConversationDatabase.CopyRows(Database, Table, "s.thread_id IN (SELECT id FROM import_threads)");
            ConversationDatabase.Verify(Database);
        }
        using (var Database = OpenStage(Plan, Path.Combine("sqlite", "codex-dev.db")))
        {
            ConversationDatabase.AttachDesktopSource(Database, SourcePath(Plan, Path.Combine("sqlite", "codex-dev.db")));
            ConversationDatabase.AddThreadMap(Database, Plan);
            var ProjectDict = new Dictionary<string, string>(Sidebar.ProjectIdDict);
            foreach (var Pair in Sidebar.LegacyIdDict) ProjectDict[Pair.Key] = Pair.Value;
            ConversationDatabase.AddMap(Database, "import_projects", ProjectDict);
            ConversationDatabase.Execute(Database, "CREATE TEMP TABLE import_config(provider TEXT); INSERT INTO import_config VALUES($provider)", ("$provider", Plan.Provider));
            ConversationDatabase.CopyRows(Database, "local_thread_catalog", "s.host_id='local' AND s.thread_id IN (SELECT id FROM import_threads) AND NOT EXISTS(SELECT 1 FROM local_thread_catalog t WHERE t.host_id='local' AND t.thread_id=s.thread_id)", new()
            {
                ["model_provider"] = "(SELECT provider FROM import_config)",
                ["project_id"] = "(SELECT target_id FROM import_projects WHERE source_id=s.project_id)",
                ["observation_sequence"] = "COALESCE((SELECT observation_sequence FROM local_thread_catalog_sync_state WHERE host_id='local'),0)"
            });
            ConversationDatabase.CopyRows(Database, "thread_timeline_ledger", "s.host_id='local' AND s.thread_id IN (SELECT id FROM import_threads) AND NOT EXISTS(SELECT 1 FROM thread_timeline_ledger t WHERE t.host_id='local' AND t.thread_id=s.thread_id)");
            ConversationDatabase.Execute(Database, "INSERT INTO local_thread_catalog_hosts(host_id,host_kind) SELECT 'local','local' WHERE NOT EXISTS(SELECT 1 FROM local_thread_catalog_hosts WHERE host_id='local'); UPDATE local_thread_catalog_sync_state SET initial_build_complete=0,watermark_updated_at=NULL,last_full_reconciled_at=NULL WHERE host_id='local'; DELETE FROM local_thread_catalog_scan_checkpoints WHERE host_id='local'; DELETE FROM local_thread_catalog_scan_entries WHERE host_id='local'; UPDATE local_thread_catalog_metadata SET catalog_revision=catalog_revision+1;");
            ConversationDatabase.Verify(Database);
        }
        string StatePath = Path.Combine(Plan.StageRoot, "result", ".codex-global-state.json");
        File.WriteAllText(StatePath, Sidebar.Result.ToJsonString());
    }

    private static SqliteConnection OpenStage(ConversationImportPlan Plan, string RelativePath) => ConversationDatabase.Open(Path.Combine(Plan.StageRoot, "result", RelativePath));
    private static string SourcePath(ConversationImportPlan Plan, string RelativePath) => Path.Combine(Plan.StageRoot, "source", RelativePath);
}
