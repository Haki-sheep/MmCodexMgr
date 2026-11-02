using System.Text.RegularExpressions;

namespace CodexInstanceManager;

public static class SkillNames
{
    public const string Collaboration = "mm-more-more-fucker";
    /// <summary> 自维护技能的历史标识映射 </summary>
    public static readonly IReadOnlyDictionary<string, string> LegacyNameDict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["blender-unity-character"] = "mm-blender-fucker", ["fakeunity-cli"] = "mm-fake-unity-fucker",
        ["miemie-ui-runtime"] = "mm-mie-mie-ui-fucker", ["mm-money-fucker"] = "mm-money-fucker",
        ["mm-performance-analysis"] = "mm-performance-fucker", ["moremore-work"] = Collaboration,
        ["ShaderAssetFucker"] = "mm-shader-asset-fucker",
        ["MmCodingFucker"] = "mm-coding-fucker", ["MmPlanFucker"] = "mm-plan-fucker"
    };

    public static string Portable(string Name)
    {
        string Value = Regex.Replace(Name, "([A-Z]+)([A-Z][a-z])", "$1-$2");
        Value = Regex.Replace(Value, "([a-z0-9])([A-Z])", "$1-$2");
        Value = Regex.Replace(Value, "[._-]+", "-").ToLowerInvariant();
        if (Value.Length > 64 || !Regex.IsMatch(Value, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) throw new InvalidDataException("无法转换为兼容 Skill 标识 " + Name);
        return Value;
    }
}
