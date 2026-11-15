"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scroll/progress";
import { EARTH_GLSL, WATER_Y, makeEarthUniforms } from "./earthShared";

let rippleCache: THREE.DataTexture | null = null;

/** Tileable ripple normal map (sum of integer-frequency waves ⇒ seamless), built once. */
function getRippleNormalTexture(): THREE.DataTexture {
  if (rippleCache) return rippleCache;
  const S = 256;
  const waves: { kx: number; ky: number; a: number; ph: number }[] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 34; i++) {
    let kx = Math.round((rnd() - 0.5) * 22);
    const ky = Math.round((rnd() - 0.5) * 9);
    if (kx === 0 && ky === 0) kx = 3;
    const k = Math.hypot(kx, ky);
    waves.push({ kx, ky, a: 1 / Math.pow(k, 1.15), ph: rnd() * Math.PI * 2 });
  }
  const h = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let v = 0;
      for (const w of waves) {
        v += w.a * Math.sin(((w.kx * x + w.ky * y) / S) * Math.PI * 2 + w.ph);
      }
      h[y * S + x] = v;
    }
  }
  const data = new Uint8Array(S * S * 4);
  const strength = 9.0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const xl = h[y * S + ((x - 1 + S) % S)];
      const xr = h[y * S + ((x + 1) % S)];
      const yd = h[((y - 1 + S) % S) * S + x];
      const yu = h[((y + 1) % S) * S + x];
      let nx = (xl - xr) * strength * 0.05;
      let ny = (yd - yu) * strength * 0.05;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * S + x) * 4;
      data[i] = Math.round((nx * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  rippleCache = tex;
  return tex;
}

function makeMirror() {
  return {
    cam: new THREE.PerspectiveCamera(),
    normal: new THREE.Vector3(0, 1, 0),
    planePoint: new THREE.Vector3(0, WATER_Y, 0),
    camWorld: new THREE.Vector3(),
    view: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    target: new THREE.Vector3(),
    rot: new THREE.Matrix4(),
    plane: new THREE.Plane(),
    clip: new THREE.Vector4(),
    q: new THREE.Vector4(),
  };
}

const BIAS_MATRIX = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);

/**
 * Calm lagoon / Atlantic water with a planar mirror reflection (high & medium tiers) distorted by
 * tiled ripple normals, fresnel, and aerial haze. Low tier falls back to an analytic sky reflection.
 */
