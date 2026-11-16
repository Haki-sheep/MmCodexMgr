using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;

namespace CodexInstanceManager;

internal sealed class ClaudeDesktopDialog : Form
{
    private const uint ProtocolAssociation = 0x1000;
    private const uint ProgramId = 20;
    private const string DownloadUrl = "https://claude.com/download";
    private const string InferenceSettingsUrl = "https://claude.com/docs/third-party/claude-desktop/in-app-configuration";
    private static string LegacyLauncher => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "AnthropicClaude", "claude.exe");

    internal static void OpenDesktop()
    {
        string Shortcut = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Anthropic", "Claude.lnk");
        OpenWithExplorer(File.Exists(LegacyLauncher) && File.Exists(Shortcut) ? Shortcut
            : File.Exists(LegacyLauncher) ? LegacyLauncher : "claude://claude.ai/new");
    }

    public ClaudeDesktopDialog(bool PreviewOnly)
    {
        Text = "Claude Desktop";
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = StudioFonts.Body;
        ClientSize = new Size(600, 250);
        StartPosition = FormStartPosition.CenterParent;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MinimizeBox = false;
        MaximizeBox = false;

        string ConfigPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".claude");
        var Body = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false, Padding = new Padding(22, 20, 22, 18) };
        var Status = new Label { AutoSize = true, Font = StudioFonts.Section, Margin = new Padding(0, 0, 0, 12) };
        var OpenApp = MainForm.MakeButton("打开 Claude Desktop", (_, _) => Run(OpenDesktop), true);
        var OpenCode = MainForm.MakeButton("打开本地 Code", (_, _) => Run(() => OpenWithExplorer("claude://code/new")));
        var Download = MainForm.MakeButton("官方下载", (_, _) => Open(DownloadUrl));
        var LaunchActions = new FlowLayoutPanel { AutoSize = true, WrapContents = false, Margin = new Padding(0, 0, 0, 14) };
        LaunchActions.Controls.AddRange(new Control[] { OpenApp, OpenCode, Download });
        var OpenConfig = MainForm.MakeButton("打开 Code 配置目录", (_, _) => Open(ConfigPath));
        var Setup = MainForm.MakeButton("API 接入说明", (_, _) => Open(InferenceSettingsUrl));
        var ConfigActions = new FlowLayoutPanel { AutoSize = true, WrapContents = false, Margin = new Padding(0, 0, 0, 8) };
        ConfigActions.Controls.AddRange(new Control[] { OpenConfig, Setup });
        Body.Controls.AddRange(new Control[] { Status, LaunchActions, ConfigActions, new Label
        {
            Text = "本地 Code 的规则和技能可在「Rule + Skill」中同步到所有实例",
            AutoSize = true,
            Tag = eThemeRole.Muted,
            Font = StudioFonts.Caption,
            Margin = new Padding(0)
        } });
        Controls.Add(Body);
        Activated += (_, _) =>
        {
            uint Length = 0;
            bool ProtocolAvailable = AssocQueryString(ProtocolAssociation, ProgramId, "claude", null, null, ref Length) == 1 && Length > 1;
            bool Installed = ProtocolAvailable || File.Exists(LegacyLauncher);
            Status.Text = Installed ? "已发现 Claude Desktop" : "未发现 Claude Desktop";
            OpenApp.Enabled = !PreviewOnly && Installed;
            OpenCode.Enabled = !PreviewOnly && ProtocolAvailable;
            OpenConfig.Enabled = !PreviewOnly && Directory.Exists(ConfigPath);
            Download.Enabled = Setup.Enabled = !PreviewOnly;
        };
    }

    private void Open(string Target) => Run(() => OpenTarget(Target));

    private static void OpenTarget(string Target)
    {
        using var Launch = Process.Start(new ProcessStartInfo(Target) { UseShellExecute = true });
    }

    private static void OpenWithExplorer(string Target)
    {
        const int DesktopClass = 8;
        const int NeedDispatch = 1;
        var ShellType = Type.GetTypeFromProgID("Shell.Application", throwOnError: true)!;
        object Shell = Activator.CreateInstance(ShellType)!;
        object Windows = Shell.GetType().InvokeMember("Windows", BindingFlags.InvokeMethod, null, Shell, null)!;
        object[] ArgumentList = { 0, 0, DesktopClass, 0, NeedDispatch };
        var ByRef = new ParameterModifier(ArgumentList.Length);
        ByRef[0] = ByRef[1] = ByRef[3] = true;
        // 让 Explorer 创建进程以沿用开始菜单的应用身份与 AppData
        object Desktop = Windows.GetType().InvokeMember("FindWindowSW", BindingFlags.InvokeMethod, null, Windows, ArgumentList, new[] { ByRef }, null, null)
            ?? throw new InvalidOperationException("未找到 Windows Explorer 桌面");
        object Document = Desktop.GetType().InvokeMember("Document", BindingFlags.GetProperty, null, Desktop, null)!;
        object Explorer = Document.GetType().InvokeMember("Application", BindingFlags.GetProperty, null, Document, null)!;
        Explorer.GetType().InvokeMember("ShellExecute", BindingFlags.InvokeMethod, null, Explorer, new object[] { Target, "", "", "open", 1 });
    }

    private void Run(Action Action)
    {
        try { Action(); }
        catch (Exception Error)
        {
            Program.LogError(Error);
            MessageBox.Show(this, Error.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    [DllImport("shlwapi.dll", EntryPoint = "AssocQueryStringW", CharSet = CharSet.Unicode, ExactSpelling = true)]
    private static extern int AssocQueryString(uint Flags, uint StringType, string Association, string? Extra, StringBuilder? Output, ref uint Length);
}
