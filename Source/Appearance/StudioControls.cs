using System.Drawing.Drawing2D;

namespace CodexInstanceManager;

public enum eButtonKind { Secondary, Primary, Ghost, Danger }

public static class StudioGeometry
{
    public static GraphicsPath Rounded(RectangleF Bounds, float Radius)
    {
        float Diameter = Math.Max(1, Math.Min(Radius * 2, Math.Min(Bounds.Width, Bounds.Height)));
        var Path = new GraphicsPath();
        Path.AddArc(Bounds.Left, Bounds.Top, Diameter, Diameter, 180, 90);
        Path.AddArc(Bounds.Right - Diameter, Bounds.Top, Diameter, Diameter, 270, 90);
        Path.AddArc(Bounds.Right - Diameter, Bounds.Bottom - Diameter, Diameter, Diameter, 0, 90);
        Path.AddArc(Bounds.Left, Bounds.Bottom - Diameter, Diameter, Diameter, 90, 90);
        Path.CloseFigure();
        return Path;
    }
}

/// <summary>
/// 全局共享字体 生命周期与进程一致 调用方不得释放
/// </summary>
public static class StudioFonts
{
    public const string Family = "Microsoft YaHei UI";
    public static readonly Font Hero = new(Family, 22, FontStyle.Bold);
    public static readonly Font Title = new(Family, 17, FontStyle.Bold);
    public static readonly Font Section = new(Family, 11.5f, FontStyle.Bold);
    public static readonly Font Strong = new(Family, 10, FontStyle.Bold);
    public static readonly Font Body = new(Family, 10);
    public static readonly Font Caption = new(Family, 9);
    public static readonly Font Small = new(Family, 8.5f);
    public static readonly Font Mono = new("Consolas", 9.5f);
    public static readonly Font Glyph = new("Segoe MDL2 Assets", 12);
}

public static class StudioPaint
{
    /// <summary>
    /// 在指定左上角绘制胶囊标签 返回占用宽度
    /// </summary>
    public static int Chip(Graphics Canvas, string Text, Font Font, Point Location, eTone Tone, ThemePalette Colors, float Scale, int MaxWidth = int.MaxValue)
    {
        var (Fore, Back) = Colors.Tone(Tone);
        var TextSize = TextRenderer.MeasureText(Canvas, Text, Font, Size.Empty, TextFormatFlags.NoPadding | TextFormatFlags.SingleLine);
        int Width = Math.Min(MaxWidth, TextSize.Width + (int)(16 * Scale));
        int Height = TextSize.Height + (int)(6 * Scale);
        if (Width <= (int)(18 * Scale)) return 0;
        var Bounds = new Rectangle(Location.X, Location.Y, Width, Height);
        var Mode = Canvas.SmoothingMode;
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        using (var Path = StudioGeometry.Rounded(Bounds, Height / 2f))
        using (var Brush = new SolidBrush(Back))
            Canvas.FillPath(Brush, Path);
        Canvas.SmoothingMode = Mode;
        TextRenderer.DrawText(Canvas, Text, Font, Bounds, Fore, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine |
            TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding | TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
        return Width;
    }

    public static int ChipHeight(Font Font, float Scale) => TextRenderer.MeasureText("国", Font, Size.Empty, TextFormatFlags.NoPadding).Height + (int)(6 * Scale);
}

public sealed class StudioButton : Button, IThemedControl
{
    /// <summary> 指针悬停状态 </summary>
    private bool Hovering;
    /// <summary> 指针按下状态 </summary>
    private bool Pressing;
    /// <summary> 最近一次主题调色板 </summary>
    private ThemePalette Colors = ThemePalette.Light;
    /// <summary> 仅过渡期间运行 控件释放时销毁 </summary>
    private System.Windows.Forms.Timer? Animation;
    private float HoverAmount;
    private float PressAmount;
    public bool IsAnimating => Animation?.Enabled == true;

