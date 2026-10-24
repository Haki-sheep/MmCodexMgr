using System.Text.Json;
using CodexInstanceManager;

internal static class RelayCleanupTests
{
    private static int Count;

    public static async Task RunAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexBlockedCleanup-" + Guid.NewGuid().ToString("N"));
        await VerifyStatesAsync(Path.Combine(Root, "states"));
        await VerifyDescendantsAsync(Path.Combine(Root, "tree"));
        Console.WriteLine($"PASS blocked cleanup {Count} assertions; fixture={Root}");
    }

    private static async Task VerifyStatesAsync(string Root)
    {
        var Store = new RelayStore(Root);
        var Bridge = new FakeBridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        var BlockedList = new List<RelayTask>();
        var PreservedList = new List<RelayTask>();
        foreach (var State in Enum.GetValues<eRelayState>())
        foreach (string Outcome in new[] { "", "completed", "failed", "needs_decision" })
        foreach (string Stage in new[] { "", "started", "progress", "blocked" })
        {
            var Item = new RelayTask { State = State, Outcome = Outcome, ProgressStage = Stage, RequestKey = State + "-" + Outcome + "-" + Stage };
            Store.Save(Item);
            bool Blocked = RelayLimits.ProgressStateText(State, Outcome, Stage) == "已阻塞";
            (Blocked ? BlockedList : PreservedList).Add(Item);
        }
        Require(BlockedList.Count > RelayLimits.PageSize, "fixture includes blocked records beyond one page");
        Require(Store.BlockedIds().ToHashSet().SetEquals(BlockedList.Select(Item => Item.Id)), "cleanup selects exactly the blocked rows shown by the UI across all states and progress stages");
        int Changes = 0;
        Coordinator.Changed += () => Changes++;
        Require(await Coordinator.ClearBlockedHistoryAsync() == BlockedList.Count, "cleanup reports the number of blocked records removed across every page");
        Require(BlockedList.All(Item => Store.FindTask(Item.Id) is null), "all selected blocked records are removed");
        Require(PreservedList.All(Item => JsonSerializer.Serialize(Store.Get(Item.Id)) == JsonSerializer.Serialize(Item)), "unstarted running completed and finished records are preserved byte for byte");
        int ChangesBeforeEmpty = Changes;
        Require(await Coordinator.ClearBlockedHistoryAsync() == 0 && Changes == ChangesBeforeEmpty + 1, "empty cleanup is repeatable and refreshes the page");
        Require(Bridge.SendCount == 0, "cleanup does not send messages or start model requests");
    }

    private static async Task VerifyDescendantsAsync(string Root)
    {
        var Store = new RelayStore(Root);
        var Bridge = new FakeBridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        var Channel = new RelayChannel
        {
            MainInstance = new() { Id = "main" }, WorkerInstance = new() { Id = "worker" },
            MainThreadId = "main-thread", WorkerThreadId = "worker-thread"
        };
        await Coordinator.ConfigureAsync(Channel);
        var Parent = await Coordinator.DispatchAsync("main", "main-thread", "blocked-parent", "阻塞主任务", "处理", "检查");
        await Coordinator.ProgressAsync("worker", "worker-thread", Parent.Id, "blocked", "等待输入");
        var Child = new RelayTask { RequestKey = "active-child", ParentTaskId = Parent.Id, State = eRelayState.Running, ProgressStage = "started", Channel = Channel };
        var Grandchild = new RelayTask { RequestKey = "blocked-grandchild", ParentTaskId = Child.Id, State = eRelayState.ReturnUncertain, Channel = Channel };
        var Finished = new RelayTask { RequestKey = "finished-child", ParentTaskId = Parent.Id, State = eRelayState.Accepted, Channel = Channel };
        foreach (var Item in new[] { Child, Grandchild, Finished }) Store.Save(Item);
        string ArtifactPath = Path.Combine(Root, "artifact.txt");
        File.WriteAllText(ArtifactPath, "产物与对话保留");
        Child.ArtifactList.Add(ArtifactPath);
        Store.Save(Child);
        var IndependentChannel = new RelayChannel
        {
            MainInstance = new() { Id = "other-main" }, WorkerInstance = new() { Id = "other-worker" },
            MainThreadId = "other-main-thread", WorkerThreadId = "other-worker-thread"
        };
        var Independent = await Coordinator.DispatchAsync("other-main", "other-main-thread", "independent", "正常执行", "处理", "检查", IndependentChannel);
        int SendCount = Bridge.SendCount;
        Require(await Coordinator.ClearBlockedHistoryAsync() == 2, "blocked parent and blocked descendant are both removed even when ancestor cancellation changes their states");
        Require(Store.FindTask(Parent.Id) is null && Store.FindTask(Grandchild.Id) is null, "blocked tree records are deleted");
        Require(Store.Get(Child.Id).State == eRelayState.Cancelled && Store.Get(Finished.Id).State == eRelayState.Accepted, "unfinished descendants are cancelled and retained while accepted descendants are unchanged");
        Require(Store.Reservations().All(Item => Item.Id == Independent.Id), "cleanup releases parent and descendant slots while retaining independent active reservations");
        Require(Store.RootCount() == 3, "retained children remain visible as roots after their parent is removed");
        Require(Store.LoadChannel()!.MainThreadId == Channel.MainThreadId && File.ReadAllText(ArtifactPath) == "产物与对话保留", "channel configuration and artifacts are preserved");
        Require(Bridge.SendCount == SendCount, "clearing blocked records does not replay dispatches or callbacks");
        await RequireRejectedAsync(() => Coordinator.ReportAsync("worker", "worker-thread", Parent.Id, "completed", "迟到结果", new()));
        await RequireRejectedAsync(() => Coordinator.ReportAsync("worker", "worker-thread", Child.Id, "completed", "迟到结果", new()));
        await Coordinator.ReportAsync("other-worker", "other-worker-thread", Independent.Id, "completed", "正常完成", new());
        await Coordinator.ReviewAsync("other-main", "other-main-thread", Independent.Id);
        Require(Store.Get(Independent.Id).State == eRelayState.Accepted, "independent active tasks can still report and pass review after cleanup");
    }

    private static async Task RequireRejectedAsync(Func<Task> Action)
    {
        try { await Action(); }
        catch (InvalidOperationException) { Count++; return; }
        throw new Exception("FAILED blocked cleanup: late callback was accepted");
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED blocked cleanup: " + Message);
        Count++;
    }

    private sealed class FakeBridge : IRelayBridge
    {
        public int SendCount { get; private set; }

        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation)
        {
            SendCount++;
            return Task.CompletedTask;
        }
    }
}