export function LagoonWater({
  reflect,
  reflectScale,
  matHaze,
  reducedMotion,
  activeRef,
}: {
  reflect: boolean;
  reflectScale: number;
  matHaze: number;
  reducedMotion: boolean;
  /** Parent visibility (pad group); reflection only renders while true. */
  activeRef: React.RefObject<THREE.Group | null>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const timeRef = useRef(0);

  const rt = useMemo(() => {
    if (!reflect) return null;
    const r = new THREE.WebGLRenderTarget(4, 4, {
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
    });
    r.texture.colorSpace = THREE.NoColorSpace;
    return r;
  }, [reflect]);

  useEffect(() => {
    if (!rt) return;
    const pr = dpr;
    rt.setSize(
      Math.max(64, Math.round(size.width * pr * reflectScale)),
      Math.max(64, Math.round(size.height * pr * reflectScale)),
    );
  }, [rt, dpr, size, reflectScale]);

  useEffect(() => () => rt?.dispose(), [rt]);

  const mirrorRef = useRef<ReturnType<typeof makeMirror> | null>(null);
  const texMatrix = useMemo(() => new THREE.Matrix4(), []);

  const uniforms = useMemo(
    () => ({
      ...makeEarthUniforms(),
      uTime: { value: 0 },
      uRipple: { value: getRippleNormalTexture() },
      uReflect: { value: (rt?.texture ?? null) as THREE.Texture | null },
      uReflectOn: { value: reflect ? 1 : 0 },
      uTexMatrix: { value: texMatrix },
      uMatHaze: { value: matHaze },
    }),
    [rt, reflect, texMatrix, matHaze],
  );

  useFrame((state, delta) => {
    const mat = matRef.current;
    const mesh = meshRef.current;
    if (!mat || !mesh) return;
    if (!reducedMotion) timeRef.current += Math.min(delta, 0.05);
    mat.uniforms.uTime.value = timeRef.current;

    if (!rt) return;
    const p = scrollState.current;
    if (p > 3.62 || (activeRef.current && !activeRef.current.visible)) return;

    // Planar mirror camera (after the choreographer has posed the main camera this frame)
    const camera = state.camera as THREE.PerspectiveCamera;
    camera.updateMatrixWorld();
    if (!mirrorRef.current) mirrorRef.current = makeMirror();
    const m = mirrorRef.current;
    m.camWorld.setFromMatrixPosition(camera.matrixWorld);
    m.view.subVectors(m.planePoint, m.camWorld);
    if (m.view.dot(m.normal) > 0) return;
    m.view.reflect(m.normal).negate().add(m.planePoint);

    m.rot.extractRotation(camera.matrixWorld);
    m.lookAt.set(0, 0, -1).applyMatrix4(m.rot).add(m.camWorld);
    m.target.subVectors(m.planePoint, m.lookAt).reflect(m.normal).negate().add(m.planePoint);

    const vc = m.cam;
    vc.position.copy(m.view);
    vc.up.set(0, 1, 0).applyMatrix4(m.rot).reflect(m.normal);
    vc.lookAt(m.target);
    vc.far = camera.far;
    vc.near = camera.near;
    vc.updateMatrixWorld();
    vc.projectionMatrix.copy(camera.projectionMatrix);

    (mat.uniforms.uTexMatrix.value as THREE.Matrix4).copy(BIAS_MATRIX).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);

    // Oblique near-plane clipping so nothing below the water leaks into the reflection
    m.plane.setFromNormalAndCoplanarPoint(m.normal, m.planePoint).applyMatrix4(vc.matrixWorldInverse);
    m.clip.set(m.plane.normal.x, m.plane.normal.y, m.plane.normal.z, m.plane.constant);
    const pm = vc.projectionMatrix;
    m.q.x = (Math.sign(m.clip.x) + pm.elements[8]) / pm.elements[0];
    m.q.y = (Math.sign(m.clip.y) + pm.elements[9]) / pm.elements[5];
    m.q.z = -1.0;
    m.q.w = (1.0 + pm.elements[10]) / pm.elements[14];
    m.clip.multiplyScalar(2.0 / m.clip.dot(m.q));
    pm.elements[2] = m.clip.x;
    pm.elements[6] = m.clip.y;
    pm.elements[10] = m.clip.z + 1.0 - 0.003;
    pm.elements[14] = m.clip.w;
    vc.projectionMatrixInverse.copy(pm).invert();

    const gl = state.gl;
    mesh.visible = false;
    const prevTarget = gl.getRenderTarget();
    const prevShadow = gl.shadowMap.autoUpdate;
    const prevXr = gl.xr.enabled;
    gl.xr.enabled = false;
    gl.shadowMap.autoUpdate = false;
    try {
      gl.setRenderTarget(rt);
      gl.state.buffers.depth.setMask(true);
      if (gl.autoClear === false) gl.clear();
      gl.render(state.scene, vc);
    } finally {
      gl.setRenderTarget(prevTarget);
      gl.shadowMap.autoUpdate = prevShadow;
      gl.xr.enabled = prevXr;
      mesh.visible = true;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, WATER_Y, -200]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
      <planeGeometry args={[5200, 5200, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        fog={false}
        vertexShader={/* glsl */ `
          varying vec3 vWorldPos;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime;
          uniform sampler2D uRipple;
          uniform sampler2D uReflect;
          uniform float uReflectOn;
          uniform mat4 uTexMatrix;
          uniform float uMatHaze;
          varying vec3 vWorldPos;
          ${EARTH_GLSL}

          vec3 rippleNormal(vec2 p, float dist) {
            vec2 w1 = vec2(0.011, 0.004) * uTime;
            vec2 w2 = vec2(-0.006, 0.009) * uTime;
            vec3 n1 = texture2D(uRipple, p * vec2(0.14, 0.3) + w1).xyz * 2.0 - 1.0;
            vec3 n2 = texture2D(uRipple, p * vec2(0.45, 0.9) + w2).xyz * 2.0 - 1.0;
            vec3 n3 = texture2D(uRipple, p * vec2(0.03, 0.05) - w1 * 0.4).xyz * 2.0 - 1.0;
            vec2 slope = n1.xy * 0.7 + n2.xy * 0.8 + n3.xy * 0.4;
            float fade = 1.0 / (1.0 + dist * 0.006);
            slope *= mix(0.45, 1.25, fade);
            return normalize(vec3(slope.x, 1.0, slope.y));
          }

          void main() {
            vec3 toCam = cameraPosition - vWorldPos;
            float dist = length(toCam);
            vec3 V = toCam / dist;
            vec3 N = rippleNormal(vWorldPos.xz, dist);
            vec3 R = reflect(-V, N);

            float ndv = max(dot(N, V), 0.0);
            float fresnel = 0.025 + 0.975 * pow(1.0 - ndv, 5.0);

            // Analytic overcast-sky reflection (low tier, and fill where the mirror has no data)
            vec3 skyR = mix(hazeColor(normalize(vec3(R.x, max(R.y, 0.0), R.z))), uHazeHigh * 0.9, smoothstep(0.02, 0.5, R.y));
            vec3 refl = skyR;
            if (uReflectOn > 0.5) {
              vec4 pc = uTexMatrix * vec4(vWorldPos, 1.0);
              vec2 uv = pc.xy / pc.w;
              vec2 distort = vec2(N.x * 0.7, N.z * 1.6) * (1.0 / (1.0 + dist * 0.02)) * 0.03;
              uv += distort;
              refl = texture2D(uReflect, clamp(uv, 0.002, 0.998), 1.6).rgb;
            }

            // Grey-blue lagoon body (Banana River tone) under the reflection
            vec3 body = vec3(0.05, 0.052, 0.055);
            vec3 col = mix(body, refl * 0.82, fresnel);

            // Soft glints of the low sun on ripple facets
            float sunSpec = pow(max(dot(R, uSunDir), 0.0), 220.0);
            col += vec3(1.0, 0.86, 0.72) * sunSpec * 0.8;

            float haze = hazeAmount(dist, vWorldPos.y) * uMatHaze;
            col = mix(col, hazeColor(-V), haze);

            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}
