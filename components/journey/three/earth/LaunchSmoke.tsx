"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { SUN_DIR } from "./earthShared";
import { sampleTrajectory } from "../trajectory";

let puffAtlasCache: THREE.DataTexture | null = null;

/** 2×2 atlas of billowing smoke puffs (fbm-eroded cauliflower density), R = density, G = upper-lobe light proxy. */
function getPuffAtlas(): THREE.DataTexture {
  if (puffAtlasCache) return puffAtlasCache;
  const S = 256;
  const C = 128;
  const data = new Uint8Array(S * S * 4);
  const hash = (x: number, y: number, s: number) => {
    const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
    return h - Math.floor(h);
  };
  const noise = (x: number, y: number, s: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s);
    const b = hash(xi + 1, yi, s);
    const c = hash(xi, yi + 1, s);
    const d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x: number, y: number, s: number) => {
    let val = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < 5; o++) {
      val += amp * noise(x * f, y * f, s + o * 13);
      f *= 2.03;
      amp *= 0.5;
    }
    return val;
  };
  for (let cell = 0; cell < 4; cell++) {
    const ox = (cell % 2) * C;
    const oy = Math.floor(cell / 2) * C;
    // a few lobes per puff for a cauliflower outline
    const lobes: [number, number, number][] = [];
    for (let l = 0; l < 6; l++) {
      const a = hash(l, cell, 3) * Math.PI * 2;
      const r = l === 0 ? 0 : 0.12 + hash(l, cell, 5) * 0.16;
      lobes.push([Math.cos(a) * r, Math.sin(a) * r * 0.85, 0.24 + hash(l, cell, 9) * 0.12]);
    }
    for (let y = 0; y < C; y++) {
      for (let x = 0; x < C; x++) {
        const u = (x + 0.5) / C - 0.5;
        const v = (y + 0.5) / C - 0.5;
        let dens = 0;
        let top = 0;
        for (const [lx, ly, lr] of lobes) {
          const d = Math.hypot(u - lx, v - ly) / lr;
          const w = Math.max(0, 1 - d * d);
          dens = Math.max(dens, w);
          top = Math.max(top, w * (0.5 + (v - ly) / lr));
        }
        const n = fbm(u * 6 + cell * 3.1, v * 6, cell);
        dens = dens * (0.55 + 0.9 * n) - 0.18;
        const edge = Math.max(0, 1 - Math.hypot(u, v) / 0.5);
        dens = Math.max(0, Math.min(1, dens * 1.7)) * Math.min(1, edge * 3);
        const i = ((oy + y) * S + ox + x) * 4;
        data[i] = Math.round(dens * 255);
        data[i + 1] = Math.round(Math.max(0, Math.min(1, top * 0.8 + n * 0.4)) * 255);
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
    }
  }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  puffAtlasCache = tex;
  return tex;
}

function makeScratch(count: number) {
  return {
    n: count,
    traj: {
      camPos: new THREE.Vector3(),
      camLook: new THREE.Vector3(),
      rocketPos: new THREE.Vector3(),
      rocketRot: new THREE.Euler(),
      rocketScale: 1,
    },
    cx: new Float32Array(count),
    cy: new Float32Array(count),
    cz: new Float32Array(count),
    size: new Float32Array(count),
    rot: new Float32Array(count),
    heat: new Float32Array(count),
    alpha: new Float32Array(count),
    depth: new Float32Array(count),
    order: Array.from({ length: count }, (_, i) => i),
    v: new THREE.Vector3(),
    sunView: new THREE.Vector3(),
  };
}

type Puff = { kind: 0 | 1 | 2; s1: number; s2: number; s3: number; s4: number; f: number };

/**
 * Opus pad scene · liftoff exhaust: wide billowing ground clouds out of the flame trench and a tall,
 * softly lit smoke column rising from the pad to the rocket tail, warm engine glow at its base.
 * Camera-facing instanced puffs, CPU depth-sorted (≤ 150 instances) for clean alpha blending.
 */
