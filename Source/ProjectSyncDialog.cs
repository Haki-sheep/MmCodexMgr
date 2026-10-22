namespace CodexInstanceManager;

public sealed class ProjectSyncDialog : Form
{
    private readonly ComboBox SourceInput = new() { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill };
    private readonly Label Summary = new() { Dock = DockStyle.Fill, AutoSize = true };
    private readonly Button SyncButton;
    private readonly InstanceProfile Destination;
    private bool Syncing;

    public ProjectSyncDialog(List<InstanceProfile> ProfileList, InstanceProfile Destination)
    {
        SuspendLayout();
        this.Destination = Destination;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Text = "一键同步工程 → " + Destination.Name;
        Font = new Font("Microsoft YaHei UI", 10);
        ClientSize = new Size(620, 300);
        MinimumSize = new Size(580, 330);
        StartPosition = FormStartPosition.CenterParent;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(20), ColumnCount = 1, RowCount = 5 };
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 40));
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 45));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 45));
        Root.Controls.Add(new Label { Text = "来源实例 → " + Destination.Name, AutoSize = true, Font = new Font(Font, FontStyle.Bold) });
        foreach (var Profile in ProfileList.Where(Item => Item.Id != Destination.Id)) SourceInput.Items.Add(Profile);
        SourceInput.SelectedItem = ProfileList.FirstOrDefault(Item => Item.IsPrimary && Item.Id != Destination.Id) ?? SourceInput.Items.Cast<InstanceProfile>().FirstOrDefault();
        Root.Controls.Add(SourceInput);
        Root.Controls.Add(new Label
        {
            Dock = DockStyle.Fill,
            Text = "将来源实例的全部工程添加到目标侧边栏。\n按工程目录去重，目标已有工程保留。\n不同步会话，不复制工程文件。\n请先退出目标实例，操作前会自动备份。",
            ForeColor = Color.DimGray
        });
        Root.Controls.Add(Summary);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft };
        SyncButton = MainForm.MakeButton("一键同步工程", async (_, _) => await SyncAsync(), true);
        SyncButton.Enabled = SourceInput.Items.Count > 0;
        Actions.Controls.Add(SyncButton);
        Root.Controls.Add(Actions);
        Controls.Add(Root);
        FormClosing += (_, Event) => { if (Syncing) Event.Cancel = true; };
        AutoScaleDimensions = new SizeF(96, 96);
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    private async Task SyncAsync()
    {
        Syncing = true;
        SourceInput.Enabled = false;
        SyncButton.Enabled = false;
        var Source = (InstanceProfile)SourceInput.SelectedItem!;
        var Progress = new Progress<string>(Text => Summary.Text = Text);
        try
        {
            using var Plan = await Task.Run(() => ProjectSyncService.Preview(Source, Destination, Progress));
            if (Plan.ProjectCount == 0)
            {
                Summary.Text = $"无需同步，{Plan.ExistingProjectCount} 个工程已存在";
                return;
            }
            string Backup = await Task.Run(() => ProjectSyncService.Apply(Plan, ManagerPaths.BackupRoot, Progress));
            Summary.Text = $"已新增 {Plan.ProjectCount} 个工程，保留 {Plan.ExistingProjectCount} 个已有工程";
            MessageBox.Show(this, Summary.Text + "\n重新打开目标实例即可查看工程列表。\n\n备份目录\n" + Backup, "工程同步完成");
        }
        catch (Exception Error) { Program.LogError(Error); Summary.Text = Error.Message; MessageBox.Show(this, Error.Message, "工程同步失败"); }
        finally { Syncing = false; SourceInput.Enabled = true; SyncButton.Enabled = true; }
    }
}
