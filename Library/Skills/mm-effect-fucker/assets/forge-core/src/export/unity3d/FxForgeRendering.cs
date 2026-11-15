// ParticleSystemRenderer settings for an FX Forge layer (its trails: FxForgeTrails.cs).

#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace FXForge.Editor
{
    internal static class FxRendering
    {
        public static void Configure(ParticleSystem ps, FxLayer L, int order, string root)
        {
            var r = Renderer(ps, L, order, root);
            FxTrails.Configure(ps, L, r, root);
            FxTextureSheet.Configure(ps, L);
        }

        // The FXForge/Particle shader reads particle age and a stable random from these.
        static readonly List<ParticleSystemVertexStream> Streams = new List<ParticleSystemVertexStream>
        {
            ParticleSystemVertexStream.Position,
            ParticleSystemVertexStream.Normal,
            ParticleSystemVertexStream.Color,
            ParticleSystemVertexStream.UV,
            ParticleSystemVertexStream.AgePercent,
            ParticleSystemVertexStream.InvStartLifetime,
            ParticleSystemVertexStream.StableRandomX,
        };

        static ParticleSystemRenderer Renderer(ParticleSystem ps, FxLayer L, int order, string root)
        {
            var r = ps.GetComponent<ParticleSystemRenderer>();
            r.enabled = L.rendered; // off: simulates (carries sub-emitters) but draws nothing
            switch (L.renderMode)
            {
                case "stretched": r.renderMode = ParticleSystemRenderMode.Stretch; r.lengthScale = L.lengthScale; r.velocityScale = L.velocityScale; r.cameraVelocityScale = 0; break;
                case "horizontal": r.renderMode = ParticleSystemRenderMode.HorizontalBillboard; break;
                case "vertical": r.renderMode = ParticleSystemRenderMode.VerticalBillboard; break;
                case "mesh": r.renderMode = ParticleSystemRenderMode.Mesh; r.mesh = FxMeshes.Get(root, L.mesh); break;
                case "none": r.renderMode = ParticleSystemRenderMode.None; break;
                default: r.renderMode = ParticleSystemRenderMode.Billboard; break;
            }
            r.alignment = L.renderMode != "mesh" ? ParticleSystemRenderSpace.View
                : L.meshAlign == "velocity" ? ParticleSystemRenderSpace.Velocity
                : L.meshAlign == "view" ? ParticleSystemRenderSpace.View
                : ParticleSystemRenderSpace.Local;
            r.SetActiveVertexStreams(Streams);
            r.pivot = L.pivot != null ? L.pivot.V : Vector3.zero;
            r.flip = L.renderMode != "mesh" && L.flip != null ? new Vector3(L.flip.x, L.flip.y, 0) : Vector3.zero;
            // Apply Active Color Space (serialized only; no script property in 2022.3)
            var so = new SerializedObject(r);
            var acs = so.FindProperty("m_ApplyActiveColorSpace");
            if (acs != null && acs.boolValue != L.applyColorSpace) { acs.boolValue = L.applyColorSpace; so.ApplyModifiedPropertiesWithoutUndo(); }
            // Unity shrinks particles bigger than half the screen by default
            // (Max Particle Size 0.5), which would cut big flashes and ground circles
            r.minParticleSize = Mathf.Max(0, L.minParticleSize);
            r.maxParticleSize = Mathf.Max(r.minParticleSize, L.maxParticleSize);
            r.sortingOrder = order; // keep the FX Forge layer order
            r.sortMode = L.sortMode == "distance" ? ParticleSystemSortMode.Distance
                : L.sortMode == "oldestInFront" ? ParticleSystemSortMode.OldestInFront
                : L.sortMode == "youngestInFront" ? ParticleSystemSortMode.YoungestInFront
                : ParticleSystemSortMode.None;
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            r.receiveShadows = false;
            r.sharedMaterial = FxMaterials.Particle(root, L);
            return r;
        }
    }
}
#endif
