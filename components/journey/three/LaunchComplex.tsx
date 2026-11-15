"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { usePerfBudget } from "./perfTier";
import {
  getCrawlerwayGravelTextures,
  getLensGlowTexture,
  getPadConcreteTextures,
  getSteelLatticeTextures,
  getVabFacadeTextures,
} from "./rocketTextures";
import { WORLD_ANCHORS } from "./trajectory";

const TOWER_BAYS = [0.6, 1.9, 3.2, 4.5, 5.8, 7.1, 8.4, 9.7, 11.0, 12.3];
const WORK_LIGHT_BAYS = [1.9, 4.5, 7.1, 9.7, 12.1];

const LIGHTNING_TOWER_COORDS: [number, number][] = [
  [-15.2, -11.8],
  [15.2, -11.8],
  [0, 17.5],
];

const STADIUM_FLOOD_TOWERS: { pos: [number, number, number]; yaw: number; color: string; hdr: [number, number, number] }[] = [
  { pos: [12.8, 0, 11.4], yaw: -0.78, color: "#DCE6FF", hdr: [2.1, 2.25, 2.6] },
  { pos: [-13.0, 0, 11.8], yaw: 0.78, color: "#FFE2BE", hdr: [2.5, 2.05, 1.55] },
  { pos: [13.6, 0, -10.8], yaw: -2.35, color: "#DCE6FF", hdr: [2.1, 2.25, 2.6] },
  { pos: [-13.6, 0, -10.8], yaw: 2.35, color: "#FFE2BE", hdr: [2.5, 2.05, 1.55] },
];

const UP_AXIS = new THREE.Vector3(0, 1, 0);
const SCRUB_WIND_UNIFORM = { value: 0 };

/** Compute 3D strut instance matrix between two points `a` and `b` with uniform radius `r`. */
function composeStrutMatrix(
  a: [number, number, number],
  b: [number, number, number],
  r: number,
  outMat: THREE.Matrix4,
  vA: THREE.Vector3,
  vB: THREE.Vector3,
  vDir: THREE.Vector3,
  vMid: THREE.Vector3,
  vQuat: THREE.Quaternion,
  vScale: THREE.Vector3,
) {
  vA.set(a[0], a[1], a[2]);
  vB.set(b[0], b[1], b[2]);
  vDir.subVectors(vB, vA);
  const len = vDir.length();
  vMid.addVectors(vA, vB).multiplyScalar(0.5);
  if (len > 1e-4) {
    vDir.divideScalar(len);
    vQuat.setFromUnitVectors(UP_AXIS, vDir);
  } else {
    vQuat.identity();
  }
  vScale.set(r, Math.max(len, 1e-4), r);
  outMat.compose(vMid, vQuat, vScale);
}

