using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed class ClaudeRelayRunner : IDisposable
{
    public const string InstanceId = "claude";
    public const string DefaultModel = "claude-opus-5-5";
    private readonly RelayCliSessionStore Sessions;
    private readonly string OutboxRoot;
    private readonly string CodeHome;
    private readonly ConcurrentDictionary<string, CancellationTokenSource> RunningDict = new();
    private readonly ConcurrentDictionary<string, byte> BusySessions = new();

    #region Lifecycle
    public ClaudeRelayRunner(string? Root = null, string? OutboxRoot = null, string? CodeHome = null)
    {
        Sessions = new(Path.Combine(Root ?? Path.Combine(RelayLimits.Root, InstanceId), "sessions"), "Claude Code");
        this.OutboxRoot = OutboxRoot ?? RelayOutbox.Root;
        this.CodeHome = CodeHome ?? ClaudeCodeCli.Home;
    }

    public static InstanceProfile Profile => new() { Id = InstanceId, Name = "Claude Code", HomePath = ClaudeCodeCli.Home };
    public List<RelayCliSession> List(string? Selector, int Offset) => Sessions.List(Selector, Offset);
    public RelayCliSession Session(string Id) => Sessions.Get(Id);
    public bool IsRunning(string SessionId) => BusySessions.ContainsKey(SessionId);
    internal bool HasPendingReport(RelayTask Item) => File.Exists(RelayOutbox.PendingPath(InstanceId, Item.Channel.WorkerThreadId, Item.Id, OutboxRoot));
    #endregion

    #region Preparation
    public static AgentHealthReport Doctor()
    {
        var CheckList = new List<AgentHealthCheck>();
        try
        {
            string PathValue = ClaudeCodeCli.ResolvePath();
            var Info = ClaudeCodeCli.StartInfo(PathValue, Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "");
            CheckList.Add(new("Claude Code CLI", true, PathValue));
            CheckList.Add(new("Claude Desktop 网关配置", true, new Uri(Info.Environment["ANTHROPIC_BASE_URL"]!).GetLeftPart(UriPartial.Authority)));
        }
        catch (Exception Error) when (Error is IOException or InvalidOperationException or JsonException or KeyNotFoundException)
        {
            CheckList.Add(new("Claude Code 与网关配置", false, Error.Message));
        }
        return new(InstanceId, CheckList);
    }

    public void Prepare(RelayTask Item)
    {
        var Route = Item.Channel;
        if (Item.WorkerLimits.SubagentMax != 0 || Item.WorkerLimits.SessionMax != 0 || Item.WorkerLimits.CrossAgentMax != 0)
            throw new InvalidOperationException("Claude 执行端的 worker_limits 必须全部为零");
        if (Route.WorkerThreadId.Length == 0)
        {
            Route.WorkerThreadId = Guid.NewGuid().ToString("D");
            string CliPath = ClaudeCodeCli.ResolvePath();
            ClaudeCodeCli.TaskInfo(Item, CliPath, false, CodeHome);
            Sessions.Save(new(Route.WorkerThreadId, Route.WorkerTitle, Route.WorkingDirectory, Route.WorkerModel, CliPath));
            return;
        }
        var Existing = Session(Route.WorkerThreadId);
        if (IsRunning(Existing.Id)) throw new InvalidOperationException("Claude Code 会话正在执行");
        if (!ManagerPaths.Same(Existing.Cwd, Route.WorkingDirectory) || Existing.Model != Route.WorkerModel)
            throw new InvalidOperationException("已有 Claude Code 会话须沿用原工作目录与模型");
        RequireTranscript(Existing);
        ClaudeCodeCli.TaskInfo(Item, Existing.CliPath, true, CodeHome);
    }
    #endregion

    #region Execution
    public void Launch(RelayTask Item, Func<string, string, Task> Progress, Func<RelayWorkerReport, Task> Report, CancellationToken Cancellation, bool Resume = false)
    {
        var Current = Session(Item.Channel.WorkerThreadId);
        if (!BusySessions.TryAdd(Current.Id, 0)) throw new InvalidOperationException("Claude Code 会话正在执行");
        var Lifetime = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        if (!RunningDict.TryAdd(Item.Id, Lifetime))
        {
            BusySessions.TryRemove(Current.Id, out _);
            Lifetime.Dispose();
            throw new InvalidOperationException("Claude Code 任务已启动 " + Item.Id);
        }
        _ = Task.Run(async () =>
        {
            try { await RunAsync(Item, Current, Progress, Report, Resume, Lifetime.Token); }
            finally
            {
                lock (Lifetime)
                {
                    RunningDict.TryRemove(Item.Id, out _);
                    BusySessions.TryRemove(Current.Id, out _);
                    Lifetime.Dispose();
                }
            }
        });
    }

    public void Stop(string TaskId)
    {
        if (RunningDict.TryGetValue(TaskId, out var Entry))
            lock (Entry)
                if (RunningDict.TryGetValue(TaskId, out var Current) && ReferenceEquals(Current, Entry))
                    Entry.Cancel();
    }

    public void Dispose()
    {
        foreach (string Id in RunningDict.Keys) Stop(Id);
    }

    public void Open(string SessionId)
    {
        var Current = Session(SessionId);
        RequireTranscript(Current);
        var Info = ClaudeCodeCli.StartInfo(Current.CliPath, Current.Cwd, Current.Model, CodeHome);
        ClaudeCodeCli.AddSessionOptions(Info);
        Info.ArgumentList.Add("--resume");
        Info.ArgumentList.Add(Current.Id);
        if (!BusySessions.TryAdd(Current.Id, 0)) throw new InvalidOperationException("Claude Code 会话正在执行");
        var Process = new Process { StartInfo = Info, EnableRaisingEvents = true };
        Process.Exited += (_, _) =>
        {
            BusySessions.TryRemove(Current.Id, out _);
            Process.Dispose();
        };
        try
        {
            if (!Process.Start()) throw new IOException("无法打开 Claude Code 会话 " + Current.Id);
        }
        catch
        {
            BusySessions.TryRemove(Current.Id, out _);
            Process.Dispose();
            throw;
        }
    }

    private void RequireTranscript(RelayCliSession Current)
    {
        string Projects = Path.Combine(CodeHome, "projects");
        if (!Directory.Exists(Projects) || !Directory.EnumerateDirectories(Projects).Any(DirectoryPath => File.Exists(Path.Combine(DirectoryPath, Current.Id + ".jsonl"))))
            throw new InvalidOperationException("找不到已保存的 Claude Code 会话 " + Current.Id);
    }

    private async Task RunAsync(RelayTask Item, RelayCliSession Current, Func<string, string, Task> Progress, Func<RelayWorkerReport, Task> Report, bool Resume, CancellationToken Cancellation)
    {
        RelayWorkerReport Result;
        try
        {
            var Info = ClaudeCodeCli.TaskInfo(Item, Current.CliPath, Resume, CodeHome);
            Result = await ExecuteAsync(Info, Item, Progress, Cancellation);
            Sessions.Save(Current with { LastTaskId = Item.Id });
        }
        catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { return; }
        catch (Exception Error)
        {
            Program.LogError(Error);
            string Summary = "Claude Code 执行或结果读取失败 " + Error.Message;
            Result = new("failed", Summary[..Math.Min(Summary.Length, RelayLimits.MaxTextLength)], new());
        }
        try
        {
            Cancellation.ThrowIfCancellationRequested();
            var Request = new RelayRequest(InstanceId, Current.Id, "relay_report", JsonSerializer.SerializeToElement(new { task_id = Item.Id, outcome = Result.Outcome, summary = Result.Summary, artifacts = Result.Artifacts }));
            string Saved = RelayOutbox.Save(Request, OutboxRoot);
            await Report(Result);
            File.Delete(Saved);
        }
        catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { }
        catch (Exception Error) { Program.LogError(Error); }
    }

    private static async Task<RelayWorkerReport> ExecuteAsync(ProcessStartInfo Info, RelayTask Item, Func<string, string, Task> Progress, CancellationToken Cancellation)
    {
        Cancellation.ThrowIfCancellationRequested();
        using var Process = System.Diagnostics.Process.Start(Info) ?? throw new IOException("无法启动 Claude Code");
        using var Job = RelayProcessJob.Attach(Process, "Claude Code");
        var ErrorTask = Process.StandardError.ReadToEndAsync(Cancellation);
        try
        {
            await Process.StandardInput.WriteAsync(RelayWorkerReport.BuildPrompt(Item, "Claude Code").AsMemory(), Cancellation);
            Process.StandardInput.Close();
            string? Final = null;
            bool Started = false;
            while (await Process.StandardOutput.ReadLineAsync(Cancellation) is string Line)
            {
                if (string.IsNullOrWhiteSpace(Line)) continue;
                if (Line.Length > RelayLimits.MaxDesktopFrameBytes) throw new InvalidDataException("Claude Code 输出帧超过限制");
                using var Message = JsonDocument.Parse(Line);
                var Data = Message.RootElement;
                string? Type = Data.GetProperty("type").GetString();
                if (Type == "system" && Data.GetProperty("subtype").GetString() == "init")
                {
                    if (Started || Data.GetProperty("session_id").GetString() != Item.Channel.WorkerThreadId) throw new InvalidDataException("Claude Code 初始化会话 ID 不匹配");
                    Started = true;
                    await Progress("started", "Claude Code 已开始执行");
                }
                if (Type == "result")
                {
                    if (Final is not null) throw new InvalidDataException("Claude Code 返回多个最终结果");
                    Final = Line;
                }
            }
            await Process.WaitForExitAsync(Cancellation);
            string Error = await ErrorTask;
            using var Outcome = Final is null ? null : JsonDocument.Parse(Final);
            var Result = Outcome?.RootElement;
            if (Process.ExitCode != 0 || !Started || Result is null || Result.Value.GetProperty("is_error").GetBoolean())
            {
                string Detail = Result is { } Data && Data.TryGetProperty("result", out var ErrorText) ? ErrorText.ToString() : Error;
                foreach (string Key in new[] { "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_API_KEY" })
                    if (Info.Environment.TryGetValue(Key, out string? Value) && !string.IsNullOrEmpty(Value))
                        Detail = Detail.Replace(Value, "[redacted]", StringComparison.Ordinal);
                throw new IOException("Claude Code 退出状态 " + Process.ExitCode + " " + Detail[..Math.Min(Detail.Length, 700)]);
            }
            if (Result.Value.GetProperty("session_id").GetString() != Item.Channel.WorkerThreadId || Result.Value.GetProperty("subtype").GetString() != "success")
                throw new InvalidDataException("Claude Code 结果会话或状态不匹配");
            var Report = RelayWorkerReport.Parse(Result.Value.GetProperty("result").GetString()!, "Claude Code");
            if (Report.Outcome == "completed" && Result.Value.TryGetProperty("permission_denials", out var Denials) && Denials.GetArrayLength() != 0)
            {
                const string Prefix = "Claude Code 有工具操作被拒绝 ";
                return new("needs_decision", Prefix + Report.Summary[..Math.Min(Report.Summary.Length, RelayLimits.MaxTextLength - Prefix.Length)], Report.Artifacts);
            }
            return Report;
        }
        finally
        {
            if (!Process.HasExited) Job.Dispose();
            await Process.WaitForExitAsync(CancellationToken.None);
            try { await ErrorTask; } catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { }
        }
    }
    #endregion
}
