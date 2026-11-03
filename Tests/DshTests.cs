using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CodexInstanceManager;

internal static class DshTests
{
    /// <summary> 断言数量 </summary>
    private static int Count;

    public static async Task RunAsync(bool Live = false)
    {
        string Root = Path.Combine(Path.GetTempPath(), "MmDshTests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        Exception? Failure = null;
        try
        {
            byte[] SecretList = Enumerable.Range(0, 32).Select(Value => (byte)Value).ToArray();
            File.WriteAllText(Path.Combine(Root, ".credentials.yaml"), "version: 1\nrecords:\n  client-connection/browser-session:\n    kind: grant\n    payload:\n      version: 1\n      secret: " + Convert.ToBase64String(SecretList).TrimEnd('=').Replace('+', '-').Replace('/', '_') + "\n");
            Directory.CreateDirectory(Path.Combine(Root, "storages"));
            File.WriteAllText(Path.Combine(Root, "storages", "workspace.json"), "{\"global\":{\"archivedSessionIds\":[]}}");
            string CustomHome = Path.Combine(Root, "任意数据目录 with spaces");
            var Host = DshDiscovery.ParseHost(19, "\"Z:\\Apps With Spaces\\DeepSeek Harness.exe\" --expose-internals \"Z:\\Apps With Spaces\\resources\\app.asar\\dsh\\node_modules\\@deepseek-ai\\dsh-desktop-host\\lib\\index.js\" \"Z:\\Other Runtime\" \"" + Path.Combine(CustomHome, "profiles", "desktop") + "\"");
            Require(Host is not null && ManagerPaths.Same(Host.HomePath, CustomHome), "host discovery handles arbitrary installation and data paths");
            Require(DshDiscovery.ResolveHome(null, new[] { Host! }) == CustomHome, "custom home inferred from running host");
            Reject(() => DshDiscovery.ResolveHome(null, new[] { Host!, new DshHost(20, Path.Combine(Root, "other")) }), "multiple homes need explicit selection");
            foreach (string Url in new[] { "https://example.com", "http://127.0.0.1:4/path", "http://name:pass@127.0.0.1:4", "http://127.0.0.1:4/?token=x" }) Reject(() => DshDiscovery.ValidateOrigin(Url), "reject non-loopback or credential-bearing URL");
            Require(DshDiscovery.ValidateOrigin("http://[::1]:37891").IsLoopback, "explicit IPv6 loopback supported");
            Require(AgentCli.Parse(new[] { "dsh-create", "--request-id", "stable", "--title", "测试" }).Command == "dsh-create", "direct creation CLI parsed");
            var Handler = new FakeHandler(Root);
            using (var Client = new DshDesktopClient(new(Root, new Uri("http://127.0.0.1:37891")), Handler))
            {
                await Client.CreateAsync("workspace", "测试标题", "session-test", CancellationToken.None);
                Require(Handler.Title == "测试标题" && Handler.Created == 1, "create and rename use desktop service");
                string Cookie = Handler.LastCookie;
                string[] PartList = Cookie[(Cookie.IndexOf('=') + 1)..].Split('.');
                string Signature = Convert.ToBase64String(HMACSHA256.HashData(SecretList, Encoding.UTF8.GetBytes(PartList[1]))).TrimEnd('=').Replace('+', '-').Replace('/', '_');
                Require(PartList[2] == Signature && !Cookie.Contains(Convert.ToBase64String(SecretList)), "short-lived authentication matches managed credential without exposing secret");
                await Client.PromptAsync("session-test", "request-test", "hello", CancellationToken.None);
                var Reply = await Client.ReplyAsync("session-test", "request-test", CancellationToken.None);
                Require(Reply?.Outcome == "completed" && Reply.Text.Contains("DSH_TEST_OK"), "durable reply matched by request and completed turn");
                Require(await Client.ReplyAsync("session-test", "other-request", CancellationToken.None) is null, "unrelated replies never satisfy requested identity");
                Handler.Complete = false;
                Require(await Client.ReplyAsync("session-test", "request-test", CancellationToken.None) is null, "partial assistant message is not completion");
                Handler.RequestId = "someone-else";
                await RejectAsync(() => Client.CancelRequestAsync("session-test", "request-test", CancellationToken.None), "cancel refuses unrelated active prompt");
                Require(Handler.Cancelled == 0, "no unrelated cancellation sent");
                Handler.RequestId = "request-test";
                await Client.CancelRequestAsync("session-test", "request-test", CancellationToken.None);
                Require(Handler.Cancelled == 1, "owned active prompt can be cancelled");
                Handler.Queued = true;
                await Client.CancelRequestAsync("session-test", "request-test", CancellationToken.None);
                Require(Handler.Removed == 1 && Handler.Cancelled == 1, "queued own request removed without cancelling another active turn");
                Handler.WrongRpc = true;
                await RejectAsync(() => Client.SessionAsync("session-test", CancellationToken.None), "RPC identity mismatch rejected");
            }
            await RelayAsync(Root);
            if (Live) await LiveAsync();
            Console.WriteLine("PASS DSH " + Count + " assertions" + (Live ? " including live desktop model round" : ""));
        }
        catch (Exception Error) { Failure = Error; throw; }
        finally
        {
            string TempRoot = Path.GetFullPath(Path.GetTempPath()).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            if (!Path.GetFullPath(Root).StartsWith(TempRoot, StringComparison.OrdinalIgnoreCase)) throw new IOException("DSH 测试清理越界");
            try { Directory.Delete(Root, true); }
            catch (Exception CleanupError) when (Failure is not null) { throw new AggregateException("DSH 测试与清理均失败 " + Root, Failure, CleanupError); }
        }
    }

    private static async Task RelayAsync(string Root)
    {
        var Handler = new FakeHandler(Root);
        using var Runner = new DshRelayRunner((Settings, Cancellation) => Task.FromResult(new DshDesktopClient(new(Root, new Uri("http://127.0.0.1:37891")), new SharedHandler(Handler))));
        var Store = new RelayStore(Path.Combine(Root, "relay"));
        var Bridge = new FakeBridge();
        using var Coordinator = new RelayCoordinator(Store, Bridge, Dsh: Runner);
        var Returned = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        Coordinator.Changed += () => { if (Store.FindRequest("stable-task")?.State == eRelayState.Returned) Returned.TrySetResult(true); };
        var Route = new RelayChannel { MainInstance = new() { Id = "main" }, MainThreadId = "main-thread", WorkerInstance = new() { Id = "dsh", HomePath = Root }, CreateTitle = "桌面任务", WorkerTitle = "桌面任务", ProjectId = "workspace", WorkingDirectory = Root, TimeoutMinutes = 1 };
        var Item = await Coordinator.DispatchAsync("main", "main-thread", "stable-task", "DSH 测试", "返回测试标记", "核对回传", Route, WorkerLimits: new() { SubagentMax = 0, SessionMax = 0, CrossAgentMax = 0 }, Workspace: new() { Access = "read_only" });
        await Returned.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Require(Store.Get(Item.Id).State == eRelayState.Returned && Store.Get(Item.Id).Result == "DSH_TEST_OK", "desktop result crosses existing coordinator and return bridge");
        var Again = await Coordinator.DispatchAsync("main", "main-thread", "stable-task", "DSH 测试", "返回测试标记", "核对回传", Route, WorkerLimits: new() { SubagentMax = 0, SessionMax = 0, CrossAgentMax = 0 }, Workspace: new() { Access = "read_only" });
        Require(Again.Id == Item.Id && Handler.Prompts == 1 && Handler.Created == 1, "same task request never recreates or resends");
        using var Observer = new DshRelayRunner((Settings, Cancellation) => Task.FromResult(new DshDesktopClient(new(Root, new Uri("http://127.0.0.1:37891")), new SharedHandler(Handler))));
        var Observed = new TaskCompletionSource<CursorReport>(TaskCreationOptions.RunContinuationsAsynchronously);
        Observer.Launch(Item, (_, _) => Task.CompletedTask, Report => { Observed.SetResult(Report); return Task.CompletedTask; }, CancellationToken.None, true);
        Require((await Observed.Task.WaitAsync(TimeSpan.FromSeconds(5))).Summary == "DSH_TEST_OK" && Handler.Prompts == 1, "recovery observes durable original request without replay");
    }

    private static async Task LiveAsync()
    {
        using var Client = await DshDesktopClient.ConnectAsync(SettingsStore.Load().Dsh, CancellationToken.None);
        for (int Index = 0; Index < 20; Index++) await Client.SessionsAsync(CancellationToken.None);
        Console.WriteLine("LIVE DSH 20 consecutive authenticated queries completed");
        var Workspace = Client.Workspaces().Single(Value => Value.Default);
        var Item = new RelayTask { Title = "DSH 接入验证", Instructions = "只聊天 不调用工具 不修改文件 最终 JSON 的 summary 必须为 DSH_LIVE_OK", Acceptance = "summary 等于 DSH_LIVE_OK 且无产物", Workspace = new() { Access = "read_only" }, Channel = new() { WorkerInstance = new() { Id = "dsh", HomePath = Client.Connection.HomePath }, WorkerTitle = "MmCodexMgr DSH 接入验证", CreateTitle = "MmCodexMgr DSH 接入验证", ProjectId = Workspace.Id, WorkingDirectory = Workspace.Path, DshServerUrl = SettingsStore.Load().Dsh.ServerUrl } };
        using var Runner = new DshRelayRunner();
        using var Timeout = new CancellationTokenSource(TimeSpan.FromSeconds(90));
        await Runner.PrepareAsync(Item, Timeout.Token);
        var Result = new TaskCompletionSource<CursorReport>(TaskCreationOptions.RunContinuationsAsynchronously);
        Runner.Launch(Item, (_, _) => Task.CompletedTask, Report => { Result.SetResult(Report); return Task.CompletedTask; }, Timeout.Token);
        var Report = await Result.Task.WaitAsync(Timeout.Token);
        Require(Report.Outcome == "completed" && Report.Summary == "DSH_LIVE_OK" && Report.Artifacts.Count == 0, "real desktop session=" + Item.Channel.WorkerThreadId + " result=" + JsonSerializer.Serialize(Report));
        Require(Client.Workspaces().Single(Value => Value.Default).SessionIdList.Contains(Item.Channel.WorkerThreadId), "real session attached to default workspace");
        Console.WriteLine("LIVE DSH session=" + Item.Channel.WorkerThreadId);
    }

    private static void Require(bool Value, string Message) { if (!Value) throw new Exception(Message); Count++; }
    private static void Reject(Action Action, string Message) { try { Action(); } catch (InvalidOperationException) { Count++; return; } throw new Exception(Message); }
    private static async Task RejectAsync(Func<Task> Action, string Message) { try { await Action(); } catch (Exception Error) when (Error is IOException or InvalidOperationException or InvalidDataException) { Count++; return; } throw new Exception(Message); }

    private sealed class FakeBridge : IRelayBridge
    {
        public TaskCompletionSource<bool> Returned { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation) { Returned.TrySetResult(true); return Task.CompletedTask; }
    }

    private sealed class SharedHandler : HttpMessageHandler
    {
        /// <summary> 跨连接复用的模拟服务 </summary>
        private readonly FakeHandler Shared;
        public SharedHandler(FakeHandler Shared) => this.Shared = Shared;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage Request, CancellationToken Cancellation) => Shared.DispatchAsync(Request, Cancellation);
    }

