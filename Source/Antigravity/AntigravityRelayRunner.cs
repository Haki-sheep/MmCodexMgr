using System.Collections.Concurrent;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed record AntigravityReport(string Outcome, string Summary, List<string> Artifacts);

public sealed class AntigravityRelayRunner
{
    public const string InstanceId = "antigravity";
    public const string Name = "Antigravity App";
    private readonly ConcurrentDictionary<string, CancellationTokenSource> RunningDict = new();
    private readonly ConcurrentDictionary<string, byte> StopRequestDict = new();

    public static async Task<AgentHealthReport> DoctorAsync(CancellationToken Cancellation)
    {
        var CheckList = new List<AgentHealthCheck>();
        try
        {
            using var Client = AntigravityDesktopClient.Connect();
            CheckList.Add(new("Antigravity 桌面服务", true, Client.Version));
            bool SignedIn = await Client.SignedInAsync(Cancellation);
            CheckList.Add(new("Antigravity 登录状态", SignedIn, SignedIn ? "桌面账号已连接" : "请先登录 Antigravity App"));
            int SessionCount = (await Client.SessionsAsync(Cancellation)).Count;
            CheckList.Add(new("桌面会话", true, $"{SessionCount} 个本地会话"));
        }
        catch (Exception Error) when (!Cancellation.IsCancellationRequested)
        {
            CheckList.Add(new("Antigravity 桌面连接", false, Error.Message));
        }
        return new(InstanceId, CheckList);
    }

    public static async Task PrepareAsync(RelayTask Item, CancellationToken Cancellation, Action PersistSession)
    {
        using var Client = AntigravityDesktopClient.Connect();
        var Channel = Item.Channel;
        if (Channel.WorkerThreadId.Length == 0)
        {
            Channel.WorkerThreadId = Guid.NewGuid().ToString("D");
            PersistSession();
            await Client.CreateAsync(Channel.WorkerThreadId, Channel.CreateTitle, Channel.WorkingDirectory, Cancellation);
        }
        var Snapshot = await Client.TrajectoryAsync(Channel.WorkerThreadId, Cancellation);
        if (!AntigravityDesktopClient.IsIdle(Snapshot)) throw new InvalidOperationException("Antigravity 桌面会话正在执行");
        string Cwd = AntigravityDesktopClient.Workspace(Snapshot);
        if (!string.Equals(Cwd, Channel.WorkingDirectory, StringComparison.OrdinalIgnoreCase))
            throw new IOException("Antigravity 桌面会话的工作目录已变化 请核对原会话");
        Channel.AntigravityStepOffset = AntigravityDesktopClient.StepCount(Snapshot);
        PersistSession();
    }

    public void Launch(RelayTask Item, Func<string, string, Task> Progress, Func<AntigravityReport, Task> Report, CancellationToken Cancellation, bool ObserveOnly)
    {
        var Lifetime = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        if (!RunningDict.TryAdd(Item.Id, Lifetime))
        {
            Lifetime.Dispose();
            throw new InvalidOperationException("Antigravity 任务已在监测 " + Item.Id);
        }
        _ = ExecuteAsync(Item, Progress, Report, Lifetime, ObserveOnly);
    }

    public void Stop(string TaskId)
    {
        if (!RunningDict.TryGetValue(TaskId, out var Lifetime)) return;
        lock (Lifetime)
        {
            if (!RunningDict.ContainsKey(TaskId)) return;
            StopRequestDict.TryAdd(TaskId, 0);
            Lifetime.Cancel();
        }
    }

