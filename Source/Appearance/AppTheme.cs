using System.Runtime.InteropServices;

namespace CodexInstanceManager;

public enum eThemeRole { Background, Surface, Muted, Primary, Preserve }

public sealed record ThemePalette(Color Background, Color Surface, Color Input, Color Text, Color Muted, Color Border, Color Selection, Color Accent, Color Success, Color Warning)
{
    public static readonly ThemePalette Light = new(Color.FromArgb(245, 247, 251), Color.White, Color.White, Color.FromArgb(38, 45, 62), Color.FromArgb(104, 113, 130), Color.FromArgb(219, 222, 233), Color.FromArgb(234, 237, 255), Color.FromArgb(79, 86, 219), Color.SeaGreen, Color.FromArgb(161, 97, 15));
    public static readonly ThemePalette Dark = new(Color.FromArgb(22, 25, 32), Color.FromArgb(31, 35, 44), Color.FromArgb(39, 44, 55), Color.FromArgb(225, 230, 239), Color.FromArgb(156, 167, 185), Color.FromArgb(61, 69, 85), Color.FromArgb(52, 61, 94), Color.FromArgb(111, 119, 242), Color.FromArgb(102, 204, 157), Color.FromArgb(239, 184, 97));
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
    }

    private static void CaptureRoles(Control Root)
    {
        if (Root.Tag is null)
        {
            if (Root is Button && Root.BackColor == ThemePalette.Light.Accent) Root.Tag = eThemeRole.Primary;
            else if (Root is Label && (Root.ForeColor == Color.DimGray || Root.ForeColor == Color.Gray)) Root.Tag = eThemeRole.Muted;
            else if (Root is Panel && Root.BackColor == Color.White) Root.Tag = eThemeRole.Surface;
        }
        foreach (Control Child in Root.Controls) CaptureRoles(Child);
    }

    private void ApplyColors(Control Root)
    {
        var Colors = Palette;
        if (Root.Tag is eThemeRole.Preserve) return;
        Root.ForeColor = Root.Tag is eThemeRole.Muted ? Colors.Muted : Colors.Text;
        Root.BackColor = Root is Form or TabPage || Root.Tag is eThemeRole.Background ? Colors.Background : Root.Tag is eThemeRole.Surface ? Colors.Surface : Root.Parent?.BackColor ?? Colors.Background;
        switch (Root)
        {
            case Button Button:
                if (Button.Name == ToggleButtonName) Button.Text = IsDark ? "☀ 日间" : "☾ 夜间";
                bool Primary = Button.Tag is eThemeRole.Primary;
                Button.BackColor = Primary ? Colors.Accent : Colors.Surface;
                Button.ForeColor = Primary ? Color.White : Colors.Text;
                Button.FlatAppearance.BorderColor = Colors.Border;
                break;
            case TextBoxBase Text:
                Text.BackColor = Text.ReadOnly ? Colors.Surface : Colors.Input;
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
                List.BackColor = Colors.Surface;
                break;
            case DataGridView Grid:
                Grid.EnableHeadersVisualStyles = false;
                Grid.BackgroundColor = Colors.Surface;
                Grid.GridColor = Colors.Border;
                Grid.DefaultCellStyle.BackColor = Colors.Surface;
                Grid.DefaultCellStyle.ForeColor = Colors.Text;
                Grid.DefaultCellStyle.SelectionBackColor = Colors.Selection;
                Grid.DefaultCellStyle.SelectionForeColor = Colors.Text;
                Grid.ColumnHeadersDefaultCellStyle.BackColor = Colors.Input;
                Grid.ColumnHeadersDefaultCellStyle.ForeColor = Colors.Text;
                Grid.ColumnHeadersDefaultCellStyle.SelectionBackColor = Colors.Input;
                Grid.ColumnHeadersDefaultCellStyle.SelectionForeColor = Colors.Text;
                break;
        }
        foreach (Control Child in Root.Controls) ApplyColors(Child);
    }

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr Window, int Attribute, ref int Value, int Size);
}
