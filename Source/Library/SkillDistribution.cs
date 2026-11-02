namespace CodexInstanceManager;

public sealed record SkillTarget(string Agent, string PathValue, bool Available);
public sealed record SkillDistributionPackage(string Name, string DirectoryPath, string Hash);
public sealed record SkillDistributionPlan(SkillTarget Target, string SourceRoot, string SourceHash, string DestinationHash, IReadOnlyList<SkillDistributionPackage> PackageList, IReadOnlyList<string> ReplacedList, bool HasChanges);

public static class SkillDistribution
{
    #region Preview
    public static List<SkillTarget> Scan(string? UserRoot = null, string? DshHome = null, string? AgentsHome = null)
    {
        string Home = UserRoot ?? Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        string Cursor = Path.Combine(Home, ".cursor");
        string? DshSetting = DshHome ?? (UserRoot is null ? Environment.GetEnvironmentVariable("DSH_HOME") : null);
        string? AgentsSetting = AgentsHome ?? (UserRoot is null ? Environment.GetEnvironmentVariable("DSH_AGENTS_HOME") : null);
        string Dsh = string.IsNullOrWhiteSpace(DshSetting) ? Path.Combine(Home, ".dsh") : DshSetting;
        string Agents = string.IsNullOrWhiteSpace(AgentsSetting) ? Path.Combine(Home, ".agents") : AgentsSetting;
        if (!Path.IsPathFullyQualified(Dsh) || !Path.IsPathFullyQualified(Agents)) throw new IOException("DSH Skill 根目录必须是绝对路径");
        return new() { new("cursor", Path.Combine(Cursor, "skills"), Directory.Exists(Cursor)), new("dsh", Path.Combine(Dsh, "skills"), Directory.Exists(Dsh)), new("shared", Path.Combine(Agents, "skills"), Directory.Exists(Home)) };
    }

