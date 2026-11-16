using System.Text.Json;

namespace CodexInstanceManager;

public sealed partial class FormationService
{
    #region Lifecycle plans
    private async Task<FormationLifecyclePlan> LifecyclePlanAsync(string RunId, string Action, CancellationToken Cancellation)
    {
        if (Action is not ("archive" or "unarchive" or "delete")) throw new InvalidOperationException("未知会话操作 " + Action);
        var Run = Store.Get(RunId);
        var Plan = new FormationLifecyclePlan { RunId = RunId, Action = Action };
        if (Run.LifecycleOperation is { Completed: false } Pending && Pending.Action != Action)
            Plan.BlockerList.Add("先重试未完成的操作 " + Pending.Action);
        if (Run.TaskList.SelectMany(Item => Item.AttemptList).Any(IsReserved) || ActivationDict.ContainsKey(RunId) ||
            Run.ActivationState == eFormationDeliveryState.Dispatching || Run.NotificationList.Any(Item => Item.State == eFormationDeliveryState.Dispatching))
            Plan.BlockerList.Add("编队仍有执行中或停止状态未确认的操作 请先核实并停止");
        if (Action == "unarchive" && !Run.Archived && Run.LifecycleOperation?.Action != "unarchive")
            Plan.BlockerList.Add("编队尚未归档");
        var ReferenceList = ConversationReferences(Run);
        if (Run.LifecycleOperation is { Completed: false } Existing)
            ReferenceList.AddRange(Existing.TargetList.Select(Item => Item.Conversation));
        if (Action == "unarchive") ReferenceList.AddRange(Run.ArchiveSnapshot.Select(Item => Item.Conversation));
        var CurrentList = await Conversations.ReadAsync(ReferenceList.DistinctBy(Item => Item.Key).ToList(), Cancellation);
        var Previous = Run.LifecycleOperation is { Completed: false } Operation && Operation.Action == Action ? Operation : null;
        if (Previous is not null) Plan.ResumeOperationId = Previous.Id;
        var OtherReferenceList = Store.List().Where(Item => Item.Id != RunId).SelectMany(ConversationReferences).ToList();
        foreach (var Conversation in CurrentList.OrderBy(Item => Action == "delete" ? -Item.AncestorIdList.Count : Item.AncestorIdList.Count).ThenBy(Item => Item.Key, StringComparer.Ordinal))
        {
            var Old = Previous?.TargetList.SingleOrDefault(Item => Item.Conversation.Key == Conversation.Key);
            var Archived = Run.ArchiveSnapshot.SingleOrDefault(Item => Item.Conversation.Key == Conversation.Key);
            bool Desired = Action == "archive" || Action == "unarchive" && !(Archived?.ChangedByOperation ?? false) && Conversation.Archived;
            var Target = Old is null ? new FormationLifecycleTarget
            {
                Conversation = Conversation, WasArchived = Conversation.Archived, DesiredArchived = Desired
            } : InputCopy(Old);
            Target.Conversation = Conversation;
            Plan.TargetList.Add(Target);
            bool NeedsChange = Conversation.Exists && (Action == "delete" || Conversation.Archived != Target.DesiredArchived);
            if (!NeedsChange) continue;
            if (Conversation.Busy) Plan.BlockerList.Add(Conversation.Title + " 仍在运行或等待输入");
            if (Action == "delete" ? !Conversation.CanDelete : !Conversation.CanArchive)
                Plan.BlockerList.Add(Conversation.Title + " " + Conversation.Detail);
            if (OtherReferenceList.Any(Item => Item.InstanceId == Conversation.InstanceId &&
                (Item.SessionId == Conversation.SessionId || Conversation.AncestorIdList.Contains(Item.SessionId))))
                Plan.BlockerList.Add(Conversation.Title + " 仍被其他编队关联 请先解除重复关联");
        }
        foreach (var Target in Plan.TargetList.Where(Item => Item.Conversation.Exists && Item.Conversation.InstanceId is not (DshRelayRunner.InstanceId or AntigravityRelayRunner.InstanceId)))
        {
            var Chat = Target.Conversation;
            bool ParentChanges = Plan.TargetList.Any(Parent => Parent.Conversation.InstanceId == Chat.InstanceId &&
                Chat.AncestorIdList.Contains(Parent.Conversation.SessionId) && Parent.Conversation.Exists &&
                (Action == "delete" || Parent.Conversation.Archived != Parent.DesiredArchived));
            if (!ParentChanges) continue;
            if (Chat.Busy) Plan.BlockerList.Add(Chat.Title + " 的父级操作会影响仍在活动的子会话");
            if (Action == "unarchive" && OtherReferenceList.Any(Item => Item.InstanceId == Chat.InstanceId && Item.SessionId == Chat.SessionId))
                Plan.BlockerList.Add(Chat.Title + " 的原生级联恢复会影响其他编队");
        }
        bool SameTargets = Previous is not null && Previous.TargetList.Select(Item => Item.Conversation.Key).Order()
            .SequenceEqual(Plan.TargetList.Select(Item => Item.Conversation.Key).Order());
        Plan.Token = SameTargets ? Previous!.PlanToken : FormationStore.Digest(JsonSerializer.Serialize(new
        {
            RunId, Action, Run.State, Run.Archived, PreviousToken = Previous?.PlanToken,
            Targets = Plan.TargetList.Select(Item => new { Item.Conversation.Key, Item.Conversation.Exists, Item.WasArchived, Item.DesiredArchived })
        }));
        return Plan;
    }

