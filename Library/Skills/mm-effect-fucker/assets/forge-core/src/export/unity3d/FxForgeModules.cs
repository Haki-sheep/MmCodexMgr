// One method per Unity ParticleSystem module, filled from an FX Forge layer.

#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace FXForge.Editor
{
    internal static class FxModules
    {
        /// <summary>Applies every module of one FX Forge layer to a ParticleSystem.</summary>
        public static void Configure(ParticleSystem ps, FxLayer L, float duration, bool loop, bool prewarm, int order, string root, Transform floor)
        {
            // each layer loops over its own duration when it has one (Unity's per-system Duration)
            float own = L.loopDuration > 0 ? L.loopDuration : duration;
            Main(ps, L, own, loop, prewarm);
            Emission(ps, L, own);
            Shape(ps, L);
            Velocity(ps, L);
            Force(ps, L);
            LimitVelocity(ps, L);
            Noise(ps, L);
            ColorOverLifetime(ps, L);
            SizeOverLifetime(ps, L);
            RotationOverLifetime(ps, L);
            RotationBySpeed(ps, L);
            Collision(ps, L, floor);
            FxRendering.Configure(ps, L, order, root);
        }

        static void Main(ParticleSystem ps, FxLayer L, float duration, bool loop, bool prewarm)
        {
            var main = ps.main;
            main.duration = duration;
            main.loop = loop;
            main.prewarm = prewarm; // Looping + Prewarm starts mid-cycle, like the FX Forge preview
            main.playOnAwake = true;
            main.startDelay = Mathf.Max(0f, L.startOffset); // shifts the whole layer once
            main.startLifetime = FxCurves.Two(L.startLifetime);
            main.startSpeed = FxCurves.Two(L.startSpeed);
            // Unity draws horizontal and vertical billboards at 1/sqrt(2) of the
            // start size (measured in 2022.3); compensate so sizes match FX Forge
            bool flatMode = L.renderMode == "horizontal" || L.renderMode == "vertical";
            float k = flatMode ? 1.41421356f : 1f;
            main.startSize3D = L.startSize3D;
            if (L.startSize3D)
            {
                main.startSizeX = FxCurves.Two(L.startSize, k);
                main.startSizeY = FxCurves.Two(L.startSizeY, k);
                main.startSizeZ = FxCurves.Two(L.startSizeZ, k);
            }
            else main.startSize = FxCurves.Two(L.startSize, k);
            // random-aligned meshes tumble in 3D; everything else rolls around its view/forward axis
            bool tumble = L.renderMode == "mesh" && L.meshAlign == "random";
            main.startRotation3D = tumble || LocalMesh(L);
            if (tumble)
            {
                var any = new ParticleSystem.MinMaxCurve(0f, 2f * Mathf.PI);
                main.startRotationX = any;
                main.startRotationY = any;
                main.startRotationZ = any;
            }
            else if (LocalMesh(L))
            {
                main.startRotationX = L.startRotation3D ? FxCurves.Two(L.startRotationX, Mathf.Deg2Rad) : new ParticleSystem.MinMaxCurve(0f);
                main.startRotationY = L.startRotation3D ? FxCurves.Two(L.startRotationY, Mathf.Deg2Rad) : new ParticleSystem.MinMaxCurve(0f);
                main.startRotationZ = FxCurves.Two(L.startRotation, Mathf.Deg2Rad);
            }
            else main.startRotation = FxCurves.Two(L.startRotation, Mathf.Deg2Rad);
            main.flipRotation = Mathf.Clamp01(L.flipRotation);
            var c1 = FxCurves.Hex(L.startColor, Color.white);
            var c2 = FxCurves.Hex(L.startColor2, c1);
            main.startColor = c1 == c2 ? new ParticleSystem.MinMaxGradient(c1) : new ParticleSystem.MinMaxGradient(c1, c2);
            if (L.startGradient != null && L.startGradient.Length > 0)
            {
                // Start Color as a gradient: by the system's time (Gradient) or at random (Random Color)
                var ck = L.startGradient.Take(8).Select(s => new GradientColorKey(FxCurves.Hex(s.color, Color.white), Mathf.Clamp01(s.t))).ToList();
                if (ck.Count == 1) ck.Add(new GradientColorKey(ck[0].color, 1f));
                var g = new Gradient();
                g.SetKeys(ck.ToArray(), FxCurves.AlphaKeys(L.startGradientAlpha));
                var sc = new ParticleSystem.MinMaxGradient(g);
                if (L.startGradientMode == "random") sc.mode = ParticleSystemGradientMode.RandomColor;
                main.startColor = sc;
            }
            main.gravityModifier = L.gravityModifier;
            main.simulationSpace = L.simulationSpace == "world" ? ParticleSystemSimulationSpace.World : ParticleSystemSimulationSpace.Local;
            main.scalingMode = ParticleSystemScalingMode.Hierarchy;
            main.maxParticles = Mathf.Max(1, L.maxParticles);
            main.simulationSpeed = Mathf.Max(0.01f, L.simulationSpeed);
            main.stopAction = ParticleSystemStopAction.None;
        }

        static void Emission(ParticleSystem ps, FxLayer L, float duration)
        {
            var em = ps.emission;
            em.enabled = true;
            float a = Mathf.Clamp01(L.startDelay / duration);
            float b = L.stopAfter > 0 ? Mathf.Clamp01(L.stopAfter / duration) : 1f;
            if (L.rate <= 0 || b <= a)
            {
                em.rateOverTime = 0f;
            }
            else if (FxCurves.Has(L.rateCurve))
            {
                // rate over the system's duration, zero outside the emission window
                em.rateOverTime = new ParticleSystem.MinMaxCurve(L.rate, FxCurves.RateCurve(L.rateCurve, a, b));
            }
            else if (a <= 0f && b >= 1f)
            {
                em.rateOverTime = L.rate;
            }
            else
            {
                em.rateOverTime = new ParticleSystem.MinMaxCurve(L.rate, FxCurves.StepCurve(a, b));
            }
            em.rateOverDistance = Mathf.Max(0, L.rateOverDistance);
            var bursts = (L.bursts ?? new FxBurst[0]).Where(x => x != null && x.count > 0 && x.time < duration)
                .Select(x =>
                {
                    var burst = new ParticleSystem.Burst(x.time, (short)Mathf.Clamp(x.count, 0, 32767), Mathf.Max(1, x.cycles), Mathf.Max(0.01f, x.interval));
                    burst.probability = Mathf.Clamp01(x.probability);
                    return burst;
                }).ToArray();
            em.SetBursts(bursts);
        }

        static void Shape(ParticleSystem ps, FxLayer L)
        {
            var sh = ps.shape;
            sh.enabled = true;
            sh.position = Vector3.zero;
            sh.rotation = Vector3.zero;
            sh.scale = L.boxSize != null ? L.boxSize.V : Vector3.one;
            sh.radius = Mathf.Max(0.0001f, L.radius);
            sh.radiusThickness = Mathf.Clamp01(L.radiusThickness);
            sh.arc = Mathf.Clamp(L.arc, 0, 360);
            sh.arcMode = L.arcMode == "loop" ? ParticleSystemShapeMultiModeValue.Loop
                : L.arcMode == "pingpong" ? ParticleSystemShapeMultiModeValue.PingPong
                : L.arcMode == "burstSpread" ? ParticleSystemShapeMultiModeValue.BurstSpread
                : ParticleSystemShapeMultiModeValue.Random;
            sh.arcSpeed = L.arcSpeed;
            sh.arcSpread = Mathf.Clamp01(L.arcSpread);
            sh.angle = Mathf.Clamp(L.angle, 0, 90);
            sh.randomDirectionAmount = Mathf.Clamp01(L.randomDirection);
            sh.sphericalDirectionAmount = Mathf.Clamp01(L.spherizeDirection);
            sh.alignToDirection = L.alignToDirection;
            switch (L.shape)
            {
                case "sphere": sh.shapeType = ParticleSystemShapeType.Sphere; break;
                case "hemisphere": sh.shapeType = ParticleSystemShapeType.Hemisphere; break;
                case "box": sh.shapeType = ParticleSystemShapeType.Box; break;
                case "coneVolume": sh.shapeType = ParticleSystemShapeType.ConeVolume; sh.length = Mathf.Max(0.0001f, L.coneLength); break;
                case "rectangle": sh.shapeType = ParticleSystemShapeType.Rectangle; sh.scale = new Vector3(L.boxSize.x, L.boxSize.y, 1); break;
                case "donut": sh.shapeType = ParticleSystemShapeType.Donut; sh.donutRadius = Mathf.Max(0.0001f, L.donutRadius); break;
                case "circle": sh.shapeType = ParticleSystemShapeType.Circle; break;
                case "edge": sh.shapeType = ParticleSystemShapeType.SingleSidedEdge; break;
                default: sh.shapeType = ParticleSystemShapeType.Cone; break;
            }
        }

        static void Velocity(ParticleSystem ps, FxLayer L)
        {
            // space while orbital speeds are around the layer's own axes, so we
            // run the module in local space and rotate the linear part into it.
            var vel = ps.velocityOverLifetime;
            var lin = L.velocity.V;
            var orb = L.orbital.V;
            bool curves = FxCurves.Has(L.velocityCurveX) || FxCurves.Has(L.velocityCurveY) || FxCurves.Has(L.velocityCurveZ);
            bool modifier = FxCurves.Has(L.speedModifier);
            vel.enabled = lin != Vector3.zero || orb != Vector3.zero || L.radial != 0 || curves || modifier;
            if (vel.enabled)
            {
                vel.space = ParticleSystemSimulationSpace.Local;
                // the layer's rotation relative to the effect root (parents included)
                var rot = Quaternion.Inverse(ps.transform.root.rotation) * ps.transform.rotation;
                if (curves)
                {
                    // FX Forge's curves are in world axes; Unity needs the same mode on x, y and z,
                    // so every axis becomes a curve, sampled where any of them has a key
                    var ts = new[] { L.velocityCurveX, L.velocityCurveY, L.velocityCurveZ }.Where(FxCurves.Has).SelectMany(c => c.Select(k => k.t))
                        .Concat(new[] { 0f, 1f }).Distinct().OrderBy(t => t).ToArray();
                    float Axis(FxKey[] c, float constant, float t) => FxCurves.Has(c) ? FxCurves.Eval(c, t) : constant;
                    var local = ts.Select(t => Quaternion.Inverse(rot) * new Vector3(Axis(L.velocityCurveX, lin.x, t), Axis(L.velocityCurveY, lin.y, t), Axis(L.velocityCurveZ, lin.z, t))).ToArray();
                    vel.x = new ParticleSystem.MinMaxCurve(1f, FxCurves.Linear(ts.Select((t, i) => new Vector2(t, local[i].x))));
                    vel.y = new ParticleSystem.MinMaxCurve(1f, FxCurves.Linear(ts.Select((t, i) => new Vector2(t, local[i].y))));
                    vel.z = new ParticleSystem.MinMaxCurve(1f, FxCurves.Linear(ts.Select((t, i) => new Vector2(t, local[i].z))));
                }
                else
                {
                    var local = Quaternion.Inverse(rot) * lin;
                    vel.x = local.x; vel.y = local.y; vel.z = local.z;
                }
                vel.orbitalX = orb.x; vel.orbitalY = orb.y; vel.orbitalZ = orb.z;
                var off = L.orbitalOffset != null ? L.orbitalOffset.V : Vector3.zero;
                vel.orbitalOffsetX = off.x; vel.orbitalOffsetY = off.y; vel.orbitalOffsetZ = off.z;
                vel.radial = L.radial;
                vel.speedModifier = modifier ? new ParticleSystem.MinMaxCurve(1f, FxCurves.FromKeys(L.speedModifier)) : new ParticleSystem.MinMaxCurve(1f);
            }
        }

        static void Force(ParticleSystem ps, FxLayer L)
        {
            var force = ps.forceOverLifetime;
            force.enabled = L.force.V != Vector3.zero;
            if (force.enabled)
            {
                force.space = ParticleSystemSimulationSpace.World;
                force.x = L.force.x; force.y = L.force.y; force.z = L.force.z;
                force.randomized = false;
            }
        }

        static void LimitVelocity(ParticleSystem ps, FxLayer L)
        {
            var lim = ps.limitVelocityOverLifetime;
            lim.enabled = L.drag > 0 || L.limitDampen > 0;
            if (lim.enabled)
            {
                lim.separateAxes = false;
                lim.limit = L.limitDampen > 0 ? L.speedLimit : 100000f;
                lim.dampen = L.limitDampen;
                lim.drag = L.drag;
                lim.multiplyDragByParticleSize = false;
                lim.multiplyDragByParticleVelocity = false;
            }
        }

        static void Noise(ParticleSystem ps, FxLayer L)
        {
            var noise = ps.noise;
            noise.enabled = L.noiseStrength > 0;
            if (noise.enabled)
            {
                var axes = L.noiseAxes != null ? L.noiseAxes.V : Vector3.one;
                noise.separateAxes = axes != Vector3.one;
                if (noise.separateAxes) { noise.strengthX = L.noiseStrength * axes.x; noise.strengthY = L.noiseStrength * axes.y; noise.strengthZ = L.noiseStrength * axes.z; }
                else noise.strength = L.noiseStrength;
                noise.frequency = Mathf.Max(0.0001f, L.noiseFrequency);
                noise.scrollSpeed = L.noiseScroll;
                noise.damping = false;
                noise.octaveCount = Mathf.Clamp(L.noiseOctaves, 1, 4);
                noise.octaveMultiplier = L.noiseOctaveMultiplier;
                noise.octaveScale = L.noiseOctaveScale;
                noise.quality = ParticleSystemNoiseQuality.High;
            }
        }

        static void ColorOverLifetime(ParticleSystem ps, FxLayer L)
        {
            var col = ps.colorOverLifetime;
            col.enabled = true;
            var g = new Gradient();
            g.mode = L.stepped ? GradientMode.Fixed : GradientMode.Blend;
            var stops = (L.colors ?? new FxStop[0]).Where(s => s != null).OrderBy(s => s.t).Take(8).ToArray();
            if (stops.Length == 0) stops = new[] { new FxStop { t = 0, color = "#ffffff" } };
            var ck = stops.Select(s => new GradientColorKey(FxCurves.Hex(s.color, Color.white), Mathf.Clamp01(s.t))).ToList();
            if (ck.Count == 1) ck.Add(new GradientColorKey(ck[0].color, 1f));
            g.SetKeys(ck.ToArray(), FxCurves.AlphaKeys(L));
            col.color = new ParticleSystem.MinMaxGradient(g);
        }

        static void SizeOverLifetime(ParticleSystem ps, FxLayer L)
        {
            var size = ps.sizeOverLifetime;
            bool curve = FxCurves.Has(L.sizeCurve);
            bool axes = FxCurves.Has(L.sizeCurveY) || FxCurves.Has(L.sizeCurveZ);
            size.enabled = curve || axes || !(Mathf.Approximately(L.sizeEnd, 1f) && L.sizeEase != "pop");
            if (size.enabled)
            {
                var x = curve ? FxCurves.FromKeys(L.sizeCurve) : FxCurves.SizeCurve(L.sizeEase, L.sizeEnd);
                size.separateAxes = axes;
                if (axes)
                {
                    // an empty Y / Z curve follows the X one
                    size.x = new ParticleSystem.MinMaxCurve(1f, x);
                    size.y = new ParticleSystem.MinMaxCurve(1f, FxCurves.Has(L.sizeCurveY) ? FxCurves.FromKeys(L.sizeCurveY) : x);
                    size.z = new ParticleSystem.MinMaxCurve(1f, FxCurves.Has(L.sizeCurveZ) ? FxCurves.FromKeys(L.sizeCurveZ) : x);
                }
                else size.size = new ParticleSystem.MinMaxCurve(1f, x);
            }
        }

        static void RotationBySpeed(ParticleSystem ps, FxLayer L)
        {
            var rbs = ps.rotationBySpeed;
            rbs.enabled = FxCurves.Has(L.spinBySpeed);
            if (!rbs.enabled) return;
            rbs.separateAxes = false;
            rbs.z = new ParticleSystem.MinMaxCurve(Mathf.Deg2Rad, FxCurves.FromKeys(L.spinBySpeed));
            rbs.range = new Vector2(L.spinBySpeedMin, L.spinBySpeedMax);
        }

        static void RotationOverLifetime(ParticleSystem ps, FxLayer L)
        {
            var rot = ps.rotationOverLifetime;
            bool curve = FxCurves.Has(L.spinCurve);
            bool turns3D = LocalMesh(L) && L.startRotation3D && (Spins(L.spinX) || Spins(L.spinY));
            rot.enabled = curve || Spins(L.spin) || turns3D;
            if (rot.enabled)
            {
                bool tumble = L.renderMode == "mesh" && L.meshAlign == "random";
                rot.separateAxes = tumble || LocalMesh(L);
                // the curve is in degrees per second over the particle's life
                var spin = curve ? new ParticleSystem.MinMaxCurve(Mathf.Deg2Rad, FxCurves.FromKeys(L.spinCurve)) : FxCurves.Two(L.spin, Mathf.Deg2Rad);
                if (tumble) { rot.x = spin; rot.y = spin; }
                else if (LocalMesh(L))
                {
                    rot.x = L.startRotation3D ? FxCurves.Two(L.spinX, Mathf.Deg2Rad) : new ParticleSystem.MinMaxCurve(0f);
                    rot.y = L.startRotation3D ? FxCurves.Two(L.spinY, Mathf.Deg2Rad) : new ParticleSystem.MinMaxCurve(0f);
                }
                rot.z = spin;
            }
        }

        /// <summary>
        /// A mesh drawn in the layer's own orientation. Unity turns a mesh particle's 2D
        /// rotation around its axisOfRotation, which the Shape module sets to the emission
        /// direction (measured in 6000.3: a quad on a sphere-shaped layer tilts at random);
        /// FX Forge turns it around the layer's Z axis, so these use a 3D rotation about Z only.
        /// </summary>
        static bool Spins(FxRange r) => r != null && (r.min != 0 || r.max != 0);

        static bool LocalMesh(FxLayer L) => L.renderMode == "mesh" && (L.meshAlign == "local" || L.meshAlign == "view");

        static void Collision(ParticleSystem ps, FxLayer L, Transform floor)
        {
            var coll = ps.collision;
            coll.enabled = floor != null;
            if (coll.enabled)
            {
                coll.type = ParticleSystemCollisionType.Planes;
                coll.SetPlane(0, floor);
                coll.bounce = L.bounce;
                coll.dampen = L.dampen;
                coll.lifetimeLoss = Mathf.Clamp01(L.lifetimeLoss);
                coll.minKillSpeed = Mathf.Max(0f, L.minKillSpeed);
                coll.radiusScale = Mathf.Max(0, L.collisionRadiusScale);
            }
        }
    }
}
#endif
