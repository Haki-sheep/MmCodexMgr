using System.Text.Json;

namespace CodexInstanceManager;

public sealed class RelayPolicy
{
    private readonly RelayStore Store;
    public RelayPolicy(RelayStore Store) => this.Store = Store;

    public void Apply(RelayTask Item, RelayTask? Incoming, RelayTreeBudget? RequestedBudget, RelayWorkspace? Workspace)
    {
        var ReservationList = Store.Reservations();
        Item.TreeRootId = Incoming is null ? Item.Channel.MainInstance.Id + "/" + Item.Channel.MainThreadId : RootId(Incoming);
        Item.TreeDepth = Incoming is null ? 1 : Depth(Incoming) + 1;
        var TreeList = ReservationList.Where(Slot => (Slot.TreeRootId.Length == 0 ? RootId(Store.Get(Slot.Id)) : Slot.TreeRootId) == Item.TreeRootId).ToList();
        var BudgetList = TreeList.Select(Slot => Slot.Budget).Concat(Incoming is null ? Array.Empty<RelayTreeBudget>() : new[] { Incoming.TreeBudget }).ToList();
        var Inherited = BudgetList.Count == 0 ? null : new RelayTreeBudget { MaxSessions = BudgetList.Min(Budget => Budget.MaxSessions), MaxDepth = BudgetList.Min(Budget => Budget.MaxDepth) };
        Item.TreeBudget = RequestedBudget ?? Inherited ?? new();
        if (Item.TreeBudget.MaxSessions < 1 || Item.TreeBudget.MaxDepth is < 1 or > RelayLimits.MaxTreeDepth) throw new InvalidOperationException("tree_session_max 必须大于零 max_depth 范围为 1 至 " + RelayLimits.MaxTreeDepth);
        if (Inherited is not null && (Item.TreeBudget.MaxSessions > Inherited.MaxSessions || Item.TreeBudget.MaxDepth > Inherited.MaxDepth)) throw new InvalidOperationException("已有协作任务时不能提高整棵树的预算");
        int Capacity = TreeList.Select(Slot => Slot.Budget.MaxSessions).Append(Item.TreeBudget.MaxSessions).Min();
        int DepthLimit = TreeList.Select(Slot => Slot.Budget.MaxDepth).Append(Item.TreeBudget.MaxDepth).Min();
        if (TreeList.Count >= Capacity) throw new InvalidOperationException("整棵任务树已达到 tree_session_max=" + Capacity + " 请等待现有任务完成后再启动");
        if (Item.TreeDepth > DepthLimit) throw new InvalidOperationException("继续分工将超过 max_depth=" + DepthLimit);
        Item.TreeBudget = JsonSerializer.Deserialize<RelayTreeBudget>(JsonSerializer.Serialize(Item.TreeBudget))!;
        Item.Workspace = NormalizeWorkspace(Workspace ?? new());
        var AncestorHashList = new HashSet<string>();
        for (var Parent = Incoming; Parent is not null; Parent = Parent.ParentTaskId.Length == 0 ? null : Store.FindTask(Parent.ParentTaskId))
            if (!AncestorHashList.Add(Parent.Id)) throw new InvalidDataException("任务父级出现循环 " + Parent.Id);
        if (Incoming?.Workspace.Access == "read_only" && Item.Workspace.Access == "write") throw new InvalidOperationException("只读任务不能把写入工作交给下级");
        if (Incoming?.Workspace.Access == "write" && Item.Workspace.WritePathList.Any(PathValue => !Incoming.Workspace.WritePathList.Any(ParentPath => Contains(ParentPath, PathValue)))) throw new InvalidOperationException("下级写入范围超出上级声明的目录");
        foreach (var Other in ReservationList.Where(Slot => !AncestorHashList.Contains(Slot.Id) && Slot.Workspace.Access == "write"))
            if (Item.Workspace.WritePathList.Any(PathValue => Other.Workspace.WritePathList.Any(OtherPath => Contains(PathValue, OtherPath) || Contains(OtherPath, PathValue)))) throw new InvalidOperationException("写入范围与任务 " + Other.Id + " 冲突 请使用独立 worktree 或分离输出目录");
    }

    public string RootId(RelayTask Item)
    {
        if (Item.TreeRootId.Length != 0) return Item.TreeRootId;
        var SeenHashList = new HashSet<string>();
        while (Item.ParentTaskId.Length != 0 && Store.FindTask(Item.ParentTaskId) is RelayTask Parent)
        {
            if (!SeenHashList.Add(Item.Id)) throw new InvalidDataException("任务父级出现循环 " + Item.Id);
            Item = Parent;
        }
        return Item.Channel.MainInstance.Id + "/" + Item.Channel.MainThreadId;
    }

    private int Depth(RelayTask Item)
    {
        if (Item.TreeRootId.Length != 0) return Item.TreeDepth;
        int Result = 1;
        var SeenHashList = new HashSet<string>();
        while (Item.ParentTaskId.Length != 0 && Store.FindTask(Item.ParentTaskId) is RelayTask Parent)
        {
            if (!SeenHashList.Add(Item.Id)) throw new InvalidDataException("任务父级出现循环 " + Item.Id);
            Result++;
            Item = Parent;
        }
        return Result;
    }

    public static RelayWorkspace NormalizeWorkspace(RelayWorkspace Value)
    {
        if (Value.Access is not ("unspecified" or "read_only" or "write")) throw new InvalidOperationException("workspace.access 必须为 read_only 或 write");
        if (Value.WritePathList.Count > 20 || Value.WritePathList.Any(PathValue => string.IsNullOrWhiteSpace(PathValue) || PathValue.Length > 1024 || !Path.IsPathFullyQualified(PathValue))) throw new InvalidOperationException("write_paths 最多 20 条 且必须为绝对路径");
        if (Value.Access == "write" && Value.WritePathList.Count == 0 || Value.Access != "write" && Value.WritePathList.Count != 0) throw new InvalidOperationException("仅写入任务需要提供非空 write_paths");
        return new() { Access = Value.Access, WritePathList = Value.WritePathList.Select(AgentCatalog.NormalizePath).Distinct(StringComparer.OrdinalIgnoreCase).ToList() };
    }

    private static bool Contains(string Parent, string Child) => ManagerPaths.Same(Parent, Child) || ManagerPaths.IsUnder(Child, Parent);
}
