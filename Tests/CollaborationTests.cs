using System.Text;
using System.Text.Json;
using CodexInstanceManager;

internal static class CollaborationTests
{
    private static int Count;
    private static readonly string Root = Path.Combine(Path.GetTempPath(), "CodexCollaborationTests-" + Guid.NewGuid().ToString("N"));

    #region Entry
    public static void Run() => Task.Run(VerifyAsync).GetAwaiter().GetResult();

    public static int EventProbe()
    {
        using var Monitor = new InstanceActivityMonitor();
        Monitor.Enable();
        var RunningList = InstanceService.ListRunning();
        Monitor.Track(RunningList);
        Require(Monitor.HookCount == 1 && Monitor.ProcessCount == RunningList.Count, "live monitor holds one window event hook and exit handles for each desktop process");
        Monitor.Disable();
        Require(Monitor.HookCount == 0 && Monitor.ProcessCount == 0, "native event and process handles are released");
        Console.WriteLine("PASS live process and window event subscriptions");
        return 0;
    }

    public static int Render(string PathValue, bool DarkMode)
    {
        ApplicationConfiguration.Initialize();
        var Store = new RelayStore(Path.Combine(Root, "render"));
        var Main = new InstanceProfile { Id = "main", Name = "主实例", HomePath = Path.Combine(Root, "main") };
        var Worker = new InstanceProfile { Id = "worker", Name = "资源执行实例", HomePath = Path.Combine(Root, "worker") };
        var Channel = new RelayChannel { MainInstance = Main, WorkerInstance = Worker, MainThreadId = "main-thread", WorkerThreadId = "worker-thread", TreeBudget = new() { MaxSessions = 8, MaxDepth = 3 } };
        Store.SaveChannel(Channel);
        using var Coordinator = new RelayCoordinator(Store, new Bridge());
        string Output = Path.Combine(Root, "output");
        var Parent = new RelayTask { RequestKey = "render-parent", Title = "资源导出与校验", Channel = Channel, State = eRelayState.Running, TreeRootId = "main/main-thread", ProgressStage = "progress", ProgressMessage = "已拆分贴图与音频任务 正在等待下级结果", Workspace = new() { Access = "write", WritePathList = new() { Output } } };
        Store.Save(Parent);
        Store.Save(new RelayTask { RequestKey = "render-child-a", Title = "提取贴图并生成清单", ParentTaskId = Parent.Id, TreeRootId = Parent.TreeRootId, TreeDepth = 2, Channel = new() { MainInstance = Worker, WorkerInstance = Worker, MainThreadId = "worker-thread", WorkerThreadId = "textures-thread" }, State = eRelayState.Running, ProgressStage = "progress", ProgressMessage = "已生成贴图清单 正在检查尺寸", ProgressAt = DateTimeOffset.UtcNow, Workspace = new() { Access = "write", WritePathList = new() { Path.Combine(Output, "textures") } } });
        Store.Save(new RelayTask { RequestKey = "render-child-b", Title = "核对音频异常", ParentTaskId = Parent.Id, TreeRootId = Parent.TreeRootId, TreeDepth = 2, Channel = new() { MainInstance = Worker, WorkerInstance = Main, MainThreadId = "worker-thread", WorkerThreadId = "audio-thread" }, State = eRelayState.Running, ProgressStage = "blocked", ProgressMessage = "两条音频的采样率与格式声明不符", Workspace = new() { Access = "write", WritePathList = new() { Path.Combine(Output, "audio") } } });
        var Settings = new ManagerSettings { InstanceList = new() { Main, Worker }, SelectedId = Main.Id, DarkMode = DarkMode };
        using var Form = new MainForm(Settings, true, Store, Coordinator);
        Form.ShowRelayPage(); Form.Show(); Application.DoEvents();
        var Grid = Descendants(Form).OfType<DataGridView>().Single();
        Require(Grid.RowCount == 1, "UI initially reads only roots");
        typeof(DataGridView).GetMethod("OnCellContentClick", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)!.Invoke(Grid, new object[] { new DataGridViewCellEventArgs(1, 0) });
        Application.DoEvents();
        Require(Grid.RowCount == 3 && Grid.Columns.Count == 6, "expanding keeps agent columns and displays immediate children");
        Require(Grid.Rows.Cast<DataGridViewRow>().Select(Row => Row.Cells[4].Value?.ToString()).Contains("已阻塞"), "blocked progress uses one visible status");
        using var Image = new Bitmap(Form.Width, Form.Height);
        Form.DrawToBitmap(Image, new Rectangle(0, 0, Image.Width, Image.Height));
        Image.Save(PathValue);
        using var Details = new RelayTaskDialog(Store, Coordinator, Parent.Id, new AppTheme(DarkMode));
        Details.Show(); Application.DoEvents();
        using var DetailImage = new Bitmap(Details.Width, Details.Height);
        Details.DrawToBitmap(DetailImage, new Rectangle(0, 0, DetailImage.Width, DetailImage.Height));
        DetailImage.Save(PathValue + ".details.png");
        Console.WriteLine("PASS collaboration UI " + PathValue);
        return 0;
    }
    #endregion

