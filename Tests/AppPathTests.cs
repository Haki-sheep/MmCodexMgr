using System.Diagnostics;
using CodexInstanceManager;

internal static class AppPathTests
{
    public static int Run(bool VerifyLaunch)
    {
        try
        {
            var Info = new ProcessStartInfo("powershell.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
            Info.ArgumentList.Add("-NoProfile");
            Info.ArgumentList.Add("-NonInteractive");
            Info.ArgumentList.Add("-Command");
            Info.ArgumentList.Add("$ErrorActionPreference = 'Stop'; Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1 -ExpandProperty InstallLocation");
            using var Lookup = Process.Start(Info) ?? throw new IOException("无法查询测试所需的安装路径");
            string InstallPath = Lookup.StandardOutput.ReadToEnd().Trim();
            string Error = Lookup.StandardError.ReadToEnd();
            Lookup.WaitForExit();
            if (Lookup.ExitCode != 0 || InstallPath.Length == 0) throw new IOException("未获取到已注册的 Codex 安装包 " + Error);
            string ExpectedPath = Path.Combine(InstallPath, "app", "ChatGPT.exe");
            string ActualPath = InstanceService.ResolveAppPath();
            if (!ManagerPaths.Same(ExpectedPath, ActualPath)) throw new InvalidOperationException($"FAILED: registered={ExpectedPath}; resolved={ActualPath}");
            Console.WriteLine("PASS registered Codex app path: " + ActualPath);
            if (VerifyLaunch) VerifyFreshLaunch();
            return 0;
        }
        catch (Exception Error) { Console.Error.WriteLine(Error); return 1; }
    }

    private static void VerifyFreshLaunch()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexAppLaunchTests-" + Guid.NewGuid().ToString("N"));
        var Profile = new InstanceProfile { Name = "路径回归测试", HomePath = Path.Combine(Root, "home"), DataPath = Path.Combine(Root, "data") };
        var BeforeList = InstanceService.ListRunning();
        int ProcessId = InstanceService.Launch(Profile);
        using var DesktopProcess = Process.GetProcessById(ProcessId);
        try
        {
            var Timeout = Stopwatch.StartNew();
            while (Timeout.Elapsed < TimeSpan.FromSeconds(30))
            {
                if (DesktopProcess.HasExited) throw new InvalidOperationException("FAILED: new Codex process exited with code " + DesktopProcess.ExitCode);
                var RunningList = InstanceService.ListRunning();
                var Running = InstanceService.Find(Profile, RunningList);
                if (Running is not null && Running.ProcessId == ProcessId && Running.Window != IntPtr.Zero)
                {
                    if (BeforeList.Any(Item => RunningList.All(After => After.ProcessId != Item.ProcessId))) throw new InvalidOperationException("FAILED: an existing Codex instance exited during the launch test");
                    Console.WriteLine($"PASS fresh Codex window PID={ProcessId}; existing instances preserved; fixture={Root}");
                    return;
                }
                Thread.Sleep(250);
            }
            throw new TimeoutException("FAILED: new Codex main window did not appear; fixture=" + Root);
        }
        finally
        {
            if (!DesktopProcess.HasExited) { DesktopProcess.Kill(true); DesktopProcess.WaitForExit(); }
        }
    }
}
