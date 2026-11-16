// FX Forge -> Unity ParticleSystem importer.
//
// Drop a folder exported by FX Forge into Assets/. Every *.fxforge.json in it
// is turned into a prefab next to it: one child ParticleSystem per layer
// (nested like the FX Forge layer tree; empty layers are plain GameObjects), with
// the Main, Emission, Shape, Velocity/Force/Limit Velocity over Lifetime,
// Noise, Colour/Size/Rotation over Lifetime, Collision and Renderer modules
// set from the file. Re-exporting the same effect updates the prefab in place
// (its GUID is kept, so scene references survive).
//
// Menu: Tools > FX Forge > Rebuild All Effects.
// Works with the Built-in pipeline and URP (the bundled shaders are plain
// unlit particle shaders). Unity 2021.3 or newer.

#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace FXForge.Editor
{
    public class FxForgePostprocessor : AssetPostprocessor
    {
        static void OnPostprocessAllAssets(string[] imported, string[] deleted, string[] moved, string[] movedFrom)
        {
            var effects = imported.Concat(moved).Where(FxForgeImporter.IsEffectFile).Distinct().ToList();
            if (effects.Count == 0) return;
            // wait one editor tick so the shaders and textures that came in the
            // same import are ready
            EditorApplication.delayCall += () =>
            {
                foreach (var p in effects) FxForgeImporter.Build(p);
            };
        }

        void OnPreprocessTexture()
        {
            if (!assetPath.Replace('\\', '/').Contains("/Textures/fx_")) return;
            var ti = (TextureImporter)assetImporter;
            ti.textureType = TextureImporterType.Default;
            ti.alphaSource = TextureImporterAlphaSource.FromInput;
            ti.alphaIsTransparency = true;
            var file = Path.GetFileNameWithoutExtension(assetPath);
            // tileable textures scroll and repeat; the dissolve noise holds plain values, not colours
            ti.wrapMode = file.StartsWith("fx_tile_") ? TextureWrapMode.Repeat : TextureWrapMode.Clamp;
            ti.mipmapEnabled = true;
            ti.sRGBTexture = file != "fx_tile_dissolve";
        }
    }

    public static class FxForgeImporter
    {
        public static bool IsEffectFile(string path) => path.EndsWith(".fxforge.json", StringComparison.OrdinalIgnoreCase);

        [MenuItem("Tools/FX Forge/Rebuild All Effects")]
        public static void BuildAll()
        {
            var paths = AssetDatabase.FindAssets("t:TextAsset")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(IsEffectFile)
                .ToList();
            foreach (var p in paths) Build(p);
            Debug.Log($"[FX Forge] Rebuilt {paths.Count} effect(s).");
        }

        public static GameObject Build(string jsonPath)
        {
            var text = AssetDatabase.LoadAssetAtPath<TextAsset>(jsonPath);
            if (text == null) { Debug.LogWarning($"[FX Forge] Cannot read {jsonPath}"); return null; }
            FxEffect fx;
            try { fx = JsonUtility.FromJson<FxEffect>(text.text); }
            catch (Exception e) { Debug.LogError($"[FX Forge] {jsonPath}: invalid JSON ({e.Message})"); return null; }
            if (fx == null || fx.space != "3d") { Debug.LogError($"[FX Forge] {jsonPath} is not a 3D effect. Export a 3D effect from FX Forge."); return null; }

            var dir = Path.GetDirectoryName(jsonPath).Replace('\\', '/');
            var root = Path.GetDirectoryName(dir).Replace('\\', '/'); // the FXForge folder
            var prefabPath = $"{dir}/{Path.GetFileName(jsonPath).Replace(".fxforge.json", "")}.prefab";

            var go = new GameObject(string.IsNullOrEmpty(fx.name) ? "FX" : fx.name);
            try
            {
                BuildHierarchy(go, fx, root);
                var prefab = PrefabUtility.SaveAsPrefabAsset(go, prefabPath);
                Debug.Log($"[FX Forge] Built {prefabPath} ({fx.layers.Length} layer(s)).", prefab);
                return prefab;
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(go);
            }
        }

        static void BuildHierarchy(GameObject go, FxEffect fx, string root)
        {
            bool loop = fx.loop != "once";
            bool prewarm = fx.loop == "perfect"; // "loop": Looping without Prewarm, starts empty
            float duration = Mathf.Max(0.05f, fx.duration);

            // the root system emits nothing; it lets Play()/Stop() drive all layers
            var rootPs = go.AddComponent<ParticleSystem>();
            {
                var m = rootPs.main;
                m.duration = duration; m.loop = loop; m.playOnAwake = true;
                m.startLifetime = 0.01f; m.maxParticles = 1;
                var e = rootPs.emission; e.enabled = false;
                var s = rootPs.shape; s.enabled = false;
                go.GetComponent<ParticleSystemRenderer>().enabled = false;
            }
            var helper = go.AddComponent<FXForge.FxForgeEffect>();
            helper.destroyWhenDone = !loop;
            helper.warmUp = prewarm ? FxSubEmitters.WarmUp(fx, duration) : 0f;
            if (fx.layers.Any(l => l != null && l.visible && l.material != null && l.material.softness > 0))
            {
                go.AddComponent<FXForge.FxForgeDepthTexture>();
                FxPipelineChecks.WarnIfNoDepthTexture(fx.name);
            }

            Transform floor = null;
            var systems = new Dictionary<string, ParticleSystem>();
            var nodes = new Dictionary<string, Transform>(); // every created layer object, empty ones included
            var layers = fx.layers.Where(l => l != null).ToList();
            var byId = new Dictionary<string, FxLayer>();
            foreach (var l in layers) if (!string.IsNullOrEmpty(l.id) && !byId.ContainsKey(l.id)) byId[l.id] = l;
            FxLayer Find(string id) => !string.IsNullOrEmpty(id) && byId.TryGetValue(id, out var p) ? p : null;
            bool IsSub(FxLayer l) { var p = Find(l.subEmitterOf); return p != null && p != l && string.IsNullOrEmpty(p.subEmitterOf) && !p.empty && !l.empty; }
            // the node a layer hangs under: its sub-emitter source, else its parent ('' = root)
            string TreeParent(FxLayer l) => IsSub(l) ? l.subEmitterOf : Find(l.parentId) != null ? l.parentId : "";
            // hidden layers hide everything under them (Unity: an inactive parent)
            bool Shown(FxLayer l)
            {
                for (int guard = 0; l != null && guard <= layers.Count; guard++)
                {
                    if (!l.visible) return false;
                    l = Find(TreeParent(l));
                }
                return true;
            }
            // parents before children, so every child finds its parent's object
            var pending = layers.Where(Shown).ToList();
            while (pending.Count > 0)
            {
                var ready = pending.Where(l => TreeParent(l) == "" || nodes.ContainsKey(TreeParent(l))).ToList();
                if (ready.Count == 0) { Debug.LogWarning($"[FX Forge] {fx.name}: {pending.Count} layer(s) skipped (parent loop)."); break; }
                foreach (var L in ready)
                {
                    pending.Remove(L);
                    int i = layers.IndexOf(L);
                    bool sub = IsSub(L);
                    var child = new GameObject(string.IsNullOrEmpty(L.name) ? $"Layer {i}" : L.name);
                    var pid = TreeParent(L);
                    if (sub)
                    {
                        // a sub-emitter lives under its source layer; its particles are born at the source's particles
                        child.transform.SetParent(nodes[pid], false);
                        child.transform.localPosition = Vector3.zero;
                        child.transform.rotation = go.transform.rotation * Quaternion.Euler(L.rotation.V);
                    }
                    else
                    {
                        child.transform.SetParent(pid == "" ? go.transform : nodes[pid], false);
                        child.transform.localPosition = L.position.V;
                        child.transform.localRotation = Quaternion.Euler(L.rotation.V);
                    }
                    nodes[L.id ?? $"layer{i}"] = child.transform;
                    FxLights.Add(child, L.light);
                    if (L.empty) continue; // an empty node is just a Transform
                    var ps = child.AddComponent<ParticleSystem>();
                    // a fresh ParticleSystem starts with Unity's defaults; reset what we set below
                    ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
                    if (L.floor && floor == null)
                    {
                        floor = new GameObject("FX Floor (collision plane)").transform;
                        floor.SetParent(go.transform, false);
                        floor.localPosition = new Vector3(0, L.floorY, 0);
                    }
                    FxModules.Configure(ps, L, duration, loop, prewarm, i, root, L.floor ? floor : null);
                    if (fx.fixedSeed)
                    {
                        ps.useAutoRandomSeed = false;
                        ps.randomSeed = (uint)(Mathf.Abs(fx.seed) * 7919 + i * 104729 + 1);
                    }
                    if (sub) FxSubEmitters.Attach(systems[pid], Find(pid), ps, L, duration);
                    systems[L.id ?? $"layer{i}"] = ps;
                }
            }
            if (fx.fixedSeed)
            {
                rootPs.useAutoRandomSeed = false;
                rootPs.randomSeed = (uint)(Mathf.Abs(fx.seed) + 1);
            }
            // Play On Awake is shared by every system in one effect hierarchy, and
            // registering sub-emitters can clear it: set it last, on the root.
            var rootMain = rootPs.main;
            rootMain.playOnAwake = true;
        }
    }
}
#endif
