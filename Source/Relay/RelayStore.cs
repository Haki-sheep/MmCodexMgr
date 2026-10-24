using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace CodexInstanceManager;

public sealed partial class RelayStore
{
    private static readonly string BlockingPredicate = "state IN (" + string.Join(",", new[] { eRelayState.Sending, eRelayState.Running, eRelayState.Returning, eRelayState.DispatchUncertain, eRelayState.ReturnUncertain }.Select(State => (int)State)) + ")";
    private readonly string Root;
    public RelayStore(string Root)
    {
        this.Root = Root;
        Directory.CreateDirectory(Root);
        using var Database = Open();
        ConversationDatabase.Execute(Database, "CREATE TABLE IF NOT EXISTS relay_tasks(id TEXT PRIMARY KEY,request_key TEXT NOT NULL UNIQUE,title TEXT NOT NULL,state INTEGER NOT NULL,updated_at TEXT NOT NULL,data TEXT NOT NULL); CREATE INDEX IF NOT EXISTS relay_tasks_updated ON relay_tasks(updated_at DESC); CREATE INDEX IF NOT EXISTS relay_tasks_state ON relay_tasks(state); CREATE INDEX IF NOT EXISTS relay_tasks_parent ON relay_tasks(json_extract(data,'$.ParentTaskId'),state); CREATE INDEX IF NOT EXISTS relay_tasks_worker ON relay_tasks(json_extract(data,'$.Channel.WorkerInstance.Id'),json_extract(data,'$.Channel.WorkerThreadId'),state);");
    }

    public RelayChannel? LoadChannel()
    {
        string FilePath = Path.Combine(Root, "channel.json");
        return File.Exists(FilePath) ? JsonSerializer.Deserialize<RelayChannel>(File.ReadAllText(FilePath)) ?? throw new InvalidDataException("联调通道配置为空") : null;
    }

    public void SaveChannel(RelayChannel Channel) => SettingsStore.AtomicWrite(Path.Combine(Root, "channel.json"), JsonSerializer.SerializeToUtf8Bytes(Channel));

    public void Save(RelayTask Task)
    {
        Task.UpdatedAt = DateTimeOffset.UtcNow;
        using var Database = Open();
        ConversationDatabase.Execute(Database, "INSERT INTO relay_tasks VALUES($id,$key,$title,$state,$updated,$data) ON CONFLICT(id) DO UPDATE SET title=excluded.title,state=excluded.state,updated_at=excluded.updated_at,data=excluded.data;",
            ("$id", Task.Id), ("$key", Task.RequestKey), ("$title", Task.Title), ("$state", (int)Task.State), ("$updated", Task.UpdatedAt.ToString("O")), ("$data", JsonSerializer.Serialize(Task)));
    }

    public RelayTask Get(string Id) => FindTask(Id) ?? throw new InvalidOperationException("联调任务不存在 " + Id);
    public RelayTask? FindTask(string Id) => Find("id", Id);
    public RelayTask? FindRequest(string Key) => Find("request_key", Key);

    public int Count()
    {
        using var Database = Open();
        return Convert.ToInt32(ConversationDatabase.Scalar(Database, "SELECT COUNT(*) FROM relay_tasks"));
    }

    public void DeleteFinished(string Id)
    {
        using var Database = Open();
        int DeletedCount = ConversationDatabase.Execute(Database, "DELETE FROM relay_tasks WHERE id=$id AND state IN ($accepted,$cancelled)",
            ("$id", Id), ("$accepted", (int)eRelayState.Accepted), ("$cancelled", (int)eRelayState.Cancelled));
        if (DeletedCount == 0) throw new InvalidOperationException("任务不存在或尚未结束 无法删除记录 " + Id);
    }

    public int ClearFinished()
    {
        using var Database = Open();
        return ConversationDatabase.Execute(Database, "DELETE FROM relay_tasks WHERE state IN ($accepted,$cancelled)",
            ("$accepted", (int)eRelayState.Accepted), ("$cancelled", (int)eRelayState.Cancelled));
    }

