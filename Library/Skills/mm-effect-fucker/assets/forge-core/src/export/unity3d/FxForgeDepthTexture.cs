// FX Forge runtime helper for soft particles: they fade against the scene's
// depth, so the camera must render a depth texture. In the Built-in pipeline
// this turns it on for the camera(s) that render the effect. In URP, enable
// "Depth Texture" on the URP asset and use Depth Texture Mode "After Opaques"
// on the renderer (the importer warns about both).
using UnityEngine;
using UnityEngine.Rendering;

namespace FXForge
{
    [DisallowMultipleComponent]
    public class FxForgeDepthTexture : MonoBehaviour
    {
        void OnEnable()
        {
            if (GraphicsSettings.currentRenderPipeline != null) return; // URP: set on the pipeline asset
            Camera.onPreCull -= Enable;
            Camera.onPreCull += Enable;
        }

        void OnDisable()
        {
            Camera.onPreCull -= Enable;
        }

        static void Enable(Camera cam)
        {
            if ((cam.depthTextureMode & DepthTextureMode.Depth) == 0) cam.depthTextureMode |= DepthTextureMode.Depth;
        }
    }
}