    #region Policies
    private static async Task VerifyAsync()
    {
        Directory.CreateDirectory(Root);
        await VerifyBudgetAsync();
        await VerifyWorkspaceAsync();
        await VerifyRecoveryAsync();
        await VerifyMcpAsync();
        VerifyTree();
        await VerifyDoctorAsync();
        Console.WriteLine($"PASS collaboration {Count} assertions; fixture={Root}");
    }

    private static async Task VerifyBudgetAsync()
    {
        var Store = new RelayStore(Path.Combine(Root, "budget"));
        var Bridge = new Bridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        var Budget = new RelayTreeBudget { MaxSessions = 3, MaxDepth = 2 };
        var First = await Dispatch(Coordinator, "a", "root", "b", Budget: Budget);
        await Dispatch(Coordinator, "c", "root", "c");
        var Child = await Dispatch(Coordinator, "d", "b", "d");
        Require(First.TreeRootId == Child.TreeRootId && Child.TreeDepth == 2 && Child.TreeBudget.MaxSessions == 3, "nested sessions inherit the root budget and depth");
        await Reject(() => Dispatch(Coordinator, "full", "c", "e"), "tree_session_max");
        Require(Bridge.SentList.Count == 3, "global capacity is checked before delivery across branches");
        await Reject(() => Dispatch(Coordinator, "raise", "root", "z", Budget: new() { MaxSessions = 4, MaxDepth = 2 }), "提高");
        await Coordinator.ProgressAsync("instance", "b", First.Id, "started", "开始执行");
        await Coordinator.ProgressAsync("instance", "b", First.Id, "progress", "完成贴图阶段");
        int Events = Store.Get(First.Id).EventList.Count;
        await Coordinator.ProgressAsync("instance", "b", First.Id, "progress", "完成贴图阶段");
        Require(Store.Get(First.Id).EventList.Count == Events && Bridge.SentList.Count == 3, "progress is idempotent and does not wake main");
        await Reject(() => Coordinator.ProgressAsync("instance", "other", First.Id, "progress", "伪造"), "不属于");
        await Coordinator.ReportAsync("instance", "d", Child.Id, "completed", "检查通过", new());
        await Coordinator.ReviewAsync("instance", "b", Child.Id);
        await Dispatch(Coordinator, "released", "c", "e");
        Require(Store.Reservations().Count == 3, "completed child releases one tracked slot");

        var DepthStore = new RelayStore(Path.Combine(Root, "depth"));
        using var DepthCoordinator = new RelayCoordinator(DepthStore, new Bridge());
        await Dispatch(DepthCoordinator, "depth-root", "root", "b", Budget: new() { MaxSessions = 8, MaxDepth = 1 });
        await Reject(() => Dispatch(DepthCoordinator, "too-deep", "b", "d"), "max_depth");
        Require(DepthStore.Count() == 1, "depth violation creates no hidden queued task");
    }

    private static async Task VerifyWorkspaceAsync()
    {
        var Store = new RelayStore(Path.Combine(Root, "workspace"));
        using var Coordinator = new RelayCoordinator(Store, new Bridge());
        string Folder = Path.Combine(Root, "project", "Assets");
        var Claim = new RelayWorkspace { Access = "write", WritePathList = new() { Folder } };
        await Dispatch(Coordinator, "writer", "root", "b", Workspace: Claim);
        await Reject(() => Dispatch(Coordinator, "overlap", "other-root", "c", Workspace: new() { Access = "write", WritePathList = new() { Path.Combine(Folder, "Textures") } }), "冲突");
        await Dispatch(Coordinator, "read", "other-root", "reader", Workspace: new() { Access = "read_only" });
        var Child = await Dispatch(Coordinator, "delegated", "b", "d", Workspace: new() { Access = "write", WritePathList = new() { Path.Combine(Folder, "Textures") } });
        Require(Child.Workspace.Access == "write", "ancestor may delegate part of its own write scope");
        await Reject(() => Dispatch(Coordinator, "sibling", "b", "e", Workspace: new() { Access = "write", WritePathList = new() { Path.Combine(Folder, "Textures", "Sub") } }), "冲突");
        await Reject(() => Dispatch(Coordinator, "escape", "b", "escape", Workspace: new() { Access = "write", WritePathList = new() { Path.Combine(Root, "outside") } }), "超出");
        await Reject(() => Dispatch(Coordinator, "readonly-write", "reader", "f", Workspace: new() { Access = "write", WritePathList = new() { Path.Combine(Root, "outside") } }), "只读");
        await Dispatch(Coordinator, "separate", "other-root", "worktree", Workspace: new() { Access = "write", WritePathList = new() { Path.Combine(Root, "other-worktree") } });
        Require(Store.Count() == 4, "separate write directories are admitted while conflicts leave no task records");
    }
    #endregion

