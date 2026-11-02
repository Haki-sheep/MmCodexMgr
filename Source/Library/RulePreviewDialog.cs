using System.Text;

namespace CodexInstanceManager;

public sealed class RulePreviewDialog : Form
{
    public RulePreviewDialog(RuleSyncPlan Plan)
    {
        SuspendLayout();
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Text = "预览全局 Rule 差异";
        Font = new Font("Microsoft YaHei UI", 10);
        AutoScaleMode = AutoScaleMode.Dpi;
        ClientSize = new Size(1000, 680);
        MinimumSize = new Size(780, 520);
        StartPosition = FormStartPosition.CenterParent;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(20), ColumnCount = 1, RowCount = 4 };
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 46));
        Controls.Add(Root);
        Root.Controls.Add(new Label { Text = "来源  " + Plan.SourcePath, Dock = DockStyle.Fill, AutoEllipsis = true });
        var TargetInput = new ThemeComboBox { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
        foreach (var Change in Plan.ChangeList) TargetInput.Items.Add(Change.Target.Agent + "  →  " + Change.Target.PathValue);
        Root.Controls.Add(TargetInput);
        var Body = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 2 };
        Body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        Body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        Body.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
        Body.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var Before = new TextBox { Dock = DockStyle.Fill, Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Both, WordWrap = false };
        var After = new TextBox { Dock = DockStyle.Fill, Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Both, WordWrap = false };
        Body.Controls.Add(new Label { Text = "当前文件", AutoSize = true }, 0, 0);
        Body.Controls.Add(new Label { Text = "同步后", AutoSize = true }, 1, 0);
        Body.Controls.Add(Before, 0, 1);
        Body.Controls.Add(After, 1, 1);
        Root.Controls.Add(Body);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft };
        Actions.Controls.Add(MainForm.MakeButton("同步 " + Plan.ChangeList.Count + " 个文件", (_, _) => DialogResult = DialogResult.OK, true));
        Actions.Controls.Add(MainForm.MakeButton("取消", (_, _) => DialogResult = DialogResult.Cancel));
        Root.Controls.Add(Actions);
        TargetInput.SelectedIndexChanged += (_, _) => { var Change = Plan.ChangeList[TargetInput.SelectedIndex]; Before.Text = Change.OriginalHash is null ? "文件不存在 将创建" : Change.Before; After.Text = Encoding.UTF8.GetString(Change.ContentList); };
        TargetInput.SelectedIndex = 0;
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }
}
