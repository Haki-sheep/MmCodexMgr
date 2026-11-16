// FX Forge effect file (.fxforge.json) as JsonUtility classes.

#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace FXForge.Editor
{
    [Serializable] public class FxRange { public float min; public float max; }
    [Serializable] public class FxFlip { public float x; public float y; }
    [Serializable] public class FxLight { public bool enabled; public string color = "#ffffff"; public float intensity = 1, range = 10; }
    [Serializable] public class FxVec3 { public float x; public float y; public float z; public Vector3 V => new Vector3(x, y, z); }
    [Serializable] public class FxBurst { public float time; public int count; public int cycles = 1; public float interval = 0.1f, probability = 1; }
    /** A curve key (t 0..1); FX Forge curves are linear between keys, an empty curve is off. */
    [Serializable] public class FxKey { public float t; public float v; }
    [Serializable] public class FxStop { public float t; public string color; }

    [Serializable]
    public class FxMaterial
    {
        public float intensity = 1;
        public string mainTexture = "sprite";
        public float scrollX, scrollY;
        public bool dissolve;
        public float dissolveFrom, dissolveTo = 1, dissolveEdge = 0.08f, dissolveScale = 1, dissolveSoftness = 0.02f;
        public FxKey[] dissolveCurve = new FxKey[0];
        /** Library texture for the dissolve (written by the exporter), '' = the built-in noise. */
        public string dissolveTextureFile = "";
        public string dissolveEdgeColor = "#ffffff";
        public float fresnel, fresnelPower = 2;
        public string fresnelColor = "#ffffff";
        public float softness;
        /** Library texture file name in FXForge/Textures (written by the exporter), '' = built-in. */
        public string textureFile = "";
        /** Custom shader name ("FXForge/Custom/...", written by the exporter), '' = FXForge/Particle. */
        public string customShader = "";
    }

    [Serializable]
    public class FxSheet
    {
        public bool enabled;
        public string texture = "smoke", mode = "lifetime";
        public int cycles = 1;
        public float fps = 24;
        public bool randomStart;
        public FxKey[] frameCurve = new FxKey[0]; // Frame over Time, empty = linear 0..1
        public float startFrame; // fraction of the sheet
        /** Library flipbook file name and grid (written by the exporter), '' = built-in 4x4. */
        public string assetFile = "";
        public int tilesX = 4, tilesY = 4;
    }

    [Serializable]
    public class FxLayer
    {
        public string id, name, blend = "add";
        public bool visible = true;
        public FxVec3 position = new FxVec3(), rotation = new FxVec3();
        public FxRange startLifetime, startSpeed, startSize, startRotation;
        // 3D start size / rotation (startSize is X, startRotation is Z)
        public bool startSize3D, startRotation3D;
        public FxRange startSizeY = new FxRange(), startSizeZ = new FxRange(), startRotationX = new FxRange(), startRotationY = new FxRange();
        public FxRange spinX = new FxRange(), spinY = new FxRange();
        public FxKey[] sizeCurveY = new FxKey[0], sizeCurveZ = new FxKey[0];
        public FxVec3 pivot = new FxVec3();
        public bool rendered = true;
        public FxFlip flip = new FxFlip();
        public bool applyColorSpace = true;
        public float maxParticleSize = 100, minParticleSize;
        public string sortMode = "none";
        public FxLight light = new FxLight();
        public FxStop[] trailAlongColors = new FxStop[0];
        public FxKey[] trailAlongAlpha = new FxKey[0], trailWidthCurve = new FxKey[0], trailLifeAlpha = new FxKey[0];
        public bool trailSizeAffectsWidth = true, trailDieWithParticles = true;
        public float trailMinVertexDistance = 0.02f;
        public FxVec3 orbitalOffset = new FxVec3();
        public string startColor = "#ffffff", startColor2 = "#ffffff";
        public float gravityModifier;
        public int maxParticles = 1000;
        public string simulationSpace = "local";
        public float rate;
        public FxBurst[] bursts = new FxBurst[0];
        public float startDelay, stopAfter;
        public float loopDuration, startOffset; // the layer's own Duration (0 = the effect's) and Unity Start Delay
        public string shape = "cone";
        public float radius, radiusThickness = 1, angle = 20, arc = 360;
        public string arcMode = "random";
        public bool alignToDirection;
        public float spherizeDirection, flipRotation;
        public FxKey[] speedModifier = new FxKey[0];
        public FxVec3 noiseAxes;
        public float rateOverDistance, simulationSpeed = 1, collisionRadiusScale = 0.05f;
        public int noiseOctaves = 1;
        public float noiseOctaveMultiplier = 0.5f, noiseOctaveScale = 2;
        public float arcSpeed = 1, arcSpread;
        public FxVec3 boxSize = new FxVec3();
        public float randomDirection, coneLength = 5, donutRadius = 0.2f;
        public FxVec3 velocity = new FxVec3(), orbital = new FxVec3(), force = new FxVec3();
        public float radial, drag, speedLimit = 1, limitDampen, noiseStrength, noiseFrequency = 0.8f, noiseScroll;
        public FxStop[] colors = new FxStop[0];
        public FxStop[] startGradient = new FxStop[0];
        public FxKey[] startGradientAlpha = new FxKey[0];
        public string startGradientMode = "time";
        public bool stepped;
        public float alpha = 1, fadeIn, fadeOut, sizeEnd = 1;
        public string sizeEase = "linear";
        public FxRange spin;
        public FxKey[] sizeCurve = new FxKey[0], alphaCurve = new FxKey[0], spinCurve = new FxKey[0];
        public FxKey[] spinBySpeed = new FxKey[0];
        public float spinBySpeedMin, spinBySpeedMax = 1;
        public FxKey[] velocityCurveX = new FxKey[0], velocityCurveY = new FxKey[0], velocityCurveZ = new FxKey[0], rateCurve = new FxKey[0];
        public bool floor;
        public float floorY, bounce = 0.4f, dampen = 0.2f, lifetimeLoss, minKillSpeed;
        public string sprite = "soft", renderMode = "billboard";
        public float lengthScale = 2, velocityScale;
        public string mesh = "shard", meshAlign = "random";
        public FxMaterial material = new FxMaterial();
        public FxSheet sheet = new FxSheet();
        public bool trails;
        public float trailRatio = 1, trailLifetime = 0.3f, trailWidth = 1, trailWidthEnd;
        public string trailColor = "#ffffff";
        public bool trailInheritColor = true;
        public string trailTextureFile = "", trailBlend = "", trailMode = "particle";
        public int trailRibbonCount = 1;
        public float trailIntensity = 1;
        public string subEmitterOf = "", subEvent = "death";
        public bool inheritColor, inheritSize;
        public float inheritVelocity;
        // hierarchy: parent layer id ('' = the effect root); an empty layer is a plain GameObject
        public string parentId = "";
        public bool empty;
    }

    [Serializable]
    public class FxEffect
    {
        public string name = "FX";
        public string space;
        public float duration = 2;
        public string loop = "perfect";
        public int seed = 1;
        public bool fixedSeed;
        public FxLayer[] layers = new FxLayer[0];
    }
}
#endif
