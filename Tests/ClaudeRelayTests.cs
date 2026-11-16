using System.Collections.Concurrent;
using System.Text.Json;
using CodexInstanceManager;

internal static class ClaudeRelayTests
{
    public static async Task RunAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "MmClaudeRelayTests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        try
        {
            string Workspace = Directory.CreateDirectory(Path.Combine(Root, "workspace")).FullName;
            string CodeHome = Directory.CreateDirectory(Path.Combine(Root, "claude-home")).FullName;
            string Outbox = Path.Combine(Root, "outbox");
            File.WriteAllText(Path.Combine(CodeHome, "CLAUDE.md"), "本测试只处理明确指定的临时文件和验收值。");
            File.WriteAllText(Path.Combine(Workspace, "fixture.txt"), "CLAUDE_RELAY_OK");
            var Store = new RelayStore(Path.Combine(Root, "relay"));
            var Bridge = new CaptureBridge();
            using var Coordinator = new RelayCoordinator(Store, Bridge, Claude: new ClaudeRelayRunner(Path.Combine(Root, "manager"), Outbox, CodeHome));
            var Settings = new ManagerSettings { InstanceList = new() { new() { Id = "main", Name = "测试主会话" } }, SelectedId = "main" };
            var Service = new AgentManagementService(Store, Coordinator, new FixtureCatalog(), "unused", () => Settings);
            Dictionary<string, object> Request(string Key, string Model, string? Session = null) => new()
            {
                ["request_id"] = Key, ["instance"] = "claude", [Session is null ? "create_title" : "session"] = Session ?? "Claude 联调验证",
                ["title"] = "Claude 联调验证 " + Key, ["instructions"] = "读取 fixture.txt 并以文件的精确内容作为 summary 其他文件不修改",
                ["acceptance"] = "summary 等于 fixture.txt 的内容 outcome 为 completed artifacts 为空",
                ["workspace"] = new { access = "read_only" }, ["cwd"] = Workspace, ["model"] = Model, ["timeout_minutes"] = 2
            };
            async Task<RelayTask> Dispatch(Dictionary<string, object> Arguments)
            {
                var Start = JsonSerializer.SerializeToElement(await Service.ExecuteAsync(new("main", "main-thread", "agent_start", JsonSerializer.SerializeToElement(Arguments)), CancellationToken.None));
                string TaskId = Start.GetProperty("task_id").GetString()!;
                var Finished = new TaskCompletionSource<RelayTask>(TaskCreationOptions.RunContinuationsAsynchronously);
                void Observe()
                {
                    var Item = Store.Get(TaskId);
                    if (Item.State is eRelayState.Returned or eRelayState.Accepted or eRelayState.ReturnUncertain or eRelayState.TimedOut) Finished.TrySetResult(Item);
                }
                Coordinator.Changed += Observe;
                try { Observe(); return await Finished.Task.WaitAsync(TimeSpan.FromMinutes(3)); }
                finally { Coordinator.Changed -= Observe; }
            }
            var OpusRequest = Request("opus", "claude-opus-5-5");
            var Opus = await Dispatch(OpusRequest);
            Require(Opus.State == eRelayState.Returned && Opus.Outcome == "completed" && Opus.Result == "CLAUDE_RELAY_OK" && Opus.ProgressStage == "started", Opus);
            await Coordinator.ReviewAsync("main", "main-thread", Opus.Id);
            Require((await Dispatch(OpusRequest)).Id == Opus.Id && Store.Count() == 1, Opus);
            var Resumed = await Dispatch(Request("resume", "claude-opus-5-5", Opus.Channel.WorkerThreadId));
            Require(Resumed.Outcome == "completed" && Resumed.Result == "CLAUDE_RELAY_OK" && Resumed.Channel.WorkerThreadId == Opus.Channel.WorkerThreadId, Resumed);
            await Coordinator.ReviewAsync("main", "main-thread", Resumed.Id);
            var Fable = await Dispatch(Request("fable", "claude-fable-5-2"));
            Require(Fable.State == eRelayState.Returned && Fable.Outcome == "completed" && Fable.Result == "CLAUDE_RELAY_OK" && Bridge.PromptList.Count == 3, Fable);
            await Coordinator.ReviewAsync("main", "main-thread", Fable.Id);
            string Allowed = Path.Combine(Workspace, "allowed.txt");
            var WriteRequest = Request("write", "claude-opus-5-5");
            WriteRequest["workspace"] = new { access = "write", write_paths = new[] { Allowed } };
            WriteRequest["instructions"] = "用 Write 工具新建 allowed.txt 文件 内容只写 VERIFIED 其他文件不要改 summary 填 WRITE_OK artifacts 填该文件绝对路径";
            WriteRequest["acceptance"] = "allowed.txt 内容为 VERIFIED summary 为 WRITE_OK";
            var Write = await Dispatch(WriteRequest);
            Require(Write.Outcome == "completed" && File.Exists(Allowed) && File.ReadAllText(Allowed).Trim() == "VERIFIED", Write);
            await Coordinator.ReviewAsync("main", "main-thread", Write.Id);
            var Restricted = Request("restricted", "claude-opus-5-5");
            Restricted["workspace"] = new { access = "write", write_paths = new[] { Allowed } };
            Restricted["instructions"] = "调用 Write 工具新建 outside.txt 内容写 TEST 这是一次权限回归测试 若工具拒绝则汇报 needs_decision";
            Restricted["acceptance"] = "管理器声明的允许写入范围只有 allowed.txt 越界的 Write 工具调用应被拒绝";
            var Blocked = await Dispatch(Restricted);
            Require(!File.Exists(Path.Combine(Workspace, "outside.txt")) && Blocked.Outcome == "needs_decision", Blocked);
            Console.WriteLine("PASS Claude live relay Opus Fable reuse idempotency write scope and callbacks");
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("测试清理路径越界");
            Directory.Delete(Root, true);
        }
    }

    private static void Require(bool Condition, RelayTask Item)
    {
        if (!Condition) throw new InvalidOperationException(Item.Title + " " + Item.State + " " + Item.Outcome + " " + Item.Result + " " + string.Join(" / ", Item.EventList));
    }

    private sealed class CaptureBridge : IRelayBridge
    {
        public ConcurrentQueue<string> PromptList { get; } = new();
        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Attachment, CancellationToken Cancellation)
        {
            if (Instance.Id != "main" || ThreadId != "main-thread") throw new InvalidOperationException("回传目标不匹配");
            PromptList.Enqueue(Prompt);
            return Task.CompletedTask;
        }
    }

    private sealed class FixtureCatalog : IAgentCatalog
    {
        public AgentSession Session(InstanceProfile Instance, string Id) => new(Id, "测试主会话", "", "");
        public List<AgentSession> Sessions(InstanceProfile Instance, AgentProject? Project, string? Selector, int Offset) => new();
        public Task<List<AgentProject>> ProjectsAsync(InstanceProfile Instance, CancellationToken Cancellation) => Task.FromResult(new List<AgentProject>());
        public Task RequireIdleAsync(InstanceProfile Instance, string Id, CancellationToken Cancellation) => Task.CompletedTask;
        public Task<RelayThread> CreateAsync(InstanceProfile Instance, AgentProject? Project, string Title, string Prompt, CancellationToken Cancellation) => throw new InvalidOperationException("Claude 派发不应创建 Codex 会话");
    }
}