/** E2 · Animated Atlantic Ocean water shader with wave normals, western dusk sun glint & coastal haze. */
function AtlanticOceanSurface({ reducedMotion }: { reducedMotion: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(-0.82, 0.072, -0.57).normalize() },
      uFogColor: { value: new THREE.Color("#323B4E") },
      uHorizonGlow: { value: new THREE.Color("#C76F4E") },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    if (!reducedMotion) {
      timeRef.current += Math.min(delta, 0.05);
    }
    matRef.current.uniforms.uTime.value = timeRef.current;
  });

  return (
    <mesh position={[450, -1.85, -150]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
      <planeGeometry args={[4600, 4600, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        fog={false}
        vertexShader={`
          varying vec3 vWorldPos;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uSunDir;
          uniform vec3 uFogColor;
          uniform vec3 uHorizonGlow;
          varying vec3 vWorldPos;

          vec3 waveNormal(vec2 p, float t) {
            // Single-pass analytical gradient across 4 directional Atlantic swell octaves
            float dhx = 0.0;
            float dhz = 0.0;
            float ph1 = dot(p, vec2(0.42, 0.25)) - t * 1.15;
            float c1 = cos(ph1) * 0.22;
            dhx += c1 * 0.42; dhz += c1 * 0.25;

            float ph2 = dot(p, vec2(-0.31, 0.54)) - t * 0.88;
            float c2 = cos(ph2) * 0.16;
            dhx += c2 * -0.31; dhz += c2 * 0.54;

            float ph3 = dot(p, vec2(0.95, -0.68)) + t * 1.55;
            float c3 = cos(ph3) * 0.09;
            dhx += c3 * 0.95; dhz += c3 * -0.68;

            float ph4 = dot(p, vec2(-1.45, -0.92)) - t * 2.15;
            float c4 = cos(ph4) * 0.055;
            dhx += c4 * -1.45; dhz += c4 * -0.92;

            return normalize(vec3(-dhx * 0.85, 1.0, -dhz * 0.85));
          }

          void main() {
            vec2 p = vWorldPos.xz * 0.34;
            vec3 N = waveNormal(p, uTime);

            vec3 V = normalize(cameraPosition - vWorldPos);
            float dist = length(cameraPosition - vWorldPos);

            // Fresnel water reflection (deep ocean nadir -> warm-cool dusk horizon sky)
            float fresnel = clamp(0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 4.2), 0.0, 1.0);
            vec3 R = reflect(-V, N);
            float skySunDot = max(dot(normalize(R), uSunDir), 0.0);

            vec3 deepSea = vec3(0.025, 0.068, 0.145);
            vec3 skyRefl = mix(vec3(0.08, 0.14, 0.27), uHorizonGlow * 0.72, pow(skySunDot, 2.2) * (1.0 - smoothstep(0.02, 0.32, R.y)));
            vec3 col = mix(deepSea, skyRefl, fresnel * 0.88);

            // Specular sun glint path across ocean swells (~4 deg dusk sun)
            vec3 H = normalize(uSunDir + V);
            float specTight = pow(max(dot(N, H), 0.0), 180.0);
            float specBroad = pow(max(dot(N, H), 0.0), 24.0);
            col += vec3(1.0, 0.76, 0.48) * (specTight * 1.45 + specBroad * 0.18);

            // Faint cool pad floodlight bounce near the shoreline
            float padGlowDist = length(vWorldPos.xz - vec2(15.0, 0.0));
            float padRefl = exp(-padGlowDist * 0.015) * max(dot(N, normalize(vec3(0.0, 0.4, 0.9) + V)), 0.0);
            col += vec3(0.45, 0.58, 0.82) * pow(padRefl, 6.0) * 0.25;

            // Subtle Atlantic surf foam whisper along beach edge (coastDist ~ 63..69 m)
            float coastDist = vWorldPos.x * 0.867 - vWorldPos.z * 0.497;
            float surf = smoothstep(73.0, 65.5, coastDist) * smoothstep(61.5, 65.0, coastDist);
            float foamWave = 0.55 + 0.45 * sin(coastDist * 1.2 - uTime * 1.8 + sin(vWorldPos.z * 0.25) * 2.0);
            col = mix(col, vec3(0.46, 0.5, 0.58), surf * foamWave * 0.42);

            // Smooth atmospheric distance haze into horizon
            float fogAmt = 1.0 - exp(-max(dist - 80.0, 0.0) * 0.00145);
            float sunHazeDot = max(dot(normalize(vWorldPos - cameraPosition), uSunDir), 0.0);
            vec3 hazeCol = mix(uFogColor, uHorizonGlow * 0.76, pow(sunHazeDot, 2.2) * 0.65);
            col = mix(col, hazeCol, clamp(fogAmt, 0.0, 1.0));

            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

/** E2 · Instanced KSC Coastal Wetland Scrub & Marsh Grass Field (1 draw call + breeze sway). */
function MarshScrubField({
  count,
  reducedMotion,
}: {
  count: number;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Build compact 3-crossed-blade marsh grass/scrub tuft geometry
  const tuftGeo = useMemo(() => {
    const pos: number[] = [];
    const norm: number[] = [];
    const uvs: number[] = [];
    const blades = 3;
    for (let b = 0; b < blades; b++) {
      const a = (b * Math.PI) / blades + 0.22;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const nx = -sa;
      const nz = ca;
      const w = 0.34;
      const h = 0.78 + (b % 2) * 0.16;
      const tilt = (b - 1) * 0.08;
      // Two triangles per tuft blade (wider low, tapering up cleanly)
      const x0 = -ca * w;
      const z0 = -sa * w;
      const x1 = ca * w;
      const z1 = sa * w;
      const tx0 = -ca * (w * 0.42) + tilt;
      const tz0 = -sa * (w * 0.42);
      const tx1 = ca * (w * 0.42) + tilt;
      const tz1 = sa * (w * 0.42);

      pos.push(x0, 0, z0, x1, 0, z1, tx1, h, tz1);
      pos.push(x0, 0, z0, tx1, h, tz1, tx0, h, tz0);
      for (let k = 0; k < 6; k++) norm.push(nx, 0.35, nz);
      uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(norm, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.computeVertexNormals();
    return g;
  }, []);

  const scrubMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: "#FFFFFF",
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    m.customProgramCacheKey = () => "marsh-scrub-wind-v1";
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = SCRUB_WIND_UNIFORM;
      shader.vertexShader = `uniform float uWindTime;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         float swayAmt = smoothstep(0.0, 0.9, uv.y);
         #ifdef USE_INSTANCING
           vec3 wp = (instanceMatrix * vec4(position, 1.0)).xyz;
           float gust = sin(uWindTime * 1.65 + wp.x * 0.14 + wp.z * 0.11);
           transformed.x += gust * 0.11 * swayAmt;
           transformed.z += cos(uWindTime * 1.2 + wp.z * 0.18) * 0.07 * swayAmt;
         #endif`,
      );
    };
    return m;
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    const palette = ["#202E1C", "#293822", "#314126", "#3E472D", "#1B2618"];

    let placed = 0;
    let attempt = 0;
    while (placed < count && attempt < count * 8) {
      attempt++;
      // Deterministic Halton-like hash distribution around pad perimeter, dunes, and crawlerway
      const h1 = ((attempt * 2654435761) >>> 0) / 4294967295;
      const h2 = (((attempt + 97) * 2246822519) >>> 0) / 4294967295;
      const h3 = (((attempt + 313) * 3266489917) >>> 0) / 4294967295;

      let x = 0;
      let z = 0;
      if (placed % 4 === 0) {
        // Flanking the Crawlerway toward the distant VAB
        const tCrawl = 18 + h1 * 185;
        const side = placed % 8 === 0 ? 1 : -1;
        const lat = side * (9.5 + h2 * 44);
        x = -0.5 * tCrawl + 0.866 * lat;
        z = -0.866 * tCrawl - 0.5 * lat;
      } else {
        // Organic ring outside pad apron & along dune ridge
        const ang = h1 * Math.PI * 2;
        const rad = 52 + Math.pow(h2, 0.72) * 125;
        x = Math.cos(ang) * rad;
        z = Math.sin(ang) * rad;
      }

      // Skip concrete pad apron, ocean water (coastDist > 58), and Crawlerway roadbed
      const padR = Math.hypot(x, z);
      const coastDist = x * 0.867 - z * 0.497;
      if (padR < 53 || coastDist > 58) continue;

      const dCrawl = Math.abs(x * 0.866 - z * 0.5);
      const alongCrawl = -(x * 0.5 + z * 0.866);
      if (alongCrawl > 0 && dCrawl < 8.5) continue;

      const s = 0.75 + h3 * 1.45;
      dummy.position.set(x, -1.56, z);
      dummy.rotation.set(0, h1 * Math.PI * 2, 0);
      dummy.scale.set(s * (0.9 + h2 * 0.4), s * (0.85 + h1 * 0.55), s * (0.9 + h2 * 0.4));
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);

      col.set(palette[placed % palette.length]);
      mesh.setColorAt(placed, col);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(-40, 0, -60), 230);
  }, [count]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    SCRUB_WIND_UNIFORM.value += Math.min(delta, 0.05);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[tuftGeo, scrubMat, count]}
      receiveShadow={false}
    />
  );
}

