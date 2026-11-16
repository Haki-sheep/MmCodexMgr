namespace CodexInstanceManager;

internal sealed class FormationWorkspaceField : TableLayoutPanel
{
    private sealed record ProjectOption(string Id, string Label)
    {
        public override string ToString() => Label;
    }

    private readonly ManagerSettings Settings;
    private readonly Func<string, CancellationToken, Task<IReadOnlyList<AgentProject>>> LoadProjects;
    private readonly ThemeComboBox ProjectInput = new() { Name = "FormationSeatWorkspace", AccessibleName = "选择工作区", Dock = DockStyle.Top, DropDownStyle = ComboBoxStyle.DropDownList, Margin = Padding.Empty };
    private readonly TextBox FolderInput = new() { Name = "FormationSeatFolder", AccessibleName = "席位工作目录", Dock = DockStyle.Top, MaxLength = 1024, Margin = Padding.Empty };
    private readonly Label FixedValue = new() { Name = "FormationInheritedWorkspace", Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleLeft };
    private readonly Label Status = new() { Name = "FormationWorkspaceStatus", Font = StudioFonts.Caption, Tag = eThemeRole.Muted, AutoEllipsis = true, Dock = DockStyle.Fill, Margin = Padding.Empty, TextAlign = ContentAlignment.MiddleLeft };
    private readonly StudioButton RefreshButton = new() { Text = "刷新", Name = "FormationRefreshWorkspace", Dock = DockStyle.Top, AutoSize = false, Margin = new Padding(6, 0, 0, 0) };
    private readonly StudioButton BrowseButton = new() { Text = "浏览", Name = "FormationBrowseWorkspace", Dock = DockStyle.Top, AutoSize = false, Margin = new Padding(6, 0, 0, 0) };
    private string? InstanceId;
    private bool Inherited;
    private CancellationTokenSource? Pending;

