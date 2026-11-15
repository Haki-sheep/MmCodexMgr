using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class AgentManagementService
{
    private static async Task<object> ListAntigravitySessionsAsync(JsonElement Arguments, CancellationToken Cancellation)
    {
        if (OptionalText(Arguments, "project") is not null) throw new InvalidOperationException("Antigravity 本地会话请按 ID 或完整标题查找");
        string? Selector = OptionalText(Arguments, "session");
        int Offset = Number(Arguments, "offset", 0);
        if (Offset < 0) throw new InvalidOperationException("offset 不能小于零");
        using var Client = AntigravityDesktopClient.Connect();
        var SessionList = (await Client.SessionsAsync(Cancellation)).Where(Session => MatchesAntigravity(Session, Selector)).ToList();
        return new
        {
            instance_id = AntigravityRelayRunner.InstanceId,
            offset = Offset,
            total = SessionList.Count,
            sessions = SessionList.Skip(Offset).Take(50).Select(Session => new
            {
                id = Session.Id, title = Session.Title, cwd = Session.Cwd, running = Session.Running, updated_at = Session.UpdatedAt
            }).ToList()
        };
    }

    private static bool MatchesAntigravity(AntigravitySession Session, string? Selector) =>
        Selector is null || Session.Id.Equals(Selector, StringComparison.OrdinalIgnoreCase) || Session.Title == Selector;

    private async Task<object> StartAntigravityAsync(InstanceProfile Caller, string ThreadId, JsonElement Arguments, RelayTask? Existing,
        RelayWorkspace? Workspace, string Key, CancellationToken Cancellation)
    {
        foreach (string Parameter in new[] { "project", "cursor_cli_path", "model" })
            if (Arguments.TryGetProperty(Parameter, out _))
                throw new InvalidOperationException("Antigravity 使用 cwd 选择新会话工作目录并沿用桌面模型 不接受 " + Parameter);
        string? CreateTitle = OptionalText(Arguments, "create_title");
        string? Selector = OptionalText(Arguments, "session");
        if ((CreateTitle is null) == (Selector is null)) throw new InvalidOperationException("session 与 create_title 必须且只能提供一个");
        if (CreateTitle?.Length > 120) throw new InvalidOperationException("create_title 最多 120 字符");
        string Cwd = OptionalText(Arguments, "cwd") ?? "";
        if (Selector is not null && Cwd.Length != 0) throw new InvalidOperationException("复用 Antigravity 会话时沿用原工作目录");
        if (Cwd.Length != 0)
        {
            if (!Path.IsPathFullyQualified(Cwd) || !Directory.Exists(Cwd)) throw new InvalidOperationException("cwd 必须是存在的绝对目录");
            Cwd = ManagerPaths.Normalize(Cwd);
        }
        int SubagentMax = ReadSubagentMax(Arguments, Caller, ThreadId, Existing);
        var WorkerLimits = ReadWorkerLimits(Arguments, SubagentMax) ?? new RelayAgentLimits { SubagentMax = 0, SessionMax = 0, CrossAgentMax = 0 };
        if (WorkerLimits.SubagentMax != 0 || WorkerLimits.SessionMax != 0 || WorkerLimits.CrossAgentMax != 0)
            throw new InvalidOperationException("Antigravity 当前直接执行任务 worker_limits 必须全部为零");
        string WorkerId = "";
        string WorkerTitle = CreateTitle ?? "";
        if (Selector is not null)
        {
            if (Existing?.Channel.WorkerInstance.Id == AntigravityRelayRunner.InstanceId &&
                (Existing.Channel.WorkerThreadId.Equals(Selector, StringComparison.OrdinalIgnoreCase) || Existing.Channel.WorkerTitle == Selector))
            {
                WorkerId = Existing.Channel.WorkerThreadId;
                WorkerTitle = Existing.Channel.WorkerTitle;
                Cwd = Existing.Channel.WorkingDirectory;
            }
            else
            {
                using var Client = AntigravityDesktopClient.Connect();
                var Session = Unique((await Client.SessionsAsync(Cancellation)).Where(Value => MatchesAntigravity(Value, Selector)).ToList(),
                    "Antigravity 会话", Value => Value.Id, Value => Value.Title);
                if (Session.Running) throw new InvalidOperationException("Antigravity 桌面会话正在执行");
                WorkerId = Session.Id;
                WorkerTitle = Session.Title;
                Cwd = Session.Cwd;
            }
        }
        var Main = Catalog.Session(Caller, ThreadId);
        var Route = new RelayChannel
        {
            MainInstance = Caller, MainThreadId = ThreadId, MainTitle = Main.Title,
            WorkerInstance = new() { Id = AntigravityRelayRunner.InstanceId, Name = AntigravityRelayRunner.Name, HomePath = AntigravityDesktopClient.HomePath },
            WorkerThreadId = WorkerId, WorkerTitle = WorkerTitle, CreateTitle = CreateTitle ?? "",
            WorkingDirectory = Cwd, TimeoutMinutes = Number(Arguments, "timeout_minutes", 60)
        };
        var Item = await Coordinator.DispatchAsync(Caller.Id, ThreadId, Key, Text(Arguments, "title"), Text(Arguments, "instructions"), Text(Arguments, "acceptance"), Route,
            Number(Arguments, "session_max", 1), SubagentMax, CrossAgentMax: Number(Arguments, "cross_agent_max", 1),
            WorkerLimits: WorkerLimits, TreeBudget: ReadTreeBudget(Arguments), Workspace: Workspace);
        return new
        {
            task_id = Item.Id, state = RelayLimits.StateText(Item.State), instance_id = AntigravityRelayRunner.InstanceId,
            thread_id = Item.Channel.WorkerThreadId, cwd = Item.Channel.WorkingDirectory, worker_limits = Item.WorkerLimits,
            instruction = Item.State == eRelayState.Running ? RelayLimits.DispatchWaitInstruction : "按已保存的任务状态继续处理"
        };
    }
}
