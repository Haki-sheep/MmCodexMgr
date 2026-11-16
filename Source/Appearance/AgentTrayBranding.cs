using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32;

namespace CodexInstanceManager;

internal sealed record AgentTrayTarget(string Provider, InstanceProfile Profile, int ProcessId, long StartedAt);

internal static class AgentTrayBranding
{
    private const uint FirstElectronIconId = 3;
    private const uint Modify = 1;
    private const uint IconOnly = 2;
    private const uint UseGuid = 32;

    public static HashSet<int> FindHostProcessIds(HashSet<int> TargetHashList) =>
        FindHosts(TargetHashList.Contains).Select(Host => Host.ProcessId).ToHashSet();

    public static int Apply(AgentIconSettings Settings, IReadOnlyList<AgentTrayTarget> TargetList)
    {
        if (TargetList.Count == 0) return 0;
        var TargetDict = TargetList.ToDictionary(Target => Target.ProcessId);
        var WindowList = FindHosts(TargetDict.ContainsKey)
            .Select(Host => (Host.Window, Target: TargetDict[Host.ProcessId]));

        var GuidHashList = new HashSet<Guid>();
        int Updated = 0;
        foreach (var (Window, Target) in WindowList.OrderBy(Item => Item.Target.StartedAt))
        {
            try
            {
                using var Process = System.Diagnostics.Process.GetProcessById(Target.ProcessId);
                if (Process.HasExited || Process.StartTime.ToUniversalTime().Ticks != Target.StartedAt) continue;
                string Exe = Process.MainModule!.FileName;
                Guid Id = Guid.Empty;
                if (Target.Provider == "codex")
                {
                    var GuidList = ReadAppTrayGuidList(Exe).Where(Value => TrayExists(Window, Value)).Distinct().ToList();
                    if (GuidList.Count > 1) throw new IOException("检测到多个 Codex 托盘标识 无法区分");
                    if (GuidList.Count == 1)
                    {
                        Id = GuidList[0];
                        if (!GuidHashList.Add(Id)) continue;
                    }
                }
                if (!TrayExists(Window, Id)) continue;
                using var Icon = Settings.Enabled
                    ? new Icon(Settings.Branded(Target.Profile, Target.Provider).IconPath, new Size(32, 32))
                    : AgentTrayOriginal.Load(Target.Provider, Exe);
                var Data = new NotifyData
                {
                    Size = (uint)Marshal.SizeOf<NotifyData>(), Window = Window, Id = FirstElectronIconId, Guid = Id,
                    Flags = Id == Guid.Empty ? IconOnly : IconOnly | UseGuid, Icon = Icon.Handle, Tip = "", Info = "", InfoTitle = ""
                };
                GetWindowThreadProcessId(Window, out uint OwnerProcessId);
                if (OwnerProcessId != Target.ProcessId) continue;
                if (!Shell_NotifyIcon(Modify, ref Data))
                {
                    if (!TrayExists(Window, Id)) continue;
                    throw new IOException("Windows 拒绝更新 " + AgentDesktopBranding.DisplayName(Target.Provider) + " 托盘图标");
                }
                Updated++;
            }
            catch (ArgumentException) when (!WindowBelongsTo(Window, Target.ProcessId)) { }
        }
        return Updated;
    }

    private static List<(IntPtr Window, int ProcessId)> FindHosts(Func<int, bool> IsTarget)
    {
        var WindowList = new List<(IntPtr Window, int ProcessId)>();
        bool Enumerated = EnumWindows((Window, _) =>
        {
            GetWindowThreadProcessId(Window, out uint ProcessId);
            if (!IsTarget((int)ProcessId)) return true;
            var ClassName = new StringBuilder(64);
            GetClassName(Window, ClassName, ClassName.Capacity);
            if (ClassName.ToString() is "Electron_NotifyIconHostWindow" or "OwlElectron_NotifyIconHostWindow")
                WindowList.Add((Window, (int)ProcessId));
            return true;
        }, IntPtr.Zero);
        if (!Enumerated) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "无法定位 Agent 托盘图标");
        return WindowList;
    }

    private static bool WindowBelongsTo(IntPtr Window, int ProcessId)
    {
        GetWindowThreadProcessId(Window, out uint OwnerProcessId);
        return OwnerProcessId == ProcessId;
    }

    private static List<Guid> ReadAppTrayGuidList(string Exe)
    {
        using var Root = Registry.CurrentUser.OpenSubKey(@"Control Panel\NotifyIconSettings");
        var Result = new List<Guid>();
        if (Root is null) return Result;
        foreach (string Name in Root.GetSubKeyNames())
        {
            using var Item = Root.OpenSubKey(Name);
            if (Item?.GetValue("ExecutablePath") is not string Registered || !ManagerPaths.Same(Registered, Exe)) continue;
            if (Guid.TryParse(Item.GetValue("IconGuid") as string, out var Id) && Id != Guid.Empty) Result.Add(Id);
        }
        return Result;
    }

    private static bool TrayExists(IntPtr Window, Guid Id)
    {
        var Identity = new NotifyIdentity { Size = (uint)Marshal.SizeOf<NotifyIdentity>(), Window = Window, Id = FirstElectronIconId, Guid = Id };
        return Shell_NotifyIconGetRect(ref Identity, out _) == 0;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct NotifyIdentity
    {
        public uint Size;
        public IntPtr Window;
        public uint Id;
        public Guid Guid;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct Rect { public int Left, Top, Right, Bottom; }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct NotifyData
    {
        public uint Size;
        public IntPtr Window;
        public uint Id, Flags, Message;
        public IntPtr Icon;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string Tip;
        public uint State, StateMask;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string Info;
        public uint Version;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)] public string InfoTitle;
        public uint InfoFlags;
        public Guid Guid;
        public IntPtr BalloonIcon;
    }

    private delegate bool EnumWindowsCallback(IntPtr Window, IntPtr Parameter);
    [DllImport("user32.dll", SetLastError = true)] private static extern bool EnumWindows(EnumWindowsCallback Callback, IntPtr Parameter);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr Window, out uint ProcessId);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetClassName(IntPtr Window, StringBuilder Name, int Capacity);
    [DllImport("shell32.dll")] private static extern int Shell_NotifyIconGetRect(ref NotifyIdentity Identity, out Rect Bounds);
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)] private static extern bool Shell_NotifyIcon(uint Message, ref NotifyData Data);
}
