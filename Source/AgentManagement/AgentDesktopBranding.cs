using System.Diagnostics;
using System.Management;

namespace CodexInstanceManager;

public sealed record RunningAgentDesktop(string Provider, InstanceProfile Profile, int ProcessId, long StartedAt, List<IntPtr> WindowList);

public static class AgentDesktopBranding
{
    public static string DisplayName(string Provider) => Provider switch
    {
        "codex" => "Codex",
        "claude" => "Claude",
        "dsh" => "DeepSeek Harness",
        "antigravity" => "Antigravity",
        "cursor" => "Cursor",
        _ => throw new ArgumentException("未知桌面 Agent " + Provider)
    };

    public static string? Identify(string ExecutablePath, string CommandLine)
    {
        if (CommandLine.Contains("--type=", StringComparison.OrdinalIgnoreCase) || CommandLine.Contains("dsh-desktop-host", StringComparison.OrdinalIgnoreCase)) return null;
        string Local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (ManagerPaths.Same(ExecutablePath, Path.Combine(Local, "Programs", "cursor", "Cursor.exe"))) return "cursor";
        if (ManagerPaths.Same(ExecutablePath, Path.Combine(Local, "Programs", "antigravity", "Antigravity.exe")))
            return System.Text.RegularExpressions.Regex.IsMatch(CommandLine, @"(?:^|\s)--import(?:=|\s|$)", System.Text.RegularExpressions.RegexOptions.IgnoreCase) ? null : "antigravity";
        if (ManagerPaths.Same(ExecutablePath, Path.Combine(Local, "Programs", "DeepSeek Harness", "DeepSeek Harness.exe"))) return "dsh";
        string ClaudeRoot = Path.Combine(Local, "AnthropicClaude");
        if (Path.GetFileName(ExecutablePath).Equals("claude.exe", StringComparison.OrdinalIgnoreCase) &&
            ManagerPaths.Same(Path.GetDirectoryName(Path.GetDirectoryName(ExecutablePath)!)!, ClaudeRoot) &&
            Path.GetFileName(Path.GetDirectoryName(ExecutablePath)!).StartsWith("app-", StringComparison.OrdinalIgnoreCase)) return "claude";
        return null;
    }

    public static List<RunningAgentDesktop> ListRunning()
    {
        var ProcessList = new List<(string Provider, int ProcessId, long StartedAt)>();
        using var Searcher = new ManagementObjectSearcher("SELECT ProcessId, ExecutablePath, CommandLine FROM Win32_Process WHERE Name='Cursor.exe' OR Name='Antigravity.exe' OR Name='claude.exe' OR Name='DeepSeek Harness.exe'");
        using var Processes = Searcher.Get();
        foreach (ManagementObject Item in Processes)
        {
            using (Item)
            {
                string PathValue = Item["ExecutablePath"] as string ?? "";
                if (PathValue.Length == 0) continue;
                string? Provider = Identify(PathValue, Item["CommandLine"] as string ?? "");
                if (Provider is null) continue;
                int ProcessId = Convert.ToInt32(Item["ProcessId"]);
                try
                {
                    using var Process = System.Diagnostics.Process.GetProcessById(ProcessId);
                    ProcessList.Add((Provider, ProcessId, Process.StartTime.ToUniversalTime().Ticks));
                }
                catch (ArgumentException) { }
            }
        }
        var Result = new List<RunningAgentDesktop>();
        var TrayOwnerHashList = AgentTrayBranding.FindHostProcessIds(ProcessList.Select(Item => Item.ProcessId).ToHashSet());
        foreach (var Group in ProcessList.GroupBy(Item => Item.Provider))
        {
            int Number = 1;
            foreach (var Process in Group.OrderBy(Item => Item.StartedAt).ThenBy(Item => Item.ProcessId))
            {
                var WindowList = InstanceWindowService.FindMainWindows(Process.ProcessId, "Chrome_WidgetWin_1");
                if (WindowList.Count == 0 && !TrayOwnerHashList.Contains(Process.ProcessId)) continue;
                string Badge = Number.ToString();
                var Profile = new InstanceProfile { Id = "agent-" + Process.Provider + "-" + Badge, Name = Process.Provider, Badge = Badge };
                Result.Add(new(Process.Provider, Profile, Process.ProcessId, Process.StartedAt, WindowList));
                Number++;
            }
        }
        return Result;
    }
}
