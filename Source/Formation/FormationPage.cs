using System.Drawing.Drawing2D;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CodexInstanceManager;

/// <summary>
/// 编队首页 背景插画头图 多编队卡片 所有写操作经 FormationService 以人工操作身份执行
/// </summary>
public sealed class FormationPage : UserControl
{
    private static readonly JsonSerializerOptions WireOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower, DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };
    private readonly ManagerSettings Settings;
    private readonly FormationService? Service;
    private readonly FormationStore? Store;
    private readonly AppTheme Theme;
    private readonly bool PreviewOnly;
    private readonly FormationHero Hero = new() { Dock = DockStyle.Top };
    private readonly StudioChip ModeChip = new();
    private readonly Label Status = new() { AutoSize = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(4, 8, 0, 0) };
    private readonly WheelScrollPanel CardScroll = new() { Dock = DockStyle.Fill, AutoScroll = true, Margin = Padding.Empty };
    private readonly FlowLayoutPanel CardFlow = new() { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = Padding.Empty };
    private readonly CancellationTokenSource Lifetime = new();
    private List<FormationRun> RunList = new();
    private List<FormationTemplate> TemplateList = new();
    private bool Busy;
    /// <summary> 服务事件合并为一次 UI 更新 </summary>
    private int RefreshQueued;
    private bool RefreshPending;
    private readonly Dictionary<string, string> CardSignatureDict = new();

    public bool CanWrite => Service is not null && Store is not null && !PreviewOnly;
    public IReadOnlyList<FormationCard> Cards => CardFlow.Controls.OfType<FormationCard>().ToList();
    public IReadOnlyList<FormationTemplate> Templates => TemplateList;

    public FormationPage(ManagerSettings Settings, FormationService? Service, FormationStore? Store, AppTheme Theme, bool PreviewOnly)
    {
        SuspendLayout();
        this.Settings = Settings;
        this.Service = Service;
        this.Store = Store;
        this.Theme = Theme;
        this.PreviewOnly = PreviewOnly;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = StudioFonts.Body;
        Dock = DockStyle.Fill;
        Padding = new Padding(28, 22, 28, 12);
        Tag = eThemeRole.Background;

        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Margin = Padding.Empty };
        Root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 204));
        Root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Hero.Dock = DockStyle.Fill;
        Hero.Margin = Padding.Empty;
        var CreateButton = new StudioButton { Text = "＋ 新建编队", Kind = eButtonKind.Primary, Name = "FormationCreate", Enabled = CanWrite };
        CreateButton.Click += async (_, _) => await RunAsync(CreateAsync);
        var RefreshButton = new StudioButton { Text = "刷新", Name = "FormationRefresh" };
        RefreshButton.Click += (_, _) => Reload();
        Hero.Actions.Controls.Add(CreateButton);
        Hero.Actions.Controls.Add(RefreshButton);
        Root.Controls.Add(Hero, 0, 0);
        var StatusRow = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = false, Margin = new Padding(0, 14, 0, 10) };
        ModeChip.Text = Service is null || Store is null ? "编队服务未连接 · 只读" : PreviewOnly ? "预览模式 · 只读" : "已连接编队服务";
        ModeChip.Tone = CanWrite ? eTone.Success : eTone.Warning;
        StatusRow.Controls.Add(ModeChip);
        StatusRow.Controls.Add(Status);
        Root.Controls.Add(StatusRow, 0, 1);
        CardScroll.Controls.Add(CardFlow);
        CardScroll.ClientSizeChanged += (_, _) => ArrangeCards();
        Root.Controls.Add(CardScroll, 0, 2);
        Controls.Add(Root);
        if (Service is not null) Service.Changed += OnServiceChanged;
        Reload();
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    #region Data
    /// <summary>
    /// 从持久化存储重读编队与模板 失败时保留错误原因
    /// </summary>
    public void Reload()
    {
        try
        {
            var Snapshot = Store?.Snapshot();
            RunList = Snapshot?.Runs ?? new();
            TemplateList = Snapshot?.Templates ?? new();
            RefreshPending = false;
            if (Store is not null && !Busy) SetStatus(RunList.Count == 0 ? "还没有编队" : $"进行中 {RunList.Count(Item => Item.Status == eFormationStatus.InProgress)}  ·  阻塞中 {RunList.Count(Item => Item.Status == eFormationStatus.Blocked)}  ·  已归档 {RunList.Count(Item => Item.Status == eFormationStatus.Archived)}", eTone.Neutral);
        }
        catch (Exception Error)
        {
            Program.LogError(Error);
            RunList = new();
            SetStatus("读取编队失败 " + Error.Message, eTone.Danger);
        }
        RenderCards();
    }

    private void OnServiceChanged()
    {
        if (IsDisposed || !IsHandleCreated) return;
        if (Interlocked.Exchange(ref RefreshQueued, 1) != 0) return;
        try { BeginInvoke(() => { Interlocked.Exchange(ref RefreshQueued, 0); if (Visible) Reload(); else RefreshPending = true; }); }
        catch (InvalidOperationException) when (IsDisposed || !IsHandleCreated) { Interlocked.Exchange(ref RefreshQueued, 0); }
    }

    protected override void OnVisibleChanged(EventArgs Event)
    {
        base.OnVisibleChanged(Event);
        if (Visible && RefreshPending) Reload();
    }

    private void RenderCards()
    {
        int Scroll = CardScroll.VerticalScroll.Value;
        CardFlow.SuspendLayout();
        try
        {
            var ExistingDict = CardFlow.Controls.OfType<FormationCard>().ToDictionary(Card => Card.Run.Id);
            foreach (Control Old in CardFlow.Controls.Cast<Control>().ToList())
            {
                if (Old is FormationCard Existing && RunList.Any(Run => Run.Id == Existing.Run.Id)) continue;
                if (Old.Name == "FormationEmpty" && RunList.Count == 0) continue;
                CardFlow.Controls.Remove(Old);
                Old.Dispose();
            }
            foreach (string Id in CardSignatureDict.Keys.Where(Id => RunList.All(Run => Run.Id != Id)).ToList()) CardSignatureDict.Remove(Id);
            if (RunList.Count == 0 && CardFlow.Controls.Count == 0)
            {
                var Empty = StudioCard.Create(Store is null ? "编队服务尚未连接" : "还没有编队",
                    Store is null ? "当前窗口没有接入编队存储 无法读取或创建编队  ·  其他页面不受影响"
                    : "点击「＋ 新建编队」选择统筹 执行者 审核者 外援与学习者 也可以从已保存的模板起步", out _);
                Empty.Dock = DockStyle.None;
                Empty.AutoSize = false;
                Empty.Name = "FormationEmpty";
                CardFlow.Controls.Add(Empty);
            }
            for (int Index = 0; Index < RunList.Count; Index++)
            {
                var Run = RunList[Index];
                string Signature = JsonSerializer.Serialize(Run, WireOptions);
                if (CardSignatureDict.GetValueOrDefault(Run.Id) == Signature) continue;
                if (ExistingDict.TryGetValue(Run.Id, out var Old)) { CardFlow.Controls.Remove(Old); Old.Dispose(); }
                var Card = new FormationCard(Run, Settings, CanWrite, OnCardRequest);
                CardFlow.Controls.Add(Card);
                CardFlow.Controls.SetChildIndex(Card, Index);
                Theme.Apply(Card);
                CardSignatureDict[Run.Id] = Signature;
            }
            if (RunList.Count == 0) Theme.Apply(CardFlow);
        }
        finally { CardFlow.ResumeLayout(false); }
        ArrangeCards();
        if (Scroll > 0) CardScroll.AutoScrollPosition = new Point(0, Scroll);
    }

    private void ArrangeCards()
    {
        int Available = CardScroll.ClientSize.Width - CardScroll.Padding.Horizontal;
        if (Available <= 0) return;
        float Scale = DeviceDpi / 96f;
        int Gap = (int)(16 * Scale);
        int Columns = Available >= (int)(1080 * Scale) ? 2 : 1;
        int Width = (Available - Gap * (Columns - 1)) / Columns;
        CardFlow.SuspendLayout();
        int Index = 0;
        foreach (Control Card in CardFlow.Controls)
        {
            if (Card is FormationCard Formation)
            {
                Formation.Margin = new Padding(0, 0, Index % Columns == Columns - 1 ? 0 : Gap, Gap);
                Formation.Size = new Size(Width, Formation.MeasureHeight(Width));
                Index++;
            }
            else
            {
                Card.Margin = new Padding(0, 0, 0, Gap);
                Card.Size = new Size(Available, (int)(124 * Scale));
            }
        }
        CardFlow.ResumeLayout(true);
    }
    #endregion

    #region Actions
    private void OnCardRequest(FormationCard Card, string Action, FormationMember? Member)
    {
        var Run = Card.Run;
        Func<Task> Execute = Action switch
        {
            FormationCard.ActivateAction => () => ActivateAsync(Run),
            FormationCard.PauseAction => () => ExecuteAsync("pause", new { run_id = Run.Id, operation_id = NewId() }, "已暂停 " + Run.Theme),
            FormationCard.ResumeAction => () => ExecuteAsync("resume", new { run_id = Run.Id, operation_id = NewId() }, "已继续 " + Run.Theme),
            FormationCard.ContextAction => () => UpdateContextAsync(Run),
            FormationCard.SeatAction => () => EditSeatAsync(Run, Member!),
            FormationCard.OutsiderAction => () => EditSeatAsync(Run, null),
            FormationCard.OpenAction => () => ExecuteAsync("open", new { run_id = Run.Id }, "已打开统筹会话"),
            FormationCard.ArchiveAction or FormationCard.UnarchiveAction or FormationCard.DeleteAction => () => LifecycleAsync(Run, Action),
            _ => () => ShowDetailAsync(Run.Id)
        };
        // 卡片会在刷新时重建 延后到点击事件结束后执行以免释放正在处理点击的控件
        BeginInvoke((MethodInvoker)(() => _ = RunAsync(Execute)));
    }

    private async Task CreateAsync()
    {
        RequireWrite();
        using var Dialog = new FormationCreateDialog(Settings, Theme, TemplateList, ModelHints(), SaveTemplateAsync);
        if (Dialog.ShowThemed(FindForm(), Theme) != DialogResult.OK) return;
        var Result = await ExecuteAsync("create", new { operation_id = NewId(), formation = Dialog.Request }, "已创建编队 " + Dialog.Request.Theme);
        string RunId = (Result is FormationRun Created ? Created.Id : JsonSerializer.SerializeToElement(Result, WireOptions).GetProperty("id").GetString())
            ?? throw new InvalidDataException("编队创建结果缺少 ID");
        if (!Dialog.ActivateAfterCreate) return;
        try { await ExecuteAsync("activate", new { run_id = RunId, operation_id = NewId() }, "统筹启动包已送达 " + Dialog.Request.Theme); }
        catch (Exception Error)
        {
            Reload();
            throw new InvalidOperationException("编队已创建 但统筹启动未完成 请在卡片上核实后重试\n" + Error.Message, Error);
        }
        await ExecuteAsync("open", new { run_id = RunId }, "已打开统筹会话 初始问题已交给统筹");
    }

    private async Task LifecycleAsync(FormationRun Run, string Action)
    {
        RequireWrite();
        var Plan = (FormationLifecyclePlan)await ExecuteAsync("lifecycle-preview", new { run_id = Run.Id, action = Action }, "会话范围已核对");
        using var Dialog = new FormationLifecycleDialog(Run.Theme, Plan, Settings);
        if (Dialog.ShowThemed(FindForm(), Theme) != DialogResult.OK) return;
        await ExecuteAsync(Action, new
        {
            run_id = Run.Id, operation_id = Plan.ResumeOperationId.Length == 0 ? NewId() : Plan.ResumeOperationId,
            plan_token = Plan.Token, confirm_delete = Action == "delete"
        }, Action == "delete" ? "编队及关联会话已删除" : Action == "archive" ? "编队已归档" : "已取消归档 自动调度保持暂停");
    }

    private async Task<List<FormationTemplate>> SaveTemplateAsync(FormationTemplate Template)
    {
        await ExecuteAsync("template-save", new { operation_id = NewId(), template = Template }, "已保存模板 " + Template.Name);
        return TemplateList;
    }

    private async Task ActivateAsync(FormationRun Run)
    {
        RequireWrite();
        if (Run.ActivationState == eFormationDeliveryState.DeliveryUnknown)
        {
            string? Evidence = StudioPrompt.Evidence(FindForm(), Theme, "核实后重发启动包", "原启动包投递未确认\n请先打开统筹会话核实它没有收到启动包 再填写核实证据\n管理器只在人工确认后重新投递", "我已核实统筹会话没有收到原启动包");
            if (Evidence is null) return;
            await ExecuteAsync("activate", new { run_id = Run.Id, operation_id = NewId(), retry_confirmed = true, evidence = Evidence }, "启动包已重新送达 " + Run.Theme);
            return;
        }
        var Coordinator = Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
        string Target = Coordinator.SessionId.Length == 0 ? "将先在 " + SeatProviders.InstanceName(Settings, Coordinator.InstanceId) + " 新建真实统筹会话" : "统筹会话 " + Coordinator.SessionId;
        string Behavior = Run.SetupOnly ? "统筹就绪后等待你在会话中说明任务" : "统筹会按需求登记任务并派发 执行者通过独立审核后通知统筹";
        if (MessageBox.Show(FindForm(), $"向编队「{Run.Theme}」的统筹发送启动包\n{Target}\n\n{Behavior}", "启动统筹", MessageBoxButtons.OKCancel, MessageBoxIcon.Information) != DialogResult.OK) return;
        await ExecuteAsync("activate", new { run_id = Run.Id, operation_id = NewId() }, "统筹启动包已送达 " + Run.Theme);
    }

    private async Task UpdateContextAsync(FormationRun Run)
    {
        RequireWrite();
        var Revision = Run.RevisionList[^1];
        using var Dialog = new FormationContextDialog(Run.Theme, Revision.Requirement, Revision.Context);
        if (Dialog.ShowThemed(FindForm(), Theme) != DialogResult.OK) return;
        await ExecuteAsync("context", new { run_id = Run.Id, operation_id = NewId(), requirement = Dialog.Requirement, context = Dialog.ContextText }, "已更新需求与上下文 " + Run.Theme);
    }

    private async Task EditSeatAsync(FormationRun Run, FormationMember? Member)
    {
        var Draft = Member ?? new FormationMember { Role = eFormationRole.Outsider, InstanceId = Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator).InstanceId, DispatchMode = eFormationDispatchMode.Native, FollowCoordinator = true };
        using var Dialog = new SeatEditorDialog(Draft, Settings, ModelHints(), false, CanWrite && !Run.Archived && Run.LifecycleOperation is not { Completed: false } && Run.State != eFormationState.Completed, Member is not null, Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator));
        if (Dialog.ShowThemed(FindForm(), Theme) != DialogResult.OK) return;
        RequireWrite();
        var Result = Dialog.Result;
        if (Member is not null && Dialog.OnlySessionChanged)
        {
            await ExecuteAsync("member", new { run_id = Run.Id, member_id = Member.Id, mode = "bind", session_id = Result.SessionId, operation_id = NewId() }, "已绑定会话 " + SeatName(Member));
            return;
        }
        string MemberId = Member?.Id ?? NewId();
        await ExecuteAsync("member", new { run_id = Run.Id, member_id = MemberId, mode = "configure", operation_id = NewId(), member = Result }, (Member is null ? "已补充外援 " : "已更新席位 ") + SeatName(Result));
    }

    private Task ShowDetailAsync(string RunId)
    {
        if (Store is null) throw new InvalidOperationException("编队服务尚未连接");
        using var Dialog = new FormationDetailDialog(RunId, Store, Settings, Theme, CanWrite, ExecuteAsync);
        Dialog.ShowThemed(FindForm(), Theme);
        Reload();
        return Task.CompletedTask;
    }

    /// <summary>
    /// 以人工操作身份调用真实编队服务 成功后刷新 失败原样抛出
    /// </summary>
    public async Task<object> ExecuteAsync(string Action, object Arguments, string Success)
    {
        RequireWrite();
        var Element = JsonSerializer.SerializeToElement(Arguments, WireOptions);
        Busy = true;
        SetStatus("正在执行 " + Action + "…", eTone.Info);
        try
        {
            var Result = await Task.Run(() => Service!.ExecuteAsync(Action, Element, FormationCaller.Operator(), Lifetime.Token));
            Busy = false;
            Reload();
            SetStatus(Success, eTone.Success);
            return Result;
        }
        finally { Busy = false; }
    }

    private void RequireWrite()
    {
        if (Service is null || Store is null) throw new InvalidOperationException("编队服务尚未连接 当前窗口无法写入编队");
        if (PreviewOnly) throw new InvalidOperationException("预览模式只读 不写入编队或启动会话");
    }

    private async Task RunAsync(Func<Task> Execute)
    {
        try { await Execute(); }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested) { }
        catch (Exception Error)
        {
            Program.LogError(Error);
            Reload();
            SetStatus(Error.Message.ReplaceLineEndings(" "), eTone.Danger);
            if (!IsDisposed) MessageBox.Show(FindForm(), Error.Message, "编队操作未完成", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private List<string> ModelHints() => RunList.SelectMany(Item => Item.MemberList).Concat(TemplateList.SelectMany(Item => Item.MemberList))
        .Select(Item => Item.Model).Append(Settings.Cursor.Model).Where(Item => Item.Length != 0).Distinct(StringComparer.Ordinal).OrderBy(Item => Item).ToList();

    private static string SeatName(FormationMember Member) => Member.DisplayName.Length != 0 ? Member.DisplayName : SeatProviders.RoleTitle(Member.Role);

    private static string NewId() => Guid.NewGuid().ToString("N");

    private void SetStatus(string Text, eTone Tone)
    {
        Status.Text = Text;
        Status.ForeColor = Tone == eTone.Neutral ? Theme.Palette.Muted : Theme.Palette.Tone(Tone).Fore;
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing)
        {
            if (Service is not null) Service.Changed -= OnServiceChanged;
            Lifetime.Cancel();
            Lifetime.Dispose();
        }
        base.Dispose(Disposing);
    }
    #endregion
}

