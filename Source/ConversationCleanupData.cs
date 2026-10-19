using System.Text.Json.Nodes;
using Microsoft.Data.Sqlite;

namespace CodexInstanceManager;

internal static class ConversationCleanupData
{
    public static HashSet<string> ReadThreadIds(string StatePath, string CatalogPath)
    {
        using var State = ConversationDatabase.Open(StatePath);
        using var Catalog = ConversationDatabase.Open(CatalogPath);
        return ConversationDatabase.Rows(State, "SELECT id FROM threads")
            .Concat(ConversationDatabase.Rows(Catalog, "SELECT thread_id AS id FROM local_thread_catalog WHERE host_id='local'"))
            .Select(Row => (string)Row["id"]!).ToHashSet(StringComparer.Ordinal);
    }

    public static HashSet<string> ReadProjectIds(string StatePath, JsonObject State)
    {
        using var Database = ConversationDatabase.Open(StatePath);
        var ResultHashList = ConversationDatabase.Rows(Database, "SELECT id FROM projects").Select(Row => (string)Row["id"]!).ToHashSet(StringComparer.Ordinal);
        if (State["local-projects"] is JsonObject Projects)
            foreach (string Id in Projects.Select(Pair => Pair.Key)) ResultHashList.Add(Id);
        return ResultHashList;
    }

    public static void ClearDatabase(string PathValue, bool RemoveProjects, HashSet<string> ThreadIdHashList)
    {
        using var Database = ConversationDatabase.Open(PathValue);
        var StatementList = new List<string>();
        bool Desktop = Path.GetFileName(PathValue) == "codex-dev.db";
        if (Desktop)
        {
            ConversationDatabase.Execute(Database, "CREATE TEMP TABLE cleanup_threads(id TEXT PRIMARY KEY)");
            foreach (string Id in ThreadIdHashList) ConversationDatabase.Execute(Database, "INSERT INTO cleanup_threads VALUES($id)", ("$id", Id));
        }
        foreach (var Table in ConversationDatabase.Rows(Database, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))
        {
            string Name = (string)Table["name"]!;
            var ColumnHashList = ConversationDatabase.Rows(Database, "PRAGMA table_info(" + ConversationDatabase.Quote(Name) + ")").Select(Row => (string)Row["name"]!).ToHashSet();
            if (!ColumnHashList.Overlaps(new[] { "thread_id", "parent_thread_id", "child_thread_id" })) continue;
            if (Name == "automations") continue;
            string Predicate = !Desktop ? "" : ColumnHashList.Contains("host_id") ? " WHERE host_id='local'" : " WHERE thread_id IN (SELECT id FROM cleanup_threads)";
            StatementList.Add("DELETE FROM " + ConversationDatabase.Quote(Name) + Predicate);
        }
        if (Path.GetFileName(PathValue) == "state_5.sqlite")
        {
            StatementList.Add("DELETE FROM threads");
            if (RemoveProjects) StatementList.Add("DELETE FROM project_idempotency_keys; DELETE FROM project_roots; DELETE FROM projects");
        }
        if (Desktop)
            StatementList.Add("DELETE FROM local_thread_catalog_scan_checkpoints WHERE host_id='local'; UPDATE local_thread_catalog_sync_state SET initial_build_complete=0,watermark_updated_at=NULL,last_full_reconciled_at=NULL WHERE host_id='local'; UPDATE local_thread_catalog_metadata SET catalog_revision=catalog_revision+1");
        using (var Transaction = Database.BeginTransaction())
        {
            using var Command = Database.CreateCommand();
            Command.Transaction = Transaction;
            Command.CommandText = string.Join(';', StatementList);
            Command.ExecuteNonQuery();
            Transaction.Commit();
        }
        ConversationDatabase.Execute(Database, "VACUUM");
        ConversationDatabase.Verify(Database);
    }

    public static void ClearSidebar(JsonObject State, string Home, bool RemoveProjects, HashSet<string> ThreadIdHashList, HashSet<string> ProjectIdHashList)
    {
        foreach (string Key in new[] { "thread-project-assignments", "thread-project-membership-host-ids", "thread-writable-roots", "thread-projectless-output-directories", "thread-workspace-root-hints", "projectless-thread-ids", "pinned-thread-ids", "sidebar-project-thread-orders", "electron-thread-read-state-v1", "queued-follow-ups", "app-server-migrated-pinned-thread-ids-by-host", "electron-persisted-atom-state" })
            Prune(State[Key], ThreadIdHashList);
        if (!RemoveProjects) return;
        if (State["selected-project"] is JsonObject Selected && Selected["projectId"] is JsonValue Id && ProjectIdHashList.Contains(Id.GetValue<string>()))
            State["selected-project"] = null;
        foreach (string Key in new[] { "local-projects", "project-order", "project-appearances", "sidebar-project-thread-orders", "electron-persisted-atom-state" })
            Prune(State[Key], ProjectIdHashList);
        if (State["app-server-project-id-by-legacy-project-id-by-host"] is JsonObject Hosts)
            foreach (string Key in Hosts.Select(Pair => Pair.Key).Where(Key => Key.StartsWith("local:", StringComparison.Ordinal) && ManagerPaths.Same(Key[6..], Home)).ToList()) Hosts.Remove(Key);
    }

    private static void Prune(JsonNode? Node, HashSet<string> IdHashList)
    {
        bool Matches(string Text) => IdHashList.Contains(Text) || IdHashList.Contains(Text[(Text.LastIndexOf(':') + 1)..]) ||
            Text.Contains("%3A", StringComparison.OrdinalIgnoreCase) && IdHashList.Contains(Text[(Text.LastIndexOf("%3A", StringComparison.OrdinalIgnoreCase) + 3)..]);
        bool Identifies(JsonNode? Value) => Value is JsonValue Scalar && Scalar.TryGetValue(out string? Text) && Matches(Text) ||
            Value is JsonObject Object && Object.Any(Pair => Pair.Key is "threadId" or "thread_id" or "projectId" or "project_id" or "id" && Pair.Value is JsonValue Identity && Identity.TryGetValue(out string? Id) && Matches(Id));
        if (Node is JsonObject Object)
        {
            foreach (var Pair in Object.ToList())
            {
                if (Matches(Pair.Key) || Identifies(Pair.Value)) Object.Remove(Pair.Key);
                else Prune(Pair.Value, IdHashList);
            }
        }
        else if (Node is JsonArray Array)
        {
            for (int Index = Array.Count - 1; Index >= 0; Index--)
            {
                if (Identifies(Array[Index])) Array.RemoveAt(Index);
                else Prune(Array[Index], IdHashList);
            }
        }
    }
}
