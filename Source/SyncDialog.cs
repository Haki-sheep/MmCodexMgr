namespace CodexInstanceManager;

public sealed class SyncDialog : Form
{
    private readonly ComboBox SourceInput = new() { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill };
    private readonly CheckBox SkillsOption = new() { Text = "用户 Skills", Checked = true, AutoSize = true };
    private readonly CheckBox McpOption = new() { Text = "MCP 配置", Checked = true, AutoSize = true };
    private readonly CheckBox RulesOption = new() { Text = "AGENTS.md 与 rules", Checked = true, AutoSize = true };
    private readonly CheckBox PluginsOption = new() { Text = "插件配置与缓存", AutoSize = true };
    private readonly TextBox PreviewText = new() { Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Both, WordWrap = false, Dock = DockStyle.Fill, BackColor = Color.White };
    private readonly Label Summary = new() { Dock = DockStyle.Fill, AutoSize = true };
    private readonly Button ApplyButton;
    private readonly Button PreviewButton;
    private readonly InstanceProfile Destination;
    private SyncPlan? CurrentPlan;

    public SyncDialog(List<InstanceProfile> ProfileList, InstanceProfile Destination)
    {
        SuspendLayout();
        this.Destination = Destination;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Text = "同步到 " + Destination.Name;
        Font = new Font("Microsoft YaHei UI", 10);
        ClientSize = new Size(760, 550);
        MinimumSize = new Size(720, 520);
        StartPosition = FormStartPosition.CenterParent;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(20), ColumnCount = 1, RowCount = 7 };
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 36));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 60));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 50));
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 38));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 45));
        Controls.Add(Root);
        Root.Controls.Add(new Label { Text = "来源实例 → " + Destination.Name, AutoSize = true, Font = new Font(Font, FontStyle.Bold) });
        foreach (var Profile in ProfileList.Where(Item => Item.Id != Destination.Id)) SourceInput.Items.Add(Profile);
        SourceInput.SelectedIndex = 0;
        Root.Controls.Add(SourceInput);
        var Options = new FlowLayoutPanel { Dock = DockStyle.Fill };
        Options.Controls.AddRange(new Control[] { SkillsOption, McpOption, RulesOption, PluginsOption });
        Root.Controls.Add(Options);
        Root.Controls.Add(new Label { Dock = DockStyle.Fill, Text = "同名条目以来源为准，目标独有条目保留；覆盖前备份。\n模型与账号配置、auth.json、会话、MCP OAuth 凭据均不复制。", ForeColor = Color.DimGray });
        Root.Controls.Add(PreviewText);
        Root.Controls.Add(Summary);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft };
        ApplyButton = MainForm.MakeButton("执行同步", async (_, _) => await ApplyAsync(), true);
        ApplyButton.Enabled = false;
        PreviewButton = MainForm.MakeButton("生成预览", async (_, _) => await PreviewAsync());
        Actions.Controls.Add(ApplyButton);
        Actions.Controls.Add(PreviewButton);
        Root.Controls.Add(Actions);
        SourceInput.SelectedIndexChanged += (_, _) => InvalidatePlan();
        foreach (var Option in new[] { SkillsOption, McpOption, RulesOption, PluginsOption }) Option.CheckedChanged += (_, _) => InvalidatePlan();
        FormClosing += (_, Event) => { if (!PreviewButton.Enabled) Event.Cancel = true; };
        AutoScaleDimensions = new SizeF(96, 96);
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    private void InvalidatePlan() { CurrentPlan = null; ApplyButton.Enabled = false; Summary.Text = "选项已变化，请重新生成预览"; }
    private async Task PreviewAsync()
    {
        PreviewButton.Enabled = false;
        ApplyButton.Enabled = false;
        try
        {
            Summary.Text = "正在扫描文件与配置…";
            var Source = (InstanceProfile)SourceInput.SelectedItem!;
            var Options = new SyncOptions { Skills = SkillsOption.Checked, Mcp = McpOption.Checked, Instructions = RulesOption.Checked, Plugins = PluginsOption.Checked };
            CurrentPlan = await Task.Run(() => ConfigSync.Preview(Source, Destination, Options));
            PreviewText.Text = string.Join(Environment.NewLine, CurrentPlan.FileList.Select(File => (File.OriginalHash is null ? "新增  " : "覆盖  ") + Path.GetRelativePath(CurrentPlan.DestinationRoot, File.Destination)));
            Summary.Text = $"{CurrentPlan.FileList.Count} 个文件需要更新  ·  {CurrentPlan.TotalBytes / 1024d / 1024d:F2} MB";
            ApplyButton.Enabled = CurrentPlan.FileList.Count > 0;
        }
        catch (Exception Error) { CurrentPlan = null; Program.LogError(Error); Summary.Text = Error.Message; MessageBox.Show(this, Error.Message, "预览失败"); }
        finally { PreviewButton.Enabled = true; }
    }

    private async Task ApplyAsync()
    {
        if (CurrentPlan is null) return;
        if (InstanceService.Find(Destination, InstanceService.ListRunning()) is not null)
        {
            MessageBox.Show(this, "请先退出目标 Codex 实例，再执行同步。\n这样可以避免运行中的配置被覆盖或写回。", "目标实例正在运行");
            return;
        }
        if (MessageBox.Show(this, $"将更新 {Destination.Name} 的 {CurrentPlan.FileList.Count} 个文件\n同名文件会覆盖，原内容会备份。", "确认同步", MessageBoxButtons.OKCancel) != DialogResult.OK) return;
        PreviewButton.Enabled = false;
        ApplyButton.Enabled = false;
        var Progress = new Progress<string>(Text => Summary.Text = Text);
        try
        {
            string Backup = await Task.Run(() => ConfigSync.Apply(CurrentPlan, ManagerPaths.BackupRoot, Progress));
            Summary.Text = "同步完成";
            MessageBox.Show(this, "同步完成，重新打开目标实例即可加载。\nMCP OAuth 如有提示，请在目标实例重新授权。\n\n备份目录\n" + Backup, "同步完成");
            CurrentPlan = null;
        }
        catch (Exception Error) { Program.LogError(Error); MessageBox.Show(this, Error.Message, "同步失败"); }
        finally { PreviewButton.Enabled = true; }
    }
}
