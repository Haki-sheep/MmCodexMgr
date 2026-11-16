namespace CodexInstanceManager;

internal sealed record FormationSeatSelection(FormationMember Member, bool FollowsCoordinator = false);

internal sealed class FormationRoleSelector : TableLayoutPanel, IThemedControl
{
    private sealed record EffortOption(string Title, string Value)
    {
        public override string ToString() => Title;
    }

    /// <summary> 推理档位的显示名和派发参数 </summary>
    private static readonly EffortOption[] EffortList =
    {
        new("低", "low"), new("中", "medium"), new("高", "high"), new("极高", "xhigh"), new("ultra", "ultra")
    };
    /// <summary> 固定索引对应界面上的头像圆位 </summary>
    private readonly FormationSeatSelection?[] SeatList;
    /// <summary> 固定索引对应界面上的头像控件 </summary>
    private readonly FormationAvatarButton[] ButtonList;
    /// <summary> 该角色已配置的席位数 </summary>
    private readonly StudioChip CountLabel;
    /// <summary> 同角色的 Codex 席位共用一个档位 </summary>
    private readonly ThemeComboBox EffortInput;
    /// <summary> 标注该档位是否适用于所选执行端 </summary>
    private readonly Label EffortLabel;
    /// <summary> 头像显示模型及跟随状态 </summary>
    private readonly ToolTip Tips = new() { InitialDelay = 350, ReshowDelay = 100 };
    /// <summary> 角色行分隔线颜色 </summary>
    private Color DividerColor = ThemePalette.Light.Border;

    /// <summary> 每个真实会话的原生子代理上限 </summary>
    private readonly ThemeComboBox? BudgetInput;
    public eFormationRole Role { get; }
    public int Capacity => SeatList.Length;
    public IEnumerable<FormationSeatSelection> Selections => SeatList.OfType<FormationSeatSelection>();
    public string Effort => ((EffortOption)EffortInput.SelectedItem!).Value;
    public int SubagentMax => BudgetInput?.SelectedItem is int Value ? Value : 0;
    public event Action<int>? SeatClicked;
    public event Action? ConfigurationChanged;

