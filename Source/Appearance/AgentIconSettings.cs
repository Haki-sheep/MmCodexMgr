using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed class AgentIconSettings
{
    public bool Enabled { get; set; }
    public Dictionary<string, string> CustomPathDict { get; set; } = new();
    public static readonly string[] ProviderList = { "codex", "claude", "dsh", "antigravity", "cursor" };
    private static string SettingsPath => Path.Combine(ManagerPaths.Root, "agent-icons.json");

    public static AgentIconSettings Load() => File.Exists(SettingsPath)
        ? JsonSerializer.Deserialize<AgentIconSettings>(File.ReadAllBytes(SettingsPath)) ?? throw new InvalidDataException("Agent 图标设置为空") : new();

    public void Save() => SettingsStore.AtomicWrite(SettingsPath, JsonSerializer.SerializeToUtf8Bytes(this));

    public AgentIconSettings Copy() => new() { Enabled = Enabled, CustomPathDict = new(CustomPathDict) };

    public Bitmap Draw(string Provider, string Badge, int Size, Color Color)
    {
        if (!CustomPathDict.TryGetValue(Provider, out string? PathValue)) return AgentAvatars.Draw(Provider, Badge, Size, Color);
        using var Source = ReadImage(PathValue);
        return AgentAvatars.Draw(Source, Badge, Size, Color);
    }

    public string Import(string Provider, string PathValue)
    {
        using var Source = ReadImage(PathValue);
        string Hash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(PathValue)))[..20];
        string Root = Path.Combine(ManagerPaths.Root, "icons", "custom");
        Directory.CreateDirectory(Root);
        string Target = Path.Combine(Root, Provider + "-" + Hash + ".png");
        if (!File.Exists(Target)) Source.Save(Target, System.Drawing.Imaging.ImageFormat.Png);
        CustomPathDict[Provider] = Target;
        return Target;
    }

    public InstanceProfile Branded(InstanceProfile Source, string Provider)
    {
        string Root = Path.Combine(ManagerPaths.Root, "icons");
        Directory.CreateDirectory(Root);
        string Signature = "settings-avatar-v2/" + Provider + "/" + Source.Id + "/" + Source.Badge + "/" + Source.ColorHex + "/" + CustomPathDict.GetValueOrDefault(Provider);
        string Hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Signature)))[..20];
        string Target = Path.Combine(Root, Provider + "-" + Hash + ".ico");
        if (!File.Exists(Target))
        {
            var BadgeColor = ColorTranslator.FromHtml(Source.ColorHex);
            if (CustomPathDict.TryGetValue(Provider, out string? CustomPath))
            {
                using var Custom = ReadImage(CustomPath);
                BrandingService.SaveIcon(Size => AgentAvatars.Draw(Custom, Source.Badge, Size, BadgeColor), Target);
            }
            else BrandingService.SaveIcon(Size => AgentAvatars.Draw(Provider, Source.Badge, Size, BadgeColor), Target);
        }
        return new() { Id = Source.Id, Name = Source.Name, Badge = Source.Badge, ColorHex = Source.ColorHex, IconPath = Target,
            HomePath = Source.HomePath, DataPath = Source.DataPath, IsPrimary = Source.IsPrimary };
    }

    public static Bitmap ReadImage(string PathValue)
    {
        if (Path.GetExtension(PathValue).Equals(".ico", StringComparison.OrdinalIgnoreCase))
        {
            using var Icon = new Icon(PathValue, new Size(256, 256));
            return Icon.ToBitmap();
        }
        using var Source = Image.FromFile(PathValue);
        return new Bitmap(Source);
    }
}
