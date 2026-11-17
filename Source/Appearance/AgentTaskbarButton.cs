using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace CodexInstanceManager;

internal sealed class AgentTaskbarButton : Form
{
    private const int ActivateApplicationMessage = 0x001c;
    private const int MinimizeWindow = 6;
    private static readonly uint ButtonCreatedMessage = RegisterWindowMessage("TaskbarButtonCreated");
    private static readonly uint TaskbarCreatedMessage = RegisterWindowMessage("TaskbarCreated");
    private static readonly Guid TaskbarClassId = new("56FDF344-FD6D-11D0-958A-006097C9A090");
    private readonly AgentTaskbarRequest Request;
    private readonly EventWaitHandle Ready;
    private readonly IntPtr Target;
    private readonly object ShellObject;
    private readonly ITaskbarList3 Taskbar;
    private bool Registered;
    private bool RemovedOriginal;
    private bool Ending;

    private AgentTaskbarButton(AgentTaskbarRequest Request, EventWaitHandle Ready, Icon Image)
    {
        this.Request = Request;
        this.Ready = Ready;
        Target = new IntPtr(Request.Window);
        Text = Request.Title;
        Icon = Image;
        StartPosition = FormStartPosition.Manual;
        Location = new Point(-10000, -10000);
        ClientSize = new Size(320, 160);
        ShowInTaskbar = true;
        ShellObject = Activator.CreateInstance(Type.GetTypeFromCLSID(TaskbarClassId, true)!)!;
        try
        {
            Taskbar = (ITaskbarList3)ShellObject;
            Marshal.ThrowExceptionForHR(Taskbar.HrInit());
        }
        catch
        {
            Marshal.FinalReleaseComObject(ShellObject);
            throw;
        }
    }

    public static void Run(string Argument)
    {
        var Request = JsonSerializer.Deserialize<AgentTaskbarRequest>(Convert.FromBase64String(Argument))
            ?? throw new InvalidDataException("主任务栏按钮启动参数为空");
        if (!Guid.TryParseExact(Request.Token, "N", out _)) throw new InvalidDataException("无效的主任务栏按钮令牌");
        using var Ready = EventWaitHandle.OpenExisting(AgentTaskbarService.EventName(Request.Token, "ready"));
        using var Stop = EventWaitHandle.OpenExisting(AgentTaskbarService.EventName(Request.Token, "stop"));
        using var Done = EventWaitHandle.OpenExisting(AgentTaskbarService.EventName(Request.Token, "done"));
        try
        {
            using var Owner = Process.GetProcessById(Request.OwnerProcessId);
            using var Agent = Process.GetProcessById(Request.ProcessId);
            if (Owner.StartTime.ToUniversalTime().Ticks != Request.OwnerStartedAt ||
                Agent.StartTime.ToUniversalTime().Ticks != Request.StartedAt ||
                !ManagerPaths.Same(Owner.MainModule!.FileName, Environment.ProcessPath!))
                throw new InvalidOperationException("主任务栏按钮的进程已变化");
            if (!ExplorerDesktopLaunch.IsIconPathForOwner(Request.IconPath, Owner))
                throw new IOException("主任务栏按钮图标不在管理器图标目录");
            if (ExplorerDesktopLaunch.HasPackageIdentity())
                throw new InvalidOperationException("主任务栏按钮继承了其他软件的 Windows 应用包身份");
            Marshal.ThrowExceptionForHR(SetCurrentProcessExplicitAppUserModelID(Request.AppId));

            using var Image = new Icon(Request.IconPath, new Size(32, 32));
            using var Button = new AgentTaskbarButton(Request, Ready, Image);
            using var Monitor = new System.Windows.Forms.Timer { Interval = 500 };
            Monitor.Tick += (_, _) =>
            {
                if (Stop.WaitOne(0) || Owner.HasExited || Agent.HasExited || !Button.IsTargetCurrent())
                    Button.End();
            };
            if (!Button.IsTargetCurrent() || Stop.WaitOne(0)) return;
            Monitor.Start();
            Application.Run(Button);
        }
        finally { Done.Set(); }
    }

    protected override bool ShowWithoutActivation => true;

    private bool IsTargetCurrent()
    {
        GetWindowThreadProcessId(Target, out uint ProcessId);
        return ProcessId == Request.ProcessId;
    }

    private void End()
    {
        Ending = true;
        Close();
    }

