using System.Drawing.Drawing2D;

namespace CodexInstanceManager;

/// <summary>
/// 执行端能力 与 FormationService.ValidateMember 的校验规则保持一致
/// </summary>
public sealed record SeatProvider(string Id, string Label, string Short, eTone Tone, bool SupportsModel, bool SupportsEffort, bool UsesCwd);

public sealed record SeatStatus(string Text, eTone Tone);

public static class SeatProviders
{
    public static readonly SeatProvider Codex = new("", "Codex", "Cx", eTone.Accent, true, true, false);
    public static readonly IReadOnlyList<SeatProvider> ExternalList = new[]
    {
        new SeatProvider(CursorRelayRunner.InstanceId, "Cursor CLI", "Cu", eTone.Info, true, false, true),
        new SeatProvider(ClaudeRelayRunner.InstanceId, "Claude Code", "Cl", eTone.Warning, true, false, true),
        new SeatProvider(DshRelayRunner.InstanceId, "DeepSeek Harness", "DS", eTone.Violet, false, false, false),
        new SeatProvider(AntigravityRelayRunner.InstanceId, "Antigravity", "Ag", eTone.Pink, false, false, true)
    };
    public static readonly string[] EffortList = { "none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra" };
    public static readonly eFormationRole[] RoleOrder = { eFormationRole.Coordinator, eFormationRole.Executor, eFormationRole.Reviewer, eFormationRole.Outsider, eFormationRole.Learner };

    public static SeatProvider For(string InstanceId) => ExternalList.FirstOrDefault(Item => Item.Id == InstanceId) ?? Codex;

    public static bool IsExternal(string InstanceId) => ExternalList.Any(Item => Item.Id == InstanceId);

    public static string InstanceName(ManagerSettings Settings, string InstanceId)
    {
        if (IsExternal(InstanceId)) return For(InstanceId).Label;
        return Settings.InstanceList.FirstOrDefault(Item => Item.Id == InstanceId)?.Name ?? InstanceId;
    }

    public static eTone RoleTone(eFormationRole Role) => Role switch
    {
        eFormationRole.Coordinator => eTone.Accent,
        eFormationRole.Executor => eTone.Info,
        eFormationRole.Reviewer => eTone.Violet,
        eFormationRole.Outsider => eTone.Warning,
        _ => eTone.Pink
    };

    public static string RoleTitle(eFormationRole Role) => Role switch
    {
        eFormationRole.Coordinator => "统筹",
        eFormationRole.Executor => "执行者",
        eFormationRole.Reviewer => "审核者",
        eFormationRole.Outsider => "外援",
        _ => "学习者"
    };

    public static string RoleHint(eFormationRole Role) => Role switch
    {
        eFormationRole.Coordinator => "1 席",
        eFormationRole.Executor => "可多席",
        eFormationRole.Reviewer => "按需",
        eFormationRole.Outsider => "备用",
        _ => "可选"
    };

    public static string Describe(ManagerSettings Settings, FormationMember Member)
    {
        var Provider = For(Member.InstanceId);
        var LineList = new List<string>
        {
            RoleTitle(Member.Role) + " · " + (Member.DisplayName.Length == 0 ? "自动命名" : Member.DisplayName),
            "执行端 " + (Provider == Codex ? "Codex · " + InstanceName(Settings, Member.InstanceId) : Provider.Label),
            "模型 " + (!Provider.SupportsModel ? "沿用会话配置" : Member.Model.Length == 0 ? "沿用默认" : Member.Model)
        };
        if (Provider.SupportsEffort) LineList.Add("推理强度 " + (Member.Effort.Length == 0 ? "沿用默认" : Member.Effort));
        if (Member.DispatchMode == eFormationDispatchMode.Native) LineList.Add("原生子代理 · " + (Member.FollowCoordinator ? "模型与推理跟随统筹" : "单独指定模型与推理") + " · 共享统筹预算");
        else
        {
            LineList.Add("会话 " + (Member.SessionId.Length == 0 ? "按需新建" : Member.SessionId));
            if (Member.SubagentMax > 0) LineList.Add("子代理上限 " + Member.SubagentMax);
        }
        if (Member.Project.Length != 0) LineList.Add("项目 " + Member.Project);
        if (Member.Cwd.Length != 0) LineList.Add("工作目录 " + Member.Cwd);
        return string.Join(Environment.NewLine, LineList);
    }
}

