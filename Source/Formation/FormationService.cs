using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class FormationService
{
    private static readonly JsonSerializerOptions WireOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower, PropertyNameCaseInsensitive = true };
    /// <summary> 编队持久化入口 </summary>
    private readonly FormationStore Store;
    /// <summary> 原生会话生命周期入口 </summary>
    private readonly IFormationConversationLifecycle Conversations;
    /// <summary> 管理器实例清单提供方 </summary>
    private readonly Func<ManagerSettings> LoadSettings;
    /// <summary> 真实联调派发入口 </summary>
    private readonly AgentManagementService? Agents;
    /// <summary> 联调账本用于恢复派发和回传 </summary>
    private readonly RelayStore? Relay;
    /// <summary> Codex 会话创建与身份确认 </summary>
    private readonly IAgentCatalog? Catalog;
    /// <summary> 当前进程仍在发出的请求 </summary>
    private readonly ConcurrentDictionary<string, byte> DispatchDict = new();
    /// <summary> 人工授权只保留凭据摘要 </summary>
    private string OperatorDigest = "";
    /// <summary> 统筹状态通知 </summary>
    private readonly Func<FormationRun, string, Task>? Notify;
    /// <summary> 给已绑定统筹发送启动包 </summary>
    private readonly Func<FormationRun, string, CancellationToken, Task>? Activate;

    public FormationService(FormationStore Store, ManagerSettings Settings, AgentManagementService? Agents = null, RelayStore? Relay = null,
        IAgentCatalog? Catalog = null, Func<FormationRun, string, Task>? Notify = null, Func<FormationRun, string, CancellationToken, Task>? Activate = null, IFormationConversationLifecycle? Conversations = null)
        : this(Store, () => Settings, Agents, Relay, Catalog, Notify, Activate, Conversations) { }

    public FormationService(FormationStore Store, Func<ManagerSettings> LoadSettings, AgentManagementService? Agents = null, RelayStore? Relay = null,
        IAgentCatalog? Catalog = null, Func<FormationRun, string, Task>? Notify = null, Func<FormationRun, string, CancellationToken, Task>? Activate = null, IFormationConversationLifecycle? Conversations = null)
    {
        this.Store = Store;
        this.Conversations = Conversations ?? new FormationConversationLifecycle(LoadSettings);
        this.LoadSettings = LoadSettings;
        this.Agents = Agents;
        this.Relay = Relay;
        this.Catalog = Catalog;
        this.Notify = Notify;
        this.Activate = Activate;
    }

    public string IssueOperatorCredential()
    {
        string Credential = NewCredential();
        Volatile.Write(ref OperatorDigest, FormationStore.Digest(Credential));
        return Credential;
    }

    public bool IsOperatorCredential(string Credential)
    {
        string Expected = Volatile.Read(ref OperatorDigest);
        return Expected.Length != 0 && Matches(Expected, Credential);
    }

    public async Task<object> ExecuteAsync(string Action, JsonElement Arguments, FormationCaller Caller, CancellationToken Cancellation)
    {
        var Result = await ExecuteOperationAsync(Action, Arguments, Caller, Cancellation);
        if (Action is not ("list" or "show" or "task-show" or "templates" or "open" or "lifecycle-preview")) Changed?.Invoke();
        return Result;
    }

    private async Task<object> ExecuteOperationAsync(string Action, JsonElement Arguments, FormationCaller Caller, CancellationToken Cancellation)
    {
        if (Arguments.ValueKind != JsonValueKind.Object) throw new InvalidOperationException("编队请求必须是 JSON 对象");
        if (Action is not ("list" or "show" or "task-show" or "templates" or "open" or "create" or "template-save" or "lifecycle-preview" or "archive" or "unarchive" or "delete"))
            RequireLifecycleEditable(Store.Get(Text(Arguments, "run_id")));
        switch (Action)
        {
            case "list":
                return Store.Read(Database => Database.RunList.OrderByDescending(Run => Run.CreatedAt)
                    .Where(Run => Caller.IsOperator || FindActor(Database, Run, Caller) is not null).ToList());
            case "show" or "task-show":
                return Store.Read(Database =>
                {
                    var Run = FormationStore.RequireRun(Database, Text(Arguments, "run_id"));
                    Actor(Database, Run, Caller);
                    return Action == "show" ? (object)Run : RequireTask(Run, Text(Arguments, "task_id"));
                });
            case "templates":
                RequireOperator(Caller);
                return Store.ListTemplates();
            case "create":
                RequireOperator(Caller);
                return Write(Action, Arguments, Caller, Database =>
                {
                    var Request = Input<FormationCreate>(Arguments, "formation");
                    if (Request.MemberList.Count == 0 && Request.TemplateId is null)
                    {
                        string Instance = Request.InstanceId.Length == 0 ? LoadSettings().InstanceList.Single(Item => Item.IsPrimary).Id : Request.InstanceId;
                        Request.MemberList = FormationPresets.Members(Request.Preset, Instance, Request.Model, Request.Effort);
                    }
                    var Run = FormationStore.Create(Database, Request);
                    var Controller = Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
                    foreach (var Member in Run.MemberList)
                    {
                        ValidateMember(Member, Controller);
                        if (Member.Role == eFormationRole.Coordinator && Member.SessionId.Length != 0) VerifyCodexSession(Member, Member.SessionId);
                    }
                    return Run;
                });
            case "template-save":
                RequireOperator(Caller);
                return Write(Action, Arguments, Caller, Database =>
                {
                    var Template = Input<FormationTemplate>(Arguments, "template");
                    var Controller = Template.MemberList.SingleOrDefault(Item => Item.Role == eFormationRole.Coordinator);
                    foreach (var Member in Template.MemberList) ValidateMember(Member, Controller);
                    return FormationStore.SaveTemplate(Database, Template);
                });
            case "member":
                RequireOperator(Caller);
                await RuntimeGate.WaitAsync(Cancellation);
                try
                {
                    RequireLifecycleEditable(Store.Get(Text(Arguments, "run_id")));
                    return await MemberAsync(Arguments, Cancellation);
                }
                finally { RuntimeGate.Release(); }
            case "activate":
                RequireOperator(Caller);
                return await ActivateAsync(Arguments, Cancellation);
            case "open":
                return await OpenCoordinatorAsync(Arguments, Caller, Cancellation);
            case "lifecycle-preview":
                RequireOperator(Caller);
                return await LifecyclePlanAsync(Text(Arguments, "run_id"), Text(Arguments, "action"), Cancellation);
            case "archive" or "unarchive" or "delete":
                RequireOperator(Caller);
                return await LifecycleAsync(Action, Arguments, Cancellation);
            case "dispatch":
                return await DispatchAsync(Arguments, Caller, Cancellation);
            case "reconcile":
                return Reconcile(Arguments, Caller);
            case "native-bind" or "native-report":
                return Write(Action, Arguments, Caller, Database =>
                {
                    var Run = FormationStore.RequireRun(Database, Text(Arguments, "run_id"));
                    var TaskItem = RequireTask(Run, Text(Arguments, "task_id"));
                    var Attempt = RequireAttempt(TaskItem, Text(Arguments, "attempt_id"));
                    RequireNativeController(Database, Run, Attempt, Caller);
                    return Action == "native-bind" ? BindNative(Database, Run, TaskItem, Attempt, Arguments)
                        : ReportNative(Run, TaskItem, Attempt, Arguments);
                });
            case "takeover":
                RequireOperator(Caller);
                return await TakeoverAsync(Arguments, Caller, Cancellation);
            case "task" or "complete" or "context" or "pause" or "resume" or "submit" or "review":
                if (Action is "pause" or "resume") RequireOperator(Caller);
                return Write(Action, Arguments, Caller, Database =>
                {
                    var Run = FormationStore.RequireRun(Database, Text(Arguments, "run_id"));
                    var Member = Actor(Database, Run, Caller);
                    return Action switch
                    {
                        "task" => AddTask(Run, Member, Arguments),
                        "complete" => Complete(Run, Member, Arguments),
                        "context" => ChangeContext(Run, Member, Arguments),
                        "pause" or "resume" => ChangeState(Run, Action, Arguments),
                        "submit" => ManualSubmit(Run, Member, Arguments),
                        "review" => ManualReview(Run, Member, Arguments),
                        _ => throw new InvalidOperationException("未知编队操作 " + Action)
                    };
                });
            default:
                throw new InvalidOperationException("未知编队操作 " + Action);
        }
    }

    #region Membership
    private async Task<object> OpenCoordinatorAsync(JsonElement Arguments, FormationCaller Caller, CancellationToken Cancellation)
    {
        var Controller = Store.Read(Database =>
        {
            var Run = FormationStore.RequireRun(Database, Text(Arguments, "run_id"));
            Actor(Database, Run, Caller);
            return Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
        });
        if (Controller.SessionId.Length == 0) throw new InvalidOperationException("统筹会话尚未创建 请先启动统筹");
        if (Agents is null) throw new InvalidOperationException("当前管理器没有接入会话导航");
        var Profile = LoadSettings().InstanceList.Single(Item => Item.Id == Controller.InstanceId);
        using (var Database = ConversationDatabase.Open(Path.Combine(Profile.HomePath, "state_5.sqlite"), true))
        using (var Command = Database.CreateCommand())
        {
            Command.CommandText = "SELECT COUNT(*) FROM threads WHERE id=$id";
            Command.Parameters.AddWithValue("$id", Controller.SessionId);
            if (Convert.ToInt64(Command.ExecuteScalar()) != 1) throw new InvalidOperationException("统筹会话已不存在 " + Controller.SessionId);
        }
        return await DesktopRelayBridge.CallLifecycleAsync(Profile, Controller.SessionId, "navigate_to_codex_page", new { threadId = Controller.SessionId }, Cancellation);
    }

    private async Task<object> MemberAsync(JsonElement Arguments, CancellationToken Cancellation)
    {
        string RunId = Text(Arguments, "run_id");
        string MemberId = Text(Arguments, "member_id");
        string Mode = Text(Arguments, "mode");
        string RequestId = Text(Arguments, "operation_id");
        if (Mode == "credential")
        {
            string Credential = NewCredential();
            Store.Update(Database =>
            {
                var Run = FormationStore.RequireRun(Database, RunId);
                var Member = RequireMember(Run, MemberId);
                if (Member.DispatchMode == eFormationDispatchMode.Native) throw new InvalidOperationException("原生子代理由统筹转交回报 不分发席位凭据");
                if (Member.SessionId.Length == 0) throw new InvalidOperationException("先绑定真实会话再分配该角色的凭据");
                Database.CredentialDict[MemberKey(Run, Member)] = FormationStore.Digest(Credential);
                FormationStore.AddEvent(Run, "operator", "credential_issued", Member.Id);
                return true;
            });
            return new { member_id = MemberId, credential = Credential };
        }
        if (Mode == "configure")
        {
            return Write("member", Arguments, FormationCaller.Operator(), Database =>
            {
                var Run = FormationStore.RequireRun(Database, RunId);
                var Target = Input<FormationMember>(Arguments, "member");
                var Member = Run.MemberList.SingleOrDefault(Item => Item.Id == MemberId);
                Target.Id = MemberId;
                if (Target.DisplayName.Length == 0) Target.DisplayName = Member?.DisplayName ?? $"{Run.Theme} {Run.CreatedAt:MM-dd} 外援";
                FormationStore.RequireText(Target.DisplayName, "席位显示名", 120);
                if (Member is null && (Target.Role != eFormationRole.Outsider || Run.MemberList.Any(Item => Item.Role == eFormationRole.Outsider)))
                    throw new InvalidOperationException("只支持补充当前缺少的外援席位");
                var Controller = Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
                ValidateMember(Target, Controller);
                if (Target.Role == eFormationRole.Coordinator && Target.SubagentMax == 0 &&
                    Run.MemberList.Any(Item => Item.DispatchMode == eFormationDispatchMode.Native))
                    throw new InvalidOperationException("编队仍有原生席位 统筹需要配置子代理预算");
                if (Member is not null && Member.Role == eFormationRole.Coordinator &&
                    Member.SubagentMax != Target.SubagentMax && SameMemberConfiguration(Member, Target))
                {
                    int occupied = Database.RunList.SelectMany(Item => Item.TaskList).SelectMany(Item => Item.AttemptList)
                        .Count(Attempt => OccupiesNativeSlot(Attempt, Member));
                    if (Target.SubagentMax < occupied) throw new InvalidOperationException("统筹预算不能低于已占用的原生席位 " + occupied);
                    Member.SubagentMax = Target.SubagentMax;
                    FormationStore.AddEvent(Run, "operator", "native_budget_updated", Target.SubagentMax.ToString());
                    return Member;
                }
                if (Member is not null && (Target.Role != Member.Role || Run.TaskList.SelectMany(Item => Item.AttemptList)
                    .Any(Attempt => IsReserved(Attempt) && (Attempt.MemberId == Member.Id || Member.Role == eFormationRole.Coordinator))))
                    throw new InvalidOperationException("席位角色不能改变 执行或待停时不能修改配置");
                if (Target.DispatchMode == eFormationDispatchMode.Native && Controller.SubagentMax == 0)
                    Controller.SubagentMax = FormationStore.DefaultSubagentMax(eFormationRole.Coordinator);
                if (!IsExternal(Target.InstanceId))
                {
                    var PeerList = Run.MemberList.Where(Item => Item.Role == Target.Role && Item.Id != MemberId && !IsExternal(Item.InstanceId)).ToList();
                    var ChangedIdHashList = PeerList.Where(Item => Item.Effort != Target.Effort || Item.SubagentMax != Target.SubagentMax).Select(Item => Item.Id).ToHashSet();
                    if (Run.TaskList.SelectMany(Item => Item.AttemptList).Any(Attempt => IsReserved(Attempt) && ChangedIdHashList.Contains(Attempt.MemberId)))
                        throw new InvalidOperationException("同职业席位仍在执行或待停 暂不能修改共享推理强度和子代理预算");
                    foreach (var Peer in PeerList)
                    {
                        Peer.Effort = Target.Effort;
                        Peer.SubagentMax = Target.SubagentMax;
                    }
                }
                if (Target.SessionId.Length != 0 && !IsExternal(Target.InstanceId)) VerifyCodexSession(Target, Target.SessionId);
                if (Target.SessionId.Length != 0) Bind(Run, Target, Target.SessionId);
                if (Member is not null) Run.MemberList.Remove(Member);
                Run.MemberList.Add(Target);
                if (Target.Role == eFormationRole.Coordinator)
                {
                    Run.ActivationState = eFormationDeliveryState.Pending;
                    foreach (var Follower in Run.MemberList.Where(Item => Item.DispatchMode == eFormationDispatchMode.Native))
                        Follower.InstanceId = Target.InstanceId;
                }
                Database.CredentialDict.Remove(MemberKey(Run, Target));
                foreach (var Handoff in Run.HandoffList.Where(Item => !Item.Transferred && Item.ToMemberId.Length == 0 && Item.FromMemberId != Target.Id && Target.Role == eFormationRole.Outsider))
                    Handoff.ToMemberId = Target.Id;
                FormationStore.AddEvent(Run, "operator", "member_configured", Target.Id);
                return Target;
            });
        }
        if (Mode == "bind")
        {
            return Write("member", Arguments, FormationCaller.Operator(), Database =>
            {
                var Run = FormationStore.RequireRun(Database, RunId);
                var Member = RequireMember(Run, MemberId);
                if (Member.DispatchMode == eFormationDispatchMode.Native) throw new InvalidOperationException("原生子代理席位不绑定独立会话");
                string SessionId = Text(Arguments, "session_id");
                if (Run.TaskList.SelectMany(TaskItem => TaskItem.AttemptList).Any(Attempt => IsReserved(Attempt) && (Attempt.MemberId == Member.Id || Member.Role == eFormationRole.Coordinator)))
                    throw new InvalidOperationException("该席位仍有执行或待停任务 无法切换会话");
                if (!IsExternal(Member.InstanceId)) VerifyCodexSession(Member, SessionId);
                Bind(Run, Member, SessionId);
                if (Member.Role == eFormationRole.Coordinator) Run.ActivationState = eFormationDeliveryState.Pending;
                Database.CredentialDict.Remove(MemberKey(Run, Member));
                FormationStore.AddEvent(Run, "operator", "member_bound", Member.Id);
                return Member;
            });
        }
        if (Mode != "create" || Catalog is null) throw new InvalidOperationException("当前只支持通过 Codex 目录新建统筹会话");
        string Intent = "member_create:" + MemberId;
        var Draft = Store.Update(Database =>
        {
            var Run = FormationStore.RequireRun(Database, RunId);
            var Member = RequireMember(Run, MemberId);
            if (Member.Role != eFormationRole.Coordinator || IsExternal(Member.InstanceId)) throw new InvalidOperationException("只有 Codex 统筹支持预先新建");
            if (Member.SessionId.Length != 0) return (Member, Run);
            if (Run.EventList.Any(Item => Item.Kind == Intent)) throw new InvalidOperationException("统筹会话创建已发起 请核对已创建会话并使用 bind");
            FormationStore.AddEvent(Run, "operator", Intent, RequestId);
            return (Member, Run);
        });
        if (Draft.Member.SessionId.Length != 0) return Draft.Member;
        var Profile = AgentManagementService.ResolveInstance(LoadSettings(), Draft.Member.InstanceId);
        AgentProject? Project = null;
        if (Draft.Member.Project.Length != 0)
        {
            var ProjectList = await Catalog.ProjectsAsync(Profile, Cancellation);
            Project = ProjectList.SingleOrDefault(Item => Item.Id == Draft.Member.Project || Item.Name == Draft.Member.Project ||
                Path.IsPathFullyQualified(Draft.Member.Project) && ManagerPaths.Same(Item.Path, Draft.Member.Project))
                ?? throw new InvalidOperationException("未找到统筹项目 " + Draft.Member.Project);
        }
        var Revision = Draft.Run.RevisionList[^1];
        string Prompt = $"你是编队 {Draft.Run.Theme} 的统筹 编队 ID {Draft.Run.Id}\n需求\n{Revision.Requirement}\n上下文\n{Revision.Context}\n目前只初始化此真实会话 回报已准备并结束本轮 等待管理器发送启动包";
        var Created = await Catalog.CreateAsync(Profile, Project, Draft.Member.DisplayName, Prompt, Draft.Member.Model, Draft.Member.Effort, Cancellation);
        return Store.Update(Database =>
        {
            var Run = FormationStore.RequireRun(Database, RunId);
            var Member = RequireMember(Run, MemberId);
            Bind(Run, Member, Created.Id);
            FormationStore.AddEvent(Run, "operator", "member_created", Created.Id);
            return Member;
        });
    }

    private static bool SameMemberConfiguration(FormationMember Left, FormationMember Right) =>
        Left.Role == Right.Role && Left.DisplayName == Right.DisplayName && Left.InstanceId == Right.InstanceId &&
        Left.SessionId == Right.SessionId && Left.DispatchMode == Right.DispatchMode && Left.FollowCoordinator == Right.FollowCoordinator &&
        Left.Model == Right.Model && Left.Effort == Right.Effort && Left.Project == Right.Project && Left.Cwd == Right.Cwd;

    private static void Bind(FormationRun Run, FormationMember Member, string SessionId)
    {
        if (Run.MemberList.Any(Other => Other.Id != Member.Id && Other.InstanceId == Member.InstanceId && Other.SessionId == SessionId))
            throw new InvalidOperationException("此会话已属于当前编队的另一席位");
        Member.SessionId = SessionId;
    }

    private void VerifyCodexSession(FormationMember Member, string SessionId)
    {
        var Profile = AgentManagementService.ResolveInstance(LoadSettings(), Member.InstanceId);
        (Catalog ?? throw new InvalidOperationException("当前未启用 Codex 会话目录")).Session(Profile, SessionId);
    }

    private void ValidateMember(FormationMember Member, FormationMember? Controller = null)
    {
        if (!Enum.IsDefined(Member.DispatchMode)) throw new InvalidOperationException("席位派发模式无效");
        if (Member.SubagentMax is < 0 or > 4 || Member.SubagentMax != 0 && FormationStore.DefaultSubagentMax(Member.Role) == 0)
            throw new InvalidOperationException("只有统筹 执行和学习席位可配置 1 至 4 个子代理");
        if (Member.FollowCoordinator && Member.Role is not (eFormationRole.Reviewer or eFormationRole.Outsider))
            throw new InvalidOperationException("仅审核或外援席位可跟随统筹");
        if (Member.DispatchMode == eFormationDispatchMode.Native)
        {
            if (Member.Role is not (eFormationRole.Reviewer or eFormationRole.Outsider) || Controller is null ||
                IsExternal(Controller.InstanceId) || Member.SessionId.Length != 0 || Member.Project.Length != 0 || Member.Cwd.Length != 0)
                throw new InvalidOperationException("只有审核与外援可作为统筹的原生子代理 原生席位不能绑定独立会话或工作区");
            Member.InstanceId = Controller.InstanceId;
        }
        if (IsExternal(Member.InstanceId) && Member.SubagentMax != 0)
            throw new InvalidOperationException("当前外部执行端不支持编队子代理预算 " + Member.InstanceId);
        if (!IsExternal(Member.InstanceId)) Member.InstanceId = AgentManagementService.ResolveInstance(LoadSettings(), Member.InstanceId).Id;
        if (Member.Role == eFormationRole.Coordinator && IsExternal(Member.InstanceId)) throw new InvalidOperationException("统筹须绑定真实 Codex 会话");
        if (Member.Project.Length != 0 && Member.InstanceId is CursorRelayRunner.InstanceId or ClaudeRelayRunner.InstanceId or AntigravityRelayRunner.InstanceId)
            throw new InvalidOperationException("该执行端使用 cwd 指定工作目录 " + Member.InstanceId);
        if (Member.Cwd.Length != 0 && (!IsExternal(Member.InstanceId) || Member.InstanceId == DshRelayRunner.InstanceId))
            throw new InvalidOperationException("该执行端使用 project 指定项目或工作区 " + Member.InstanceId);
        if (Member.Effort.Length != 0 && (IsExternal(Member.InstanceId) || Member.Effort is not ("none" or "minimal" or "low" or "medium" or "high" or "xhigh" or "max" or "ultra")))
            throw new InvalidOperationException("该实例或推理强度不受支持 " + Member.InstanceId + " " + Member.Effort);
        if (Member.Model.Length != 0 && Member.InstanceId is DshRelayRunner.InstanceId or AntigravityRelayRunner.InstanceId)
            throw new InvalidOperationException("该执行端沿用会话模型 当前不支持按编队派单指定模型 " + Member.InstanceId);
    }

    private static bool IsExternal(string InstanceId) => InstanceId is CursorRelayRunner.InstanceId or ClaudeRelayRunner.InstanceId or DshRelayRunner.InstanceId or AntigravityRelayRunner.InstanceId;
    #endregion

    #region Tasks and review
    private static FormationTask AddTask(FormationRun Run, FormationMember? Actor, JsonElement Arguments)
    {
        RequireCoordinator(Actor);
        if (Run.State != eFormationState.Active) throw new InvalidOperationException("编队当前无法登记新任务");
        if (Run.SetupOnly) throw new InvalidOperationException("请先在统筹会话确认需求 并通过 formation context 保存后再登记任务");
        var Executor = RequireMember(Run, Text(Arguments, "executor_id"));
        if (Executor.Role != eFormationRole.Executor) throw new InvalidOperationException("新任务须分配给执行席位");
        if (Run.HandoffList.Any(Value => Value.FromMemberId == Executor.Id))
            throw new InvalidOperationException("该执行席位已退出派单");
        string ReviewerId = Arguments.TryGetProperty("reviewer_id", out _)
            ? OptionalText(Arguments, "reviewer_id")
            : Run.MemberList.FirstOrDefault(Item => Item.Role == eFormationRole.Reviewer && Item.DispatchMode == eFormationDispatchMode.Native)?.Id ?? "";
        if (ReviewerId.Length != 0 && RequireMember(Run, ReviewerId).Role != eFormationRole.Reviewer) throw new InvalidOperationException("请指定审核席位");
        var TaskItem = new FormationTask
        {
            Id = FormationStore.NewId(),
            Title = FormationStore.RequireText(Text(Arguments, "title"), "任务标题", 120),
            Instructions = FormationStore.RequireText(Text(Arguments, "instructions"), "执行要求", 4000),
            Acceptance = FormationStore.RequireText(Text(Arguments, "acceptance"), "验收标准", 4000),
            ExecutorId = Executor.Id,
            ReviewerId = ReviewerId,
            State = eFormationTaskState.Ready,
            Workspace = ReadWorkspace(Arguments.GetProperty("workspace"))
        };
        if (TaskItem.Workspace.Access == "unspecified") throw new InvalidOperationException("任务必须声明工作区权限");
        Run.TaskList.Add(TaskItem);
        Run.State = eFormationState.Active;
        FormationStore.AddEvent(Run, Actor?.Id ?? "operator", "task_added", TaskItem.Id);
        return TaskItem;
    }

    private static FormationRun ChangeContext(FormationRun Run, FormationMember? Actor, JsonElement Arguments)
    {
        RequireCoordinator(Actor);
        var Previous = Run.RevisionList[^1];
        string Context = Arguments.TryGetProperty("context", out var ContextValue) ? ContextValue.GetString() ?? "" : Previous.Context;
        string Requirement = Arguments.TryGetProperty("requirement", out var RequirementValue) ? RequirementValue.GetString() ?? "" : Previous.Requirement;
        FormationStore.RequireOptionalText(Context, "上下文", 4000);
        FormationStore.RequireText(Requirement, "需求", 4000);
        if (Context == Previous.Context && Requirement == Previous.Requirement) return Run;
        if (Run.State == eFormationState.Completed) throw new InvalidOperationException("编队已结案 无法修改上下文或需求");
        bool ChangedRequirement = Requirement != Previous.Requirement;
        if (ChangedRequirement)
        {
            if (Run.TaskList.SelectMany(Item => Item.AttemptList).Any(IsReserved) || Run.HandoffList.Any(Item => !Item.Transferred))
                throw new InvalidOperationException("仍有执行或交接未确认 不能切换需求版本");
            Run.RequirementVersion++;
            foreach (var Item in Run.TaskList)
            {
                Item.State = eFormationTaskState.Ready;
                Item.ResumeState = null;
                Item.ProcessingDetail = "";
            }
        }
        Run.ContextVersion++;
        Run.SetupOnly = false;
        Run.RevisionList.Add(new(Run.ContextVersion, Run.RequirementVersion, Context, Requirement, DateTimeOffset.UtcNow));
        FormationStore.AddEvent(Run, Actor?.Id ?? "operator", "revision_changed", $"{Run.ContextVersion}/{Run.RequirementVersion}");
        return Run;
    }

    private FormationRun ChangeState(FormationRun Run, string Action, JsonElement Arguments)
    {
        if (Run.State == eFormationState.Completed) throw new InvalidOperationException("编队已完成");
        string TaskId = OptionalText(Arguments, "task_id");
        if (Action == "resume" && TaskId.Length != 0)
        {
            var TaskItem = RequireTask(Run, TaskId);
            if (TaskItem.State is not (eFormationTaskState.Blocked or eFormationTaskState.DeliveryUnknown))
                throw new InvalidOperationException("仅阻塞或投递未知任务可人工安排重新派发");
            var Attempt = TaskItem.AttemptList[^1];
            if (DispatchDict.ContainsKey(Attempt.Id) || !Arguments.TryGetProperty("confirmed", out var Confirmation) || !Confirmation.GetBoolean())
                throw new InvalidOperationException("先核对原轮次已停止且没有仍在进行的派发");
            string Evidence = FormationStore.RequireText(Text(Arguments, "evidence"), "人工恢复证据", 4000);
            if (IsReserved(Attempt)) Attempt.State = eFormationAttemptState.Stopped;
            TaskItem.State = TaskItem.ResumeState ?? (Attempt.Kind == eFormationAttemptKind.Review ? eFormationTaskState.Submitted : eFormationTaskState.Ready);
            TaskItem.ResumeState = null;
            TaskItem.ProcessingDetail = "";
            FormationStore.AddEvent(Run, "operator", "task_resume_confirmed", Attempt.Id + " " + Evidence);
        }
        Run.State = Action == "pause" ? eFormationState.Paused : eFormationState.Active;
        FormationStore.AddEvent(Run, "operator", Action, Run.Theme);
        return Run;
    }

    private static object ManualSubmit(FormationRun Run, FormationMember? Member, JsonElement Arguments)
    {
        var TaskItem = RequireTask(Run, Text(Arguments, "task_id"));
        var Attempt = RequireAttempt(TaskItem, Text(Arguments, "attempt_id"));
        RequireAssignment(Member, Attempt, eFormationAttemptKind.Execute);
        string Id = Text(Arguments, "submission_id");
        return Submit(Run, TaskItem, Attempt, Id, Text(Arguments, "summary"), ReadArtifacts(Arguments), Member?.Id ?? "operator");
    }

    private static object ManualReview(FormationRun Run, FormationMember? Member, JsonElement Arguments)
    {
        var TaskItem = RequireTask(Run, Text(Arguments, "task_id"));
        var Attempt = RequireAttempt(TaskItem, Text(Arguments, "attempt_id"));
        string SubmissionId = Text(Arguments, "submission_id");
        bool Passed = Arguments.GetProperty("passed").GetBoolean();
        string Feedback = OptionalText(Arguments, "feedback");
        string ActorId = Member?.Id ?? "operator";
        if (TaskItem.ReviewerId.Length != 0)
        {
            RequireAssignment(Member, Attempt, eFormationAttemptKind.Review);
            return Review(Run, TaskItem, Attempt, SubmissionId, Passed, Feedback, ActorId);
        }
        RequireCoordinator(Member);
        var Previous = ExistingReview(TaskItem, Attempt, SubmissionId, Passed, Feedback);
        if (Previous is not null) return Previous;
        var Submission = TaskItem.SubmissionList.LastOrDefault();
        if (TaskItem.State != eFormationTaskState.Submitted || Attempt.Kind != eFormationAttemptKind.Execute ||
            Submission is null || Submission.Id != SubmissionId || Submission.AttemptId != Attempt.Id || Submission.RequirementVersion != Run.RequirementVersion)
            throw new InvalidOperationException("统筹验收须对应当前需求版本的最新提交");
        return RecordReview(Run, TaskItem, Attempt, SubmissionId, Passed, Feedback, ActorId);
    }

    private static FormationSubmission Submit(FormationRun Run, FormationTask TaskItem, FormationAttempt Attempt, string Id, string Summary, List<FormationArtifact> ArtifactList, string ActorId)
    {
        FormationStore.RequireText(Id, "提交 ID", 128);
        FormationStore.RequireText(Summary, "提交摘要", RelayLimits.MaxTextLength);
        var Existing = TaskItem.SubmissionList.SingleOrDefault(Value => Value.AttemptId == Attempt.Id || Value.Id == Id);
        if (Existing is not null)
        {
            if (Existing.Id != Id || Existing.AttemptId != Attempt.Id || Existing.Summary != Summary || !Existing.ArtifactList.SequenceEqual(ArtifactList))
                throw new InvalidOperationException("该提交或轮次已存在不同结果");
            return Existing;
        }
        RequireLive(Run, TaskItem, Attempt, eFormationAttemptKind.Execute);
        if (TaskItem.State != eFormationTaskState.Running) throw new InvalidOperationException("执行轮次尚未确认");
        var Submission = new FormationSubmission(Id, Attempt.Id, Attempt.ContextVersion, Attempt.RequirementVersion, Summary, ArtifactList, DateTimeOffset.UtcNow);
        TaskItem.SubmissionList.Add(Submission);
        Attempt.State = eFormationAttemptState.Finished;
        TaskItem.State = eFormationTaskState.Submitted;
        FormationStore.AddEvent(Run, ActorId, "submitted", TaskItem.Id + "/" + Id);
        return Submission;
    }

    private static FormationReview Review(FormationRun Run, FormationTask TaskItem, FormationAttempt Attempt, string SubmissionId, bool Passed, string Feedback, string ActorId)
    {
        var Existing = ExistingReview(TaskItem, Attempt, SubmissionId, Passed, Feedback);
        if (Existing is not null) return Existing;
        RequireLive(Run, TaskItem, Attempt, eFormationAttemptKind.Review);
        if (TaskItem.State != eFormationTaskState.Reviewing || Attempt.SubmissionId != SubmissionId)
            throw new InvalidOperationException("审核必须对应当前轮次提交");
        return RecordReview(Run, TaskItem, Attempt, SubmissionId, Passed, Feedback, ActorId);
    }

    private static FormationReview? ExistingReview(FormationTask TaskItem, FormationAttempt Attempt, string SubmissionId, bool Passed, string Feedback)
    {
        var Existing = TaskItem.ReviewList.SingleOrDefault(Value => Value.SubmissionId == SubmissionId || Value.AttemptId == Attempt.Id);
        if (Existing is not null && (Existing.AttemptId != Attempt.Id || Existing.SubmissionId != SubmissionId || Existing.Passed != Passed || Existing.Feedback != Feedback))
            throw new InvalidOperationException("同一提交只能有一份审核结论");
        return Existing;
    }

    private static FormationReview RecordReview(FormationRun Run, FormationTask TaskItem, FormationAttempt Attempt, string SubmissionId, bool Passed, string Feedback, string ActorId)
    {
        FormationStore.RequireOptionalText(Feedback, "审核反馈", RelayLimits.MaxTextLength);
        if (!Passed) FormationStore.RequireText(Feedback, "拒绝理由", RelayLimits.MaxTextLength);
        var Submission = TaskItem.SubmissionList.Single(Value => Value.Id == SubmissionId);
        VerifyArtifacts(Submission);
        var Review = new FormationReview(SubmissionId, Attempt.Id, Attempt.RequirementVersion, Passed, Feedback, ActorId, DateTimeOffset.UtcNow);
        TaskItem.ReviewList.Add(Review);
        Attempt.State = eFormationAttemptState.Finished;
        TaskItem.State = Passed ? eFormationTaskState.Passed : eFormationTaskState.NeedsRework;
        FormationStore.AddEvent(Run, ActorId, Passed ? "review_passed" : "review_rejected", TaskItem.Id + "/" + SubmissionId);
        if (!Passed)
        {
            string ExecutorId = RequireAttempt(TaskItem, Submission.AttemptId).MemberId;
            if (CountRejectedSubmissions(TaskItem, ExecutorId, Submission.RequirementVersion) >= 3)
                BeginHandoff(Run, TaskItem, ExecutorId, Submission.RequirementVersion);
        }
        return Review;
    }

    private static int CountRejectedSubmissions(FormationTask TaskItem, string ExecutorId, int RequirementVersion)
    {
        var ExecutionIdHashList = TaskItem.AttemptList
            .Where(Value => Value.Kind == eFormationAttemptKind.Execute && Value.MemberId == ExecutorId)
            .Select(Value => Value.Id)
            .ToHashSet(StringComparer.Ordinal);
        var SubmissionIdHashList = TaskItem.SubmissionList
            .Where(Value => Value.RequirementVersion == RequirementVersion && ExecutionIdHashList.Contains(Value.AttemptId))
            .Select(Value => Value.Id)
            .ToHashSet(StringComparer.Ordinal);
        return TaskItem.ReviewList.Count(Value => !Value.Passed && Value.RequirementVersion == RequirementVersion && SubmissionIdHashList.Contains(Value.SubmissionId));
    }

    private static void RequireLive(FormationRun Run, FormationTask TaskItem, FormationAttempt Attempt, eFormationAttemptKind Kind)
    {
        if (Attempt.Kind != Kind || Attempt.RequirementVersion != Run.RequirementVersion || Attempt.State != eFormationAttemptState.Running ||
            TaskItem.AttemptList[^1].Id != Attempt.Id || TaskItem.State == eFormationTaskState.AwaitingHandoff)
            throw new InvalidOperationException("轮次已失效或不属于当前需求版本");
    }

    private static FormationRun Complete(FormationRun Run, FormationMember? Member, JsonElement Arguments)
    {
        RequireCoordinator(Member);
        string Summary = FormationStore.RequireText(Text(Arguments, "summary"), "编队交付总结", RelayLimits.MaxTextLength);
        if (Run.TaskList.Count == 0 || Run.TaskList.Any(Item => !HasCurrentApproval(Item, Run.RequirementVersion)))
            throw new InvalidOperationException("全部任务的最新提交须按当前需求版本验收通过");
        if (Run.State == eFormationState.Completed)
        {
            if (Run.FinalSummary != Summary) throw new InvalidOperationException("编队已有不同的交付总结");
            return Run;
        }
        Run.State = eFormationState.Completed;
        Run.FinalSummary = Summary;
        FormationStore.AddEvent(Run, Member?.Id ?? "operator", "completed", Summary);
        return Run;
    }

    private static bool HasCurrentApproval(FormationTask Item, int RequirementVersion)
    {
        var Submission = Item.SubmissionList.LastOrDefault();
        var Review = Item.ReviewList.LastOrDefault();
        return Item.State == eFormationTaskState.Passed && Submission is not null && Submission.RequirementVersion == RequirementVersion &&
            Review is { Passed: true } && Review.RequirementVersion == RequirementVersion && Review.SubmissionId == Submission.Id;
    }
    #endregion

    #region Shared validation
    private object Write(string Action, JsonElement Arguments, FormationCaller Caller, Func<FormationDatabase, object> Apply)
    {
        string Id = Text(Arguments, "operation_id");
        string RunId = OptionalText(Arguments, "run_id");
        string ActorId = Caller.IsOperator ? "operator" : Caller.InstanceId + "/" + Caller.SessionId;
        string Key = JsonSerializer.Serialize(new[] { ActorId, RunId, Action, Id });
        string Hash = FormationStore.Digest(Arguments.GetRawText());
        return Store.Update<object>(Database =>
        {
            if (!Caller.IsOperator) Actor(Database, FormationStore.RequireRun(Database, RunId), Caller);
            if (Database.ReceiptDict.TryGetValue(Key, out var Existing))
            {
                if (Existing.InputHash != Hash) throw new InvalidOperationException("同一操作标识的参数发生变化");
                return Existing.Result;
            }
            if (RunId.Length != 0) RequireLifecycleEditable(FormationStore.RequireRun(Database, RunId));
            var Result = Apply(Database);
            RequireUnsharedLifecycleTargets(Database);
            Database.ReceiptDict.Add(Key, new(Hash, JsonSerializer.SerializeToElement(Result, WireOptions)));
            return Result;
        });
    }

    internal static JsonElement Output(object Value) => JsonSerializer.SerializeToElement(Value, WireOptions);

    private static string Text(JsonElement Element, string Name) => FormationStore.RequireText(OptionalText(Element, Name), Name, 16000);

    private static string OptionalText(JsonElement Element, string Name) => Element.TryGetProperty(Name, out var Value) ? Value.GetString() ?? "" : "";

    private static T Input<T>(JsonElement Arguments, string Name) where T : class => Arguments.GetProperty(Name).Deserialize<T>(WireOptions)
        ?? throw new InvalidOperationException("缺少 " + Name);

    private static FormationTask RequireTask(FormationRun Run, string Id) => Run.TaskList.SingleOrDefault(Value => Value.Id == Id)
        ?? throw new InvalidOperationException("任务不属于该编队 " + Id);

    private static FormationAttempt RequireAttempt(FormationTask TaskItem, string Id) => TaskItem.AttemptList.SingleOrDefault(Value => Value.Id == Id)
        ?? throw new InvalidOperationException("轮次不属于该任务 " + Id);

    private static FormationMember RequireMember(FormationRun Run, string Id) => Run.MemberList.SingleOrDefault(Value => Value.Id == Id)
        ?? throw new InvalidOperationException("席位不属于该编队 " + Id);

    private static FormationMember? Actor(FormationDatabase Database, FormationRun Run, FormationCaller Caller)
        => Caller.IsOperator ? null : FindActor(Database, Run, Caller) ?? throw new InvalidOperationException("调用者身份或编队凭据未通过确认");

    private static FormationMember? FindActor(FormationDatabase Database, FormationRun Run, FormationCaller Caller)
    {
        var Member = Run.MemberList.SingleOrDefault(Value => Value.InstanceId == Caller.InstanceId && Value.SessionId.Length != 0 && Value.SessionId == Caller.SessionId);
        return Member is not null && Database.CredentialDict.TryGetValue(MemberKey(Run, Member), out string? Expected) && Matches(Expected, Caller.Credential) ? Member : null;
    }

    private static bool Matches(string Expected, string Provided) => Provided.Length == 64 &&
        CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(Expected), Encoding.ASCII.GetBytes(FormationStore.Digest(Provided)));

    private static string NewCredential() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    private static string MemberKey(FormationRun Run, FormationMember Member) => Run.Id + "/" + Member.Id;

    private static void RequireOperator(FormationCaller Caller)
    {
        if (!Caller.IsOperator) throw new InvalidOperationException("需要编队人工操作权限");
    }

    private static void RequireCoordinator(FormationMember? Actor)
    {
        if (Actor is not null && Actor.Role != eFormationRole.Coordinator) throw new InvalidOperationException("仅统筹或人工操作方可以派单");
    }

    private static void RequireAssignment(FormationMember? Actor, FormationAttempt Attempt, eFormationAttemptKind Kind)
    {
        if (Attempt.DispatchMode == eFormationDispatchMode.Native) throw new InvalidOperationException("原生轮次须由真实统筹使用 native-report 回传");
        if (Attempt.Kind != Kind || Actor is not null && (Actor.Id != Attempt.MemberId || Actor.SessionId != Attempt.SessionId))
            throw new InvalidOperationException("该轮次未分配给当前角色");
    }

    private static bool IsReserved(FormationAttempt Attempt) => Attempt.State is eFormationAttemptState.Dispatching or eFormationAttemptState.DeliveryUnknown or eFormationAttemptState.Running or eFormationAttemptState.AwaitingStop;

    private static RelayWorkspace ReadWorkspace(JsonElement Arguments)
    {
        bool HasPaths = Arguments.TryGetProperty("write_paths", out var Paths) || Arguments.TryGetProperty("write_path_list", out Paths);
        return RelayPolicy.NormalizeWorkspace(new()
        {
            Access = Text(Arguments, "access"),
            WritePathList = HasPaths ? Paths.EnumerateArray().Select(Value => Value.GetString()!).ToList() : new()
        });
    }

    private static List<FormationArtifact> ReadArtifacts(JsonElement Arguments) => Arguments.TryGetProperty("artifacts", out var Values)
        ? CaptureArtifacts(Values.EnumerateArray().Select(Value => Value.GetString()!).ToList()) : new();

    private static List<FormationArtifact> CaptureArtifacts(List<string> PathList)
    {
        if (PathList.Count > 20) throw new InvalidOperationException("产物最多 20 个");
        var ArtifactList = new List<FormationArtifact>();
        foreach (string PathValue in PathList)
        {
            if (!Path.IsPathFullyQualified(PathValue)) throw new InvalidOperationException("产物须使用绝对文件路径 " + PathValue);
            string? Hash = SettingsStore.FileHash(PathValue);
            if (Hash is null) throw new InvalidOperationException("产物文件不存在或尚未生成 " + PathValue);
            ArtifactList.Add(new(PathValue, Hash));
        }
        return ArtifactList;
    }

    private static void VerifyArtifacts(FormationSubmission Submission)
    {
        foreach (var Artifact in Submission.ArtifactList)
            if (SettingsStore.FileHash(Artifact.Path) != Artifact.Sha256) throw new InvalidOperationException("审核产物已变化 " + Artifact.Path);
    }
    #endregion
}
