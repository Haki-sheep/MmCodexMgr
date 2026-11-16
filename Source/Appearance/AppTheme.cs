using System.Runtime.InteropServices;

namespace CodexInstanceManager;

public enum eThemeRole { Background, Surface, Muted, Primary, Preserve, Sidebar, Inset, Title, Ghost, Danger }

public enum eTone { Neutral, Accent, Success, Warning, Danger, Info, Violet, Pink }

/// <summary>
/// 自绘控件按当前调色板刷新自身 子控件仍由 AppTheme 继续遍历
/// </summary>
public interface IThemedControl
{
    void ApplyTheme(AppTheme Theme);
}

public sealed record ThemePalette(Color Background, Color Surface, Color Input, Color Text, Color Muted, Color Border, Color Selection, Color Accent, Color Success, Color Warning)
{
    public Color Sidebar { get; init; }
    public Color Inset { get; init; }
    public Color Subtle { get; init; }
    public Color AccentSoft { get; init; }
    public Color AccentHover { get; init; }
    public Color OnAccent { get; init; }
    public Color SuccessSoft { get; init; }
    public Color WarningSoft { get; init; }
    public Color Danger { get; init; }
    public Color DangerSoft { get; init; }
    public Color Info { get; init; }
    public Color InfoSoft { get; init; }
    public Color Violet { get; init; }
    public Color VioletSoft { get; init; }
    public Color Pink { get; init; }
    public Color PinkSoft { get; init; }

    public static readonly ThemePalette Light = new(Color.FromArgb(244, 247, 248), Color.White, Color.FromArgb(248, 250, 251), Color.FromArgb(31, 42, 51), Color.FromArgb(107, 119, 133), Color.FromArgb(226, 232, 236), Color.FromArgb(222, 243, 238), Color.FromArgb(24, 143, 131), Color.FromArgb(46, 158, 107), Color.FromArgb(196, 126, 22))
    {
        Sidebar = Color.FromArgb(236, 243, 242),
        Inset = Color.FromArgb(246, 249, 249),
        Subtle = Color.FromArgb(163, 173, 183),
        AccentSoft = Color.FromArgb(222, 243, 238),
        AccentHover = Color.FromArgb(20, 125, 114),
        OnAccent = Color.White,
        SuccessSoft = Color.FromArgb(225, 244, 234),
        WarningSoft = Color.FromArgb(251, 240, 220),
        Danger = Color.FromArgb(206, 72, 72),
        DangerSoft = Color.FromArgb(251, 229, 229),
        Info = Color.FromArgb(58, 120, 222),
        InfoSoft = Color.FromArgb(228, 238, 252),
        Violet = Color.FromArgb(118, 98, 226),
        VioletSoft = Color.FromArgb(236, 233, 252),
        Pink = Color.FromArgb(206, 96, 142),
        PinkSoft = Color.FromArgb(251, 232, 240)
    };

    public static readonly ThemePalette Dark = new(Color.FromArgb(22, 25, 29), Color.FromArgb(31, 35, 40), Color.FromArgb(38, 43, 49), Color.FromArgb(230, 234, 238), Color.FromArgb(154, 164, 174), Color.FromArgb(48, 54, 61), Color.FromArgb(28, 58, 54), Color.FromArgb(76, 201, 176), Color.FromArgb(91, 201, 142), Color.FromArgb(232, 176, 84))
    {
        Sidebar = Color.FromArgb(26, 30, 34),
        Inset = Color.FromArgb(36, 41, 47),
        Subtle = Color.FromArgb(108, 118, 128),
        AccentSoft = Color.FromArgb(30, 56, 52),
        AccentHover = Color.FromArgb(104, 216, 194),
        OnAccent = Color.FromArgb(12, 30, 27),
        SuccessSoft = Color.FromArgb(30, 52, 40),
        WarningSoft = Color.FromArgb(58, 46, 26),
        Danger = Color.FromArgb(240, 116, 112),
        DangerSoft = Color.FromArgb(62, 34, 36),
        Info = Color.FromArgb(122, 169, 255),
        InfoSoft = Color.FromArgb(30, 42, 64),
        Violet = Color.FromArgb(169, 155, 255),
        VioletSoft = Color.FromArgb(44, 40, 70),
        Pink = Color.FromArgb(240, 154, 189),
        PinkSoft = Color.FromArgb(62, 36, 50)
    };

    public (Color Fore, Color Back) Tone(eTone Value) => Value switch
    {
        eTone.Accent => (Accent, AccentSoft),
        eTone.Success => (Success, SuccessSoft),
        eTone.Warning => (Warning, WarningSoft),
        eTone.Danger => (Danger, DangerSoft),
        eTone.Info => (Info, InfoSoft),
        eTone.Violet => (Violet, VioletSoft),
        eTone.Pink => (Pink, PinkSoft),
        _ => (Muted, Inset)
    };
}

public sealed class AppTheme
{
    private const int ImmersiveDarkModeAttribute = 20;
    private const int CaptionColorAttribute = 35;
    private const int CaptionTextColorAttribute = 36;
    public const string ToggleButtonName = "ThemeToggle";
    public bool IsDark { get; private set; }
    public ThemePalette Palette => IsDark ? ThemePalette.Dark : ThemePalette.Light;

    public AppTheme(bool IsDark) => this.IsDark = IsDark;

    public void SetDark(bool Value) => IsDark = Value;

