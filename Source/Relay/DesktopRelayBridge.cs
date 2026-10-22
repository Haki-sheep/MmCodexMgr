using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.Win32.SafeHandles;

namespace CodexInstanceManager;

public interface IRelayBridge
{
    Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation);
}

public interface IRelayProcessEvents
{
    event Action<string>? InstanceExited;
    Task WatchAsync(InstanceProfile Instance, CancellationToken Cancellation);
}

public sealed class DesktopRelayBridge : IRelayBridge, IRelayProcessEvents, IDisposable
{
    private const string DesktopPipePrefix = "codex-app-tools-";
    private readonly System.Collections.Concurrent.ConcurrentDictionary<int, System.Diagnostics.Process> ProcessDict = new();
    private readonly object ProcessGate = new();
    private bool Disposed;
    public event Action<string>? InstanceExited;

    public async Task WatchAsync(InstanceProfile Instance, CancellationToken Cancellation)
    {
        var Running = await Task.Run(() => InstanceService.Find(Instance, InstanceService.ListRunning()), Cancellation);
        if (Disposed || Cancellation.IsCancellationRequested) return;
        if (Running is null) { InstanceExited?.Invoke(Instance.Id); return; }
        System.Diagnostics.Process Process;
        try { Process = System.Diagnostics.Process.GetProcessById(Running.ProcessId); }
        catch (ArgumentException) { InstanceExited?.Invoke(Instance.Id); return; }
        lock (ProcessGate)
        {
            if (Disposed || !ProcessDict.TryAdd(Running.ProcessId, Process)) { Process.Dispose(); return; }
            Process.Exited += (_, _) =>
            {
                if (ProcessDict.TryRemove(Running.ProcessId, out var Exited)) Exited.Dispose();
                if (!Disposed) InstanceExited?.Invoke(Instance.Id);
            };
            try { Process.EnableRaisingEvents = true; }
            catch { if (ProcessDict.TryRemove(Running.ProcessId, out var Failed)) Failed.Dispose(); throw; }
        }
    }

    public void Dispose()
    {
        lock (ProcessGate)
        {
            Disposed = true;
            foreach (var Pair in ProcessDict)
                if (ProcessDict.TryRemove(Pair.Key, out var Process)) Process.Dispose();
        }
    }

    public async Task<List<RelayThread>> ListThreadsAsync(InstanceProfile Instance, CancellationToken Cancellation)
    {
        string CallerThreadId;
        using (var Database = ConversationDatabase.Open(Path.Combine(Instance.HomePath, "state_5.sqlite"), true))
            CallerThreadId = ConversationDatabase.Scalar(Database, "SELECT id FROM threads ORDER BY updated_at DESC LIMIT 1") as string ?? throw new InvalidOperationException("实例尚无本地会话 请先创建会话 " + Instance.Name);
        var Data = await CallAsync(Instance, CallerThreadId, "list_threads", new { limit = 50 }, Cancellation);
        var ResultList = new List<RelayThread>();
        foreach (string Key in new[] { "pinnedThreads", "threads" })
        {
            foreach (var Item in Data.GetProperty(Key).EnumerateArray())
            {
                if (Item.GetProperty("kind").GetString() != "codex" || Item.GetProperty("hostId").GetString() != "local") continue;
                ResultList.Add(new(Item.GetProperty("id").GetString()!, Item.GetProperty("title").GetString()!, Item.GetProperty("status").GetString()!));
            }
        }
        return ResultList;
    }