    public FormationWorkspaceField(ManagerSettings Settings, Func<string, CancellationToken, Task<IReadOnlyList<AgentProject>>>? LoadProjects)
    {
        this.Settings = Settings;
        this.LoadProjects = LoadProjects ?? ReadProjectsAsync;
        AutoSize = true;
        Dock = DockStyle.Top;
        Margin = Padding.Empty;
        ColumnCount = 3;
        RowCount = 2;
        ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, LogicalToDeviceUnits(64)));
        ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, LogicalToDeviceUnits(72)));
        RowStyles.Add(new RowStyle(SizeType.Absolute, LogicalToDeviceUnits(32)));
        RowStyles.Add(new RowStyle(SizeType.Absolute, LogicalToDeviceUnits(18)));
        var ValueHost = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        ValueHost.Controls.AddRange(new Control[] { FixedValue, ProjectInput, FolderInput });
        var ActionHost = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        ActionHost.Controls.AddRange(new Control[] { RefreshButton, BrowseButton });
        Controls.Add(new Label { Text = "工作区", AutoSize = true, Anchor = AnchorStyles.Left, Margin = Padding.Empty }, 0, 0);
        Controls.Add(ValueHost, 1, 0);
        Controls.Add(ActionHost, 2, 0);
        Controls.Add(Status, 1, 1);
        SetColumnSpan(Status, 2);
        ProjectInput.Visible = RefreshButton.Visible = FolderInput.Visible = BrowseButton.Visible = false;
        FixedValue.Text = "请选择 Agent";
        RefreshButton.Click += async (_, _) => await ReloadAsync();
        BrowseButton.Click += (_, _) =>
        {
            using var Dialog = new FolderBrowserDialog { Description = "选择席位的工作目录", UseDescriptionForTitle = true };
            if (Path.IsPathFullyQualified(FolderInput.Text.Trim())) Dialog.InitialDirectory = FolderInput.Text.Trim();
            if (Dialog.ShowDialog(FindForm()) == DialogResult.OK) FolderInput.Text = Dialog.SelectedPath;
        };
    }

    public void RefreshTarget(string? TargetId, bool Inherited, FormationMember? Original)
    {
        if (InstanceId == TargetId && this.Inherited == Inherited) return;
        Pending?.Cancel();
        Pending = null;
        InstanceId = TargetId;
        this.Inherited = Inherited;
        bool UsesFolder = TargetId is not null && !Inherited && SeatProviders.For(TargetId).UsesCwd;
        bool SelectsProject = TargetId is not null && !Inherited && !UsesFolder;
        FixedValue.Visible = Inherited || TargetId is null;
        FixedValue.Text = Inherited ? "沿用统筹工作区" : "请选择 Agent";
        ProjectInput.Visible = RefreshButton.Visible = SelectsProject;
        FolderInput.Visible = BrowseButton.Visible = UsesFolder;
        Status.Text = "";
        if (SelectsProject)
            ReplaceProjects(Array.Empty<AgentProject>(), Original?.Project ?? "");
        if (UsesFolder)
        {
            FolderInput.Text = Original?.Cwd ?? "";
            FolderInput.PlaceholderText = TargetId == ClaudeRelayRunner.InstanceId || TargetId == CursorRelayRunner.InstanceId && Settings.Cursor.WorkingDirectory.Length == 0
                ? "请选择工作目录" : "留空使用默认工作目录";
        }
    }

    public async Task ReloadAsync()
    {
        string? TargetId = InstanceId;
        if (TargetId is null || Inherited || SeatProviders.For(TargetId).UsesCwd) return;
        Pending?.Cancel();
        using var Request = new CancellationTokenSource();
        Pending = Request;
        Status.Text = "正在读取工作区…";
        try
        {
            var Items = await Task.Run(() => LoadProjects(TargetId, Request.Token), Request.Token);
            if (!Request.IsCancellationRequested)
            {
                ReplaceProjects(Items, SelectedProject);
                Status.Text = Items.Count == 0 ? "该 Agent 暂无已登记项目" : "";
            }
        }
        catch (OperationCanceledException) when (Request.IsCancellationRequested) { }
        catch (Exception Error)
        {
            if (!Request.IsCancellationRequested) Status.Text = "读取失败 · " + Error.Message;
        }
        finally
        {
            if (ReferenceEquals(Pending, Request)) Pending = null;
        }
    }

    public string SelectedProject => !Inherited && InstanceId is not null && !SeatProviders.For(InstanceId).UsesCwd &&
        ProjectInput.SelectedItem is ProjectOption Option ? Option.Id : "";
    public string SelectedFolder => !Inherited && InstanceId is not null && SeatProviders.For(InstanceId).UsesCwd ? FolderInput.Text.Trim() : "";

    public bool ValidateSelection()
    {
        string Folder = SelectedFolder;
        if (InstanceId is null || Inherited || !SeatProviders.For(InstanceId).UsesCwd) return true;
        if (Folder.Length == 0 && (InstanceId == ClaudeRelayRunner.InstanceId ||
            InstanceId == CursorRelayRunner.InstanceId && Settings.Cursor.WorkingDirectory.Length == 0))
        {
            Status.Text = "该 Agent 新建会话需要工作目录";
            return false;
        }
        if (Folder.Length == 0 || Path.IsPathFullyQualified(Folder)) return true;
        Status.Text = "工作目录须为绝对路径";
        return false;
    }

    private void ReplaceProjects(IReadOnlyList<AgentProject> Items, string Selected)
    {
        var Default = new ProjectOption("", InstanceId == DshRelayRunner.InstanceId ? "默认 DSH 工作区" : "无项目");
        var OptionList = Items.Select(Item => new ProjectOption(Item.Id, Item.Name + " · " + Item.Path)).ToList();
        var Match = Items.Where(Item => Item.Id == Selected || Item.Name == Selected || string.Equals(Item.Path, Selected, StringComparison.OrdinalIgnoreCase)).ToList();
        var Target = Selected.Length == 0 ? Default
            : Match.Count == 1 ? OptionList.Single(Item => Item.Id == Match[0].Id) : new ProjectOption(Selected, "已保存 · " + Selected);
        ProjectInput.BeginUpdate();
        try
        {
            ProjectInput.Items.Clear();
            ProjectInput.Items.Add(Default);
            ProjectInput.Items.AddRange(OptionList.ToArray());
            if (Target != Default && !OptionList.Contains(Target)) ProjectInput.Items.Add(Target);
            ProjectInput.SelectedItem = Target;
        }
        finally { ProjectInput.EndUpdate(); }
    }

    private async Task<IReadOnlyList<AgentProject>> ReadProjectsAsync(string TargetId, CancellationToken Cancellation)
    {
        if (TargetId != DshRelayRunner.InstanceId)
            return await AgentCatalog.ProjectsOnRunningDesktopAsync(Settings.InstanceList.Single(Item => Item.Id == TargetId), Cancellation);
        using var Client = await DshDesktopClient.ConnectAsync(Settings.Dsh, Cancellation);
        return Client.Workspaces().Select(Item => new AgentProject(Item.Id, Item.Name, Item.Path, false)).ToList();
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Pending?.Cancel();
        base.Dispose(Disposing);
    }
}
