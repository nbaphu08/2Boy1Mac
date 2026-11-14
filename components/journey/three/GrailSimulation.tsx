"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState, smoothstep, clamp01 } from "@/lib/scroll/progress";
import { usePerfBudget } from "./perfTier";
import { getKaptonBumpMap } from "./rocketTextures";
import {
  applyWorldTerrainShader,
  type CraterAnchor,
  createNearFieldHorizonGeometry,
  InstancedLandscapeRocks,
} from "./landscapeMaterials";
import { grailSimState, subscribeGrailReplay } from "./simulationBus";

const GRAIL_BEAT = 12;
const SIM_DURATION = 14.0;
const GLOBE_LOCAL_POS: [number, number, number] = [0, 36, -34];
const GLOBE_RADIUS = 5.2;
const SURFACE_Y = 0.22;

const GRAIL_CRATERS: readonly (CraterAnchor & { d: number; rim?: number })[] = [
  { x: -3.2, z: 2.8, r: 0.72, d: 0.14 },
  { x: 4.1, z: 2.6, r: 0.88, d: 0.17 },
  { x: -5.6, z: 2.2, r: 1.45, d: 0.3 },
  { x: 6.4, z: -3.6, r: 1.75, d: 0.34 },
  { x: -8.5, z: -7.5, r: 2.2, d: 0.44 },
  { x: 3.8, z: 4.4, r: 0.95, d: 0.2 },
  { x: -1.4, z: 4.8, r: 0.62, d: 0.12 },
  { x: -4.2, z: -3.2, r: 1.15, d: 0.22 },
  { x: 10.2, z: -13.5, r: 3.4, d: 0.56 },
];

function polarRidgeHill(x: number, z: number, cx: number, cz: number, rx: number, rz: number, h: number): number {
  const dx = (x - cx) / rx;
  const dz = (z - cz) / rz;
  const d2 = dx * dx + dz * dz;
  if (d2 > 5.0) return 0;
  const radial = Math.exp(-d2 * 0.85);
  const shoulder = Math.exp(-d2 * 0.35) * 0.28;
  return h * (radial * 0.82 + shoulder * 0.18);
}

function getPolarSlopeHeight(vx: number, vz: number): number {
  const dist = Math.hypot(vx, vz);
  const farScale = smoothstep(3.5, 26, dist);
  const baseSlope = -vz * (0.15 - 0.025 * farScale);
  // Smooth monumental Goldschmidt north-polar mountain massif (-Z), zero sine wave stripes
  const mainMassif =
    polarRidgeHill(vx, vz, 13.0, -52.0, 26.0, 18.0, 18.2) +
    polarRidgeHill(vx, vz, -22.0, -54.0, 24.0, 16.5, 14.8);
  const gentleRoll = farScale * (Math.sin(vx * 0.11 + vz * 0.09) * 0.16);
  return baseSlope + mainMassif + gentleRoll;
}

const IMPACT_A_LOCAL: [number, number, number] = [
  -0.18,
  getPolarSlopeHeight(-0.18, 0.35),
  0.35,
];
const IMPACT_B_LOCAL: [number, number, number] = [
  1.85,
  getPolarSlopeHeight(1.85, -0.85),
  -0.85,
];

// World anchor of moon-grail from trajectory.ts: [0.5, 370.6, -188.0]
const ANCHOR_WORLD = new THREE.Vector3(0.5, 370.6, -188.0);
const REST_CAM_WORLD = new THREE.Vector3(2.95, 372.6, -181.1);
const REST_LOOK_WORLD = new THREE.Vector3(0.85, 371.5, -188.25);

let cachedFlashTex: THREE.CanvasTexture | null = null;
function getSoftImpactFlashTexture(): THREE.CanvasTexture {
  if (cachedFlashTex) return cachedFlashTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 1, 64, 64, 62);
  g.addColorStop(0, "rgba(255, 250, 232, 1.0)");
  g.addColorStop(0.22, "rgba(255, 212, 148, 0.72)");
  g.addColorStop(0.55, "rgba(235, 130, 62, 0.22)");
  g.addColorStop(1, "rgba(180, 75, 20, 0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedFlashTex = tex;
  return tex;
}

