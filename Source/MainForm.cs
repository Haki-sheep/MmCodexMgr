using System.Diagnostics;

namespace CodexInstanceManager;

public sealed class MainForm : Form
{
    private readonly ManagerSettings Settings;
    private readonly ListBox InstanceList = new();
    private readonly TextBox NameInput = new();
    private readonly TextBox BadgeInput = new();
    private readonly TextBox HomeInput = new();
    private readonly TextBox DataInput = new();
    private readonly PictureBox IconPreview = new();
    private readonly Label StatusLabel = new();
    private readonly Label CcLabel = new();
    private readonly Button ColorButton = new();
    private readonly Button SyncButton = new();
    private readonly Button ConversationButton = new();
    private readonly NotifyIcon TrayIcon = new();
    private readonly BrandingService Branding = new();
    private readonly System.Windows.Forms.Timer RefreshDelay = new() { Interval = 150 };
    private readonly InstanceActivityMonitor ActivityMonitor = new();
    private readonly ThemeTabControl MainTabs = new() { Dock = DockStyle.Fill };
    private readonly TabPage RelayTab = new("跨Agent管理");
    private readonly Button ThemeButton = new();
    private readonly AppTheme Theme;
    private readonly bool PreviewOnly;
    private readonly RelayStore? TaskStore;
    private readonly RelayCoordinator? TaskCoordinator;
    private List<RunningInstance> RunningList = new();
    private bool Polling;
    private bool RefreshAgain;
    private bool AllowExit;
    private bool CleaningConversations;
    private string CurrentColor = "#6470EE";
    private string CurrentIcon = "";
    private static readonly Color AccentColor = Color.FromArgb(79, 86, 219);
    public InstanceProfile? Selected => InstanceList.SelectedItem as InstanceProfile;

