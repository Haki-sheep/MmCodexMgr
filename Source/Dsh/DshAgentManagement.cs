using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class AgentManagementService
{
    private async Task<object> StartDshAsync(ManagerSettings Settings, InstanceProfile Caller, string ThreadId, JsonElement Arguments, RelayTask? Existing, RelayWorkspace? Workspace, string Key, CancellationToken Cancellation)
    {
        if (Coordinator.Dsh is null) throw new InvalidOperationException("当前管理器未启用 DSH 请更新并重启管理器");
        foreach (string Parameter in new[] { "cwd", "model", "cursor_cli_path" })
            if (Arguments.TryGetProperty(Parameter, out _)) throw new InvalidOperationException("DSH 使用 project 选择工作区并沿用桌面会话模型 不接受 " + Parameter);
        string? CreateTitle = OptionalText(Arguments, "create_title");
        string? Selector = OptionalText(Arguments, "session");
        if ((CreateTitle is null) == (Selector is null)) throw new InvalidOperationException("session 与 create_title 必须且只能提供一个");
        if (CreateTitle?.Length > 120) throw new InvalidOperationException("create_title 最多 120 字符");
        using var Client = await DshDesktopClient.ConnectAsync(Settings.Dsh, Cancellation);
        string? Project = OptionalText(Arguments, "project");
        var ProjectList = Client.Workspaces();
        var SelectedProject = Project is null ? null : DshCli.ResolveWorkspace(ProjectList, Project);
        var SessionList = await Client.SessionsAsync(Cancellation);
        var Session = Selector is null ? null : Unique(SessionList.Where(Value => !Value.Archived && (Value.Id == Selector || Value.Title == Selector) && (SelectedProject is null || SelectedProject.SessionIdList.Contains(Value.Id))).ToList(), "DSH 会话", Value => Value.Id, Value => Value.Title);
        var TargetProject = SelectedProject ?? (Session is null ? ProjectList.Single(Value => Value.Default) : ProjectList.SingleOrDefault(Value => Value.SessionIdList.Contains(Session.Id)));
        if (Existing is null && Session?.Running == true) throw new InvalidOperationException("DSH 会话正在执行");
        int SubagentMax = ReadSubagentMax(Arguments, Caller, ThreadId, Existing);
        var WorkerLimits = ReadWorkerLimits(Arguments, SubagentMax) ?? new RelayAgentLimits { SubagentMax = 0, SessionMax = 0, CrossAgentMax = 0 };
        if (WorkerLimits.SubagentMax != 0 || WorkerLimits.SessionMax != 0 || WorkerLimits.CrossAgentMax != 0) throw new InvalidOperationException("DSH 当前直接执行任务 worker_limits 必须全部为零");
        var Main = Catalog.Session(Caller, ThreadId);
        var Route = new RelayChannel
        {
            MainInstance = Caller, MainThreadId = ThreadId, MainTitle = Main.Title,
            WorkerInstance = new() { Id = DshRelayRunner.InstanceId, Name = "DeepSeek Harness", HomePath = Client.Connection.HomePath },
            WorkerThreadId = Session?.Id ?? "", WorkerTitle = Session?.Title ?? CreateTitle!, CreateTitle = CreateTitle ?? "",
            ProjectId = TargetProject?.Id ?? "", WorkingDirectory = Session?.Cwd ?? TargetProject!.Path,
            DshServerUrl = Settings.Dsh.ServerUrl, TimeoutMinutes = Number(Arguments, "timeout_minutes", 60)
        };
        var Item = await Coordinator.DispatchAsync(Caller.Id, ThreadId, Key, Text(Arguments, "title"), Text(Arguments, "instructions"), Text(Arguments, "acceptance"), Route,
            Number(Arguments, "session_max", 1), SubagentMax, CrossAgentMax: Number(Arguments, "cross_agent_max", 1), WorkerLimits: WorkerLimits, TreeBudget: ReadTreeBudget(Arguments), Workspace: Workspace);
        string Instruction = Item.State == eRelayState.Running
            ? "管理器按原请求监测 DSH 桌面会话并回传结果 " + RelayLimits.DispatchWaitInstruction
            : "按已保存的任务状态继续处理 不重复派发";
        return new { task_id = Item.Id, state = RelayLimits.StateText(Item.State), instance_id = DshRelayRunner.InstanceId, thread_id = Item.Channel.WorkerThreadId, project_id = Item.Channel.ProjectId, cwd = Item.Channel.WorkingDirectory, worker_limits = Item.WorkerLimits, instruction = Instruction };
    }
}
