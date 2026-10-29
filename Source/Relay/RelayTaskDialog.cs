using System.Text.Json;

namespace CodexInstanceManager;

public sealed class RelayTaskDialog : Form
{
    private readonly RelayStore Store;
    private readonly RelayCoordinator Coordinator;
    private readonly string TaskId;
    private readonly TextBox Body = new() { Dock = DockStyle.Fill, Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Vertical };
    private readonly FlowLayoutPanel Actions = new() { Dock = DockStyle.Fill, AutoSize = true, WrapContents = true };
    private readonly AppTheme Theme;

    public RelayTaskDialog(RelayStore Store, RelayCoordinator Coordinator, string TaskId, AppTheme Theme)
    {
        this.Store = Store;
        this.Coordinator = Coordinator;
        this.TaskId = TaskId;
        this.Theme = Theme;
        Text = "任务详情与异常恢复";
        Font = new Font("Microsoft YaHei UI", 10);
        ClientSize = new Size(780, 610);
        MinimumSize = new Size(620, 450);
        StartPosition = FormStartPosition.CenterParent;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Padding = new Padding(16) };
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Root.Controls.Add(Body);
        Root.Controls.Add(Actions);
        Controls.Add(Root);
        RefreshDetails();
        Theme.Apply(this);
        HandleCreated += (_, _) => Theme.ApplyTitleBar(this);
        Shown += (_, _) => { Body.Select(0, 0); Actions.Controls[0].Focus(); };
    }

    private void RefreshDetails()
    {
        var Item = Store.Get(TaskId);
        int Slots = Store.Reservations().Count(Slot => (Slot.TreeRootId.Length == 0 ? new RelayPolicy(Store).RootId(Store.Get(Slot.Id)) : Slot.TreeRootId) == new RelayPolicy(Store).RootId(Item));
        Body.Text = $"任务 {Item.Title}\r\nID {Item.Id}\r\n上级任务 {Item.ParentTaskId}\r\n\r\n当前状态 {RelayLimits.StateText(Item.State)}\r\n进度阶段 {RelayLimits.StageText(Item.ProgressStage)}\r\n最后进度 {Item.ProgressAt?.ToLocalTime():yyyy-MM-dd HH:mm:ss}\r\n{Item.ProgressMessage}\r\n\r\n主会话 {Item.Channel.MainInstance.Name} / {Item.Channel.MainTitle}\r\n{Item.Channel.MainThreadId}\r\n执行会话 {Item.Channel.WorkerInstance.Name} / {Item.Channel.WorkerTitle}\r\n{Item.Channel.WorkerThreadId}\r\n项目 ID {Item.Channel.ProjectId}\r\n\r\n本树联调槽位 {Slots} / {Item.TreeBudget.MaxSessions}  当前层级 {Item.TreeDepth} / {Item.TreeBudget.MaxDepth}\r\n初始主会话不占槽位 等待下级的执行会话仍占槽位 原生 Subagent 未计入\r\n已中断联调的模型与脚本仍需手动停止\r\n\r\n写入声明 {RelayLimits.WorkspaceText(Item.Workspace.Access)}\r\n{string.Join("\r\n", Item.Workspace.WritePathList)}\r\n\r\n执行要求\r\n{Item.Instructions}\r\n\r\n验收规范\r\n{Item.Acceptance}\r\n\r\n执行结果 {RelayLimits.OutcomeText(Item.Outcome)}\r\n{Item.Result}\r\n\r\n产物\r\n{string.Join("\r\n", Item.ArtifactList)}\r\n\r\n事件记录\r\n{string.Join("\r\n", Item.EventList)}";
        foreach (Control Old in Actions.Controls.Cast<Control>().ToArray()) { Actions.Controls.Remove(Old); Old.Dispose(); }
        AddAction("刷新详情", () => Task.CompletedTask);
        if (Item.State == eRelayState.ReturnUncertain) AddAction("核对后重发回传", async () =>
        {
            if (MessageBox.Show(this, "请确认原主会话尚未收到本次结果\n重发可能重复唤醒该会话", "核对回传", MessageBoxButtons.OKCancel, MessageBoxIcon.Warning) == DialogResult.OK) await Coordinator.RetryReturnAsync(TaskId);
        });
        if (Item.State == eRelayState.DispatchUncertain) AddAction("核对执行会话已开始", () => ReconcileAsync(Item));
        if (Item.State == eRelayState.Interrupted) AddAction("恢复原任务", () => Coordinator.ResumeAsync(Item.Channel.MainInstance.Id, Item.Channel.MainThreadId, Item.Id));
        if (Item.State == eRelayState.Returned && Item.Outcome == "completed") AddAction("确认验收通过", () => Coordinator.ReviewAsync(Item.Channel.MainInstance.Id, Item.Channel.MainThreadId, Item.Id));
        AddAction("打开主会话", () => OpenThreadAsync(Item.Channel.MainInstance, Item.Channel.MainThreadId));
        if (Item.Channel.WorkerThreadId.Length != 0) AddAction("打开执行会话", () => OpenThreadAsync(Item.Channel.WorkerInstance, Item.Channel.WorkerThreadId));
        Theme.Apply(this);
        Body.Select(0, 0);
    }

    private void AddAction(string Label, Func<Task> Action) => Actions.Controls.Add(MainForm.MakeButton(Label, async (_, _) =>
    {
        Actions.Enabled = false;
        try { await Action(); RefreshDetails(); }
        catch (Exception Error) { Program.LogError(Error); MessageBox.Show(this, Error.Message, "操作未完成"); }
        finally { if (!IsDisposed) Actions.Enabled = true; }
    }));

    private async Task ReconcileAsync(RelayTask Item)
    {
        using var Prompt = new Form { Text = "核对已开始的执行会话", Font = Font, ClientSize = new Size(620, 160), StartPosition = FormStartPosition.CenterParent, FormBorderStyle = FormBorderStyle.FixedDialog, MinimizeBox = false, MaximizeBox = false };
        var Input = new TextBox { Dock = DockStyle.Top, Text = Item.Channel.WorkerThreadId };
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(16), ColumnCount = 1, RowCount = 3 };
        Root.Controls.Add(new Label { AutoSize = true, Text = "确认该会话已经收到并开始执行原任务后 填写准确会话 ID\n此操作只恢复结果接收 不重复发送任务" });
        Root.Controls.Add(Input);
        var Confirm = MainForm.MakeButton("确认已开始", (_, _) => Prompt.DialogResult = DialogResult.OK, true);
        Root.Controls.Add(Confirm);
        Prompt.Controls.Add(Root);
        Prompt.AcceptButton = Confirm;
        Theme.Apply(Prompt);
        if (Prompt.ShowDialog(this) != DialogResult.OK) return;
        var Service = new AgentManagementService(Store, Coordinator, new AgentCatalog(), AgentCliDeployment.LoadPath());
        await Service.ExecuteAsync(new(Item.Channel.MainInstance.Id, Item.Channel.MainThreadId, "agent_reconcile", JsonSerializer.SerializeToElement(new { task_id = Item.Id, session_id = Input.Text.Trim(), confirmed = true })), CancellationToken.None);
    }

    private async Task OpenThreadAsync(InstanceProfile Instance, string ThreadId) => await Coordinator.OpenSessionAsync(Instance, ThreadId, CancellationToken.None);
}
