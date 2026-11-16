namespace CodexInstanceManager;

/// <summary>
/// 编队卡片的紧凑席位行 角色组随可用宽度换行
/// </summary>
public sealed class FormationRoster : Control, IThemedControl
{
    private sealed record RoleGroup(eFormationRole Role, string Caption, List<FormationAvatarButton> Buttons);

    /// <summary> 与编队卡片同生命周期的角色分组 </summary>
    private readonly List<RoleGroup> GroupList = new();
    /// <summary> 席位状态与模型提示 </summary>
    private readonly ToolTip Tips = new() { InitialDelay = 350, ReshowDelay = 100, AutoPopDelay = 12000 };
    /// <summary> 当前卡片主题 </summary>
    private ThemePalette Colors = ThemePalette.Light;

    public IReadOnlyList<FormationMember> Members { get; private set; } = Array.Empty<FormationMember>();
    public event Action<FormationMember>? SeatClicked;
    public event Action? OutsiderRequested;

    public FormationRoster()
    {
        SetStyle(ControlStyles.SupportsTransparentBackColor, true);
        DoubleBuffered = true;
        ResizeRedraw = true;
        Name = "FormationRoster";
        BackColor = Color.Transparent;
    }

    internal void Build(FormationRun Run, ManagerSettings Settings, bool CanAddOutsider)
    {
        Members = Run.MemberList;
        SuspendLayout();
        foreach (var Role in SeatProviders.RoleOrder)
        {
            var SeatList = Members.Where(Item => Item.Role == Role).ToList();
            var ButtonList = new List<FormationAvatarButton>();
            for (int index = 0; index < SeatList.Count; index++)
            {
                var Member = SeatList[index];
                var Status = FormationCard.StatusFor(Run, Member);
                var Button = new FormationAvatarButton(36, true)
                {
                    Name = "FormationRosterSeat" + Member.Id,
                    Tone = SeatProviders.RoleTone(Role),
                    StatusTone = Status.Tone,
                    SeatNumber = SeatList.Count > 1 ? (index + 1).ToString() : "",
                    AccessibleName = Member.DisplayName.Length == 0 ? SeatProviders.RoleTitle(Role) + (index + 1) : Member.DisplayName,
                    AccessibleDescription = SeatProviders.Describe(Settings, Member) + Environment.NewLine + "状态 " + Status.Text
                };
                Button.SetAvatar(true, Member.InstanceId, Settings);
                Button.Click += (_, _) => SeatClicked?.Invoke(Member);
                Tips.SetToolTip(Button, Button.AccessibleDescription);
                ButtonList.Add(Button);
            }
            if (SeatList.Count == 0)
            {
                bool canAdd = Role == eFormationRole.Outsider && CanAddOutsider;
                string title = canAdd ? "补充外援" : Role == eFormationRole.Reviewer ? "未配置审核者 由统筹验收" : "未配置" + SeatProviders.RoleTitle(Role);
                var Button = new FormationAvatarButton(36, true)
                {
                    Name = "FormationRosterEmpty" + Role, Tone = SeatProviders.RoleTone(Role), Enabled = canAdd, TabStop = canAdd,
                    AccessibleName = title
                };
                if (canAdd)
                {
                    Button.Click += (_, _) => OutsiderRequested?.Invoke();
                    Tips.SetToolTip(Button, title);
                }
                ButtonList.Add(Button);
            }

            GroupList.Add(new(Role, SeatProviders.RoleTitle(Role) + " ×" + SeatList.Count, ButtonList));
            Controls.AddRange(ButtonList.ToArray());
        }
        ResumeLayout(false);
    }

    public void ApplyTheme(AppTheme Theme)
    {
        Colors = Theme.Palette;
        Invalidate();
    }

    public int MeasureHeight(int Width) => Arrange(Width, null);

    protected override void OnLayout(LayoutEventArgs Event)
    {
        base.OnLayout(Event);
        int heading = LogicalToDeviceUnits(20);
        int gap = LogicalToDeviceUnits(3);
        Arrange(ClientSize.Width, (Group, Bounds, Columns) =>
        {
            for (int index = 0; index < Group.Buttons.Count; index++)
            {
                var Button = Group.Buttons[index];
                Button.Location = new Point(Bounds.Left + index % Columns * (Button.Width + gap),
                    Bounds.Top + heading + index / Columns * (Button.Height + gap));
            }
        });
    }

    protected override void OnPaint(PaintEventArgs Event)
    {
        base.OnPaint(Event);
        int heading = LogicalToDeviceUnits(20);
        Arrange(ClientSize.Width, (Group, Bounds, _) =>
        {
            var CaptionBounds = new Rectangle(Bounds.Left + LogicalToDeviceUnits(2), Bounds.Top, Bounds.Width, heading);
            TextRenderer.DrawText(Event.Graphics, Group.Caption, StudioFonts.Caption, CaptionBounds, Colors.Tone(SeatProviders.RoleTone(Group.Role)).Fore,
                TextFormatFlags.SingleLine | TextFormatFlags.NoPadding | TextFormatFlags.EndEllipsis |
                TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
        });
    }

    private int Arrange(int Width, Action<RoleGroup, Rectangle, int>? Place)
    {
        int heading = LogicalToDeviceUnits(20);
        int caption = LogicalToDeviceUnits(66);
        int gap = LogicalToDeviceUnits(3);
        int columnGap = LogicalToDeviceUnits(17);
        int rowGap = LogicalToDeviceUnits(8);
        int x = 0;
        int y = 0;
        int rowHeight = 0;
        foreach (var Group in GroupList)
        {
            int step = Group.Buttons[0].Width + gap;
            int width = Math.Min(Width, Math.Max(caption, Group.Buttons.Count * step - gap));
            int columns = Math.Max(1, (width + gap) / step);
            int rows = (Group.Buttons.Count + columns - 1) / columns;
            int height = heading + rows * (Group.Buttons[0].Height + gap) - gap;
            if (x != 0 && x + width > Width)
            {
                y += rowHeight + rowGap;
                x = rowHeight = 0;
            }
            Place?.Invoke(Group, new Rectangle(x, y, width, height), columns);
            x += width + columnGap;
            rowHeight = Math.Max(rowHeight, height);
        }
        return y + rowHeight;
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Tips.Dispose();
        base.Dispose(Disposing);
    }
}