let cachedStarburstEjectaTex: THREE.CanvasTexture | null = null;
function getStarburstEjectaTexture(): THREE.CanvasTexture {
  if (cachedStarburstEjectaTex) return cachedStarburstEjectaTex;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 256);

  // Subtle dark crater bowl interior
  const bowl = ctx.createRadialGradient(128, 128, 6, 128, 128, 56);
  bowl.addColorStop(0, "rgba(22, 20, 18, 0.88)");
  bowl.addColorStop(0.65, "rgba(32, 30, 27, 0.62)");
  bowl.addColorStop(1, "rgba(40, 38, 35, 0.0)");
  ctx.fillStyle = bowl;
  ctx.beginPath();
  ctx.arc(128, 128, 58, 0, Math.PI * 2);
  ctx.fill();

  // Sharp asymmetrical dark basaltic impact ejecta rays along downrange/lateral azimuths
  for (let i = 0; i < 34; i++) {
    const k = i * 47 + 13;
    const angle = ((k * 71) % 360) * (Math.PI / 180);
    const len = 46 + ((k * 37) % 76);
    const width = 0.04 + ((k * 19) % 10) * 0.009;
    const x2 = 128 + Math.cos(angle) * len;
    const y2 = 128 + Math.sin(angle) * len;
    const grad = ctx.createLinearGradient(128, 128, x2, y2);
    grad.addColorStop(0, "rgba(26, 24, 22, 0.78)");
    grad.addColorStop(0.55, "rgba(34, 32, 29, 0.35)");
    grad.addColorStop(1, "rgba(34, 32, 29, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128 + Math.cos(angle - width) * len, 128 + Math.sin(angle - width) * len);
    ctx.lineTo(128 + Math.cos(angle + width) * len, 128 + Math.sin(angle + width) * len);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedStarburstEjectaTex = tex;
  return tex;
}

let cachedGrailSolarTex: THREE.CanvasTexture | null = null;
function getGrailSolarTexture(): THREE.CanvasTexture {
  if (cachedGrailSolarTex) return cachedGrailSolarTex;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#101726";
  ctx.fillRect(0, 0, 256, 256);
  const cols = 8;
  const rows = 16;
  const cw = 256 / cols;
  const ch = 256 / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillStyle = (r + col) % 2 === 0 ? "#162136" : "#121C2E";
      ctx.fillRect(col * cw + 1.5, r * ch + 1.5, cw - 3, ch - 3);
      ctx.strokeStyle = "rgba(195, 210, 232, 0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(col * cw + 1, r * ch + 1, cw - 2, ch - 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedGrailSolarTex = tex;
  return tex;
}

/**
 * Detailed PIA13965 GRAIL spacecraft (Ebb or Flow):
 * - Washing-machine-sized bus (0.95 × 1.09 × 0.76 m) wrapped in crinkled gold Kapton MLI foil
 * - Ka-band Lunar Gravity Ranging System (LGRS) baffle & antenna facing tandem mate
 * - Aluminum top louver deck & 2 deployed dark silicon solar wings
 */
function GrailSpacecraftModel({
  scale = 1,
  kaptonBump,
  solarTex,
}: {
  scale?: number;
  kaptonBump: THREE.CanvasTexture;
  solarTex: THREE.CanvasTexture;
}) {
  return (
    <group scale={scale}>
      {/* Main box bus wrapped in crinkled gold Kapton */}
      <mesh>
        <boxGeometry args={[0.95, 0.76, 1.09]} />
        <meshStandardMaterial
          color="#C98A2C"
          bumpMap={kaptonBump}
          bumpScale={0.025}
          roughness={0.34}
          metalness={0.82}
        />
      </mesh>
      {/* Top thermal louver radiator panel */}
      <mesh position={[0, 0.39, -0.04]}>
        <boxGeometry args={[0.68, 0.03, 0.78]} />
        <meshStandardMaterial color="#D4DCE8" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Front Ka-band LGRS horn & dark optical baffle pointing along +Z */}
      <mesh position={[0, 0.04, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.19, 0.2, 16]} />
        <meshStandardMaterial color="#232A38" roughness={0.38} metalness={0.78} />
      </mesh>
      <mesh position={[0.24, -0.06, 0.56]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.24, 0.08, 0.22]} />
        <meshStandardMaterial color="#181F2B" roughness={0.35} metalness={0.75} />
      </mesh>
      {/* Two symmetric fixed silicon solar wings (PIA13965) */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.12, 0, -0.06]} rotation={[0, side * 0.08, 0]}>
          {/* Structural yoke bracket */}
          <mesh position={[-side * 0.52, 0, 0]}>
            <boxGeometry args={[0.28, 0.14, 0.16]} />
            <meshStandardMaterial color="#B8C2D2" roughness={0.35} metalness={0.8} />
          </mesh>
          {/* Active solar array wing */}
          <mesh>
            <boxGeometry args={[1.18, 0.028, 1.02]} />
            <meshStandardMaterial
              map={solarTex}
              roughness={0.28}
              metalness={0.62}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function polarCraterBowl(
  x: number,
  z: number,
  radius: number,
  depth: number,
  rim: number,
): number {
  const r = Math.hypot(x, z);
  if (r > radius * 1.48) return 0;
  const u = r / radius;
  const softRim = rim * 0.68;
  if (u < 1.0) {
    return -depth * (1 - u * u) + softRim * Math.exp(-Math.pow((u - 0.94) / 0.2, 2));
  }
  return softRim * Math.exp(-Math.pow((u - 0.94) / 0.24, 2));
}

function getPolarFullHeight(vx: number, vz: number): number {
  const baseSlope = getPolarSlopeHeight(vx, vz);
  let craters = 0;
  for (let i = 0; i < GRAIL_CRATERS.length; i++) {
    const c = GRAIL_CRATERS[i];
    craters += polarCraterBowl(vx - c.x, vz - c.z, c.r, c.d, c.d * 0.28);
  }
  // Two crisp ~5 m fresh impact craters on the southern slope (Ebb at A, Flow at B)
  craters += polarCraterBowl(vx - IMPACT_A_LOCAL[0], vz - IMPACT_A_LOCAL[2], 1.22, 0.4, 0.13);
  craters += polarCraterBowl(vx - IMPACT_B_LOCAL[0], vz - IMPACT_B_LOCAL[2], 1.22, 0.4, 0.13);
  return baseSlope + craters;
}

/** Smooth continuous north-polar Goldschmidt mountain slope extending to the horizon (near-field tessellated, zero tracks/boots). */
function createPolarLandscapeGeometry(tier: "high" | "medium" | "low"): THREE.BufferGeometry {
  const segs = tier === "high" ? 192 : tier === "medium" ? 136 : 92;
  return createNearFieldHorizonGeometry(176, segs, getPolarFullHeight);
}

