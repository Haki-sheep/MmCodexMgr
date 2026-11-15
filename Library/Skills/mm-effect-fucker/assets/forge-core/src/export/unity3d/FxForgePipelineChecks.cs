// Warnings about project settings an effect depends on (soft particles need
// the camera depth texture, copied before transparents are drawn).

#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace FXForge.Editor
{
    internal static class FxPipelineChecks
    {
        /**
         * URP keeps the depth texture settings on its pipeline asset and renderers.
         * Read them through serialized properties so FX Forge needs no URP assembly reference.
         */
        public static void WarnIfNoDepthTexture(string effect)
        {
            var asset = GraphicsSettings.currentRenderPipeline;
            if (asset == null) return; // Built-in: FxForgeDepthTexture turns it on at runtime
            var problems = new List<string>();
            var so = new SerializedObject(asset);
            var depth = so.FindProperty("m_RequireDepthTexture");
            if (depth != null && !depth.boolValue) problems.Add($"enable 'Depth Texture' on the URP asset ({asset.name})");
            var renderers = so.FindProperty("m_RendererDataList");
            for (int i = 0; renderers != null && i < renderers.arraySize; i++)
            {
                var data = renderers.GetArrayElementAtIndex(i).objectReferenceValue;
                if (data == null) continue;
                // CopyDepthMode: 0 After Opaques, 1 After Transparents, 2 Force Prepass
                var mode = new SerializedObject(data).FindProperty("m_CopyDepthMode");
                if (mode != null && mode.intValue == 1) problems.Add($"set 'Depth Texture Mode' to 'After Opaques' on the renderer '{data.name}'");
            }
            if (problems.Count > 0)
                Debug.LogWarning($"[FX Forge] '{effect}' uses soft particles: {string.Join("; ", problems)}. Otherwise they cannot read the scene depth and disappear or never fade.", asset);
        }
    }
}
#endif
