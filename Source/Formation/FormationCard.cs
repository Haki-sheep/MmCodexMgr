using System.Drawing.Drawing2D;

namespace CodexInstanceManager;

/// <summary>
/// 单个编队卡片 头部状态 紧凑席位行 待处理提示与操作 数据全部来自持久化的 FormationRun
/// </summary>
public sealed class FormationCard : StudioCard
{
    public const string ActivateAction = "activate";
    public const string PauseAction = "pause";
    public const string ResumeAction = "resume";
    public const string ContextAction = "context";
    public const string DetailAction = "detail";
    public const string HandoffAction = "handoff";
    public const string SeatAction = "seat";
    public const string OutsiderAction = "outsider";
    public const string OpenAction = "open";
    public const string ArchiveAction = "archive";
    public const string UnarchiveAction = "unarchive";
    public const string DeleteAction = "delete";
    private sealed record Notice(string Text, eTone Tone);

    public FormationRun Run { get; }
    public FormationRoster Board { get; } = new();
    private readonly FlowLayoutPanel LifecycleActions = new() { WrapContents = true, AutoSize = false, Margin = Padding.Empty };
    private readonly FlowLayoutPanel Footer = new() { WrapContents = true, AutoSize = false, Margin = Padding.Empty };
    private readonly List<Notice> NoticeList = new();
    private readonly Action<FormationCard, string, FormationMember?> Request;

    public FormationCard(FormationRun Run, ManagerSettings Settings, bool CanWrite, Action<FormationCard, string, FormationMember?> Request)
    {
        this.Run = Run;
        this.Request = Request;
        Padding = new Padding(LogicalToDeviceUnits(20), LogicalToDeviceUnits(16), LogicalToDeviceUnits(20), LogicalToDeviceUnits(16));
        Stripe = StatusTone(Run);
        Board.Build(Run, Settings, CanWrite && !Run.Archived && Run.LifecycleOperation is not { Completed: false } && Run.State != eFormationState.Completed);
        Board.SeatClicked += Member => Request(this, SeatAction, Member);
        Board.OutsiderRequested += () => Request(this, OutsiderAction, null);
        Controls.Add(Board);
        Controls.Add(Footer);
        Controls.Add(LifecycleActions);
        BuildLifecycleActions(CanWrite);
        BuildNotices();
        BuildFooter(CanWrite);
    }

    public bool HasPendingHandoff => Run.HandoffList.Any(Item => !Item.Transferred);

    private void BuildNotices()
    {
        if (Run.SetupOnly) NoticeList.Add(new("席位已配置  ·  请打开统筹会话说明任务", eTone.Accent));
        foreach (var Handoff in Run.HandoffList.Where(Item => !Item.Transferred))
        {
            string From = MemberName(Handoff.FromMemberId);
            string To = Handoff.ToMemberId.Length == 0 ? "" : MemberName(Handoff.ToMemberId);
            NoticeList.Add(new($"执行席位 {From} 第三次审核被拒 剩余 {Handoff.TaskIdList.Count} 项任务已冻结  ·  " + (To.Length == 0 ? "缺少外援 请先补充外援席位" : $"待人工确认原轮次停止后由外援 {To} 接替"), eTone.Warning));
        }
        if (Run.ActivationState == eFormationDeliveryState.DeliveryUnknown)
            NoticeList.Add(new("统筹启动包投递未确认  ·  " + (Run.ActivationDetail.Length == 0 ? "请核对统筹会话" : Run.ActivationDetail), eTone.Danger));
        int Blocked = Run.TaskList.Count(Item => Item.State is eFormationTaskState.Blocked or eFormationTaskState.DeliveryUnknown);
        if (Blocked > 0) NoticeList.Add(new($"{Blocked} 项任务阻塞或投递未知  ·  需在详情中人工核实原轮次后重排", eTone.Danger));
        int Unknown = Run.NotificationList.Count(Item => Item.State == eFormationDeliveryState.DeliveryUnknown);
        if (Unknown > 0) NoticeList.Add(new($"{Unknown} 条统筹通知投递未确认", eTone.Warning));
        if (Run.LifecycleOperation is { Completed: false } Pending)
            NoticeList.Add(new("会话操作尚未完成  ·  " + Pending.Error, eTone.Warning));
    }

