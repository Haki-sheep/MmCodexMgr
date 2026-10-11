namespace CodexInstanceManager;

public sealed class ConversationImportDialog : Form
{
    private readonly ComboBox SourceInput = new() { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill };
    private readonly TextBox PreviewText = new() { Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Both, WordWrap = false, Dock = DockStyle.Fill, BackColor = Color.White };
    private readonly Label Summary = new() { Dock = DockStyle.Fill, AutoEllipsis = true, TextAlign = ContentAlignment.MiddleLeft };
    private readonly Button PreviewButton;
    private readonly Button ApplyButton;
    private readonly InstanceProfile Destination;
    private ConversationImportPlan? CurrentPlan;
    private bool Busy;

    public ConversationImportDialog(List<InstanceProfile> ProfileList, InstanceProfile Destination)
    {
        this.Destination = Destination;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Text = "导入对话与项目 → " + Destination.Name;
        Font = new Font("Microsoft YaHei UI", 10);
        ClientSize = new Size(820, 590);
        MinimumSize = new Size(760, 540);
        StartPosition = FormStartPosition.CenterParent;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(20), ColumnCount = 1, RowCount = 6 };
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 38));
        Root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 54));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 44));
        Controls.Add(Root);
        Root.Controls.Add(new Label { Text = "来源实例 → " + Destination.Name, AutoSize = true, Font = new Font(Font, FontStyle.Bold) });
        foreach (var Profile in ProfileList.Where(Item => Item.Id != Destination.Id)) SourceInput.Items.Add(Profile);
        if (SourceInput.Items.Count > 0) SourceInput.SelectedIndex = 0;
        Root.Controls.Add(SourceInput);
        Root.Controls.Add(new Label { Dock = DockStyle.Fill, AutoSize = true, ForeColor = Color.DimGray, Text = "请先完成任务并退出目标实例，再生成预览。\n包含本地对话、归档和子任务；已有对话保留，正在使用的来源对话跳过。\n账号与配置保持独立，续聊使用目标模型；项目文件继续使用原路径。" });
        Root.Controls.Add(PreviewText);
        Summary.Text = "选择来源后生成预览";
        Root.Controls.Add(Summary);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft };
        ApplyButton = MainForm.MakeButton("备份并导入", async (_, _) => await ApplyAsync(), true);
        ApplyButton.Enabled = false;
        PreviewButton = MainForm.MakeButton("生成预览", async (_, _) => await PreviewAsync());
        Actions.Controls.Add(ApplyButton);
        Actions.Controls.Add(PreviewButton);
        Root.Controls.Add(Actions);
        SourceInput.SelectedIndexChanged += (_, _) => ClearPlan();
        FormClosing += (_, Event) => { if (Busy) Event.Cancel = true; };
        FormClosed += (_, _) => ClearPlan();
    }

    private void ClearPlan()
    {
        CurrentPlan?.Dispose();
        CurrentPlan = null;
        ApplyButton.Enabled = false;
    }

    private void SetBusy(bool Value)
    {
        Busy = Value;
        SourceInput.Enabled = !Value;
        PreviewButton.Enabled = !Value;
        ApplyButton.Enabled = !Value && CurrentPlan is not null && (CurrentPlan.ConversationList.Count > 0 || CurrentPlan.ProjectCount > 0);
    }

    private async Task PreviewAsync()
    {
        if (SourceInput.SelectedItem is not InstanceProfile Source) return;
        ClearPlan();
        PreviewText.Clear();
        SetBusy(true);
        var Progress = new Progress<string>(Text => Summary.Text = Text);
        try
        {
            CurrentPlan = await Task.Run(() => ConversationImportService.Preview(Source, Destination, Progress));
            var LineList = new List<string> { $"新增项目 {CurrentPlan.ProjectCount} 个  ·  保留目标原有 {CurrentPlan.TargetCount} 条对话  ·  相同 ID 跳过 {CurrentPlan.ExistingCount} 条", $"续聊模型：{CurrentPlan.Model ?? "目标默认模型"}", "" };
            LineList.AddRange(CurrentPlan.ConversationList.Select(Item => (Item.IsSubagent ? "子任务  " : Item.Archived ? "归档    " : "对话    ") + Item.Title));
            if (CurrentPlan.SkippedList.Count > 0) { LineList.Add(""); LineList.Add("本次跳过"); LineList.AddRange(CurrentPlan.SkippedList); }
            PreviewText.Text = string.Join(Environment.NewLine, LineList);
            Summary.Text = $"新增 {CurrentPlan.ConversationList.Count} 条对话（含归档与子任务） · 跳过 {CurrentPlan.SkippedList.Count} 条\n预计写入 {CurrentPlan.TotalBytes / 1024d / 1024d:F1} MB，导入前自动备份";
        }
        catch (Exception Error) { Program.LogError(Error); Summary.Text = Error.Message; MessageBox.Show(this, Error.Message, "预览失败"); }
        finally { SetBusy(false); }
    }

    private async Task ApplyAsync()
    {
        if (CurrentPlan is null) return;
        SetBusy(true);
        var Progress = new Progress<string>(Text => Summary.Text = Text);
        try
        {
            string Backup = await Task.Run(() => ConversationImportService.Apply(CurrentPlan, ManagerPaths.BackupRoot, Progress));
            ClearPlan();
            Summary.Text = "导入完成 重新启动目标实例即可查看";
            MessageBox.Show(this, "导入完成，重新启动目标实例即可查看。\n再次导入会保留目标已有对话。\n\n备份目录\n" + Backup, "导入完成");
        }
        catch (Exception Error) { Program.LogError(Error); Summary.Text = Error.Message; MessageBox.Show(this, Error.Message, "导入失败"); }
        finally { SetBusy(false); }
    }
}
