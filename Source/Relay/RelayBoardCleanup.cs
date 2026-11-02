namespace CodexInstanceManager;

public sealed record RelayBoardCleanupResult(int CheckedCount, int InvalidCount, int BlockedCount, int FinishedCount, int UncheckedCount);

public sealed partial class RelayCoordinator
{
    /// <summary>
    /// 检查并复核无效任务 再清空阻塞与结束记录 返回各阶段清理数量
    /// </summary>
    public async Task<RelayBoardCleanupResult> CleanupBoardAsync(Func<RelayTask, Task<RelayValidity>> Check, Func<RelayTask, Task<RelayValidity>> Recheck)
    {
        var Scan = await CheckInvalidAsync(Check);
        int Invalid = await ClearInvalidAsync(Scan.InvalidList.Select(Item => Item.Id).ToList(), Recheck);
        int Blocked = await ClearBlockedHistoryAsync();
        int Finished = await ClearHistoryAsync();
        return new(Scan.CheckedCount, Invalid, Blocked, Finished, Scan.UncheckedList.Count);
    }
}