    public List<string> BlockedIds()
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT id,state,COALESCE(json_extract(data,'$.Outcome'),''),COALESCE(json_extract(data,'$.ProgressStage'),'') FROM relay_tasks";
        using var Reader = Command.ExecuteReader();
        var IdList = new List<string>();
        while (Reader.Read())
            if (RelayLimits.IsBlocked((eRelayState)Reader.GetInt32(1), Reader.GetString(2), Reader.GetString(3))) IdList.Add(Reader.GetString(0));
        return IdList;
    }

    public List<RelayTaskSummary> List(int Offset = 0)
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT id,title,state,updated_at,json_extract(data,'$.Outcome') FROM relay_tasks ORDER BY updated_at DESC,id LIMIT $limit OFFSET $offset";
        Command.Parameters.AddWithValue("$limit", RelayLimits.PageSize);
        Command.Parameters.AddWithValue("$offset", Offset);
        using var Reader = Command.ExecuteReader();
        var ResultList = new List<RelayTaskSummary>();
        while (Reader.Read()) ResultList.Add(new(Reader.GetString(0), Reader.GetString(1), (eRelayState)Reader.GetInt32(2), DateTimeOffset.Parse(Reader.GetString(3)), Reader.GetString(4)));
        return ResultList;
    }

    public List<string> PendingIds()
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT id FROM relay_tasks WHERE state IN ($sending,$running,$returning)";
        Command.Parameters.AddWithValue("$sending", (int)eRelayState.Sending);
        Command.Parameters.AddWithValue("$running", (int)eRelayState.Running);
        Command.Parameters.AddWithValue("$returning", (int)eRelayState.Returning);
        using var Reader = Command.ExecuteReader();
        var IdList = new List<string>();
        while (Reader.Read()) IdList.Add(Reader.GetString(0));
        return IdList;
    }

    public bool HasBlockingTask()
    {
        using var Database = Open();
        return Convert.ToInt64(ConversationDatabase.Scalar(Database, "SELECT COUNT(*) FROM relay_tasks WHERE state IN ($sending,$running,$returning,$dispatchUncertain,$returnUncertain)", ("$sending", (int)eRelayState.Sending), ("$running", (int)eRelayState.Running), ("$returning", (int)eRelayState.Returning), ("$dispatchUncertain", (int)eRelayState.DispatchUncertain), ("$returnUncertain", (int)eRelayState.ReturnUncertain))) != 0;
    }

    public List<RelaySlot> BlockingSlots()
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT json_extract(data,'$.Channel.MainInstance.Id'),json_extract(data,'$.Channel.MainThreadId'),json_extract(data,'$.Channel.WorkerInstance.Id'),json_extract(data,'$.Channel.WorkerThreadId'),COALESCE(json_extract(data,'$.SessionMax'),1),COALESCE(json_extract(data,'$.CrossAgentMax'),1) FROM relay_tasks WHERE " + BlockingPredicate;
        using var Reader = Command.ExecuteReader();
        var ResultList = new List<RelaySlot>();
        while (Reader.Read()) ResultList.Add(new(Reader.GetString(0), Reader.GetString(1), Reader.GetString(2), Reader.GetString(3), Reader.GetInt32(4), Reader.GetInt32(5)));
        return ResultList;
    }

    public RelayTask? IncomingTask(string InstanceId, string ThreadId)
    {
        using var Database = Open();
        object? Data = ConversationDatabase.Scalar(Database, "SELECT data FROM relay_tasks WHERE " + BlockingPredicate + " AND json_extract(data,'$.Channel.WorkerInstance.Id')=$instance AND json_extract(data,'$.Channel.WorkerThreadId')=$thread", ("$instance", InstanceId), ("$thread", ThreadId));
        return Data is string Text ? JsonSerializer.Deserialize<RelayTask>(Text) ?? throw new InvalidDataException("联调任务数据为空") : null;
    }

    public List<string> UnfinishedChildIds(string ParentTaskId)
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT id FROM relay_tasks WHERE state NOT IN ($accepted,$cancelled) AND json_extract(data,'$.ParentTaskId')=$parent";
        Command.Parameters.AddWithValue("$accepted", (int)eRelayState.Accepted);
        Command.Parameters.AddWithValue("$cancelled", (int)eRelayState.Cancelled);
        Command.Parameters.AddWithValue("$parent", ParentTaskId);
        using var Reader = Command.ExecuteReader();
        var IdList = new List<string>();
        while (Reader.Read()) IdList.Add(Reader.GetString(0));
        return IdList;
    }

    private RelayTask? Find(string Column, string Value)
    {
        using var Database = Open();
        object? Data = ConversationDatabase.Scalar(Database, "SELECT data FROM relay_tasks WHERE " + Column + "=$value", ("$value", Value));
        return Data is string Text ? JsonSerializer.Deserialize<RelayTask>(Text) ?? throw new InvalidDataException("联调任务数据为空") : null;
    }

    private SqliteConnection Open()
    {
        var Database = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = Path.Combine(Root, "tasks.sqlite"), Pooling = false }.ToString());
        try { Database.Open(); ConversationDatabase.Execute(Database, "PRAGMA busy_timeout=5000; PRAGMA cache_size=-512;"); return Database; }
        catch { Database.Dispose(); throw; }
    }
}