/** Deterministic ballistic vacuum ejecta particle vectors for two hypervelocity impacts. */
function buildBallisticData(countPerImpact: number) {
  const total = countPerImpact * 2;
  const positions = new Float32Array(total * 3);
  const dirs = new Float32Array(total * 3);
  const speeds = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const k = i * 197 + 31;
    const azimuth = ((k * 73) % 360) * (Math.PI / 180);
    // Clean lunar vacuum ejecta curtain cone (~40° to ~68° elevation)
    const elev = (38 + ((k * 29) % 32)) * (Math.PI / 180);
    const vx = Math.cos(elev) * Math.cos(azimuth);
    const vy = Math.sin(elev);
    const vz = Math.cos(elev) * Math.sin(azimuth);

    dirs[i * 3 + 0] = vx;
    dirs[i * 3 + 1] = vy;
    dirs[i * 3 + 2] = vz;
    speeds[i] = 1.6 + ((k * 43) % 100) * 0.022;
  }
  return { positions, dirs, speeds, countPerImpact, total };
}

/**
 * AG-10 Part 1 · GRAIL Ebb & Flow ~14 s Mission Simulation + Horizon Mountain Slope (Pilot for AG-9b).
 * - Automatic trigger when settled on beat 12 (|p - 12| < 0.05 for 0.4 s); scrolling away interrupts cleanly.
 * - Exposes `replayGrailSim()` via `simulationBus.ts` for DOM replay controls.
 * - `reducedMotion`: skips animation and renders the final rest impact state.
 */
