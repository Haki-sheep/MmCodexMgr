using System.Text.Json;
using System.Text.Json.Nodes;

namespace CodexInstanceManager;

public static class AgentCliDeployment
{
    public const string FileName = "AIMoreMoreWork.Cli.exe";
    public static string LoadPath() => Path.Combine(AppContext.BaseDirectory, FileName);

    public static object Install(InstanceProfile Instance, string CliPath, string? SkillSource, string? BackupRoot = null)
    {
        if (!File.Exists(CliPath)) throw new FileNotFoundException("CLI 不存在", CliPath);
        string Backups = BackupRoot ?? ManagerPaths.BackupRoot;
        string Root = Path.Combine(Instance.HomePath, "skills");
        string Existing = Path.Combine(Root, SkillNames.Collaboration);
        string Bundled = Path.Combine(Path.GetDirectoryName(ManagerPaths.Normalize(CliPath))!, SkillNames.Collaboration);
        SkillSource ??= File.Exists(Path.Combine(Bundled, "SKILL.md")) ? Bundled
            : File.Exists(Path.Combine(Existing, "SKILL.md")) ? Existing : null;
        string ConfigBackup = "";
        void InstallMcp() => ConfigBackup = RelayToolInstaller.InstallCli(Instance, CliPath, Backups);
        SkillInstallation? Skill = null;
        if (SkillSource is null) InstallMcp();
        else Skill = InstallSkillCore(Root, CliPath, SkillSource, Backups, InstallMcp);
        return new { installed = true, instance_id = Instance.Id, home = Instance.HomePath, cli_path = CliPath, skill_path = Skill?.Path, skill_backup = Skill?.Backup, legacy_skill_backup = Skill?.LegacyBackup, config_backup = ConfigBackup, reload = "新会话重新加载 AIMoreMoreWork MCP 目录迁移后从新位置重新运行 install" };
    }

    public static string InstallSkill(string Root, string CliPath, string SkillSource, string? BackupRoot = null) =>
        InstallSkillCore(Root, CliPath, SkillSource, BackupRoot ?? ManagerPaths.BackupRoot, null).Path;

    private sealed record SkillInstallation(string Path, string? Backup, string? LegacyBackup);

    private static SkillInstallation InstallSkillCore(string Root, string CliPath, string SkillSource, string BackupRoot, Action? AfterInstall)
    {
        if (!File.Exists(CliPath)) throw new FileNotFoundException("CLI 不存在", CliPath);
        Root = ManagerPaths.Normalize(Root);
        string Source = ManagerPaths.Normalize(SkillSource);
        if (!File.Exists(Path.Combine(Source, "SKILL.md"))) throw new FileNotFoundException("Skill 缺少 SKILL.md", Source);
        string Destination = Path.Combine(Root, SkillNames.Collaboration);
        string Backup = Path.Combine(BackupRoot, "skills", Guid.NewGuid().ToString("N"));
        var PreviousList = SkillNames.LegacyCollaborationList.Append(SkillNames.Collaboration)
            .Select(Name => Path.Combine(Root, Name)).Where(Directory.Exists).ToList();
        foreach (string PathValue in PreviousList.Append(Destination).Append(Backup)) GlobalRules.EnsureWritablePath(PathValue);
        string? PreviousConfig = PreviousList.AsEnumerable().Reverse().Select(PathValue => Path.Combine(PathValue, "config.json")).FirstOrDefault(File.Exists);
        if (PreviousConfig is not null) GlobalRules.EnsureWritablePath(PreviousConfig);
        string Stage = Path.Combine(Path.GetTempPath(), "AIMoreMoreWork-Skill-" + Guid.NewGuid().ToString("N"));
        if (ManagerPaths.IsUnder(Stage, Source)) throw new IOException("Skill 源目录包含安装临时目录 " + Source);
        var Transaction = new SkillMirrorTransaction(Root, Backup);
        try
        {
            CopyDirectory(Source, Stage);
            string ConfigFile = Path.Combine(Stage, "config.json");
            string? InputFile = PreviousConfig ?? (File.Exists(ConfigFile) ? ConfigFile : null);
            var Config = InputFile is null ? new JsonObject() : JsonNode.Parse(File.ReadAllText(InputFile))?.AsObject()
                ?? throw new InvalidDataException("Skill 配置为空 " + InputFile);
            Config["cli_path"] = ManagerPaths.Normalize(CliPath);
            File.WriteAllBytes(ConfigFile, JsonSerializer.SerializeToUtf8Bytes(Config));
            Directory.CreateDirectory(Root);
            if (PreviousList.Count != 0) Directory.CreateDirectory(Backup);
            foreach (string PathValue in PreviousList) Transaction.BackupEntry(PathValue);
            Transaction.RegisterCreated(Destination);
            CopyDirectory(Stage, Destination);
            if (SkillMirror.TreeHash(Stage) != SkillMirror.TreeHash(Destination)) throw new IOException("Skill 安装校验失败 " + Destination);
            AfterInstall?.Invoke();
            string? Legacy = PreviousList.Select(PathValue => Path.GetFileName(PathValue)!).FirstOrDefault(SkillNames.LegacyCollaborationList.Contains);
            return new(Destination, PreviousList.Contains(Destination) ? Path.Combine(Backup, SkillNames.Collaboration) : null,
                Legacy is null ? null : Path.Combine(Backup, Legacy));
        }
        catch (Exception Error)
        {
            try { Transaction.Rollback(); }
            catch (Exception RollbackError) { throw new AggregateException("Skill 安装和回滚均失败 " + Backup, Error, RollbackError); }
            throw;
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Stage, Path.GetTempPath())) throw new IOException("Skill 临时目录越界");
            if (Directory.Exists(Stage)) Directory.Delete(Stage, true);
        }
    }

    private static void CopyDirectory(string Source, string Destination)
    {
        Directory.CreateDirectory(Destination);
        foreach (string FilePath in Directory.EnumerateFiles(Source))
        {
            if ((File.GetAttributes(FilePath) & FileAttributes.ReparsePoint) != 0) throw new InvalidOperationException("Skill 包不应包含文件链接 " + FilePath);
            File.Copy(FilePath, Path.Combine(Destination, Path.GetFileName(FilePath)));
        }
        foreach (string DirectoryPath in Directory.EnumerateDirectories(Source))
        {
            if ((File.GetAttributes(DirectoryPath) & FileAttributes.ReparsePoint) != 0) throw new InvalidOperationException("Skill 包不应包含目录链接 " + DirectoryPath);
            CopyDirectory(DirectoryPath, Path.Combine(Destination, Path.GetFileName(DirectoryPath)));
        }
    }
}
