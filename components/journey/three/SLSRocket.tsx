"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp01, remapClamp, scrollState, smoothstep } from "@/lib/scroll/progress";
import {
  getCoreStageTextures,
  getFairingTextures,
  getKaptonBumpMap,
  getNozzleBellTextures,
  getOrionTextures,
  getSmokePuffTexture,
  getSolarPanelTexture,
  getSparkTexture,
  getSrbTextures,
} from "./rocketTextures";
import { usePerfBudget } from "./perfTier";
import { WORLD_ANCHORS } from "./trajectory";

const SRB_OFFSETS: [-1 | 1, number][] = [
  [-1, -1.06],
  [1, 1.06],
];

const RS25_POS: [number, number][] = [
  [-0.27, -0.27],
  [0.27, -0.27],
  [-0.27, 0.27],
  [0.27, 0.27],
];

const CLAMP_Y = [1.8, 2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.2, 6.8, 7.4];
const SRB_RING_Y = [-2.9, -3.18, -3.45];
const BSM_ANGLES = [0.4, -0.4, Math.PI - 0.4, Math.PI + 0.4];
const FAIRING_ANGLES = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
const SOLAR_WING_ANGLES = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
const MACH_DIAMOND_Offsets = [-0.55, -1.25, -2.05, -2.95];