export function GrailSimulation({ reducedMotion }: { reducedMotion: boolean }) {
  const budget = usePerfBudget();
  const isLow = budget.tier === "low";
  const gravityUrl =
    budget.tier === "high"
      ? "/media/three/grail/grail_gravity_4k.webp"
      : "/media/three/grail/grail_gravity_2k.webp";

  const [moonTex, moonBump, gravityTex] = useTexture([
    "/media/textures/moon_color_4k.jpg",
    "/media/textures/moon_displacement_2k.png",
    gravityUrl,
  ]);

  const terrainMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#FFFFFF",
      roughness: 0.96,
      metalness: 0.01,
    });
    applyWorldTerrainShader(mat, {
      planet: "moon",
      anchorXZ: [ANCHOR_WORLD.x, ANCHOR_WORLD.z],
      baseTint: "#48423B",
      brightTint: "#8C8579",
      highlandBrightTint: "#C8C1B4",
      fadeStart: 72,
      fadeEnd: 87.5,
      qualityTier: budget.tier,
      moonSunDir: [9.4, 2.85, 4.3],
    });
    return mat;
  }, [budget.tier]);

  const ejectaTex = useMemo(() => getStarburstEjectaTexture(), []);
  const flashTex = useMemo(() => getSoftImpactFlashTexture(), []);
  const kaptonBump = useMemo(() => getKaptonBumpMap(), []);
  const solarTex = useMemo(() => getGrailSolarTexture(), []);
  const terrainGeo = useMemo(() => createPolarLandscapeGeometry(budget.tier), [budget.tier]);

  const ejectaPerImpact = budget.tier === "high" ? 220 : budget.tier === "medium" ? 130 : 48;
  const ballistic = useMemo(() => buildBallisticData(ejectaPerImpact), [ejectaPerImpact]);

  // Swath-painted Moon globe shader uniforms
  const globeUniforms = useMemo(
    () => ({
      uMoonMap: { value: moonTex },
      uGravityMap: { value: gravityTex },
      uBumpMap: { value: moonBump },
      uSweepProgress: { value: 0 },
      uGroundOffset: { value: 0 },
      uGravityMix: { value: 0 },
      uSkipSwath: { value: isLow ? 1 : 0 },
      uSunDir: { value: new THREE.Vector3(-0.72, 0.35, 0.58).normalize() },
    }),
    [moonTex, gravityTex, moonBump, isLow],
  );

  // Refs for animated 3D assemblies
  const globeGroupRef = useRef<THREE.Group>(null);
  const globeMatRef = useRef<THREE.ShaderMaterial>(null);
  const orbiterEbbRef = useRef<THREE.Group>(null);
  const orbiterFlowRef = useRef<THREE.Group>(null);
  const rangingBeamRef = useRef<THREE.Mesh>(null);
  const orbitRingRef = useRef<THREE.Mesh>(null);

  const craterARef = useRef<THREE.Mesh>(null);
  const craterBRef = useRef<THREE.Mesh>(null);
  const flashARef = useRef<THREE.Sprite>(null);
  const flashBRef = useRef<THREE.Sprite>(null);
  const impactLightRef = useRef<THREE.PointLight>(null);
  const ejectaPointsRef = useRef<THREE.Points>(null);
  const restGhostsRef = useRef<THREE.Group>(null);

  // Playback scheduler refs
  const simStateRef = useRef({
    settleTimer: 0,
    hasAutoPlayedThisVisit: false,
    playing: false,
    elapsed: reducedMotion ? SIM_DURATION : 0,
  });

  // Wire replayGrailSim() from simulationBus.ts
  useEffect(() => {
    const startReplay = () => {
      if (reducedMotion) return;
      simStateRef.current.playing = true;
      simStateRef.current.elapsed = 0;
      simStateRef.current.hasAutoPlayedThisVisit = true;
    };
    return subscribeGrailReplay(startReplay);
  }, [reducedMotion]);

  // Reusable math temporaries
  const tmpEbbPos = useMemo(() => new THREE.Vector3(), []);
  const tmpFlowPos = useMemo(() => new THREE.Vector3(), []);
  const tmpMid = useMemo(() => new THREE.Vector3(), []);
  const tmpDir = useMemo(() => new THREE.Vector3(), []);
  const tmpUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpCamWorld = useMemo(() => new THREE.Vector3(), []);
  const tmpLookWorld = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = scrollState.current;
    const distFromBeat = Math.abs(p - GRAIL_BEAT);
    const st = simStateRef.current;

    if (reducedMotion) {
      grailSimState.active = false;
      grailSimState.camBlend = 0;
      grailSimState.phase = "rest";
      if (globeGroupRef.current) globeGroupRef.current.visible = false;
      if (craterARef.current) craterARef.current.visible = true;
      if (craterBRef.current) craterBRef.current.visible = true;
      if (ejectaPointsRef.current) ejectaPointsRef.current.visible = false;
      if (flashARef.current) flashARef.current.visible = false;
      if (flashBRef.current) flashBRef.current.visible = false;
      if (impactLightRef.current) impactLightRef.current.intensity = 0;
      if (restGhostsRef.current) restGhostsRef.current.visible = true;
      return;
    }

    // Handle beat arrival settle & scroll-away interruption
    if (distFromBeat >= 0.12) {
      st.settleTimer = 0;
      st.hasAutoPlayedThisVisit = false;
      if (st.playing) {
        st.playing = false;
        st.elapsed = 0;
      }
      grailSimState.active = false;
      grailSimState.camBlend = 0;
      grailSimState.phase = "idle";
      return;
    }

    if (distFromBeat < 0.08 && !st.playing && !st.hasAutoPlayedThisVisit) {
      st.settleTimer += dt;
      if (st.settleTimer >= 0.12) {
        st.playing = true;
        st.elapsed = 0;
        st.hasAutoPlayedThisVisit = true;
      }
    }

    if (st.playing) {
      st.elapsed += dt;
      if (st.elapsed >= SIM_DURATION) {
        st.playing = false;
        st.elapsed = SIM_DURATION;
      }
    }

    const t = st.playing ? st.elapsed : st.hasAutoPlayedThisVisit ? SIM_DURATION : SIM_DURATION;
    const cratersVisibleYet = !st.playing && !st.hasAutoPlayedThisVisit ? true : t >= 11.2;

    // Update phase
    if (!st.playing) {
      grailSimState.active = false;
      grailSimState.camBlend = 0;
      grailSimState.phase = "rest";
    } else {
      grailSimState.active = true;
      grailSimState.elapsed = t;
      grailSimState.phase =
        t < 6.0 ? "mapping" : t < 11.0 ? "descent" : t < 13.0 ? "impact" : "rest";
    }

    // ─── 1. MAPPING PHASE (0–6 s): Moon globe turning under polar-orbiting Ebb & Flow ───
    const showGlobe = st.playing && t < 7.6;
    if (globeGroupRef.current && globeMatRef.current) {
      globeGroupRef.current.visible = showGlobe;
      if (showGlobe) {
        const orbitIn = smoothstep(0.0, 0.55, t);
        const orbitOut = 1 - smoothstep(6.0, 7.5, t);
        globeGroupRef.current.scale.setScalar(0.88 + 0.12 * orbitIn * orbitOut);

        // Time-compressed lunar rotation under fixed polar orbit plane
        const moonTurn = (t / 5.4) * Math.PI * 2;
        const uniforms = globeMatRef.current.uniforms;
        uniforms.uGravityMap.value = gravityTex;
        uniforms.uSkipSwath.value = isLow ? 1 : 0;
        // Swath advances progressively from 0% to 100% behind the orbiting ground track
        uniforms.uGroundOffset.value = t / 5.4;
        uniforms.uSweepProgress.value = clamp01((t - 0.15) / 5.25);

        const gravIn = smoothstep(0.08, 0.45, t);
        const gravOut = 1 - smoothstep(5.85, 7.1, t);
        uniforms.uGravityMix.value = gravIn * gravOut;
        globeGroupRef.current.rotation.y = moonTurn * 0.12;
      }
    }

    if (orbitRingRef.current) {
      orbitRingRef.current.visible = st.playing && t < 6.4;
      if (orbitRingRef.current.visible) {
        const ringMat = orbitRingRef.current.material as THREE.MeshBasicMaterial;
        ringMat.opacity = 0.24 * (1 - smoothstep(5.7, 6.4, t));
      }
    }

    // ─── 2. SPACECRAFT PAIR (Mapping Orbit -> Grazing Polar Descent) ───
    const showPair = st.playing && t < 12.1;
    if (orbiterEbbRef.current && orbiterFlowRef.current) {
      orbiterEbbRef.current.visible = showPair;
      orbiterFlowRef.current.visible = showPair;

      if (showPair) {
        if (t < 6.2) {
          // Polar orbit (YZ plane) around GLOBE_LOCAL_POS
          const thetaEbb = t * 1.45 + 0.45;
          const thetaFlow = thetaEbb - 0.36;
          const rOrbit = GLOBE_RADIUS + 1.05;

          tmpEbbPos.set(
            GLOBE_LOCAL_POS[0],
            GLOBE_LOCAL_POS[1] + Math.sin(thetaEbb) * rOrbit,
            GLOBE_LOCAL_POS[2] + Math.cos(thetaEbb) * rOrbit,
          );
          tmpFlowPos.set(
            GLOBE_LOCAL_POS[0],
            GLOBE_LOCAL_POS[1] + Math.sin(thetaFlow) * rOrbit,
            GLOBE_LOCAL_POS[2] + Math.cos(thetaFlow) * rOrbit,
          );

          orbiterEbbRef.current.position.copy(tmpEbbPos);
          orbiterFlowRef.current.position.copy(tmpFlowPos);
          // Clearly legible PIA13965 spacecraft silhouette at orbital scale
          orbiterEbbRef.current.scale.setScalar(0.62);
          orbiterFlowRef.current.scale.setScalar(0.62);
          // Point Ka-band horns toward each other along orbital tangent
          orbiterEbbRef.current.lookAt(
            ANCHOR_WORLD.x + tmpFlowPos.x,
            ANCHOR_WORLD.y + tmpFlowPos.y,
            ANCHOR_WORLD.z + tmpFlowPos.z,
          );
          orbiterFlowRef.current.lookAt(
            ANCHOR_WORLD.x + tmpEbbPos.x,
            ANCHOR_WORLD.y + tmpEbbPos.y,
            ANCHOR_WORLD.z + tmpEbbPos.z,
          );
        } else {
          // Grazing low approach down southern mountain slope toward craters A and B
          const ebbU = clamp01((t - 6.2) / 5.0);
          const flowU = clamp01((t - 6.85) / 5.0);

          const startEbbX = -5.2;
          const startEbbY = 4.6;
          const startEbbZ = -18.5;
          const endAY = SURFACE_Y + IMPACT_A_LOCAL[1];

          tmpEbbPos.set(
            THREE.MathUtils.lerp(startEbbX, IMPACT_A_LOCAL[0], ebbU),
            THREE.MathUtils.lerp(startEbbY, endAY, Math.pow(ebbU, 0.86)),
            THREE.MathUtils.lerp(startEbbZ, IMPACT_A_LOCAL[2], ebbU),
          );

          const startFlowX = -3.1;
          const startFlowY = 5.1;
          const startFlowZ = -21.0;
          const endBY = SURFACE_Y + IMPACT_B_LOCAL[1];

          tmpFlowPos.set(
            THREE.MathUtils.lerp(startFlowX, IMPACT_B_LOCAL[0], flowU),
            THREE.MathUtils.lerp(startFlowY, endBY, Math.pow(flowU, 0.86)),
            THREE.MathUtils.lerp(startFlowZ, IMPACT_B_LOCAL[2], flowU),
          );

          orbiterEbbRef.current.visible = t < 11.24;
          orbiterFlowRef.current.visible = t < 11.88;
          orbiterEbbRef.current.position.copy(tmpEbbPos);
          orbiterFlowRef.current.position.copy(tmpFlowPos);
          orbiterEbbRef.current.scale.setScalar(0.38);
          orbiterFlowRef.current.scale.setScalar(0.38);
          orbiterEbbRef.current.lookAt(
            ANCHOR_WORLD.x + IMPACT_A_LOCAL[0],
            ANCHOR_WORLD.y + endAY,
            ANCHOR_WORLD.z + IMPACT_A_LOCAL[2],
          );
          orbiterFlowRef.current.lookAt(
            ANCHOR_WORLD.x + IMPACT_B_LOCAL[0],
            ANCHOR_WORLD.y + endBY,
            ANCHOR_WORLD.z + IMPACT_B_LOCAL[2],
          );
        }
      }
    }

    // Thin pulsing #9DB8FF Ka-band link beam only (no sphere bead)
    if (rangingBeamRef.current) {
      const showLink = showPair && t < 11.15;
      rangingBeamRef.current.visible = showLink;
      if (showLink) {
        tmpMid.copy(tmpEbbPos).add(tmpFlowPos).multiplyScalar(0.5);
        tmpDir.copy(tmpFlowPos).sub(tmpEbbPos);
        const sep = Math.max(0.05, tmpDir.length());
        tmpDir.normalize();
        tmpQuat.setFromUnitVectors(tmpUp, tmpDir);

        rangingBeamRef.current.position.copy(tmpMid);
        rangingBeamRef.current.quaternion.copy(tmpQuat);
        rangingBeamRef.current.scale.set(1, sep, 1);

        const beamMat = rangingBeamRef.current.material as THREE.MeshBasicMaterial;
        beamMat.opacity = 0.58 + 0.36 * Math.sin(t * 16.0);
      }
    }

    // ─── 3. IMPACTS & VACUUM BALLISTIC EJECTA (11–13 s) ───
    const showCraterA = !st.playing || t >= 11.2;
    const showCraterB = !st.playing || t >= 11.85;
    if (craterARef.current) {
      craterARef.current.visible = showCraterA;
      if (showCraterA && st.playing) {
        const s = smoothstep(11.2, 11.45, t);
        (craterARef.current.material as THREE.MeshBasicMaterial).opacity = 0.88 * s;
      } else if (!st.playing) {
        (craterARef.current.material as THREE.MeshBasicMaterial).opacity = cratersVisibleYet ? 0.88 : 0;
      }
    }
    if (craterBRef.current) {
      craterBRef.current.visible = showCraterB;
      if (showCraterB && st.playing) {
        const s = smoothstep(11.85, 12.1, t);
        (craterBRef.current.material as THREE.MeshBasicMaterial).opacity = 0.88 * s;
      } else if (!st.playing) {
        (craterBRef.current.material as THREE.MeshBasicMaterial).opacity = cratersVisibleYet ? 0.88 : 0;
      }
    }

    // Brief soft additive radial impact flashes (fast exponential decay, no solid ball)
    const rawFlashA = st.playing && t >= 11.18 && t <= 11.44 ? 1 - (t - 11.18) / 0.26 : 0;
    const rawFlashB = st.playing && t >= 11.83 && t <= 12.09 ? 1 - (t - 11.83) / 0.26 : 0;
    const flashA = Math.pow(rawFlashA, 2.2);
    const flashB = Math.pow(rawFlashB, 2.2);
    if (flashARef.current) {
      flashARef.current.visible = flashA > 0.01;
      const sc = 0.6 + (1 - rawFlashA) * 1.45;
      flashARef.current.scale.set(sc, sc, 1);
      (flashARef.current.material as THREE.SpriteMaterial).opacity = flashA * 0.92;
    }
    if (flashBRef.current) {
      flashBRef.current.visible = flashB > 0.01;
      const sc = 0.6 + (1 - rawFlashB) * 1.45;
      flashBRef.current.scale.set(sc, sc, 1);
      (flashBRef.current.material as THREE.SpriteMaterial).opacity = flashB * 0.92;
    }
    if (impactLightRef.current) {
      const peak = Math.max(flashA, flashB);
      impactLightRef.current.intensity = peak * 26;
      if (flashB > flashA) {
        impactLightRef.current.position.set(IMPACT_B_LOCAL[0], SURFACE_Y + IMPACT_B_LOCAL[1] + 0.35, IMPACT_B_LOCAL[2]);
      } else {
        impactLightRef.current.position.set(IMPACT_A_LOCAL[0], SURFACE_Y + IMPACT_A_LOCAL[1] + 0.35, IMPACT_A_LOCAL[2]);
      }
    }

    // Ballistic vacuum ejecta arcs (y = v0*t - 0.5*g*t^2, clamped to surface)
    if (ejectaPointsRef.current) {
      const showEjecta = st.playing && t >= 11.18 && t <= 13.45;
      ejectaPointsRef.current.visible = showEjecta;
      if (showEjecta) {
        const posAttr = ejectaPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const gLunar = 2.6;
        for (let i = 0; i < ballistic.total; i++) {
          const isB = i >= ballistic.countPerImpact;
          const t0 = isB ? 11.85 : 11.2;
          const origin = isB ? IMPACT_B_LOCAL : IMPACT_A_LOCAL;
          const tau = Math.max(0, t - t0);
          const speed = ballistic.speeds[i];
          const dx = ballistic.dirs[i * 3 + 0] * speed;
          const dy = ballistic.dirs[i * 3 + 1] * speed;
          const dz = ballistic.dirs[i * 3 + 2] * speed;

          const x = origin[0] + dx * tau;
          const z = origin[2] + dz * tau;
          const groundY = SURFACE_Y + getPolarFullHeight(x, z);
          const startY = SURFACE_Y + origin[1];
          const rawY = startY + dy * tau - 0.5 * gLunar * tau * tau;
          posAttr.setXYZ(i, x, Math.max(groundY, rawY), z);
        }
        posAttr.needsUpdate = true;
        const fadeOut = 1 - smoothstep(12.9, 13.45, t);
        (ejectaPointsRef.current.material as THREE.PointsMaterial).opacity = 0.85 * fadeOut;
      }
    }

    // Rest state faint ghost silhouettes (hidden during live flight, fade in cleanly on rest)
    if (restGhostsRef.current) {
      if (!st.playing) {
        restGhostsRef.current.visible = true;
      } else {
        const ghostIn = smoothstep(12.85, 13.85, t);
        restGhostsRef.current.visible = ghostIn > 0.02;
      }
    }

    // ─── 4. SIMULATION CAMERA CHOREOGRAPHY (blends seamlessly with SpaceScene) ───
    if (st.playing) {
      // Smooth blend in at start (0 -> 0.6s) and smooth blend back to resting framing (12.8 -> 14.0s)
      const blendIn = smoothstep(0.0, 0.65, t);
      const blendOut = 1 - smoothstep(12.75, 13.95, t);
      grailSimState.camBlend = blendIn * blendOut;

      if (t < 6.0) {
        // Orbit camera looking squarely at the GRAIL Moon globe with Ebb & Flow crossing front face
        const u = clamp01(t / 6.0);
        tmpCamWorld.set(
          ANCHOR_WORLD.x + THREE.MathUtils.lerp(5.2, 4.1, u),
          ANCHOR_WORLD.y + GLOBE_LOCAL_POS[1] + THREE.MathUtils.lerp(1.8, 3.1, u),
          ANCHOR_WORLD.z + GLOBE_LOCAL_POS[2] + THREE.MathUtils.lerp(11.6, 10.6, u),
        );
        tmpLookWorld.set(
          ANCHOR_WORLD.x + GLOBE_LOCAL_POS[0],
          ANCHOR_WORLD.y + GLOBE_LOCAL_POS[1],
          ANCHOR_WORLD.z + GLOBE_LOCAL_POS[2],
        );
      } else if (t < 7.6) {
        // Slew smoothly from orbit globe down behind the descending pair over the polar ridge
        const u = smoothstep(6.0, 7.6, t);
        tmpCamWorld.set(
          ANCHOR_WORLD.x + THREE.MathUtils.lerp(4.1, -1.6, u),
          ANCHOR_WORLD.y + THREE.MathUtils.lerp(GLOBE_LOCAL_POS[1] + 3.1, 5.4, u),
          ANCHOR_WORLD.z + THREE.MathUtils.lerp(GLOBE_LOCAL_POS[2] + 10.6, -9.5, u),
        );
        tmpLookWorld.set(
          ANCHOR_WORLD.x + THREE.MathUtils.lerp(GLOBE_LOCAL_POS[0], -2.8, u),
          ANCHOR_WORLD.y + THREE.MathUtils.lerp(GLOBE_LOCAL_POS[1], 3.2, u),
          ANCHOR_WORLD.z + THREE.MathUtils.lerp(GLOBE_LOCAL_POS[2], -11.5, u),
        );
      } else if (t < 11.4) {
        // Low grazing chase camera swooping along the north-polar mountain slope toward impact site
        const u = smoothstep(7.6, 11.4, t);
        tmpCamWorld.set(
          ANCHOR_WORLD.x + THREE.MathUtils.lerp(-1.6, 3.0, u),
          ANCHOR_WORLD.y + THREE.MathUtils.lerp(5.4, 2.35, u),
          ANCHOR_WORLD.z + THREE.MathUtils.lerp(-9.5, 5.6, u),
        );
        tmpLookWorld.set(
          ANCHOR_WORLD.x + THREE.MathUtils.lerp(-2.8, -0.18, u),
          ANCHOR_WORLD.y + THREE.MathUtils.lerp(3.2, 0.5, u),
          ANCHOR_WORLD.z + THREE.MathUtils.lerp(-11.5, 0.1, u),
        );
      } else {
        // Pull into final rest impact site framing
        const u = smoothstep(11.4, 13.9, t);
        tmpCamWorld.set(
          THREE.MathUtils.lerp(ANCHOR_WORLD.x + 3.0, REST_CAM_WORLD.x, u),
          THREE.MathUtils.lerp(ANCHOR_WORLD.y + 2.35, REST_CAM_WORLD.y, u),
          THREE.MathUtils.lerp(ANCHOR_WORLD.z + 5.6, REST_CAM_WORLD.z, u),
        );
        tmpLookWorld.set(
          THREE.MathUtils.lerp(ANCHOR_WORLD.x - 0.18, REST_LOOK_WORLD.x, u),
          THREE.MathUtils.lerp(ANCHOR_WORLD.y + 0.5, REST_LOOK_WORLD.y, u),
          THREE.MathUtils.lerp(ANCHOR_WORLD.z + 0.1, REST_LOOK_WORLD.z, u),
        );
      }

      grailSimState.camPos.copy(tmpCamWorld);
      grailSimState.camLook.copy(tmpLookWorld);
    }
  });

  return (
    <group>
      {/* ─── NORTH-POLAR GOLDSCHMIDT MOUNTAIN SLOPE TO HORIZON (NO PLINTH, ZERO DOT GRID) ─── */}
      <mesh
        name="diorama-terrain"
        geometry={terrainGeo}
        material={terrainMat}
        position={[0, SURFACE_Y, 0]}
        receiveShadow
      />

      {/* Instanced dense deeply-seated soil-toned pebbles + boulders (strictly ZERO tracks/bootprints) */}
      <InstancedLandscapeRocks
        planet="moon"
        anchorXZ={[ANCHOR_WORLD.x, ANCHOR_WORLD.z]}
        count={budget.tier === "high" ? 520 : budget.tier === "medium" ? 280 : 120}
        seed={1219}
        maxRadius={15}
        clearRadius={2.6}
        scaleRange={[0.026, 0.1]}
        scalePower={1.75}
        embedOffset={-0.18}
        moonCraters={GRAIL_CRATERS}
        maxLocalHeight={1.65}
        castShadows={false}
        surfaceY={SURFACE_Y}
        heightFn={getPolarFullHeight}
      />
      <InstancedLandscapeRocks
        planet="moon"
        anchorXZ={[ANCHOR_WORLD.x, ANCHOR_WORLD.z]}
        count={budget.tier === "high" ? 110 : budget.tier === "medium" ? 65 : 30}
        seed={1203}
        maxRadius={25}
        clearRadius={2.8}
        scaleRange={[0.14, 0.42]}
        scalePower={2.35}
        embedOffset={-0.12}
        moonCraters={GRAIL_CRATERS}
        maxLocalHeight={1.8}
        surfaceY={SURFACE_Y}
        heightFn={getPolarFullHeight}
      />

      {/* Impact Crater A (Ebb / GRAIL-A) sharp radial dark basaltic ejecta rays */}
      <mesh
        ref={craterARef}
        name="grail-ejecta-a"
        position={[IMPACT_A_LOCAL[0], SURFACE_Y + IMPACT_A_LOCAL[1] - 0.02, IMPACT_A_LOCAL[2]]}
        rotation={[-Math.PI / 2 + 0.16, 0, 0.25]}
      >
        <planeGeometry args={[2.95, 2.95]} />
        <meshBasicMaterial
          map={ejectaTex}
          transparent
          opacity={0.9}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Impact Crater B (Flow / GRAIL-B) sharp radial dark basaltic ejecta rays */}
      <mesh
        ref={craterBRef}
        name="grail-ejecta-b"
        position={[IMPACT_B_LOCAL[0], SURFACE_Y + IMPACT_B_LOCAL[1] - 0.02, IMPACT_B_LOCAL[2]]}
        rotation={[-Math.PI / 2 + 0.16, 0, -0.35]}
      >
        <planeGeometry args={[2.95, 2.95]} />
        <meshBasicMaterial
          map={ejectaTex}
          transparent
          opacity={0.9}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Brief soft additive hypervelocity impact flash sprites (no opaque ball) */}
      <sprite
        ref={flashARef}
        position={[IMPACT_A_LOCAL[0], SURFACE_Y + IMPACT_A_LOCAL[1] + 0.12, IMPACT_A_LOCAL[2]]}
        visible={false}
      >
        <spriteMaterial
          map={flashTex}
          color={[2.6, 1.85, 1.1]}
          toneMapped={false}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <sprite
        ref={flashBRef}
        position={[IMPACT_B_LOCAL[0], SURFACE_Y + IMPACT_B_LOCAL[1] + 0.12, IMPACT_B_LOCAL[2]]}
        visible={false}
      >
        <spriteMaterial
          map={flashTex}
          color={[2.6, 1.85, 1.1]}
          toneMapped={false}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <pointLight ref={impactLightRef} intensity={0} distance={14} color="#FFD39B" />

      {/* Vacuum Ballistic Ejecta Particles (clean conic trajectories, zero billowing smoke) */}
      <points ref={ejectaPointsRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ballistic.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#C2BEB7"
          size={0.075}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>

      {/* Translucent "Artist's reconstruction" twin Ebb & Flow ghost wireframes above the two impact craters */}
      <group ref={restGhostsRef}>
        {[-1, 1].map((side) => {
          const base = side < 0 ? IMPACT_A_LOCAL : IMPACT_B_LOCAL;
          return (
            <group
              key={side}
              position={[base[0] - 0.32, SURFACE_Y + base[1] + 1.25, base[2] - 0.65]}
              rotation={[0.32, 0.2, -0.08]}
              scale={0.62}
            >
              <mesh name="grail-ghost-bus" castShadow={false} receiveShadow={false}>
                <boxGeometry args={[0.95, 0.76, 1.09]} />
                <meshBasicMaterial
                  color="#9DB8FF"
                  wireframe
                  transparent
                  opacity={0.18}
                  depthWrite={false}
                />
              </mesh>
              <mesh name="grail-ghost-wing-r" position={[1.12, 0, -0.06]} castShadow={false} receiveShadow={false}>
                <boxGeometry args={[1.18, 0.025, 1.02]} />
                <meshBasicMaterial
                  color="#9DB8FF"
                  wireframe
                  transparent
                  opacity={0.15}
                  depthWrite={false}
                />
              </mesh>
              <mesh name="grail-ghost-wing-l" position={[-1.12, 0, -0.06]} castShadow={false} receiveShadow={false}>
                <boxGeometry args={[1.18, 0.025, 1.02]} />
                <meshBasicMaterial
                  color="#9DB8FF"
                  wireframe
                  transparent
                  opacity={0.15}
                  depthWrite={false}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ─── ORBITAL MAPPING STAGE: MOON GLOBE + SWATH SHADER + TWIN PIA13965 CRAFT ─── */}
      <group ref={globeGroupRef} position={GLOBE_LOCAL_POS} visible={false}>
        <mesh rotation={[0, -Math.PI * 0.4, 0]}>
          <sphereGeometry args={[GLOBE_RADIUS, 72, 56]} />
          <shaderMaterial
            ref={globeMatRef}
            uniforms={globeUniforms}
            vertexShader={`
              varying vec2 vUv;
              varying vec3 vNormalWorld;
              void main() {
                vUv = uv;
                vNormalWorld = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform sampler2D uMoonMap;
              uniform sampler2D uGravityMap;
              uniform float uSweepProgress;
              uniform float uGroundOffset;
              uniform float uGravityMix;
              uniform float uSkipSwath;
              uniform vec3 uSunDir;
              varying vec2 vUv;
              varying vec3 vNormalWorld;

              void main() {
                vec3 moonCol = texture2D(uMoonMap, vUv).rgb;
                vec3 gravRaw = texture2D(uGravityMap, vUv).rgb;
                // Keep SVS 4014 reds & blues vivid under ACES tone mapping (avoid pastel washout)
                vec3 gravSat = pow(max(gravRaw, vec3(0.001)), vec3(1.55));

                // Progressive swath mask swept smoothly 0% -> 100% behind polar orbit ground track
                float reveal = 1.0;
                float edgeGlow = 0.0;
                if (uSkipSwath < 0.5) {
                  float progress = clamp(uSweepProgress, 0.0, 1.0);
                  float delta = fract(uGroundOffset - vUv.x);
                  reveal = 1.0 - smoothstep(0.0, 0.03, delta - progress);
                  float trackDist = min(delta, 1.0 - delta);
                  edgeGlow = exp(-trackDist * 68.0) * step(0.02, progress) * (1.0 - smoothstep(0.95, 1.0, progress));
                }

                float mixAmt = uGravityMix * reveal;
                float NdotL = max(0.08, dot(normalize(vNormalWorld), normalize(uSunDir)));
                vec3 litMoon = moonCol * (0.20 + 0.92 * NdotL);
                vec3 litGrav = gravSat * (0.34 + 0.72 * NdotL);

                vec3 col = mix(litMoon, litGrav, mixAmt * 0.9);
                col += vec3(0.55, 0.9, 1.55) * edgeGlow * uGravityMix * 0.55;

                gl_FragColor = vec4(col, 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
              }
            `}
          />
        </mesh>

        {/* Subtle polar orbital track ring around Moon globe (YZ plane) */}
        <mesh ref={orbitRingRef} rotation={[0, Math.PI / 2, 0]} visible={false}>
          <torusGeometry args={[GLOBE_RADIUS + 1.05, 0.018, 8, 96]} />
          <meshBasicMaterial
            color="#9DB8FF"
            transparent
            opacity={0.24}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Active Ebb (GRAIL-A) & Flow (GRAIL-B) Spacecraft Pair */}
      <group ref={orbiterEbbRef} visible={false}>
        <GrailSpacecraftModel kaptonBump={kaptonBump} solarTex={solarTex} />
      </group>
      <group ref={orbiterFlowRef} visible={false}>
        <GrailSpacecraftModel kaptonBump={kaptonBump} solarTex={solarTex} />
      </group>

      {/* Thin pulsing #9DB8FF Ka-band Ranging Link (only the line, zero sphere bead) */}
      <mesh ref={rangingBeamRef} visible={false}>
        <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
        <meshBasicMaterial
          color={[1.15, 1.45, 2.25]}
          toneMapped={false}
          transparent
          opacity={0.78}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