    #region Recovery
    private static async Task VerifyRecoveryAsync()
    {
        string Outbox = Path.Combine(Root, "outbox");
        var Store = new RelayStore(Path.Combine(Root, "recovery"));
        var Bridge = new Bridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge);
        var Task = await Dispatch(Coordinator, "offline-report", "root", "b");
        var Report = new RelayRequest("instance", "b", "relay_report", JsonSerializer.SerializeToElement(new { task_id = Task.Id, outcome = "completed", summary = "离线期间已完成", artifacts = Array.Empty<string>() }));
        using var Cancellation = new CancellationTokenSource(TimeSpan.FromMilliseconds(30));
        try { await RelayOutbox.DeliverAsync(Report, Cancellation.Token, "missing-" + Guid.NewGuid().ToString("N"), Outbox); throw new Exception("offline report should fail"); }
        catch (IOException Error) { Require(Error.Message.Contains("发件箱"), "offline sender receives durable result location"); }
        Require(Directory.GetFiles(Outbox, "*.pending.json").Length == 1, "offline result is saved before transport");
        var Recovered = await RelayOutbox.ReplayOnceAsync(Coordinator, CancellationToken.None, Outbox);
        Require(Recovered.Recovered == 1 && Store.Get(Task.Id).State == eRelayState.Returned && Bridge.SentList.Count == 2, "startup recovery routes preserved result to original main once");
        await RelayOutbox.ReplayOnceAsync(Coordinator, CancellationToken.None, Outbox);
        Require(Bridge.SentList.Count == 2, "empty recovery never repeats main wakeup");
        await Coordinator.ReviewAsync("instance", "root", Task.Id);

