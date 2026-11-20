using System.Diagnostics;
using System.Drawing.Drawing2D;

namespace CodexInstanceManager;

/// <summary>
/// Codex 实例与外部执行端统一卡片列表 选中后右侧显示详情与操作
/// </summary>
public sealed class AgentPage : UserControl
{
    public sealed record AgentEntry(string Id, string Title, string Caption, string Short, eTone Tone, InstanceProfile? Profile)
    {
        public override string ToString() => Title;
    }

    private readonly ManagerSettings Settings;
    private readonly AppTheme Theme;
    private readonly bool PreviewOnly;
    private readonly ListBox AgentList = new() { Dock = DockStyle.Fill, BorderStyle = BorderStyle.None, DrawMode = DrawMode.OwnerDrawFixed, IntegralHeight = false, Tag = eThemeRole.Background, Margin = new Padding(0, 0, 18, 0) };
    private readonly Panel DetailHost = new() { Dock = DockStyle.Fill, Margin = Padding.Empty };
    /// <summary> Codex 实例详情滚动区 </summary>
    private readonly WheelScrollPanel CodexScroll = new() { Dock = DockStyle.Fill, AutoScroll = true };
    /// <summary> 外部执行端 ID 到详情页 </summary>
    private readonly Dictionary<string, Control> ExternalDict = new();
    private readonly Label Status = new() { AutoSize = false, Dock = DockStyle.Fill, Height = 26, AutoEllipsis = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, TextAlign = ContentAlignment.MiddleLeft };
    private readonly PictureBox HeaderBadge = new() { Size = new Size(56, 56), SizeMode = PictureBoxSizeMode.Zoom, Margin = new Padding(0, 0, 14, 0) };
    private readonly Label HeaderName = new() { Dock = DockStyle.Fill, Height = 34, AutoEllipsis = true, Font = StudioFonts.Title, Tag = eThemeRole.Title, Margin = new Padding(0, 0, 0, 2) };
    private readonly Label HeaderPath = new() { AutoSize = false, AutoEllipsis = true, Dock = DockStyle.Fill, Height = 22, Font = StudioFonts.Caption, Tag = eThemeRole.Muted, Margin = Padding.Empty };
    private readonly StudioChip HeaderState = new() { Margin = new Padding(12, 6, 0, 0) };
    private readonly TextBox NameInput = new() { Dock = DockStyle.Fill, Margin = new Padding(0, 4, 0, 6) };
    private readonly TextBox BadgeInput = new() { Width = 46, MaxLength = 2, Margin = new Padding(12, 14, 6, 0) };
    private readonly TextBox HomeInput = new() { Dock = DockStyle.Fill, ReadOnly = true, Margin = new Padding(0, 4, 0, 6) };
    private readonly TextBox DataInput = new() { Dock = DockStyle.Fill, ReadOnly = true, Margin = new Padding(0, 4, 0, 6) };
    private readonly PictureBox IconPreview = new() { Size = new Size(50, 50), SizeMode = PictureBoxSizeMode.Zoom, Margin = new Padding(0, 4, 0, 0) };
    private readonly StudioButton ColorButton = new() { Text = "颜色", Tag = eThemeRole.Preserve, Margin = new Padding(0, 12, 8, 0) };
    private readonly StudioButton SyncButton = new() { Text = "同步 Skills / MCP" };
    private readonly StudioButton ProjectButton = new() { Text = "一键同步工程" };
    private readonly StudioButton ConversationButton = new() { Text = "导入历史对话" };
    private readonly Label CcLabel = new() { AutoSize = false, Dock = DockStyle.Fill, Height = 24, AutoEllipsis = true, Font = StudioFonts.Mono, Margin = new Padding(0, 0, 0, 6) };
    private readonly CancellationTokenSource Lifetime = new();
    private List<RunningInstance> RunningList = new();
    private readonly Dictionary<string, (string Text, eTone Tone)> RunningStateDict = new();
    private string CurrentColor = "#5465E8";
    private string CurrentIcon = "";
    public bool IsBusy { get; private set; }
    public AgentEntry? SelectedEntry => AgentList.SelectedItem as AgentEntry;
    public InstanceProfile? Selected => SelectedEntry?.Profile;