    protected override void WndProc(ref Message Message)
    {
        if (Message.Msg == TaskbarCreatedMessage) { Registered = false; RemovedOriginal = false; }
        if (Message.Msg == ButtonCreatedMessage && !Registered && !Ending) BeginInvoke(Attach);
        if (Message.Msg == ActivateApplicationMessage && Message.WParam != IntPtr.Zero && Registered && !Ending)
        {
            uint TargetThread = GetWindowThreadProcessId(Target, out uint ProcessId);
            if (ProcessId == Request.ProcessId)
            {
                bool FromMinimizedTarget = Message.LParam.ToInt64() == TargetThread && IsIconic(Target);
                BeginInvoke(() => FollowActivation(FromMinimizedTarget));
            }
        }
        base.WndProc(ref Message);
    }

    private void FollowActivation(bool FromMinimizedTarget)
    {
        if (Ending || !Registered || GetForegroundWindow() != Handle || !IsTargetCurrent()) return;
        if (FromMinimizedTarget)
        {
            // 原窗口让出焦点时把代理也缩进任务栏 避免下次点击落在已经激活的代理上
            ShowWindow(Handle, MinimizeWindow);
            return;
        }
        try { InstanceWindowService.ShowMainWindow(Request.ProcessId, Target); }
        catch (Exception Error) { Program.LogError(Error); }
    }

    private void Attach()
    {
        if (Registered || Ending) return;
        if (!IsTargetCurrent() || !InstanceWindowService.IsVisible(Target)) { End(); return; }
        try
        {
            Marshal.ThrowExceptionForHR(Taskbar.DeleteTab(Target));
            RemovedOriginal = true;
            // 缩略图继续使用真实窗口 保留原应用的预览和切换行为
            Marshal.ThrowExceptionForHR(Taskbar.RegisterTab(Target, Handle));
            Registered = true;
            Marshal.ThrowExceptionForHR(Taskbar.SetTabOrder(Target, IntPtr.Zero));
            Ready.Set();
        }
        catch (Exception Error)
        {
            Program.LogError(Error);
            End();
        }
    }

    protected override void OnFormClosing(FormClosingEventArgs Event)
    {
        if (!Ending && Event.CloseReason == CloseReason.UserClosing && IsTargetCurrent())
        {
            PostMessage(Target, 0x0010, IntPtr.Zero, IntPtr.Zero);
            Event.Cancel = true;
        }
        base.OnFormClosing(Event);
    }

    protected override void OnFormClosed(FormClosedEventArgs Event)
    {
        try
        {
            if (Registered) Taskbar.UnregisterTab(Target);
            if (RemovedOriginal && IsTargetCurrent() && InstanceWindowService.IsVisible(Target))
                Marshal.ThrowExceptionForHR(Taskbar.AddTab(Target));
        }
        finally { base.OnFormClosed(Event); }
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing && !IsDisposed && ShellObject is not null) Marshal.FinalReleaseComObject(ShellObject);
        base.Dispose(Disposing);
    }

    [ComImport, Guid("EA1AFB91-9E28-4B86-90E9-9E9F8A5EEFAF"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface ITaskbarList3
    {
        [PreserveSig] int HrInit();
        [PreserveSig] int AddTab(IntPtr Window);
        [PreserveSig] int DeleteTab(IntPtr Window);
        [PreserveSig] int ActivateTab(IntPtr Window);
        [PreserveSig] int SetActiveAlt(IntPtr Window);
        [PreserveSig] int MarkFullscreenWindow(IntPtr Window, int Fullscreen);
        [PreserveSig] int SetProgressValue(IntPtr Window, ulong Completed, ulong Total);
        [PreserveSig] int SetProgressState(IntPtr Window, uint Flags);
        [PreserveSig] int RegisterTab(IntPtr Tab, IntPtr Group);
        [PreserveSig] int UnregisterTab(IntPtr Tab);
        [PreserveSig] int SetTabOrder(IntPtr Tab, IntPtr Before);
    }

    [DllImport("shell32.dll", CharSet = CharSet.Unicode)] private static extern int SetCurrentProcessExplicitAppUserModelID(string AppId);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern uint RegisterWindowMessage(string Name);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr Window, out uint ProcessId);
    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] private static extern bool IsIconic(IntPtr Window);
    [DllImport("user32.dll")] private static extern bool ShowWindow(IntPtr Window, int Command);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern bool PostMessage(IntPtr Window, uint Message, IntPtr WParam, IntPtr LParam);
}
