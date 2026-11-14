"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState, smoothstep, clamp01 } from "@/lib/scroll/progress";
import { usePerfBudget } from "./perfTier";

const MOON_TOUCHDOWN_ORIGIN: [number, number, number] = [9.8, 334.82, -159.5];
const MARS_TOUCHDOWN_ORIGIN: [number, number, number] = [9.2, 472.82, -363.5];

/** Deterministic radial ballistic vacuum grains for Moon touchdown (no air plumes). */
function buildRadialDustData(count: number, maxSpeed: number) {
  const positions = new Float32Array(count * 3);
  const dirs = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const k = i * 131 + 17;
    const angle = ((k * 73) % 360) * (Math.PI / 180);
    const elev = (6 + ((k * 29) % 24)) * (Math.PI / 180);
    dirs[i * 3 + 0] = Math.cos(elev) * Math.cos(angle);
    dirs[i * 3 + 1] = Math.sin(elev);
    dirs[i * 3 + 2] = Math.cos(elev) * Math.sin(angle);
    speeds[i] = maxSpeed * (0.45 + ((k * 43) % 100) * 0.0085);
  }
  return { positions, dirs, speeds };
}

/** Deterministic glowing plasma streak lines attached to camera view space during Mars entry. */
function buildPlasmaStreakData(count: number) {
  const positions = new Float32Array(count * 6);
  const origins = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const k = i * 97 + 13;
    // Cylinder shell around forward gaze (-Z) so peripheral streaks frame entry heat-shield rush
    const a = ((k * 67) % 360) * (Math.PI / 180);
    const r = 1.15 + ((k * 31) % 100) * 0.022;
    origins[i * 3 + 0] = Math.cos(a) * r;
    origins[i * 3 + 1] = Math.sin(a) * r * 0.72;
    origins[i * 3 + 2] = -3.8 - ((k * 19) % 100) * 0.05;
    phases[i] = ((k * 53) % 100) / 100;
  }
  return { positions, origins, phases };
}

/**
 * AG-11 · Expedition Touchdown & Atmospheric Entry Effects:
 * - 7.48..7.82: Moon radial ballistic vacuum dust at Sea of Tranquility touchdown
 * - 13.12..13.52: Mars entry plasma streaks rushing past view frustum
 * - 13.50..13.86: Mars Chryse Planitia touchdown atmospheric dust wave
 * Completely inactive outside those ranges & disabled when `reducedMotion` is true.
 */
