using System.Text.Json;
using System.Text.Json.Serialization;

namespace CodexInstanceManager;

[JsonConverter(typeof(JsonStringEnumConverter<eFormationRole>))]
public enum eFormationRole { Coordinator, Executor, Reviewer, Outsider, Learner }
[JsonConverter(typeof(JsonStringEnumConverter<eFormationState>))]
public enum eFormationState { Active, Paused, Completed }
[JsonConverter(typeof(JsonStringEnumConverter<eFormationStatus>))]
public enum eFormationStatus { InProgress, Blocked, Archived }
[JsonConverter(typeof(JsonStringEnumConverter<eFormationTaskState>))]
public enum eFormationTaskState { Ready, Dispatching, DeliveryUnknown, Running, Submitted, Reviewing, NeedsRework, Blocked, AwaitingHandoff, Passed }
[JsonConverter(typeof(JsonStringEnumConverter<eFormationAttemptKind>))]
public enum eFormationAttemptKind { Execute, Review }
[JsonConverter(typeof(JsonStringEnumConverter<eFormationAttemptState>))]
public enum eFormationAttemptState { Dispatching, DeliveryUnknown, Running, Finished, AwaitingStop, Stopped }
[JsonConverter(typeof(JsonStringEnumConverter<eFormationDeliveryState>))]
public enum eFormationDeliveryState { Pending, Dispatching, Delivered, DeliveryUnknown }
[JsonConverter(typeof(JsonStringEnumConverter<eFormationDispatchMode>))]
public enum eFormationDispatchMode { Session, Native, Coordinator }

public sealed class FormationMember
{
    public string Id { get; set; } = "";
    public eFormationRole Role { get; set; }
    public eFormationDispatchMode DispatchMode { get; set; }
    public bool FollowCoordinator { get; set; }
    public int SubagentMax { get; set; }
    public string DisplayName { get; set; } = "";
    public string InstanceId { get; set; } = "";
    public string SessionId { get; set; } = "";
    public string Model { get; set; } = "";
    public string Effort { get; set; } = "";
    public string Project { get; set; } = "";
    public string Cwd { get; set; } = "";
}

public sealed class FormationTemplate
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int Version { get; set; }
    public int MaxParallel { get; set; } = 3;
    public List<FormationMember> MemberList { get; set; } = new();
}

public sealed class FormationCreate
{
    public bool SetupOnly { get; set; }
    public string Preset { get; set; } = "basic";
    public string InstanceId { get; set; } = "";
    public string Model { get; set; } = "";
    public string Effort { get; set; } = "";
    public string Theme { get; set; } = "";
    public string Context { get; set; } = "";
    public string Requirement { get; set; } = "";
    public string? TemplateId { get; set; }
    public int MaxParallel { get; set; } = 3;
    public List<FormationMember> MemberList { get; set; } = new();
}

public sealed class FormationRun
{
    public bool SetupOnly { get; set; }
    public string Id { get; set; } = "";
    public string Theme { get; set; } = "";
    public string? TemplateId { get; set; }
    public int? TemplateVersion { get; set; }
    public int MaxParallel { get; set; }
    public eFormationState State { get; set; } = eFormationState.Active;
    public bool Archived { get; set; }
    public FormationLifecycleOperation? LifecycleOperation { get; set; }
    public List<FormationLifecycleTarget> ArchiveSnapshot { get; set; } = new();
    public eFormationStatus Status => LifecycleOperation is { Completed: false } ? eFormationStatus.Blocked : Archived ? eFormationStatus.Archived
        : State is eFormationState.Paused or eFormationState.Completed || ActivationState == eFormationDeliveryState.DeliveryUnknown ||
          TaskList.Any(Item => Item.State is eFormationTaskState.Blocked or eFormationTaskState.DeliveryUnknown or eFormationTaskState.AwaitingHandoff) ||
          HandoffList.Any(Item => !Item.Transferred) || NotificationList.Any(Item => Item.State == eFormationDeliveryState.DeliveryUnknown)
            ? eFormationStatus.Blocked : eFormationStatus.InProgress;
    public DateTimeOffset CreatedAt { get; set; }
    public eFormationDeliveryState ActivationState { get; set; }
    public string ActivationDetail { get; set; } = "";
    public string FinalSummary { get; set; } = "";
    public List<FormationNotification> NotificationList { get; set; } = new();
    public int ContextVersion { get; set; }
    public int RequirementVersion { get; set; }
    public List<FormationRevision> RevisionList { get; set; } = new();
    public List<FormationMember> MemberList { get; set; } = new();
    public List<FormationTask> TaskList { get; set; } = new();
    public List<FormationHandoff> HandoffList { get; set; } = new();
    public List<FormationEvent> EventList { get; set; } = new();
}

