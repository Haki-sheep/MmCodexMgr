// One material per layer (and one for its trail), all on the FXForge/Particle
// shader. Materials are named after the layer id, so re-importing an effect
// updates them in place.

#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace FXForge.Editor
{
    internal static class FxMaterials
    {
        const string ShaderName = "FXForge/Particle";

        public static Material Particle(string root, FxLayer L)
        {
            var m = L.material ?? new FxMaterial();
            var mat = Load(root, $"FX_{Safe(L.id)}", m.customShader);
            mat.mainTexture = Texture(root, MainTextureName(L));
            SetBlend(mat, L.blend);
            mat.SetFloat("_Intensity", m.intensity);
            // flipbooks drive the UVs through the Texture Sheet Animation module
            bool sheet = L.sheet != null && L.sheet.enabled;
            mat.SetVector("_Scroll", sheet ? Vector4.zero : new Vector4(m.scrollX, m.scrollY, 0, 0));

            Keyword(mat, "_DISSOLVE_ON", "_Dissolve", m.dissolve);
            bool ownTex = !string.IsNullOrEmpty(m.dissolveTextureFile);
            mat.SetTexture("_NoiseTex", Texture(root, ownTex ? m.dissolveTextureFile : "fx_tile_dissolve"));
            mat.SetFloat("_DissolveTexOn", ownTex ? 1f : 0f);
            mat.SetFloat("_DissolveSoft", Mathf.Max(0.001f, m.dissolveSoftness));
            var curve = FxCurveTexture.Get(root, $"FX_{Safe(L.id)}_dissolve", m.dissolveCurve);
            mat.SetFloat("_DissolveCurveOn", curve != null ? 1f : 0f);
            mat.SetTexture("_DissolveCurve", curve);
            mat.SetVector("_DissolveRange", new Vector4(m.dissolveFrom, m.dissolveTo, 0, 0));
            mat.SetFloat("_DissolveEdge", m.dissolveEdge);
            mat.SetFloat("_DissolveScale", m.dissolveScale);
            mat.SetColor("_EdgeColor", FxCurves.Hex(m.dissolveEdgeColor, Color.white));

            bool fresnel = L.renderMode == "mesh" && m.fresnel > 0;
            Keyword(mat, "_FRESNEL_ON", "_FresnelOn", fresnel);
            mat.SetFloat("_Fresnel", m.fresnel);
            mat.SetFloat("_FresnelPower", m.fresnelPower);
            mat.SetColor("_FresnelColor", FxCurves.Hex(m.fresnelColor, Color.white));

            Keyword(mat, "_SOFT_ON", "_SoftOn", m.softness > 0);
            mat.SetFloat("_Softness", Mathf.Max(0.01f, m.softness));
            EditorUtility.SetDirty(mat);
            return mat;
        }

        /** Trails: same shader, texture and intensity; no age-based features. */
        public static Material Trail(string root, FxLayer L)
        {
            var mat = Load(root, $"FX_{Safe(L.id)}_trail");
            mat.mainTexture = Texture(root, string.IsNullOrEmpty(L.trailTextureFile) ? "fx_trail" : L.trailTextureFile);
            SetBlend(mat, string.IsNullOrEmpty(L.trailBlend) ? L.blend : L.trailBlend);
            mat.SetFloat("_Intensity", (L.material != null ? L.material.intensity : 1f) * L.trailIntensity);
            mat.SetVector("_Scroll", Vector4.zero);
            Keyword(mat, "_DISSOLVE_ON", "_Dissolve", false);
            Keyword(mat, "_FRESNEL_ON", "_FresnelOn", false);
            Keyword(mat, "_SOFT_ON", "_SoftOn", false);
            EditorUtility.SetDirty(mat);
            return mat;
        }

        static string MainTextureName(FxLayer L)
        {
            if (L.sheet != null && L.sheet.enabled) return string.IsNullOrEmpty(L.sheet.assetFile) ? $"fx_sheet_{L.sheet.texture}" : L.sheet.assetFile;
            if (L.material != null && !string.IsNullOrEmpty(L.material.textureFile)) return L.material.textureFile;
            var main = L.material != null ? L.material.mainTexture : "sprite";
            if (main == "noise" || main == "streaks") return $"fx_tile_{main}";
            // stretched billboards run the texture's U axis along the motion (measured)
            return $"fx_{L.sprite}";
        }

        static Material Load(string root, string name, string shaderName = null)
        {
            var dir = $"{root}/Materials";
            if (!AssetDatabase.IsValidFolder(dir)) AssetDatabase.CreateFolder(root, "Materials");
            var path = $"{dir}/{name}.mat";
            var wanted = string.IsNullOrEmpty(shaderName) ? ShaderName : shaderName;
            var shader = Shader.Find(wanted);
            if (shader == null && wanted != ShaderName)
            {
                Debug.LogWarning($"[FX Forge] Custom shader '{wanted}' not found (did it fail to compile?); using {ShaderName}.");
                shader = Shader.Find(ShaderName);
            }
            if (shader == null)
            {
                Debug.LogWarning($"[FX Forge] Shader '{ShaderName}' not found; using a built-in particle shader instead.");
                shader = Shader.Find("Particles/Standard Unlit") ?? Shader.Find("Sprites/Default");
            }
            var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (mat == null)
            {
                mat = new Material(shader);
                AssetDatabase.CreateAsset(mat, path);
            }
            mat.shader = shader;
            return mat;
        }

        static Texture2D Texture(string root, string name)
        {
            var tex = AssetDatabase.LoadAssetAtPath<Texture2D>($"{root}/Textures/{name}.png");
            if (tex == null) Debug.LogWarning($"[FX Forge] Missing texture {root}/Textures/{name}.png");
            return tex;
        }

        /// <summary>Blend factors and the shader's output kind (0 straight, 1 premultiplied, 2 soft additive), as the preview does.</summary>
        static void SetBlend(Material mat, string blend)
        {
            bool custom = blend == "premultiply" || blend == "softAdd";
            mat.SetFloat("_SrcBlend", (float)(custom ? BlendMode.One : BlendMode.SrcAlpha));
            mat.SetFloat("_DstBlend", (float)(blend == "softAdd" ? BlendMode.OneMinusSrcColor : blend == "add" ? BlendMode.One : BlendMode.OneMinusSrcAlpha));
            mat.SetFloat("_BlendKind", blend == "premultiply" ? 1f : blend == "softAdd" ? 2f : 0f);
        }

        static void Keyword(Material mat, string keyword, string toggle, bool on)
        {
            mat.SetFloat(toggle, on ? 1f : 0f);
            if (on) mat.EnableKeyword(keyword);
            else mat.DisableKeyword(keyword);
        }

        static string Safe(string id) => string.IsNullOrEmpty(id) ? "layer" : System.Text.RegularExpressions.Regex.Replace(id, "[^A-Za-z0-9_]", "_");
    }
}
#endif
