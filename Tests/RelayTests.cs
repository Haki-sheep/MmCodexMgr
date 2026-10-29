using System.Text;
using System.Text.Json;
using CodexInstanceManager;

internal static class RelayTests
{
    private static int Count;

    #region Entry
    public static void Run() => Task.Run(VerifyAsync).GetAwaiter().GetResult();

    public static int LiveProbe()
    {
        try
        {
            var Main = SettingsStore.Load().InstanceList.Single(Item => Item.IsPrimary);
            using var Bridge = new DesktopRelayBridge();
            var ThreadList = Bridge.ListThreadsAsync(Main, CancellationToken.None).GetAwaiter().GetResult();
            Require(ThreadList.Count > 0 && ThreadList.All(Item => Item.Id.Length > 0), "native desktop pipe returns real local sessions without model generation");
            Console.WriteLine("PASS native desktop bridge read-only probe; local sessions=" + ThreadList.Count);
            return 0;
        }
        catch (Exception Error) { Console.Error.WriteLine(Error); return 1; }
    }

    public static int Render(string FilePath, bool DarkMode = true)
    {
        ApplicationConfiguration.Initialize();
        string Root = Path.Combine(Path.GetTempPath(), "CodexMgrRelayRender-" + Guid.NewGuid().ToString("N"));
        var Store = new RelayStore(Root);
        var Channel = CreateChannel(Root);
        Channel.TimeoutMinutes = 0;
        Store.SaveChannel(Channel);
        var Bridge = new FakeBridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        var PreviewList = new[]
        {
            ("探查资源范围", eRelayState.Sending, ""), ("批量提取资源", eRelayState.Running, ""),
            ("校验提取结果", eRelayState.Returned, "completed"), ("核对异常文件", eRelayState.ReturnUncertain, "needs_decision"),
            ("整理已验收资源", eRelayState.Accepted, "completed")
        };
        foreach (var Preview in PreviewList) Store.Save(new RelayTask { RequestKey = Preview.Item1, Channel = Channel, Title = Preview.Item1, State = Preview.Item2, Outcome = Preview.Item3, ProgressStage = Preview.Item2 == eRelayState.Running ? "started" : "" });
        var Settings = new ManagerSettings { InstanceList = new() { Channel.MainInstance, Channel.WorkerInstance }, SelectedId = Channel.MainInstance.Id, DarkMode = DarkMode };
        using var Form = new MainForm(Settings, true, Store, Coordinator);
        Form.ShowRelayPage();
        Form.Show();
        Application.DoEvents();
        var Toggle = Descendants(Form).OfType<Button>().Single(Item => Item.Name == AppTheme.ToggleButtonName && Item.Visible);
        var Grid = Descendants(Form).OfType<DataGridView>().Single();
        var TimeoutInput = Descendants(Form).OfType<NumericUpDown>().Single(Item => Item.Maximum == 1440);
        Require(TimeoutInput.Minimum == 0 && TimeoutInput.Value == 0 && Descendants(Form).OfType<Label>().Any(Item => Item.Text.Contains("0无限")), "timeout control loads unlimited wait and labels its zero value");
        Require(Grid.Columns.Count == 6 && Grid.Columns[2].HeaderText == "主Agent" && Grid.Columns[3].HeaderText == "子Agent" && Grid.Columns[4].HeaderText == "执行状态", "task table exposes both agent identities before status and actions");
        Require(Grid.Rows.Cast<DataGridViewRow>().All(Item => Item.Cells[2].Value?.ToString() == "高级模型 · 格式探查" && Item.Cells[3].Value?.ToString() == "快速模型 · 批量解包"), "agent columns display session titles without instance names");
        Require(Grid.RowCount == 5 && Grid.Rows.Cast<DataGridViewRow>().Select(Item => Item.Cells[4].Value?.ToString()).ToHashSet().SetEquals(new[] { "未开始", "子Agent正在执行", "主Agent正在执行", "已阻塞", "已结束" }), "preview demonstrates exactly one of the five workflow states in each row");
        Require(Grid.Rows.Cast<DataGridViewRow>().All(Item => Item.Cells[5].Value?.ToString() == (Item.Cells[4].Value?.ToString() == "已结束" ? "删除" : "中断任务")), "finished rows expose deletion while unfinished rows keep interruption");
        var ClearFinished = Descendants(Form).OfType<Button>().Single(Item => Item.Text == "清空已结束");
        var ClearBlocked = Descendants(Form).OfType<Button>().Single(Item => Item.Text == "清空已阻塞");
        Require(ClearFinished.Visible && ClearBlocked.Visible, "task footer exposes finished and blocked cleanup");
        Require(ReferenceEquals(ClearFinished.Parent, ClearBlocked.Parent) && ClearBlocked.Right <= ClearFinished.Left, "blocked cleanup is placed to the left of finished cleanup");
        Require(ClearBlocked.Parent!.ClientRectangle.Contains(ClearBlocked.Bounds) && ClearFinished.Parent!.ClientRectangle.Contains(ClearFinished.Bounds), "both cleanup buttons fit inside the footer");
        Toggle.PerformClick();
        Application.DoEvents();
        Require(Settings.DarkMode != DarkMode && Grid.BackgroundColor == (Settings.DarkMode ? ThemePalette.Dark.Surface : ThemePalette.Light.Surface), "theme toggle updates settings and existing task table together");
        Toggle.PerformClick();
        Application.DoEvents();
        Require(Settings.DarkMode == DarkMode && ReferenceEquals(Grid, Descendants(Form).OfType<DataGridView>().Single()), "switching appearance preserves the task table instance");
        using var Image = new Bitmap(Form.Width, Form.Height);
        Form.DrawToBitmap(Image, new Rectangle(0, 0, Image.Width, Image.Height));
        Image.Save(FilePath);
        VerifyHistoryPagination(Path.Combine(Root, "pagination"), DarkMode);
        Console.WriteLine("PASS relay UI render " + FilePath);
        return 0;
    }

