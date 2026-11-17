using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class FormationService
{
    internal const string LearnerPrepare = "learner-prepare";
    internal const string LearnerSummary = "learner-summary";

    internal static FormationNotification? LearnerNotification(FormationRun Run, string Phase) =>
        Run.NotificationList.SingleOrDefault(Item => Item.Id == Phase);

    private static bool LearnerIsDispatching(FormationRun Run) =>
        LearnerNotification(Run, LearnerPrepare)?.State == eFormationDeliveryState.Dispatching ||
        LearnerNotification(Run, LearnerSummary)?.State == eFormationDeliveryState.Dispatching;

    private static string? PendingLearnerPhase(FormationRun Run)
    {
        if (Run.Archived || Run.LifecycleOperation is { Completed: false }) return null;
        if (LearnerNotification(Run, LearnerPrepare)?.State == eFormationDeliveryState.Dispatching) return LearnerPrepare;
        if (LearnerNotification(Run, LearnerSummary)?.State == eFormationDeliveryState.Dispatching) return LearnerSummary;
        if (Run.ActivationState != eFormationDeliveryState.Delivered || Run.State == eFormationState.Paused) return null;
        var Learner = Run.MemberList.SingleOrDefault(Item => Item.Role == eFormationRole.Learner);
        if (Learner is null) return null;
        var Preparation = LearnerNotification(Run, LearnerPrepare);
        if (Preparation is null && Run.State == eFormationState.Completed) return null;
        if (Learner.SessionId.Length == 0)
            return Preparation is null or { State: eFormationDeliveryState.Pending } ? LearnerPrepare : null;
        return Run.State == eFormationState.Completed && Preparation?.State != eFormationDeliveryState.DeliveryUnknown &&
            LearnerNotification(Run, LearnerSummary) is null ? LearnerSummary : null;
    }

    private async Task ProcessLearnerAsync(FormationRun Run, CancellationToken Cancellation)
    {
        var Phase = PendingLearnerPhase(Run);
        if (Phase is null) return;
        string RequestId = Phase + "-" + Run.Id;
        var Record = LearnerNotification(Run, Phase);
        if (Record?.State != eFormationDeliveryState.Dispatching)
        {
            var Reserved = Store.Update(Database =>
            {
                var Current = FormationStore.RequireRun(Database, Run.Id);
                if (PendingLearnerPhase(Current) != Phase) return null;
                var Controller = Current.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
                var Delivery = LearnerNotification(Current, Phase);
                if (Delivery is null) Current.NotificationList.Add(Delivery = new() { Id = Phase });
                Delivery.RelayRequestKey = Controller.InstanceId + "/" + Controller.SessionId + "/" + RequestId;
                Delivery.State = eFormationDeliveryState.Dispatching;
                return Current;
            });
            if (Reserved is null) return;
            Run = Reserved;
            Record = LearnerNotification(Run, Phase)!;
            var Controller = Run.MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
            var Learner = Run.MemberList.Single(Item => Item.Role == eFormationRole.Learner);
            try
            {
                await Agents!.StartFormationAsync(Run.Id, Controller.InstanceId, Controller.SessionId,
                    LearnerArguments(Run, Controller, Learner, Phase, RequestId), Cancellation);
            }
            catch (Exception Error) when (Error is not OperationCanceledException)
            {
                Program.LogError(Error);
                SyncLearner(Run, Phase, Relay!.FindRequest(Record.RelayRequestKey), Error.Message);
                return;
            }
        }
        SyncLearner(Run, Phase, Relay!.FindRequest(Record.RelayRequestKey), "");
    }

    private void SyncLearner(FormationRun Snapshot, string Phase, RelayTask? Saved, string Error)
    {
        var Seat = Snapshot.MemberList.Single(Item => Item.Role == eFormationRole.Learner);
        bool Active = Saved?.State is eRelayState.Running or eRelayState.Sending or eRelayState.Recovering;
        bool BindSession = Phase == LearnerPrepare && Seat.SessionId.Length == 0 &&
            Saved is { Channel.WorkerThreadId.Length: > 0 } && (Saved.State == eRelayState.Returned ||
                Saved.State == eRelayState.Running && Seat.InstanceId is not (CursorRelayRunner.InstanceId or ClaudeRelayRunner.InstanceId));
        if (Active && !BindSession) return;
        bool Updated = Store.Update(Database =>
        {
            var Run = FormationStore.RequireRun(Database, Snapshot.Id);
            var Delivery = LearnerNotification(Run, Phase)!;
            var Learner = Run.MemberList.Single(Item => Item.Role == eFormationRole.Learner);
            if (Delivery.State != eFormationDeliveryState.Dispatching) return false;
            if (Saved is not null && (Saved.Channel.FormationRunId != Run.Id || Saved.RequestKey != Delivery.RelayRequestKey ||
                Learner.InstanceId != Saved.Channel.WorkerInstance.Id ||
                Learner.SessionId.Length != 0 && Learner.SessionId != Saved.Channel.WorkerThreadId))
                throw new InvalidOperationException("联调会话与编队学习席位不一致 " + Run.Id);

            if (BindSession)
            {
                Bind(Run, Learner, Saved!.Channel.WorkerThreadId);
                FormationStore.AddEvent(Run, "relay", "learner_session_created", Learner.SessionId);
            }
            if (Active) return true;

            bool Success = Saved?.Outcome == "completed" && Learner.SessionId.Length != 0;
            Delivery.State = Success ? eFormationDeliveryState.Delivered : eFormationDeliveryState.DeliveryUnknown;
            Delivery.Detail = Success ? (Phase == LearnerSummary ? Saved!.Result : "") : Error.Length != 0 ? Error :
                Saved is null ? "学习者投递未登记 请核对原会话" : Saved.Outcome.Length != 0 ? Saved.Result : RelayLimits.StateText(Saved.State);
            FormationStore.AddEvent(Run, "relay", Success ? Phase + "-completed" : Phase + "-blocked",
                Saved?.Id ?? Delivery.Detail);
            return true;
        });
        if (Updated) Changed?.Invoke();
    }

    private static JsonElement LearnerArguments(FormationRun Run, FormationMember Controller, FormationMember Learner, string Phase, string RequestId)
    {
        bool Preparing = Phase == LearnerPrepare;
        var RequestDict = new Dictionary<string, object>
        {
            ["request_id"] = RequestId,
            ["instance"] = Learner.InstanceId,
            ["title"] = Preparing ? "准备学习者会话" : "整理已验收的编队成果",
            ["instructions"] = Preparing
                ? "你是此编队的学习者。回复“已就绪”并结束本轮。等待管理器在全队验收后发送材料。"
                : LearnerInstructions(Run),
            ["acceptance"] = Preparing ? "简短确认已就绪" : "整理结论、可复用经验及证据不足之处",
            ["subagent_max"] = Math.Max(Controller.SubagentMax, Learner.SubagentMax),
            ["session_max"] = FormationStore.DefaultGlobalMaxParallel,
            ["cross_agent_max"] = FormationStore.DefaultGlobalMaxParallel,
            ["tree_session_max"] = FormationStore.DefaultGlobalMaxParallel,
            ["max_depth"] = 1,
            ["worker_limits"] = new { subagent_max = Preparing ? 0 : Learner.SubagentMax, session_max = 0, cross_agent_max = 0 },
            ["workspace"] = new { access = "read_only" }
        };
        SetFormationSessionArguments(RequestDict, Learner);
        if (Learner.Model.Length != 0) RequestDict.Add("model", Learner.Model);
        if (Learner.Effort.Length != 0) RequestDict.Add("thinking", Learner.Effort);
        return JsonSerializer.SerializeToElement(RequestDict);
    }

    private static string LearnerInstructions(FormationRun Run)
    {
        var ApprovalList = Run.TaskList.Select(Item =>
        {
            var Submission = Item.SubmissionList[^1];
            return "任务 " + Item.Title + "\n结果 " + Excerpt(Submission.Summary, 640) +
                "\n审核 " + Excerpt(Item.ReviewList[^1].Feedback, 320) +
                string.Concat(Submission.ArtifactList.Take(3).Select(Artifact => "\n产物 " + Excerpt(Artifact.Path, 512)));
        });
        return "根据下列已通过验收的结果整理结论、可复用经验及证据不足之处。只读处理，回报整理结果。\n问题 " + Run.Theme +
            "\n编队总结 " + Excerpt(Run.FinalSummary, 6000) + "\n已验收任务\n" + Excerpt(string.Join("\n\n", ApprovalList), 9200);
    }
}
