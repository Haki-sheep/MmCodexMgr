using System.IO.Pipes;
using System.Text.Json;

namespace CodexInstanceManager;

internal static class CodexConversationStop
{
    public static async Task InterruptAsync(string ThreadId, CancellationToken Cancellation)
    {
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        Timeout.CancelAfter(TimeSpan.FromSeconds(RelayLimits.RequestTimeoutSeconds));
        using var Pipe = new NamedPipeClientStream(".", "codex-ipc", PipeDirection.InOut, PipeOptions.Asynchronous);
        try
        {
            await Pipe.ConnectAsync(RelayLimits.ConnectTimeoutMilliseconds, Timeout.Token);
            var Initialized = await RequestAsync(Pipe, "initialize", 0, new { clientType = "mm-agentwork-manager" }, "", Timeout.Token);
            string Source = Initialized.GetProperty("result").GetProperty("clientId").GetString()!;
            var Owner = await RequestAsync(Pipe, "thread-owner-discovery", 1, new { hostId = "local", conversationId = ThreadId }, Source, Timeout.Token);
            string Target = Owner.GetProperty("handledByClientId").GetString()!;
            await RequestAsync(Pipe, "thread-follower-interrupt-turn", 3, new { conversationId = ThreadId, mode = "user-stop" }, Source, Timeout.Token, Target);
        }
        catch (OperationCanceledException) when (!Cancellation.IsCancellationRequested)
        {
            throw new TimeoutException("Codex 未在期限内响应停止请求 " + ThreadId);
        }
    }

    private static async Task<JsonElement> RequestAsync(NamedPipeClientStream Pipe, string Method, int Version, object Params, string Source,
        CancellationToken Cancellation, string? Target = null)
    {
        string Id = Guid.NewGuid().ToString("D");
        var Request = new Dictionary<string, object>
        {
            ["type"] = "request", ["requestId"] = Id, ["method"] = Method, ["version"] = Version,
            ["params"] = Params, ["sourceClientId"] = Source, ["timeoutMs"] = RelayLimits.RequestTimeoutSeconds * 1000
        };
        if (Target is not null) Request.Add("targetClientId", Target);
        await RelayWire.WriteAsync(Pipe, Request, RelayLimits.MaxDesktopFrameBytes, Cancellation);
        while (true)
        {
            var Response = await RelayWire.ReadAsync(Pipe, RelayLimits.MaxDesktopFrameBytes, Cancellation);
            if (!Response.TryGetProperty("requestId", out var RequestId) || RequestId.GetString() != Id ||
                Response.GetProperty("type").GetString() != "response") continue;
            if (Response.GetProperty("resultType").GetString() == "success") return Response;
            throw new IOException("Codex 桌面会话停止失败 " + Method + " " + Response.GetProperty("error").ToString());
        }
    }
}
