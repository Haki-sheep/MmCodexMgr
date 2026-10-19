using System.Text.Json;
using System.Text.Json.Nodes;

namespace CodexInstanceManager;

public static class ConversationCleanupService
{
    private static readonly string[] RequiredDatabaseList = { "state_5.sqlite", "thread_history_1.sqlite", "sqlite/codex-dev.db" };
    private static readonly string[] AuxiliaryDatabaseList = { "goals_1.sqlite", "queue_1.sqlite" };
    private sealed record CleanupFile(string RelativePath, string? PreparedPath, bool Existed);

    #region Cleanup
    public static string Apply(InstanceProfile Profile, bool RemoveProjects, string BackupRoot, IProgress<string>? Progress = null)
    {
        RequireStopped(Profile);
        string Home = ManagerPaths.Normalize(Profile.HomePath);
        string Backup = ManagerPaths.Normalize(Path.Combine(BackupRoot, "cleanup-" + DateTime.Now.ToString("yyyyMMdd-HHmmss") + "-" + Guid.NewGuid().ToString("N")));
        if (ManagerPaths.Same(Home, Backup) || ManagerPaths.IsUnder(Backup, Home)) throw new IOException("清理备份目录不能位于所选实例目录内");
        foreach (string Relative in RequiredDatabaseList.Append(".codex-global-state.json"))
            if (!File.Exists(ImportPaths.Resolve(Home, Relative))) throw new FileNotFoundException("请先启动所选实例一次并退出 数据文件缺失", Relative);
        using var Lease = new ConversationImportLease(Home);
        var WriterLockList = new List<FileStream>();
        try
        {
            HoldWriters(Home, WriterLockList);
            var DatabaseList = RequiredDatabaseList.Concat(AuxiliaryDatabaseList.Where(Relative => File.Exists(ImportPaths.Resolve(Home, Relative)))).ToList();
            var SessionFileList = ReadSessionFiles(Home);
            var RelativeList = DatabaseList.SelectMany(Relative => new[] { Relative, Relative + "-wal", Relative + "-shm" })
                .Concat(SessionFileList).Concat(new[] { ".codex-global-state.json", "session_index.jsonl", "history.jsonl" }).ToList();
            var HashDict = RelativeList.Where(Relative => !Relative.EndsWith("-shm", StringComparison.Ordinal)).Concat(new[] { "config.toml", "auth.json" })
                .ToDictionary(Relative => Relative, Relative => SettingsStore.FileHash(ImportPaths.Resolve(Home, Relative)), StringComparer.OrdinalIgnoreCase);
            string Prepared = ImportPaths.Resolve(Backup, "prepared");
            Directory.CreateDirectory(Prepared);
            foreach (string Relative in DatabaseList)
            {
                Progress?.Report("正在准备 " + Relative);
                ConversationDatabase.Snapshot(ImportPaths.Resolve(Home, Relative), ImportPaths.Resolve(Prepared, Relative));
            }
            var State = JsonNode.Parse(File.ReadAllText(ImportPaths.Resolve(Home, ".codex-global-state.json")))?.AsObject() ?? throw new InvalidDataException("实例侧栏状态为空");
            var ThreadIdHashList = ConversationCleanupData.ReadThreadIds(ImportPaths.Resolve(Prepared, "state_5.sqlite"), ImportPaths.Resolve(Prepared, "sqlite/codex-dev.db"));
            var ProjectIdHashList = ConversationCleanupData.ReadProjectIds(ImportPaths.Resolve(Prepared, "state_5.sqlite"), State);
            foreach (string Relative in DatabaseList) ConversationCleanupData.ClearDatabase(ImportPaths.Resolve(Prepared, Relative), RemoveProjects, ThreadIdHashList);
            ConversationCleanupData.ClearSidebar(State, Home, RemoveProjects, ThreadIdHashList, ProjectIdHashList);
            File.WriteAllText(ImportPaths.Resolve(Prepared, ".codex-global-state.json"), State.ToJsonString());
            var FileList = RelativeList.Select(Relative => new CleanupFile(Relative,
                DatabaseList.Contains(Relative) || Relative == ".codex-global-state.json" ? ImportPaths.Resolve(Prepared, Relative) : null,
                File.Exists(ImportPaths.Resolve(Home, Relative)))).ToList();
            foreach (var File in FileList.Where(File => File.Existed))
            {
                Progress?.Report("正在备份 " + File.RelativePath);
                SettingsStore.AtomicCopy(ImportPaths.Resolve(Home, File.RelativePath), ImportPaths.Resolve(Backup, Path.Combine("original", File.RelativePath)));
            }
            File.WriteAllText(ImportPaths.Resolve(Backup, "manifest.json"), JsonSerializer.Serialize(new { Version = 1, InstanceId = Profile.Id, InstanceName = Profile.Name, Home, RemoveProjects, ThreadCount = ThreadIdHashList.Count, ProjectCount = ProjectIdHashList.Count, OriginalFiles = FileList.ToDictionary(File => File.RelativePath, File => File.Existed) }));
            RequireStopped(Profile);
            ValidateGuards(Home, HashDict);
            if (!SessionFileList.ToHashSet(StringComparer.OrdinalIgnoreCase).SetEquals(ReadSessionFiles(Home))) throw new IOException("准备期间会话文件发生变化 已停止清理");
            Commit(Home, Backup, FileList, Progress);
            return Backup;
        }
        finally { foreach (var Stream in WriterLockList) Stream.Dispose(); }
    }
    #endregion

