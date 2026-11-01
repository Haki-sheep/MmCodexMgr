using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed class CursorRelayRunner : IDisposable
{
    public const string InstanceId = "cursor";
    private readonly CursorSessionStore Sessions;
    private readonly ICursorCli Cli;
    private readonly string OutboxRoot;
    private readonly Action<Exception> LogError;
    private readonly ConcurrentDictionary<string, (string Session, CancellationTokenSource Cancellation)> RunningDict = new();

    #region Lifecycle
    public CursorRelayRunner(string? Root = null, ICursorCli? Cli = null, string? OutboxRoot = null, Action<Exception>? LogError = null)
    {
        Sessions = new(Path.Combine(Root ?? Path.Combine(RelayLimits.Root, "cursor"), "sessions"));
        this.Cli = Cli ?? new CursorCli();
        this.OutboxRoot = OutboxRoot ?? RelayOutbox.Root;
        this.LogError = LogError ?? Program.LogError;
    }

    public void Dispose()
    {
        foreach (string Id in RunningDict.Keys) Stop(Id);
    }

    public static InstanceProfile Profile => new() { Id = InstanceId, Name = "Cursor CLI", HomePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".cursor") };
    public List<CursorSession> List(string? Selector, int Offset) => Sessions.List(Selector, Offset);
    public CursorSession Session(string Id) => Sessions.Get(Id);
    public bool IsRunning(string SessionId) => RunningDict.Values.Any(Entry => Entry.Session == SessionId);

    public void Stop(string TaskId)
    {
        if (RunningDict.TryGetValue(TaskId, out var Entry))
            lock (Entry.Cancellation)
                if (RunningDict.TryGetValue(TaskId, out var Current) && ReferenceEquals(Current.Cancellation, Entry.Cancellation)) Entry.Cancellation.Cancel();
    }
    #endregion

    #region Preparation
    public async Task<AgentHealthReport> DoctorAsync(CancellationToken Cancellation)
    {
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        Timeout.CancelAfter(TimeSpan.FromSeconds(RelayLimits.RequestTimeoutSeconds));
        var CheckList = new List<AgentHealthCheck>();
        try
        {
            var Settings = SettingsStore.Load().Cursor;
            string CliPath = CursorCli.ResolvePath(Settings.CliPath.Length == 0 ? null : Settings.CliPath);
            await ProbeAsync(CliPath, Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), Timeout.Token);
            CheckList.Add(new("Cursor CLI 与账号认证", true, CliPath));
        }
        catch (Exception Error) when (Error is IOException or InvalidOperationException or System.ComponentModel.Win32Exception)
        {
            CheckList.Add(new("Cursor CLI 与账号认证", false, Error.Message));
        }
        catch (OperationCanceledException) when (!Cancellation.IsCancellationRequested) { CheckList.Add(new("Cursor CLI 与账号认证", false, "检查超时")); }
        return new(InstanceId, CheckList);
    }

    public async Task PrepareAsync(RelayTask Item, CancellationToken Cancellation)
    {
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        Timeout.CancelAfter(TimeSpan.FromSeconds(RelayLimits.RequestTimeoutSeconds));
        var Route = Item.Channel;
        await ProbeAsync(Route.CursorCliPath, Route.WorkingDirectory, Timeout.Token);
        if (Route.WorkerThreadId.Length == 0)
        {
            var Created = await Cli.RunAsync(Route.CursorCliPath, Route.WorkingDirectory, new[] { "create-chat" }, null, Timeout.Token);
            if (Created.ExitCode != 0) throw new IOException("Cursor 创建会话失败 " + Created.Error);
            if (!Guid.TryParseExact(Created.Output, "D", out _)) throw new InvalidDataException("Cursor create-chat 未返回标准会话 ID " + Created.Output);
            Route.WorkerThreadId = Created.Output;
            Sessions.Save(new(Route.WorkerThreadId, Route.WorkerTitle, Route.WorkingDirectory, Route.WorkerModel, Route.CursorCliPath));
        }
        else
        {
            var Existing = Sessions.Get(Route.WorkerThreadId);
            if (!ManagerPaths.Same(Existing.Cwd, Route.WorkingDirectory) || !ManagerPaths.Same(Existing.CliPath, Route.CursorCliPath) || Existing.Model != Route.WorkerModel) throw new InvalidOperationException("Cursor 会话的工作目录 CLI 和模型必须与登记值一致");
        }
        if (IsRunning(Route.WorkerThreadId)) throw new InvalidOperationException("Cursor 会话正在执行 请等待原任务完成");
    }

    private async Task ProbeAsync(string CliPath, string Cwd, CancellationToken Cancellation)
    {
        var Version = await Cli.RunAsync(CliPath, Cwd, new[] { "--version" }, null, Cancellation);
        if (Version.ExitCode != 0 || !System.Text.RegularExpressions.Regex.IsMatch(Version.Output, @"^\d{4}\.\d{2}\.\d{2}-")) throw new InvalidOperationException("指定程序不是支持的 Cursor CLI " + CliPath + " " + Version.Output + " " + Version.Error);
        var Auth = await Cli.RunAsync(CliPath, Cwd, new[] { "status" }, null, Cancellation);
        if (Auth.ExitCode != 0 || !Auth.Output.Contains("Logged in", StringComparison.OrdinalIgnoreCase) || Auth.Output.Contains("Not logged in", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Cursor CLI 未登录 请先执行 cursor-agent login " + Auth.Error);
    }

    public Task OpenAsync(string SessionId, CancellationToken Cancellation)
    {
        Cancellation.ThrowIfCancellationRequested();
        var Session = Sessions.Get(SessionId);
        if (IsRunning(SessionId)) throw new InvalidOperationException("Cursor 会话正在执行 暂不打开第二个交互进程");
        CursorCli.OpenTerminal(Session.CliPath, Session.Cwd, new[] { "--resume", Session.Id });
        return Task.CompletedTask;
    }
    #endregion

    #region Execution
    public void Launch(RelayTask Item, Func<string, string, Task> Progress, Func<CursorReport, Task> Report, CancellationToken Cancellation)
    {
        var Lifetime = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        if (!RunningDict.TryAdd(Item.Id, (Item.Channel.WorkerThreadId, Lifetime))) { Lifetime.Dispose(); throw new InvalidOperationException("Cursor 任务已经启动 " + Item.Id); }
        _ = Task.Run(() => RunAsync(Item, Progress, Report, Lifetime));
    }

    private async Task RunAsync(RelayTask Item, Func<string, string, Task> Progress, Func<CursorReport, Task> Report, CancellationTokenSource Lifetime)
    {
        CursorReport Result;
        try
        {
            Lifetime.Token.ThrowIfCancellationRequested();
            string? Final = null;
            bool Started = false;
            var ArgumentList = new List<string> { "-p", "--trust", "--resume", Item.Channel.WorkerThreadId, "--workspace", Item.Channel.WorkingDirectory, "--output-format", "stream-json" };
            if (Item.Workspace.Access == "read_only") ArgumentList.Add("--mode=ask");
            else if (Item.Workspace.Access == "write") ArgumentList.Add("--force");
            else throw new InvalidOperationException("Cursor 任务必须声明 read_only 或 write");
            if (Item.Channel.WorkerModel.Length != 0) ArgumentList.AddRange(new[] { "--model", Item.Channel.WorkerModel });
            ArgumentList.Add(BuildPrompt(Item));
            var Execution = await Cli.RunAsync(Item.Channel.CursorCliPath, Item.Channel.WorkingDirectory, ArgumentList, async Line =>
            {
                if (string.IsNullOrWhiteSpace(Line)) return;
                using var Message = JsonDocument.Parse(Line);
                var Data = Message.RootElement;
                string Type = Data.GetProperty("type").GetString()!;
                if (Type == "system" && Data.TryGetProperty("subtype", out var Subtype) && Subtype.GetString() == "init")
                {
                    if (Data.GetProperty("session_id").GetString() != Item.Channel.WorkerThreadId) throw new InvalidDataException("Cursor 初始化了不同会话");
                    if (!Started) { Started = true; await Progress("started", "Cursor CLI 已确认启动原执行会话"); }
                }
                if (Type == "result")
                {
                    if (Final is not null) throw new InvalidDataException("Cursor 返回了多个最终结果");
                    Final = Line;
                }
            }, Lifetime.Token);
            if (Execution.ExitCode != 0) throw new IOException("Cursor 执行失败 exit=" + Execution.ExitCode + " " + Execution.Error);
            if (Final is null) throw new InvalidDataException("Cursor 退出但未返回最终结果 " + Execution.Error);
            Result = ParseResult(Final, Item.Channel.WorkerThreadId);
        }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested)
        {
            Release(Item.Id, Lifetime);
            return;
        }
        catch (Exception Error)
        {
            LogError(Error);
            string Summary = "Cursor 执行或结果协议失败 未确认任务完成 " + Error.Message;
            Result = new("failed", Summary.Length > RelayLimits.MaxTextLength ? Summary[..RelayLimits.MaxTextLength] : Summary, new());
        }
        try
        {
            Lifetime.Token.ThrowIfCancellationRequested();
            var Request = new RelayRequest(InstanceId, Item.Channel.WorkerThreadId, "relay_report", JsonSerializer.SerializeToElement(new { task_id = Item.Id, outcome = Result.Outcome, summary = Result.Summary, artifacts = Result.Artifacts }));
            string Saved = RelayOutbox.Save(Request, OutboxRoot);
            await Report(Result);
            File.Delete(Saved);
        }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested) { }
        catch (Exception Error) { LogError(Error); }
        finally
        {
            Release(Item.Id, Lifetime);
        }
    }

    private void Release(string TaskId, CancellationTokenSource Lifetime)
    {
        lock (Lifetime)
        {
            RunningDict.TryRemove(TaskId, out _);
            Lifetime.Dispose();
        }
    }

    public static CursorReport ParseResult(string Line, string SessionId)
    {
        using var Outer = JsonDocument.Parse(Line);
        var Data = Outer.RootElement;
        if (Data.GetProperty("type").GetString() != "result" || Data.GetProperty("subtype").GetString() != "success" || Data.GetProperty("is_error").GetBoolean() || Data.GetProperty("session_id").GetString() != SessionId) throw new InvalidDataException("Cursor 最终结果状态或会话 ID 不匹配");
        using var Inner = JsonDocument.Parse(Data.GetProperty("result").GetString()!);
        var Payload = Inner.RootElement;
        string Outcome = Payload.GetProperty("outcome").GetString()!;
        string Summary = Payload.GetProperty("summary").GetString()!;
        var ArtifactList = Payload.GetProperty("artifacts").EnumerateArray().Select(Value => Value.GetString()!).ToList();
        if (Outcome is not ("completed" or "needs_decision" or "failed") || string.IsNullOrWhiteSpace(Summary) || Summary.Length > RelayLimits.MaxTextLength || ArtifactList.Count > 20 || ArtifactList.Any(Value => string.IsNullOrWhiteSpace(Value) || Value.Length > 1024 || !Path.IsPathFullyQualified(Value))) throw new InvalidDataException("Cursor 结果不符合 outcome summary artifacts 契约");
        return new(Outcome, Summary, ArtifactList);
    }

    public static string BuildPrompt(RelayTask Item) => $"[MmCodexMgr Cursor 联调任务]\n任务 ID {Item.Id}\n任务 {Item.Title}\n\n目的与执行要求\n{Item.Instructions}\n\n验收规范\n{Item.Acceptance}\n\n工作目录 {Item.Channel.WorkingDirectory}\n工作区 {Item.Workspace.Access}\n允许写入的绝对路径\n{string.Join("\n", Item.Workspace.WritePathList)}\n遵守工程规则 不得扩大写入范围 只读任务禁止修改文件\n本执行端直接完成范围内工作 不创建子 Agent 或其他联调会话 不调用 mmcodex report progress 或 accept 不使用任何 Codex 会话身份\n如果是恢复会话 先检查已有历史和产物 从未完成处继续 不重复已完成的操作\n最终回答必须仅为合法 JSON 不加 Markdown 围栏 格式 {{\"outcome\":\"completed|needs_decision|failed\",\"summary\":\"实际修改 检查结果与未解决项\",\"artifacts\":[\"已生成产物的绝对路径\"]}}\n不得伪造检查通过 无法继续时回报 needs_decision 或 failed 产物没有则使用空数组 管理器负责保存并回传结果 Codex 主会话负责最终验收";
    #endregion
}
