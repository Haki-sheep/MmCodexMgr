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

    public static int ShowRunningPrimary()
    {
        var Profile = SettingsStore.Load().InstanceList.Single(Item => Item.IsPrimary);
        if (!ManagerPaths.Same(Profile.HomePath, ManagerPaths.DefaultHome)) throw new InvalidOperationException("主实例未使用默认目录");
        var Before = InstanceService.Find(Profile, InstanceService.ListRunning()) ?? throw new InvalidOperationException("测试要求主实例已运行");
        int ProcessId = InstanceService.Launch(Profile);
        var After = InstanceService.Find(Profile, InstanceService.ListRunning());
        if (ProcessId != Before.ProcessId || After?.ProcessId != Before.ProcessId || !InstanceWindowService.IsVisible(After.Window))
            throw new InvalidOperationException("原生激活未显示原主实例窗口");
        Console.WriteLine($"PASS native activation displayed the existing primary PID={ProcessId}");
        return 0;
    }

    private static void VerifyFreshLaunch()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexAppLaunchTests-" + Guid.NewGuid().ToString("N"));
        var Profile = new InstanceProfile { Name = "路径回归测试", HomePath = Path.Combine(Root, "home"), DataPath = Path.Combine(Root, "data") };
        var BeforeList = InstanceService.ListRunning();
        try
        {
            using var StartGate = new Barrier(2);
            var LaunchList = Enumerable.Range(0, 2).Select(_ => Task.Factory.StartNew(() =>
            {
                if (!StartGate.SignalAndWait(TimeSpan.FromSeconds(5))) throw new TimeoutException("并发启动测试未同步");
                return InstanceService.Launch(Profile);
            }, CancellationToken.None, TaskCreationOptions.LongRunning, TaskScheduler.Default)).ToArray();
            var ProcessIdList = Task.WhenAll(LaunchList).GetAwaiter().GetResult();
            int ProcessId = ProcessIdList[0];
            if (ProcessIdList[1] != ProcessId) throw new InvalidOperationException("FAILED: concurrent launch created multiple processes");
            using var DesktopProcess = Process.GetProcessById(ProcessId);
            var Timeout = Stopwatch.StartNew();
            while (Timeout.Elapsed < TimeSpan.FromSeconds(30))
            {
                if (DesktopProcess.HasExited) throw new InvalidOperationException("FAILED: new Codex process exited with code " + DesktopProcess.ExitCode);
                var RunningList = InstanceService.ListRunning();
                var Running = InstanceService.Find(Profile, RunningList);
                if (Running is not null && Running.ProcessId == ProcessId && Running.Window != IntPtr.Zero)
                {
                    if (BeforeList.Any(Item => RunningList.All(After => After.ProcessId != Item.ProcessId))) throw new InvalidOperationException("FAILED: an existing Codex instance exited during the launch test");
                    Console.WriteLine($"PASS package launch receipt and concurrent launch shared PID={ProcessId}; fresh window found; existing instances preserved");
                    return;
                }
                Thread.Sleep(250);
            }
            throw new TimeoutException("FAILED: new Codex main window did not appear; fixture=" + Root);
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("启动测试清理路径越界");
            foreach (var Running in InstanceService.ListRunning())
            {
                if (InstanceService.Find(Profile, new() { Running }) is null) continue;
                InstanceService.StopAsync(Profile, Running.ProcessId).GetAwaiter().GetResult();
            }
            var Cleanup = Stopwatch.StartNew();
            while (Directory.Exists(Root))
            {
                try { Directory.Delete(Root, true); }
                catch (IOException) when (Cleanup.Elapsed < TimeSpan.FromSeconds(5)) { Thread.Sleep(100); }
            }
        }
    }
}