    private sealed class FakeHandler : HttpMessageHandler
    {
        /// <summary> 模拟工作目录 </summary>
        private readonly string Root;
        /// <summary> 模拟会话标识 </summary>
        public string Id = "session-test";
        /// <summary> 模拟会话标题 </summary>
        public string Title = "会话";
        /// <summary> 当前模拟请求 </summary>
        public string RequestId = "request-test";
        /// <summary> 最近认证头 </summary>
        public string LastCookie = "";
        /// <summary> 创建次数 </summary>
        public int Created;
        /// <summary> 发送次数 </summary>
        public int Prompts;
        /// <summary> 取消次数 </summary>
        public int Cancelled;
        /// <summary> 队列移除次数 </summary>
        public int Removed;
        /// <summary> 模拟待执行消息 </summary>
        public bool Queued;
        /// <summary> 模拟轮次结束 </summary>
        public bool Complete = true;
        /// <summary> 模拟响应标识损坏 </summary>
        public bool WrongRpc;
        public FakeHandler(string Root) => this.Root = Root;
        public Task<HttpResponseMessage> DispatchAsync(HttpRequestMessage Request, CancellationToken Cancellation) => SendAsync(Request, Cancellation);

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage Request, CancellationToken Cancellation)
        {
            LastCookie = Request.Headers.GetValues("Cookie").Single();
            using var Document = JsonDocument.Parse(await Request.Content!.ReadAsStringAsync(Cancellation));
            var Root = Document.RootElement;
            var Arguments = Root.GetProperty("payload").GetProperty("args");
            string Method = Root.GetProperty("method").GetString()!;
            var Args = Arguments.TryGetProperty("request", out var Value) ? Value : default;
            object Result;
            switch (Method)
            {
                case "session/create": Id = Args.GetProperty("sessionId").GetString()!; Created++; Result = new { sessionId = Id }; break;
                case "session/rename": Title = Args.GetProperty("title").GetString()!; Result = new { title = Title, seq = 3 }; break;
                case "session/list": Result = new { items = new[] { new { sessionId = Id, running = false, cwd = this.Root, projections = new { kind = "sequenced", asOfSeq = 4, values = new { title = Title } } } } }; break;
                case "session/prompt": RequestId = Args.GetProperty("requestId").GetString()!; Prompts++; Result = new { accepted = true }; break;
                case "session/projections": Result = new { kind = "sequenced", asOfSeq = 4, values = new { inbox = new Dictionary<string, object> { ["next-turn"] = Queued ? new object[] { new { id = "queue-item", source = new { kind = "user", rpcId = RequestId } } } : Array.Empty<object>(), ["next-step"] = Array.Empty<object>() } } }; break;
                case "session/page": Result = new { records = EventList().Select(Event => new { type = "event", @event = Event }).ToArray(), hasMore = false }; break;
                case "session/cancel": Cancelled++; Result = new { accepted = true }; break;
                case "session/updateQueue": Require(Args.GetProperty("itemId").GetString() == "queue-item" && Args.GetProperty("action").GetProperty("kind").GetString() == "remove", "only addressed queue occurrence removed"); Removed++; Queued = false; Result = new { accepted = true }; break;
                default: throw new Exception("unexpected RPC " + Method);
            }
            return new(HttpStatusCode.OK) { Content = new StringContent(JsonSerializer.Serialize(new { type = "server-response", rpcId = WrongRpc ? "wrong" : Root.GetProperty("rpcId").GetString(), result = new { ok = true, value = Result } }), Encoding.UTF8, "application/json") };
        }

        private List<object> EventList()
        {
            var List = new List<object>
            {
                new { type = "turn/start", seq = 0, data = new { turn = 1 } },
                new { type = "user/message", seq = 1, data = new { source = new { kind = "user", rpcId = RequestId } } },
                new { type = "assistant/message", seq = 2, data = new { turn = 1, message = new { content = new[] { new { type = "text", text = "{\"outcome\":\"completed\",\"summary\":\"DSH_TEST_OK\",\"artifacts\":[]}" } } } } }
            };
            if (Complete) List.Add(new { type = "turn/end", seq = 3, data = new { turn = 1, reason = new { kind = "completed" } } });
            return List;
        }
    }
}