    #endregion

    #region Verification
    private static async Task VerifyAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexMgrRelayTests-" + Guid.NewGuid().ToString("N"));
        var Store = new RelayStore(Root);
        var Bridge = new FakeBridge();
        var Channel = CreateChannel(Root);
        using (var Coordinator = new RelayCoordinator(Store, Bridge))
        {
            await Coordinator.ConfigureAsync(Channel);
            var Item = await Coordinator.DispatchAsync("main", "main-thread", "req-1", "提取", "处理输入目录", "清单与样本检查");
            Require(Item.State == eRelayState.Running && Bridge.SentList.Count == 1, "dispatch delivers to worker exactly once");
            Require(Bridge.SentList[0].InstanceId == "worker" && Bridge.SentList[0].ThreadId == "worker-thread", "dispatch remains bound to worker instance and session");
            Require(Bridge.SentList[0].Model.Length == 0 && RelayLimits.DisplayStateText(Item.State, Item.Outcome) == "子Agent正在执行", "worker retains its selected model while workflow belongs to worker");
            var Again = await Coordinator.DispatchAsync("main", "main-thread", "req-1", "提取", "处理输入目录", "清单与样本检查");
            Require(Again.Id == Item.Id && Bridge.SentList.Count == 1, "retry with same request id does not start another task");
            await RejectAsync(() => Coordinator.DispatchAsync("main", "main-thread", "req-1", "不同任务", "处理输入目录", "检查"), "same request id cannot replace a task");
            await RejectAsync(() => Coordinator.DispatchAsync("worker", "worker-thread", "req-2", "提取", "处理", "检查"), "worker cannot impersonate main");
            await RejectAsync(() => Coordinator.DispatchAsync("main", "main-thread", "req-2", "提取", "处理", "检查"), "channel admits one running task");
            await RejectAsync(() => Coordinator.ReportAsync("worker", "wrong-thread", Item.Id, "completed", "完成", new()), "wrong thread cannot report");
            var Reported = await Coordinator.ReportAsync("worker", "worker-thread", Item.Id, "completed", "已输出 20 个文件 样本检查通过", new() { Path.Combine(Root, "output") });
            Require(Reported.State == eRelayState.Returned && Bridge.SentList.Count == 2, "explicit callback resumes main without polling");
            Require(Store.List().Single(Row => Row.Id == Item.Id).Outcome == "completed" && RelayLimits.DisplayStateText(Reported.State, Reported.Outcome) == "主Agent正在执行", "summary carries completion outcome for main workflow ownership");
            Require(Bridge.SentList[1].InstanceId == "main" && Bridge.SentList[1].Prompt.Contains(Item.Id), "result goes to original bound main with task identity");
            await Coordinator.ReportAsync("worker", "worker-thread", Item.Id, "completed", Reported.Result, Reported.ArtifactList);
            Require(Bridge.SentList.Count == 2, "identical callback is acknowledged without another wakeup");
            await RejectAsync(() => Coordinator.ReportAsync("worker", "worker-thread", Item.Id, "completed", "偷偷替换", new()), "result cannot be overwritten");
            await Coordinator.ReviewAsync("main", "main-thread", Item.Id);
            Require(Store.Get(Item.Id).State == eRelayState.Accepted, "completion and acceptance are separate transitions");

            var Cancelled = await Coordinator.DispatchAsync("main", "main-thread", "req-cancel", "撤销测试", "处理", "检查");
            await Coordinator.CancelAsync(Cancelled.Id);
            await RejectAsync(() => Coordinator.ReportAsync("worker", "worker-thread", Cancelled.Id, "completed", "迟到报告", new()), "cancelled task rejects late callback");

            Bridge.FailNext = true;
            await RejectAsync(() => Coordinator.DispatchAsync("main", "main-thread", "req-fail", "派发故障", "处理", "检查"), "transport error remains visible");
            var Uncertain = Store.FindRequest("req-fail")!;
            Require(Uncertain.State == eRelayState.DispatchUncertain && Store.HasBlockingTask(), "unconfirmed dispatch persists and holds channel");
            await Coordinator.CancelAsync(Uncertain.Id);

            var ReturnFailure = await Coordinator.DispatchAsync("main", "main-thread", "req-return", "回传故障", "处理", "检查");
            Bridge.FailNext = true;
            await RejectAsync(() => Coordinator.ReportAsync("worker", "worker-thread", ReturnFailure.Id, "failed", "已保留首错", new()), "return transport failure is surfaced");
            Require(Store.Get(ReturnFailure.Id).Result == "已保留首错" && Store.Get(ReturnFailure.Id).State == eRelayState.ReturnUncertain, "result survives failed return");
            int BeforeRetry = Bridge.SentList.Count;
            await Coordinator.ReportAsync("worker", "worker-thread", ReturnFailure.Id, "failed", "已保留首错", new());
            Require(Bridge.SentList.Count == BeforeRetry, "ambiguous return is never automatically retried");
            await Coordinator.RetryReturnAsync(ReturnFailure.Id);
            Require(Store.Get(ReturnFailure.Id).State == eRelayState.Returned, "operator can explicitly retry return after checking");
            await RejectAsync(() => Coordinator.ReviewAsync("main", "main-thread", ReturnFailure.Id), "failed execution cannot pass acceptance");

            var Interrupted = await Coordinator.DispatchAsync("main", "main-thread", "req-exit", "实例退出", "处理", "检查");
            var ExitSignal = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            Coordinator.Changed += () => { if (Store.Get(Interrupted.Id).EventList.Last().Contains("异常通知已提交")) ExitSignal.TrySetResult(); };
            Bridge.RaiseExit("worker");
            await ExitSignal.Task.WaitAsync(TimeSpan.FromSeconds(5));
            Require(Store.Get(Interrupted.Id).State == eRelayState.Interrupted && Bridge.SentList.Last().Prompt.Contains("执行实例已经退出"), "process exit wakes main through an event without polling");
            await RejectAsync(() => Coordinator.ReportAsync("worker", "worker-thread", Interrupted.Id, "completed", "迟到结果", new()), "interrupted task rejects late results");
        }

