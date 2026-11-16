using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Win32;

namespace CodexInstanceManager;

internal static class AgentTrayOriginal
{
    private sealed record LegacyBackup(string Provider, string Target, string Backup, string OriginalHash, string CandidateHash);

    public static Icon Load(string Provider, string Exe)
    {
        string Root = Path.Combine(Path.GetDirectoryName(Exe)!, "resources");
        bool Dark = Registry.GetValue(@"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize",
            "AppsUseLightTheme", 1) is 0;
        if (Provider == "antigravity")
        {
            using var Stream = new MemoryStream(ReadAsarIcon(Path.Combine(Root, "app.asar")));
            using var Image = new Bitmap(Stream);
            using var Bitmap = new Bitmap(Image, 256, 256);
            using var IconStream = new MemoryStream();
            BrandingService.WriteIcon(Bitmap, IconStream);
            IconStream.Position = 0;
            using var Icon = new Icon(IconStream, new Size(32, 32));
            return (Icon)Icon.Clone();
        }

        string PathValue = Provider switch
        {
            "codex" => Path.Combine(Root, Dark ? "chatgpt-tray-dark.ico" : "chatgpt-tray-light.ico"),
            "claude" => Path.Combine(Root, Dark ? "Tray-Win32-Dark.ico" : "Tray-Win32.ico"),
            "dsh" => Path.Combine(Root, "tray.ico"),
            "cursor" => Path.Combine(Root, "app", "resources", "win32", Dark ? "trayTemplateDark.ico" : "trayTemplate.ico"),
            _ => throw new ArgumentException("未知桌面 Agent " + Provider)
        };
        return new Icon(PathValue, new Size(32, 32));
    }

    public static void RestoreLegacyFiles()
    {
        if (!Directory.Exists(ManagerPaths.BackupRoot)) return;
        foreach (string DirectoryPath in Directory.EnumerateDirectories(ManagerPaths.BackupRoot, "agent-tray-*"))
        {
            string Manifest = Path.Combine(DirectoryPath, "manifest.json");
            if (!File.Exists(Manifest)) continue;
            var BackupList = JsonSerializer.Deserialize<List<LegacyBackup>>(File.ReadAllBytes(Manifest))
                ?? throw new InvalidDataException("托盘原图备份清单为空 " + Manifest);
            foreach (var Backup in BackupList)
            {
                if (!IsLegacyTarget(Backup.Provider, Backup.Target) || !ManagerPaths.IsUnder(Backup.Backup, DirectoryPath))
                    throw new IOException("托盘原图备份路径不符 " + Manifest);
                if (!File.Exists(Backup.Target)) continue;
                string ActualHash = Hash(File.ReadAllBytes(Backup.Target));
                if (!ActualHash.Equals(Backup.CandidateHash, StringComparison.OrdinalIgnoreCase)) continue;
                byte[] Original = File.ReadAllBytes(Backup.Backup);
                if (!Hash(Original).Equals(Backup.OriginalHash, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("托盘原件备份校验失败 " + Backup.Backup);
                SettingsStore.AtomicWrite(Backup.Target, Original);
            }
        }
    }

    private static string Hash(byte[] Data) => Convert.ToHexString(SHA256.HashData(Data));

    private static bool IsLegacyTarget(string Provider, string PathValue)
    {
        string Resources = Path.GetDirectoryName(PathValue) ?? "";
        if (Path.GetFileName(Resources) != "resources") return false;
        string App = Path.GetDirectoryName(Resources) ?? "";
        string Name = Path.GetFileName(PathValue);
        return Provider switch
        {
            "dsh" => Name == "tray.ico" && AgentDesktopBranding.Identify(Path.Combine(App, "DeepSeek Harness.exe"), "") == Provider,
            "claude" => Name is "Tray-Win32.ico" or "Tray-Win32-Dark.ico" && AgentDesktopBranding.Identify(Path.Combine(App, "claude.exe"), "") == Provider,
            _ => false
        };
    }

    private static byte[] ReadAsarIcon(string PathValue)
    {
        using var File = System.IO.File.OpenRead(PathValue);
        Span<byte> Header = stackalloc byte[16];
        File.ReadExactly(Header);
        uint HeaderSize = BinaryPrimitives.ReadUInt32LittleEndian(Header[4..8]);
        uint JsonSize = BinaryPrimitives.ReadUInt32LittleEndian(Header[12..16]);
        if (HeaderSize < 8 || JsonSize > HeaderSize - 8 || JsonSize > 8 * 1024 * 1024 || 8L + HeaderSize > File.Length)
            throw new InvalidDataException("Antigravity 资源索引无效");
        byte[] Index = new byte[JsonSize];
        File.ReadExactly(Index);
        using var Document = JsonDocument.Parse(Index);
        var Icon = Document.RootElement.GetProperty("files").GetProperty("icon.png");
        long Offset = long.Parse(Icon.GetProperty("offset").GetString()!, System.Globalization.CultureInfo.InvariantCulture);
        int Size = Icon.GetProperty("size").GetInt32();
        long DataStart = 8L + HeaderSize;
        if (Size is <= 0 or > 8 * 1024 * 1024 || Offset < 0 || Offset > File.Length - DataStart - Size)
            throw new InvalidDataException("Antigravity 托盘资源不在归档范围内");
        File.Position = DataStart + Offset;
        byte[] Data = new byte[Size];
        File.ReadExactly(Data);
        return Data;
    }
}
