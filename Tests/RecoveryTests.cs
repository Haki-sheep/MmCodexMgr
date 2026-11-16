using System.Text.Json;
using CodexInstanceManager;

internal static class RecoveryTests
{
    private static int Count;
    private static readonly string Root = Path.Combine(Path.GetTempPath(), "CodexRecoveryTests-" + Guid.NewGuid().ToString("N"));

    public static void Run() => Task.Run(async () =>
    {
        await VerifyOfflineAsync();
        await VerifyActiveAsync();
        await VerifyOfflineRestartAsync();
        await VerifyFailuresAsync();
        await VerifyCliAsync();
        VerifyRestart();
        Console.WriteLine($"PASS recovery {Count} assertions; fixture={Root}");
    }).GetAwaiter().GetResult();

    public static int LiveProbe()
    {
        try
        {
            string Home = Environment.GetEnvironmentVariable("CODEX_HOME") ?? ManagerPaths.DefaultHome;
            var Instance = SettingsStore.Load().InstanceList.Single(Item => ManagerPaths.Same(Item.HomePath, Home));
            string ThreadId = Environment.GetEnvironmentVariable("CODEX_THREAD_ID") ?? throw new InvalidOperationException("缺少当前会话 ID");
            using var Bridge = new DesktopRelayBridge();
            bool Idle = Bridge.PrepareResumeAsync(Instance, ThreadId, CancellationToken.None).GetAwaiter().GetResult();
            Require(!Idle, "the current active session is opened and recognized without sending another work message");
            Console.WriteLine("PASS live desktop session opening and active-session recovery guard");
            return 0;
        }
        catch (Exception Error) { Console.Error.WriteLine(Error); return 1; }
    }

    #region Verification
    private static async Task VerifyOfflineAsync()
    {
        var Store = new RelayStore(Path.Combine(Root, "offline"));
        var Bridge = new RecoveryBridge { OfflineMain = true };
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        var Parent = await Dispatch(Coordinator, "parent", "main", "worker");
        var Child = await Dispatch(Coordinator, "child", "worker", "child");
        Bridge.RaiseExit("worker");
        await Until(() => Store.Get(Parent.Id).EventList.Last().Contains("异常详情已保留"));
        var Blocked = Store.Get(Parent.Id);
        Require(Blocked.State == eRelayState.Interrupted && Blocked.RecoveryCount == 0 && Blocked.WorkerOffline, "offline worker is marked resumable without launching or consuming a recovery attempt");
        Require(Bridge.PrepareCount == 0 && Bridge.SentList.Count == 2 && Store.Get(Child.Id).State == eRelayState.Running, "offline notification does not start either instance or interrupt the child");
        await Coordinator.ResumeAsync("main", "main", Parent.Id);
        Require(Store.Get(Parent.Id).State == eRelayState.Running && Store.Get(Parent.Id).RecoveryCount == 1 && Bridge.SentList.Last().Prompt.Contains(Child.Id), "explicit resume retains the original task and its child");
        Bridge.RaiseExit("worker");
        await Until(() => Store.Get(Parent.Id).State == eRelayState.Interrupted);
        await Coordinator.ReportAsync("child", "child", Child.Id, "completed", "下级证据", new());
        await Coordinator.ReviewAsync("worker", "worker", Child.Id);
        await Coordinator.ReportAsync("worker", "worker", Parent.Id, "completed", "离线前完成", new());
        Require(Store.Get(Parent.Id).State == eRelayState.ReturnUncertain &&
            Store.Inbox("main", "main", "").Any(Item => Item.Id == Parent.Id), "late callback stays in the inbox when its coordinator is offline");
    }

    private static async Task VerifyActiveAsync()
    {
        var Store = new RelayStore(Path.Combine(Root, "active"));
        var Bridge = new RecoveryBridge { Idle = false };
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        var Item = await Dispatch(Coordinator, "active", "main", "worker");
        var Online = new RecoveryBridge();
        using (var Reattached = new RelayCoordinator(Store, Online))
            Require(Store.Get(Item.Id).State == eRelayState.Running && Online.PrepareCount == 0 && Online.SentList.Count == 0, "manager startup reattaches an active worker without sending or reopening");
        Bridge.RaiseExit("worker");
        await Until(() => Store.Get(Item.Id).State == eRelayState.Interrupted);
        await Coordinator.ResumeAsync("main", "main", Item.Id);
        Require(Bridge.SentList.Count == 2 && Store.Get(Item.Id).State == eRelayState.Running, "manual reattachment to an active original session does not send a continuation");
    }