    public StudioButton()
    {
        DoubleBuffered = true;
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        Cursor = Cursors.Hand;
        AutoSize = true;
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        Padding = new Padding(12, 4, 12, 4);
        MinimumSize = new Size(0, 34);
        Margin = new Padding(0, 3, 8, 3);
        Font = StudioFonts.Body;
    }

    public eButtonKind Kind
    {
        get => Tag switch { eThemeRole.Primary => eButtonKind.Primary, eThemeRole.Danger => eButtonKind.Danger, eThemeRole.Ghost => eButtonKind.Ghost, _ => eButtonKind.Secondary };
        set
        {
            Tag = value switch { eButtonKind.Primary => eThemeRole.Primary, eButtonKind.Danger => eThemeRole.Danger, eButtonKind.Ghost => eThemeRole.Ghost, _ => null };
            Invalidate();
        }
    }

    public void ApplyTheme(AppTheme Theme)
    {
        Colors = Theme.Palette;
        if (Name == AppTheme.ToggleButtonName) Text = Theme.IsDark ? "☀  日间模式" : "☾  夜间模式";
        if (Tag is not eThemeRole.Preserve)
        {
            BackColor = Kind == eButtonKind.Primary ? Colors.Accent : Colors.Surface;
            ForeColor = Kind == eButtonKind.Primary ? Colors.OnAccent : Kind == eButtonKind.Danger ? Colors.Danger : Colors.Text;
        }
        Invalidate();
    }

    protected override void OnMouseEnter(EventArgs Event) { Hovering = true; Animate(); base.OnMouseEnter(Event); }
    protected override void OnMouseLeave(EventArgs Event) { Hovering = false; Pressing = false; Animate(); base.OnMouseLeave(Event); }
    protected override void OnMouseDown(MouseEventArgs Event) { Pressing = Event.Button == MouseButtons.Left; Animate(); base.OnMouseDown(Event); }
    protected override void OnMouseUp(MouseEventArgs Event) { Pressing = false; Animate(); base.OnMouseUp(Event); }
    protected override void OnKeyDown(KeyEventArgs Event) { if (Event.KeyCode == Keys.Space) { Pressing = true; Animate(); } base.OnKeyDown(Event); }
    protected override void OnKeyUp(KeyEventArgs Event) { Pressing = false; Animate(); base.OnKeyUp(Event); }
    protected override void OnEnabledChanged(EventArgs Event) { if (!Enabled) { Hovering = false; Pressing = false; } Animate(); base.OnEnabledChanged(Event); }
    protected override void OnVisibleChanged(EventArgs Event) { if (!Visible) { Animation?.Stop(); HoverAmount = PressAmount = 0; Hovering = Pressing = false; } base.OnVisibleChanged(Event); }

    private void Animate()
    {
        if (!Visible || !Enabled || SystemInformation.HighContrast || !SystemInformation.IsMenuAnimationEnabled)
        {
            Animation?.Stop();
            HoverAmount = Hovering ? 1 : 0;
            PressAmount = Pressing ? 1 : 0;
            Invalidate();
            return;
        }
        if (Animation is null)
        {
            Animation = new() { Interval = 16 };
            Animation.Tick += (_, _) =>
            {
                float HoverTarget = Hovering ? 1 : 0;
                float PressTarget = Pressing ? 1 : 0;
                HoverAmount += (HoverTarget - HoverAmount) * .32f;
                PressAmount += (PressTarget - PressAmount) * .42f;
                if (Math.Abs(HoverTarget - HoverAmount) < .015f && Math.Abs(PressTarget - PressAmount) < .015f)
                {
                    HoverAmount = HoverTarget;
                    PressAmount = PressTarget;
                    Animation.Stop();
                }
                Invalidate();
            };
        }
        Animation.Start();
    }

