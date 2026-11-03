namespace CodexInstanceManager;

public sealed record RelayValidity(bool Invalid, string Reason, bool Unchecked = false);
public sealed record RelayInvalidTask(string Id, string Title, string Reason);
public sealed record RelayInvalidScan(int CheckedCount, List<RelayInvalidTask> InvalidList, List<RelayInvalidTask> UncheckedList);

public enum eRelayActivity { Active, Idle, Unknown }
public sealed record RelayActivity(eRelayActivity State, string Detail);

public interface IRelayActivityProbe
{
    Task<RelayActivity> ReadAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation);
}

public sealed class RelayActivityProbe : IRelayActivityProbe
{
    private readonly CursorRelayRunner? Cursor;
    /// <summary> DSH 连接覆盖配置 </summary>
    private readonly DshSettings Dsh;
    private Task<List<RunningInstance>>? Running;
    private readonly Dictionary<string, Task<RelayActivity>> CacheDict = new();

    public RelayActivityProbe(CursorRelayRunner? Cursor, DshSettings? Dsh = null) { this.Cursor = Cursor; this.Dsh = Dsh ?? new(); }

    public Task<RelayActivity> ReadAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation)
    {
        string Key = Instance.Id + "/" + ThreadId;
        if (!CacheDict.TryGetValue(Key, out var Result)) CacheDict.Add(Key, Result = ProbeAsync(Instance, ThreadId, Cancellation));
        return Result;
    }

    private async Task<RelayActivity> ProbeAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation)
    {
        if (ThreadId.Length == 0) return new(eRelayActivity.Unknown, "会话创建结果尚未确认");
        if (Instance.Id == DshRelayRunner.InstanceId)
        {
            try
            {
                using var Client = await DshDesktopClient.ConnectAsync(new() { HomePath = Instance.HomePath, ServerUrl = Dsh.ServerUrl }, Cancellation);
                var Session = await Client.SessionAsync(ThreadId, Cancellation);
                return new(Session.Running ? eRelayActivity.Active : eRelayActivity.Idle, "DSH 桌面会话状态");
            }
            catch (Exception Error) when (!Cancellation.IsCancellationRequested) { return new(eRelayActivity.Unknown, "DSH 活动状态未确认 " + Error.Message); }
        }
        if (Instance.Id == CursorRelayRunner.InstanceId) return Cursor is null ? new(eRelayActivity.Unknown, "Cursor 执行端未连接") : new(Cursor.IsRunning(ThreadId) ? eRelayActivity.Active : eRelayActivity.Idle, "Cursor 执行进程");
        Running ??= Task.Run(InstanceService.ListRunning, Cancellation);
        if (InstanceService.Find(Instance, await Running) is null) return new(eRelayActivity.Idle, "Codex 实例未运行");
        try
        {
            var Data = await DesktopRelayBridge.CallAsync(Instance, ThreadId, "read_thread", new { threadId = ThreadId, hostId = "local", turnLimit = 1, includeOutputs = false, maxOutputCharsPerItem = 0 }, Cancellation);
            string State = Data.GetProperty("thread").GetProperty("status").GetProperty("type").GetString()!;
            return State switch
            {
                "active" => new(eRelayActivity.Active, "Codex 正在执行"),
                "idle" or "notLoaded" => new(eRelayActivity.Idle, "Codex 会话没有活动执行"),
                _ => new(eRelayActivity.Unknown, "无法确认 Codex 活动状态 " + State)
            };
        }
        catch (Exception Error) when (Error is IOException or InvalidOperationException or System.Text.Json.JsonException or KeyNotFoundException) { return new(eRelayActivity.Unknown, "活动状态读取失败 " + Error.Message); }
        catch (OperationCanceledException) when (!Cancellation.IsCancellationRequested) { return new(eRelayActivity.Unknown, "活动状态检查超时"); }
    }
}

public sealed class RelayTaskValidator
{
    private readonly ManagerSettings Settings;
    private readonly RelayStore Store;
    private readonly IRelayActivityProbe Probe;

    public RelayTaskValidator(ManagerSettings Settings, RelayStore Store, CursorRelayRunner? Cursor, IRelayActivityProbe? Probe = null)
    {
        this.Settings = Settings;
        this.Store = Store;
        this.Probe = Probe ?? new RelayActivityProbe(Cursor, Settings.Dsh);
    }