    private static async Task VerifyOfflineRestartAsync()
    {
        var Store = new RelayStore(Path.Combine(Root, "offline-restart"));
        var Channel = new RelayChannel { MainInstance = Profile("main"), MainThreadId = "main", WorkerInstance = Profile("worker"), WorkerThreadId = "worker", TimeoutMinutes = 0 };
        var Pending = new RelayTask { RequestKey = "offline-restart", State = eRelayState.Running, Channel = Channel };
        var Result = new RelayTask { RequestKey = "queued-restart", State = eRelayState.Returning, ReturnNotificationQueued = true, Outcome = "completed", Result = "已落盘", Channel = Channel };
        Store.Save(Pending);
        Store.Save(Result);
        var Bridge = new RecoveryBridge { OfflineMain = true, OfflineWorker = true };
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        Coordinator.StartQueuedReturns();
        await Until(() => Store.Get(Pending.Id).State == eRelayState.Interrupted && Store.Get(Result.Id).State == eRelayState.ReturnUncertain);
        Require(Bridge.PrepareCount == 0 && Bridge.SentList.Count == 0, "offline startup and queued notification use no launch-capable path");
        Require(Store.Inbox("main", "main", "").Single().Id == Result.Id && Store.Get(Pending.Id).WorkerOffline, "restart preserves the inbox and offline task for explicit recovery");
    }

    private static async Task VerifyFailuresAsync()
    {
        foreach (bool DuringSend in new[] { false, true })
        {
            var Store = new RelayStore(Path.Combine(Root, "failure-" + DuringSend));
            var Bridge = new RecoveryBridge();
            using var Coordinator = new RelayCoordinator(Store, Bridge);
            var Item = await Dispatch(Coordinator, "failure", "main", "worker");
            Bridge.RaiseExit("worker");
            await Until(() => Store.Get(Item.Id).EventList.Last().Contains("异常通知"));
            Bridge.FailPrepare = !DuringSend;
            Bridge.FailSend = DuringSend;
            try { await Coordinator.ResumeAsync("main", "main", Item.Id); throw new InvalidOperationException("expected failure"); }
            catch (IOException Error) when (Error.Message.StartsWith("fixture ")) { }
            var Expected = DuringSend ? eRelayState.DispatchUncertain : eRelayState.Interrupted;
            Require(Store.Get(Item.Id).State == Expected, "explicit resume preserves the correct pre-send or uncertain state");
            Require(Store.Get(Item.Id).EventList.Any(Value => Value.Contains(DuringSend ? "fixture send uncertainty" : "fixture startup failed")), "recovery persists the original failure context");
            if (DuringSend)
            {
                await Reject(() => Coordinator.ResumeAsync("main", "main", Item.Id), "uncertain recovery cannot automatically resend");
                Require(Store.HasBlockingTask(), "uncertain continuation reserves its original session for reconciliation");
            }
        }
    }

    private static async Task VerifyCliAsync()
    {
        var Store = new RelayStore(Path.Combine(Root, "cli"));
        var Bridge = new RecoveryBridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        var Settings = new ManagerSettings { InstanceList = new() { Profile("main"), Profile("worker") } };
        var Service = new AgentManagementService(Store, Coordinator, new Catalog(), Environment.ProcessPath!, () => Settings);
        string Pipe = "CodexRecoveryTests-" + Guid.NewGuid().ToString("N");
        using var Host = new RelayHost(Coordinator, Pipe, Service);
        var Item = await Dispatch(Coordinator, "cli", "main", "worker");
        Item.State = eRelayState.Interrupted;
        Store.Save(Item);
        await Reject(() => Service.ExecuteAsync(new("worker", "worker", "agent_resume", JsonSerializer.SerializeToElement(new { task_id = Item.Id })), CancellationToken.None), "worker cannot impersonate the task owner to resume");
        var Opened = await Cli(new[] { "open", "--instance", "worker", "--session-id", "worker" }, Settings, Pipe);
        Require(Opened.GetProperty("opened").GetBoolean() && Bridge.OpenCount == 1 && Bridge.SentList.Count == 1, "CLI opens the original session through the real manager pipe without sending a work message");
        var Resumed = await Cli(new[] { "resume", "--task-id", Item.Id }, Settings, Pipe);
        await Cli(new[] { "resume", "--task-id", Item.Id }, Settings, Pipe);
        Require(Resumed.GetProperty("task_id").GetString() == Item.Id && Bridge.PrepareCount == 1 && Bridge.SentList.Count == 2 && Store.Count() == 1, "CLI retry acknowledges an already resumed task without creating or sending again");
        await Coordinator.CancelAsync(Item.Id);
        await Reject(() => Coordinator.ResumeAsync("main", "main", Item.Id), "cancelled tasks are never revived");
        var Conflict = await Dispatch(Coordinator, "conflict", "main", "worker");
        Conflict.State = eRelayState.Interrupted;
        Store.Save(Conflict);
        await Dispatch(Coordinator, "occupant", "other", "worker");
        await Reject(() => Coordinator.ResumeAsync("main", "main", Conflict.Id), "recovery cannot steal a session assigned to another task");
        Require(Bridge.PrepareCount == 1, "ownership conflict is rejected before opening or sending to desktop");
    }

