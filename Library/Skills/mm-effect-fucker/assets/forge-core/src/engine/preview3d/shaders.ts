// GLSL for the preview's particle material. The fragment stage mirrors the
// Unity shader FXForge/Particle (src/export/unity3d/FxForgeParticle.shader):
// keep the two in step when changing either.
//
// Colour pipeline: textures are decoded to linear by three, particle colours
// are sRGB and decoded here, everything blends in a linear HDR target, and
// the output pass encodes to sRGB, like a Unity project in Linear colour space.

/** Instance data shared by billboards and meshes. */
const INSTANCE = /* glsl */ `
  attribute vec3 iPos;
  attribute float iSize;
  attribute float iRot;
  attribute vec4 iColor;
  attribute vec3 iVel;
  attribute vec3 iData; // life fraction, stable random, age (s)
  attribute vec4 iShape; // size Y / Z relative to iSize, rotation X / Y (rad): Unity's 3D size and rotation
  uniform vec3 uPivot; // Renderer Pivot, in particle sizes
  varying vec2 vUv;
  varying vec4 vColor;
  varying vec3 vData;
  varying vec3 vNormal; // zero for billboards (no fresnel)
  varying vec3 vView;
`;

/** Billboards: Unity's billboard, stretched, horizontal and vertical modes. */
export const BILLBOARD_VERT = /* glsl */ `
  ${INSTANCE}
  uniform int uMode;
  uniform float uLengthScale;
  uniform float uVelocityScale;
  uniform vec2 uFlip; // Renderer Flip: share of particles mirrored along U / V
  uniform vec2 uSizeLimit; // Renderer Min / Max Particle Size: share of the viewport width (billboards)
  void main() {
    vUv = uv;
    // Unity mirrors the texture of that share of particles (picked per particle)
    if (fract(iData.y * 7.31) < uFlip.x) vUv.x = 1.0 - vUv.x;
    if (fract(iData.y * 13.7) < uFlip.y) vUv.y = 1.0 - vUv.y;
    vColor = iColor;
    vData = iData;
    vNormal = vec3(0.0);
    vec2 c = position.xy; // -0.5..0.5
    vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 world;
    if (uMode == 1) {
      float sp = length(iVel);
      vec3 dir = sp > 1e-5 ? iVel / sp : camUp;
      vec3 toCam = normalize(cameraPosition - iPos);
      vec3 side = cross(dir, toCam);
      float sl = length(side);
      side = sl > 1e-5 ? side / sl : camRight;
      // measured in Unity: length = size * lengthScale + speed * velocityScale
      // (the speed term does not scale with size); the particle sits at the head.
      // A particle with zero total velocity is not drawn at all (the quad collapses).
      // 3D size: the width is the X size, the length scales with the Y size;
      // the pivot moves the streak by 2 x pivot.y sizes along it (whatever its length) and
      // pivot.x widths across (BakeMesh, 2022.3)
      bool still = sp <= 1e-6;
      float len = still ? 0.0 : iSize * iShape.x * uLengthScale + sp * uVelocityScale;
      float wid = still ? 0.0 : iSize;
      world = iPos + dir * ((c.x - 0.5) * len + (still ? 0.0 : 2.0 * uPivot.y * iSize * iShape.x)) + side * (c.y + uPivot.x) * wid;
      // Unity's UV runs from the head (U 0, at the particle) to the tail (U 1) (BakeMesh, 2022.3)
      vUv.x = 1.0 - vUv.x;
    } else {
      // 3D size: X wide, Y high; the pivot (x, y) is in the quad's own axes, so it turns with it
      float cs = cos(iRot), sn = sin(iRot);
      vec2 sz = vec2(iSize, iSize * iShape.x);
      if (uMode == 0) {
        // Unity keeps a billboard between Min and Max Particle Size x the viewport width at its depth
        bool persp = projectionMatrix[3][3] < 0.5;
        float depth = -(viewMatrix * vec4(iPos, 1.0)).z;
        float viewW = 2.0 * (persp ? max(depth, 1e-4) : 1.0) / projectionMatrix[0][0];
        sz = clamp(sz, vec2(uSizeLimit.x * viewW), vec2(uSizeLimit.y * viewW));
      }
      vec2 q = (c + uPivot.xy) * sz;
      vec2 r = vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs);
      // flat billboards are drawn at 1/sqrt(2) of Unity's size, but pivot.z is not scaled (BakeMesh, 2022.3)
      float pz = uPivot.z * iSize;
      if (uMode == 2) {
        // Unity (BakeMesh, 2022.3): U along +X, V along Unity +Z (three -Z); pivot.z lifts it.
        // A horizontal billboard is turned first and then sized on the world X / Z axes.
        vec2 qs = c + uPivot.xy;
        vec2 rh = vec2(qs.x * cs - qs.y * sn, qs.x * sn + qs.y * cs) * vec2(iSize, iSize * iShape.x);
        world = iPos + vec3(rh.x, pz * 1.41421356, -rh.y);
      } else if (uMode == 3) {
        vec3 toCam = cameraPosition - iPos;
        toCam.y = 0.0;
        float l = length(toCam);
        vec3 f = l > 1e-5 ? toCam / l : vec3(0.0, 0.0, 1.0);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), f));
        world = iPos + right * r.x + vec3(0.0, 1.0, 0.0) * r.y + f * pz * 1.41421356;
      } else {
        world = iPos + camRight * r.x + camUp * r.y + normalize(cameraPosition - iPos) * pz;
      }
    }
    vView = cameraPosition - world;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

/**
 * Mesh particles. Geometry is already in three's axes, so the mesh's Unity +Z
 * (its "forward") is -Z here.
 */
export const MESH_VERT = /* glsl */ `
  ${INSTANCE}
  uniform int uAlign; // 0 velocity, 1 random, 2 local, 3 view
  uniform mat3 uLocalRot; // the layer's rotation (three axes)
  mat3 axisAngle(vec3 a, float t) {
    float c = cos(t), s = sin(t), k = 1.0 - c;
    return mat3(
      c + a.x * a.x * k, a.y * a.x * k + a.z * s, a.z * a.x * k - a.y * s,
      a.x * a.y * k - a.z * s, c + a.y * a.y * k, a.z * a.y * k + a.x * s,
      a.x * a.z * k + a.y * s, a.y * a.z * k - a.x * s, c + a.z * a.z * k);
  }
  void main() {
    vUv = uv;
    vColor = iColor;
    vData = iData;
    mat3 R;
    if (uAlign == 0) {
      float sp = length(iVel);
      vec3 fwd = sp > 1e-5 ? iVel / sp : vec3(0.0, 1.0, 0.0);
      vec3 up = abs(fwd.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
      vec3 right = normalize(cross(up, -fwd));
      R = mat3(right, cross(-fwd, right), -fwd) * axisAngle(vec3(0.0, 0.0, 1.0), iRot);
    } else if (uAlign == 1) {
      float r = iData.y * 6.2831853;
      vec3 axis = normalize(vec3(sin(r * 7.31), cos(r * 3.17), sin(r * 5.13 + 1.7)) + 1e-4);
      R = axisAngle(axis, iRot + r);
    } else if (uAlign == 3) {
      // the camera's axes (Unity View alignment: the mesh's +Z points away from the camera,
      // which is the camera's +Z in three's flipped axes), then the particle's rotation
      mat3 cam = mat3(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]), vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]));
      R = cam * axisAngle(vec3(0.0, 1.0, 0.0), -iShape.w) * axisAngle(vec3(1.0, 0.0, 0.0), -iShape.z) * axisAngle(vec3(0.0, 0.0, 1.0), -iRot);
    } else {
      // iRot is negated on upload for billboards (Unity turns them clockwise);
      // a mesh in its layer's orientation turns +angle about its Z (measured in 6000.3).
      // 3D rotation: Unity's Euler order (Z, then X, then Y); X and Y change sign with three's flipped Z
      R = uLocalRot * axisAngle(vec3(0.0, 1.0, 0.0), -iShape.w) * axisAngle(vec3(1.0, 0.0, 0.0), -iShape.z) * axisAngle(vec3(0.0, 0.0, 1.0), -iRot);
    }
    // 3D size scales the mesh's own axes; the pivot moves it in them (BakeMesh, 2022.3: pivot.z has no effect)
    vec3 world = iPos + R * ((position + vec3(uPivot.xy, 0.0)) * iSize * vec3(1.0, iShape.x, iShape.y));
    vNormal = normalize(R * normal);
    vView = cameraPosition - world;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