        Bridge.FailNext = true;
        await Reject(() => Dispatch(Coordinator, "uncertain", "root", "c"), "fixture");
        var Uncertain = Store.FindRequest("uncertain")!;
        int SentBefore = Bridge.SentList.Count;
        await Coordinator.ReconcileAsync("instance", "root", Uncertain.Id, "c", "执行会话");
        Require(Store.Get(Uncertain.Id).State == eRelayState.Running && Bridge.SentList.Count == SentBefore, "confirmed execution resumes result reception without sending again");
        Bridge.FailNext = true;
        await Reject(() => Coordinator.ReportAsync("instance", "c", Uncertain.Id, "completed", "已保存", new()), "fixture");
        var AmbiguousReport = new RelayRequest("instance", "c", "relay_report", JsonSerializer.SerializeToElement(new { task_id = Uncertain.Id, outcome = "completed", summary = "已保存", artifacts = Array.Empty<string>() }));
        RelayOutbox.Save(AmbiguousReport, Outbox);
        SentBefore = Bridge.SentList.Count;
        await RelayOutbox.ReplayOnceAsync(Coordinator, CancellationToken.None, Outbox);
        Require(Store.Get(Uncertain.Id).State == eRelayState.ReturnUncertain && Bridge.SentList.Count == SentBefore, "recovery of acknowledged data never automatically resends uncertain delivery");
        await Coordinator.RetryReturnAsync(Uncertain.Id);
        Require(Store.Get(Uncertain.Id).State == eRelayState.Returned && Bridge.SentList.Count == SentBefore + 1, "explicit checked recovery can resend result");
        await Coordinator.CancelAsync(Uncertain.Id);
        RelayOutbox.Save(AmbiguousReport, Outbox);
        var Rejected = await RelayOutbox.ReplayOnceAsync(Coordinator, CancellationToken.None, Outbox);
        Require(Rejected.Failed == 1 && Directory.GetFiles(Outbox, "*.rejected").Length == 1, "late cancelled report is retained as rejected evidence without waking main");
    }
    #endregion

    #region Integration
    private static async Task VerifyMcpAsync()
    {
        var Store = new RelayStore(Path.Combine(Root, "mcp"));
        using var Coordinator = new RelayCoordinator(Store, new Bridge());
        var Settings = new ManagerSettings { InstanceList = new() { Profile() }, SelectedId = "instance" };
        var Service = new AgentManagementService(Store, Coordinator, new Catalog(), Environment.ProcessPath!, () => Settings);
        string Pipe = "collaboration-" + Guid.NewGuid().ToString("N");
        using var Host = new RelayHost(Coordinator, Pipe, Service);
        await Reject(() => Service.ExecuteAsync(new("instance", "root", "agent_start", JsonSerializer.SerializeToElement(new { request_id = "missing-scope" })), CancellationToken.None), "workspace");
        var Arguments = new { request_id = "mcp-new-route", instance = "1", project = "project", session = "worker", title = "MCP 结构化交接", instructions = "目的与边界", acceptance = "检查规范", workspace = new { access = "read_only" }, tree_session_max = 2, max_depth = 2 };
        var Started = await Mcp("root", "agent_start", Arguments, Pipe);
        string Id = Started.GetProperty("task_id").GetString()!;
        await Mcp("worker", "relay_progress", new { task_id = Id, stage = "started", message = "开始" }, Pipe);
        var Status = await Mcp("root", "agent_task", new { task_id = Id }, Pipe);
        Require(Status.GetProperty("progress_stage").GetString() == "started" && Status.GetProperty("tree_budget").GetProperty("MaxSessions").GetInt32() == 2, "MCP routed startup and progress use same policy and data as CLI");
        Require(AgentCli.Parse(new[] { "reconcile", "--task-id", Id, "--session-id", "worker", "--confirmed", "true" }).Arguments.GetProperty("confirmed").GetBoolean(), "CLI parses checked recovery as boolean");
    }

    private static void VerifyTree()
    {
        var Store = new RelayStore(Path.Combine(Root, "tree"));
        var Parent = new RelayTask { RequestKey = "parent", Title = "主任务", State = eRelayState.Accepted };
        Store.Save(Parent);
        for (int Index = 0; Index < RelayTreeView.MaxVisibleRows + 30; Index++) Store.Save(new RelayTask { ParentTaskId = Parent.Id, RequestKey = "tree-" + Index, Title = "子任务 " + Index, State = eRelayState.Accepted, Instructions = new string('x', RelayLimits.MaxTextLength), ProgressMessage = "进度" });
        var View = new RelayTreeView(Store);
        View.Refresh(0);
        Require(View.RowList.Count == 1 && View.RowList[0].Entry.ChildCount == RelayTreeView.MaxVisibleRows + 30, "collapsed tree loads root summary without child payloads");
        View.Toggle(Parent.Id);
        long Before = GC.GetTotalAllocatedBytes(true);
        View.Refresh(0);
        long Allocated = GC.GetTotalAllocatedBytes(true) - Before;
        Require(View.RowList.Count == RelayLimits.PageSize + 2 && View.RowList.Last().More && Allocated < 1024 * 1024, "expansion reads one child page and allocates under 1 MiB");
        for (int Index = 0; Index < 10; Index++) View.LoadMore(Parent.Id);
        View.Refresh(0);
        Require(View.RowList.Count <= RelayTreeView.MaxVisibleRows && View.Limited, "large expansion has a hard visible row budget");
        View.Toggle(Parent.Id); View.Refresh(0);
        Require(View.RowList.Count == 1, "collapsing drops expanded rows");
        Console.WriteLine("Tree child page allocated=" + Allocated + " B");
    }

    private static async Task VerifyDoctorAsync()
    {
        var Instance = Profile();
        Instance.HomePath = Path.Combine(Root, "doctor-home");
        Directory.CreateDirectory(Instance.HomePath);
        File.WriteAllText(Path.Combine(Instance.HomePath, "state_5.sqlite"), "fixture");
        File.WriteAllText(Path.Combine(Instance.HomePath, "config.toml"), "model='private-model'\n");
        RelayToolInstaller.InstallCli(Instance, Environment.ProcessPath!, Path.Combine(Root, "doctor-backup"));
        string SkillRoot = Path.Combine(Instance.HomePath, "skills", "moremore-work");
        Directory.CreateDirectory(SkillRoot);
        File.WriteAllText(Path.Combine(SkillRoot, "SKILL.md"), "fixture");
        File.WriteAllText(Path.Combine(SkillRoot, "config.json"), JsonSerializer.Serialize(new { cli_path = Environment.ProcessPath }));
        var Settings = new ManagerSettings { InstanceList = new() { Instance }, SelectedId = Instance.Id };
        var Report = await AgentDoctor.RunAsync(Settings, Environment.ProcessPath!, Instance.Id, CancellationToken.None, (_, _) => System.Threading.Tasks.Task.FromResult(new List<string> { "list_projects", "read_thread", "create_thread", "send_message_to_thread" }));
        Require(Report.Healthy && !JsonSerializer.Serialize(Report).Contains("private-model"), "doctor verifies paths and capabilities without leaking unrelated configuration");
        File.WriteAllText(Path.Combine(SkillRoot, "config.json"), JsonSerializer.Serialize(new { cli_path = Path.Combine(Root, "missing.exe") }));
        Report = await AgentDoctor.RunAsync(Settings, Environment.ProcessPath!, Instance.Id, CancellationToken.None, (_, _) => System.Threading.Tasks.Task.FromResult(new List<string>()));
        Require(!Report.Healthy && Report.CheckList.Count(Check => !Check.Passed) == 2, "doctor reports stale skill path and missing bridge capabilities separately");
    }
    #endregion

    #region Fixtures
    private static Task<RelayTask> Dispatch(RelayCoordinator Coordinator, string Key, string Main, string Worker, RelayTreeBudget? Budget = null, RelayWorkspace? Workspace = null) => Coordinator.DispatchAsync("instance", Main, Key, Key, "目的与边界", "验收", new() { MainInstance = Profile(), WorkerInstance = Profile(), MainThreadId = Main, WorkerThreadId = Worker }, 10, 2, CrossAgentMax: 10, TreeBudget: Budget, Workspace: Workspace);
    private static InstanceProfile Profile() => new() { Id = "instance", Name = "测试实例", HomePath = Path.Combine(Root, "home") };

    private static async Task<JsonElement> Mcp(string Thread, string Tool, object Arguments, string Pipe)
    {
        using var Input = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { jsonrpc = "2.0", id = 1, method = "tools/call", @params = new { name = Tool, arguments = Arguments, _meta = new { thread_id = Thread } } }) + "\n"));
        using var Output = new MemoryStream();
        await RelayMcp.RunAsync("instance", Input, Output, CancellationToken.None, Pipe, Path.Combine(Root, "mcp-outbox"));
        using var Response = JsonDocument.Parse(Output.ToArray());
        var Result = Response.RootElement.GetProperty("result");
        if (Result.GetProperty("isError").GetBoolean()) throw new Exception(Result.GetRawText());
        using var Data = JsonDocument.Parse(Result.GetProperty("content")[0].GetProperty("text").GetString()!);
        return Data.RootElement.Clone();
    }

    private sealed class Bridge : IRelayBridge
    {
        public bool FailNext { get; set; }
        public List<string> SentList { get; } = new();
        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation)
        {
            SentList.Add(ThreadId);
            if (FailNext) { FailNext = false; throw new IOException("fixture delivery uncertainty"); }
            return Task.CompletedTask;
        }
    }

    private sealed class Catalog : IAgentCatalog
    {
        public Task<List<AgentProject>> ProjectsAsync(InstanceProfile Instance, CancellationToken Cancellation) => Task.FromResult(new List<AgentProject> { new("project", "项目", Root, true) });
        public List<AgentSession> Sessions(InstanceProfile Instance, AgentProject? Project, string? Selector, int Offset) => new() { Session(Instance, Selector!) };
        public AgentSession Session(InstanceProfile Instance, string Id) => new(Id, Id, "project", Root);
        public Task RequireIdleAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation) => Task.CompletedTask;
        public Task<RelayThread> CreateAsync(InstanceProfile Instance, AgentProject? Project, string Title, string Prompt, CancellationToken Cancellation) => throw new NotSupportedException();
    }

    private static async Task Reject(Func<Task> Action, string MessagePart)
    {
        try { await Action(); }
        catch (Exception Error) when (Error is InvalidOperationException or IOException) { Require(Error.Message.Contains(MessagePart), "rejection explains " + MessagePart); return; }
        throw new Exception("FAILED expected rejection " + MessagePart);
    }
    private static void Require(bool Condition, string Message) { if (!Condition) throw new Exception("FAILED collaboration: " + Message); Count++; }
    private static IEnumerable<Control> Descendants(Control Parent) { foreach (Control Child in Parent.Controls) { yield return Child; foreach (var Nested in Descendants(Child)) yield return Nested; } }
    #endregion
}