export function LaunchSmoke({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const puffs = useMemo<Puff[]>(() => {
    const out: Puff[] = [];
    const nVent = 12;
    const nGround = Math.round((count - nVent) * 0.46);
    const nCol = count - nVent - nGround;
    for (let i = 0; i < count; i++) {
      const h = (k: number) => {
        const v = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453;
        return v - Math.floor(v);
      };
      const isGround = i < nGround;
      const isVent = i >= nGround + nCol;
      out.push({
        kind: isVent ? 2 : isGround ? 0 : 1,
        s1: h(1),
        s2: h(2),
        s3: h(3),
        s4: h(4),
        f: isGround ? 0 : (i - nGround + h(5) * 0.8) / nCol,
      });
    }
    return out;
  }, [count]);

  const geo = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute("position", base.getAttribute("position"));
    g.setAttribute("uv", base.getAttribute("uv"));
    g.setAttribute("aCenter", new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aParams", new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aCell", new THREE.InstancedBufferAttribute(new Float32Array(count), 1).setUsage(THREE.DynamicDrawUsage));
    g.instanceCount = count;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 60);
    return g;
  }, [count]);

  const scratchRef = useRef<ReturnType<typeof makeScratch> | null>(null);

  const uniforms = useMemo(
    () => ({
      uTex: { value: getPuffAtlas() },
      uSunView: { value: new THREE.Vector3(0, 0, 1) },
      uFlicker: { value: 1 },
      uLitCol: { value: new THREE.Color("#B9BEC8") },
      uShadeCol: { value: new THREE.Color("#3F4553") },
      uWarmCol: { value: new THREE.Color("#D4BCAE") },
    }),
    [],
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const p = scrollState.current;
    const active = smoothstep(1.6, 1.8, p) * (1 - smoothstep(3.2, 3.58, p));
    // Pre-launch cryogenic venting: faint white wisps drifting off the core stage while it sits on the pad
    const vent = smoothstep(0.55, 0.95, p) * (1 - smoothstep(1.62, 1.85, p));
    mesh.visible = active > 0.005 || vent > 0.005;
    if (!mesh.visible) return;
    if (!reducedMotion) timeRef.current += Math.min(delta, 0.05);
    const t = timeRef.current;
    if (!scratchRef.current || scratchRef.current.n !== puffs.length) scratchRef.current = makeScratch(puffs.length);
    const s = scratchRef.current;

    sampleTrajectory(p, s.traj);
    const tailY = Math.max(0, s.traj.rocketPos.y);
    const colTop = Math.max(0, tailY - 0.25);
    const spread = smoothstep(1.62, 2.7, p);
    const build = smoothstep(1.66, 1.9, p);
    const flicker = reducedMotion ? 1 : 0.9 + 0.1 * Math.sin(t * 41) + 0.05 * Math.sin(t * 23.7);
    const thrust = smoothstep(1.75, 2.0, p);

    for (let i = 0; i < puffs.length; i++) {
      const pf = puffs[i];
      const churn = reducedMotion ? 0 : t;
      if (pf.kind === 2) {
        const cyc = ((reducedMotion ? 0.45 : t * 0.07) + pf.s2) % 1;
        const vy = pf.s1 < 0.6 ? 8.7 : 3.6;
        s.cx[i] = 0.55 + cyc * 3.4 + pf.s3 * 0.3;
        s.cy[i] = vy + (pf.s4 - 0.5) * 0.5 - cyc * 0.9;
        s.cz[i] = 0.45 + cyc * 0.6;
        s.size[i] = 0.35 + cyc * 1.7;
        s.heat[i] = -1; // sentinel: thin sunlit vapour wisp
        s.alpha[i] = Math.sin(Math.PI * cyc) * 0.26 * vent;
      } else if (pf.kind === 0) {
        // Ground cloud rolling out to both sides of the pad (and a little behind), slowly boiling
        const side = pf.s1 < 0.5 ? -1 : 1;
        const reach = 2.5 + pf.s2 * 36 * Math.pow(spread, 0.6);
        const ang = (side > 0 ? 0 : Math.PI) + (pf.s3 - 0.5) * 1.1;
        const sz = (3.2 + pf.s4 * 4.6) * (0.55 + 0.75 * spread) * (1 + reach * 0.045);
        s.cx[i] = Math.cos(ang) * reach + Math.sin(churn * 0.21 + pf.s1 * 9) * 0.5;
        s.cz[i] = Math.sin(ang) * reach * 0.55 - 3 - pf.s4 * 7 * spread;
        s.cy[i] = 0.2 + sz * 0.32 + pf.s3 * 3.2 * spread * (1 - reach / 40) + Math.sin(churn * 0.33 + pf.s2 * 7) * 0.2;
        s.size[i] = sz;
        s.heat[i] = Math.exp(-reach / 5.5) * thrust * 0.9;
        s.alpha[i] = smoothstep(1.62 + pf.s4 * 0.12, 1.82 + pf.s4 * 0.12, p) * 0.92 * active;
      } else {
        // Column: from the trench up to the rocket's tail, widening and leaning downwind with age
        const f = pf.f;
        const y = 0.5 + f * colTop;
        const age = 1 - f;
        const grow = Math.min(1, colTop / 8);
        const sz = 1.2 + pf.s2 * 1.1 + age * 4.2 * grow + spread * age * 1.8;
        const lean = f * colTop * 0.07 * spread;
        s.cx[i] = (pf.s3 - 0.5) * sz * 0.55 + lean + Math.sin(churn * 0.37 + pf.s1 * 11) * 0.18 * sz * 0.3;
        s.cz[i] = (pf.s4 - 0.5) * sz * 0.5;
        s.cy[i] = y + Math.sin(churn * 0.29 + pf.s2 * 5) * 0.12 * sz;
        s.size[i] = sz;
        const nearTail = Math.exp(-Math.max(0, colTop - (y - 0.5)) / 1.4);
        s.heat[i] = (nearTail * 1.15 + Math.exp(-y / 2.2) * 0.55) * thrust;
        s.alpha[i] = build * smoothstep(0.0, 0.6, colTop + 0.6 - f * colTop) * 0.95 * active;
        if (y > tailY + 0.2) s.alpha[i] = 0;
      }
      s.rot[i] = (pf.s1 - 0.5) * 1.0 + (reducedMotion ? 0 : Math.sin(t * 0.07 + pf.s2 * 6) * 0.15);
    }

    // Back-to-front sort in view space
    const cam = state.camera;
    cam.updateMatrixWorld();
    const view = cam.matrixWorldInverse;
    for (let i = 0; i < puffs.length; i++) {
      s.v.set(s.cx[i], s.cy[i], s.cz[i]).applyMatrix4(view);
      s.depth[i] = s.v.z;
    }
    s.order.sort((a, b) => s.depth[a] - s.depth[b]);

    const cAttr = geo.getAttribute("aCenter") as THREE.InstancedBufferAttribute;
    const pAttr = geo.getAttribute("aParams") as THREE.InstancedBufferAttribute;
    const kAttr = geo.getAttribute("aCell") as THREE.InstancedBufferAttribute;
    const ca = cAttr.array as Float32Array;
    const pa = pAttr.array as Float32Array;
    const ka = kAttr.array as Float32Array;
    for (let j = 0; j < puffs.length; j++) {
      const i = s.order[j];
      ca[j * 3] = s.cx[i];
      ca[j * 3 + 1] = s.cy[i];
      ca[j * 3 + 2] = s.cz[i];
      pa[j * 4] = s.size[i];
      pa[j * 4 + 1] = s.rot[i];
      pa[j * 4 + 2] = s.heat[i];
      pa[j * 4 + 3] = s.alpha[i];
      ka[j] = Math.floor(puffs[i].s4 * 4) % 4;
    }
    cAttr.needsUpdate = true;
    pAttr.needsUpdate = true;
    kAttr.needsUpdate = true;

    s.sunView.copy(SUN_DIR).transformDirection(view);
    mat.uniforms.uSunView.value.copy(s.sunView);
    mat.uniforms.uFlicker.value = flicker;
  });

  return (
    <mesh ref={meshRef} geometry={geo} visible={false} frustumCulled={false} renderOrder={4}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        fog={false}
        vertexShader={/* glsl */ `
          attribute vec3 aCenter;
          attribute vec4 aParams;
          attribute float aCell;
          varying vec2 vUv;
          varying vec2 vOff;
          varying float vHeat;
          varying float vAlpha;
          void main() {
            float c = cos(aParams.y);
            float s = sin(aParams.y);
            vec2 corner = position.xy;
            vec2 rc = vec2(corner.x * c - corner.y * s, corner.x * s + corner.y * c);
            vec4 mv = viewMatrix * vec4(aCenter, 1.0);
            mv.xy += rc * aParams.x;
            vOff = rc * 2.0;
            vec2 cellOrigin = vec2(mod(aCell, 2.0), floor(aCell / 2.0)) * 0.5;
            vUv = cellOrigin + uv * 0.5;
            vHeat = aParams.z;
            vAlpha = aParams.w;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform sampler2D uTex;
          uniform vec3 uSunView;
          uniform float uFlicker;
          uniform vec3 uLitCol;
          uniform vec3 uShadeCol;
          uniform vec3 uWarmCol;
          varying vec2 vUv;
          varying vec2 vOff;
          varying float vHeat;
          varying float vAlpha;
          void main() {
            vec4 tx = texture2D(uTex, vUv);
            float dens = tx.r;
            float a = dens * vAlpha;
            if (a < 0.004) discard;
            float r2 = dot(vOff, vOff);
            vec3 n = normalize(vec3(vOff, sqrt(max(0.0, 1.0 - r2)) * 1.1 + 0.2));
            float wrap = clamp(dot(n, uSunView) * 0.5 + 0.5, 0.0, 1.0);
            float top = tx.g;
            float light = clamp(wrap * 0.7 + top * 0.45 + vOff.y * 0.12, 0.0, 1.0);
            vec3 col = mix(uShadeCol, uLitCol, light);
            col = mix(col, uWarmCol, pow(wrap, 3.0) * 0.35);
            // Thin edges scatter more sky light; dense cores darker
            col = mix(col, uLitCol * 1.05, (1.0 - dens) * 0.3);
            // Engine glow lighting the smoke from below
            float under = smoothstep(0.7, -0.8, vOff.y);
            col += vec3(2.2, 0.82, 0.26) * max(vHeat, 0.0) * (0.35 + 0.65 * under) * uFlicker * (0.55 + 0.45 * dens);
            // Pre-launch cryogenic vapour: pale, nearly white
            if (vHeat < -0.5) col = mix(uLitCol * 1.25, uWarmCol, 0.15);
            gl_FragColor = vec4(col, a);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}
