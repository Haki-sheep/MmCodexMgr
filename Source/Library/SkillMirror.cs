using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace CodexInstanceManager;

public sealed record SkillPackage(string Name, string Description, string DirectoryPath);
public sealed record SkillMirrorPlan(string SourceRoot, string DestinationRoot, string SourceHash, string DestinationHash, IReadOnlyList<SkillPackage> PackageList, string PackageHash, bool HasChanges);

public static class SkillMirror
{
    #region Preview
    /// <summary>
    /// 从 Skill 的 YAML 头读取可安装名称与用途
    /// </summary>
    public static SkillPackage ReadPackage(string DirectoryPath)
    {
        string Text = File.ReadAllText(Path.Combine(DirectoryPath, "SKILL.md"));
        var Header = Regex.Match(Text, @"\A\uFEFF?---\r?\n(?<body>[\s\S]*?)\r?\n---(?:\r?\n|$)");
        if (!Header.Success) throw new InvalidDataException("Skill 缺少 YAML 头 " + DirectoryPath);
        string Name = ReadValue(Header.Groups["body"].Value, "name");
        if (!Regex.IsMatch(Name, @"\A[a-zA-Z0-9][a-zA-Z0-9._-]*\z")) throw new InvalidDataException("Skill name 无效 " + DirectoryPath);
        return new(Name, ReadValue(Header.Groups["body"].Value, "description"), DirectoryPath);
    }

    private static string ReadValue(string Header, string Key)
    {
        var Match = Regex.Match(Header, @"(?m)^" + Key + @":\s*(.*)(?:\r?\n([ \t]+[^\r\n]*))*");
        if (!Match.Success) return "";
        string Value = Match.Groups[1].Value.Trim();
        if (Value is ">" or "|" or ">-" or "|-") Value = string.Join(" ", Match.Groups[2].Captures.Select(Item => Item.Value.Trim()));
        return Value.Trim('\'', '"');
    }

    /// <summary>
    /// 扫描自定义包 默认排除停用项 内置目录不参与
    /// </summary>
    public static List<SkillPackage> Scan(string Root, IReadOnlyCollection<string>? ExcludedNameList = null)
    {
        if (!Directory.Exists(Root)) throw new DirectoryNotFoundException("Skill 目录不存在 " + Root);
        return Directory.EnumerateDirectories(Root).Where(PathValue => !Path.GetFileName(PathValue).StartsWith('.'))
            .Select(ReadPackage).Where(Item => ExcludedNameList is null || !ExcludedNameList.Contains(Item.Name, StringComparer.OrdinalIgnoreCase)).OrderBy(Item => Item.Name, StringComparer.OrdinalIgnoreCase).ToList();
    }

