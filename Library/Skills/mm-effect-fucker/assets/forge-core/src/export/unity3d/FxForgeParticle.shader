// FX Forge: general unlit particle shader (one material per layer).
// Plain pass with no LightMode tag, so it renders in the Built-in pipeline and
// in URP (as SRPDefaultUnlit). Mirrors the preview's shader in
// src/engine/preview3d/shaders.ts: keep the two in step.
//
// Vertex streams (set by the importer): Position, Normal, Color, UV,
// AgePercent, InvStartLifetime, StableRandomX ->
//   TEXCOORD0 = (uv.x, uv.y, agePercent, invStartLifetime), TEXCOORD1.x = random.
// Trails have no custom streams: age reads as 0, which turns the age-based
// features off for them.
Shader "FXForge/Particle"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Intensity ("Intensity (HDR)", Range(0, 32)) = 1
        _Scroll ("UV Scroll per Second (xy)", Vector) = (0, 0, 0, 0)
        [Toggle(_DISSOLVE_ON)] _Dissolve ("Dissolve", Float) = 0
        _NoiseTex ("Dissolve Noise", 2D) = "gray" {}
        _DissolveRange ("Dissolve From/To over Life (xy)", Vector) = (0, 1, 0, 0)
        _DissolveEdge ("Dissolve Edge Width", Range(0, 0.5)) = 0.08
        _DissolveScale ("Dissolve Noise Scale", Float) = 1
        _DissolveTexOn ("Dissolve Uses Its Own Texture", Float) = 0
        _DissolveSoft ("Dissolve Softness", Range(0.001, 1)) = 0.02
        _DissolveCurveOn ("Dissolve Curve On", Float) = 0
        _DissolveCurve ("Dissolve Cut over Life (64 x 1)", 2D) = "black" {}
        _EdgeColor ("Dissolve Edge Color", Color) = (1, 1, 1, 1)
        [Toggle(_FRESNEL_ON)] _FresnelOn ("Fresnel (meshes)", Float) = 0
        _Fresnel ("Fresnel Strength", Range(0, 8)) = 0
        _FresnelPower ("Fresnel Power", Range(0.1, 16)) = 2
        _FresnelColor ("Fresnel Color", Color) = (1, 1, 1, 1)
        [Toggle(_SOFT_ON)] _SoftOn ("Soft Particles", Float) = 0
        _Softness ("Softness (m)", Range(0.01, 10)) = 0.5
        _BlendKind ("Output (0 straight, 1 premultiplied, 2 soft additive)", Float) = 0
        [Enum(UnityEngine.Rendering.BlendMode)] _SrcBlend ("Src Blend", Float) = 5
        [Enum(UnityEngine.Rendering.BlendMode)] _DstBlend ("Dst Blend", Float) = 1
    }
    SubShader
    {
        Tags { "Queue"="Transparent" "RenderType"="Transparent" "IgnoreProjector"="True" "PreviewType"="Plane" }
        Blend [_SrcBlend] [_DstBlend]
        ZWrite Off
        Cull Off
        Lighting Off

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fog
            #pragma shader_feature_local _DISSOLVE_ON
            #pragma shader_feature_local _FRESNEL_ON
            #pragma shader_feature_local _SOFT_ON
            #include "UnityCG.cginc"

            sampler2D _MainTex;
            float4 _MainTex_ST;
            half _Intensity;
            half _BlendKind;
            float4 _Scroll;
            sampler2D _NoiseTex;
            float4 _DissolveRange;
            half _DissolveEdge;
            float _DissolveScale;
            half _DissolveTexOn;
            half _DissolveSoft;
            half _DissolveCurveOn;
            sampler2D _DissolveCurve;
            half4 _EdgeColor;
            half _Fresnel;
            half _FresnelPower;
            half4 _FresnelColor;
            float _Softness;
            UNITY_DECLARE_DEPTH_TEXTURE(_CameraDepthTexture);
            // FX_CUSTOM_CODE (FX Forge custom shaders insert their fxCustom function here)

            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                fixed4 color : COLOR;
                float4 uv : TEXCOORD0;
                float rnd : TEXCOORD1;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                fixed4 color : COLOR;
                float2 uv : TEXCOORD0;
                float2 baseUv : TEXCOORD1;
                float3 life : TEXCOORD2; // life fraction, random, age (s)
                float3 normal : TEXCOORD3;
                float3 view : TEXCOORD4;
                float4 projPos : TEXCOORD5;
                UNITY_FOG_COORDS(6)
                UNITY_VERTEX_OUTPUT_STEREO
            };

            v2f vert (appdata v)
            {
                v2f o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                o.pos = UnityObjectToClipPos(v.vertex);
                o.color = v.color;
                float age = v.uv.w > 0 ? v.uv.z / v.uv.w : 0;
                o.life = float3(v.uv.z, v.rnd, age);
                o.baseUv = v.uv.xy;
                o.uv = TRANSFORM_TEX(v.uv.xy, _MainTex) + _Scroll.xy * age;
                float3 world = mul(unity_ObjectToWorld, v.vertex).xyz;
                o.normal = UnityObjectToWorldNormal(v.normal);
                o.view = _WorldSpaceCameraPos - world;
                o.projPos = ComputeScreenPos(o.pos);
                COMPUTE_EYEDEPTH(o.projPos.z);
                UNITY_TRANSFER_FOG(o, o.pos);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
            #ifdef FX_CUSTOM
                half4 c = fxCustom(i.uv, i.color, i.life.x, i.life.y, i.life.z);
                c.a = saturate(c.a);
            #else
                half4 c = tex2D(_MainTex, i.uv) * i.color;
            #endif
                half base = c.a; // before dissolve / fresnel / soft particles
            #if _DISSOLVE_ON
                // the preview's dissolveCut: a curve over life (64 x 1 lookup) or from / to
                float cut = _DissolveCurveOn > 0.5 ? tex2D(_DissolveCurve, float2(saturate(i.life.x) * (63.0 / 64.0) + 0.5 / 64.0, 0.5)).r : lerp(_DissolveRange.x, _DissolveRange.y, i.life.x);
                float nz = tex2D(_NoiseTex, i.baseUv * _DissolveScale + i.life.y * 7.13 * (1 - _DissolveTexOn)).r;
                c.a *= smoothstep(cut, cut + _DissolveSoft, nz);
                float edge = (1 - smoothstep(cut, cut + _DissolveEdge + 1e-4, nz)) * step(0.001, cut);
                c.rgb = lerp(c.rgb, _EdgeColor.rgb, edge);
            #endif
            #if _FRESNEL_ON
                float rim = pow(1 - abs(dot(normalize(i.normal), normalize(i.view))), _FresnelPower) * _Fresnel;
                c.rgb += _FresnelColor.rgb * rim;
                c.a = saturate(c.a + rim * i.color.a);
            #endif
            #if _SOFT_ON
                float scene = LinearEyeDepth(SAMPLE_DEPTH_TEXTURE_PROJ(_CameraDepthTexture, UNITY_PROJ_COORD(i.projPos)));
                c.a *= saturate((scene - i.projPos.z) / _Softness);
            #endif
                c.rgb *= _Intensity;
                // the layer's blend mode (the preview's fxBlendOut)
                if (_BlendKind > 0.5 && _BlendKind < 1.5) c = half4(c.rgb * i.color.a * (c.a / max(base, 1e-4)), c.a * i.color.a);
                else if (_BlendKind > 1.5) c.rgb *= c.a;
                UNITY_APPLY_FOG_COLOR(i.fogCoord, c, fixed4(0, 0, 0, 0));
                return c;
            }
            ENDCG
        }
    }
}
