using System.Text.Json;
using CodexInstanceManager;

internal static class FormationTests
{
    public static async Task RunAsync()
    {
        await VerifyAsync(false);
        await VerifyAsync(true);
        await VerifySetupAsync();
        await VerifyNativeAsync();
    }

    private static async Task VerifySetupAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "MmFormationSetup-" + Guid.NewGuid().ToString("N"));
        try
        {
            var Settings = new ManagerSettings { InstanceList = Profiles() };
            var Store = new FormationStore(Root);
            string ActivationPrompt = "";
            var Service = new FormationService(Store, Settings, Catalog: new FakeCatalog(), Activate: (_, Prompt, _) =>
            {
                ActivationPrompt = Prompt;
                return Task.CompletedTask;
            });
            Task<object> Call(string Action, object Arguments, FormationCaller? Caller = null) => Service.ExecuteAsync(Action,
                JsonSerializer.SerializeToElement(Arguments, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower }),
                Caller ?? FormationCaller.Operator(), CancellationToken.None);
            var Members = Settings.InstanceList.Select(Seat).ToList();
            Members[0].Model = "controller-test";
            Members[0].Effort = "high";
            Members[1].Model = "worker-test";
            Members[1].Effort = Members[2].Effort = "medium";
            var Run = (FormationRun)await Call("create", new { operation_id = "setup", formation = new FormationCreate { SetupOnly = true, MemberList = Members } });
            Require(Run.SetupOnly && Run.RevisionList.Single().Requirement.Length == 0 && Run.Theme.StartsWith("编队 "), "空编队自动命名并保留等待需求状态");
            await Call("activate", new { run_id = Run.Id, operation_id = "prepare" });
            Require(ActivationPrompt.Contains("等待用户在本会话提出任务") && ActivationPrompt.Contains("formation context") && Store.Get(Run.Id).TaskList.Count == 0,
                "准备统筹仅等待需求 不创建执行任务");
            Require(ActivationPrompt.Contains("统筹者 模型 controller-test 拟推理强度 high") &&
                ActivationPrompt.Contains("执行者 1 模型 worker-test 拟推理强度 medium") && ActivationPrompt.Contains("执行者 2 模型") &&
                ActivationPrompt.Contains("目标模型支持的最近档位"), "统筹启动包逐席列出模型及拟强度并说明档位选择");
            var TaskRequest = new { run_id = Run.Id, operation_id = "new-task", title = "收到需求后的任务", instructions = "只读检查", acceptance = "结果正确", executor_id = "worker1", workspace = new { access = "read_only" } };
            await RejectAsync(() => Call("task", TaskRequest), "没有需求不能派生任务");
            var Token = await Call("member", new { run_id = Run.Id, member_id = "main", mode = "credential", operation_id = "main-key" });
            var Actor = FormationCaller.Agent("main", "main-thread", JsonSerializer.SerializeToElement(Token).GetProperty("credential").GetString()!);
            var OtherToken = await Call("member", new { run_id = Run.Id, member_id = "worker1", mode = "credential", operation_id = "worker-key" });
            var Worker = FormationCaller.Agent("worker1", "worker1-thread", JsonSerializer.SerializeToElement(OtherToken).GetProperty("credential").GetString()!);
            var Requirement = new { run_id = Run.Id, operation_id = "requirement", requirement = "用户在统筹会话确认的任务", context = "只读" };
            await RejectAsync(() => Call("context", Requirement, Worker), "执行者不能修改需求");
            await Call("context", Requirement, Actor);
            await Call("context", Requirement, Actor);
            var Ready = Store.Get(Run.Id);
            Require(!Ready.SetupOnly && Ready.RequirementVersion == 2 && Ready.RevisionList.Count == 2 && Ready.EventList.Last().At != default,
                "统筹可幂等登记首份需求");
            await Call("task", TaskRequest, Actor);
            Require(Store.Get(Run.Id).TaskList.Count == 1, "需求确认后才允许任务登记");
            await Call("member", new { run_id = Run.Id, member_id = "worker1", mode = "configure", operation_id = "shared-effort",
                member = new FormationMember { Role = eFormationRole.Executor, InstanceId = "worker1", Effort = "high", SubagentMax = 4 } });
            Require(Store.Get(Run.Id).MemberList.Where(Item => Item.Role == eFormationRole.Executor).All(Item => Item.Effort == "high" && Item.SubagentMax == 4),
                "修改席位时同职业共享推理强度和子代理预算");
            var TooMany = new List<FormationMember> { Seat(Settings.InstanceList[0]) };
            TooMany.AddRange(Enumerable.Range(1, 5).Select(Index => new FormationMember { Role = eFormationRole.Executor, InstanceId = "worker1" }));
            await RejectAsync(() => Call("create", new { operation_id = "five", formation = new FormationCreate { SetupOnly = true, MemberList = TooMany } }), "CLI 同样限制执行者最多四席");
            await RejectAsync(() => Call("create", new { operation_id = "missing", formation = new FormationCreate { Theme = "普通任务", MemberList = Members } }), "普通创建仍须有业务需求");
            Console.WriteLine("PASS formation setup-only coordinator requirements and four-executor limit");
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("测试清理路径越界");
            if (Directory.Exists(Root)) Directory.Delete(Root, true);
        }
    }

    private static async Task VerifyNativeAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "MmFormationNative-" + Guid.NewGuid().ToString("N"));
        try
        {
            var Settings = new ManagerSettings { InstanceList = Profiles() };
            var Store = new FormationStore(Path.Combine(Root, "formation"));
            var Relay = new RelayStore(Path.Combine(Root, "relay"));
            var Bridge = new FakeBridge();
            using var Coordinator = new RelayCoordinator(Relay, Bridge);
            var Catalog = new FakeCatalog();
            var Agents = new AgentManagementService(Relay, Coordinator, Catalog, Environment.ProcessPath!, () => Settings);
            var NoticeList = new List<string>();
            FormationService OpenService() => new(Store, Settings, Agents, Relay, Catalog,
                (_, Notice) => { NoticeList.Add(Notice); return Task.CompletedTask; }, (_, _, _) => Task.CompletedTask);
            var Service = OpenService();
            var Wire = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };
            Task<object> Call(string Action, object Args, FormationCaller? Caller = null) =>
                Service.ExecuteAsync(Action, JsonSerializer.SerializeToElement(Args, Wire), Caller ?? FormationCaller.Operator(), CancellationToken.None);
            Task Process() => Service.ProcessResultsAsync(CancellationToken.None);
            FormationTask Work(string RunId, string TaskId) => Store.Get(RunId).TaskList.Single(Item => Item.Id == TaskId);
            async Task<(FormationRun Run, FormationCaller Actor)> Create(string Label, int Budget, bool UseCoordinator = false)
            {
                var Seats = Settings.InstanceList.Select(Seat).ToList();
                var Controller = Seats.Single(Item => Item.Role == eFormationRole.Coordinator);
                Controller.SubagentMax = Budget;
                Controller.Model = "controller-model";
                Controller.Effort = "high";
                foreach (var SeatItem in Seats.Where(Item => Item.Role is eFormationRole.Reviewer or eFormationRole.Outsider))
                {
                    SeatItem.DispatchMode = eFormationDispatchMode.Native;
                    SeatItem.SessionId = "";
                    SeatItem.FollowCoordinator = SeatItem.Role == eFormationRole.Reviewer;
                }
                var Outsider = Seats.Single(Item => Item.Role == eFormationRole.Outsider);
                Outsider.Model = "outsider-model";
                Outsider.Effort = "xhigh";
                if (UseCoordinator)
                {
                    Seats.Remove(Outsider);
                    foreach (var SeatItem in Seats.Where(Item => Item.Role == eFormationRole.Executor))
                    {
                        SeatItem.Model = "limited-worker";
                        SeatItem.Effort = "high";
                    }
                }
                var Run = (FormationRun)await Call("create", new { operation_id = Label, formation = new FormationCreate
                    { Theme = Label, Requirement = "测试原生和独立执行", MemberList = Seats, MaxParallel = 4 } });
                await Call("activate", new { run_id = Run.Id, operation_id = "activate" });
                var Key = await Call("member", new { run_id = Run.Id, member_id = "main", mode = "credential", operation_id = "key" });
                return (Run, FormationCaller.Agent("main", "main-thread", JsonSerializer.SerializeToElement(Key).GetProperty("credential").GetString()!));
            }
            async Task<string> Add(string RunId, string Owner, string Label)
            {
                var Item = (FormationTask)await Call("task", new { run_id = RunId, operation_id = Label, title = Label, executor_id = Owner,
                    instructions = "只读检查", acceptance = "报告检查结果", workspace = new { access = "read_only" } });
                Require(Item.ReviewerId == "review", "新任务缺省使用已经配置的原生审核");
                return Item.Id;
            }
            async Task FinishRelay(string RunId, string TaskId, string Operation)
            {
                var Last = Work(RunId, TaskId).AttemptList.LastOrDefault();
                var Attempt = Last is { Kind: eFormationAttemptKind.Execute, State: eFormationAttemptState.Running } ? Last
                    : (FormationAttempt)await Call("dispatch", new { run_id = RunId, task_id = TaskId, operation_id = Operation });
                Require(Attempt.DispatchMode == eFormationDispatchMode.Session && Relay.Get(Attempt.RelayId).WorkerLimits.SubagentMax == 2 &&
                    Bridge.WorkerPromptList.Last().Contains("subagent_max=2 session_max=0 cross_agent_max=0"),
                    "独立执行 Relay 实际保存并下发默认子代理预算2");
                await Coordinator.ReportAsync(Attempt.InstanceId, Attempt.SessionId, Attempt.RelayId, "completed", "本轮完成", new(), false);
                await Process();
            }
            Task<object> Claim(string RunId, string TaskId, FormationAttempt Attempt, FormationCaller? Caller = null) =>
                Call("dispatch", new { run_id = RunId, task_id = TaskId, operation_id = Attempt.OperationId,
                    kind = Attempt.Kind == eFormationAttemptKind.Review ? "review" : "execute" }, Caller);
            Task<object> Bind(string RunId, string TaskId, FormationAttempt Attempt, string Id, string Stage, FormationCaller? Caller = null) =>
                Call("native-bind", new { run_id = RunId, task_id = TaskId, attempt_id = Attempt.Id,
                    operation_id = Attempt.Id + "-" + Stage, agent_id = Id, stage = Stage }, Caller);
            Task<object> Review(string RunId, string TaskId, FormationAttempt Attempt, string Id, bool Passed, FormationCaller Caller) =>
                Call("native-report", new { run_id = RunId, task_id = TaskId, attempt_id = Attempt.Id, operation_id = Attempt.Id + "-report",
                    agent_id = Id, outcome = "completed", evidence = "夹具宿主已关闭 " + Id, submission_id = Attempt.SubmissionId,
                    passed = Passed, feedback = Passed ? "" : "本轮仍需补充验收点" }, Caller);
            async Task VerifyClaim(string RunId, string TaskId, FormationAttempt Attempt, FormationCaller Caller, string Model, string Effort)
            {
                var Plan = JsonSerializer.SerializeToElement(await Claim(RunId, TaskId, Attempt, Caller), Wire);
                string Prompt = Plan.GetProperty("prompt").GetString()!;
                Require(Plan.GetProperty("can_spawn").GetBoolean() && Plan.GetProperty("model").GetString() == Model &&
                    Plan.GetProperty("effort").GetString() == Effort && Prompt.Contains("subagent_max=0 session_max=0 cross_agent_max=0") &&
                    !Prompt.Contains(Caller.Credential), "真实统筹领取实际宿主参数 原生席位作为叶子且不暴露统筹凭据");
                Require(!JsonSerializer.SerializeToElement(await Claim(RunId, TaskId, Attempt, Caller)).GetProperty("can_spawn").GetBoolean(),
                    "同一原生计划只能发放一次启动指令");
            }

            var First = await Create("原生编队一", 3);
            var Second = await Create("原生编队二", 1);
            Require(First.Run.MemberList.Single(Item => Item.Role == eFormationRole.Learner).SubagentMax == 1 &&
                First.Run.MemberList.Where(Item => Item.DispatchMode == eFormationDispatchMode.Native)
                    .All(Item => Item.InstanceId == "main" && Item.SessionId == "" && Item.SubagentMax == 0),
                "原生审核外援依附真实统筹 独立学习默认预算1");
            string A = await Add(First.Run.Id, "worker1", "主任务");
            string B = await Add(Second.Run.Id, "worker2", "共享统筹任务");
            string C = await Add(First.Run.Id, "worker2", "等待审核任务");
            await FinishRelay(Second.Run.Id, B, "b");
            await FinishRelay(First.Run.Id, A, "a");
            Require(Work(First.Run.Id, A).State == eFormationTaskState.Submitted, "同一真实统筹跨编队共享额度");
            var SecondController = Store.Get(Second.Run.Id).MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
            SecondController.SubagentMax = 2;
            await Call("member", new { run_id = Second.Run.Id, member_id = "main", mode = "configure", operation_id = "raise", member = SecondController });
            await Process();
            await FinishRelay(First.Run.Id, C, "c");
            var ReviewA = Work(First.Run.Id, A).AttemptList[^1];
            var ReviewB = Work(Second.Run.Id, B).AttemptList[^1];
            Require(ReviewA is { DispatchMode: eFormationDispatchMode.Native, NativeClaimedAt: null, State: eFormationAttemptState.Dispatching } &&
                ReviewB.State == eFormationAttemptState.Dispatching && Work(First.Run.Id, C).State == eFormationTaskState.Submitted,
                "共享预算允许两个原生审核并行 第三个保留待审");
            Require(NoticeList.Count(Notice => Notice.Contains("can_spawn=true")) == 2 &&
                !JsonSerializer.SerializeToElement(await Claim(First.Run.Id, A, ReviewA)).GetProperty("can_spawn").GetBoolean(),
                "自动审核仅预留并通知 人工操作也不会领取宿主创建指令");
            var FirstController = Store.Get(First.Run.Id).MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
            FirstController.SubagentMax = 1;
            await RejectAsync(() => Call("member", new { run_id = First.Run.Id, member_id = "main", mode = "configure", operation_id = "lower", member = FirstController }),
                "繁忙统筹不能降低预算到跨编队已有占用以下");
            await RejectAsync(() => Claim(First.Run.Id, A, ReviewA, Second.Actor), "同一宿主会话另一编队凭据不能领取");
            await VerifyClaim(First.Run.Id, A, ReviewA, First.Actor, "controller-model", "high");
            await VerifyClaim(Second.Run.Id, B, ReviewB, Second.Actor, "controller-model", "high");
            await RejectAsync(() => Bind(First.Run.Id, A, ReviewA, "agent-a", "created"), "人工身份不能代报宿主原生 ID");
            await Bind(First.Run.Id, A, ReviewA, "agent-a", "created", First.Actor);
            Require(Work(First.Run.Id, A).State == eFormationTaskState.Dispatching, "宿主只确认创建时不宣称开始执行");
            await RejectAsync(() => Bind(Second.Run.Id, B, ReviewB, "agent-a", "created", Second.Actor), "跨编队拒绝复用同一真实 Agent ID");
            await Call("native-report", new { run_id = Second.Run.Id, task_id = B, attempt_id = ReviewB.Id, operation_id = "unknown",
                outcome = "unknown", evidence = "夹具丢失宿主响应" }, Second.Actor);
            Service = OpenService();
            await Process();
            Require(Work(Second.Run.Id, B).State == eFormationTaskState.DeliveryUnknown &&
                Work(First.Run.Id, C).State == eFormationTaskState.Submitted &&
                !JsonSerializer.SerializeToElement(await Claim(Second.Run.Id, B, ReviewB, Second.Actor)).GetProperty("can_spawn").GetBoolean(),
                "管理器重开不重复领取 原生投递未知继续占位");
            await Bind(Second.Run.Id, B, ReviewB, "agent-b", "running", Second.Actor);
            await Review(Second.Run.Id, B, ReviewB, "agent-b", true, Second.Actor);
            await Process();
            var ReviewC = Work(First.Run.Id, C).AttemptList[^1];
            Require(ReviewC.DispatchMode == eFormationDispatchMode.Native, "已关闭的审核释放预算并调度待审任务");
            await VerifyClaim(First.Run.Id, C, ReviewC, First.Actor, "controller-model", "high");
            await Bind(First.Run.Id, C, ReviewC, "agent-c", "running", First.Actor);
            string D = await Add(First.Run.Id, "worker2", "第三个原生审核");
            await FinishRelay(First.Run.Id, D, "d");
            var ReviewD = Work(First.Run.Id, D).AttemptList[^1];
            Require(ReviewD.DispatchMode == eFormationDispatchMode.Native, "三个同职业审核可使用三个预算 不预留角色配额");
            await VerifyClaim(First.Run.Id, D, ReviewD, First.Actor, "controller-model", "high");
            await Call("native-report", new { run_id = First.Run.Id, task_id = D, attempt_id = ReviewD.Id, operation_id = "not-started",
                outcome = "not_started", evidence = "夹具确认宿主拒绝创建" }, First.Actor);
            Require(Work(First.Run.Id, D).State == eFormationTaskState.Blocked &&
                Work(First.Run.Id, D).AttemptList[^1].State == eFormationAttemptState.Stopped,
                "明确没有启动时释放预算且保留阻塞 不无限自动重派");
            await Review(First.Run.Id, C, ReviewC, "agent-c", true, First.Actor);

            await Bind(First.Run.Id, A, ReviewA, "agent-a", "running", First.Actor);
            await Review(First.Run.Id, A, ReviewA, "agent-a", false, First.Actor);
            await Review(First.Run.Id, A, ReviewA, "agent-a", false, First.Actor);
            await Process();
            string siblingId = "";
            FormationAttempt? PendingStop = null;
            for (int round = 2; round <= 3; round++)
            {
                await FinishRelay(First.Run.Id, A, "round-" + round);
                var Recheck = Work(First.Run.Id, A).AttemptList[^1];
                await VerifyClaim(First.Run.Id, A, Recheck, First.Actor, "controller-model", "high");
                await Bind(First.Run.Id, A, Recheck, "agent-a" + round, "running", First.Actor);
                if (round == 3)
                {
                    siblingId = await Add(First.Run.Id, "worker1", "同执行者其他任务");
                    await FinishRelay(First.Run.Id, siblingId, "sibling");
                    PendingStop = Work(First.Run.Id, siblingId).AttemptList[^1];
                    await VerifyClaim(First.Run.Id, siblingId, PendingStop, First.Actor, "controller-model", "high");
                    await Bind(First.Run.Id, siblingId, PendingStop, "agent-sibling", "running", First.Actor);
                }
                await Review(First.Run.Id, A, Recheck, "agent-a" + round, false, First.Actor);
                await Process();
            }
            var Handoff = Store.Get(First.Run.Id).HandoffList.Single();
            var Transfer = new { run_id = First.Run.Id, handoff_id = Handoff.Id, operation_id = "transfer", mode = "transfer", evidence = "夹具确认交接" };
            await RejectAsync(() => Call("takeover", Transfer), "原生审核触发第三次拒审仍要求确认原轮次停止");
            Require(PendingStop is not null && Handoff.AttemptIdList.Contains(PendingStop.Id), "接管冻住同执行者活动的原生审核");
            await Call("takeover", new { run_id = First.Run.Id, handoff_id = Handoff.Id, mode = "request_stop", attempt_id = PendingStop!.Id,
                operation_id = "request-native-stop" });
            await Process();
            Require(NoticeList.Any(Notice => Notice.Contains("请求停止原生轮次 " + PendingStop.Id)), "停止请求通知真实统筹处理原生轮次");
            await Call("native-report", new { run_id = First.Run.Id, task_id = siblingId, attempt_id = PendingStop.Id, operation_id = "report-native-stop",
                agent_id = "agent-sibling", outcome = "stopped", evidence = "夹具宿主确认关闭审核" }, First.Actor);
            await RejectAsync(() => Call("takeover", Transfer), "统筹回传关闭仍保留人工停止确认");
            foreach (string AttemptId in Handoff.AttemptIdList)
                await Call("takeover", new { run_id = First.Run.Id, handoff_id = Handoff.Id, mode = "confirm_stop", attempt_id = AttemptId,
                    operation_id = AttemptId + "-stop", confirmed = true, evidence = "夹具核实停止" });
            await Call("takeover", Transfer);
            Require(Work(First.Run.Id, A).ExecutorId == "outsider" && Work(First.Run.Id, A).State == eFormationTaskState.Ready,
                "移交后任务指向原生外援并回到可派发状态");
            await Call("dispatch", new { run_id = First.Run.Id, task_id = A, operation_id = "outsider-native" });
            var Outsider = Work(First.Run.Id, A).AttemptList[^1];
            await VerifyClaim(First.Run.Id, A, Outsider, First.Actor, "outsider-model", "xhigh");
            await Bind(First.Run.Id, A, Outsider, "outsider-agent", "created", First.Actor);
            await Call("native-report", new { run_id = First.Run.Id, task_id = A, attempt_id = Outsider.Id, operation_id = "outsider-finished",
                agent_id = "outsider-agent", outcome = "completed", evidence = "夹具宿主佐证关闭", summary = "外援接管完成" }, First.Actor);
            await Process();
            Require(Outsider.RelayId.Length == 0 && Outsider.SessionId.Length == 0 &&
                Work(First.Run.Id, A).SubmissionList[^1].AttemptId == Outsider.Id &&
                Work(First.Run.Id, A).AttemptList[^1].Kind == eFormationAttemptKind.Review,
                "原生外援结果进入原提交和自动审核链路 不生成独立会话");
            var FinalReview = Work(First.Run.Id, A).AttemptList[^1];
            await VerifyClaim(First.Run.Id, A, FinalReview, First.Actor, "controller-model", "high");
            await Bind(First.Run.Id, A, FinalReview, "native-final-review", "running", First.Actor);
            await Review(First.Run.Id, A, FinalReview, "native-final-review", true, First.Actor);
            await Process();

            string WorkerHome = Path.Combine(Root, "worker-models");
            Directory.CreateDirectory(WorkerHome);
            File.WriteAllText(Path.Combine(WorkerHome, "models_cache.json"),
                """{"models":[{"slug":"limited-worker","supported_reasoning_levels":[{"effort":"medium"},{"effort":"xhigh"}]}]}""");
            Settings.InstanceList.Single(Item => Item.Id == "worker1").HomePath = WorkerHome;
            var Local = await Create("统筹兼任外援", 1, UseCoordinator: true);
            string LocalId = Local.Run.Id;
            string LocalTask = await Add(LocalId, "worker1", "转给统筹");
            for (int Round = 1; Round <= 3; Round++)
            {
                await FinishRelay(LocalId, LocalTask, "local-work-" + Round);
                var TaskItem = Work(LocalId, LocalTask);
                Require(TaskItem.AttemptList.Last(Item => Item.Kind == eFormationAttemptKind.Execute).Effort == "medium",
                    "独立派发在目标模型档位等距时选择较低档位并记录实际值");
                var ReviewAttempt = TaskItem.AttemptList[^1];
                await VerifyClaim(LocalId, LocalTask, ReviewAttempt, Local.Actor, "controller-model", "high");
                string AgentId = "local-review-" + Round;
                await Bind(LocalId, LocalTask, ReviewAttempt, AgentId, "running", Local.Actor);
                await Review(LocalId, LocalTask, ReviewAttempt, AgentId, false, Local.Actor);
                await Process();
            }
            var LocalHandoff = Store.Get(LocalId).HandoffList.Single();
            Require(LocalHandoff.ToMemberId == "main", "额度一且无外援席时选择统筹接管");
            foreach (string AttemptId in LocalHandoff.AttemptIdList)
                await Call("takeover", new { run_id = LocalId, handoff_id = LocalHandoff.Id, mode = "confirm_stop", attempt_id = AttemptId,
                    operation_id = AttemptId + "-local-stop", confirmed = true, evidence = "夹具核实原轮停止" });
            await Call("takeover", new { run_id = LocalId, handoff_id = LocalHandoff.Id, mode = "transfer", operation_id = "local-transfer", evidence = "夹具确认接管" });
            int RelayCount = Relay.Count();
            var LocalPlan = JsonSerializer.SerializeToElement(await Call("dispatch", new { run_id = LocalId, task_id = LocalTask, operation_id = "local-self" }, Local.Actor), Wire);
            var LocalAttempt = Work(LocalId, LocalTask).AttemptList[^1];
            Require(LocalPlan.GetProperty("run_in_coordinator").GetBoolean() && LocalAttempt.SessionId == "main-thread" && Relay.Count() == RelayCount,
                "统筹在原会话领取外援任务 无联调回环或新会话");
            await Call("submit", new { run_id = LocalId, task_id = LocalTask, attempt_id = LocalAttempt.Id,
                operation_id = "local-submit", submission_id = "local-delivery", summary = "在统筹会话交付" }, Local.Actor);
            await Process();
            Require(Work(LocalId, LocalTask).AttemptList[^1].Kind == eFormationAttemptKind.Review,
                "统筹接管结果进入独立审核");
            Console.WriteLine("PASS formation native reservations claims scoped budgets reports rework and takeover using host-response fixtures");
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("测试清理路径越界");
            if (Directory.Exists(Root)) Directory.Delete(Root, true);
        }
    }

    private static async Task VerifyAsync(bool OutsiderRejectedThreeTimes)
    {
        string Root = Path.Combine(Path.GetTempPath(), "MmFormationTests-" + Guid.NewGuid().ToString("N"));
        try
        {
            Directory.CreateDirectory(Root);
            var Settings = new ManagerSettings { InstanceList = Profiles() };
            var Relay = new RelayStore(Path.Combine(Root, "relay"));
            var Bridge = new FakeBridge();
            using var Coordinator = new RelayCoordinator(Relay, Bridge);
            var Catalog = new FakeCatalog();
            var Agents = new AgentManagementService(Relay, Coordinator, Catalog, Environment.ProcessPath!, () => Settings);
            var Store = new FormationStore(Path.Combine(Root, "formation"));
            var NoticeList = new List<string>();
            int ActivationCount = 0;
            Task Notify(FormationRun _, string Notice)
            {
                NoticeList.Add(Notice);
                if (Notice.Contains("第三次", StringComparison.Ordinal)) throw new IOException("夹具通知交付待核对");
                return Task.CompletedTask;
            }
            var Service = new FormationService(Store, Settings, Agents, Relay, Catalog, Notify,
                (_, Prompt, _) =>
                {
                    ActivationCount++;
                    Require(Prompt.Contains("MMCODEX_FORMATION_MEMBER_TOKEN"), "启动包提供本会话凭据");
                    Require(Prompt.Contains("验收版本一", StringComparison.Ordinal) && Prompt.Contains("本轮登记任务并派发", StringComparison.Ordinal),
                        "有初始需求的启动包要求统筹登记并派发");
                    return Task.CompletedTask;
                });
            var MemberList = Settings.InstanceList.Select(Seat).ToList();
            var Template = Store.SaveTemplate(new() { Name = "回归模板", MemberList = MemberList });
            Require(Template.MemberList.All(Item => Item.SessionId.Length == 0), "模板不能保存真实会话");
            var Run = Store.Create(new() { Theme = "编队测试", Context = "初始上下文", Requirement = "验收版本一", MemberList = MemberList });
            string RunId = Run.Id;
            await VerifyCliAsync(Root, RunId, Settings, Coordinator, Agents, Service);
            await RejectAsync(() => Agents.ExecuteAsync(new("main", "main-thread", "agent_start", JsonSerializer.SerializeToElement(new
            {
                formation_run_id = RunId,
                request_id = "forged-marker"
            })), CancellationToken.None), "旧 agent_start 不得自报编队 ID");
            Require(Run.MemberList.Single(Item => Item.Id == "main").DisplayName == $"编队测试 {Run.CreatedAt:MM-dd} 统筹" &&
                Run.MemberList.Single(Item => Item.Id == "worker1").DisplayName == $"编队测试 {Run.CreatedAt:MM-dd} 执行者", "会话名使用问题、月日和职位");
            Task<object> Call(string Action, object Arguments, FormationCaller? Caller = null) =>
                Service.ExecuteAsync(Action, JsonSerializer.SerializeToElement(Arguments), Caller ?? FormationCaller.Operator(), CancellationToken.None);

            string Add(string Owner, bool Review) => ((FormationTask)Call("task", new
            {
                run_id = RunId, operation_id = Guid.NewGuid().ToString("N"), title = "测试任务",
                instructions = "检查测试替身", acceptance = "按要求回报", executor_id = Owner,
                reviewer_id = Review ? "review" : "", workspace = new { access = "read_only" }
            }).GetAwaiter().GetResult()).Id;

            async Task<FormationAttempt> Dispatch(string Id, string Kind, string Operation) =>
                (FormationAttempt)await Call("dispatch", new { run_id = RunId, task_id = Id, kind = Kind, operation_id = Operation });

            async Task Report(FormationAttempt Attempt, string Summary, List<string>? ArtifactList = null)
            {
                await Coordinator.ReportAsync(Attempt.InstanceId, Attempt.SessionId, Attempt.RelayId, "completed", Summary, ArtifactList ?? new(), false);
                Require(Relay.Get(Attempt.RelayId).Channel.FormationRunId == RunId && !Relay.Get(Attempt.RelayId).ReturnNotificationQueued,
                    "编队标识持久化且回传不进入旧通知队列");
                await Service.ProcessResultsAsync(CancellationToken.None);
            }

            FormationTask TaskSnapshot(string Id) => Store.Get(RunId).TaskList.Single(Item => Item.Id == Id);

            async Task ReviewAsCoordinator(string Id)
            {
                var Submission = TaskSnapshot(Id).SubmissionList[^1];
                await Call("review", new
                {
                    run_id = RunId, task_id = Id, attempt_id = Submission.AttemptId, operation_id = Submission.Id + "-accept",
                    submission_id = Submission.Id, passed = true
                });
                await Service.ProcessResultsAsync(CancellationToken.None);
            }

            var Activated = new { run_id = RunId, operation_id = "activate" };
            await RejectAsync(() => Call("delete", new { run_id = RunId, operation_id = "delete-active" }), "进行中编队不能删除");
            await Call("pause", new { run_id = RunId, operation_id = "state-pause" });
            Require(Store.Get(RunId).Status == eFormationStatus.Blocked, "暂停调度展示阻塞中");
            await Call("resume", new { run_id = RunId, operation_id = "state-resume" });
            Require(Store.Get(RunId).Status == eFormationStatus.InProgress, "恢复调度展示进行中");
            await Call("activate", Activated);
            await Call("activate", Activated);
            Require(ActivationCount == 1 && Store.Get(RunId).ActivationState == eFormationDeliveryState.Delivered, "启动包只投递一次");

            string Trigger = Add("worker1", true);
            string Remaining = Add("worker1", false);
            string Unrelated = Add("worker2", false);
            var UnrelatedAttempt = await Dispatch(Unrelated, "execute", "unrelated");
            int OriginalRelayCount = Relay.Count();
            await Call("context", new { run_id = RunId, operation_id = "context-during-work", context = "执行期间补充信息" });
            await Service.ProcessResultsAsync(CancellationToken.None);
            await Service.ProcessResultsAsync(CancellationToken.None);
            Require(TaskSnapshot(Unrelated).AttemptList.Single().Id == UnrelatedAttempt.Id && Relay.Count() == OriginalRelayCount,
                "更新纯上下文会通知统筹并保留正在执行的原轮次");
            Require(NoticeList.Count(Value => Value.Contains("上下文已更新至 v2", StringComparison.Ordinal) &&
                Value.Contains("执行期间补充信息", StringComparison.Ordinal)) == 1, "执行期间的版本更新只通知一次");
            var Learner = await Call("member", new { run_id = RunId, member_id = "learner", mode = "credential", operation_id = "learner-token" });
            string Credential = JsonSerializer.SerializeToElement(Learner).GetProperty("credential").GetString()!;
            var LearnerCaller = FormationCaller.Agent("learner", "learner-thread", Credential);
            await Call("show", new { run_id = RunId }, LearnerCaller);
            await RejectAsync(() => Call("pause", new { run_id = RunId, operation_id = "unauthorized" }, LearnerCaller), "学习者不能暂停");
            await RejectAsync(() => Call("show", new { run_id = RunId }, FormationCaller.Agent("learner", "learner-thread")), "名称和会话 ID 不足以认证");
            await RejectAsync(() => FormationCli.HandleRequestAsync(Service, new("", "", "formation_list",
                JsonSerializer.SerializeToElement(new { @operator = true, credential = Credential, arguments = new { } })), CancellationToken.None), "角色凭据不能冒用人工身份");

            var InitialExecution = await Dispatch(Trigger, "execute", "trigger-start");
            var Replay = await Dispatch(Trigger, "execute", "trigger-start");
            Require(InitialExecution.Id == Replay.Id && InitialExecution.RelayId == Replay.RelayId, "重复派发保留原轮次");
            await RejectAsync(() => Coordinator.CancelAsync(InitialExecution.RelayId), "旧 Relay 不得取消编队轮次");
            string OldAttempt = "";
            FormationAttempt? RunningSibling = null;
            for (int Round = 1; Round <= 3; Round++)
            {
                var Execution = TaskSnapshot(Trigger).AttemptList[^1];
                Require(Execution.Kind == eFormationAttemptKind.Execute && Execution.State == eFormationAttemptState.Running, "已自动派发一次执行轮次");
                OldAttempt = Execution.Id;
                await Report(Execution, "产物第" + Round + "轮");
                var Review = TaskSnapshot(Trigger).AttemptList[^1];
                Require(Review.Kind == eFormationAttemptKind.Review && Review.State == eFormationAttemptState.Running, "提交触发只读审核派发");
                if (Round == 3) RunningSibling = await Dispatch(Remaining, "execute", "running-sibling");
                await Report(Review, """{"passed":false,"feedback":"保留已完成工作 只补验收点"}""");
                var Snapshot = Store.Get(RunId);
                Require(Snapshot.TaskList.Single(Item => Item.Id == Trigger).ReviewList.Count == Round, "每次提交审核计数唯一");
                if (Round < 3) Require(Snapshot.HandoffList.Count == 0, "前两次拒绝不能触发接管");
            }
            await Service.ProcessResultsAsync(CancellationToken.None);
            Require(NoticeList.Count(Value => Value.Contains("第三次", StringComparison.Ordinal)) == 1 &&
                Store.Get(RunId).NotificationList.Single(Value => Value.Id.StartsWith("handoff/", StringComparison.Ordinal)).State == eFormationDeliveryState.DeliveryUnknown,
                "投递未知的升级通知保留且不自动重送");

            var Reopened = new FormationStore(Path.Combine(Root, "formation"));
            var Saved = Reopened.Get(RunId);
            var Handoff = Saved.HandoffList.Single();
            Require(Handoff.TaskIdList.ToHashSet().SetEquals(new[] { Trigger, Remaining }), "接管只覆盖原执行者尚未通过的任务");
            Require(Saved.TaskList.Single(Item => Item.Id == Unrelated).State == eFormationTaskState.Running, "其他执行者不受影响");
            await RejectAsync(() => Call("submit", new { run_id = RunId, task_id = Trigger, attempt_id = OldAttempt, operation_id = "late", submission_id = "changed", summary = "迟到" }), "迟到提交无权覆盖原轮次");
            await RejectAsync(() => Call("takeover", new { run_id = RunId, handoff_id = Handoff.Id, mode = "transfer", operation_id = "transfer", evidence = "交接" }), "未确认停止禁止转单");
            Require(RunningSibling is not null && Handoff.AttemptIdList.Contains(RunningSibling.Id), "同一原执行者正在运行的任务纳入停止范围");
            string SiblingRelayId = RunningSibling!.RelayId;
            await Call("takeover", new { run_id = RunId, handoff_id = Handoff.Id, mode = "request_stop", attempt_id = RunningSibling.Id, operation_id = "request-stop" });
            Require(Relay.Get(SiblingRelayId).State == eRelayState.Cancelled && Store.Get(RunId).HandoffList.Single().StopList.Count == 0,
                "旧 Relay 已取消也不构成停机证明");
            Require(await Coordinator.ClearHistoryAsync() == 0 && Relay.FindTask(SiblingRelayId) is not null, "旧历史清理不能删除编队停止依据");
            foreach (string AttemptId in Handoff.AttemptIdList)
                await Call("takeover", new { run_id = RunId, handoff_id = Handoff.Id, mode = "confirm_stop", attempt_id = AttemptId, confirmed = true, operation_id = AttemptId, evidence = "夹具无真实子进程" });
            await Call("takeover", new { run_id = RunId, handoff_id = Handoff.Id, mode = "transfer", operation_id = "transfer", evidence = "按已冻结任务清单交接" });
            Saved = Store.Get(RunId);
            Require(Saved.TaskList.Where(Item => Handoff.TaskIdList.Contains(Item.Id)).All(Item => Item.ExecutorId == "outsider" && Item.State == eFormationTaskState.Ready), "停止确认后重新派发给外援");
            Require(Saved.TaskList.Single(Item => Item.Id == Unrelated).AttemptList.Single().Id == UnrelatedAttempt.Id, "保留其他执行者的原轮次");

            var OutsiderWork = await Dispatch(Trigger, "execute", "outsider-trigger");
            Require(OutsiderWork.MemberId == "outsider", "外援轮次真实派发");
            for (int Round = 1; Round <= 2; Round++)
            {
                string Feedback = "外援需补验收点 " + Round;
                await Report(OutsiderWork, "外援修复第 " + Round + " 轮");
                await Report(TaskSnapshot(Trigger).AttemptList[^1], JsonSerializer.Serialize(new { passed = false, feedback = Feedback }));
                var Rework = TaskSnapshot(Trigger);
                OutsiderWork = Rework.AttemptList[^1];
                Require(Store.Get(RunId).HandoffList.Count == 1 && Rework.State == eFormationTaskState.Running &&
                    OutsiderWork.MemberId == "outsider" && OutsiderWork.Kind == eFormationAttemptKind.Execute &&
                    Relay.Get(OutsiderWork.RelayId).Instructions.Contains(Feedback, StringComparison.Ordinal),
                    "外援前两次拒审仅以本轮反馈自动返工 原执行者的三次拒审不触发外援接管");
            }
            if (OutsiderRejectedThreeTimes)
            {
                await Report(OutsiderWork, "外援修复第三轮");
                await Report(TaskSnapshot(Trigger).AttemptList[^1], """{"passed":false,"feedback":"第三次仍不通过"}""");
                var Blocked = Store.Get(RunId);
                var OutsiderHandoff = Blocked.HandoffList.Single(Value => Value.FromMemberId == "outsider");
                Require(Blocked.HandoffList.Count == 2 && OutsiderHandoff.ToMemberId.Length == 0 && !OutsiderHandoff.Transferred &&
                    OutsiderHandoff.TaskIdList.ToHashSet().SetEquals(new[] { Trigger, Remaining }), "外援第三次拒审才冻结其剩余任务并等待人工干预");
                Require(TaskSnapshot(Trigger).State == eFormationTaskState.AwaitingHandoff &&
                    TaskSnapshot(Unrelated).State == eFormationTaskState.Running &&
                    TaskSnapshot(Unrelated).AttemptList.Single().Id == UnrelatedAttempt.Id, "外援接管阻塞不影响其他执行者");
                return;
            }

            await Report(UnrelatedAttempt, "未配置独立审核的回报");
            Require(TaskSnapshot(Unrelated).State == eFormationTaskState.Submitted, "无审核席也不得自报验收通过");
            Require(NoticeList.Any(Value => Value.Contains("待统筹验收", StringComparison.Ordinal) && Value.Contains("未配置独立审核的回报", StringComparison.Ordinal)),
                "待统筹验收通知携带提交摘要");
            var ReadTask = (FormationTask)await Call("task-show", new { run_id = RunId, task_id = Unrelated });
            Require(ReadTask.Id == Unrelated && ReadTask.SubmissionList.Count == 1, "按需读取一项任务的明确提交");
            await RejectAsync(() => Call("complete", new { run_id = RunId, operation_id = "finish-too-early", summary = "尚有任务" }), "仍有未通过任务时不得结案");
            await ReviewAsCoordinator(Unrelated);
            string Artifact = Path.Combine(Root, "outsider-result.txt");
            File.WriteAllText(Artifact, "验证同一提交的产物");
            await Report(OutsiderWork, "外援修复结果", new() { Artifact });
            await Report(TaskSnapshot(Trigger).AttemptList[^1], """{"passed":true,"feedback":"已复核"}""");
            Require(NoticeList.Any(Value => Value.Contains("外援修复结果", StringComparison.Ordinal) && Value.Contains(Artifact, StringComparison.Ordinal) && Value.Contains("已复核", StringComparison.Ordinal)),
                "通过通知携带提交摘要、产物路径和审核反馈");
            await Report(await Dispatch(Remaining, "execute", "outsider-remaining"), "外援完成剩余任务");
            await ReviewAsCoordinator(Remaining);
            Require(Store.Get(RunId).State == eFormationState.Active, "任务都通过后仍等统筹提交整组总结");
            await Call("context", new { run_id = RunId, operation_id = "new-context", context = "仅补充沟通上下文" });
            await Service.ProcessResultsAsync(CancellationToken.None);
            await Service.ProcessResultsAsync(CancellationToken.None);
            var ContextChange = Store.Get(RunId);
            Require(ContextChange.ContextVersion == 3 && ContextChange.RequirementVersion == 1 &&
                ContextChange.TaskList.All(Item => Item.State == eFormationTaskState.Passed), "纯上下文更新保留需求版本的验收");
            Require(NoticeList.Count(Value => Value.Contains("上下文已更新至 v3", StringComparison.Ordinal) &&
                Value.Contains("仅补充沟通上下文", StringComparison.Ordinal)) == 1 &&
                ContextChange.NotificationList.Single(Value => Value.Id == "revision/3").State == eFormationDeliveryState.Delivered,
                "纯上下文更新按版本通知统筹一次并保留投递记录");

            await Call("context", new { run_id = RunId, operation_id = "new-requirement", requirement = "验收版本二" });
            await Service.ProcessResultsAsync(CancellationToken.None);
            await Service.ProcessResultsAsync(CancellationToken.None);
            var Revised = Store.Get(RunId);
            Require(NoticeList.Count(Value => Value.Contains("上下文已更新至 v4", StringComparison.Ordinal) &&
                Value.Contains("需求版本 v2", StringComparison.Ordinal) && Value.Contains("验收版本二", StringComparison.Ordinal)) == 1,
                "新版需求通知统筹一次并附需求摘要");
            Require(Revised.RequirementVersion == 2 &&
                Revised.TaskList.All(Item => Item.State == eFormationTaskState.Ready && Item.ReviewList.Last().RequirementVersion == 1),
                "需求修改要求所有旧任务重新验收并保留原审核历史");
            await RejectAsync(() => Call("complete", new { run_id = RunId, operation_id = "finish-v1", summary = "旧版本结果" }), "旧版审核不能用于新版结案");

            var SecondVersion = await Dispatch(Trigger, "execute", "trigger-v2");
            var RevisedPrompt = Relay.Get(SecondVersion.RelayId).Instructions;
            Require(SecondVersion.RequirementVersion == 2 && RevisedPrompt.Contains("外援修复结果", StringComparison.Ordinal) &&
                RevisedPrompt.Contains(Artifact, StringComparison.Ordinal) && RevisedPrompt.Contains("需求差量", StringComparison.Ordinal),
                "新版执行收到旧产物路径、提交摘要和差量要求");
            await Report(SecondVersion, "按新版差量复核", new() { Artifact });
            await Report(TaskSnapshot(Trigger).AttemptList[^1], """{"passed":true,"feedback":"验收版本二通过"}""");
            await Report(await Dispatch(Remaining, "execute", "remaining-v2"), "外援复核剩余差量");
            await ReviewAsCoordinator(Remaining);
            await Report(await Dispatch(Unrelated, "execute", "unrelated-v2"), "并行席位复核差量");
            await ReviewAsCoordinator(Unrelated);
            await Call("complete", new { run_id = RunId, operation_id = "finish", summary = "编队完成测试交付" });
            Require(Store.Get(RunId).State == eFormationState.Completed, "新版所有任务验收后统筹可结案");
            await RejectAsync(() => Call("context", new { run_id = RunId, operation_id = "change-closed", requirement = "验收版本三" }),
                "已结案编队禁止修改需求");
            Require(Bridge.ControllerMessageCount == 0 && Relay.Inbox("main", "main-thread", "").Count == 0, "编队执行结果不会触发旧 Relay 通知与收件箱");
            Require(Store.Get(RunId).Status == eFormationStatus.Blocked && !Store.Get(RunId).Archived, "任务结案不会伪造原生会话已归档");
            await RejectAsync(() => Call("delete", new { run_id = RunId, operation_id = "delete-without-preview" }), "删除关联会话必须先预览与确认");
            Require(Store.List().Any(Item => Item.Id == RunId) && Store.ListTemplates().Count > 0 && File.Exists(Artifact), "未确认删除不会修改编队模板与成果");
            string ProtectedPath = Path.Combine(Root, "operator.dat");
            string Token = Service.IssueOperatorCredential();
            FormationOperatorCredential.Save(Token, ProtectedPath);
            Require(FormationOperatorCredential.Load(ProtectedPath) == Token && !System.Text.Encoding.UTF8.GetString(File.ReadAllBytes(ProtectedPath)).Contains(Token), "本机操作凭据按 Windows 用户加密并可读取");
            Require(FormationPresets.Members("basic", "main").Count == 2 && FormationPresets.Members("reviewed", "main").Count == 4, "预设席位数量明确");
            Console.WriteLine("PASS formation role authorization automatic review rework notifications scoped takeover and completion");
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("测试清理路径越界");
            if (Directory.Exists(Root)) Directory.Delete(Root, true);
        }
    }

    private static async Task VerifyCliAsync(string Root, string RunId, ManagerSettings Settings, RelayCoordinator Coordinator, AgentManagementService Agents, FormationService Formation)
    {
        string PipeName = "MmFormationTests-" + Guid.NewGuid().ToString("N");
        using var Host = new RelayHost(Coordinator, PipeName, Agents, Formation);
        string RequestPath = Path.Combine(Root, "show.json");
        File.WriteAllText(RequestPath, JsonSerializer.Serialize(new { run_id = RunId }));
        string? Previous = Environment.GetEnvironmentVariable("MMCODEX_FORMATION_OPERATOR_TOKEN");
        try
        {
            Environment.SetEnvironmentVariable("MMCODEX_FORMATION_OPERATOR_TOKEN", Formation.IssueOperatorCredential());
            using var Output = new MemoryStream();
            using var Error = new StringWriter();
            int ExitCode = await AgentCli.RunAsync(new[] { "formation", "show", "--operator", "true", "--json-file", RequestPath },
                Stream.Null, Output, Error, Environment.ProcessPath!, CancellationToken.None, PipeName, () => Settings);
            Require(ExitCode == 0, "从 CLI 命名管道读取编队 " + Error);
            using var Response = JsonDocument.Parse(Output.ToArray());
            Require(Response.RootElement.GetProperty("id").GetString() == RunId, "CLI 返回实际编队 ID");
        }
        finally { Environment.SetEnvironmentVariable("MMCODEX_FORMATION_OPERATOR_TOKEN", Previous); }
    }

    private static List<InstanceProfile> Profiles() => new[] { "main", "worker1", "worker2", "review", "outsider", "learner" }
        .Select(Id => new InstanceProfile { Id = Id, Name = Id }).ToList();

    private static FormationMember Seat(InstanceProfile Profile) => new()
    {
        Id = Profile.Id,
        InstanceId = Profile.Id,
        SessionId = Profile.Id + "-thread",
        Role = Profile.Id switch
        {
            "main" => eFormationRole.Coordinator,
            "review" => eFormationRole.Reviewer,
            "outsider" => eFormationRole.Outsider,
            "learner" => eFormationRole.Learner,
            _ => eFormationRole.Executor
        }
    };

    private static async Task RejectAsync(Func<Task> Action, string Description)
    {
        try { await Action(); }
        catch (InvalidOperationException) { return; }
        throw new InvalidOperationException("应拒绝 " + Description);
    }

    private static void Require(bool Passed, string Description)
    {
        if (!Passed) throw new InvalidOperationException("编队回归失败 " + Description);
    }

    private sealed class FakeBridge : IRelayBridge
    {
        public int ControllerMessageCount { get; private set; }
        public List<string> WorkerPromptList { get; } = new();

        public Task<List<RelayThread>> ListThreadsAsync(InstanceProfile Instance, CancellationToken Cancellation) => Task.FromResult(new List<RelayThread>());

        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, CancellationToken Cancellation)
        {
            if (Instance.Id == "main") ControllerMessageCount++;
            else WorkerPromptList.Add(Prompt);
            return Task.CompletedTask;
        }

        public Task SendAsync(InstanceProfile Instance, string ThreadId, string Prompt, string Model, string Thinking, CancellationToken Cancellation)
            => SendAsync(Instance, ThreadId, Prompt, Model, Cancellation);
    }

    private sealed class FakeCatalog : IAgentCatalog
    {
        public Task<List<AgentProject>> ProjectsAsync(InstanceProfile Instance, CancellationToken Cancellation) => Task.FromResult(new List<AgentProject>());
        public List<AgentSession> Sessions(InstanceProfile Instance, AgentProject? Project, string? Selector, int Offset)
            => new() { Session(Instance, Instance.Id + "-thread") };
        public AgentSession Session(InstanceProfile Instance, string Id) => new(Id, Id, "", "");
        public Task RequireIdleAsync(InstanceProfile Instance, string Id, CancellationToken Cancellation) => Task.CompletedTask;
        public Task<RelayThread> CreateAsync(InstanceProfile Instance, AgentProject? Project, string Title, string Prompt, CancellationToken Cancellation)
            => Task.FromResult(new RelayThread(Instance.Id + "-created", Title, "idle"));
    }
}
