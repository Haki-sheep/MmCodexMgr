namespace CodexInstanceManager;

public sealed class HarnessPage : UserControl
{
    private readonly ManagerSettings Settings;
    private readonly CursorRelayRunner? CursorRunner;
    private readonly AppTheme Theme;
    private readonly TextBox CliInput = new() { PlaceholderText = "留空自动查找 cursor-agent" };
    private readonly TextBox DirectoryInput = new() { PlaceholderText = "新建联调会话的默认工作目录" };
    private readonly TextBox ModelInput = new() { PlaceholderText = "留空沿用 Cursor 默认模型" };
    private readonly CheckBox AutoOpenLog = new() { Text = "任务开始时自动弹出日志窗口", AutoSize = true };
    private readonly Label Status = new() { AutoSize = true, Dock = DockStyle.Fill, Tag = eThemeRole.Muted };
    private readonly DataGridView SessionGrid = new();
    private readonly Label PageLabel = new() { AutoSize = true, Margin = new Padding(8, 10, 8, 0) };
    private readonly CancellationTokenSource Lifetime = new();
    private List<CursorSession> SessionList = new();
    private int Offset;
    private bool Busy;

    #region Layout
    public HarnessPage(ManagerSettings Settings, CursorRelayRunner? Cursor, AppTheme Theme, Action ToggleTheme)
    {
        SuspendLayout();
        this.Settings = Settings;
        CursorRunner = Cursor;
        this.Theme = Theme;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Dock = DockStyle.Fill;
        Padding = new Padding(24, 16, 24, 16);
        Tag = eThemeRole.Background;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 4 };
        Root.RowStyles.Add(new(SizeType.AutoSize));
        Root.RowStyles.Add(new(SizeType.AutoSize));
        Root.RowStyles.Add(new(SizeType.Percent, 100));
        Root.RowStyles.Add(new(SizeType.AutoSize));
        var Header = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, ColumnCount = 2, Margin = Padding.Empty };
        Header.ColumnStyles.Add(new(SizeType.Percent, 100));
        Header.ColumnStyles.Add(new(SizeType.AutoSize));
        Header.Controls.Add(new Label { Text = "跨 Harness 协作", Font = new Font(Font.FontFamily, 17, FontStyle.Bold), AutoSize = true });
        var ThemeButton = MainForm.MakeButton(Theme.IsDark ? "☀ 日间" : "☾ 夜间", (_, _) => ToggleTheme());
        ThemeButton.Name = AppTheme.ToggleButtonName;
        Header.Controls.Add(ThemeButton);
        Root.Controls.Add(Header);
        var Card = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, ColumnCount = 1, Padding = new Padding(16), Tag = eThemeRole.Surface };
        Card.Controls.Add(new Label { Text = "Cursor CLI", Font = new Font(Font.FontFamily, 13, FontStyle.Bold), AutoSize = true });
        Card.Controls.Add(new Label { Text = "Codex 派发任务 · Cursor 独立执行 · 结果回传原主会话验收", AutoSize = true, Tag = eThemeRole.Muted, Margin = new Padding(0, 6, 0, 14) });
        var Fields = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, ColumnCount = 3 };
        Fields.ColumnStyles.Add(new(SizeType.Absolute, 110));
        Fields.ColumnStyles.Add(new(SizeType.Percent, 100));
        Fields.ColumnStyles.Add(new(SizeType.AutoSize));
        AddField(Fields, "CLI 路径", CliInput, 0);
        Fields.Controls.Add(MainForm.MakeButton("选择文件", (_, _) => SelectCli()), 2, 0);
        AddField(Fields, "工作目录", DirectoryInput, 1);
        Fields.Controls.Add(MainForm.MakeButton("选择目录", (_, _) => SelectDirectory()), 2, 1);
        AddField(Fields, "默认模型", ModelInput, 2);
        Fields.Controls.Add(new Label { Text = "执行跟踪", AutoSize = true, Margin = new Padding(0, 7, 0, 8) }, 0, 3);
        Fields.Controls.Add(AutoOpenLog, 1, 3);
        Card.Controls.Add(Fields);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, WrapContents = true, Margin = new Padding(0, 10, 0, 0) };
        Actions.Controls.Add(MainForm.MakeButton("保存设置", (_, _) => Run(Save), true));
        Actions.Controls.Add(MainForm.MakeButton("检查连接", async (_, _) => await RunAsync(CheckAsync)));
        Actions.Controls.Add(MainForm.MakeButton("登录账号", (_, _) => Run(() => OpenTerminal(true))));
        Actions.Controls.Add(MainForm.MakeButton("启动 Cursor CLI", (_, _) => Run(() => OpenTerminal(false))));
        Actions.Controls.Add(MainForm.MakeButton("打开日志目录", (_, _) => Run(() => (CursorRunner ?? throw new InvalidOperationException("Cursor 执行端未启用")).Logs.OpenDirectory())));
        Card.Controls.Add(Actions);
        Card.Controls.Add(new Label { Text = "在 Codex 中指定让 Cursor 执行任务即可联调 已有会话保留其工作目录和模型", AutoSize = true, Tag = eThemeRole.Muted, Margin = new Padding(0, 10, 0, 0) });
        Root.Controls.Add(Card);
        var SessionCard = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Padding = new Padding(16), Margin = new Padding(0, 12, 0, 12), Tag = eThemeRole.Surface };
        SessionCard.RowStyles.Add(new(SizeType.AutoSize));
        SessionCard.RowStyles.Add(new(SizeType.Percent, 100));
        SessionCard.RowStyles.Add(new(SizeType.AutoSize));
        SessionCard.Controls.Add(new Label { Text = "管理器登记的 Cursor 会话", Font = new Font(Font.FontFamily, 11, FontStyle.Bold), AutoSize = true });
        SessionGrid.Dock = DockStyle.Fill;
        SessionGrid.ReadOnly = true;
        SessionGrid.AllowUserToAddRows = false;
        SessionGrid.AllowUserToDeleteRows = false;
        SessionGrid.AllowUserToResizeRows = false;
        SessionGrid.RowHeadersVisible = false;
        SessionGrid.MultiSelect = false;
        SessionGrid.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
        SessionGrid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
        SessionGrid.BorderStyle = BorderStyle.None;
        SessionGrid.RowTemplate.Height = 36;
        SessionGrid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "会话名称", FillWeight = 27, MinimumWidth = 120 });
        SessionGrid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "工作目录", FillWeight = 45, MinimumWidth = 180 });
        SessionGrid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "模型", FillWeight = 18, MinimumWidth = 85 });
        SessionGrid.Columns.Add(new DataGridViewButtonColumn { HeaderText = "执行日志", FillWeight = 12, MinimumWidth = 85, FlatStyle = FlatStyle.Flat });
        SessionGrid.Columns.Add(new DataGridViewButtonColumn { HeaderText = "会话", FillWeight = 10, MinimumWidth = 70, FlatStyle = FlatStyle.Flat });
        SessionGrid.CellContentClick += async (_, Event) =>
        {
            if (Event.RowIndex < 0) return;
            if (Event.ColumnIndex == 3) Run(() => CursorRunner!.OpenSessionLog(SessionList[Event.RowIndex].Id));
            else if (Event.ColumnIndex == 4) await RunAsync(() => CursorRunner!.OpenAsync(SessionList[Event.RowIndex].Id, Lifetime.Token));
        };
        SessionGrid.CellToolTipTextNeeded += (_, Event) => { if (Event.RowIndex >= 0 && Event.RowIndex < SessionList.Count) Event.ToolTipText = SessionList[Event.RowIndex].Id + "\n" + SessionList[Event.RowIndex].Cwd; };
        SessionCard.Controls.Add(SessionGrid);
        var Pages = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true, WrapContents = false };
        Pages.Controls.Add(MainForm.MakeButton("刷新会话", (_, _) => Run(RefreshSessions)));
        Pages.Controls.Add(MainForm.MakeButton("上一页", (_, _) => Run(() => { Offset = Math.Max(0, Offset - RelayLimits.PageSize); RefreshSessions(); })));
        Pages.Controls.Add(PageLabel);
        Pages.Controls.Add(MainForm.MakeButton("下一页", (_, _) => Run(() => { if (SessionList.Count == RelayLimits.PageSize) { Offset += RelayLimits.PageSize; RefreshSessions(); } })));
        SessionCard.Controls.Add(Pages);
        Root.Controls.Add(SessionCard);
        Root.Controls.Add(Status);
        Controls.Add(Root);
        CliInput.Text = Settings.Cursor.CliPath;
        DirectoryInput.Text = Settings.Cursor.WorkingDirectory;
        ModelInput.Text = Settings.Cursor.Model;
        AutoOpenLog.Checked = Settings.Cursor.ShowExecutionWindow;
        RefreshSessions();
        Status.Text = CursorRunner is null ? "当前管理器未启用 Cursor 执行端" : "Cursor 执行端已启用 · 请检查连接确认 CLI 与账号状态";
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    private static void AddField(TableLayoutPanel Fields, string Label, TextBox Input, int Row)
    {
        Fields.Controls.Add(new Label { Text = Label, AutoSize = true, Margin = new Padding(0, 7, 0, 8) }, 0, Row);
        Input.Dock = DockStyle.Fill;
        Input.Margin = new Padding(0, 4, 10, 8);
        Fields.Controls.Add(Input, 1, Row);
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Lifetime.Cancel();
        base.Dispose(Disposing);
    }
    #endregion

    #region Actions
    private void Save()
    {
        string CliPath = CliInput.Text.Trim();
        string Cwd = DirectoryInput.Text.Trim();
        if (CliPath.Length != 0) CursorCli.ResolvePath(CliPath);
        if (Cwd.Length != 0 && (!Path.IsPathFullyQualified(Cwd) || !Directory.Exists(Cwd))) throw new DirectoryNotFoundException("工作目录必须是存在的绝对路径");
        Settings.Cursor = new() { CliPath = CliPath, WorkingDirectory = Cwd, Model = ModelInput.Text.Trim(), ShowExecutionWindow = AutoOpenLog.Checked };
        SettingsStore.Save(Settings);
        Status.Text = "Cursor 设置已保存 新建联调会话立即使用 已有会话保持原设置";
    }

    private async Task CheckAsync()
    {
        Save();
        Status.Text = "正在检查 Cursor CLI 版本与账号登录…";
        var Report = await AgentDoctor.RunAsync(Settings, AgentCliDeployment.LoadPath(), CursorRelayRunner.InstanceId, Lifetime.Token);
        if (!IsDisposed) Status.Text = string.Join("\n", Report.CheckList.Select(Item => (Item.Passed ? "✓ " : "× ") + Item.Name + " · " + Item.Detail));
    }

    private void OpenTerminal(bool Login)
    {
        Save();
        string CliPath = CursorCli.ResolvePath(Settings.Cursor.CliPath.Length == 0 ? null : Settings.Cursor.CliPath);
        string Cwd = Settings.Cursor.WorkingDirectory.Length == 0 ? Environment.GetFolderPath(Environment.SpecialFolder.UserProfile) : Settings.Cursor.WorkingDirectory;
        var ArgumentList = new List<string>();
        if (Login) ArgumentList.Add("login");
        else if (Settings.Cursor.Model.Length != 0) ArgumentList.AddRange(new[] { "--model", Settings.Cursor.Model });
        CursorCli.OpenTerminal(CliPath, Cwd, ArgumentList);
        Status.Text = Login ? "已打开 Cursor 登录终端 请在官方页面完成账号认证" : "已打开 Cursor CLI 交互终端";
    }

    private void SelectCli()
    {
        using var Dialog = new OpenFileDialog { Filter = "Cursor CLI|cursor-agent.cmd;cursor-agent.ps1;cursor-agent.exe|所有文件|*.*", Title = "选择 Cursor CLI" };
        if (Dialog.ShowDialog(this) == DialogResult.OK) CliInput.Text = Dialog.FileName;
    }

    private void SelectDirectory()
    {
        using var Dialog = new FolderBrowserDialog { Description = "选择 Cursor 默认工作目录", UseDescriptionForTitle = true };
        if (Dialog.ShowDialog(this) == DialogResult.OK) DirectoryInput.Text = Dialog.SelectedPath;
    }

    private void RefreshSessions()
    {
        SessionList = CursorRunner?.List(null, Offset) ?? new();
        SessionGrid.Rows.Clear();
        foreach (var Item in SessionList) SessionGrid.Rows.Add(Item.Title, Item.Cwd, Item.Model.Length == 0 ? "默认" : Item.Model, "查看日志", CursorRunner!.IsRunning(Item.Id) ? "执行中" : "打开");
        PageLabel.Text = "第 " + (Offset / RelayLimits.PageSize + 1) + " 页";
    }

    private void Run(Action Action)
    {
        try { Action(); }
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
    #endregion
}
