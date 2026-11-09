namespace CodexInstanceManager;

public enum eRelayState
{
    Sending, Running, Returning, Returned, Accepted, DispatchUncertain, ReturnUncertain, Cancelled, TimedOut, Interrupted, Recovering
}

public sealed class RelayChannel
{
    public InstanceProfile MainInstance { get; set; } = new();
    public InstanceProfile WorkerInstance { get; set; } = new();
    public string MainThreadId { get; set; } = "";
    public string MainTitle { get; set; } = "";
    public string WorkerThreadId { get; set; } = "";
    public string WorkerTitle { get; set; } = "";
    /// <summary>等待执行回报的分钟数 零表示无限等待</summary>
    public int TimeoutMinutes { get; set; } = 60;
    public string CallbackCliPath { get; set; } = "";
    public string ProjectId { get; set; } = "";
    public string WorkingDirectory { get; set; } = "";
    public string WorkerModel { get; set; } = "";
    public string CursorCliPath { get; set; } = "";
    public string DshServerUrl { get; set; } = "";
    public string CreateTitle { get; set; } = "";
    public RelayTreeBudget TreeBudget { get; set; } = new();
}

public sealed class RelayTask
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RequestKey { get; set; } = "";
    public string ParentTaskId { get; set; } = "";
    public RelayChannel Channel { get; set; } = new();
    public string Title { get; set; } = "";
    public string Instructions { get; set; } = "";
    public string Acceptance { get; set; } = "";
    public eRelayState State { get; set; }
    public string Outcome { get; set; } = "";
    public string Result { get; set; } = "";
    public List<string> ArtifactList { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<string> EventList { get; set; } = new();
    public int SessionMax { get; set; } = 1;
    public int SubagentMax { get; set; } = RelayLimits.DefaultSubagentMax;
    public int CrossAgentMax { get; set; } = 1;
    public RelayAgentLimits WorkerLimits { get; set; } = new();
    public string TreeRootId { get; set; } = "";
    public int TreeDepth { get; set; } = 1;
    public RelayTreeBudget TreeBudget { get; set; } = new();
    public RelayWorkspace Workspace { get; set; } = new();
    public string ProgressStage { get; set; } = "";
    public string ProgressMessage { get; set; } = "";
    public DateTimeOffset? ProgressAt { get; set; }
    public DateTimeOffset? DeadlineAt { get; set; }
    public int RecoveryCount { get; set; }
}

public sealed class RelayTreeBudget
{
    public int MaxSessions { get; set; } = RelayLimits.DefaultTreeSessionMax;
    public int MaxDepth { get; set; } = RelayLimits.DefaultTreeMaxDepth;
}

public sealed class RelayWorkspace
{
    public string Access { get; set; } = "unspecified";
    public List<string> WritePathList { get; set; } = new();
}

public sealed record RelayReservation(string Id, string ParentTaskId, string TreeRootId, int TreeDepth, RelayTreeBudget Budget, string MainInstanceId, string MainThreadId, string WorkerInstanceId, string WorkerThreadId, RelayWorkspace Workspace);
public sealed record RelayTreeEntry(string Id, string Title, eRelayState State, string Outcome, string ParentTaskId, int ChildCount, string MainName, string WorkerName, string ProgressStage, string ProgressMessage, DateTimeOffset? ProgressAt)
{
    public string MainInstanceId { get; init; } = "";
    public string WorkerInstanceId { get; init; } = "";
    public string MainThreadId { get; init; } = "";
    public string WorkerThreadId { get; init; } = "";
    public string MainTitle { get; init; } = "";
    public string WorkerTitle { get; init; } = "";
    public string MainAgent => MainTitle.Length == 0 ? MainName : MainName + " / " + MainTitle;
    public string WorkerAgent => WorkerTitle.Length == 0 ? WorkerName : WorkerName + " / " + WorkerTitle;
}
public sealed record RelayVisibleRow(RelayTreeEntry Entry, int Depth, bool More = false);

public sealed class RelayAgentLimits
{
    public int SubagentMax { get; set; } = RelayLimits.DefaultSubagentMax;
    public int SessionMax { get; set; } = 1;
    public int CrossAgentMax { get; set; } = 1;
}

public sealed record RelayTaskSummary(string Id, string Title, eRelayState State, DateTimeOffset UpdatedAt, string Outcome);
public sealed record RelaySlot(string MainInstanceId, string MainThreadId, string WorkerInstanceId, string WorkerThreadId, int SessionMax, int CrossAgentMax);
public sealed record RelayThread(string Id, string Title, string Status)
{
    public override string ToString() => Title + "  ·  " + Status;
}

