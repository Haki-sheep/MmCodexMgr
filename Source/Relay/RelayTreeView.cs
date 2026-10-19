namespace CodexInstanceManager;

public sealed class RelayTreeView
{
    public const int MaxVisibleRows = 200;
    private readonly RelayStore Store;
    private readonly Dictionary<string, int> ExpandedDict = new();
    public List<RelayVisibleRow> RowList { get; } = new();
    public int RootPageCount { get; private set; }
    public bool Limited { get; private set; }

    public RelayTreeView(RelayStore Store) => this.Store = Store;
    public bool IsExpanded(string Id) => ExpandedDict.ContainsKey(Id);
    public void CollapseAll() => ExpandedDict.Clear();
    public void Toggle(string Id)
    {
        if (!ExpandedDict.Remove(Id)) ExpandedDict.Add(Id, RelayLimits.PageSize);
    }
    public void LoadMore(string Id) => ExpandedDict[Id] += RelayLimits.PageSize;

    public void Refresh(int Offset)
    {
        RowList.Clear();
        Limited = false;
        var RootList = Store.TreePage(null, Offset);
        RootPageCount = RootList.Count;
        foreach (var Entry in RootList) Append(Entry, 0, new HashSet<string>());
        var VisibleHashList = RowList.Where(Row => !Row.More).Select(Row => Row.Entry.Id).ToHashSet();
        foreach (string Id in ExpandedDict.Keys.Where(Id => !VisibleHashList.Contains(Id)).ToArray()) ExpandedDict.Remove(Id);
    }

    private void Append(RelayTreeEntry Entry, int Depth, HashSet<string> AncestorHashList)
    {
        if (RowList.Count >= MaxVisibleRows) { Limited = true; return; }
        if (!AncestorHashList.Add(Entry.Id)) throw new InvalidDataException("协作树出现循环 " + Entry.Id);
        RowList.Add(new(Entry, Depth));
        if (ExpandedDict.TryGetValue(Entry.Id, out int LoadedCount))
        {
            for (int Offset = 0; Offset < LoadedCount && Offset < Entry.ChildCount && RowList.Count < MaxVisibleRows; Offset += RelayLimits.PageSize)
                foreach (var Child in Store.TreePage(Entry.Id, Offset)) Append(Child, Depth + 1, AncestorHashList);
            if (LoadedCount < Entry.ChildCount && RowList.Count < MaxVisibleRows) RowList.Add(new(Entry, Depth + 1, true));
            if (RowList.Count >= MaxVisibleRows && Entry.ChildCount > 0) Limited = true;
        }
        AncestorHashList.Remove(Entry.Id);
    }
}
