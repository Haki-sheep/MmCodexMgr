namespace CodexInstanceManager;

public sealed partial class RelayCoordinator
{
    public async Task<RelayTask> ProgressAsync(string InstanceId, string ThreadId, string TaskId, string Stage, string Message)
    {
        await Gate.WaitAsync(Lifetime.Token);
        try
        {
            var Item = Store.Get(TaskId);
            RequireCaller(Item.Channel.WorkerInstance.Id, Item.Channel.WorkerThreadId, InstanceId, ThreadId);
            if (Item.State != eRelayState.Running) throw new InvalidOperationException("任务当前不接受进度 " + RelayLimits.StateText(Item.State));
            if (Stage is not ("started" or "progress" or "blocked")) throw new InvalidOperationException("进度阶段必须为 started progress 或 blocked");
            ValidateText(Message, "进度摘要", RelayLimits.MaxEventLength);
            if (Item.ProgressStage == Stage && Item.ProgressMessage == Message) return Item;
            Item.ProgressStage = Stage;
            Item.ProgressMessage = Message;
            Item.ProgressAt = DateTimeOffset.UtcNow;
            Change(Item, Item.State, "执行方进度 " + Stage + " " + Message);
            return Item;
        }
        finally { Gate.Release(); }
    }

    public async Task<RelayTask> ReconcileAsync(string InstanceId, string ThreadId, string TaskId, string WorkerThreadId, string WorkerTitle)
    {
        await Gate.WaitAsync(Lifetime.Token);
        try
        {
            var Item = Store.Get(TaskId);
            RequireCaller(Item.Channel.MainInstance.Id, Item.Channel.MainThreadId, InstanceId, ThreadId);
            if (Item.State != eRelayState.DispatchUncertain) throw new InvalidOperationException("仅派发待核对任务可确认已开始");
            ValidateText(WorkerThreadId, "执行会话 ID", 128);
            if (Item.Channel.WorkerThreadId.Length != 0 && Item.Channel.WorkerThreadId != WorkerThreadId) throw new InvalidOperationException("已有执行会话不能改派到其他会话");
            if (Store.Reservations().Any(Slot => Slot.Id != Item.Id && Slot.WorkerInstanceId == Item.Channel.WorkerInstance.Id && (Slot.WorkerThreadId.Length == 0 || Slot.WorkerThreadId == WorkerThreadId))) throw new InvalidOperationException("此执行会话已被其他任务占用");
            RequireAcyclic(Store.BlockingSlots(), InstanceId, ThreadId, Item.Channel.WorkerInstance.Id, WorkerThreadId);
            Item.Channel.WorkerThreadId = WorkerThreadId;
            Item.Channel.WorkerTitle = WorkerTitle;
            Item.DeadlineAt = Item.Channel.TimeoutMinutes == 0 ? null : DateTimeOffset.UtcNow.AddMinutes(Item.Channel.TimeoutMinutes);
            Change(Item, eRelayState.Running, "用户核对执行会话已开始 已恢复结果接收 未重复发送任务");
            ArmDeadline(Item);
            _ = WatchWorkerAsync(Item);
            return Item;
        }
        finally { Gate.Release(); }
    }
}