    private void BuildFooter(bool CanWrite)
    {
        bool Open = !Run.Archived && Run.LifecycleOperation is not { Completed: false } && Run.State != eFormationState.Completed;
        var Coordinator = Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
        if (Coordinator.SessionId.Length != 0)
            AddButton("打开统筹会话", OpenAction, Run.Status == eFormationStatus.Blocked ? eButtonKind.Primary : eButtonKind.Secondary, CanWrite);
        if (Open && Run.ActivationState != eFormationDeliveryState.Delivered)
        {
            string Text = Run.ActivationState switch
            {
                eFormationDeliveryState.DeliveryUnknown => "核实后重发启动包",
                eFormationDeliveryState.Dispatching => "启动包投递中",
                _ => "启动统筹"
            };
            AddButton(Text, ActivateAction, eButtonKind.Primary, CanWrite && Run.State == eFormationState.Active && Run.ActivationState != eFormationDeliveryState.Dispatching);
        }
        if (Open && Run.State == eFormationState.Active) AddButton("暂停调度", PauseAction, eButtonKind.Ghost, CanWrite);
        if (Open && Run.State == eFormationState.Paused) AddButton("恢复调度", ResumeAction, eButtonKind.Secondary, CanWrite);
        if (HasPendingHandoff) AddButton("处理交接", HandoffAction, eButtonKind.Danger, true);
        AddButton("查看详情", DetailAction, eButtonKind.Ghost, true);

    }

    public static string StatusText(FormationRun Run) => Run.Status switch { eFormationStatus.Archived => "已归档", eFormationStatus.Blocked => "阻塞中", _ => "进行中" };
    public static eTone StatusTone(FormationRun Run) => Run.Status switch { eFormationStatus.Archived => eTone.Success, eFormationStatus.Blocked => eTone.Warning, _ => eTone.Accent };

    private void AddButton(string Text, string Action, eButtonKind Kind, bool Enabled)
    {
        var Button = new StudioButton { Text = Text, Kind = Kind, Enabled = Enabled, Name = Action };
        Button.Click += (_, _) => Request(this, Action, null);
        Footer.Controls.Add(Button);
    }

    private void BuildLifecycleActions(bool CanWrite)
    {
        string Archive = Run.Archived ? UnarchiveAction : ArchiveAction;
        string ArchiveText = Run.Archived ? "取消归档" : "归档";
        if (Run.LifecycleOperation is { Completed: false } Pending)
        {
            Archive = Pending.Action;
            ArchiveText = "重试" + (Archive == DeleteAction ? "删除" : Archive == UnarchiveAction ? "取消归档" : "归档");
        }
        var ArchiveButton = new StudioButton { Text = ArchiveText, Name = Archive, Enabled = CanWrite };
        ArchiveButton.Click += (_, _) => Request(this, Archive, null);
        LifecycleActions.Controls.Add(ArchiveButton);
        if (Archive == DeleteAction) return;
        var DeleteButton = new StudioButton { Text = "彻底删除", Name = DeleteAction, Kind = eButtonKind.Danger, Enabled = CanWrite && Run.LifecycleOperation is not { Completed: false } };
        DeleteButton.Click += (_, _) => Request(this, DeleteAction, null);
        LifecycleActions.Controls.Add(DeleteButton);
    }

    public StudioButton? ActionButton(string Action) => Footer.Controls.Cast<Control>().Concat(LifecycleActions.Controls.Cast<Control>()).OfType<StudioButton>().SingleOrDefault(Item => Item.Name == Action);

    private string MemberName(string Id)
    {
        var Member = Run.MemberList.SingleOrDefault(Item => Item.Id == Id);
        return Member is null ? Id : Member.DisplayName.Length != 0 ? Member.DisplayName : SeatProviders.RoleTitle(Member.Role);
    }

