namespace CodexInstanceManager;

internal sealed class FormationAvatarPickerDialog : StudioDialog
{
    private sealed record AgentOption(string? InstanceId, FormationAvatarButton Button);

    private const string DefaultModel = "沿用 Agent 默认模型";
    /// <summary> 当前编辑的角色 </summary>
    private readonly eFormationRole Role;
    /// <summary> 原席位用于保留同一执行端的模板配置 </summary>
    private readonly FormationSeatSelection? Source;
    /// <summary> 审核与外援选择跟随时引用的统筹席位 </summary>
    private readonly FormationMember? Controller;
    /// <summary> 当前配置的执行端与实例 </summary>
    private readonly ManagerSettings Settings;
    /// <summary> 模型目录缺失时使用的近期模型 </summary>
    private readonly IReadOnlyList<string> ModelHints;
    /// <summary> 该角色已经选定的席位 </summary>
    private readonly IReadOnlyList<FormationSeatSelection> ExistingSeats;
    /// <summary> 按头像选择的执行端 </summary>
    private readonly List<AgentOption> OptionList = new();
    /// <summary> 执行端选择区 </summary>
    private readonly FlowLayoutPanel AgentList;
    /// <summary> 单席位模型 可直接输入模型 ID </summary>
    private readonly ThemeComboBox ModelInput;
    /// <summary> 由 Agent 或统筹提供的模型 </summary>
    private readonly Label FixedModel;
    /// <summary> 已使用当前模型的席位数 </summary>
    private readonly StudioChip ModelCount;
    /// <summary> 所选执行端的可用配置说明 </summary>
    private readonly StudioWrapLabel Detail;
    private readonly FormationWorkspaceField Workspace;
    /// <summary> 鼠标悬停时显示完整的实例或执行端名称 </summary>
    private readonly ToolTip Tips = new();
    /// <summary> 当前选中的执行端 null ID 表示跟随统筹 </summary>
    private AgentOption? SelectedOption;
    /// <summary> 当前执行端的默认模型选项 </summary>
    private string DefaultOption = DefaultModel;

    /// <summary> 审核与外援可选择原生子代理或独立会话 </summary>
    private readonly ThemeComboBox? ModeInput;
    private bool IsNative => ModeInput?.SelectedIndex == 0;
    public FormationSeatSelection? Selection { get; private set; }

