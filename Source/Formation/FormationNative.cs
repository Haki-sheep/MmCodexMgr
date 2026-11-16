using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class FormationService
{
    private void RequireNativeCapacity(FormationDatabase Database, FormationRun Run, FormationMember Controller, List<FormationAttempt> ActiveList)
    {
        if (Relay?.IncomingTask(Controller.InstanceId, Controller.SessionId) is not null)
            throw new InvalidOperationException("统筹会话正在执行其他联调任务 无法同时派发编队");
        var NativeList = ActiveList.Where(Item => OccupiesNativeSlot(Item, Controller)).ToList();
        var ActiveIdHashList = NativeList.Select(Item => Item.Id).ToHashSet(StringComparer.Ordinal);
        int capacity = Database.RunList
            .Where(Item => Item.Id == Run.Id || Item.TaskList.SelectMany(TaskItem => TaskItem.AttemptList).Any(Attempt => ActiveIdHashList.Contains(Attempt.Id)))
            .Min(Item => Item.MemberList.Single(Member => Member.Role == eFormationRole.Coordinator).SubagentMax);
        if (NativeList.Count >= capacity) throw new FormationWaitException("当前真实统筹的原生子代理预算已满");
    }

    private static bool CountsDispatchCapacity(FormationAttempt Attempt) =>
        IsReserved(Attempt) && (Attempt.DispatchMode != eFormationDispatchMode.Native || Attempt.NativeCloseEvidence.Length == 0);

    private static bool OccupiesNativeSlot(FormationAttempt Attempt, FormationMember Controller) =>
        Attempt.DispatchMode == eFormationDispatchMode.Native && CountsDispatchCapacity(Attempt) &&
        Attempt.ControllerInstanceId == Controller.InstanceId && Attempt.ControllerSessionId == Controller.SessionId;

    private static DispatchPlan ClaimNative(FormationDatabase Database, DispatchPlan Plan, FormationCaller Caller)
    {
        var Attempt = Plan.Attempt;
        if (Attempt.DispatchMode != eFormationDispatchMode.Native || Caller.IsOperator ||
            Attempt.NativeClaimedAt is not null || Attempt.State != eFormationAttemptState.Dispatching ||
            Plan.Run.State != eFormationState.Active || Plan.TaskItem.AttemptList[^1] != Attempt) return Plan;
        RequireNativeController(Database, Plan.Run, Attempt, Caller);
        var Work = DispatchInstructions(Plan);
        if (Attempt.Kind == eFormationAttemptKind.Review)
            VerifyArtifacts(Plan.TaskItem.SubmissionList.Single(Item => Item.Id == Attempt.SubmissionId));
        string Paths = string.Join("\n", Work.Workspace.WritePathList);
        string Result = Attempt.Kind == eFormationAttemptKind.Review
            ? Work.Acceptance
            : "验收标准\n" + Work.Acceptance + "\n回传一个 JSON 对象 仅包含 summary 字符串和 artifacts 绝对文件路径数组。";
        string Prompt = $"编队 {Plan.Run.Id} 任务 {Plan.TaskItem.Title} 轮次 {Attempt.Id}。\n" +
            $"你是当前统筹的原生子代理。你是叶子，subagent_max=0 session_max=0 cross_agent_max=0，禁止继续委派或调用其他会话。\n" +
            $"工作区权限 {Work.Workspace.Access}\n{Paths}\n{Work.Instructions}\n{Result}\n将结果直接交还统筹，不调用编队 CLI。";
        Attempt.NativeClaimedAt = DateTimeOffset.UtcNow;
        FormationStore.AddEvent(Plan.Run, Plan.Controller.Id, "native_claimed", Attempt.Id);
        return Plan with { NativePrompt = Prompt };
    }

    private static void RequireNativeController(FormationDatabase Database, FormationRun Run, FormationAttempt Attempt, FormationCaller Caller)
    {
        if (Attempt.DispatchMode != eFormationDispatchMode.Native || Caller.IsOperator ||
            Caller.InstanceId != Attempt.ControllerInstanceId || Caller.SessionId != Attempt.ControllerSessionId ||
            Actor(Database, Run, Caller)?.Role != eFormationRole.Coordinator)
            throw new InvalidOperationException("只有原始真实统筹可以领取或回传该原生轮次");
    }

    private static FormationAttempt BindNative(FormationDatabase Database, FormationRun Run, FormationTask TaskItem, FormationAttempt Attempt, JsonElement Arguments)
    {
        string AgentId = FormationStore.RequireText(Text(Arguments, "agent_id"), "原生 Agent ID", 128);
        string Stage = Text(Arguments, "stage");
        if (Run.MemberList.Any(Item => Item.SessionId == AgentId))
            throw new InvalidOperationException("编队已有独立会话不能登记为原生 Agent");
        if (Stage is not ("created" or "running")) throw new InvalidOperationException("原生绑定阶段必须是 created 或 running");
        if (Attempt.NativeClaimedAt is null || Attempt.NativeAgentId.Length != 0 && Attempt.NativeAgentId != AgentId)
            throw new InvalidOperationException("原生轮次尚未领取或已登记其他 Agent");
        if (Attempt.State is eFormationAttemptState.Finished or eFormationAttemptState.Stopped)
        {
            if (Attempt.NativeAgentId == AgentId) return Attempt;
            throw new InvalidOperationException("原生轮次已结束");
        }
        if (TaskItem.AttemptList[^1] != Attempt && Attempt.State != eFormationAttemptState.AwaitingStop)
            throw new InvalidOperationException("原生轮次已被新轮次取代");
        if (Database.RunList.SelectMany(Item => Item.TaskList).SelectMany(Item => Item.AttemptList)
            .Any(Item => Item.Id != Attempt.Id && Item.ControllerInstanceId == Attempt.ControllerInstanceId &&
                Item.ControllerSessionId == Attempt.ControllerSessionId && Item.NativeAgentId == AgentId))
            throw new InvalidOperationException("此原生 Agent 已登记到其他轮次");
        bool changed = Attempt.NativeAgentId.Length == 0 || Stage == "running" && Attempt.State != eFormationAttemptState.Running;
        Attempt.NativeAgentId = AgentId;
        if (Stage == "running" && Attempt.State != eFormationAttemptState.AwaitingStop) MarkNativeRunning(TaskItem, Attempt);
        if (changed) FormationStore.AddEvent(Run, Attempt.MemberId, "native_bound", Attempt.Id + "/" + AgentId + " " + Stage);
        return Attempt;
    }

    private static object ReportNative(FormationRun Run, FormationTask TaskItem, FormationAttempt Attempt, JsonElement Arguments)
    {
        string Outcome = Text(Arguments, "outcome");
        string AgentId = OptionalText(Arguments, "agent_id");
        if (Attempt.NativeClaimedAt is null || Attempt.NativeAgentId != AgentId)
            throw new InvalidOperationException("回传须对应已领取的原生轮次与已登记的 Agent ID");
        if (Outcome is not ("completed" or "failed" or "stopped" or "not_started" or "unknown"))
            throw new InvalidOperationException("未知原生回传结果 " + Outcome);
        if (Outcome is "completed" or "failed" or "stopped" && AgentId.Length == 0 || Outcome == "not_started" && AgentId.Length != 0)
            throw new InvalidOperationException("已启动的原生轮次须先登记 Agent ID");
        if (TaskItem.AttemptList[^1] != Attempt && Attempt.State != eFormationAttemptState.AwaitingStop)
            throw new InvalidOperationException("原生轮次已被新轮次取代");

        string Evidence = FormationStore.RequireText(Text(Arguments, "evidence"), "原生工具结果或停止证据", 4000);
        if (Outcome == "unknown")
        {
            if (Attempt.State is eFormationAttemptState.Finished or eFormationAttemptState.Stopped || Attempt.NativeCloseEvidence.Length != 0)
                throw new InvalidOperationException("原生轮次已有结束证据");
            if (Attempt.State != eFormationAttemptState.AwaitingStop)
            {
                Attempt.State = eFormationAttemptState.DeliveryUnknown;
                TaskItem.State = eFormationTaskState.DeliveryUnknown;
            }
            Attempt.Detail = Evidence;
            FormationStore.AddEvent(Run, Attempt.MemberId, "native_unknown", Attempt.Id + " " + Evidence);
            return Attempt;
        }

        if (Attempt.NativeCloseEvidence.Length != 0 && Attempt.NativeCloseEvidence != Evidence)
            throw new InvalidOperationException("原生轮次已有不同的结束证据");
        if (Attempt.State == eFormationAttemptState.AwaitingStop)
        {
            if (Outcome is not ("stopped" or "not_started")) throw new InvalidOperationException("该轮次已冻结 请只回传停止证据");
            Attempt.NativeCloseEvidence = Evidence;
            FormationStore.AddEvent(Run, Attempt.MemberId, "native_stopped_pending_confirmation", Attempt.Id + " " + Evidence);
            return Attempt;
        }
        if (Outcome == "completed")
        {
            if (Attempt.State == eFormationAttemptState.Stopped || Attempt.RequirementVersion != Run.RequirementVersion)
                throw new InvalidOperationException("原生轮次已停止或不属于当前需求版本");
            if (Attempt.State != eFormationAttemptState.Finished) MarkNativeRunning(TaskItem, Attempt);
            Attempt.NativeCloseEvidence = Evidence;
            Attempt.Detail = "";
            if (Attempt.Kind == eFormationAttemptKind.Execute)
                return Submit(Run, TaskItem, Attempt, Attempt.Id, Text(Arguments, "summary"), ReadArtifacts(Arguments), Attempt.MemberId);
            return Review(Run, TaskItem, Attempt, Text(Arguments, "submission_id"), Arguments.GetProperty("passed").GetBoolean(),
                OptionalText(Arguments, "feedback"), Attempt.MemberId);
        }
        if (Attempt.State is eFormationAttemptState.Finished or eFormationAttemptState.Stopped)
            throw new InvalidOperationException("原生轮次已结束 请重试原回传请求");
        Attempt.NativeCloseEvidence = Evidence;
        Attempt.Detail = Evidence;
        Attempt.State = eFormationAttemptState.Stopped;
        TaskItem.State = eFormationTaskState.Blocked;
        TaskItem.ResumeState = Attempt.Kind == eFormationAttemptKind.Review ? eFormationTaskState.Submitted
            : TaskItem.ReviewList.LastOrDefault()?.RequirementVersion == Run.RequirementVersion ? eFormationTaskState.NeedsRework : eFormationTaskState.Ready;
        FormationStore.AddEvent(Run, Attempt.MemberId, "native_" + Outcome, Attempt.Id + " " + Evidence);
        return Attempt;
    }

    private static void MarkNativeRunning(FormationTask TaskItem, FormationAttempt Attempt)
    {
        Attempt.State = eFormationAttemptState.Running;
        TaskItem.State = Attempt.Kind == eFormationAttemptKind.Review ? eFormationTaskState.Reviewing : eFormationTaskState.Running;
        Attempt.Detail = "";
    }
}
