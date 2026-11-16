using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using CodexInstanceManager;

internal static class WindowTests
{
    #region 窗口恢复回归
    /// <summary>
    /// 使用独立消息线程验证隐藏窗口定位与跨线程恢复
    /// </summary>
    public static void Run()
    {
        var Ready = new TaskCompletionSource<Form>(TaskCreationOptions.RunContinuationsAsynchronously);
        var UiThread = new Thread(() =>
        {
            try
            {
                using var Fixture = new Form { Text = "Codex window restore fixture" };
                Fixture.Shown += (_, _) => { Fixture.Hide(); Ready.SetResult(Fixture); };
                Application.Run(Fixture);
            }
            catch (Exception Error) { Ready.TrySetException(Error); }
        });
        UiThread.SetApartmentState(ApartmentState.STA);
        UiThread.Start();
        var Fixture = Ready.Task.WaitAsync(TimeSpan.FromSeconds(10)).GetAwaiter().GetResult();
        try
        {
            IntPtr Handle = Fixture.Handle;
            int ProcessId = Environment.ProcessId;
            var ClassName = new StringBuilder(256);
            GetClassName(Handle, ClassName, ClassName.Capacity);
            using var CurrentProcess = Process.GetCurrentProcess();
            Require(CurrentProcess.MainWindowHandle == IntPtr.Zero, "original MainWindowHandle misses the hidden fixture");
            Require(InstanceWindowService.FindMainWindow(ProcessId, ClassName.ToString()) == Handle, "enumeration finds the hidden main window");
            Require(InstanceWindowService.FindMainWindow(ProcessId, "UnrelatedWindowClass") == IntPtr.Zero, "unrelated window classes excluded");
            Fixture.Invoke(() => Fixture.Text = "");
            Require(InstanceWindowService.FindMainWindow(ProcessId, ClassName.ToString()) == Handle, "untitled startup window is detected before its title arrives");
            VerifyAuxiliaryWindows(Fixture, ClassName.ToString());
            VerifyUntitledWindow(Fixture, ClassName.ToString());
            InstanceWindowService.ShowMainWindow(ProcessId, Handle);
            Require(InstanceWindowService.IsVisible(Handle), "hidden window restored");
            VerifyBlockedWindow(Fixture);
            VerifyUnresponsiveWindow(Fixture);
            Fixture.Invoke(() => { Fixture.WindowState = FormWindowState.Maximized; Fixture.Hide(); });
            InstanceWindowService.ShowMainWindow(ProcessId, Handle);
            Require((FormWindowState)Fixture.Invoke(() => Fixture.WindowState) == FormWindowState.Maximized, "maximized state preserved when shown again");
            Fixture.Invoke(() => Fixture.WindowState = FormWindowState.Minimized);
            InstanceWindowService.ShowMainWindow(ProcessId, Handle);
            Require((FormWindowState)Fixture.Invoke(() => Fixture.WindowState) != FormWindowState.Minimized, "minimized window restored");
            Fixture.Invoke(() => Fixture.Hide());
            Form? Other = null;
            Fixture.Invoke(() => { Other = new Form { Text = "Visible fixture" }; Other.Show(); });
            try
            {
                Require(InstanceWindowService.FindMainWindow(ProcessId, ClassName.ToString()) == Other!.Handle, "visible window preferred over hidden window");
            }
            finally { Fixture.Invoke(() => Other!.Dispose()); }
            bool WrongProcessRejected = false;
            try { InstanceWindowService.ShowMainWindow(-1, Handle); }
            catch (InvalidOperationException) { WrongProcessRejected = true; }
            Require(WrongProcessRejected, "window from another process rejected");
            bool MissingWindowRejected = false;
            try { InstanceWindowService.ShowMainWindow(ProcessId, IntPtr.Zero); }
            catch (InvalidOperationException) { MissingWindowRejected = true; }
            Require(MissingWindowRejected, "background process without a main window is not reported as shown");
            Console.WriteLine("PASS window selection, hidden and minimized restore, modal dialog and unresponsive window checks");
        }
        finally
        {
            Fixture.Invoke(Fixture.Close);
            Require(UiThread.Join(TimeSpan.FromSeconds(10)), "window fixture thread exited");
        }
    }

