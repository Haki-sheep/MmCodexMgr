using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class RelayStore
{
    private static readonly TimeSpan FinishedBoardDuration = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan BlockedBoardDuration = TimeSpan.FromHours(1);
    private static readonly string FinishedBoardPredicate = $"state IN ({(int)eRelayState.Accepted},{(int)eRelayState.Cancelled})";
    private static readonly string BlockedBoardPredicate = $"""
        (state IN ({(int)eRelayState.DispatchUncertain},{(int)eRelayState.ReturnUncertain},{(int)eRelayState.TimedOut},{(int)eRelayState.Interrupted})
        OR (state = {(int)eRelayState.Running} AND COALESCE(json_extract(data,'$.ProgressStage'),'')='blocked')
        OR (state IN ({(int)eRelayState.Returning},{(int)eRelayState.Returned}) AND COALESCE(json_extract(data,'$.Outcome'),'')<>'completed'))
        """;
    private const string BoardRootPredicate = "(COALESCE(json_extract(t.data,'$.ParentTaskId'),'')='' OR NOT EXISTS(SELECT 1 FROM visible p WHERE p.id=json_extract(t.data,'$.ParentTaskId')))";

    private static string BoardRows(eRelayBoardView View) => "WITH visible AS (SELECT id,title,state,updated_at,data FROM relay_tasks WHERE " + (View switch
    {
        eRelayBoardView.All => "1",
        eRelayBoardView.Current => $"(NOT ({FinishedBoardPredicate}) OR updated_at>$finishedCutoff) AND (NOT {BlockedBoardPredicate} OR updated_at>$blockedCutoff)",
        eRelayBoardView.Blocked => BlockedBoardPredicate,
        eRelayBoardView.History => FinishedBoardPredicate,
        _ => throw new ArgumentOutOfRangeException(nameof(View))
    }) + ") ";

    private static void BindBoardCutoffs(Microsoft.Data.Sqlite.SqliteCommand Command, eRelayBoardView View, DateTimeOffset? Now)
    {
        if (View != eRelayBoardView.Current) return;
        var CurrentTime = (Now ?? DateTimeOffset.UtcNow).ToUniversalTime();
        Command.Parameters.AddWithValue("$finishedCutoff", (CurrentTime - FinishedBoardDuration).ToString("O"));
        Command.Parameters.AddWithValue("$blockedCutoff", (CurrentTime - BlockedBoardDuration).ToString("O"));
    }

    public int BoardBlockedCount()
    {
        using var Database = Open();
        return Convert.ToInt32(ConversationDatabase.Scalar(Database, "SELECT COUNT(*) FROM relay_tasks WHERE " + BlockedBoardPredicate));
    }

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

    public List<RelayTreeEntry> TreePage(string? ParentId, int Offset = 0, eRelayBoardView View = eRelayBoardView.All, DateTimeOffset? Now = null)
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = BoardRows(View) + "SELECT t.id,t.title,t.state,COALESCE(json_extract(t.data,'$.Outcome'),''),COALESCE(json_extract(t.data,'$.ParentTaskId'),''),(SELECT COUNT(*) FROM visible c WHERE json_extract(c.data,'$.ParentTaskId')=t.id),json_extract(t.data,'$.Channel.MainInstance.Name'),json_extract(t.data,'$.Channel.WorkerInstance.Name'),COALESCE(json_extract(t.data,'$.ProgressStage'),''),COALESCE(json_extract(t.data,'$.ProgressMessage'),''),json_extract(t.data,'$.ProgressAt'),COALESCE(json_extract(t.data,'$.Channel.MainTitle'),''),COALESCE(json_extract(t.data,'$.Channel.WorkerTitle'),''),json_extract(t.data,'$.Channel.MainInstance.Id'),json_extract(t.data,'$.Channel.WorkerInstance.Id'),json_extract(t.data,'$.Channel.MainThreadId'),json_extract(t.data,'$.Channel.WorkerThreadId') FROM visible t WHERE " +
            (ParentId is null ? BoardRootPredicate : "json_extract(t.data,'$.ParentTaskId')=$parent") + " ORDER BY t.updated_at DESC,t.id LIMIT $limit OFFSET $offset";
        BindBoardCutoffs(Command, View, Now);
        if (ParentId is not null) Command.Parameters.AddWithValue("$parent", ParentId);
        Command.Parameters.AddWithValue("$limit", RelayLimits.PageSize);
        Command.Parameters.AddWithValue("$offset", Offset);
        using var Reader = Command.ExecuteReader();
        var ResultList = new List<RelayTreeEntry>();
        while (Reader.Read()) ResultList.Add(new(Reader.GetString(0), Reader.GetString(1), (eRelayState)Reader.GetInt32(2), Reader.GetString(3), Reader.GetString(4), Reader.GetInt32(5), Reader.GetString(6), Reader.GetString(7), Reader.GetString(8), Reader.GetString(9), Reader.IsDBNull(10) ? null : DateTimeOffset.Parse(Reader.GetString(10))) { MainTitle = Reader.GetString(11), WorkerTitle = Reader.GetString(12), MainInstanceId = Reader.GetString(13), WorkerInstanceId = Reader.GetString(14), MainThreadId = Reader.GetString(15), WorkerThreadId = Reader.GetString(16) });
        return ResultList;
    }

    public int RootCount(eRelayBoardView View = eRelayBoardView.All, DateTimeOffset? Now = null)
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = BoardRows(View) + "SELECT COUNT(*) FROM visible t WHERE " + BoardRootPredicate;
        BindBoardCutoffs(Command, View, Now);
        return Convert.ToInt32(Command.ExecuteScalar());
    }
}
