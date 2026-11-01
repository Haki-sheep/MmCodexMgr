using CodexInstanceManager;

internal static class RelayInvalidTaskTests
{
    public static async Task<int> LiveProbeAsync()
    {
        string Home = Environment.GetEnvironmentVariable("CODEX_HOME") ?? ManagerPaths.DefaultHome;
        string ThreadId = Environment.GetEnvironmentVariable("CODEX_THREAD_ID") ?? throw new InvalidOperationException("Missing current Codex thread identity");
        var Instance = SettingsStore.Load().InstanceList.Single(Item => ManagerPaths.Same(Item.HomePath, Home));
        using var Cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(60));
        var Result = await new RelayActivityProbe(null).ReadAsync(Instance, ThreadId, Cancellation.Token);
        if (Result.State != eRelayActivity.Active) throw new Exception("FAILED live activity: current working Codex thread classified as " + Result.State + " " + Result.Detail);
        Console.WriteLine("PASS live activity probe: current Codex thread is active");
        return 0;
    }

    public static async Task RunAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "RelayActivityCleanup-" + Guid.NewGuid().ToString("N"));
        var Store = new RelayStore(Root);
        var Main = new InstanceProfile { Id = "main" };
        var Worker = new InstanceProfile { Id = "worker" };
        var Settings = new ManagerSettings { InstanceList = new() { Main, Worker } };
        using var Coordinator = new RelayCoordinator(Store, new NoDelivery());
        var Probe = new ActivityProbe();
        var Validator = new RelayTaskValidator(Settings, Store, null, Probe);
        RelayTask Add(string Name, eRelayState State = eRelayState.Running, string Parent = "")
        {
            var Item = new RelayTask { RequestKey = Name, Title = Name, State = State, ParentTaskId = Parent, Channel = new() { MainInstance = Main, WorkerInstance = Worker, MainThreadId = Name + "-main", WorkerThreadId = Name + "-worker" } };
            Store.Save(Item);
            return Item;
        }
        var StaleList = Enumerable.Range(0, 55).Select(Index => Add("stale-" + Index)).ToList();
        var ActiveMain = Add("active-main");
        Probe.StateDict[ActiveMain.Channel.MainThreadId] = eRelayActivity.Active;
        var ActiveWorker = Add("active-worker");
        Probe.StateDict[ActiveWorker.Channel.WorkerThreadId] = eRelayActivity.Active;
        var Unknown = Add("unknown");
        Probe.StateDict[Unknown.Channel.WorkerThreadId] = eRelayActivity.Unknown;
        var Parent = Add("parent");
        var Child = Add("child", Parent: Parent.Id);
        Probe.StateDict[Child.Channel.WorkerThreadId] = eRelayActivity.Active;
        var Accepted = Add("accepted", eRelayState.Accepted);
        var Decision = Add("decision", eRelayState.Returned);
        Decision.Outcome = "needs_decision";
        Store.Save(Decision);
        var Returned = Add("returned", eRelayState.Returned);
        Returned.Outcome = "completed";
        Store.Save(Returned);
        var Scan = await Coordinator.CheckInvalidAsync(Validator.CheckAsync);
        Require(Scan.CheckedCount == Store.Count() && Scan.InvalidList.Count == 56, "all pages are checked using actual main and child activity");
        Require(Scan.UncheckedList.Count == 1 && Scan.UncheckedList[0].Id == Unknown.Id, "unknown activity remains unclassified");
        Require(Scan.InvalidList.All(Item => Item.Id != Parent.Id && Item.Id != Child.Id && Item.Id != ActiveMain.Id && Item.Id != ActiveWorker.Id), "activity on either endpoint or descendants preserves the task");
        Probe.StateDict[StaleList[0].Channel.WorkerThreadId] = eRelayActivity.Active;
        int Removed = await Coordinator.ClearInvalidAsync(Scan.InvalidList.Select(Item => Item.Id).ToList(), Validator.CheckAsync);
        Require(Removed == 55 && Store.FindTask(StaleList[0].Id) is not null, "cleanup rechecks activity and preserves tasks that restarted after preview");
        Require(Store.FindTask(Returned.Id) is null && Store.FindTask(Accepted.Id) is not null && Store.FindTask(Decision.Id) is not null, "stale execution labels clear while accepted and decision records are retained");
        Require(Store.Get(Parent.Id).State == eRelayState.Running && Store.Get(Child.Id).State == eRelayState.Running, "live parent and child states are unchanged");
        Console.WriteLine("PASS invalid task activity cleanup 6 assertions; fixture=" + Root);
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED invalid activity cleanup: " + Message);
    }

    private sealed class ActivityProbe : IRelayActivityProbe
    {
        public Dictionary<string, eRelayActivity> StateDict = new();
        public Task<RelayActivity> ReadAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation) => Task.FromResult(new RelayActivity(StateDict.GetValueOrDefault(ThreadId, eRelayActivity.Idle), "fixture"));
    }

    private sealed class NoDelivery : IRelayBridge
    {
        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation) => throw new Exception("Activity cleanup must not send prompts or start models");
    }
}
