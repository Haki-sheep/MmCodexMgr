// Value conversions shared by the module builders: ranges, colours, curves.

#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace FXForge.Editor
{
    internal static class FxCurves
    {
        public static ParticleSystem.MinMaxCurve Two(FxRange r, float k = 1f)
        {
            if (r == null) return new ParticleSystem.MinMaxCurve(0f);
            return Mathf.Approximately(r.min, r.max) ? new ParticleSystem.MinMaxCurve(r.min * k) : new ParticleSystem.MinMaxCurve(r.min * k, r.max * k);
        }

        public static Color Hex(string hex, Color fallback)
        {
            return ColorUtility.TryParseHtmlString(hex, out var c) ? c : fallback;
        }

        public static bool Has(FxKey[] k) => k != null && k.Length > 0;

        /** Value of an FX Forge curve at t (linear between keys, flat outside). */
        public static float Eval(FxKey[] k, float t)
        {
            if (t <= k[0].t) return k[0].v;
            for (int i = 1; i < k.Length; i++)
                if (t <= k[i].t) return Mathf.Lerp(k[i - 1].v, k[i].v, (t - k[i - 1].t) / Mathf.Max(1e-6f, k[i].t - k[i - 1].t));
            return k[k.Length - 1].v;
        }

        /** An AnimationCurve through the points with linear tangents (FX Forge interpolates linearly). */
        public static AnimationCurve Linear(IEnumerable<Vector2> points)
        {
            var keys = points.GroupBy(p => Mathf.Round(p.x * 10000)).Select(g => g.Last()).OrderBy(p => p.x).Select(p => new Keyframe(p.x, p.y)).ToArray();
            if (keys.Length == 1) keys = new[] { keys[0], new Keyframe(1, keys[0].value) };
            var c = new AnimationCurve(keys);
            for (int i = 0; i < c.length; i++)
            {
                AnimationUtility.SetKeyLeftTangentMode(c, i, AnimationUtility.TangentMode.Linear);
                AnimationUtility.SetKeyRightTangentMode(c, i, AnimationUtility.TangentMode.Linear);
            }
            return c;
        }

        public static AnimationCurve FromKeys(FxKey[] k, float scale = 1f) => Linear(k.Select(x => new Vector2(x.t, x.v * scale)));

        /** The rate curve, zero outside the emission window a..b (fractions of the duration). */
        public static AnimationCurve RateCurve(FxKey[] k, float a, float b)
        {
            const float e = 0.0005f;
            var pts = new List<Vector2>();
            foreach (var x in k) if (x.t >= a && x.t <= b) pts.Add(new Vector2(x.t, x.v));
            if (a > 0) { pts.Add(new Vector2(0, 0)); pts.Add(new Vector2(Mathf.Max(0, a - e), 0)); }
            pts.Add(new Vector2(a, Eval(k, a)));
            pts.Add(new Vector2(b, Eval(k, b)));
            if (b < 1) { pts.Add(new Vector2(Mathf.Min(1, b + e), 0)); pts.Add(new Vector2(1, 0)); }
            return Linear(pts);
        }

        /** Unity gradients hold at most 8 alpha keys: drop the ones that matter least. */
        static List<FxKey> Simplify(FxKey[] keys, int max)
        {
            var k = keys.ToList();
            while (k.Count > max)
            {
                int best = 1; float bestErr = float.MaxValue;
                for (int i = 1; i < k.Count - 1; i++)
                {
                    float lerp = Mathf.Lerp(k[i - 1].v, k[i + 1].v, (k[i].t - k[i - 1].t) / Mathf.Max(1e-6f, k[i + 1].t - k[i - 1].t));
                    float err = Mathf.Abs(lerp - k[i].v) * (k[i + 1].t - k[i - 1].t);
                    if (err < bestErr) { bestErr = err; best = i; }
                }
                k.RemoveAt(best);
            }
            return k;
        }

        /** A 0..1 curve as gradient alpha keys ([] = opaque; at most 8 keys). */
        public static GradientAlphaKey[] AlphaKeys(FxKey[] k)
        {
            if (!Has(k)) return new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 1f) };
            return Simplify(k, 8).Select(x => new GradientAlphaKey(Mathf.Clamp01(x.v), Mathf.Clamp01(x.t))).ToArray();
        }

        public static GradientAlphaKey[] AlphaKeys(FxLayer L)
        {
            if (Has(L.alphaCurve))
                return Simplify(L.alphaCurve, 8).Select(k => new GradientAlphaKey(Mathf.Clamp01(k.v * L.alpha), Mathf.Clamp01(k.t))).ToArray();
            float a = Mathf.Clamp01(L.alpha);
            float fi = Mathf.Clamp01(L.fadeIn), fo = Mathf.Clamp01(L.fadeOut);
            var keys = new List<GradientAlphaKey> { new GradientAlphaKey(fi > 0 ? 0f : a, 0f) };
            if (fi > 0) keys.Add(new GradientAlphaKey(a, Mathf.Min(fi, 1f - fo)));
            if (fo > 0) keys.Add(new GradientAlphaKey(a, Mathf.Max(1f - fo, fi)));
            keys.Add(new GradientAlphaKey(fo > 0 ? 0f : a, 1f));
            return keys.GroupBy(k => Mathf.Round(k.time * 1000)).Select(g => g.First()).Take(8).ToArray();
        }

        public static float SizeAt(string ease, float f, float end)
        {
            switch (ease)
            {
                case "easeOut": return 1 + (end - 1) * (1 - (1 - f) * (1 - f));
                case "easeIn": return 1 + (end - 1) * f * f;
                case "pop":
                    if (f < 0.12f) return f / 0.12f * 1.18f;
                    if (f < 0.25f) return 1.18f - (f - 0.12f) / 0.13f * 0.18f;
                    if (f < 0.7f) return 1f;
                    return 1 + (end - 1) * ((f - 0.7f) / 0.3f);
                default: return 1 + (end - 1) * f;
            }
        }

        public static AnimationCurve SizeCurve(string ease, float end)
        {
            float[] ts = ease == "pop"
                ? new[] { 0f, 0.06f, 0.12f, 0.25f, 0.7f, 0.85f, 1f }
                : ease == "linear" ? new[] { 0f, 1f } : new[] { 0f, 0.125f, 0.25f, 0.375f, 0.5f, 0.625f, 0.75f, 0.875f, 1f };
            var c = new AnimationCurve(ts.Select(t => new Keyframe(t, SizeAt(ease, t, end))).ToArray());
            for (int i = 0; i < c.length; i++)
            {
                AnimationUtility.SetKeyLeftTangentMode(c, i, AnimationUtility.TangentMode.Linear);
                AnimationUtility.SetKeyRightTangentMode(c, i, AnimationUtility.TangentMode.Linear);
            }
            return c;
        }


        /// <summary>A 0/1 step curve that is on between fractions a and b of the loop.</summary>
        public static AnimationCurve StepCurve(float a, float b)
        {
            var k = new List<Keyframe>();
            k.Add(new Keyframe(0f, a > 0 ? 0f : 1f, 0, 0));
            if (a > 0) k.Add(new Keyframe(a, 1f, float.PositiveInfinity, float.PositiveInfinity));
            if (b < 1) k.Add(new Keyframe(b, 0f, float.PositiveInfinity, float.PositiveInfinity));
            k.Add(new Keyframe(1f, b < 1 ? 0f : 1f, 0, 0));
            var curve = new AnimationCurve(k.ToArray());
            for (int i = 0; i < curve.length; i++)
            {
                AnimationUtility.SetKeyLeftTangentMode(curve, i, AnimationUtility.TangentMode.Constant);
                AnimationUtility.SetKeyRightTangentMode(curve, i, AnimationUtility.TangentMode.Constant);
            }
            return curve;
        }
    }
}
#endif
