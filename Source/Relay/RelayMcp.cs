using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public static class RelayMcp
{
    #region Protocol
    public static async Task RunAsync(string InstanceId, Stream Input, Stream Output, CancellationToken Cancellation, string? PipeName = null, string? OutboxRoot = null)
    {
        using var Reader = new BufferedStream(Input);
        using var Writer = new StreamWriter(Output, new UTF8Encoding(false), 4096, true) { AutoFlush = true };
        while (await RelayWire.ReadLineAsync(Reader, Cancellation) is string Line)
        {
            if (Line.Length == 0) continue;
            using var Document = JsonDocument.Parse(Line);
            var Message = Document.RootElement;
            if (!Message.TryGetProperty("id", out var Id)) continue;
            object Response;
            try
            {
                object Result = Message.GetProperty("method").GetString() switch
                {
                    "initialize" => new { protocolVersion = Message.GetProperty("params").GetProperty("protocolVersion").GetString(), capabilities = new { tools = new { } }, serverInfo = new { name = RelayLimits.McpName, version = "1.1.0" } },
                    "ping" => new { },
                    "tools/list" => new { tools = ToolList() },
                    "tools/call" => await CallAsync(InstanceId, Message.GetProperty("params"), Cancellation, PipeName, OutboxRoot),
                    _ => throw new InvalidOperationException("不支持的 MCP 方法")
                };
                Response = new { jsonrpc = "2.0", id = Id, result = Result };
            }
            catch (Exception Error)
            {
                Response = new { jsonrpc = "2.0", id = Id, error = new { code = -32603, message = Error.Message } };
            }
            await Writer.WriteLineAsync(JsonSerializer.Serialize(Response));
        }
    }

    private static async Task<object> CallAsync(string InstanceId, JsonElement Parameters, CancellationToken Cancellation, string? PipeName, string? OutboxRoot)
    {
        try
        {
            string ThreadId = ReadThreadId(Parameters.GetProperty("_meta"));
            var Request = new RelayRequest(InstanceId, ThreadId, Parameters.GetProperty("name").GetString()!, Parameters.GetProperty("arguments").Clone());
            var Response = Request.Command == "relay_report" ? await RelayOutbox.DeliverAsync(Request, Cancellation, PipeName, OutboxRoot) : await RelayHost.RequestAsync(Request, Cancellation, PipeName);
            return new { content = new[] { new { type = "text", text = Response.GetRawText() } }, isError = false };
        }
        catch (Exception Error)
        {
            return new { content = new[] { new { type = "text", text = "联调调用失败 " + Error.Message + " 请确认管理器正在运行 保留 request_id 重试 不要用新标识重复派发" } }, isError = true };
        }
    }

    public static string ReadThreadId(JsonElement Metadata)
    {
        foreach (string Key in new[] { "openai/threadId", "openai/thread_id", "codexThreadId", "codex_thread_id", "threadId", "thread_id" })
            if (Metadata.TryGetProperty(Key, out var Value) && Value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(Value.GetString())) return Value.GetString()!;
        if (Metadata.TryGetProperty("x-codex-turn-metadata", out var Turn))
        {
            using var Document = JsonDocument.Parse(Turn.ValueKind == JsonValueKind.String ? Turn.GetString()! : Turn.GetRawText());
            if (Document.RootElement.TryGetProperty("thread_id", out var Value)) return Value.GetString()!;
        }
        if (Metadata.TryGetProperty("thread", out var Thread) && Thread.TryGetProperty("id", out var Id)) return Id.GetString()!;
        throw new InvalidOperationException("执行器未提供会话元数据 无法核对任务归属");
    }
    #endregion

    #region Tools
    private static object[] ToolList() => LegacyTools().Concat(AgentToolCatalog.Tools()).ToArray();

    private static object[] LegacyTools() => new object[]
    {
        Tool("relay_channel", "读取用户在 MmCodexMgr 中绑定的跨实例联调通道 仅使用该通道派发与回传 不得自行更换会话", new { }, Array.Empty<string>()),
        Tool("relay_dispatch", "主会话向用户已绑定的执行会话派发明确任务 用户启用通道即授权本任务交接及其结果回传 request_id 为本次业务请求的唯一标识 重试必须保持不变 成功后结束当前回合 由管理器事件唤醒 不要轮询", new { request_id = Text(128), title = Text(120), instructions = Text(RelayLimits.MaxTextLength), acceptance = Text(RelayLimits.MaxTextLength) }, new[] { "request_id", "title", "instructions", "acceptance" }),
        Tool("relay_report", "执行会话主动回报绑定任务 completed 表示待验收 needs_decision 表示需要主会话判断 failed 表示执行失败 结果由管理器回传用户授权的原主会话 相同内容重试不会重复回传 报告后结束回合", new { task_id = Text(128), outcome = new { type = "string", @enum = new[] { "completed", "needs_decision", "failed" } }, summary = Text(RelayLimits.MaxTextLength), artifacts = new { type = "array", items = Text(1024), maxItems = 20 } }, new[] { "task_id", "outcome", "summary", "artifacts" }),
        Tool("relay_accept", "仅主会话在根据原需求验证完成后调用 确认联调任务验收通过 不得因为执行会话自报完成就直接确认", new { task_id = Text(128) }, new[] { "task_id" })
    };

    private static object Text(int MaxLength) => new { type = "string", minLength = 1, maxLength = MaxLength };
    private static object Tool(string Name, string Description, object Properties, string[] RequiredList) => new { name = Name, description = Description, inputSchema = new { type = "object", properties = Properties, required = RequiredList, additionalProperties = false } };
    #endregion
}
