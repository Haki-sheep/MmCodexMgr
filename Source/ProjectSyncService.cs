using System.Text.Json.Nodes;

namespace CodexInstanceManager;

public static class ProjectSyncService
{
    private const string StateDatabase = "state_5.sqlite";
    private const string SidebarState = ".codex-global-state.json";

    public static ConversationImportPlan Preview(InstanceProfile Source, InstanceProfile Destination, IProgress<string>? Progress = null)
    {
        if (Destination.IsPrimary) throw new InvalidOperationException("工程同步仅写入副实例");
        if (ManagerPaths.Same(Source.HomePath, Destination.HomePath) || ManagerPaths.IsUnder(Source.HomePath, Destination.HomePath) || ManagerPaths.IsUnder(Destination.HomePath, Source.HomePath))
            throw new InvalidOperationException("源目录与目标目录不能相同或互相包含");
        ConversationImportService.EnsureStopped(Destination);
        using var Lease = new ConversationImportLease(Destination.HomePath);
        var Plan = new ConversationImportPlan
        {
            SourceHome = ManagerPaths.Normalize(Source.HomePath),
            Destination = Destination,
            ProjectsOnly = true,
            StageRoot = Path.Combine(ManagerPaths.Root, "import-plans", Guid.NewGuid().ToString("N"))
        };
        try
        {
            foreach (string Relative in new[] { StateDatabase, StateDatabase + "-wal", SidebarState })
                Plan.OriginalHashDict[Relative] = SettingsStore.FileHash(ImportPaths.Resolve(Destination.HomePath, Relative));
            Progress?.Report("正在读取来源工程与目标工程…");
            string SourcePath = Path.Combine(Plan.StageRoot, "source", StateDatabase);
            string TargetPath = Path.Combine(Plan.StageRoot, "result", StateDatabase);
            ConversationDatabase.Snapshot(ImportPaths.Resolve(Source.HomePath, StateDatabase), SourcePath);
            ConversationDatabase.Snapshot(ImportPaths.Resolve(Destination.HomePath, StateDatabase), TargetPath);
            var SourceState = ReadState(Source.HomePath);
            var TargetState = ReadState(Destination.HomePath);
            using (var Database = ConversationDatabase.Open(TargetPath))
            {
                ConversationDatabase.AttachSource(Database, SourcePath);
                var Sidebar = new ConversationSidebar(Database, SourceState, TargetState, Plan);
                Sidebar.WriteProjects(Database);
                ConversationDatabase.Verify(Database);
                File.WriteAllText(Path.Combine(Plan.StageRoot, "result", SidebarState), Sidebar.Result.ToJsonString());
            }
            if (Plan.ProjectCount > 0)
            {
                Plan.FileList.Add(new(StateDatabase + "-wal", null));
                Plan.FileList.Add(new(StateDatabase + "-shm", null));
                Plan.FileList.Add(new(StateDatabase, TargetPath));
                Plan.FileList.Add(new(SidebarState, Path.Combine(Plan.StageRoot, "result", SidebarState)));
                Plan.TotalBytes = Plan.FileList.Where(Item => Item.PreparedPath is not null).Sum(Item => new FileInfo(Item.PreparedPath!).Length);
            }
            foreach (var Pair in Plan.OriginalHashDict)
                if (SettingsStore.FileHash(ImportPaths.Resolve(Destination.HomePath, Pair.Key)) != Pair.Value)
                    throw new IOException("读取期间目标实例数据已变化 请重新同步 " + Pair.Key);
            ConversationImportService.EnsureStopped(Destination);
            return Plan;
        }
        catch { Plan.Dispose(); throw; }
    }

    public static string Apply(ConversationImportPlan Plan, string BackupRoot, IProgress<string>? Progress = null)
    {
        if (!Plan.ProjectsOnly) throw new InvalidOperationException("工程同步不能使用会话导入计划");
        return ConversationImportService.Apply(Plan, BackupRoot, Progress);
    }

    private static JsonObject ReadState(string Home) => JsonNode.Parse(File.ReadAllText(ImportPaths.Resolve(Home, SidebarState)))?.AsObject() ?? throw new InvalidDataException("实例界面状态为空 " + Home);
}
