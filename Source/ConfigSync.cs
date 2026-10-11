using System.Collections;
using System.Text;
using Tomlyn;
using Tomlyn.Model;
using Tomlyn.Syntax;

namespace CodexInstanceManager;

public sealed class SyncOptions
{
    public bool Skills { get; set; } = true;
    public bool Mcp { get; set; } = true;
    public bool Instructions { get; set; } = true;
    public bool Plugins { get; set; }
}

public sealed record PlannedFile(string Destination, string? Source, byte[]? Content, string? OriginalHash);

public sealed class SyncPlan
{
    public string DestinationRoot { get; init; } = "";
    public List<PlannedFile> FileList { get; } = new();
    public long TotalBytes { get; set; }
}

public static class ConfigSync
{
    #region Preview
    public static SyncPlan Preview(InstanceProfile Source, InstanceProfile Destination, SyncOptions Options)
    {
        string SourceRoot = ManagerPaths.Normalize(Source.HomePath);
        string DestinationRoot = ManagerPaths.Normalize(Destination.HomePath);
        if (ManagerPaths.Same(SourceRoot, DestinationRoot) || ManagerPaths.IsUnder(SourceRoot, DestinationRoot) || ManagerPaths.IsUnder(DestinationRoot, SourceRoot))
            throw new InvalidOperationException("源目录与目标目录不能相同或互相包含");
        if (!Directory.Exists(SourceRoot)) throw new DirectoryNotFoundException("源实例目录不存在 " + SourceRoot);
        var Plan = new SyncPlan { DestinationRoot = DestinationRoot };
        if (Options.Skills) AddTree(Plan, Path.Combine(SourceRoot, "skills"), Path.Combine(DestinationRoot, "skills"), true);
        if (Options.Instructions)
        {
            AddFile(Plan, Path.Combine(SourceRoot, "AGENTS.md"), Path.Combine(DestinationRoot, "AGENTS.md"));
            AddTree(Plan, Path.Combine(SourceRoot, "rules"), Path.Combine(DestinationRoot, "rules"), false);
        }
        if (Options.Plugins) AddTree(Plan, Path.Combine(SourceRoot, "plugins", "cache"), Path.Combine(DestinationRoot, "plugins", "cache"), false);
        string SourceConfig = Path.Combine(SourceRoot, "config.toml");
        string DestinationConfig = Path.Combine(DestinationRoot, "config.toml");
        if (File.Exists(SourceConfig))
        {
            var RootList = new HashSet<string>(StringComparer.Ordinal);
            if (Options.Mcp) RootList.Add("mcp_servers");
            if (Options.Skills) RootList.Add("skills");
            if (Options.Plugins) { RootList.Add("plugins"); RootList.Add("marketplaces"); }
            string ExistingText = File.Exists(DestinationConfig) ? File.ReadAllText(DestinationConfig) : "";
            string NewText = MergeConfig(File.ReadAllText(SourceConfig), ExistingText, RootList, SourceRoot, DestinationRoot);
            if (NewText != ExistingText) AddContent(Plan, DestinationConfig, Encoding.UTF8.GetBytes(NewText));
        }
        return Plan;
    }

    public static string MergeConfig(string SourceText, string DestinationText, HashSet<string> RootList, string SourceRoot, string DestinationRoot)
    {
        var SourceModel = Toml.ToModel(SourceText);
        var DestinationModel = Toml.ToModel(DestinationText);
        var SelectedModel = new TomlTable();
        foreach (string Root in RootList)
        {
            if (!SourceModel.TryGetValue(Root, out object? Incoming)) continue;
            if (Incoming is TomlTable IncomingTable && DestinationModel.TryGetValue(Root, out object? Current) && Current is TomlTable CurrentTable)
            {
                var MergedTable = new TomlTable();
                foreach (var Item in CurrentTable) MergedTable[Item.Key] = Item.Value;
                foreach (var Item in IncomingTable) MergedTable[Item.Key] = RemapPaths(Item.Value, SourceRoot, DestinationRoot);
                SelectedModel[Root] = MergedTable;
            }
            else SelectedModel[Root] = RemapPaths(Incoming, SourceRoot, DestinationRoot);
        }
        if (SelectedModel.Count == 0) return DestinationText;
        var Document = Toml.Parse(DestinationText.Length > 0 && !DestinationText.EndsWith('\n') ? DestinationText + Environment.NewLine : DestinationText);
        for (int Index = Document.Tables.ChildrenCount - 1; Index >= 0; Index--)
            if (SelectedModel.ContainsKey(GetRoot(Document.Tables.GetChild(Index)!.Name!))) Document.Tables.RemoveChildAt(Index);
        for (int Index = Document.KeyValues.ChildrenCount - 1; Index >= 0; Index--)
            if (SelectedModel.ContainsKey(GetRoot(Document.KeyValues.GetChild(Index)!.Key!))) Document.KeyValues.RemoveChildAt(Index);
        var IncomingDocument = Toml.Parse(Toml.FromModel(SelectedModel));
        foreach (var Item in IncomingDocument.KeyValues.ToList()) { IncomingDocument.KeyValues.RemoveChild(Item); Document.KeyValues.Add(Item); }
        foreach (var Table in IncomingDocument.Tables.ToList()) { IncomingDocument.Tables.RemoveChild(Table); Document.Tables.Add(Table); }
        string Result = Document.ToString();
        Toml.ToModel(Result);
        return Result;
    }

