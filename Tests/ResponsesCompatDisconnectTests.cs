using System.Net;
using System.Net.Sockets;
using System.Text;
using CodexInstanceManager;

internal static class ResponsesCompatDisconnectTests
{
    public static async Task RunSupervisorAsync(string CliPath)
    {
        string Root = Path.Combine(Path.GetTempPath(), "MmCodexCompatSupervisor-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        var Instance = new InstanceProfile { Id = "supervisor-test", HomePath = Root };
        string Original = "model='keep-model'\nmodel_provider='custom'\n[model_providers.custom]\nbase_url='https://opencode.ai/zen/go/v1'\nexperimental_bearer_token='fixture-secret'\n";
        File.WriteAllText(Path.Combine(Root, "config.toml"), Original);
        var Profile = ResponsesCompatProfile.Install(Instance, CliPath);
        var Failures = new System.Collections.Concurrent.ConcurrentQueue<Exception>();
        using var Client = new HttpClient(new SocketsHttpHandler { UseProxy = false }) { Timeout = TimeSpan.FromSeconds(3) };
        async Task<int> ProcessIdAsync()
        {
            var Body = await Client.GetStringAsync(Profile.LocalUrl + "/health");
            using var Json = System.Text.Json.JsonDocument.Parse(Body);
            if (Json.RootElement.GetProperty("id").GetString() != Profile.Id) throw new Exception("FAILED supervisor: wrong service identity");
            return Json.RootElement.GetProperty("process_id").GetInt32();
        }
        int OriginalProcessId = await ProcessIdAsync();
        using var Supervisor = new ResponsesCompatSupervisor(() => new ManagerSettings { InstanceList = new() { Instance } }, CliPath, Failures.Enqueue);
        try
        {
            using (var Worker = System.Diagnostics.Process.GetProcessById(OriginalProcessId))
            {
                if (!ManagerPaths.Same(Worker.MainModule!.FileName, CliPath)) throw new Exception("FAILED supervisor: refusing to stop a process outside the fixture CLI");
                Worker.Kill();
                await Worker.WaitForExitAsync();
            }
            Console.WriteLine("Stopped fixture compatibility worker PID=" + OriginalProcessId);
            var Timer = System.Diagnostics.Stopwatch.StartNew();
            int RecoveredProcessId = OriginalProcessId;
            while (Timer.Elapsed < TimeSpan.FromSeconds(20))
            {
                try { RecoveredProcessId = await ProcessIdAsync(); }
                catch (Exception Error) when (Error is HttpRequestException or TaskCanceledException) { }
                if (RecoveredProcessId != OriginalProcessId) break;
                await Task.Delay(100);
            }
            if (RecoveredProcessId == OriginalProcessId) throw new Exception("FAILED supervisor: stopped worker was not recovered");
            if (!File.ReadAllText(Path.Combine(Root, "config.toml")).Contains("model='keep-model'")) throw new Exception("FAILED supervisor: model configuration was changed");
            if (Failures.Count != 0) throw new AggregateException("FAILED supervisor: unexpected recovery errors", Failures);
            Console.WriteLine("PASS runtime supervisor recovered the stopped fixture worker with a new PID=" + RecoveredProcessId);
        }
        finally { ResponsesCompatProfile.Remove(Instance); }
    }

    public static async Task RunAsync()
    {
        int UpstreamPort = FreePort();
        var Profile = new ResponsesCompatProfile { Port = FreePort(), UpstreamUrl = "http://127.0.0.1:" + UpstreamPort + "/zen/go/v1" };
        using var Upstream = new HttpListener();
        Upstream.Prefixes.Add("http://127.0.0.1:" + UpstreamPort + "/");
        Upstream.Start();
        var ErrorList = new System.Collections.Concurrent.ConcurrentQueue<Exception>();
        var UploadFailed = new TaskCompletionSource<Exception>(TaskCreationOptions.RunContinuationsAsynchronously);
        using var Lifetime = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var Server = new ResponsesCompatServer(Profile, Error => { ErrorList.Enqueue(Error); UploadFailed.TrySetResult(Error); });
        var Run = Server.RunAsync(Lifetime.Token);
        var Finish = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var Handle = Task.Run(async () =>
        {
            var Context = await Upstream.GetContextAsync().WaitAsync(Lifetime.Token);
            await Context.Request.InputStream.CopyToAsync(Stream.Null, Lifetime.Token);
            Context.Response.ContentType = "text/event-stream";
            Context.Response.SendChunked = true;
            await Context.Response.OutputStream.WriteAsync(Encoding.UTF8.GetBytes("data: initial\n\n"), Lifetime.Token);
            await Context.Response.OutputStream.FlushAsync(Lifetime.Token);
            await Finish.Task.WaitAsync(Lifetime.Token);
            Context.Response.Close();
        });
        try
        {
            using (var Downstream = new TcpClient())
            {
                await Downstream.ConnectAsync(IPAddress.Loopback, Profile.Port, Lifetime.Token);
                string Body = "{\"input\":\"disconnect regression\"}";
                string Request = "POST /responses HTTP/1.1\r\nHost: 127.0.0.1:" + Profile.Port + "\r\nContent-Type: application/json\r\nContent-Length: " + Encoding.UTF8.GetByteCount(Body) + "\r\n\r\n" + Body;
                await Downstream.GetStream().WriteAsync(Encoding.UTF8.GetBytes(Request), Lifetime.Token);
                byte[] BlockList = new byte[4096];
                var Received = new StringBuilder();
                while (!Received.ToString().Contains("data: initial"))
                {
                    int Count = await Downstream.GetStream().ReadAsync(BlockList, Lifetime.Token);
                    if (Count == 0) throw new Exception("FAILED disconnect: stream ended before the test disconnected it");
                    Received.Append(Encoding.UTF8.GetString(BlockList, 0, Count));
                }
                Downstream.Client.LingerState = new LingerOption(true, 0);
            }
            Finish.SetResult();
            await Handle;
            using var Client = new HttpClient(new SocketsHttpHandler { UseProxy = false }) { Timeout = TimeSpan.FromSeconds(3) };
            using var Response = await Client.GetAsync(Profile.LocalUrl + "/health", Lifetime.Token);
            if (!Response.IsSuccessStatusCode || Run.IsCompleted) throw new Exception("FAILED disconnect: disconnect terminated the shared listener");
            Console.WriteLine("PASS client reset after final SSE chunk leaves the shared listener alive; observed errors=" + ErrorList.Count);
            using (var Upload = new TcpClient())
            {
                await Upload.ConnectAsync(IPAddress.Loopback, Profile.Port, Lifetime.Token);
                string Headers = "POST /responses HTTP/1.1\r\nHost: 127.0.0.1:" + Profile.Port + "\r\nContent-Type: application/json\r\nContent-Length: 1024\r\nExpect: 100-continue\r\n\r\n";
                await Upload.GetStream().WriteAsync(Encoding.UTF8.GetBytes(Headers), Lifetime.Token);
                byte[] ContinueList = new byte[512];
                int Count = await Upload.GetStream().ReadAsync(ContinueList, Lifetime.Token);
                if (!Encoding.UTF8.GetString(ContinueList, 0, Count).Contains("100 Continue")) throw new Exception("FAILED disconnect: upload was not admitted before cancellation");
                Upload.Client.LingerState = new LingerOption(true, 0);
            }
            var UploadError = await UploadFailed.Task.WaitAsync(Lifetime.Token);
            Console.WriteLine("Observed real upload disconnect: " + UploadError.GetType().Name + " " + UploadError.Message);
            using var AfterReset = await Client.GetAsync(Profile.LocalUrl + "/health", Lifetime.Token);
            if (!AfterReset.IsSuccessStatusCode || Run.IsCompleted) throw new Exception("FAILED disconnect: partial upload reset terminated the shared listener");
            Console.WriteLine("PASS reset during request upload leaves the shared listener alive");
        }
        finally
        {
            Finish.TrySetResult();
            Lifetime.Cancel();
            await Run;
        }
    }

    private static int FreePort()
    {
        var Reservation = new TcpListener(IPAddress.Loopback, 0);
        Reservation.Start();
        int Port = ((IPEndPoint)Reservation.LocalEndpoint).Port;
        Reservation.Stop();
        return Port;
    }
}
