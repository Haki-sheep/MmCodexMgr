namespace CodexInstanceManager;

/// <summary>
/// 编队详情 席位 交接停止确认与任务卡片 全部读取持久化记录并经真实服务操作
/// </summary>
public sealed class FormationDetailDialog : StudioDialog
{
    private readonly string RunId;
    private readonly FormationStore Store;
    private readonly ManagerSettings Settings;
    private readonly AppTheme Appearance;
    private readonly bool CanWrite;
    private readonly Func<string, object, string, Task<object>> Execute;
    private readonly WheelScrollPanel DetailScroll = new() { Dock = DockStyle.Fill, AutoScroll = true };
    private FormationRun Run;
    private int RefreshVersion;

    public FormationDetailDialog(FormationRun Run, FormationStore Store, ManagerSettings Settings, AppTheme Appearance, bool CanWrite, Func<string, object, string, Task<object>> Execute)
        : base("编队详情", new Size(1000, 760))
    {
        this.RunId = Run.Id;
        this.Store = Store;
        this.Settings = Settings;
        this.Appearance = Appearance;
        this.CanWrite = CanWrite;
        this.Execute = Execute;
        MaximizeBox = true;
        this.Run = Run;
        Content.RowCount = 1;
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Content.Controls.Add(DetailScroll);
        AddAction("关闭", eButtonKind.Primary, (_, _) => DialogResult = DialogResult.Cancel);
        Rebuild();
    }