    public FormationAvatarPickerDialog(eFormationRole Role, int Index, FormationSeatSelection? Source, FormationMember? Controller,
        ManagerSettings Settings, IReadOnlyList<string> ModelHints, IReadOnlyList<FormationSeatSelection> ExistingSeats,
        Func<string, CancellationToken, Task<IReadOnlyList<AgentProject>>>? LoadWorkspaceProjects)
        : base(Role == eFormationRole.Executor ? $"执行者 · 第 {Index + 1} 席" : SeatProviders.RoleTitle(Role) + "席位", new Size(694, 336))
    {
        this.Role = Role;
        this.Source = Source;
        this.Controller = Controller;
        this.Settings = Settings;
        this.ModelHints = ModelHints;
        this.ExistingSeats = ExistingSeats;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        Content.RowCount = 5;
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.Absolute, LogicalToDeviceUnits(42)));
        var Header = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, WrapContents = false, Margin = new Padding(0, 0, 0, 8) };
        Header.Controls.Add(new Label { Text = "选择 Agent", Font = StudioFonts.Section, AutoSize = true, Margin = new Padding(0, 4, 16, 0) });
        if (Role is eFormationRole.Reviewer or eFormationRole.Outsider)
        {
            ModeInput = new ThemeComboBox { Name = "FormationDispatchMode", DropDownStyle = ComboBoxStyle.DropDownList, Width = LogicalToDeviceUnits(210) };
            ModeInput.Items.AddRange(new object[] { "统筹的原生子代理", "独立 Agent 会话" });
            ModeInput.SelectedIndex = Source is null || Source.Member.DispatchMode == eFormationDispatchMode.Native ? 0 : 1;
            Header.Controls.Add(ModeInput);
        }
        Content.Controls.Add(Header, 0, 0);
        AgentList = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoScroll = true, Margin = new Padding(0, 0, 0, 8) };
        Content.Controls.Add(AgentList, 0, 1);

        Workspace = new FormationWorkspaceField(Settings, LoadWorkspaceProjects);
        Content.Controls.Add(Workspace, 0, 2);
        Shown += async (_, _) => await Workspace.ReloadAsync();
        var ModelField = new TableLayoutPanel { AutoSize = true, Dock = DockStyle.Top, ColumnCount = 3, RowCount = 1, Margin = Padding.Empty };
        ModelField.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, LogicalToDeviceUnits(58)));
        ModelField.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        ModelField.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, LogicalToDeviceUnits(46)));
        ModelField.RowStyles.Add(new RowStyle(SizeType.Absolute, LogicalToDeviceUnits(28)));
        ModelField.Controls.Add(new Label { Text = "模型", AutoSize = true, Anchor = AnchorStyles.Left, Margin = Padding.Empty }, 0, 0);
        ModelInput = new ThemeComboBox
        {
            Name = "FormationSeatModel", AccessibleName = "席位模型", Dock = DockStyle.Top, DropDownStyle = ComboBoxStyle.DropDown,
            MaxLength = 128, Margin = Padding.Empty
        };
        FixedModel = new Label { Name = "FormationFixedModel", AutoSize = true, Anchor = AnchorStyles.Left, Margin = new Padding(0, 4, 0, 4) };
        ModelCount = new StudioChip { Name = "FormationModelCount", Anchor = AnchorStyles.Left, Tone = eTone.Accent, Margin = new Padding(6, 0, 0, 0) };
        var ModelValue = new Panel { Height = LogicalToDeviceUnits(27), Dock = DockStyle.Fill, Margin = Padding.Empty };
        FixedModel.Dock = DockStyle.Fill;
        FixedModel.TextAlign = ContentAlignment.MiddleLeft;
        ModelValue.Controls.Add(FixedModel);
        ModelValue.Controls.Add(ModelInput);
        ModelField.Controls.Add(ModelValue, 1, 0);
        ModelField.Controls.Add(ModelCount, 2, 0);
        Content.Controls.Add(ModelField, 0, 3);
        Detail = new StudioWrapLabel { Font = StudioFonts.Caption, Tag = eThemeRole.Muted, Margin = new Padding(0, 8, 0, 0) };
        Content.Controls.Add(Detail, 0, 4);

        if (Role is eFormationRole.Reviewer or eFormationRole.Outsider) AddOption(null, "跟随统筹");
        foreach (var Profile in Settings.InstanceList) AddOption(Profile.Id, Profile.Name);
        if (Role != eFormationRole.Coordinator)
            foreach (var Provider in SeatProviders.ExternalList) AddOption(Provider.Id, Provider.Label);
        if (OptionList.Count > 6) ClientSize = new Size(ClientSize.Width, ClientSize.Height + LogicalToDeviceUnits(90));

        var Initial = Source is not null
            ? OptionList.FirstOrDefault(Item => Item.InstanceId == (Source.FollowsCoordinator ? null : Source.Member.InstanceId))
            : OptionList.FirstOrDefault(Item => Item.InstanceId is null);
        Initial ??= OptionList.FirstOrDefault(Item => Settings.InstanceList.Any(Profile => Profile.IsPrimary && Profile.Id == Item.InstanceId)) ?? OptionList.FirstOrDefault();
        if (Initial is not null) SelectOption(Initial);
        else Detail.Text = "没有已登记的 Codex 实例。请先在实例管理中添加统筹实例。";
        if (ModeInput is not null)
        {
            ModeInput.SelectedIndexChanged += (_, _) => RefreshMode();
            RefreshMode();
        }
        ModelInput.TextChanged += (_, _) => RefreshModelCount();

        var ConfirmButton = AddAction("确定", eButtonKind.Primary, (_, _) => Confirm());
        ConfirmButton.Name = "FormationSeatConfirm";
        ConfirmButton.Enabled = Initial is not null;
        AcceptButton = ConfirmButton;
        CancelButton = AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
        if (Source is not null) AddAction("移除席位", eButtonKind.Danger, (_, _) => DialogResult = DialogResult.OK).Name = "FormationSeatRemove";
    }

    private void AddOption(string? InstanceId, string Label)
    {
        var Cell = new TableLayoutPanel { Size = LogicalToDeviceUnits(new Size(100, 78)), ColumnCount = 1, RowCount = 2, Margin = new Padding(0, 0, 3, 4) };
        Cell.RowStyles.Add(new RowStyle(SizeType.Absolute, LogicalToDeviceUnits(53)));
        Cell.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var Button = new FormationAvatarButton(52)
        {
            Name = "FormationAgent" + (InstanceId ?? "Follow"), AccessibleName = Label, Anchor = AnchorStyles.Top, Margin = Padding.Empty,
            Tone = InstanceId is null ? eTone.Accent : SeatProviders.For(InstanceId).Tone
        };
        var Title = new Label
        {
            Text = Label, Dock = DockStyle.Fill, TextAlign = ContentAlignment.TopCenter,
            Margin = new Padding(0, 4, 0, 0), Font = StudioFonts.Caption, Cursor = Cursors.Hand
        };
        var Option = new AgentOption(InstanceId, Button);
        Button.Click += (_, _) => SelectOption(Option);
        Title.Click += (_, _) =>
        {
            Button.Focus();
            SelectOption(Option);
        };
        Tips.SetToolTip(Button, Label);
        Tips.SetToolTip(Title, Label);
        Cell.Controls.Add(Button, 0, 0);
        Cell.Controls.Add(Title, 0, 1);
        AgentList.Controls.Add(Cell);
        OptionList.Add(Option);
    }

    private void SelectOption(AgentOption Option)
    {
        if (ModeInput is not null && !CanSelectOption(Option)) return;
        if (SelectedOption == Option) return;
        SelectedOption = Option;
        foreach (var Item in OptionList) Item.Button.SetAvatar(Option == Item, Item.InstanceId ?? Controller?.InstanceId, Settings);
        var Original = Source?.Member;
        Workspace.RefreshTarget(Option.InstanceId, IsNative, Original?.InstanceId == Option.InstanceId ? Original : null);
        if (Visible) _ = Workspace.ReloadAsync();
        if (Option.InstanceId is null)
        {
            SetEditableModel(false);
            FixedModel.Text = Controller?.Model is { Length: > 0 } Model ? Model : Controller is null ? "待选统筹" : "沿用统筹的默认模型";
            Detail.Text = Controller is null
                ? "选好统筹后，本席位作为其原生子代理并跟随模型与推理。"
                : $"统筹的原生子代理 · {SeatProviders.InstanceName(Settings, Controller.InstanceId)}\n模型与推理跟随统筹，共享统筹子代理预算。";
            RefreshModelCount();
            return;
        }

        var Provider = SeatProviders.For(Option.InstanceId);
        SetEditableModel(Provider.SupportsModel);
        if (Provider.SupportsModel)
        {
            var Options = FormationModelOptions.Load(Settings, Option.InstanceId, ModelHints);
            DefaultOption = Options.Default.Length == 0 ? DefaultModel : "沿用默认 · " + Options.Default;
            ModelInput.Items.Clear();
            ModelInput.Items.Add(DefaultOption);
            ModelInput.Items.AddRange(Options.Models.ToArray());
            ModelInput.Text = Source is { FollowsCoordinator: false } && Source.Member.InstanceId == Option.InstanceId && Source.Member.Model.Length > 0
                ? Source.Member.Model : DefaultOption;
            Detail.Text = Options.Issue ?? (Provider.SupportsEffort ? "可选择模型或输入模型 ID。"
                : Provider.Label + " 支持模型设置，推理强度沿用 Agent 自身配置。");
        }
        else
        {
            FixedModel.Text = "沿用会话模型";
            Detail.Text = Provider.Label + " 的模型和推理强度沿用 Agent 自身配置。";
        }
        if (IsNative) Detail.Text = "统筹的原生子代理 · 单独指定模型与当前角色的推理强度 · 仍共享统筹预算";
        RefreshModelCount();
    }

    private bool CanSelectOption(AgentOption Option) => IsNative
        ? Option.InstanceId is null || Option.InstanceId == Controller?.InstanceId
        : Option.InstanceId is not null;

    private void RefreshMode()
    {
        foreach (var Option in OptionList) Option.Button.Enabled = CanSelectOption(Option);
        var Target = SelectedOption is not null && CanSelectOption(SelectedOption) ? SelectedOption
            : OptionList.FirstOrDefault(Option => CanSelectOption(Option) && (IsNative ? Option.InstanceId is null : Option.InstanceId == Controller?.InstanceId))
                ?? OptionList.FirstOrDefault(CanSelectOption);
        SelectedOption = null;
        if (Target is not null) SelectOption(Target);
    }

    private void SetEditableModel(bool CanEdit)
    {
        ModelInput.Enabled = ModelInput.Visible = CanEdit;
        FixedModel.Visible = !CanEdit;
    }

    private string ChosenModel()
    {
        if (SelectedOption?.InstanceId is null) return Controller?.Model ?? "";
        string model = ModelInput.Text.Trim();
        return ModelInput.Enabled && model != DefaultOption ? model : "";
    }

    private void RefreshModelCount()
    {
        string? target = SelectedOption?.InstanceId ?? Controller?.InstanceId;
        string model = ChosenModel();
        int count = target is null ? 0 : ExistingSeats.Count(Item =>
        {
            var Member = Item.FollowsCoordinator ? Controller : Item.Member;
            return Member?.Model == model && (model.Length != 0 || Member.InstanceId == target);
        });
        ModelCount.Text = $"×{count}";
        ModelCount.Visible = count > 0;
    }

    private void Confirm()
    {
        if (SelectedOption is null || !Workspace.ValidateSelection()) return;
        string? targetId = SelectedOption.InstanceId;
        bool follows = targetId is null;
        var Original = Source?.Member;
        var Member = new FormationMember
        {
            Role = Role,
            DispatchMode = IsNative ? eFormationDispatchMode.Native : eFormationDispatchMode.Session,
            FollowCoordinator = follows,
            InstanceId = targetId ?? Controller?.InstanceId ?? "",
            Model = ChosenModel(),
            DisplayName = Original?.DisplayName ?? "",
            Project = Workspace.SelectedProject,
            Cwd = Workspace.SelectedFolder
        };
        Selection = new(Member, follows);
        DialogResult = DialogResult.OK;
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Tips.Dispose();
        base.Dispose(Disposing);
    }
}
