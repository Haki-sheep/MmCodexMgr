using System.Text.Json;
using System.Text.Json.Nodes;
using Tomlyn;

namespace CodexInstanceManager;

public static class ConversationImportService
{
    private static readonly string[] DatabaseList = { "state_5.sqlite", "thread_history_1.sqlite", "sqlite/codex-dev.db" };

    #region Preview
    public static ConversationImportPlan Preview(InstanceProfile Source, InstanceProfile Destination, IProgress<string>? Progress = null)
    {
        ValidateProfiles(Source, Destination);
        EnsureStopped(Destination);
        using var Lease = new ConversationImportLease(Destination.HomePath);
        var Config = Toml.ToModel(File.ReadAllText(Path.Combine(Destination.HomePath, "config.toml")));
        string Provider = Config.TryGetValue("model_provider", out object? ProviderValue) ? (string)ProviderValue : "openai";
        string? Model = Config.TryGetValue("model", out object? ModelValue) ? ModelValue as string : null;
        string? Reasoning = Config.TryGetValue("model_reasoning_effort", out object? ReasoningValue) ? ReasoningValue as string : null;
        if (Provider != "openai" && string.IsNullOrWhiteSpace(Model)) throw new InvalidOperationException("请先为目标实例选择可用模型");
        var Plan = new ConversationImportPlan { SourceHome = ManagerPaths.Normalize(Source.HomePath), Destination = Destination, StageRoot = Path.Combine(ManagerPaths.Root, "import-plans", Guid.NewGuid().ToString("N")), Provider = Provider, Model = Model };
        var HeldFileList = new List<FileStream>();
        var SourceStampList = new List<(string Path, long Length, DateTime Modified)>();
        try
        {
            Directory.CreateDirectory(Plan.StageRoot);
            CaptureGuards(Plan);
            Progress?.Report("正在读取目标实例与会话索引…");
            foreach (string Relative in DatabaseList)
            {
                ConversationDatabase.Snapshot(ImportPaths.Resolve(Destination.HomePath, Relative), Path.Combine(Plan.StageRoot, "result", Relative));
            }
            ConversationDatabase.Snapshot(ImportPaths.Resolve(Source.HomePath, "state_5.sqlite"), Path.Combine(Plan.StageRoot, "source", "state_5.sqlite"));
            var SourceState = ReadState(Source.HomePath);
            var TargetState = ReadState(Destination.HomePath);
            List<Dictionary<string, object?>> SourceThreadList;
            HashSet<string> ExistingHashList;
            using (var Database = ConversationDatabase.Open(Path.Combine(Plan.StageRoot, "result", "state_5.sqlite")))
            {
                ConversationDatabase.AttachSource(Database, Path.Combine(Plan.StageRoot, "source", "state_5.sqlite"));
                SourceThreadList = ConversationDatabase.Rows(Database, "SELECT id,title,rollout_path,source,archived FROM source.threads ORDER BY created_at,id");
                ExistingHashList = ConversationDatabase.Rows(Database, "SELECT id FROM threads").Select(Row => (string)Row["id"]!).ToHashSet();
                Plan.TargetCount = ExistingHashList.Count;
            }
            foreach (var Row in SourceThreadList)
            {
                string Id = (string)Row["id"]!;
                string Title = (string)Row["title"]!;
                if (ExistingHashList.Contains(Id)) { Plan.ExistingCount++; continue; }
                string Relative;
                try { Relative = ImportPaths.RolloutRelative(Source.HomePath, (string)Row["rollout_path"]!); }
                catch (IOException Error) { Plan.SkippedList.Add(Title + " · " + Error.Message); continue; }
                string InputPath = ImportPaths.Resolve(Source.HomePath, Relative);
                string OutputPath = ImportPaths.Resolve(Destination.HomePath, Relative);
                if (!File.Exists(InputPath)) { Plan.SkippedList.Add(Title + " · 正文文件不存在"); continue; }
                if (File.Exists(OutputPath)) throw new IOException("目标存在未登记的同路径会话 请先检查 " + Relative);
                if (!TryHoldThread(Source.HomePath, Id, InputPath, HeldFileList, out FileStream? Stream)) { Plan.SkippedList.Add(Title + " · 对话正在使用"); continue; }
                var Info = new FileInfo(InputPath);
                SourceStampList.Add((InputPath, Info.Length, Info.LastWriteTimeUtc));
                string Prepared = Path.Combine(Plan.StageRoot, "rollouts", Relative);
                Directory.CreateDirectory(Path.GetDirectoryName(Prepared)!);
                using (var Output = File.Create(Prepared)) Stream!.CopyTo(Output);
                Plan.ConversationList.Add(new(Id, Title, Relative, ((string)Row["source"]!).Contains("\"subagent\"", StringComparison.Ordinal), Convert.ToInt64(Row["archived"]) != 0));
                Plan.FileList.Add(new(Relative, Prepared));
                Plan.OriginalHashDict[Relative] = null;
                Progress?.Report($"正在准备对话 {Plan.ConversationList.Count}/{SourceThreadList.Count}…");
            }
            CopyHistorySegments(Plan, HeldFileList, SourceStampList);
            Progress?.Report("正在合并历史记录与项目状态…");
            foreach (string Relative in DatabaseList) ConversationDatabase.Snapshot(ImportPaths.Resolve(Source.HomePath, Relative), Path.Combine(Plan.StageRoot, "source", Relative));
            ConversationMerge.Prepare(Plan, SourceState, TargetState, Reasoning);
            foreach (var Stamp in SourceStampList)
            {
                var Info = new FileInfo(Stamp.Path);
                if (!Info.Exists || Info.Length != Stamp.Length || Info.LastWriteTimeUtc != Stamp.Modified)
                    throw new IOException("来源对话在预览期间发生变化 请重新生成预览 " + Path.GetFileName(Stamp.Path));
            }
            foreach (string Relative in DatabaseList)
            {
                Plan.FileList.Add(new(Relative + "-wal", null));
                Plan.FileList.Add(new(Relative + "-shm", null));
                Plan.FileList.Add(new(Relative, Path.Combine(Plan.StageRoot, "result", Relative)));
            }
            Plan.FileList.Add(new(".codex-global-state.json", Path.Combine(Plan.StageRoot, "result", ".codex-global-state.json")));
            Plan.TotalBytes = Plan.FileList.Where(Item => Item.PreparedPath is not null).Sum(Item => new FileInfo(Item.PreparedPath!).Length);
            ValidateGuards(Plan);
            EnsureStopped(Destination);
            return Plan;
        }
        catch { Plan.Dispose(); throw; }
        finally { foreach (var Stream in HeldFileList) Stream.Dispose(); }
    }

