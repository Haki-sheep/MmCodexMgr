namespace CodexInstanceManager;

public sealed class CollaborationPage : UserControl
{
    /// <summary> 协作来源导航 </summary>
    private readonly ThemeTabControl SourceTabs;
    /// <summary> Cursor 来源页 </summary>
    private readonly NavigationPage CursorPage = new("Cursor");
    /// <summary> 当前实例与协作配置 </summary>
    private readonly ManagerSettings Settings;
    /// <summary> 页面外观 </summary>
    private readonly AppTheme Theme;
    /// <summary> Codex 来源会话与实例选择 </summary>
    private readonly CodexSessionsPage CodexSessions;
    /// <summary> 通道操作结果 </summary>
    private readonly Label Status = new() { AutoSize = true, Dock = DockStyle.Fill, Tag = eThemeRole.Muted };

    public CollaborationPage(ManagerSettings Settings, RelayCoordinator Coordinator, AppTheme Theme, Action ToggleTheme, Action ShowBoard)
    {
        SuspendLayout();
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        this.Settings = Settings;
        this.Theme = Theme;
        Dock = DockStyle.Fill;
        Padding = new Padding(24, 16, 24, 16);
        Tag = eThemeRole.Background;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3 };
        Root.RowStyles.Add(new(SizeType.Absolute, 52));
        Root.RowStyles.Add(new(SizeType.Percent, 100));
        Root.RowStyles.Add(new(SizeType.AutoSize));
        var Header = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 4 };
        Header.ColumnStyles.Add(new(SizeType.Percent, 100));
        for (int Index = 0; Index < 3; Index++) Header.ColumnStyles.Add(new(SizeType.AutoSize));
        Header.Controls.Add(new Label { Text = "跨 Agent 协作", Font = new Font(Font.FontFamily, 17, FontStyle.Bold), AutoSize = true });
        Header.Controls.Add(MainForm.MakeButton("任务看板", (_, _) => ShowBoard()));
        Header.Controls.Add(MainForm.MakeButton("健康检查", (_, _) => ShowDoctor()));
        var ThemeButton = MainForm.MakeButton(Theme.IsDark ? "☀ 日间" : "☾ 夜间", (_, _) => ToggleTheme());
        ThemeButton.Name = AppTheme.ToggleButtonName;
        Header.Controls.Add(ThemeButton);
        Root.Controls.Add(Header);
        SourceTabs = new() { Dock = DockStyle.Fill, Theme = Theme, Name = "CollaborationSources", ShowBrand = false };
        var CodexPage = new NavigationPage("Codex");
        var CodexBody = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Padding = new Padding(0, 8, 0, 0) };
        CodexBody.RowStyles.Add(new(SizeType.Absolute, 178));
        CodexBody.RowStyles.Add(new(SizeType.Percent, 100));
        CodexBody.Controls.Add(new RelayChannelEditor(Settings, Coordinator, Text => Status.Text = Text) { Dock = DockStyle.Fill, Tag = eThemeRole.Surface });
        CodexSessions = new(Settings);
        CodexBody.Controls.Add(CodexSessions);
        CodexPage.Controls.Add(CodexBody);
        CursorPage.Controls.Add(new HarnessPage(Settings, Coordinator.Cursor, Theme, ToggleTheme, true));
        var DshPage = new NavigationPage("DSH");
        var DshBody = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, Padding = new Padding(20), Tag = eThemeRole.Surface };
        DshBody.Controls.Add(new Label { Text = "DeepSeek Harness", Font = new Font(Font.FontFamily, 13, FontStyle.Bold), AutoSize = true });
        DshBody.Controls.Add(new Label { Text = "尚未接入 · 后续在此管理 DSH 会话与连接设置", AutoSize = true, Tag = eThemeRole.Muted });
        DshPage.Controls.Add(DshBody);
        SourceTabs.TabPages.Add(CodexPage);
        SourceTabs.TabPages.Add(CursorPage);
        SourceTabs.TabPages.Add(DshPage);
        Root.Controls.Add(SourceTabs);
        Root.Controls.Add(Status);
        Controls.Add(Root);
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    public void ShowCursor() => SourceTabs.SelectedTab = CursorPage;

    private void ShowDoctor()
    {
        string InstanceId = SourceTabs.SelectedTab == CursorPage ? CursorRelayRunner.InstanceId : CodexSessions.SelectedInstance?.Id ?? Settings.SelectedId;
        if (SourceTabs.SelectedTab?.Text == "DSH") { Status.Text = "DSH 尚未接入"; return; }
        using var Dialog = new Form { Text = "健康检查 · " + AgentDisplay.Instance(Settings, InstanceId, InstanceId), Font = Font, ClientSize = new Size(760, 420), StartPosition = FormStartPosition.CenterParent };
        using var Cancellation = new CancellationTokenSource();
        var Body = new TextBox { Dock = DockStyle.Fill, Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Vertical, Text = "正在检查 CLI MCP Skill 路径与桌面桥接…" };
        Dialog.Controls.Add(Body);
        Dialog.Shown += async (_, _) =>
        {
            try
            {
                var Report = await AgentDoctor.RunAsync(Settings, AgentCliDeployment.LoadPath(), InstanceId, Cancellation.Token);
                if (!Dialog.IsDisposed) { Body.Text = string.Join("\r\n\r\n", Report.CheckList.Select(Check => (Check.Passed ? "✓ " : "× ") + Check.Name + "\r\n" + Check.Detail)); Body.Select(0, 0); }
            }
            catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { }
            catch (Exception Error) { Program.LogError(Error); if (!Dialog.IsDisposed) Body.Text = Error.Message; }
        };
        Dialog.FormClosed += (_, _) => Cancellation.Cancel();
        Theme.Apply(Dialog);
        Dialog.HandleCreated += (_, _) => Theme.ApplyTitleBar(Dialog);
        Dialog.ShowDialog(this);
    }
}