/**
 * Final colour for the layer's blend mode (FxForgeParticle.shader does the same):
 * 0 straight alpha (blended SrcAlpha), 1 Unity "Alpha Blended Premultiply" (One,
 * OneMinusSrcAlpha: colour x vertex alpha, alpha x vertex alpha again), 2 Unity
 * "Additive (Soft)" (One, OneMinusSrcColor: colour x alpha).
 */
const BLEND_OUT = /* glsl */ `
  uniform int uBlendKind;
  vec4 fxBlendOut(vec3 rgb, float a, float base, float vertexAlpha) {
    if (uBlendKind == 1) return vec4(rgb * vertexAlpha * (a / max(base, 1e-4)), a * vertexAlpha);
    if (uBlendKind == 2) return vec4(rgb * a, a);
    return vec4(rgb, a);
  }
`;

/** Shared fragment stage: texture or flipbook, UV scroll, dissolve, fresnel, soft particles, HDR. */
export const PARTICLE_FRAG = /* glsl */ `
  #include <packing>
  uniform sampler2D uMap;
  uniform float uIntensity;
  ${BLEND_OUT}
  uniform vec2 uScroll;
  uniform vec2 uSheetGrid; // columns, rows; 0 = no flipbook
  uniform int uSheetMode; // 0 lifetime, 1 fps
  uniform float uSheetCycles;
  uniform float uSheetFps;
  uniform float uSheetRandom;
  uniform float uSheetStart; // Start Frame, fraction of the sheet
  uniform vec2 uFrameKeys[16]; // Frame over Time keys (t, v); uFrameKeyCount 0 = linear
  uniform int uFrameKeyCount;
  float frameOverTime(float t) {
    if (uFrameKeyCount == 0) return t;
    vec2 prev = uFrameKeys[0];
    if (t <= prev.x) return prev.y;
    for (int i = 1; i < 16; i++) {
      if (i >= uFrameKeyCount) break;
      vec2 k = uFrameKeys[i];
      if (t <= k.x) return mix(prev.y, k.y, (t - prev.x) / max(k.x - prev.x, 1e-6));
      prev = k;
    }
    return prev.y;
  }
  uniform float uDissolve; // 0 off, 1 on
  uniform vec2 uDissolveRange;
  uniform float uDissolveEdge;
  uniform float uDissolveScale;
  uniform vec3 uEdgeColor;
  uniform sampler2D uNoise;
  uniform float uDissolveTexOn; // 1: uNoise is the layer's dissolve texture (no random offset)
  uniform float uDissolveSoft;
  uniform vec2 uDissolveKeys[16]; // cut-off over life; uDissolveKeyCount 0 = uDissolveRange
  uniform int uDissolveKeyCount;
  float dissolveCut(float life) {
    if (uDissolveKeyCount == 0) return mix(uDissolveRange.x, uDissolveRange.y, life);
    vec2 prev = uDissolveKeys[0];
    if (life <= prev.x) return prev.y;
    for (int i = 1; i < 16; i++) {
      if (i >= uDissolveKeyCount) break;
      vec2 k = uDissolveKeys[i];
      if (life <= k.x) return mix(prev.y, k.y, (life - prev.x) / max(k.x - prev.x, 1e-6));
      prev = k;
    }
    return prev.y;
  }
  uniform float uFresnel;
  uniform float uFresnelPower;
  uniform vec3 uFresnelColor;
  uniform float uSoftness; // 0 = off
  uniform float uApplyColorSpace; // 1: particle colours converted to linear (Unity's Apply Active Color Space)
  uniform sampler2D uDepth;
  uniform vec2 uResolution;
  uniform float uNear;
  uniform float uFar;
  varying vec2 vUv;
  varying vec4 vColor;
  varying vec3 vData;
  varying vec3 vNormal;
  varying vec3 vView;

  vec3 toLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  }
  /*FX_CUSTOM_CODE*/

  void main() {
    vec2 uv = vUv;
    if (uSheetGrid.x > 0.0) {
      float n = uSheetGrid.x * uSheetGrid.y;
      float frame;
      if (uSheetMode == 1) frame = mod(floor(vData.z * uSheetFps) + floor(vData.y * n) * uSheetRandom, n);
      else {
        // Unity: frameOverTime(frac(life x cycles)) + start frame, then the frame under it (render3d/sheet.ts)
        float pos = frameOverTime(fract(min(vData.x, 0.99999) * uSheetCycles)) + mix(uSheetStart, vData.y, uSheetRandom);
        frame = min(n - 1.0, floor(fract(pos) * n));
      }
      float col = mod(frame, uSheetGrid.x);
      float row = floor(frame / uSheetGrid.x);
      uv = (uv + vec2(col, uSheetGrid.y - 1.0 - row)) / uSheetGrid;
    } else {
      uv += uScroll * vData.z;
    }
  #ifdef FX_CUSTOM
    vec3 pc = mix(vColor.rgb, toLinear(vColor.rgb), uApplyColorSpace);
    vec4 cc = fxCustom(uv, vec4(pc, vColor.a), vData.x, vData.y, vData.z);
    vec3 col = cc.rgb;
    float a = clamp(cc.a, 0.0, 1.0);
  #else
    vec4 t = texture2D(uMap, uv);
    vec3 col = mix(vColor.rgb, toLinear(vColor.rgb), uApplyColorSpace) * t.rgb;
    float a = t.a * vColor.a;
  #endif
    float base = a; // before dissolve / fresnel / soft particles (premultiplied output scales by their change)

    if (uDissolve > 0.5) {
      float cut = dissolveCut(vData.x);
      float nz = texture2D(uNoise, vUv * uDissolveScale + vData.y * 7.13 * (1.0 - uDissolveTexOn)).r;
      a *= smoothstep(cut, cut + uDissolveSoft, nz);
      float edge = (1.0 - smoothstep(cut, cut + uDissolveEdge + 1e-4, nz)) * step(0.001, cut);
      col = mix(col, toLinear(uEdgeColor), edge);
    }
    if (uFresnel > 0.0 && dot(vNormal, vNormal) > 0.0) {
      float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uFresnelPower) * uFresnel;
      col += toLinear(uFresnelColor) * rim;
      a = clamp(a + rim * vColor.a, 0.0, 1.0);
    }
    if (uSoftness > 0.0) {
      float scene = perspectiveDepthToViewZ(texture2D(uDepth, gl_FragCoord.xy / uResolution).x, uNear, uFar);
      float self = perspectiveDepthToViewZ(gl_FragCoord.z, uNear, uFar);
      a *= clamp((self - scene) / uSoftness, 0.0, 1.0);
    }
    gl_FragColor = fxBlendOut(col * uIntensity, a, base, vColor.a);
    if (gl_FragColor.a < 0.002 && max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)) < 0.002) discard;
  }
`;

/** Trails: camera-facing ribbons built on the CPU. Texture, colour and HDR intensity only. */
export const TRAIL_VERT = /* glsl */ `
  attribute vec4 aColor;
  varying vec2 vUv;
  varying vec4 vColor;
  void main() {
    vUv = uv;
    vColor = aColor;
    gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
  }
`;

export const TRAIL_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uIntensity;
  uniform float uApplyColorSpace;
  varying vec2 vUv;
  varying vec4 vColor;
  vec3 toLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  }
  ${BLEND_OUT}
  void main() {
    vec4 t = texture2D(uMap, vUv);
    float a = t.a * vColor.a;
    gl_FragColor = fxBlendOut(mix(vColor.rgb, toLinear(vColor.rgb), uApplyColorSpace) * t.rgb * uIntensity, a, a, vColor.a);
    if (gl_FragColor.a < 0.002 && max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)) < 0.002) discard;
  }
`;

/** The particle fragment stage with a custom fxCustom function (see shaders/dialect.ts) built in. */
export function customParticleFrag(prelude: string, code: string): string {
  return `#define FX_CUSTOM
${PARTICLE_FRAG.replace('/*FX_CUSTOM_CODE*/', `${prelude}
#line 1
${code}
`)}`;
}
