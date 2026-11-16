using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32.SafeHandles;

namespace CodexInstanceManager;

internal static class ExplorerDesktopLaunch
{
    public static bool HasPackageIdentity()
    {
        const int InsufficientBuffer = 122;
        const int NoPackage = 15700;
        uint Length = 0;
        int Result = GetCurrentPackageFullName(ref Length, IntPtr.Zero);
        if (Result == NoPackage) return false;
        if (Result == InsufficientBuffer) return true;
        throw new System.ComponentModel.Win32Exception(Result, "无法确定 Windows 应用包身份");
    }

    public static string ResolveExistingFile(string PathValue)
    {
        using var File = System.IO.File.OpenHandle(PathValue, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        var PathBuffer = new StringBuilder(512);
        uint Length = GetFinalPathNameByHandle(File, PathBuffer, (uint)PathBuffer.Capacity, 0);
        if (Length >= PathBuffer.Capacity)
        {
            PathBuffer.EnsureCapacity(checked((int)Length + 1));
            Length = GetFinalPathNameByHandle(File, PathBuffer, (uint)PathBuffer.Capacity, 0);
        }
        if (Length == 0 || Length >= PathBuffer.Capacity)
            throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "无法读取文件的真实桌面路径");
        string Result = PathBuffer.ToString();
        return Result.StartsWith(@"\\?\", StringComparison.Ordinal) ? Result[4..] : Result;
    }

    public static bool IsIconPathForOwner(string PathValue, System.Diagnostics.Process Owner)
    {
        string IconRoot = Path.Combine(ManagerPaths.Root, "icons");
        if (ManagerPaths.IsUnder(PathValue, IconRoot)) return true;
        uint Length = 0;
        int Result = GetPackageFamilyName(Owner.SafeHandle, ref Length, null);
        if (Result != 122) return false;
        var Name = new StringBuilder(checked((int)Length));
        if (GetPackageFamilyName(Owner.SafeHandle, ref Length, Name) != 0) return false;
        string Local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string RedirectedRoot = Path.Combine(Local, "Packages", Name.ToString(), "LocalCache", "Local", "CodexInstanceManager", "icons");
        return ManagerPaths.IsUnder(PathValue, RedirectedRoot);
    }

    public static void StartManager(string[] Arguments)
    {
        string Exe = Environment.ProcessPath ?? throw new InvalidOperationException("无法定位管理器程序");
        var ObjectList = new List<object>();
        try
        {
            dynamic Shell = Activator.CreateInstance(Type.GetTypeFromProgID("Shell.Application", true)!)!;
            ObjectList.Add(Shell);
            dynamic Windows = Shell.Windows();
            ObjectList.Add(Windows);
            object Location = 0;
            object Root = 0;
            dynamic Desktop = Windows.FindWindowSW(ref Location, ref Root, 8, out int _, 1);
            if (Desktop is null) throw new InvalidOperationException("未找到 Windows 桌面");
            ObjectList.Add(Desktop);
            dynamic Folder = Desktop.Document;
            ObjectList.Add(Folder);
            dynamic Explorer = Folder.Application;
            ObjectList.Add(Explorer);
            // 通过桌面进程启动避免继承 Codex 的 MSIX 身份和数据目录
            Explorer.ShellExecute(Exe, string.Join(" ", Arguments.Select(Quote)), Path.GetDirectoryName(Exe), "open", 4);
        }
        finally
        {
            for (int Index = ObjectList.Count - 1; Index >= 0; Index--) Marshal.ReleaseComObject(ObjectList[Index]);
        }
    }

    private static string Quote(string Argument)
    {
        var Result = new StringBuilder().Append('"');
        int Slashes = 0;
        foreach (char Character in Argument)
        {
            if (Character == '\\') { Slashes++; continue; }
            Result.Append('\\', Character == '"' ? Slashes * 2 + 1 : Slashes).Append(Character);
            Slashes = 0;
        }
        return Result.Append('\\', Slashes * 2).Append('"').ToString();
    }

    [DllImport("kernel32.dll")] private static extern int GetCurrentPackageFullName(ref uint Length, IntPtr Buffer);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] private static extern int GetPackageFamilyName(SafeProcessHandle Process, ref uint Length, StringBuilder? Name);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)] private static extern uint GetFinalPathNameByHandle(
        SafeFileHandle File, StringBuilder Path, uint Length, uint Flags);
}