    /// <summary>
    /// 按名称选择标准包并记录指纹 Replacement 用于明确选择安装版本
    /// </summary>
    public static SkillMirrorPlan Preview(string SourceRoot, string DestinationRoot, SkillPackage? Replacement = null, IReadOnlyCollection<string>? ExcludedNameList = null)
    {
        SourceRoot = ManagerPaths.Normalize(SourceRoot);
        DestinationRoot = ManagerPaths.Normalize(DestinationRoot);
        if (!ManagerPaths.Same(SourceRoot, DestinationRoot) && (ManagerPaths.IsUnder(SourceRoot, DestinationRoot) || ManagerPaths.IsUnder(DestinationRoot, SourceRoot)))
            throw new IOException("Skill 目录不能互相包含");
        EnsureRoot(DestinationRoot);
        var PackageList = new List<SkillPackage>();
        foreach (var Group in Scan(SourceRoot, ExcludedNameList).GroupBy(Item => Item.Name, StringComparer.OrdinalIgnoreCase))
        {
            if (Replacement is not null && string.Equals(Group.Key, Replacement.Name, StringComparison.OrdinalIgnoreCase)) continue;
            var Canonical = Group.FirstOrDefault(Item => string.Equals(Path.GetFileName(Item.DirectoryPath), Item.Name, StringComparison.OrdinalIgnoreCase));
            if (Canonical is null && Group.Select(Item => TreeHash(Item.DirectoryPath)).Distinct().Count() != 1)
                throw new InvalidDataException("同名 Skill 存在不同版本且无标准目录 请先选择版本 " + Group.Key);
            PackageList.Add(Canonical ?? Group.First());
        }
        if (Replacement is not null)
        {
            if (ExcludedNameList?.Contains(Replacement.Name, StringComparer.OrdinalIgnoreCase) == true) throw new InvalidOperationException("该 Skill 在本机排除名单中 " + Replacement.Name);
            PackageList.RemoveAll(Item => string.Equals(Item.Name, Replacement.Name, StringComparison.OrdinalIgnoreCase));
            PackageList.Add(Replacement);
        }
        var DesiredList = PackageList.Select(Item => Item.Name + "=" + TreeHash(Item.DirectoryPath)).Order(StringComparer.OrdinalIgnoreCase);
        var ExistingList = Entries(DestinationRoot).Select(Item => Path.GetFileName(Item) + "=" + (((File.GetAttributes(Item) & FileAttributes.ReparsePoint) != 0 || !Directory.Exists(Item)) ? "link-or-file" : TreeHash(Item))).Order(StringComparer.OrdinalIgnoreCase);
        return new(SourceRoot, DestinationRoot, TreeHash(SourceRoot, true), TreeHash(DestinationRoot, true), PackageList, PackageHash(PackageList), !DesiredList.SequenceEqual(ExistingList, StringComparer.Ordinal));
    }

    private static string PackageHash(IReadOnlyList<SkillPackage> PackageList) => string.Join("\n", PackageList.Select(Item => Item.Name + "=" + TreeHash(Item.DirectoryPath)));

    public static IEnumerable<string> Entries(string Root) => Directory.Exists(Root) ? Directory.EnumerateFileSystemEntries(Root).Where(Item => !string.Equals(Path.GetFileName(Item), ".system", StringComparison.OrdinalIgnoreCase)).Order(StringComparer.OrdinalIgnoreCase) : Array.Empty<string>();

    /// <summary>
    /// 生成内容指纹 技能根模式保留链接身份并忽略系统包
    /// </summary>
    public static string TreeHash(string Root, bool SkillsRoot = false)
    {
        using var Hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        if (!Directory.Exists(Root)) return "missing";
        void Visit(string DirectoryPath, string Relative, HashSet<string> AncestorHashList)
        {
            var Info = new DirectoryInfo(DirectoryPath);
            string Actual = ManagerPaths.Normalize(Info.ResolveLinkTarget(true)?.FullName ?? Info.FullName);
            if (!AncestorHashList.Add(Actual)) throw new IOException("Skill 包含循环链接 " + DirectoryPath);
            foreach (string Entry in Directory.EnumerateFileSystemEntries(Actual).Order(StringComparer.OrdinalIgnoreCase))
            {
                string Name = Path.GetFileName(Entry);
                if (Name is ".git" or "__pycache__" || SkillsRoot && Relative.Length == 0 && Name == ".system") continue;
                string Child = Relative + "/" + Name;
                Hash.AppendData(Encoding.UTF8.GetBytes(Child + "\0"));
                var Attributes = File.GetAttributes(Entry);
                if ((Attributes & FileAttributes.ReparsePoint) != 0)
                {
                    var Link = (Attributes & FileAttributes.Directory) != 0 ? (FileSystemInfo)new DirectoryInfo(Entry) : new FileInfo(Entry);
                    var Resolved = Link.ResolveLinkTarget(true);
                    if (SkillsRoot) Hash.AppendData(Encoding.UTF8.GetBytes("link=" + Link.LinkTarget + "\0"));
                    if (Resolved is not null && !Resolved.Exists)
                    {
                        Hash.AppendData(Encoding.UTF8.GetBytes("broken-link"));
                        continue;
                    }
                }
                if (Directory.Exists(Entry)) Visit(Entry, Child, new(AncestorHashList, StringComparer.OrdinalIgnoreCase));
                else Hash.AppendData(Encoding.UTF8.GetBytes(SettingsStore.FileHash(Entry) ?? throw new IOException("无法读取 Skill 文件 " + Entry)));
            }
        }
        Visit(Root, "", new(StringComparer.OrdinalIgnoreCase));
        return Convert.ToHexString(Hash.GetHashAndReset());
    }

