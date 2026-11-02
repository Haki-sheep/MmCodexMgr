namespace CodexInstanceManager;

public sealed class CodexSessionsPage : UserControl
{
    /// <summary> 已注册的实例配置 </summary>
    private readonly ManagerSettings Settings;
    /// <summary> 当前浏览的 Codex 实例 </summary>
    private readonly ThemeComboBox InstanceInput = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 160 };
    /// <summary> 本地会话列表 </summary>
    private readonly DataGridView SessionGrid = new();
    /// <summary> 分页与读取结果 </summary>
    private readonly Label Status = new() { AutoSize = true, Tag = eThemeRole.Muted, Margin = new Padding(8, 10, 0, 0) };
    /// <summary> 当前页会话 </summary>
    private List<AgentSession> SessionList = new();
    /// <summary> 当前分页偏移 </summary>
    private int Offset;
    /// <summary> 页面生命周期 </summary>
    private readonly CancellationTokenSource Lifetime = new();
    /// <summary> 正在打开会话 </summary>
    private bool Opening;
    public InstanceProfile? SelectedInstance => InstanceInput.SelectedItem as InstanceProfile;

    public CodexSessionsPage(ManagerSettings Settings)
    {
        SuspendLayout();
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        this.Settings = Settings;
        Dock = DockStyle.Fill;
        Padding = new Padding(16);
        Margin = new Padding(0, 12, 0, 0);
        Tag = eThemeRole.Surface;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2 };
        Root.RowStyles.Add(new(SizeType.Percent, 100));
        Root.RowStyles.Add(new(SizeType.Absolute, 44));
        SessionGrid.Dock = DockStyle.Fill;
        SessionGrid.ReadOnly = true;
        SessionGrid.AllowUserToAddRows = false;
        SessionGrid.AllowUserToDeleteRows = false;
        SessionGrid.AllowUserToResizeRows = false;
        SessionGrid.RowHeadersVisible = false;
        SessionGrid.MultiSelect = false;
        SessionGrid.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
        SessionGrid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
        SessionGrid.BorderStyle = BorderStyle.None;
        SessionGrid.RowTemplate.Height = 36;
        SessionGrid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "实例", FillWeight = 15, MinimumWidth = 100 });
        SessionGrid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "会话名称", FillWeight = 35, MinimumWidth = 160 });
        SessionGrid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "工作目录", FillWeight = 40, MinimumWidth = 180 });
        SessionGrid.Columns.Add(new DataGridViewButtonColumn { HeaderText = "操作", FillWeight = 10, MinimumWidth = 70, FlatStyle = FlatStyle.Flat });
        SessionGrid.CellContentClick += async (_, Event) => { if (Event.RowIndex >= 0 && Event.ColumnIndex == 3) await OpenAsync(Event.RowIndex); };
        SessionGrid.CellToolTipTextNeeded += (_, Event) => { if (Event.RowIndex >= 0 && Event.RowIndex < SessionList.Count) Event.ToolTipText = SessionList[Event.RowIndex].Id + "\n" + SessionList[Event.RowIndex].Cwd; };
        Root.Controls.Add(SessionGrid);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false };
        Actions.Controls.Add(InstanceInput);
        Actions.Controls.Add(MainForm.MakeButton("刷新会话", (_, _) => RefreshSessions()));
        Actions.Controls.Add(MainForm.MakeButton("上一页", (_, _) => { Offset = Math.Max(0, Offset - RelayLimits.PageSize); RefreshSessions(); }));
        Actions.Controls.Add(MainForm.MakeButton("下一页", (_, _) => { if (SessionList.Count == RelayLimits.PageSize) { Offset += RelayLimits.PageSize; RefreshSessions(); } }));
        Actions.Controls.Add(Status);
        Root.Controls.Add(Actions);
        Controls.Add(Root);
        InstanceInput.Items.AddRange(Settings.InstanceList.Cast<object>().ToArray());
        InstanceInput.SelectedItem = Settings.InstanceList.FirstOrDefault(Item => Item.Id == Settings.SelectedId) ?? Settings.InstanceList.FirstOrDefault();
        InstanceInput.SelectedIndexChanged += OnInstanceChanged;
        VisibleChanged += (_, _) => { if (Visible) { RefreshInstances(); RefreshSessions(); } };
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    private void OnInstanceChanged(object? Sender, EventArgs Event) { Offset = 0; RefreshSessions(); }

    private void RefreshInstances()
    {
        string? SelectedId = SelectedInstance?.Id;
        InstanceInput.SelectedIndexChanged -= OnInstanceChanged;
        InstanceInput.Items.Clear();
        InstanceInput.Items.AddRange(Settings.InstanceList.Cast<object>().ToArray());
        InstanceInput.SelectedItem = Settings.InstanceList.FirstOrDefault(Item => Item.Id == SelectedId) ?? Settings.InstanceList.FirstOrDefault(Item => Item.Id == Settings.SelectedId) ?? Settings.InstanceList.FirstOrDefault();
        InstanceInput.SelectedIndexChanged += OnInstanceChanged;
        if (SelectedInstance?.Id != SelectedId) Offset = 0;
    }

    private void RefreshSessions()
    {
        SessionGrid.Rows.Clear();
        SessionList.Clear();
        if (InstanceInput.SelectedItem is not InstanceProfile Instance) { Status.Text = "请先添加实例"; return; }
        if (!File.Exists(Path.Combine(Instance.HomePath, "state_5.sqlite"))) { Status.Text = "该实例尚无本地会话"; return; }
        try
        {
            SessionList = new AgentCatalog().Sessions(Instance, null, null, Offset);
            if (SessionList.Count == 0 && Offset > 0) { Offset = 0; SessionList = new AgentCatalog().Sessions(Instance, null, null, Offset); }
            foreach (var Item in SessionList) SessionGrid.Rows.Add(Instance.Name, Item.Title, Item.Cwd, "打开");
            Status.Text = "第 " + (Offset / RelayLimits.PageSize + 1) + " 页";
        }
        catch (Exception Error) { Program.LogError(Error); Status.Text = "读取失败 · " + Error.Message; }
    }

    private async Task OpenAsync(int Row)
    {
        if (Opening) return;
        Opening = true;
        var Instance = (InstanceProfile)InstanceInput.SelectedItem!;
        string ThreadId = SessionList[Row].Id;
        try { using var Bridge = new DesktopRelayBridge(); await Bridge.OpenAsync(Instance, ThreadId, Lifetime.Token); }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested) { }
        catch (Exception Error) { Program.LogError(Error); if (!IsDisposed) Status.Text = Error.Message; }
        finally { Opening = false; }
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) { Lifetime.Cancel(); Lifetime.Dispose(); }
        base.Dispose(Disposing);
    }
}
