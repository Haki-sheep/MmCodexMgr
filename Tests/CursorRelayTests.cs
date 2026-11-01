using System.Text.Json;
using CodexInstanceManager;

internal static class CursorRelayTests
{
    private static int Count;

    #region Entry
    public static async Task RunAsync(bool Live = false)
    {
        string Root = Path.Combine(Path.GetTempPath(), "CursorRelayTests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        string CliPath = Path.Combine(Root, "cursor-fixture.exe");
        File.WriteAllText(CliPath, "fixture");
        var Fake = new FakeCli();
        using var Cursor = new CursorRelayRunner(Path.Combine(Root, "cursor"), Live ? null : Fake, Path.Combine(Root, "outbox"), Error => Console.Error.WriteLine(Error.Message));
        var Store = new RelayStore(Path.Combine(Root, "relay"));
        var Bridge = new FakeBridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge, Cursor);
        var Settings = new ManagerSettings { InstanceList = new() { new() { Id = "main", Name = "main" } }, SelectedId = "main" };
        var Service = new AgentManagementService(Store, Coordinator, new FakeCatalog(), "fixture-cli", () => Settings);
        Dictionary<string, object> Request(string Key, string? Session = null) => new()
        {
            ["request_id"] = Key, ["instance"] = "cursor", [Session is null ? "create_title" : "session"] = Session ?? "Cursor 验证",
            ["title"] = "只读通信验证", ["instructions"] = "目的：验证通信\n方式与数量：直接执行 不继续分工\n任务分析：不要调用工具 不读取或修改文件 summary 只填写 CURSOR_MANAGER_OK\n验收规范：返回指定 summary",
            ["acceptance"] = "summary 为 CURSOR_MANAGER_OK", ["workspace"] = new { access = "read_only" }, ["cwd"] = Root,
            ["cursor_cli_path"] = Live ? CursorCli.ResolvePath() : CliPath
        };
        async Task<JsonElement> StartAsync(Dictionary<string, object> Arguments) => JsonSerializer.SerializeToElement(await Service.ExecuteAsync(new("main", "main-thread", "agent_start", JsonSerializer.SerializeToElement(Arguments)), CancellationToken.None));
        async Task<RelayTask> AwaitAsync(string Key, Func<RelayTask, bool> Predicate)
        {
            var Ready = new TaskCompletionSource<RelayTask>(TaskCreationOptions.RunContinuationsAsynchronously);
            void Changed()
            {
                var Item = Store.FindRequest("main/main-thread/" + Key);
                if (Item is not null && Predicate(Item)) Ready.TrySetResult(Item);
            }
            Coordinator.Changed += Changed;
            try { Changed(); return await Ready.Task.WaitAsync(TimeSpan.FromMinutes(Live ? 4 : 1)); }
            finally { Coordinator.Changed -= Changed; }
        }

        var First = await StartAsync(Request("first"));
        string FirstId = First.GetProperty("task_id").GetString()!;
        string SessionId = First.GetProperty("thread_id").GetString()!;
        var Returned = await AwaitAsync("first", Item => Item.State == eRelayState.Returned);
        Require(Returned.Result == "CURSOR_MANAGER_OK" && Returned.Outcome == "completed", "Cursor result automatically returns through coordinator");
        Require(Returned.Channel.WorkerThreadId == SessionId && Returned.ProgressStage == "started", "started event binds the expected session");
        Require(Bridge.PromptList.Count == 1 && Bridge.PromptList[0].Contains("CURSOR_MANAGER_OK"), "main callback carries actual Cursor result");
        await Coordinator.ReviewAsync("main", "main-thread", FirstId);
        var Retry = await StartAsync(Request("first"));
        Require(Retry.GetProperty("task_id").GetString() == FirstId && Store.Count() == 1, "request retry does not create a second task");
        await StartAsync(Request("second", SessionId));
        var Second = await AwaitAsync("second", Item => Item.State == eRelayState.Returned);
        Require(Second.Channel.WorkerThreadId == SessionId && Second.Result == "CURSOR_MANAGER_OK", "follow-up reuses the same Cursor conversation");
        await Coordinator.ReviewAsync("main", "main-thread", Second.Id);
        if (Live) { Console.WriteLine($"PASS Cursor LIVE {Count} assertions; fixture={Root}; session={SessionId}"); return; }
        Require(Fake.CreateCount == 1 && Fake.RunCount == 2, "idempotent retry and follow-up do not create or execute extra sessions");
        Require(Fake.ArgumentList.Contains("--mode=ask") && !Fake.ArgumentList.Contains("--force"), "read-only dispatch uses ask mode without force");
        var Changed = Request("first");
        Changed["model"] = "changed";
        await RejectAsync(() => StartAsync(Changed), "same request cannot change model");
        var Escalation = Request("escalation");
        Escalation["worker_limits"] = new { session_max = 1 };
        await RejectAsync(() => StartAsync(Escalation), "Cursor leaf cannot acquire child collaboration budget");
        var BadDirectory = Request("bad-directory");
        BadDirectory["cwd"] = "relative";
        await RejectAsync(() => StartAsync(BadDirectory), "relative working directory rejected before delivery");
        Require(Store.Count() == 2, "invalid requests have no task or subprocess side effects");
        Fake.BadPayload = true;
        await StartAsync(Request("bad-payload"));
        var Bad = await AwaitAsync("bad-payload", Item => Item.State == eRelayState.Returned);
        Require(Bad.Outcome == "failed" && Bad.Result.Contains("协议失败"), "invalid model response cannot become completed");
        await RejectAsync(() => Coordinator.ReviewAsync("main", "main-thread", Bad.Id), "failed result cannot be accepted");
        await Coordinator.CancelAsync(Bad.Id);
        Fake.BadPayload = false;
        Fake.Hold = true;
        await StartAsync(Request("cancel"));
        var Running = await AwaitAsync("cancel", Item => Item.ProgressStage == "started");
        await RejectAsync(() => StartAsync(Request("busy", Running.Channel.WorkerThreadId)), "busy Cursor session cannot run a second task");
        await Coordinator.CancelAsync(Running.Id);
        await Fake.Cancelled.Task.WaitAsync(TimeSpan.FromSeconds(10));
        Require(Store.Get(Running.Id).State == eRelayState.Cancelled, "cancel signals Cursor process cancellation and rejects its result");
        Fake.Hold = false;
        Bridge.FailReturn = true;
        await StartAsync(Request("return-failed"));
        var FailedReturn = await AwaitAsync("return-failed", Item => Item.State == eRelayState.ReturnUncertain);
        Require(FailedReturn.Result == "CURSOR_MANAGER_OK" && Directory.EnumerateFiles(Path.Combine(Root, "outbox"), "*.pending.json").Any(), "unconfirmed main callback preserves result and local outbox");
        Bridge.FailReturn = false;
        await Coordinator.RetryReturnAsync(FailedReturn.Id);
        await Coordinator.ReviewAsync("main", "main-thread", FailedReturn.Id);
        await VerifyRestartAsync(Root, Settings, CliPath);
        VerifyProtocol(SessionId);
        await VerifyProcessCancellationAsync(Root);
        Console.WriteLine($"PASS Cursor relay {Count} assertions; fixture={Root}");
    }
    #endregion

