using System.Runtime.InteropServices;
using System.Text.Json;

namespace CodexInstanceManager;

public static class AgentIconShortcuts
{
    private sealed record OriginalShortcut(string Target, string Arguments, string Icon);

    public static int RestoreLegacy()
    {
        string BackupFile = Path.Combine(ManagerPaths.Root, "backups", "agent-icon-shortcuts.json");
        if (!File.Exists(BackupFile)) return 0;
        var OriginalDict = JsonSerializer.Deserialize<Dictionary<string, OriginalShortcut>>(File.ReadAllBytes(BackupFile))
            ?? throw new InvalidDataException("Agent 快捷方式备份为空");
        object Shell = Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell")!)!;
        int Updated = 0;
        try
        {
            foreach (var (PathValue, Original) in OriginalDict)
            {
                if (!Path.GetExtension(PathValue).Equals(".lnk", StringComparison.OrdinalIgnoreCase) || !File.Exists(PathValue)) continue;
                object ShortcutObject = ((dynamic)Shell).CreateShortcut(PathValue);
                try
                {
                    dynamic Shortcut = ShortcutObject;
                    string Target = Shortcut.TargetPath;
                    string Arguments = Shortcut.Arguments;
                    string CurrentIcon = Shortcut.IconLocation;
                    if (!IsManagedIcon(CurrentIcon) || Target.Length == 0 ||
                        !ManagerPaths.Same(Original.Target, Target) || Original.Arguments != Arguments) continue;
                    Shortcut.IconLocation = Original.Icon;
                    Shortcut.Save();
                    SHChangeNotify(0x2000, 0x5, PathValue, IntPtr.Zero);
                    Updated++;
                }
                finally { Marshal.FinalReleaseComObject(ShortcutObject); }
            }
        }
        finally { Marshal.FinalReleaseComObject(Shell); }
        return Updated;
    }

    public static bool IsManagedIcon(string? Resource)
    {
        if (string.IsNullOrEmpty(Resource)) return false;
        string PathValue = Resource.Split(',')[0].Trim('"');
        return Path.IsPathFullyQualified(PathValue) && ManagerPaths.IsUnder(PathValue, Path.Combine(ManagerPaths.Root, "icons"));
    }

    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    private static extern void SHChangeNotify(uint EventId, uint Flags, string Path, IntPtr Reserved);
}
