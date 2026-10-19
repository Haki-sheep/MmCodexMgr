using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class RelayStore
{
    public List<RelayReservation> Reservations()
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT id,COALESCE(json_extract(data,'$.ParentTaskId'),''),COALESCE(json_extract(data,'$.TreeRootId'),''),COALESCE(json_extract(data,'$.TreeDepth'),1),COALESCE(json_extract(data,'$.TreeBudget'),'{}'),json_extract(data,'$.Channel.MainInstance.Id'),json_extract(data,'$.Channel.MainThreadId'),json_extract(data,'$.Channel.WorkerInstance.Id'),json_extract(data,'$.Channel.WorkerThreadId'),COALESCE(json_extract(data,'$.Workspace'),'{}') FROM relay_tasks WHERE " + BlockingPredicate;
        using var Reader = Command.ExecuteReader();
        var ResultList = new List<RelayReservation>();
        while (Reader.Read()) ResultList.Add(new(Reader.GetString(0), Reader.GetString(1), Reader.GetString(2), Reader.GetInt32(3), JsonSerializer.Deserialize<RelayTreeBudget>(Reader.GetString(4))!, Reader.GetString(5), Reader.GetString(6), Reader.GetString(7), Reader.GetString(8), JsonSerializer.Deserialize<RelayWorkspace>(Reader.GetString(9))!));
        return ResultList;
    }

    public List<RelayTreeEntry> TreePage(string? ParentId, int Offset = 0)
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT t.id,t.title,t.state,COALESCE(json_extract(t.data,'$.Outcome'),''),COALESCE(json_extract(t.data,'$.ParentTaskId'),''),(SELECT COUNT(*) FROM relay_tasks c WHERE json_extract(c.data,'$.ParentTaskId')=t.id),json_extract(t.data,'$.Channel.MainInstance.Name'),json_extract(t.data,'$.Channel.WorkerInstance.Name'),COALESCE(json_extract(t.data,'$.ProgressStage'),''),COALESCE(json_extract(t.data,'$.ProgressMessage'),''),json_extract(t.data,'$.ProgressAt') FROM relay_tasks t WHERE " +
            (ParentId is null ? "(COALESCE(json_extract(t.data,'$.ParentTaskId'),'')='' OR NOT EXISTS(SELECT 1 FROM relay_tasks p WHERE p.id=json_extract(t.data,'$.ParentTaskId')))" : "json_extract(t.data,'$.ParentTaskId')=$parent") + " ORDER BY t.updated_at DESC,t.id LIMIT $limit OFFSET $offset";
        if (ParentId is not null) Command.Parameters.AddWithValue("$parent", ParentId);
        Command.Parameters.AddWithValue("$limit", RelayLimits.PageSize);
        Command.Parameters.AddWithValue("$offset", Offset);
        using var Reader = Command.ExecuteReader();
        var ResultList = new List<RelayTreeEntry>();
        while (Reader.Read()) ResultList.Add(new(Reader.GetString(0), Reader.GetString(1), (eRelayState)Reader.GetInt32(2), Reader.GetString(3), Reader.GetString(4), Reader.GetInt32(5), Reader.GetString(6), Reader.GetString(7), Reader.GetString(8), Reader.GetString(9), Reader.IsDBNull(10) ? null : DateTimeOffset.Parse(Reader.GetString(10))));
        return ResultList;
    }

    public int RootCount()
    {
        using var Database = Open();
        return Convert.ToInt32(ConversationDatabase.Scalar(Database, "SELECT COUNT(*) FROM relay_tasks t WHERE COALESCE(json_extract(t.data,'$.ParentTaskId'),'')='' OR NOT EXISTS(SELECT 1 FROM relay_tasks p WHERE p.id=json_extract(t.data,'$.ParentTaskId'))"));
    }
}