    /// <summary>
    /// 按真实轮次与交接记录推导席位状态 Cancelled 等终态不视为已停止
    /// </summary>
    public static SeatStatus StatusFor(FormationRun Run, FormationMember Member)
    {
        var Handoff = Run.HandoffList.FirstOrDefault(Item => Item.FromMemberId == Member.Id);
        if (Handoff is not null) return Handoff.Transferred ? new("已移交", eTone.Neutral) : new("已冻结", eTone.Danger);
        if (Run.HandoffList.Any(Item => !Item.Transferred && Item.ToMemberId == Member.Id)) return new("待接替", eTone.Warning);
        if (Run.Archived) return new("已归档", eTone.Success);
        if (Run.State == eFormationState.Completed) return new("已交付", eTone.Success);
        if (Run.State == eFormationState.Paused) return new("已暂停", eTone.Warning);
        if (Member.Role == eFormationRole.Coordinator)
        {
            if (Member.SessionId.Length == 0) return new("待新建会话", eTone.Neutral);
            return Run.ActivationState switch
            {
                eFormationDeliveryState.Delivered => new("统筹中", eTone.Accent),
                eFormationDeliveryState.Dispatching => new("启动中", eTone.Info),
                eFormationDeliveryState.DeliveryUnknown => new("投递未知", eTone.Danger),
                _ => new("待启动", eTone.Warning)
            };
        }
        var AttemptList = Run.TaskList.SelectMany(Item => Item.AttemptList).Where(Item => Item.MemberId == Member.Id).ToList();
        int Active = AttemptList.Count(Item => Item.State is eFormationAttemptState.Dispatching or eFormationAttemptState.Running);
        if (AttemptList.Any(Item => Item.State == eFormationAttemptState.DeliveryUnknown)) return new("投递未知", eTone.Danger);
        if (AttemptList.Any(Item => Item.State == eFormationAttemptState.AwaitingStop)) return new("待停止确认", eTone.Danger);
        if (Active > 0) return new((Member.Role == eFormationRole.Reviewer ? "审核中 " : "执行中 ") + Active, eTone.Info);
        var Owned = Run.TaskList.Where(Item => Item.ExecutorId == Member.Id || Item.ReviewerId == Member.Id).ToList();
        int Open = Owned.Count(Item => Item.State != eFormationTaskState.Passed);
        if (Open > 0) return new("待处理 " + Open, eTone.Warning);
        if (Owned.Count > 0) return new("通过 " + Owned.Count, eTone.Success);
        if (Member.DispatchMode == eFormationDispatchMode.Native) return new("原生 · 按需", eTone.Neutral);
        return Member.SessionId.Length == 0 ? new("按需新建", eTone.Neutral) : new("空闲", eTone.Success);
    }

    private float DpiScale => DeviceDpi / 96f;
    private int HeaderHeight => (int)(58 * DpiScale);
    private int NoticeHeight => (int)(32 * DpiScale);
    private int NoticeGap => (int)(8 * DpiScale);
    private int FooterGap => (int)(9 * DpiScale);

    private int LifecycleHeight => LifecycleActions.GetPreferredSize(new Size(Math.Max(1, Width - Padding.Horizontal), 0)).Height;
    private int NoticeTop => Padding.Top + HeaderHeight + LifecycleHeight + FooterGap;

    private int BoardTop => NoticeTop + NoticeList.Count * (NoticeHeight + NoticeGap) + (int)(6 * DpiScale);

    /// <summary>
    /// 根据给定宽度计算卡片完整高度
    /// </summary>
    public int MeasureHeight(int Width)
    {
        int Inner = Math.Max(1, Width - Padding.Horizontal);
        int FooterHeight = Footer.GetPreferredSize(new Size(Inner, 0)).Height;
        return BoardTop + Board.MeasureHeight(Inner) + FooterGap + FooterHeight + Padding.Bottom;
    }

