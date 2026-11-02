using System.Diagnostics;

namespace CodexInstanceManager;

public sealed class LibraryPage : UserControl
{
    /// <summary> 实例及本机源目录配置 </summary>
    private readonly ManagerSettings Settings;
    /// <summary> 当前主题 </summary>
    private readonly AppTheme Theme;
    /// <summary> 预览模式禁止保存本机配置 </summary>
    private readonly bool PreviewOnly;
    /// <summary> 技能名称与描述表格 </summary>
    private readonly DataGridView SkillGrid = MakeGrid();
    /// <summary> 全局规则目标表格 </summary>
    private readonly DataGridView RuleGrid = MakeGrid();
    /// <summary> 技能来源选择 </summary>
    private readonly ThemeComboBox SkillView = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 145 };
    /// <summary> 规则唯一源文件 </summary>
    private readonly TextBox RuleSource = new() { Dock = DockStyle.Fill, ReadOnly = true };
    /// <summary> 操作结果 </summary>
    private readonly Label Status = new() { AutoSize = true, ForeColor = Color.DimGray, Dock = DockStyle.Fill };
    /// <summary> 当前操作按钮集合 </summary>
    private readonly List<Button> ActionList = new();
    /// <summary> 扫描结果 </summary>
    private List<RuleTarget> TargetList = new();
    /// <summary> 当前技能集合 </summary>
    private List<SkillPackage> PackageList = new();

    #region Layout
    public LibraryPage(ManagerSettings Settings, AppTheme Theme, bool PreviewOnly)
    {
        SuspendLayout();
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = new Font("Microsoft YaHei UI", 10);
        this.Settings = Settings;
        this.Theme = Theme;
        this.PreviewOnly = PreviewOnly;
        Dock = DockStyle.Fill;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(24, 20, 24, 12), ColumnCount = 1, RowCount = 7 };
        foreach (var Style in new[] { new RowStyle(SizeType.Absolute, 58), new RowStyle(SizeType.AutoSize), new RowStyle(SizeType.Percent, 52), new RowStyle(SizeType.Absolute, 54), new RowStyle(SizeType.Absolute, 42), new RowStyle(SizeType.Percent, 48), new RowStyle(SizeType.Absolute, 32) }) Root.RowStyles.Add(Style);
        Controls.Add(Root);
        var Header = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false };
        Header.Controls.Add(new Label { Text = "规则与技能库", Font = new Font(Font.FontFamily, 20, FontStyle.Bold), AutoSize = true, Margin = new Padding(0, 0, 24, 0) });
        Header.Controls.Add(Action("选择仓库", ChooseRepository));
        Header.Controls.Add(Action("拉取库", async () => { if (PreviewOnly) throw new InvalidOperationException("预览模式不操作 Git"); Status.Text = await LibraryGit.PullAsync(Settings.Library.RepositoryPath); RefreshSkills(); }));
        Header.Controls.Add(Action("发布到 Git", PublishAsync));
        Header.Controls.Add(Action("采用 Git 库", UseGitLibrary));
        Root.Controls.Add(Header);
        var SkillActions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true };
        SkillView.Items.AddRange(new object[] { "主实例 Skills", "维护源库 Skills" });
        SkillView.SelectedIndex = 0;
        SkillActions.Controls.Add(SkillView);
        SkillActions.Controls.Add(Action("刷新", RefreshSkills));
        SkillActions.Controls.Add(Action("打开 SKILL.md", () => OpenFile(SelectedPackage().DirectoryPath + Path.DirectorySeparatorChar + "SKILL.md")));
        SkillActions.Controls.Add(Action("选择源库", ChooseSkillSource));
        SkillActions.Controls.Add(Action("安装到主实例", async () => await InstallAsync()));
        SkillActions.Controls.Add(Action("安装整库", InstallLibraryAsync));
        SkillActions.Controls.Add(Action("同步到 Agent", DistributeSkillsAsync));
        SkillActions.Controls.Add(Action("导入 Skill", ImportSkillAsync));
        SkillActions.Controls.Add(Action("排除项", EditExclusions));
        Root.Controls.Add(SkillActions);
        SkillGrid.Columns.Add("name", "name");
        SkillGrid.Columns[0].FillWeight = 28;
        SkillGrid.Columns.Add("des", "des");
        SkillGrid.Columns[1].FillWeight = 72;
        SkillGrid.DefaultCellStyle.WrapMode = DataGridViewTriState.True;
        SkillGrid.AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.AllCells;
        Root.Controls.Add(SkillGrid);
        var RuleHeader = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 3, RowCount = 1, Padding = new Padding(0, 10, 0, 0) };
        RuleHeader.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 92));
        RuleHeader.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        RuleHeader.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 112));
        RuleHeader.Controls.Add(new Label { Text = "全局 Rule", AutoSize = true, Font = new Font(Font, FontStyle.Bold), Margin = new Padding(0, 6, 0, 0) });
        RuleSource.Text = Settings.Library.RuleSource;
        RuleHeader.Controls.Add(RuleSource);
        RuleHeader.Controls.Add(Action("选择源文件", ChooseRuleSource));
        Root.Controls.Add(RuleHeader);
        var RuleActions = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false };
        RuleActions.Controls.Add(Action("打开源 MD", () => OpenFile(Settings.Library.RuleSource)));
        RuleActions.Controls.Add(Action("扫描全局 Rule", ScanRules));
        RuleActions.Controls.Add(Action("打开目标 MD", OpenTarget));
        RuleActions.Controls.Add(Action("预览并同步", async () => await SyncRulesAsync(), true));
        RuleActions.Controls.Add(Action("复制源规则", () => { Clipboard.SetText(File.ReadAllText(Settings.Library.RuleSource)); Status.Text = "已复制 可在 WorkBuddy 等软件的全局规则设置中粘贴"; }));
        Root.Controls.Add(RuleActions);
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
        Root.Controls.Add(RuleGrid);
        Root.Controls.Add(Status);
        SkillView.SelectedIndexChanged += (_, _) => Run(RefreshSkills);
        Load += (_, _) => Run(() => { RefreshSkills(); ScanRules(); });
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    private static DataGridView MakeGrid() => new() { Dock = DockStyle.Fill, ReadOnly = true, AllowUserToAddRows = false, AllowUserToDeleteRows = false, RowHeadersVisible = false, AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill, SelectionMode = DataGridViewSelectionMode.FullRowSelect, MultiSelect = false, BorderStyle = BorderStyle.None, CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal, ColumnHeadersHeight = 34, RowTemplate = { Height = 36 }, Margin = new Padding(0, 4, 0, 8) };

    private Button Action(string Text, Action Execute, bool Primary = false)
    {
        var Button = MainForm.MakeButton(Text, (_, _) => Run(Execute), Primary);
        ActionList.Add(Button);
        return Button;
    }

    private Button Action(string Text, Func<Task> Execute, bool Primary = false)
    {
        var Button = MainForm.MakeButton(Text, async (_, _) =>
        {
            foreach (var Item in ActionList) Item.Enabled = false;
            try { await Execute(); }
            catch (Exception Error) { ShowError(Error); }
            finally { foreach (var Item in ActionList) Item.Enabled = true; }
        }, Primary);
        ActionList.Add(Button);
        return Button;
    }
    #endregion

    #region Skills
    private InstanceProfile PrimaryProfile() => Settings.InstanceList.Single(Item => Item.IsPrimary);
    private SkillPackage SelectedPackage() => SkillGrid.CurrentRow?.Tag as SkillPackage ?? throw new InvalidOperationException("请先选择一个 Skill");

    private void RefreshSkills()
    {
        string Root = SkillView.SelectedIndex == 0 ? Path.Combine(PrimaryProfile().HomePath, "skills") : Settings.Library.SkillSource;
        PackageList = SkillMirror.Scan(Root, Settings.Library.ExcludedNameList);
        SkillGrid.Rows.Clear();
        foreach (var Group in PackageList.GroupBy(Item => Item.Name, StringComparer.OrdinalIgnoreCase))
        {
            var Package = Group.FirstOrDefault(Item => string.Equals(Path.GetFileName(Item.DirectoryPath), Item.Name, StringComparison.OrdinalIgnoreCase)) ?? Group.First();
            int Row = SkillGrid.Rows.Add(Package.Name, Package.Description);
            SkillGrid.Rows[Row].Tag = Package;
            SkillGrid.Rows[Row].Cells[0].ToolTipText = string.Join(Environment.NewLine, Group.Select(Item => Item.DirectoryPath));
        }
        Status.Text = $"{SkillGrid.RowCount} 个 Skill  ·  {PackageList.Count - SkillGrid.RowCount} 个重复目录  ·  {Root}";
    }

    private void ChooseSkillSource()
    {
        using var Dialog = new FolderBrowserDialog { Description = "选择维护 Skill 的源目录", SelectedPath = Settings.Library.SkillSource, UseDescriptionForTitle = true };
        if (Dialog.ShowDialog(this) != DialogResult.OK) return;
        SkillMirror.Scan(Dialog.SelectedPath);
        Settings.Library.SkillSource = Dialog.SelectedPath;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        SkillView.SelectedIndex = 1;
        RefreshSkills();
    }

    private void ChooseRepository()
    {
        using var Dialog = new FolderBrowserDialog { Description = "选择已克隆的 MmCodexMgr 或规则技能源库仓库", SelectedPath = Settings.Library.RepositoryPath, UseDescriptionForTitle = true };
        if (Dialog.ShowDialog(this) != DialogResult.OK) return;
        if (!Directory.Exists(Path.Combine(Dialog.SelectedPath, ".git")) && !File.Exists(Path.Combine(Dialog.SelectedPath, ".git"))) throw new IOException("所选目录不是 Git 仓库根目录");
        Settings.Library.RepositoryPath = Dialog.SelectedPath;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        Status.Text = "Git 仓库  " + Dialog.SelectedPath;
    }

    private void UseGitLibrary()
    {
        string Root = Path.Combine(Settings.Library.RepositoryPath, "Library");
        string RulePath = Path.Combine(Root, "Rule", "AI-global-rules.md");
        string SkillPath = Path.Combine(Root, "Skills");
        if (!File.Exists(RulePath)) throw new FileNotFoundException("Git 库尚无规则源文件 请先拉取或发布", RulePath);
        SkillMirror.Scan(SkillPath);
        Settings.Library.RuleSource = RulePath;
        Settings.Library.SkillSource = SkillPath;
        RuleSource.Text = RulePath;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        SkillView.SelectedIndex = 1;
        RefreshSkills();
        Status.Text = "已采用 Git 库作为维护源 安装与规则同步仍需预览";
    }

    private async Task PublishAsync()
    {
        if (PreviewOnly) throw new InvalidOperationException("预览模式不操作 Git");
        if (MessageBox.Show(this, "将所选维护源库与当前规则源保存到 Git 仓库的 Library 目录并提交推送\n技能来源 " + Settings.Library.SkillSource + "\n仓库 " + Settings.Library.RepositoryPath + "\n不要求安装到主实例 账号 对话和其他目录不收录", "发布源库", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        Status.Text = "正在收录并发布源库…";
        Status.Text = "已发布 " + await LibraryGit.PublishAsync(Settings);
    }

    private async Task InstallAsync()
    {
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入技能");
        var Package = SelectedPackage();
        string Root = Path.Combine(PrimaryProfile().HomePath, "skills");
        var Plan = await Task.Run(() => SkillMirror.Preview(Root, Root, Package, Settings.Library.ExcludedNameList));
        if (!Plan.HasChanges) { Status.Text = "主实例 Skill 已一致"; return; }
        if (MessageBox.Show(this, "安装 " + Package.Name + " 到主实例\n来源 " + Package.DirectoryPath + "\n同时规范主实例重复目录并移除已排除 Skill 原内容先备份", "安装预览", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        string Backup = Path.Combine(ManagerPaths.BackupRoot, "skill-install-" + Guid.NewGuid().ToString("N"));
        await Task.Run(() => SkillMirror.Apply(Plan, Backup));
        RefreshSkills();
        Status.Text = "已安装 新对话可用 备份 " + Backup;
    }

    private async Task InstallLibraryAsync()
    {
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入技能");
        string Root = Path.Combine(PrimaryProfile().HomePath, "skills");
        var Plan = await Task.Run(() => SkillMirror.Preview(Settings.Library.SkillSource, Root, ExcludedNameList: Settings.Library.ExcludedNameList));
        if (!Plan.HasChanges) { Status.Text = "主实例与维护源库已一致"; return; }
        string Names = string.Join("\n", Plan.PackageList.Select(Item => Item.Name));
        if (MessageBox.Show(this, "将主实例自定义 Skill 替换为维护源库的完整集合\n目标多余条目会移入备份 .system 保留\n来源 " + Settings.Library.SkillSource + "\n\n" + Names, "安装整库预览", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        string Backup = Path.Combine(ManagerPaths.BackupRoot, "library-install-" + Guid.NewGuid().ToString("N"));
        await Task.Run(() => SkillMirror.Apply(Plan, Backup));
        RefreshSkills();
        Status.Text = "主实例已按源库镜像 其他实例可在实例页继续同步 备份 " + Backup;
    }

    private async Task ImportSkillAsync()
    {
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入源库");
        using var Dialog = new FolderBrowserDialog { Description = "选择包含 SKILL.md 的技能包目录 支持库外任意 Skill", UseDescriptionForTitle = true };
        if (Dialog.ShowDialog(this) != DialogResult.OK) return;
        var Package = SkillMirror.ReadPackage(Dialog.SelectedPath);
        string Root = Settings.Library.SkillSource;
        if (MessageBox.Show(this, "导入 " + Package.Name + "\n来源 " + Package.DirectoryPath + "\n维护源库 " + Root + "\n同名包替换并备份 其他包保留 导入不修改实例安装", "导入预览", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        Directory.CreateDirectory(Root);
        var Plan = await Task.Run(() => SkillMirror.Preview(Root, Root, Package, Settings.Library.ExcludedNameList));
        string Backup = Path.Combine(ManagerPaths.BackupRoot, "library-import-" + Guid.NewGuid().ToString("N"));
        await Task.Run(() => SkillMirror.Apply(Plan, Backup));
        SkillView.SelectedIndex = 1;
        RefreshSkills();
        Status.Text = "已导入维护源库 可另行安装或发布到 Git 备份 " + Backup;
    }

    private async Task DistributeSkillsAsync()
    {
        using var Dialog = new Form { Text = "Skill 分发", Font = Font, AutoScaleDimensions = new SizeF(96, 96), AutoScaleMode = AutoScaleMode.Dpi, ClientSize = new Size(700, 190), StartPosition = FormStartPosition.CenterParent, MinimizeBox = false, MaximizeBox = false };
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Padding = new Padding(18) };
        Root.RowStyles.Add(new(SizeType.Absolute, 40));
        Root.RowStyles.Add(new(SizeType.Percent, 100));
        Root.RowStyles.Add(new(SizeType.Absolute, 46));
        var Choice = new ThemeComboBox { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList, DisplayMember = nameof(SkillTarget.Agent) };
        var TargetList = SkillDistribution.Scan();
        Choice.Items.AddRange(TargetList.Cast<object>().ToArray());
        Choice.SelectedIndex = 0;
        var Hint = new Label { Dock = DockStyle.Fill, AutoEllipsis = true };
        Choice.SelectedIndexChanged += (_, _) => { var Target = (SkillTarget)Choice.SelectedItem!; Hint.Text = Target.PathValue + "\n" + (Target.Available ? "shared 为 Cursor 与 DSH 的共享目录 同名覆盖前备份 第三方技能保留" : "未发现配置目录 请先安装或启动目标软件"); };
        Hint.Text = TargetList[0].PathValue + "\n选择目标后预览 不修改账号 Rule MCP 或项目";
        Root.Controls.Add(Choice);
        Root.Controls.Add(Hint);
        Root.Controls.Add(MainForm.MakeButton("预览同步", (_, _) => Dialog.DialogResult = DialogResult.OK, true));
        Dialog.Controls.Add(Root);
        Theme.Apply(Dialog);
        if (Dialog.ShowDialog(this) != DialogResult.OK) return;
        var Selected = (SkillTarget)Choice.SelectedItem!;
        string Source = SkillView.SelectedIndex == 0 ? Path.Combine(PrimaryProfile().HomePath, "skills") : Settings.Library.SkillSource;
        var Plan = await Task.Run(() => SkillDistribution.Preview(Source, Selected, Settings.Library.ExcludedNameList));
        if (!Plan.HasChanges) { Status.Text = "目标 Skill 已一致"; return; }
        string Names = string.Join("\n", Plan.PackageList.Select(Item => Item.Name));
        if (MessageBox.Show(this, "来源 " + Plan.SourceRoot + "\n目标 " + Plan.Target.PathValue + "\n\n" + Names + "\n\n覆盖目标同名技能并清理对应旧别名 共 " + Plan.ReplacedList.Count + " 项\n原内容先备份 其他技能和 .system 保留 Skill 所需工具仍须在目标环境可用", "Skill 分发预览", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入技能");
        string Backup = Path.Combine(ManagerPaths.BackupRoot, "agent-skills-" + Guid.NewGuid().ToString("N"));
        await Task.Run(() => SkillDistribution.Apply(Plan, Backup));
        Status.Text = "已同步到 " + Selected.Agent + " 请刷新目标技能列表或开启新会话 备份 " + Backup;
    }

    private void EditExclusions()
    {
        using var Dialog = new Form { Text = "本机 Skill 排除项", StartPosition = FormStartPosition.CenterParent, Font = Font, AutoScaleMode = AutoScaleMode.Dpi, AutoScaleDimensions = new SizeF(96, 96), ClientSize = new Size(540, 360), MinimizeBox = false, MaximizeBox = false };
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(18), RowCount = 3, ColumnCount = 1 };
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
        var Input = new TextBox { Dock = DockStyle.Fill, Multiline = true, ScrollBars = ScrollBars.Vertical, Text = string.Join(Environment.NewLine, Settings.Library.ExcludedNameList) };
        Root.Controls.Add(new Label { Text = "每行一个 SKILL.md 的 name 仅保存在本机\n新用户默认不排除任何 Skill 清空即可恢复收录", AutoSize = true });
        Root.Controls.Add(Input);
        Root.Controls.Add(MainForm.MakeButton("保存排除项", (_, _) => Dialog.DialogResult = DialogResult.OK, true));
        Dialog.Controls.Add(Root);
        Theme.Apply(Dialog);
        if (Dialog.ShowDialog(this) != DialogResult.OK) return;
        Settings.Library.ExcludedNameList = Input.Lines.Select(Item => Item.Trim()).Where(Item => Item.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (!PreviewOnly) SettingsStore.Save(Settings);
        RefreshSkills();
    }
    #endregion

    #region Rules
    private void ChooseRuleSource()
    {
        using var Dialog = new OpenFileDialog { Filter = "Markdown|*.md|所有文件|*.*", FileName = Settings.Library.RuleSource };
        if (Dialog.ShowDialog(this) != DialogResult.OK) return;
        Settings.Library.RuleSource = Dialog.FileName;
        RuleSource.Text = Dialog.FileName;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        ScanRules();
    }

    private void ScanRules()
    {
        TargetList = GlobalRules.Scan(Settings);
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

    private void OpenTarget()
    {
        var Target = RuleGrid.CurrentRow?.Tag as RuleTarget ?? throw new InvalidOperationException("请先选择一个 Agent");
        OpenFile(Target.PathValue);
    }

    private async Task SyncRulesAsync()
    {
        var SelectedList = RuleGrid.Rows.Cast<DataGridViewRow>().Where(Row => Row.Cells[0].Value is true).Select(Row => (RuleTarget)Row.Tag!).ToList();
        if (SelectedList.Count == 0) throw new InvalidOperationException("请勾选同步目标");
        var Plan = await Task.Run(() => GlobalRules.Preview(Settings.Library.RuleSource, SelectedList));
        if (Plan.ChangeList.Count == 0) { Status.Text = "所选规则已一致"; return; }
        using var Dialog = new RulePreviewDialog(Plan);
        Theme.Apply(Dialog);
        if (Dialog.ShowDialog(this) != DialogResult.OK) return;
        if (PreviewOnly) throw new InvalidOperationException("预览模式不写入规则");
        string Backup = await Task.Run(() => GlobalRules.Apply(Plan, ManagerPaths.BackupRoot));
        ScanRules();
        Status.Text = "同步完成 新对话加载 备份 " + Backup;
    }

    private static void OpenFile(string PathValue)
    {
        if (!File.Exists(PathValue)) throw new FileNotFoundException("文件尚不存在", PathValue);
        Process.Start(new ProcessStartInfo(PathValue) { UseShellExecute = true });
    }
    private void Run(Action Execute) { try { Execute(); } catch (Exception Error) { ShowError(Error); } }
    private void ShowError(Exception Error) { Program.LogError(Error); Status.Text = Error.Message; MessageBox.Show(this, Error.Message, "规则与技能库"); }
    #endregion
}
