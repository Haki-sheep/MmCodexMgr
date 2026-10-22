using System.Text.Json;
using Tomlyn;
using Tomlyn.Model;

namespace CodexInstanceManager;

public sealed record AgentHealthCheck(string Name, bool Passed, string Detail);
public sealed record AgentHealthReport(string InstanceId, List<AgentHealthCheck> CheckList)
{
    public bool Healthy => CheckList.All(Check => Check.Passed);
}

public static class AgentDoctor
{
    public static async Task<AgentHealthReport> RunAsync(ManagerSettings Settings, string CliPath, string? Selector, CancellationToken Cancellation, Func<InstanceProfile, CancellationToken, Task<List<string>>>? Probe = null)
    {
        var Instance = AgentManagementService.ResolveInstance(Settings, Selector ?? Settings.SelectedId);
        var CheckList = new List<AgentHealthCheck>();
        if (File.Exists(Path.Combine(Instance.HomePath, ResponsesCompatProfile.FileName)))
        {
            try
            {
                ResponsesCompatProfile.Probe(Instance);
                CheckList.Add(new("Responses 协议适配", true, "本机服务与服务商地址一致"));
            }
            catch (Exception Error) when (Error is IOException or InvalidOperationException or JsonException or TomlException or KeyNotFoundException or HttpRequestException or TaskCanceledException)
            {
                if (Cancellation.IsCancellationRequested) throw;
                CheckList.Add(new("Responses 协议适配", false, Error.Message));
            }
        }
        CheckList.Add(new("CLI", File.Exists(CliPath), CliPath));
        CheckList.Add(new("会话数据库", File.Exists(Path.Combine(Instance.HomePath, "state_5.sqlite")), Instance.HomePath));
        try
        {
            RelayToolInstaller.RequireInstalled(Instance);
            var Config = Toml.ToModel(File.ReadAllText(Path.Combine(Instance.HomePath, "config.toml")));
            var Definition = (TomlTable)((TomlTable)Config["mcp_servers"])[RelayLimits.McpName];
            string Command = (string)Definition["command"];
            CheckList.Add(new("MCP 注册", ManagerPaths.Same(Command, CliPath), ManagerPaths.Same(Command, CliPath) ? "已指向当前 CLI" : "请重新安装 当前命令 " + Command));
        }
        catch (Exception Error) when (Error is IOException or InvalidOperationException or TomlException or KeyNotFoundException)
        {
            CheckList.Add(new("MCP 注册", false, Error.Message));
        }
        string SkillRoot = Path.Combine(Instance.HomePath, "skills", "moremore-work");
        try
        {
            if (!File.Exists(Path.Combine(SkillRoot, "SKILL.md"))) throw new FileNotFoundException("尚未安装 MoreMoreWork Skill");
            using var SkillConfig = JsonDocument.Parse(File.ReadAllText(Path.Combine(SkillRoot, "config.json")));
            string InstalledCli = SkillConfig.RootElement.GetProperty("cli_path").GetString()!;
            CheckList.Add(new("Skill 路径", ManagerPaths.Same(InstalledCli, CliPath), ManagerPaths.Same(InstalledCli, CliPath) ? SkillRoot : "Skill 指向其他 CLI " + InstalledCli));
        }
        catch (Exception Error) when (Error is IOException or JsonException or KeyNotFoundException)
        {
            CheckList.Add(new("Skill 路径", false, Error.Message));
        }
        try
        {
            var ToolList = await (Probe ?? DesktopRelayBridge.ProbeAsync)(Instance, Cancellation);
            string[] RequiredList = { "list_projects", "read_thread", "create_thread", "send_message_to_thread" };
            string[] MissingList = RequiredList.Except(ToolList).ToArray();
            CheckList.Add(new("实例与桌面桥接", MissingList.Length == 0, MissingList.Length == 0 ? "已连接 所需桌面工具齐全" : "当前桌面版本缺少工具 " + string.Join(" ", MissingList)));
        }
        catch (Exception Error) when (Error is IOException or InvalidOperationException or TimeoutException or System.ComponentModel.Win32Exception or OperationCanceledException)
        {
            if (Cancellation.IsCancellationRequested) throw;
            CheckList.Add(new("实例与桌面桥接", false, Error.Message));
        }
        return new(Instance.Id, CheckList);
    }
}