        var RestartItem = new RelayTask { RequestKey = "restart", Title = "重启恢复", Channel = Channel, State = eRelayState.Returning, Result = "已落盘" };
        Store.Save(RestartItem);
        using (var Restored = new RelayCoordinator(new RelayStore(Root), Bridge))
            Require(Store.Get(RestartItem.Id).State == eRelayState.ReturnUncertain && Bridge.SentList.All(Item => !Item.Prompt.Contains("重启恢复")), "restart marks interrupted delivery uncertain without replay");

        var Old = new RelayTask { RequestKey = "deadline", Title = "超时", Channel = Channel, State = eRelayState.Running, CreatedAt = DateTimeOffset.UtcNow.AddHours(-2) };
        Store.Save(Old);
        using (var Timed = new RelayCoordinator(Store, Bridge))
        {
            var Signal = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            Timed.Changed += () => Signal.TrySetResult();
            if (Store.Get(Old.Id).State != eRelayState.TimedOut) await Signal.Task.WaitAsync(TimeSpan.FromSeconds(5));
            Require(Store.Get(Old.Id).State == eRelayState.TimedOut, "one-shot deadline handles a missed callback after restart");
        }

        await VerifyInfiniteTimeoutAsync(Path.Combine(Root, "infinite"));
        await VerifyHistoryAsync(Path.Combine(Root, "history"));
        await RelayCleanupTests.RunAsync();
        await VerifyMcpAsync();
        await VerifyHostFlowAsync(Path.Combine(Root, "host"));
        await VerifyFrameLimitAsync();
        VerifyInstallation(Root, Channel);
        for (int Index = 0; Index < RelayLimits.PageSize + 3; Index++) Store.Save(new RelayTask { RequestKey = "page-" + Index, Title = "分页", State = eRelayState.Accepted, Instructions = new string('x', RelayLimits.MaxTextLength) });
        long Before = GC.GetTotalAllocatedBytes(true);
        var Page = Store.List();
        long Allocated = GC.GetTotalAllocatedBytes(true) - Before;
        Require(Page.Count == RelayLimits.PageSize && Allocated < 1024 * 1024, "task page only reads bounded summaries under 1 MiB allocation");
        Console.WriteLine($"PASS relay {Count} assertions; summary page allocated={Allocated:N0} B; fixture={Root}");
    }

    /// <summary>无限等待在派发 核对恢复和重启后仍可正常回报或手动中断</summary>
    private static async Task VerifyInfiniteTimeoutAsync(string Root)
    {
        var Store = new RelayStore(Root);
        var Bridge = new FakeBridge();
        var Channel = CreateChannel(Root);
        using (var Coordinator = new RelayCoordinator(Store, Bridge))
        {
            Channel.TimeoutMinutes = -1;
            await RejectAsync(() => Coordinator.ConfigureAsync(Channel), "negative timeout is rejected");
            Channel.TimeoutMinutes = 1441;
            await RejectAsync(() => Coordinator.DispatchAsync("main", "main-thread", "invalid-timeout", "非法等待", "处理", "检查", Channel), "timeout above one day is rejected");
            Channel.TimeoutMinutes = 0;
            await Coordinator.ConfigureAsync(Channel);
            Require(Store.LoadChannel()!.TimeoutMinutes == 0, "unlimited channel survives persistence");
            var Item = await Coordinator.DispatchAsync("main", "main-thread", "infinite", "无限等待", "处理", "检查");
            Require(Item.DeadlineAt is null && Item.State == eRelayState.Running, "unlimited dispatch has no deadline");
            Bridge.FailNext = true;
            await RejectAsync(() => Coordinator.ReportAsync("worker", "worker-thread", Item.Id, "completed", "完成", new()), "unlimited task still exposes delivery failures");
            await Coordinator.RetryReturnAsync(Item.Id);
            await Coordinator.ReviewAsync("main", "main-thread", Item.Id);

            Bridge.FailNext = true;
            await RejectAsync(() => Coordinator.DispatchAsync("main", "main-thread", "infinite-reconcile", "核对无限等待", "处理", "检查"), "uncertain unlimited dispatch stays recoverable");
            var Uncertain = Store.FindRequest("infinite-reconcile")!;
            await Coordinator.ReconcileAsync("main", "main-thread", Uncertain.Id, "worker-thread", "执行会话");
            Require(Store.Get(Uncertain.Id).DeadlineAt is null, "reconciliation preserves unlimited wait");
            await Coordinator.CancelAsync(Uncertain.Id);
            await RejectAsync(() => Coordinator.ReportAsync("worker", "worker-thread", Uncertain.Id, "completed", "迟到报告", new()), "manual cancellation still rejects late unlimited reports");
        }

        var Old = new RelayTask { RequestKey = "infinite-restart", Title = "重启无限等待", Channel = Channel,
            State = eRelayState.Running, CreatedAt = DateTimeOffset.UtcNow.AddYears(-1) };
        Store.Save(Old);
        using (var Restored = new RelayCoordinator(new RelayStore(Root), Bridge))
        {
            await Task.Delay(150);
            Require(Store.Get(Old.Id).State == eRelayState.Running && Store.Get(Old.Id).DeadlineAt is null, "old unlimited task remains running after restart");
            await Restored.ReportAsync("worker", "worker-thread", Old.Id, "completed", "长任务完成", new());
            await Restored.ReviewAsync("main", "main-thread", Old.Id);
            Require(Store.Get(Old.Id).State == eRelayState.Accepted, "restarted unlimited task can finish and pass acceptance");
        }
        using var Catalog = JsonDocument.Parse(JsonSerializer.Serialize(AgentToolCatalog.Tools()));
        var TimeoutSchema = Catalog.RootElement.EnumerateArray().Single(Item => Item.GetProperty("name").GetString() == "agent_start")
            .GetProperty("inputSchema").GetProperty("properties").GetProperty("timeout_minutes");
        Require(TimeoutSchema.GetProperty("minimum").GetInt32() == 0 && TimeoutSchema.GetProperty("description").GetString()!.Contains("无限等待"), "MCP exposes zero timeout with unlimited semantics");
        Require(AgentCli.Help.Contains("0 表示无限等待"), "CLI documents unlimited timeout");
    }

    private static async Task VerifyHistoryAsync(string Root)
    {
        var Store = new RelayStore(Root);
        var Bridge = new FakeBridge();
        var Channel = CreateChannel(Root);
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        await Coordinator.ConfigureAsync(Channel);
        var Running = await Coordinator.DispatchAsync("main", "main-thread", "history-running", "清理期间执行", "处理", "检查");
        var UnfinishedList = Enum.GetValues<eRelayState>().Where(State => State is not (eRelayState.Accepted or eRelayState.Cancelled))
            .Select(State => new RelayTask { RequestKey = "keep-" + State, Title = "保留-" + State, State = State, Channel = Channel }).ToList();
        foreach (var Item in UnfinishedList) Store.Save(Item);
        foreach (var Item in UnfinishedList) await RejectAsync(() => Coordinator.DeleteHistoryAsync(Item.Id), "unfinished or unreviewed records cannot be deleted");
        string ArtifactPath = Path.Combine(Root, "artifact.txt");
        File.WriteAllText(ArtifactPath, "保留产物");
        var Finished = new RelayTask { RequestKey = "history-single", Title = "单条删除", State = eRelayState.Accepted, Channel = Channel, ArtifactList = new() { ArtifactPath } };
        var Cancelled = new RelayTask { RequestKey = "history-cancelled", Title = "已中断记录", State = eRelayState.Cancelled, Channel = Channel };
        Store.Save(Finished);
        Store.Save(Cancelled);
        int Changes = 0;
        Coordinator.Changed += () => Changes++;
        await Coordinator.DeleteHistoryAsync(Finished.Id);
        Require(new RelayStore(Root).FindTask(Finished.Id) is null && Store.Get(Cancelled.Id).State == eRelayState.Cancelled, "single deletion persists without removing other finished records");
        Require(File.ReadAllText(ArtifactPath) == "保留产物", "deleting history preserves referenced project artifacts");
        await RejectAsync(() => Coordinator.DeleteHistoryAsync(Finished.Id), "missing history is reported rather than silently succeeding");
        for (int Index = 0; Index < RelayLimits.PageSize + 3; Index++)
            Store.Save(new RelayTask { RequestKey = "history-page-" + Index, Title = "跨页清理", State = Index % 2 == 0 ? eRelayState.Accepted : eRelayState.Cancelled, Channel = Channel });
        int DeletedCount = await Coordinator.ClearHistoryAsync();
        Require(DeletedCount == RelayLimits.PageSize + 4 && Store.Count() == UnfinishedList.Count + 1, "bulk cleanup removes finished history across every page");
        Require(UnfinishedList.All(Item => JsonSerializer.Serialize(Store.Get(Item.Id)) == JsonSerializer.Serialize(Item)), "bulk cleanup preserves every unfinished state and its original evidence");
        Require(Store.LoadChannel()!.MainThreadId == Channel.MainThreadId && File.ReadAllText(ArtifactPath) == "保留产物", "history cleanup retains channel configuration and project files");
        Require(await Coordinator.ClearHistoryAsync() == 0 && Changes == 3, "empty cleanup is repeatable and history mutations notify the page");
        await Coordinator.ReportAsync("worker", "worker-thread", Running.Id, "completed", "清理后正常回传", new());
        await Coordinator.ReviewAsync("main", "main-thread", Running.Id);
        Require(Store.Get(Running.Id).State == eRelayState.Accepted && Bridge.SentList.Count == 2, "active coordination still reports and accepts after history cleanup");
    }

    private static void VerifyHistoryPagination(string Root, bool DarkMode)
    {
        var Store = new RelayStore(Root);
        var Channel = CreateChannel(Root);
        using var Coordinator = new RelayCoordinator(Store, new FakeBridge());
        string LastTaskId = "";
        for (int Index = 0; Index <= RelayLimits.PageSize; Index++)
        {
            var Item = new RelayTask { RequestKey = "page-" + Index, Title = "已结束-" + Index, State = eRelayState.Accepted };
            Store.Save(Item);
            if (Index == 0) LastTaskId = Item.Id;
        }
        var Settings = new ManagerSettings { InstanceList = new() { Channel.MainInstance, Channel.WorkerInstance }, SelectedId = Channel.MainInstance.Id, DarkMode = DarkMode };
        using var Form = new MainForm(Settings, true, Store, Coordinator);
        Form.ShowRelayPage();
        Form.Show();
        Application.DoEvents();
        var Grid = Descendants(Form).OfType<DataGridView>().Single();
        Descendants(Form).OfType<Button>().Single(Item => Item.Text == "下一页").PerformClick();
        Require(Grid.RowCount == 1, "history pagination reaches the final single-row page");
        Coordinator.DeleteHistoryAsync(LastTaskId).GetAwaiter().GetResult();
        Require(Grid.RowCount == RelayLimits.PageSize && Descendants(Form).OfType<Label>().Any(Item => Item.Text == "第 1 页"), "deleting the final row returns to the last populated page");
        Coordinator.ClearHistoryAsync().GetAwaiter().GetResult();
        Require(Grid.RowCount == 0 && Descendants(Form).OfType<Label>().Any(Item => Item.Text == "第 1 页"), "clearing history leaves a stable empty first page");
        for (int Index = 0; Index <= RelayLimits.PageSize; Index++)
            Store.Save(new RelayTask { RequestKey = "blocked-page-" + Index, Title = "已阻塞-" + Index, State = eRelayState.TimedOut });
        Form.Hide(); Form.Show(); Application.DoEvents();
        Descendants(Form).OfType<Button>().Single(Item => Item.Text == "下一页").PerformClick();
        Require(Grid.RowCount == 1, "blocked history reaches the final page");
        Coordinator.ClearBlockedHistoryAsync().GetAwaiter().GetResult();
        Require(Grid.RowCount == 0 && Descendants(Form).OfType<Label>().Any(Item => Item.Text == "第 1 页"), "clearing blocked history refreshes the grid and returns to the empty first page");
    }

    private static async Task VerifyMcpAsync()
    {
        string Request = "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\"}}\n{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}\n{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\"}\n";
        using var Input = new MemoryStream(Encoding.UTF8.GetBytes(Request));
        using var Output = new MemoryStream();
        await RelayMcp.RunAsync("main", Input, Output, CancellationToken.None);
        string[] ResponseList = Encoding.UTF8.GetString(Output.ToArray()).Split('\n', StringSplitOptions.RemoveEmptyEntries);
        using var Initialize = JsonDocument.Parse(ResponseList[0]);
        using var Catalog = JsonDocument.Parse(ResponseList[1]);
        Require(ResponseList.Length == 2 && Initialize.RootElement.GetProperty("result").GetProperty("protocolVersion").GetString() == "2025-06-18", "MCP handshake handles notifications without bogus responses");
        var ToolList = Catalog.RootElement.GetProperty("result").GetProperty("tools");
        Require(ToolList.GetArrayLength() == 18 && new[] { "agent_start", "relay_progress", "agent_open", "agent_resume", "agent_cleanup" }.All(Name => ToolList.EnumerateArray().Any(Item => Item.GetProperty("name").GetString() == Name)), "MCP exposes routed startup progress session opening recovery cleanup and legacy contracts together");
        using var Metadata = JsonDocument.Parse("{\"x-codex-turn-metadata\":\"{\\\"thread_id\\\":\\\"bound-thread\\\"}\"}");
        Require(RelayMcp.ReadThreadId(Metadata.RootElement) == "bound-thread", "thread ownership comes from Codex executor metadata");
    }

    private static async Task VerifyFrameLimitAsync()
    {
        using var Input = new MemoryStream(new byte[] { 255, 255, 255, 127 });
        bool Rejected = false;
        try { await RelayWire.ReadAsync(Input, RelayLimits.MaxFrameBytes, CancellationToken.None); }
        catch (InvalidDataException) { Rejected = true; }
        Require(Rejected, "oversized frame is rejected as invalid data before payload allocation");
    }

    private static async Task VerifyHostFlowAsync(string Root)
    {
        var Store = new RelayStore(Root);
        var Bridge = new FakeBridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        await Coordinator.ConfigureAsync(CreateChannel(Root));
        string PipeName = "MmCodexMgr-Test-" + Guid.NewGuid().ToString("N");
        using var Host = new RelayHost(Coordinator, PipeName);
        var Dispatch = await CallMcpAsync("main", "main-thread", "relay_dispatch", new { request_id = "wire-1", title = "协议回环", instructions = "执行固定操作", acceptance = "结果验证" }, PipeName);
        string TaskId = Dispatch.GetProperty("task_id").GetString()!;
        Require(Store.Get(TaskId).State == eRelayState.Running, "MCP metadata crosses actual named-pipe host and dispatches task");
        var Reports = await Task.WhenAll(
            CallMcpAsync("worker", "worker-thread", "relay_report", new { task_id = TaskId, outcome = "completed", summary = "完成", artifacts = Array.Empty<string>() }, PipeName),
            CallMcpAsync("worker", "worker-thread", "relay_report", new { task_id = TaskId, outcome = "completed", summary = "完成", artifacts = Array.Empty<string>() }, PipeName));
        Require(Reports.Length == 2 && Bridge.SentList.Count == 2, "concurrent callbacks through separate pipe clients cause one main wakeup");
        await CallMcpAsync("main", "main-thread", "relay_accept", new { task_id = TaskId }, PipeName);
        Require(Store.Get(TaskId).State == eRelayState.Accepted, "full MCP dispatch-report-accept roundtrip persists final acceptance");
    }

    private static async Task<JsonElement> CallMcpAsync(string InstanceId, string ThreadId, string Tool, object Arguments, string PipeName)
    {
        string Request = JsonSerializer.Serialize(new { jsonrpc = "2.0", id = 1, method = "tools/call", @params = new { name = Tool, arguments = Arguments, _meta = new Dictionary<string, string> { ["openai/threadId"] = ThreadId } } }) + "\n";
        using var Input = new MemoryStream(Encoding.UTF8.GetBytes(Request));
        using var Output = new MemoryStream();
        await RelayMcp.RunAsync(InstanceId, Input, Output, CancellationToken.None, PipeName, Path.Combine(Path.GetTempPath(), "CodexRelayTestOutbox", PipeName));
        using var Response = JsonDocument.Parse(Output.ToArray());
        var Result = Response.RootElement.GetProperty("result");
        if (Result.GetProperty("isError").GetBoolean()) throw new Exception("MCP fixture failed " + Result.GetRawText());
        using var Payload = JsonDocument.Parse(Result.GetProperty("content")[0].GetProperty("text").GetString()!);
        return Payload.RootElement.Clone();
    }

    private static void VerifyInstallation(string Root, RelayChannel Channel)
    {
        Directory.CreateDirectory(Channel.MainInstance.HomePath);
        string ConfigPath = Path.Combine(Channel.MainInstance.HomePath, "config.toml");
        File.WriteAllText(ConfigPath, "model='keep-model'\n[mcp_servers.existing]\ncommand='keep-command'\n");
        string Backup = RelayToolInstaller.Install(Channel.MainInstance, Environment.ProcessPath!, Path.Combine(Root, "backups"));
        var Config = Tomlyn.Toml.ToModel(File.ReadAllText(ConfigPath));
        Require((string)Config["model"] == "keep-model" && File.ReadAllText(Backup).Contains("keep-command"), "MCP installation backs up config and retains model");
        Require(((Tomlyn.Model.TomlTable)Config["mcp_servers"]).ContainsKey("existing"), "MCP installation preserves other servers");
        RelayToolInstaller.RequireInstalled(Channel.MainInstance);
        bool WrongInstanceRejected = false;
        try { RelayToolInstaller.RequireInstalled(new InstanceProfile { Id = "wrong-instance", Name = "wrong", HomePath = Channel.MainInstance.HomePath }); }
        catch (InvalidOperationException) { WrongInstanceRejected = true; }
        Require(WrongInstanceRejected, "installed helper cannot be reused with a different instance identity");
    }

    private static RelayChannel CreateChannel(string Root) => new()
    {
        MainInstance = new() { Id = "main", Name = "主实例", HomePath = Path.Combine(Root, "main"), IsPrimary = true },
        WorkerInstance = new() { Id = "worker", Name = "执行实例", HomePath = Path.Combine(Root, "worker") },
        MainThreadId = "main-thread", WorkerThreadId = "worker-thread", MainTitle = "高级模型 · 格式探查", WorkerTitle = "快速模型 · 批量解包"
    };

    #endregion

    #region Assertions
    private static IEnumerable<Control> Descendants(Control Root)
    {
        foreach (Control Child in Root.Controls)
        {
            yield return Child;
            foreach (var Descendant in Descendants(Child)) yield return Descendant;
        }
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED relay: " + Message);
        Count++;
    }

    private static async Task RejectAsync(Func<Task> Action, string Message)
    {
        try { await Action(); }
        catch (Exception Error) when (Error is InvalidOperationException or IOException) { Count++; return; }
        throw new Exception("FAILED relay: " + Message);
    }

    private sealed class FakeBridge : IRelayBridge, IRelayProcessEvents
    {
        public List<(string InstanceId, string ThreadId, string Prompt, string Model)> SentList { get; } = new();
        public bool FailNext { get; set; }
        public event Action<string>? InstanceExited;
        public void RaiseExit(string InstanceId) => InstanceExited?.Invoke(InstanceId);
        public Task WatchAsync(InstanceProfile Instance, CancellationToken Cancellation) => Task.CompletedTask;
        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation)
        {
            SentList.Add((Instance.Id, ThreadId, Prompt, Model));
            if (FailNext) { FailNext = false; throw new IOException("fixture transport error"); }
            return Task.CompletedTask;
        }
    }
    #endregion
}