    public FormationRoleSelector(eFormationRole Role)
    {
        this.Role = Role;
        int capacity = Role == eFormationRole.Executor ? 4 : 1;
        SeatList = new FormationSeatSelection?[capacity];
        ButtonList = new FormationAvatarButton[capacity];
        Name = $"FormationRole{Role}";
        Dock = DockStyle.Fill;
        Margin = Padding.Empty;
        ColumnCount = 4;
        RowCount = 1;
        ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, LogicalToDeviceUnits(90)));
        ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, LogicalToDeviceUnits(115)));
        ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, LogicalToDeviceUnits(108)));
        Controls.Add(new Label
        {
            Text = SeatProviders.RoleTitle(Role), Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleLeft,
            Font = StudioFonts.Section, Margin = Padding.Empty
        }, 0, 0);

        var Seats = new FlowLayoutPanel
        {
            AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Anchor = AnchorStyles.Left,
            WrapContents = false, Margin = Padding.Empty
        };
        for (int index = 0; index < capacity; index++)
        {
            int slot = index;
            var Button = new FormationAvatarButton(48) { Name = $"FormationSeat{Role}{index + 1}", Tone = SeatProviders.RoleTone(Role) };
            Button.Click += (_, _) => SeatClicked?.Invoke(slot);
            ButtonList[index] = Button;
            Seats.Controls.Add(Button);
        }
        CountLabel = new StudioChip
        {
            Name = $"FormationCount{Role}", Tone = eTone.Neutral, Margin = new Padding(2, LogicalToDeviceUnits(13), 0, 0)
        };
        Seats.Controls.Add(CountLabel);
        Controls.Add(Seats, 1, 0);

        var EffortField = new TableLayoutPanel
        {
            AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, RowCount = 2,
            Anchor = AnchorStyles.Left | AnchorStyles.Right, Margin = Padding.Empty
        };
        EffortField.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        EffortField.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        EffortField.RowStyles.Add(new RowStyle(SizeType.Absolute, LogicalToDeviceUnits(30)));
        EffortLabel = new Label
        {
            AutoSize = true, Text = "推理强度", Tag = eThemeRole.Muted, Font = StudioFonts.Caption,
            Margin = new Padding(0, 0, 0, 3)
        };
        EffortInput = new ThemeComboBox
        {
            Name = $"FormationEffort{Role}", AccessibleName = SeatProviders.RoleTitle(Role) + "推理强度",
            Dock = DockStyle.Top, DropDownStyle = ComboBoxStyle.DropDownList, Margin = Padding.Empty
        };
        EffortInput.Items.AddRange(EffortList);
        EffortInput.SelectedIndex = 1;
        EffortField.Controls.Add(EffortLabel, 0, 0);
        EffortField.Controls.Add(EffortInput, 0, 1);
        EffortInput.SelectedIndexChanged += (_, _) => ConfigurationChanged?.Invoke();
        Controls.Add(EffortField, 2, 0);
        var BudgetField = new TableLayoutPanel
        {
            AutoSize = true, ColumnCount = 1, RowCount = 2, Anchor = AnchorStyles.Left | AnchorStyles.Right,
            Margin = new Padding(LogicalToDeviceUnits(12), 0, 0, 0)
        };
        BudgetField.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        BudgetField.Controls.Add(new Label { Text = "子代理上限", AutoSize = true, Font = StudioFonts.Caption, Tag = eThemeRole.Muted, Margin = new Padding(0, 0, 0, 3) }, 0, 0);
        if (Role is eFormationRole.Coordinator or eFormationRole.Executor or eFormationRole.Learner)
        {
            BudgetInput = new ThemeComboBox { Name = "FormationBudget" + Role, AccessibleName = SeatProviders.RoleTitle(Role) + "子代理上限", Dock = DockStyle.Top, DropDownStyle = ComboBoxStyle.DropDownList, Margin = Padding.Empty };
            BudgetInput.Items.AddRange(new object[] { 1, 2, 3, 4 });
            BudgetInput.SelectedItem = Role == eFormationRole.Coordinator ? 3 : Role == eFormationRole.Executor ? 2 : 1;
            BudgetInput.SelectedIndexChanged += (_, _) => ConfigurationChanged?.Invoke();
            BudgetField.Controls.Add(BudgetInput, 0, 1);
        }
        else BudgetField.Controls.Add(new Label { Text = "共享统筹预算", AutoSize = true, Font = StudioFonts.Small, Tag = eThemeRole.Muted, Margin = new Padding(0, 6, 0, 0) }, 0, 1);
        Controls.Add(BudgetField, 3, 0);
    }

    public FormationSeatSelection? SelectionAt(int Index) => SeatList[Index];

    public void SetSelection(int Index, FormationSeatSelection? Selection) => SeatList[Index] = Selection;

    public void SetEffort(string Value) => EffortInput.SelectedItem = EffortList.First(Option => Option.Value == Value);

    public void LoadTemplate(IEnumerable<FormationMember> Members, FormationMember Controller)
    {
        Array.Clear(SeatList);
        int index = 0;
        foreach (var Member in Members)
        {
            bool Follows = Member.FollowCoordinator;
            SeatList[index++] = new(Member, Follows);
        }
        if (BudgetInput is not null && Selections.FirstOrDefault()?.Member.SubagentMax is >= 1 and <= 4) BudgetInput.SelectedItem = Selections.First().Member.SubagentMax;
        string? FirstEffort = Selections.Select(Item => Item.Member.Effort).FirstOrDefault(Value => EffortList.Any(Option => Option.Value == Value));
        EffortInput.SelectedItem = EffortList.FirstOrDefault(Option => Option.Value == FirstEffort) ?? EffortList[1];
    }

    public void RefreshSeats(ManagerSettings Settings, FormationMember? Controller)
    {
        for (int index = 0; index < SeatList.Length; index++)
        {
            var Selection = SeatList[index];
            var Member = Selection?.FollowsCoordinator == true ? Controller : Selection?.Member;
            var Button = ButtonList[index];
            string? InstanceId = Selection?.Member.DispatchMode == eFormationDispatchMode.Native ? Controller?.InstanceId : Member?.InstanceId;
            Button.SetAvatar(Selection is not null, InstanceId, Settings);
            string title = SeatProviders.RoleTitle(Role) + (Capacity > 1 ? $"第 {index + 1} 席" : "席位");
            string target = Member is null ? "待选统筹" : SeatProviders.InstanceName(Settings, InstanceId ?? Member.InstanceId);
            string model = Member?.Model is { Length: > 0 } Model ? Model : "沿用默认模型";
            Button.AccessibleName = Selection is null ? "选择" + title
                : title + " · " + (Selection.FollowsCoordinator ? "跟随统筹 · " : "") + target + " · " + model;
            Tips.SetToolTip(Button, Button.AccessibleName);
        }

        int count = Selections.Count();
        CountLabel.Text = $"×{count}";
        CountLabel.Tone = count == 0 ? eTone.Neutral : SeatProviders.RoleTone(Role);
        bool HasExternal = Selections.Any(Item => !Item.FollowsCoordinator && !SeatProviders.For(Item.Member.InstanceId).SupportsEffort);
        bool HasCodex = Selections.Any(Item => Item.FollowsCoordinator || SeatProviders.For(Item.Member.InstanceId).SupportsEffort);
        bool Follows = Selections.Any() && Selections.All(Item => Item.FollowsCoordinator);
        EffortInput.Enabled = !Follows && (!HasExternal || HasCodex);
        if (BudgetInput is not null) BudgetInput.Enabled = !HasExternal || HasCodex;
        EffortLabel.Text = Follows ? "跟随统筹推理" : HasExternal ? HasCodex ? "推理强度 · Codex" : "沿用 Agent 推理" : "推理强度";
    }

    public void ApplyTheme(AppTheme Theme)
    {
        DividerColor = Theme.Palette.Border;
        BackColor = Color.Transparent;
        ForeColor = Theme.Palette.Text;
        Invalidate();
    }

    protected override void OnPaint(PaintEventArgs Event)
    {
        base.OnPaint(Event);
        using var Divider = new Pen(DividerColor);
        Event.Graphics.DrawLine(Divider, 0, 0, ClientSize.Width, 0);
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Tips.Dispose();
        base.Dispose(Disposing);
    }
}