    private static void EnsureRoot(string Root)
    {
        for (string? Parent = Root; Parent is not null; Parent = Path.GetDirectoryName(Parent))
            if (Directory.Exists(Parent) && (File.GetAttributes(Parent) & FileAttributes.ReparsePoint) != 0) throw new IOException("Skill 根路径不能经过链接 " + Parent);
    }
    #endregion

    #region Apply
    /// <summary>
    /// 校验预览并建立临时快照 原条目移入备份 返回可回滚事务
    /// </summary>
    public static SkillMirrorTransaction Apply(SkillMirrorPlan Plan, string BackupPath)
    {
        if (ManagerPaths.Same(BackupPath, Plan.DestinationRoot) || ManagerPaths.IsUnder(BackupPath, Plan.DestinationRoot) || ManagerPaths.Same(BackupPath, Plan.SourceRoot) || ManagerPaths.IsUnder(BackupPath, Plan.SourceRoot)) throw new IOException("Skill 备份不能位于源或目标目录内");
        if (Directory.Exists(BackupPath) && Directory.EnumerateFileSystemEntries(BackupPath).Any()) throw new IOException("Skill 备份目录不是空目录 " + BackupPath);
        EnsureRoot(Plan.DestinationRoot);
        if (TreeHash(Plan.SourceRoot, true) != Plan.SourceHash || TreeHash(Plan.DestinationRoot, true) != Plan.DestinationHash || PackageHash(Plan.PackageList) != Plan.PackageHash) throw new IOException("预览后 Skill 已变化 请重新预览");
        var Transaction = new SkillMirrorTransaction(Plan.DestinationRoot, BackupPath);
        if (!Plan.HasChanges) return Transaction;
        string Staging = Path.Combine(Path.GetTempPath(), "MmSkillMirror-" + Guid.NewGuid().ToString("N"));
        try
        {
            Directory.CreateDirectory(Staging);
            foreach (var Package in Plan.PackageList) CopyTree(Package.DirectoryPath, Path.Combine(Staging, Package.Name), new(StringComparer.OrdinalIgnoreCase));
            foreach (var Package in Plan.PackageList)
                if (TreeHash(Package.DirectoryPath) != TreeHash(Path.Combine(Staging, Package.Name))) throw new IOException("Skill 快照校验失败 " + Package.Name);
            if (TreeHash(Plan.SourceRoot, true) != Plan.SourceHash || TreeHash(Plan.DestinationRoot, true) != Plan.DestinationHash || PackageHash(Plan.PackageList) != Plan.PackageHash) throw new IOException("建立快照期间 Skill 已变化");
            Directory.CreateDirectory(Plan.DestinationRoot);
            Directory.CreateDirectory(BackupPath);
            foreach (string Entry in Entries(Plan.DestinationRoot).ToList()) Transaction.BackupEntry(Entry);
            foreach (var Package in Plan.PackageList)
            {
                string Target = Path.Combine(Plan.DestinationRoot, Package.Name);
                Transaction.RegisterCreated(Target);
                CopyTree(Path.Combine(Staging, Package.Name), Target, new(StringComparer.OrdinalIgnoreCase));
            }
            if (Entries(Plan.DestinationRoot).Count() != Plan.PackageList.Count || Plan.PackageList.Any(Package => TreeHash(Path.Combine(Plan.DestinationRoot, Package.Name)) != TreeHash(Path.Combine(Staging, Package.Name)))) throw new IOException("镜像结果与快照不一致");
            DeleteStaging(Staging);
            return Transaction;
        }
        catch (Exception Error)
        {
            var ErrorList = new List<Exception> { Error };
            try { Transaction.Rollback(); }
            catch (Exception RestoreError) { ErrorList.Add(RestoreError); }
            try { DeleteStaging(Staging); }
            catch (Exception CleanupError) { ErrorList.Add(CleanupError); }
            if (ErrorList.Count > 1) throw new AggregateException("Skill 同步 回滚或清理失败 备份 " + BackupPath, ErrorList);
            throw;
        }
    }

