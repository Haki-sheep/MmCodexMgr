using System.Text.Json.Serialization;

namespace CodexInstanceManager;

public sealed class FormationConversation
{
    public string InstanceId { get; set; } = "";
    public string SessionId { get; set; } = "";
    public string Title { get; set; } = "";
    public List<string> AncestorIdList { get; set; } = new();
    public bool Exists { get; set; } = true;
    public bool Archived { get; set; }
    public bool Busy { get; set; }
    public bool CanArchive { get; set; }
    public bool CanDelete { get; set; }
    public string Detail { get; set; } = "";
    [JsonIgnore]
    public string Key => InstanceId + "/" + SessionId;
}

public sealed class FormationLifecycleTarget
{
    public FormationConversation Conversation { get; set; } = new();
    public bool WasArchived { get; set; }
    public bool DesiredArchived { get; set; }
    public bool ChangedByOperation { get; set; }
    public bool Completed { get; set; }
    public string Result { get; set; } = "";
}

public sealed class FormationLifecycleOperation
{
    public string Id { get; set; } = "";
    public string Action { get; set; } = "";
    public string PlanToken { get; set; } = "";
    public bool Completed { get; set; }
    public string Error { get; set; } = "";
    public List<FormationLifecycleTarget> TargetList { get; set; } = new();
}

public sealed class FormationLifecyclePlan
{
    public string RunId { get; set; } = "";
    public string Action { get; set; } = "";
    public string Token { get; set; } = "";
    public string ResumeOperationId { get; set; } = "";
    public List<FormationLifecycleTarget> TargetList { get; set; } = new();
    public List<string> BlockerList { get; set; } = new();
    public bool CanApply => BlockerList.Count == 0;
}

public interface IFormationConversationLifecycle
{
    Task<List<FormationConversation>> ReadAsync(IReadOnlyList<FormationConversation> ConversationList, CancellationToken Cancellation);
    Task SetArchivedAsync(FormationConversation Conversation, bool Archived, CancellationToken Cancellation);
    Task DeleteAsync(FormationConversation Conversation, CancellationToken Cancellation);
}
