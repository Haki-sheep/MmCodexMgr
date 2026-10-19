namespace CodexInstanceManager;

public sealed class RelayPage : UserControl
{
    private readonly RelayStore Store;
    private readonly RelayCoordinator Coordinator;
    private readonly AppTheme Theme;
    private readonly DataGridView TaskGrid = new();
    private readonly Label Status = new() { Dock = DockStyle.Fill, AutoSize = true, AutoEllipsis = true, Tag = eThemeRole.Muted, Visible = false };
    private readonly Label PageLabel = new() { AutoSize = true, Margin = new Padding(8, 10, 8, 0) };
    private List<RelayTaskSummary> SummaryList = new();
    private int Offset;
    private bool Busy;

    #region Layout
    public RelayPage(ManagerSettings Settings, RelayStore Store, RelayCoordinator Coordinator, AppTheme Theme, Action ToggleTheme)
    {
        SuspendLayout();
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        this.Store = Store;
        this.Coordinator = Coordinator;
        this.Theme = Theme;
        Tag = eThemeRole.Background;
        Dock = DockStyle.Fill;
        Padding = new Padding(24, 16, 24, 16);
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 4 };
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 44));
        Root.RowStyles.Add(new RowStyle(SizeType.Absolute, 170));
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        var Header = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1, Margin = Padding.Empty };
        Header.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Header.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        Header.Controls.Add(new Label { Text = "跨Agent管理", Font = new Font(Font.FontFamily, 17, FontStyle.Bold), AutoSize = true });
        var ThemeButton = MainForm.MakeButton(Theme.IsDark ? "☀ 日间" : "☾ 夜间", (_, _) => ToggleTheme());
        ThemeButton.Name = AppTheme.ToggleButtonName;
        ThemeButton.Margin = new Padding(0, 0, 0, 4);
        Header.Controls.Add(ThemeButton);
        Root.Controls.Add(Header);
        Root.Controls.Add(new RelayChannelEditor(Settings, Coordinator, SetStatus) { Dock = DockStyle.Fill, Tag = eThemeRole.Surface });
        var ListPanel = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Padding = new Padding(12), Margin = new Padding(0, 8, 0, 0), Tag = eThemeRole.Surface };
        ListPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        ListPanel.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));
        TaskGrid.Dock = DockStyle.Fill;
        TaskGrid.VirtualMode = true;
        TaskGrid.ReadOnly = true;
        TaskGrid.AllowUserToAddRows = false;
        TaskGrid.AllowUserToDeleteRows = false;
        TaskGrid.AllowUserToResizeRows = false;
        TaskGrid.RowHeadersVisible = false;
        TaskGrid.MultiSelect = false;
        TaskGrid.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
        TaskGrid.BorderStyle = BorderStyle.None;
        TaskGrid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
        TaskGrid.RowTemplate.Height = 44;
        TaskGrid.ColumnHeadersHeight = 34;
        TaskGrid.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
        TaskGrid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "序号", FillWeight = 10, SortMode = DataGridViewColumnSortMode.NotSortable });
        TaskGrid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "任务名", FillWeight = 48, SortMode = DataGridViewColumnSortMode.NotSortable });
        TaskGrid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "执行状态", FillWeight = 27, SortMode = DataGridViewColumnSortMode.NotSortable });
        TaskGrid.Columns.Add(new DataGridViewButtonColumn { HeaderText = "操作", FillWeight = 15, FlatStyle = FlatStyle.Flat });
        TaskGrid.CellValueNeeded += (_, Event) =>
        {
            if (Event.RowIndex < 0 || Event.RowIndex >= SummaryList.Count) return;
            var Item = SummaryList[Event.RowIndex];
            Event.Value = Event.ColumnIndex switch
            {
                0 => (object)(Offset + Event.RowIndex + 1), 1 => Item.Title,
                2 => RelayLimits.DisplayStateText(Item.State, Item.Outcome),
                3 => Item.State is eRelayState.Accepted or eRelayState.Cancelled ? "删除" : "中断任务",
                _ => throw new ArgumentOutOfRangeException(nameof(Event.ColumnIndex))
            };
        };
        TaskGrid.CellFormatting += (_, Event) =>
        {
            if (Event.ColumnIndex != 2 || Event.RowIndex < 0 || Event.RowIndex >= SummaryList.Count) return;
            var Item = SummaryList[Event.RowIndex];
            Event.CellStyle!.ForeColor = Item.State switch
            {
                eRelayState.Accepted => Theme.Palette.Success, eRelayState.Cancelled => Theme.Palette.Muted,
                eRelayState.DispatchUncertain or eRelayState.ReturnUncertain or eRelayState.TimedOut or eRelayState.Interrupted => Theme.Palette.Warning,
                eRelayState.Returned or eRelayState.Returning when Item.Outcome != "completed" => Theme.Palette.Warning,
                _ => Theme.Palette.Accent
            };
        };
        TaskGrid.CellContentClick += async (_, Event) =>
        {
            if (Event.ColumnIndex != 3 || Event.RowIndex < 0 || Event.RowIndex >= SummaryList.Count) return;
            var Item = SummaryList[Event.RowIndex];
            await RunAsync(() => Item.State is eRelayState.Accepted or eRelayState.Cancelled ? DeleteHistoryAsync(Item) : CancelAsync(Item.Id));
        };
        ListPanel.Controls.Add(TaskGrid);
        var Pages = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false };
        Pages.Controls.Add(MainForm.MakeButton("上一页", (_, _) => { if (Offset > 0) { Offset -= RelayLimits.PageSize; RefreshTasks(); } }));
        Pages.Controls.Add(PageLabel);
        Pages.Controls.Add(MainForm.MakeButton("下一页", (_, _) => { if (SummaryList.Count == RelayLimits.PageSize) { Offset += RelayLimits.PageSize; RefreshTasks(); } }));
        var Footer = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1, Margin = Padding.Empty };
        Footer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Footer.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        Footer.Controls.Add(Pages, 0, 0);
        Footer.Controls.Add(MainForm.MakeButton("清空已结束", async (_, _) => await RunAsync(ClearHistoryAsync)), 1, 0);
        ListPanel.Controls.Add(Footer);
        Root.Controls.Add(ListPanel);
        Root.Controls.Add(Status);
        Controls.Add(Root);
        Coordinator.Changed += OnChanged;
        RefreshTasks();
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) Coordinator.Changed -= OnChanged;
        base.Dispose(Disposing);
    }
    #endregion

    #region Refresh
    private void OnChanged()
    {
        if (IsDisposed || !IsHandleCreated) return;
        if (InvokeRequired)
        {
            try { BeginInvoke(OnChanged); }
            catch (InvalidOperationException) when (IsDisposed || Disposing || !IsHandleCreated) { }
            return;
        }
        if (Visible) RefreshTasks();
    }

    protected override void OnVisibleChanged(EventArgs Event)
    {
        base.OnVisibleChanged(Event);
        if (Visible && Store is not null) RefreshTasks();
    }

    private void RefreshTasks()
    {
        SummaryList = Store.List(Offset);
        if (SummaryList.Count == 0 && Offset > 0)
        {
            int TaskCount = Store.Count();
            Offset = TaskCount == 0 ? 0 : (TaskCount - 1) / RelayLimits.PageSize * RelayLimits.PageSize;
            SummaryList = Store.List(Offset);
        }
        TaskGrid.RowCount = SummaryList.Count;
        TaskGrid.Invalidate();
        PageLabel.Text = "第 " + (Offset / RelayLimits.PageSize + 1) + " 页";
    }

    private void SetStatus(string Text)
    {
        if (IsDisposed) return;
        Status.Text = Text;
        Status.Visible = Text.Length != 0;
    }
    #endregion

    #region Actions
    private async Task DeleteHistoryAsync(RelayTaskSummary Item)
    {
        if (MessageBox.Show(this, "删除任务记录「" + Item.Title + "」？\n对应的 Codex 对话和项目文件会保留", "删除任务记录", MessageBoxButtons.OKCancel, MessageBoxIcon.Warning) != DialogResult.OK) return;
        await Coordinator.DeleteHistoryAsync(Item.Id);
        SetStatus("已删除任务记录");
    }

    private async Task ClearHistoryAsync()
    {
        if (MessageBox.Show(this, "清空所有分页中的已结束任务记录？\n进行中和待处理任务会保留", "清空已结束任务", MessageBoxButtons.OKCancel, MessageBoxIcon.Warning) != DialogResult.OK) return;
        int DeletedCount = await Coordinator.ClearHistoryAsync();
        Offset = 0;
        SetStatus("已清空 " + DeletedCount + " 条已结束任务记录");
    }

    private async Task CancelAsync(string TaskId)
    {
        if (MessageBox.Show(this, "中断该任务的联调并拒绝后续回传\n执行会话中的模型和脚本需要手动停止", "中断任务", MessageBoxButtons.OKCancel, MessageBoxIcon.Information) != DialogResult.OK) return;
        await Coordinator.CancelAsync(TaskId);
        SetStatus("联调已中断");
    }

    private async Task RunAsync(Func<Task> Action)
    {
        if (Busy) return;
        Busy = true;
        try { await Action(); }
        catch (Exception Error) { Program.LogError(Error); SetStatus(Error.Message); }
        finally { Busy = false; if (!IsDisposed) RefreshTasks(); }
    }
    #endregion
}