    private static void VerifyRestart()
    {
        var Store = new RelayStore(Path.Combine(Root, "restart"));
        var Preparing = new RelayTask { RequestKey = "preparing", State = eRelayState.Recovering };
        var Sending = new RelayTask { RequestKey = "sending", State = eRelayState.DispatchUncertain };
        Store.Save(Preparing);
        Store.Save(Sending);
        var Bridge = new RecoveryBridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        Require(Store.Get(Preparing.Id).State == eRelayState.Interrupted && Store.Get(Sending.Id).State == eRelayState.DispatchUncertain && Bridge.SentList.Count == 0, "manager restart distinguishes unsent preparation from uncertain delivery and never replays blindly");
    }
    #endregion

    #region Fixtures
    private static InstanceProfile Profile(string Id) => new() { Id = Id, Name = Id, HomePath = Path.Combine(Root, Id) };
    private static Task<RelayTask> Dispatch(RelayCoordinator Coordinator, string Key, string Main, string Worker) => Coordinator.DispatchAsync(Main, Main, Key, Key, "原任务要求", "原验收", new() { MainInstance = Profile(Main), WorkerInstance = Profile(Worker), MainThreadId = Main, WorkerThreadId = Worker }, CrossAgentMax: 4, TreeBudget: new() { MaxSessions = 4, MaxDepth = 3 }, Workspace: new() { Access = "write", WritePathList = new() { Path.Combine(Root, "workspace") } });

    private static async Task<JsonElement> Cli(string[] Arguments, ManagerSettings Settings, string Pipe)
    {
        using var Input = new MemoryStream();
        using var Output = new MemoryStream();
        using var Error = new StringWriter();
        int Exit = await AgentCli.RunAsync(Arguments.Concat(new[] { "--caller-instance", "main", "--caller-thread", "main" }).ToArray(), Input, Output, Error, Environment.ProcessPath!, CancellationToken.None, Pipe, () => Settings);
        if (Exit != 0) throw new InvalidOperationException(Error.ToString());
        using var Data = JsonDocument.Parse(Output.ToArray());
        return Data.RootElement.Clone();
    }

    private static async Task Until(Func<bool> Condition)
    {
        using var Timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        while (!Condition()) await Task.Delay(10, Timeout.Token);
    }

    private sealed class RecoveryBridge : IRelayBridge, IRelayProcessEvents, IRelayRecoveryBridge
    {
        public event Action<string>? InstanceExited;
        public List<(string Thread, string Prompt)> SentList { get; } = new();
        public bool Idle { get; init; } = true;
        public bool OfflineMain { get; init; }
        public bool OfflineWorker { get; init; }
        public bool FailPrepare { get; set; }
        public bool FailSend { get; set; }
        public int PrepareCount { get; private set; }
        public int OpenCount { get; private set; }
        public void RaiseExit(string InstanceId) => InstanceExited?.Invoke(InstanceId);
        public Task WatchAsync(InstanceProfile Instance, CancellationToken Cancellation)
        {
            if (OfflineWorker) RaiseExit(Instance.Id);
            return Task.CompletedTask;
        }
        public Task OpenAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation) { OpenCount++; return Task.CompletedTask; }
        public Task<bool> PrepareResumeAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation)
        {
            PrepareCount++;
            if (FailPrepare) throw new IOException("fixture startup failed");
            return Task.FromResult(Idle);
        }
        public Task SendToRunningAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation)
        {
            if (OfflineMain && Instance.Id == "main") throw new DesktopUnavailableException("fixture offline main");
            return SendAsync(Instance, ThreadId, Prompt, Model, Cancellation);
        }
        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation)
        {
            SentList.Add((ThreadId, Prompt));
            if (FailSend) { FailSend = false; throw new IOException("fixture send uncertainty"); }
            return Task.CompletedTask;
        }
    }

    private sealed class Catalog : IAgentCatalog
    {
        public AgentSession Session(InstanceProfile Instance, string Id) => new(Id, Id, "", Root);
        public Task<List<AgentProject>> ProjectsAsync(InstanceProfile Instance, CancellationToken Cancellation) => throw new NotSupportedException();
        public List<AgentSession> Sessions(InstanceProfile Instance, AgentProject? Project, string? Selector, int Offset) => throw new NotSupportedException();
        public Task RequireIdleAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation) => throw new NotSupportedException();
        public Task<RelayThread> CreateAsync(InstanceProfile Instance, AgentProject? Project, string Title, string Prompt, CancellationToken Cancellation) => throw new NotSupportedException();
    }

    private static async Task Reject(Func<Task> Action, string Message)
    {
        try { await Action(); }
        catch (InvalidOperationException) { Count++; return; }
        throw new Exception("FAILED recovery: " + Message);
    }
    private static void Require(bool Condition, string Message) { if (!Condition) throw new Exception("FAILED recovery: " + Message); Count++; }
    #endregion
}
