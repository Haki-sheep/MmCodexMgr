namespace CodexInstanceManager;

public enum eRelayState
{
    Sending, Running, Returning, Returned, Accepted, DispatchUncertain, ReturnUncertain, Cancelled, TimedOut, Interrupted
}

public sealed class RelayChannel
{
    public InstanceProfile MainInstance { get; set; } = new();
    public InstanceProfile WorkerInstance { get; set; } = new();
    public string MainThreadId { get; set; } = "";
    public string MainTitle { get; set; } = "";
    public string WorkerThreadId { get; set; } = "";
    public string WorkerTitle { get; set; } = "";
    public int TimeoutMinutes { get; set; } = 60;
    public string CallbackCliPath { get; set; } = "";
    public string ProjectId { get; set; } = "";
    public string CreateTitle { get; set; } = "";
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
    public int SubagentMax { get; set; }
    public int CrossAgentMax { get; set; } = 1;
    public RelayAgentLimits WorkerLimits { get; set; } = new();
}

public sealed class RelayAgentLimits
{
    public int SubagentMax { get; set; }
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
    public const int MaxTextLength = 16000;
    public const int MaxFrameBytes = 256 * 1024;
    public const int MaxDesktopFrameBytes = 8 * 1024 * 1024;
    public const int ConnectTimeoutMilliseconds = 4000;
    public const int RequestTimeoutSeconds = 45;
    public const int MaxEventCount = 48;
    public const int MaxEventLength = 2000;
    public const string McpName = "mm_codex_mgr";
    public static string Root => Path.Combine(ManagerPaths.Root, "relay");
    public static string PipeName => "MmCodexMgr-Relay-" + Environment.UserName;

    public static string StateText(eRelayState State) => State switch
    {
        eRelayState.Sending => "正在派发", eRelayState.Running => "执行中",
        eRelayState.Returning => "正在回传", eRelayState.Returned => "已回传 待主会话处理",
        eRelayState.Accepted => "验收通过", eRelayState.DispatchUncertain => "派发待核对",
        eRelayState.ReturnUncertain => "回传待核对", eRelayState.Cancelled => "已撤销",
        eRelayState.TimedOut => "已超时", eRelayState.Interrupted => "执行实例已退出", _ => throw new ArgumentOutOfRangeException(nameof(State))
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
        eRelayState.Returning or eRelayState.Returned => Outcome == "completed" ? "主Agent正在执行" : "已阻塞",
        eRelayState.Accepted or eRelayState.Cancelled => "已结束",
        eRelayState.DispatchUncertain or eRelayState.ReturnUncertain or eRelayState.TimedOut or eRelayState.Interrupted => "已阻塞",
        _ => throw new ArgumentOutOfRangeException(nameof(State))
    };
}