/// <summary>
/// 按固定角色泳道绘制席位卡 不绘制连线 层级由泳道顺序与角色色表达
/// </summary>
public sealed class SeatBoard : Control, IThemedControl
{
    private sealed record SeatSlot(Rectangle Bounds, eFormationRole Role, FormationMember? Member, string? PlaceText, bool Clickable);
    private sealed record SeatLane(eFormationRole Role, int Top, int Count);

    /// <summary> 席位悬停详情 </summary>
    private readonly ToolTip Tip = new() { InitialDelay = 350, ReshowDelay = 150, AutoPopDelay = 12000 };
    /// <summary> 当前调色板 </summary>
    private ThemePalette Colors = ThemePalette.Light;
    /// <summary> 当前展示的席位 </summary>
    private List<FormationMember> MemberList = new();
    /// <summary> 最近一次布局的可点击区域 </summary>
    private List<SeatSlot> SlotList = new();
    /// <summary> 最近一次布局的泳道 </summary>
    private List<SeatLane> LaneList = new();
    /// <summary> 悬停中的区域序号 </summary>
    private int HoverIndex = -1;

    public ManagerSettings Settings { get; set; } = new();
    /// <summary> 运行期状态 为空时按会话绑定情况显示 </summary>
    public Func<FormationMember, SeatStatus>? StatusOf { get; set; }
    /// <summary> 返回泳道末尾占位卡文字及可否点击 返回 null 不显示占位 </summary>
    public Func<eFormationRole, int, (string Text, bool Clickable)?>? Placeholder { get; set; }
    public event Action<FormationMember>? SeatClicked;
    public event Action<eFormationRole>? PlaceholderClicked;
    public IReadOnlyList<FormationMember> Members => MemberList;

    public SeatBoard()
    {
        SetStyle(ControlStyles.SupportsTransparentBackColor, true);
        DoubleBuffered = true;
        ResizeRedraw = true;
        Font = StudioFonts.Body;
    }

    public void SetMembers(IEnumerable<FormationMember> Members)
    {
        MemberList = Members.ToList();
        HoverIndex = -1;
        Invalidate();
    }

    public void ApplyTheme(AppTheme Theme)
    {
        Colors = Theme.Palette;
        BackColor = Parent?.BackColor ?? Colors.Surface;
        Invalidate();
    }

    public int MeasureHeight(int Width) => Arrange(Width, out _, out _);

    private int Arrange(int Width, out List<SeatSlot> Slots, out List<SeatLane> Lanes)
    {
        float Scale = DeviceDpi / 96f;
        int LabelWidth = (int)(92 * Scale);
        int TileHeight = (int)(90 * Scale);
        int Gap = (int)(10 * Scale);
        int LaneGap = (int)(16 * Scale);
        int Available = Math.Max((int)(180 * Scale), Width - LabelWidth);
        int PerRow = Math.Max(1, (Available + Gap) / ((int)(208 * Scale) + Gap));
        int TileWidth = Math.Min((int)(300 * Scale), (Available - Gap * (PerRow - 1)) / PerRow);
        Slots = new();
        Lanes = new();
        int Top = 0;
        foreach (var Role in SeatProviders.RoleOrder)
        {
            var SeatList = MemberList.Where(Item => Item.Role == Role).ToList();
            var Place = Placeholder?.Invoke(Role, SeatList.Count);
            int Count = SeatList.Count + (Place is null ? 0 : 1);
            if (Count == 0) continue;
            for (int Index = 0; Index < Count; Index++)
            {
                var Bounds = new Rectangle(LabelWidth + Index % PerRow * (TileWidth + Gap), Top + Index / PerRow * (TileHeight + Gap), TileWidth, TileHeight);
                Slots.Add(Index < SeatList.Count ? new SeatSlot(Bounds, Role, SeatList[Index], null, true) : new SeatSlot(Bounds, Role, null, Place!.Value.Text, Place.Value.Clickable));
            }
            Lanes.Add(new SeatLane(Role, Top, SeatList.Count));
            int Rows = (Count + PerRow - 1) / PerRow;
            Top += Rows * (TileHeight + Gap) - Gap + LaneGap;
        }
        return Math.Max(0, Top - LaneGap);
    }

