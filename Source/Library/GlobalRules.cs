using System.Text;

namespace CodexInstanceManager;

public sealed record RuleTarget(string Agent, string PathValue, bool Available, string Format, string Note);
public sealed record RuleChange(RuleTarget Target, string? OriginalHash, string Before, byte[] ContentList);
public sealed record RuleSyncPlan(string SourcePath, string SourceHash, IReadOnlyList<RuleChange> ChangeList);

public static class GlobalRules
{
    #region Scan
    /// <summary>
    /// 只读发现已注册实例及常见 Agent 的全局规则位置
    /// </summary>
    public static List<RuleTarget> Scan(ManagerSettings Settings, string? UserRoot = null)
    {
        string Home = UserRoot ?? Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var ResultList = new List<RuleTarget>();
        foreach (var Profile in Settings.InstanceList)
        {
            string Root = ManagerPaths.Normalize(Profile.HomePath);
            string Override = Path.Combine(Root, "AGENTS.override.md");
            ResultList.Add(new("Codex · " + Profile.Name, File.Exists(Override) ? Override : Path.Combine(Root, "AGENTS.md"), Directory.Exists(Root), "md", File.Exists(Override) ? "已有 override 优先生效" : "实例全局规则"));
        }
        void Add(string Agent, string Root, string Relative, string Format, string Note)
        {
            ResultList.Add(new(Agent, Path.Combine(Root, Relative), Directory.Exists(Root), Format, Note));
        }
        Add("Cursor", Path.Combine(Home, ".cursor"), "rules/AI-global-rules.mdc", "mdc", "本机用户规则文件 账号规则另行管理");
        string DshRoot = UserRoot is null ? Environment.GetEnvironmentVariable("DSH_HOME") ?? Path.Combine(Home, ".dsh") : Path.Combine(Home, ".dsh");
        Add("DeepSeek Harness", DshRoot, "AGENTS.md", "md", "Harness 全局规则");
        string SharedRoot = UserRoot is null ? Environment.GetEnvironmentVariable("DSH_AGENTS_HOME") ?? Path.Combine(Home, ".agents") : Path.Combine(Home, ".agents");
        if (File.Exists(Path.Combine(SharedRoot, "AGENTS.md"))) Add("共享 Agents", SharedRoot, "AGENTS.md", "md", "DeepSeek 同时读取的共享全局规则");
        Add("Claude Code", Path.Combine(Home, ".claude"), "CLAUDE.md", "md", "用户全局记忆");
        string GeminiRoot = Path.Combine(Home, ".gemini");
        Add("Antigravity / Gemini", GeminiRoot, File.Exists(Path.Combine(GeminiRoot, "AGENTS.md")) ? "AGENTS.md" : "GEMINI.md", "md", "用户全局规则");
        foreach (string Relative in new[] { "GEMINI.md", "config/AGENTS.md", "config/GEMINI.md" })
            if (File.Exists(Path.Combine(GeminiRoot, Relative)) && !ResultList.Any(Item => ManagerPaths.Same(Item.PathValue, Path.Combine(GeminiRoot, Relative))))
                Add("Antigravity · 附加全局", GeminiRoot, Relative, "md", "已有全局文件 需核对避免冲突");
        Add("OpenCode", Path.Combine(Home, ".config", "opencode"), "AGENTS.md", "md", "用户全局规则");
        Add("CodeBuddy", Path.Combine(Home, ".codebuddy"), "rules/AI-global-rules.mdc", "mdc", "本机用户规则文件");
        ResultList.Add(new("WorkBuddy", "", Directory.Exists(Path.Combine(Home, ".workbuddy")), "manual", "未核实官方全局文件接口 请在软件设置导入源文档"));
        return ResultList.GroupBy(Item => Item.PathValue.Length > 0 ? ManagerPaths.Normalize(Item.PathValue) : Item.Agent, StringComparer.OrdinalIgnoreCase).Select(Group => Group.First()).ToList();
    }