    public static void EnsureStopped(InstanceProfile Destination)
    {
        if (InstanceService.Find(Destination, InstanceService.ListRunning()) is not null)
            throw new InvalidOperationException("请先完成任务并退出目标 Codex 实例 再预览或导入对话");
    }

    private static void ValidateProfiles(InstanceProfile Source, InstanceProfile Destination)
    {
        if (Destination.IsPrimary) throw new InvalidOperationException("对话导入仅写入副实例");
        if (ManagerPaths.Same(Source.HomePath, Destination.HomePath) || ManagerPaths.IsUnder(Source.HomePath, Destination.HomePath) || ManagerPaths.IsUnder(Destination.HomePath, Source.HomePath))
            throw new InvalidOperationException("源目录与目标目录不能相同或互相包含");
        foreach (string Home in new[] { Source.HomePath, Destination.HomePath })
        {
            foreach (string Relative in DatabaseList)
                if (!File.Exists(ImportPaths.Resolve(Home, Relative))) throw new FileNotFoundException("请先使用当前版本启动该实例一次并退出 数据文件缺失 " + Relative);
        }
    }

    private static JsonObject ReadState(string Home) => JsonNode.Parse(File.ReadAllText(ImportPaths.Resolve(Home, ".codex-global-state.json")))?.AsObject() ?? throw new InvalidDataException("实例界面状态为空");

