namespace CodexInstanceManager;

/// <summary>
/// 填写初始问题并选择新编队席位
/// </summary>
public sealed class FormationCreateDialog : StudioDialog
{
    /// <summary> 席位选择器共享的实例配置 </summary>
    private readonly ManagerSettings Settings;
    /// <summary> 子对话框沿用的主题 </summary>
    private readonly AppTheme Appearance;
    /// <summary> 最近用过的模型 ID </summary>
    private readonly List<string> ModelHints;
    /// <summary> 持久保存当前席位为模板 </summary>
    private readonly Func<FormationTemplate, Task<List<FormationTemplate>>> SaveTemplate;
    private readonly Func<string, CancellationToken, Task<IReadOnlyList<AgentProject>>>? LoadWorkspaceProjects;
    /// <summary> 固定角色的席位与推理强度 </summary>
    private readonly Dictionary<eFormationRole, FormationRoleSelector> RoleDict = new();
    /// <summary> 仅在最低席位配置齐备后开放创建 </summary>
    private readonly StudioButton CreateButton;
    private readonly TextBox ProblemInput = new() { Name = "FormationProblem", Dock = DockStyle.Top, MaxLength = 80, Font = StudioFonts.Body };
    /// <summary> 从当前席位保存模板 </summary>
    private readonly StudioButton SaveTemplateButton;
    /// <summary> 载入已保存席位 </summary>
    private readonly StudioButton LoadTemplateButton;
    /// <summary> 可载入的已保存模板 </summary>
    private List<FormationTemplate> TemplateList;

    /// <summary> 统筹预算与默认角色分配说明 </summary>
    private readonly StudioWrapLabel BudgetHint = new() { Font = StudioFonts.Caption, Tag = eThemeRole.Muted, Margin = Padding.Empty };
    /// <summary> 配置联动防止控件值变化递归刷新 </summary>
    private bool Refreshing;
    public FormationCreate Request { get; private set; } = new();
    public bool ActivateAfterCreate => true;

