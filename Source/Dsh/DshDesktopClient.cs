using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using YamlDotNet.RepresentationModel;

namespace CodexInstanceManager;

public sealed record DshWorkspace(string Id, string Name, string Path, bool Default, List<string> SessionIdList);
public sealed record DshSession(string Id, string Title, string Cwd, bool Running, bool Archived, int Sequence);
public sealed record DshReply(string SessionId, string RequestId, string Outcome, string Text, int Sequence);

public sealed class DshDesktopClient : IDisposable
{
    /// <summary> 当前桌面服务的 HTTP 连接 </summary>
    private readonly HttpClient Http;
    public DshConnection Connection { get; }

    #region Connection
    public DshDesktopClient(DshConnection Connection, HttpMessageHandler? Handler = null)
    {
        this.Connection = Connection with { Origin = DshDiscovery.ValidateOrigin(Connection.Origin.AbsoluteUri) };
        Http = new(Handler ?? new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false }) { BaseAddress = this.Connection.Origin, Timeout = TimeSpan.FromSeconds(30) };
    }

    public static Task<DshDesktopClient> ConnectAsync(DshSettings Settings, CancellationToken Cancellation) => Task.Run(() => new DshDesktopClient(DshDiscovery.Resolve(Settings)), Cancellation);
    public void Dispose() => Http.Dispose();

    /// <summary>
    /// 使用既有本机凭据生成限当前回环服务的一分钟认证 不写回存储
    /// </summary>
    private static string ReadCookie(DshConnection Connection)
    {
        var Yaml = new YamlStream();
        using var Reader = File.OpenText(Path.Combine(Connection.HomePath, ".credentials.yaml"));
        Yaml.Load(Reader);
        var Root = (YamlMappingNode)Yaml.Documents.Single().RootNode;
        YamlNode Child(YamlNode Parent, string Name) => ((YamlMappingNode)Parent).Children.TryGetValue(new YamlScalarNode(Name), out var Node) ? Node : throw new InvalidDataException("DSH 认证记录缺少 " + Name);
        string Scalar(YamlNode Parent, string Name) => ((YamlScalarNode)Child(Parent, Name)).Value ?? throw new InvalidDataException("DSH 认证字段为空 " + Name);
        if (Scalar(Root, "version") != "1") throw new InvalidDataException("不支持的 DSH 凭据文档版本");
        var Record = Child(Child(Root, "records"), "client-connection/browser-session");
        var Payload = Child(Record, "payload");
        if (Scalar(Record, "kind") != "grant" || Scalar(Payload, "version") != "1") throw new InvalidDataException("不支持的 DSH 桌面认证记录版本");
        string Secret = Scalar(Payload, "secret");
        byte[] SecretList = Convert.FromBase64String(Secret.Replace('-', '+').Replace('_', '/') + new string('=', (4 - Secret.Length % 4) % 4));
        try
        {
            if (SecretList.Length != 32) throw new InvalidDataException("DSH 桌面认证凭据长度错误");
            string Authority = Connection.Origin.Authority.ToLowerInvariant();
            bool Secure = Connection.Origin.Scheme == "https";
            string Audience = Secure ? "https://" + Authority : Authority;
            // DSH 拒绝未来时间戳 Windows JS 时钟采样可能落后于精确系统时钟
            long IssuedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - 1000;
            string Body = Base64(JsonSerializer.SerializeToUtf8Bytes(new { version = 1, authority = Audience, issuedAt = IssuedAt, expiresAt = IssuedAt + 60_000 }));
            return "dsh-auth-" + Base64(SHA256.HashData(Encoding.UTF8.GetBytes(Audience))) + "=v1." + Body + "." + Base64(HMACSHA256.HashData(SecretList, Encoding.UTF8.GetBytes(Body)));
        }
        finally { CryptographicOperations.ZeroMemory(SecretList); }
    }

    private static string Base64(byte[] ValueList) => Convert.ToBase64String(ValueList).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    public async Task<JsonElement> CallAsync(string Method, object Arguments, CancellationToken Cancellation)
    {
        string Id = Guid.NewGuid().ToString("D");
        using var Request = new HttpRequestMessage(HttpMethod.Post, "api/" + Method);
        Request.Headers.Add("Cookie", ReadCookie(Connection));
        Request.Content = new StringContent(JsonSerializer.Serialize(new { type = "client-request", rpcId = Id, method = Method, payload = new { args = Arguments } }), Encoding.UTF8, "application/json");
        using var Response = await Http.SendAsync(Request, Cancellation);
        if (!Response.IsSuccessStatusCode) throw new IOException("DSH " + Method + " HTTP " + (int)Response.StatusCode + " 请核对 HomePath ServerUrl 和桌面版本");
        using var Document = JsonDocument.Parse(await Response.Content.ReadAsStreamAsync(Cancellation));
        var Envelope = Document.RootElement;
        if (Envelope.GetProperty("type").GetString() != "server-response" || Envelope.GetProperty("rpcId").GetString() != Id) throw new InvalidDataException("DSH RPC 响应与请求不匹配 " + Method);
        var Result = Envelope.GetProperty("result");
        if (!Result.GetProperty("ok").GetBoolean())
        {
            var Error = Result.GetProperty("error");
            throw new IOException("DSH " + Method + " " + Error.GetProperty("code").GetString() + " " + Error.GetProperty("message").GetString());
        }
        return Result.GetProperty("value").Clone();
    }
    #endregion

    #region Sessions
    public List<DshWorkspace> Workspaces()
    {
        using var Document = JsonDocument.Parse(File.ReadAllBytes(Path.Combine(Connection.HomePath, "storages", "workspace.json")));
        var Root = Document.RootElement;
        if (Root.GetProperty("unit").GetProperty("version").GetInt32() != 2) throw new InvalidDataException("不支持的 DSH 工作区登记版本");
        var Global = Root.GetProperty("global");
        string Default = Global.GetProperty("defaultWorkspaceId").GetString()!;
        var Table = Root.GetProperty("tables").GetProperty("workspaces");
        return Global.GetProperty("workspaceIds").EnumerateArray().Select(IdValue =>
        {
            string Id = IdValue.GetString()!;
            var Row = Table.GetProperty(Id);
            return new DshWorkspace(Id, Row.GetProperty("title").GetString()!, Row.GetProperty("path").GetString()!, Id == Default, Row.GetProperty("sessionIds").EnumerateArray().Select(Value => Value.GetString()!).ToList());
        }).ToList();
    }

    public async Task<List<DshSession>> SessionsAsync(CancellationToken Cancellation)
    {
        using var Registry = JsonDocument.Parse(File.ReadAllBytes(Path.Combine(Connection.HomePath, "storages", "workspace.json")));
        var ArchivedHashList = Registry.RootElement.GetProperty("global").GetProperty("archivedSessionIds").EnumerateArray().Select(Value => Value.GetString()!).ToHashSet();
        var Result = await CallAsync("session/list", new { _request = new { } }, Cancellation);
        return Result.GetProperty("items").EnumerateArray().Where(Row => !Row.TryGetProperty("parentSessionId", out _)).Select(Row =>
        {
            string Id = Row.GetProperty("sessionId").GetString()!;
            var Projection = Row.GetProperty("projections");
            string Title = Projection.GetProperty("values").TryGetProperty("title", out var Value) ? Value.GetString() ?? Id : Id;
            return new DshSession(Id, Title, Row.TryGetProperty("cwd", out var Cwd) ? Cwd.GetString() ?? "" : "", Row.GetProperty("running").GetBoolean(), ArchivedHashList.Contains(Id), Projection.GetProperty("asOfSeq").GetInt32());
        }).ToList();
    }

    public async Task<DshSession> SessionAsync(string Id, CancellationToken Cancellation) => (await SessionsAsync(Cancellation)).SingleOrDefault(Session => Session.Id == Id && !Session.Archived) ?? throw new InvalidOperationException("DSH 未找到未归档会话 " + Id);

    public async Task<string> CreateAsync(string WorkspaceId, string Title, string SessionId, CancellationToken Cancellation)
    {
        try
        {
            var Created = await CallAsync("session/create", new { request = new { workspaceId = WorkspaceId, sessionId = SessionId, agentPreset = "standard" } }, Cancellation);
            string Id = Created.GetProperty("sessionId").GetString()!;
            if (Id != SessionId) throw new IOException("DSH 创建返回不同会话 请核对结果后再操作 " + Id);
            await RenameAsync(Id, Title, Cancellation);
            return Id;
        }
        catch (Exception Error) when (Error is not OperationCanceledException) { throw new IOException("DSH 创建或命名未确认 请核对原会话 " + SessionId + " " + Error.Message, Error); }
    }

    public Task<JsonElement> RenameAsync(string Id, string Title, CancellationToken Cancellation) => CallAsync("session/rename", new { request = new { sessionId = Id, title = Title } }, Cancellation);
    public Task<JsonElement> PromptAsync(string Id, string RequestId, string Prompt, CancellationToken Cancellation) => CallAsync("session/prompt", new { request = new { sessionId = Id, requestId = RequestId, content = new[] { new { type = "text", text = Prompt } }, mode = "queue", clientTimeZone = TimeZoneInfo.TryConvertWindowsIdToIanaId(TimeZoneInfo.Local.Id, out string? Zone) ? Zone : TimeZoneInfo.Local.Id } }, Cancellation);
    public Task<JsonElement> CancelAsync(string Id, CancellationToken Cancellation) => CallAsync("session/cancel", new { request = new { sessionId = Id } }, Cancellation);

    public async Task CancelRequestAsync(string Id, string RequestId, CancellationToken Cancellation)
    {
        var Projection = await CallAsync("session/projections", new { request = new { sessionId = Id } }, Cancellation);
        var Inbox = Projection.GetProperty("values").GetProperty("inbox");
        foreach (var Queue in Inbox.EnumerateObject())
            foreach (var Message in Queue.Value.EnumerateArray())
                if (Message.TryGetProperty("source", out var Source) && Source.TryGetProperty("rpcId", out var Rpc) && Rpc.GetString() == RequestId)
                {
                    await CallAsync("session/updateQueue", new { request = new { sessionId = Id, itemId = Message.GetProperty("id").GetString(), action = new { kind = "remove" } } }, Cancellation);
                    return;
                }
        var Page = await HistoryAsync(Id, Cancellation);
        var EventList = Page.GetProperty("records").EnumerateArray().Where(Row => Row.GetProperty("type").GetString() == "event").Select(Row => Row.GetProperty("event")).ToList();
        var LastPrompt = EventList.LastOrDefault(Event => Event.GetProperty("type").GetString() == "user/message" && Event.GetProperty("data").TryGetProperty("source", out var Source) && Source.TryGetProperty("rpcId", out _));
        if (LastPrompt.ValueKind == JsonValueKind.Undefined || !MatchesPrompt(LastPrompt, RequestId)) throw new InvalidOperationException("无法确认 DSH 当前执行属于本请求 未取消其他会话操作 请核对桌面 " + Id);
        if (ReadReply(Id, RequestId, EventList) is null) await CancelAsync(Id, Cancellation);
    }

    public async Task<JsonElement> HistoryAsync(string Id, CancellationToken Cancellation)
    {
        var Projection = await CallAsync("session/projections", new { request = new { sessionId = Id } }, Cancellation);
        if (Projection.ValueKind == JsonValueKind.Null || Projection.GetProperty("kind").GetString() != "sequenced") throw new InvalidOperationException("DSH 会话不存在或需要在桌面端完成格式迁移 " + Id);
        return await CallAsync("session/page", new { request = new { address = new { kind = "session", sessionId = Id }, throughSeq = Projection.GetProperty("asOfSeq").GetInt32(), maxMessages = 100 } }, Cancellation);
    }

    public async Task<DshReply?> ReplyAsync(string Id, string RequestId, CancellationToken Cancellation)
    {
        var Page = await HistoryAsync(Id, Cancellation);
        var EventList = Page.GetProperty("records").EnumerateArray().Where(Row => Row.GetProperty("type").GetString() == "event").Select(Row => Row.GetProperty("event").Clone()).ToList();
        int Through = EventList.Count == 0 ? -1 : EventList[^1].GetProperty("seq").GetInt32();
        bool NeedEarlier()
        {
            int Index = EventList.FindIndex(Event => MatchesPrompt(Event, RequestId));
            return Index < 0 || !EventList.Take(Index).Any(Event => Event.GetProperty("type").GetString() == "turn/start");
        }
        while (NeedEarlier() && Page.GetProperty("hasMore").GetBoolean())
        {
            int Before = EventList[0].GetProperty("seq").GetInt32();
            Page = await CallAsync("session/page", new { request = new { address = new { kind = "session", sessionId = Id }, throughSeq = Through, beforeSeq = Before, maxMessages = 100 } }, Cancellation);
            var PreviousList = Page.GetProperty("records").EnumerateArray().Where(Row => Row.GetProperty("type").GetString() == "event").Select(Row => Row.GetProperty("event").Clone()).ToList();
            if (PreviousList.Count == 0 || PreviousList[^1].GetProperty("seq").GetInt32() >= Before) throw new InvalidDataException("DSH 历史分页游标未前进");
            EventList.InsertRange(0, PreviousList);
        }
        return ReadReply(Id, RequestId, EventList);
    }

    public static bool MatchesPrompt(JsonElement Event, string RequestId) => Event.GetProperty("type").GetString() == "user/message" &&
        Event.GetProperty("data").TryGetProperty("source", out var Source) && Source.TryGetProperty("rpcId", out var Rpc) && Rpc.GetString() == RequestId;

    public static DshReply? ReadReply(string Id, string RequestId, IReadOnlyList<JsonElement> EventList)
    {
        int PromptIndex = EventList.ToList().FindIndex(Event => MatchesPrompt(Event, RequestId));
        if (PromptIndex < 0) return null;
        var Start = EventList.Take(PromptIndex).LastOrDefault(Event => Event.GetProperty("type").GetString() == "turn/start");
        if (Start.ValueKind == JsonValueKind.Undefined) throw new InvalidDataException("DSH 提示词缺少所属轮次");
        int Turn = Start.GetProperty("data").GetProperty("turn").GetInt32();
        var End = EventList.Skip(PromptIndex + 1).FirstOrDefault(Event => Event.GetProperty("type").GetString() == "turn/end" && Event.GetProperty("data").GetProperty("turn").GetInt32() == Turn);
        if (End.ValueKind == JsonValueKind.Undefined) return null;
        string Reason = End.GetProperty("data").GetProperty("reason").GetProperty("kind").GetString()!;
        if (EventList.Skip(PromptIndex + 1).TakeWhile(Event => Event.GetProperty("seq").GetInt32() < End.GetProperty("seq").GetInt32()).Any(Event => Event.GetProperty("type").GetString() == "user/message" && Event.GetProperty("data").TryGetProperty("source", out var Source) && Source.TryGetProperty("rpcId", out var Rpc) && Rpc.GetString() != RequestId))
            throw new InvalidDataException("DSH 本轮混入其他用户请求 请核对会话 不自动采纳混合结果");
        var Message = EventList.Skip(PromptIndex + 1).TakeWhile(Event => Event.GetProperty("seq").GetInt32() < End.GetProperty("seq").GetInt32())
            .LastOrDefault(Event => Event.GetProperty("type").GetString() == "assistant/message" && Event.GetProperty("data").GetProperty("turn").GetInt32() == Turn);
        string Text = Message.ValueKind == JsonValueKind.Undefined ? "" : string.Concat(Message.GetProperty("data").GetProperty("message").GetProperty("content").EnumerateArray().Where(Part => Part.GetProperty("type").GetString() == "text").Select(Part => Part.GetProperty("text").GetString()));
        if (Reason == "completed" && string.IsNullOrWhiteSpace(Text)) throw new InvalidDataException("DSH 已结束轮次但没有最终回复 " + Id);
        return new(Id, RequestId, Reason == "completed" ? "completed" : "failed", Text.Length == 0 ? "DSH 轮次结束 " + Reason : Text, End.GetProperty("seq").GetInt32());
    }
    #endregion
}