    private static Color Blend(Color From, Color To, float Amount) => Color.FromArgb(
        (int)(From.A + (To.A - From.A) * Amount), (int)(From.R + (To.R - From.R) * Amount),
        (int)(From.G + (To.G - From.G) * Amount), (int)(From.B + (To.B - From.B) * Amount));

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Animation?.Dispose();
        base.Dispose(Disposing);
    }

    protected override void OnPaint(PaintEventArgs Event)
    {
        var Canvas = Event.Graphics;
        var ParentColor = Parent?.BackColor ?? BackColor;
        if (ParentColor.A < 255) ButtonRenderer.DrawParentBackground(Canvas, ClientRectangle, this);
        else Canvas.Clear(ParentColor);
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        float Scale = DeviceDpi / 96f;
        Color Fill;
        Color Fore;
        Color Border = Color.Empty;
        if (Tag is eThemeRole.Preserve)
        {
            Fill = BackColor;
            Fore = ForeColor;
        }
        else
        {
            switch (Kind)
            {
                case eButtonKind.Primary:
                    Fill = !Enabled ? Colors.Inset : Blend(Colors.Accent, Colors.AccentHover, Math.Max(HoverAmount, PressAmount));
                    Fore = !Enabled ? Colors.Subtle : Colors.OnAccent;
                    break;
                case eButtonKind.Danger:
                    Fill = Blend(Colors.Surface, Colors.DangerSoft, Math.Max(HoverAmount, PressAmount));
                    Fore = Enabled ? Colors.Danger : Colors.Subtle;
                    Border = Enabled ? Colors.Danger : Colors.Border;
                    break;
                case eButtonKind.Ghost:
                    Fill = Blend(ParentColor.A < 255 ? Color.Transparent : ParentColor, Colors.AccentSoft, Math.Max(HoverAmount, PressAmount));
                    Fore = Enabled ? Colors.Accent : Colors.Subtle;
                    break;
                default:
                    Fill = Blend(Blend(Colors.Surface, Colors.Inset, HoverAmount), Colors.Selection, PressAmount);
                    Fore = Enabled ? Colors.Text : Colors.Subtle;
                    Border = Blend(Colors.Border, Colors.Accent, HoverAmount);
                    break;
            }
        }
        float Inset = PressAmount * 1.5f * Scale;
        using var Path = StudioGeometry.Rounded(new RectangleF(.5f + Inset, .5f + Inset, Width - 1.5f - Inset * 2, Height - 1.5f - Inset * 2), 10 * Scale);
        if (Fill.A > 0)
            using (var Brush = new SolidBrush(Fill)) Canvas.FillPath(Brush, Path);
        if (Border != Color.Empty)
            using (var Pen = new Pen(Border)) Canvas.DrawPath(Pen, Path);
        TextRenderer.DrawText(Canvas, Text, Font, ClientRectangle, Fore, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine | TextFormatFlags.EndEllipsis);
        if (Focused && ShowFocusCues)
        {
            using var FocusPath = StudioGeometry.Rounded(new RectangleF(2.5f, 2.5f, Width - 5.5f, Height - 5.5f), 6 * Scale);
            using var Pen = new Pen(Color.FromArgb(150, Colors.Accent), 1.5f);
            Canvas.DrawPath(Pen, FocusPath);
        }
    }
}

public class StudioCard : Panel, IThemedControl
{
    /// <summary> 当前调色板 </summary>
    protected ThemePalette Colors { get; private set; } = ThemePalette.Light;
    /// <summary> 描边语义色 Neutral 使用普通边框 </summary>
    private eTone OutlineValue;
    /// <summary> 左侧强调条颜色语义 为空不绘制 </summary>
    private eTone? StripeValue;

    public StudioCard()
    {
        DoubleBuffered = true;
        ResizeRedraw = true;
        Padding = new Padding(20, 16, 20, 18);
        Margin = new Padding(0, 0, 0, 14);
    }

    public eTone Outline { get => OutlineValue; set { OutlineValue = value; Invalidate(); } }
    public eTone? Stripe { get => StripeValue; set { StripeValue = value; Invalidate(); } }

