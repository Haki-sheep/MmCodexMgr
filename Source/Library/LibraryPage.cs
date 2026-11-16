using System.Diagnostics;

namespace CodexInstanceManager;

/// <summary>
/// Rule 与 Skill 看板 展示源目录与规则文件 支持查看 安装 导入与一键同步到所有实例
/// </summary>
public sealed class LibraryPage : UserControl
{
    public const string SyncAllText = "同步到所有实例";
    /// <summary> 实例及本机源目录配置 </summary>
    private readonly ManagerSettings Settings;
    /// <summary> 当前主题 </summary>
    private readonly AppTheme Theme;
    /// <summary> 预览模式禁止写入本机配置与实例 </summary>
    private readonly bool PreviewOnly;
    /// <summary> 技能名称与描述表格 </summary>
    private readonly DataGridView SkillGrid = StudioGrid.Create("SkillLibraryGrid");
    /// <summary> 全局规则目标表格 </summary>
    private readonly DataGridView RuleGrid = StudioGrid.Create("RuleTargetGrid");
    /// <summary> 技能来源选择 </summary>
    private readonly ThemeComboBox SkillView = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 168, Margin = new Padding(0, 5, 8, 0) };
    /// <summary> 技能搜索关键字 </summary>
    private readonly TextBox SearchInput = new() { Width = 220, PlaceholderText = "搜索名称或描述", Margin = new Padding(0, 6, 8, 0) };
    /// <summary> 维护源 Skill 根目录 </summary>
    private readonly Label LibraryPathLabel = PathLabel();
    /// <summary> 主实例 Skill 根目录 </summary>
    private readonly Label PrimaryPathLabel = PathLabel();
    /// <summary> 全局规则源文件 </summary>
    private readonly Label RulePathLabel = PathLabel();
    /// <summary> 规则文件修改时间 </summary>
    private readonly Label RuleInfoLabel = new() { AutoSize = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 0, 0, 6) };
    /// <summary> Skill 数量摘要 </summary>
    private readonly StudioChip SkillCountChip = new() { Tone = eTone.Accent };
    /// <summary> 操作结果 </summary>
    private readonly Label Status = new() { AutoSize = false, Dock = DockStyle.Fill, Height = 26, AutoEllipsis = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, TextAlign = ContentAlignment.MiddleLeft };
    /// <summary> 当前操作按钮集合 </summary>
    private readonly List<Button> ActionList = new();
    /// <summary> 当前技能集合 </summary>
    private List<SkillPackage> PackageList = new();
    /// <summary> 小窗口通过整页滚动保留列表阅读高度 </summary>
    private readonly WheelScrollPanel PageScroll = new() { Dock = DockStyle.Fill, AutoScroll = true };
    /// <summary> 目录与列表共用的纵向内容布局 </summary>
    private readonly TableLayoutPanel Content = new() { Dock = DockStyle.Top, ColumnCount = 1, RowCount = 4, Margin = Padding.Empty };
    /// <summary> 可拖动的 Skill 与 Rule 分隔区 </summary>
    private readonly SplitContainer Boards = new() { Dock = DockStyle.Fill, Orientation = Orientation.Horizontal, SplitterWidth = 8, Margin = Padding.Empty, Name = "LibraryBoards" };
    /// <summary> 布局调整期间禁止分隔比例回写 </summary>
    private bool RefreshingLayout;
    /// <summary> 等待当前布局完成后统一调整分隔区 </summary>
    private bool LayoutQueued;
    /// <summary> 用户选择的上方列表高度比例 </summary>
    private double SkillHeightRatio = .56;

    #region Layout
    public LibraryPage(ManagerSettings Settings, AppTheme Theme, bool PreviewOnly)
    {
        SuspendLayout();
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = StudioFonts.Body;
        this.Settings = Settings;
        this.Theme = Theme;
        this.PreviewOnly = PreviewOnly;
        Dock = DockStyle.Fill;
        Padding = new Padding(28, 22, 28, 12);
        Tag = eThemeRole.Background;
        Content.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Controls.Add(PageScroll);
        PageScroll.Controls.Add(Content);
        Content.Controls.Add(BuildHeader());
        Content.Controls.Add(BuildSources());
        Boards.Panel1.Controls.Add(BuildSkillCard());
        Boards.Panel2.Controls.Add(BuildRuleCard());
        Content.Controls.Add(Boards);
        Content.Controls.Add(Status);
        PageScroll.ClientSizeChanged += (_, _) => QueueBoardLayout();
        Content.Layout += (_, _) => QueueBoardLayout();
        Boards.SplitterMoved += (_, _) =>
        {
            if (!RefreshingLayout) SkillHeightRatio = (double)Boards.SplitterDistance / (Boards.Height - Boards.SplitterWidth);
        };
        Boards.AccessibleName = "上下拖动调整 Skills 与 Rule 列表高度";
        Boards.Paint += (_, Event) =>
        {
            var Bounds = Boards.SplitterRectangle;
            int Center = Bounds.Top + Bounds.Height / 2;
            int HalfWidth = LogicalToDeviceUnits(24);
            using var Pen = new Pen(Theme.Palette.Muted, LogicalToDeviceUnits(2));
            Event.Graphics.DrawLine(Pen, Bounds.Width / 2 - HalfWidth, Center, Bounds.Width / 2 + HalfWidth, Center);
        };
        SkillView.SelectedIndexChanged += (_, _) => Run(RefreshSkills);
        SearchInput.TextChanged += (_, _) => FillSkills();
        Load += (_, _) => Run(() => { RefreshSources(); RefreshSkills(); ScanRules(); });
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
        QueueBoardLayout();
    }

    private void QueueBoardLayout()
    {
        if (!IsHandleCreated || LayoutQueued || RefreshingLayout) return;
        LayoutQueued = true;
        BeginInvoke(() =>
        {
            LayoutQueued = false;
            RefreshBoardLayout();
        });
    }

    private void RefreshBoardLayout()
    {
        if (RefreshingLayout || !IsHandleCreated) return;
        RefreshingLayout = true;
        try
        {
            Boards.Panel1MinSize = 0;
            Boards.Panel2MinSize = 0;
            int SkillMinimum = MinimumBoardHeight(SkillGrid, 220);
            int RuleMinimum = MinimumBoardHeight(RuleGrid, 180);
            int OtherHeight = Content.Controls.Cast<Control>().Where(Item => Item != Boards).Sum(Item => Item.Height + Item.Margin.Vertical);
            Content.Height = Math.Max(PageScroll.ClientSize.Height, OtherHeight + SkillMinimum + RuleMinimum + Boards.SplitterWidth + LogicalToDeviceUnits(140));
            Content.PerformLayout();
            Boards.Panel1MinSize = SkillMinimum;
            Boards.Panel2MinSize = RuleMinimum;
            int Available = Boards.Height - Boards.SplitterWidth;
            Boards.SplitterDistance = Math.Clamp((int)(Available * SkillHeightRatio), SkillMinimum, Available - RuleMinimum);
        }
        finally { RefreshingLayout = false; }
        if (Boards.Panel1MinSize != MinimumBoardHeight(SkillGrid, 220) || Boards.Panel2MinSize != MinimumBoardHeight(RuleGrid, 180)) QueueBoardLayout();
    }

    private int MinimumBoardHeight(DataGridView Grid, int ReadingHeight)
    {
        var Card = Grid.Parent!.Parent!;
        return Grid.Top + Grid.Margin.Bottom + Card.Padding.Vertical + LogicalToDeviceUnits(ReadingHeight);
    }

    private Control BuildHeader()
    {
        var Header = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 2, Margin = new Padding(0, 0, 0, 14) };
        Header.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Header.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        var Titles = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.TopDown, WrapContents = false, Margin = Padding.Empty };
        Titles.Controls.Add(new Label { Text = "Rule + Skill", Font = StudioFonts.Title, AutoSize = true, Tag = eThemeRole.Title, Margin = new Padding(0, 0, 0, 2) });
        Titles.Controls.Add(new Label { Text = "维护 Skill 源目录与全局 Rule 文件  ·  同步前自动预检与备份 保留目标第三方包和 .system", Font = StudioFonts.Caption, AutoSize = true, Tag = eThemeRole.Muted, Margin = Padding.Empty });
        Header.Controls.Add(Titles, 0, 0);
        var SyncAll = Action(SyncAllText, SyncAllAsync, eButtonKind.Primary);
        SyncAll.Margin = new Padding(0, 8, 0, 0);
        Header.Controls.Add(SyncAll, 1, 0);
        return Header;
    }

    private Control BuildSources()
    {
        var Row = new TableLayoutPanel { Dock = DockStyle.Top, ColumnCount = 2, RowCount = 1, Margin = Padding.Empty };
        Row.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Row.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        Row.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        var SkillCard = StudioCard.Create("Skill 源目录", null, out var SkillBody);
        SkillCard.AutoSize = false;
        SkillCard.Margin = new Padding(0, 0, 7, 14);
        var SkillPaths = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, ColumnCount = 2, Margin = Padding.Empty };
        SkillPaths.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        SkillPaths.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        SkillPaths.Controls.Add(Caption("维护源"));
        SkillPaths.Controls.Add(LibraryPathLabel);
        SkillPaths.Controls.Add(Caption("主实例"));
        SkillPaths.Controls.Add(PrimaryPathLabel);
        SkillBody.Controls.Add(SkillPaths);
        var SkillActions = Flow();
        SkillActions.Controls.Add(Action("打开维护源", () => OpenFolder(Settings.Library.SkillSource)));
        SkillActions.Controls.Add(Action("打开主实例目录", () => OpenFolder(PrimarySkillRoot())));
        SkillActions.Controls.Add(Action("更换维护源", ChooseSkillSource, eButtonKind.Ghost));
        SkillBody.Controls.Add(SkillActions);
        Row.Controls.Add(SkillCard, 0, 0);
        var RuleCard = StudioCard.Create("全局 Rule 文件", null, out var RuleBody);
        RuleCard.AutoSize = false;
        RuleCard.Margin = new Padding(7, 0, 0, 14);
        RuleBody.Controls.Add(Caption("源文件"));
        RuleBody.Controls.Add(RulePathLabel);
        RuleBody.Controls.Add(RuleInfoLabel);
        var RuleActions = Flow();
        RuleActions.Controls.Add(Action("打开文件", () => OpenFile(Settings.Library.RuleSource)));
        RuleActions.Controls.Add(Action("打开所在目录", () => OpenFolder(Path.GetDirectoryName(Settings.Library.RuleSource) ?? "")));
        RuleActions.Controls.Add(Action("查看内容", () => ViewFile(Settings.Library.RuleSource, "全局 Rule 源文件")));
        RuleActions.Controls.Add(Action("更换文件", ChooseRuleSource, eButtonKind.Ghost));
        RuleBody.Controls.Add(RuleActions);
        Row.Controls.Add(RuleCard, 1, 0);
        Row.Layout += (_, _) =>
        {
            int SkillHeight = SkillBody.GetPreferredSize(new Size(SkillBody.Width, 0)).Height + SkillCard.Padding.Vertical + SkillCard.Margin.Vertical;
            int RuleHeight = RuleBody.GetPreferredSize(new Size(RuleBody.Width, 0)).Height + RuleCard.Padding.Vertical + RuleCard.Margin.Vertical;
            int Height = Math.Max(SkillHeight, RuleHeight);
            if (Row.Height != Height) Row.Height = Height;
        };
        return Row;
    }

    private Control BuildSkillCard()
    {
        var Card = new StudioCard { Dock = DockStyle.Fill, Margin = Padding.Empty };
        var Body = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Margin = Padding.Empty };
        Body.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Body.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Body.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var Title = Flow();
        Title.Controls.Add(new Label { Text = "Skills", Font = StudioFonts.Section, AutoSize = true, Tag = eThemeRole.Title, Margin = new Padding(0, 6, 10, 0) });
        Title.Controls.Add(SkillCountChip);
        SkillView.Items.AddRange(new object[] { "主实例 Skills", "维护源库 Skills" });
        SkillView.SelectedIndex = 0;
        Title.Controls.Add(SkillView);
        Title.Controls.Add(SearchInput);
        Title.Controls.Add(Action("刷新", RefreshSkills, eButtonKind.Ghost));
        Body.Controls.Add(Title);
        var Toolbar = Flow();
        Toolbar.Controls.Add(Action("查看 SKILL.md", () => ViewFile(SkillFile(SelectedPackage()), SelectedPackage().Name)));
        Toolbar.Controls.Add(Action("打开目录", () => OpenFolder(SelectedPackage().DirectoryPath)));
        Toolbar.Controls.Add(Action("安装到主实例", InstallAsync));
        Toolbar.Controls.Add(Action("安装整库", InstallLibraryAsync));
        Toolbar.Controls.Add(Action("分发到单个 Agent", DistributeSkillsAsync));
        Toolbar.Controls.Add(Action("导入 Skill", ImportSkillAsync));
        Toolbar.Controls.Add(Action("排除项", EditExclusions, eButtonKind.Ghost));
        Body.Controls.Add(Toolbar);
        SkillGrid.CellBorderStyle = DataGridViewCellBorderStyle.Single;
        SkillGrid.Columns.Add("name", "name");
        SkillGrid.Columns[0].FillWeight = 28;
        SkillGrid.Columns.Add("des", "des");
        SkillGrid.Columns[1].FillWeight = 72;
        SkillGrid.DefaultCellStyle.WrapMode = DataGridViewTriState.True;
        SkillGrid.AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.AllCells;
        SkillGrid.CellDoubleClick += (_, Event) => { if (Event.RowIndex >= 0) Run(() => ViewFile(SkillFile(SelectedPackage()), SelectedPackage().Name)); };
        Body.Controls.Add(SkillGrid);
        Card.Controls.Add(Body);
        return Card;
    }

    private Control BuildRuleCard()
    {
        var Card = new StudioCard { Dock = DockStyle.Fill, Margin = Padding.Empty };
        var Body = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Margin = Padding.Empty };
        Body.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Body.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var Toolbar = Flow();
        Toolbar.Controls.Add(new Label { Text = "Rule 目标", Font = StudioFonts.Section, AutoSize = true, Tag = eThemeRole.Title, Margin = new Padding(0, 6, 12, 0) });
        Toolbar.Controls.Add(Action("扫描目标", ScanRules, eButtonKind.Ghost));
        Toolbar.Controls.Add(Action("查看目标内容", () => { var Target = SelectedTarget(); ViewFile(Target.PathValue, Target.Agent); }));
        Toolbar.Controls.Add(Action("打开目标文件", () => OpenFile(SelectedTarget().PathValue)));
        Toolbar.Controls.Add(Action("复制源规则", () => { Clipboard.SetText(File.ReadAllText(Settings.Library.RuleSource)); Status.Text = "已复制 可在 WorkBuddy 等软件的全局规则设置中粘贴"; }));
        Toolbar.Controls.Add(Action("预览并同步所选", SyncRulesAsync, eButtonKind.Primary));
        Body.Controls.Add(Toolbar);
        RuleGrid.ReadOnly = false;
        RuleGrid.Columns.Add(new DataGridViewCheckBoxColumn { Name = "selected", HeaderText = "同步", FillWeight = 9 });
        RuleGrid.Columns.Add("agent", "Agent");
        RuleGrid.Columns[1].FillWeight = 24;
        RuleGrid.Columns.Add("state", "状态 / 路径");
        RuleGrid.Columns[2].FillWeight = 67;
        RuleGrid.Columns[1].ReadOnly = true;
        RuleGrid.Columns[2].ReadOnly = true;
        RuleGrid.CellValueChanged += (_, _) => Status.Text = "选择目标后预览差异 再执行同步";
        RuleGrid.CurrentCellDirtyStateChanged += (_, _) => { if (RuleGrid.IsCurrentCellDirty) RuleGrid.CommitEdit(DataGridViewDataErrorContexts.Commit); };
        Body.Controls.Add(RuleGrid);
        Card.Controls.Add(Body);
        return Card;
    }

    private static Label PathLabel() => new() { AutoSize = false, AutoEllipsis = true, Dock = DockStyle.Fill, Height = 24, Font = StudioFonts.Mono, Margin = new Padding(0, 0, 0, 6) };

    private static Label Caption(string Text) => new() { Text = Text, AutoSize = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 2, 0, 2) };

    private static FlowLayoutPanel Flow() => new() { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = Padding.Empty };

    private Button Action(string Text, Action Execute, eButtonKind Kind = eButtonKind.Secondary)
    {
        var Button = new StudioButton { Text = Text, Kind = Kind };
        Button.Click += (_, _) => Run(Execute);
        ActionList.Add(Button);
        return Button;
    }

    private Button Action(string Text, Func<Task> Execute, eButtonKind Kind = eButtonKind.Secondary)
    {
        var Button = new StudioButton { Text = Text, Kind = Kind };
        Button.Click += async (_, _) =>
        {
            foreach (var Item in ActionList) Item.Enabled = false;
            try { await Execute(); }
            catch (Exception Error) { ShowError(Error); }
            finally { foreach (var Item in ActionList) Item.Enabled = true; }
        };
        ActionList.Add(Button);
        return Button;
    }
    #endregion

    #region Sources
    private InstanceProfile PrimaryProfile() => Settings.InstanceList.Single(Item => Item.IsPrimary);
    private string PrimarySkillRoot() => Path.Combine(PrimaryProfile().HomePath, "skills");
    private string CurrentSkillRoot() => SkillView.SelectedIndex == 0 ? PrimarySkillRoot() : Settings.Library.SkillSource;
    private static string SkillFile(SkillPackage Package) => Path.Combine(Package.DirectoryPath, "SKILL.md");
    private SkillPackage SelectedPackage() => SkillGrid.CurrentRow?.Tag as SkillPackage ?? throw new InvalidOperationException("请先选择一个 Skill");
    private RuleTarget SelectedTarget() => RuleGrid.CurrentRow?.Tag as RuleTarget ?? throw new InvalidOperationException("请先选择一个 Rule 目标");

    private void RefreshSources()
    {
        LibraryPathLabel.Text = Settings.Library.SkillSource;
        PrimaryPathLabel.Text = Settings.InstanceList.Any(Item => Item.IsPrimary) ? PrimarySkillRoot() : "未登记主实例";
        RulePathLabel.Text = Settings.Library.RuleSource;
        RuleInfoLabel.Text = File.Exists(Settings.Library.RuleSource) ? "最后修改 " + File.GetLastWriteTime(Settings.Library.RuleSource).ToString("yyyy-MM-dd HH:mm") : "文件尚不存在";
    }

    private void ChooseSkillSource()
    {
        using var Dialog = new FolderBrowserDialog { Description = "选择维护 Skill 的源目录", SelectedPath = Settings.Library.SkillSource, UseDescriptionForTitle = true };
        if (Dialog.ShowDialog(FindForm()) != DialogResult.OK) return;
        SkillMirror.Scan(Dialog.SelectedPath);
        Settings.Library.SkillSource = Dialog.SelectedPath;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        RefreshSources();
        SkillView.SelectedIndex = 1;
        RefreshSkills();
    }

    private void ChooseRuleSource()
    {
        using var Dialog = new OpenFileDialog { Filter = "Markdown|*.md|所有文件|*.*", FileName = Settings.Library.RuleSource };
        if (Dialog.ShowDialog(FindForm()) != DialogResult.OK) return;
        Settings.Library.RuleSource = Dialog.FileName;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        RefreshSources();
        ScanRules();
    }
    #endregion

    #region Skills
    private void RefreshSkills()
    {
        string Root = CurrentSkillRoot();
        PackageList = SkillMirror.Scan(Root, Settings.Library.ExcludedNameList);
        FillSkills();
    }

    private void FillSkills()
    {
        string Keyword = SearchInput.Text.Trim();
        SkillGrid.Rows.Clear();
        int Total = 0;
        foreach (var Group in PackageList.GroupBy(Item => Item.Name, StringComparer.OrdinalIgnoreCase))
        {
            Total++;
            var Package = Group.FirstOrDefault(Item => string.Equals(Path.GetFileName(Item.DirectoryPath), Item.Name, StringComparison.OrdinalIgnoreCase)) ?? Group.First();
            if (Keyword.Length != 0 && !Package.Name.Contains(Keyword, StringComparison.OrdinalIgnoreCase) && !Package.Description.Contains(Keyword, StringComparison.OrdinalIgnoreCase)) continue;
            int Row = SkillGrid.Rows.Add(Package.Name, Package.Description);
            SkillGrid.Rows[Row].Tag = Package;
            SkillGrid.Rows[Row].Cells[0].ToolTipText = string.Join(Environment.NewLine, Group.Select(Item => Item.DirectoryPath));
        }
        SkillCountChip.Text = Keyword.Length == 0 ? Total + " 个 Skill" : SkillGrid.RowCount + " / " + Total + " 个匹配";
        Status.Text = $"{Total} 个 Skill  ·  {PackageList.Count - Total} 个重复目录  ·  {CurrentSkillRoot()}";
    }

    private async Task InstallAsync()
    {
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入技能");
        var Package = SelectedPackage();
        string Root = PrimarySkillRoot();
        var Plan = await Task.Run(() => SkillMirror.Preview(Root, Root, Package, Settings.Library.ExcludedNameList));
        if (!Plan.HasChanges) { Status.Text = "主实例 Skill 已一致"; return; }
        if (MessageBox.Show(FindForm(), "安装 " + Package.Name + " 到主实例\n来源 " + Package.DirectoryPath + "\n同时规范主实例重复目录并移除已排除 Skill 原内容先备份", "安装预览", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        string Backup = Path.Combine(ManagerPaths.BackupRoot, "skill-install-" + Guid.NewGuid().ToString("N"));
        await Task.Run(() => SkillMirror.Apply(Plan, Backup));
        RefreshSkills();
        Status.Text = "已安装 新对话可用 备份 " + Backup;
    }

    private async Task InstallLibraryAsync()
    {
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入技能");
        string Root = PrimarySkillRoot();
        var Plan = await Task.Run(() => SkillMirror.Preview(Settings.Library.SkillSource, Root, ExcludedNameList: Settings.Library.ExcludedNameList));
        if (!Plan.HasChanges) { Status.Text = "主实例与维护源库已一致"; return; }
        string Names = string.Join("\n", Plan.PackageList.Select(Item => Item.Name));
        if (MessageBox.Show(FindForm(), "将主实例自定义 Skill 替换为维护源库的完整集合\n目标多余条目会移入备份 .system 保留\n来源 " + Settings.Library.SkillSource + "\n\n" + Names, "安装整库预览", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        string Backup = Path.Combine(ManagerPaths.BackupRoot, "library-install-" + Guid.NewGuid().ToString("N"));
        await Task.Run(() => SkillMirror.Apply(Plan, Backup));
        RefreshSkills();
        Status.Text = "主实例已按源库镜像 可继续同步到所有实例 备份 " + Backup;
    }

    private async Task ImportSkillAsync()
    {
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入源库");
        using var Dialog = new FolderBrowserDialog { Description = "选择包含 SKILL.md 的技能包目录 支持库外任意 Skill", UseDescriptionForTitle = true };
        if (Dialog.ShowDialog(FindForm()) != DialogResult.OK) return;
        var Package = SkillMirror.ReadPackage(Dialog.SelectedPath);
        string Root = Settings.Library.SkillSource;
        if (MessageBox.Show(FindForm(), "导入 " + Package.Name + "\n来源 " + Package.DirectoryPath + "\n维护源库 " + Root + "\n同名包替换并备份 其他包保留 导入不修改实例安装", "导入预览", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        Directory.CreateDirectory(Root);
        var Plan = await Task.Run(() => SkillMirror.Preview(Root, Root, Package, Settings.Library.ExcludedNameList));
        string Backup = Path.Combine(ManagerPaths.BackupRoot, "library-import-" + Guid.NewGuid().ToString("N"));
        await Task.Run(() => SkillMirror.Apply(Plan, Backup));
        SkillView.SelectedIndex = 1;
        RefreshSkills();
        Status.Text = "已导入维护源库 可另行安装或同步到所有实例 备份 " + Backup;
    }

    private async Task DistributeSkillsAsync()
    {
        using var Dialog = new DistributeDialog(SkillDistribution.Scan());
        if (Dialog.ShowThemed(FindForm(), Theme) != DialogResult.OK) return;
        var Selected = Dialog.Selected;
        var Plan = await Task.Run(() => SkillDistribution.Preview(CurrentSkillRoot(), Selected, Settings.Library.ExcludedNameList));
        if (!Plan.HasChanges) { Status.Text = "目标 Skill 已一致"; return; }
        string Names = string.Join("\n", Plan.PackageList.Select(Item => Item.Name));
        if (MessageBox.Show(FindForm(), "来源 " + Plan.SourceRoot + "\n目标 " + Plan.Target.PathValue + "\n\n" + Names + "\n\n覆盖目标同名技能并清理对应旧别名 共 " + Plan.ReplacedList.Count + " 项\n原内容先备份 其他技能和 .system 保留 Skill 所需工具仍须在目标环境可用", "Skill 分发预览", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入技能");
        string Backup = Path.Combine(ManagerPaths.BackupRoot, "agent-skills-" + Guid.NewGuid().ToString("N"));
        await Task.Run(() => SkillDistribution.Apply(Plan, Backup));
        Status.Text = "已同步到 " + Selected.Agent + " 请刷新目标技能列表或开启新会话 备份 " + Backup;
    }

    private void EditExclusions()
    {
        string? Value = StudioPrompt.Text(FindForm(), Theme, "本机 Skill 排除项", "每行一个 SKILL.md 的 name 仅保存在本机\n新用户默认不排除任何 Skill 清空即可恢复收录", string.Join(Environment.NewLine, Settings.Library.ExcludedNameList), true, true);
        if (Value is null) return;
        Settings.Library.ExcludedNameList = Value.Split('\n').Select(Item => Item.Trim()).Where(Item => Item.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (!PreviewOnly) SettingsStore.Save(Settings);
        RefreshSkills();
    }
    #endregion

    #region Rules
    private void ScanRules()
    {
        var TargetList = GlobalRules.Scan(Settings);
        RuleGrid.Rows.Clear();
        foreach (var Target in TargetList)
        {
            string State = Target.Format == "manual" ? Target.Note : !Target.Available ? "未发现配置目录" : File.Exists(Target.PathValue) ? "已发现" : "待创建";
            int Row = RuleGrid.Rows.Add(Target.Available && Target.Format != "manual", Target.Agent, State + "  ·  " + Target.PathValue);
            RuleGrid.Rows[Row].Tag = Target;
            RuleGrid.Rows[Row].Cells[0].ReadOnly = !Target.Available || Target.Format == "manual";
            RuleGrid.Rows[Row].Cells[2].ToolTipText = Target.Note;
        }
        Status.Text = "扫描完成 仅同步勾选文件 保留软件内其他规则";
    }

    private async Task SyncRulesAsync()
    {
        var SelectedList = RuleGrid.Rows.Cast<DataGridViewRow>().Where(Row => Row.Cells[0].Value is true).Select(Row => (RuleTarget)Row.Tag!).ToList();
        if (SelectedList.Count == 0) throw new InvalidOperationException("请勾选同步目标");
        var Plan = await Task.Run(() => GlobalRules.Preview(Settings.Library.RuleSource, SelectedList));
        if (Plan.ChangeList.Count == 0) { Status.Text = "所选规则已一致"; return; }
        using var Dialog = new RulePreviewDialog(Plan);
        Theme.Apply(Dialog);
        if (Dialog.ShowDialog(FindForm()) != DialogResult.OK) return;
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入规则");
        string Backup = await Task.Run(() => GlobalRules.Apply(Plan, ManagerPaths.BackupRoot));
        ScanRules();
        Status.Text = "同步完成 新对话加载 备份 " + Backup;
    }
    #endregion

    #region Sync all
    /// <summary>
    /// 调用 LibrarySyncAll 一次完成预检 备份与写入 逐项展示真实结果
    /// </summary>
    private async Task SyncAllAsync()
    {
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入实例或 Agent");
        string Source = SkillView.SelectedIndex == 0 ? "primary" : "library";
        Status.Text = "正在预检并同步到所有实例…";
        var Result = await Task.Run(() => LibrarySyncAll.Sync(Settings, Source, "all"));
        Status.Text = LibrarySyncResultDialog.Summary(Result);
        using (var Dialog = new LibrarySyncResultDialog(Result, Theme)) Dialog.ShowThemed(FindForm(), Theme);
        RefreshSkills();
        ScanRules();
    }
    #endregion

    #region Shared
    private void ViewFile(string PathValue, string Title)
    {
        if (!File.Exists(PathValue)) throw new FileNotFoundException("文件尚不存在", PathValue);
        StudioPrompt.View(FindForm(), Theme, Title, PathValue, File.ReadAllText(PathValue));
    }

    private static void OpenFile(string PathValue)
    {
        if (!File.Exists(PathValue)) throw new FileNotFoundException("文件尚不存在", PathValue);
        using var Launch = Process.Start(new ProcessStartInfo(PathValue) { UseShellExecute = true });
    }

    private static void OpenFolder(string PathValue)
    {
        if (!Directory.Exists(PathValue)) throw new DirectoryNotFoundException("目录尚不存在 " + PathValue);
        using var Explorer = Process.Start(new ProcessStartInfo("explorer.exe") { Arguments = "\"" + PathValue + "\"", UseShellExecute = true });
    }

    private void Run(Action Execute) { try { Execute(); } catch (Exception Error) when (!PreviewOnly) { ShowError(Error); } }

    private void ShowError(Exception Error)
    {
        Program.LogError(Error);
        Status.Text = Error.Message;
        MessageBox.Show(FindForm(), Error.Message, "Rule + Skill", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
    #endregion

    private sealed class DistributeDialog : StudioDialog
    {
        /// <summary> 分发目标选择 </summary>
        private readonly ThemeComboBox Choice = new() { Dock = DockStyle.Top, DropDownStyle = ComboBoxStyle.DropDownList, DisplayMember = nameof(SkillTarget.Agent) };
        public SkillTarget Selected => (SkillTarget)Choice.SelectedItem!;

        public DistributeDialog(List<SkillTarget> TargetList) : base("分发到单个 Agent", new Size(700, 230))
        {
            Content.RowCount = 2;
            Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            Content.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            var Hint = new StudioWrapLabel { Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 10, 0, 0) };
            Choice.Items.AddRange(TargetList.Cast<object>().ToArray());
            Choice.SelectedIndexChanged += (_, _) =>
            {
                var Target = Selected;
                Hint.Text = Target.PathValue + "\n" + (!Target.Available ? "未发现配置目录 请先安装或启动目标软件"
                    : Target.Agent == "shared" ? "Cursor 与 DSH 的共享目录"
                    : "同名技能覆盖前备份 目标独有的技能保留");
            };
            Content.Controls.Add(Choice);
            Content.Controls.Add(Hint);
            Choice.SelectedIndex = 0;
            AddAction("预览同步", eButtonKind.Primary, (_, _) => DialogResult = DialogResult.OK);
            AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
        }
    }
}

/// <summary>
/// 一键同步结果 逐目标展示状态 备份与详情 不把跳过或失败归为成功
/// </summary>
public sealed class LibrarySyncResultDialog : StudioDialog
{
    public LibrarySyncResultDialog(LibrarySyncResult Result, AppTheme Theme) : base("同步到所有实例 · 结果", new Size(1040, 600))
    {
        MaximizeBox = true;
        Content.RowCount = 3;
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var Header = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, WrapContents = true, Margin = Padding.Empty };
        Header.Controls.Add(new StudioChip { Text = Result.Succeeded ? "无失败目标" : "存在失败或阻塞", Tone = Result.Succeeded ? eTone.Success : eTone.Danger });
        Header.Controls.Add(new Label { Text = Summary(Result), AutoSize = true, Margin = new Padding(4, 7, 0, 0) });
        Content.Controls.Add(Header);
        Content.Controls.Add(new StudioWrapLabel { Text = "Skill 来源  " + Result.SkillSource + "\nRule 来源  " + Result.RuleSource + "\n范围  " + Result.Scope, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 6, 0, 8) });
        var Grid = StudioGrid.Create("LibrarySyncResultGrid");
        Grid.Columns.Add("target", "目标");
        Grid.Columns.Add("kind", "类型");
        Grid.Columns.Add("status", "状态");
        Grid.Columns.Add("path", "路径");
        Grid.Columns.Add("backup", "备份");
        Grid.Columns.Add("detail", "详情");
        Grid.Columns[0].FillWeight = 16;
        Grid.Columns[1].FillWeight = 7;
        Grid.Columns[2].FillWeight = 12;
        Grid.Columns[3].FillWeight = 26;
        Grid.Columns[4].FillWeight = 18;
        Grid.Columns[5].FillWeight = 21;
        Grid.DefaultCellStyle.WrapMode = DataGridViewTriState.True;
        Grid.AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.AllCells;
        foreach (var Item in Result.TargetList)
        {
            int Row = Grid.Rows.Add(Item.Target, Item.Kind == "rule" ? "Rule" : "Skill", StatusText(Item.Status), Item.PathValue, Item.BackupPath ?? "", Item.Detail ?? "");
            Grid.Rows[Row].Tag = Item;
        }
        Grid.CellFormatting += (_, Event) =>
        {
            if (Event.ColumnIndex != 2 || Event.RowIndex < 0 || Grid.Rows[Event.RowIndex].Tag is not LibrarySyncTargetResult Item || Event.CellStyle is null) return;
            Event.CellStyle.ForeColor = Theme.Palette.Tone(StatusTone(Item.Status)).Fore;
            Event.CellStyle.SelectionForeColor = Event.CellStyle.ForeColor;
        };
        Content.Controls.Add(Grid);
        var BackupRoot = Result.TargetList.Select(Item => Item.BackupPath).FirstOrDefault(Item => !string.IsNullOrEmpty(Item));
        AddAction("关闭", eButtonKind.Primary, (_, _) => DialogResult = DialogResult.Cancel);
        if (BackupRoot is not null)
            AddAction("打开备份目录", eButtonKind.Secondary, (_, _) =>
            {
                string Folder = Path.GetDirectoryName(BackupRoot) ?? BackupRoot;
                if (Directory.Exists(Folder)) { using var Explorer = Process.Start(new ProcessStartInfo("explorer.exe") { Arguments = "\"" + Folder + "\"", UseShellExecute = true }); }
            });
    }

    public static string Summary(LibrarySyncResult Result)
    {
        int Count(params string[] StatusList) => Result.TargetList.Count(Item => StatusList.Contains(Item.Status));
        return $"写入 {Count("applied")}  ·  已一致 {Count("unchanged")}  ·  跳过 {Count("unavailable", "source", "duplicate")}  ·  失败 {Count("failed")}  ·  未执行 {Count("blocked", "pending")}  ·  共 {Result.TargetList.Count} 项";
    }

    public static string StatusText(string Status) => Status switch
    {
        "applied" => "已写入",
        "unchanged" => "已一致",
        "unavailable" => "跳过 · 未发现目录",
        "source" => "跳过 · 同步源",
        "duplicate" => "跳过 · 重复路径",
        "failed" => "失败",
        "blocked" => "未执行 · 已阻塞",
        "pending" => "未处理",
        _ => Status
    };

    private static eTone StatusTone(string Status) => Status switch
    {
        "applied" => eTone.Success,
        "unchanged" => eTone.Accent,
        "failed" => eTone.Danger,
        "blocked" or "pending" => eTone.Warning,
        _ => eTone.Neutral
    };
}
