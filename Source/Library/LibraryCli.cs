using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed record LibraryCliPlan(string Kind, SkillMirrorPlan? Skills, RuleSyncPlan? Rules, SkillPackage? ImportPackage = null);

public static class LibraryCli
{
    /// <summary>
    /// 执行源库命令 应用前核对已保存计划 不依赖联调会话身份
    /// </summary>
    public static async Task<object> ExecuteAsync(AgentCliInvocation Call, ManagerSettings Settings)
    {
        var Options = Call.OptionDict;
        string Required(string Name) => Options.GetValueOrDefault(Name) ?? throw new InvalidOperationException("缺少 --" + Name);
        string PrimarySkills() => Path.Combine(Settings.InstanceList.Single(Item => Item.IsPrimary).HomePath, "skills");
        string SourceSkills() => Options.GetValueOrDefault("source", "primary") switch
        {
            "primary" => PrimarySkills(),
            "library" => Settings.Library.SkillSource,
            _ => throw new InvalidOperationException("--source 必须为 primary 或 library")
        };
        switch (Call.Command)
        {
            case "library-skills":
                return SkillMirror.Scan(SourceSkills(), Settings.Library.ExcludedNameList);
            case "library-config":
                if (Options.TryGetValue("repository", out string? Repository))
                {
                    await LibraryGit.RunAsync(Repository, "rev-parse", "--show-toplevel");
                    Settings.Library.RepositoryPath = ManagerPaths.Normalize(Repository);
                }
                if (Options.TryGetValue("skill-source", out string? SkillSource)) { SkillMirror.Scan(SkillSource); Settings.Library.SkillSource = ManagerPaths.Normalize(SkillSource); }
                if (Options.TryGetValue("rule-source", out string? RuleSource)) { if (!File.Exists(RuleSource)) throw new FileNotFoundException("规则源不存在", RuleSource); Settings.Library.RuleSource = ManagerPaths.Normalize(RuleSource); }
                if (Options.TryGetValue("excluded", out string? Excluded)) Settings.Library.ExcludedNameList = Excluded == "none" ? new() : Excluded.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                if (Options.Count > 0) SettingsStore.Save(Settings);
                return Settings.Library;
            case "library-scan-rules":
                return GlobalRules.Scan(Settings).Select(Item => new { Item.Agent, path = Item.PathValue, Item.Available, Item.Format, Item.Note, exists = File.Exists(Item.PathValue) }).ToList();
            case "library-preview-skills":
            {
                var Destination = AgentManagementService.ResolveInstance(Settings, Required("instance"));
                var Plan = SkillMirror.Preview(SourceSkills(), Path.Combine(Destination.HomePath, "skills"), ExcludedNameList: Settings.Library.ExcludedNameList);
                Save(Required("plan-file"), new("skills", Plan, null));
                return new { plan_file = Required("plan-file"), Plan.HasChanges, source = Plan.SourceRoot, destination = Plan.DestinationRoot, packages = Plan.PackageList.Select(Item => Item.Name), current_entries = SkillMirror.Entries(Plan.DestinationRoot).Select(Path.GetFileName), behavior = "按 name 去重并镜像 目标多余项移入备份 保留 .system" };
            }
            case "library-preview-import":
            {
                var Package = SkillMirror.ReadPackage(Required("skill"));
                string Root = Settings.Library.SkillSource;
                var Plan = SkillMirror.Preview(Root, Root, Package, Settings.Library.ExcludedNameList);
                Save(Required("plan-file"), new("import", Plan, null, Package));
                return new { plan_file = Required("plan-file"), Package.Name, source = Package.DirectoryPath, destination = Root, Plan.HasChanges, behavior = "导入任意 Skill 到维护源库 同名替换并备份 其他包保留 不安装到实例" };
            }
            case "library-preview-rules":
            {
                var ScanList = GlobalRules.Scan(Settings);
                var SelectedList = new List<RuleTarget>();
                foreach (string Selector in Required("agents").Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
                {
                    var MatchList = ScanList.Where(Item => Item.Agent.Equals(Selector, StringComparison.OrdinalIgnoreCase) || Selector.Equals("codex", StringComparison.OrdinalIgnoreCase) && Item.Agent.StartsWith("Codex · ", StringComparison.Ordinal)).ToList();
                    if (MatchList.Count == 0) throw new InvalidOperationException("未知 Rule 目标 " + Selector);
                    SelectedList.AddRange(MatchList);
                }
                if (SelectedList.Count == 0) throw new InvalidOperationException("未选择 Rule 目标");
                var Plan = GlobalRules.Preview(Options.GetValueOrDefault("source", Settings.Library.RuleSource), SelectedList.DistinctBy(Item => Item.PathValue, StringComparer.OrdinalIgnoreCase));
                Save(Required("plan-file"), new("rules", null, Plan));
                return new { plan_file = Required("plan-file"), source = Plan.SourcePath, changes = Plan.ChangeList.Select(Item => new { Item.Target.Agent, path = Item.Target.PathValue, before = Item.Before, after = Encoding.UTF8.GetString(Item.ContentList) }) };
            }
            case "library-apply":
            {
                string PathValue = Required("plan-file");
                var Plan = JsonSerializer.Deserialize<LibraryCliPlan>(File.ReadAllText(PathValue)) ?? throw new InvalidDataException("预览计划为空");
                if (Plan.Kind is "skills" or "import" && Plan.Skills is { } Skills && Plan.Rules is null)
                {
                    var Destination = Settings.InstanceList.SingleOrDefault(Item => ManagerPaths.Same(Path.Combine(Item.HomePath, "skills"), Skills.DestinationRoot));
                    if (Plan.Kind == "skills" && Destination is null) throw new IOException("计划目标不是已注册实例");
                    if (Plan.Kind == "import" && (!ManagerPaths.Same(Skills.SourceRoot, Settings.Library.SkillSource) || !ManagerPaths.Same(Skills.DestinationRoot, Settings.Library.SkillSource) || Plan.ImportPackage is null)) throw new IOException("导入目标不是当前维护源库");
                    if (!ManagerPaths.Same(Skills.SourceRoot, PrimarySkills()) && !ManagerPaths.Same(Skills.SourceRoot, Settings.Library.SkillSource)) throw new IOException("计划源不是主实例或已配置源库");
                    var Replacement = Plan.Kind == "import" ? SkillMirror.ReadPackage(Plan.ImportPackage!.DirectoryPath) : null;
                    var Current = SkillMirror.Preview(Skills.SourceRoot, Skills.DestinationRoot, Replacement, Settings.Library.ExcludedNameList);
                    if (JsonSerializer.Serialize(Current) != JsonSerializer.Serialize(Skills)) throw new IOException("预览计划或 Skill 已变化 请重新预览");
                    if (Destination is not null && !Destination.IsPrimary && InstanceService.Find(Destination, InstanceService.ListRunning()) is not null) throw new IOException("请先退出目标 Codex 实例再同步");
                    string Backup = Path.Combine(ManagerPaths.BackupRoot, "cli-skills-" + Guid.NewGuid().ToString("N"));
                    SkillMirror.Apply(Skills, Backup);
                    return new { applied = true, kind = Plan.Kind, count = Skills.PackageList.Count, backup = Backup };
                }
                if (Plan.Kind == "rules" && Plan.Rules is { } Rules && Plan.Skills is null)
                {
                    var ScanList = GlobalRules.Scan(Settings);
                    foreach (var Change in Rules.ChangeList)
                        if (!ScanList.Any(Item => Item.Format == Change.Target.Format && Item.Available && ManagerPaths.Same(Item.PathValue, Change.Target.PathValue))) throw new IOException("规则目标已不在当前扫描结果中 " + Change.Target.PathValue);
                    var Current = GlobalRules.Preview(Rules.SourcePath, Rules.ChangeList.Select(Item => Item.Target));
                    if (JsonSerializer.Serialize(Current) != JsonSerializer.Serialize(Rules)) throw new IOException("预览计划或规则已变化 请重新预览");
                    string Backup = GlobalRules.Apply(Rules, ManagerPaths.BackupRoot);
                    return new { applied = true, kind = Plan.Kind, count = Rules.ChangeList.Count, backup = Backup };
                }
                throw new InvalidDataException("预览计划类型无效");
            }
            case "library-git-pull": return new { result = await LibraryGit.PullAsync(Settings.Library.RepositoryPath) };
            case "library-git-publish": return new { result = await LibraryGit.PublishAsync(Settings) };
            default: throw new InvalidOperationException("未知源库命令 " + Call.Command);
        }
    }

    private static void Save(string PathValue, LibraryCliPlan Plan)
    {
        if (!Path.IsPathFullyQualified(PathValue)) throw new IOException("预览文件必须使用绝对路径");
        using var Stream = new FileStream(PathValue, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        JsonSerializer.Serialize(Stream, Plan, new JsonSerializerOptions { WriteIndented = true });
    }
}
