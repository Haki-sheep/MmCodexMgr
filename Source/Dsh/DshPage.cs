namespace CodexInstanceManager;

public sealed class DshPage : UserControl
{
    /// <summary> 管理器设置 </summary>
    private readonly ManagerSettings Settings;
    /// <summary> 桌面数据目录覆盖值 </summary>
    private readonly TextBox HomeInput = new() { Dock = DockStyle.Fill, PlaceholderText = "自动识别数据目录 支持 DSH_HOME" };
    /// <summary> 桌面服务地址覆盖值 </summary>
    private readonly TextBox ServerInput = new() { Dock = DockStyle.Fill, PlaceholderText = "自动识别端口 支持 DSH_SERVER_URL" };
    /// <summary> 工作区选择 </summary>
    private readonly ThemeComboBox WorkspaceInput = new() { Width = 180, DropDownStyle = ComboBoxStyle.DropDownList, DisplayMember = "Name" };
    /// <summary> 桌面会话列表 </summary>
    private readonly DataGridView Grid = new();
    /// <summary> 连接和操作结果 </summary>
    private readonly Label Status = new() { AutoSize = true, Dock = DockStyle.Fill, Tag = eThemeRole.Muted };
    /// <summary> 页面生命周期 </summary>
    private readonly CancellationTokenSource Lifetime = new();
    /// <summary> 防止重复提交 </summary>
    private bool Busy;
    /// <summary> 当前分页偏移 </summary>
    private int Offset;

