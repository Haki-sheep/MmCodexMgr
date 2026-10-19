namespace CodexInstanceManager;

public sealed class RelayChannelEditor : UserControl
{
    private readonly ThemeComboBox MainInstanceInput = new() { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill };
    private readonly ThemeComboBox WorkerInstanceInput = new() { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill };
    private readonly ThemeComboBox MainThreadInput = new() { Dock = DockStyle.Fill };
    private readonly ThemeComboBox WorkerThreadInput = new() { Dock = DockStyle.Fill };
    private readonly NumericUpDown TimeoutInput = new() { Dock = DockStyle.Fill, Minimum = 1, Maximum = 1440, Value = 60 };
    private readonly RelayCoordinator Coordinator;
    private readonly Action<string> SetStatus;

    #region Layout
    public RelayChannelEditor(ManagerSettings Settings, RelayCoordinator Coordinator, Action<string> SetStatus)
    {
        this.Coordinator = Coordinator;
        this.SetStatus = SetStatus;
        BackColor = Color.White;
        Padding = new Padding(14, 10, 14, 8);
        var Table = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 4, RowCount = 4 };
        Table.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 78));
        Table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        Table.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 86));
        Table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        Table.RowStyles.Add(new RowStyle(SizeType.Absolute, 28));
        for (int Index = 0; Index < 2; Index++) Table.RowStyles.Add(new RowStyle(SizeType.Absolute, 33));
        Table.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var Title = new Label { Text = "通道设置", AutoSize = true, ForeColor = Color.FromArgb(53, 59, 77) };
        Table.Controls.Add(Title, 0, 0);
        Table.SetColumnSpan(Title, 4);
        AddField(Table, "主实例", MainInstanceInput, 0, 1);
        AddField(Table, "执行实例", WorkerInstanceInput, 2, 1);
        AddField(Table, "主会话", MainThreadInput, 0, 2);
        AddField(Table, "执行会话", WorkerThreadInput, 2, 2);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false };
        Actions.Controls.Add(MainForm.MakeButton("读取运行实例会话", async (_, _) => await RunAsync(LoadThreadsAsync)));
        Actions.Controls.Add(MainForm.MakeButton("保存通道", async (_, _) => await RunAsync(SaveAsync), true));
        Actions.Controls.Add(new Label { Text = "超时 分钟", AutoSize = true, Margin = new Padding(14, 8, 4, 0) });
        TimeoutInput.Dock = DockStyle.None;
        TimeoutInput.Width = 76;
        TimeoutInput.Margin = new Padding(0, 7, 0, 0);
        Actions.Controls.Add(TimeoutInput);
        Table.Controls.Add(Actions, 0, 3);
        Table.SetColumnSpan(Actions, 4);
        Controls.Add(Table);
        foreach (var Profile in Settings.InstanceList) { MainInstanceInput.Items.Add(Profile); WorkerInstanceInput.Items.Add(Profile); }
        MainInstanceInput.SelectedIndexChanged += (_, _) => MainThreadInput.Items.Clear();
        WorkerInstanceInput.SelectedIndexChanged += (_, _) => WorkerThreadInput.Items.Clear();
        var Channel = Coordinator.Channel;
        MainInstanceInput.SelectedItem = Settings.InstanceList.FirstOrDefault(Item => Item.Id == Channel?.MainInstance.Id) ?? Settings.InstanceList.FirstOrDefault();
        WorkerInstanceInput.SelectedItem = Settings.InstanceList.FirstOrDefault(Item => Item.Id == Channel?.WorkerInstance.Id) ?? Settings.InstanceList.Skip(1).FirstOrDefault();
        if (Channel is not null)
        {
            MainThreadInput.Items.Add(new RelayThread(Channel.MainThreadId, Channel.MainTitle, "已绑定"));
            MainThreadInput.SelectedIndex = 0;
            WorkerThreadInput.Items.Add(new RelayThread(Channel.WorkerThreadId, Channel.WorkerTitle, "已绑定"));
            WorkerThreadInput.SelectedIndex = 0;
            TimeoutInput.Value = Channel.TimeoutMinutes;
        }
    }

    private static void AddField(TableLayoutPanel Table, string Text, Control Input, int Column, int Row)
    {
        Table.Controls.Add(new Label { Text = Text, AutoSize = true, Margin = new Padding(0, 5, 0, 0) }, Column, Row);
        Table.Controls.Add(Input, Column + 1, Row);
    }
    #endregion

    #region Actions
    private async Task LoadThreadsAsync()
    {
        var Main = MainInstanceInput.SelectedItem as InstanceProfile ?? throw new InvalidOperationException("请选择主实例");
        var Worker = WorkerInstanceInput.SelectedItem as InstanceProfile ?? throw new InvalidOperationException("请选择执行实例");
        using var Bridge = new DesktopRelayBridge();
        var MainList = await Bridge.ListThreadsAsync(Main, CancellationToken.None);
        var WorkerList = await Bridge.ListThreadsAsync(Worker, CancellationToken.None);
        FillThreads(MainThreadInput, MainList);
        FillThreads(WorkerThreadInput, WorkerList);
        SetStatus($"已读取主实例 {MainList.Count} 条与执行实例 {WorkerList.Count} 条本地会话 可粘贴其他会话 ID");
    }

    private static void FillThreads(ComboBox Input, List<RelayThread> ThreadList)
    {
        string Previous = (Input.SelectedItem as RelayThread)?.Id ?? Input.Text.Trim();
        Input.Items.Clear();
        Input.Items.AddRange(ThreadList.Cast<object>().ToArray());
        Input.SelectedItem = ThreadList.FirstOrDefault(Item => Item.Id == Previous);
        if (Input.SelectedItem is null) Input.Text = Previous;
    }

    private async Task SaveAsync()
    {
        string MainId = (MainThreadInput.SelectedItem as RelayThread)?.Id ?? MainThreadInput.Text.Trim();
        string WorkerId = (WorkerThreadInput.SelectedItem as RelayThread)?.Id ?? WorkerThreadInput.Text.Trim();
        if (!Guid.TryParse(MainId, out _) || !Guid.TryParse(WorkerId, out _)) throw new InvalidOperationException("请选择会话 或粘贴有效的本地会话 UUID");
        await Coordinator.ConfigureAsync(new RelayChannel
        {
            MainInstance = MainInstanceInput.SelectedItem as InstanceProfile ?? throw new InvalidOperationException("请选择主实例"),
            WorkerInstance = WorkerInstanceInput.SelectedItem as InstanceProfile ?? throw new InvalidOperationException("请选择执行实例"),
            MainThreadId = MainId, MainTitle = (MainThreadInput.SelectedItem as RelayThread)?.Title ?? MainId,
            WorkerThreadId = WorkerId, WorkerTitle = (WorkerThreadInput.SelectedItem as RelayThread)?.Title ?? WorkerId,
            TimeoutMinutes = (int)TimeoutInput.Value, CallbackCliPath = AgentCliDeployment.LoadPath()
        });
        SetStatus("通道已保存");
    }

    private async Task RunAsync(Func<Task> Action)
    {
        Enabled = false;
        try { await Action(); }
        catch (Exception Error) { Program.LogError(Error); SetStatus(Error.Message + (Error.InnerException is null ? "" : " " + Error.InnerException.Message)); }
        finally { if (!IsDisposed) Enabled = true; }
    }
    #endregion
}
