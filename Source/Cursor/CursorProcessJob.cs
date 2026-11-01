using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

namespace CodexInstanceManager;

public static class CursorProcessJob
{
    public static SafeFileHandle Attach(Process Process)
    {
        var Job = CreateJobObject(IntPtr.Zero, null);
        try
        {
            if (Job.IsInvalid) throw new Win32Exception(Marshal.GetLastWin32Error(), "无法创建 Cursor 进程作业");
            var Limits = new ExtendedLimits { Basic = new BasicLimits { LimitFlags = 0x2000 } };
            if (!SetInformationJobObject(Job, 9, ref Limits, (uint)Marshal.SizeOf<ExtendedLimits>()) || !AssignProcessToJobObject(Job, Process.Handle)) throw new Win32Exception(Marshal.GetLastWin32Error(), "无法绑定 Cursor 进程 生命周期无法由管理器接管");
            return Job;
        }
        catch
        {
            Job.Dispose();
            if (!Process.HasExited) Process.Kill(true);
            throw;
        }
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct BasicLimits
    {
        public long PerProcessUserTimeLimit;
        public long PerJobUserTimeLimit;
        public uint LimitFlags;
        public UIntPtr MinimumWorkingSetSize;
        public UIntPtr MaximumWorkingSetSize;
        public uint ActiveProcessLimit;
        public UIntPtr Affinity;
        public uint PriorityClass;
        public uint SchedulingClass;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct IoCounters
    {
        public ulong ReadOperationCount;
        public ulong WriteOperationCount;
        public ulong OtherOperationCount;
        public ulong ReadTransferCount;
        public ulong WriteTransferCount;
        public ulong OtherTransferCount;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct ExtendedLimits
    {
        public BasicLimits Basic;
        public IoCounters Io;
        public UIntPtr ProcessMemoryLimit;
        public UIntPtr JobMemoryLimit;
        public UIntPtr PeakProcessMemoryUsed;
        public UIntPtr PeakJobMemoryUsed;
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern SafeFileHandle CreateJobObject(IntPtr Attributes, string? Name);
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetInformationJobObject(SafeFileHandle Job, int Class, ref ExtendedLimits Information, uint Length);
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool AssignProcessToJobObject(SafeFileHandle Job, IntPtr Process);
}