    public virtual void ApplyTheme(AppTheme Theme)
    {
        Colors = Theme.Palette;
        BackColor = Color.Transparent;
        ForeColor = Colors.Text;
        Invalidate();
    }

    protected override void OnPaintBackground(PaintEventArgs Event)
    {
        var Canvas = Event.Graphics;
        base.OnPaintBackground(Event);
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        float Scale = DeviceDpi / 96f;
        using var Path = StudioGeometry.Rounded(new RectangleF(.5f, .5f, Width - 1.5f, Height - 1.5f), 12 * Scale);
        using (var Brush = new SolidBrush(Tag is eThemeRole.Inset ? Colors.Inset : Colors.Surface)) Canvas.FillPath(Brush, Path);
        if (StripeValue is { } Stripe)
        {
            var State = Canvas.Save();
            Canvas.SetClip(Path, CombineMode.Intersect);
            using var StripeBrush = new SolidBrush(Colors.Tone(Stripe).Fore);
            Canvas.FillRectangle(StripeBrush, 0, 0, 4 * Scale, Height);
            Canvas.Restore(State);
        }
        using var Pen = new Pen(OutlineValue == eTone.Neutral ? Colors.Border : Color.FromArgb(150, Colors.Tone(OutlineValue).Fore));
        Canvas.DrawPath(Pen, Path);
    }

    /// <summary>
    /// 创建带标题与说明的卡片 内容区为自动高度的单列表格
    /// </summary>
    public static StudioCard Create(string Title, string? Caption, out TableLayoutPanel Body, eTone Outline = eTone.Neutral)
    {
        var Card = new StudioCard { Dock = DockStyle.Fill, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Outline = Outline };
        Body = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Margin = Padding.Empty };
        Body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Body.Controls.Add(new Label { Text = Title, Font = StudioFonts.Section, AutoSize = true, Tag = eThemeRole.Title, Margin = new Padding(0, 0, 0, 4) });
        if (Caption is not null) Body.Controls.Add(new StudioWrapLabel { Text = Caption, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 0, 0, 10) });
        Card.Controls.Add(Body);
        return Card;
    }
}

/// <summary>
/// 随父容器宽度自动换行的说明文字
/// </summary>
public sealed class StudioWrapLabel : Label
{
    private Control? BoundParent;
    public StudioWrapLabel()
    {
        AutoSize = true;
    }

    protected override void OnParentChanged(EventArgs Event)
    {
        base.OnParentChanged(Event);
        if (BoundParent is not null) BoundParent.SizeChanged -= ParentResized;
        BoundParent = Parent;
        if (BoundParent is not null) BoundParent.SizeChanged += ParentResized;
        RefreshWrap();
    }

    private void ParentResized(object? Sender, EventArgs Event) => RefreshWrap();

    protected override void Dispose(bool Disposing)
    {
        if (Disposing && BoundParent is not null) { BoundParent.SizeChanged -= ParentResized; BoundParent = null; }
        base.Dispose(Disposing);
    }

    private void RefreshWrap()
    {
        if (Parent is null) return;
        int Width = Math.Max(80, Parent.ClientSize.Width - Parent.Padding.Horizontal - Margin.Horizontal);
        if (MaximumSize.Width != Width) MaximumSize = new Size(Width, 0);
    }
}

public sealed class StudioChip : Label, IThemedControl
{
    /// <summary> 语义色 </summary>
    private eTone ToneValue;
    /// <summary> 当前调色板 </summary>
    private ThemePalette Colors = ThemePalette.Light;
    private System.Windows.Forms.Timer? Animation;
    private long StartedAt;
    private (Color Fore, Color Back)? TransitionFrom;

    public StudioChip()
    {
        AutoSize = true;
        Padding = new Padding(9, 3, 9, 3);
        Margin = new Padding(0, 4, 6, 4);
        Font = StudioFonts.Caption;
        TextAlign = ContentAlignment.MiddleCenter;
        DoubleBuffered = true;
    }

