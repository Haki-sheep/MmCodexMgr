namespace CodexInstanceManager;

public sealed partial class RelayCoordinator
{
    public async Task OpenSessionAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation)
    {
        if (Bridge is not IRelayRecoveryBridge Recovery) throw new InvalidOperationException("当前桌面桥接不支持会话恢复");
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Cancellation, Lifetime.Token);
        Timeout.CancelAfter(TimeSpan.FromSeconds(RelayLimits.RequestTimeoutSeconds));
        await Recovery.OpenAsync(Instance, ThreadId, Timeout.Token);
    }

    public async Task<RelayTask> ResumeAsync(string InstanceId, string ThreadId, string TaskId)
    {
        await Gate.WaitAsync(Lifetime.Token);
        try
        {
            var Item = Store.Get(TaskId);
            RequireCaller(Item.Channel.MainInstance.Id, Item.Channel.MainThreadId, InstanceId, ThreadId);
            if (Item.State == eRelayState.Running) return Item;
            if (Item.State != eRelayState.Interrupted) throw new InvalidOperationException("仅实例退出后已阻塞的任务可以续跑 投递不明时必须先核对");
            var SlotList = Store.BlockingSlots();
            bool CrossInstance = Item.Channel.MainInstance.Id != Item.Channel.WorkerInstance.Id;
            int Limit = CrossInstance ? Item.CrossAgentMax : Item.SessionMax;
            if (SlotList.Count(Slot => Slot.MainInstanceId == InstanceId && Slot.MainThreadId == ThreadId && (Slot.MainInstanceId != Slot.WorkerInstanceId) == CrossInstance) >= Limit) throw new InvalidOperationException("恢复任务将超过原协作数量上限");
            if (SlotList.Any(Slot => Slot.WorkerInstanceId == Item.Channel.WorkerInstance.Id && (Slot.WorkerThreadId.Length == 0 || Slot.WorkerThreadId == Item.Channel.WorkerThreadId))) throw new InvalidOperationException("原执行会话已被其他任务占用");
            RequireAcyclic(SlotList, InstanceId, ThreadId, Item.Channel.WorkerInstance.Id, Item.Channel.WorkerThreadId);
            var Parent = RequireRecoverableParent(Item);
            new RelayPolicy(Store).Apply(Item, Parent, Item.TreeBudget, Item.Workspace, true);
            StopDeadline(Item.Id);
            Item.DeadlineAt = Item.Channel.TimeoutMinutes == 0 ? null : DateTimeOffset.UtcNow.AddMinutes(Item.Channel.TimeoutMinutes);
            await ResumeCoreAsync(Item, false);
            return Store.Get(TaskId);
        }
        finally { Gate.Release(); }
    }

    private RelayTask? RequireRecoverableParent(RelayTask Item)
    {
        if (Item.ParentTaskId.Length == 0) return null;
        var Parent = Store.Get(Item.ParentTaskId);
        if (Parent.State is not (eRelayState.Running or eRelayState.Recovering)) throw new InvalidOperationException("请先恢复上级任务 已结束的上级不能恢复下级");
        return Parent;
    }

    private async Task ResumeCoreAsync(RelayTask Item, bool Automatic)
    {
        if (Bridge is not IRelayRecoveryBridge Recovery) throw new InvalidOperationException("当前桌面桥接不支持会话恢复");
        ValidateText(Item.Channel.WorkerThreadId, "原执行会话 ID", 128);
        if (Item.Outcome.Length != 0) throw new InvalidOperationException("任务已有执行结果 禁止重新执行");
        RequireRecoverableParent(Item);
        Item.RecoveryCount++;
        Change(Item, eRelayState.Recovering, Automatic ? "执行实例退出 自动启动实例并打开原执行会话 每个任务自动尝试一次" : "收到续跑请求 正在恢复原执行会话");
        using var Timeout = CancellationTokenSource.CreateLinkedTokenSource(Lifetime.Token);
        Timeout.CancelAfter(TimeSpan.FromSeconds(RelayLimits.RequestTimeoutSeconds));
        try
        {
            bool Idle = await Recovery.PrepareResumeAsync(Item.Channel.WorkerInstance, Item.Channel.WorkerThreadId, Timeout.Token);
            if (Idle)
            {
                var ChildList = Store.UnfinishedChildIds(Item.Id);
                string Prompt = $"[MmCodexMgr 原任务恢复]\n任务 ID 和执行会话保持不变 本消息继续用户已授权的原任务\n先核对会话历史 已生成产物和仍在运行的脚本 从尚未完成的位置继续 不要重复已完成操作\n未结束下级任务 ID {string.Join(" ", ChildList)}\n已有下级仍由原任务追踪 不得重新创建或重复派发 对应写入范围仍由下级独占 先验收下级再整合\n\n{BuildWorkerPrompt(Item)}";
                Change(Item, eRelayState.DispatchUncertain, "正在向原执行会话投递续跑消息 若管理器中途退出必须核对送达情况");
                await Bridge.SendAsync(Item.Channel.WorkerInstance, Item.Channel.WorkerThreadId, Prompt, "", Timeout.Token);
                Item.ProgressStage = "";
                Item.ProgressMessage = "已投递续跑消息 等待执行方确认开始";
                Item.ProgressAt = null;
            }
            Change(Item, eRelayState.Running, Idle ? "续跑消息已送达原执行会话 已恢复结果接收" : "原执行会话仍在运行 已恢复结果接收 未重复投递");
            ArmDeadline(Item);
            _ = WatchWorkerAsync(Item);
        }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested) { throw; }
        catch (Exception Error)
        {
            Change(Item, Item.State == eRelayState.DispatchUncertain ? eRelayState.DispatchUncertain : eRelayState.Interrupted, "恢复失败 " + Error.Message);
            throw;
        }
    }

    private async Task NotifyRecoveryFailureAsync(RelayTask Item, string Reason)
    {
        try
        {
            await Bridge.SendAsync(Item.Channel.MainInstance, Item.Channel.MainThreadId, $"[MmCodexMgr 联调恢复受阻]\n任务 ID {Item.Id}\n任务 {Item.Title}\n{Reason}\n状态 {RelayLimits.StateText(Item.State)}\n原任务与下级记录均保留 尚未确认完成 不要重新创建或重复派发\n实例退出后可使用 agent_resume 或 CLI resume --task-id {Item.Id} 恢复原会话 投递不明时先核对目标会话再使用 reconcile", "", Lifetime.Token);
            Change(Item, Item.State, "异常通知已提交到原主会话");
        }
        catch (Exception Error)
        {
            Program.LogError(Error);
            Change(Item, Item.State, "恢复异常通知未确认 " + Error.Message);
        }
    }
}
