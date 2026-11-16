using System.Text.Json;
using Tomlyn;
using Tomlyn.Model;

namespace CodexInstanceManager;

internal sealed record FormationModelOptions(string Default, IReadOnlyList<string> Models, string? Issue = null)
{
    public static FormationModelOptions Load(ManagerSettings Settings, string InstanceId, IReadOnlyList<string> Hints)
    {
        var Profile = Settings.InstanceList.FirstOrDefault(Item => Item.Id == InstanceId);
        if (string.IsNullOrWhiteSpace(Profile?.HomePath))
            return new(InstanceId == CursorRelayRunner.InstanceId ? Settings.Cursor.Model : "", Hints);

        string defaultModel = "";
        try
        {
            string home = ManagerPaths.Normalize(Profile.HomePath);
            string configPath = Path.Combine(home, "config.toml");
            string? catalogPath = null;
            if (File.Exists(configPath))
            {
                if (!Toml.TryToModel<TomlTable>(File.ReadAllText(configPath), out var Config, out _))
                    return new("", Hints, "实例配置格式无效，可手动输入模型 ID。");
                defaultModel = Config.TryGetValue("model", out var ModelValue) ? ModelValue as string ?? "" : "";
                catalogPath = Config.TryGetValue("model_catalog_json", out var CatalogValue) ? CatalogValue as string : null;
            }

            if (string.IsNullOrWhiteSpace(catalogPath))
            {
                catalogPath = Path.Combine(home, "models_cache.json");
                if (!File.Exists(catalogPath)) return new(defaultModel, Hints);
            }
            else
            {
                catalogPath = Path.GetFullPath(catalogPath, home);
            }

            using var Catalog = JsonDocument.Parse(File.ReadAllText(catalogPath));
            if (Catalog.RootElement.ValueKind != JsonValueKind.Object ||
                !Catalog.RootElement.TryGetProperty("models", out var ModelArray) || ModelArray.ValueKind != JsonValueKind.Array)
                return new(defaultModel, Hints, "模型目录缺少 models 列表，可手动输入模型 ID。");
            var ModelList = new List<string>();
            foreach (var Item in ModelArray.EnumerateArray())
            {
                if (Item.ValueKind != JsonValueKind.Object || StringProperty(Item, "visibility") == "hide") continue;
                string? id = StringProperty(Item, "slug");
                if (!string.IsNullOrWhiteSpace(id)) ModelList.Add(id);
            }
            return new(defaultModel, ModelList.Count == 0 ? Hints : ModelList.Distinct(StringComparer.Ordinal).ToArray());
        }
        catch (Exception Error) when (Error is IOException or UnauthorizedAccessException or JsonException or ArgumentException)
        {
            return new(defaultModel, Hints, "读取实例模型目录失败，可手动输入模型 ID。");
        }
    }

    private static string? StringProperty(JsonElement Item, string Name)
        => Item.TryGetProperty(Name, out var Value) && Value.ValueKind == JsonValueKind.String ? Value.GetString() : null;
}
