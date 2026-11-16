// FX Forge: a layer's Trails module (Unity per-particle trails) and its trail material.
// Editor script, shipped with every package.

#if UNITY_EDITOR
using System.Linq;
using UnityEngine;

namespace FXForge.Editor
{
    public static class FxTrails
    {
        public static void Configure(ParticleSystem ps, FxLayer L, ParticleSystemRenderer r, string root)
        {
            var tr = ps.trails;
            tr.enabled = L.trails;
            if (!tr.enabled) { r.trailMaterial = null; return; }
            tr.mode = L.trailMode == "ribbon" ? ParticleSystemTrailMode.Ribbon : ParticleSystemTrailMode.PerParticle;
            tr.ribbonCount = Mathf.Clamp(L.trailRibbonCount, 1, 64);
            tr.ratio = Mathf.Clamp01(L.trailRatio);
            tr.lifetime = Mathf.Clamp(L.trailLifetime, 0.01f, 1f);
            tr.minVertexDistance = Mathf.Max(0, L.trailMinVertexDistance);
            tr.worldSpace = L.simulationSpace == "world" || !string.IsNullOrEmpty(L.subEmitterOf);
            tr.dieWithParticles = L.trailDieWithParticles;
            tr.textureMode = ParticleSystemTrailTextureMode.Stretch;
            tr.sizeAffectsWidth = L.trailSizeAffectsWidth;
            tr.sizeAffectsLifetime = false;
            var width = L.trailWidthCurve != null && L.trailWidthCurve.Length > 0
                ? FxCurves.FromKeys(L.trailWidthCurve)
                : AnimationCurve.Linear(0f, 1f, 1f, Mathf.Max(0f, L.trailWidthEnd));
            tr.widthOverTrail = new ParticleSystem.MinMaxCurve(Mathf.Max(0f, L.trailWidth), width);
            tr.inheritParticleColor = L.trailInheritColor;
            var colour = FxCurves.Hex(L.trailColor, Color.white);
            tr.colorOverLifetime = new ParticleSystem.MinMaxGradient(Gradient(
                new[] { new GradientColorKey(colour, 0f), new GradientColorKey(colour, 1f) },
                AlphaKeys(L.trailLifeAlpha, null)));
            // along the trail: FX Forge's classic trail fades 1 -> 0
            var along = L.trailAlongColors != null && L.trailAlongColors.Length > 0
                ? L.trailAlongColors.Take(8).Select(s => new GradientColorKey(FxCurves.Hex(s.color, Color.white), s.t)).ToArray()
                : new[] { new GradientColorKey(Color.white, 0f), new GradientColorKey(Color.white, 1f) };
            tr.colorOverTrail = new ParticleSystem.MinMaxGradient(Gradient(along, AlphaKeys(L.trailAlongAlpha, new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(0f, 1f) })));
            tr.generateLightingData = false;
            r.trailMaterial = FxMaterials.Trail(root, L);
        }

        static Gradient Gradient(GradientColorKey[] c, GradientAlphaKey[] a)
        {
            var g = new Gradient();
            g.SetKeys(c, a);
            return g;
        }

        /** A curve as gradient alpha keys (Unity keeps at most 8: the curve is sampled at 8 points then). */
        static GradientAlphaKey[] AlphaKeys(FxKey[] k, GradientAlphaKey[] none)
        {
            if (k == null || k.Length == 0) return none ?? new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 1f) };
            if (k.Length <= 8) return k.Select(x => new GradientAlphaKey(Mathf.Clamp01(x.v), x.t)).ToArray();
            var curve = FxCurves.FromKeys(k);
            return Enumerable.Range(0, 8).Select(i => new GradientAlphaKey(Mathf.Clamp01(curve.Evaluate(i / 7f)), i / 7f)).ToArray();
        }
    }
}
#endif