    protected override void OnPaint(PaintEventArgs Event)
    {
        var Canvas = Event.Graphics;
        ButtonRenderer.DrawParentBackground(Canvas, ClientRectangle, this);
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        float Scale = DeviceDpi / 96f;
        Arrange(Width, out SlotList, out LaneList);
        foreach (var Lane in LaneList)
        {
            StudioPaint.Chip(Canvas, SeatProviders.RoleTitle(Lane.Role), StudioFonts.Small, new Point(0, Lane.Top + (int)(4 * Scale)), SeatProviders.RoleTone(Lane.Role), Colors, Scale);
            string Hint = SeatProviders.RoleHint(Lane.Role) + ((Lane.Role is eFormationRole.Executor or eFormationRole.Reviewer) && Lane.Count > 0 ? " · " + Lane.Count : "");
            TextRenderer.DrawText(Canvas, Hint, StudioFonts.Small, new Point((int)(2 * Scale), Lane.Top + (int)(30 * Scale)), Colors.Subtle, TextFormatFlags.NoPadding);
        }
        for (int Index = 0; Index < SlotList.Count; Index++)
        {
            var Slot = SlotList[Index];
            bool Hover = Index == HoverIndex;
            if (Slot.Member is { } Member) PaintSeat(Canvas, Slot.Bounds, Member, Hover, Scale);
            else PaintPlaceholder(Canvas, Slot, Hover, Scale);
        }
    }

    private void PaintSeat(Graphics Canvas, Rectangle Bounds, FormationMember Member, bool Hover, float Scale)
    {
        var Provider = SeatProviders.For(Member.InstanceId);
        var RoleColor = Colors.Tone(SeatProviders.RoleTone(Member.Role)).Fore;
        using var Shape = StudioGeometry.Rounded(new RectangleF(Bounds.X + .5f, Bounds.Y + .5f, Bounds.Width - 1, Bounds.Height - 1), 10 * Scale);
        using (var Fill = new SolidBrush(Hover ? Colors.Surface : Colors.Inset)) Canvas.FillPath(Fill, Shape);
        var State = Canvas.Save();
        Canvas.SetClip(Shape);
        using (var Stripe = new SolidBrush(RoleColor)) Canvas.FillRectangle(Stripe, Bounds.X, Bounds.Y, 4 * Scale, Bounds.Height);
        Canvas.Restore(State);
        using (var Border = new Pen(Hover ? RoleColor : Colors.Border)) Canvas.DrawPath(Border, Shape);

        int Left = Bounds.X + (int)(14 * Scale);
        var BadgeBounds = new Rectangle(Left, Bounds.Y + (int)(11 * Scale), (int)(26 * Scale), (int)(26 * Scale));
        string Badge = Settings.InstanceList.FirstOrDefault(Item => Item.Id == Member.InstanceId)?.Badge ?? "1";
        using (var Avatar = AgentAvatars.Draw(Provider == SeatProviders.Codex ? "codex" : Provider.Id, Badge, BadgeBounds.Width, Colors.Tone(Provider.Tone).Fore))
            Canvas.DrawImage(Avatar, BadgeBounds);

        var Status = StatusOf?.Invoke(Member) ?? (Member.SessionId.Length == 0 ? new SeatStatus("按需新建", eTone.Neutral) : new SeatStatus("复用会话", eTone.Success));
        var StatusSize = TextRenderer.MeasureText(Canvas, Status.Text, StudioFonts.Small, Size.Empty, TextFormatFlags.NoPadding);
        int StatusWidth = StatusSize.Width + (int)(16 * Scale);
        int StatusLeft = Bounds.Right - StatusWidth - (int)(10 * Scale);
        StudioPaint.Chip(Canvas, Status.Text, StudioFonts.Small, new Point(StatusLeft, Bounds.Y + (int)(13 * Scale)), Status.Tone, Colors, Scale);
        int NameLeft = BadgeBounds.Right + (int)(8 * Scale);
        string Name = Member.DisplayName.Length == 0 ? SeatProviders.RoleTitle(Member.Role) : Member.DisplayName;
        TextRenderer.DrawText(Canvas, Name, StudioFonts.Strong, new Rectangle(NameLeft, Bounds.Y + (int)(10 * Scale), Math.Max(0, StatusLeft - NameLeft - (int)(6 * Scale)), (int)(20 * Scale)), Colors.Text, TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding);
        string Where = Provider == SeatProviders.Codex ? "Codex · " + SeatProviders.InstanceName(Settings, Member.InstanceId) : Provider.Label;
        string Workspace = Member.Project.Length != 0 ? Member.Project : Member.Cwd;
        if (Workspace.Length != 0) Where += " · " + (Path.GetFileName(Path.TrimEndingDirectorySeparator(Workspace)) is { Length: > 0 } Folder ? Folder : Workspace);
        TextRenderer.DrawText(Canvas, Where, StudioFonts.Small, new Rectangle(NameLeft, Bounds.Y + (int)(31 * Scale), Math.Max(0, Bounds.Right - NameLeft - (int)(10 * Scale)), (int)(18 * Scale)), Colors.Muted, TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding);

        int ChipTop = Bounds.Bottom - StudioPaint.ChipHeight(StudioFonts.Small, Scale) - (int)(10 * Scale);
        int ChipLeft = Left;
        int ChipRight = Bounds.Right - (int)(10 * Scale);
        string ModelText = !Provider.SupportsModel ? "模型 沿用会话" : Member.Model.Length == 0 ? "模型 沿用" : Member.Model;
        int Used = StudioPaint.Chip(Canvas, ModelText, StudioFonts.Small, new Point(ChipLeft, ChipTop), Provider.SupportsModel && Member.Model.Length != 0 ? eTone.Accent : eTone.Neutral, Colors, Scale, ChipRight - ChipLeft);
        ChipLeft += Used + (int)(6 * Scale);
        if (Provider.SupportsEffort && ChipRight - ChipLeft > (int)(40 * Scale))
            StudioPaint.Chip(Canvas, Member.Effort.Length == 0 ? "推理 沿用" : "推理 " + Member.Effort, StudioFonts.Small, new Point(ChipLeft, ChipTop), Member.Effort.Length == 0 ? eTone.Neutral : eTone.Violet, Colors, Scale, ChipRight - ChipLeft);
    }

