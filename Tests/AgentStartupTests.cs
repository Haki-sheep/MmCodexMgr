using System.Text.Json;
using CodexInstanceManager;
using Microsoft.Data.Sqlite;

internal static class AgentStartupTests
{
    /// <summary> 已验证断言数量 </summary>
    private static int Count;

    public static void Run() => Task.Run(VerifyAsync).GetAwaiter().GetResult();

    private static async Task VerifyAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexAgentStartupTests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        try
        {
            var Instance = new InstanceProfile { Id = "second", Name = "第二实例", HomePath = Root };
            var Desktop = new StartupBridge();
            var Catalog = new AgentCatalog(Desktop);
            var Creating = Catalog.CreateAsync(Instance, null, "自动执行", "执行已授权任务", CancellationToken.None);
            Require(Desktop.PrepareCount == 1 && Desktop.CallList.Count == 0 && !Creating.IsCompleted, "creation waits for startup before reading the target database or dispatching");
            using (var Database = new SqliteConnection("Data Source=" + Path.Combine(Root, "state_5.sqlite")))
            {
                Database.Open();
                using var Command = Database.CreateCommand();
                Command.CommandText = "CREATE TABLE threads(id TEXT,archived INTEGER,updated_at INTEGER); INSERT INTO threads VALUES('target-context',1,1)";
                Command.ExecuteNonQuery();
            }
            Desktop.Ready.SetResult();
            var Created = await Creating;
            var Creation = Desktop.CallList.Single();
            Require(Created.Id == "created-thread" && Creation.Caller == "target-context" && Creation.Tool == "create_thread", "startup creates once using a real target context even when its history is archived");
            Require(Creation.Arguments.GetProperty("target").GetProperty("type").GetString() == "projectless" && Creation.Arguments.GetProperty("prompt").GetString() == "执行已授权任务", "standalone creation preserves the task prompt without attaching a project");
            var Project = new AgentProject("project", "项目", Root, true);
            await Catalog.CreateAsync(Instance, Project, "项目执行", "执行项目任务", CancellationToken.None);
            Require(Desktop.PrepareCount == 2 && Desktop.CallList.Last().Arguments.GetProperty("target").GetProperty("projectId").GetString() == Project.Id, "project creation prepares the desktop and preserves the selected project");
            var ProjectList = await Catalog.ProjectsAsync(Instance, CancellationToken.None);
            Require(Desktop.PrepareCount == 3 && ProjectList.Single().Id == "project", "project lookup prepares the desktop before querying");
            await Catalog.RequireIdleAsync(Instance, "existing-thread", CancellationToken.None);
            Require(Desktop.PrepareCount == 4 && Desktop.CallList.Last().Caller == "existing-thread" && Desktop.CallList.Last().Tool == "read_thread", "existing-session dispatch prepares the desktop before checking the exact session");
            Desktop.Status = "active";
            await ExpectAsync<InvalidOperationException>(() => Catalog.RequireIdleAsync(Instance, "existing-thread", CancellationToken.None));
            Require(Desktop.CallList.All(Item => Item.Tool != "send_message_to_thread"), "active sessions are rejected without sending execution messages");
            Desktop.Failure = new TimeoutException("fixture desktop startup timeout");
            int CallsBeforeFailure = Desktop.CallList.Count;
            await ExpectAsync<TimeoutException>(() => Catalog.CreateAsync(Instance, Project, "失败任务", "不能派发", CancellationToken.None));
            await ExpectAsync<TimeoutException>(() => Catalog.ProjectsAsync(Instance, CancellationToken.None));
            await ExpectAsync<TimeoutException>(() => Catalog.RequireIdleAsync(Instance, "existing-thread", CancellationToken.None));
            Require(Desktop.CallList.Count == CallsBeforeFailure, "startup failures retain the error and perform no desktop operation");
            Desktop.Failure = null;
            using var Cancelled = new CancellationTokenSource();
            Cancelled.Cancel();
            await ExpectAsync<OperationCanceledException>(() => Catalog.CreateAsync(Instance, null, "已取消", "不能派发", Cancelled.Token));
            Require(Desktop.CallList.Count == CallsBeforeFailure, "cancelled startup does not create a session");
            Desktop.FailCall = true;
            await ExpectAsync<IOException>(() => Catalog.CreateAsync(Instance, null, "投递失败", "不能重试", CancellationToken.None));
            Require(Desktop.CallList.Count == CallsBeforeFailure + 1, "a failed creation call is never automatically repeated");
            Desktop.FailCall = false;
            using (var Database = new SqliteConnection("Data Source=" + Path.Combine(Root, "state_5.sqlite")))
            {
                Database.Open();
                using var Command = Database.CreateCommand();
                Command.CommandText = "DELETE FROM threads";
                Command.ExecuteNonQuery();
            }
            await ExpectAsync<InvalidOperationException>(() => Catalog.CreateAsync(Instance, null, "首次使用", "不能伪造身份", CancellationToken.None));
            Require(Desktop.CallList.Count == CallsBeforeFailure + 1, "an empty instance reports the bootstrap prerequisite without inventing a caller");
            Console.WriteLine($"PASS agent startup {Count} assertions");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("测试清理路径越界");
            Directory.Delete(Root, true);
        }
    }

    private sealed class StartupBridge : IAgentDesktopBridge
    {
        public TaskCompletionSource Ready { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public int PrepareCount { get; private set; }
        public Exception? Failure { get; set; }
        public bool FailCall { get; set; }
        public string Status { get; set; } = "idle";
        public List<(string Caller, string Tool, JsonElement Arguments)> CallList { get; } = new();

        public async Task EnsureAvailableAsync(InstanceProfile Instance, CancellationToken Cancellation)
        {
            Cancellation.ThrowIfCancellationRequested();
            PrepareCount++;
            await Ready.Task.WaitAsync(Cancellation);
            if (Failure is not null) throw Failure;
        }

        public Task<JsonElement> CallAsync(InstanceProfile Instance, string CallerThreadId, string Tool, object Arguments, CancellationToken Cancellation)
        {
            CallList.Add((CallerThreadId, Tool, JsonSerializer.SerializeToElement(Arguments)));
            if (FailCall) throw new IOException("fixture creation uncertain");
            object Result = Tool switch
            {
                "create_thread" => new { threadId = "created-thread" },
                "read_thread" => new { thread = new { status = new { type = Status } } },
                "list_projects" => new { projects = new[] { new { projectKind = "local", hostId = "local", projectId = "project", label = "项目", path = Instance.HomePath, isGitRepository = true } } },
                _ => throw new InvalidOperationException("Unexpected desktop tool " + Tool)
            };
            return Task.FromResult(JsonSerializer.SerializeToElement(Result));
        }
    }

    private static async Task ExpectAsync<T>(Func<Task> Action) where T : Exception
    {
        try { await Action(); }
        catch (T) { Count++; return; }
        throw new Exception("FAILED startup: expected " + typeof(T).Name);
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED startup: " + Message);
        Count++;
    }
}
