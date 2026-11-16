namespace CodexInstanceManager;

/// <summary>
/// 编辑单个席位 按执行端能力开放模型 推理强度与工作区 不支持的项沿用会话配置
/// </summary>
public sealed class SeatEditorDialog : StudioDialog
{
    private sealed record SeatTarget(string Id, string Label)
    {
        public override string ToString() => Label;
    }

    private const string InheritEffort = "沿用默认";
    private readonly FormationMember Source;
    private readonly FormationMember? Controller;
    /// <summary> 独立配置原生审核与外援时保留派发方式 </summary>
    private readonly ThemeComboBox ModeInput = new() { Name = "FormationEditMode", Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly CheckBox FollowInput = new() { Name = "FormationEditFollow", Text = "模型与推理跟随统筹", AutoSize = true };
    private readonly ThemeComboBox BudgetInput = new() { Name = "FormationEditBudget", Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
    private bool Native => ModeInput.SelectedIndex == 0;
    /// <summary> 只读查看时禁用全部输入 </summary>
    private readonly bool Editable;
    private readonly ThemeComboBox TargetInput = new() { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList, Margin = new Padding(0, 5, 0, 7) };
    private readonly ThemeComboBox ModelInput = new() { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDown, Margin = new Padding(0, 5, 0, 7) };
    private readonly ThemeComboBox EffortInput = new() { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList, Margin = new Padding(0, 5, 0, 7) };
    private readonly TextBox NameInput = new() { Dock = DockStyle.Fill, PlaceholderText = "留空按编队主题与角色自动命名", Margin = new Padding(0, 5, 0, 7), MaxLength = 120 };
    private readonly TextBox WorkspaceInput = new() { Dock = DockStyle.Fill, Margin = new Padding(0, 5, 0, 7), MaxLength = 1024 };
    private readonly TextBox SessionInput = new() { Dock = DockStyle.Fill, Margin = new Padding(0, 5, 0, 7), MaxLength = 128 };
    private readonly Label EffortLabel = FieldLabel("拟推理强度");
    private readonly Label WorkspaceLabel = FieldLabel("项目");
    private readonly StudioWrapLabel CapabilityLabel = new() { Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 10, 0, 0) };
    private readonly StudioButton BrowseButton = new() { Text = "选择目录", Margin = new Padding(8, 3, 0, 3) };
    public FormationMember Result { get; private set; }
    public bool Removed { get; private set; }

    public SeatEditorDialog(FormationMember Member, ManagerSettings Settings, IEnumerable<string> ModelHints, bool AllowRemove, bool Editable, bool Existing, FormationMember? Controller = null)
        : base((Existing ? "席位 · " : "新增席位 · ") + SeatProviders.RoleTitle(Member.Role), new Size(660, 610))
    {
        Source = Member;
        this.Controller = Controller;
        Result = Member;
        Content.RowCount = 3;
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var Header = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, WrapContents = false, Margin = new Padding(0, 0, 0, 10) };
        Header.Controls.Add(new StudioChip { Text = SeatProviders.RoleTitle(Member.Role) + " · " + SeatProviders.RoleHint(Member.Role), Tone = SeatProviders.RoleTone(Member.Role) });
        Header.Controls.Add(new Label { Text = Member.Role == eFormationRole.Coordinator ? "统筹须为真实 Codex 会话 负责拆分任务与最终交付总结" : "执行端 实例 模型与会话按席位独立配置", AutoSize = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(4, 8, 0, 0) });
        Content.Controls.Add(Header);

        var Fields = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 3, Margin = Padding.Empty };
        Fields.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 92));
        Fields.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Fields.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        AddRow(Fields, FieldLabel("显示名"), NameInput, null);
        if (Member.Role is eFormationRole.Reviewer or eFormationRole.Outsider)
        {
            ModeInput.Items.AddRange(new object[] { "统筹的原生子代理", "独立 Agent 会话" });
            ModeInput.SelectedIndex = Member.DispatchMode == eFormationDispatchMode.Native ? 0 : 1;
            FollowInput.Checked = Member.FollowCoordinator;
            AddRow(Fields, FieldLabel("派发方式"), ModeInput, FollowInput);
        }
        BudgetInput.Items.AddRange(new object[] { 1, 2, 3, 4 });
        BudgetInput.SelectedItem = Member.SubagentMax is >= 1 and <= 4 ? Member.SubagentMax : Math.Max(1, FormationStore.DefaultSubagentMax(Member.Role));
        AddRow(Fields, FieldLabel("子代理上限"), BudgetInput, null);
        AddRow(Fields, FieldLabel("执行端"), TargetInput, null);
        AddRow(Fields, FieldLabel("模型"), ModelInput, null);
        AddRow(Fields, EffortLabel, EffortInput, null);
        AddRow(Fields, WorkspaceLabel, WorkspaceInput, BrowseButton);
        AddRow(Fields, FieldLabel("会话 ID"), SessionInput, null);
        Content.Controls.Add(Fields);
        Content.Controls.Add(CapabilityLabel);

        foreach (var Profile in Settings.InstanceList) TargetInput.Items.Add(new SeatTarget(Profile.Id, "Codex · " + Profile.Name));
        if (Member.Role != eFormationRole.Coordinator)
            foreach (var Provider in SeatProviders.ExternalList) TargetInput.Items.Add(new SeatTarget(Provider.Id, Provider.Label));
        var Targets = TargetInput.Items.Cast<SeatTarget>().ToList();
        if (Member.InstanceId.Length != 0 && Targets.All(Item => Item.Id != Member.InstanceId)) TargetInput.Items.Add(new SeatTarget(Member.InstanceId, "未登记实例 · " + Member.InstanceId));
        ModelInput.Items.AddRange(ModelHints.Cast<object>().ToArray());
        EffortInput.Items.Add(InheritEffort);
        EffortInput.Items.AddRange(SeatProviders.EffortList.Cast<object>().ToArray());

        NameInput.Text = Member.DisplayName;
        ModelInput.Text = Member.Model;
        EffortInput.SelectedItem = Member.Effort.Length == 0 ? InheritEffort : Member.Effort;
        if (EffortInput.SelectedIndex < 0) EffortInput.SelectedIndex = 0;
        WorkspaceInput.Text = Member.Project.Length != 0 ? Member.Project : Member.Cwd;
        SessionInput.Text = Member.SessionId;
        SessionInput.PlaceholderText = Member.Role == eFormationRole.Coordinator ? "留空则启动统筹时自动新建真实会话" : "留空按需新建 填写则复用真实会话 ID";
        TargetInput.SelectedIndexChanged += (_, _) => RefreshCapability();
        TargetInput.SelectedItem = TargetInput.Items.Cast<SeatTarget>().FirstOrDefault(Item => Item.Id == Member.InstanceId) ?? TargetInput.Items.Cast<SeatTarget>().FirstOrDefault();
        BrowseButton.Click += (_, _) =>
        {
            using var Folder = new FolderBrowserDialog { Description = "选择该席位的工作目录", UseDescriptionForTitle = true };
            if (Folder.ShowDialog(this) == DialogResult.OK) WorkspaceInput.Text = Folder.SelectedPath;
        };
        ModeInput.SelectedIndexChanged += (_, _) => RefreshCapability();
        FollowInput.CheckedChanged += (_, _) => RefreshCapability();
        this.Editable = Editable;
        foreach (var Input in new Control[] { NameInput, TargetInput, ModelInput, EffortInput, WorkspaceInput, SessionInput, BrowseButton, ModeInput, FollowInput, BudgetInput }) Input.Enabled = Editable;
        RefreshCapability();
        if (Editable)
        {
            AddAction("保存", eButtonKind.Primary, (_, _) => Confirm());
            AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
            if (AllowRemove) AddAction("移除席位", eButtonKind.Danger, (_, _) => { Removed = true; DialogResult = DialogResult.OK; });
        }
        else AddAction("关闭", eButtonKind.Primary, (_, _) => DialogResult = DialogResult.Cancel);
    }

    /// <summary>
    /// 仅会话 ID 变化时使用绑定操作 保留席位其余配置
    /// </summary>
    public bool OnlySessionChanged => Result.SessionId.Length != 0 && Result.SessionId != Source.SessionId && Result.DisplayName == Source.DisplayName &&
        Result.InstanceId == Source.InstanceId && Result.Model == Source.Model && Result.Effort == Source.Effort && Result.Project == Source.Project && Result.Cwd == Source.Cwd && Result.DispatchMode == Source.DispatchMode && Result.FollowCoordinator == Source.FollowCoordinator && Result.SubagentMax == Source.SubagentMax;

    private static void AddRow(TableLayoutPanel Fields, Label Label, Control Input, Control? Extra)
    {
        int Row = Fields.RowCount++;
        Fields.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Fields.Controls.Add(Label, 0, Row);
        Fields.Controls.Add(Input, 1, Row);
        if (Extra is not null) Fields.Controls.Add(Extra, 2, Row);
    }

    private SeatProvider CurrentProvider => Native ? SeatProviders.Codex : SeatProviders.For((TargetInput.SelectedItem as SeatTarget)?.Id ?? "");

    private void RefreshCapability()
    {
        var Provider = CurrentProvider;
        bool Codex = Provider == SeatProviders.Codex;
        bool Follows = Native && FollowInput.Checked;
        TargetInput.Enabled = Editable && !Native;
        SessionInput.Enabled = Editable && !Native;
        WorkspaceInput.Enabled = BrowseButton.Enabled = Editable && !Native;
        FollowInput.Enabled = Editable && Native;
        ModelInput.Enabled = Provider.SupportsModel && Editable && !Follows;
        EffortInput.Enabled = Editable && !Follows;
        BudgetInput.Enabled = Editable;
        if (!Provider.SupportsModel) ModelInput.Text = "";
        WorkspaceLabel.Text = Provider.UsesCwd ? "工作目录" : Codex ? "项目" : "工作区";
        BrowseButton.Visible = Provider.UsesCwd;
        WorkspaceInput.PlaceholderText = Provider.UsesCwd ? "绝对路径 留空沿用执行端默认目录" : Codex ? "项目 ID 名称或路径 留空沿用实例默认" : "DSH 工作区 ID 或名称 留空使用默认工作区";
        CapabilityLabel.Text = Native ? "原生子代理占用统筹额度 · 该席作为原生子代理执行时不能继续分派"
            : Codex ? "派发时按目标模型选择最近的可用档位 · 子代理上限不含席位本体"
            : Provider.Label + " 使用会话推理设置 · 拟强度和子代理上限记录在统筹计划中";
    }

    private void Confirm()
    {
        var Provider = CurrentProvider;
        var Target = TargetInput.SelectedItem as SeatTarget;
        if (Target is null) { MessageBox.Show(this, "请选择执行端", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning); return; }
        string Workspace = WorkspaceInput.Text.Trim();
        if (Provider.UsesCwd && Workspace.Length != 0 && !Path.IsPathFullyQualified(Workspace))
        {
            MessageBox.Show(this, "工作目录须为绝对路径", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }
        string Effort = EffortInput.SelectedItem as string ?? InheritEffort;
        Result = new FormationMember
        {
            Id = Source.Id,
            Role = Source.Role,
            DispatchMode = Native ? eFormationDispatchMode.Native : eFormationDispatchMode.Session,
            FollowCoordinator = Native && FollowInput.Checked,
            SubagentMax = (int)BudgetInput.SelectedItem!,
            DisplayName = NameInput.Text.Trim(),
            InstanceId = Native ? Controller?.InstanceId ?? Source.InstanceId : Target.Id,
            SessionId = Native ? "" : SessionInput.Text.Trim(),
            Model = Provider.SupportsModel ? ModelInput.Text.Trim() : "",
            Effort = Effort != InheritEffort ? Effort : "",
            Project = Native || Provider.UsesCwd ? "" : Workspace,
            Cwd = !Native && Provider.UsesCwd ? Workspace : ""
        };
        DialogResult = DialogResult.OK;
    }
}