    #region Execution
    private async Task ExecuteAsync(RelayTask Item, Func<string, string, Task> Progress, Func<AntigravityReport, Task> Report, CancellationTokenSource Lifetime, bool ObserveOnly)
    {
        try
        {
            AntigravityReport Result;
            try { Result = await RunAsync(Item, Progress, Lifetime.Token, ObserveOnly); }
            catch (OperationCanceledException) when (Lifetime.IsCancellationRequested)
            {
                if (StopRequestDict.ContainsKey(Item.Id)) await CancelOwnedTurnAsync(Item);
                return;
            }
            catch (Exception Error)
            {
                Program.LogError(Error);
                Result = new("failed", "Antigravity 执行或读取结果失败 " + Error.Message + " 请核对原会话和任务轮次", new());
            }
            if (!Lifetime.IsCancellationRequested) await Report(Result);
        }
        catch (Exception Error) { Program.LogError(Error); }
        finally
        {
            lock (Lifetime)
            {
                RunningDict.TryRemove(Item.Id, out _);
                StopRequestDict.TryRemove(Item.Id, out _);
                Lifetime.Dispose();
            }
        }
    }

    private static async Task<AntigravityReport> RunAsync(RelayTask Item, Func<string, string, Task> Progress, CancellationToken Cancellation, bool ObserveOnly)
    {
        using var Client = AntigravityDesktopClient.Connect();
        string Id = Item.Channel.WorkerThreadId;
        string RequestId = Guid.Parse(Item.Id).ToString("D");
        int Offset = Item.Channel.AntigravityStepOffset;
        if (!ObserveOnly)
        {
            int LastInput = Offset == 0 ? -1 : (await Client.SessionsAsync(Cancellation)).Single(Session => Session.Id == Id).LastInput;
            var Model = await Client.ModelAsync(Id, LastInput, Offset, Cancellation);
            var Before = await Client.TrajectoryAsync(Id, Cancellation);
            if (!AntigravityDesktopClient.IsIdle(Before) || AntigravityDesktopClient.StepCount(Before) != Offset)
                throw new InvalidOperationException("Antigravity 会话内容在派发前已变化 请重新核对目标");
            await Client.PromptAsync(Id, RequestId, BuildPrompt(Item), Model, Cancellation);
        }
        await Progress("started", ObserveOnly ? "Antigravity 已恢复原轮次监测" : "Antigravity 桌面已受理任务");
        DateTimeOffset MissingUntil = DateTimeOffset.UtcNow.AddSeconds(15);
        while (true)
        {
            var Snapshot = await Client.TrajectoryAsync(Id, Cancellation);
            var Steps = await Client.StepsAsync(Id, Offset, AntigravityDesktopClient.StepCount(Snapshot), false, Cancellation);
            var Result = ReadTurn(RequestId, Steps, AntigravityDesktopClient.IsIdle(Snapshot), out bool Found);
            if (Result is not null) return Result;
            if (!Found && AntigravityDesktopClient.IsIdle(Snapshot) && DateTimeOffset.UtcNow >= MissingUntil)
                return new("needs_decision", "Antigravity 未找到对应的桌面请求 " + RequestId + " 请核对原会话是否收到提示词", new());
            await Task.Delay(TimeSpan.FromSeconds(1), Cancellation);
        }
    }

    private static async Task CancelOwnedTurnAsync(RelayTask Item)
    {
        using var Cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var Client = AntigravityDesktopClient.Connect();
        string Id = Item.Channel.WorkerThreadId;
        var Snapshot = await Client.TrajectoryAsync(Id, Cancellation.Token);
        if (AntigravityDesktopClient.IsIdle(Snapshot)) return;
        var Steps = await Client.StepsAsync(Id, Item.Channel.AntigravityStepOffset, AntigravityDesktopClient.StepCount(Snapshot), false, Cancellation.Token);
        string LastRequest = AntigravityDesktopClient.Text(Steps.Select(Step => AntigravityDesktopClient.Child(Step, "userInput"))
            .LastOrDefault(Input => Input.ValueKind == JsonValueKind.Object), "clientMessageId");
        if (LastRequest != Guid.Parse(Item.Id).ToString("D")) throw new InvalidOperationException("Antigravity 活动轮次无法确认属于联调任务 " + Item.Id);
        await Client.CancelAsync(Id, Cancellation.Token);
    }