    /// <summary>
    /// 预览当前源集合的覆盖及旧别名清理 不移除目标第三方技能
    /// </summary>
    public static SkillDistributionPlan Preview(string SourceRoot, SkillTarget Target, IReadOnlyCollection<string>? ExcludedNameList = null)
    {
        if (!Target.Available) throw new IOException("未发现目标配置目录 " + Target.Agent);
        GlobalRules.EnsureWritablePath(Target.PathValue);
        var Mirror = SkillMirror.Preview(SourceRoot, Target.PathValue, ExcludedNameList: ExcludedNameList);
        if (ManagerPaths.Same(Mirror.SourceRoot, Mirror.DestinationRoot)) throw new IOException("分发源不能与目标相同");
        foreach (var Package in Mirror.PackageList)
            if (SkillNames.Portable(Package.Name) != Package.Name) throw new InvalidDataException("目标要求小写连字符 Skill 标识 请先规范源包 " + Package.Name);
        var NameHashList = Mirror.PackageList.Select(Item => Item.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var ReplacedList = new List<string>();
        foreach (string Entry in SkillMirror.Entries(Mirror.DestinationRoot))
        {
            string Name = Path.GetFileName(Entry);
            if (NameHashList.Contains(Name) || SkillNames.LegacyNameDict.TryGetValue(Name, out string? Canonical) && NameHashList.Contains(Canonical)) ReplacedList.Add(Name);
            else if (File.Exists(Path.Combine(Entry, "SKILL.md")))
            {
                string Identifier = SkillMirror.ReadPackage(Entry).Name;
                if (SkillNames.LegacyNameDict.TryGetValue(Identifier, out string? Renamed)) Identifier = Renamed;
                if (NameHashList.Contains(Identifier)) ReplacedList.Add(Name);
            }
            else if (File.Exists(Entry) && Name.EndsWith(".md", StringComparison.OrdinalIgnoreCase) && (NameHashList.Contains(Path.GetFileNameWithoutExtension(Name)) || SkillNames.LegacyNameDict.TryGetValue(Path.GetFileNameWithoutExtension(Name), out string? FlatName) && NameHashList.Contains(FlatName))) ReplacedList.Add(Name);
        }
        var PackageList = Mirror.PackageList.Select(Item => new SkillDistributionPackage(Item.Name, Item.DirectoryPath, SkillMirror.TreeHash(Item.DirectoryPath))).ToList();
        bool Changed = !ReplacedList.Order(StringComparer.Ordinal).SequenceEqual(PackageList.Select(Item => Item.Name).Order(StringComparer.Ordinal)) || PackageList.Any(Item => SkillMirror.TreeHash(Path.Combine(Mirror.DestinationRoot, Item.Name)) != Item.Hash);
        return new(Target with { PathValue = Mirror.DestinationRoot }, Mirror.SourceRoot, Mirror.SourceHash, Mirror.DestinationHash, PackageList, ReplacedList, Changed);
    }
    #endregion

    #region Apply
    /// <summary>
    /// 核对源和目标后快照分发 覆盖项先备份 失败时回滚
    /// </summary>
    public static void Apply(SkillDistributionPlan Plan, string BackupPath)
    {
        if (!Plan.HasChanges) return;
        if (ManagerPaths.Same(BackupPath, Plan.SourceRoot) || ManagerPaths.IsUnder(BackupPath, Plan.SourceRoot) || ManagerPaths.Same(BackupPath, Plan.Target.PathValue) || ManagerPaths.IsUnder(BackupPath, Plan.Target.PathValue)) throw new IOException("分发备份不能位于源或目标目录内");
        GlobalRules.EnsureWritablePath(Plan.Target.PathValue);
        GlobalRules.EnsureWritablePath(BackupPath);
        if (Directory.Exists(BackupPath) && Directory.EnumerateFileSystemEntries(BackupPath).Any()) throw new IOException("分发备份目录不是空目录");
        RequireCurrent(Plan);
        string Staging = Path.Combine(Path.GetTempPath(), "MmSkillDistribution-" + Guid.NewGuid().ToString("N"));
        var Transaction = new SkillMirrorTransaction(Plan.Target.PathValue, BackupPath);
        try
        {
            Directory.CreateDirectory(Staging);
            foreach (var Package in Plan.PackageList)
            {
                string Destination = Path.Combine(Staging, Package.Name);
                if (!ManagerPaths.IsUnder(Package.DirectoryPath, Plan.SourceRoot) || !ManagerPaths.IsUnder(Destination, Staging)) throw new IOException("Skill 分发路径越界 " + Package.Name);
                SkillMirror.CopyPackage(Package.DirectoryPath, Destination);
                if (SkillMirror.TreeHash(Destination) != Package.Hash) throw new IOException("Skill 分发快照发生变化 " + Package.Name);
            }
            RequireCurrent(Plan);
            Directory.CreateDirectory(Plan.Target.PathValue);
            Directory.CreateDirectory(BackupPath);
            foreach (string Name in Plan.ReplacedList) Transaction.BackupEntry(Path.Combine(Plan.Target.PathValue, Name));
            foreach (var Package in Plan.PackageList)
            {
                string Destination = Path.Combine(Plan.Target.PathValue, Package.Name);
                Transaction.RegisterCreated(Destination);
                SkillMirror.CopyPackage(Path.Combine(Staging, Package.Name), Destination);
                if (SkillMirror.TreeHash(Destination) != Package.Hash) throw new IOException("Skill 分发结果不一致 " + Package.Name);
            }
            Cleanup(Staging);
        }
        catch (Exception Error)
        {
            var ErrorList = new List<Exception> { Error };
            try { Transaction.Rollback(); } catch (Exception RollbackError) { ErrorList.Add(RollbackError); }
            try { Cleanup(Staging); } catch (Exception CleanupError) { ErrorList.Add(CleanupError); }
            if (ErrorList.Count > 1) throw new AggregateException("Skill 分发或恢复失败 备份 " + BackupPath, ErrorList);
            throw;
        }
    }

    private static void RequireCurrent(SkillDistributionPlan Plan)
    {
        if (SkillMirror.TreeHash(Plan.SourceRoot, true) != Plan.SourceHash || SkillMirror.TreeHash(Plan.Target.PathValue, true) != Plan.DestinationHash) throw new IOException("预览后 Skill 已变化 请重新预览");
    }

    private static void Cleanup(string Staging)
    {
        if (!ManagerPaths.IsUnder(Staging, Path.GetTempPath())) throw new IOException("分发临时目录越界");
        if (Directory.Exists(Staging)) Directory.Delete(Staging, true);
    }
    #endregion
}
