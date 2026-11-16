using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class AgentManagementService
{
    private ClaudeRelayRunner RequireClaude() => Coordinator.Claude ?? throw new InvalidOperationException("当前管理器未启用 Claude Code 执行端");

    private async Task<object> StartClaudeAsync(InstanceProfile Caller, string ThreadId, JsonElement Arguments, RelayTask? Existing, RelayWorkspace? Workspace, string Key, string FormationRunId, CancellationToken Cancellation)
    {
        var Claude = RequireClaude();
        if (OptionalText(Arguments, "project") is not null || OptionalText(Arguments, "cursor_cli_path") is not null)
            throw new InvalidOperationException("Claude Code 使用 cwd 指定工程目录");
        string? CreateTitle = OptionalText(Arguments, "create_title");
        string? Selector = OptionalText(Arguments, "session");
        if ((CreateTitle is null) == (Selector is null)) throw new InvalidOperationException("session 与 create_title 必须且只能提供一个");
        if (CreateTitle?.Length > 120) throw new InvalidOperationException("create_title 最多 120 字符");
        var Session = Selector is null ? null : Unique(Claude.List(Selector, 0), "Claude Code 会话", Item => Item.Id, Item => Item.Title);
        string Cwd = OptionalText(Arguments, "cwd") ?? Session?.Cwd ?? throw new InvalidOperationException("新建 Claude Code 会话必须提供 cwd 绝对路径");
        if (!Path.IsPathFullyQualified(Cwd) || !Directory.Exists(Cwd)) throw new DirectoryNotFoundException("Claude Code cwd 必须是存在的绝对目录 " + Cwd);
        Cwd = ManagerPaths.Normalize(Cwd);
        string Model = OptionalText(Arguments, "model") ?? Session?.Model ?? ClaudeRelayRunner.DefaultModel;
        if (Model.Length > 128 || Model.Any(char.IsWhiteSpace) || Model.StartsWith('-')) throw new InvalidOperationException("Claude Code 模型 ID 无效");
        if (Session is not null && (!ManagerPaths.Same(Session.Cwd, Cwd) || Session.Model != Model))
            throw new InvalidOperationException("已有 Claude Code 会话须沿用原工作目录与模型");
        int SubagentMax = ReadSubagentMax(Arguments, Caller, ThreadId, Existing);
        var WorkerLimits = ReadWorkerLimits(Arguments, SubagentMax) ?? new RelayAgentLimits { SubagentMax = 0, SessionMax = 0, CrossAgentMax = 0 };
        if (WorkerLimits.SubagentMax != 0 || WorkerLimits.SessionMax != 0 || WorkerLimits.CrossAgentMax != 0)
            throw new InvalidOperationException("Claude Code 执行端的 worker_limits 必须全部为零");
        var Route = new RelayChannel
        {
            FormationRunId = FormationRunId,
            MainInstance = Caller, MainThreadId = ThreadId, MainTitle = Catalog.Session(Caller, ThreadId).Title,
            WorkerInstance = ClaudeRelayRunner.Profile, WorkerThreadId = Session?.Id ?? "", WorkerTitle = Session?.Title ?? CreateTitle!,
            CreateTitle = CreateTitle ?? "", WorkingDirectory = Cwd, WorkerModel = Model,
            TimeoutMinutes = Number(Arguments, "timeout_minutes", 60)
        };
        Cancellation.ThrowIfCancellationRequested();
        var Item = await Coordinator.DispatchAsync(Caller.Id, ThreadId, Key, Text(Arguments, "title"), Text(Arguments, "instructions"), Text(Arguments, "acceptance"), Route,
            Number(Arguments, "session_max", 1), SubagentMax, CrossAgentMax: Number(Arguments, "cross_agent_max", 1), WorkerLimits: WorkerLimits, TreeBudget: ReadTreeBudget(Arguments), Workspace: Workspace);
        return new
        {
            task_id = Item.Id, state = RelayLimits.StateText(Item.State), instance_id = ClaudeRelayRunner.InstanceId,
            thread_id = Item.Channel.WorkerThreadId, cwd = Item.Channel.WorkingDirectory, model = Item.Channel.WorkerModel, worker_limits = Item.WorkerLimits,
            instruction = Item.State == eRelayState.Running ? "Claude Code 直接执行任务 管理器自动回传结果 " + RelayLimits.DispatchWaitInstruction : "返回原任务记录 按当前状态处理"
        };
    }
}
