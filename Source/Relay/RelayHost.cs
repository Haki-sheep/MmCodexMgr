using System.IO.Pipes;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed record RelayRequest(string InstanceId, string ThreadId, string Command, JsonElement Arguments);

public sealed class RelayHost : IDisposable
{
    private readonly RelayCoordinator Coordinator;
    private readonly CancellationTokenSource Lifetime = new();
    private readonly Task[] ListenerList;
    private readonly string PipeName;
    private readonly AgentManagementService? AgentService;
    public event Action<Exception>? Failed;

    public RelayHost(RelayCoordinator Coordinator, string? PipeName = null, AgentManagementService? AgentService = null)
    {
        this.Coordinator = Coordinator;
        this.PipeName = PipeName ?? RelayLimits.PipeName;
        this.AgentService = AgentService;
        ListenerList = new[] { ListenAsync(), ListenAsync() };
    }

    public void Dispose() => Lifetime.Cancel();

    public static async Task<JsonElement> RequestAsync(RelayRequest Request, CancellationToken Cancellation, string? PipeName = null)
    {
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        Timeout.CancelAfter(TimeSpan.FromSeconds(RelayLimits.RequestTimeoutSeconds + 5));
        using var Client = new NamedPipeClientStream(".", PipeName ?? RelayLimits.PipeName, PipeDirection.InOut, PipeOptions.Asynchronous);
        await Client.ConnectAsync(RelayLimits.ConnectTimeoutMilliseconds, Timeout.Token);
        await RelayWire.WriteAsync(Client, Request, RelayLimits.MaxFrameBytes, Timeout.Token);
        var Response = await RelayWire.ReadAsync(Client, RelayLimits.MaxFrameBytes, Timeout.Token);
        if (Response.TryGetProperty("error", out var Error)) throw new RelayRequestException(Response.TryGetProperty("error_kind", out var Kind) ? Kind.GetString()! : "rejected", Error.GetString()!);
        return Response.GetProperty("result").Clone();
    }

    private async Task ListenAsync()
    {
        try
        {
            while (!Lifetime.IsCancellationRequested)
            {
                await using var Server = new NamedPipeServerStream(PipeName, PipeDirection.InOut, 2, PipeTransmissionMode.Byte, PipeOptions.Asynchronous | PipeOptions.CurrentUserOnly);
                await Server.WaitForConnectionAsync(Lifetime.Token);
                using var RequestTimeout = CancellationTokenSource.CreateLinkedTokenSource(Lifetime.Token);
                RequestTimeout.CancelAfter(TimeSpan.FromSeconds(RelayLimits.RequestTimeoutSeconds + 10));
                try
                {
                    var Message = await RelayWire.ReadAsync(Server, RelayLimits.MaxFrameBytes, RequestTimeout.Token);
                    var Request = Message.Deserialize<RelayRequest>() ?? throw new InvalidDataException("联调请求为空");
                    object Result;
                    try { Result = await ExecuteAsync(Request); }
                    catch (Exception Error) { Program.LogError(Error); Result = new { error = Error.Message, error_kind = Error is IOException or OperationCanceledException ? "delivery_uncertain" : "rejected" }; await RelayWire.WriteAsync(Server, Result, RelayLimits.MaxFrameBytes, RequestTimeout.Token); continue; }
                    await RelayWire.WriteAsync(Server, new { result = Result }, RelayLimits.MaxFrameBytes, RequestTimeout.Token);
                }
                catch (OperationCanceledException) when (!Lifetime.IsCancellationRequested) { Program.LogError(new TimeoutException("联调客户端请求超时")); }
                catch (IOException Error) { Program.LogError(Error); }
                catch (JsonException Error) { Program.LogError(Error); }
                catch (InvalidDataException Error) { Program.LogError(Error); }
            }
        }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested) { }
        catch (Exception Error) { Program.LogError(Error); Failed?.Invoke(Error); }
    }

    private async Task<object> ExecuteAsync(RelayRequest Request)
    {
        if (Request.Command.StartsWith("agent_", StringComparison.Ordinal))
            return await (AgentService ?? throw new InvalidOperationException("当前管理器未启用 CLI 服务 请更新并重启管理器")).ExecuteAsync(Request, Lifetime.Token);
        var Arguments = Request.Arguments;
        switch (Request.Command)
        {
            case "relay_channel":
                return Coordinator.Channel ?? throw new InvalidOperationException("请先绑定联调通道");
            case "relay_dispatch":
                return Describe(await Coordinator.DispatchAsync(Request.InstanceId, Request.ThreadId, Request.InstanceId + "/" + Request.ThreadId + "/" + Arguments.GetProperty("request_id").GetString(), Arguments.GetProperty("title").GetString()!, Arguments.GetProperty("instructions").GetString()!, Arguments.GetProperty("acceptance").GetString()!));
            case "relay_report":
                return Describe(await Coordinator.ReportAsync(Request.InstanceId, Request.ThreadId, Arguments.GetProperty("task_id").GetString()!, Arguments.GetProperty("outcome").GetString()!, Arguments.GetProperty("summary").GetString()!, Arguments.GetProperty("artifacts").EnumerateArray().Select(Item => Item.GetString()!).ToList()));
            case "relay_progress":
                return Describe(await Coordinator.ProgressAsync(Request.InstanceId, Request.ThreadId, Arguments.GetProperty("task_id").GetString()!, Arguments.GetProperty("stage").GetString()!, Arguments.GetProperty("message").GetString()!));
            case "relay_accept":
                await Coordinator.ReviewAsync(Request.InstanceId, Request.ThreadId, Arguments.GetProperty("task_id").GetString()!);
                return new { accepted = true };
            default: throw new InvalidOperationException("未知联调命令 " + Request.Command);
        }
    }

    private static object Describe(RelayTask Item) => new { task_id = Item.Id, state = RelayLimits.StateText(Item.State), outcome = Item.Outcome, instruction = "执行结果需要明确回调 主会话派发后结束当前回合 等待管理器事件回传 不要轮询" };
}
