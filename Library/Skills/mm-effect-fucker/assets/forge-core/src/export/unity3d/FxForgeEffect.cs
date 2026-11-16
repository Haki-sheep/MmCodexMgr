// FX Forge runtime helper: sits on the root of every imported effect prefab.
// Play()/Stop() drive all layers; one-shot effects destroy themselves when the
// last particle has died. Looping effects with sub-emitters cannot use Unity's
// Prewarm (it starts every sub-emitter particle made while prewarming at age 0,
// measured in 2022.3), so they warm up here instead: before the first frame the
// whole effect is simulated in 1/60 s steps, like a game that was already running.
using UnityEngine;

namespace FXForge
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(ParticleSystem))]
    public class FxForgeEffect : MonoBehaviour
    {
        [Tooltip("Destroy this GameObject once every layer has finished (one-shot effects).")]
        public bool destroyWhenDone = false;

        [Tooltip("Seconds simulated before the first frame (looping effects with sub-emitters start already running). 0 = off.")]
        public float warmUp = 0f;

        const float WarmStep = 1f / 60f;

        ParticleSystem _ps;
        bool _started;

        public ParticleSystem System => _ps != null ? _ps : (_ps = GetComponent<ParticleSystem>());

        public void Play()
        {
            WarmUp();
            System.Play(true);
            _started = true;
        }

        /// <summary>Restarts the effect and simulates `warmUp` seconds of it (in 1/60 s steps, so sub-emitters collide as in play).</summary>
        public void WarmUp()
        {
            if (warmUp <= 0f) return;
            System.Simulate(0f, true, true, false);
            for (float t = 0f; t < warmUp - 1e-4f; t += WarmStep) System.Simulate(Mathf.Min(WarmStep, warmUp - t), true, false, false);
        }

        public void Stop(bool clear = false)
        {
            System.Stop(true, clear ? ParticleSystemStopBehavior.StopEmittingAndClear : ParticleSystemStopBehavior.StopEmitting);
        }

        /// <summary>Spawn a copy of this effect at a position (for hits, explosions...).</summary>
        public static FxForgeEffect Spawn(FxForgeEffect prefab, Vector3 position, Quaternion rotation, Transform parent = null)
        {
            var fx = Instantiate(prefab, position, rotation, parent);
            fx.Play();
            return fx;
        }

        void OnEnable()
        {
            _started = System.main.playOnAwake;
        }

        void Start()
        {
            // Play On Awake has already started the effect; give it its warm-up before the first frame
            if (warmUp > 0f && System.main.playOnAwake) Play();
        }

        void LateUpdate()
        {
            if (!destroyWhenDone || !_started) return;
            if (!System.IsAlive(true)) Destroy(gameObject);
        }
    }
}
