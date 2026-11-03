namespace CodexInstanceManager;

public sealed class ManagerSettingsPage : UserControl
{
    /// <summary> 当前用户的管理器启动登记 </summary>
    private readonly StartupRegistration Startup;
    /// <summary> 注册表更新失败时恢复实际状态 </summary>
    private bool Restoring;
    /// <summary> 当前用户的开机自启开关 </summary>
    private readonly CheckBox AutoStartInput = new() { Name = "ManagerAutoStart", Text = "开机自动启动实例管理器", AutoSize = true };
    /// <summary> 开关应用后的实际结果 </summary>
    private readonly Label StatusLabel = new() { AutoSize = true, ForeColor = Color.DimGray };

    public ManagerSettingsPage(bool PreviewOnly = false, StartupRegistration? Startup = null)
    {
        this.Startup = Startup ?? new StartupRegistration(Environment.ProcessPath!);
        Dock = DockStyle.Fill;
        Padding = new Padding(24);
        var Body = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false, AutoScroll = true };
        Body.Controls.Add(new Label { Text = "管理器设置", Font = new Font("Microsoft YaHei UI", 20, FontStyle.Bold), AutoSize = true, Margin = new Padding(0, 0, 0, 22) });
        AutoStartInput.Checked = !PreviewOnly && this.Startup.IsEnabled;
        AutoStartInput.Enabled = !PreviewOnly;
        AutoStartInput.Margin = new Padding(0, 0, 0, 10);
        Body.Controls.Add(AutoStartInput);
        Body.Controls.Add(new Label { Text = "登录 Windows 后在系统托盘后台运行，可双击托盘图标打开。", AutoSize = true, ForeColor = Color.DimGray, Margin = new Padding(0, 0, 0, 12) });
        Body.Controls.Add(StatusLabel);
        Controls.Add(Body);
        if (!PreviewOnly) AutoStartInput.CheckedChanged += UpdateAutoStart;
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
            MessageBox.Show(this, Error.Message, "开机自启设置失败", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
