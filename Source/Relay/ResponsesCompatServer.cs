using System.Net;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed class ResponsesCompatServer : IDisposable
{
    private const int MaxRequestBytes = 64 * 1024 * 1024;
    private readonly HttpListener Listener = new();
    private readonly HttpClient Client;
    private readonly ResponsesCompatProfile Profile;
    private readonly Action<Exception> ReportError;

    public static async Task RunProfileAsync(string ProfilePath, CancellationToken Cancellation)
    {
        string LogPath = Path.Combine(Path.GetDirectoryName(ProfilePath)!, ResponsesCompatProfile.LogName);
        var LogGate = new object();
        void Log(Exception Error)
        {
            lock (LogGate) File.AppendAllText(LogPath, DateTimeOffset.Now.ToString("O") + " " + Error.GetType().Name + " " + Error.Message + Environment.NewLine);
        }
        try
        {
            var Profile = ResponsesCompatProfile.Load(ProfilePath);
            using var Lifetime = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
            using var Watcher = new FileSystemWatcher(Path.GetDirectoryName(ProfilePath)!, Path.GetFileName(ProfilePath));
            Watcher.Deleted += (_, _) => Lifetime.Cancel();
            Watcher.EnableRaisingEvents = true;
            if (!File.Exists(ProfilePath)) throw new FileNotFoundException("协议适配配置已移除", ProfilePath);
            using var Server = new ResponsesCompatServer(Profile, Log);
            File.AppendAllText(LogPath, DateTimeOffset.Now.ToString("O") + " 启动协议适配 " + Profile.LocalUrl + Environment.NewLine);
            await Server.RunAsync(Lifetime.Token);
        }
        catch (Exception Error) { Log(Error); throw; }
    }

    public ResponsesCompatServer(ResponsesCompatProfile Profile, Action<Exception> ReportError)
    {
        this.Profile = Profile;
        this.ReportError = ReportError;
        Client = new HttpClient(new SocketsHttpHandler { AllowAutoRedirect = false, UseCookies = false, AutomaticDecompression = DecompressionMethods.None }) { Timeout = Timeout.InfiniteTimeSpan };
        Listener.Prefixes.Add(Profile.LocalUrl + "/");
    }

    public async Task RunAsync(CancellationToken Cancellation)
    {
        Listener.Start();
        using var Registration = Cancellation.Register(Listener.Stop);
        var PendingHashList = new HashSet<Task>();
        try
        {
            while (!Cancellation.IsCancellationRequested)
            {
                var Context = await Listener.GetContextAsync();
                foreach (var Finished in PendingHashList.Where(Item => Item.IsCompleted).ToArray())
                {
                    await Finished;
                    PendingHashList.Remove(Finished);
                }
                PendingHashList.Add(HandleAsync(Context, Cancellation));
            }
        }
        catch (Exception Error) when (Cancellation.IsCancellationRequested && Error is HttpListenerException or ObjectDisposedException) { }
        finally { await Task.WhenAll(PendingHashList); }
    }

    private async Task HandleAsync(HttpListenerContext Context, CancellationToken Cancellation)
    {
        bool HeadersSent = false;
        try
        {
            var Incoming = Context.Request;
            if (Incoming.HttpMethod == "GET" && Incoming.RawUrl == "/health")
            {
                Context.Response.ContentType = "application/json";
                await Context.Response.OutputStream.WriteAsync(JsonSerializer.SerializeToUtf8Bytes(new { protocol = ResponsesCompatProfile.Protocol, id = Profile.Id }), Cancellation);
                return;
            }
            string? PathValue = Incoming.Url?.AbsolutePath;
            if (Incoming.HttpMethod != "POST" || PathValue is not ("/responses" or "/responses/compact") || Incoming.Url!.Query.Length != 0)
            {
                Context.Response.StatusCode = 404;
                return;
            }
            if (Incoming.ContentLength64 > MaxRequestBytes) throw new InvalidDataException("Responses 请求超过容量限制");
            using var Buffer = new MemoryStream();
            byte[] BlockList = new byte[81920];
            int Count;
            while ((Count = await Incoming.InputStream.ReadAsync(BlockList, Cancellation)) != 0)
            {
                if (Buffer.Length + Count > MaxRequestBytes) throw new InvalidDataException("Responses 请求超过容量限制");
                Buffer.Write(BlockList, 0, Count);
            }
            byte[] Body = ResponsesCompatInput.Rewrite(Buffer.ToArray());
            using var Request = new HttpRequestMessage(HttpMethod.Post, Profile.UpstreamUrl + PathValue) { Content = new ByteArrayContent(Body) };
            foreach (string Key in Incoming.Headers.AllKeys.OfType<string>())
            {
                if (IsTransportHeader(Key) || Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase)) continue;
                string Value = Incoming.Headers[Key]!;
                if (!Request.Headers.TryAddWithoutValidation(Key, Value)) Request.Content.Headers.TryAddWithoutValidation(Key, Value);
            }
            using var Response = await Client.SendAsync(Request, HttpCompletionOption.ResponseHeadersRead, Cancellation);
            Context.Response.StatusCode = (int)Response.StatusCode;
            foreach (var Header in Response.Headers.Concat(Response.Content.Headers))
            {
                if (IsTransportHeader(Header.Key) || Header.Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase)) continue;
                Context.Response.Headers[Header.Key] = string.Join(", ", Header.Value);
            }
            Context.Response.SendChunked = true;
            HeadersSent = true;
            await using var Upstream = await Response.Content.ReadAsStreamAsync(Cancellation);
            while ((Count = await Upstream.ReadAsync(BlockList, Cancellation)) != 0)
            {
                await Context.Response.OutputStream.WriteAsync(BlockList.AsMemory(0, Count), Cancellation);
                await Context.Response.OutputStream.FlushAsync(Cancellation);
            }
        }
        catch (Exception Error)
        {
            ReportError(Error);
            if (HeadersSent) Context.Response.Abort();
            else
            {
                Context.Response.StatusCode = Error is InvalidDataException or JsonException ? 400 : 502;
                Context.Response.ContentType = "application/json";
                try
                {
                    await Context.Response.OutputStream.WriteAsync(JsonSerializer.SerializeToUtf8Bytes(new { error = new { type = "mmcodex_compat_error", message = "本机协议适配失败 请检查 " + ResponsesCompatProfile.LogName } }), Cancellation);
                }
                catch (Exception WriteError) when (WriteError is IOException or HttpListenerException or OperationCanceledException) { ReportError(WriteError); }
            }
        }
        finally { Context.Response.Close(); }
    }

    private static bool IsTransportHeader(string Key) => Key.Equals("Host", StringComparison.OrdinalIgnoreCase) || Key.Equals("Connection", StringComparison.OrdinalIgnoreCase) || Key.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase) || Key.Equals("Keep-Alive", StringComparison.OrdinalIgnoreCase) || Key.Equals("TE", StringComparison.OrdinalIgnoreCase) || Key.Equals("Trailer", StringComparison.OrdinalIgnoreCase) || Key.Equals("Upgrade", StringComparison.OrdinalIgnoreCase) || Key.Equals("Proxy-Authorization", StringComparison.OrdinalIgnoreCase) || Key.Equals("Proxy-Authenticate", StringComparison.OrdinalIgnoreCase);

    public void Dispose() { Listener.Close(); Client.Dispose(); }
}