/** E3 · 3 Tapered Steel Lattice Lightning Protection Towers (1 InstancedMesh draw call) + Fiberglass Masts + Catenary Wires. */
function LightningProtectionCage({
  beaconRefs,
  useShadows,
}: {
  beaconRefs: React.MutableRefObject<(THREE.Mesh | null)[]>;
  useShadows: boolean;
}) {
  const latticeRef = useRef<THREE.InstancedMesh>(null);
  const unitCyl = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6, 1, false), []);

  // Build exact count of struts for 3 towers × 10 tapered bays
  const baysPerTower = 10;
  const maxStruts = 3 * baysPerTower * 16;

  useEffect(() => {
    const mesh = latticeRef.current;
    if (!mesh) return;
    const mat4 = new THREE.Matrix4();
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vDir = new THREE.Vector3();
    const vMid = new THREE.Vector3();
    const vQuat = new THREE.Quaternion();
    const vScale = new THREE.Vector3();

    let idx = 0;
    const totalSteelH = 14.8;
    const wBot = 0.82;
    const wTop = 0.24;

    for (const [tx, tz] of LIGHTNING_TOWER_COORDS) {
      for (let b = 0; b < baysPerTower; b++) {
        const y0 = (b / baysPerTower) * totalSteelH;
        const y1 = ((b + 1) / baysPerTower) * totalSteelH;
        const h0 = THREE.MathUtils.lerp(wBot, wTop, b / baysPerTower);
        const h1 = THREE.MathUtils.lerp(wBot, wTop, (b + 1) / baysPerTower);

        const c0: [number, number, number][] = [
          [tx - h0, y0, tz - h0],
          [tx + h0, y0, tz - h0],
          [tx + h0, y0, tz + h0],
          [tx - h0, y0, tz + h0],
        ];
        const c1: [number, number, number][] = [
          [tx - h1, y1, tz - h1],
          [tx + h1, y1, tz - h1],
          [tx + h1, y1, tz + h1],
          [tx - h1, y1, tz + h1],
        ];

        for (let k = 0; k < 4; k++) {
          const nk = (k + 1) % 4;
          // Corner leg column
          composeStrutMatrix(c0[k], c1[k], 0.042, mat4, vA, vB, vDir, vMid, vQuat, vScale);
          mesh.setMatrixAt(idx++, mat4);
          // Horizontal top bay bar
          composeStrutMatrix(c1[k], c1[nk], 0.026, mat4, vA, vB, vDir, vMid, vQuat, vScale);
          mesh.setMatrixAt(idx++, mat4);
          // Alternating diagonal X-brace pair on each face
          composeStrutMatrix(c0[k], c1[nk], 0.02, mat4, vA, vB, vDir, vMid, vQuat, vScale);
          mesh.setMatrixAt(idx++, mat4);
          composeStrutMatrix(c0[nk], c1[k], 0.02, mat4, vA, vB, vDir, vMid, vQuat, vScale);
          mesh.setMatrixAt(idx++, mat4);
        }
      }
    }
    mesh.count = idx;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 36);
  }, []);

  // Catenary lightning arrestor wires spanning top-to-top + outer anchor guys (merged into 1 LineSegments draw call)
  const catenaryGeo = useMemo(() => {
    const verts: number[] = [];
    const pushArc = (a: [number, number, number], b: [number, number, number], sag: number, segs = 22) => {
      for (let i = 0; i < segs; i++) {
        const u0 = i / segs;
        const u1 = (i + 1) / segs;
        verts.push(
          THREE.MathUtils.lerp(a[0], b[0], u0),
          THREE.MathUtils.lerp(a[1], b[1], u0) - sag * 4 * u0 * (1 - u0),
          THREE.MathUtils.lerp(a[2], b[2], u0),
          THREE.MathUtils.lerp(a[0], b[0], u1),
          THREE.MathUtils.lerp(a[1], b[1], u1) - sag * 4 * u1 * (1 - u1),
          THREE.MathUtils.lerp(a[2], b[2], u1),
        );
      }
    };

    const tips: [number, number, number][] = LIGHTNING_TOWER_COORDS.map(([x, z]) => [x, 18.85, z]);
    const guys: [number, number, number][] = [
      [-26.5, -0.5, -18.5],
      [26.5, -0.5, -18.5],
      [0, -0.5, 29.0],
    ];
    pushArc(tips[0], tips[1], 1.15);
    pushArc(tips[1], tips[2], 1.25);
    pushArc(tips[2], tips[0], 1.25);
    pushArc(tips[0], guys[0], 0.55, 12);
    pushArc(tips[1], guys[1], 0.55, 12);
    pushArc(tips[2], guys[2], 0.55, 12);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return geo;
  }, []);

  return (
    <group>
      {/* All 3 tapered steel lattice towers rendered in a single instanced draw call */}
      <instancedMesh
        ref={latticeRef}
        args={[unitCyl, undefined, maxStruts]}
        castShadow={useShadows}
      >
        <meshStandardMaterial color="#8B94A4" roughness={0.52} metalness={0.68} />
      </instancedMesh>

      {/* Upper white fiberglass lightning masts, concrete bases & pulsing aviation beacons */}
      {LIGHTNING_TOWER_COORDS.map(([mx, mz], i) => (
        <group key={i} position={[mx, 0, mz]}>
          <mesh position={[0, -0.15, 0]} receiveShadow={useShadows}>
            <boxGeometry args={[2.1, 0.5, 2.1]} />
            <meshStandardMaterial color="#5E6674" roughness={0.86} metalness={0.14} />
          </mesh>
          <mesh position={[0, 17.0, 0]}>
            <cylinderGeometry args={[0.045, 0.14, 4.4, 10]} />
            <meshStandardMaterial color="#DFE5F0" roughness={0.42} metalness={0.28} />
          </mesh>
          <mesh
            ref={(el) => {
              beaconRefs.current[i] = el;
            }}
            position={[0, 19.3, 0]}
          >
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshBasicMaterial
              color={[2.6, 0.55, 0.28]}
              toneMapped={false}
              transparent
              opacity={0.95}
            />
          </mesh>
        </group>
      ))}

      {/* Overhead Catenary Lightning Protection Arrestor Cage (single LineSegments draw call) */}
      <lineSegments geometry={catenaryGeo}>
        <lineBasicMaterial color="#3A4354" transparent opacity={0.72} />
      </lineSegments>
    </group>
  );
}

