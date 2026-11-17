using System.Drawing.Drawing2D;

namespace CodexInstanceManager;

internal sealed class FormationAvatarButton : Button, IThemedControl
{
    /// <summary> 当前主题调色板 </summary>
    private ThemePalette Colors = ThemePalette.Light;
    /// <summary> 用于读取 Codex 实例徽记 </summary>
    private ManagerSettings? Settings;
    /// <summary> 当前头像对应的实例 ID </summary>
    private string? InstanceId;
    /// <summary> 当前头像缓存 控件持有并释放 </summary>
    private Bitmap? Avatar;
    /// <summary> 已配置席位或当前选中的 Agent </summary>
    private bool Selected;
    /// <summary> 指针是否停在头像上 </summary>
    private bool Hovering;
    /// <summary> 看板使用圆形窗口区域 保留头像外侧的插画背景 </summary>
    private readonly bool ClipToCircle;

    public eTone Tone { get; init; }
    public eTone? StatusTone { get; set; }
    public string SeatNumber { get; init; } = "";

    public FormationAvatarButton(int Diameter, bool ClipToCircle = false)
    {
        this.ClipToCircle = ClipToCircle;
        SetStyle(ControlStyles.Opaque | ControlStyles.ResizeRedraw, true);
        DoubleBuffered = true;
        BackColor = ClipToCircle ? Colors.Surface : Colors.Background;
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        Cursor = Cursors.Hand;
        Size = LogicalToDeviceUnits(new Size(Diameter, Diameter));
        Margin = new Padding(0, 0, 8, 0);
    }

    public void SetAvatar(bool Selected, string? InstanceId, ManagerSettings Settings)
    {
        bool changed = this.InstanceId != InstanceId || !ReferenceEquals(this.Settings, Settings);
        this.Selected = Selected;
        this.Settings = Settings;
        this.InstanceId = InstanceId;
        if (changed) RefreshAvatar();
        Invalidate();
    }

    public void ApplyTheme(AppTheme Theme)
    {
        Colors = Theme.Palette;
        BackColor = ClipToCircle ? Colors.Surface : Colors.Background;
        RefreshAvatar();
        Invalidate();
    }

    private void RefreshAvatar()
    {
        Avatar?.Dispose();
        Avatar = null;
        if (InstanceId is null) return;
        var Provider = SeatProviders.For(InstanceId);
        var Profile = Settings?.InstanceList.FirstOrDefault(Item => Item.Id == InstanceId);
        Avatar = Profile is not null ? BrandingService.DrawBadge(Profile, 96)
            : AgentAvatars.Draw(Provider == SeatProviders.Codex ? "codex" : Provider.Id, Provider.Short, 96, Colors.Tone(Provider.Tone).Fore);
    }

    protected override void OnMouseEnter(EventArgs Event)
    {
        base.OnMouseEnter(Event);
        Hovering = true;
        Invalidate();
    }

    protected override void OnMouseLeave(EventArgs Event)
    {
        base.OnMouseLeave(Event);
        Hovering = false;
        Invalidate();
    }

    protected override void OnGotFocus(EventArgs Event)
    {
        base.OnGotFocus(Event);
        Invalidate();
    }

    protected override void OnLostFocus(EventArgs Event)
    {
        base.OnLostFocus(Event);
        Invalidate();
    }

    protected override void OnSizeChanged(EventArgs Event)
    {
        base.OnSizeChanged(Event);
        if (!ClipToCircle || Width == 0 || Height == 0) return;
        using var Circle = new GraphicsPath();
        Circle.AddEllipse(ClientRectangle);
        Region = new Region(Circle);
    }

    protected override void OnPaint(PaintEventArgs Event)
    {
        var Canvas = Event.Graphics;
        // ButtonBase 的不透明绘制会跳过背景回调 局部重绘也必须先填满本次区域
        using (var Background = new SolidBrush(BackColor))
            Canvas.FillRectangle(Background, Event.ClipRectangle);
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        Canvas.InterpolationMode = InterpolationMode.HighQualityBicubic;
        float scale = DeviceDpi / 96f;
        var (Accent, AccentSoft) = Colors.Tone(Tone);
        float inset = (ClipToCircle ? 2 : 4) * scale;
        var Bounds = RectangleF.Inflate(ClientRectangle, -inset, -inset);
        using var Fill = new SolidBrush(Hovering || Selected ? AccentSoft : Colors.Inset);
        Canvas.FillEllipse(Fill, Bounds);
        if (Avatar is not null)
        {
            var CanvasState = Canvas.Save();
            using var Circle = new GraphicsPath();
            Circle.AddEllipse(Bounds);
            Canvas.SetClip(Circle, CombineMode.Intersect);
            Canvas.DrawImage(Avatar, Bounds);
            Canvas.Restore(CanvasState);
        }
        else
        {
            float mark = 5 * scale;
            float x = Bounds.Left + Bounds.Width / 2;
            float y = Bounds.Top + Bounds.Height / 2;
            using var Plus = new Pen(Hovering || Selected ? Accent : Colors.Muted, 1.5f * scale);
            Canvas.DrawLine(Plus, x - mark, y, x + mark, y);
            if (Enabled) Canvas.DrawLine(Plus, x, y - mark, x, y + mark);
        }

        using var Border = new Pen(Selected || Hovering ? Accent : Colors.Subtle, (Selected || Hovering ? 2 : 1) * scale);
        if (!Selected && Avatar is null && !Hovering) Border.DashStyle = DashStyle.Dash;
        Canvas.DrawEllipse(Border, Bounds);
        if (SeatNumber.Length != 0)
        {
            var Badge = new Rectangle((int)(2 * scale), Height / 2, (int)(12 * scale), (int)(14 * scale));
            using var BadgeFill = new SolidBrush(Colors.Surface);
            Canvas.FillEllipse(BadgeFill, Badge);
            TextRenderer.DrawText(Canvas, SeatNumber, StudioFonts.Small, Badge, Colors.Text,
                TextFormatFlags.NoPadding | TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter |
                TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
        }
        if (StatusTone is { } Status && Status != eTone.Neutral)
        {
            using var StatusFill = new SolidBrush(Colors.Tone(Status).Fore);
            using var StatusBorder = new Pen(Colors.Surface, scale);
            var Dot = new RectangleF(Width * .67f, Height * .14f, 6 * scale, 6 * scale);
            Canvas.FillEllipse(StatusFill, Dot);
            Canvas.DrawEllipse(StatusBorder, Dot);
        }
        if (Focused && ShowFocusCues)
        {
            using var Focus = new Pen(Colors.Accent, scale) { DashStyle = DashStyle.Dot };
            float focus = (ClipToCircle ? 1 : 2) * scale;
            Canvas.DrawEllipse(Focus, RectangleF.Inflate(Bounds, focus, focus));
        }
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Avatar?.Dispose();
        base.Dispose(Disposing);
        if (Disposing && ClipToCircle) Region = null;
    }
}