    public eTone Tone
    {
        get => ToneValue;
        set
        {
            if (ToneValue == value && TransitionFrom is null) return;
            StopTransition();
            ToneValue = value;
            Invalidate();
        }
    }

    internal void TransitionTo(eTone Tone)
    {
        if (ToneValue == Tone) return;
        if (!Visible || !SystemInformation.IsMenuAnimationEnabled)
        {
            this.Tone = Tone;
            return;
        }
        TransitionFrom = DisplayColors();
        ToneValue = Tone;
        StartedAt = System.Diagnostics.Stopwatch.GetTimestamp();
        if (Animation is null)
        {
            Animation = new() { Interval = 16 };
            Animation.Tick += (_, _) =>
            {
                if (!Visible || System.Diagnostics.Stopwatch.GetElapsedTime(StartedAt).TotalMilliseconds >= 180) StopTransition();
                Invalidate();
            };
        }
        Animation.Start();
        Invalidate();
    }

    private (Color Fore, Color Back) DisplayColors()
    {
        var Current = Colors.Tone(ToneValue);
        if (TransitionFrom is not { } Previous) return Current;
        double Progress = Math.Min(1, System.Diagnostics.Stopwatch.GetElapsedTime(StartedAt).TotalMilliseconds / 180);
        double Amount = 1 - (1 - Progress) * (1 - Progress);
        return (Interpolate(Previous.Fore, Current.Fore, Amount), Interpolate(Previous.Back, Current.Back, Amount));
    }

    private static Color Interpolate(Color From, Color To, double Amount) => Color.FromArgb(
        (int)(From.R + (To.R - From.R) * Amount), (int)(From.G + (To.G - From.G) * Amount), (int)(From.B + (To.B - From.B) * Amount));

    private void StopTransition()
    {
        Animation?.Stop();
        TransitionFrom = null;
    }

    public void ApplyTheme(AppTheme Theme)
    {
        StopTransition();
        Colors = Theme.Palette;
        BackColor = Parent?.BackColor ?? Colors.Surface;
        Invalidate();
    }

    protected override void OnPaint(PaintEventArgs Event)
    {
        var Canvas = Event.Graphics;
        ButtonRenderer.DrawParentBackground(Canvas, ClientRectangle, this);
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        var (Fore, Back) = DisplayColors();
        using (var Path = StudioGeometry.Rounded(new RectangleF(0, 0, Width - 1, Height - 1), (Height - 1) / 2f))
        using (var Brush = new SolidBrush(Back))
            Canvas.FillPath(Brush, Path);
        TextRenderer.DrawText(Canvas, Text, Font, ClientRectangle, Fore, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine | TextFormatFlags.EndEllipsis);
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Animation?.Dispose();
        base.Dispose(Disposing);
    }
}

public static class StudioGrid
{
    public static DataGridView Create(string Name = "")
    {
        var Grid = new DataGridView
        {
            Name = Name,
            Dock = DockStyle.Fill,
            ReadOnly = true,
            AllowUserToAddRows = false,
            AllowUserToDeleteRows = false,
            AllowUserToResizeRows = false,
            RowHeadersVisible = false,
            AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
            SelectionMode = DataGridViewSelectionMode.FullRowSelect,
            MultiSelect = false,
            BorderStyle = BorderStyle.None,
            CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal,
            ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None,
            ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing,
            ColumnHeadersHeight = 36,
            Margin = new Padding(0, 6, 0, 0)
        };
        Grid.RowTemplate.Height = 38;
        Grid.ColumnHeadersDefaultCellStyle.Font = StudioFonts.Strong;
        Grid.ColumnHeadersDefaultCellStyle.Padding = new Padding(6, 0, 6, 0);
        Grid.DefaultCellStyle.Padding = new Padding(6, 0, 6, 0);
        return Grid;
    }
}
