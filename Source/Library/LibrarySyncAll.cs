namespace CodexInstanceManager;

public sealed record LibrarySyncTargetResult(string Target, string Kind, string PathValue, string Status, string? BackupPath = null, string? Detail = null);

public sealed record LibrarySyncResult(string SkillSource, string RuleSource, string Scope, IReadOnlyList<LibrarySyncTargetResult> TargetList)
{
    public bool Succeeded => TargetList.All(Item => Item.Status != "failed");
}

public static class LibrarySyncAll
{
    private sealed record Target(string Name, string PathValue, bool Available, RuleTarget? Rule = null, InstanceProfile? Instance = null)
    {
        public string Kind => Rule is null ? "skill" : "rule";
    }

    private sealed record Pending(int ResultIndex, Target Target, string BackupPath, RuleSyncPlan? Rules, SkillDistributionPlan? Skills);

    /// <summary>
    /// 先检查整批计划 再逐目标写入并保留每项结果及备份
    /// </summary>
    public static LibrarySyncResult Sync(ManagerSettings Settings, string Source = "primary", string Scope = "all", string? UserRoot = null, string? BackupRoot = null, Func<List<RunningInstance>>? ListRunning = null)
    {
        if (Scope is not ("codex" or "all")) throw new InvalidOperationException("--scope 必须为 codex 或 all");
        foreach (var Instance in Settings.InstanceList)
            if (!Path.IsPathFullyQualified(Instance.HomePath)) throw new IOException("Codex 配置目录必须为绝对路径 " + Instance.Name);

        string SkillSource = ManagerPaths.Normalize(Source switch
        {
            "primary" => Path.Combine(Settings.InstanceList.Single(Item => Item.IsPrimary).HomePath, "skills"),
            "library" => Settings.Library.SkillSource,
            _ => throw new InvalidOperationException("--source 必须为 primary 或 library")
        });
        string RuleSource = ManagerPaths.Normalize(Settings.Library.RuleSource);
        string Backup = ManagerPaths.Normalize(BackupRoot ?? ManagerPaths.BackupRoot);
        GlobalRules.EnsureWritablePath(SkillSource);
        GlobalRules.EnsureWritablePath(RuleSource);
        GlobalRules.EnsureWritablePath(Backup);
        if (File.Exists(Backup)) throw new IOException("备份目录被文件占用 " + Backup);
        SkillMirror.Scan(SkillSource, Settings.Library.ExcludedNameList);
        var RuleSourcePlan = GlobalRules.Preview(RuleSource, Array.Empty<RuleTarget>());

        var ResultList = new List<LibrarySyncTargetResult>();
        var PendingList = new List<Pending>();
        var SeenPathHashList = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        ListRunning ??= InstanceService.ListRunning;
        var PreviewRunning = new Lazy<List<RunningInstance>>(ListRunning);
        string BatchBackup = Path.Combine(Backup, "library-sync-" + Guid.NewGuid().ToString("N"));
        foreach (var Target in Discover(Settings, Scope, UserRoot))
        {
            string PathValue = ManagerPaths.Normalize(Target.PathValue);
            var Result = new LibrarySyncTargetResult(Target.Name, Target.Kind, PathValue, "pending");
            if (!Target.Available) Result = Result with { Status = "unavailable", Detail = "未发现目标配置目录" };
            else if (ManagerPaths.Same(PathValue, Target.Rule is null ? SkillSource : RuleSource)) Result = Result with { Status = "source", Detail = "该目标为同步源" };
            else if (!SeenPathHashList.Add(PathValue)) Result = Result with { Status = "duplicate", Detail = "同一路径已由其他目标处理" };
            else
            {
                try
                {
                    string TargetBackup = Path.Combine(BatchBackup, ResultList.Count.ToString());
                    var Plan = Preview(Settings, Target, ResultList.Count, TargetBackup, SkillSource, RuleSourcePlan);
                    if (Plan.Skills?.HasChanges == true || Plan.Rules?.ChangeList.Count > 0)
                    {
                        RequireStopped(Settings, Target, () => PreviewRunning.Value);
                        PendingList.Add(Plan);
                    }
                    else Result = Result with { Status = "unchanged" };
                }
                catch (Exception Failure) when (IsSyncFailure(Failure)) { Result = Result with { Status = "failed", Detail = Failure.Message }; }
            }
            ResultList.Add(Result);
        }

        bool PreflightFailed = ResultList.Any(Item => Item.Status == "failed");
        string? BlockReason = PreflightFailed ? "批量预检失败 未写入任何目标" : null;
        foreach (var Plan in PendingList)
        {
            var Result = ResultList[Plan.ResultIndex];
            if (BlockReason is not null)
            {
                ResultList[Plan.ResultIndex] = Result with { Status = "blocked", Detail = BlockReason };
                continue;
            }
            try
            {
                RequireStopped(Settings, Plan.Target, ListRunning);
                string SavedBackup = Apply(Plan);
                ResultList[Plan.ResultIndex] = Result with { Status = "applied", BackupPath = SavedBackup };
            }
            catch (Exception Failure) when (IsSyncFailure(Failure))
            {
                string? SavedBackup = Directory.Exists(Plan.BackupPath) ? Plan.BackupPath : null;
                string Detail = Failure is AggregateException Multiple
                    ? Failure.Message + Environment.NewLine + string.Join(Environment.NewLine, Multiple.Flatten().InnerExceptions.Select(Item => Item.Message))
                    : Failure.Message;
                ResultList[Plan.ResultIndex] = Result with { Status = "failed", BackupPath = SavedBackup, Detail = Detail };
                BlockReason = "前序目标写入失败 剩余目标未执行";
            }
        }
        return new(SkillSource, RuleSource, Scope, ResultList);
    }

