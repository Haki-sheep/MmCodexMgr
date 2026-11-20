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
    private const uint NullMessage = 0;
    private const uint AbortIfHung = 0x0002;
    private const uint ErrorOnExit = 0x0020;
    private const uint ResponseTimeoutMilliseconds = 1000;
    private const int ErrorTimeout = 1460;
    private delegate bool EnumWindowsCallback(IntPtr Window, IntPtr Parameter);

    /// <summary>
    /// 按进程与窗口类定位主窗口 标题可区分已就绪主窗口与无标题辅助窗口
    /// </summary>
    public static IntPtr FindMainWindow(int ProcessId, string WindowClass)
    {
        var Result = IntPtr.Zero;
        int BestRank = -1;
        bool Enumerated = EnumWindows((Window, _) =>
        {
            if (!IsMainWindow(ProcessId, Window)) return true;
            var ClassName = new StringBuilder(256);
            GetClassName(Window, ClassName, ClassName.Capacity);
            if (ClassName.ToString() != WindowClass) return true;
            int Rank = (GetWindowTextLength(Window) > 0 ? 2 : 0) + (IsWindowVisible(Window) ? 1 : 0);
            if (Rank > BestRank)
            {
                Result = Window;
                BestRank = Rank;
            }
            return true;
        }, IntPtr.Zero);
        if (!Enumerated) throw new Win32Exception(Marshal.GetLastWin32Error(), "枚举实例窗口失败");
        return Result;
    }

    public static List<IntPtr> FindMainWindows(int ProcessId, string WindowClass)
    {
        var Result = new List<IntPtr>();
        bool Enumerated = EnumWindows((Window, _) =>
        {
            if (!IsMainWindow(ProcessId, Window) || GetWindowTextLength(Window) == 0) return true;
            var ClassName = new StringBuilder(256);
            GetClassName(Window, ClassName, ClassName.Capacity);
            if (ClassName.ToString() == WindowClass) Result.Add(Window);
            return true;
        }, IntPtr.Zero);
        if (!Enumerated) throw new Win32Exception(Marshal.GetLastWin32Error(), "枚举 Agent 主窗口失败");
        return Result;
    }

    /// <summary>
    /// 查询主窗口是否显示 包含任务栏中的最小化窗口
    /// </summary>
    public static bool IsVisible(IntPtr Window) => IsWindowVisible(Window);

    internal static bool IsPresentedMainWindow(int ProcessId, IntPtr Window)
        => IsMainWindow(ProcessId, Window) && GetWindowTextLength(Window) != 0 && IsWindowVisible(Window) && !IsIconic(Window) &&
            SendMessageTimeout(Window, NullMessage, UIntPtr.Zero, IntPtr.Zero, AbortIfHung | ErrorOnExit, ResponseTimeoutMilliseconds, out _) != IntPtr.Zero;

    /// <summary>
    /// 恢复指定进程的主窗口并请求前台激活 无主窗口或恢复失败时抛出异常
    /// </summary>
    public static void ShowMainWindow(int ProcessId, IntPtr Window)
    {
        if (!IsMainWindow(ProcessId, Window))
            throw new InvalidOperationException($"实例进程 {ProcessId} 仍在运行 但没有可恢复的主窗口 可结束所选实例后重新启动");
        bool Minimized = IsIconic(Window);
        if ((Minimized || !IsWindowVisible(Window)) && !ShowWindowAsync(Window, Minimized ? Restore : Show))
            throw new Win32Exception(Marshal.GetLastWin32Error(), $"无法恢复实例窗口 进程 {ProcessId}");
        var Timer = Stopwatch.StartNew();
        while (!IsWindowVisible(Window) || IsIconic(Window))
        {
            if (Timer.ElapsedMilliseconds >= RestoreTimeoutMilliseconds)
                throw new TimeoutException($"实例窗口未能恢复 进程 {ProcessId}");
            Thread.Sleep(RestorePollMilliseconds);
        }
        var Target = IsWindowEnabled(Window) ? Window : FindOwnedDialog(ProcessId, Window);
        if (Target == IntPtr.Zero)
            throw new InvalidOperationException($"实例主窗口当前禁止输入 且未找到可操作的弹窗 进程 {ProcessId}");
        if (SendMessageTimeout(Target, NullMessage, UIntPtr.Zero, IntPtr.Zero, AbortIfHung | ErrorOnExit, ResponseTimeoutMilliseconds, out _) == IntPtr.Zero)
        {
            int Error = Marshal.GetLastWin32Error();
            if (Error is 0 or ErrorTimeout)
                throw new TimeoutException($"实例窗口未响应 进程 {ProcessId}");
            throw new Win32Exception(Error, $"无法确认实例窗口响应 进程 {ProcessId}");
        }
        // Windows 可能拒绝后台程序抢占焦点 窗口可见时仍可从任务栏切换
        SetForegroundWindow(Target);
    }

    private static IntPtr FindOwnedDialog(int ProcessId, IntPtr Owner)
    {
        var Target = IntPtr.Zero;
        bool Enumerated = EnumWindows((Window, _) =>
        {
            if (Window == Owner || !IsWindowVisible(Window) || !IsWindowEnabled(Window)) return true;
            GetWindowThreadProcessId(Window, out uint WindowProcessId);
            if (WindowProcessId != ProcessId || (GetWindowLongPtr(Window, ExtendedStyleIndex).ToInt64() & NoActivateStyle) != 0) return true;
            if (Target == IntPtr.Zero && IsOwnedBy(Window, Owner)) Target = Window;
            return true;
        }, IntPtr.Zero);
        if (!Enumerated) throw new Win32Exception(Marshal.GetLastWin32Error(), "枚举实例弹窗失败");
        return Target;
    }

    private static bool IsOwnedBy(IntPtr Window, IntPtr Owner)
    {
        for (var Current = GetWindow(Window, OwnerWindow); Current != IntPtr.Zero; Current = GetWindow(Current, OwnerWindow))
            if (Current == Owner) return true;
        return false;
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
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowTextLength(IntPtr Window);
    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr Window);
    [DllImport("user32.dll")]
    private static extern bool IsWindowEnabled(IntPtr Window);
    [DllImport("user32.dll")]
    private static extern bool IsIconic(IntPtr Window);
    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool ShowWindowAsync(IntPtr Window, int Command);
    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr Window);
    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr SendMessageTimeout(IntPtr Window, uint Message, UIntPtr WParam, IntPtr LParam, uint Flags, uint Timeout, out UIntPtr Result);
}