    private static void VerifyUntitledWindow(Form Fixture, string WindowClass)
    {
        Form? Auxiliary = null;
        Fixture.Invoke(() =>
        {
            Fixture.Text = "ChatGPT";
            Auxiliary = new Form();
            Auxiliary.Show();
        });
        try
        {
            int ProcessId = Environment.ProcessId;
            Require(InstanceWindowService.FindMainWindow(ProcessId, WindowClass) == Fixture.Handle, "visible untitled window does not replace the hidden main window");
            Fixture.Invoke(Auxiliary!.Hide);
            var Target = InstanceWindowService.FindMainWindow(ProcessId, WindowClass);
            Require(Target == Fixture.Handle, "hidden untitled window does not replace the hidden main window");
            InstanceWindowService.ShowMainWindow(ProcessId, Target);
            Require(InstanceWindowService.IsVisible(Fixture.Handle) && !InstanceWindowService.IsVisible(Auxiliary.Handle), "only the main window is restored");
        }
        finally
        {
            Fixture.Invoke(() => { Auxiliary!.Dispose(); Fixture.Hide(); });
        }
    }

    private static void VerifyBlockedWindow(Form Fixture)
    {
        Fixture.Invoke(() => Fixture.Enabled = false);
        try { RequireShowRejected(Environment.ProcessId, Fixture.Handle); }
        finally { Fixture.Invoke(() => Fixture.Enabled = true); }

        var Ready = new TaskCompletionSource<Form>(TaskCreationOptions.RunContinuationsAsynchronously);
        Fixture.BeginInvoke(() =>
        {
            using var Dialog = new Form { Text = "Instance modal dialog" };
            Dialog.Shown += (_, _) => Ready.SetResult(Dialog);
            Dialog.ShowDialog(Fixture);
        });
        var BlockingDialog = Ready.Task.WaitAsync(TimeSpan.FromSeconds(5)).GetAwaiter().GetResult();
        try
        {
            Require(!IsWindowEnabled(Fixture.Handle), "modal dialog disables its owner");
            InstanceWindowService.ShowMainWindow(Environment.ProcessId, Fixture.Handle);
            Require(InstanceWindowService.IsVisible(BlockingDialog.Handle), "blocking dialog remains visible");
            Require(!IsWindowEnabled(Fixture.Handle), "restoring a dialog leaves its owner disabled");
        }
        finally { BlockingDialog.Invoke(BlockingDialog.Close); }
    }

    private static void VerifyUnresponsiveWindow(Form Fixture)
    {
        using var Blocked = new ManualResetEventSlim();
        using var Release = new ManualResetEventSlim();
        Fixture.BeginInvoke(() =>
        {
            Blocked.Set();
            WaitForSingleObject(Release.WaitHandle.SafeWaitHandle, 8000);
        });
        try
        {
            Require(Blocked.Wait(TimeSpan.FromSeconds(3)), "window thread entered the blocked state");
            bool TimeoutReported = false;
            try { InstanceWindowService.ShowMainWindow(Environment.ProcessId, Fixture.Handle); }
            catch (TimeoutException) { TimeoutReported = true; }
            Require(TimeoutReported, "visible unresponsive window is not reported as restored");
        }
        finally { Release.Set(); }
        Fixture.Invoke(() => { });
    }