    private static IEnumerable<Target> Discover(ManagerSettings Settings, string Scope, string? UserRoot)
    {
        var RuleList = GlobalRules.Scan(Settings, UserRoot);
        foreach (var Instance in Settings.InstanceList)
        {
            string Home = ManagerPaths.Normalize(Instance.HomePath);
            string Name = "Codex · " + Instance.Name;
            var Rule = RuleList.First(Item => Item.Agent.StartsWith("Codex · ", StringComparison.Ordinal) && ManagerPaths.Same(Path.GetDirectoryName(Item.PathValue)!, Home));
            yield return new(Name, Rule.PathValue, Rule.Available, Rule, Instance);
            yield return new(Name, Path.Combine(Home, "skills"), Rule.Available, Instance: Instance);
        }
        if (Scope == "codex") yield break;

        var SkillList = SkillDistribution.Scan(UserRoot);
        bool UsesShared = SkillList.Any(Item => Item.Available && Item.Agent is "cursor" or "dsh");
        foreach (var Skill in SkillList)
        {
            bool Available = Skill.Agent == "shared" ? UsesShared && Directory.Exists(Path.GetDirectoryName(Skill.PathValue)) : Skill.Available;
            yield return new(Skill.Agent, Skill.PathValue, Available);
        }
        foreach (var Rule in RuleList.Where(Item => Item.Agent is "Cursor" or "DeepSeek Harness" or "Claude Code" or "Antigravity / Gemini" or "Antigravity · 附加全局" || UsesShared && Item.Agent == "共享 Agents"))
            yield return new(Rule.Agent, Rule.PathValue, Rule.Available, Rule);
    }

    private static Pending Preview(ManagerSettings Settings, Target Target, int ResultIndex, string BackupPath, string SkillSource, RuleSyncPlan RuleSourcePlan)
    {
        if (Target.Rule is { } Rule)
        {
            if (Directory.Exists(Rule.PathValue)) throw new IOException("规则文件路径被目录占用 " + Rule.PathValue);
            var Plan = GlobalRules.Preview(RuleSourcePlan.SourcePath, new[] { Rule });
            if (Plan.SourceHash != RuleSourcePlan.SourceHash) throw new IOException("预检期间源规则已变化 " + RuleSourcePlan.SourcePath);
            return new(ResultIndex, Target, BackupPath, Plan, null);
        }
        if (File.Exists(Target.PathValue)) throw new IOException("Skill 目录被文件占用 " + Target.PathValue);
        if (ManagerPaths.IsUnder(BackupPath, SkillSource) || ManagerPaths.IsUnder(BackupPath, Target.PathValue)) throw new IOException("Skill 备份不能位于源或目标目录内 " + BackupPath);
        var Skills = SkillDistribution.Preview(SkillSource, new(Target.Name, Target.PathValue, true), Settings.Library.ExcludedNameList, RequirePortableNames: Target.Instance is null, PreserveLinks: true);
        return new(ResultIndex, Target, BackupPath, null, Skills);
    }

    private static string Apply(Pending Plan)
    {
        if (Plan.Rules is { } Rules)
        {
            if (Plan.Target.Instance is { } Instance)
            {
                string Override = Path.Combine(Instance.HomePath, "AGENTS.override.md");
                if (File.Exists(Override) != ManagerPaths.Same(Override, Plan.Target.PathValue))
                    throw new IOException("预检后有效规则路径已变化 " + Instance.Name);
            }
            return GlobalRules.Apply(Rules, Plan.BackupPath);
        }
        SkillDistribution.Apply(Plan.Skills!, Plan.BackupPath, PreserveLinks: true);
        return Plan.BackupPath;
    }

    private static void RequireStopped(ManagerSettings Settings, Target Target, Func<List<RunningInstance>> ListRunning)
    {
        if (Target.Instance is null) return;
        var InstanceList = Settings.InstanceList.Where(Item => !Item.IsPrimary && ManagerPaths.Same(Item.HomePath, Target.Instance.HomePath)).ToList();
        if (InstanceList.Count == 0) return;
        var Running = ListRunning();
        foreach (var Instance in InstanceList)
            if (InstanceService.Find(Instance, Running) is not null) throw new IOException("请先退出目标 Codex 实例再同步 " + Instance.Name);
    }

    private static bool IsSyncFailure(Exception Failure)
        => Failure is IOException or UnauthorizedAccessException or InvalidDataException or InvalidOperationException or AggregateException or System.Management.ManagementException;
}