    #region Layout
    private void Rebuild()
    {
        int Position = -DetailScroll.AutoScrollPosition.Y;
        var Old = DetailScroll.Controls.Cast<Control>().ToList();
        Text = "编队详情 · " + Run.Theme;
        var Column = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Padding = new Padding(0, 0, 6, 0) };
        Column.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Column.SuspendLayout();
        Column.Controls.Add(BuildHeader());
        Column.Controls.Add(BuildSeats());
        foreach (var Handoff in Run.HandoffList.OrderBy(Item => Item.Transferred)) Column.Controls.Add(BuildHandoff(Handoff));
        Column.Controls.Add(BuildTasks());
        DetailScroll.SuspendLayout();
        try
        {
            DetailScroll.Controls.Add(Column);
            Appearance.Apply(Column);
            foreach (var Item in Old) Item.Dispose();
            Column.ResumeLayout(true);
        }
        finally { DetailScroll.ResumeLayout(true); }
        if (-DetailScroll.AutoScrollPosition.Y != Position) DetailScroll.AutoScrollPosition = new Point(0, Position);
    }

    private Control BuildHeader()
    {
        var Header = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Margin = new Padding(0, 0, 0, 12) };
        Header.Controls.Add(new Label { Text = Run.Theme, Font = StudioFonts.Title, AutoSize = true, Tag = eThemeRole.Title, Margin = new Padding(0, 0, 0, 4) });
        var Chips = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, WrapContents = true, Margin = Padding.Empty };
        Chips.Controls.Add(new StudioChip { Text = FormationCard.StatusText(Run), Tone = FormationCard.StatusTone(Run) });
        Chips.Controls.Add(new StudioChip
        {
            Text = Run.ActivationState switch { eFormationDeliveryState.Delivered => "统筹已启动", eFormationDeliveryState.Dispatching => "启动包投递中", eFormationDeliveryState.DeliveryUnknown => "启动包投递未知", _ => "统筹待启动" },
            Tone = Run.ActivationState switch { eFormationDeliveryState.Delivered => eTone.Success, eFormationDeliveryState.Dispatching => eTone.Info, eFormationDeliveryState.DeliveryUnknown => eTone.Danger, _ => eTone.Neutral }
        });
        Chips.Controls.Add(new StudioChip { Text = "并发 " + Run.MaxParallel, Tone = eTone.Neutral });
        if (Run.TemplateId is not null) Chips.Controls.Add(new StudioChip { Text = "模板 v" + Run.TemplateVersion, Tone = eTone.Violet });
        Chips.Controls.Add(new Label { Text = "编队 ID " + Run.Id + "  ·  创建于 " + Run.CreatedAt.ToLocalTime().ToString("yyyy-MM-dd HH:mm"), AutoSize = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(4, 8, 0, 0) });
        Header.Controls.Add(Chips);
        if (Run.ActivationDetail.Length != 0) Header.Controls.Add(new StudioWrapLabel { Text = "启动详情  " + Run.ActivationDetail, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 6, 0, 0) });
        return Header;
    }

    private Control BuildSeats()
    {
        var Card = StudioCard.Create("席位", "悬停查看执行端 模型 推理强度与会话 ID  ·  在编队卡片上点击席位修改", out var Body);
        var Board = new SeatBoard { Dock = DockStyle.Top, Settings = Settings };
        Board.SetMembers(Run.MemberList);
        Board.StatusOf = Member => FormationCard.StatusFor(Run, Member);
        Board.Placeholder = (Role, Count) => Count != 0 || (Role is eFormationRole.Coordinator or eFormationRole.Executor) ? null : (SeatProviders.RoleTitle(Role) + " 未配置", false);
        Body.Controls.Add(Board);
        Body.SizeChanged += (_, _) => Board.Height = Math.Max(1, Board.MeasureHeight(Math.Max(1, Body.ClientSize.Width)));
        Board.Height = Board.MeasureHeight(LogicalToDeviceUnits(900));
        return Card;
    }

    private Control BuildHandoff(FormationHandoff Handoff)
    {
        string From = MemberName(Handoff.FromMemberId);
        string To = Handoff.ToMemberId.Length == 0 ? "缺少外援" : MemberName(Handoff.ToMemberId);
        var Card = StudioCard.Create($"交接  ·  {From} → {To}",
            $"第三次审核拒绝触发 原执行者剩余 {Handoff.TaskIdList.Count} 项任务冻结 由外援接替全部剩余任务 其他执行者不受影响  ·  需求 v{Handoff.RequirementVersion}",
            out var Body, Handoff.Transferred ? eTone.Neutral : eTone.Warning);
        Body.Controls.Add(new StudioChip { Text = Handoff.Transferred ? "已移交" : "待人工确认停止", Tone = Handoff.Transferred ? eTone.Success : eTone.Warning });
        if (Handoff.ToMemberId.Length == 0 && !Handoff.Transferred)
            Body.Controls.Add(new StudioWrapLabel { Text = "当前编队没有可接替的外援 请先在编队卡片的外援泳道补充外援席位", Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 4, 0, 6) });
        foreach (string AttemptId in Handoff.AttemptIdList)
        {
            var Work = Run.TaskList.FirstOrDefault(Item => Item.AttemptList.Any(Candidate => Candidate.Id == AttemptId));
            var Attempt = Work?.AttemptList.First(Item => Item.Id == AttemptId);
            var Proof = Handoff.StopList.FirstOrDefault(Item => Item.AttemptId == AttemptId);
            var Row = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = new Padding(0, 6, 0, 0) };
            string Kind = Attempt?.Kind == eFormationAttemptKind.Review ? "审核轮次" : "执行轮次";
            Row.Controls.Add(new Label { Text = $"{Work?.Title ?? "未知任务"}  ·  {Kind}  ·  {MemberName(Attempt?.MemberId ?? "")}  ·  {Attempt?.State.ToString() ?? "未知"}", AutoSize = true, Margin = new Padding(0, 8, 8, 0) });
            Row.Controls.Add(new StudioChip { Text = Proof is null ? "未确认停止" : "已人工确认停止", Tone = Proof is null ? eTone.Danger : eTone.Success });
            if (Proof is null && !Handoff.Transferred)
            {
                Row.Controls.Add(Button("请求停止", eButtonKind.Secondary, () => Execute("takeover", new { run_id = Run.Id, handoff_id = Handoff.Id, mode = "request_stop", attempt_id = AttemptId, operation_id = NewId() }, "已向原执行端发送停止请求 仍需人工确认")));
                Row.Controls.Add(Button("确认已停止", eButtonKind.Danger, async () =>
                {
                    string? Evidence = StudioPrompt.Evidence(this, Appearance, "确认原轮次已停止", "请在原会话与任务管理器中核实该轮次和相关工具进程均已停止\n联调记录显示 Cancelled 不能作为停止证据\n填写你观察到的停止依据", "我已人工核实该轮次及相关工具进程均已停止");
                    if (Evidence is null) return;
                    await Execute("takeover", new { run_id = Run.Id, handoff_id = Handoff.Id, mode = "confirm_stop", attempt_id = AttemptId, confirmed = true, evidence = Evidence, operation_id = NewId() }, "已记录人工停止证据");
                }));
            }
            else if (Proof is not null)
                Row.Controls.Add(new Label { Text = Proof.Details, AutoSize = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 9, 0, 0) });
            Body.Controls.Add(Row);
        }
        if (!Handoff.Transferred)
        {
            bool Ready = Handoff.ToMemberId.Length != 0 && Handoff.AttemptIdList.All(Id => Handoff.StopList.Any(Proof => Proof.AttemptId == Id));
            var Transfer = Button("移交给外援", eButtonKind.Primary, async () =>
            {
                string? Evidence = StudioPrompt.Evidence(this, Appearance, "移交剩余任务", $"将 {From} 的 {Handoff.TaskIdList.Count} 项剩余任务移交给 {To}\n填写交接说明与依据", "我确认原执行者的全部受影响轮次均已人工核实停止");
                if (Evidence is null) return;
                await Execute("takeover", new { run_id = Run.Id, handoff_id = Handoff.Id, mode = "transfer", evidence = Evidence, operation_id = NewId() }, "剩余任务已移交给外援 " + To);
            });
            Transfer.Enabled = CanWrite && Ready;
            Transfer.Margin = new Padding(0, 12, 0, 0);
            Body.Controls.Add(Transfer);
        }
        return Card;
    }

    private Control BuildTasks()
    {
        int Passed = Run.TaskList.Count(Item => Item.State == eFormationTaskState.Passed);
        var Card = StudioCard.Create($"任务  ·  {Passed}/{Run.TaskList.Count} 通过", "任务由统筹登记与派发 有审核席位时独立审核通过即通知统筹 统筹无需逐项复审", out var Body);
        if (Run.TaskList.Count == 0)
        {
            Body.Controls.Add(new Label { Text = "统筹尚未登记任务", AutoSize = true, Tag = eThemeRole.Muted });
            return Card;
        }
        var Flow = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = Padding.Empty };
        foreach (var Work in Run.TaskList) Flow.Controls.Add(BuildTaskTile(Work));
        Body.Controls.Add(Flow);
        return Card;
    }

    private Control BuildTaskTile(FormationTask Work)
    {
        int TileWidth = LogicalToDeviceUnits(292);
        var Tile = new StudioCard { Tag = eThemeRole.Inset, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, MinimumSize = new Size(TileWidth, 0), MaximumSize = new Size(TileWidth, 0), Padding = new Padding(14, 12, 14, 12), Margin = new Padding(0, 0, 10, 10), Stripe = TaskTone(Work.State) };
        var Body = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Margin = Padding.Empty };
        Body.Controls.Add(new StudioWrapLabel { Text = Work.Title, Font = StudioFonts.Strong, Margin = new Padding(0, 0, 0, 4) });
        Body.Controls.Add(new StudioChip { Text = TaskStateText(Work.State), Tone = TaskTone(Work.State) });
        string Reviewer = Work.ReviewerId.Length == 0 ? "统筹验收" : MemberName(Work.ReviewerId);
        int Rejected = Work.ReviewList.Count(Item => !Item.Passed && Item.RequirementVersion == Run.RequirementVersion);
        Body.Controls.Add(new StudioWrapLabel { Text = $"执行 {MemberName(Work.ExecutorId)}  ·  审核 {Reviewer}\n提交 {Work.SubmissionList.Count}  ·  轮次 {Work.AttemptList.Count}  ·  本版本拒绝 {Rejected}/3  ·  {(Work.Workspace.Access == "write" ? "可写 " + Work.Workspace.WritePathList.Count + " 处" : "只读")}", Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 4, 0, 0) });
        if (Work.ProcessingDetail.Length != 0) Body.Controls.Add(new StudioWrapLabel { Text = Work.ProcessingDetail, Font = StudioFonts.Caption, Margin = new Padding(0, 4, 0, 0) });
        if (Work.State is eFormationTaskState.Blocked or eFormationTaskState.DeliveryUnknown && Run.State != eFormationState.Completed)
        {
            var Resume = Button("核实后重新安排", eButtonKind.Danger, async () =>
            {
                string? Evidence = StudioPrompt.Evidence(this, Appearance, "重新安排 " + Work.Title, "请先核实原轮次已停止且没有仍在进行的派发\n联调记录显示 Cancelled 不能作为停止证据\n填写核实依据后任务回到可派发状态", "我已人工核实原轮次已停止");
                if (Evidence is null) return;
                await Execute("resume", new { run_id = Run.Id, task_id = Work.Id, confirmed = true, evidence = Evidence, operation_id = NewId() }, "已重新安排 " + Work.Title);
            });
            Resume.Enabled = CanWrite;
            Resume.Margin = new Padding(0, 8, 0, 0);
            Body.Controls.Add(Resume);
        }
        Tile.Controls.Add(Body);
        return Tile;
    }

    #endregion

    #region Helpers
    private StudioButton Button(string Text, eButtonKind Kind, Func<Task> Action)
    {
        var Created = new StudioButton { Text = Text, Kind = Kind, Enabled = CanWrite };
        Created.Click += async (_, _) =>
        {
            try { await Action(); }
            catch (Exception Error)
            {
                Program.LogError(Error);
                if (!IsDisposed) MessageBox.Show(this, Error.Message, "编队操作未完成", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            if (!IsDisposed) BeginInvoke(async () => await ReloadAsync());
        };
        return Created;
    }

    private async Task ReloadAsync()
    {
        if (IsDisposed) return;
        int Version = ++RefreshVersion;
        try
        {
            var Updated = await Task.Run(() => Store.Get(RunId));
            if (IsDisposed || Version != RefreshVersion) return;
            Run = Updated;
            Rebuild();
        }
        catch (Exception Error)
        {
            Program.LogError(Error);
            if (!IsDisposed && Version == RefreshVersion) MessageBox.Show(this, Error.Message, "读取编队失败", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private string MemberName(string Id)
    {
        var Member = Run.MemberList.SingleOrDefault(Item => Item.Id == Id);
        return Member is null ? (Id.Length == 0 ? "未知" : Id) : Member.DisplayName.Length != 0 ? Member.DisplayName : SeatProviders.RoleTitle(Member.Role);
    }

    private static string NewId() => Guid.NewGuid().ToString("N");

    private static eTone TaskTone(eFormationTaskState State) => State switch
    {
        eFormationTaskState.Passed => eTone.Success,
        eFormationTaskState.Running or eFormationTaskState.Dispatching or eFormationTaskState.Reviewing => eTone.Info,
        eFormationTaskState.Submitted => eTone.Violet,
        eFormationTaskState.NeedsRework or eFormationTaskState.AwaitingHandoff => eTone.Warning,
        eFormationTaskState.Blocked or eFormationTaskState.DeliveryUnknown => eTone.Danger,
        _ => eTone.Neutral
    };

    private static string TaskStateText(eFormationTaskState State) => State switch
    {
        eFormationTaskState.Ready => "待派发",
        eFormationTaskState.Dispatching => "派发中",
        eFormationTaskState.DeliveryUnknown => "投递未知",
        eFormationTaskState.Running => "执行中",
        eFormationTaskState.Submitted => "已提交 待审核",
        eFormationTaskState.Reviewing => "审核中",
        eFormationTaskState.NeedsRework => "需返工",
        eFormationTaskState.Blocked => "已阻塞",
        eFormationTaskState.AwaitingHandoff => "冻结 待外援接替",
        eFormationTaskState.Passed => "已通过",
        _ => State.ToString()
    };
    #endregion
}