    public async Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation)
    {
        var Arguments = new Dictionary<string, object> { ["threadId"] = ThreadId, ["hostId"] = "local", ["prompt"] = Prompt };
        if (Model.Length != 0) Arguments["model"] = Model;
        await CallAsync(Instance, ThreadId, "send_message_to_thread", Arguments, Cancellation);
    }

    public static async Task<List<string>> ProbeAsync(InstanceProfile Instance, CancellationToken Cancellation)
    {
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        Timeout.CancelAfter(TimeSpan.FromSeconds(RelayLimits.RequestTimeoutSeconds));
        using var Client = await ConnectAsync(Instance, Timeout.Token);
        await RelayWire.WriteAsync(Client, new { jsonrpc = "2.0", id = "manager-health", method = "tools/list", @params = new { threadStartKind = "all" } }, RelayLimits.MaxDesktopFrameBytes, Timeout.Token);
        var Response = await RelayWire.ReadAsync(Client, RelayLimits.MaxDesktopFrameBytes, Timeout.Token);
        if (Response.TryGetProperty("error", out var Error)) throw new IOException("桥接能力检查失败 " + Error.GetRawText());
        return Response.GetProperty("result").GetProperty("tools").EnumerateArray().Select(Tool => Tool.GetProperty("name").GetString()!).ToList();
    }

    public static async Task<JsonElement> CallAsync(InstanceProfile Instance, string CallerThreadId, string Tool, object Arguments, CancellationToken Cancellation)
    {
        await Task.Run(() => ResponsesCompatProfile.EnsureRunning(Instance, AgentCliDeployment.LoadPath()), Cancellation);
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        Timeout.CancelAfter(TimeSpan.FromSeconds(RelayLimits.RequestTimeoutSeconds));
        using var Client = await ConnectAsync(Instance, Timeout.Token);
        string RequestId = Guid.NewGuid().ToString("N");
        await RelayWire.WriteAsync(Client, new
        {
            jsonrpc = "2.0", id = RequestId, method = "tools/call",
            @params = new { arguments = Arguments, callerSource = "codex", hostId = "local", callId = "manager-" + RequestId, @namespace = "codex_app", threadId = CallerThreadId, tool = Tool, turnId = "manager-" + RequestId }
        }, RelayLimits.MaxDesktopFrameBytes, Timeout.Token);
        var Response = await RelayWire.ReadAsync(Client, RelayLimits.MaxDesktopFrameBytes, Timeout.Token);
        if (Response.TryGetProperty("error", out var Error)) throw new IOException("桌面桥接失败 " + Error.GetRawText());
        var Result = Response.GetProperty("result");
        var TextList = Result.GetProperty("contentItems").EnumerateArray().Where(Item => Item.GetProperty("type").GetString() == "inputText").Select(Item => Item.GetProperty("text").GetString());
        string Text = string.Join("\n", TextList);
        if (!Result.GetProperty("success").GetBoolean()) throw new IOException("桌面拒绝操作 " + Text);
        if (Tool is not ("list_threads" or "list_projects" or "read_thread" or "create_thread")) return Result.Clone();
        using var Document = JsonDocument.Parse(Text);
        return Document.RootElement.Clone();
    }

    private static async Task<NamedPipeClientStream> ConnectAsync(InstanceProfile Instance, CancellationToken Cancellation)
    {
        var Running = await Task.Run(() => InstanceService.Find(Instance, InstanceService.ListRunning()), Cancellation)
            ?? throw new InvalidOperationException("请先启动实例 " + Instance.Name);
        string[] PipeList = await Task.Run(() => Directory.GetFiles(@"\\.\pipe\", DesktopPipePrefix + "*"), Cancellation);
        foreach (string PipePath in PipeList)
        {
            var Client = new NamedPipeClientStream(".", PipePath[@"\\.\pipe\".Length..], PipeDirection.InOut, PipeOptions.Asynchronous);
            try
            {
                await Client.ConnectAsync(RelayLimits.ConnectTimeoutMilliseconds, Cancellation);
                if (!GetNamedPipeServerProcessId(Client.SafePipeHandle, out uint ServerProcessId)) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
                if (ServerProcessId == Running.ProcessId) return Client;
            }
            catch (TimeoutException) { Client.Dispose(); continue; }
            catch { Client.Dispose(); throw; }
            Client.Dispose();
        }
        throw new IOException("实例没有可连接的桌面工具管道 " + Instance.Name + " 请确认该版本支持 Codex app tools");
    }

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetNamedPipeServerProcessId(SafePipeHandle Pipe, out uint ServerProcessId);
}
