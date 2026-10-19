using System.Text;
using Tomlyn;
using Tomlyn.Model;

namespace CodexInstanceManager;

public static class RelayToolInstaller
{
    public static void RequireInstalled(InstanceProfile Instance)
    {
        var Config = Toml.ToModel(File.ReadAllText(Path.Combine(Instance.HomePath, "config.toml")));
        if (!Config.TryGetValue("mcp_servers", out object? Servers) || Servers is not TomlTable ServerDict ||
            !ServerDict.TryGetValue(RelayLimits.McpName, out object? Server) || Server is not TomlTable Definition ||
            !Definition.TryGetValue("command", out object? Command) || Command is not string FilePath || !File.Exists(FilePath) ||
            !Definition.TryGetValue("args", out object? Arguments) || Arguments is not TomlArray ArgumentList || !ValidArguments(ArgumentList, Instance.Id) ||
            Definition.TryGetValue("enabled", out object? Enabled) && Enabled is false)
            throw new InvalidOperationException("实例尚未安装有效联调工具 " + Instance.Name + " 请运行同目录 mmcodex.exe install --instance " + Instance.Id + " 并重启该实例");
    }

    private static bool ValidArguments(TomlArray Arguments, string InstanceId) =>
        Arguments.Count == 2 && Arguments[0] as string == "--relay-mcp" && Arguments[1] as string == InstanceId ||
        Arguments.Count == 3 && Arguments[0] as string == "mcp" && Arguments[1] as string == "--instance" && Arguments[2] as string == InstanceId;

    public static string Install(InstanceProfile Instance, string ExecutablePath, string? BackupRoot = null)
        => InstallCore(Instance, ExecutablePath, new TomlArray { "--relay-mcp", Instance.Id }, BackupRoot);

    public static string InstallCli(InstanceProfile Instance, string ExecutablePath, string? BackupRoot = null)
        => InstallCore(Instance, ExecutablePath, new TomlArray { "mcp", "--instance", Instance.Id }, BackupRoot);

    private static string InstallCore(InstanceProfile Instance, string ExecutablePath, TomlArray Arguments, string? BackupRoot)
    {
        if (!File.Exists(ExecutablePath)) throw new FileNotFoundException("管理器程序不存在", ExecutablePath);
        string ConfigPath = Path.Combine(Instance.HomePath, "config.toml");
        string Original = File.ReadAllText(ConfigPath);
        var Model = new TomlTable
        {
            ["mcp_servers"] = new TomlTable
            {
                [RelayLimits.McpName] = new TomlTable
                {
                    ["command"] = ExecutablePath,
                    ["args"] = Arguments,
                    ["startup_timeout_sec"] = 10
                }
            }
        };
        string Result = ConfigSync.MergeConfig(Toml.FromModel(Model), Original, new HashSet<string> { "mcp_servers" }, Instance.HomePath, Instance.HomePath);
        string BackupPath = Path.Combine(BackupRoot ?? ManagerPaths.BackupRoot, "relay-tools", Instance.Id + "-" + Guid.NewGuid().ToString("N") + ".toml");
        Directory.CreateDirectory(Path.GetDirectoryName(BackupPath)!);
        File.WriteAllText(BackupPath, Original, new UTF8Encoding(false));
        if (File.ReadAllText(ConfigPath) != Original) throw new IOException("实例配置已变化 请重新安装联调工具");
        SettingsStore.AtomicWrite(ConfigPath, Encoding.UTF8.GetBytes(Result));
        return BackupPath;
    }
}