    private static string GetRoot(KeySyntax Key) => Key.Key switch
    {
        BareKeySyntax Bare => Bare.Key!.Text!,
        StringValueSyntax Quoted => Quoted.Value!,
        _ => throw new InvalidDataException("无法识别 TOML 配置节")
    };

    private static object RemapPaths(object Value, string SourceRoot, string DestinationRoot)
    {
        if (Value is string Text)
        {
            foreach (string Relative in new[] { "skills", "rules", "plugins/cache" })
            {
                string Prefix = SourceRoot.Replace('\\', '/') + "/" + Relative;
                string Normalized = Text.Replace('\\', '/');
                if (string.Equals(Normalized, Prefix, StringComparison.OrdinalIgnoreCase) || Normalized.StartsWith(Prefix + "/", StringComparison.OrdinalIgnoreCase))
                    return DestinationRoot.Replace('\\', '/') + Normalized[SourceRoot.Replace('\\', '/').Length..];
            }
            return Text;
        }
        if (Value is TomlTable Table)
        {
            var Result = new TomlTable();
            foreach (var Item in Table) Result[Item.Key] = RemapPaths(Item.Value, SourceRoot, DestinationRoot);
            return Result;
        }
        if (Value is TomlTableArray TableArray)
        {
            var Result = new TomlTableArray();
            foreach (var Item in TableArray) Result.Add((TomlTable)RemapPaths(Item, SourceRoot, DestinationRoot));
            return Result;
        }
        if (Value is TomlArray Array)
        {
            var Result = new TomlArray();
            foreach (object? Item in Array) Result.Add(RemapPaths(Item ?? throw new InvalidDataException("TOML 数组含空值"), SourceRoot, DestinationRoot));
            return Result;
        }
        return Value;
    }
    #endregion

    #region Files
    private static void AddTree(SyncPlan Plan, string Source, string Destination, bool UserSkillsOnly, HashSet<string>? AncestorHashList = null)
    {
        if (!Directory.Exists(Source)) return;
        var Info = new DirectoryInfo(Source);
        string ActualSource = Info.ResolveLinkTarget(true)?.FullName ?? Info.FullName;
        var AncestorList = AncestorHashList is null ? new HashSet<string>(StringComparer.OrdinalIgnoreCase) : new HashSet<string>(AncestorHashList, StringComparer.OrdinalIgnoreCase);
        if (!AncestorList.Add(ManagerPaths.Normalize(ActualSource))) throw new IOException("发现循环目录链接 " + Source);
        foreach (string FilePath in Directory.EnumerateFiles(ActualSource)) AddFile(Plan, FilePath, Path.Combine(Destination, Path.GetFileName(FilePath)));
        foreach (string DirectoryPath in Directory.EnumerateDirectories(ActualSource))
        {
            string Name = Path.GetFileName(DirectoryPath);
            if (Name is ".git" or "__pycache__" || UserSkillsOnly && Name == ".system") continue;
            AddTree(Plan, DirectoryPath, Path.Combine(Destination, Name), false, AncestorList);
        }
    }