    private static T InputCopy<T>(T Value) => JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(Value))!;

    private static List<FormationConversation> ConversationReferences(FormationRun Run) => Run.MemberList
        .Where(Item => Item.DispatchMode != eFormationDispatchMode.Native && Item.SessionId.Length != 0)
        .Select(Item => new FormationConversation { InstanceId = Item.InstanceId, SessionId = Item.SessionId, Title = Item.DisplayName })
        .Concat(Run.TaskList.SelectMany(Item => Item.AttemptList).Where(Item => Item.DispatchMode != eFormationDispatchMode.Native && Item.SessionId.Length != 0)
            .Select(Item => new FormationConversation { InstanceId = Item.InstanceId, SessionId = Item.SessionId, Title = Item.SessionId }))
        .DistinctBy(Item => Item.Key).ToList();

    private static void RequireLifecycleEditable(FormationRun Run)
    {
        if (Run.Archived || Run.LifecycleOperation is { Completed: false })
            throw new InvalidOperationException("编队已归档或会话操作尚未完成 请先取消归档或重试原操作");
    }

    private static void RequireUnsharedLifecycleTargets(FormationDatabase Database)
    {
        foreach (var Run in Database.RunList.Where(Item => Item.LifecycleOperation is { Completed: false }))
        {
            var OtherReferenceList = Database.RunList.Where(Item => Item.Id != Run.Id).SelectMany(ConversationReferences);
            if (OtherReferenceList.Any(Reference => Run.LifecycleOperation!.TargetList.Any(Target =>
                (Run.LifecycleOperation.Action != "archive" || !Target.WasArchived) && Target.Conversation.InstanceId == Reference.InstanceId &&
                (Target.Conversation.SessionId == Reference.SessionId || Target.Conversation.AncestorIdList.Contains(Reference.SessionId)))))
                throw new InvalidOperationException("会话正在执行编队归档或删除 不可重新关联到其他编队");
        }
    }
    #endregion

    #region Lifecycle execution
    private async Task<object> LifecycleAsync(string Action, JsonElement Arguments, CancellationToken Cancellation)
    {
        string RunId = Text(Arguments, "run_id");
        string OperationId = Text(Arguments, "operation_id");
        string Token = Text(Arguments, "plan_token");
        if (Action == "delete" && (!Arguments.TryGetProperty("confirm_delete", out var Confirmed) || !Confirmed.GetBoolean()))
            throw new InvalidOperationException("彻底删除需要确认编队及预览中的全部关联会话 confirm_delete=true");
        await RuntimeGate.WaitAsync(Cancellation);
        try
        {
            string ReceiptKey = JsonSerializer.Serialize(new[] { "operator", RunId, Action, OperationId });
            string InputHash = FormationStore.Digest(Arguments.GetRawText());
            var Receipt = Store.Read(Database => Database.ReceiptDict.GetValueOrDefault(ReceiptKey));
            if (Receipt is not null)
            {
                if (Receipt.InputHash != InputHash) throw new InvalidOperationException("同一操作标识的参数发生变化");
                return Receipt.Result;
            }
            var Initial = Store.Get(RunId);
            if (Action == "archive" && Initial.Archived && Initial.LifecycleOperation is not { Completed: false })
                return Store.Update<object>(Database =>
                {
                    var Current = FormationStore.RequireRun(Database, RunId);
                    Database.ReceiptDict.Add(ReceiptKey, new(InputHash, Output(Current)));
                    return Current;
                });
            var Plan = await LifecyclePlanAsync(RunId, Action, Cancellation);
            if (!Plan.CanApply) throw new InvalidOperationException(string.Join("\n", Plan.BlockerList.Distinct()));
            if (Plan.Token != Token) throw new InvalidOperationException("会话状态或关联范围已变化 请重新预览后确认");
            if (Plan.ResumeOperationId.Length != 0 && Plan.ResumeOperationId != OperationId)
                throw new InvalidOperationException("重试须沿用 operation_id " + Plan.ResumeOperationId);
            Store.Update(Database =>
            {
                var Run = FormationStore.RequireRun(Database, RunId);
                if (Run.TaskList.SelectMany(Item => Item.AttemptList).Any(IsReserved) || ActivationDict.ContainsKey(RunId))
                    throw new InvalidOperationException("预览后编队开始了新操作 请先停止并重新预览");
                if (Run.LifecycleOperation is not { Completed: false })
                {
                    Run.LifecycleOperation = new() { Id = OperationId, Action = Action, PlanToken = Token, TargetList = Plan.TargetList };
                    if (Run.State == eFormationState.Active) Run.State = eFormationState.Paused;
                    FormationStore.AddEvent(Run, "operator", Action + "_started", OperationId);
                }
                else
                {
                    Run.LifecycleOperation.PlanToken = Plan.Token;
                    Run.LifecycleOperation.TargetList = Plan.TargetList;
                    Run.LifecycleOperation.Error = "";
                }
                return true;
            });
            try
            {
                foreach (var Target in Store.Get(RunId).LifecycleOperation!.TargetList)
                {
                    Cancellation.ThrowIfCancellationRequested();
                    var CurrentList = await Conversations.ReadAsync(Plan.TargetList.Select(Item => Item.Conversation).ToList(), Cancellation);
                    RequireKnownTargets(Plan, CurrentList);
                    var Current = CurrentList.Single(Item => Item.Key == Target.Conversation.Key);
                    bool NeedsChange = Current.Exists && (Action == "delete" || Current.Archived != Target.DesiredArchived);
                    if (NeedsChange)
                    {
                        bool Cascades = Current.InstanceId is not (DshRelayRunner.InstanceId or AntigravityRelayRunner.InstanceId);
                        if (CurrentList.Any(Item => Item.Exists && Item.Busy && Item.InstanceId == Current.InstanceId &&
                            (Item.SessionId == Current.SessionId || Cascades && Item.AncestorIdList.Contains(Current.SessionId))))
                            throw new InvalidOperationException("会话或关联子会话在预览后开始活动 " + Current.Title);
                        Store.Read(Database => { RequireUnsharedLifecycleTargets(Database); return true; });
                        MarkLifecycleIntent(RunId, Current, Action);
                        if (Action == "delete") await Conversations.DeleteAsync(Current, Cancellation);
                        else await Conversations.SetArchivedAsync(Current, Target.DesiredArchived, Cancellation);
                        CurrentList = await Conversations.ReadAsync(Plan.TargetList.Select(Item => Item.Conversation).ToList(), Cancellation);
                        RequireKnownTargets(Plan, CurrentList);
                        Current = CurrentList.Single(Item => Item.Key == Target.Conversation.Key);
                        if (Action == "delete" ? Current.Exists : Current.Exists && Current.Archived != Target.DesiredArchived)
                            throw new IOException("原生操作尚未生效 " + Current.Title + " 请核对 Agent 中的确认提示后重试");
                    }
                    Store.Update(Database =>
                    {
                        var Saved = FormationStore.RequireRun(Database, RunId).LifecycleOperation!.TargetList.Single(Item => Item.Conversation.Key == Target.Conversation.Key);
                        Saved.Completed = true;
                        Saved.Result = !Current.Exists ? "会话已不存在" : !NeedsChange ? "状态已符合 跳过" : "原生操作已核实";
                        return true;
                    });
                }
                var FinalList = await Conversations.ReadAsync(Plan.TargetList.Select(Item => Item.Conversation).ToList(), Cancellation);
                RequireKnownTargets(Plan, FinalList);
                foreach (var Target in Plan.TargetList)
                {
                    var Current = FinalList.Single(Item => Item.Key == Target.Conversation.Key);
                    if (Action == "delete" ? Current.Exists : Current.Exists && Current.Archived != Target.DesiredArchived)
                        throw new IOException("会话最终状态不一致 " + Current.Title + " 保留操作记录等待重试");
                }
                return Store.Update<object>(Database =>
                {
                    var Run = FormationStore.RequireRun(Database, RunId);
                    Run.LifecycleOperation!.Completed = true;
                    Run.LifecycleOperation.Error = "";
                    if (Action == "archive")
                    {
                        Run.Archived = true;
                        Run.ArchiveSnapshot = InputCopy(Run.LifecycleOperation.TargetList);
                    }
                    else if (Action == "unarchive") { Run.Archived = false; Run.ArchiveSnapshot.Clear(); }
                    FormationStore.AddEvent(Run, "operator", Action + "_completed", OperationId);
                    object Result = Run;
                    if (Action == "delete")
                    {
                        Database.RunList.Remove(Run);
                        foreach (string Key in Database.CredentialDict.Keys.Where(Key => Key.StartsWith(RunId + "/", StringComparison.Ordinal)).ToList()) Database.CredentialDict.Remove(Key);
                        Result = new { run_id = RunId, deleted = true, conversations_deleted = true, conversation_count = Plan.TargetList.Count };
                        foreach (var Pair in Database.ReceiptDict.ToList())
                        {
                            var KeyPartList = JsonSerializer.Deserialize<string[]>(Pair.Key)!;
                            bool Created = KeyPartList[2] == "create" && Pair.Value.Result.TryGetProperty("id", out var Id) && Id.GetString() == RunId;
                            if (KeyPartList[1] == RunId || Created) Database.ReceiptDict[Pair.Key] = Pair.Value with { Result = Output(Result) };
                        }
                    }
                    Database.ReceiptDict.Add(ReceiptKey, new(InputHash, Output(Result)));
                    return Result;
                });
            }
            catch (Exception Error)
            {
                Store.Update(Database =>
                {
                    var Run = FormationStore.RequireRun(Database, RunId);
                    Run.LifecycleOperation!.Error = Error.Message;
                    FormationStore.AddEvent(Run, "operator", Action + "_failed", Error.Message);
                    return true;
                });
                throw;
            }
        }
        finally { RuntimeGate.Release(); Changed?.Invoke(); }
    }

    private static void RequireKnownTargets(FormationLifecyclePlan Plan, List<FormationConversation> CurrentList)
    {
        if (!CurrentList.Select(Item => Item.Key).Order().SequenceEqual(Plan.TargetList.Select(Item => Item.Conversation.Key).Order()))
            throw new InvalidOperationException("关联子会话范围发生变化 请核对新增会话后重新预览");
    }

    private void MarkLifecycleIntent(string RunId, FormationConversation Current, string Action)
    {
        if (Action != "archive") return;
        Store.Update(Database =>
        {
            var Operation = FormationStore.RequireRun(Database, RunId).LifecycleOperation!;
            bool Cascades = Current.InstanceId is not (DshRelayRunner.InstanceId or AntigravityRelayRunner.InstanceId);
            foreach (var Target in Operation.TargetList.Where(Item => !Item.WasArchived && Item.Conversation.InstanceId == Current.InstanceId &&
                (Item.Conversation.SessionId == Current.SessionId || Cascades && Item.Conversation.AncestorIdList.Contains(Current.SessionId))))
                Target.ChangedByOperation = true;
            return true;
        });
    }
    #endregion
}
