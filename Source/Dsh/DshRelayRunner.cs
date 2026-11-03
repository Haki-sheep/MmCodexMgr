using System.Collections.Concurrent;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed class DshRelayRunner : IDisposable
{
    /// <summary> 桌面执行端标识 </summary>
    public const string InstanceId = "dsh";
    /// <summary> 执行任务与监测生命周期 </summary>
    private readonly ConcurrentDictionary<string, CancellationTokenSource> RunningDict = new();
    /// <summary> 用户取消与管理器退出分别处理 </summary>
    private readonly ConcurrentDictionary<string, bool> StopRequestDict = new();
    /// <summary> 桌面连接工厂 </summary>
    private readonly Func<DshSettings, CancellationToken, Task<DshDesktopClient>> Connect;

    public DshRelayRunner(Func<DshSettings, CancellationToken, Task<DshDesktopClient>>? Connect = null) => this.Connect = Connect ?? DshDesktopClient.ConnectAsync;
    public void Dispose() { foreach (var Entry in RunningDict) { lock (Entry.Value) { if (RunningDict.ContainsKey(Entry.Key)) Entry.Value.Cancel(); } } }
    public void Stop(string TaskId)
    {
        if (!RunningDict.TryGetValue(TaskId, out var Lifetime)) return;
        lock (Lifetime)
        {
            if (!RunningDict.ContainsKey(TaskId)) return;
            StopRequestDict[TaskId] = true;
            Lifetime.Cancel();
        }
    }

    public static DshSettings Settings(RelayTask Item) => new() { HomePath = Item.Channel.WorkerInstance.HomePath, ServerUrl = Item.Channel.DshServerUrl };

    public async Task PrepareAsync(RelayTask Item, CancellationToken Cancellation, Action? PersistSession = null)
    {
        using var Client = await Connect(Settings(Item), Cancellation);
        if (Item.Channel.WorkerThreadId.Length == 0)
        {
            string Id = "session-" + Guid.NewGuid().ToString("D");
            // 先登记标识 创建失败后也能核对原会话
            Item.Channel.WorkerThreadId = Id;
            PersistSession?.Invoke();
            await Client.CreateAsync(Item.Channel.ProjectId, Item.Channel.CreateTitle, Id, Cancellation);
        }
        var Session = await Client.SessionAsync(Item.Channel.WorkerThreadId, Cancellation);
        if (Session.Running) throw new InvalidOperationException("DSH 会话正在执行 请等待原任务完成");
        if (!ManagerPaths.Same(Session.Cwd, Item.Channel.WorkingDirectory)) throw new InvalidOperationException("DSH 会话工作目录已变化 请重新核对目标");
    }

    public void Launch(RelayTask Item, Func<string, string, Task> Progress, Func<CursorReport, Task> Report, CancellationToken Cancellation, bool ObserveOnly = false)
    {
        var Lifetime = CancellationTokenSource.CreateLinkedTokenSource(Cancellation);
        if (!RunningDict.TryAdd(Item.Id, Lifetime)) { Lifetime.Dispose(); throw new InvalidOperationException("DSH 任务已在监测 " + Item.Id); }
        _ = ExecuteAsync(Item, Progress, Report, Lifetime, ObserveOnly);
    }

    private async Task ExecuteAsync(RelayTask Item, Func<string, string, Task> Progress, Func<CursorReport, Task> Report, CancellationTokenSource Lifetime, bool ObserveOnly)
    {
        try { await RunAsync(Item, Progress, Report, Lifetime, ObserveOnly); }
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

    private async Task RunAsync(RelayTask Item, Func<string, string, Task> Progress, Func<CursorReport, Task> Report, CancellationTokenSource Lifetime, bool ObserveOnly)
    {
        CursorReport Result;
        try
        {
            using var Client = await Connect(Settings(Item), Lifetime.Token);
            string RequestId = "mmcodex-" + Item.Id;
            if (!ObserveOnly)
            {
                var Session = await Client.SessionAsync(Item.Channel.WorkerThreadId, Lifetime.Token);
                if (Session.Running) throw new InvalidOperationException("DSH 发送前会话已被其他操作占用");
                await Client.PromptAsync(Session.Id, RequestId, BuildPrompt(Item), Lifetime.Token);
            }
            await Progress("started", ObserveOnly ? "DSH 已恢复原请求结果监测 未重复发送" : "DSH 桌面已受理任务 正在监测原请求");
            DshReply? Reply;
            while ((Reply = await Client.ReplyAsync(Item.Channel.WorkerThreadId, RequestId, Lifetime.Token)) is null) await Task.Delay(1000, Lifetime.Token);
            Result = Reply.Outcome == "completed" ? ParseReport(Reply.Text) : new("failed", Reply.Text, new());
        }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested)
        {
            if (StopRequestDict.ContainsKey(Item.Id))
            {
                try
                {
                    using var StopTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                    using var Client = await Connect(Settings(Item), StopTimeout.Token);
                    await Client.CancelRequestAsync(Item.Channel.WorkerThreadId, "mmcodex-" + Item.Id, StopTimeout.Token);
                }
                catch (Exception Error) { Program.LogError(Error); }
            }
            return;
        }
        catch (Exception Error) { Program.LogError(Error); Result = new("failed", "DSH 执行或结果读取失败 " + Error.Message + " 请核对原会话 不要自动重复发送", new()); }
        try { if (!Lifetime.IsCancellationRequested) await Report(Result); }
        catch (Exception Error) { Program.LogError(Error); }
    }

    public static CursorReport ParseReport(string Text)
    {
        using var Document = JsonDocument.Parse(Text);
        var Root = Document.RootElement;
        string Outcome = Root.GetProperty("outcome").GetString()!;
        string Summary = Root.GetProperty("summary").GetString()!;
        var ArtifactList = Root.GetProperty("artifacts").EnumerateArray().Select(Value => Value.GetString()!).ToList();
        if (Outcome is not ("completed" or "failed" or "needs_decision") || string.IsNullOrWhiteSpace(Summary) || Summary.Length > RelayLimits.MaxTextLength || ArtifactList.Count > 20 || ArtifactList.Any(Value => !Path.IsPathFullyQualified(Value))) throw new InvalidDataException("DSH 回复不符合 outcome summary artifacts 契约");
        return new(Outcome, Summary, ArtifactList);
    }

    public static string BuildPrompt(RelayTask Item) => $"[MmCodexMgr DSH 联调任务]\n任务 ID {Item.Id}\n任务 {Item.Title}\n执行要求\n{Item.Instructions}\n验收标准\n{Item.Acceptance}\n工作目录 {Item.Channel.WorkingDirectory}\n工作区 {Item.Workspace.Access}\n允许写入路径\n{string.Join("\n", Item.Workspace.WritePathList)}\n只读任务禁止修改文件 遵守工程规则 不扩大范围 本轮直接完成任务 不创建子代理或其他会话 不调用 mmcodex report progress accept 不使用 Codex 会话身份\n最终回复仅为合法 JSON 不加 Markdown 围栏 {{\"outcome\":\"completed|needs_decision|failed\",\"summary\":\"实际结果与验证证据\",\"artifacts\":[\"产物绝对路径\"]}} 无产物用空数组 无法完成必须如实报告 管理器负责读取并回传结果 主会话负责验收";
}