public static class RelayLimits
{
    public const int PageSize = 40;
    /// <summary>原生子代理的默认并发上限</summary>
    public const int DefaultSubagentMax = 3;
    /// <summary> 原生子代理的按需执行与叶子约束 </summary>
    public const string SubagentPolicy = "原生 Subagent 额度是并发上限 可以不开 不要求凑满 每个 Subagent 必须有立即可执行的具体任务 明确输入 可写范围 产物与验收 不得仅为占位开启或让其空等\n原生 Subagent 只能作为叶子直接干活 禁止递归创建 Subagent 或通过 Session 与跨实例转派绕过 创建时须在其任务提示中明确 subagent_max=0 session_max=0 cross_agent_max=0 并禁止继续委派\n主会话 独立子执行者和联调会话未指定时各默认可用 3 个 Subagent 实际上限以本次预算和宿主工具为准 Session 与联调树额度不占用原生 Subagent 额度";
    public const int DefaultTreeSessionMax = 8;
    public const int DefaultTreeMaxDepth = 3;
    public const int MaxTreeDepth = 32;
    public const int MaxTextLength = 16000;
    public const int MaxFrameBytes = 256 * 1024;
    public const int MaxDesktopFrameBytes = 8 * 1024 * 1024;
    public const int ConnectTimeoutMilliseconds = 4000;
    public const int RequestTimeoutSeconds = 45;
    public const int MaxEventCount = 48;
    public const int MaxEventLength = 2000;
    public const string McpName = "mm_codex_mgr";
    public const string DispatchWaitInstruction = "优先处理已到达且当前可核对的回传 继续推进其他已授权且依赖已满足的工作 当前无可推进事项且仍在等回传时才结束本轮等待事件 不轮询";
    public static string Root => Path.Combine(ManagerPaths.Root, "relay");
    public static string PipeName => "MmCodexMgr-Relay-" + Environment.UserName;

    public static string StateText(eRelayState State) => State switch
    {
        eRelayState.Sending => "正在派发", eRelayState.Running => "执行中",
        eRelayState.Returning => "正在回传", eRelayState.Returned => "已回传 待主会话处理",
        eRelayState.Accepted => "验收通过", eRelayState.DispatchUncertain => "派发待核对",
        eRelayState.ReturnUncertain => "回传待核对", eRelayState.Cancelled => "已撤销",
        eRelayState.TimedOut => "已超时", eRelayState.Interrupted => "执行恢复已阻塞", eRelayState.Recovering => "正在恢复原会话", _ => throw new ArgumentOutOfRangeException(nameof(State))
    };

    public static string OutcomeText(string Outcome) => Outcome switch
    {
        "" => "尚未回报", "completed" => "执行完成 待验证", "needs_decision" => "需要主会话判断", "failed" => "执行失败",
        _ => throw new InvalidDataException("未知回报类型 " + Outcome)
    };

    public static string DisplayStateText(eRelayState State, string Outcome) => State switch
    {
        eRelayState.Sending => "未开始",
        eRelayState.Running => "子Agent正在执行",
        eRelayState.Recovering => "正在恢复",
        eRelayState.Returning or eRelayState.Returned => Outcome == "completed" ? "主Agent正在执行" : "已阻塞",
        eRelayState.Accepted or eRelayState.Cancelled => "已结束",
        eRelayState.DispatchUncertain or eRelayState.ReturnUncertain or eRelayState.TimedOut or eRelayState.Interrupted => "已阻塞",
        _ => throw new ArgumentOutOfRangeException(nameof(State))
    };

    public static bool IsBlocked(eRelayState State, string Outcome, string Stage) => State switch
    {
        eRelayState.Running => Stage == "blocked",
        eRelayState.Returning or eRelayState.Returned => Outcome != "completed",
        eRelayState.DispatchUncertain or eRelayState.ReturnUncertain or eRelayState.TimedOut or eRelayState.Interrupted => true,
        _ => false
    };

    public static string ProgressStateText(eRelayState State, string Outcome, string Stage) => IsBlocked(State, Outcome, Stage)
        ? "已阻塞"
        : State == eRelayState.Running ? Stage.Length == 0 ? "未开始" : "子Agent正在执行" : DisplayStateText(State, Outcome);

    public static string StageText(string Stage) => Stage switch { "" => "等待执行方确认开始", "started" => "已确认开始", "progress" => "阶段进展", "blocked" => "执行方报告阻塞", _ => throw new InvalidDataException("未知进度阶段 " + Stage) };
    public static string WorkspaceText(string Access) => Access switch { "unspecified" => "未声明 当前任务未校验写入冲突", "read_only" => "只读", "write" => "限定范围写入", _ => throw new InvalidDataException("未知工作区类型 " + Access) };
}
