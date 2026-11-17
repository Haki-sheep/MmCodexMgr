using System.Collections.Concurrent;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class FormationService
{
    /// <summary> 串行推动编队账本 </summary>
    private readonly SemaphoreSlim RuntimeGate = new(1, 1);
    /// <summary> 推进期间收到的额外状态变更 </summary>
    private int PendingRuntimePass;
    /// <summary> 正在发送启动包的编队 </summary>
    private readonly ConcurrentDictionary<string, byte> ActivationDict = new();

    private sealed class FormationWaitException(string Message) : InvalidOperationException(Message) { }
    private sealed record FormationNotice(string Key, string Text);
    private sealed record ActivationPlan(FormationRun Run, string Prompt);

    public event Action? Changed;

    public async Task ProcessResultsAsync(CancellationToken Cancellation)
    {
        Interlocked.Exchange(ref PendingRuntimePass, 1);
        while (!Cancellation.IsCancellationRequested)
        {
            if (!await RuntimeGate.WaitAsync(0, Cancellation)) return;
            try
            {
                while (Interlocked.Exchange(ref PendingRuntimePass, 0) != 0)
                    await ProcessPassAsync(Cancellation);
            }
            finally { RuntimeGate.Release(); }
            if (Volatile.Read(ref PendingRuntimePass) == 0) return;
        }
    }

    private async Task ProcessPassAsync(CancellationToken Cancellation)
    {
        RecoverPendingDeliveries();
        if (Relay is not null)
        {
            foreach (var Run in Store.List())
            {
                foreach (var Item in Run.TaskList)
                {
                    Cancellation.ThrowIfCancellationRequested();
                    var Attempt = Item.AttemptList.LastOrDefault();
                    if (Attempt is null || Attempt.DispatchMode != eFormationDispatchMode.Session || Item.State is eFormationTaskState.AwaitingHandoff or eFormationTaskState.Blocked ||
                        Attempt.State is not (eFormationAttemptState.Dispatching or eFormationAttemptState.DeliveryUnknown or eFormationAttemptState.Running))
                        continue;
                    var Saved = FindRelay(Attempt);
                    if (Saved is null && Attempt.State == eFormationAttemptState.DeliveryUnknown ||
                        Saved is { State: eRelayState.Running, Outcome.Length: 0 } && Attempt.State == eFormationAttemptState.Running)
                        continue;
                    try { SyncAttempt(Run.Id, Item.Id, Attempt.Id, FormationCaller.Operator()); }
                    catch (Exception Error) when (Error is InvalidOperationException or IOException or JsonException or KeyNotFoundException)
                    {
                        RecordRuntimeFailure(Run.Id, Item.Id, Attempt.Id, Error.Message, null);
                    }
                }
            }
        }
        foreach (var Run in Store.List().Where(Item => Item.State == eFormationState.Active && !Item.Archived && Item.LifecycleOperation is not { Completed: false }))
        {
            foreach (var Item in Run.TaskList)
            {
                Cancellation.ThrowIfCancellationRequested();
                bool Review = Item.State == eFormationTaskState.Submitted && Item.ReviewerId.Length != 0;
                if (!Review && Item.State != eFormationTaskState.NeedsRework) continue;
                var Submission = Item.SubmissionList.LastOrDefault();
                if (Submission is null) continue;
                string targetId = Review ? Item.ReviewerId : Item.ExecutorId;
                if (!Review && Run.MemberList.Any(Member => Member.Id == targetId && Member.Role == eFormationRole.Coordinator)) continue;
                if ((Relay is null || Agents is null) && Run.MemberList.All(Member => Member.Id != targetId || Member.DispatchMode != eFormationDispatchMode.Native)) continue;
                string Kind = Review ? "review" : "execute";
                int PriorCount = Item.AttemptList.Count;
                string Operation = $"auto-{Kind}-{Submission.Id}-{PriorCount}";
                string? AttemptId = Item.AttemptList.LastOrDefault()?.Id;
                var Arguments = JsonSerializer.SerializeToElement(new { run_id = Run.Id, task_id = Item.Id, kind = Kind, operation_id = Operation });
                try { await DispatchAsync(Arguments, FormationCaller.Operator(), Cancellation); }
                catch (FormationWaitException) { }
                catch (Exception Error) when (Error is InvalidOperationException or IOException or JsonException or KeyNotFoundException)
                {
                    RecordRuntimeFailure(Run.Id, Item.Id, AttemptId, Error.Message, Item.State, Operation);
                }
            }
        }
        if (Agents is not null && Relay is not null)
        {
            foreach (var Run in Store.List())
            {
                Cancellation.ThrowIfCancellationRequested();
                await ProcessLearnerAsync(Run, Cancellation);
            }
        }
        if (Notify is null) return;
        foreach (var Run in Store.List())
        {
            foreach (var Notice in NoticeList(Run))
            {
                Cancellation.ThrowIfCancellationRequested();
                await NotifyOnceAsync(Run.Id, Notice);
            }
        }
    }

    private void RecordRuntimeFailure(string RunId, string TaskId, string? ExpectedAttempt, string Error, eFormationTaskState? Restore, string Operation = "")
    {
        Store.Update(Database =>
        {
            var Run = FormationStore.RequireRun(Database, RunId);
            var Item = RequireTask(Run, TaskId);
            var Attempt = Item.AttemptList.LastOrDefault();
            if (Item.State is eFormationTaskState.Blocked or eFormationTaskState.AwaitingHandoff or eFormationTaskState.Passed ||
                Attempt?.Id != ExpectedAttempt && (Operation.Length == 0 || Attempt?.OperationId != Operation))
                return false;
            if (Attempt?.State == eFormationAttemptState.DeliveryUnknown && Item.State == eFormationTaskState.DeliveryUnknown) return false;
            Item.State = eFormationTaskState.Blocked;
            Item.ResumeState = Restore;
            Item.ProcessingDetail = Error;
            if (Attempt is not null && IsReserved(Attempt)) Attempt.State = eFormationAttemptState.DeliveryUnknown;
            FormationStore.AddEvent(Run, "manager", "runtime_blocked", Item.Id + " " + Error);
            return true;
        });
    }

    private static IEnumerable<FormationNotice> NoticeList(FormationRun Run)
    {
        if (Run.ActivationState == eFormationDeliveryState.Delivered && Run.ContextVersion > 1)
        {
            var Revision = Run.RevisionList[^1];
            yield return new("revision/" + Revision.ContextVersion,
                $"编队 {Run.Id} 上下文已更新至 v{Revision.ContextVersion}，需求版本 v{Revision.RequirementVersion}。\n" +
                "需求摘要 " + Excerpt(Revision.Requirement, 640) + "\n上下文摘要 " + Excerpt(Revision.Context, 640) +
                "\n已派发轮次继续按原快照处理。使用 formation show 并提供 run_id 查看完整更新。\n" + FormatSeatPlan(Run));
        }
        foreach (var Handoff in Run.HandoffList.Where(Item => !Item.Transferred))
        {
            yield return new("handoff/" + Handoff.Id,
                $"编队 {Run.Id} 有一项同需求版本第三次拒绝 已冻结原执行席位 {Handoff.FromMemberId} 的剩余任务。交接 {Handoff.Id} 等待人工核实旧轮次和工具进程已停止。其余席位继续处理。");
            foreach (var Attempt in Run.TaskList.SelectMany(Item => Item.AttemptList).Where(Item =>
                Item.DispatchMode == eFormationDispatchMode.Native && Item.NativeStopRequestedAt is not null &&
                Item.NativeCloseEvidence.Length == 0 && Item.State == eFormationAttemptState.AwaitingStop &&
                Handoff.AttemptIdList.Contains(Item.Id)))
                yield return new("native-stop/" + Attempt.Id,
                    $"编队 {Run.Id} 交接 {Handoff.Id} 请求停止原生轮次 {Attempt.Id}，Agent ID {Attempt.NativeAgentId}。" +
                    $"用宿主工具确认对应 formation_{Attempt.Id} 子代理已结束或已停止。没有 ID 时先核对是否实际创建。" +
                    "用 native-report 提交 stopped 或 not_started 及证据，等待人工确认后移交。");
        }
        foreach (var Item in Run.TaskList)
        {
            if (Run.State == eFormationState.Active && Item.State is (eFormationTaskState.Ready or eFormationTaskState.NeedsRework) &&
                Run.MemberList.Any(Member => Member.Id == Item.ExecutorId && Member.Role == eFormationRole.Coordinator))
            {
                yield return new("coordinator-takeover/" + Item.Id + "/" + Item.AttemptList.Count,
                    $"编队 {Run.Id} 任务 {Item.Title} 已交给统筹兼任外援。先调用 formation dispatch 领取；run_in_coordinator=true 时在本会话执行，完成后调用 formation submit 交给审核席。\n" +
                    Output(new { run_id = Run.Id, task_id = Item.Id, kind = "execute", operation_id = $"coordinator-{Item.Id}-{Item.AttemptList.Count}" }).GetRawText());
            }
            var Attempt = Item.AttemptList.LastOrDefault();
            if (Attempt is null) continue;
            if (Run.State == eFormationState.Active && Attempt.DispatchMode == eFormationDispatchMode.Native &&
                Attempt.State == eFormationAttemptState.Dispatching && Attempt.NativeClaimedAt is null)
            {
                string Kind = Attempt.Kind == eFormationAttemptKind.Review ? "review" : "execute";
                yield return new("native-ready/" + Attempt.Id,
                    $"编队 {Run.Id} 任务 {Item.Title} 的原生轮次 {Attempt.Id} 已预留。请在本统筹会话调用 formation dispatch 领取。" +
                    $"\n{Output(new { run_id = Run.Id, task_id = Item.Id, kind = Kind, operation_id = Attempt.OperationId }).GetRawText()}" +
                    "\n仅响应 can_spawn=true 时调用实际宿主创建工具，随后 native-bind 和 native-report 回传。");
            }
            if (Item.State is eFormationTaskState.Blocked or eFormationTaskState.DeliveryUnknown)
                yield return new("blocked/" + Attempt.Id,
                    $"编队 {Run.Id} 任务 {Item.Title} ({Item.Id}) 待核对。轮次 {Attempt.Id}。{Item.ProcessingDetail} {Attempt.Detail}");
            if (Item.State == eFormationTaskState.Submitted && Item.ReviewerId.Length == 0)
            {
                var Submission = Item.SubmissionList[^1];
                yield return new("acceptance/" + Item.Id + "/" + Submission.Id,
                    $"编队 {Run.Id} 任务 {Item.Title} ({Item.Id}) 待统筹验收。使用 formation review，执行轮次 {Submission.AttemptId}，提交 {Submission.Id}。\n" +
                    SubmissionSummary(Submission) + "\n详情用 formation task-show 读取 submission_list。");
            }
            if (Item.State == eFormationTaskState.Passed)
            {
                var Decision = Item.ReviewList[^1];
                var Submission = Item.SubmissionList.Single(Value => Value.Id == Decision.SubmissionId);
                string Review = Decision.Feedback.Length == 0 ? "" : "\n审核反馈 " + Excerpt(Decision.Feedback, 320);
                yield return new("passed/" + Item.Id + "/" + Decision.SubmissionId,
                    $"编队 {Run.Id} 任务 {Item.Title} ({Item.Id}) 已通过。\n" + SubmissionSummary(Submission) + Review +
                    "\n详情用 formation task-show 读取 submission_list 和 review_list。全部任务通过后用 formation complete 提交编队总结。");
            }
        }
    }

    private static string SubmissionSummary(FormationSubmission Submission)
    {
        var PathList = Submission.ArtifactList.Where(Item => Item.Path.Length <= 512).Take(3).Select(Item => Item.Path).ToList();
        string Artifacts = PathList.Count == 0 ? "" : "\n产物\n" + string.Join("\n", PathList);
        string Remaining = PathList.Count < Submission.ArtifactList.Count ? "\n更多产物见 formation task-show 的 submission_list。" : "";
        return "以下为待核对的执行回报。\n结果摘要 " + Excerpt(Submission.Summary, 640) + Artifacts + Remaining;
    }

    private static string Excerpt(string Value, int Max) => RelayLimits.Excerpt(Value, Max);

    private async Task NotifyOnceAsync(string RunId, FormationNotice Notice)
    {
        if (Notify is null) return;
        var Run = Store.Update(Database =>
        {
            var Current = FormationStore.RequireRun(Database, RunId);
            if (Current.ActivationState != eFormationDeliveryState.Delivered || Current.NotificationList.Any(Item => Item.Id == Notice.Key) ||
                !NoticeList(Current).Any(Item => Item.Key == Notice.Key)) return null;
            Current.NotificationList.Add(new() { Id = Notice.Key, State = eFormationDeliveryState.Dispatching });
            return Current;
        });
        if (Run is null) return;
        try { await Notify(Run, Notice.Text); }
        catch (Exception Error)
        {
            SaveNotification(RunId, Notice.Key, eFormationDeliveryState.DeliveryUnknown, Error.Message);
            return;
        }
        SaveNotification(RunId, Notice.Key, eFormationDeliveryState.Delivered, "");
    }

    private void SaveNotification(string RunId, string Key, eFormationDeliveryState State, string Detail)
    {
        Store.Update(Database =>
        {
            var Run = FormationStore.RequireRun(Database, RunId);
            var Notice = Run.NotificationList.Single(Item => Item.Id == Key);
            Notice.State = State;
            Notice.Detail = Detail;
            FormationStore.AddEvent(Run, "manager", State == eFormationDeliveryState.Delivered ? "notification_delivered" : "notification_uncertain",
                Detail.Length == 0 ? Key : Key + " " + Detail);
            return true;
        });
    }

    private void RecoverPendingDeliveries()
    {
        var RunList = Store.List();
        if (!RunList.Any(Run => Run.ActivationState == eFormationDeliveryState.Dispatching && !ActivationDict.ContainsKey(Run.Id) ||
            Run.NotificationList.Any(Item => Item.State == eFormationDeliveryState.Dispatching && Item.RelayRequestKey.Length == 0))) return;
        Store.Update(Database =>
        {
            foreach (var Run in Database.RunList)
            {
                if (Run.ActivationState == eFormationDeliveryState.Dispatching && !ActivationDict.ContainsKey(Run.Id))
                {
                    Run.ActivationState = eFormationDeliveryState.DeliveryUnknown;
                    Run.ActivationDetail = "管理器停止时启动包投递未确认";
                    FormationStore.AddEvent(Run, "manager", "activation_uncertain", Run.ActivationDetail);
                }
                foreach (var Notification in Run.NotificationList.Where(Item => Item.State == eFormationDeliveryState.Dispatching && Item.RelayRequestKey.Length == 0))
                {
                    Notification.State = eFormationDeliveryState.DeliveryUnknown;
                    Notification.Detail = "管理器停止时通知投递未确认";
                    FormationStore.AddEvent(Run, "manager", "notification_uncertain", Notification.Id);
                }
            }
            return true;
        });
    }

    private async Task<object> ActivateAsync(JsonElement Arguments, CancellationToken Cancellation)
    {
        if (Activate is null) throw new InvalidOperationException("当前管理器没有接入真实统筹启动消息");
        string RunId = Text(Arguments, "run_id");
        string RequestId = Text(Arguments, "operation_id");
        if (!ActivationDict.TryAdd(RunId, 0)) throw new InvalidOperationException("编队启动正在进行");
        try
        {
            var Initial = Store.Get(RunId);
            RequireLifecycleEditable(Initial);
            if (Initial.ActivationState == eFormationDeliveryState.Delivered) return Initial;
            var Member = Initial.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
            if (Initial.State != eFormationState.Active) throw new InvalidOperationException("只有启动中的编队可发送启动包");
            if (Member.SessionId.Length == 0)
            {
                var CreateArguments = JsonSerializer.SerializeToElement(new { run_id = RunId, member_id = Member.Id, mode = "create", operation_id = RequestId });
                await MemberAsync(CreateArguments, Cancellation);
            }
            string Credential = NewCredential();
            var Plan = Store.Update(Database =>
            {
                var Run = FormationStore.RequireRun(Database, RunId);
                var Controller = Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
                if (Run.State != eFormationState.Active) throw new InvalidOperationException("编队已暂停或结束");
                if (Run.ActivationState == eFormationDeliveryState.Dispatching) throw new InvalidOperationException("原启动包投递待核对");
                if (Run.ActivationState == eFormationDeliveryState.DeliveryUnknown)
                {
                    if (!Arguments.TryGetProperty("retry_confirmed", out var Confirmed) || !Confirmed.GetBoolean())
                        throw new InvalidOperationException("原启动包投递未知 确认未收到后才能重发");
                    FormationStore.AddEvent(Run, "operator", "activation_retry_confirmed", Text(Arguments, "evidence"));
                }
                if (Controller.SessionId.Length == 0) throw new InvalidOperationException("启动须绑定真实统筹会话");
                Database.CredentialDict[MemberKey(Run, Controller)] = FormationStore.Digest(Credential);
                Run.ActivationState = eFormationDeliveryState.Dispatching;
                FormationStore.AddEvent(Run, "operator", "activation_requested", RequestId);
                return new ActivationPlan(Run, BuildActivationPrompt(Run, Credential));
            });
            try { await Activate(Plan.Run, Plan.Prompt, Cancellation); }
            catch (Exception Error)
            {
                string Detail = Error.Message.Replace(Credential, "[redacted]", StringComparison.Ordinal);
                SaveActivation(RunId, eFormationDeliveryState.DeliveryUnknown, Detail);
                throw new IOException("统筹启动包投递未确认 请核对原会话后再操作 " + Detail);
            }
            return SaveActivation(RunId, eFormationDeliveryState.Delivered, "");
        }
        finally { ActivationDict.TryRemove(RunId, out _); }
    }

    private FormationRun SaveActivation(string RunId, eFormationDeliveryState State, string Detail)
        => Store.Update(Database =>
        {
            var Run = FormationStore.RequireRun(Database, RunId);
            Run.ActivationState = State;
            Run.ActivationDetail = Detail;
            if (State == eFormationDeliveryState.Delivered && Agents is not null &&
                Run.MemberList.Any(Item => Item.Role == eFormationRole.Learner) && LearnerNotification(Run, LearnerPrepare) is null)
                Run.NotificationList.Add(new() { Id = LearnerPrepare });
            FormationStore.AddEvent(Run, "manager", State == eFormationDeliveryState.Delivered ? "activation_delivered" : "activation_uncertain", Detail);
            return Run;
        });

    private static string BuildActivationPrompt(FormationRun Run, string Credential)
    {
        var Revision = Run.RevisionList[^1];
        string CliPath = AgentCliDeployment.LoadPath().Replace("'", "''");
        string Preparation = Run.SetupOnly
            ? "当前仅完成编队配置，尚无业务需求。简短说明编队已就绪，然后等待用户在本会话提出任务。不要自行编造需求、登记或派发任务。收到并确认需求后，先用 formation context 保存 requirement 和可选 context，再制定计划和派发。\n"
            : $"以下是用户创建编队时提交的初始需求。范围明确时，本轮登记任务并派发给配置的执行者，首次派发时新建该席位的独立会话。\n需求\n{Revision.Requirement}\n上下文\n{Revision.Context}\n";
        return $"[AIMoreMoreWork 编队启动]\n你是此编队的统筹。编队 ID {Run.Id}，主题 {Run.Theme}。\n" + Preparation + FormatSeatPlan(Run) +
            "通过 AIMoreMoreWork.Cli.exe formation show 读取席位与现有任务，task-show 查看指定任务，通过 task 登记新任务，dispatch 启动执行。按需指定审核席位，工具会自动回收结果、派发审核和返工。" +
            "无审核席位的提交由你按原验收标准使用 review 处理。任务全部通过后用 complete 提交交付总结。需要外援时等待管理器的人工作业停止核对。\n" +
            $"你的原生子代理预算为 {Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator).SubagentMax}，仍受宿主额度约束。原生审核与外援只在 formation dispatch 返回 can_spawn=true 时启动一次。" +
            "使用宿主真正的 spawn_agent，使用返回的 task_name、prompt 和 model；参考 preferred_effort 和 effort，按该宿主对模型开放的档位选择实际强度。额度或工具不足时据实报告。" +
            "遇到 run_in_coordinator=true 时在本会话直接接手，完成后通过 formation submit 交由审核。" +
            "使用 native-bind 登记真实 Agent ID 和宿主阶段。收到原生回报并由宿主明确确认本轮结束或停止后，用 native-report 提交结果和证据。仅收到停止请求回执不算已停止。响应丢失或投递未知先用宿主工具核对，不重复创建。\n" +
            "每次调用在当前 PowerShell 子进程设置本编队凭据，只用于调用编队 CLI。不得写入项目、回报或系统环境。保持宿主实际会话身份。\n" +
            $"$env:MMCODEX_FORMATION_MEMBER_TOKEN = '{Credential}'\n& '{CliPath}' formation help\n";
    }

    private static string FormatSeatPlan(FormationRun Run)
    {
        var Controller = Run.MemberList.Single(Member => Member.Role == eFormationRole.Coordinator);
        var LineList = new List<string> { "席位计划" };
        foreach (var Role in SeatProviders.RoleOrder)
        {
            var MemberList = Run.MemberList.Where(Member => Member.Role == Role).ToList();
            for (int Index = 0; Index < MemberList.Count; Index++)
            {
                var Member = MemberList[Index];
                var Preference = Member.FollowCoordinator ? Controller : Member;
                string Name = Role == eFormationRole.Coordinator ? "统筹者" : SeatProviders.RoleTitle(Role);
                if (MemberList.Count > 1) Name += " " + (Index + 1);
                string Model = Preference.Model.Length == 0 ? "沿用会话或实例默认" : Preference.Model;
                string Effort = Preference.Effort.Length == 0 ? "沿用默认" : Preference.Effort;
                LineList.Add($"{Name} 模型 {Model} 拟推理强度 {Effort} 子代理上限 {Member.SubagentMax} 席位ID {Member.Id}");
            }
        }
        if (Controller.SubagentMax == 1 && Run.MemberList.All(Member => Member.Role != eFormationRole.Outsider))
            LineList.Add("统筹兼任外援，接管须等待原轮次停止得到人工确认。");
        LineList.Add("通过 formation dispatch 按席位派发。拟推理强度是目标偏好；无对应档位时选目标模型支持的最近档位，能力未公开时沿用默认。子代理上限不计席位本体，原生叶子与不支持委派的执行端以宿主能力为准。");
        return string.Join("\n", LineList) + "\n";
    }
}
