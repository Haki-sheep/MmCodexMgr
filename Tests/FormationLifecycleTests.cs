using System.Text.Json;
using CodexInstanceManager;

internal static class FormationLifecycleTests
{
    private static readonly JsonSerializerOptions Wire = new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };
    private static int Count;

    public static async Task PreviewLiveAsync()
    {
        var Store = new FormationStore(Path.Combine(ManagerPaths.Root, "formation"));
        var Service = new FormationService(Store, SettingsStore.Load);
        foreach (var Run in Store.List())
        {
            var Plan = await Preview(Service, Run.Id, "archive");
            Console.WriteLine(JsonSerializer.Serialize(new
            {
                Run.Theme, Plan.CanApply, Plan.BlockerList,
                Targets = Plan.TargetList.Select(Item => new { Item.Conversation.InstanceId, Item.Conversation.SessionId, Item.Conversation.Archived, Item.Conversation.Busy, Item.Conversation.Exists })
            }));
        }
    }

    public static async Task RunAsync()
    {
        string Root = Path.Combine(Path.GetTempPath(), "MmLifecycleTests-" + Guid.NewGuid().ToString("N"));
        try
        {
            var Store = new FormationStore(Root);
            var Native = new Fake();
            var Service = new FormationService(Store, new ManagerSettings(), Conversations: Native);
            var Run = Create(Store, "mixed");
            Native.Add("main", false);
            Native.Add("worker", false);
            Native.Add("old-child", true, "main");
            var Plan = await Preview(Service, Run.Id, "archive");
            Require(Plan.TargetList.Count == 3 && Plan.CanApply, "native descendants are in the concrete plan");
            Native.Items["old-child"].Busy = true;
            Require(!(await Preview(Service, Run.Id, "archive")).CanApply, "busy already archived children remain protected from parent cascade");
            Native.Items["old-child"].Busy = false;
            await Apply(Service, Plan, "archive-1");
            Require(Store.Get(Run.Id).Archived && Store.Get(Run.Id).Status == eFormationStatus.Archived, "archive status requires native confirmation");
            Require(Native.Calls.SequenceEqual(new[] { "archive:main", "archive:worker" }), "already archived descendant is skipped");
            var Again = await Preview(Service, Run.Id, "archive");
            await Apply(Service, Again, "archive-2");
            Require(Store.Get(Run.Id).ArchiveSnapshot.Count(Item => Item.ChangedByOperation) == 2, "repeated archive retains undo ownership");
            var Restore = await Preview(Service, Run.Id, "unarchive");
            await Apply(Service, Restore, "restore-1");
            Require(!Native.Items["main"].Archived && !Native.Items["worker"].Archived && Native.Items["old-child"].Archived,
                "native cascading restore preserves the previously archived descendant");
            Require(!Store.Get(Run.Id).Archived && Store.Get(Run.Id).State == eFormationState.Paused, "unarchive does not silently restart work");

            Native.FailBefore = "worker";
            Plan = await Preview(Service, Run.Id, "archive");
            await Reject(() => Apply(Service, Plan, "partial"), "native failure remains visible");
            Require(!Store.Get(Run.Id).Archived && Store.Get(Run.Id).LifecycleOperation!.Error.Length != 0, "partial failure is not archived");
            int MainCalls = Native.Calls.Count(Item => Item == "archive:main");
            Service = new FormationService(Store, new ManagerSettings(), Conversations: Native);
            Plan = await Preview(Service, Run.Id, "archive");
            Require(Plan.ResumeOperationId == "partial", "restart keeps operation identity");
            await Reject(() => Apply(Service, Plan, "wrong-id"), "retry cannot change operation identity");
            await Apply(Service, Plan, "partial");
            Require(Native.Calls.Count(Item => Item == "archive:main") == MainCalls && Native.Items["worker"].Archived, "retry skips native work already applied");

            Restore = await Preview(Service, Run.Id, "unarchive");
            await Apply(Service, Restore, "restore-2");
            Native.Items["worker"].Busy = true;
            Plan = await Preview(Service, Run.Id, "archive");
            Require(!Plan.CanApply && Plan.BlockerList.Any(Item => Item.Contains("仍在运行")), "busy chats stop preflight");
            Native.Items["worker"].Busy = false;
            Native.Items["worker"].CanDelete = false;
            Plan = await Preview(Service, Run.Id, "delete");
            Require(Plan.CanApply && Plan.TargetList.Single(Item => Item.Conversation.SessionId == "worker") is
                { DeleteConversation: false, DesiredArchived: true }, "delete uses native archive when permanent delete is unavailable");
            Native.Items["worker"].CanArchive = false;
            Require(!(await Preview(Service, Run.Id, "delete")).CanApply, "missing both native capabilities blocks removal");
            Native.Items["worker"].CanArchive = true;
            Native.Items["worker"].CanDelete = true;
            Plan = await Preview(Service, Run.Id, "delete");
            await Reject(() => Call(Service, "delete", new { run_id = Run.Id, operation_id = "no-confirm", plan_token = Plan.Token }), "permanent delete needs explicit confirmation");
            Native.Add("new-child", false, "worker");
            await Reject(() => Apply(Service, Plan, "stale"), "new child invalidates the preview token");
            var Other = Create(Store, "shared");
            Plan = await Preview(Service, Run.Id, "delete");
            Require(!Plan.CanApply && Plan.BlockerList.Any(Item => Item.Contains("其他编队")), "shared conversations are protected");
            var OtherRoot = Path.Combine(Root, "delete");
            var DeleteStore = new FormationStore(OtherRoot);
            var DeleteRun = Create(DeleteStore, "delete");
            var DeleteNative = new Fake();
            DeleteNative.Add("main", true);
            DeleteNative.Add("worker", true);
            DeleteNative.Add("side-chat", true, "main");
            var DeleteService = new FormationService(DeleteStore, new ManagerSettings(), Conversations: DeleteNative);
            Plan = await Preview(DeleteService, DeleteRun.Id, "delete");
            DeleteNative.FailBefore = "worker";
            await Reject(() => Apply(DeleteService, Plan, "delete-1"), "partial delete retains formation");
            Require(DeleteStore.List().Count == 1 && !DeleteNative.Items["side-chat"].Exists, "native child is removed before its parent and metadata survives partial failure");
            Plan = await Preview(DeleteService, DeleteRun.Id, "delete");
            await Apply(DeleteService, Plan, "delete-1");
            await Apply(DeleteService, Plan, "delete-1");
            Require(DeleteStore.List().Count == 0 && DeleteNative.Items.Values.All(Item => !Item.Exists), "delete removes conversations before metadata and replay is idempotent");

            var UnknownStore = new FormationStore(Path.Combine(Root, "unknown"));
            var UnknownRun = Create(UnknownStore, "unknown");
            var UnknownNative = new Fake { FailAfter = "main" };
            var UnknownService = new FormationService(UnknownStore, new ManagerSettings(), Conversations: UnknownNative);
            Plan = await Preview(UnknownService, UnknownRun.Id, "archive");
            await Reject(() => Apply(UnknownService, Plan, "unknown-1"), "lost reply is not reported as success");
            Plan = await Preview(UnknownService, UnknownRun.Id, "archive");
            await Apply(UnknownService, Plan, "unknown-1");
            Restore = await Preview(UnknownService, UnknownRun.Id, "unarchive");
            await Apply(UnknownService, Restore, "restore-unknown");
            Require(!UnknownNative.Items["main"].Archived && UnknownNative.Calls.Count(Item => Item == "archive:main") == 1, "uncertain applied call is reconciled without duplicate call and undo ownership survives");

            var MixedStore = new FormationStore(Path.Combine(Root, "stop-and-delete"));
            var MixedRun = Create(MixedStore, "stop-and-delete");
            var MixedNative = new Fake();
            MixedNative.Add("main", false);
            MixedNative.Add("worker", false);
            MixedNative.Items["worker"].CanDelete = false;
            MixedNative.Items["worker"].Busy = true;
            MixedNative.Items["main"].Busy = true;
            var MixedService = new FormationService(MixedStore, new ManagerSettings(), Conversations: MixedNative);
            Plan = await Preview(MixedService, MixedRun.Id, "delete");
            Require(Plan.CanApply && MixedNative.Calls.Count == 0, "active sessions allow a read-only delete preview");
            MixedNative.FailStop = "worker";
            await Reject(() => Apply(MixedService, Plan, "mixed-delete"), "stop failure keeps the formation and prevents destructive calls");
            Require(MixedStore.List().Count == 1 && MixedNative.Calls.SequenceEqual(new[] { "stop:main" }), "all active sessions must stop before any delete or archive");
            Plan = await Preview(MixedService, MixedRun.Id, "delete");
            var MixedResult = JsonSerializer.SerializeToElement(await Apply(MixedService, Plan, "mixed-delete"));
            Require(MixedStore.List().Count == 0 && !MixedNative.Items["main"].Exists && MixedNative.Items["worker"] is
                { Exists: true, Archived: true, Busy: false }, "delete removes the formation after verified native delete and archive");
            Require(MixedNative.Calls.SequenceEqual(new[] { "stop:main", "stop:worker", "delete:main", "archive:worker" }) &&
                MixedResult.GetProperty("archived_conversation_count").GetInt32() == 1, "retry stops only the remaining session and reports the archive");
            Console.WriteLine("PASS formation lifecycle " + Count + " assertions");
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("生命周期测试清理越界");
            if (Directory.Exists(Root)) Directory.Delete(Root, true);
        }
    }

    private static FormationRun Create(FormationStore Store, string Theme) => Store.Create(new()
    {
        SetupOnly = true, Theme = Theme,
        MemberList = new()
        {
            new() { Id = "main", InstanceId = "test", SessionId = "main", Role = eFormationRole.Coordinator },
            new() { Id = "worker", InstanceId = "test", SessionId = "worker", Role = eFormationRole.Executor }
        }
    });

    private static Task<object> Call(FormationService Service, string Action, object Args) => Service.ExecuteAsync(Action, JsonSerializer.SerializeToElement(Args, Wire), FormationCaller.Operator(), default);
    private static async Task<FormationLifecyclePlan> Preview(FormationService Service, string RunId, string Action) => (FormationLifecyclePlan)await Call(Service, "lifecycle-preview", new { run_id = RunId, action = Action });
    private static Task<object> Apply(FormationService Service, FormationLifecyclePlan Plan, string Id) => Call(Service, Plan.Action,
        new { run_id = Plan.RunId, operation_id = Id, plan_token = Plan.Token, confirm_delete = Plan.Action == "delete" });
    private static void Require(bool Condition, string Label) { if (!Condition) throw new InvalidOperationException(Label); Count++; }
    private static async Task Reject(Func<Task<object>> Action, string Label)
    {
        try { await Action(); }
        catch (Exception Error) when (Error is InvalidOperationException or IOException) { Count++; return; }
        throw new InvalidOperationException("Expected rejection " + Label);
    }

    internal sealed class Fake : IFormationConversationLifecycle
    {
        public Dictionary<string, FormationConversation> Items { get; } = new();
        public List<string> Calls { get; } = new();
        public string FailBefore { get; set; } = "";
        public string FailAfter { get; set; } = "";
        public string FailStop { get; set; } = "";
        public void Add(string Id, bool Archived, string Parent = "") => Items[Id] = new()
        {
            InstanceId = "test", SessionId = Id, Title = Id, Archived = Archived, CanArchive = true, CanDelete = true, CanStop = true,
            AncestorIdList = Parent.Length == 0 ? new() : new() { Parent }, Detail = "unsupported fixture"
        };
        public Task<List<FormationConversation>> ReadAsync(IReadOnlyList<FormationConversation> Targets, CancellationToken Cancellation)
        {
            foreach (var Target in Targets)
                if (!Items.ContainsKey(Target.SessionId))
                {
                    Add(Target.SessionId, false);
                    Items[Target.SessionId].InstanceId = Target.InstanceId;
                }
            var IdHashList = Targets.Select(Item => Item.SessionId).ToHashSet();
            return Task.FromResult(Items.Values.Where(Item => IdHashList.Contains(Item.SessionId) || Item.AncestorIdList.Any(IdHashList.Contains))
                .Select(Item => JsonSerializer.Deserialize<FormationConversation>(JsonSerializer.Serialize(Item))!).ToList());
        }
        public Task StopAsync(FormationConversation Chat, CancellationToken Cancellation)
        {
            if (FailStop == Chat.SessionId)
            {
                FailStop = "";
                throw new IOException("fixture stop failed " + Chat.SessionId);
            }
            Calls.Add("stop:" + Chat.SessionId);
            Items[Chat.SessionId].Busy = false;
            return Task.CompletedTask;
        }
        public Task SetArchivedAsync(FormationConversation Chat, bool Archived, CancellationToken Cancellation)
        {
            Fail(Chat.SessionId, false);
            Calls.Add((Archived ? "archive:" : "unarchive:") + Chat.SessionId);
            foreach (var Item in Items.Values.Where(Item => Item.SessionId == Chat.SessionId || Item.AncestorIdList.Contains(Chat.SessionId))) Item.Archived = Archived;
            Fail(Chat.SessionId, true);
            return Task.CompletedTask;
        }
        public Task DeleteAsync(FormationConversation Chat, CancellationToken Cancellation)
        {
            Fail(Chat.SessionId, false);
            Calls.Add("delete:" + Chat.SessionId);
            foreach (var Item in Items.Values.Where(Item => Item.SessionId == Chat.SessionId || Item.AncestorIdList.Contains(Chat.SessionId))) Item.Exists = false;
            return Task.CompletedTask;
        }
        private void Fail(string Id, bool After)
        {
            if (Id != (After ? FailAfter : FailBefore)) return;
            if (After) FailAfter = ""; else FailBefore = "";
            throw new IOException("native fixture failure " + Id);
        }
    }
}