/** E3 · Real Cylindrical LC-39B Sound Suppression Water Tower on Braced Steel Legs (NO chrome sphere). */
function SoundSuppressionWaterTower({ useShadows }: { useShadows: boolean }) {
  const legRadiusBot = 1.48;
  const legRadiusTop = 1.12;
  const legH = 7.3;

  return (
    <group position={[9.5, -0.15, -7.5]}>
      {/* Concrete foundation pier ring */}
      <mesh position={[0, 0.12, 0]} receiveShadow={useShadows}>
        <cylinderGeometry args={[1.82, 1.95, 0.36, 18]} />
        <meshStandardMaterial color="#68707E" roughness={0.88} metalness={0.1} />
      </mesh>

      {/* Main vertical deluge standpipe / riser column */}
      <mesh position={[0, 3.85, 0]} castShadow={useShadows}>
        <cylinderGeometry args={[0.4, 0.46, 7.6, 16]} />
        <meshStandardMaterial color="#BCC4D2" roughness={0.56} metalness={0.34} />
      </mesh>

      {/* 6 Splayed steel support legs + mid/upper perimeter tie-brace rings */}
      {[0, 1, 2, 3, 4, 5].map((li) => {
        const a = (li * Math.PI) / 3;
        const midR = (legRadiusBot + legRadiusTop) * 0.5;
        return (
          <mesh
            key={li}
            position={[Math.cos(a) * midR, legH * 0.5, Math.sin(a) * midR]}
            rotation={[-Math.sin(a) * 0.05, 0, Math.cos(a) * 0.05]}
            castShadow={useShadows}
          >
            <cylinderGeometry args={[0.085, 0.105, legH, 8]} />
            <meshStandardMaterial color="#9BA5B8" roughness={0.54} metalness={0.54} />
          </mesh>
        );
      })}
      {[2.4, 4.9, 7.15].map((ry, ri) => {
        const ringR = THREE.MathUtils.lerp(legRadiusBot, legRadiusTop, ry / legH);
        return (
          <mesh key={ri} position={[0, ry, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ringR, 0.045, 6, 18]} />
            <meshStandardMaterial color="#8892A6" roughness={0.54} metalness={0.56} />
          </mesh>
        );
      })}

      {/* Elevated Tall Cylindrical Water Tank (matte painted steel white-grey with domed heads) */}
      <mesh position={[0, 8.85, 0]} castShadow={useShadows} receiveShadow={useShadows}>
        <cylinderGeometry args={[1.24, 1.24, 2.9, 28]} />
        <meshStandardMaterial color="#D6DCE6" roughness={0.56} metalness={0.22} />
      </mesh>
      {/* Tank bottom elliptical basin & top dome roof */}
      <mesh position={[0, 7.4, 0]} scale={[1, 0.52, 1]} castShadow={useShadows}>
        <sphereGeometry args={[1.24, 24, 14]} />
        <meshStandardMaterial color="#C8D0DC" roughness={0.58} metalness={0.24} />
      </mesh>
      <mesh position={[0, 10.3, 0]} scale={[1, 0.45, 1]} castShadow={useShadows}>
        <sphereGeometry args={[1.24, 24, 14]} />
        <meshStandardMaterial color="#DCE2EC" roughness={0.54} metalness={0.22} />
      </mesh>

      {/* Painted aviation warning stripe around upper tank + catwalk balcony gallery & rail */}
      <mesh position={[0, 9.7, 0]}>
        <cylinderGeometry args={[1.252, 1.252, 0.24, 28, 1, true]} />
        <meshStandardMaterial color="#C8603A" roughness={0.62} metalness={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 7.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.38, 0.045, 8, 24]} />
        <meshStandardMaterial color="#8E98AC" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 7.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.38, 0.018, 6, 24]} />
        <meshStandardMaterial color="#8E98AC" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Top roof ventilator hatch & red warning beacon */}
      <mesh position={[0, 10.92, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.22, 12]} />
        <meshStandardMaterial color="#A8B2C4" roughness={0.48} metalness={0.5} />
      </mesh>
      <mesh position={[0, 11.12, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={[2.4, 0.5, 0.24]} toneMapped={false} />
      </mesh>

      {/* Heavy deluge supply header pipe leading straight toward the MLP base */}
      <mesh position={[-4.6, 0.36, 3.65]} rotation={[0, 0.65, Math.PI / 2]} castShadow={useShadows}>
        <cylinderGeometry args={[0.2, 0.2, 10.6, 12]} />
        <meshStandardMaterial color="#6F7A90" roughness={0.48} metalness={0.62} />
      </mesh>
    </group>
  );
}

