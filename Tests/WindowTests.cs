using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using CodexInstanceManager;

internal static class WindowTests
{
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
            InstanceWindowService.ShowMainWindow(ProcessId, Handle);
            Require(InstanceWindowService.IsVisible(Handle), "hidden window restored");
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
            Console.WriteLine("PASS untitled startup, auxiliary window rejection, hidden, minimized, maximized and visible window selection checks");
        }
        finally
        {
            Fixture.Invoke(Fixture.Close);
            Require(UiThread.Join(TimeSpan.FromSeconds(10)), "window fixture thread exited");
        }
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
        Require(Rejected, "direct restore of an auxiliary window is rejected");
    }

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
    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW")]
    private static extern IntPtr SetWindowLongPtr(IntPtr Window, int Index, IntPtr Value);
}
