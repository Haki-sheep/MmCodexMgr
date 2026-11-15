// Turns an FX Forge layer into a sub-emitter of its parent layer.

#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace FXForge.Editor
{
    internal static class FxSubEmitters
    {
        /// <summary>
        /// Seconds a prewarmed loop with sub-emitters is simulated by FxForgeEffect before it shows
        /// (their parents cannot use Prewarm, see Attach): long enough for the oldest parent and
        /// sub particle to come from a steady cycle, in whole cycles so the loop starts at its phase 0.
        /// 0 when the effect has no sub-emitters.
        /// </summary>
        public static float WarmUp(FxEffect fx, float duration)
        {
            float span = 0f;
            foreach (var L in fx.layers)
            {
                if (L == null || string.IsNullOrEmpty(L.subEmitterOf)) continue;
                var parent = fx.layers.FirstOrDefault(p => p != null && p.id == L.subEmitterOf);
                if (parent == null) continue;
                float burst = (L.bursts ?? new FxBurst[0]).Where(b => b != null).Select(b => b.time).DefaultIfEmpty(0).Max();
                span = Mathf.Max(span, parent.startOffset + (parent.startLifetime?.max ?? 0) + burst + (L.startLifetime?.max ?? 0));
            }
            return span > 0 ? Mathf.Ceil(span / duration) * duration : 0f;
        }

        public static void Attach(ParticleSystem parent, FxLayer parentLayer, ParticleSystem ps, FxLayer L, float duration)
        {
            var type = L.subEvent == "birth" ? ParticleSystemSubEmitterType.Birth
                : L.subEvent == "collision" ? ParticleSystemSubEmitterType.Collision
                : ParticleSystemSubEmitterType.Death;
            if (type == ParticleSystemSubEmitterType.Collision && !parentLayer.floor)
                Debug.LogWarning($"[FX Forge] '{L.name}' is a Collision sub-emitter but '{parentLayer.name}' has no floor collision, so it never fires.");

            // sub-emitter particles are born in the world at the parent particle
            var main = ps.main;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.prewarm = false;
            var em = ps.emission;
            if (type == ParticleSystemSubEmitterType.Birth)
            {
                // Birth: the rate runs per living parent particle; the bursts play once per
                // parent, timed from its birth, cycles included (measured in 2022.3)
                main.loop = true;
                main.duration = duration;
                em.rateOverTime = L.rate;
                em.SetBursts((L.bursts ?? new FxBurst[0]).Where(x => x != null && x.count > 0)
                    .Select(x => new ParticleSystem.Burst(x.time, (short)Mathf.Clamp(x.count, 0, 32767), Mathf.Max(1, x.cycles), Mathf.Max(0.01f, x.interval))).ToArray());
            }
            else
            {
                // Death / Collision: the bursts fire once per event
                main.loop = false;
                float last = (L.bursts ?? new FxBurst[0]).Where(b => b != null).Select(b => b.time).DefaultIfEmpty(0).Max();
                main.duration = Mathf.Max(0.05f, last + 0.05f);
                em.rateOverTime = 0f;
                var bursts = (L.bursts ?? new FxBurst[0]).Where(x => x != null && x.count > 0)
                    .Select(x => new ParticleSystem.Burst(x.time, (short)Mathf.Clamp(x.count, 0, 32767))).ToArray();
                em.SetBursts(bursts);
            }

            var iv = ps.inheritVelocity;
            iv.enabled = L.inheritVelocity != 0;
            if (iv.enabled)
            {
                iv.mode = ParticleSystemInheritVelocityMode.Initial;
                iv.curve = L.inheritVelocity;
            }

            // In Play Mode, Unity starts every sub-emitter particle made during the
            // parent's prewarm at age 0, so a prewarmed parent dumps a whole cycle of
            // bursts on the first frame (measured in 2022.3). Parents of sub-emitters
            // therefore start empty instead of prewarmed.
            var pm = parent.main;
            pm.prewarm = false;

            var props = ParticleSystemSubEmitterProperties.InheritNothing;
            if (L.inheritColor) props |= ParticleSystemSubEmitterProperties.InheritColor;
            if (L.inheritSize) props |= ParticleSystemSubEmitterProperties.InheritSize;
            var sub = parent.subEmitters;
            sub.enabled = true;
            sub.AddSubEmitter(ps, type, props);
        }
    }
}
#endif
