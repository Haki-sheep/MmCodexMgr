using System.Text.Json;
using System.Text.Json.Nodes;

namespace CodexInstanceManager;

public static class AgentCliDeployment
{
    public static string LoadPath() => Path.Combine(AppContext.BaseDirectory, "mmcodex.exe");

    public static object Install(InstanceProfile Instance, string CliPath, string? SkillSource)
    {
        if (!File.Exists(CliPath)) throw new FileNotFoundException("CLI 不存在", CliPath);
        string? SkillDestination = null;
        string? SkillBackup = null;
        if (SkillSource is not null)
        {
            string Source = ManagerPaths.Normalize(SkillSource);
            if (!File.Exists(Path.Combine(Source, "SKILL.md"))) throw new FileNotFoundException("Skill 缺少 SKILL.md", Source);
            SkillDestination = Path.Combine(Instance.HomePath, "skills", "moremore-work");
            if (ManagerPaths.Same(Source, SkillDestination) || ManagerPaths.IsUnder(Source, SkillDestination) || ManagerPaths.IsUnder(SkillDestination, Source)) throw new InvalidOperationException("Skill 源目录和安装目录不能相互包含");
            string Staging = SkillDestination + ".install-" + Guid.NewGuid().ToString("N");
            CopyDirectory(Source, Staging);
            if (Directory.Exists(SkillDestination))
            {
                SkillBackup = Path.Combine(ManagerPaths.BackupRoot, "skills", Guid.NewGuid().ToString("N"), "moremore-work");
                Directory.CreateDirectory(Path.GetDirectoryName(SkillBackup)!);
                Directory.Move(SkillDestination, SkillBackup);
            }
            Directory.Move(Staging, SkillDestination);
        }
        string ExistingSkill = Path.Combine(Instance.HomePath, "skills", "moremore-work");
        if (File.Exists(Path.Combine(ExistingSkill, "SKILL.md")))
        {
            string SkillConfigPath = Path.Combine(ExistingSkill, "config.json");
            var SkillConfig = File.Exists(SkillConfigPath)
                ? JsonNode.Parse(File.ReadAllText(SkillConfigPath))?.AsObject() ?? throw new InvalidDataException("Skill 配置为空 " + SkillConfigPath)
                : new JsonObject();
            SkillConfig["cli_path"] = ManagerPaths.Normalize(CliPath);
            SettingsStore.AtomicWrite(SkillConfigPath, JsonSerializer.SerializeToUtf8Bytes(SkillConfig));
            SkillDestination = ExistingSkill;
        }
        string ConfigBackup = RelayToolInstaller.InstallCli(Instance, CliPath);
        return new { installed = true, instance_id = Instance.Id, home = Instance.HomePath, cli_path = CliPath, skill_path = SkillDestination, skill_backup = SkillBackup, config_backup = ConfigBackup, reload = "配置已落盘 当前会话可立即使用 Skill CLI 新会话加载 MCP 目录迁移后在新位置重新运行 install 更新 Skill 与 MCP 路径" };
    }

    private static void CopyDirectory(string Source, string Destination)
    {
        Directory.CreateDirectory(Destination);
        foreach (string FilePath in Directory.EnumerateFiles(Source)) File.Copy(FilePath, Path.Combine(Destination, Path.GetFileName(FilePath)));
        foreach (string DirectoryPath in Directory.EnumerateDirectories(Source))
        {
            if ((File.GetAttributes(DirectoryPath) & FileAttributes.ReparsePoint) != 0) throw new InvalidOperationException("Skill 包不应包含目录链接 " + DirectoryPath);
            CopyDirectory(DirectoryPath, Path.Combine(Destination, Path.GetFileName(DirectoryPath)));
        }
    }
}