    public async Task<RelayValidity> CheckAsync(RelayTask Item)
    {
        if (Item.State is not (eRelayState.Running or eRelayState.Recovering or eRelayState.Returned) || Item.State == eRelayState.Returned && Item.Outcome != "completed") return new(false, "");
        var EndpointList = new List<(InstanceProfile Instance, string Thread)> { (Item.Channel.MainInstance, Item.Channel.MainThreadId), (Item.Channel.WorkerInstance, Item.Channel.WorkerThreadId) };
        var Pending = new Queue<string>();
        var SeenHashList = new HashSet<string> { Item.Id };
        Pending.Enqueue(Item.Id);
        while (Pending.TryDequeue(out string? Parent))
            foreach (string ChildId in Store.UnfinishedChildIds(Parent))
                if (SeenHashList.Add(ChildId))
                {
                    var Child = Store.Get(ChildId);
                    EndpointList.Add((Child.Channel.WorkerInstance, Child.Channel.WorkerThreadId));
                    Pending.Enqueue(ChildId);
                }
        string Unknown = "";
        foreach (var Endpoint in EndpointList.DistinctBy(Value => (Value.Instance.Id, Value.Thread)))
        {
            var Profile = Endpoint.Instance.Id == DshRelayRunner.InstanceId ? Endpoint.Instance : Endpoint.Instance.Id == CursorRelayRunner.InstanceId ? CursorRelayRunner.Profile : Settings.InstanceList.SingleOrDefault(Value => Value.Id == Endpoint.Instance.Id);
            if (Profile is null) continue;
            var Activity = await Probe.ReadAsync(Profile, Endpoint.Thread, CancellationToken.None);
            if (Activity.State == eRelayActivity.Active) return new(false, "主会话或下级仍有活动执行");
            if (Activity.State == eRelayActivity.Unknown) Unknown = Activity.Detail;
        }
        return Unknown.Length == 0 ? new(true, "主会话与所有未结束的下级均没有活动执行") : new(false, Unknown, true);
    }
}

public sealed partial class RelayStore
{
    public List<string> AllIds()
    {
        using var Database = Open();
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT id FROM relay_tasks ORDER BY updated_at,id";
        using var Reader = Command.ExecuteReader();
        var ResultList = new List<string>();
        while (Reader.Read()) ResultList.Add(Reader.GetString(0));
        return ResultList;
    }
}

public sealed partial class RelayCoordinator
{
    public async Task<RelayInvalidScan> CheckInvalidAsync(Func<RelayTask, Task<RelayValidity>> Check)
    {
        await Gate.WaitAsync(Lifetime.Token);
        try
        {
            var InvalidList = new List<RelayInvalidTask>();
            var UncheckedList = new List<RelayInvalidTask>();
            var IdList = Store.AllIds();
            foreach (string Id in IdList)
            {
                var Item = Store.Get(Id);
                var Result = await Check(Item);
                if (Result.Invalid) InvalidList.Add(new(Item.Id, Item.Title, Result.Reason));
                else if (Result.Unchecked) UncheckedList.Add(new(Item.Id, Item.Title, Result.Reason));
            }
            return new(IdList.Count, InvalidList, UncheckedList);
        }
        finally { Gate.Release(); }
    }

    public async Task<int> ClearInvalidAsync(IReadOnlyList<string> IdList, Func<RelayTask, Task<RelayValidity>> Check)
    {
        await Gate.WaitAsync(Lifetime.Token);
        try
        {
            int Removed = 0;
            var ConfirmedList = new List<string>();
            foreach (string Id in IdList.Distinct())
            {
                var Candidate = Store.FindTask(Id);
                if (Candidate is not null && (await Check(Candidate)).Invalid) ConfirmedList.Add(Id);
            }
            foreach (string Id in ConfirmedList)
            {
                var Item = Store.Get(Id);
                if (Item.State is not (eRelayState.Accepted or eRelayState.Cancelled))
                {
                    StopDeadline(Id);
                    Cursor?.Stop(Id);
                    Dsh?.Stop(Id);
                    CancelDescendants(Id);
                    Change(Item, eRelayState.Cancelled, "已核实主子 Agent 均无活动执行 用户确认清理记录 后续回报不再接收");
                }
                Store.DeleteFinished(Id);
                Removed++;
            }
            Changed?.Invoke();
            return Removed;
        }
        finally { Gate.Release(); }
    }
}