    #region Checks
    private static async Task VerifyRestartAsync(string Root, ManagerSettings Settings, string CliPath)
    {
        var Fake = new FakeCli { Hold = true };
        using var Cursor = new CursorRelayRunner(Path.Combine(Root, "restart-cursor"), Fake, Path.Combine(Root, "restart-outbox"));
        string SessionId = Guid.NewGuid().ToString();
        new CursorSessionStore(Path.Combine(Root, "restart-cursor", "sessions")).Save(new(SessionId, "原会话", Root, "", CliPath));
        var Store = new RelayStore(Path.Combine(Root, "restart-store"));
        var Item = new RelayTask { Id = "restart", RequestKey = "restart", Title = "续跑", Instructions = "只读", Acceptance = "确认", State = eRelayState.Running, Workspace = new() { Access = "read_only" }, Channel = new() { MainInstance = Settings.InstanceList[0], MainThreadId = "main-thread", WorkerInstance = CursorRelayRunner.Profile, WorkerThreadId = SessionId, WorkingDirectory = Root, CursorCliPath = CliPath } };
        Store.Save(Item);
        using var Coordinator = new RelayCoordinator(Store, new FakeBridge(), Cursor);
        Require(Store.Get(Item.Id).State == eRelayState.Interrupted && Fake.RunCount == 0, "manager restart blocks stale Cursor execution without resending");
        await Coordinator.ResumeAsync("main", "main-thread", Item.Id);
        Require(Store.Get(Item.Id).Channel.WorkerThreadId == SessionId && Fake.CreateCount == 0, "manual resume retains original conversation");
        await Coordinator.CancelAsync(Item.Id);
    }

