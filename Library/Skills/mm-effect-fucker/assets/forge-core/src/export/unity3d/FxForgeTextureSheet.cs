// Texture Sheet Animation module for flipbook layers (Grid, Whole Sheet,
// read left to right and top to bottom like FX Forge's sheets). Built-in
// flipbooks are 4x4; library flipbooks bring their own grid.

#if UNITY_EDITOR
using UnityEngine;

namespace FXForge.Editor
{
    internal static class FxTextureSheet
    {
        const int Tiles = 4;

        public static void Configure(ParticleSystem ps, FxLayer L)
        {
            var tsa = ps.textureSheetAnimation;
            var s = L.sheet;
            tsa.enabled = s != null && s.enabled;
            if (!tsa.enabled) return;
            tsa.mode = ParticleSystemAnimationMode.Grid;
            bool custom = !string.IsNullOrEmpty(s.assetFile);
            int tx = custom ? Mathf.Max(1, s.tilesX) : Tiles, ty = custom ? Mathf.Max(1, s.tilesY) : Tiles;
            tsa.numTilesX = tx;
            tsa.numTilesY = ty;
            tsa.animation = ParticleSystemAnimationType.WholeSheet;
            if (s.mode == "fps")
            {
                tsa.timeMode = ParticleSystemAnimationTimeMode.FPS;
                tsa.fps = s.fps;
            }
            else
            {
                tsa.timeMode = ParticleSystemAnimationTimeMode.Lifetime;
                tsa.frameOverTime = FxCurves.Has(s.frameCurve)
                    ? new ParticleSystem.MinMaxCurve(1f, FxCurves.FromKeys(s.frameCurve))
                    : new ParticleSystem.MinMaxCurve(1f, AnimationCurve.Linear(0f, 0f, 1f, 1f));
                tsa.cycleCount = Mathf.Max(1, s.cycles);
            }
            // the script API's start frame is a fraction of the sheet (BakeMesh, 2022.3)
            tsa.startFrame = s.randomStart ? new ParticleSystem.MinMaxCurve(0f, 0.9999f) : new ParticleSystem.MinMaxCurve(Mathf.Clamp(s.startFrame, 0f, 0.9999f));
        }
    }
}
#endif
