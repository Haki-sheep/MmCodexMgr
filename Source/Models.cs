using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed class InstanceProfile
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "新实例";
    public string HomePath { get; set; } = "";
    public string DataPath { get; set; } = "";
    public string ColorHex { get; set; } = "#5465E8";
    public string Badge { get; set; } = "C";
    public string IconPath { get; set; } = "";
    public bool IsPrimary { get; set; }
    public override string ToString() => Name;
}

public sealed class ManagerSettings
{
    public List<InstanceProfile> InstanceList { get; set; } = new();
    public string SelectedId { get; set; } = "primary";
}

public static class ManagerPaths
{
    public static string Root => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CodexInstanceManager");
    public static string SettingsPath => Path.Combine(Root, "instances.json");
    public static string BackupRoot => Path.Combine(Root, "backups");
    public static string CcSettingsPath => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".cc-switch", "settings.json");
    public static string DefaultHome => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".codex");
    public static string Normalize(string Value) => Path.TrimEndingDirectorySeparator(Path.GetFullPath(Environment.ExpandEnvironmentVariables(Value)));
    public static bool Same(string Left, string Right) => string.Equals(Normalize(Left), Normalize(Right), StringComparison.OrdinalIgnoreCase);
    public static bool IsUnder(string PathValue, string Parent) => Normalize(PathValue).StartsWith(Normalize(Parent) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
}

public static class SettingsStore
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public static ManagerSettings Load()
    {
        if (File.Exists(ManagerPaths.SettingsPath))
            return JsonSerializer.Deserialize<ManagerSettings>(File.ReadAllText(ManagerPaths.SettingsPath)) ?? throw new InvalidDataException("实例配置为空");
        string SecondaryRoot = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "OpenAI", "Codex-Second");
        var Settings = new ManagerSettings();
        Settings.InstanceList.Add(new InstanceProfile { Id = "primary", Name = "主实例", HomePath = ManagerPaths.DefaultHome, IsPrimary = true, ColorHex = "#159C86", Badge = "1" });
        Settings.InstanceList.Add(new InstanceProfile { Id = "second", Name = "第二实例", HomePath = Path.Combine(SecondaryRoot, "codex-home"), DataPath = Path.Combine(SecondaryRoot, "desktop-data"), ColorHex = "#6470EE", Badge = "2" });
        Save(Settings);
        return Settings;
    }

    public static void Save(ManagerSettings Settings)
    {
        Directory.CreateDirectory(ManagerPaths.Root);
        AtomicWrite(ManagerPaths.SettingsPath, Encoding.UTF8.GetBytes(JsonSerializer.Serialize(Settings, JsonOptions)));
    }

    public static void AtomicWrite(string FilePath, byte[] DataList) => WriteAtomically(FilePath, TemporaryPath => File.WriteAllBytes(TemporaryPath, DataList));

    public static void AtomicCopy(string SourcePath, string DestinationPath) => WriteAtomically(DestinationPath, TemporaryPath =>
    {
        using var Source = File.OpenRead(SourcePath);
        using var Destination = new FileStream(TemporaryPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        Source.CopyTo(Destination);
    });

    private static void WriteAtomically(string FilePath, Action<string> WriteTemporary)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);
        string TemporaryPath = FilePath + ".manager-" + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            WriteTemporary(TemporaryPath);
            File.Move(TemporaryPath, FilePath, true);
        }
        finally
        {
            if (File.Exists(TemporaryPath)) File.Delete(TemporaryPath);
        }
    }

    public static string? FileHash(string FilePath)
    {
        if (!File.Exists(FilePath)) return null;
        using var Stream = File.OpenRead(FilePath);
        return Convert.ToHexString(SHA256.HashData(Stream));
    }
}
