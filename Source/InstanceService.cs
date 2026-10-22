using System.Diagnostics;
using System.Management;
using System.Runtime.InteropServices;
using System.Text.Json.Nodes;

namespace CodexInstanceManager;

public sealed record RunningInstance(int ProcessId, string CommandLine, IntPtr Window);

public static class InstanceService
{
    #region Launch
    public static List<RunningInstance> ListRunning()
    {
        var ResultList = new List<RunningInstance>();
        using var Searcher = new ManagementObjectSearcher("SELECT ProcessId, CommandLine, ExecutablePath FROM Win32_Process WHERE Name='ChatGPT.exe'");
        using var Processes = Searcher.Get();
        foreach (ManagementObject Item in Processes)
        {
            using (Item)
            {
                string Command = Item["CommandLine"] as string ?? "";
                string ExecutablePath = Item["ExecutablePath"] as string ?? "";
                if (!ExecutablePath.Contains("OpenAI.Codex_", StringComparison.OrdinalIgnoreCase)) continue;
                if (Command.Contains("--type=", StringComparison.OrdinalIgnoreCase)) continue;
                int ProcessId = Convert.ToInt32(Item["ProcessId"]);
                try
                {
                    using var RunningProcess = Process.GetProcessById(ProcessId);
                    if (!RunningProcess.HasExited)
                        ResultList.Add(new RunningInstance(ProcessId, Command, InstanceWindowService.FindMainWindow(ProcessId, "Chrome_WidgetWin_1")));
                }
                catch (ArgumentException) { }
            }
        }
        return ResultList;
    }

    public static RunningInstance? Find(InstanceProfile Profile, List<RunningInstance> RunningList)
    {
        foreach (var Running in RunningList)
        {
            var Match = System.Text.RegularExpressions.Regex.Match(Running.CommandLine, "--user-data-dir(?:=|\\s+)(?:\"([^\"]+)\"|([^\\s]+))");
            if (Profile.IsPrimary && !Match.Success) return Running;
            if (!Profile.IsPrimary && Match.Success && ManagerPaths.Same(Match.Groups[1].Success ? Match.Groups[1].Value : Match.Groups[2].Value, Profile.DataPath)) return Running;
        }
        return null;
    }