    /// <summary>
    /// 以唯一源生成目标格式及覆盖预览 不写入目标
    /// </summary>
    public static RuleSyncPlan Preview(string SourcePath, IEnumerable<RuleTarget> TargetList)
    {
        string Source = ManagerPaths.Normalize(SourcePath);
        string SourceHash = SettingsStore.FileHash(Source) ?? throw new FileNotFoundException("全局规则源文件不存在", Source);
        string Body = File.ReadAllText(Source);
        if (string.IsNullOrWhiteSpace(Body)) throw new InvalidDataException("全局规则源文件为空");
        var ChangeList = new List<RuleChange>();
        foreach (var Target in TargetList)
        {
            if (!Target.Available || Target.Format == "manual") throw new InvalidOperationException("目标不支持文件同步 " + Target.Agent);
            if (ManagerPaths.Same(Source, Target.PathValue)) throw new IOException("规则源不能作为同步目标");
            EnsureWritablePath(Target.PathValue);
            string Content = Target.Format == "mdc" ? "---\ndescription: 全局编码与协作规范\nalwaysApply: true\n---\n\n" + Body : Body;
            byte[] ContentList = Encoding.UTF8.GetBytes(Content);
            string? OriginalHash = SettingsStore.FileHash(Target.PathValue);
            if (OriginalHash == Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(ContentList))) continue;
            ChangeList.Add(new(Target, OriginalHash, File.Exists(Target.PathValue) ? File.ReadAllText(Target.PathValue) : "", ContentList));
        }
        return new(Source, SourceHash, ChangeList);
    }

    public static string Describe(RuleSyncPlan Plan)
    {
        var Text = new StringBuilder("唯一来源  " + Plan.SourcePath + Environment.NewLine);
        foreach (var Change in Plan.ChangeList)
        {
            Text.AppendLine().AppendLine("━━ " + Change.Target.Agent + "  " + (Change.OriginalHash is null ? "新增" : "覆盖")).AppendLine(Change.Target.PathValue);
            Text.AppendLine("原文").AppendLine(Change.Before).AppendLine("替换为").AppendLine(Encoding.UTF8.GetString(Change.ContentList));
        }
        return Text.ToString();
    }

    internal static void EnsureWritablePath(string PathValue)
    {
        for (string? Current = ManagerPaths.Normalize(PathValue); Current is not null; Current = Path.GetDirectoryName(Current))
            if ((File.Exists(Current) || Directory.Exists(Current)) && (File.GetAttributes(Current) & FileAttributes.ReparsePoint) != 0)
                throw new IOException("规则路径经过链接 请先明确实际文件 " + Current);
    }
    #endregion

    #region Apply
    /// <summary>
    /// 核对预览指纹后备份写入 任一文件失败时回滚本次变更
    /// </summary>
    public static string Apply(RuleSyncPlan Plan, string BackupRoot)
    {
        if (SettingsStore.FileHash(Plan.SourcePath) != Plan.SourceHash) throw new IOException("预览后源规则已变化 请重新预览");
        foreach (var Change in Plan.ChangeList)
        {
            EnsureWritablePath(Change.Target.PathValue);
            if (SettingsStore.FileHash(Change.Target.PathValue) != Change.OriginalHash) throw new IOException("预览后目标规则已变化 " + Change.Target.PathValue);
        }
        string Backup = Path.Combine(BackupRoot, "rules-" + DateTime.Now.ToString("yyyyMMdd-HHmmss") + "-" + Guid.NewGuid().ToString("N")[..6]);
        Directory.CreateDirectory(Backup);
        var AppliedList = new List<(RuleChange Change, string BackupFile)>();
        try
        {
            foreach (var Change in Plan.ChangeList)
            {
                EnsureWritablePath(Change.Target.PathValue);
                if (SettingsStore.FileHash(Change.Target.PathValue) != Change.OriginalHash) throw new IOException("同步期间目标规则已变化 " + Change.Target.PathValue);
                string BackupFile = Path.Combine(Backup, AppliedList.Count + ".md");
                if (Change.OriginalHash is not null) File.Copy(Change.Target.PathValue, BackupFile);
                AppliedList.Add((Change, BackupFile));
                SettingsStore.AtomicWrite(Change.Target.PathValue, Change.ContentList);
            }
            File.WriteAllText(Path.Combine(Backup, "manifest.json"), System.Text.Json.JsonSerializer.Serialize(AppliedList.Select(Item => new { Destination = Item.Change.Target.PathValue, Item.BackupFile, Existed = Item.Change.OriginalHash is not null })));
            return Backup;
        }
        catch (Exception Error)
        {
            var ErrorList = new List<Exception> { Error };
            foreach (var Item in AppliedList.AsEnumerable().Reverse())
            {
                try
                {
                    EnsureWritablePath(Item.Change.Target.PathValue);
                    if (Item.Change.OriginalHash is null) File.Delete(Item.Change.Target.PathValue);
                    else SettingsStore.AtomicCopy(Item.BackupFile, Item.Change.Target.PathValue);
                }
                catch (Exception RestoreError) { ErrorList.Add(RestoreError); }
            }
            if (ErrorList.Count > 1) throw new AggregateException("规则同步及回滚失败 备份 " + Backup, ErrorList);
            throw new IOException("规则同步失败 已回滚 " + Error.Message, Error);
        }
    }
    #endregion
}
