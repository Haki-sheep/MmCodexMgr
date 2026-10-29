namespace CodexInstanceManager;

public sealed partial class DesktopRelayBridge
{
    private static readonly SemaphoreSlim LaunchGate = new(1, 1);

    public async Task OpenAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation)
    {
        new AgentCatalog().Session(Instance, ThreadId);
        await EnsureAvailableAsync(Instance, Cancellation);
        await CallAsync(Instance, ThreadId, "navigate_to_codex_page", new { threadId = ThreadId }, Cancellation);
    }

    public async Task<bool> PrepareResumeAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation)
    {
        await OpenAsync(Instance, ThreadId, Cancellation);
        var Data = await CallAsync(Instance, ThreadId, "read_thread", new { threadId = ThreadId, hostId = "local", turnLimit = 1, includeOutputs = false, maxOutputCharsPerItem = 0 }, Cancellation);
        string Status = Data.GetProperty("thread").GetProperty("status").GetProperty("type").GetString()!;
        return Status switch
        {
            "idle" => true,
            "active" => false,
            _ => throw new InvalidOperationException("恢复会话未就绪 当前状态 " + Status)
        };
    }

    private static async Task EnsureAvailableAsync(InstanceProfile Instance, CancellationToken Cancellation)
    {
        using var Startup = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        Startup.CancelAfter(TimeSpan.FromSeconds(25));
        await LaunchGate.WaitAsync(Startup.Token);
        try
        {
            var Running = await Task.Run(() => InstanceService.Find(Instance, InstanceService.ListRunning()), Startup.Token);
            if (Running is null) await Task.Run(() => InstanceService.Launch(Instance), Startup.Token);
            while (true)
            {
                try
                {
                    using var Client = await ConnectAsync(Instance, Startup.Token);
                    return;
                }
                catch (DesktopUnavailableException) when (!Startup.IsCancellationRequested)
                {
                    await Task.Delay(250, Startup.Token);
                }
            }
        }
        catch (OperationCanceledException Error) when (!Cancellation.IsCancellationRequested)
        {
            throw new TimeoutException("等待实例桌面桥接就绪超时 " + Instance.Name, Error);
        }
        finally { LaunchGate.Release(); }
    }

    private sealed class DesktopUnavailableException : IOException
    {
        public DesktopUnavailableException(string Message) : base(Message) { }
    }
}
