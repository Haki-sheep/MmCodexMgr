using System.IO.Pipes;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CodexInstanceManager;

public sealed record RelayRequest(string InstanceId, string ThreadId, string Command, JsonElement Arguments)
{
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public bool AcceptLargeResponse { get; init; }
}

public sealed class RelayHost : IDisposable
{
    private readonly RelayCoordinator Coordinator;
    private readonly CancellationTokenSource Lifetime = new();
    private readonly Task[] ListenerList;
    private readonly string PipeName;
    private readonly AgentManagementService? AgentService;
    /// <summary> 编队命令服务 </summary>
    private readonly FormationService? Formation;
    public event Action<Exception>? Failed;

    public RelayHost(RelayCoordinator Coordinator, string? PipeName = null, AgentManagementService? AgentService = null, FormationService? Formation = null)
    {
        this.Coordinator = Coordinator;
        this.PipeName = PipeName ?? RelayLimits.PipeName;
        this.AgentService = AgentService;
        this.Formation = Formation;
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
        var Response = await RelayWire.ReadAsync(Client, ResponseLimit(Request), Timeout.Token);
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
                    catch (Exception Error)
                    {
                        Program.LogError(Error);
                        string Kind = Error is IOException or TimeoutException or OperationCanceledException ? "delivery_uncertain" : "rejected";
                        await RelayWire.WriteAsync(Server, new { error = RelayLimits.Excerpt(Error.Message, 4000), error_kind = Kind }, RelayLimits.MaxFrameBytes, RequestTimeout.Token);
                        continue;
                    }
                    int Limit = ResponseLimit(Request);
                    if (!await RelayWire.TryWriteAsync(Server, new { result = Result }, Limit, RequestTimeout.Token))
                    {
                        await RelayWire.WriteAsync(Server, new
                        {
                            error = $"{Request.Command} 已执行 响应超过 {Limit / 1024} KiB 请按 ID 查询或分段读取 写入操作勿换标识重试",
                            error_kind = RelayRequestException.ResponseTooLarge,
                            operation_completed = true
                        }, RelayLimits.MaxFrameBytes, RequestTimeout.Token);
                    }
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

    private static int ResponseLimit(RelayRequest Request) => Request.AcceptLargeResponse ? RelayLimits.MaxResponseBytes : RelayLimits.MaxFrameBytes;

    private async Task<object> ExecuteAsync(RelayRequest Request)
    {
        if (Request.Command.StartsWith("formation_", StringComparison.Ordinal))
            return await FormationCli.HandleRequestAsync(Formation ?? throw new InvalidOperationException("当前管理器未启用编队"), Request, Lifetime.Token);
        if (Request.Command.StartsWith("agent_", StringComparison.Ordinal) || Request.Command.StartsWith("dsh_", StringComparison.Ordinal))
            return await (AgentService ?? throw new InvalidOperationException("当前管理器未启用 CLI 服务 请更新并重启管理器")).ExecuteAsync(Request, Lifetime.Token);
        var Arguments = Request.Arguments;
        switch (Request.Command)
        {
            case "relay_channel":
                return Coordinator.Channel ?? throw new InvalidOperationException("未配置旧式联调通道 请使用 agent_start 或 AIMoreMoreWork.Cli.exe start 指定执行实例与会话");
            case "relay_dispatch":
            {
                var Item = await Coordinator.DispatchAsync(Request.InstanceId, Request.ThreadId, Request.InstanceId + "/" + Request.ThreadId + "/" + Arguments.GetProperty("request_id").GetString(), Arguments.GetProperty("title").GetString()!, Arguments.GetProperty("instructions").GetString()!, Arguments.GetProperty("acceptance").GetString()!);
                return Describe(Item, Item.State == eRelayState.Running ? RelayLimits.DispatchWaitInstruction : "按已保存的任务状态继续处理 不重复派发");
            }
            case "relay_report":
            {
                var Item = await Coordinator.ReportAsync(Request.InstanceId, Request.ThreadId, Arguments.GetProperty("task_id").GetString()!, Arguments.GetProperty("outcome").GetString()!, Arguments.GetProperty("summary").GetString()!, Arguments.GetProperty("artifacts").EnumerateArray().Select(Item => Item.GetString()!).ToList(), WaitForNotification: false);
                return Describe(Item, Item.Channel.FormationRunId.Length == 0 ? "执行结果已保存 主会话可从收件箱读取" : "执行结果已保存 编队将处理原轮次");
            }
            case "relay_progress":
                return Describe(await Coordinator.ProgressAsync(Request.InstanceId, Request.ThreadId, Arguments.GetProperty("task_id").GetString()!, Arguments.GetProperty("stage").GetString()!, Arguments.GetProperty("message").GetString()!));
            case "relay_accept":
                await Coordinator.ReviewAsync(Request.InstanceId, Request.ThreadId, Arguments.GetProperty("task_id").GetString()!);
                return new { accepted = true };
            default: throw new InvalidOperationException("未知联调命令 " + Request.Command);
        }
    }

    private static object Describe(RelayTask Item, string Instruction = "") => new { task_id = Item.Id, state = RelayLimits.StateText(Item.State), outcome = Item.Outcome, instruction = Instruction };
}