    private static void DeleteStaging(string Staging)
    {
        if (!ManagerPaths.IsUnder(Staging, Path.GetTempPath())) throw new IOException("非法临时目录 " + Staging);
        if (Directory.Exists(Staging)) Directory.Delete(Staging, true);
    }

    private static void CopyTree(string Source, string Destination, HashSet<string> AncestorHashList)
    {
        var Info = new DirectoryInfo(Source);
        string Actual = ManagerPaths.Normalize(Info.ResolveLinkTarget(true)?.FullName ?? Info.FullName);
        if (!AncestorHashList.Add(Actual)) throw new IOException("Skill 包含循环链接 " + Source);
        Directory.CreateDirectory(Destination);
        foreach (string Entry in Directory.EnumerateFileSystemEntries(Actual))
        {
            string Name = Path.GetFileName(Entry);
            if (Name is ".git" or "__pycache__") continue;
            string Target = Path.Combine(Destination, Name);
            if (Directory.Exists(Entry)) CopyTree(Entry, Target, new(AncestorHashList, StringComparer.OrdinalIgnoreCase));
            else File.Copy(Entry, Target);
        }
    }
    #endregion
}

public sealed class SkillMirrorTransaction
{
    /// <summary> 本次修改的技能根目录 </summary>
    private readonly string Root;
    /// <summary> 原条目备份目录 </summary>
    private readonly string BackupPath;
    /// <summary> 已移动的原条目 </summary>
    private readonly List<string> MovedList = new();
    /// <summary> 本次创建的目录 </summary>
    private readonly List<string> CreatedList = new();
    #region Transaction
    public SkillMirrorTransaction(string Root, string BackupPath) { this.Root = Root; this.BackupPath = BackupPath; }
    public void BackupEntry(string Entry)
    {
        string Target = Path.Combine(BackupPath, Path.GetFileName(Entry));
        if (!ManagerPaths.IsUnder(Entry, Root) || !ManagerPaths.IsUnder(Target, BackupPath)) throw new IOException("Skill 备份路径越界");
        if ((File.GetAttributes(Entry) & FileAttributes.Directory) != 0) Directory.Move(Entry, Target); else File.Move(Entry, Target);
        MovedList.Add(Entry);
    }
    public void RegisterCreated(string Entry) => CreatedList.Add(Entry);
    public void Rollback()
    {
        var ErrorList = new List<Exception>();
        foreach (string Entry in CreatedList.AsEnumerable().Reverse())
        {
            try
            {
                if (!ManagerPaths.IsUnder(Entry, Root)) throw new IOException("Skill 回滚路径越界 " + Entry);
                if (Directory.Exists(Entry)) Directory.Delete(Entry, true);
            }
            catch (Exception Error) { ErrorList.Add(Error); }
        }
        foreach (string Entry in MovedList.AsEnumerable().Reverse())
        {
            try
            {
                string Original = Path.Combine(BackupPath, Path.GetFileName(Entry));
                if ((File.GetAttributes(Original) & FileAttributes.Directory) != 0) Directory.Move(Original, Entry); else File.Move(Original, Entry);
            }
            catch (Exception Error) { ErrorList.Add(Error); }
        }
        if (ErrorList.Count > 0) throw new AggregateException("Skill 回滚失败 " + BackupPath, ErrorList);
    }
    #endregion
}
