namespace CodexInstanceManager;

public sealed class ResponsesCompatSupervisor : IDisposable
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(5);
    private readonly CancellationTokenSource Lifetime = new();
    private readonly Task Monitor;

    public ResponsesCompatSupervisor(Func<ManagerSettings> LoadSettings, string CliPath, Action<Exception> ReportFailure)
    {
        Monitor = Task.Run(async () =>
        {
            using var Timer = new PeriodicTimer(CheckInterval);
            try
            {
                do
                {
                    foreach (var Instance in LoadSettings().InstanceList)
                    {
                        if (Lifetime.IsCancellationRequested) return;
                        try
                        {
                            if (ResponsesCompatProfile.EnsureRunning(Instance, CliPath))
                                File.AppendAllText(Path.Combine(Instance.HomePath, ResponsesCompatProfile.LogName), DateTimeOffset.Now.ToString("O") + " 管理器守护已启动或恢复协议适配服务" + Environment.NewLine);
                        }
                        catch (Exception Error) when (Error is IOException or InvalidOperationException or TimeoutException or HttpRequestException or TaskCanceledException or System.Text.Json.JsonException or System.ComponentModel.Win32Exception)
                        {
                            ReportFailure(new IOException("协议适配守护失败 实例 " + Instance.Id, Error));
                        }
                    }
                }
                while (await Timer.WaitForNextTickAsync(Lifetime.Token));
            }
            catch (OperationCanceledException) when (Lifetime.IsCancellationRequested) { }
        });
    }

    public void Dispose()
    {
        Lifetime.Cancel();
        try { Monitor.GetAwaiter().GetResult(); }
        finally { Lifetime.Dispose(); }
    }
}
