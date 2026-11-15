// FX Forge: a layer's Unity Light component (a point light on the layer's GameObject).
// Editor script, shipped with every package.

#if UNITY_EDITOR
using UnityEngine;

namespace FXForge.Editor
{
    public static class FxLights
    {
        public static void Add(GameObject go, FxLight L)
        {
            if (L == null || !L.enabled) return;
            var light = go.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = FxCurves.Hex(L.color, Color.white);
            light.intensity = Mathf.Max(0, L.intensity);
            light.range = Mathf.Max(0, L.range);
            light.shadows = LightShadows.None;
        }
    }
}
#endif