public sealed class FormationTask
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Instructions { get; set; } = "";
    public string Acceptance { get; set; } = "";
    public string ExecutorId { get; set; } = "";
    public string ReviewerId { get; set; } = "";
    public eFormationTaskState State { get; set; }
    public RelayWorkspace Workspace { get; set; } = new();
    public string ProcessingDetail { get; set; } = "";
    public eFormationTaskState? ResumeState { get; set; }
    public List<FormationAttempt> AttemptList { get; set; } = new();
    public List<FormationSubmission> SubmissionList { get; set; } = new();
    public List<FormationReview> ReviewList { get; set; } = new();
}

public sealed class FormationAttempt
{
    public string Id { get; set; } = "";
    public string RequestId { get; set; } = "";
    public string OperationId { get; set; } = "";
    public string ControllerInstanceId { get; set; } = "";
    public string ControllerSessionId { get; set; } = "";
    public string MemberId { get; set; } = "";
    public string InstanceId { get; set; } = "";
    public string SessionId { get; set; } = "";
    public string RelayId { get; set; } = "";
    public eFormationDispatchMode DispatchMode { get; set; }
    public string NativeAgentId { get; set; } = "";
    public DateTimeOffset? NativeClaimedAt { get; set; }
    public DateTimeOffset? NativeStopRequestedAt { get; set; }
    public string NativeCloseEvidence { get; set; } = "";
    public string Model { get; set; } = "";
    public string Effort { get; set; } = "";
    public string SubmissionId { get; set; } = "";
    public string Detail { get; set; } = "";
    public eFormationAttemptKind Kind { get; set; }
    public eFormationAttemptState State { get; set; }
    public int ContextVersion { get; set; }
    public int RequirementVersion { get; set; }
}

public sealed class FormationHandoff
{
    public string Id { get; set; } = "";
    public string TriggerTaskId { get; set; } = "";
    public string FromMemberId { get; set; } = "";
    public string ToMemberId { get; set; } = "";
    public int RequirementVersion { get; set; }
    public List<string> TaskIdList { get; set; } = new();
    public List<string> AttemptIdList { get; set; } = new();
    public List<FormationStopEvidence> StopList { get; set; } = new();
    public bool Transferred { get; set; }
}

public sealed class FormationNotification
{
    public string Id { get; set; } = "";
    public eFormationDeliveryState State { get; set; }
    public string Detail { get; set; } = "";
}

public sealed record FormationStopEvidence(string AttemptId, string Source, string Details, DateTimeOffset At);
public sealed record FormationRevision(int ContextVersion, int RequirementVersion, string Context, string Requirement, DateTimeOffset At);
public sealed record FormationSubmission(string Id, string AttemptId, int ContextVersion, int RequirementVersion, string Summary, List<FormationArtifact> ArtifactList, DateTimeOffset At);
public sealed record FormationArtifact(string Path, string Sha256);
public sealed record FormationReview(string SubmissionId, string AttemptId, int RequirementVersion, bool Passed, string Feedback, string ActorId, DateTimeOffset At);
public sealed record FormationEvent(DateTimeOffset At, string ActorId, string Kind, string Details);
public sealed record FormationCaller(string InstanceId, string SessionId, string Credential, bool IsOperator)
{
    public static FormationCaller Operator() => new("", "", "", true);
    public static FormationCaller Agent(string InstanceId, string ThreadId, string Credential = "") => new(InstanceId, ThreadId, Credential, false);
}

internal sealed class FormationDatabase
{
    public int SchemaVersion { get; set; } = 1;
    public List<FormationRun> RunList { get; set; } = new();
    public List<FormationTemplate> TemplateList { get; set; } = new();
    public Dictionary<string, string> CredentialDict { get; set; } = new();
    public Dictionary<string, FormationReceipt> ReceiptDict { get; set; } = new();
}

internal sealed record FormationReceipt(string InputHash, JsonElement Result);
