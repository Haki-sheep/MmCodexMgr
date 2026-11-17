using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class FormationService
{
    private sealed record DispatchPlan(FormationRun Run, FormationTask TaskItem, FormationMember Controller, FormationMember Target, FormationAttempt Attempt, bool Replay, string NativePrompt = "");
    private sealed record DispatchWork(string Instructions, string Acceptance, RelayWorkspace Workspace);

    #region Dispatch and recovery
    private async Task<object> DispatchAsync(JsonElement Arguments, FormationCaller Caller, CancellationToken Cancellation)
    {
        Cancellation.ThrowIfCancellationRequested();
        string RunId = Text(Arguments, "run_id");
        string TaskId = Text(Arguments, "task_id");
        string OperationId = FormationStore.RequireText(Text(Arguments, "operation_id"), "派发操作 ID", 128);
        string KindText = OptionalText(Arguments, "kind");
        var Kind = KindText switch
        {
            "" or "execute" => eFormationAttemptKind.Execute,
            "review" => eFormationAttemptKind.Review,
            _ => throw new InvalidOperationException("派发类型必须是 execute 或 review")
        };
        string RegisteredAttemptId = "";
        DispatchPlan Plan;
        try
        {
            Plan = Store.Update(Database =>
            {
                var Run = FormationStore.RequireRun(Database, RunId);
                RequireLifecycleEditable(Run);
                var Member = Actor(Database, Run, Caller);
                RequireCoordinator(Member);
                var TaskItem = RequireTask(Run, TaskId);
                var Controller = Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
                if (Controller.SessionId.Length == 0) throw new InvalidOperationException("先绑定编队的真实统筹会话");
                var Existing = Run.TaskList.SelectMany(Item => Item.AttemptList).SingleOrDefault(Item => Item.OperationId == OperationId);
                if (Existing is not null)
                {
                    if (Existing.Kind != Kind || !TaskItem.AttemptList.Contains(Existing)) throw new InvalidOperationException("同一派发操作 ID 属于另一任务或轮次类型");
                    var Replay = new DispatchPlan(Run, TaskItem, Controller, RequireMember(Run, Existing.MemberId), Existing, true);
                    return ClaimNative(Database, Replay, Caller);
                }
                if (Run.State != eFormationState.Active || Run.Archived || Run.LifecycleOperation is { Completed: false }) throw new InvalidOperationException("编队未处于可派发状态");
                var Target = RequireMember(Run, Kind == eFormationAttemptKind.Execute ? TaskItem.ExecutorId : TaskItem.ReviewerId);
                var Submission = Kind == eFormationAttemptKind.Review ? TaskItem.SubmissionList.LastOrDefault() : null;
                if (Kind == eFormationAttemptKind.Execute && TaskItem.State is not (eFormationTaskState.Ready or eFormationTaskState.NeedsRework) ||
                    Kind == eFormationAttemptKind.Review && (TaskItem.State != eFormationTaskState.Submitted || Submission?.RequirementVersion != Run.RequirementVersion))
                    throw new InvalidOperationException("当前任务状态无法派发该类型轮次");
                ValidateMember(Target, Controller);
                bool native = Target.DispatchMode == eFormationDispatchMode.Native;
                bool Self = Kind == eFormationAttemptKind.Execute && Target.Id == Controller.Id;
                if (Self && Caller.IsOperator) throw new InvalidOperationException("统筹接管轮次须由真实统筹会话领取");
                if (!Self && !native && (Agents is null || Relay is null)) throw new InvalidOperationException("当前未启用真实联调派发");
                var ActiveList = Database.RunList.SelectMany(Item => Item.TaskList).SelectMany(Item => Item.AttemptList).Where(CountsDispatchCapacity).ToList();
                int RunUsage = Run.TaskList.SelectMany(Item => Item.AttemptList).Count(CountsDispatchCapacity);
                if (RunUsage >= Run.MaxParallel || ActiveList.Count >= FormationStore.DefaultGlobalMaxParallel) throw new FormationWaitException("编队或全局并发已满");
                if (!(native && Kind == eFormationAttemptKind.Review && Target.SubagentMax == 0) && Run.TaskList.SelectMany(Item => Item.AttemptList)
                    .Any(Item => Item.MemberId == Target.Id && CountsDispatchCapacity(Item)))
                    throw new FormationWaitException("当前角色席位正在执行或待核对");
                if (native) RequireNativeCapacity(Database, Run, Controller, ActiveList);
                if (Target.SessionId.Length != 0 && ActiveList.Any(Item => Item.InstanceId == Target.InstanceId && Item.SessionId == Target.SessionId))
                    throw new FormationWaitException("该真实会话已被另一编队占用");
                if (Submission is not null) VerifyArtifacts(Submission);
                CheckWorkspace(Database, TaskItem, Kind);
                var Attempt = new FormationAttempt
                {
                    Id = FormationStore.NewId(),
                    OperationId = OperationId,
                    ControllerInstanceId = Controller.InstanceId,
                    ControllerSessionId = Controller.SessionId,
                    RequestId = "formation-" + FormationStore.NewId(),
                    MemberId = Target.Id,
                    InstanceId = Target.InstanceId,
                    SessionId = Target.SessionId,
                    DispatchMode = Self ? eFormationDispatchMode.Coordinator : Target.DispatchMode,
                    Model = native && Target.FollowCoordinator ? Controller.Model : Target.Model,
                    Effort = native && Target.FollowCoordinator ? Controller.Effort : Target.Effort,
                    Kind = Kind,
                    State = Self ? eFormationAttemptState.Running : eFormationAttemptState.Dispatching,
                    SubmissionId = Submission?.Id ?? "",
                    ContextVersion = Run.ContextVersion,
                    RequirementVersion = Run.RequirementVersion
                };
                TaskItem.AttemptList.Add(Attempt);
                TaskItem.State = Self ? eFormationTaskState.Running : eFormationTaskState.Dispatching;
                FormationStore.AddEvent(Run, Member?.Id ?? "operator", "dispatch_reserved", Attempt.Id);
                var Draft = new DispatchPlan(Run, TaskItem, Controller, Target, Attempt, false);
                if (Self)
                {
                    DispatchInstructions(Draft);
                    return Draft;
                }
                if (native) return ClaimNative(Database, Draft, Caller);
                if (!DispatchDict.TryAdd(Attempt.Id, 0)) throw new InvalidOperationException("该派发已在进行");
                RegisteredAttemptId = Attempt.Id;
                return Draft;
            });
        }
        catch
        {
            if (RegisteredAttemptId.Length != 0) DispatchDict.TryRemove(RegisteredAttemptId, out _);
            throw;
        }
        if (Plan.Attempt.DispatchMode == eFormationDispatchMode.Coordinator)
        {
            bool RunHere = !Caller.IsOperator && Plan.Attempt.State == eFormationAttemptState.Running;
            var Work = RunHere ? DispatchInstructions(Plan) : null;
            return new { attempt = Plan.Attempt, run_in_coordinator = RunHere, instructions = Work?.Instructions, acceptance = Work?.Acceptance, workspace = Work?.Workspace };
        }
        if (Plan.Attempt.DispatchMode == eFormationDispatchMode.Native)
        {
            var Profile = AgentManagementService.ResolveInstance(LoadSettings(), Plan.Controller.InstanceId);
            string Resolved = FormationModelOptions.ResolveEffort(Profile, Plan.Attempt.Model, Plan.Attempt.Effort, UseInstanceDefault: false);
            return new
            {
                attempt = Plan.Attempt,
                can_spawn = Plan.NativePrompt.Length != 0,
                prompt = Plan.NativePrompt,
                task_name = "formation_" + Plan.Attempt.Id,
                model = Plan.Attempt.Model,
                effort = Resolved.Length == 0 ? Plan.Attempt.Effort : Resolved,
                preferred_effort = Plan.Attempt.Effort,
                parent_subagent_max = Plan.Controller.SubagentMax,
                worker_limits = new { subagent_max = 0, session_max = 0, cross_agent_max = 0 }
            };
        }
        if (Plan.Replay) return SyncAttempt(RunId, TaskId, Plan.Attempt.Id, Caller);
        try
        {
            var Current = Store.Read(Database => RequireAttempt(RequireTask(FormationStore.RequireRun(Database, RunId), TaskId), Plan.Attempt.Id));
            if (Current.State != eFormationAttemptState.Dispatching) return Current;
            try
            {
                await Agents!.StartFormationAsync(Plan.Run.Id, Plan.Controller.InstanceId, Plan.Controller.SessionId, RelayArguments(Plan), Cancellation);
            }
            catch (Exception Error)
            {
                var Saved = FindRelay(Plan.Attempt);
                Store.Update(Database =>
                {
                    var Run = FormationStore.RequireRun(Database, RunId);
                    var TaskItem = RequireTask(Run, TaskId);
                    var Attempt = RequireAttempt(TaskItem, Plan.Attempt.Id);
                    if (Saved is null && Attempt.State == eFormationAttemptState.Dispatching)
                    {
                        Attempt.State = eFormationAttemptState.Finished;
                        TaskItem.State = Attempt.Kind == eFormationAttemptKind.Review ? eFormationTaskState.Submitted
                            : TaskItem.ReviewList.LastOrDefault()?.RequirementVersion == Run.RequirementVersion ? eFormationTaskState.NeedsRework : eFormationTaskState.Ready;
                    }
                    if (Saved is not null)
                    {
                        ApplyIdentity(Run, Attempt, Saved);
                        if (Attempt.State == eFormationAttemptState.Dispatching)
                        {
                            Attempt.State = eFormationAttemptState.DeliveryUnknown;
                            TaskItem.State = eFormationTaskState.DeliveryUnknown;
                        }
                    }
                    Attempt.Detail = Error.Message;
                    FormationStore.AddEvent(Run, "manager", "dispatch_error", Attempt.Id + " " + Error.Message);
                    return true;
                });
                throw;
            }
            return SyncAttempt(RunId, TaskId, Plan.Attempt.Id, Caller);
        }
        finally { DispatchDict.TryRemove(Plan.Attempt.Id, out _); }
    }

    private static void CheckWorkspace(FormationDatabase Database, FormationTask TaskItem, eFormationAttemptKind Kind)
    {
        if (Kind != eFormationAttemptKind.Execute || TaskItem.Workspace.Access != "write") return;
        var OtherList = Database.RunList.SelectMany(Item => Item.TaskList).Where(Item => Item.Id != TaskItem.Id &&
            (Item.AttemptList.Any(IsReserved) || Item.State is eFormationTaskState.Submitted or eFormationTaskState.Reviewing));
        foreach (var Other in OtherList)
            if (Other.Workspace.WritePathList.Any(OtherPath => TaskItem.Workspace.WritePathList.Any(PathValue => ManagerPaths.Same(PathValue, OtherPath) ||
                ManagerPaths.IsUnder(PathValue, OtherPath) || ManagerPaths.IsUnder(OtherPath, PathValue))))
                throw new FormationWaitException("写入范围仍由编队任务保留 " + Other.Id);
    }

    private static DispatchWork DispatchInstructions(DispatchPlan Plan)
    {
        var Item = Plan.TaskItem;
        var Attempt = Plan.Attempt;
        var Revision = Plan.Run.RevisionList.Single(Value => Value.ContextVersion == Attempt.ContextVersion);
        string Instructions;
        string Acceptance;
        bool IsReview = Attempt.Kind == eFormationAttemptKind.Review;
        if (IsReview)
        {
            var Submission = Item.SubmissionList.Single(Value => Value.Id == Attempt.SubmissionId);
            string Artifacts = string.Join("\n", Submission.ArtifactList.Select(Value => Value.Path + " SHA256=" + Value.Sha256));
            Instructions = $"审核编队任务 {Item.Title}\n需求\n{Revision.Requirement}\n任务验收\n{Item.Acceptance}\n提交摘要\n{Submission.Summary}\n固定产物\n{Artifacts}\n以只读方式审查。";
            Acceptance = "以当前任务验收标准独立审核。输出一个 JSON 对象，只含 passed 布尔和 feedback 字符串，拒绝时反馈必须具体。";
        }
        else
        {
            var Feedback = Item.ReviewList.LastOrDefault(Value => Value.RequirementVersion == Attempt.RequirementVersion && !Value.Passed);
            Instructions = $"编队需求\n{Revision.Requirement}\n上下文\n{Revision.Context}\n执行要求\n{Item.Instructions}";
            if (Feedback is not null) Instructions += "\n本轮只补以下审核差量 已完成部分先核对\n" + Feedback.Feedback;
            var PreviousSubmission = Item.SubmissionList.LastOrDefault();
            if (PreviousSubmission is not null && PreviousSubmission.RequirementVersion < Attempt.RequirementVersion)
            {
                var PreviousRevision = Plan.Run.RevisionList.Last(Value => Value.RequirementVersion == PreviousSubmission.RequirementVersion);
                Instructions += $"\n旧成果来自需求 v{PreviousRevision.RequirementVersion}。执行前先复核已有产物，仅补 v{Attempt.RequirementVersion} 引入的需求差量，按当前验收标准重新提交。\n" +
                    "旧版需求 " + Excerpt(PreviousRevision.Requirement, 640) + "\n" + SubmissionSummary(PreviousSubmission);
            }
            Acceptance = Item.Acceptance;
        }
        FormationStore.RequireText(Instructions, "派发正文", RelayLimits.MaxTextLength);
        return new(Instructions, Acceptance, IsReview ? new RelayWorkspace { Access = "read_only" } : Item.Workspace);
    }

    private static JsonElement RelayArguments(DispatchPlan Plan)
    {
        var Item = Plan.TaskItem;
        var Attempt = Plan.Attempt;
        var Target = Plan.Target;
        var Work = DispatchInstructions(Plan);
        string acceptance = Attempt.Kind == eFormationAttemptKind.Review
            ? Work.Acceptance + " 使用 Relay 的 completed 回报，JSON 对象放入 summary 字符串。"
            : Work.Acceptance;
        var RequestDict = new Dictionary<string, object>
        {
            ["request_id"] = Attempt.RequestId,
            ["instance"] = Target.InstanceId,
            ["title"] = Item.Title,
            ["instructions"] = Work.Instructions,
            ["acceptance"] = acceptance,
            ["subagent_max"] = Math.Max(Plan.Controller.SubagentMax, Target.SubagentMax),
            ["session_max"] = FormationStore.DefaultGlobalMaxParallel,
            ["cross_agent_max"] = FormationStore.DefaultGlobalMaxParallel,
            ["tree_session_max"] = FormationStore.DefaultGlobalMaxParallel,
            ["max_depth"] = 1,
            ["worker_limits"] = new { subagent_max = Target.SubagentMax, session_max = 0, cross_agent_max = 0 },
            ["workspace"] = new { access = Work.Workspace.Access, write_paths = Work.Workspace.WritePathList }
        };
        SetFormationSessionArguments(RequestDict, Target);
        if (Attempt.Model.Length != 0) RequestDict.Add("model", Attempt.Model);
        if (Attempt.Effort.Length != 0) RequestDict.Add("thinking", Attempt.Effort);
        return JsonSerializer.SerializeToElement(RequestDict);
    }

    private static void SetFormationSessionArguments(Dictionary<string, object> RequestDict, FormationMember Target)
    {
        bool CreateSession = Target.SessionId.Length == 0;
        RequestDict.Add(CreateSession ? "create_title" : "session", CreateSession ? Target.DisplayName : Target.SessionId);
        if (Target.Project.Length != 0) RequestDict.Add("project", Target.Project);
        if (Target.Cwd.Length != 0 && SeatProviders.For(Target.InstanceId).UsesCwd &&
            (CreateSession || Target.InstanceId != AntigravityRelayRunner.InstanceId))
            RequestDict.Add("cwd", Target.Cwd);
    }

    private object Reconcile(JsonElement Arguments, FormationCaller Caller) =>
        SyncAttempt(Text(Arguments, "run_id"), Text(Arguments, "task_id"), Text(Arguments, "attempt_id"), Caller);

    private FormationAttempt SyncAttempt(string RunId, string TaskId, string AttemptId, FormationCaller Caller)
    {
        return Store.Update(Database =>
        {
            var Run = FormationStore.RequireRun(Database, RunId);
            var ActorMember = Actor(Database, Run, Caller);
            RequireCoordinator(ActorMember);
            var TaskItem = RequireTask(Run, TaskId);
            var Attempt = RequireAttempt(TaskItem, AttemptId);
            if (Attempt.DispatchMode != eFormationDispatchMode.Session) return Attempt;
            if (Relay is null) throw new InvalidOperationException("当前未启用联调对账");
            if (Attempt.State is eFormationAttemptState.Finished or eFormationAttemptState.Stopped || TaskItem.State == eFormationTaskState.Blocked) return Attempt;
            var Saved = FindRelay(Attempt);
            if (Saved is null)
            {
                if (Attempt.State is eFormationAttemptState.Dispatching or eFormationAttemptState.Running && !DispatchDict.ContainsKey(Attempt.Id))
                {
                    Attempt.State = eFormationAttemptState.DeliveryUnknown;
                    TaskItem.State = eFormationTaskState.DeliveryUnknown;
                    Attempt.Detail = "联调账本未找到原请求 需人工核对 禁止重复派发";
                }
                return Attempt;
            }
            ApplyIdentity(Run, Attempt, Saved);
            if (Attempt.State == eFormationAttemptState.AwaitingStop || Saved.State == eRelayState.Sending) return Attempt;
            if (Saved.State is eRelayState.DispatchUncertain or eRelayState.Interrupted or eRelayState.Recovering or eRelayState.Cancelled or eRelayState.TimedOut)
            {
                Attempt.State = eFormationAttemptState.DeliveryUnknown;
                TaskItem.State = eFormationTaskState.DeliveryUnknown;
                Attempt.Detail = RelayLimits.StateText(Saved.State);
                return Attempt;
            }
            Attempt.State = eFormationAttemptState.Running;
            TaskItem.State = Attempt.Kind == eFormationAttemptKind.Review ? eFormationTaskState.Reviewing : eFormationTaskState.Running;
            if (Saved.Outcome.Length == 0) return Attempt;
            if (Saved.Outcome != "completed")
            {
                Attempt.State = eFormationAttemptState.DeliveryUnknown;
                TaskItem.State = eFormationTaskState.Blocked;
                Attempt.Detail = Saved.Result;
                FormationStore.AddEvent(Run, "relay", "non_review_failure", Attempt.Id + " " + Saved.Outcome);
            }
            else if (Attempt.Kind == eFormationAttemptKind.Execute)
                Submit(Run, TaskItem, Attempt, Attempt.Id, Saved.Result, CaptureArtifacts(Saved.ArtifactList), "relay");
            else
            {
                using var Report = JsonDocument.Parse(Saved.Result);
                Review(Run, TaskItem, Attempt, Attempt.SubmissionId, Report.RootElement.GetProperty("passed").GetBoolean(),
                    OptionalText(Report.RootElement, "feedback"), "relay");
            }
            return Attempt;
        });
    }

    private RelayTask? FindRelay(FormationAttempt Attempt) => Attempt.DispatchMode != eFormationDispatchMode.Session ? null
        : Attempt.RelayId.Length != 0 ? Relay?.FindTask(Attempt.RelayId)
        : Relay?.FindRequest(Attempt.ControllerInstanceId + "/" + Attempt.ControllerSessionId + "/" + Attempt.RequestId);

    private static void ApplyIdentity(FormationRun Run, FormationAttempt Attempt, RelayTask Saved)
    {
        if (Saved.Channel.FormationRunId != Run.Id || Saved.RequestKey != Attempt.ControllerInstanceId + "/" + Attempt.ControllerSessionId + "/" + Attempt.RequestId ||
            Attempt.ControllerInstanceId != Saved.Channel.MainInstance.Id || Attempt.ControllerSessionId != Saved.Channel.MainThreadId ||
            Attempt.InstanceId != Saved.Channel.WorkerInstance.Id || Attempt.SessionId.Length != 0 && Attempt.SessionId != Saved.Channel.WorkerThreadId)
            throw new InvalidOperationException("Relay 执行端与编队轮次不一致");
        Attempt.RelayId = Saved.Id;
        Attempt.Effort = Saved.Channel.WorkerThinking;
        if (Saved.Channel.WorkerThreadId.Length == 0) return;
        Attempt.SessionId = Saved.Channel.WorkerThreadId;
        Bind(Run, RequireMember(Run, Attempt.MemberId), Attempt.SessionId);
    }
    #endregion

    #region Takeover
    private static void BeginHandoff(FormationRun Run, FormationTask Trigger, string From, int Revision)
    {
        if (Run.HandoffList.Any(Item => Item.FromMemberId == From)) return;
        var AffectedList = Run.TaskList.Where(Item => Item.ExecutorId == From && Item.State != eFormationTaskState.Passed).ToList();
        var Handoff = new FormationHandoff
        {
            Id = FormationStore.NewId(),
            FromMemberId = From,
            ToMemberId = HandoffTarget(Run, From),
            TriggerTaskId = Trigger.Id,
            RequirementVersion = Revision,
            TaskIdList = AffectedList.Select(Item => Item.Id).ToList()
        };
        foreach (var TaskItem in AffectedList)
        {
            TaskItem.State = eFormationTaskState.AwaitingHandoff;
            var StopList = TaskItem.AttemptList.Where(IsReserved).ToList();
            foreach (var Group in TaskItem.AttemptList.Where(Item => Item.State == eFormationAttemptState.Finished).GroupBy(Item => Item.MemberId))
                StopList.Add(Group.Last());
            foreach (var Attempt in StopList)
            {
                Attempt.State = eFormationAttemptState.AwaitingStop;
                Handoff.AttemptIdList.Add(Attempt.Id);
            }
        }
        Run.HandoffList.Add(Handoff);
        FormationStore.AddEvent(Run, "manager", "handoff_started", Handoff.Id + "/" + From);
    }

    private static string HandoffTarget(FormationRun Run, string From)
    {
        var Target = Run.MemberList.Where(Member => Member.Role == eFormationRole.Outsider && Member.Id != From &&
                Run.HandoffList.All(Handoff => Handoff.FromMemberId != Member.Id))
            .OrderBy(Member => Run.TaskList.Count(Item => Item.ExecutorId == Member.Id && Item.State != eFormationTaskState.Passed) +
                Run.HandoffList.Count(Handoff => Handoff.ToMemberId == Member.Id && !Handoff.Transferred))
            .FirstOrDefault();
        if (Target is not null) return Target.Id;
        var Controller = Run.MemberList.Single(Member => Member.Role == eFormationRole.Coordinator);
        return Controller.SubagentMax == 1 && Controller.Id != From &&
            Run.MemberList.All(Member => Member.Role != eFormationRole.Outsider) && Run.MemberList.Any(Member => Member.Role == eFormationRole.Reviewer)
            ? Controller.Id : "";
    }

    private async Task<object> TakeoverAsync(JsonElement Arguments, FormationCaller Caller, CancellationToken Cancellation)
    {
        string RunId = Text(Arguments, "run_id");
        string HandoffId = Text(Arguments, "handoff_id");
        string Mode = Text(Arguments, "mode");
        if (Mode is "request_stop" or "confirm_stop")
        {
            string AttemptId = Text(Arguments, "attempt_id");
            var Run = Store.Get(RunId);
            var Handoff = FindHandoff(Run, HandoffId);
            if (Handoff.Transferred) return Handoff;
            var Attempt = HandoffAttempt(Run, Handoff, AttemptId);
            if (DispatchDict.ContainsKey(Attempt.Id)) throw new InvalidOperationException("派发尚在进行 请等待派发结束并核对原会话");
            if (Mode == "confirm_stop")
            {
                if (!Arguments.TryGetProperty("confirmed", out var Confirmed) || !Confirmed.GetBoolean())
                    throw new InvalidOperationException("需要人工核实执行轮次和相关工具进程均已停止");
                FormationStore.RequireText(Text(Arguments, "evidence"), "人工停止证据", 4000);
            }
            if (Attempt.DispatchMode == eFormationDispatchMode.Native && Mode == "request_stop")
                return Write("takeover", Arguments, Caller, Database =>
                {
                    var Current = FormationStore.RequireRun(Database, RunId);
                    var CurrentHandoff = FindHandoff(Current, HandoffId);
                    if (CurrentHandoff.Transferred) return CurrentHandoff;
                    var CurrentAttempt = HandoffAttempt(Current, CurrentHandoff, AttemptId);
                    if (CurrentAttempt.State == eFormationAttemptState.AwaitingStop && CurrentAttempt.NativeStopRequestedAt is null)
                    {
                        CurrentAttempt.NativeStopRequestedAt = DateTimeOffset.UtcNow;
                        FormationStore.AddEvent(Current, "operator", "native_stop_requested", AttemptId);
                    }
                    return CurrentHandoff;
                });
            var Saved = FindRelay(Attempt);
            bool PossiblyActive = Saved?.State is eRelayState.Sending or eRelayState.Running or eRelayState.DispatchUncertain or eRelayState.Recovering or eRelayState.Interrupted;
            if (Mode == "request_stop" && Saved is null) throw new InvalidOperationException("联调原记录未知 请人工确认是否存在真实执行");
            if (Saved is not null && (Mode == "request_stop" || PossiblyActive))
                await (Agents ?? throw new InvalidOperationException("当前未启用联调停止请求")).StopFormationAsync(RunId, Saved.Id);
            if (Mode == "request_stop")
                return Write("takeover", Arguments, Caller, Database =>
                {
                    var Current = FormationStore.RequireRun(Database, RunId);
                    var CurrentHandoff = FindHandoff(Current, HandoffId);
                    FormationStore.AddEvent(Current, "operator", "stop_requested", AttemptId);
                    return CurrentHandoff;
                });
        }
        return Write("takeover", Arguments, Caller, Database =>
        {
            var Run = FormationStore.RequireRun(Database, RunId);
            var Handoff = FindHandoff(Run, HandoffId);
            if (Handoff.Transferred) return Handoff;
            if (Mode == "confirm_stop")
            {
                string AttemptId = Text(Arguments, "attempt_id");
                var Attempt = HandoffAttempt(Run, Handoff, AttemptId);
                if (DispatchDict.ContainsKey(Attempt.Id)) throw new InvalidOperationException("派发仍在进行 不能确认停止");
                if (!Arguments.TryGetProperty("confirmed", out var Confirmed) || !Confirmed.GetBoolean()) throw new InvalidOperationException("需要人工核实执行轮次和相关工具进程均已停止");
                string Evidence = FormationStore.RequireText(Text(Arguments, "evidence"), "人工停止证据", 4000);
                var Prior = Handoff.StopList.SingleOrDefault(Item => Item.AttemptId == AttemptId);
                if (Prior is not null && Prior.Details != Evidence) throw new InvalidOperationException("该轮次已有不同停止证据");
                if (Prior is null) Handoff.StopList.Add(new(AttemptId, "operator", Evidence, DateTimeOffset.UtcNow));
                Attempt.State = eFormationAttemptState.Stopped;
                FormationStore.AddEvent(Run, "operator", "stop_confirmed", Attempt.Id);
                return Handoff;
            }
            if (Mode != "transfer") throw new InvalidOperationException("接管方式须为 request_stop confirm_stop 或 transfer");
            if (Handoff.ToMemberId.Length == 0) throw new InvalidOperationException("没有其他可接管的外援席位");
            if (Handoff.AttemptIdList.Any(Id => !Handoff.StopList.Any(Proof => Proof.AttemptId == Id)))
                throw new InvalidOperationException("原执行及受影响审核仍有未确认停止轮次");
            string TransferEvidence = FormationStore.RequireText(Text(Arguments, "evidence"), "交接证据", 4000);
            foreach (string TaskId in Handoff.TaskIdList)
            {
                var TaskItem = RequireTask(Run, TaskId);
                TaskItem.ExecutorId = Handoff.ToMemberId;
                if (TaskItem.ReviewerId.Length == 0 && RequireMember(Run, Handoff.ToMemberId).Role == eFormationRole.Coordinator)
                    TaskItem.ReviewerId = SelectReviewer(Run, IncludeSession: true);
                TaskItem.State = eFormationTaskState.Ready;
            }
            Handoff.Transferred = true;
            FormationStore.AddEvent(Run, "operator", "handoff_transferred", Handoff.Id + " " + TransferEvidence);
            return Handoff;
        });
    }

    private static FormationHandoff FindHandoff(FormationRun Run, string Id) => Run.HandoffList.SingleOrDefault(Item => Item.Id == Id)
        ?? throw new InvalidOperationException("编队交接不存在 " + Id);

    private static FormationAttempt HandoffAttempt(FormationRun Run, FormationHandoff Handoff, string Id)
    {
        if (!Handoff.AttemptIdList.Contains(Id)) throw new InvalidOperationException("轮次不属于该交接");
        return Run.TaskList.SelectMany(Item => Item.AttemptList).Single(Item => Item.Id == Id);
    }
    #endregion
}
