// Small lookup textures for curves the FX Forge particle shader reads per
// pixel (the dissolve cut-off over the particle's life): 64 x 1 float, sampled
// with the particle's life fraction. Saved next to the layer's material so a
// re-import updates it in place.

#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace FXForge.Editor
{
    internal static class FxCurveTexture
    {
        const int Width = 64;

        /** The curve's texture `<root>/Materials/<name>.asset`, or null when the curve is empty. */
        public static Texture2D Get(string root, string name, FxKey[] keys)
        {
            if (!FxCurves.Has(keys)) return null;
            var path = $"{root}/Materials/{name}.asset";
            var tex = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
            bool created = tex == null;
            if (created) tex = new Texture2D(Width, 1, TextureFormat.RFloat, false, true) { name = name };
            tex.wrapMode = TextureWrapMode.Clamp;
            tex.filterMode = FilterMode.Bilinear;
            var px = new Color[Width];
            for (int i = 0; i < Width; i++) px[i] = new Color(FxCurves.Eval(keys, i / (float)(Width - 1)), 0, 0, 1);
            tex.SetPixels(px);
            tex.Apply(false, false);
            if (created) AssetDatabase.CreateAsset(tex, path);
            else EditorUtility.SetDirty(tex);
            return tex;
        }
    }
}
#endif