export function ExpeditionEffects({ reducedMotion }: { reducedMotion: boolean }) {
  const camera = useThree((s) => s.camera);
  const budget = usePerfBudget();

  const dustCount = budget.tier === "high" ? 260 : budget.tier === "medium" ? 150 : 65;
  const streakCount = budget.tier === "high" ? 54 : budget.tier === "medium" ? 32 : 16;

  const moonDust = useMemo(() => buildRadialDustData(dustCount, 12.0), [dustCount]);
  const marsDust = useMemo(() => buildRadialDustData(dustCount, 10.5), [dustCount]);
  const streaks = useMemo(() => buildPlasmaStreakData(streakCount), [streakCount]);

  const moonPointsRef = useRef<THREE.Points>(null);
  const marsPointsRef = useRef<THREE.Points>(null);
  const plasmaGroupRef = useRef<THREE.Group>(null);
  const plasmaLinesRef = useRef<THREE.LineSegments>(null);
  const clockRef = useRef(0);

  useFrame((_, delta) => {
    if (reducedMotion) {
      if (moonPointsRef.current) moonPointsRef.current.visible = false;
      if (marsPointsRef.current) marsPointsRef.current.visible = false;
      if (plasmaGroupRef.current) plasmaGroupRef.current.visible = false;
      return;
    }

    const dt = Math.min(delta, 0.05);
    clockRef.current += dt;
    const p = scrollState.current;

    // 1. Lunar touchdown ballistic radial vacuum grains (p: 7.48 -> 7.82)
    if (moonPointsRef.current) {
      const active = p >= 7.46 && p <= 7.86;
      moonPointsRef.current.visible = active;
      if (active) {
        const tau = clamp01((p - 7.48) / 0.34);
        const fade = smoothstep(7.46, 7.53, p) * (1 - smoothstep(7.72, 7.86, p));
        const pos = moonPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const g = 3.2;
        for (let i = 0; i < dustCount; i++) {
          const sp = moonDust.speeds[i];
          const x = moonDust.dirs[i * 3 + 0] * sp * tau;
          const y = Math.max(0.02, moonDust.dirs[i * 3 + 1] * sp * 0.38 * tau - 0.5 * g * tau * tau);
          const z = moonDust.dirs[i * 3 + 2] * sp * tau;
          pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
        (moonPointsRef.current.material as THREE.PointsMaterial).opacity = 0.72 * fade;
      }
    }

    // 2. Mars atmospheric entry plasma streaks (p: 13.12 -> 13.52)
    if (plasmaGroupRef.current && plasmaLinesRef.current) {
      const entryFade = smoothstep(13.12, 13.22, p) * (1 - smoothstep(13.42, 13.54, p));
      plasmaGroupRef.current.visible = entryFade > 0.02;
      if (plasmaGroupRef.current.visible) {
        plasmaGroupRef.current.position.copy(camera.position);
        plasmaGroupRef.current.quaternion.copy(camera.quaternion);
        const pos = plasmaLinesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const scrollDrive = (p - 13.12) * 18.0 + clockRef.current * 4.5;
        for (let i = 0; i < streakCount; i++) {
          const t = (streaks.phases[i] + scrollDrive) % 1;
          const ox = streaks.origins[i * 3 + 0];
          const oy = streaks.origins[i * 3 + 1];
          const zHead = -6.5 + t * 8.2;
          const len = 1.65;
          pos.setXYZ(i * 2 + 0, ox * (0.65 + t * 0.55), oy * (0.65 + t * 0.55), zHead);
          pos.setXYZ(i * 2 + 1, ox * (0.65 + Math.max(0, t - 0.14) * 0.55), oy * (0.65 + Math.max(0, t - 0.14) * 0.55), zHead - len);
        }
        pos.needsUpdate = true;
        (plasmaLinesRef.current.material as THREE.LineBasicMaterial).opacity = 0.65 * entryFade;
      }
    }

    // 3. Mars Chryse Planitia touchdown dust ring (p: 13.48 -> 13.86)
    if (marsPointsRef.current) {
      const active = p >= 13.48 && p <= 13.88;
      marsPointsRef.current.visible = active;
      if (active) {
        const tau = clamp01((p - 13.48) / 0.36);
        const fade = smoothstep(13.48, 13.55, p) * (1 - smoothstep(13.72, 13.88, p));
        const pos = marsPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < dustCount; i++) {
          const sp = marsDust.speeds[i];
          const x = marsDust.dirs[i * 3 + 0] * sp * tau;
          const y = 0.08 + marsDust.dirs[i * 3 + 1] * sp * 0.28 * Math.sin(tau * Math.PI * 0.75);
          const z = marsDust.dirs[i * 3 + 2] * sp * tau;
          pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
        (marsPointsRef.current.material as THREE.PointsMaterial).opacity = 0.68 * fade;
      }
    }
  });

  if (reducedMotion) return null;

  return (
    <group>
      {/* Moon Sea of Tranquility radial ballistic touchdown grains */}
      <points ref={moonPointsRef} position={MOON_TOUCHDOWN_ORIGIN} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[moonDust.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#C9C4BC"
          size={0.075}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>

      {/* Mars entry heat-shield plasma streaks in camera view space */}
      <group ref={plasmaGroupRef} visible={false}>
        <lineSegments ref={plasmaLinesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[streaks.positions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={[2.4, 1.05, 0.45]}
            toneMapped={false}
            transparent
            opacity={0.65}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>

      {/* Mars Chryse Planitia touchdown surface dust cloud */}
      <points ref={marsPointsRef} position={MARS_TOUCHDOWN_ORIGIN} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[marsDust.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#D68E60"
          size={0.14}
          transparent
          opacity={0.68}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
