namespace CodexInstanceManager;

public sealed partial class FormationConversationLifecycle
{
    private async Task<List<FormationConversation>> ReadCodexAsync(List<FormationConversation> TargetList, CancellationToken Cancellation)
    {
        var Profile = Instance(TargetList[0].InstanceId);
        var RecordDict = new Dictionary<string, (string Title, bool Archived)>();
        var ParentDict = new Dictionary<string, string>();
        using (var Database = ConversationDatabase.Open(Path.Combine(Profile.HomePath, "state_5.sqlite"), true))
        {
            using (var Command = Database.CreateCommand())
            {
                Command.CommandText = "SELECT id,COALESCE(NULLIF(name,''),title),archived,COALESCE(attached_thread_parent_id,'') FROM threads";
                using var Reader = Command.ExecuteReader();
                while (Reader.Read())
                {
                    string Id = Reader.GetString(0);
                    RecordDict.Add(Id, (Reader.GetString(1), Reader.GetInt64(2) != 0));
                    ParentDict.Add(Id, Reader.GetString(3));
                }
            }
            using (var Command = Database.CreateCommand())
            {
                Command.CommandText = "SELECT parent_thread_id,child_thread_id FROM thread_spawn_edges";
                using var Reader = Command.ExecuteReader();
                while (Reader.Read())
                {
                    string Parent = Reader.GetString(0);
                    string Id = Reader.GetString(1);
                    if (ParentDict.TryGetValue(Id, out string? Attached) && Attached.Length != 0 && Attached != Parent)
                        throw new InvalidDataException("会话同时存在不同的附属与子代理父级 请先在 Codex 中处理 " + Id);
                    ParentDict[Id] = Parent;
                }
            }
        }
        var ResultList = Expand(TargetList, ParentDict);
        bool Online = InstanceService.Find(Profile, InstanceService.ListRunning()) is not null;
        var ToolList = Online ? await DesktopRelayBridge.ProbeAsync(Profile, Cancellation) : new List<string>();
        foreach (var Target in ResultList)
        {
            Target.Exists = RecordDict.TryGetValue(Target.SessionId, out var Row);
            Target.AncestorIdList = Ancestors(Target.SessionId, ParentDict);
            Target.CanArchive = ToolList.Any(Item => Item.EndsWith("set_thread_archived", StringComparison.Ordinal));
            Target.CanDelete = ToolList.Any(Item => Item.EndsWith("delete_thread", StringComparison.Ordinal));
            Target.CanStop = Online;
            Target.Detail = Online ? "Codex 桌面未提供相应的原生会话操作" : "请先启动对应 Codex 实例后重试";
            if (!Target.Exists) continue;
            Target.Title = Row.Title.Length == 0 ? Target.SessionId : Row.Title;
            Target.Archived = Row.Archived;
            if (!Online) continue;
            var State = await DesktopRelayBridge.CallLifecycleAsync(Profile, Target.SessionId, "read_thread",
                new { threadId = Target.SessionId, hostId = "local", turnLimit = 1, includeOutputs = false, maxOutputCharsPerItem = 0 }, Cancellation);
            string Status = State.GetProperty("thread").GetProperty("status").GetProperty("type").GetString()!;
            Target.Busy = Status is not ("idle" or "notLoaded");
        }
        return ResultList;
    }
}