    #region Guards
    private static void RequireStopped(InstanceProfile Profile)
    {
        if (InstanceService.Find(Profile, InstanceService.ListRunning()) is not null) throw new InvalidOperationException("请先完成任务并退出所选 Codex 实例 再清理本地记录 " + Profile.Name);
    }

    private static void HoldWriters(string Home, List<FileStream> LockList)
    {
        string Root = ImportPaths.Resolve(Home, "thread-writer-locks");
        foreach (string FilePath in Directory.EnumerateFiles(Root, "*.lock"))
        {
            if (Path.GetFileName(FilePath) == ".coordination.lock") continue;
            string CheckedPath = ImportPaths.Resolve(Home, Path.GetRelativePath(Home, FilePath));
            var Stream = new FileStream(CheckedPath, FileMode.Open, FileAccess.ReadWrite, FileShare.ReadWrite);
            LockList.Add(Stream);
            Stream.Lock(0, 1);
        }
    }

    private static List<string> ReadSessionFiles(string Home)
    {
        var ResultList = new List<string>();
        var Pending = new Queue<string>();
        foreach (string Relative in new[] { "sessions", "archived_sessions" })
        {
            string Root = ImportPaths.Resolve(Home, Relative);
            if (Directory.Exists(Root)) Pending.Enqueue(Root);
        }
        while (Pending.TryDequeue(out string? DirectoryPath))
            foreach (string PathValue in Directory.EnumerateFileSystemEntries(DirectoryPath))
            {
                string Relative = Path.GetRelativePath(Home, PathValue);
                string CheckedPath = ImportPaths.Resolve(Home, Relative);
                if (Directory.Exists(CheckedPath)) Pending.Enqueue(CheckedPath);
                else ResultList.Add(Relative);
            }
        return ResultList;
    }

    private static void ValidateGuards(string Home, Dictionary<string, string?> HashDict)
    {
        foreach (var Pair in HashDict)
            if (SettingsStore.FileHash(ImportPaths.Resolve(Home, Pair.Key)) != Pair.Value) throw new IOException("准备期间实例数据发生变化 已停止清理 " + Pair.Key);
    }
    #endregion

    #region Commit
    private static void Commit(string Home, string Backup, List<CleanupFile> FileList, IProgress<string>? Progress)
    {
        var AppliedList = new List<CleanupFile>();
        try
        {
            foreach (var File in FileList)
            {
                string Destination = ImportPaths.Resolve(Home, File.RelativePath);
                AppliedList.Add(File);
                if (File.PreparedPath is null) System.IO.File.Delete(Destination);
                else SettingsStore.AtomicCopy(File.PreparedPath, Destination);
                Progress?.Report("正在清理 " + File.RelativePath);
            }
        }
        catch (Exception Error)
        {
            var ErrorList = new List<Exception> { Error };
            foreach (var File in AppliedList.AsEnumerable().Reverse())
            {
                try
                {
                    string Destination = ImportPaths.Resolve(Home, File.RelativePath);
                    if (File.Existed) SettingsStore.AtomicCopy(ImportPaths.Resolve(Backup, Path.Combine("original", File.RelativePath)), Destination);
                    else System.IO.File.Delete(Destination);
                }
                catch (Exception RestoreError) { ErrorList.Add(RestoreError); }
            }
            if (ErrorList.Count > 1) throw new AggregateException("清理与回滚失败 请保留备份 " + Backup, ErrorList);
            throw new IOException("清理失败 已回滚本次改动 备份位于 " + Backup, Error);
        }
    }
    #endregion
}