    private static void VerifyAuxiliaryWindows(Form Fixture, string WindowClass)
    {
        int ProcessId = Environment.ProcessId;
        foreach (long ExtendedStyle in new[] { 0x80L, 0x8000000L })
        {
            Form? Auxiliary = null;
            Fixture.Invoke(() =>
            {
                Auxiliary = new Form { Text = "ChatGPT" };
                SetWindowLongPtr(Auxiliary.Handle, -20, new IntPtr((GetWindowLongPtr(Auxiliary.Handle, -20).ToInt64() & ~0x40000L) | ExtendedStyle));
            });
            try
            {
                var ClassName = new StringBuilder(256);
                GetClassName(Auxiliary!.Handle, ClassName, ClassName.Capacity);
                Require(ClassName.ToString() == WindowClass, "auxiliary fixture has the same window class as the main window");
                Require(InstanceWindowService.FindMainWindow(ProcessId, WindowClass) == Fixture.Handle, "named hidden auxiliary window does not replace an untitled main window");
                RequireShowRejected(ProcessId, Auxiliary.Handle);
                Require(!InstanceWindowService.IsVisible(Auxiliary.Handle), "rejected auxiliary window stays hidden");
                Fixture.Invoke(Auxiliary.Show);
                Require(InstanceWindowService.FindMainWindow(ProcessId, WindowClass) == Fixture.Handle, "visible auxiliary window does not replace a hidden main window");
                RequireShowRejected(ProcessId, Auxiliary.Handle);
            }
            finally { Fixture.Invoke(() => Auxiliary!.Dispose()); }
        }
        Form? Owned = null;
        Fixture.Invoke(() => { Owned = new Form { Text = "Owned window", Owner = Fixture }; _ = Owned.Handle; });
        try
        {
            Require(InstanceWindowService.FindMainWindow(ProcessId, WindowClass) == Fixture.Handle, "owned window is excluded");
            RequireShowRejected(ProcessId, Owned!.Handle);
        }
        finally { Fixture.Invoke(() => Owned!.Dispose()); }

        IntPtr OriginalStyle = GetWindowLongPtr(Fixture.Handle, -20);
        Fixture.Invoke(() => SetWindowLongPtr(Fixture.Handle, -20, new IntPtr(OriginalStyle.ToInt64() | 0x80L)));
        try
        {
            Require(InstanceWindowService.FindMainWindow(ProcessId, WindowClass) == IntPtr.Zero, "process with only an auxiliary window has no restorable main window");
            RequireShowRejected(ProcessId, Fixture.Handle);
        }
        finally { Fixture.Invoke(() => SetWindowLongPtr(Fixture.Handle, -20, OriginalStyle)); }
    }

    private static void RequireShowRejected(int ProcessId, IntPtr Handle)
    {
        bool Rejected = false;
        try { InstanceWindowService.ShowMainWindow(ProcessId, Handle); }
        catch (InvalidOperationException) { Rejected = true; }
        Require(Rejected, "window without an interactive target is rejected");
    }
    #endregion

    #region 运行中实例验证
    /// <summary>
    /// 恢复已有第二实例 验证进程未替换且主实例未被结束
    /// </summary>
    public static int RestoreSecond()
    {
        try
        {
            var Profile = SettingsStore.Load().InstanceList.Single(Item => Item.Id == "second");
            var BeforeList = InstanceService.ListRunning();
            var Before = InstanceService.Find(Profile, BeforeList) ?? throw new InvalidOperationException("第二实例未运行");
            Console.WriteLine($"Before: second PID={Before.ProcessId} HWND={Before.Window} visible={InstanceWindowService.IsVisible(Before.Window)}");
            bool ChangedProcessRejected = false;
            try { InstanceService.StopAsync(Profile, -1).GetAwaiter().GetResult(); }
            catch (InvalidOperationException) { ChangedProcessRejected = true; }
            Require(ChangedProcessRejected, "stop rejected when the selected process ID changed");
            int ProcessId = InstanceService.Launch(Profile);
            var AfterList = InstanceService.ListRunning();
            var After = InstanceService.Find(Profile, AfterList)!;
            Require(ProcessId == Before.ProcessId && After.ProcessId == Before.ProcessId, "same secondary process preserved");
            Require(InstanceWindowService.IsVisible(After.Window), "secondary window visible");
            Require(BeforeList.All(Item => AfterList.Any(AfterItem => AfterItem.ProcessId == Item.ProcessId)), "all existing Codex instance processes preserved");
            Console.WriteLine($"PASS live second restore PID={After.ProcessId} HWND={After.Window}; all existing Codex instances preserved");
            return 0;
        }
        catch (Exception Error) { Console.Error.WriteLine(Error); return 1; }
    }
    #endregion

    /// <summary>
    /// 验证预期结果 失败时立即报告
    /// </summary>
    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new InvalidOperationException("FAILED: " + Message);
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetClassName(IntPtr Window, StringBuilder ClassName, int MaxCount);
    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")]
    private static extern IntPtr GetWindowLongPtr(IntPtr Window, int Index);
    [DllImport("user32.dll")]
    private static extern bool IsWindowEnabled(IntPtr Window);
    [DllImport("kernel32.dll")]
    private static extern uint WaitForSingleObject(Microsoft.Win32.SafeHandles.SafeWaitHandle Handle, uint Milliseconds);
    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW")]
    private static extern IntPtr SetWindowLongPtr(IntPtr Window, int Index, IntPtr Value);
}
