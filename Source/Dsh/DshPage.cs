namespace CodexInstanceManager;

/// <summary>
/// DeepSeek Harness 桌面后台连接配置 会话由编队或 CLI 调度 本页不列出会话
/// </summary>
public sealed class DshPage : UserControl
{
    /// <summary> 管理器设置 </summary>
    private readonly ManagerSettings Settings;
    /// <summary> 预览模式禁止写入配置 </summary>
    private readonly bool PreviewOnly;
    /// <summary> 桌面数据目录覆盖值 </summary>
    private readonly TextBox HomeInput = new() { Dock = DockStyle.Fill, PlaceholderText = "自动识别数据目录 支持 DSH_HOME", Margin = new Padding(0, 5, 0, 7) };
    /// <summary> 桌面服务地址覆盖值 </summary>
    private readonly TextBox ServerInput = new() { Dock = DockStyle.Fill, PlaceholderText = "自动识别端口 支持 DSH_SERVER_URL", Margin = new Padding(0, 5, 0, 7) };
    /// <summary> 连接和操作结果 </summary>
    private readonly StudioWrapLabel Status = new() { Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 10, 0, 0) };
    /// <summary> 页面生命周期 </summary>
    private readonly CancellationTokenSource Lifetime = new();
    /// <summary> 防止重复提交 </summary>
    private bool Busy;

    #region Layout
    public DshPage(ManagerSettings Settings, bool PreviewOnly = false)
    {
        SuspendLayout();
        this.Settings = Settings;
        this.PreviewOnly = PreviewOnly;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = StudioFonts.Body;
        Dock = DockStyle.Fill;
        Tag = eThemeRole.Background;
        var Scroll = new WheelScrollPanel { Dock = DockStyle.Fill, AutoScroll = true };
        var Column = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Padding = new Padding(0, 0, 6, 0) };
        Column.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        var Card = StudioCard.Create("DeepSeek Harness", "桌面后台连接  ·  空白连接配置使用自动发现  ·  执行沿用 DSH 桌面会话模型", out var Body);
        var Connection = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 2, Margin = Padding.Empty };
        Connection.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 92));
        Connection.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Connection.Controls.Add(new Label { Text = "数据目录", AutoSize = true, Tag = eThemeRole.Muted, Margin = new Padding(0, 10, 8, 0) }, 0, 0);
        Connection.Controls.Add(HomeInput, 1, 0);
        Connection.Controls.Add(new Label { Text = "服务地址", AutoSize = true, Tag = eThemeRole.Muted, Margin = new Padding(0, 10, 8, 0) }, 0, 1);
        Connection.Controls.Add(ServerInput, 1, 1);
        Body.Controls.Add(Connection);
        var Actions = new FlowLayoutPanel { AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Dock = DockStyle.Top, WrapContents = true, Margin = new Padding(0, 8, 0, 0) };
        Actions.Controls.Add(MainForm.MakeButton("保存连接", (_, _) => Save(), true));
        Actions.Controls.Add(MainForm.MakeButton("检查连接", async (_, _) => await RunAsync(CheckAsync)));
        Body.Controls.Add(Actions);
        Body.Controls.Add(Status);
        Column.Controls.Add(Card);
        Scroll.Controls.Add(Column);
        Controls.Add(Scroll);
        HomeInput.Text = Settings.Dsh.HomePath;
        ServerInput.Text = Settings.Dsh.ServerUrl;
        Status.Text = "启动 DSH 后点击检查连接 空白连接配置使用自动发现 沿用桌面模型";
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) { Lifetime.Cancel(); Lifetime.Dispose(); }
        base.Dispose(Disposing);
    }
    #endregion

    #region Actions
    private void Save()
    {
        try
        {
            if (PreviewOnly) throw new InvalidOperationException("预览模式不保存 DSH 连接");
            string Server = ServerInput.Text.Trim();
            if (Server.Length != 0) Server = DshDiscovery.ValidateOrigin(Server).AbsoluteUri;
            Settings.Dsh = new() { HomePath = HomeInput.Text.Trim().Length == 0 ? "" : ManagerPaths.Normalize(HomeInput.Text.Trim()), ServerUrl = Server };
            SettingsStore.Save(Settings);
            Status.Text = "已保存 后续连接使用新配置 留空恢复自动发现";
        }
        catch (Exception Error) { Program.LogError(Error); Status.Text = Error.Message; }
    }

    private async Task RunAsync(Func<Task> Action)
    {
        if (Busy) return;
        Busy = true;
        try { await Action(); }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested) { }
        catch (Exception Error) { Program.LogError(Error); if (!IsDisposed) Status.Text = Error.Message; }
        finally { Busy = false; }
    }

    private async Task CheckAsync()
    {
        Status.Text = "正在连接 DSH 桌面后台…";
        using var Client = await DshDesktopClient.ConnectAsync(Settings.Dsh, Lifetime.Token);
        var WorkspaceList = Client.Workspaces();
        var Default = WorkspaceList.FirstOrDefault(Value => Value.Default);
        if (!IsDisposed) Status.Text = "已连接 " + Client.Connection.Origin + "  ·  " + WorkspaceList.Count + " 个工作区" + (Default is null ? "" : "  ·  默认 " + Default.Name);
    }
    #endregion
}
