using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace CodexInstanceManager;

public sealed class InstanceActivityMonitor : IDisposable
{
    private const uint ObjectDestroy = 0x8001;
    private const uint ObjectHide = 0x8003;
    private readonly Dictionary<int, Process> ProcessDict = new();
    private readonly HashSet<IntPtr> WindowHashList = new();
    private readonly WinEventCallback Callback;
    private IntPtr Hook;
    private bool Disposed;
    public event Action? Changed;
    public int HookCount => Hook == IntPtr.Zero ? 0 : 1;
    public int ProcessCount => ProcessDict.Count;

    public InstanceActivityMonitor() => Callback = OnWindowEvent;

    public void Enable()
    {
        ObjectDisposedException.ThrowIf(Disposed, this);
        if (Hook != IntPtr.Zero) return;
        Hook = SetWinEventHook(ObjectDestroy, ObjectHide, IntPtr.Zero, Callback, 0, 0, 2);
        if (Hook == IntPtr.Zero) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "无法监听桌面窗口事件");
    }

    public void Track(List<RunningInstance> RunningList)
    {
        ObjectDisposedException.ThrowIf(Disposed, this);
        WindowHashList.Clear();
        foreach (var Item in RunningList) if (Item.Window != IntPtr.Zero) WindowHashList.Add(Item.Window);
        var ProcessHashList = RunningList.Select(Item => Item.ProcessId).ToHashSet();
        foreach (int ProcessId in ProcessDict.Keys.Where(ProcessId => !ProcessHashList.Contains(ProcessId)).ToArray())
        {
            ProcessDict[ProcessId].Dispose();
            ProcessDict.Remove(ProcessId);
        }
        foreach (int ProcessId in ProcessHashList)
        {
            if (ProcessDict.ContainsKey(ProcessId)) continue;
            Process Process;
            try { Process = Process.GetProcessById(ProcessId); }
            catch (ArgumentException) { Changed?.Invoke(); continue; }
            Process.Exited += OnProcessExited;
            try { Process.EnableRaisingEvents = true; }
            catch { Process.Dispose(); throw; }
            ProcessDict.Add(ProcessId, Process);
        }
    }

    public void Disable()
    {
        if (Hook != IntPtr.Zero) { UnhookWinEvent(Hook); Hook = IntPtr.Zero; }
        foreach (var Process in ProcessDict.Values) { Process.Exited -= OnProcessExited; Process.Dispose(); }
        ProcessDict.Clear();
        WindowHashList.Clear();
    }

    public void Dispose() { Disposed = true; Disable(); }

    private void OnProcessExited(object? Sender, EventArgs Event)
    {
        if (!Disposed) Changed?.Invoke();
    }

    private void OnWindowEvent(IntPtr Hook, uint Event, IntPtr Window, int ObjectId, int ChildId, uint ThreadId, uint Time)
    {
        if (Disposed || ObjectId != 0 || ChildId != 0) return;
        if (WindowHashList.Contains(Window)) { Changed?.Invoke(); return; }
        if (Event == ObjectDestroy || GetAncestor(Window, 2) != Window) return;
        var ClassName = new StringBuilder(64);
        if (GetClassName(Window, ClassName, ClassName.Capacity) != 0 && ClassName.ToString() == "Chrome_WidgetWin_1") Changed?.Invoke();
    }

    private delegate void WinEventCallback(IntPtr Hook, uint Event, IntPtr Window, int ObjectId, int ChildId, uint ThreadId, uint Time);
    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWinEventHook(uint EventMin, uint EventMax, IntPtr Module, WinEventCallback Callback, uint ProcessId, uint ThreadId, uint Flags);
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWinEvent(IntPtr Hook);
    [DllImport("user32.dll")]
    private static extern IntPtr GetAncestor(IntPtr Window, uint Flags);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetClassName(IntPtr Window, StringBuilder ClassName, int Capacity);
}