    #region Layout
    public MainForm(ManagerSettings Settings, bool PreviewOnly = false, RelayStore? TaskStore = null, RelayCoordinator? TaskCoordinator = null)
    {
        SuspendLayout();
        this.Settings = Settings;
        this.PreviewOnly = PreviewOnly;
        Theme = new AppTheme(Settings.DarkMode);
        MainTabs.Theme = Theme;
        this.TaskStore = TaskStore;
        this.TaskCoordinator = TaskCoordinator;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Text = "Codex 实例管理器";
        Font = new Font("Microsoft YaHei UI", 10);
        BackColor = Color.FromArgb(245, 247, 251);
        ClientSize = new Size(1080, 860);
        MinimumSize = new Size(980, 700);
        StartPosition = FormStartPosition.CenterScreen;
        using var BadgeImage = BrandingService.DrawBadge(new InstanceProfile { Badge = "C", ColorHex = "#4F56DB" }, 64);
        IntPtr IconHandle = BadgeImage.GetHicon();
        Icon = (Icon)Icon.FromHandle(IconHandle).Clone();
        NativeDestroyIcon(IconHandle);

        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 3, Padding = new Padding(24) };
        Root.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 260));
        Root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 76));
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 32));
        var InstancesTab = new TabPage("实例管理") { BackColor = BackColor };
        InstancesTab.Controls.Add(Root);
        MainTabs.TabPages.Add(InstancesTab);
        MainTabs.TabPages.Add(RelayTab);
        MainTabs.SelectedIndexChanged += (_, _) => { if (MainTabs.SelectedTab == RelayTab) BuildRelayPage(); };
        Controls.Add(MainTabs);
        StyleButton(ThemeButton, false);
        ThemeButton.Name = AppTheme.ToggleButtonName;
        ThemeButton.Click += (_, _) => SafeAction(ToggleTheme);
        HandleCreated += (_, _) => Theme.ApplyTitleBar(this);

        var Header = new Panel { Dock = DockStyle.Fill };
        Header.Controls.Add(ThemeButton);
        Header.Layout += (_, _) => PositionThemeButton();
        Header.Controls.Add(new Label { Text = "Codex 实例管理器", Font = new Font(Font.FontFamily, 23, FontStyle.Bold), AutoSize = true, Location = new Point(0, 0) });
        Header.Controls.Add(new Label { Text = "独立配置 · 一键启动 · 同步工具", ForeColor = Color.DimGray, AutoSize = true, Location = new Point(3, 43) });
        Root.Controls.Add(Header, 0, 0);
        Root.SetColumnSpan(Header, 2);

        var Left = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 3, ColumnCount = 1, Margin = new Padding(0, 0, 18, 0) };
        Left.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));
        Left.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Left.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));
        Left.Controls.Add(MakeButton("＋ 新建实例", (_, _) => AddInstance(), true), 0, 0);
        InstanceList.Dock = DockStyle.Fill;
        InstanceList.BorderStyle = BorderStyle.None;
        InstanceList.BackColor = Color.White;
        InstanceList.DrawMode = DrawMode.OwnerDrawFixed;
        InstanceList.ItemHeight = 82;
        InstanceList.DrawItem += DrawInstance;
        InstanceList.SelectedIndexChanged += (_, _) => LoadSelected();
        Left.Controls.Add(InstanceList, 0, 1);
        Left.Controls.Add(MakeButton("从列表移除", (_, _) => RemoveInstance()), 0, 2);
        Root.Controls.Add(Left, 0, 1);

        var RightScroll = new WheelScrollPanel { Dock = DockStyle.Fill, AutoScroll = true };
        var Right = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, RowCount = 5 };
        Right.RowStyles.Add(new RowStyle(SizeType.Absolute, 280));
        Right.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Right.RowStyles.Add(new RowStyle(SizeType.Absolute, 138));
        Right.RowStyles.Add(new RowStyle(SizeType.Absolute, 144));
        Right.RowStyles.Add(new RowStyle(SizeType.Absolute, 148));
        RightScroll.Controls.Add(Right);
        Root.Controls.Add(RightScroll, 1, 1);

        var ProfileCard = MakeCard("实例设置", 8);
        var Fields = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 5, Padding = new Padding(0, 8, 0, 0) };
        Fields.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 94));
        Fields.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        for (int Index = 0; Index < 5; Index++) Fields.RowStyles.Add(new RowStyle(SizeType.Absolute, Index == 3 ? 62 : 36));
        AddField(Fields, "实例名称", NameInput, 0);
        AddField(Fields, "配置目录", HomeInput, 1);
        AddField(Fields, "界面目录", DataInput, 2);
        HomeInput.ReadOnly = true;
        DataInput.ReadOnly = true;
        var IconRow = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false };
        IconPreview.Size = new Size(50, 50);
        IconPreview.SizeMode = PictureBoxSizeMode.Zoom;
        BadgeInput.Width = 42;
        BadgeInput.MaxLength = 2;
        BadgeInput.Margin = new Padding(10, 10, 5, 0);
        ColorButton.Text = "颜色";
        ColorButton.Tag = eThemeRole.Preserve;
        ColorButton.Size = new Size(64, 34);
        ColorButton.Margin = new Padding(4, 8, 3, 0);
        ColorButton.Click += (_, _) => ChooseColor();
        IconRow.Controls.AddRange(new Control[] { IconPreview, BadgeInput, ColorButton, MakeButton("选择 ICO", (_, _) => ChooseIcon()), MakeButton("恢复默认", (_, _) => { CurrentIcon = ""; UpdatePreview(); }) });
        Fields.Controls.Add(new Label { Text = "实例图标", AutoSize = true, Margin = new Padding(0, 16, 0, 0) }, 0, 3);
        Fields.Controls.Add(IconRow, 1, 3);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false };
        Actions.Controls.Add(MakeButton("保存设置", (_, _) => SafeAction(SaveSelected), true));
        Actions.Controls.Add(MakeButton("打开配置目录", (_, _) => SafeAction(() => OpenFolder(Selected!.HomePath))));
        Actions.Controls.Add(MakeButton("编辑 config.toml", (_, _) => SafeAction(EditConfig)));
        Fields.Controls.Add(Actions, 1, 4);
        ProfileCard.Controls.Add(Fields);
        Right.Controls.Add(ProfileCard, 0, 0);

        var LaunchCard = MakeCard("启动与识别", 8);
        LaunchCard.AutoSize = true;
        LaunchCard.AutoSizeMode = AutoSizeMode.GrowAndShrink;
        var LaunchBody = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, FlowDirection = FlowDirection.TopDown, WrapContents = false };
        var LaunchActions = new FlowLayoutPanel { AutoSize = true, WrapContents = false };
        LaunchActions.Controls.Add(MakeButton("▶ 启动 / 显示", async (_, _) => await LaunchSelectedAsync(), true));
        LaunchActions.Controls.Add(MakeButton("生成桌面快捷方式", (_, _) => SafeAction(() => { SaveSelected(); string PathValue = InstanceService.CreateShortcut(Selected!); SetStatus("已生成 " + PathValue); })));
        LaunchActions.Controls.Add(MakeButton("保留项目清空会话", async (_, _) => await ClearConversationsAsync(false)));
        LaunchBody.Controls.Add(LaunchActions);
        var RunningActions = new FlowLayoutPanel { AutoSize = true, WrapContents = false };
        RunningActions.Controls.Add(MakeButton("显示全部运行实例", async (_, _) => await ShowAllRunningAsync()));
        RunningActions.Controls.Add(MakeButton("结束所选实例", async (_, _) => await StopSelectedAsync()));
        RunningActions.Controls.Add(MakeButton("清空所有项目和会话", async (_, _) => await ClearConversationsAsync(true)));
        LaunchBody.Controls.Add(RunningActions);
        var LaunchHint = new Label { AutoSize = true, ForeColor = Color.DimGray, Text = "显示后可从任务栏切换实例  ·  结束进程需确认所选名称与进程 ID" };
        LaunchBody.SizeChanged += (_, _) => LaunchHint.MaximumSize = new Size(LaunchBody.ClientSize.Width - LaunchHint.Margin.Horizontal, 0);
        LaunchBody.Controls.Add(LaunchHint);
        LaunchCard.Controls.Add(LaunchBody);
        Right.Controls.Add(LaunchCard, 0, 1);

        var CcCard = MakeCard("CC Switch", 8);
        var CcBody = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3 };
        CcBody.RowStyles.Add(new RowStyle(SizeType.Absolute, 28));
        CcBody.RowStyles.Add(new RowStyle(SizeType.Absolute, 24));
        CcBody.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        CcLabel.Dock = DockStyle.Fill;
        CcLabel.AutoEllipsis = true;
        CcBody.Controls.Add(CcLabel);
        CcBody.Controls.Add(new Label { Text = "将重启 CC Switch 并备份设置  ·  切换后在 CC Switch 里选择供应商", ForeColor = Color.DimGray, AutoSize = true });
        CcBody.Controls.Add(MakeButton("让 CC Switch 管理此实例", async (_, _) => await SwitchCcAsync(), true));
        CcCard.Controls.Add(CcBody);
        Right.Controls.Add(CcCard, 0, 4);

        var SyncCard = MakeCard("同步 Skills / MCP", 8);
        var SyncBody = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false };
        SyncBody.Controls.Add(new Label { Text = "从其他实例单向复制用户 Skills、MCP、规则与可选插件", AutoSize = true });
        SyncBody.Controls.Add(new Label { Text = "不导入对话、项目、置顶和排序  ·  保留目标账号与模型", ForeColor = Color.DimGray, AutoSize = true });
        SyncButton.Text = "选择配置内容并预览";
        StyleButton(SyncButton, true);
        SyncButton.Click += (_, _) => SafeAction(() => { SaveSelected(); if (Selected is not null) using (var Dialog = new SyncDialog(Settings.InstanceList, Selected)) ShowThemedDialog(Dialog); });
        SyncBody.Controls.Add(SyncButton);
        SyncCard.Controls.Add(SyncBody);
        Right.Controls.Add(SyncCard, 0, 3);

        var ConversationCard = MakeCard("导入对话与项目", 8);
        var ConversationBody = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false };
        ConversationBody.Controls.Add(new Label { Text = "单向导入本地历史、项目、置顶和排序", AutoSize = true });
        ConversationBody.Controls.Add(new Label { Text = "目标已有对话保留  ·  导入前备份  ·  请先退出目标实例", ForeColor = Color.DimGray, AutoSize = true });
        ConversationButton.Text = "选择来源并预览对话";
        StyleButton(ConversationButton, true);
        ConversationButton.Click += (_, _) => SafeAction(() => { SaveSelected(); if (Selected is not null) using (var Dialog = new ConversationImportDialog(Settings.InstanceList, Selected)) ShowThemedDialog(Dialog); });
        ConversationBody.Controls.Add(ConversationButton);
        ConversationCard.Controls.Add(ConversationBody);
        Right.Controls.Add(ConversationCard, 0, 2);

        StatusLabel.Dock = DockStyle.Fill;
        StatusLabel.AutoEllipsis = true;
        StatusLabel.ForeColor = Color.DimGray;
        StatusLabel.TextAlign = ContentAlignment.BottomLeft;
        Root.Controls.Add(StatusLabel, 0, 2);
        Root.SetColumnSpan(StatusLabel, 2);
        var TrayMenu = new ContextMenuStrip();
        TrayMenu.Items.Add("显示管理器", null, (_, _) => ShowManager());
        TrayMenu.Items.Add("刷新实例状态", null, async (_, _) => await RefreshRunningAsync());
        TrayMenu.Items.Add("退出管理器", null, (_, _) => { AllowExit = true; Close(); });
        TrayIcon.Icon = Icon;
        TrayIcon.Text = "Codex 实例管理器";
        TrayIcon.ContextMenuStrip = TrayMenu;
        TrayIcon.Visible = !PreviewOnly;
        TrayIcon.DoubleClick += (_, _) => ShowManager();
        RefreshDelay.Tick += async (_, _) => { RefreshDelay.Stop(); await RefreshRunningAsync(); };
        ActivityMonitor.Changed += QueueInstanceRefresh;
        Activated += (_, _) => { if (!PreviewOnly) QueueInstanceRefresh(); };
        FormClosing += (_, Event) =>
        {
            if (CleaningConversations) { Event.Cancel = true; return; }
            if (!AllowExit && Event.CloseReason == CloseReason.UserClosing) { Event.Cancel = true; Hide(); }
        };
        FormClosed += (_, _) => { RefreshDelay.Stop(); RefreshDelay.Dispose(); ActivityMonitor.Changed -= QueueInstanceRefresh; ActivityMonitor.Dispose(); Branding.Dispose(); TrayIcon.Dispose(); IconPreview.Image?.Dispose(); };
        if (!PreviewOnly) Shown += async (_, _) => { SafeAction(ActivityMonitor.Enable); await RefreshRunningAsync(); };
        RefreshInstances();
        RefreshCcLabel();
        AutoScaleDimensions = new SizeF(96, 96);
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
        ApplyTheme();
        PositionThemeButton();
    }

    private static Panel MakeCard(string Title, int BottomMargin)
    {
        var Card = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, Padding = new Padding(18, 42, 18, 12), Margin = new Padding(0, 0, 0, BottomMargin) };
        Card.Controls.Add(new Label { Text = Title, Font = new Font("Microsoft YaHei UI", 11, FontStyle.Bold), AutoSize = true, Location = new Point(18, 12) });
        return Card;
    }
    private void BuildRelayPage()
    {
        if (RelayTab.Controls.Count != 0) return;
        if (TaskStore is null || TaskCoordinator is null) throw new InvalidOperationException("跨Agent管理服务尚未连接");
        var Page = new RelayPage(Settings, TaskStore, TaskCoordinator, Theme, () => SafeAction(ToggleTheme));
        RelayTab.Controls.Add(Page);
        Theme.Apply(Page);
    }
    public void ShowRelayPage()
    {
        BuildRelayPage();
        MainTabs.SelectedTab = RelayTab;
    }
    private static void AddField(TableLayoutPanel Table, string Name, TextBox Input, int Row)
    {
        Table.Controls.Add(new Label { Text = Name, AutoSize = true, Margin = new Padding(0, 7, 0, 0) }, 0, Row);
        Input.Dock = DockStyle.Fill;
        Table.Controls.Add(Input, 1, Row);
    }
    public static Button MakeButton(string Text, EventHandler Handler, bool Primary = false)
    {
        var Button = new Button { Text = Text };
        StyleButton(Button, Primary);
        Button.Click += Handler;
        return Button;
    }
    private static void StyleButton(Button Button, bool Primary)
    {
        Button.AutoSize = true;
        Button.AutoSizeMode = AutoSizeMode.GrowAndShrink;
        Button.Padding = new Padding(8, 3, 8, 3);
        Button.FlatStyle = FlatStyle.Flat;
        Button.FlatAppearance.BorderSize = Primary ? 0 : 1;
        Button.FlatAppearance.BorderColor = Color.FromArgb(219, 222, 233);
        Button.BackColor = Primary ? AccentColor : Color.White;
        Button.ForeColor = Primary ? Color.White : Color.FromArgb(53, 59, 77);
        Button.Cursor = Cursors.Hand;
        Button.Margin = new Padding(0, 2, 8, 2);
    }
    #endregion

    #region Appearance
    private void ToggleTheme()
    {
        Settings.DarkMode = !Settings.DarkMode;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        ApplyTheme();
    }

    private void ApplyTheme()
    {
        Theme.SetDark(Settings.DarkMode);
        ThemeButton.Text = Settings.DarkMode ? "☀ 日间" : "☾ 夜间";
        Theme.Apply(this);
        PositionThemeButton();
    }

    private void PositionThemeButton()
    {
        if (ThemeButton.Parent is Control Parent) ThemeButton.Location = new Point(Parent.ClientSize.Width - ThemeButton.Width, 0);
    }

    private DialogResult ShowThemedDialog(Form Dialog)
    {
        Theme.Apply(Dialog);
        Dialog.HandleCreated += (_, _) => Theme.ApplyTitleBar(Dialog);
        return Dialog.ShowDialog(this);
    }
    #endregion

    #region Profiles
    private void RefreshInstances()
    {
        string Id = Selected?.Id ?? Settings.SelectedId;
        InstanceList.Items.Clear();
        foreach (var Profile in Settings.InstanceList) InstanceList.Items.Add(Profile);
        InstanceList.SelectedItem = Settings.InstanceList.FirstOrDefault(Profile => Profile.Id == Id) ?? Settings.InstanceList.First();
    }
    private void LoadSelected()
    {
        if (Selected is null) return;
        NameInput.Text = Selected.Name;
        BadgeInput.Text = Selected.Badge;
        HomeInput.Text = Selected.HomePath;
        DataInput.Text = Selected.IsPrimary ? "使用 Codex 默认界面目录" : Selected.DataPath;
        CurrentColor = Selected.ColorHex;
        CurrentIcon = Selected.IconPath;
        Settings.SelectedId = Selected.Id;
        SyncButton.Enabled = !Selected.IsPrimary;
        ConversationButton.Enabled = !Selected.IsPrimary;
        UpdatePreview();
    }
    private void SaveSelected()
    {
        if (Selected is null) return;
        string Name = NameInput.Text.Trim();
        string Badge = BadgeInput.Text.Trim();
        if (Name.Length == 0 || Badge.Length == 0) throw new InvalidOperationException("实例名称和图标文字不能为空");
        Selected.Name = Name;
        Selected.Badge = Badge;
        Selected.ColorHex = CurrentColor;
        Selected.IconPath = CurrentIcon;
        SettingsStore.Save(Settings);
        UpdatePreview();
        InstanceList.Invalidate();
        SetStatus("已保存 " + Selected.Name);
    }
    private void AddInstance()
    {
        var Profile = new InstanceProfile { Name = "新实例 " + (Settings.InstanceList.Count + 1), Badge = (Settings.InstanceList.Count + 1).ToString() };
        string Root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "OpenAI", "Codex-Instances", Profile.Id);
        Profile.HomePath = Path.Combine(Root, "codex-home");
        Profile.DataPath = Path.Combine(Root, "desktop-data");
        Settings.InstanceList.Add(Profile);
        Settings.SelectedId = Profile.Id;
        SettingsStore.Save(Settings);
        InstanceList.SelectedItem = null;
        RefreshInstances();
        NameInput.Focus();
        NameInput.SelectAll();
    }
    private void RemoveInstance()
    {
        if (Selected is null || Selected.IsPrimary) { SetStatus("主实例保留在列表中"); return; }
        if (MessageBox.Show(this, "仅从管理器列表移除该实例\n配置目录和会话文件会保留", "移除 " + Selected.Name, MessageBoxButtons.OKCancel, MessageBoxIcon.Question) != DialogResult.OK) return;
        Settings.InstanceList.Remove(Selected);
        Settings.SelectedId = "primary";
        SettingsStore.Save(Settings);
        RefreshInstances();
    }
    private void ChooseColor()
    {
        using var Dialog = new ColorDialog { Color = ColorTranslator.FromHtml(CurrentColor), FullOpen = true };
        if (Dialog.ShowDialog(this) != DialogResult.OK) return;
        CurrentColor = ColorTranslator.ToHtml(Dialog.Color);
        CurrentIcon = "";
        UpdatePreview();
    }
    private void ChooseIcon()
    {
        using var Dialog = new OpenFileDialog { Filter = "图标或图片 (*.ico;*.png;*.jpg;*.jpeg)|*.ico;*.png;*.jpg;*.jpeg", Title = "选择实例图标" };
        if (Dialog.ShowDialog(this) != DialogResult.OK) return;
        SafeAction(() =>
        {
            string DirectoryPath = Path.Combine(ManagerPaths.Root, "icons");
            Directory.CreateDirectory(DirectoryPath);
            string Target = Path.Combine(DirectoryPath, Selected!.Id + "-custom.ico");
            if (Path.GetExtension(Dialog.FileName).Equals(".ico", StringComparison.OrdinalIgnoreCase))
            {
                using var Validation = new Icon(Dialog.FileName);
                if (!ManagerPaths.Same(Dialog.FileName, Target)) File.Copy(Dialog.FileName, Target, true);
            }
            else
            {
                using var Source = Image.FromFile(Dialog.FileName);
                using var Bitmap = new Bitmap(64, 64);
                using var Canvas = Graphics.FromImage(Bitmap);
                Canvas.Clear(Color.Transparent);
                Canvas.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                float Ratio = Math.Min(64f / Source.Width, 64f / Source.Height);
                float Width = Source.Width * Ratio;
                float Height = Source.Height * Ratio;
                Canvas.DrawImage(Source, (64 - Width) / 2, (64 - Height) / 2, Width, Height);
                BrandingService.SaveIcon(Bitmap, Target);
            }
            CurrentIcon = Target;
            UpdatePreview();
        });
    }
    private void UpdatePreview()
    {
        IconPreview.Image?.Dispose();
        if (CurrentIcon.Length > 0 && File.Exists(CurrentIcon)) { using var CustomIcon = new Icon(CurrentIcon, new Size(64, 64)); IconPreview.Image = CustomIcon.ToBitmap(); }
        else IconPreview.Image = BrandingService.DrawBadge(new InstanceProfile { Badge = BadgeInput.Text.Length == 0 ? "C" : BadgeInput.Text, ColorHex = CurrentColor }, 64);
        ColorButton.BackColor = ColorTranslator.FromHtml(CurrentColor);
        ColorButton.ForeColor = Color.White;
    }
    private void DrawInstance(object? Sender, DrawItemEventArgs Event)
    {
        if (Event.Index < 0) return;
        var Profile = (InstanceProfile)InstanceList.Items[Event.Index];
        bool IsSelected = (Event.State & DrawItemState.Selected) != 0;
        using var Background = new SolidBrush(IsSelected ? Theme.Palette.Selection : Theme.Palette.Surface);
        Event.Graphics.FillRectangle(Background, Event.Bounds);
        using var Badge = BrandingService.DrawBadge(Profile, 44);
        Event.Graphics.DrawImage(Badge, Event.Bounds.Left + 12, Event.Bounds.Top + 17, 44, 44);
        var TitleBounds = new Rectangle(Event.Bounds.Left + 65, Event.Bounds.Top + 18, Event.Bounds.Width - 70, 27);
        TextRenderer.DrawText(Event.Graphics, Profile.Name, Font, TitleBounds, Theme.Palette.Text, TextFormatFlags.EndEllipsis);
        var Running = InstanceService.Find(Profile, RunningList);
        string State = Running is null ? "○ 未启动" : Running.Window == IntPtr.Zero ? "● 后台运行 无主窗口" : InstanceWindowService.IsVisible(Running.Window) ? "● 窗口已显示" : "● 运行中 窗口隐藏";
        TextRenderer.DrawText(Event.Graphics, State, Font, new Point(Event.Bounds.Left + 65, Event.Bounds.Top + 45), Running is not null ? Theme.Palette.Success : Theme.Palette.Muted);
    }
    #endregion

    #region Actions
    public async Task HandleCommandAsync(string Command)
    {
        if (Command == "show") { ShowManager(); return; }
        if (Command == "relay") { ShowRelayPage(); ShowManager(); return; }
        var Profile = Settings.InstanceList.FirstOrDefault(Item => Item.Id == Command) ?? throw new InvalidOperationException("找不到指定实例 " + Command);
        InstanceList.SelectedItem = Profile;
        await LaunchSelectedAsync();
    }
    private async Task LaunchSelectedAsync()
    {
        await SafeAsync(async () =>
        {
            SaveSelected();
            var Profile = Selected!;
            int ProcessId = await Task.Run(() => InstanceService.Launch(Profile));
            SetStatus($"{Profile.Name} 已启动 / 显示  ·  进程 {ProcessId}");
            await RefreshRunningAsync();
        });
    }
    /// <summary>
    /// 恢复全部已运行实例的主窗口 不启动未运行实例
    /// </summary>
    private async Task ShowAllRunningAsync()
    {
        await SafeAsync(async () =>
        {
            SaveSelected();
            var ProfileList = Settings.InstanceList.ToList();
            int Displayed = await Task.Run(() =>
            {
                var CurrentList = InstanceService.ListRunning();
                var ErrorList = new List<Exception>();
                int Count = 0;
                foreach (var Profile in ProfileList)
                {
                    var Running = InstanceService.Find(Profile, CurrentList);
                    if (Running is null) continue;
                    try { InstanceWindowService.ShowMainWindow(Running.ProcessId, Running.Window); Count++; }
                    catch (Exception Error) { ErrorList.Add(new InvalidOperationException(Profile.Name + " " + Error.Message, Error)); }
                }
                if (ErrorList.Count > 0) throw new AggregateException($"已显示 {Count} 个实例\n" + string.Join("\n", ErrorList.Select(Error => Error.Message)), ErrorList);
                return Count;
            });
            SetStatus($"已显示 {Displayed} 个运行实例 可从任务栏切换");
            await RefreshRunningAsync();
        });
    }
    /// <summary>
    /// 确认所选名称与进程后结束实例 确认期间进程变化则拒绝执行
    /// </summary>
    private async Task StopSelectedAsync()
    {
        await SafeAsync(async () =>
        {
            var Profile = Selected!;
            var CurrentList = await Task.Run(InstanceService.ListRunning);
            var Running = InstanceService.Find(Profile, CurrentList);
            if (Running is null) { SetStatus(Profile.Name + " 未运行"); await RefreshRunningAsync(); return; }
            if (MessageBox.Show(this, $"结束 {Profile.Name}\n进程 ID {Running.ProcessId}\n\n将结束此实例及其子进程 正在执行的任务会中断", "结束所选实例", MessageBoxButtons.OKCancel, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2) != DialogResult.OK) return;
            await InstanceService.StopAsync(Profile, Running.ProcessId);
            SetStatus(Profile.Name + " 已结束");
            await RefreshRunningAsync();
        });
    }
    private async Task ClearConversationsAsync(bool RemoveProjects)
    {
        if (CleaningConversations) return;
        var Profile = Selected!;
        string ActionName = RemoveProjects ? "清空所有项目和会话" : "保留项目清空会话";
        string Scope = RemoveProjects ? "清空此实例的全部本地会话（含归档）及项目登记" : "清空此实例的全部本地会话（含归档），保留项目登记与排序";
        if (MessageBox.Show(this, $"所选实例：{Profile.Name}\n配置目录：{Profile.HomePath}\n\n{Scope}\n磁盘工程、账号、模型、Skills 和 MCP 配置保留\n\n请先退出所选 Codex 实例\n清理前会自动备份，失败时回滚\n\n确认继续？", ActionName, MessageBoxButtons.OKCancel, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2) != DialogResult.OK) return;
        CleaningConversations = true;
        Enabled = false;
        UseWaitCursor = true;
        try
        {
            await SafeAsync(async () =>
            {
                var Progress = new Progress<string>(SetStatus);
                string Backup = await Task.Run(() => ConversationCleanupService.Apply(Profile, RemoveProjects, ManagerPaths.BackupRoot, Progress));
                SetStatus(Profile.Name + " 已完成清理");
                MessageBox.Show(this, ActionName + "已完成\n\n备份目录\n" + Backup, "清理完成", MessageBoxButtons.OK, MessageBoxIcon.Information);
            });
        }
        finally
        {
            UseWaitCursor = false;
            Enabled = true;
            CleaningConversations = false;
        }
    }

    private async Task SwitchCcAsync()
    {
        if (Selected is null) return;
        if (MessageBox.Show(this, "将关闭并重新打开 CC Switch\n如果它仍驻留托盘 将结束该进程以应用设置\n使用其本地代理的请求可能中断\n\n新的 Codex 配置目录\n" + Selected.HomePath, "切换 CC Switch 目标", MessageBoxButtons.OKCancel, MessageBoxIcon.Information) != DialogResult.OK) return;
        await SafeAsync(async () => { await InstanceService.SwitchCcAsync(Selected); RefreshCcLabel(); SetStatus("CC Switch 已指向 " + Selected.Name + "  请在 CC Switch 中选择供应商"); });
    }
    private void RefreshCcLabel() => SafeAction(() => CcLabel.Text = "当前目录  " + InstanceService.ReadCcTarget());
    private void EditConfig()
    {
        if (Selected is null) return;
        Directory.CreateDirectory(Selected.HomePath);
        string FilePath = Path.Combine(Selected.HomePath, "config.toml");
        if (!File.Exists(FilePath)) File.WriteAllText(FilePath, "");
        var Info = new ProcessStartInfo("notepad.exe") { UseShellExecute = false };
        Info.ArgumentList.Add(FilePath);
        Process.Start(Info);
    }
    private static void OpenFolder(string PathValue) { Directory.CreateDirectory(PathValue); Process.Start(new ProcessStartInfo("explorer.exe") { Arguments = "\"" + PathValue + "\"", UseShellExecute = true }); }
    private void ShowManager() { Show(); WindowState = FormWindowState.Normal; Activate(); }
    private void SetStatus(string Value) => StatusLabel.Text = Value;
    private async Task RefreshRunningAsync()
    {
        if (Polling) { RefreshAgain = true; return; }
        Polling = true;
        try
        {
            RunningList = await Task.Run(InstanceService.ListRunning);
            if (IsDisposed || Disposing) return;
            if (!PreviewOnly && !IsDisposed) ActivityMonitor.Track(RunningList);
            foreach (var Profile in Settings.InstanceList)
            {
                var Running = InstanceService.Find(Profile, RunningList);
                if (Running is not null) Branding.Apply(Profile, Running.Window);
            }
            if (Visible && WindowState != FormWindowState.Minimized) InstanceList.Invalidate();
        }
        catch (Exception Error) { SetStatus("读取实例状态失败 " + Error.Message); Program.LogError(Error); }
        finally { Polling = false; if (RefreshAgain) { RefreshAgain = false; QueueInstanceRefresh(); } }
    }
    private void QueueInstanceRefresh()
    {
        if (PreviewOnly || IsDisposed || !IsHandleCreated) return;
        if (InvokeRequired)
        {
            try { BeginInvoke(QueueInstanceRefresh); }
            catch (InvalidOperationException) when (IsDisposed || Disposing || !IsHandleCreated) { }
            return;
        }
        RefreshDelay.Stop();
        RefreshDelay.Start();
    }
    private void SafeAction(Action Action)
    {
        try { Action(); }
        catch (Exception Error) { ShowError(Error); }
    }
    private async Task SafeAsync(Func<Task> Action)
    {
        try { await Action(); }
        catch (Exception Error) { ShowError(Error); }
    }
    private void ShowError(Exception Error) { Program.LogError(Error); SetStatus(Error.Message); MessageBox.Show(this, Error.Message, "操作未完成", MessageBoxButtons.OK, MessageBoxIcon.Error); }
    [System.Runtime.InteropServices.DllImport("user32.dll", EntryPoint = "DestroyIcon")] private static extern bool NativeDestroyIcon(IntPtr Icon);
    #endregion
}
