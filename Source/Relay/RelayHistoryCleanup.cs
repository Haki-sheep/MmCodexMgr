namespace CodexInstanceManager;

public sealed partial class RelayCoordinator
{
    public async Task<int> CleanupAsync(string InstanceId, string ThreadId, string State)
    {
        await Gate.WaitAsync(Lifetime.Token);
        try
        {
            var IdList = Store.OwnedCleanupIds(InstanceId, ThreadId, State);
            foreach (string Id in IdList)
            {
                var Item = Store.Get(Id);
                if (Item.State is not (eRelayState.Accepted or eRelayState.Cancelled))
                {
                    StopDeadline(Id);
                    CancelDescendants(Id);
                    Change(Item, eRelayState.Cancelled, "主会话通过 CLI 或 MCP 清理记录 已中断下级联调 模型与脚本需另行停止");
                }
                Store.DeleteFinished(Id);
            }
            Changed?.Invoke();
            return IdList.Count;
        }
        finally { Gate.Release(); }
    }
}

public sealed partial class RelayStore
{
    public List<string> OwnedCleanupIds(string InstanceId, string ThreadId, string State)
    {
        if (State is not ("interrupted" or "blocked" or "finished")) throw new InvalidOperationException("清理状态必须为 interrupted blocked 或 finished");
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT id,state,COALESCE(json_extract(data,'$.Outcome'),''),COALESCE(json_extract(data,'$.ProgressStage'),'') FROM relay_tasks WHERE json_extract(data,'$.Channel.MainInstance.Id')=$instance AND json_extract(data,'$.Channel.MainThreadId')=$thread";
        Command.Parameters.AddWithValue("$instance", InstanceId);
        Command.Parameters.AddWithValue("$thread", ThreadId);
        using var Reader = Command.ExecuteReader();
        var IdList = new List<string>();
        while (Reader.Read())
        {
            var Current = (eRelayState)Reader.GetInt32(1);
            bool Match = State switch
            {
                "interrupted" => Current == eRelayState.Interrupted,
                "finished" => Current is eRelayState.Accepted or eRelayState.Cancelled,
                "blocked" => RelayLimits.IsBlocked(Current, Reader.GetString(2), Reader.GetString(3)),
                _ => throw new ArgumentOutOfRangeException(nameof(State))
            };
            if (Match) IdList.Add(Reader.GetString(0));
        }
        return IdList;
    }
}
