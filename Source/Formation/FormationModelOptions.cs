using System.Text.Json;
using Tomlyn;
using Tomlyn.Model;

namespace CodexInstanceManager;

internal sealed record FormationModelOptions(string Default, IReadOnlyList<string> Models, string? Issue = null)
{
    private sealed record CatalogModel(string Id, bool Hidden, IReadOnlyList<string> EffortList);
    private sealed record CatalogOptions(string Default, IReadOnlyList<CatalogModel> ModelList, string? Issue = null);

    public static FormationModelOptions Load(ManagerSettings Settings, string InstanceId, IReadOnlyList<string> Hints)
    {
        var Profile = Settings.InstanceList.FirstOrDefault(Item => Item.Id == InstanceId);
        if (string.IsNullOrWhiteSpace(Profile?.HomePath))
            return new(InstanceId == CursorRelayRunner.InstanceId ? Settings.Cursor.Model : "", Hints);
        var Catalog = LoadCatalog(Profile);
        var ModelList = Catalog.ModelList.Where(Model => !Model.Hidden).Select(Model => Model.Id).Distinct(StringComparer.Ordinal).ToArray();
        return new(Catalog.Default, ModelList.Length == 0 ? Hints : ModelList, Catalog.Issue);
    }

    internal static string ResolveEffort(InstanceProfile Profile, string Model, string Preference, bool UseInstanceDefault)
    {
        if (Preference.Length == 0 || Profile.HomePath.Length == 0 || Model.Length == 0 && !UseInstanceDefault) return "";
        var Ranking = RelayLimits.CodexThinkingList;
        int PreferredRank = EffortRank(Preference);
        if (PreferredRank == Ranking.Count) throw new InvalidOperationException("未知拟推理强度 " + Preference);
        var Catalog = LoadCatalog(Profile);
        string ModelId = Model.Length == 0 ? Catalog.Default : Model;
        var Options = Catalog.ModelList.FirstOrDefault(Item => Item.Id == ModelId)?.EffortList;
        return Options?.Where(Option => EffortRank(Option) < Ranking.Count)
            .OrderBy(Option => Math.Abs(EffortRank(Option) - PreferredRank))
            .ThenBy(EffortRank).FirstOrDefault() ?? "";
    }

    private static int EffortRank(string Value)
    {
        var Ranking = RelayLimits.CodexThinkingList;
        for (int Index = 0; Index < Ranking.Count; Index++)
            if (Ranking[Index] == Value) return Index;
        return Ranking.Count;
    }

    private static CatalogOptions LoadCatalog(InstanceProfile Profile)
    {
        string defaultModel = "";
        try
        {
            string home = ManagerPaths.Normalize(Profile.HomePath);
            string configPath = Path.Combine(home, "config.toml");
            string? catalogPath = null;
            if (File.Exists(configPath))
            {
                if (!Toml.TryToModel<TomlTable>(File.ReadAllText(configPath), out var Config, out _))
                    return new("", [], "实例配置格式无效，可手动输入模型 ID。");
                defaultModel = Config.TryGetValue("model", out var ModelValue) ? ModelValue as string ?? "" : "";
                catalogPath = Config.TryGetValue("model_catalog_json", out var CatalogValue) ? CatalogValue as string : null;
            }

            if (string.IsNullOrWhiteSpace(catalogPath))
            {
                catalogPath = Path.Combine(home, "models_cache.json");
                if (!File.Exists(catalogPath)) return new(defaultModel, []);
            }
            else
            {
                catalogPath = Path.GetFullPath(catalogPath, home);
            }

            using var Catalog = JsonDocument.Parse(File.ReadAllText(catalogPath));
            if (Catalog.RootElement.ValueKind != JsonValueKind.Object ||
                !Catalog.RootElement.TryGetProperty("models", out var ModelArray) || ModelArray.ValueKind != JsonValueKind.Array)
                return new(defaultModel, [], "模型目录缺少 models 列表，可手动输入模型 ID。");
            var ModelList = new List<CatalogModel>();
            foreach (var Item in ModelArray.EnumerateArray())
            {
                if (Item.ValueKind != JsonValueKind.Object) continue;
                string? id = StringProperty(Item, "slug");
                if (string.IsNullOrWhiteSpace(id)) continue;
                var EffortList = Item.TryGetProperty("supported_reasoning_levels", out var Options) && Options.ValueKind == JsonValueKind.Array
                    ? Options.EnumerateArray().Where(Option => Option.ValueKind == JsonValueKind.Object)
                        .Select(Option => StringProperty(Option, "effort")).OfType<string>().ToArray()
                    : Array.Empty<string>();
                ModelList.Add(new(id, StringProperty(Item, "visibility") == "hide", EffortList));
            }
            return new(defaultModel, ModelList);
        }
        catch (Exception Error) when (Error is IOException or UnauthorizedAccessException or JsonException or ArgumentException)
        {
            return new(defaultModel, [], "读取实例模型目录失败，可手动输入模型 ID。");
        }
    }

    private static string? StringProperty(JsonElement Item, string Name)
        => Item.TryGetProperty(Name, out var Value) && Value.ValueKind == JsonValueKind.String ? Value.GetString() : null;
}