    public static string ResolveAppPath()
    {
        foreach (var RunningProcess in Process.GetProcessesByName("ChatGPT"))
        {
            using (RunningProcess)
            {
                string? Candidate = RunningProcess.MainModule?.FileName;
                if (Candidate is not null && Candidate.Contains("OpenAI.Codex_", StringComparison.OrdinalIgnoreCase)) return Candidate;
            }
        }
        var Info = new ProcessStartInfo("powershell.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
        Info.ArgumentList.Add("-NoProfile");
        Info.ArgumentList.Add("-NonInteractive");
        Info.ArgumentList.Add("-Command");
        Info.ArgumentList.Add("(Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1 -ExpandProperty InstallLocation)");
        using var LookupProcess = Process.Start(Info) ?? throw new IOException("无法查询 Codex 安装目录");
        string DirectoryPath = LookupProcess.StandardOutput.ReadToEnd().Trim();
        string Error = LookupProcess.StandardError.ReadToEnd();
        LookupProcess.WaitForExit();
        if (LookupProcess.ExitCode != 0) throw new IOException("查询 Codex 安装目录失败 " + Error);
        string AppPath = Path.Combine(DirectoryPath, "app", "ChatGPT.exe");
        if (!File.Exists(AppPath)) throw new FileNotFoundException("未找到 Codex 桌面应用 请先安装或启动 Codex", AppPath);
        return AppPath;
    }

    public static int Launch(InstanceProfile Profile)
    {
        ResponsesCompatProfile.EnsureRunning(Profile, AgentCliDeployment.LoadPath());
        var Existing = Find(Profile, ListRunning());
        if (Existing is not null)
        {
            InstanceWindowService.ShowMainWindow(Existing.ProcessId, Existing.Window);
            return Existing.ProcessId;
        }
        Directory.CreateDirectory(Profile.HomePath);
        var Info = new ProcessStartInfo(ResolveAppPath()) { UseShellExecute = false };
        Info.WorkingDirectory = Path.GetDirectoryName(Info.FileName)!;
        foreach (string Key in Info.Environment.Keys.ToArray())
            if (Key.StartsWith("CODEX_", StringComparison.OrdinalIgnoreCase) || Key is "OPENAI_API_KEY" or "ELECTRON_RUN_AS_NODE" or "NODE_OPTIONS" or "NODE_CHANNEL_FD") Info.Environment.Remove(Key);
        Info.Environment["CODEX_HOME"] = Profile.HomePath;
        if (!Profile.IsPrimary)
        {
            Directory.CreateDirectory(Profile.DataPath);
            Info.Environment["CODEX_ELECTRON_USER_DATA_PATH"] = Profile.DataPath;
            Info.ArgumentList.Add("--user-data-dir=" + Profile.DataPath);
        }
        using var DesktopProcess = Process.Start(Info) ?? throw new IOException("Codex 桌面应用启动失败");
        return DesktopProcess.Id;
    }

    /// <summary>
    /// 结束所选实例及其子进程 仅由用户确认后的结束操作调用
    /// </summary>
    public static async Task StopAsync(InstanceProfile Profile, int ExpectedProcessId)
    {
        var Existing = Find(Profile, ListRunning());
        if (Existing is null || Existing.ProcessId != ExpectedProcessId)
            throw new InvalidOperationException("所选实例进程已变化 请刷新后重试");
        using var RunningProcess = Process.GetProcessById(Existing.ProcessId);
        RunningProcess.Kill(true);
        await RunningProcess.WaitForExitAsync();
    }

    public static string CreateShortcut(InstanceProfile Profile)
    {
        string ManagerExe = Environment.ProcessPath ?? throw new IOException("无法确定管理器位置");
        string ShortcutPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Codex - " + SafeFileName(Profile.Name) + ".lnk");
        object Shell = Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell")!)!;
        try
        {
            dynamic Shortcut = ((dynamic)Shell).CreateShortcut(ShortcutPath);
            try
            {
                Shortcut.TargetPath = ManagerExe;
                Shortcut.Arguments = "--launch " + Profile.Id;
                Shortcut.WorkingDirectory = AppContext.BaseDirectory;
                Shortcut.IconLocation = BrandingService.GetIconPath(Profile) + ",0";
                Shortcut.Description = "启动独立 Codex 实例 " + Profile.Name;
                Shortcut.Save();
            }
            finally { Marshal.FinalReleaseComObject(Shortcut); }
        }
        finally { Marshal.FinalReleaseComObject(Shell); }
        return ShortcutPath;
    }

    private static string SafeFileName(string Value) => string.Concat(Value.Select(Character => Path.GetInvalidFileNameChars().Contains(Character) ? '-' : Character));
    #endregion

    #region CC Switch
    public static string ReadCcTarget(string? FilePath = null)
    {
        string PathValue = FilePath ?? ManagerPaths.CcSettingsPath;
        if (!File.Exists(PathValue)) return "尚未安装 CC Switch";
        var Settings = JsonNode.Parse(File.ReadAllText(PathValue)) ?? throw new InvalidDataException("CC Switch 设置为空");
        return Settings["codexConfigDir"]?.GetValue<string>() ?? ManagerPaths.DefaultHome;
    }

    public static string WriteCcTarget(string HomePath, string FilePath, string BackupRoot)
    {
        string Original = File.ReadAllText(FilePath);
        var Settings = JsonNode.Parse(Original)?.AsObject() ?? throw new InvalidDataException("CC Switch 设置格式不正确");
        string BackupPath = Path.Combine(BackupRoot, "cc-switch-" + DateTime.Now.ToString("yyyyMMdd-HHmmss") + "-" + Guid.NewGuid().ToString("N")[..6] + ".json");
        Directory.CreateDirectory(BackupRoot);
        File.WriteAllText(BackupPath, Original);
        Settings["codexConfigDir"] = ManagerPaths.Normalize(HomePath);
        if (File.ReadAllText(FilePath) != Original) throw new IOException("CC Switch 设置已变化 请重试");
        SettingsStore.AtomicWrite(FilePath, System.Text.Encoding.UTF8.GetBytes(Settings.ToJsonString(new() { WriteIndented = true })));
        return BackupPath;
    }

    public static async Task SwitchCcAsync(InstanceProfile Profile)
    {
        Directory.CreateDirectory(Profile.HomePath);
        string? AppPath = null;
        foreach (var Running in Process.GetProcessesByName("cc-switch"))
        {
            using (Running)
            {
                AppPath ??= Running.MainModule?.FileName;
                Running.CloseMainWindow();
                await Task.Delay(1200);
                if (!Running.HasExited) Running.Kill(true);
                await Running.WaitForExitAsync();
            }
        }
        string InstalledPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "CC Switch", "cc-switch.exe");
        AppPath ??= File.Exists(InstalledPath) ? InstalledPath : null;
        WriteCcTarget(Profile.HomePath, ManagerPaths.CcSettingsPath, ManagerPaths.BackupRoot);
        if (AppPath is not null) Process.Start(new ProcessStartInfo(AppPath) { UseShellExecute = true });
    }
    #endregion
}
