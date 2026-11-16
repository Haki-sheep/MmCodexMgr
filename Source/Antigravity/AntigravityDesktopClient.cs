using System.Buffers.Binary;
using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed record AntigravitySession(string Id, string Title, string Cwd, bool Running, int LastInput, DateTimeOffset UpdatedAt);

public sealed class AntigravityDesktopClient : IDisposable
{
    private const string Service = "exa.language_server_pb.LanguageServerService/";
    private const string IdleStatus = "CASCADE_RUN_STATUS_IDLE";
    private readonly HttpClient Http;

    public static string HomePath => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".gemini", "antigravity");
    public string Version { get; }

    #region Connection
    private AntigravityDesktopClient(int Port, string Token, string Version)
    {
        this.Version = Version;
        Http = new(new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false, UseProxy = false })
        {
            BaseAddress = new Uri($"http://127.0.0.1:{Port}/{Service}"),
            Timeout = TimeSpan.FromSeconds(15)
        };
        Http.DefaultRequestHeaders.Add("Connect-Protocol-Version", "1");
        Http.DefaultRequestHeaders.Add("x-codeium-csrf-token", Token);
    }

    public static AntigravityDesktopClient Connect()
    {
        string DirectoryPath = Path.Combine(HomePath, "daemon");
        if (!Directory.Exists(DirectoryPath)) throw new IOException("未找到 Antigravity App 服务登记 请先启动本机桌面 App");
        var CandidateList = new List<(int Port, string Token, string Version)>();
        foreach (string PathValue in Directory.EnumerateFiles(DirectoryPath, "hub_*.json"))
        {
            using var Document = JsonDocument.Parse(File.ReadAllBytes(PathValue));
            var Entry = Document.RootElement;
            int Pid = Entry.GetProperty("pid").GetInt32();
            if (Pid <= 0 || !IsDesktopServer(Pid)) continue;
            int Port = Entry.GetProperty("httpPort").GetInt32();
            string Token = Text(Entry, "csrfToken");
            if (Port is < 1 or > 65535 || Path.GetFileNameWithoutExtension(PathValue) != $"hub_{Port}" || !Guid.TryParse(Token, out _))
                throw new InvalidDataException("Antigravity App 的桌面服务登记格式不符");
            CandidateList.Add((Port, Token, Text(Entry, "lsVersion")));
        }
        if (CandidateList.Count != 1) throw new IOException(CandidateList.Count == 0
            ? "未发现正在运行的 Antigravity App 桌面服务 请打开 App 后重试"
            : "发现多个 Antigravity App 桌面服务 请保留一个本地 App 后重试");
        var Candidate = CandidateList[0];
        return new(Candidate.Port, Candidate.Token, Candidate.Version);
    }

    private static bool IsDesktopServer(int Pid)
    {
        try
        {
            using var ServerProcess = Process.GetProcessById(Pid);
            if (ServerProcess.HasExited || !ServerProcess.ProcessName.Equals("language_server", StringComparison.OrdinalIgnoreCase)) return false;
            string? ServerPath = ServerProcess.MainModule?.FileName;
            if (ServerPath is null) return false;
            string? InstallPath = Path.GetDirectoryName(Path.GetDirectoryName(Path.GetDirectoryName(ServerPath)));
            return InstallPath is not null
                && ManagerPaths.Same(ServerPath, Path.Combine(InstallPath, "resources", "bin", "language_server.exe"))
                && File.Exists(Path.Combine(InstallPath, "Antigravity.exe"));
        }
        catch (ArgumentException) { return false; }
        catch (InvalidOperationException) { return false; }
    }

    public void Dispose() => Http.Dispose();

    internal async Task<JsonElement> CallAsync(string Method, object Arguments, CancellationToken Cancellation, bool Stream = false)
    {
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        Timeout.CancelAfter(TimeSpan.FromSeconds(15));
        using var Request = new HttpRequestMessage(HttpMethod.Post, Method);
        if (Stream)
        {
            byte[] Body = JsonSerializer.SerializeToUtf8Bytes(Arguments);
            byte[] Frame = new byte[5 + Body.Length];
            BinaryPrimitives.WriteInt32BigEndian(Frame.AsSpan(1, 4), Body.Length);
            Body.CopyTo(Frame.AsSpan(5));
            Request.Content = new ByteArrayContent(Frame);
            Request.Content.Headers.ContentType = new("application/connect+json");
        }
        else Request.Content = JsonContent.Create(Arguments);
        using var Response = await Http.SendAsync(Request, HttpCompletionOption.ResponseHeadersRead, Timeout.Token);
        if (!Response.IsSuccessStatusCode)
        {
            string Error = await Response.Content.ReadAsStringAsync(Timeout.Token);
            throw new IOException($"Antigravity {Method} HTTP {(int)Response.StatusCode} {Error[..Math.Min(400, Error.Length)]}");
        }
        using var Input = await Response.Content.ReadAsStreamAsync(Timeout.Token);
        if (!Stream)
        {
            using var Document = await JsonDocument.ParseAsync(Input, cancellationToken: Timeout.Token);
            return Document.RootElement.Clone();
        }
        byte[] Header = new byte[5];
        await Input.ReadExactlyAsync(Header, Timeout.Token);
        int Length = BinaryPrimitives.ReadInt32BigEndian(Header.AsSpan(1));
        if (Length is <= 0 or > 16 * 1024 * 1024) throw new InvalidDataException("Antigravity 会话快照长度异常");
        byte[] Payload = new byte[Length];
        await Input.ReadExactlyAsync(Payload, Timeout.Token);
        using var Snapshot = JsonDocument.Parse(Payload);
        if (Header[0] != 0) throw new IOException("Antigravity 会话快照连接结束 " + Text(Child(Snapshot.RootElement, "error"), "code"));
        return Snapshot.RootElement.Clone();
    }
    #endregion

    #region Conversations
    public async Task<bool> SignedInAsync(CancellationToken Cancellation)
    {
        var Result = await CallAsync("GetUserStatus", new { }, Cancellation);
        return Child(Result, "userStatus").ValueKind == JsonValueKind.Object;
    }

    public async Task<List<AntigravitySession>> SessionsAsync(CancellationToken Cancellation)
    {
        var Snapshot = await CallAsync("JetboxSubscribeToSummaries", new { backend = "BACKEND_TYPE_LOCAL" }, Cancellation, Stream: true);
        var Rows = Child(Snapshot, "updates");
        if (Rows.ValueKind == JsonValueKind.Undefined) return new();
        return Rows.EnumerateObject().Where(Row =>
        {
            var Metadata = Child(Row.Value, "trajectoryMetadata");
            return Guid.TryParse(Row.Name, out _) && Text(Metadata, "parentConversationId").Length == 0 &&
                !Flag(Child(Row.Value, "annotations"), "archived") && !Flag(Row.Value, "cloud") &&
                Text(Row.Value, "trajectoryType") == "CORTEX_TRAJECTORY_TYPE_CASCADE";
        }).Select(Row =>
        {
            var Value = Row.Value;
            string Title = Text(Child(Value, "annotations"), "title");
            if (Title.Length == 0) Title = Text(Value, "summary");
            string Cwd = ReadCwd(Child(Value, "trajectoryMetadata"));
            return new AntigravitySession(Row.Name, Title.Length == 0 ? Row.Name : Title, Cwd,
                Text(Value, "status") != IdleStatus || Flag(Value, "notFullyIdle"),
                Integer(Value, "lastUserInputStepIndex"),
                DateTimeOffset.TryParse(Text(Value, "lastModifiedTime"), out var Updated) ? Updated : DateTimeOffset.MinValue);
        }).OrderByDescending(Session => Session.UpdatedAt).ToList();
    }

    public async Task CreateAsync(string Id, string Title, string Cwd, CancellationToken Cancellation)
    {
        string[] WorkspaceUriList = Cwd.Length == 0 ? Array.Empty<string>() : new[] { new Uri(Cwd).AbsoluteUri };
        var Created = await CallAsync("StartCascade", new
        {
            cascadeId = Id,
            source = "CORTEX_TRAJECTORY_SOURCE_CASCADE_CLIENT",
            trajectoryType = "CORTEX_TRAJECTORY_TYPE_CASCADE",
            workspaceUris = WorkspaceUriList,
            backend = "BACKEND_TYPE_LOCAL"
        }, Cancellation);
        if (Text(Created, "cascadeId") != Id) throw new IOException("Antigravity 创建返回了不同的桌面会话 ID");
        await CallAsync("UpdateConversationAnnotations", new { cascadeId = Id, annotations = new { title = Title }, mergeAnnotations = true }, Cancellation);
    }

    public Task<JsonElement> TrajectoryAsync(string Id, CancellationToken Cancellation) =>
        CallAsync("GetCascadeTrajectory", new { cascadeId = Id, trajectoryVerbosity = "CLIENT_TRAJECTORY_VERBOSITY_PROD_UI" }, Cancellation);

    public static bool IsIdle(JsonElement Snapshot) => Text(Snapshot, "status") == IdleStatus;
    public static int StepCount(JsonElement Snapshot) => Integer(Snapshot, "numTotalSteps");
    public static string Workspace(JsonElement Snapshot) => ReadCwd(Child(Child(Snapshot, "trajectory"), "metadata"));

    public async Task<List<JsonElement>> StepsAsync(string Id, int Offset, int End, bool Full, CancellationToken Cancellation)
    {
        var ResultList = new List<JsonElement>();
        while (Offset < End)
        {
            var Page = await CallAsync("GetCascadeTrajectorySteps", new
            {
                cascadeId = Id,
                stepOffset = Offset,
                trajectoryVerbosity = Full ? "CLIENT_TRAJECTORY_VERBOSITY_FULL" : "CLIENT_TRAJECTORY_VERBOSITY_PROD_UI"
            }, Cancellation);
            var Steps = Child(Page, "steps");
            if (Steps.ValueKind != JsonValueKind.Array || Steps.GetArrayLength() == 0)
                throw new IOException("Antigravity 会话步骤列表已变化 请核对原轮次");
            int Count = Math.Min(Steps.GetArrayLength(), End - Offset);
            ResultList.AddRange(Steps.EnumerateArray().Take(Count));
            Offset += Count;
        }
        return ResultList;
    }

    public async Task<JsonElement> ModelAsync(string Id, int LastInput, int End, CancellationToken Cancellation)
    {
        if (LastInput >= 0 && LastInput < End)
        {
            var Steps = await StepsAsync(Id, LastInput, LastInput + 1, true, Cancellation);
            var Planner = Child(Child(Child(Steps[0], "userInput"), "userConfig"), "plannerConfig");
            var Requested = Child(Planner, "requestedModel");
            if (Requested.ValueKind == JsonValueKind.Object) return Requested;
            string Model = Text(Planner, "planModel");
            if (Model.Length != 0 && Model != "MODEL_UNSPECIFIED") return JsonSerializer.SerializeToElement(new { model = Model });
        }
        var Config = await CallAsync("GetCascadeModelConfigData", new { }, Cancellation);
        var Default = Child(Child(Config, "defaultOverrideModelConfig"), "modelOrAlias");
        if (Default.ValueKind != JsonValueKind.Object) throw new IOException("Antigravity 未提供可用的默认模型 请在桌面 App 核对账号和模型");
        return Default;
    }

    public Task<JsonElement> PromptAsync(string Id, string RequestId, string Prompt, JsonElement Model, CancellationToken Cancellation) =>
        CallAsync("SendUserCascadeMessage", new
        {
            cascadeId = Id,
            clientMessageId = RequestId,
            items = new[] { new { text = Prompt } },
            cascadeConfig = new { plannerConfig = new { requestedModel = Model }, executorConfig = new { useCoreDirect = true } },
            customAgentSpec = new { builtinAgent = new { defaultAgent = new { isInteractive = true, surface = "AGENT_SURFACE_HUB" } } },
            propagateError = true
        }, Cancellation);

    public Task<JsonElement> CancelAsync(string Id, CancellationToken Cancellation) =>
        CallAsync("CancelCascadeInvocation", new { cascadeId = Id }, Cancellation);

    private static string ReadCwd(JsonElement Metadata)
    {
        var UriList = Child(Metadata, "workspaceUris");
        if (UriList.ValueKind != JsonValueKind.Array) return "";
        foreach (var Value in UriList.EnumerateArray())
            if (Uri.TryCreate(Value.GetString(), UriKind.Absolute, out var Workspace) && Workspace.IsFile) return ManagerPaths.Normalize(Workspace.LocalPath);
        return "";
    }

    internal static JsonElement Child(JsonElement Value, string Name) => Value.ValueKind == JsonValueKind.Object && Value.TryGetProperty(Name, out var Result) ? Result : default;
    internal static string Text(JsonElement Value, string Name) => Child(Value, Name).ValueKind == JsonValueKind.String ? Value.GetProperty(Name).GetString()! : "";
    private static bool Flag(JsonElement Value, string Name) => Child(Value, Name).ValueKind == JsonValueKind.True;
    private static int Integer(JsonElement Value, string Name) => Child(Value, Name).ValueKind == JsonValueKind.Number ? Value.GetProperty(Name).GetInt32() : 0;
    #endregion
}