    private static void VerifyProtocol(string SessionId)
    {
        string Outer(string Result, string Id) => JsonSerializer.Serialize(new { type = "result", subtype = "success", is_error = false, result = Result, session_id = Id });
        string Valid = JsonSerializer.Serialize(new { outcome = "completed", summary = "verified", artifacts = Array.Empty<string>() });
        foreach (string Input in new[] { Outer(Valid, Guid.NewGuid().ToString()), Outer("plain text", SessionId), Outer(JsonSerializer.Serialize(new { outcome = "completed", summary = "verified", artifacts = new[] { "relative.txt" } }), SessionId) })
        {
            bool Rejected = false;
            try { CursorRelayRunner.ParseResult(Input, SessionId); } catch (Exception Error) when (Error is InvalidDataException or JsonException) { Rejected = true; }
            Require(Rejected, "wrong session malformed output and relative artifacts fail closed");
        }
        bool PathRejected = false;
        try { new CursorSessionStore(Path.GetTempPath()).Get("../outside"); } catch (InvalidDataException) { PathRejected = true; }
        Require(PathRejected, "session selector cannot escape metadata directory");
    }

    private static async Task VerifyProcessCancellationAsync(string Root)
    {
        using var Cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(1));
        bool Cancelled = false;
        try { await new CursorCli().RunAsync(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell", "v1.0", "powershell.exe"), Root, new[] { "-NoProfile", "-Command", "Start-Sleep -Seconds 60" }, null, Cancellation.Token); }
        catch (OperationCanceledException) { Cancelled = true; }
        Require(Cancelled, "real subprocess exits when cancellation is signalled");
    }

    private static async Task RejectAsync(Func<Task> Action, string Message)
    {
        bool Rejected = false;
        try { await Action(); } catch (InvalidOperationException) { Rejected = true; } catch (DirectoryNotFoundException) { Rejected = true; }
        Require(Rejected, Message);
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED: " + Message);
        Count++;
    }
    #endregion

    #region Fixtures
    private sealed class FakeCli : ICursorCli
    {
        public int CreateCount;
        public int RunCount;
        public bool BadPayload;
        public bool Hold;
        public List<string> ArgumentList = new();
        public TaskCompletionSource Cancelled = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public async Task<CursorCliResult> RunAsync(string CliPath, string Cwd, IReadOnlyList<string> Arguments, Func<string, Task>? OnLine, CancellationToken Cancellation)
        {
            if (Arguments[0] == "--version") return new(0, "2026.10.22-fixture", "");
            if (Arguments[0] == "status") return new(0, "Logged in", "");
            if (Arguments[0] == "create-chat") { CreateCount++; return new(0, Guid.NewGuid().ToString(), ""); }
            RunCount++;
            ArgumentList = Arguments.ToList();
            string SessionId = Arguments[ArgumentList.IndexOf("--resume") + 1];
            await OnLine!(JsonSerializer.Serialize(new { type = "system", subtype = "init", session_id = SessionId }));
            if (Hold)
            {
                try { await Task.Delay(Timeout.Infinite, Cancellation); }
                catch (OperationCanceledException) { Cancelled.TrySetResult(); throw; }
            }
            string Result = BadPayload ? "invalid result" : JsonSerializer.Serialize(new { outcome = "completed", summary = "CURSOR_MANAGER_OK", artifacts = Array.Empty<string>() });
            await OnLine(JsonSerializer.Serialize(new { type = "result", subtype = "success", is_error = false, result = Result, session_id = SessionId }));
            return new(0, "", "");
        }
    }

    private sealed class FakeBridge : IRelayBridge
    {
        public List<string> PromptList = new();
        public bool FailReturn;
        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation)
        {
            if (FailReturn) throw new IOException("fixture main return interrupted");
            PromptList.Add(Prompt);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeCatalog : IAgentCatalog
    {
        public AgentSession Session(InstanceProfile Instance, string Id) => new(Id, "测试主会话", "", "");
        public Task<List<AgentProject>> ProjectsAsync(InstanceProfile Instance, CancellationToken Cancellation) => throw new Exception("Cursor must not query Codex projects");
        public List<AgentSession> Sessions(InstanceProfile Instance, AgentProject? Project, string? Selector, int Offset) => throw new Exception("Cursor must not query Codex sessions");
        public Task RequireIdleAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation) => throw new Exception("Cursor must not use Codex idle check");
        public Task<RelayThread> CreateAsync(InstanceProfile Instance, AgentProject? Project, string Title, string Prompt, CancellationToken Cancellation) => throw new Exception("Cursor must not create a Codex conversation");
    }
    #endregion
}