    #region Layout
    public AgentPage(ManagerSettings Settings, AppTheme Theme, bool PreviewOnly, RelayCoordinator? Coordinator)
    {
        SuspendLayout();
        this.Settings = Settings;
        this.Theme = Theme;
        this.PreviewOnly = PreviewOnly;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = StudioFonts.Body;
        Dock = DockStyle.Fill;
        Padding = new Padding(28, 22, 28, 12);
        Tag = eThemeRole.Background;

        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Margin = Padding.Empty };
        Root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Root.Controls.Add(BuildHeader());
        var Body = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1, Margin = new Padding(0, 14, 0, 0) };
        Body.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 264));
        Body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        AgentList.ItemHeight = (int)(74 * DeviceDpi / 96f);
        AgentList.DrawItem += DrawEntry;
        AgentList.SelectedIndexChanged += (_, _) => Run(LoadSelected);
        Body.Controls.Add(AgentList, 0, 0);
        Body.Controls.Add(DetailHost, 1, 0);
        Root.Controls.Add(Body);
        Root.Controls.Add(Status);
        Controls.Add(Root);

        CodexScroll.Controls.Add(BuildCodexDetail());
        DetailHost.Controls.Add(CodexScroll);
        AddExternal(CursorRelayRunner.InstanceId, new HarnessPage(Settings, Coordinator?.Cursor, PreviewOnly));
        AddExternal(DshRelayRunner.InstanceId, new DshPage(Settings, PreviewOnly));
        AddExternal(ClaudeRelayRunner.InstanceId, new ClaudePage(Coordinator?.Claude, Theme, PreviewOnly));
        AddExternal(AntigravityRelayRunner.InstanceId, new AntigravityPage(PreviewOnly));

        RefreshEntries(Settings.SelectedId);
        RefreshCcLabel();
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    private Control BuildHeader()
    {
        var Header = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Margin = Padding.Empty };
        Header.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Header.Controls.Add(new Label { Text = "Agent 管理", Font = StudioFonts.Title, AutoSize = true, Tag = eThemeRole.Title, Margin = new Padding(0, 0, 0, 2) });
        Header.Controls.Add(new StudioWrapLabel { Text = "Codex 实例与外部执行端统一管理  ·  选中卡片查看配置 启动与连接操作", Font = StudioFonts.Caption, Tag = eThemeRole.Muted, Margin = Padding.Empty });
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = new Padding(0, 6, 0, 0) };
        Actions.Controls.Add(Action("＋ 新建实例", AddInstance, eButtonKind.Primary));
        Actions.Controls.Add(ActionAsync("显示全部运行实例", ShowAllRunningAsync));
        Actions.Controls.Add(ActionAsync("健康检查", ShowDoctorAsync));
        Header.Controls.Add(Actions);
        return Header;
    }

    private Control BuildCodexDetail()
    {
        var Column = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Margin = Padding.Empty, Padding = new Padding(0, 0, 6, 0) };
        Column.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));

        var HeaderCard = new StudioCard { Dock = DockStyle.Fill, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink };
        var HeaderBody = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Margin = Padding.Empty };
        HeaderBody.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        var Identity = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 3, Margin = new Padding(0, 0, 0, 8) };
        Identity.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        Identity.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Identity.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        var Names = new TableLayoutPanel { Dock = DockStyle.Fill, AutoSize = true, ColumnCount = 1, Margin = new Padding(0, 2, 0, 0) };
        Names.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Names.Controls.Add(HeaderName);
        Names.Controls.Add(HeaderPath);
        Identity.Controls.Add(HeaderBadge, 0, 0);
        Identity.Controls.Add(Names, 1, 0);
        Identity.Controls.Add(HeaderState, 2, 0);
        HeaderBody.Controls.Add(Identity);
        var LaunchActions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = Padding.Empty };
        LaunchActions.Controls.Add(ActionAsync("▶ 启动 / 显示", () => LaunchAsync(Selected!), eButtonKind.Primary));
        LaunchActions.Controls.Add(ActionAsync("结束所选实例", StopSelectedAsync));
        LaunchActions.Controls.Add(Action("生成桌面快捷方式", CreateShortcut));
        LaunchActions.Controls.Add(Action("从列表移除", RemoveInstance, eButtonKind.Ghost));
        HeaderBody.Controls.Add(LaunchActions);
        HeaderBody.Controls.Add(new StudioWrapLabel { Text = "显示后可从任务栏切换实例  ·  结束进程需确认所选名称与进程 ID", Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 6, 0, 0) });
        HeaderCard.Controls.Add(HeaderBody);
        Column.Controls.Add(HeaderCard);

        var ProfileCard = StudioCard.Create("实例设置", "名称与图标用于任务栏识别  ·  目录由管理器分配 只读显示", out var ProfileBody);
        var Fields = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 2, Margin = Padding.Empty };
        Fields.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 84));
        Fields.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        AddField(Fields, "实例名称", NameInput);
        AddField(Fields, "配置目录", HomeInput);
        AddField(Fields, "界面目录", DataInput);
        var IconRow = new FlowLayoutPanel { AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Dock = DockStyle.Top, Margin = new Padding(0, 2, 0, 6) };
        ColorButton.Click += (_, _) => Run(ChooseColor);
        IconRow.Controls.AddRange(new Control[] { IconPreview, BadgeInput, ColorButton, Action("Agent 图标设置", () => ((MainForm)FindForm()!).ShowSettingsPage(), eButtonKind.Ghost) });
        Fields.Controls.Add(new Label { Text = "序号配色", AutoSize = true, Tag = eThemeRole.Muted, Margin = new Padding(0, 20, 8, 0) });
        Fields.Controls.Add(IconRow);
        ProfileBody.Controls.Add(Fields);
        var ProfileActions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = new Padding(0, 6, 0, 0) };
        ProfileActions.Controls.Add(Action("保存设置", SaveSelected, eButtonKind.Primary));
        ProfileActions.Controls.Add(Action("打开配置目录", () => OpenFolder(Selected!.HomePath)));
        ProfileActions.Controls.Add(Action("编辑 config.toml", EditConfig));
        ProfileBody.Controls.Add(ProfileActions);
        Column.Controls.Add(ProfileCard);

        var ImportCard = StudioCard.Create("同步与导入", "以主实例为来源  ·  不导入账号与模型  ·  导入前自动备份  ·  请先退出目标实例", out var ImportBody);
        var ImportActions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = Padding.Empty };
        SyncButton.Click += (_, _) => Run(() => { SaveSelected(); ShowDialog(new SyncDialog(Settings.InstanceList, Selected!, Settings.Library.ExcludedNameList)); });
        ProjectButton.Click += (_, _) => Run(() => { SaveSelected(); ShowDialog(new ProjectSyncDialog(Settings.InstanceList, Selected!)); });
        ConversationButton.Click += (_, _) => Run(() => { SaveSelected(); ShowDialog(new ConversationImportDialog(Settings.InstanceList, Selected!)); });
        ImportActions.Controls.AddRange(new Control[] { SyncButton, ProjectButton, ConversationButton });
        ImportBody.Controls.Add(ImportActions);
        Column.Controls.Add(ImportCard);

        var CcCard = StudioCard.Create("CC Switch", "将重启 CC Switch 并备份设置  ·  切换后在 CC Switch 里选择供应商", out var CcBody);
        CcBody.Controls.Add(CcLabel);
        var CcActions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Margin = Padding.Empty };
        CcActions.Controls.Add(ActionAsync("让 CC Switch 管理此实例", SwitchCcAsync));
        CcBody.Controls.Add(CcActions);
        Column.Controls.Add(CcCard);

        var CleanCard = StudioCard.Create("数据维护", "清理前自动备份 失败回滚  ·  磁盘工程 账号 模型 Skills 与 MCP 配置保留", out var CleanBody, eTone.Danger);
        var CleanActions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = Padding.Empty };
        CleanActions.Controls.Add(ActionAsync("保留项目清空会话", () => ClearConversationsAsync(false), eButtonKind.Danger));
        CleanActions.Controls.Add(ActionAsync("清空所有项目和会话", () => ClearConversationsAsync(true), eButtonKind.Danger));
        CleanBody.Controls.Add(CleanActions);
        Column.Controls.Add(CleanCard);
        return Column;
    }

    private void AddExternal(string Id, Control Page)
    {
        Page.Dock = DockStyle.Fill;
        Page.Visible = false;
        ExternalDict[Id] = Page;
        DetailHost.Controls.Add(Page);
    }

    private static void AddField(TableLayoutPanel Table, string Name, TextBox Input)
    {
        Table.Controls.Add(new Label { Text = Name, AutoSize = true, Tag = eThemeRole.Muted, Margin = new Padding(0, 9, 8, 0) });
        Table.Controls.Add(Input);
    }

    private StudioButton Action(string Text, Action Execute, eButtonKind Kind = eButtonKind.Secondary)
    {
        var Button = new StudioButton { Text = Text, Kind = Kind };
        Button.Click += (_, _) => Run(Execute);
        return Button;
    }

    private StudioButton ActionAsync(string Text, Func<Task> Execute, eButtonKind Kind = eButtonKind.Secondary)
    {
        var Button = new StudioButton { Text = Text, Kind = Kind };
        Button.Click += async (_, _) => await RunAsync(Execute);
        return Button;
    }
    #endregion

    #region Entries
    private void RefreshEntries(string? SelectId)
    {
        RunningStateDict.Clear();
        AgentList.Items.Clear();
        foreach (var Profile in Settings.InstanceList)
            AgentList.Items.Add(new AgentEntry(Profile.Id, Profile.Name, Profile.IsPrimary ? "Codex 主实例" : "Codex 实例", Profile.Badge, eTone.Accent, Profile));
        AgentList.Items.Add(new AgentEntry(CursorRelayRunner.InstanceId, "Cursor CLI", "独立执行与结果回传", "Cu", eTone.Info, null));
        AgentList.Items.Add(new AgentEntry(DshRelayRunner.InstanceId, "DeepSeek Harness", "桌面后台连接", "DS", eTone.Violet, null));
        AgentList.Items.Add(new AgentEntry(ClaudeRelayRunner.InstanceId, "Claude Code", "Claude Desktop 网关", "Cl", eTone.Warning, null));
        AgentList.Items.Add(new AgentEntry(AntigravityRelayRunner.InstanceId, "Antigravity", "桌面 App 联调", "Ag", eTone.Pink, null));
        UpdateRunning(RunningList);
        var Entries = AgentList.Items.Cast<AgentEntry>().ToList();
        AgentList.SelectedItem = Entries.FirstOrDefault(Item => Item.Id == SelectId) ?? Entries.First();
    }

    /// <summary>
    /// 选中指定实例或外部执行端 ID
    /// </summary>
    public void ShowAgent(string Id)
    {
        var Entry = AgentList.Items.Cast<AgentEntry>().FirstOrDefault(Item => Item.Id == Id) ?? throw new InvalidOperationException("找不到 Agent " + Id);
        AgentList.SelectedItem = Entry;
    }

    private void LoadSelected()
    {
        var Entry = SelectedEntry;
        if (Entry is null) return;
        CodexScroll.Visible = Entry.Profile is not null;
        foreach (var Pair in ExternalDict) Pair.Value.Visible = Pair.Key == Entry.Id;
        if (Entry.Profile is null) return;
        var Profile = Entry.Profile;
        NameInput.Text = Profile.Name;
        BadgeInput.Text = Profile.Badge;
        HomeInput.Text = Profile.HomePath;
        DataInput.Text = Profile.IsPrimary ? "使用 Codex 默认界面目录" : Profile.DataPath;
        CurrentColor = Profile.ColorHex;
        CurrentIcon = Profile.IconPath;
        Settings.SelectedId = Profile.Id;
        SyncButton.Enabled = !Profile.IsPrimary;
        ProjectButton.Enabled = !Profile.IsPrimary;
        ConversationButton.Enabled = !Profile.IsPrimary;
        HeaderName.Text = Profile.Name;
        HeaderPath.Text = Profile.HomePath;
        RefreshHeaderState();
        UpdatePreview();
    }

    public void UpdateRunning(List<RunningInstance> RunningList)
    {
        this.RunningList = RunningList;
        for (int Index = 0; Index < AgentList.Items.Count; Index++)
        {
            if (AgentList.Items[Index] is not AgentEntry { Profile: { } Profile }) continue;
            var State = ReadRunningState(Profile, RunningList);
            if (RunningStateDict.TryGetValue(Profile.Id, out var Previous) && Previous == State) continue;
            RunningStateDict[Profile.Id] = State;
            if (Visible && AgentList.IsHandleCreated) AgentList.Invalidate(AgentList.GetItemRectangle(Index));
        }
        RefreshHeaderState(Animate: Visible);
    }

    private static (string Text, eTone Tone) ReadRunningState(InstanceProfile Profile, List<RunningInstance> RunningList)
    {
        var Running = InstanceService.Find(Profile, RunningList);
        if (Running is null) return ("未启动", eTone.Neutral);
        if (Running.Window == IntPtr.Zero) return ("后台运行 无主窗口", eTone.Warning);
        return InstanceWindowService.IsVisible(Running.Window) ? ("窗口已显示", eTone.Success) : ("运行中 窗口隐藏", eTone.Info);
    }

    private void RefreshHeaderState(bool Animate = false)
    {
        if (Selected is not { } Profile) return;
        if (!RunningStateDict.TryGetValue(Profile.Id, out var State)) return;
        if (HeaderState.Text != State.Text) HeaderState.Text = State.Text;
        if (Animate) HeaderState.TransitionTo(State.Tone);
        else HeaderState.Tone = State.Tone;
    }

    private void DrawEntry(object? Sender, DrawItemEventArgs Event)
    {
        if (Event.Index < 0) return;
        var Entry = (AgentEntry)AgentList.Items[Event.Index];
        var Colors = Theme.Palette;
        var Canvas = Event.Graphics;
        float Scale = DeviceDpi / 96f;
        bool IsSelected = (Event.State & DrawItemState.Selected) != 0;
        using (var Clear = new SolidBrush(Colors.Background)) Canvas.FillRectangle(Clear, Event.Bounds);
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        var Card = new Rectangle(Event.Bounds.Left + 1, Event.Bounds.Top + (int)(4 * Scale), Event.Bounds.Width - (int)(4 * Scale), Event.Bounds.Height - (int)(8 * Scale));
        using (var Path = StudioGeometry.Rounded(Card, 12 * Scale))
        {
            using var Fill = new SolidBrush(IsSelected ? Colors.AccentSoft : Colors.Surface);
            Canvas.FillPath(Fill, Path);
            using var Border = new Pen(IsSelected ? Colors.Accent : Colors.Border);
            Canvas.DrawPath(Border, Path);
        }
        int BadgeSize = (int)(40 * Scale);
        var BadgeBounds = new Rectangle(Card.Left + (int)(12 * Scale), Card.Top + (Card.Height - BadgeSize) / 2, BadgeSize, BadgeSize);
        if (Entry.Profile is { } Profile)
        {
            using var Badge = BrandingService.DrawBadge(Profile, BadgeSize);
            Canvas.DrawImage(Badge, BadgeBounds);
        }
        else
        {
            using var Avatar = AgentAvatars.Draw(Entry.Id, "1", BadgeSize, Colors.Tone(Entry.Tone).Fore);
            Canvas.DrawImage(Avatar, BadgeBounds);
        }
        int TextLeft = BadgeBounds.Right + (int)(12 * Scale);
        int TextWidth = Card.Right - TextLeft - (int)(10 * Scale);
        TextRenderer.DrawText(Canvas, Entry.Title, StudioFonts.Strong, new Rectangle(TextLeft, Card.Top + (int)(13 * Scale), TextWidth, (int)(22 * Scale)), Colors.Text, TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding);
        string Caption = Entry.Caption;
        var CaptionColor = Colors.Muted;
        if (Entry.Profile is { } Instance)
        {
            var (Text, Tone) = RunningStateDict.GetValueOrDefault(Instance.Id, ("未启动", eTone.Neutral));
            Caption = (Tone == eTone.Neutral ? "○ " : "● ") + Text;
            CaptionColor = Tone == eTone.Neutral ? Colors.Muted : Colors.Tone(Tone).Fore;
        }
        TextRenderer.DrawText(Canvas, Caption, StudioFonts.Caption, new Rectangle(TextLeft, Card.Top + (int)(37 * Scale), TextWidth, (int)(20 * Scale)), CaptionColor, TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding);
    }
    #endregion

    #region Profiles
    private void SaveSelected()
    {
        var Profile = Selected ?? throw new InvalidOperationException("请先选择 Codex 实例");
        string Name = NameInput.Text.Trim();
        string Badge = BadgeInput.Text.Trim();
        if (Name.Length == 0 || Badge.Length == 0) throw new InvalidOperationException("实例名称和图标文字不能为空");
        Profile.Name = Name;
        Profile.Badge = Badge;
        Profile.ColorHex = CurrentColor;
        Profile.IconPath = CurrentIcon;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        HeaderName.Text = Name;
        UpdatePreview();
        AgentList.Invalidate();
        SetStatus(PreviewOnly ? "预览模式未写入配置 " + Name : "已保存 " + Name);
    }

    private void AddInstance()
    {
        var Profile = new InstanceProfile { Name = "新实例 " + (Settings.InstanceList.Count + 1), Badge = (Settings.InstanceList.Count + 1).ToString() };
        string Root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "OpenAI", "Codex-Instances", Profile.Id);
        Profile.HomePath = Path.Combine(Root, "codex-home");
        Profile.DataPath = Path.Combine(Root, "desktop-data");
        Settings.InstanceList.Add(Profile);
        Settings.SelectedId = Profile.Id;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        RefreshEntries(Profile.Id);
        NameInput.Focus();
        NameInput.SelectAll();
    }

    private void RemoveInstance()
    {
        var Profile = Selected ?? throw new InvalidOperationException("请先选择 Codex 实例");
        if (Profile.IsPrimary) { SetStatus("主实例保留在列表中"); return; }
        if (MessageBox.Show(FindForm(), "仅从管理器列表移除该实例\n配置目录和会话文件会保留", "移除 " + Profile.Name, MessageBoxButtons.OKCancel, MessageBoxIcon.Question) != DialogResult.OK) return;
        Settings.InstanceList.Remove(Profile);
        Settings.SelectedId = Settings.InstanceList.FirstOrDefault(Item => Item.IsPrimary)?.Id ?? Settings.InstanceList.FirstOrDefault()?.Id ?? "";
        if (!PreviewOnly) SettingsStore.Save(Settings);
        RefreshEntries(Settings.SelectedId);
    }

    private void ChooseColor()
    {
        using var Dialog = new ColorDialog { Color = ColorTranslator.FromHtml(CurrentColor), FullOpen = true };
        if (Dialog.ShowDialog(FindForm()) != DialogResult.OK) return;
        CurrentColor = ColorTranslator.ToHtml(Dialog.Color);
        CurrentIcon = "";
        UpdatePreview();
    }

    private void ChooseIcon()
    {
        var Profile = Selected ?? throw new InvalidOperationException("请先选择 Codex 实例");
        using var Dialog = new OpenFileDialog { Filter = "图标或图片 (*.ico;*.png;*.jpg;*.jpeg)|*.ico;*.png;*.jpg;*.jpeg", Title = "选择实例图标" };
        if (Dialog.ShowDialog(FindForm()) != DialogResult.OK) return;
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入图标文件");
        string DirectoryPath = Path.Combine(ManagerPaths.Root, "icons");
        Directory.CreateDirectory(DirectoryPath);
        string Target = Path.Combine(DirectoryPath, Profile.Id + "-custom.ico");
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
            Canvas.InterpolationMode = InterpolationMode.HighQualityBicubic;
            float Ratio = Math.Min(64f / Source.Width, 64f / Source.Height);
            float Width = Source.Width * Ratio;
            float Height = Source.Height * Ratio;
            Canvas.DrawImage(Source, (64 - Width) / 2, (64 - Height) / 2, Width, Height);
            BrandingService.SaveIcon(Bitmap, Target);
        }
        CurrentIcon = Target;
        UpdatePreview();
    }

    private void UpdatePreview()
    {
        var Previous = IconPreview.Image;
        var HeaderPrevious = HeaderBadge.Image;
        Bitmap Preview;
        var IconSettings = PreviewOnly ? new AgentIconSettings() : AgentIconSettings.Load();
        if (IconSettings.Enabled) Preview = IconSettings.Draw("codex", BadgeInput.Text.Length == 0 ? "C" : BadgeInput.Text, 64, ColorTranslator.FromHtml(CurrentColor));
        else if (CurrentIcon.Length > 0 && File.Exists(CurrentIcon)) { using var CustomIcon = new Icon(CurrentIcon, new Size(64, 64)); Preview = CustomIcon.ToBitmap(); }
        else Preview = BrandingService.DrawBadge(new InstanceProfile { Badge = BadgeInput.Text.Length == 0 ? "C" : BadgeInput.Text, ColorHex = CurrentColor }, 64);
        IconPreview.Image = Preview;
        HeaderBadge.Image = new Bitmap(Preview);
        Previous?.Dispose();
        HeaderPrevious?.Dispose();
        ColorButton.BackColor = ColorTranslator.FromHtml(CurrentColor);
        ColorButton.ForeColor = Color.White;
        ColorButton.Invalidate();
    }

    private void CreateShortcut()
    {
        SaveSelected();
        if (PreviewOnly) throw new InvalidOperationException("预览模式不生成快捷方式");
        string PathValue = InstanceService.CreateShortcut(Selected!);
        SetStatus("已生成 " + PathValue);
    }

    private void EditConfig()
    {
        var Profile = Selected ?? throw new InvalidOperationException("请先选择 Codex 实例");
        string FilePath = Path.Combine(Profile.HomePath, "config.toml");
        if (!File.Exists(FilePath))
        {
            if (PreviewOnly) throw new InvalidOperationException("预览模式不创建 config.toml");
            Directory.CreateDirectory(Profile.HomePath);
            File.WriteAllText(FilePath, "");
        }
        var Info = new ProcessStartInfo("notepad.exe") { UseShellExecute = false };
        Info.ArgumentList.Add(FilePath);
        using var Editor = Process.Start(Info);
    }

    private static void OpenFolder(string PathValue)
    {
        if (!Directory.Exists(PathValue)) throw new DirectoryNotFoundException("目录尚不存在 " + PathValue);
        using var Explorer = Process.Start(new ProcessStartInfo("explorer.exe") { Arguments = "\"" + PathValue + "\"", UseShellExecute = true });
    }
    #endregion

    #region Instances
    public async Task LaunchAsync(InstanceProfile Profile)
    {
        AgentList.SelectedItem = AgentList.Items.Cast<AgentEntry>().Single(Item => Item.Profile == Profile);
        SaveSelected();
        if (PreviewOnly) throw new InvalidOperationException("预览模式不启动实例");
        SetStatus("正在启动 / 显示 " + Profile.Name + "…");
        int ProcessId = await Task.Run(() => InstanceService.Launch(Profile));
        SetStatus($"{Profile.Name} 已启动 / 显示  ·  进程 {ProcessId}");
        UpdateRunning(await Task.Run(InstanceService.ListRunning));
    }

    /// <summary>
    /// 恢复全部已运行实例的主窗口 不启动未运行实例
    /// </summary>
    private async Task ShowAllRunningAsync()
    {
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
        UpdateRunning(await Task.Run(InstanceService.ListRunning));
    }

    /// <summary>
    /// 确认所选名称与进程后结束实例 确认期间进程变化则拒绝执行
    /// </summary>
    private async Task StopSelectedAsync()
    {
        var Profile = Selected ?? throw new InvalidOperationException("请先选择 Codex 实例");
        var CurrentList = await Task.Run(InstanceService.ListRunning);
        var Running = InstanceService.Find(Profile, CurrentList);
        if (Running is null) { SetStatus(Profile.Name + " 未运行"); UpdateRunning(CurrentList); return; }
        if (MessageBox.Show(FindForm(), $"结束 {Profile.Name}\n进程 ID {Running.ProcessId}\n\n将结束此实例及其子进程 正在执行的任务会中断", "结束所选实例", MessageBoxButtons.OKCancel, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2) != DialogResult.OK) return;
        if (PreviewOnly) throw new InvalidOperationException("预览模式不结束实例");
        await InstanceService.StopAsync(Profile, Running.ProcessId);
        SetStatus(Profile.Name + " 已结束");
        UpdateRunning(await Task.Run(InstanceService.ListRunning));
    }

    private async Task ClearConversationsAsync(bool RemoveProjects)
    {
        if (IsBusy) return;
        var Profile = Selected ?? throw new InvalidOperationException("请先选择 Codex 实例");
        string ActionName = RemoveProjects ? "清空所有项目和会话" : "保留项目清空会话";
        string Scope = RemoveProjects ? "清空此实例的全部本地会话（含归档）及项目登记" : "清空此实例的全部本地会话（含归档），保留项目登记与排序";
        if (MessageBox.Show(FindForm(), $"所选实例：{Profile.Name}\n配置目录：{Profile.HomePath}\n\n{Scope}\n磁盘工程、账号、模型、Skills 和 MCP 配置保留\n\n请先退出所选 Codex 实例\n清理前会自动备份，失败时回滚\n\n确认继续？", ActionName, MessageBoxButtons.OKCancel, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2) != DialogResult.OK) return;
        if (PreviewOnly) throw new InvalidOperationException("预览模式不清理会话");
        var Owner = FindForm();
        IsBusy = true;
        if (Owner is not null) { Owner.Enabled = false; Owner.UseWaitCursor = true; }
        try
        {
            var Progress = new Progress<string>(SetStatus);
            string Backup = await Task.Run(() => ConversationCleanupService.Apply(Profile, RemoveProjects, ManagerPaths.BackupRoot, Progress));
            SetStatus(Profile.Name + " 已完成清理");
            MessageBox.Show(Owner, ActionName + "已完成\n\n备份目录\n" + Backup, "清理完成", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        finally
        {
            if (Owner is not null) { Owner.UseWaitCursor = false; Owner.Enabled = true; }
            IsBusy = false;
        }
    }

    private async Task SwitchCcAsync()
    {
        var Profile = Selected ?? throw new InvalidOperationException("请先选择 Codex 实例");
        if (MessageBox.Show(FindForm(), "将关闭并重新打开 CC Switch\n如果它仍驻留托盘 将结束该进程以应用设置\n使用其本地代理的请求可能中断\n\n新的 Codex 配置目录\n" + Profile.HomePath, "切换 CC Switch 目标", MessageBoxButtons.OKCancel, MessageBoxIcon.Information) != DialogResult.OK) return;
        if (PreviewOnly) throw new InvalidOperationException("预览模式不切换 CC Switch");
        await InstanceService.SwitchCcAsync(Profile);
        RefreshCcLabel();
        SetStatus("CC Switch 已指向 " + Profile.Name + "  请在 CC Switch 中选择供应商");
    }

    private void RefreshCcLabel() => Run(() => CcLabel.Text = "当前目录  " + InstanceService.ReadCcTarget());

    /// <summary>
    /// 健康检查覆盖所选实例或外部执行端的 CLI MCP Skill 与桥接
    /// </summary>
    private async Task ShowDoctorAsync()
    {
        var Entry = SelectedEntry ?? throw new InvalidOperationException("请先选择 Agent");
        SetStatus("正在检查 " + Entry.Title + " 的 CLI MCP Skill 路径与桌面桥接…");
        var Report = await AgentDoctor.RunAsync(Settings, AgentCliDeployment.LoadPath(), Entry.Id, Lifetime.Token);
        string Text = string.Join("\r\n\r\n", Report.CheckList.Select(Check => (Check.Passed ? "✓ " : "× ") + Check.Name + "\r\n" + Check.Detail));
        SetStatus(Entry.Title + (Report.Healthy ? " 健康检查通过" : " 健康检查存在未通过项"));
        StudioPrompt.View(FindForm(), Theme, "健康检查 · " + Entry.Title, Report.Healthy ? "全部检查通过" : "存在未通过项 请按详情处理", Text);
    }
    #endregion

    #region Shared
    private void ShowDialog(Form Dialog)
    {
        using (Dialog)
        {
            Theme.Apply(Dialog);
            Dialog.HandleCreated += (_, _) => Theme.ApplyTitleBar(Dialog);
            Dialog.ShowDialog(FindForm());
        }
    }

    public void SetStatus(string Value) => Status.Text = Value;

    private void Run(Action Execute)
    {
        try { Execute(); }
        catch (Exception Error) { ShowError(Error); }
    }

    private async Task RunAsync(Func<Task> Execute)
    {
        try { await Execute(); }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested) { }
        catch (Exception Error) { ShowError(Error); }
    }

    private void ShowError(Exception Error)
    {
        Program.LogError(Error);
        SetStatus(Error.Message);
        if (!IsDisposed) MessageBox.Show(FindForm(), Error.Message, "操作未完成", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing)
        {
            Lifetime.Cancel();
            Lifetime.Dispose();
            IconPreview.Image?.Dispose();
            HeaderBadge.Image?.Dispose();
        }
        base.Dispose(Disposing);
    }
    #endregion
}
