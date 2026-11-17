using CodexInstanceManager;
using Tomlyn;

internal static class LibraryTests
{
    private static int Count;

    public static int Run()
    {
        string Root = Path.Combine(Path.GetTempPath(), "MmLibraryTests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        try
        {
            VerifyMirror(Root);
            VerifyDistribution(Root);
            VerifyRules(Root);
            VerifyRollback(Root);
            VerifySyncAll(Root);
            VerifyCliAsync(Root).GetAwaiter().GetResult();
            Console.WriteLine($"PASS library {Count} assertions");
            return 0;
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("测试清理路径越界");
            Directory.Delete(Root, true);
        }
    }

    private static void VerifyMirror(string Root)
    {
        string Source = Path.Combine(Root, "source");
        string Target = Path.Combine(Root, "target");
        Package(Source, "one", "one", "current");
        Package(Source, "OldAlias", "one", "obsolete");
        Package(Source, "two", "two", "second");
        Package(Source, "discard", "image2-prompt", "removed");
        Package(Target, "extra", "extra", "target only");
        Package(Target, ".system", "built-in", "preserve");
        var ExcludedList = new[] { "image2-prompt" };
        Require(SkillMirror.Scan(Source).Any(Item => Item.Name == "image2-prompt"), "default supports arbitrary skills without this user's exclusions");
        var Plan = SkillMirror.Preview(Source, Target, ExcludedNameList: ExcludedList);
        Require(Plan.PackageList.Count == 2 && Plan.HasChanges, "dedupe canonical and exclude removed names");
        string Backup = Path.Combine(Root, "mirror-backup");
        var Transaction = SkillMirror.Apply(Plan, Backup);
        Require(File.ReadAllText(Path.Combine(Target, "one", "data.txt")) == "current", "canonical payload wins");
        Require(!Directory.Exists(Path.Combine(Target, "extra")) && Directory.Exists(Path.Combine(Backup, "extra")), "extra moved to backup");
        Require(File.Exists(Path.Combine(Target, ".system", "SKILL.md")), "system skills preserved");
        Require(!Directory.Exists(Path.Combine(Target, "OldAlias")), "aliases not copied");
        Require(!SkillMirror.Preview(Source, Target, ExcludedNameList: ExcludedList).HasChanges, "mirror idempotent");
        Transaction.Rollback();
        Require(File.Exists(Path.Combine(Target, "extra", "SKILL.md")) && !Directory.Exists(Path.Combine(Target, "one")), "transaction restores original entries");
        var Stale = SkillMirror.Preview(Source, Target, ExcludedNameList: ExcludedList);
        File.WriteAllText(Path.Combine(Source, "one", "data.txt"), "changed");
        Reject(() => SkillMirror.Apply(Stale, Path.Combine(Root, "stale")), "source change rejected");
        Stale = SkillMirror.Preview(Source, Target, ExcludedNameList: ExcludedList);
        File.WriteAllText(Path.Combine(Target, "extra", "data.txt"), "changed target");
        Reject(() => SkillMirror.Apply(Stale, Path.Combine(Root, "stale-target")), "target change rejected");
        string Self = Path.Combine(Root, "self");
        Package(Self, "Alias", "self-skill", "same-root");
        var SelfPlan = SkillMirror.Preview(Self, Self);
        SkillMirror.Apply(SelfPlan, Path.Combine(Root, "self-backup"));
        Require(File.ReadAllText(Path.Combine(Self, "self-skill", "data.txt")) == "same-root", "primary normalization snapshots before moving");
        string Foreign = Path.Combine(Root, "foreign");
        Package(Foreign, "anything", "third-party-new-skill", "not in original library");
        var Import = SkillMirror.Preview(Self, Self, SkillMirror.ReadPackage(Path.Combine(Foreign, "anything")));
        SkillMirror.Apply(Import, Path.Combine(Root, "import-backup"));
        Require(File.Exists(Path.Combine(Self, "self-skill", "data.txt")) && File.ReadAllText(Path.Combine(Self, "third-party-new-skill", "data.txt")) == "not in original library", "import arbitrary external packages preserves existing library packages");
        string Conflict = Path.Combine(Root, "conflict");
        Package(Conflict, "alias1", "conflict-skill", "a");
        Package(Conflict, "alias2", "conflict-skill", "b");
        Reject<InvalidDataException>(() => SkillMirror.Preview(Conflict, Target), "ambiguous versions rejected");
        string Config = ConfigSync.MergeConfig("model='source'\n[skills]\nconfig=[]\n", "model='target'\n[skills]\nextra='remove'\n", new() { "skills" }, Source, Target);
        Require(!Config.Contains("extra") && (string)Toml.ToModel(Config)["model"] == "target", "skills config replaced while model preserved");
    }

    private static void VerifyDistribution(string Root)
    {
        string Home = Path.Combine(Root, "distribution-home");
        string Source = Path.Combine(Root, "distribution-source");
        string Target = Path.Combine(Home, ".cursor", "skills");
        Package(Source, "mm-coding-fucker", "mm-coding-fucker", "new payload");
        Package(Source, "external-skill", "external-skill", "any third party source");
        Package(Target, "MmCodingFucker", "MmCodingFucker", "legacy");
        Package(Target, "alias", "MmCodingFucker", "duplicate alias");
        Package(Target, "preserve", "foreign-target-skill", "foreign");
        Package(Target, ".system", "builtin", "protected");
        File.WriteAllText(Path.Combine(Target, "MmCodingFucker.md"), "flat legacy");
        var Targets = SkillDistribution.Scan(Home);
        Require(Targets.Select(Item => Item.Agent).SequenceEqual(new[] { "cursor", "dsh", "shared", "antigravity", "claude" }), "skill targets include Claude and the existing destinations");
        Require(!Targets.Single(Item => Item.Agent == "claude").Available, "missing Claude configuration is explicit");
        string ClaudeRoot = Path.Combine(Home, ".claude");
        Directory.CreateDirectory(ClaudeRoot);
        var Claude = SkillDistribution.Scan(Home).Single(Item => Item.Agent == "claude");
        Require(Claude.Available && Claude.PathValue == Path.Combine(ClaudeRoot, "skills"), "Claude targets its personal skill directory");
        SkillDistribution.Apply(SkillDistribution.Preview(Source, Claude), Path.Combine(Root, "claude-distribution-backup"));
        Require(File.ReadAllText(Path.Combine(Claude.PathValue, "mm-coding-fucker", "data.txt")) == "new payload", "Claude receives the complete skill package");
        Require(Targets.Single(Item => Item.Agent == "cursor").Available && !Targets.Single(Item => Item.Agent == "dsh").Available, "missing DSH installation is explicit");
        var Cursor = Targets.Single(Item => Item.Agent == "cursor");
        var Plan = SkillDistribution.Preview(Source, Cursor);
        Require(Plan.HasChanges && Plan.PackageList.Count == 2 && Plan.ReplacedList.Count == 3, "distribution includes arbitrary source packages and recognizes aliases and flat skills");
        SkillDistribution.Apply(Plan, Path.Combine(Root, "distribution-backup"));
        Require(File.ReadAllText(Path.Combine(Target, "mm-coding-fucker", "data.txt")) == "new payload", "distribution copies canonical payload");
        Require(File.Exists(Path.Combine(Target, "preserve", "SKILL.md")) && File.Exists(Path.Combine(Target, ".system", "SKILL.md")), "distribution preserves target-only and system skills");
        Require(!Directory.Exists(Path.Combine(Target, "MmCodingFucker")) && !Directory.Exists(Path.Combine(Target, "alias")) && !File.Exists(Path.Combine(Target, "MmCodingFucker.md")), "old duplicate names leave active roots");
        Require(Directory.Exists(Path.Combine(Root, "distribution-backup", "MmCodingFucker")), "legacy skill is backed up");
        Require(!SkillDistribution.Preview(Source, Cursor).HasChanges, "distribution is repeatable without rewriting unchanged packages");
        var Stale = SkillDistribution.Preview(Source, Cursor);
        File.WriteAllText(Path.Combine(Source, "mm-coding-fucker", "data.txt"), "updated");
        Stale = Stale with { HasChanges = true };
        Reject<IOException>(() => SkillDistribution.Apply(Stale, Path.Combine(Root, "distribution-stale")), "changed source rejects distribution before writing");
        Plan = SkillDistribution.Preview(Source, Cursor);
        File.WriteAllText(Path.Combine(Target, "preserve", "data.txt"), "user edit");
        Reject<IOException>(() => SkillDistribution.Apply(Plan, Path.Combine(Root, "distribution-target-stale")), "target changes after preview reject distribution");
        Package(Source, "UpperCase", "UpperCase", "invalid identifier");
        Reject<InvalidDataException>(() => SkillDistribution.Preview(Source, Cursor), "unsupported identifier casing is surfaced rather than silently renamed");
        Require(AgentCli.Parse(new[] { "library-preview-agent-skills", "--agent", "dsh", "--source", "library", "--plan-file", Path.Combine(Root, "plan.json") }).Command == "library-preview-agent-skills", "CLI exposes distribution preview");
        Require(SkillNames.Collaboration == "ai-more-more-work", "installer and doctor use the renamed collaboration identity");
        Require(SkillDistribution.Scan(Home, Path.Combine(Home, "custom-dsh"), Path.Combine(Home, "custom-agents")).Single(Item => Item.Agent == "shared").PathValue == Path.Combine(Home, "custom-agents", "skills"), "custom shared root is respected");
    }

    private static void VerifyRules(string Root)
    {
        string Home = Path.Combine(Root, "home");
        string Codex = Path.Combine(Home, ".codex");
        Directory.CreateDirectory(Codex);
        File.WriteAllText(Path.Combine(Codex, "AGENTS.override.md"), "override");
        Directory.CreateDirectory(Path.Combine(Home, ".cursor"));
        var Settings = new ManagerSettings { InstanceList = new() { new() { HomePath = Codex, IsPrimary = true, Name = "primary" } } };
        var TargetList = GlobalRules.Scan(Settings, Home);
        Require(TargetList.Single(Item => Item.Agent.StartsWith("Codex")).PathValue.EndsWith("AGENTS.override.md"), "scan effective Codex override");
        Require(!TargetList.Single(Item => Item.Agent == "Claude Code").Available, "missing agents marked unavailable");
        Require(TargetList.Single(Item => Item.Agent == "WorkBuddy").Format == "manual", "unsupported global interface explicit");
        string Source = Path.Combine(Root, "global.md");
        File.WriteAllText(Source, "唯一来源\n保持中文\n");
        var SelectedList = TargetList.Where(Item => Item.Available && Item.Format != "manual").ToList();
        var Plan = GlobalRules.Preview(Source, SelectedList);
        Require(Plan.ChangeList.Count == 2 && Plan.ChangeList.Single(Item => Item.Target.Agent == "Cursor").ContentList.Length > 0, "preview md and mdc targets");
        string Backup = GlobalRules.Apply(Plan, Path.Combine(Root, "rule-backups"));
        Require(File.ReadAllText(Path.Combine(Backup, "0.md")) == "override", "rule backup preserves old content");
        Require(File.ReadAllText(SelectedList[1].PathValue).Contains("alwaysApply: true"), "Cursor metadata always applies");
        Require(GlobalRules.Preview(Source, SelectedList).ChangeList.Count == 0, "rule sync idempotent");
        File.WriteAllText(Source, "changed");
        var Stale = GlobalRules.Preview(Source, SelectedList);
        File.WriteAllText(SelectedList[0].PathValue, "concurrent");
        Reject(() => GlobalRules.Apply(Stale, Path.Combine(Root, "rule-backups")), "concurrent rule change rejected");
        Require(!Directory.Exists(Path.Combine(Home, ".claude")), "scan never creates agent roots");
        File.WriteAllText(Source, "");
        Reject<InvalidDataException>(() => GlobalRules.Preview(Source, SelectedList), "empty source cannot erase rules");
    }

    private static void VerifyRollback(string Root)
    {
        string Source = Path.Combine(Root, "rollback-source");
        string Target = Path.Combine(Root, "rollback-target");
        Package(Path.Combine(Source, "skills"), "one", "one", "source");
        Directory.CreateDirectory(Target);
        File.WriteAllText(Path.Combine(Source, "config.toml"), "[mcp_servers.x]\ncommand='new'\n");
        File.WriteAllText(Path.Combine(Target, "config.toml"), "model='preserve'\n");
        var Plan = ConfigSync.Preview(new() { HomePath = Source }, new() { HomePath = Target }, new() { Instructions = false });
        File.WriteAllText(Path.Combine(Source, "skills", "one", "data.txt"), "changed after preview");
        Reject(() => ConfigSync.Apply(Plan, Path.Combine(Root, "rollback-backup")), "skill failure propagates");
        Require(File.ReadAllText(Path.Combine(Target, "config.toml")) == "model='preserve'\n", "config rolls back when skill stage fails");
    }

    #region Batch Sync
    private static void VerifySyncAll(string Root)
    {
        string UserRoot = Path.Combine(Root, "all-user");
        string Primary = Path.Combine(UserRoot, "primary");
        string Secondary = Path.Combine(UserRoot, "secondary");
        string Data = Path.Combine(UserRoot, "secondary-data");
        string Backup = Path.Combine(Root, "all-backup");
        string Rule = Path.Combine(Primary, "AGENTS.md");
        string SecondaryRule = Path.Combine(Secondary, "AGENTS.override.md");
        string SkillSource = Path.Combine(Primary, "skills");
        string SecondarySkills = Path.Combine(Secondary, "skills");
        Package(SkillSource, "ai-more-more-work", "ai-more-more-work", "new");
        Package(SecondarySkills, "moremore-work", "moremore-work", "old");
        Package(SecondarySkills, "private", "private", "private");
        Package(SecondarySkills, ".system", "built-in", "system");
        File.WriteAllText(Rule, "batch rule");
        File.WriteAllText(SecondaryRule, "old override");
        File.WriteAllText(Path.Combine(Secondary, "AGENTS.md"), "inactive rule");
        File.WriteAllText(Path.Combine(Secondary, "auth.json"), "auth");
        foreach (string DirectoryName in new[] { ".cursor", ".dsh", ".claude", ".gemini", ".agents", ".config/opencode" })
            Directory.CreateDirectory(Path.Combine(UserRoot, DirectoryName));
        string SharedRule = Path.Combine(UserRoot, ".agents", "AGENTS.md");
        string OpenCodeRule = Path.Combine(UserRoot, ".config", "opencode", "AGENTS.md");
        File.WriteAllText(SharedRule, "old shared rule");
        File.WriteAllText(OpenCodeRule, "keep OpenCode rule");
        var Settings = new ManagerSettings
        {
            InstanceList = new()
            {
                new() { IsPrimary = true, Name = "Primary", HomePath = Primary },
                new() { Name = "Secondary", HomePath = Secondary, DataPath = Data },
                new() { Name = "Shared home", HomePath = Secondary, DataPath = Data }
            },
            Library = new() { RuleSource = Rule, SkillSource = SkillSource }
        };
        List<RunningInstance> Running() => new() { new(42, "ChatGPT.exe --user-data-dir=\"" + Data + "\"", IntPtr.Zero) };
        var Preflight = LibrarySyncAll.Sync(Settings, UserRoot: UserRoot, BackupRoot: Backup, ListRunning: Running);
        Require(!Preflight.Succeeded && Preflight.TargetList.Any(Item => Item.Status == "failed" && Item.Detail!.Contains("Secondary")), "live secondary blocks the batch preflight");
        Require(!Directory.Exists(Backup) && File.ReadAllText(SecondaryRule) == "old override" && !Directory.Exists(Path.Combine(UserRoot, ".claude", "skills")), "failed preflight writes no product files or backups");
        var Result = LibrarySyncAll.Sync(Settings, UserRoot: UserRoot, BackupRoot: Backup, ListRunning: () => new());
        Require(Result.Succeeded && Result.TargetList.Count(Item => Item.Status == "source") == 2, "the source rule and skills paths are skipped explicitly");
        Require(Result.TargetList.Count(Item => Item.Status == "duplicate") == 2, "duplicate Codex roots write each destination only once");
        Require(File.ReadAllText(SecondaryRule) == "batch rule" && File.ReadAllText(Path.Combine(Secondary, "AGENTS.md")) == "inactive rule", "batch updates only the effective Codex rule");
        Require(File.ReadAllText(Path.Combine(Secondary, "auth.json")) == "auth", "batch leaves account data untouched");
        Require(File.ReadAllText(Path.Combine(SecondarySkills, "ai-more-more-work", "data.txt")) == "new" && File.ReadAllText(Path.Combine(SecondarySkills, "private", "data.txt")) == "private" && File.ReadAllText(Path.Combine(SecondarySkills, ".system", "data.txt")) == "system", "batch preserves unrelated skills and .system");
        var SkillResult = Result.TargetList.Single(Item => Item.PathValue == SecondarySkills && Item.Status == "applied");
        Require(File.ReadAllText(Path.Combine(SkillResult.BackupPath!, "moremore-work", "data.txt")) == "old", "batch reports the original skill backup");
        var RuleResult = Result.TargetList.Single(Item => Item.PathValue == SecondaryRule && Item.Status == "applied");
        Require(File.ReadAllText(Path.Combine(RuleResult.BackupPath!, "0.md")) == "old override", "batch reports the original rule backup");
        Require(File.ReadAllText(Path.Combine(UserRoot, ".claude", "CLAUDE.md")) == "batch rule" && File.ReadAllText(Path.Combine(UserRoot, ".gemini", "GEMINI.md")) == "batch rule" && File.ReadAllText(Path.Combine(UserRoot, ".dsh", "AGENTS.md")) == "batch rule", "managed agents receive rules in their expected locations");
        Require(File.ReadAllText(Path.Combine(UserRoot, ".cursor", "rules", "AI-global-rules.mdc")).Contains("alwaysApply: true") && File.ReadAllText(SharedRule) == "batch rule", "Cursor format and existing shared rule are supported");
        Require(File.ReadAllText(OpenCodeRule) == "keep OpenCode rule", "batch leaves unmanaged agents untouched");
        var Repeat = LibrarySyncAll.Sync(Settings, UserRoot: UserRoot, BackupRoot: Backup, ListRunning: Running);
        Require(Repeat.Succeeded && Repeat.TargetList.All(Item => Item.Status != "applied"), "idempotent batch does not require closing an unchanged Codex profile");

        string LibraryRoot = Path.Combine(Root, "all-library");
        Package(LibraryRoot, "Local.Tool", "Local.Tool", "Codex-compatible name");
        Settings.Library.SkillSource = LibraryRoot;
        var CodexOnly = LibrarySyncAll.Sync(Settings, Source: "library", Scope: "codex", UserRoot: UserRoot, BackupRoot: Backup, ListRunning: () => new());
        Require(CodexOnly.Succeeded && File.Exists(Path.Combine(SecondarySkills, "Local.Tool", "SKILL.md")) && !File.Exists(Path.Combine(UserRoot, ".claude", "skills", "Local.Tool", "SKILL.md")), "Codex scope preserves Codex naming and skips external agents");

        string UpdatedRule = Path.Combine(Root, "all-updated-rule.md");
        File.WriteAllText(UpdatedRule, "updated rule");
        Settings.Library.RuleSource = UpdatedRule;
        int RunningCheck = 0;
        var Partial = LibrarySyncAll.Sync(Settings, Source: "library", Scope: "codex", UserRoot: UserRoot, BackupRoot: Backup, ListRunning: () => ++RunningCheck == 1 ? new() : Running());
        Require(!Partial.Succeeded && Partial.TargetList.Any(Item => Item.PathValue == Rule && Item.Status == "applied" && Item.BackupPath is not null) && Partial.TargetList.Any(Item => Item.PathValue == SecondaryRule && Item.Status == "failed"), "a process starting during a batch leaves a truthful partial result");
        Require(File.ReadAllText(Rule) == "updated rule" && File.ReadAllText(SecondaryRule) == "batch rule", "the execution-time process guard prevents updating the active destination");
        Settings.Library.RuleSource = Path.Combine(Root, "missing-rule.md");
        Reject<FileNotFoundException>(() => LibrarySyncAll.Sync(Settings, UserRoot: UserRoot, BackupRoot: Backup, ListRunning: () => new()), "batch fails if its rule source is missing");
    }
    #endregion

    private static void Package(string Root, string Folder, string Name, string Data)
    {
        string PathValue = Path.Combine(Root, Folder);
        Directory.CreateDirectory(PathValue);
        File.WriteAllText(Path.Combine(PathValue, "SKILL.md"), "---\nname: " + Name + "\ndescription: 测试描述\n---\n");
        File.WriteAllText(Path.Combine(PathValue, "data.txt"), Data);
    }

    private static async Task VerifyCliAsync(string Root)
    {
        string Home = Path.Combine(Root, "cli-home");
        Package(Path.Combine(Home, "skills"), "skill", "skill", "cli package");
        string Rule = Path.Combine(Root, "cli-rule.md");
        File.WriteAllText(Rule, "CLI 唯一来源");
        var Settings = new ManagerSettings { InstanceList = new() { new() { IsPrimary = true, Id = "cli-primary", Name = "CLI测试", HomePath = Home } }, Library = new() { RuleSource = Rule, SkillSource = Path.Combine(Home, "skills") } };
        async Task<(int Exit, string Output, string Error)> Call(params string[] ArgumentList)
        {
            using var Output = new MemoryStream();
            using var Error = new StringWriter();
            int Exit = await AgentCli.RunAsync(ArgumentList, Stream.Null, Output, Error, Environment.ProcessPath!, CancellationToken.None, LoadSettings: () => Settings,
                SyncLibrary: (Config, Source, Scope) => LibrarySyncAll.Sync(Config, Source, Scope, UserRoot: Root, BackupRoot: Path.Combine(Root, "cli-batch-backups"), ListRunning: () => new()));
            return (Exit, System.Text.Encoding.UTF8.GetString(Output.ToArray()), Error.ToString());
        }
        var Listed = await Call("library-skills");
        Require(Listed.Exit == 0 && Listed.Output.Contains("skill"), "CLI lists skills without manager or thread identity");
        string SkillPlan = Path.Combine(Root, "cli-skill-plan.json");
        var Preview = await Call("library-preview-skills", "--instance", "cli-primary", "--plan-file", SkillPlan);
        Require(Preview.Exit == 0 && File.Exists(SkillPlan), "CLI saves skill preview");
        var Duplicate = await Call("library-preview-skills", "--instance", "cli-primary", "--plan-file", SkillPlan);
        Require(Duplicate.Exit == 1 && Duplicate.Error.Length > 0, "CLI cannot silently overwrite an existing preview");
        File.WriteAllText(Path.Combine(Home, "skills", "skill", "data.txt"), "concurrent CLI edit");
        var Stale = await Call("library-apply", "--plan-file", SkillPlan);
        Require(Stale.Exit == 1 && System.Text.Json.JsonDocument.Parse(Stale.Error).RootElement.GetProperty("error").GetString()!.Contains("预览"), "CLI rejects a stale serialized skill plan");
        string RulePlan = Path.Combine(Root, "cli-rule-plan.json");
        Preview = await Call("library-preview-rules", "--agents", "Codex · CLI测试", "--plan-file", RulePlan);
        Require(Preview.Exit == 0 && Preview.Output.Contains("after"), "CLI rule preview exposes before and after content");
        var Plan = System.Text.Json.JsonSerializer.Deserialize<LibraryCliPlan>(File.ReadAllText(RulePlan))!;
        var TamperedRule = Plan.Rules!.ChangeList[0] with { ContentList = System.Text.Encoding.UTF8.GetBytes("tampered") };
        var Tampered = Plan with { Rules = Plan.Rules with { ChangeList = new[] { TamperedRule } } };
        File.WriteAllText(RulePlan, System.Text.Json.JsonSerializer.Serialize(Tampered));
        var Rejected = await Call("library-apply", "--plan-file", RulePlan);
        Require(Rejected.Exit == 1 && !File.Exists(Path.Combine(Home, "AGENTS.md")), "CLI rejects edited content instead of violating the unique source");
        string Foreign = Path.Combine(Root, "cli-foreign");
        Package(Foreign, "new", "another-users-skill", "independent");
        string ImportPlan = Path.Combine(Root, "cli-import-plan.json");
        Preview = await Call("library-preview-import", "--skill", Path.Combine(Foreign, "new"), "--plan-file", ImportPlan);
        Require(Preview.Exit == 0 && System.Text.Json.JsonSerializer.Deserialize<LibraryCliPlan>(File.ReadAllText(ImportPlan))!.Kind == "import", "CLI previews import of a skill outside the shipped collection");
        string DistributionFile = Path.Combine(Root, "cli-distribution-plan.json");
        Preview = await Call("library-preview-agent-skills", "--agent", "shared", "--plan-file", DistributionFile);
        Require(Preview.Exit == 0 && System.Text.Json.JsonSerializer.Deserialize<LibraryCliPlan>(File.ReadAllText(DistributionFile))!.Kind == "distribution", "CLI previews shared distribution without modifying the target");
        var DistributionPlan = System.Text.Json.JsonSerializer.Deserialize<LibraryCliPlan>(File.ReadAllText(DistributionFile))!;
        var InvalidTarget = DistributionPlan.Distribution!.Target with { PathValue = Path.Combine(Root, "unregistered-target") };
        DistributionPlan = DistributionPlan with { Distribution = DistributionPlan.Distribution with { Target = InvalidTarget } };
        File.WriteAllText(DistributionFile, System.Text.Json.JsonSerializer.Serialize(DistributionPlan));
        Rejected = await Call("library-apply", "--plan-file", DistributionFile);
        Require(Rejected.Exit == 1 && !Directory.Exists(InvalidTarget.PathValue), "CLI rejects altered distribution destination before creating files");
        var Batch = await Call("library-sync-all", "--scope", "codex");
        Require(Batch.Exit == 0 && Batch.Output.Contains("\"Succeeded\":true") && File.ReadAllText(Path.Combine(Home, "AGENTS.md")) == "CLI 唯一来源", "CLI performs batch sync in the fixture without manager or thread identity");
        File.Delete(Path.Combine(Home, "AGENTS.md"));
        Directory.CreateDirectory(Path.Combine(Home, "AGENTS.md"));
        Batch = await Call("library-sync-all", "--scope", "codex");
        Require(Batch.Exit == 1 && Batch.Output.Contains("\"Succeeded\":false") && Batch.Output.Contains("\"Status\":\"failed\""), "CLI reports a target preflight failure with structured output and exit 1");
        Require((await Call("library-git-pull")).Exit == 1 && (await Call("library-git-publish")).Exit == 1, "Git sync commands are removed");
    }
    private static void Reject(Action Action, string Message)
        => Reject<IOException>(Action, Message);
    private static void Reject<TException>(Action Action, string Message) where TException : Exception
    {
        bool Threw = false;
        try { Action(); } catch (TException) { Threw = true; }
        Require(Threw, Message);
    }
    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED " + Message);
        Count++;
    }
}