    public void Apply(Control Root)
    {
        CaptureRoles(Root);
        ApplyColors(Root);
        if (Root is Form Form && Form.IsHandleCreated) ApplyTitleBar(Form);
        Root.Invalidate(true);
    }

    public void ApplyTitleBar(Form Form)
    {
        if (!OperatingSystem.IsWindowsVersionAtLeast(10, 0, 22000)) return;
        int Value = IsDark ? 1 : 0;
        Marshal.ThrowExceptionForHR(DwmSetWindowAttribute(Form.Handle, ImmersiveDarkModeAttribute, ref Value, sizeof(int)));
        int CaptionColor = Palette.Background.R | Palette.Background.G << 8 | Palette.Background.B << 16;
        int CaptionTextColor = Palette.Text.R | Palette.Text.G << 8 | Palette.Text.B << 16;
        Marshal.ThrowExceptionForHR(DwmSetWindowAttribute(Form.Handle, CaptionColorAttribute, ref CaptionColor, sizeof(int)));
        Marshal.ThrowExceptionForHR(DwmSetWindowAttribute(Form.Handle, CaptionTextColorAttribute, ref CaptionTextColor, sizeof(int)));
        int RoundedCorner = 2;
        Marshal.ThrowExceptionForHR(DwmSetWindowAttribute(Form.Handle, 33, ref RoundedCorner, sizeof(int)));
    }

    private static void CaptureRoles(Control Root)
    {
        if (Root.Tag is null)
        {
            if (Root is Label && (Root.ForeColor == Color.DimGray || Root.ForeColor == Color.Gray)) Root.Tag = eThemeRole.Muted;
            else if (Root is Panel && Root.BackColor == Color.White) Root.Tag = eThemeRole.Surface;
        }
        foreach (Control Child in Root.Controls) CaptureRoles(Child);
    }

    private static Color ContainerBackground(Control Root, ThemePalette Colors)
    {
        for (var Parent = Root.Parent; Parent is not null; Parent = Parent.Parent)
            if (Parent is StudioCard) return Parent.Tag is eThemeRole.Inset ? Colors.Inset : Colors.Surface;
        return Color.Transparent;
    }

    private void ApplyColors(Control Root)
    {
        var Colors = Palette;
        if (Root is IThemedControl Themed) Themed.ApplyTheme(this);
        else if (Root.Tag is not eThemeRole.Preserve)
        {
            Root.ForeColor = Root.Tag is eThemeRole.Muted ? Colors.Muted : Colors.Text;
            Root.BackColor = Root is Panel or UserControl or Label ? ContainerBackground(Root, Colors)
                : Root is Form || Root.Tag is eThemeRole.Background ? Colors.Background
                : Root.Tag is eThemeRole.Surface ? Colors.Surface
                : Root.Tag is eThemeRole.Sidebar ? Colors.Sidebar
                : Root.Tag is eThemeRole.Inset ? Colors.Inset
                : Root.Parent is { BackColor.A: 255 } Parent ? Parent.BackColor : Colors.Background;
            switch (Root)
            {
                case Button Button:
                    bool Primary = Button.Tag is eThemeRole.Primary;
                    Button.BackColor = Primary ? Colors.Accent : Colors.Surface;
                    Button.ForeColor = Primary ? Colors.OnAccent : Colors.Text;
                    Button.FlatAppearance.BorderColor = Colors.Border;
                    break;
                case LinkLabel Link:
                    Link.LinkColor = Colors.Accent;
                    Link.ActiveLinkColor = Colors.AccentHover;
                    Link.VisitedLinkColor = Colors.Accent;
                    break;
                case TextBoxBase Text:
                    Text.BackColor = Text.ReadOnly ? Colors.Inset : Colors.Input;
                    break;
                case ComboBox Combo:
                    if (Combo is ThemeComboBox ThemedCombo) ThemedCombo.Theme = this;
                    Combo.FlatStyle = FlatStyle.Flat;
                    Combo.BackColor = Colors.Input;
                    break;
                case NumericUpDown Number:
                    Number.BackColor = Colors.Input;
                    break;
                case ListBox List:
                    List.BackColor = List.Tag is eThemeRole.Background ? Colors.Background : Colors.Surface;
                    break;
                case DataGridView Grid:
                    Grid.EnableHeadersVisualStyles = false;
                    Grid.BackgroundColor = Colors.Surface;
                    Grid.GridColor = Grid.Name == "SkillLibraryGrid" ? IsDark ? Color.FromArgb(70, 82, 94) : Color.FromArgb(200, 210, 218) : Colors.Border;
                    Grid.DefaultCellStyle.BackColor = Colors.Surface;
                    Grid.DefaultCellStyle.ForeColor = Colors.Text;
                    Grid.DefaultCellStyle.SelectionBackColor = Colors.Selection;
                    Grid.DefaultCellStyle.SelectionForeColor = Colors.Text;
                    Grid.AlternatingRowsDefaultCellStyle.BackColor = Colors.Surface;
                    Grid.ColumnHeadersDefaultCellStyle.BackColor = Colors.Inset;
                    Grid.ColumnHeadersDefaultCellStyle.ForeColor = Colors.Muted;
                    Grid.ColumnHeadersDefaultCellStyle.SelectionBackColor = Colors.Inset;
                    Grid.ColumnHeadersDefaultCellStyle.SelectionForeColor = Colors.Muted;
                    break;
            }
        }
        foreach (Control Child in Root.Controls) ApplyColors(Child);
    }

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr Window, int Attribute, ref int Value, int Size);
}