export function LaunchComplex({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const budget = usePerfBudget();
  const useShadows = budget.tier !== "low";
  const groupRef = useRef<THREE.Group>(null);
  const towerLightRef = useRef<THREE.PointLight>(null);
  const floodSpot1Ref = useRef<THREE.SpotLight>(null);
  const floodSpot2Ref = useRef<THREE.SpotLight>(null);
  const crewArmRef = useRef<THREE.Group>(null);
  const osmArmRef = useRef<THREE.Group>(null);
  const icpsArmRef = useRef<THREE.Group>(null);
  const intertankArmRef = useRef<THREE.Group>(null);
  const beaconRefs = useRef<(THREE.Mesh | null)[]>([]);
  const elapsedRef = useRef(0);

  const vabTex = useMemo(() => getVabFacadeTextures(), []);
  const steelTex = useMemo(() => getSteelLatticeTextures(), []);
  const padTex = useMemo(() => getPadConcreteTextures(), []);
  const gravelTex = useMemo(() => getCrawlerwayGravelTextures(), []);
  const lensGlowTex = useMemo(() => getLensGlowTexture(), []);

  // Procedural steel deck plate bump texture
  const deckBump = useMemo(() => {
    const S = 256;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = "#484848";
    ctx.lineWidth = 2;
    for (let i = 0; i < S; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, S);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(S, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }, []);

  useFrame((_, delta) => {
    const p = scrollState.current;
    const padVisible = p < 3.6;
    if (groupRef.current) {
      groupRef.current.visible = padVisible; // Opus: hide pad + VAB once climbing (ascent-2 sits on the cloud deck)
    }
    // Keep launchpad point/spot lights mounted & visible permanently; attenuate intensity only so scene light count never mutates
    const lightFade = padVisible ? 1 - smoothstep(2.9, 3.58, p) : 0;
    if (towerLightRef.current) towerLightRef.current.intensity = 22 * lightFade;
    if (floodSpot1Ref.current) floodSpot1Ref.current.intensity = 240 * lightFade;
    if (floodSpot2Ref.current) floodSpot2Ref.current.intensity = 185 * lightFade;

    if (!padVisible) return;
    elapsedRef.current += Math.min(delta, 0.05);

    // Swing arms retract smoothly before T-0 (progress 1.4 -> 1.92)
    const retract = smoothstep(1.4, 1.92, p);
    if (crewArmRef.current) crewArmRef.current.rotation.y = retract * 1.18;
    if (osmArmRef.current) osmArmRef.current.rotation.y = retract * 0.95;
    if (icpsArmRef.current) icpsArmRef.current.rotation.y = retract * 1.05;
    if (intertankArmRef.current) intertankArmRef.current.rotation.y = retract * 0.88;

    // Subtle staggered aviation beacon pulse on lightning towers
    beaconRefs.current.forEach((b, idx) => {
      if (b) {
        const mat = b.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.48 + 0.52 * Math.sin(elapsedRef.current * 3.1 + idx * 0.9);
      }
    });
  });

  const scrubCount = budget.tier === "high" ? 480 : budget.tier === "medium" ? 260 : 110;

  return (
    <group>
      {/* Always-mounted pad lights (moved outside pad mesh visibility group so shader light-count defines never recompile) */}
      <pointLight
        ref={towerLightRef}
        position={[WORLD_ANCHORS.pad[0] - 3.25, WORLD_ANCHORS.pad[1] + 7.58, WORLD_ANCHORS.pad[2] + 0.15]}
        color="#FFB04D"
        intensity={22}
        distance={15}
        decay={2}
      />
      <spotLight
        ref={floodSpot1Ref}
        position={[WORLD_ANCHORS.pad[0] + 12.5, WORLD_ANCHORS.pad[1] + 6.4, WORLD_ANCHORS.pad[2] + 11.2]}
        angle={0.68}
        penumbra={0.94}
        intensity={240}
        distance={72}
        color="#DCE6FF"
      />
      <spotLight
        ref={floodSpot2Ref}
        position={[WORLD_ANCHORS.pad[0] - 12.8, WORLD_ANCHORS.pad[1] + 6.4, WORLD_ANCHORS.pad[2] + 11.6]}
        angle={0.68}
        penumbra={0.94}
        intensity={185}
        distance={72}
        color="#FFE2BE"
      />

      <group
        ref={groupRef}
        name="warmup-launch-complex"
        userData={{ warmup: true, anchorPos: [0, 4, 0], camPos: [-12, 6, 22], beatIndex: 0 }}
      >
      {/* ─── LC-39B PAD APRON, ATLANTIC COASTLINE, DUNE BERM, WETLANDS & CRAWLERWAY ─── */}
      <group position={WORLD_ANCHORS.pad}>
        {/* E2 · Animated Atlantic Ocean water shader with dusk glint */}
        <AtlanticOceanSurface reducedMotion={reducedMotion} />

        {/* E2 · Beach & coastal sand dune berm along the Florida shoreline (coastDist ≈ 60 m) */}
        <mesh position={[56, -1.35, -32]} rotation={[0, 0.52, 0]} receiveShadow={useShadows}>
          <boxGeometry args={[18, 1.05, 2400]} />
          <meshStandardMaterial color="#675D4B" roughness={0.94} metalness={0.02} />
        </mesh>

        {/* E2 · Florida Space Coast mainland wetland soil inland of beach dunes */}
        <mesh position={[-420, -1.56, -240]} rotation={[-Math.PI / 2, 0, 0.52]} receiveShadow={useShadows}>
          <planeGeometry args={[960, 2400]} />
          <meshStandardMaterial color="#182218" roughness={0.96} metalness={0.02} />
        </mesh>

        {/* Calm tidal Indian River / Banana Creek coastal lagoon strips catching dusk glow */}
        <mesh position={[-128, -1.52, -210]} rotation={[-Math.PI / 2, 0, 0.42]}>
          <planeGeometry args={[48, 220]} />
          <meshStandardMaterial color="#182538" roughness={0.22} metalness={0.45} />
        </mesh>

        {/* E2 · Instanced wind-swaying KSC wetland marsh grass & palmetto scrub */}
        <MarshScrubField count={scrubCount} reducedMotion={reducedMotion} />

        {/* E3 · Beveled concrete LC-39B octagonal pad perimeter embankment & blast apron */}
        <mesh position={[0, -0.98, 0]} receiveShadow={useShadows}>
          <cylinderGeometry args={[51, 58, 1.38, 12]} />
          <meshStandardMaterial
            map={padTex.map}
            bumpMap={padTex.bumpMap}
            bumpScale={0.05}
            color="#969DAA"
            roughness={0.88}
            metalness={0.1}
          />
        </mesh>
        {/* Inner scorched apron concrete pad around the Mobile Launcher */}
        <mesh position={[0, -0.24, 0]} receiveShadow={useShadows}>
          <cylinderGeometry args={[22, 23, 0.16, 16]} />
          <meshStandardMaterial
            map={padTex.map}
            bumpMap={padTex.bumpMap}
            bumpScale={0.04}
            color="#7E8593"
            roughness={0.84}
            metalness={0.12}
          />
        </mesh>

        {/* E4 · Extended crushed river-rock Crawlerway leading 620 m inland toward distant VAB */}
        <mesh position={[-148, -0.96, -256]} rotation={[0, 0.52, 0]} receiveShadow={useShadows}>
          <boxGeometry args={[9.2, 1.2, 575]} />
          <meshStandardMaterial color="#25282C" roughness={0.95} metalness={0.04} />
        </mesh>
        {[-2.4, 2.4].map((tx) => (
          <mesh
            key={tx}
            position={[tx * 0.87 - 148, -0.32, -tx * 0.5 - 256]}
            rotation={[0, 0.52, 0]}
            receiveShadow={useShadows}
          >
            <boxGeometry args={[2.6, 0.08, 575]} />
            <meshStandardMaterial
              map={gravelTex.map}
              bumpMap={gravelTex.bumpMap}
              bumpScale={0.055}
              roughness={0.94}
              metalness={0.05}
            />
          </mesh>
        ))}

        {/* Concrete Flame Trench Walls & Angled Flame Deflector Wedge */}
        <mesh position={[-3.8, -0.1, 0]} castShadow={useShadows} receiveShadow={useShadows}>
          <boxGeometry args={[2.2, 0.9, 16]} />
          <meshStandardMaterial
            map={padTex.map}
            bumpMap={padTex.bumpMap}
            bumpScale={0.03}
            color="#959DAC"
            roughness={0.84}
            metalness={0.18}
          />
        </mesh>
        <mesh position={[3.8, -0.1, 0]} castShadow={useShadows} receiveShadow={useShadows}>
          <boxGeometry args={[2.2, 0.9, 16]} />
          <meshStandardMaterial
            map={padTex.map}
            bumpMap={padTex.bumpMap}
            bumpScale={0.03}
            color="#959DAC"
            roughness={0.84}
            metalness={0.18}
          />
        </mesh>
        {/* Angled steel/refractory flame deflector under the rocket nozzles */}
        <mesh position={[0, -0.22, 0]} rotation={[0.45, 0, 0]} receiveShadow={useShadows}>
          <boxGeometry args={[4.8, 0.65, 3.6]} />
          <meshStandardMaterial
            map={steelTex.map}
            bumpMap={steelTex.bumpMap}
            bumpScale={0.02}
            color="#5C6475"
            roughness={0.68}
            metalness={0.45}
          />
        </mesh>

        {/* ─── MOBILE LAUNCHER PLATFORM (MLP) TWO-STORY DECK ─── */}
        <group position={[0, 0.18, 0]}>
          <mesh position={[-0.8, 0, 0]} castShadow={useShadows} receiveShadow={useShadows}>
            <boxGeometry args={[8.6, 0.42, 9.4]} />
            <meshStandardMaterial
              map={steelTex.map}
              bumpMap={deckBump}
              bumpScale={0.03}
              color="#7A869E"
              roughness={0.52}
              metalness={0.62}
            />
          </mesh>
          {[
            [-3.8, -3.6],
            [2.4, -3.6],
            [-3.8, 0],
            [2.4, 0],
            [-3.8, 3.6],
            [2.4, 3.6],
          ].map(([px, pz], pi) => (
            <mesh key={pi} position={[px, -0.42, pz]}>
              <cylinderGeometry args={[0.24, 0.28, 0.65, 12]} />
              <meshStandardMaterial color="#3E485E" roughness={0.48} metalness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[3.4, 0.14, 3.2]} />
            <meshStandardMaterial color="#19202E" roughness={0.65} metalness={0.5} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 1.62, 0.55, 0.55]}>
              <mesh>
                <boxGeometry args={[0.46, 0.88, 0.68]} />
                <meshStandardMaterial color="#D4DBE8" roughness={0.38} metalness={0.45} />
              </mesh>
              <mesh position={[-side * 0.28, 0.12, -0.18]} rotation={[0, 0, side * 0.35]}>
                <cylinderGeometry args={[0.09, 0.12, 0.55, 12]} />
                <meshStandardMaterial color="#7C879E" roughness={0.35} metalness={0.75} />
              </mesh>
            </group>
          ))}
        </group>

        {/* ─── MOBILE LAUNCHER UMBILICAL TOWER (ML-1, x = -3.45) + WARM WORK LIGHTS ─── */}
        <group position={[-3.45, 0.38, 0]}>

          {[
            [-0.92, -0.92],
            [0.92, -0.92],
            [-0.92, 0.92],
            [0.92, 0.92],
          ].map(([cx, cz], i) => (
            <mesh key={i} position={[cx, 6.85, cz]} castShadow={useShadows} receiveShadow={useShadows}>
              <boxGeometry args={[0.16, 13.7, 0.16]} />
              <meshStandardMaterial
                map={steelTex.map}
                bumpMap={steelTex.bumpMap}
                bumpScale={0.02}
                color="#A2AEBF"
                roughness={0.46}
                metalness={0.7}
              />
            </mesh>
          ))}

          <mesh position={[-0.18, 6.8, 0]} castShadow={useShadows} receiveShadow={useShadows}>
            <boxGeometry args={[0.72, 13.5, 0.78]} />
            <meshStandardMaterial
              map={steelTex.map}
              bumpMap={steelTex.bumpMap}
              bumpScale={0.02}
              color="#566278"
              roughness={0.55}
              metalness={0.58}
            />
          </mesh>

          {/* Warm work-light fixture bars inside elevator/stair bays */}
          {WORK_LIGHT_BAYS.map((wy, wi) => (
            <mesh key={wi} position={[0.24, wy, 0.38]}>
              <boxGeometry args={[0.42, 0.08, 0.06]} />
              <meshBasicMaterial color={[2.3, 1.45, 0.52]} toneMapped={false} />
            </mesh>
          ))}

          {TOWER_BAYS.map((by, idx) => (
            <group key={idx} position={[0, by, 0]}>
              <mesh castShadow={useShadows} receiveShadow={useShadows}>
                <boxGeometry args={[1.96, 0.1, 1.96]} />
                <meshStandardMaterial
                  map={steelTex.map}
                  bumpMap={steelTex.bumpMap}
                  bumpScale={0.015}
                  color="#8C97AB"
                  roughness={0.5}
                  metalness={0.65}
                />
              </mesh>
              <mesh position={[0, 0.18, 0]}>
                <boxGeometry args={[2.0, 0.03, 2.0]} />
                <meshStandardMaterial color="#8A95AB" roughness={0.4} metalness={0.7} />
              </mesh>
              {[-0.92, 0.92].map((fz) => (
                <group key={fz} position={[0, 0.65, fz]}>
                  <mesh rotation={[0, 0, 0.62]} castShadow={useShadows}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial
                      map={steelTex.map}
                      bumpMap={steelTex.bumpMap}
                      bumpScale={0.012}
                      color="#9AA5B8"
                      roughness={0.45}
                      metalness={0.68}
                    />
                  </mesh>
                  <mesh rotation={[0, 0, -0.62]} castShadow={useShadows}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial
                      map={steelTex.map}
                      bumpMap={steelTex.bumpMap}
                      bumpScale={0.012}
                      color="#9AA5B8"
                      roughness={0.45}
                      metalness={0.68}
                    />
                  </mesh>
                </group>
              ))}
              {[-0.92, 0.92].map((fx) => (
                <group key={fx} position={[fx, 0.65, 0]}>
                  <mesh rotation={[0.62, 0, 0]} castShadow={useShadows}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial
                      map={steelTex.map}
                      bumpMap={steelTex.bumpMap}
                      bumpScale={0.012}
                      color="#9AA5B8"
                      roughness={0.45}
                      metalness={0.68}
                    />
                  </mesh>
                  <mesh rotation={[-0.62, 0, 0]} castShadow={useShadows}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial
                      map={steelTex.map}
                      bumpMap={steelTex.bumpMap}
                      bumpScale={0.012}
                      color="#9AA5B8"
                      roughness={0.45}
                      metalness={0.68}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          ))}

          <mesh position={[0, 13.75, 0]}>
            <boxGeometry args={[2.25, 0.32, 2.25]} />
            <meshStandardMaterial color="#78839B" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0.95, 14.22, 0]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[2.8, 0.18, 0.32]} />
            <meshStandardMaterial color="#C8603A" roughness={0.45} metalness={0.5} />
          </mesh>
          <mesh position={[-0.3, 14.95, 0]}>
            <cylinderGeometry args={[0.04, 0.11, 2.1, 12]} />
            <meshStandardMaterial color="#EAEFF7" roughness={0.35} metalness={0.3} />
          </mesh>

          <group ref={crewArmRef} position={[0.92, 11.15, 0.15]}>
            <mesh position={[1.08, 0, 0]}>
              <boxGeometry args={[2.15, 0.34, 0.38]} />
              <meshStandardMaterial color="#E2E7F0" roughness={0.38} metalness={0.4} />
            </mesh>
            <mesh position={[2.22, 0.02, -0.08]}>
              <boxGeometry args={[0.42, 0.48, 0.52]} />
              <meshStandardMaterial color="#F2F5FA" roughness={0.32} metalness={0.3} />
            </mesh>
          </group>
          <group ref={osmArmRef} position={[0.92, 10.1, -0.18]}>
            <mesh position={[0.98, 0, 0]}>
              <boxGeometry args={[1.95, 0.18, 0.24]} />
              <meshStandardMaterial color="#8A95AA" roughness={0.42} metalness={0.65} />
            </mesh>
          </group>
          <group ref={icpsArmRef} position={[0.92, 9.15, 0.12]}>
            <mesh position={[0.96, 0, 0]}>
              <boxGeometry args={[1.92, 0.2, 0.26]} />
              <meshStandardMaterial color="#7C879C" roughness={0.45} metalness={0.65} />
            </mesh>
          </group>
          <group ref={intertankArmRef} position={[0.92, 6.1, -0.1]}>
            <mesh position={[0.92, 0, 0]}>
              <boxGeometry args={[1.85, 0.22, 0.28]} />
              <meshStandardMaterial color="#6D788E" roughness={0.48} metalness={0.68} />
            </mesh>
            <mesh position={[0.92, 1.5, 0.15]}>
              <boxGeometry args={[1.82, 0.16, 0.2]} />
              <meshStandardMaterial color="#7E89A0" roughness={0.45} metalness={0.65} />
            </mesh>
          </group>
        </group>

        {/* E3 · Real Cylindrical Sound Suppression Water Tower on Braced Legs */}
        <SoundSuppressionWaterTower useShadows={useShadows} />

        {/* ─── LH2 CRYOGENIC STORAGE SPHERE (x = -13.5, z = 7.5) ─── */}
        <group position={[-13.5, 0, 7.5]}>
          <mesh position={[0, 1.9, 0]} castShadow={useShadows}>
            <sphereGeometry args={[1.65, 24, 20]} />
            <meshStandardMaterial color="#DDE3EF" roughness={0.42} metalness={0.42} />
          </mesh>
          {[0, 1, 2, 3].map((si) => {
            const a = (si * Math.PI) / 2 + Math.PI / 4;
            return (
              <mesh key={si} position={[Math.cos(a) * 1.2, 0.9, Math.sin(a) * 1.2]}>
                <cylinderGeometry args={[0.08, 0.1, 1.9, 8]} />
                <meshStandardMaterial color="#68738A" roughness={0.5} metalness={0.6} />
              </mesh>
            );
          })}
        </group>

        {/* E3 · 3 Tapered Lattice Lightning Protection Towers + Overhead Catenary Wires */}
        <LightningProtectionCage beaconRefs={beaconRefs} useShadows={useShadows} />

        {/* E5 · KSC Stadium Floodlight Towers with Soft Halo Glows & Ground Light Pools (NO hard white cones) */}
        {STADIUM_FLOOD_TOWERS.map((ft, fi) => (
          <group key={fi} position={ft.pos} rotation={[0, ft.yaw, 0]}>
            <mesh position={[0, 3.1, 0]}>
              <cylinderGeometry args={[0.07, 0.14, 6.2, 8]} />
              <meshStandardMaterial color="#58637A" roughness={0.52} metalness={0.65} />
            </mesh>
            <mesh position={[0, 6.25, 0]}>
              <boxGeometry args={[1.15, 0.42, 0.16]} />
              <meshStandardMaterial color="#2C3548" roughness={0.45} metalness={0.7} />
            </mesh>
            <mesh position={[0, 6.25, -0.09]}>
              <planeGeometry args={[1.02, 0.34]} />
              <meshBasicMaterial color={ft.hdr} toneMapped={false} />
            </mesh>
            <sprite position={[0, 6.25, -0.14]} scale={[3.4, 3.4, 1]}>
              <spriteMaterial
                map={lensGlowTex}
                color={ft.color}
                transparent
                opacity={0.28}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
          </group>
        ))}
      </group>

      {/* ─── E4 · DISTANT VAB (~5 KM VISUAL SCALE) ALONG CRAWLERWAY HORIZON + LOW KSC BUILDINGS ─── */}
      <group position={[-335, -1.55, -580]} scale={2.45}>
        <mesh position={[0, 14.5, 0]}>
          <boxGeometry args={[27, 29, 23]} />
          <meshStandardMaterial
            map={vabTex.map}
            bumpMap={vabTex.bumpMap}
            bumpScale={0.035}
            color="#9BA8C4"
            emissive="#1D263C"
            emissiveIntensity={0.28}
            roughness={0.76}
            metalness={0.18}
          />
        </mesh>

        {[-10.2, -3.4, 3.4, 10.2].map((vx) => (
          <mesh key={vx} position={[vx, 14.5, 11.55]}>
            <boxGeometry args={[1.65, 28.9, 0.24]} />
            <meshStandardMaterial color="#1B2230" roughness={0.82} metalness={0.22} />
          </mesh>
        ))}

        <group position={[-6.8, 19.2, 11.58]}>
          <mesh>
            <planeGeometry args={[4.2, 7.8]} />
            <meshStandardMaterial color="#BAC3D1" roughness={0.84} metalness={0.12} />
          </mesh>
          {[-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8].map((sx, si) => (
            <mesh key={si} position={[sx, 0, 0.01]}>
              <planeGeometry args={[0.32, 7.8]} />
              <meshStandardMaterial color="#8A2138" roughness={0.82} metalness={0.12} />
            </mesh>
          ))}
          <mesh position={[-0.95, 1.95, 0.02]}>
            <planeGeometry args={[2.1, 3.8]} />
            <meshStandardMaterial color="#14325B" roughness={0.82} metalness={0.12} />
          </mesh>
        </group>

        {/* Subdued blue circular NASA insignia */}
        <group position={[6.8, 18.2, 11.58]}>
          <mesh>
            <circleGeometry args={[1.08, 24]} />
            <meshStandardMaterial color="#143B7A" roughness={0.8} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0.06, 0.01]} rotation={[0, 0, -0.35]}>
            <planeGeometry args={[1.95, 0.16]} />
            <meshStandardMaterial color="#B53726" roughness={0.8} metalness={0.12} />
          </mesh>
        </group>

        {/* Stepped Low Bay wing */}
        <mesh position={[17.5, 7.2, 3.5]}>
          <boxGeometry args={[14, 14.4, 18]} />
          <meshStandardMaterial
            map={vabTex.map}
            bumpMap={vabTex.bumpMap}
            bumpScale={0.03}
            color="#CFD7E4"
            roughness={0.76}
            metalness={0.18}
          />
        </mesh>
        <mesh position={[17.5, 3.2, 12.55]}>
          <boxGeometry args={[14.1, 6.4, 0.2]} />
          <meshStandardMaterial color="#1E2533" roughness={0.84} metalness={0.2} />
        </mesh>

        {/* Launch Control Center (LCC) & Distant Support Buildings flanking the VAB */}
        <mesh position={[28, 3.4, 18]}>
          <boxGeometry args={[16, 6.8, 11]} />
          <meshStandardMaterial color="#465164" roughness={0.78} metalness={0.22} />
        </mesh>
        <mesh position={[-24, 2.8, 14]}>
          <boxGeometry args={[18, 5.6, 12]} />
          <meshStandardMaterial color="#3A4354" roughness={0.82} metalness={0.18} />
        </mesh>
        <mesh position={[-38, 1.9, 24]}>
          <boxGeometry args={[12, 3.8, 10]} />
          <meshStandardMaterial color="#343D4E" roughness={0.84} metalness={0.16} />
        </mesh>
      </group>

      {/* E4 · Spaced dusk sodium approach lamps receding along the Crawlerway toward VAB */}
      {[1, 2, 3, 4, 5, 6].map((ri) => {
        const t = ri * 46;
        return (
          <group key={ri} position={[-0.5 * t + 7.5, -1.5, -0.866 * t]}>
            <mesh position={[0, 2.1, 0]}>
              <cylinderGeometry args={[0.06, 0.09, 4.2, 6]} />
              <meshStandardMaterial color="#2A3346" roughness={0.55} metalness={0.68} />
            </mesh>
            <mesh position={[0, 4.2, 0]}>
              <sphereGeometry args={[0.16, 8, 8]} />
              <meshBasicMaterial color={[2.1, 1.45, 0.72]} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      </group>
    </group>
  );
}