    private static void CopyHistorySegments(ConversationImportPlan Plan, List<FileStream> HeldList, List<(string Path, long Length, DateTime Modified)> StampList)
    {
        var ThreadHashList = Plan.ConversationList.Select(Item => Item.Id).ToHashSet();
        var CopiedHashList = Plan.FileList.Select(Item => Item.RelativePath).ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (string DirectoryName in new[] { "sessions", "archived_sessions" })
        {
            string Root = ImportPaths.Resolve(Plan.SourceHome, DirectoryName);
            if (!Directory.Exists(Root)) continue;
            foreach (string PathValue in Directory.EnumerateFiles(Root, "*.jsonl", new EnumerationOptions { RecurseSubdirectories = true, AttributesToSkip = FileAttributes.ReparsePoint, IgnoreInaccessible = false }))
            {
                string Relative = ImportPaths.RolloutRelative(Plan.SourceHome, PathValue);
                if (CopiedHashList.Contains(Relative)) continue;
                using var HeaderStream = new FileStream(PathValue, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
                using var Reader = new StreamReader(HeaderStream);
                string? Line = Reader.ReadLine();
                if (Line is null) continue;
                using var Header = JsonDocument.Parse(Line);
                if (!Header.RootElement.TryGetProperty("type", out var Type) || Type.GetString() != "session_meta") continue;
                var Payload = Header.RootElement.GetProperty("payload");
                string? Id = Payload.TryGetProperty("session_id", out var SessionId) ? SessionId.GetString() : Payload.GetProperty("id").GetString();
                if (Id is null || !ThreadHashList.Contains(Id)) continue;
                if (File.Exists(ImportPaths.Resolve(Plan.Destination.HomePath, Relative))) throw new IOException("目标存在同路径的历史分段 " + Relative);
                var Stream = new FileStream(PathValue, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete, 65536, FileOptions.SequentialScan);
                HeldList.Add(Stream);
                var Info = new FileInfo(PathValue);
                StampList.Add((PathValue, Info.Length, Info.LastWriteTimeUtc));
                string Prepared = Path.Combine(Plan.StageRoot, "rollouts", Relative);
                Directory.CreateDirectory(Path.GetDirectoryName(Prepared)!);
                using (var Output = File.Create(Prepared)) Stream.CopyTo(Output);
                Plan.FileList.Add(new(Relative, Prepared));
                Plan.OriginalHashDict[Relative] = null;
                CopiedHashList.Add(Relative);
            }
        }
    }

    private static bool TryHoldThread(string Home, string Id, string Rollout, List<FileStream> HeldList, out FileStream? Stream)
    {
        FileStream? Lock = null;
        Stream = null;
        try
        {
            string LockPath = ImportPaths.Resolve(Home, Path.Combine("thread-writer-locks", Id + ".lock"));
            if (File.Exists(LockPath))
            {
                Lock = new FileStream(LockPath, FileMode.Open, FileAccess.ReadWrite, FileShare.ReadWrite | FileShare.Delete);
                Lock.Lock(0, 1);
            }
            Stream = new FileStream(Rollout, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete, 65536, FileOptions.SequentialScan);
            if (Lock is not null) HeldList.Add(Lock);
            HeldList.Add(Stream);
            return true;
        }
        catch (IOException Error) when ((Error.HResult & 0xffff) is 32 or 33)
        {
            Lock?.Dispose();
            Stream?.Dispose();
            return false;
        }
        catch { Lock?.Dispose(); Stream?.Dispose(); throw; }
    }

    private static void CaptureGuards(ConversationImportPlan Plan)
    {
        foreach (string Relative in DatabaseList.SelectMany(Path => new[] { Path, Path + "-wal" }).Concat(new[] { ".codex-global-state.json", "config.toml", "auth.json" }))
            Plan.OriginalHashDict[Relative] = SettingsStore.FileHash(ImportPaths.Resolve(Plan.Destination.HomePath, Relative));
    }

    private static void ValidateGuards(ConversationImportPlan Plan)
    {
        foreach (var Pair in Plan.OriginalHashDict)
            if (SettingsStore.FileHash(ImportPaths.Resolve(Plan.Destination.HomePath, Pair.Key)) != Pair.Value)
                throw new IOException("预览后目标实例数据已变化 请重新预览 " + Pair.Key);
    }
    #endregion

    #region Apply
    public static string Apply(ConversationImportPlan Plan, string BackupRoot, IProgress<string>? Progress = null)
    {
        EnsureStopped(Plan.Destination);
        using var Lease = new ConversationImportLease(Plan.Destination.HomePath);
        ValidateGuards(Plan);
        string Backup = Path.Combine(BackupRoot, "conversations-" + DateTime.Now.ToString("yyyyMMdd-HHmmss") + "-" + Guid.NewGuid().ToString("N")[..6]);
        Directory.CreateDirectory(Backup);
        var AppliedList = new List<(string Destination, string Backup, bool Existed)>();
        var OriginalDict = new Dictionary<string, bool>();
        foreach (var Item in Plan.FileList)
        {
            string Destination = ImportPaths.Resolve(Plan.Destination.HomePath, Item.RelativePath);
            bool Existed = File.Exists(Destination);
            OriginalDict[Item.RelativePath] = Existed;
            if (Existed) SettingsStore.AtomicCopy(Destination, ImportPaths.Resolve(Backup, Item.RelativePath));
        }
        File.WriteAllText(Path.Combine(Backup, "manifest.json"), JsonSerializer.Serialize(new { Version = 1, Plan.SourceHome, DestinationHome = Plan.Destination.HomePath, CreatedAt = DateTimeOffset.Now, OriginalFiles = OriginalDict }));
        EnsureStopped(Plan.Destination);
        ValidateGuards(Plan);
        try
        {
            foreach (var Item in Plan.FileList)
            {
                string Destination = ImportPaths.Resolve(Plan.Destination.HomePath, Item.RelativePath);
                string Original = ImportPaths.Resolve(Backup, Item.RelativePath);
                AppliedList.Add((Destination, Original, OriginalDict[Item.RelativePath]));
                if (Item.PreparedPath is null) File.Delete(Destination);
                else SettingsStore.AtomicCopy(Item.PreparedPath, Destination);
                Progress?.Report("正在写入 " + Item.RelativePath);
            }
            return Backup;
        }
        catch (Exception Error)
        {
            var ErrorList = new List<Exception> { Error };
            foreach (var Item in AppliedList.AsEnumerable().Reverse())
            {
                try
                {
                    if (Item.Existed) SettingsStore.AtomicCopy(Item.Backup, Item.Destination);
                    else File.Delete(Item.Destination);
                }
                catch (Exception RestoreError) { ErrorList.Add(RestoreError); }
            }
            if (ErrorList.Count > 1) throw new AggregateException("导入与回滚失败 请保留备份 " + Backup, ErrorList);
            throw new IOException("导入失败 已回滚本次改动 备份位于 " + Backup, Error);
        }
    }
    #endregion
}