    public FormationCreateDialog(ManagerSettings Settings, AppTheme Appearance, IEnumerable<FormationTemplate> Templates, List<string> ModelHints,
        Func<FormationTemplate, Task<List<FormationTemplate>>> SaveTemplate, Func<string, CancellationToken, Task<IReadOnlyList<AgentProject>>>? LoadWorkspaceProjects = null)
        : base("新建编队", new Size(790, 560))
    {
        this.Settings = Settings;
        this.Appearance = Appearance;
        this.ModelHints = ModelHints;
        this.SaveTemplate = SaveTemplate;
        this.LoadWorkspaceProjects = LoadWorkspaceProjects;
        TemplateList = Templates.ToList();
        FormBorderStyle = FormBorderStyle.FixedDialog;
        var Header = new TableLayoutPanel { ColumnCount = 1, Dock = DockStyle.Top, AutoSize = true, Margin = new Padding(0, 0, 0, 12) };
        Header.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Header.Controls.Add(new Label { Text = "角色席位", AutoSize = true, Font = StudioFonts.Title, Margin = Padding.Empty });
        Header.Controls.Add(new Label { Text = "问题", AutoSize = true, Font = StudioFonts.Strong, Margin = new Padding(0, 6, 0, 0) });
        ProblemInput.AccessibleName = "问题";
        ProblemInput.PlaceholderText = "例如：排查侧栏切页空白";
        Header.Controls.Add(ProblemInput);
        Header.Controls.Add(new Label { Text = "写入会话标题并作为初始需求交给统筹。选好统筹和执行者后即可创建。", AutoSize = true, Font = StudioFonts.Caption, Tag = eThemeRole.Muted, Margin = new Padding(0, 6, 0, 0) });
        Content.Controls.Add(Header, 0, 0);
        Content.RowCount = 4;
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 60));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 20));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 20));
        var CoordinatorGroup = new Panel { Name = "FormationCoordinatorGroup", Dock = DockStyle.Fill, Margin = new Padding(0, 0, 0, 6), Padding = new Padding(10, 4, 10, 8) };
        var GroupRows = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 4, Margin = Padding.Empty };
        GroupRows.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        for (int Index = 0; Index < 3; Index++) GroupRows.RowStyles.Add(new RowStyle(SizeType.Percent, 100f / 3));
        GroupRows.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        CoordinatorGroup.Controls.Add(GroupRows);
        Content.Controls.Add(CoordinatorGroup, 0, 1);
        var Roles = new[] { eFormationRole.Coordinator, eFormationRole.Reviewer, eFormationRole.Outsider, eFormationRole.Executor, eFormationRole.Learner };
        foreach (var Role in Roles)
        {
            var Selector = new FormationRoleSelector(Role);
            RoleDict.Add(Role, Selector);
            Selector.SeatClicked += Index => EditSeat(Selector, Index);
            Selector.ConfigurationChanged += () => { if (CreateButton is not null) RefreshSeats(); };
            if (Role is eFormationRole.Coordinator or eFormationRole.Reviewer or eFormationRole.Outsider)
                GroupRows.Controls.Add(Selector, 0, GroupRows.Controls.Count);
            else Content.Controls.Add(Selector, 0, Role == eFormationRole.Executor ? 2 : 3);
        }
        GroupRows.Controls.Add(BudgetHint, 0, 3);

        CreateButton = AddAction("创建编队", eButtonKind.Primary, (_, _) => Confirm());
        CreateButton.Name = "FormationSetupCreate";
        var Cancel = AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
        CancelButton = Cancel;
        SaveTemplateButton = AddAction("保存为模板", eButtonKind.Ghost, async (_, _) => await SaveTemplateAsync());
        LoadTemplateButton = AddAction("使用模板", eButtonKind.Ghost, (_, _) => LoadTemplate());
        ProblemInput.TextChanged += (_, _) => RefreshActions();
        RefreshSeats();
    }

    private FormationMember? Coordinator => RoleDict[eFormationRole.Coordinator].Selections.SingleOrDefault()?.Member;

    private void EditSeat(FormationRoleSelector Selector, int Index)
    {
        using var Dialog = new FormationAvatarPickerDialog(Selector.Role, Index, Selector.SelectionAt(Index), Coordinator, Settings, ModelHints,
            Selector.Selections.ToArray(), LoadWorkspaceProjects);
        if (Dialog.ShowThemed(this, Appearance) != DialogResult.OK) return;
        bool FirstCoordinator = Selector.Role == eFormationRole.Coordinator && Coordinator is null && Dialog.Selection is not null;
        Selector.SetSelection(Index, Dialog.Selection);
        if (FirstCoordinator)
            foreach (var Role in new[] { eFormationRole.Reviewer, eFormationRole.Outsider })
                if (!RoleDict[Role].Selections.Any()) RoleDict[Role].SetSelection(0, new(new FormationMember { Role = Role, DispatchMode = eFormationDispatchMode.Native, FollowCoordinator = true }, true));
        RefreshSeats();
    }

    private void RefreshSeats()
    {
        if (Refreshing) return;
        Refreshing = true;
        try
        {
            var Controller = Coordinator;
            foreach (var Selector in RoleDict.Values)
            {
                if (Selector.Selections.Any() && Selector.Selections.All(Item => Item.FollowsCoordinator)) Selector.SetEffort(RoleDict[eFormationRole.Coordinator].Effort);
                Selector.RefreshSeats(Settings, Controller);
            }
            int Budget = RoleDict[eFormationRole.Coordinator].SubagentMax;
            BudgetHint.Text = Budget == 3 ? "统筹原生子代理总预算 3 · 默认 2 个审核 + 1 个外援按需使用 · 点击头像可单独指定"
                : $"统筹原生子代理总预算 {Budget} · 审核与外援按需共享 · 宿主实际可用额度优先";
            RefreshActions();
        }
        finally { Refreshing = false; }
    }

    private void RefreshActions()
    {
        bool HasRequiredSeats = Coordinator is not null && RoleDict[eFormationRole.Executor].Selections.Any();
        CreateButton.Enabled = HasRequiredSeats && !string.IsNullOrWhiteSpace(ProblemInput.Text);
        SaveTemplateButton.Enabled = HasRequiredSeats;
        LoadTemplateButton.Enabled = TemplateList.Count != 0;
    }

    private List<FormationMember> BuildMembers()
    {
        var Controller = Coordinator!;
        return RoleDict.Values.SelectMany(Selector => Selector.Selections.Select(Selection =>
        {
            var Member = Selection.Member;
            string InstanceId = Selection.FollowsCoordinator || Member.DispatchMode == eFormationDispatchMode.Native ? Controller.InstanceId : Member.InstanceId;
            return new FormationMember
            {
                Role = Member.Role,
                DisplayName = Member.DisplayName,
                DispatchMode = Member.DispatchMode,
                FollowCoordinator = Selection.FollowsCoordinator,
                SubagentMax = SeatProviders.For(InstanceId).SupportsEffort ? Selector.SubagentMax : 0,
                InstanceId = InstanceId,
                Model = Selection.FollowsCoordinator ? Controller.Model : Member.Model,
                Effort = SeatProviders.For(InstanceId).SupportsEffort ? Selection.FollowsCoordinator ? RoleDict[eFormationRole.Coordinator].Effort : Selector.Effort : "",
                Project = InstanceId == Member.InstanceId ? Member.Project : "",
                Cwd = InstanceId == Member.InstanceId ? Member.Cwd : ""
            };
        })).ToList();
    }

    private void Confirm()
    {
        if (!CreateButton.Enabled) return;
        var Members = BuildMembers();
        string Problem = ProblemInput.Text.Trim();
        Request = new FormationCreate
        {
            Theme = Problem,
            Requirement = Problem,
            MaxParallel = Math.Max(Members.Count(Item => Item.Role == eFormationRole.Executor), RoleDict[eFormationRole.Coordinator].SubagentMax),
            MemberList = Members
        };
        DialogResult = DialogResult.OK;
    }

    private void LoadTemplate()
    {
        using var Dialog = new FormationTemplatePickerDialog(TemplateList);
        if (Dialog.ShowThemed(this, Appearance) != DialogResult.OK) return;
        var MemberList = Dialog.Selection.MemberList;
        if (MemberList.GroupBy(Item => Item.Role).Any(Group => !RoleDict.TryGetValue(Group.Key, out var Selector) || Group.Count() > Selector.Capacity))
        {
            MessageBox.Show(this, "该模板的席位数量超出当前编队上限。", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }
        if (MemberList.Any(Item => !SeatProviders.IsExternal(Item.InstanceId) && Settings.InstanceList.All(Profile => Profile.Id != Item.InstanceId)))
        {
            MessageBox.Show(this, "该模板引用了未登记的 Codex 实例。", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        var Controller = MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
        foreach (var Selector in RoleDict.Values)
        {
            Selector.LoadTemplate(MemberList.Where(Item => Item.Role == Selector.Role), Controller);
        }
        RefreshSeats();
    }

    private async Task SaveTemplateAsync()
    {
        string? Name = StudioPrompt.Text(this, Appearance, "保存为模板", "模板名称", "");
        if (Name is null) return;
        var Members = BuildMembers();
        var Template = new FormationTemplate { Name = Name, MaxParallel = Math.Max(Members.Count(Item => Item.Role == eFormationRole.Executor), RoleDict[eFormationRole.Coordinator].SubagentMax), MemberList = Members };
        UseWaitCursor = true;
        Enabled = false;
        try
        {
            TemplateList = await SaveTemplate(Template);
        }
        catch (Exception Error)
        {
            Program.LogError(Error);
            MessageBox.Show(this, Error.Message, "模板未保存", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            Enabled = true;
            UseWaitCursor = false;
            RefreshSeats();
        }
    }

    private sealed class FormationTemplatePickerDialog : StudioDialog
    {
        /// <summary> 模板候选 </summary>
        private readonly ThemeComboBox Templates = new() { Dock = DockStyle.Top, DropDownStyle = ComboBoxStyle.DropDownList, FormattingEnabled = true };

        public FormationTemplate Selection => (FormationTemplate)Templates.SelectedItem!;

        public FormationTemplatePickerDialog(List<FormationTemplate> TemplateList)
            : base("使用模板", new Size(460, 164))
        {
            FormBorderStyle = FormBorderStyle.FixedDialog;
            Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            Content.Controls.Add(new Label { Text = "载入模板会替换当前已选席位。", AutoSize = true, Margin = new Padding(0, 0, 0, 10), Tag = eThemeRole.Muted });
            Templates.Format += (_, Event) =>
            {
                if (Event.ListItem is FormationTemplate Template) Event.Value = $"{Template.Name}  v{Template.Version}  ·  {Template.MemberList.Count} 席";
            };
            Templates.Items.AddRange(TemplateList.Cast<object>().ToArray());
            Templates.SelectedIndex = 0;
            Content.Controls.Add(Templates);
            AcceptButton = AddAction("载入", eButtonKind.Primary, (_, _) => DialogResult = DialogResult.OK);
            CancelButton = AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
        }
    }
}

/// <summary>
/// 更新编队需求与上下文 需求变化会生成新需求版本
/// </summary>
public sealed class FormationContextDialog : StudioDialog
{
    private readonly TextBox RequirementInput = new() { Dock = DockStyle.Fill, Multiline = true, ScrollBars = ScrollBars.Vertical, MaxLength = 4000 };
    private readonly TextBox ContextInput = new() { Dock = DockStyle.Fill, Multiline = true, ScrollBars = ScrollBars.Vertical, MaxLength = 4000 };
    public string Requirement => RequirementInput.Text.Trim();
    public string ContextText => ContextInput.Text.Trim();

    public FormationContextDialog(string Theme, string Requirement, string Context) : base("更新需求与上下文 · " + Theme, new Size(760, 560))
    {
        Content.RowCount = 5;
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 55));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 45));
        Content.Controls.Add(new StudioWrapLabel { Text = "需求变化会生成新版本 所有任务回到待派发并保留旧成果供复核 仍有执行或交接未确认时不能切换\n仅修改上下文会通知统筹 已有验收保持有效 已结案编队不可修改", Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 0, 0, 10) });
        Content.Controls.Add(new Label { Text = "需求", AutoSize = true, Font = StudioFonts.Strong });
        RequirementInput.Text = Requirement;
        Content.Controls.Add(RequirementInput);
        Content.Controls.Add(new Label { Text = "上下文", AutoSize = true, Font = StudioFonts.Strong, Margin = new Padding(0, 10, 0, 0) });
        ContextInput.Text = Context;
        Content.Controls.Add(ContextInput);
        AddAction("保存", eButtonKind.Primary, (_, _) =>
        {
            if (this.Requirement.Length == 0) { MessageBox.Show(this, "需求不能为空", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning); return; }
            DialogResult = DialogResult.OK;
        });
        AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
    }
}
