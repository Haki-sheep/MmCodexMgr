using System.Diagnostics;
using System.Reflection;

namespace CodexInstanceManager;

public sealed class ManagerSettingsPage : UserControl
{
    /// <summary> 当前用户的管理器启动登记 </summary>
    private readonly StartupRegistration Startup;
    /// <summary> 注册表更新失败时恢复实际状态 </summary>
    private bool Restoring;
    /// <summary> 当前用户的开机自启开关 </summary>
    private readonly CheckBox AutoStartInput = new() { Name = "ManagerAutoStart", Text = "开机自动启动 AIMoreMoreWork", AutoSize = true };
    /// <summary> 开关应用后的实际结果 </summary>
    private readonly Label StatusLabel = new() { AutoSize = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption };
    private readonly StudioButton LightButton = new() { Text = "☀  浅色" };
    private readonly StudioButton DarkButton = new() { Text = "☾  深色" };

    public ManagerSettingsPage(bool PreviewOnly = false, StartupRegistration? Startup = null, Action<bool>? SetDarkMode = null, Func<bool>? IsDark = null, Func<AgentIconSettings, Task>? ApplyIcons = null)
    {
        SuspendLayout();
        this.Startup = Startup ?? new StartupRegistration(Environment.ProcessPath!);
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = StudioFonts.Body;
        Dock = DockStyle.Fill;
        Padding = new Padding(28, 22, 28, 16);
        Tag = eThemeRole.Background;
        var Scroll = new WheelScrollPanel { Dock = DockStyle.Fill, AutoScroll = true };
        var Column = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Padding = new Padding(0, 0, 6, 0) };
        Column.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Column.Controls.Add(new Label { Text = "设置", Font = StudioFonts.Title, AutoSize = true, Tag = eThemeRole.Title, Margin = new Padding(0, 0, 0, 2) });
        Column.Controls.Add(new Label { Text = "外观 启动与应用信息", Font = StudioFonts.Caption, AutoSize = true, Tag = eThemeRole.Muted, Margin = new Padding(0, 0, 0, 16) });

        if (SetDarkMode is not null && IsDark is not null)
        {
            var Appearance = StudioCard.Create("外观", "浅色优先 深色适合夜间  ·  切换立即生效并保存", out var AppearanceBody);
            var Modes = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = false, Margin = Padding.Empty };
            void SelectMode(bool Dark)
            {
                LightButton.Kind = Dark ? eButtonKind.Secondary : eButtonKind.Primary;
                DarkButton.Kind = Dark ? eButtonKind.Primary : eButtonKind.Secondary;
            }
            LightButton.Click += (_, _) => { SelectMode(false); SetDarkMode(false); };
            DarkButton.Click += (_, _) => { SelectMode(true); SetDarkMode(true); };
            SelectMode(IsDark());
            Modes.Controls.Add(LightButton);
            Modes.Controls.Add(DarkButton);
            AppearanceBody.Controls.Add(Modes);
            Column.Controls.Add(Appearance);
        }

        if (ApplyIcons is not null) Column.Controls.Add(new AgentIconSettingsCard(PreviewOnly, ApplyIcons));
        var StartupCard = StudioCard.Create("启动", "登录 Windows 后在系统托盘后台运行，可双击托盘图标打开。", out var StartupBody);
        AutoStartInput.Checked = !PreviewOnly && this.Startup.IsEnabled;
        AutoStartInput.Enabled = !PreviewOnly;
        AutoStartInput.Margin = new Padding(0, 0, 0, 6);
        StartupBody.Controls.Add(AutoStartInput);
        StartupBody.Controls.Add(StatusLabel);
        Column.Controls.Add(StartupCard);

        var About = StudioCard.Create("关于", "AIMoreMoreWork  ·  版本 " + (Assembly.GetEntryAssembly()?.GetName().Version?.ToString(3) ?? "未知") + "  ·  沿用原实例配置与数据目录", out var AboutBody);
        AboutBody.Controls.Add(new Label { Text = ManagerPaths.Root, AutoSize = false, AutoEllipsis = true, Dock = DockStyle.Fill, Height = 24, Font = StudioFonts.Mono, Margin = new Padding(0, 0, 0, 6) });
        var AboutActions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Margin = Padding.Empty };
        AboutActions.Controls.Add(MainForm.MakeButton("打开数据目录", (_, _) => OpenDataFolder()));
        AboutBody.Controls.Add(AboutActions);
        Column.Controls.Add(About);

        Scroll.Controls.Add(Column);
        Controls.Add(Scroll);
        if (!PreviewOnly) AutoStartInput.CheckedChanged += UpdateAutoStart;
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    private void OpenDataFolder()
    {
        try
        {
            if (!Directory.Exists(ManagerPaths.Root)) throw new DirectoryNotFoundException("数据目录尚不存在 " + ManagerPaths.Root);
            using var Explorer = Process.Start(new ProcessStartInfo("explorer.exe") { Arguments = "\"" + ManagerPaths.Root + "\"", UseShellExecute = true });
        }
        catch (Exception Error) { Program.LogError(Error); StatusLabel.Text = Error.Message; }
    }

    private void UpdateAutoStart(object? Sender, EventArgs Event)
    {
        if (Restoring) return;
        try
        {
            Startup.SetEnabled(AutoStartInput.Checked);
            StatusLabel.Text = AutoStartInput.Checked ? "已开启开机自启" : "已关闭开机自启";
        }
        catch (Exception Error)
        {
            Restoring = true;
            try { AutoStartInput.Checked = !AutoStartInput.Checked; }
            finally { Restoring = false; }
            Program.LogError(Error);
            StatusLabel.Text = "开机自启设置失败 " + Error.Message;
            MessageBox.Show(FindForm(), Error.Message, "开机自启设置失败", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
