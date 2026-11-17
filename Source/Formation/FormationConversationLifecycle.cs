using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class FormationConversationLifecycle(Func<ManagerSettings> LoadSettings) : IFormationConversationLifecycle
{
    #region Providers
    public async Task<List<FormationConversation>> ReadAsync(IReadOnlyList<FormationConversation> ConversationList, CancellationToken Cancellation)
    {
        var ResultList = new List<FormationConversation>();
        foreach (var Group in ConversationList.GroupBy(Item => Item.InstanceId))
        {
            var TargetList = Group.DistinctBy(Item => Item.SessionId).ToList();
            if (Group.Key == DshRelayRunner.InstanceId) ResultList.AddRange(await ReadDshAsync(TargetList, Cancellation));
            else if (Group.Key == AntigravityRelayRunner.InstanceId) ResultList.AddRange(await ReadAntigravityAsync(TargetList, Cancellation));
            else if (Group.Key is CursorRelayRunner.InstanceId or ClaudeRelayRunner.InstanceId)
                ResultList.AddRange(TargetList.Select(Item => new FormationConversation
                {
                    InstanceId = Item.InstanceId, SessionId = Item.SessionId, Title = Item.Title,
                    Detail = "当前 CLI 没有已验证的单会话原生归档或删除入口 请先在对应 Agent 处理"
                }));
            else ResultList.AddRange(await ReadCodexAsync(TargetList, Cancellation));
        }
        return ResultList.DistinctBy(Item => Item.Key).ToList();
    }

    public async Task StopAsync(FormationConversation Conversation, CancellationToken Cancellation)
    {
        if (!Conversation.CanStop) throw new NotSupportedException("无法停止会话 " + Conversation.Title);
        if (Conversation.InstanceId == DshRelayRunner.InstanceId)
        {
            using var Client = await DshDesktopClient.ConnectAsync(LoadSettings().Dsh, Cancellation);
            await Client.StopSessionAsync(Conversation.SessionId, Cancellation);
        }
        else if (Conversation.InstanceId == AntigravityRelayRunner.InstanceId)
        {
            using var Client = AntigravityDesktopClient.Connect();
            await Client.CancelAsync(Conversation.SessionId, Cancellation);
        }
        else await CodexConversationStop.InterruptAsync(Conversation.SessionId, Cancellation);
    }

    public async Task SetArchivedAsync(FormationConversation Conversation, bool Archived, CancellationToken Cancellation)
    {
        if (!Conversation.CanArchive) throw new NotSupportedException(Conversation.Detail);
        if (Conversation.InstanceId == DshRelayRunner.InstanceId)
        {
            using var Client = await DshDesktopClient.ConnectAsync(LoadSettings().Dsh, Cancellation);
            await Client.CallAsync(Archived ? "workspace/archiveSession" : "workspace/unarchiveSession", new { request = new { sessionId = Conversation.SessionId } }, Cancellation);
        }
        else if (Conversation.InstanceId == AntigravityRelayRunner.InstanceId)
        {
            using var Client = AntigravityDesktopClient.Connect();
            await Client.CallAsync("UpdateConversationAnnotations", new { cascadeIds = new[] { Conversation.SessionId }, annotations = new { archived = Archived }, mergeAnnotations = true }, Cancellation);
        }
        else await DesktopRelayBridge.CallLifecycleAsync(Instance(Conversation.InstanceId), Conversation.SessionId, "set_thread_archived",
            new { threadId = Conversation.SessionId, hostId = "local", source = "codex", archived = Archived }, Cancellation);
    }

    public async Task DeleteAsync(FormationConversation Conversation, CancellationToken Cancellation)
    {
        if (!Conversation.CanDelete) throw new NotSupportedException(Conversation.Detail);
        if (Conversation.InstanceId == AntigravityRelayRunner.InstanceId)
        {
            using var Client = AntigravityDesktopClient.Connect();
            await Client.CallAsync("DeleteCascadeTrajectory", new { cascadeId = Conversation.SessionId }, Cancellation);
        }
        else await DesktopRelayBridge.CallLifecycleAsync(Instance(Conversation.InstanceId), Conversation.SessionId, "delete_thread",
            new { threadId = Conversation.SessionId, hostId = "local", source = "codex" }, Cancellation);
    }

    private InstanceProfile Instance(string Id) => LoadSettings().InstanceList.SingleOrDefault(Item => Item.Id == Id)
        ?? throw new InvalidOperationException("编队关联的实例未登记 " + Id);
    #endregion

    #region Desktop state
    private async Task<List<FormationConversation>> ReadDshAsync(List<FormationConversation> TargetList, CancellationToken Cancellation)
    {
        using var Client = await DshDesktopClient.ConnectAsync(LoadSettings().Dsh, Cancellation);
        using var Workspace = JsonDocument.Parse(File.ReadAllBytes(Path.Combine(Client.Connection.HomePath, "storages", "workspace.json")));
        var ArchivedHashList = Workspace.RootElement.GetProperty("global").GetProperty("archivedSessionIds").EnumerateArray().Select(Item => Item.GetString()!).ToHashSet();
        var Rows = await Client.CallAsync("session/list", new { _request = new { } }, Cancellation);
        var RecordDict = Rows.GetProperty("items").EnumerateArray().ToDictionary(Item => Item.GetProperty("sessionId").GetString()!);
        var ParentDict = RecordDict.ToDictionary(Pair => Pair.Key, Pair => Text(Pair.Value, "parentSessionId"));
        var ExpandedList = Expand(TargetList, ParentDict);
        var ResultList = new List<FormationConversation>();
        foreach (var Target in ExpandedList)
        {
            Target.Exists = RecordDict.TryGetValue(Target.SessionId, out var Row);
            Target.AncestorIdList = Ancestors(Target.SessionId, ParentDict);
            Target.Archived = ArchivedHashList.Contains(Target.SessionId);
            Target.CanArchive = true;
            Target.CanDelete = false;
            Target.CanStop = true;
            Target.Detail = "DeepSeek Harness 当前版本不提供会话永久删除接口";
            if (Target.Exists)
            {
                var State = await Client.CallAsync("session/state", new { request = new { sessionId = Target.SessionId } }, Cancellation);
                Target.Busy = DshDesktopClient.HasActiveWork(State) || (await Client.QueuedInputIdsAsync(Target.SessionId, Cancellation)).Count != 0;
                if (Row.TryGetProperty("projections", out var Projection) && Projection.TryGetProperty("values", out var Values))
                    Target.Title = Text(Values, "title") is { Length: > 0 } Title ? Title : Target.Title;
            }
            ResultList.Add(Target);
        }
        return ResultList;
    }

    private static async Task<List<FormationConversation>> ReadAntigravityAsync(List<FormationConversation> TargetList, CancellationToken Cancellation)
    {
        using var Client = AntigravityDesktopClient.Connect();
        var Snapshot = await Client.CallAsync("JetboxSubscribeToSummaries", new { backend = "BACKEND_TYPE_LOCAL" }, Cancellation, Stream: true);
        var RecordDict = Snapshot.TryGetProperty("updates", out var Updates)
            ? Updates.EnumerateObject().Where(Item => Guid.TryParse(Item.Name, out _)).ToDictionary(Item => Item.Name, Item => Item.Value)
            : new Dictionary<string, JsonElement>();
        var ParentDict = RecordDict.ToDictionary(Pair => Pair.Key, Pair => Pair.Value.TryGetProperty("trajectoryMetadata", out var Metadata) ? Text(Metadata, "parentConversationId") : "");
        var ExpandedList = Expand(TargetList, ParentDict);
        foreach (var Target in ExpandedList)
        {
            Target.Exists = RecordDict.TryGetValue(Target.SessionId, out var Row);
            Target.AncestorIdList = Ancestors(Target.SessionId, ParentDict);
            Target.CanArchive = Target.CanDelete = true;
            if (!Target.Exists) continue;
            bool Local = !Flag(Row, "cloud") && Text(Row, "trajectoryType") == "CORTEX_TRAJECTORY_TYPE_CASCADE";
            Target.CanArchive = Target.CanDelete = Local;
            Target.CanStop = Local;
            Target.Detail = Local ? "" : "只支持本地 Antigravity 会话";
            if (Row.TryGetProperty("annotations", out var Annotations))
            {
                Target.Archived = Flag(Annotations, "archived");
                Target.Title = Text(Annotations, "title") is { Length: > 0 } Title ? Title : Target.Title;
            }
            Target.Busy = Text(Row, "status") != "CASCADE_RUN_STATUS_IDLE" || Flag(Row, "notFullyIdle") || Flag(Row, "hasRunningSubagents") ||
                Row.TryGetProperty("backgroundTaskCount", out var Count) && Count.GetInt32() > 0;
        }
        return ExpandedList;
    }

    private static List<FormationConversation> Expand(List<FormationConversation> TargetList, Dictionary<string, string> ParentDict)
    {
        var ResultDict = TargetList.ToDictionary(Item => Item.SessionId, Item => new FormationConversation { InstanceId = Item.InstanceId, SessionId = Item.SessionId, Title = Item.Title });
        foreach (string Id in ParentDict.Keys)
            if (Ancestors(Id, ParentDict).Any(ResultDict.ContainsKey))
                ResultDict.TryAdd(Id, new() { InstanceId = TargetList[0].InstanceId, SessionId = Id, Title = Id });
        return ResultDict.Values.ToList();
    }

    private static List<string> Ancestors(string Id, Dictionary<string, string> ParentDict)
    {
        var ResultList = new List<string>();
        while (ParentDict.TryGetValue(Id, out string? Parent) && Parent.Length != 0)
        {
            if (ResultList.Contains(Parent)) throw new InvalidDataException("会话父子关系存在环 " + Parent);
            ResultList.Add(Parent);
            Id = Parent;
        }
        return ResultList;
    }

    private static bool Flag(JsonElement Element, string Name) => Element.TryGetProperty(Name, out var Value) && Value.ValueKind == JsonValueKind.True;
    private static string Text(JsonElement Element, string Name) => Element.TryGetProperty(Name, out var Value) && Value.ValueKind == JsonValueKind.String ? Value.GetString()! : "";
    #endregion
}
