namespace CodexInstanceManager;

public sealed partial class AgentManagementService
{
    private CursorRelayRunner RequireCursor() => Coordinator.Cursor ?? throw new InvalidOperationException("当前管理器未启用 Cursor 执行端 请更新并重启管理器");

    private async Task<object> StartCursorAsync(ManagerSettings Settings, InstanceProfile Caller, string ThreadId, System.Text.Json.JsonElement Arguments, RelayTask? Existing, RelayWorkspace? Workspace, string Key, CancellationToken Cancellation)
    {
        var Cursor = RequireCursor();
        if (OptionalText(Arguments, "project") is not null) throw new InvalidOperationException("Cursor 联调请使用 cwd 绝对路径 不传入 Codex project");
        string? CreateTitle = OptionalText(Arguments, "create_title");
        string? Selector = OptionalText(Arguments, "session");
        if ((CreateTitle is null) == (Selector is null)) throw new InvalidOperationException("session 与 create_title 必须且只能提供一个");
        if (CreateTitle?.Length > 120) throw new InvalidOperationException("create_title 最多 120 字符");
        CursorSession? Session = null;
        if (Selector is not null) Session = Unique(Cursor.List(Selector, 0), "Cursor 会话", Item => Item.Id, Item => Item.Title);
        string Cwd = OptionalText(Arguments, "cwd") ?? Session?.Cwd ?? (Settings.Cursor.WorkingDirectory.Length == 0 ? null : Settings.Cursor.WorkingDirectory) ?? throw new InvalidOperationException("新建 Cursor 会话必须提供 cwd 绝对路径");
        if (!Path.IsPathFullyQualified(Cwd) || !Directory.Exists(Cwd)) throw new DirectoryNotFoundException("Cursor cwd 必须是存在的绝对目录 " + Cwd);
        Cwd = ManagerPaths.Normalize(Cwd);
        string Model = OptionalText(Arguments, "model") ?? Session?.Model ?? Settings.Cursor.Model;
        string Cli = OptionalText(Arguments, "cursor_cli_path") ?? Session?.CliPath ?? Existing?.Channel.CursorCliPath ?? CursorCli.ResolvePath(Settings.Cursor.CliPath.Length == 0 ? null : Settings.Cursor.CliPath);
        if (Existing is null) Cli = CursorCli.ResolvePath(Cli);
        if (Session is not null && (!ManagerPaths.Same(Session.Cwd, Cwd) || Session.Model != Model || !ManagerPaths.Same(Session.CliPath, Cli))) throw new InvalidOperationException("已有 Cursor 会话不能更换 cwd model 或 cursor_cli_path");
        if (Existing is null && Session is not null && Cursor.IsRunning(Session.Id)) throw new InvalidOperationException("Cursor 会话正在执行 不能同时派发另一项任务");
        int SubagentMax = ReadSubagentMax(Arguments, Caller, ThreadId, Existing);
        var WorkerLimits = ReadWorkerLimits(Arguments, SubagentMax) ?? new RelayAgentLimits { SubagentMax = 0, SessionMax = 0, CrossAgentMax = 0 };
        if (WorkerLimits.SubagentMax != 0 || WorkerLimits.SessionMax != 0 || WorkerLimits.CrossAgentMax != 0) throw new InvalidOperationException("Cursor 执行端目前只执行当前任务 worker_limits 必须全部为零");
        var Main = Catalog.Session(Caller, ThreadId);
        var Route = new RelayChannel
        {
            MainInstance = Caller, MainThreadId = ThreadId, MainTitle = Main.Title,
            WorkerInstance = CursorRelayRunner.Profile, WorkerThreadId = Session?.Id ?? "", WorkerTitle = Session?.Title ?? CreateTitle!,
            CreateTitle = CreateTitle ?? "", WorkingDirectory = Cwd, WorkerModel = Model, CursorCliPath = Cli,
            CallbackCliPath = CliPath, TimeoutMinutes = Number(Arguments, "timeout_minutes", 60)
        };
        Cancellation.ThrowIfCancellationRequested();
        var Item = await Coordinator.DispatchAsync(Caller.Id, ThreadId, Key, Text(Arguments, "title"), Text(Arguments, "instructions"), Text(Arguments, "acceptance"), Route,
            Number(Arguments, "session_max", 1), SubagentMax, CrossAgentMax: Number(Arguments, "cross_agent_max", 1), WorkerLimits: WorkerLimits, TreeBudget: ReadTreeBudget(Arguments), Workspace: Workspace);
        return new
        {
            task_id = Item.Id, state = RelayLimits.StateText(Item.State), instance_id = CursorRelayRunner.InstanceId,
            thread_id = Item.Channel.WorkerThreadId, cwd = Cwd, model = Model, worker_limits = Item.WorkerLimits,
            tree_budget = Item.TreeBudget, tree_depth = Item.TreeDepth, workspace = Item.Workspace,
            instruction = Item.State == eRelayState.Running ? "Cursor CLI 直接执行当前任务 管理器自动回传结果 " + RelayLimits.DispatchWaitInstruction : "返回原任务记录 不重复启动 Cursor 派发或回传待核对时先核对目标会话"
        };
    }
}
