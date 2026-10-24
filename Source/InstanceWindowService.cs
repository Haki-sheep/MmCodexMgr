using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace CodexInstanceManager;

public static class InstanceWindowService
{
    /// <summary> 无属主窗口查询标志 </summary>
    private const uint OwnerWindow = 4;
    /// <summary> 保留窗口大小与最大化状态显示 </summary>
    private const int Show = 5;
    private const int StyleIndex = -16;
    private const int ExtendedStyleIndex = -20;
    private const long ChildStyle = 0x40000000;
    private const long ToolWindowStyle = 0x80;
    private const long NoActivateStyle = 0x08000000;
    /// <summary> 恢复最小化窗口 </summary>
    private const int Restore = 9;
    /// <summary> 窗口恢复等待上限 单位毫秒 </summary>
    private const int RestoreTimeoutMilliseconds = 3000;
    /// <summary> 窗口恢复检查间隔 单位毫秒 </summary>
    private const int RestorePollMilliseconds = 50;
    private delegate bool EnumWindowsCallback(IntPtr Window, IntPtr Parameter);

    /// <summary>
    /// 按进程与窗口类查找可交互主窗口 不依赖启动时尚未设置的标题 优先选择已显示窗口
    /// </summary>
    public static IntPtr FindMainWindow(int ProcessId, string WindowClass)
    {
        var Result = IntPtr.Zero;
        bool FoundVisible = false;
        bool Enumerated = EnumWindows((Window, _) =>
        {
            if (!IsMainWindow(ProcessId, Window)) return true;
            var ClassName = new StringBuilder(256);
            GetClassName(Window, ClassName, ClassName.Capacity);
            if (ClassName.ToString() != WindowClass) return true;
            bool Visible = IsWindowVisible(Window);
            if (Result == IntPtr.Zero || (!FoundVisible && Visible))
            {
                Result = Window;
                FoundVisible = Visible;
            }
            return true;
        }, IntPtr.Zero);
        if (!Enumerated) throw new Win32Exception(Marshal.GetLastWin32Error(), "枚举实例窗口失败");
        return Result;
    }

    /// <summary>
    /// 查询主窗口是否显示 包含任务栏中的最小化窗口
    /// </summary>
    public static bool IsVisible(IntPtr Window) => IsWindowVisible(Window);

    /// <summary>
    /// 恢复指定进程的主窗口并请求前台激活 无主窗口或恢复失败时抛出异常
    /// </summary>
    public static void ShowMainWindow(int ProcessId, IntPtr Window)
    {
        if (!IsMainWindow(ProcessId, Window))
            throw new InvalidOperationException($"实例进程 {ProcessId} 仍在运行 但没有可恢复的主窗口 可结束所选实例后重新启动");
        if (!ShowWindowAsync(Window, IsIconic(Window) ? Restore : Show))
            throw new Win32Exception(Marshal.GetLastWin32Error(), $"无法恢复实例窗口 进程 {ProcessId}");
        var Timer = Stopwatch.StartNew();
        while (!IsWindowVisible(Window) || IsIconic(Window))
        {
            if (Timer.ElapsedMilliseconds >= RestoreTimeoutMilliseconds)
                throw new TimeoutException($"实例窗口未能恢复 进程 {ProcessId}");
            Thread.Sleep(RestorePollMilliseconds);
        }
        // Windows 可能拒绝后台程序抢占焦点 窗口可见时仍可从任务栏切换
        SetForegroundWindow(Window);
    }

    private static bool IsMainWindow(int ProcessId, IntPtr Window)
    {
        GetWindowThreadProcessId(Window, out uint WindowProcessId);
        if (Window == IntPtr.Zero || WindowProcessId != ProcessId || GetWindow(Window, OwnerWindow) != IntPtr.Zero) return false;
        long Style = GetWindowLongPtr(Window, StyleIndex).ToInt64();
        long ExtendedStyle = GetWindowLongPtr(Window, ExtendedStyleIndex).ToInt64();
        return (Style & ChildStyle) == 0 && (ExtendedStyle & (ToolWindowStyle | NoActivateStyle)) == 0;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool EnumWindows(EnumWindowsCallback Callback, IntPtr Parameter);
    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr Window, out uint ProcessId);
    [DllImport("user32.dll")]
    private static extern IntPtr GetWindow(IntPtr Window, uint Command);
    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")]
    private static extern IntPtr GetWindowLongPtr(IntPtr Window, int Index);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetClassName(IntPtr Window, StringBuilder ClassName, int MaxCount);
    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr Window);
    [DllImport("user32.dll")]
    private static extern bool IsIconic(IntPtr Window);
    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool ShowWindowAsync(IntPtr Window, int Command);
    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr Window);
}