/// <summary>
/// 编队首页操作区 全局背景由应用导航壳绘制
/// </summary>
public sealed class FormationHero : Panel, IThemedControl
{
    private ThemePalette Colors = ThemePalette.Light;
    public FlowLayoutPanel Actions { get; } = new() { AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = false, BackColor = Color.Transparent, Tag = eThemeRole.Preserve, Margin = Padding.Empty };

    public FormationHero()
    {
        DoubleBuffered = true;
        ResizeRedraw = true;
        Controls.Add(Actions);
    }

    public void ApplyTheme(AppTheme Theme)
    {
        Colors = Theme.Palette;
        BackColor = Color.Transparent;
        Invalidate(true);
    }

    protected override void OnLayout(LayoutEventArgs Event)
    {
        base.OnLayout(Event);
        float Scale = DeviceDpi / 96f;
        var Size = Actions.GetPreferredSize(System.Drawing.Size.Empty);
        Actions.Bounds = new Rectangle((int)(28 * Scale), Height - Size.Height - (int)(22 * Scale), Size.Width, Size.Height);
    }

    protected override void OnPaintBackground(PaintEventArgs Event)
    {
        base.OnPaintBackground(Event);
        var Canvas = Event.Graphics;
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        using var Shape = StudioGeometry.Rounded(new RectangleF(.5f, .5f, Width - 1.5f, Height - 1.5f), 16 * DeviceDpi / 96f);
        using var Fill = new SolidBrush(Color.FromArgb(190, Colors.Surface));
        Canvas.FillPath(Fill, Shape);
        using var Border = new Pen(Colors.Border);
        Canvas.DrawPath(Border, Shape);
    }
    protected override void OnPaint(PaintEventArgs Event)
    {
        base.OnPaint(Event);
        var Canvas = Event.Graphics;
        float Scale = DeviceDpi / 96f;
        int Left = (int)(30 * Scale);
        int TextWidth = Math.Max(0, Width - Left * 2);
        TextRenderer.DrawText(Canvas, "编队", StudioFonts.Hero, new Point(Left - (int)(2 * Scale), (int)(22 * Scale)), Colors.Text, TextFormatFlags.NoPadding | TextFormatFlags.SingleLine | TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
        TextRenderer.DrawText(Canvas, "统筹分派  ·  独立审核  ·  外援接替", StudioFonts.Body, new Rectangle(Left, (int)(66 * Scale), TextWidth, (int)(22 * Scale)), Colors.Text, TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding | TextFormatFlags.SingleLine | TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
        int ChipLeft = Left;
        int ChipTop = (int)(96 * Scale);
        foreach (var Role in SeatProviders.RoleOrder)
        {
            string Text = SeatProviders.RoleTitle(Role) + " " + SeatProviders.RoleHint(Role);
            int Used = StudioPaint.Chip(Canvas, Text, StudioFonts.Small, new Point(ChipLeft, ChipTop), SeatProviders.RoleTone(Role), Colors, Scale, Math.Max(0, Left + TextWidth - ChipLeft));
            if (Used == 0) break;
            ChipLeft += Used + (int)(6 * Scale);
        }
    }

}
