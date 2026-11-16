namespace CodexInstanceManager;

public sealed class FormationLifecycleDialog : StudioDialog
{
    public FormationLifecycleDialog(string Theme, FormationLifecyclePlan Plan, ManagerSettings Settings)
        : base((Plan.Action == "delete" ? "彻底删除" : Plan.Action == "archive" ? "归档" : "取消归档") + " · " + Theme, new Size(760, 590))
    {
        Content.ColumnCount = 1;
        Content.RowCount = 3;
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        string Summary = Plan.Action == "delete" ? "永久删除此编队及下列关联会话 不能撤销\nCodex 可能在原应用中要求再次确认 删除成果文件不属于本操作"
            : Plan.Action == "archive" ? "使用各 Agent 的原生归档 已归档的会话会跳过"
            : "恢复由本编队归档的会话 保留其余会话当前状态\n取消归档后调度保持暂停 可手动恢复";
        Content.Controls.Add(new StudioWrapLabel { Text = Summary, Dock = DockStyle.Top, Margin = new Padding(0, 0, 0, 12) }, 0, 0);
        var Rows = Plan.TargetList.Select(Item =>
        {
            var Chat = Item.Conversation;
            string Action = !Chat.Exists ? "已不存在 · 跳过" : Plan.Action == "delete" ? "将永久删除"
                : Chat.Archived == Item.DesiredArchived ? (Chat.Archived ? Plan.Action == "archive" ? "已归档 · 跳过" : "已归档 · 保持" : "未归档 · 保持")
                : Item.DesiredArchived ? "将归档" : "将取消归档";
            return $"{Action}   {Chat.Title}\r\n{SeatProviders.InstanceName(Settings, Chat.InstanceId)} · {Chat.SessionId}";
        });
        Content.Controls.Add(new TextBox
        {
            Text = Plan.TargetList.Count == 0 ? "此编队尚未创建真实会话" : string.Join("\r\n\r\n", Rows),
            ReadOnly = true, Multiline = true, Dock = DockStyle.Fill, ScrollBars = ScrollBars.Vertical
        }, 0, 1);
        Content.Controls.Add(new StudioWrapLabel
        {
            Text = Plan.CanApply ? $"共 {Plan.TargetList.Count} 个关联会话" : string.Join("\n", Plan.BlockerList.Distinct()),
            Dock = DockStyle.Top, Margin = new Padding(0, 12, 0, 0), Tag = Plan.CanApply ? eThemeRole.Muted : eThemeRole.Danger
        }, 0, 2);
        AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
        var Confirm = AddAction(Plan.Action == "delete" ? "确认彻底删除" : "确认", Plan.Action == "delete" ? eButtonKind.Danger : eButtonKind.Primary,
            (_, _) => DialogResult = DialogResult.OK);
        Confirm.Enabled = Plan.CanApply;
    }
}