    #region Layout
    public DshPage(ManagerSettings Settings)
    {
        this.Settings = Settings;
        Dock = DockStyle.Fill;
        Padding = new Padding(16);
        Tag = eThemeRole.Surface;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 5 };
        Root.RowStyles.Add(new(SizeType.AutoSize));
        Root.RowStyles.Add(new(SizeType.AutoSize));
        Root.RowStyles.Add(new(SizeType.AutoSize));
        Root.RowStyles.Add(new(SizeType.Percent, 100));
        Root.RowStyles.Add(new(SizeType.AutoSize));
        Root.Controls.Add(new Label { AutoSize = true, Text = "DeepSeek Harness · 桌面后台连接", Font = new Font(Font.FontFamily, 13, FontStyle.Bold), Margin = new Padding(0, 0, 0, 12) });
        var Connection = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, ColumnCount = 3, RowCount = 2 };
        Connection.ColumnStyles.Add(new(SizeType.AutoSize));
        Connection.ColumnStyles.Add(new(SizeType.Percent, 100));
        Connection.ColumnStyles.Add(new(SizeType.AutoSize));
        Connection.Controls.Add(new Label { Text = "数据目录", AutoSize = true, Margin = new Padding(0, 6, 12, 6) }, 0, 0);
        Connection.Controls.Add(HomeInput, 1, 0);
        Connection.Controls.Add(MainForm.MakeButton("保存连接", (_, _) => Save()), 2, 0);
        Connection.Controls.Add(new Label { Text = "服务地址", AutoSize = true, Margin = new Padding(0, 6, 12, 6) }, 0, 1);
        Connection.Controls.Add(ServerInput, 1, 1);
        Root.Controls.Add(Connection);
        var Actions = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Top, WrapContents = true, Margin = new Padding(0, 10, 0, 10) };
        Actions.Controls.Add(WorkspaceInput);
        Actions.Controls.Add(MainForm.MakeButton("刷新会话", async (_, _) => await RunAsync(RefreshAsync)));
        Actions.Controls.Add(MainForm.MakeButton("新建会话", async (_, _) => await RunAsync(CreateAsync)));
        Actions.Controls.Add(MainForm.MakeButton("重命名", async (_, _) => await RunAsync(RenameAsync)));
        Actions.Controls.Add(MainForm.MakeButton("发送消息", async (_, _) => await RunAsync(ChatAsync)));
        Actions.Controls.Add(MainForm.MakeButton("上一页", async (_, _) => { Offset = Math.Max(0, Offset - RelayLimits.PageSize); await RunAsync(RefreshAsync); }));
        Actions.Controls.Add(MainForm.MakeButton("下一页", async (_, _) => { if (Grid.Rows.Count == RelayLimits.PageSize) Offset += RelayLimits.PageSize; await RunAsync(RefreshAsync); }));
        Root.Controls.Add(Actions);
        Grid.Dock = DockStyle.Fill;
        Grid.ReadOnly = true;
        Grid.AllowUserToAddRows = false;
        Grid.AllowUserToDeleteRows = false;
        Grid.RowHeadersVisible = false;
        Grid.MultiSelect = false;
        Grid.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
        Grid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
        Grid.Columns.Add("title", "会话名称");
        Grid.Columns.Add("cwd", "工作目录");
        Grid.Columns.Add("state", "状态");
        Grid.Columns[0].FillWeight = 35;
        Grid.Columns[1].FillWeight = 50;
        Grid.Columns[2].FillWeight = 15;
        Root.Controls.Add(Grid);
        Root.Controls.Add(Status);
        Controls.Add(Root);
        HomeInput.Text = Settings.Dsh.HomePath;
        ServerInput.Text = Settings.Dsh.ServerUrl;
        WorkspaceInput.SelectedIndexChanged += async (_, _) => { Offset = 0; if (!Busy) await RunAsync(RefreshAsync); };
        Status.Text = "启动 DSH 后点击刷新 空白连接配置使用自动发现 沿用桌面模型";
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

    private async Task RefreshAsync()
    {
        using var Client = await DshDesktopClient.ConnectAsync(Settings.Dsh, Lifetime.Token);
        var WorkspaceList = Client.Workspaces();
        string? Selected = (WorkspaceInput.SelectedItem as DshWorkspace)?.Id;
        WorkspaceInput.Items.Clear();
        WorkspaceInput.Items.AddRange(WorkspaceList.Cast<object>().ToArray());
        WorkspaceInput.SelectedItem = WorkspaceList.FirstOrDefault(Value => Value.Id == Selected) ?? WorkspaceList.Single(Value => Value.Default);
        var Workspace = (DshWorkspace)WorkspaceInput.SelectedItem;
        var SessionList = (await Client.SessionsAsync(Lifetime.Token)).Where(Value => !Value.Archived && Workspace.SessionIdList.Contains(Value.Id)).ToList();
        Grid.Rows.Clear();
        foreach (var Session in SessionList.Skip(Offset).Take(RelayLimits.PageSize))
        {
            int Index = Grid.Rows.Add(Session.Title, Session.Cwd, Session.Running ? "执行中" : "空闲");
            Grid.Rows[Index].Tag = Session;
        }
        Status.Text = "已连接 " + Client.Connection.Origin + " · 第 " + (Offset / RelayLimits.PageSize + 1) + " 页 · " + SessionList.Count + " 个会话";
    }

    private DshSession SelectedSession() => Grid.CurrentRow?.Tag as DshSession ?? throw new InvalidOperationException("请先选择会话");

    private async Task CreateAsync()
    {
        string? Title = Input("新建 DSH 会话", "会话名称", "");
        if (Title is null) return;
        using var Client = await DshDesktopClient.ConnectAsync(Settings.Dsh, Lifetime.Token);
        var Workspace = DshCli.ResolveWorkspace(Client.Workspaces(), (WorkspaceInput.SelectedItem as DshWorkspace)?.Id);
        string Id = "session-" + Guid.NewGuid().ToString("D");
        Status.Text = "正在创建 " + Id;
        await Client.CreateAsync(Workspace.Id, Title, Id, Lifetime.Token);
        Offset = 0;
        await RefreshAsync();
    }

    private async Task RenameAsync()
    {
        var Session = SelectedSession();
        string? Title = Input("重命名 DSH 会话", "会话名称", Session.Title);
        if (Title is null) return;
        using var Client = await DshDesktopClient.ConnectAsync(Settings.Dsh, Lifetime.Token);
        await Client.RenameAsync(Session.Id, Title, Lifetime.Token);
        await RefreshAsync();
    }

    private async Task ChatAsync()
    {
        var Session = SelectedSession();
        string? Message = Input("发送到 " + Session.Title, "消息内容", "");
        if (Message is null) return;
        using var Client = await DshDesktopClient.ConnectAsync(Settings.Dsh, Lifetime.Token);
        if ((await Client.SessionAsync(Session.Id, Lifetime.Token)).Running) throw new InvalidOperationException("会话正在执行 请等待完成");
        string RequestId = Guid.NewGuid().ToString("D");
        Status.Text = "正在发送 原请求 " + RequestId;
        await Client.PromptAsync(Session.Id, RequestId, Message, Lifetime.Token);
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Lifetime.Token);
        Timeout.CancelAfter(TimeSpan.FromMinutes(2));
        DshReply? Reply;
        try
        {
            while ((Reply = await Client.ReplyAsync(Session.Id, RequestId, Timeout.Token)) is null) await Task.Delay(1000, Timeout.Token);
        }
        catch (OperationCanceledException) when (!Lifetime.IsCancellationRequested) { Status.Text = "等待超时 原请求 " + RequestId + " 请在 DSH 桌面查看 不重复发送"; return; }
        MessageBox.Show(this, Reply.Text, Session.Title + " · " + Reply.Outcome, MessageBoxButtons.OK);
        await RefreshAsync();
    }

    private string? Input(string Title, string Label, string Initial)
    {
        using var Dialog = new Form { Text = Title, ClientSize = new Size(560, 190), StartPosition = FormStartPosition.CenterParent, Font = Font, MinimizeBox = false, MaximizeBox = false };
        var Body = new TextBox { Text = Initial, Multiline = true, Dock = DockStyle.Fill, MaxLength = Label == "会话名称" ? 120 : RelayLimits.MaxTextLength };
        var Buttons = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 44, FlowDirection = FlowDirection.RightToLeft };
        var Confirm = new Button { Text = "确定", DialogResult = DialogResult.OK, AutoSize = true };
        Buttons.Controls.Add(Confirm);
        Buttons.Controls.Add(new Button { Text = "取消", DialogResult = DialogResult.Cancel, AutoSize = true });
        Dialog.Controls.Add(Body);
        Dialog.Controls.Add(new Label { Text = Label, AutoSize = true, Dock = DockStyle.Top });
        Dialog.Controls.Add(Buttons);
        Dialog.AcceptButton = Confirm;
        return Dialog.ShowDialog(this) == DialogResult.OK && !string.IsNullOrWhiteSpace(Body.Text) ? Body.Text.Trim() : null;
    }
    #endregion
}