    private void PaintPlaceholder(Graphics Canvas, SeatSlot Slot, bool Hover, float Scale)
    {
        var Bounds = Slot.Bounds;
        var Fore = Slot.Clickable ? Colors.Tone(SeatProviders.RoleTone(Slot.Role)).Fore : Colors.Subtle;
        using var Shape = StudioGeometry.Rounded(new RectangleF(Bounds.X + .5f, Bounds.Y + .5f, Bounds.Width - 1, Bounds.Height - 1), 10 * Scale);
        if (Hover && Slot.Clickable)
            using (var Fill = new SolidBrush(Colors.Inset)) Canvas.FillPath(Fill, Shape);
        using (var Border = new Pen(Slot.Clickable ? Fore : Colors.Border, 1.2f) { DashStyle = DashStyle.Dash }) Canvas.DrawPath(Border, Shape);
        TextRenderer.DrawText(Canvas, Slot.PlaceText, StudioFonts.Body, Bounds, Fore, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
    }

    private int HitTest(Point Location)
    {
        for (int Index = 0; Index < SlotList.Count; Index++) if (SlotList[Index].Bounds.Contains(Location)) return Index;
        return -1;
    }

    protected override void OnMouseMove(MouseEventArgs Event)
    {
        base.OnMouseMove(Event);
        int Index = HitTest(Event.Location);
        if (Index == HoverIndex) return;
        HoverIndex = Index;
        var Slot = Index >= 0 ? SlotList[Index] : null;
        Cursor = Slot is not null && (Slot.Member is not null || Slot.Clickable) ? Cursors.Hand : Cursors.Default;
        Tip.SetToolTip(this, Slot?.Member is { } Member ? SeatProviders.Describe(Settings, Member) : Slot?.PlaceText ?? "");
        Invalidate();
    }

    protected override void OnMouseLeave(EventArgs Event)
    {
        base.OnMouseLeave(Event);
        HoverIndex = -1;
        Tip.SetToolTip(this, "");
        Invalidate();
    }

    protected override void OnMouseClick(MouseEventArgs Event)
    {
        base.OnMouseClick(Event);
        if (Event.Button != MouseButtons.Left) return;
        int Index = HitTest(Event.Location);
        if (Index < 0) return;
        var Slot = SlotList[Index];
        if (Slot.Member is not null) SeatClicked?.Invoke(Slot.Member);
        else if (Slot.Clickable) PlaceholderClicked?.Invoke(Slot.Role);
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Tip.Dispose();
        base.Dispose(Disposing);
    }
}