export function SLSRocket({
  rocketRef,
  reducedMotion,
}: {
  rocketRef: RefObject<THREE.Group | null>;
  reducedMotion: boolean;
}) {
  const coreStageRef = useRef<THREE.Group>(null);
  const leftSrbRef = useRef<THREE.Group>(null);
  const rightSrbRef = useRef<THREE.Group>(null);
  const lasRef = useRef<THREE.Group>(null);
  const fairingRefs = useRef<(THREE.Group | null)[]>([]);
  const solarWingRefs = useRef<(THREE.Group | null)[]>([]);
  const corePlumeRef = useRef<THREE.Group>(null);
  const srbPlumeLeftRef = useRef<THREE.Group>(null);
  const srbPlumeRightRef = useRef<THREE.Group>(null);
  const bsmLeftRef = useRef<THREE.Group>(null);
  const bsmRightRef = useRef<THREE.Group>(null);
  const vacuumPlumeRef = useRef<THREE.Group>(null);
  const rcsJetsRef = useRef<THREE.Group>(null);
  const maxQConeRef = useRef<THREE.Mesh>(null);
  const padSteamRef = useRef<THREE.Points>(null);
  const padSparksRef = useRef<THREE.Points>(null);
  const pyroSparksRef = useRef<THREE.Points>(null);
  const engineLightRef = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);
  const budget = usePerfBudget();
  const steamCount = budget.steamCount;
  const sparkCount = budget.sparkCount;
  const pyroCount = budget.pyroCount;

  const coreTex = useMemo(() => getCoreStageTextures(), []);
  const srbTex = useMemo(() => getSrbTextures(), []);
  const orionTex = useMemo(() => getOrionTextures(), []);
  const fairingTex = useMemo(() => getFairingTextures(), []);
  const nozzleTex = useMemo(() => getNozzleBellTextures(), []);
  const kaptonBump = useMemo(() => getKaptonBumpMap(), []);
  const solarTex = useMemo(() => getSolarPanelTexture(), []);
  const sparkTex = useMemo(() => getSparkTexture(), []);
  const smokeTex = useMemo(() => getSmokePuffTexture(), []);

  // Pre-seed pad acoustic deluge steam particles
  const steamData = useMemo(() => {
    const positions = new Float32Array(steamCount * 3);
    const seeds = new Float32Array(steamCount * 4);
    for (let i = 0; i < steamCount; i++) {
      seeds[i * 4 + 0] = (i / steamCount) * Math.PI * 2 + (i % 7) * 0.17;
      seeds[i * 4 + 1] = 2.8 + (i % 6) * 1.25;
      seeds[i * 4 + 2] = ((i * 19) % 13) / 13;
      seeds[i * 4 + 3] = (i % 17) / 17;
    }
    return { positions, seeds };
  }, [steamCount]);

  // Pre-seed ROFI igniter + exhaust spark particles
  const sparkData = useMemo(() => {
    const positions = new Float32Array(sparkCount * 3);
    const seeds = new Float32Array(sparkCount * 4); // angle, radialSpeed, vy, phase
    for (let i = 0; i < sparkCount; i++) {
      seeds[i * 4 + 0] = ((i * 137.5) % 360) * (Math.PI / 180);
      seeds[i * 4 + 1] = 1.6 + ((i * 29) % 10) * 0.55;
      seeds[i * 4 + 2] = 3.2 + ((i * 43) % 9) * 0.65;
      seeds[i * 4 + 3] = (i % 31) / 31;
    }
    return { positions, seeds };
  }, [sparkCount]);

  // Pre-seed staging pyrotechnic ordnance sparks
  const pyroData = useMemo(() => {
    const positions = new Float32Array(pyroCount * 3);
    const dirs = new Float32Array(pyroCount * 3);
    for (let i = 0; i < pyroCount; i++) {
      const a = (i / pyroCount) * Math.PI * 2;
      const spd = 1.2 + (i % 5) * 0.65;
      dirs[i * 3 + 0] = Math.cos(a) * spd;
      dirs[i * 3 + 1] = (((i * 7) % 11) / 11 - 0.5) * 2.2;
      dirs[i * 3 + 2] = Math.sin(a) * spd;
    }
    return { positions, dirs };
  }, [pyroCount]);

  useFrame((_, delta) => {
    const p = scrollState.current;
    if (!reducedMotion) {
      elapsedRef.current += Math.min(delta, 0.05);
    }
    const t = elapsedRef.current;

    // 1. Pre-ignition ROFI sparks start at p=1.35, full liftoff thrust builds at p=1.78..2.04
    const rofiActive = smoothstep(1.32, 1.65, p) * (1 - smoothstep(3.1, 3.6, p));
    const ignitionBuild = smoothstep(1.75, 2.02, p);
    const coreCutoff = 1 - smoothstep(6.75, 7.12, p);
    const srbBurnFade = 1 - smoothstep(4.52, 5.1, p);

    const flicker = reducedMotion
      ? 1
      : 0.92 + 0.08 * Math.sin(t * 54) + 0.05 * Math.cos(t * 37);
    const coreThrust = ignitionBuild * coreCutoff;
    const srbThrust = ignitionBuild * srbBurnFade;

    if (engineLightRef.current) {
      engineLightRef.current.intensity =
        (rofiActive * 6 + coreThrust * 22 + srbThrust * 30) * flicker;
    }

    // Core RS-25 Plume + Mach Shock Diamonds
    if (corePlumeRef.current) {
      corePlumeRef.current.visible = coreThrust > 0.01;
      const s = Math.max(0.01, coreThrust);
      corePlumeRef.current.scale.set(
        0.88 + 0.12 * flicker,
        s * (1.08 + 0.14 * flicker),
        0.88 + 0.12 * flicker,
      );
    }

    // SRB Plumes
    if (srbPlumeLeftRef.current) {
      srbPlumeLeftRef.current.visible = srbThrust > 0.01;
      const s = Math.max(0.01, srbThrust);
      srbPlumeLeftRef.current.scale.set(0.92 * flicker, s * (1.06 + 0.15 * flicker), 0.92 * flicker);
    }
    if (srbPlumeRightRef.current) {
      srbPlumeRightRef.current.visible = srbThrust > 0.01;
      const s = Math.max(0.01, srbThrust);
      srbPlumeRightRef.current.scale.set(0.92 * flicker, s * (1.06 + 0.15 * flicker), 0.92 * flicker);
    }

    // 2. SRB separation (beat 5: ascent-3, progress 4.52 -> 5.95) + BSM separation motor jets
    const srbSep = remapClamp(p, 4.52, 5.95);
    const bsmFire = smoothstep(4.5, 4.58, p) * (1 - smoothstep(4.85, 5.15, p));
    const srbVisible = p < 6.05;
    SRB_OFFSETS.forEach(([side], idx) => {
      const ref = idx === 0 ? leftSrbRef.current : rightSrbRef.current;
      const bsmRef = idx === 0 ? bsmLeftRef.current : bsmRightRef.current;
      if (!ref) return;
      ref.visible = srbVisible;
      const lateral = side * (1.06 + srbSep * 7.8);
      const drop = -srbSep * srbSep * 18.5;
      const roll = side * srbSep * 0.9;
      ref.position.set(lateral, 3.8 + drop, -srbSep * 2.6);
      ref.rotation.set(srbSep * 0.36, 0, -roll);
      const fadeScale = 1 - smoothstep(5.55, 6.05, p);
      ref.scale.setScalar(Math.max(0.001, fadeScale));

      if (bsmRef) {
        bsmRef.visible = bsmFire > 0.02;
        bsmRef.scale.setScalar(Math.max(0.01, bsmFire * flicker));
      }
    });

    // 3. LAS tower jettison (progress 4.32 -> 5.1)
    if (lasRef.current) {
      const lasSep = remapClamp(p, 4.32, 5.1);
      lasRef.current.visible = p < 5.15;
      lasRef.current.position.set(lasSep * 2.3, 12.1 + lasSep * 14.5, -lasSep * 2.1);
      lasRef.current.rotation.set(lasSep * 0.42, 0, -lasSep * 0.35);
      lasRef.current.scale.setScalar(Math.max(0.001, 1 - smoothstep(4.85, 5.15, p)));
    }

    // 4. Fairing panels jettison (beat 6: ascent-4, progress 5.55 -> 6.35)
    const fairingSep = remapClamp(p, 5.55, 6.35);
    fairingRefs.current.forEach((panel, i) => {
      if (!panel) return;
      panel.visible = p < 6.4;
      const angle = FAIRING_ANGLES[i];
      const radial = fairingSep * 4.4;
      panel.position.set(
        Math.sin(angle) * radial,
        10.6 - fairingSep * 6.6,
        Math.cos(angle) * radial,
      );
      panel.rotation.set(
        Math.cos(angle) * fairingSep * 0.75,
        angle,
        -Math.sin(angle) * fairingSep * 0.75,
      );
      panel.scale.setScalar(Math.max(0.001, 1 - smoothstep(6.0, 6.4, p)));
    });

    // 5. Core stage + ICPS separation (beat 7: deep-space, progress 6.72 -> 7.45)
    if (coreStageRef.current) {
      const coreSep = remapClamp(p, 6.72, 7.45);
      coreStageRef.current.visible = p < 7.5;
      coreStageRef.current.position.set(0, -coreSep * 16.5, -coreSep * 4.2);
      coreStageRef.current.rotation.set(coreSep * 0.3, 0, coreSep * 0.15);
      coreStageRef.current.scale.setScalar(Math.max(0.001, 1 - smoothstep(7.15, 7.5, p)));
    }

    // 6. Orion 4-wing Solar Array deployment (progress 6.82 -> 7.55)
    const wingDeploy = smoothstep(6.82, 7.55, p);
    solarWingRefs.current.forEach((wing) => {
      if (!wing) return;
      wing.visible = p > 5.65;
      wing.rotation.x = THREE.MathUtils.lerp(Math.PI * 0.48, 0.1, wingDeploy);
      wing.scale.setScalar(clamp01((p - 5.65) / 0.25));
    });

    // 7. Orion OMS-E Vacuum Plume + Lunar Orbit Insertion RCS Jets (beats 7..8.4 & 13)
    if (vacuumPlumeRef.current) {
      const tli = smoothstep(6.85, 7.15, p) * (1 - smoothstep(8.15, 8.65, p));
      const marsBurn = smoothstep(12.55, 12.95, p) * (1 - smoothstep(13.6, 14.0, p));
      const vacThrust = Math.max(tli, marsBurn);
      vacuumPlumeRef.current.visible = vacThrust > 0.02;
      vacuumPlumeRef.current.scale.set(
        0.9,
        Math.max(0.01, vacThrust * (1 + 0.08 * flicker)),
        0.9,
      );
    }
    if (rcsJetsRef.current) {
      const lunarInsertion = smoothstep(7.25, 7.55, p) * (1 - smoothstep(8.35, 8.75, p));
      rcsJetsRef.current.visible = lunarInsertion > 0.02;
      rcsJetsRef.current.scale.setScalar(Math.max(0.01, lunarInsertion * flicker));
    }

    // 8. Max-Q vapor shock cone (beat 4: ascent-2, progress 3.45 -> 4.45)
    if (maxQConeRef.current) {
      const maxQ = smoothstep(3.45, 3.88, p) * (1 - smoothstep(4.15, 4.5, p));
      maxQConeRef.current.visible = maxQ > 0.02;
      const mat = maxQConeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = maxQ * 0.28 * flicker;
      maxQConeRef.current.scale.setScalar(0.96 + 0.05 * flicker);
    }

    // 9. Pad Acoustic Deluge Steam Cloud (anchored at LC-39B)
    if (padSteamRef.current) {
      const steamActive = smoothstep(1.72, 1.98, p) * (1 - smoothstep(2.75, 3.35, p));
      padSteamRef.current.visible = steamActive > 0.01;
      if (steamActive > 0.01) {
        const posAttr = padSteamRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const { seeds } = steamData;
        const drift = reducedMotion ? 0 : Math.max(0, p - 1.72) * 1.5;
        for (let i = 0; i < steamCount; i++) {
          const ang = seeds[i * 4 + 0];
          const spd = seeds[i * 4 + 1];
          const hBias = seeds[i * 4 + 2];
          const phase = seeds[i * 4 + 3];
          const cyc = ((reducedMotion ? 0.35 : t * 0.48) + phase + drift) % 1;
          const radius = 1.0 + cyc * spd * 4.2;
          arr[i * 3 + 0] = Math.cos(ang) * radius;
          arr[i * 3 + 1] = 0.25 + cyc * 2.8 + hBias * 1.6;
          arr[i * 3 + 2] = Math.sin(ang) * radius;
        }
        posAttr.needsUpdate = true;
        const pMat = padSteamRef.current.material as THREE.PointsMaterial;
        pMat.opacity = steamActive * 0.46;
      }
    }

    // 10. ROFI Igniter Sparks & Exhaust Sparks ("tia lửa")
    if (padSparksRef.current) {
      padSparksRef.current.visible = rofiActive > 0.01;
      if (rofiActive > 0.01) {
        const posAttr = padSparksRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const { seeds } = sparkData;
        const rocketLiftY = p < 1.85 ? 0 : Math.min(28, (p - 1.85) * 32);
        for (let i = 0; i < sparkCount; i++) {
          const ang = seeds[i * 4 + 0];
          const rSpd = seeds[i * 4 + 1];
          const vSpd = seeds[i * 4 + 2];
          const phase = seeds[i * 4 + 3];
          const life = ((reducedMotion ? 0.25 : t * 1.85) + phase) % 1;

          // Sparks shoot down from the engine nozzles, hit the flame trench, and ricochet outward
          const nozzleX = Math.cos(ang) * 0.75;
          const nozzleZ = Math.sin(ang) * 0.75;
          const rawY = rocketLiftY + 0.15 - life * vSpd * 2.4;
          const bounce = rawY < 0.1 ? Math.abs(rawY) * 0.45 : 0;
          const outR = life * rSpd * (rawY < 0.1 ? 3.2 : 1.3);

          arr[i * 3 + 0] = nozzleX + Math.cos(ang) * outR;
          arr[i * 3 + 1] = Math.max(0.08, rawY) + bounce;
          arr[i * 3 + 2] = nozzleZ + Math.sin(ang) * outR;
        }
        posAttr.needsUpdate = true;
        const sMat = padSparksRef.current.material as THREE.PointsMaterial;
        sMat.opacity = Math.min(1, rofiActive * 1.15);
      }
    }

    // 11. Staging Pyrotechnic Sparks (SRB sep at 4.55, Fairing sep at 5.58, Core sep at 6.75)
    if (pyroSparksRef.current) {
      const srbBurst = 1 - clamp01(Math.abs(p - 4.62) / 0.22);
      const fairBurst = 1 - clamp01(Math.abs(p - 5.65) / 0.22);
      const coreBurst = 1 - clamp01(Math.abs(p - 6.8) / 0.22);
      const burst = Math.max(srbBurst, fairBurst, coreBurst);

      pyroSparksRef.current.visible = burst > 0.02;
      if (burst > 0.02) {
        const yOrigin = coreBurst > 0.1 ? 9.8 : fairBurst > 0.1 ? 10.6 : 6.2;
        const expand = (1 - burst * 0.5) * 2.8 + (reducedMotion ? 0 : (t * 3.2) % 1.4);
        const posAttr = pyroSparksRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const { dirs } = pyroData;
        for (let i = 0; i < pyroCount; i++) {
          arr[i * 3 + 0] = dirs[i * 3 + 0] * expand;
          arr[i * 3 + 1] = yOrigin + dirs[i * 3 + 1] * expand;
          arr[i * 3 + 2] = dirs[i * 3 + 2] * expand;
        }
        posAttr.needsUpdate = true;
        const m = pyroSparksRef.current.material as THREE.PointsMaterial;
        m.opacity = burst * 0.95;
      }
    }
  });

  return (
    <>
      {/* ─── PAD ACOUSTIC DELUGE STEAM CLOUD ─── */}
      <points ref={padSteamRef} position={WORLD_ANCHORS.pad} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[steamData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={smokeTex}
          size={4.8}
          transparent
          opacity={0.45}
          depthWrite={false}
          color="#DCE6FF"
          blending={THREE.NormalBlending}
        />
      </points>

      {/* ─── ROFI IGNITER & EXHAUST SPARKS ("TIA LỬA") ─── */}
      <points ref={padSparksRef} position={WORLD_ANCHORS.pad} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={sparkTex}
          size={0.55}
          transparent
          opacity={0.95}
          depthWrite={false}
          color="#FFB464"
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* ─── MAIN SLS BLOCK 1 + ORION SPACECRAFT ASSEMBLY ─── */}
      <group ref={rocketRef}>
        <pointLight
          ref={engineLightRef}
          position={[0, -0.8, 1.0]}
          color="#FF8E52"
          intensity={0}
          distance={52}
          decay={1.7}
        />

        {/* Pyrotechnic Staging Ordnance Sparks */}
        <points ref={pyroSparksRef} visible={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pyroData.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={sparkTex}
            size={0.42}
            transparent
            opacity={0.9}
            depthWrite={false}
            color="#FFD28A"
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* ═══════════════════ CORE STAGE + ICPS ═══════════════════ */}
        <group ref={coreStageRef}>
          {/* Aft Engine Compartment with thermal protection ribs */}
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.642, 0.68, 1.32, 36]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.015}
              color="#DCE2EC"
              roughness={0.38}
              metalness={0.48}
            />
          </mesh>
          {/* Aft boat-tail heat shield baseplate */}
          <mesh position={[0, 0.21, 0]}>
            <cylinderGeometry args={[0.66, 0.62, 0.12, 32]} />
            <meshStandardMaterial color="#1A202C" roughness={0.6} metalness={0.5} />
          </mesh>

          {/* 4 RS-25 Liquid Hydrogen / Liquid Oxygen Main Engines */}
          {RS25_POS.map(([ex, ez], idx) => (
            <group key={idx} position={[ex, 0.08, ez]}>
              {/* Gimbal actuator collar */}
              <mesh position={[0, 0.16, 0]}>
                <cylinderGeometry args={[0.09, 0.13, 0.14, 16]} />
                <meshStandardMaterial color="#586278" roughness={0.3} metalness={0.85} />
              </mesh>
              {/* Contoured Regeneratively-Cooled Nozzle Bell */}
              <mesh position={[0, -0.08, 0]}>
                <cylinderGeometry args={[0.11, 0.22, 0.46, 24, 1, true]} />
                <meshStandardMaterial
                  map={nozzleTex.map}
                  bumpMap={nozzleTex.bumpMap}
                  bumpScale={0.025}
                  roughness={0.28}
                  metalness={0.88}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Nozzle structural stiffener exit lip */}
              <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.218, 0.014, 10, 24]} />
                <meshStandardMaterial color="#8E98AD" roughness={0.25} metalness={0.9} />
              </mesh>
              {/* Glowing inner combustion throat */}
              <mesh position={[0, -0.12, 0]}>
                <cylinderGeometry args={[0.09, 0.18, 0.28, 16]} />
                <meshBasicMaterial color="#DCE6FF" transparent opacity={0.65} />
              </mesh>
            </group>
          ))}

          {/* Main SOFI Cryogenic Core Tank (LOX + Intertank + LH2) */}
          <mesh position={[0, 4.72, 0]}>
            <cylinderGeometry args={[0.64, 0.64, 6.45, 48]} />
            <meshStandardMaterial
              map={coreTex.map}
              bumpMap={coreTex.bumpMap}
              bumpScale={0.032}
              roughness={0.68}
              metalness={0.12}
            />
          </mesh>

          {/* Raised Intertank Corrugated Thrust Flanges & Avionics Umbilical Plate */}
          <mesh position={[0, 5.65, 0]}>
            <cylinderGeometry args={[0.658, 0.658, 0.12, 48]} />
            <meshStandardMaterial color="#963D16" roughness={0.6} metalness={0.22} />
          </mesh>
          <mesh position={[0, 6.38, 0]}>
            <cylinderGeometry args={[0.658, 0.658, 0.12, 48]} />
            <meshStandardMaterial color="#963D16" roughness={0.6} metalness={0.22} />
          </mesh>
          {/* Intertank crossbeam thrust structure */}
          <mesh position={[0, 6.02, 0]}>
            <boxGeometry args={[1.38, 0.26, 0.24]} />
            <meshStandardMaterial color="#7C3110" roughness={0.55} metalness={0.35} />
          </mesh>

          {/* 2 External LO2 Feedlines & System Tunnels + 10 Bracket Clamps */}
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.635, 3.85, 0.18]}>
                <cylinderGeometry args={[0.042, 0.042, 5.3, 12]} />
                <meshStandardMaterial color="#C86330" roughness={0.55} metalness={0.3} />
              </mesh>
              <mesh position={[side * 0.61, 4.4, -0.22]}>
                <boxGeometry args={[0.06, 6.0, 0.09]} />
                <meshStandardMaterial color="#A84A1E" roughness={0.6} metalness={0.25} />
              </mesh>
              {CLAMP_Y.map((cy, ci) => (
                <mesh key={ci} position={[side * 0.635, cy, 0.18]}>
                  <cylinderGeometry args={[0.056, 0.056, 0.05, 12]} />
                  <meshStandardMaterial color="#D6DCE8" roughness={0.35} metalness={0.75} />
                </mesh>
              ))}
            </group>
          ))}

          {/* Forward Core Stage Skirt Ring */}
          <mesh position={[0, 7.82, 0]}>
            <cylinderGeometry args={[0.65, 0.65, 0.26, 36]} />
            <meshStandardMaterial color="#181D29" roughness={0.42} metalness={0.55} />
          </mesh>

          {/* Launch Vehicle Stage Adapter (LVSA) Frustum */}
          <mesh position={[0, 8.48, 0]}>
            <cylinderGeometry args={[0.48, 0.642, 1.1, 36]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.018}
              roughness={0.38}
              metalness={0.35}
            />
          </mesh>

          {/* Interim Cryogenic Propulsion Stage (ICPS) */}
          <mesh position={[0, 9.36, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.72, 36]} />
            <meshStandardMaterial color="#1D2434" roughness={0.35} metalness={0.62} />
          </mesh>
          <mesh position={[0, 9.88, 0]}>
            <cylinderGeometry args={[0.505, 0.48, 0.34, 36]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.015}
              roughness={0.36}
              metalness={0.45}
            />
          </mesh>

          {/* Core RS-25 Supersonic Exhaust Plume + Pulsing Mach Shock Diamonds */}
          <group ref={corePlumeRef} position={[0, -0.15, 0]} visible={false}>
            {/* Outer hydrogen-oxygen plasma envelope */}
            <mesh position={[0, -3.1, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.78, 6.2, 24, 1, true]} />
              <meshBasicMaterial
                color="#FF6A3D"
                transparent
                opacity={0.68}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Inner high-velocity blue-white core */}
            <mesh position={[0, -2.1, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.44, 4.2, 20, 1, true]} />
              <meshBasicMaterial
                color="#DCE6FF"
                transparent
                opacity={0.92}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* 4 Supersonic Mach Shock Diamonds */}
            {MACH_DIAMOND_Offsets.map((dy, di) => (
              <mesh key={di} position={[0, dy, 0]} scale={[1 - di * 0.16, 1.35, 1 - di * 0.16]}>
                <octahedronGeometry args={[0.26, 1]} />
                <meshBasicMaterial
                  color="#FFFFFF"
                  transparent
                  opacity={0.85 - di * 0.15}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* ═══════════════════ TWIN 5-SEGMENT SOLID ROCKET BOOSTERS ═══════════════════ */}
        {SRB_OFFSETS.map(([side, xOff], idx) => (
          <group
            key={side}
            ref={idx === 0 ? leftSrbRef : rightSrbRef}
            position={[xOff, 3.8, 0]}
          >
            {/* Main 5-segment textured steel motor casing */}
            <mesh>
              <cylinderGeometry args={[0.315, 0.315, 7.25, 36]} />
              <meshStandardMaterial
                map={srbTex.map}
                bumpMap={srbTex.bumpMap}
                bumpScale={0.024}
                roughness={0.36}
                metalness={0.32}
              />
            </mesh>

            {/* External System Tunnel cable raceway running vertically down booster */}
            <mesh position={[-side * 0.28, 0, 0.15]}>
              <boxGeometry args={[0.05, 6.9, 0.07]} />
              <meshStandardMaterial color="#D8DEE8" roughness={0.4} metalness={0.45} />
            </mesh>

            {/* 3 Aft External Stiffener Rings */}
            {SRB_RING_Y.map((ry, ri) => (
              <mesh key={ri} position={[0, ry, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.322, 0.016, 10, 32]} />
                <meshStandardMaterial color="#CFD6E4" roughness={0.35} metalness={0.55} />
              </mesh>
            ))}

            {/* Forward Skirt & Ogive Nose Frustum + Aero Tip */}
            <mesh position={[0, 4.02, 0]}>
              <cylinderGeometry args={[0.14, 0.315, 0.82, 32]} />
              <meshStandardMaterial color="#EAEEF6" roughness={0.34} metalness={0.3} />
            </mesh>
            <mesh position={[0, 4.55, 0]}>
              <coneGeometry args={[0.14, 0.32, 24]} />
              <meshStandardMaterial color="#181E2B" roughness={0.35} metalness={0.6} />
            </mesh>

            {/* 4 Forward & 4 Aft Booster Separation Motor (BSM) Fairing Pods */}
            {BSM_ANGLES.map((ba, bi) => (
              <group key={bi} rotation={[0, ba, 0]}>
                <mesh position={[0.22, 3.85, 0]} rotation={[0, 0, -0.35]}>
                  <cylinderGeometry args={[0.025, 0.042, 0.22, 10]} />
                  <meshStandardMaterial color="#B8C2D4" roughness={0.4} metalness={0.6} />
                </mesh>
                <mesh position={[0.32, -3.68, 0]} rotation={[0, 0, 0.35]}>
                  <cylinderGeometry args={[0.03, 0.048, 0.26, 10]} />
                  <meshStandardMaterial color="#B8C2D4" roughness={0.4} metalness={0.6} />
                </mesh>
              </group>
            ))}

            {/* BSM Separation Thruster Flame Jets (fire during ascent-3 separation) */}
            <group ref={idx === 0 ? bsmLeftRef : bsmRightRef} visible={false}>
              <mesh position={[side * 0.55, 3.9, 0]} rotation={[0, 0, -side * 1.2]}>
                <coneGeometry args={[0.16, 0.95, 12]} />
                <meshBasicMaterial
                  color="#FF9E58"
                  transparent
                  opacity={0.9}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              <mesh position={[side * 0.62, -3.65, 0]} rotation={[0, 0, -side * 1.2]}>
                <coneGeometry args={[0.18, 1.05, 12]} />
                <meshBasicMaterial
                  color="#FF9E58"
                  transparent
                  opacity={0.9}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>

            {/* Flared Aft Booster Skirt + Carbon-Phenolic Gimbaled Nozzle */}
            <mesh position={[0, -3.74, 0]}>
              <cylinderGeometry args={[0.315, 0.395, 0.48, 32]} />
              <meshStandardMaterial color="#D4DAE6" roughness={0.4} metalness={0.42} />
            </mesh>
            <mesh position={[0, -4.1, 0]}>
              <cylinderGeometry args={[0.19, 0.29, 0.42, 24, 1, true]} />
              <meshStandardMaterial
                map={nozzleTex.map}
                bumpMap={nozzleTex.bumpMap}
                bumpScale={0.02}
                roughness={0.32}
                metalness={0.82}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Forward Thrust Attachment + Aft Diagonal Sway Struts */}
            <mesh position={[-side * 0.34, 2.25, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.055, 0.44, 12]} />
              <meshStandardMaterial color="#9BA5B8" metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={[-side * 0.34, -2.85, 0.14]} rotation={[0.3, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.46, 10]} />
              <meshStandardMaterial color="#8590A6" metalness={0.8} roughness={0.28} />
            </mesh>
            <mesh position={[-side * 0.34, -2.85, -0.14]} rotation={[-0.3, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.46, 10]} />
              <meshStandardMaterial color="#8590A6" metalness={0.8} roughness={0.28} />
            </mesh>

            {/* Roaring SRB Aluminized Propellant Flame Plume */}
            <group
              ref={idx === 0 ? srbPlumeLeftRef : srbPlumeRightRef}
              position={[0, -4.25, 0]}
              visible={false}
            >
              <mesh position={[0, -3.4, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.64, 6.8, 22, 1, true]} />
                <meshBasicMaterial
                  color="#FF7838"
                  transparent
                  opacity={0.84}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <mesh position={[0, -2.2, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.32, 4.5, 16, 1, true]} />
                <meshBasicMaterial
                  color="#FFF6E0"
                  transparent
                  opacity={0.96}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>
        ))}

        {/* ═══════════════════ ORION CREW & EUROPEAN SERVICE MODULE ═══════════════════ */}
        <group position={[0, 10.65, 0]}>
          {/* European Service Module (ESM) cylindrical bus with radiator panels */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.46, 0.46, 0.92, 32]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.016}
              color="#2A3346"
              roughness={0.32}
              metalness={0.78}
            />
          </mesh>

          {/* Crinkled Gold Kapton MLI Thermal Foil Collar & Aft Deck */}
          <mesh position={[0, -0.43, 0]}>
            <cylinderGeometry args={[0.45, 0.44, 0.16, 32]} />
            <meshStandardMaterial
              color="#D4A24C"
              bumpMap={kaptonBump}
              bumpScale={0.028}
              roughness={0.26}
              metalness={0.92}
            />
          </mesh>

          {/* OMS-E Main Gimbaled Engine Bell + 8 Auxiliary Thrusters */}
          <mesh position={[0, -0.64, 0]}>
            <cylinderGeometry args={[0.12, 0.23, 0.34, 24, 1, true]} />
            <meshStandardMaterial
              map={nozzleTex.map}
              bumpMap={nozzleTex.bumpMap}
              bumpScale={0.02}
              roughness={0.28}
              metalness={0.88}
              side={THREE.DoubleSide}
            />
          </mesh>
          {[0, 1, 2, 3].map((ai) => {
            const a = (ai * Math.PI) / 2 + Math.PI / 4;
            return (
              <mesh
                key={ai}
                position={[Math.cos(a) * 0.32, -0.54, Math.sin(a) * 0.32]}
              >
                <cylinderGeometry args={[0.035, 0.06, 0.14, 12]} />
                <meshStandardMaterial color="#707B90" roughness={0.3} metalness={0.85} />
              </mesh>
            );
          })}

          {/* Translucent Blue-White Vacuum Thruster Plume (TLI & Lunar/Mars Insertion) */}
          <group ref={vacuumPlumeRef} position={[0, -0.8, 0]} visible={false}>
            <mesh position={[0, -1.1, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.44, 2.2, 20, 1, true]} />
              <meshBasicMaterial
                color="#9DB8FF"
                transparent
                opacity={0.75}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.2, 1.2, 16, 1, true]} />
              <meshBasicMaterial
                color="#FFFFFF"
                transparent
                opacity={0.95}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* RCS Attitude Control Nitrogen/Hydrazine Puffs during Lunar Orbit Insertion */}
          <group ref={rcsJetsRef} visible={false}>
            {[-1, 1].map((s) => (
              <mesh
                key={s}
                position={[s * 0.62, 0.55, 0]}
                rotation={[0, 0, -s * (Math.PI / 2)]}
              >
                <coneGeometry args={[0.09, 0.48, 12, 1, true]} />
                <meshBasicMaterial
                  color="#DCE6FF"
                  transparent
                  opacity={0.72}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>

          {/* Orion Crew Module Tiled Backshell Cone (57.5° slope) */}
          <mesh position={[0, 0.78, 0]}>
            <cylinderGeometry args={[0.21, 0.495, 0.68, 36]} />
            <meshStandardMaterial
              map={orionTex.map}
              bumpMap={orionTex.bumpMap}
              bumpScale={0.022}
              roughness={0.3}
              metalness={0.55}
            />
          </mesh>
          {/* Avcoat Heatshield Base Ring */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.498, 0.468, 0.1, 36]} />
            <meshStandardMaterial color="#181D28" roughness={0.55} metalness={0.35} />
          </mesh>
          {/* Forward Docking Mechanism + Optical Navigation Ring */}
          <mesh position={[0, 1.18, 0]}>
            <cylinderGeometry args={[0.165, 0.21, 0.14, 24]} />
            <meshStandardMaterial color="#AEB7C8" roughness={0.26} metalness={0.85} />
          </mesh>
          <mesh position={[0, 1.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.155, 0.015, 10, 24]} />
            <meshStandardMaterial color="#D4A24C" roughness={0.25} metalness={0.9} />
          </mesh>

          {/* 4 Articulated X-Wing Solar Arrays with Photovoltaic Grid Texture */}
          {SOLAR_WING_ANGLES.map((ang, i) => (
            <group key={i} rotation={[0, ang, 0]} position={[0, 0.08, 0]}>
              <group
                ref={(el) => {
                  solarWingRefs.current[i] = el;
                }}
                position={[0, 0, 0.48]}
              >
                {/* Gimbal yoke & deployment scissor truss */}
                <mesh position={[0, 0, 0.18]}>
                  <boxGeometry args={[0.12, 0.05, 0.36]} />
                  <meshStandardMaterial color="#8E98AD" roughness={0.3} metalness={0.85} />
                </mesh>
                {/* Gold structural backbone boom */}
                <mesh position={[0, -0.01, 1.05]}>
                  <boxGeometry args={[0.05, 0.035, 1.95]} />
                  <meshStandardMaterial color="#C89B48" roughness={0.3} metalness={0.88} />
                </mesh>
                {/* High-detail Photovoltaic Cell Wing */}
                <mesh position={[0, 0.012, 1.12]}>
                  <boxGeometry args={[0.48, 0.018, 1.78]} />
                  <meshStandardMaterial
                    map={solarTex}
                    emissive="#0C1F45"
                    emissiveIntensity={0.35}
                    roughness={0.18}
                    metalness={0.82}
                  />
                </mesh>
              </group>
            </group>
          ))}
        </group>

        {/* ═══════════════════ SERVICE MODULE FAIRINGS (Jettison at Ascent-4) ═══════════════════ */}
        {FAIRING_ANGLES.map((ang, i) => (
          <group
            key={i}
            ref={(el) => {
              fairingRefs.current[i] = el;
            }}
            position={[0, 10.6, 0]}
            rotation={[0, ang, 0]}
          >
            <mesh position={[0, 0, 0.49]}>
              <cylinderGeometry args={[0.512, 0.512, 0.98, 16, 1, false, -0.98, 1.96]} />
              <meshStandardMaterial
                map={fairingTex.map}
                bumpMap={fairingTex.bumpMap}
                bumpScale={0.016}
                roughness={0.36}
                metalness={0.32}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* ═══════════════════ LAUNCH ABORT SYSTEM (LAS) TOWER ═══════════════════ */}
        <group ref={lasRef} position={[0, 12.1, 0]}>
          {/* Ogive protective shroud */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.17, 0.495, 1.02, 32]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.014}
              roughness={0.35}
              metalness={0.28}
            />
          </mesh>
          {/* LAS Abort Motor section + 4 Reverse-Flow Abort Nozzles */}
          <mesh position={[0, 1.26, 0]}>
            <cylinderGeometry args={[0.085, 0.165, 1.22, 24]} />
            <meshStandardMaterial color="#EAEFF7" roughness={0.34} metalness={0.3} />
          </mesh>
          {[0, 1, 2, 3].map((li) => {
            const la = (li * Math.PI) / 2 + Math.PI / 4;
            return (
              <mesh
                key={li}
                position={[Math.cos(la) * 0.15, 1.48, Math.sin(la) * 0.15]}
                rotation={[Math.sin(la) * 0.42, 0, -Math.cos(la) * 0.42]}
              >
                <cylinderGeometry args={[0.025, 0.052, 0.22, 12]} />
                <meshStandardMaterial color="#2C3446" roughness={0.3} metalness={0.85} />
              </mesh>
            );
          })}
          {/* Attitude Control Motor (ACM) ring + 8 radial ports + nose cone */}
          <mesh position={[0, 1.92, 0]}>
            <cylinderGeometry args={[0.08, 0.085, 0.16, 20]} />
            <meshStandardMaterial color="#242C3D" roughness={0.35} metalness={0.78} />
          </mesh>
          <mesh position={[0, 2.16, 0]}>
            <coneGeometry args={[0.08, 0.36, 20]} />
            <meshStandardMaterial color="#8B95AA" roughness={0.25} metalness={0.85} />
          </mesh>
        </group>

        {/* ═══════════════════ MAX-Q AERODYNAMIC SHOCK CONE ═══════════════════ */}
        <mesh ref={maxQConeRef} position={[0, 10.8, 0]} visible={false}>
          <coneGeometry args={[3.5, 5.4, 36, 1, true]} />
          <meshBasicMaterial
            color="#DCE6FF"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
}