    public static AntigravityReport? ReadTurn(string RequestId, IReadOnlyList<JsonElement> Steps, bool Idle, out bool Found)
    {
        Found = false;
        string Reply = "";
        string Failure = "";
        bool Pending = false;
        foreach (var Step in Steps)
        {
            var Input = AntigravityDesktopClient.Child(Step, "userInput");
            if (Input.ValueKind == JsonValueKind.Object)
            {
                if (Found) return new("needs_decision", "Antigravity 原请求完成前会话已收到下一条提示词 请核对原轮次", new());
                Found = AntigravityDesktopClient.Text(Input, "clientMessageId") == RequestId;
                continue;
            }
            if (!Found) continue;
            string Status = AntigravityDesktopClient.Text(Step, "status");
            if (Status is "CORTEX_STEP_STATUS_WAITING" or "CORTEX_STEP_STATUS_PENDING" or "CORTEX_STEP_STATUS_RUNNING" or "CORTEX_STEP_STATUS_GENERATING" or "CORTEX_STEP_STATUS_QUEUED")
                Pending = true;
            var Error = AntigravityDesktopClient.Child(AntigravityDesktopClient.Child(Step, "errorMessage"), "error");
            if (Error.ValueKind == JsonValueKind.Object)
            {
                string Detail = AntigravityDesktopClient.Text(Error, "shortError");
                Failure = Detail.Length == 0 ? AntigravityDesktopClient.Text(Error, "userErrorMessage") : Detail;
            }
            if (Status == "CORTEX_STEP_STATUS_CANCELED") Failure = "Antigravity 已取消原轮次";
            if (Status == "CORTEX_STEP_STATUS_ERROR") Failure = Failure.Length == 0 ? "Antigravity 原轮次包含执行错误" : Failure;
            if (Status != "CORTEX_STEP_STATUS_DONE") continue;
            string Message = AntigravityDesktopClient.Text(AntigravityDesktopClient.Child(Step, "plannerResponse"), "response");
            if (Message.Length == 0) Message = AntigravityDesktopClient.Text(AntigravityDesktopClient.Child(Step, "notifyUser"), "notificationContent");
            if (!string.IsNullOrWhiteSpace(Message)) Reply = Message;
        }
        if (!Found || !Idle || Pending) return null;
        if (Failure.Length != 0) return new("failed", Failure, new());
        if (Reply.Length == 0) return new("failed", "Antigravity 原轮次结束但没有最终回复", new());
        var Result = JsonSerializer.Deserialize<AntigravityReport>(Reply, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        if (Result is null || Result.Outcome is not ("completed" or "needs_decision" or "failed") || string.IsNullOrWhiteSpace(Result.Summary) ||
            Result.Summary.Length > RelayLimits.MaxTextLength || Result.Artifacts is null || Result.Artifacts.Count > 20 ||
            Result.Artifacts.Any(Value => string.IsNullOrWhiteSpace(Value) || Value.Length > 1024 || !Path.IsPathFullyQualified(Value)))
            throw new InvalidDataException("Antigravity 最终回复不符合 outcome summary artifacts 契约");
        return Result;
    }

    private static string BuildPrompt(RelayTask Item) => $$"""
        [MmCodexMgr Antigravity 联调任务]
        任务 ID {{Item.Id}}
        任务 {{Item.Title}}
        执行要求 {{Item.Instructions}}
        验收标准 {{Item.Acceptance}}
        工作区 {{Item.Workspace.Access}}
        允许写入路径
        {{string.Join("\n", Item.Workspace.WritePathList)}}
        只读任务禁止写入文件 本轮直接完成 遵守仓库规范 不创建下级代理或会话 不调用 mmcodex 回报
        最终回复只输出合法 JSON 不加 Markdown 围栏
        {"outcome":"completed|needs_decision|failed","summary":"实际结果与验证证据","artifacts":["产物绝对路径"]}
        没有产物使用空数组 无法完成时如实回报 由管理器保存并回传
        """;
    #endregion
}
