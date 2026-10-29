using System.Text.Json;
using CodexInstanceManager;

internal static class AgentCleanupTests
{
    public static void Run() => Task.Run(VerifyAsync).GetAwaiter().GetResult();

    private static async Task VerifyAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexAgentCleanupTests-" + Guid.NewGuid().ToString("N"));
        var Instance = new InstanceProfile { Id = "instance", HomePath = Root };
        var Settings = new ManagerSettings { InstanceList = new() { Instance } };
        var Store = new RelayStore(Path.Combine(Root, "relay"));
        using var Coordinator = new RelayCoordinator(Store, new Bridge());
        var Service = new AgentManagementService(Store, Coordinator, new Catalog(), Environment.ProcessPath!, () => Settings);
        string Pipe = "CodexAgentCleanupTests-" + Guid.NewGuid().ToString("N");
        using var Host = new RelayHost(Coordinator, Pipe, Service);
        var FixtureList = new List<RelayTask>();
        RelayTask Add(string Thread, eRelayState State, string Stage = "", string Outcome = "")
        {
            var Item = new RelayTask { RequestKey = Guid.NewGuid().ToString("N"), State = State, ProgressStage = Stage, Outcome = Outcome, Channel = new() { MainInstance = Instance, MainThreadId = Thread, WorkerInstance = Instance, WorkerThreadId = Guid.NewGuid().ToString("N") } };
            Store.Save(Item);
            FixtureList.Add(Item);
            return Item;
        }
        for (int Index = 0; Index < RelayLimits.PageSize + 3; Index++) Add("owner", Index % 2 == 0 ? eRelayState.Accepted : eRelayState.Cancelled);
        var Interrupted = Add("owner", eRelayState.Interrupted);
        var Child = Add("child-owner", eRelayState.Running);
        Child.ParentTaskId = Interrupted.Id;
        Store.Save(Child);
        var Running = Add("owner", eRelayState.Running);
        var Preparing = Add("owner", eRelayState.Recovering);
        var Blocked = Add("owner", eRelayState.Running, "blocked");
        var Uncertain = Add("owner", eRelayState.DispatchUncertain);
        var Returned = Add("owner", eRelayState.Returned, Outcome: "completed");
        var FailedReturn = Add("owner", eRelayState.Returned, Outcome: "failed");
        var Foreign = Add("foreign", eRelayState.Accepted);
        var ForeignBlocked = Add("foreign", eRelayState.Interrupted);
        string EvidencePath = Path.Combine(Root, "artifact.txt");
        File.WriteAllText(EvidencePath, "keep project evidence");
        var Finished = await Cli("finished", Settings, Pipe);
        Require(Finished.GetProperty("cleared").GetInt32() == RelayLimits.PageSize + 3 && Store.FindTask(Foreign.Id) is not null, "finished cleanup crosses all pages and preserves another main session's records");
        var Exited = await Cli("interrupted", Settings, Pipe);
        Require(Exited.GetProperty("cleared").GetInt32() == 1 && Store.FindTask(Interrupted.Id) is null && Store.Get(Child.Id).State == eRelayState.Cancelled, "interrupted cleanup removes the owned record and cancels descendants without deleting their history");
        var BlockedResult = await Cli("blocked", Settings, Pipe);
        Require(BlockedResult.GetProperty("cleared").GetInt32() == 3 && Store.FindTask(Blocked.Id) is null && Store.FindTask(Uncertain.Id) is null && Store.FindTask(FailedReturn.Id) is null, "blocked cleanup includes worker blockage uncertain delivery and failed return");
        Require(new[] { Running, Preparing, Returned, Foreign, ForeignBlocked }.All(Item => Store.FindTask(Item.Id)?.State == Item.State) && File.ReadAllText(EvidencePath) == "keep project evidence", "cleanup preserves active recovering successful-return foreign tasks and project artifacts");
        Require((await Cli("finished", Settings, Pipe)).GetProperty("cleared").GetInt32() == 0, "repeating cleanup returns zero without touching descendants owned by a different session");
        bool InvalidRejected = false;
        try { await Coordinator.CleanupAsync(Instance.Id, "owner", "all"); }
        catch (InvalidOperationException) { InvalidRejected = true; }
        Require(InvalidRejected && Store.FindTask(Running.Id) is not null, "unknown cleanup state is rejected before any mutation");
        Console.WriteLine("PASS CLI cleanup 6 assertions; fixture=" + Root);
    }

    private static async Task<JsonElement> Cli(string State, ManagerSettings Settings, string Pipe)
    {
        using var Input = new MemoryStream();
        using var Output = new MemoryStream();
        using var Error = new StringWriter();
        int Exit = await AgentCli.RunAsync(new[] { "cleanup", "--state", State, "--caller-instance", "instance", "--caller-thread", "owner" }, Input, Output, Error, Environment.ProcessPath!, CancellationToken.None, Pipe, () => Settings);
        if (Exit != 0) throw new InvalidOperationException(Error.ToString());
        using var Data = JsonDocument.Parse(Output.ToArray());
        return Data.RootElement.Clone();
    }

    private sealed class Bridge : IRelayBridge
    {
        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation) => throw new InvalidOperationException("cleanup must not send messages");
    }

    private sealed class Catalog : IAgentCatalog
    {
        public AgentSession Session(InstanceProfile Instance, string Id) => new(Id, Id, "", "");
        public Task<List<AgentProject>> ProjectsAsync(InstanceProfile Instance, CancellationToken Cancellation) => throw new NotSupportedException();
        public List<AgentSession> Sessions(InstanceProfile Instance, AgentProject? Project, string? Selector, int Offset) => throw new NotSupportedException();
        public Task RequireIdleAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation) => throw new NotSupportedException();
        public Task<RelayThread> CreateAsync(InstanceProfile Instance, AgentProject? Project, string Title, string Prompt, CancellationToken Cancellation) => throw new NotSupportedException();
    }

    private static void Require(bool Condition, string Message) { if (!Condition) throw new Exception("FAILED CLI cleanup: " + Message); }
}
