"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  EARTH_GLSL,
  LAND_Y,
  VAB_POS,
  coastDist,
  crawlerwayDist,
  isWater,
  makeEarthUniforms,
  shoreZ,
} from "./earthShared";

/** Deterministic PRNG so the landscape is identical on every load. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wetland ground: marsh grass / scrub / mud patches; open water is cut out so the lagoon shows through. */
function WetlandGround({ matHaze }: { matHaze: number }) {
  const uniforms = useMemo(() => ({ ...makeEarthUniforms(), uMatHaze: { value: matHaze } }), [matHaze]);
  return (
    <mesh position={[0, LAND_Y, -200]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[5200, 5200, 1, 1]} />
      <shaderMaterial
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
          uniform float uMatHaze;
          varying vec3 vWorldPos;
          ${EARTH_GLSL}
          void main() {
            vec2 p = vWorldPos.xz;
            float sdf = landSdf(p);
            float edgeN = (eNoise(p * 0.35) - 0.5) * 1.4;
            if (sdf + edgeN < 0.0) discard;

            vec3 toCam = cameraPosition - vWorldPos;
            float dist = length(toCam);

            // Marsh palette: olive sawgrass, dark scrub, brown mud flats
            float n1 = eFbm(p * 0.018);
            float n2 = eFbm(p * 0.09 + 7.0);
            float n3 = eNoise(p * 0.8);
            vec3 grass = vec3(0.036, 0.042, 0.026);
            vec3 scrub = vec3(0.018, 0.024, 0.017);
            vec3 mud = vec3(0.040, 0.034, 0.026);
            vec3 col = mix(grass, scrub, smoothstep(0.42, 0.62, n1));
            col = mix(col, mud, smoothstep(0.62, 0.78, n2) * 0.7);
            col *= 0.86 + 0.28 * n3 * (1.0 / (1.0 + dist * 0.02));

            // Wet dark shoreline band
            float shore = 1.0 - smoothstep(0.0, 2.2, sdf + edgeN);
            col = mix(col, vec3(0.022, 0.022, 0.02), shore * 0.85);

            // Faint cool sky sheen at grazing angles
            float graze = pow(1.0 - clamp(toCam.y / dist, 0.0, 1.0), 6.0);
            col += uHazeCool * 0.05 * graze;

            float haze = hazeAmount(dist, vWorldPos.y) * uMatHaze;
            col = mix(col, hazeColor(-toCam / dist), haze);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

/** Dark irregular tree line + inland groves: instanced noise-displaced canopy blobs (1 draw call). */
function TreeCanopies({ count, matHaze }: { count: number; matHaze: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const uniforms = useMemo(() => ({ ...makeEarthUniforms(), uMatHaze: { value: matHaze } }), [matHaze]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rng = makeRng(1969);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    let n = 0;
    const put = (x: number, z: number, w: number, h: number, tone: number) => {
      if (n >= count) return;
      dummy.position.set(x, LAND_Y + h * 0.55, z);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      dummy.scale.set(w * (0.85 + rng() * 0.3), h, w * (0.85 + rng() * 0.3));
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      col.setScalar(tone);
      mesh.setColorAt(n, col);
      n++;
    };

    // 1 · Shore tree line facing the lagoon: dense, fine, irregular (3 staggered rows); low scrub in front of the pad
    // (the photographic silhouette is the TreeLineRibbon; blobs here only add depth behind it)
    const shoreBudget = Math.floor(count * 0.18);
    const xMin = -175;
    const xMax = 88;
    const stepAvg = ((xMax - xMin) * 2.5) / shoreBudget;
    let x = xMin;
    while (n < shoreBudget && x < xMax) {
      x += stepAvg * (0.6 + rng() * 0.8);
      const zs = shoreZ(x);
      for (let row = 0; row < 3; row++) {
        const z = zs - (4.5 + row * 3.0 + rng() * 2.4);
        if (isWater(x, z) || coastDist(x, z) > 52) continue;
        if (row === 2 && rng() < 0.4) continue;
        const nearPad = Math.abs(x) < 32 ? 0.38 + (Math.abs(x) / 32) * 0.45 : 1;
        const r = rng();
        if (r < 0.08 && nearPad === 1) {
          // occasional tall slash pine / cabbage palm
          put(x, z, 0.35 + rng() * 0.2, 1.9 + rng() * 0.9, 0.85);
        } else {
          const h = (0.7 + rng() * 0.75 + row * 0.15) * nearPad;
          put(x, z, 0.55 + rng() * 0.6, h, 0.8 + rng() * 0.4);
        }
      }
    }

    // 2 · Inland groves (clustered), larger blobs with distance so the horizon reads as a continuous tree line
    let guard = 0;
    while (n < count && guard < count * 30) {
      guard++;
      const a = rng() * Math.PI * 2;
      const r = 48 + Math.pow(rng(), 0.85) * 1050;
      const gx = Math.cos(a) * r;
      const gz = Math.sin(a) * r * 0.9 - 120;
      if (gz > shoreZ(gx) - 6) continue;
      if (isWater(gx, gz)) continue;
      const pr = Math.hypot(gx, gz);
      if (pr < 44) continue;
      const cw = crawlerwayDist(gx, gz);
      if (cw.lat < 13 && cw.along > 10 && cw.along < cw.len + 30) continue;
      if (Math.hypot(gx - VAB_POS[0], gz - VAB_POS[2]) < 90) continue;
      const grove = Math.sin(gx * 0.035 + 0.3) * Math.sin(gz * 0.028 + 1.1) + 0.6 * Math.sin(gx * 0.011 - gz * 0.013);
      if (grove < -0.15) continue;
      const far = THREE.MathUtils.smoothstep(pr, 120, 900);
      const w = (1.3 + rng() * 1.6) * (1 + far * 3.2);
      const h = (1.1 + rng() * 1.2) * (1 + far * 1.6);
      put(gx, gz, w, h, 0.75 + rng() * 0.5);
    }

    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count]);

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, count]} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        fog={false}
        vertexShader={/* glsl */ `
          varying vec3 vWorldPos;
          varying vec3 vNormalW;
          varying float vTone;
          varying float vH;
          float vHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
          float vNoise(vec3 p) {
            vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
            float n000 = vHash(i), n100 = vHash(i + vec3(1,0,0)), n010 = vHash(i + vec3(0,1,0)), n110 = vHash(i + vec3(1,1,0));
            float n001 = vHash(i + vec3(0,0,1)), n101 = vHash(i + vec3(1,0,1)), n011 = vHash(i + vec3(0,1,1)), n111 = vHash(i + vec3(1,1,1));
            return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
          }
          void main() {
            vec3 seed = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]) * 0.37;
            float d = vNoise(position * 2.3 + seed) * 0.5 + vNoise(position * 5.1 + seed * 1.7) * 0.25;
            vec3 pos = position * (0.72 + d * 0.62);
            pos.y = max(pos.y, -0.35);
            vec4 wp = modelMatrix * instanceMatrix * vec4(pos, 1.0);
            vWorldPos = wp.xyz;
            vNormalW = normalize(mat3(modelMatrix * instanceMatrix) * normal);
            #ifdef USE_INSTANCING_COLOR
              vTone = instanceColor.r;
            #else
              vTone = 1.0;
            #endif
            vH = position.y * 0.5 + 0.5;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uMatHaze;
          varying vec3 vWorldPos;
          varying vec3 vNormalW;
          varying float vTone;
          varying float vH;
          ${EARTH_GLSL}
          void main() {
            vec3 N = normalize(vNormalW);
            vec3 toCam = cameraPosition - vWorldPos;
            float dist = length(toCam);
            vec3 base = vec3(0.016, 0.021, 0.017) * vTone;
            float sky = 0.55 + 0.45 * N.y;
            float sun = max(dot(N, uSunDir), 0.0);
            float leaf = 0.75 + 0.5 * eNoise(vWorldPos.xz * 1.7 + vWorldPos.y * 2.3);
            vec3 col = base * sky * leaf + vec3(0.05, 0.036, 0.026) * sun * 0.35 * vH;
            col *= mix(0.55, 1.0, vH);
            float haze = hazeAmount(dist, vWorldPos.y) * uMatHaze;
            col = mix(col, hazeColor(-toCam / dist), haze);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </instancedMesh>
  );
}

/**
 * Photographic tree-line silhouettes for the low lagoon camera: long vertical ribbons following a path, with a
 * jagged fbm canopy profile cut in the shader (sawgrass / scrub / slash pine / cabbage palm). Hidden from high cameras.
 */
function TreeLineRibbon({
  path,
  baseH,
  varH,
  tone,
  matHaze,
  seed,
}: {
  path: [number, number][];
  baseH: number;
  varH: number;
  tone: number;
  matHaze: number;
  seed: number;
}) {
  const geo = useMemo(() => {
    const pos: number[] = [];
    const along: number[] = [];
    const idx: number[] = [];
    let acc = 0;
    const top = LAND_Y + baseH + varH * 1.9 + 1.2;
    for (let i = 0; i < path.length; i++) {
      const [x, z] = path[i];
      if (i > 0) acc += Math.hypot(x - path[i - 1][0], z - path[i - 1][1]);
      pos.push(x, LAND_Y - 0.3, z, x, top, z);
      along.push(acc, acc);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aAlong", new THREE.Float32BufferAttribute(along, 1));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }, [path, baseH, varH]);

  const uniforms = useMemo(
    () => ({
      ...makeEarthUniforms(),
      uMatHaze: { value: matHaze },
      uBaseH: { value: baseH },
      uVarH: { value: varH },
      uTone: { value: tone },
      uSeed: { value: seed },
      uLandY: { value: LAND_Y },
    }),
    [matHaze, baseH, varH, tone, seed],
  );

  return (
    <mesh geometry={geo} renderOrder={-1}>
      <shaderMaterial
        uniforms={uniforms}
        side={THREE.DoubleSide}
        fog={false}
        vertexShader={/* glsl */ `
          attribute float aAlong;
          varying vec3 vWorldPos;
          varying float vAlong;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            vAlong = aAlong;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uMatHaze;
          uniform float uBaseH;
          uniform float uVarH;
          uniform float uTone;
          uniform float uSeed;
          uniform float uLandY;
          varying vec3 vWorldPos;
          varying float vAlong;
          ${EARTH_GLSL}
          float n1(float x) { return eNoise(vec2(x, uSeed)); }
          void main() {
            if (cameraPosition.y > 9.0) discard;
            float a = vAlong;
            // canopy profile: broad crowns + leafy detail + sparse pine / palm spikes
            float h = uBaseH + uVarH * (n1(a * 0.11) * 0.9 + n1(a * 0.43 + 3.0) * 0.55 + n1(a * 1.9 + 7.0) * 0.22 + n1(a * 6.0) * 0.06);
            float spikeSel = step(0.9, n1(floor(a * 0.7) + 11.0));
            float spikeX = fract(a * 0.7);
            float spike = spikeSel * (1.0 - smoothstep(0.0, 0.07, abs(spikeX - 0.5))) * uVarH * 0.7;
            h += spike;
            // cleared perimeter in front of the pad: low scrub only
            h *= mix(0.42, 1.0, smoothstep(18.0, 34.0, abs(vWorldPos.x + 1.0)) + step(0.0, -vWorldPos.z - 40.0));
            // sink the ribbons smoothly as the camera climbs (inland canopy blobs take over from above)
            h *= 1.0 - smoothstep(4.0, 9.0, cameraPosition.y);
            float y = vWorldPos.y - uLandY;
            if (y > h) discard;
            vec3 toCam = cameraPosition - vWorldPos;
            float dist = length(toCam);
            float leaf = 0.8 + 0.4 * eNoise(vec2(a * 2.3, y * 3.1));
            float grad = mix(0.55, 1.0, smoothstep(0.0, h, y));
            vec3 col = vec3(0.017, 0.021, 0.019) * uTone * leaf * grad;
            float haze = hazeAmount(dist, vWorldPos.y) * uMatHaze;
            col = mix(col, hazeColor(-toCam / dist), haze);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

function makePath(x0: number, x1: number, step: number, zAt: (x: number) => number): [number, number][] {
  const out: [number, number][] = [];
  for (let x = x0; x <= x1; x += step) out.push([x, zAt(x)]);
  return out;
}

/** Distant transmission line: small poles + sagging wires just above the far tree line (1 + 1 + 1 draw calls). */
function PowerLine() {
  const polesRef = useRef<THREE.InstancedMesh>(null);
  const armsRef = useRef<THREE.InstancedMesh>(null);
  const pts = useMemo(() => {
    const out: [number, number][] = [];
    const a: [number, number] = [-430, -170];
    const b: [number, number] = [300, -95];
    const segs = 22;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      out.push([THREE.MathUtils.lerp(a[0], b[0], t), THREE.MathUtils.lerp(a[1], b[1], t)]);
    }
    return out;
  }, []);
  const poleH = 4.6;

  useEffect(() => {
    const poles = polesRef.current;
    const arms = armsRef.current;
    if (!poles || !arms) return;
    const d = new THREE.Object3D();
    pts.forEach(([x, z], i) => {
      d.position.set(x, LAND_Y + poleH / 2, z);
      d.rotation.set(0, 0, 0);
      d.scale.set(1, 1, 1);
      d.updateMatrix();
      poles.setMatrixAt(i, d.matrix);
      d.position.set(x, LAND_Y + poleH - 0.35, z);
      d.rotation.set(0, Math.atan2(-75, 395), 0);
      d.updateMatrix();
      arms.setMatrixAt(i, d.matrix);
    });
    poles.instanceMatrix.needsUpdate = true;
    arms.instanceMatrix.needsUpdate = true;
    poles.computeBoundingSphere();
    arms.computeBoundingSphere();
  }, [pts]);

  const wireGeo = useMemo(() => {
    const v: number[] = [];
    const dir = new THREE.Vector2(395, 75).normalize();
    const perp = new THREE.Vector2(-dir.y, dir.x);
    for (let i = 0; i < pts.length - 1; i++) {
      for (const off of [-0.55, 0.55]) {
        const [x0, z0] = pts[i];
        const [x1, z1] = pts[i + 1];
        const segs = 8;
        for (let s = 0; s < segs; s++) {
          const t0 = s / segs;
          const t1 = (s + 1) / segs;
          const y0 = LAND_Y + poleH - 0.38 - 0.6 * 4 * t0 * (1 - t0);
          const y1 = LAND_Y + poleH - 0.38 - 0.6 * 4 * t1 * (1 - t1);
          v.push(
            THREE.MathUtils.lerp(x0, x1, t0) + perp.x * off,
            y0,
            THREE.MathUtils.lerp(z0, z1, t0) + perp.y * off,
            THREE.MathUtils.lerp(x0, x1, t1) + perp.x * off,
            y1,
            THREE.MathUtils.lerp(z0, z1, t1) + perp.y * off,
          );
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, [pts]);

  return (
    <group>
      <instancedMesh ref={polesRef} args={[undefined, undefined, pts.length]}>
        <cylinderGeometry args={[0.07, 0.11, poleH, 5]} />
        <meshStandardMaterial color="#20242B" roughness={0.9} metalness={0.1} />
      </instancedMesh>
      <instancedMesh ref={armsRef} args={[undefined, undefined, pts.length]}>
        <boxGeometry args={[0.07, 0.07, 1.5]} />
        <meshStandardMaterial color="#20242B" roughness={0.9} metalness={0.1} />
      </instancedMesh>
      <lineSegments geometry={wireGeo}>
        <lineBasicMaterial color="#2A2F38" transparent opacity={0.55} />
      </lineSegments>
    </group>
  );
}

/** Opus pad scene · KSC wetland landscape seen across the lagoon (beats 0–3). */
export function WetlandLandscape({ treeCount, matHaze }: { treeCount: number; matHaze: number }) {
  const nearPath = useMemo(() => makePath(-420, 76, 0.8, (x) => shoreZ(x) - 1.6), []);
  const midPath = useMemo(() => makePath(-520, 160, 2, (x) => -58 - 10 * Math.sin(x * 0.012 + 0.5) - x * 0.06), []);
  const farPath = useMemo(() => makePath(-1500, 900, 6, (x) => -330 - 40 * Math.sin(x * 0.004 + 1.2) - x * 0.1), []);
  return (
    <group>
      <WetlandGround matHaze={matHaze} />
      <TreeCanopies count={treeCount} matHaze={matHaze} />
      {/* Near shore tree line across the lagoon (lower scrub in front of the pad) */}
      <TreeLineRibbon path={nearPath} baseH={0.55} varH={0.85} tone={1} matHaze={matHaze} seed={3} />
      {/* Tree lines behind the pad and on the far horizon (layered depth, hazed by the post pass) */}
      <TreeLineRibbon path={midPath} baseH={1.6} varH={1.4} tone={1.1} matHaze={matHaze} seed={11} />
      <TreeLineRibbon path={farPath} baseH={4.5} varH={3.2} tone={1.2} matHaze={matHaze} seed={23} />
      <PowerLine />
    </group>
  );
}