    private static void AddFile(SyncPlan Plan, string Source, string Destination)
    {
        if (!File.Exists(Source)) return;
        string? OriginalHash = SettingsStore.FileHash(Destination);
        if (SettingsStore.FileHash(Source) == OriginalHash) return;
        EnsureDestination(Plan, Destination);
        Plan.FileList.Add(new PlannedFile(Destination, Source, null, OriginalHash));
        Plan.TotalBytes += new FileInfo(Source).Length;
    }

    private static void AddContent(SyncPlan Plan, string Destination, byte[] ContentList)
    {
        EnsureDestination(Plan, Destination);
        Plan.FileList.Add(new PlannedFile(Destination, null, ContentList, SettingsStore.FileHash(Destination)));
        Plan.TotalBytes += ContentList.Length;
    }

    private static void EnsureDestination(SyncPlan Plan, string Destination)
    {
        if (!ManagerPaths.IsUnder(Destination, Plan.DestinationRoot)) throw new IOException("同步目标越过实例目录 " + Destination);
        string? Parent = Path.GetDirectoryName(Destination);
        while (Parent is not null && (ManagerPaths.IsUnder(Parent, Plan.DestinationRoot) || ManagerPaths.Same(Parent, Plan.DestinationRoot)))
        {
            if (Directory.Exists(Parent) && (File.GetAttributes(Parent) & FileAttributes.ReparsePoint) != 0)
                throw new IOException("目标包含目录链接 为避免写入其他实例已停止 " + Parent);
            Parent = Path.GetDirectoryName(Parent);
        }
        if (File.Exists(Destination) && (File.GetAttributes(Destination) & FileAttributes.ReparsePoint) != 0)
            throw new IOException("目标文件是链接 为避免写入其他实例已停止 " + Destination);
    }
    #endregion

    #region Apply
    public static string Apply(SyncPlan Plan, string BackupRoot, IProgress<string>? Progress = null)
    {
        string BackupPath = Path.Combine(BackupRoot, DateTime.Now.ToString("yyyyMMdd-HHmmss") + "-" + Guid.NewGuid().ToString("N")[..6]);
        var AppliedList = new List<(PlannedFile File, string Backup)>();
        foreach (var File in Plan.FileList)
        {
            EnsureDestination(Plan, File.Destination);
            if (SettingsStore.FileHash(File.Destination) != File.OriginalHash)
                throw new IOException("预览后目标文件已变化 请重新预览 " + File.Destination);
        }
        try
        {
            for (int Index = 0; Index < Plan.FileList.Count; Index++)
            {
                var File = Plan.FileList[Index];
                EnsureDestination(Plan, File.Destination);
                if (SettingsStore.FileHash(File.Destination) != File.OriginalHash)
                    throw new IOException("同步期间目标文件已变化 " + File.Destination);
                string Backup = Path.Combine(BackupPath, Path.GetRelativePath(Plan.DestinationRoot, File.Destination));
                if (System.IO.File.Exists(File.Destination))
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(Backup)!);
                    System.IO.File.Copy(File.Destination, Backup);
                }
                AppliedList.Add((File, Backup));
                if (File.Content is not null) SettingsStore.AtomicWrite(File.Destination, File.Content);
                else SettingsStore.AtomicCopy(File.Source!, File.Destination);
                Progress?.Report($"同步 {Index + 1}/{Plan.FileList.Count}　{Path.GetRelativePath(Plan.DestinationRoot, File.Destination)}");
            }
            Directory.CreateDirectory(BackupPath);
            System.IO.File.WriteAllText(Path.Combine(BackupPath, "manifest.json"), System.Text.Json.JsonSerializer.Serialize(new { DestinationRoot = Plan.DestinationRoot, Files = Plan.FileList.Select(File => new { File.Destination, Existed = File.OriginalHash is not null }) }));
            return BackupPath;
        }
        catch (Exception Error)
        {
            var ErrorList = new List<Exception> { Error };
            foreach (var Item in AppliedList.AsEnumerable().Reverse())
            {
                try
                {
                    if (Item.File.OriginalHash is null) System.IO.File.Delete(Item.File.Destination);
                    else SettingsStore.AtomicCopy(Item.Backup, Item.File.Destination);
                }
                catch (Exception RestoreError) { ErrorList.Add(RestoreError); }
            }
            if (ErrorList.Count > 1) throw new AggregateException("同步及回滚失败 请检查备份 " + BackupPath, ErrorList);
            throw new IOException("同步失败 已回滚本次文件改动 " + Error.Message, Error);
        }
    }
    #endregion
}