    protected override void OnLayout(LayoutEventArgs Event)
    {
        base.OnLayout(Event);
        int Inner = Math.Max(1, Width - Padding.Horizontal);
        LifecycleActions.Bounds = new Rectangle(Padding.Left, Padding.Top + HeaderHeight, Inner, LifecycleHeight);
        int BoardHeight = Board.MeasureHeight(Inner);
        Board.Bounds = new Rectangle(Padding.Left, BoardTop, Inner, BoardHeight);
        int FooterHeight = Footer.GetPreferredSize(new Size(Inner, 0)).Height;
        Footer.Bounds = new Rectangle(Padding.Left, Board.Bottom + FooterGap, Inner, FooterHeight);
    }

    protected override void OnPaint(PaintEventArgs Event)
    {
        base.OnPaint(Event);
        const TextFormatFlags Scoped = TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform;
        var Canvas = Event.Graphics;
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        float Scale = DpiScale;
        int Left = Padding.Left;
        int Right = Width - Padding.Right;
        var StateTone = StatusTone(Run);
        string StateText = StatusText(Run);
        var ChipList = new List<(string Text, eTone Tone)> { (StateText, StateTone) };
        if (!Run.Archived && Run.State != eFormationState.Completed)
            ChipList.Add(Run.ActivationState switch
            {
                eFormationDeliveryState.Delivered => ("统筹已启动", eTone.Success),
                eFormationDeliveryState.Dispatching => ("启动包投递中", eTone.Info),
                eFormationDeliveryState.DeliveryUnknown => ("启动包投递未知", eTone.Danger),
                _ => ("统筹待启动", eTone.Neutral)
            });
        if (Run.TemplateId is not null) ChipList.Add(("模板 v" + Run.TemplateVersion, eTone.Violet));
        int ChipRight = Right;
        int ChipTop = Padding.Top + (int)(2 * Scale);
        for (int Index = ChipList.Count - 1; Index >= 0; Index--)
        {
            var Size = TextRenderer.MeasureText(Canvas, ChipList[Index].Text, StudioFonts.Small, System.Drawing.Size.Empty, TextFormatFlags.NoPadding);
            int ChipWidth = Size.Width + (int)(16 * Scale);
            ChipRight -= ChipWidth;
            StudioPaint.Chip(Canvas, ChipList[Index].Text, StudioFonts.Small, new Point(ChipRight, ChipTop), ChipList[Index].Tone, Colors, Scale);
            ChipRight -= (int)(6 * Scale);
        }
        TextRenderer.DrawText(Canvas, Run.Theme, StudioFonts.Section, new Rectangle(Left + (int)(4 * Scale), Padding.Top, Math.Max(0, ChipRight - Left - (int)(8 * Scale)), (int)(26 * Scale)), Colors.Text, TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding | Scoped);
        int Passed = Run.TaskList.Count(Item => Item.State == eFormationTaskState.Passed);
        string Meta = $"并发 {Run.MaxParallel}  ·  任务 {Passed}/{Run.TaskList.Count} 通过  ·  {Run.MemberList.Count} 席  ·  创建于 {Run.CreatedAt.ToLocalTime():MM-dd HH:mm}";
        TextRenderer.DrawText(Canvas, Meta, StudioFonts.Caption, new Rectangle(Left + (int)(4 * Scale), Padding.Top + (int)(30 * Scale), Right - Left, (int)(20 * Scale)), Colors.Muted, TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding | Scoped);
        int Top = NoticeTop;
        foreach (var Notice in NoticeList)
        {
            var Bounds = new Rectangle(Left, Top, Right - Left, NoticeHeight);
            var (Fore, Back) = Colors.Tone(Notice.Tone);
            using (var Path = StudioGeometry.Rounded(Bounds, 8 * Scale))
            using (var Brush = new SolidBrush(Back))
                Canvas.FillPath(Brush, Path);
            TextRenderer.DrawText(Canvas, Notice.Text, StudioFonts.Caption, new Rectangle(Bounds.Left + (int)(12 * Scale), Bounds.Top, Bounds.Width - (int)(20 * Scale), Bounds.Height), Fore, TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding | Scoped);
            Top += NoticeHeight + NoticeGap;
        }
    }
}
