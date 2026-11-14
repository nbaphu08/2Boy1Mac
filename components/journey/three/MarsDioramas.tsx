"use client";

import { type ReactNode, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DIORAMA_SURFACE_Y } from "./MoonDioramas";
import { usePerfBudget } from "./perfTier";
import {
  applyWorldTerrainShader,
  blendCorridorHeight,
  createNearFieldHorizonGeometry,
  InstancedLandscapeRocks,
} from "./landscapeMaterials";
import { EXHIBIT_PLINTH_ANCHORS } from "./trajectory";
import {
  getMarsRoverTrackTexture,
  IngenuityAndBackshellProps,
  InSightSurfaceInstruments,
  PhoenixLanderModel,
  Viking1SiteProps,
} from "./MarsModels";

function getMarsAnchorXZ(slug: string): [number, number] {
  const pos = EXHIBIT_PLINTH_ANCHORS[slug]?.pos;
  return pos ? [pos[0], pos[2]] : [7.0, -376.0];
}

function smoothHill(
  vx: number,
  vz: number,
  cx: number,
  cz: number,
  rx: number,
  rz: number,
  h: number,
): number {
  const dx = (vx - cx) / rx;
  const dz = (vz - cz) / rz;
  const d2 = dx * dx + dz * dz;
  if (d2 > 14.0) return 0;
  const base = Math.exp(-d2 * 0.92);
  const strata = 0.88 + 0.12 * Math.cos(vx * 0.32 + vz * 0.25);
  return h * Math.pow(base, 0.85) * strata;
}

export function getMarsTerrainHeight(slug: string, vx: number, vz: number): number {
  const dist = Math.hypot(vx, vz);
  const mask = Math.min(1, Math.max(0, (dist - 2.3) / 6.5));
  const farPeri =
    dist > 26
      ? Math.min(1, (dist - 26) / 24) *
        (0.55 + 0.42 * Math.sin(vx * 0.08 + 0.8) + 0.34 * Math.cos(vz * 0.09 - 0.6))
      : 0;

  if (slug === "mars-viking-1") {
    // Chryse Planitia wind-swept rocky plain + flat-topped far outlier mesas on horizon
    const swale = mask * (Math.sin(vx * 0.16 + vz * 0.12) * 0.18 + Math.cos(vx * 0.09 - vz * 0.15) * 0.14);
    const mesaA = smoothHill(vx, vz, -16, -39, 11, 6, 3.1);
    const mesaB = smoothHill(vx, vz, 14, -44, 14, 7, 2.5);
    return swale + mesaA + mesaB + farPeri * 0.7;
  }

  if (slug === "mars-spirit") {
    // Troy: subtle soft sand depression around rover wheels + prominent Home Plate volcanic plateau behind
    const troyDip = dist < 2.1 ? -0.055 * (1 - dist / 2.1) : 0;
    const swale = mask * (Math.sin(vx * 0.2 + vz * 0.14) * 0.16);
    const hpDistX = Math.max(0, Math.abs(vx + 2.2) - 4.8);
    const hpDistZ = Math.max(0, Math.abs(vz + 12.5) - 2.6);
    const hpEdge = Math.hypot(hpDistX / 3.8, hpDistZ / 3.2);
    const homePlate = hpEdge < 3.6 ? 1.95 * Math.exp(-hpEdge * hpEdge * 1.15) : 0;
    const columbiaHills = smoothHill(vx, vz, 14, -38, 16, 10, 5.4);
    return troyDip + swale + homePlate + columbiaHills + farPeri * 0.8;
  }

  if (slug === "mars-opportunity") {
    // Perseverance Valley inner crater slope + sweeping Endeavour Crater rim ridges behind
    const slope = Math.min(1.8, Math.max(-0.85, -vz * 0.07 + vx * 0.035));
    const swale = mask * (Math.sin(vx * 0.22 + vz * 0.16) * 0.18);
    const endeavourRimA = smoothHill(vx, vz, -11, -35, 16, 8, 5.8);
    const endeavourRimB = smoothHill(vx, vz, 15, -39, 15, 9, 4.9);
    return slope + swale + endeavourRimA + endeavourRimB + farPeri * 0.9;
  }

  if (slug === "mars-phoenix") {
    // Vastitas Borealis flat arctic permafrost plain with ultra-subtle trough undulation
    const arcticMicro = Math.sin(vx * 1.1 + vz * 0.95) * 0.018 * mask;
    const farRise = dist > 32 ? Math.min(1, (dist - 32) / 26) * (0.28 + 0.18 * Math.sin(vx * 0.06)) : 0;
    return arcticMicro + farRise;
  }

  if (slug === "mars-insight") {
    // Elysium Planitia: wide smooth, almost flat, wind-scoured volcanic plain (Holloway Plains)
    const gentleRoll = mask * (Math.sin(vx * 0.09 + vz * 0.07) * 0.08 + Math.cos(vz * 0.12) * 0.05);
    const tinyFarRim = smoothHill(vx, vz, -18, -48, 20, 8, 1.4);
    return gentleRoll + tinyFarRim;
  }

  // Beat 20: mars-ingenuity — Valinor Hills sand ripples + terraced Jezero Crater delta horizon scarps
  const rippleMask = Math.min(1, Math.max(0.25, dist / 4));
  const ripples = rippleMask * Math.sin(vx * 2.2 + vz * 1.15) * 0.032;
  const swale = mask * Math.sin(vx * 0.15 - vz * 0.12) * 0.14;
  const jezeroScarpL = smoothHill(vx, vz, -17, -36, 15, 7.5, 4.6);
  const jezeroScarpR = smoothHill(vx, vz, 16, -40, 17, 8.5, 5.2);
  return ripples + swale + jezeroScarpL + jezeroScarpR + farPeri * 0.75;
}

function createMarsHorizonTerrainGeometry(
  slug: string,
  tier: "high" | "medium" | "low",
): THREE.BufferGeometry {
  const segs = tier === "high" ? 136 : tier === "medium" ? 104 : 76;
  const [ax, az] = getMarsAnchorXZ(slug);
  return createNearFieldHorizonGeometry(188, segs, (vx, vz) =>
    blendCorridorHeight("mars", ax + vx, az + vz, vx, getMarsTerrainHeight(slug, vx, vz)),
  );
}

function MarsDustParticles({ isStorm, particleCount }: { isStorm: boolean; particleCount: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const k = i * 47 + 19;
      arr[i * 3 + 0] = (((k * 83) % 1000) / 1000 - 0.5) * 18.0;
      arr[i * 3 + 1] = DIORAMA_SURFACE_Y + 0.08 + (((k * 61) % 1000) / 1000) * 2.6;
      arr[i * 3 + 2] = (((k * 97) % 1000) / 1000 - 0.5) * 18.0;
    }
    return arr;
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const speed = isStorm ? 1.85 : 0.42;
    for (let i = 0; i < attr.count; i++) {
      let x = attr.getX(i) + dt * speed;
      if (x > 9.0) x = -9.0;
      attr.setX(i, x);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={isStorm ? "#D97F52" : "#E8AE82"}
        size={isStorm ? 0.042 : 0.024}
        transparent
        opacity={isStorm ? 0.32 : 0.16}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Hall II · Mars Exhibition Continuous Horizon Landscapes (Beats 14, 16..20).
 * Beat 15 (`mars-pathfinder`) uses dedicated `<PathfinderLandscape />`.
 * - Zero cylindrical pedestals, zero rim walls, zero spotlight cones.
 * - Procedural world-space FBM soils + linear-space sky horizon fade (`#C98659` / storm `#7A331C`).
 */
export function HallTwoMarsDiorama({
  slug,
  reducedMotion,
  children,
}: {
  slug: string;
  reducedMotion: boolean;
  children?: ReactNode;
}) {
  const budget = usePerfBudget();
  const isStorm = slug === "mars-opportunity";
  const terrainGeo = useMemo(
    () => createMarsHorizonTerrainGeometry(slug, budget.tier),
    [slug, budget.tier],
  );
  const anchorXZ = useMemo<[number, number]>(() => getMarsAnchorXZ(slug), [slug]);
  const trackTex = useMemo(() => getMarsRoverTrackTexture(), []);

  const terrainMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#FFFFFF",
      roughness: 0.95,
      metalness: 0.02,
    });
    applyWorldTerrainShader(mat, {
      planet: "mars",
      anchorXZ,
      arcticPolygons: slug === "mars-phoenix",
      marsStorm: isStorm,
      spiritTroyPatch: slug === "mars-spirit",
      sandRipples: slug === "mars-ingenuity",
      qualityTier: budget.tier,
      fadeStart: 42,
      fadeEnd: 84,
    });
    return mat;
  }, [slug, anchorXZ, isStorm, budget.tier]);

  const rockCount =
    slug === "mars-insight"
      ? 6
      : slug === "mars-phoenix"
        ? budget.tier === "high"
          ? 24
          : 12
        : slug === "mars-ingenuity"
          ? budget.tier === "high"
            ? 85
            : 40
          : budget.tier === "high"
            ? 210
            : budget.tier === "medium"
              ? 125
              : 58;

  const rockSeed =
    slug === "mars-viking-1"
      ? 501
      : slug === "mars-spirit"
        ? 503
        : slug === "mars-opportunity"
          ? 504
          : slug === "mars-phoenix"
            ? 505
            : slug === "mars-insight"
              ? 506
              : 507;

  return (
    <group>
      {/* Continuous Martian regolith plain extending seamlessly into dusty butterscotch horizon */}
      <mesh
        name="diorama-terrain"
        geometry={terrainGeo}
        material={terrainMat}
        position={[0, DIORAMA_SURFACE_Y, 0]}
        receiveShadow
      />

      {/* Instanced fractured basalt flood/crater rocks with rusty dust on upward surfaces */}
      <InstancedLandscapeRocks
        planet="mars"
        anchorXZ={anchorXZ}
        count={rockCount}
        seed={rockSeed}
        maxRadius={36}
        clearRadius={slug === "mars-insight" ? 5.0 : 2.15}
        scaleRange={slug === "mars-viking-1" ? [0.1, 0.72] : [0.07, 0.46]}
        surfaceY={DIORAMA_SURFACE_Y}
        heightFn={(vx, vz) => getMarsTerrainHeight(slug, vx, vz)}
        marsStorm={isStorm}
      />

      {/* Subtle ambient drifting Martian atmospheric dust */}
      {!reducedMotion && (
        <MarsDustParticles
          isStorm={isStorm}
          particleCount={
            budget.tier === "high"
              ? isStorm
                ? 84
                : 36
              : budget.tier === "medium"
                ? isStorm
                  ? 48
                  : 22
                : isStorm
                  ? 22
                  : 10
          }
        />
      )}

      {/* ─── Beat 14: Viking 1 · GLB Lander (children) + Chryse Trench & Flagstones ─── */}
      {slug === "mars-viking-1" && (
        <group>
          {children}
          <Viking1SiteProps baseY={DIORAMA_SURFACE_Y} />
        </group>
      )}

      {/* ─── Beat 16: Spirit · MER GLB sunk into Bright Ferric-Sulfate Troy Sand Trap beside Home Plate ─── */}
      {slug === "mars-spirit" && (
        <group>
          <group position={[0, -0.055, 0]} rotation={[0.06, 0.15, -0.09]}>
            {children}
          </group>
          <mesh
            position={[-0.45, DIORAMA_SURFACE_Y - 0.015, 0.65]}
            rotation={[-Math.PI / 2, 0, 0.32]}
          >
            <planeGeometry args={[2.8, 0.85]} />
            <meshBasicMaterial
              map={trackTex}
              transparent
              opacity={0.72}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        </group>
      )}

      {/* ─── Beat 17: Opportunity · Perseverance Valley Slope GLB + Wheel Tracks + Storm Lighting ─── */}
      {slug === "mars-opportunity" && (
        <group>
          <group position={[0, 0.02, 0]} rotation={[-0.06, -0.1, 0.04]}>
            {children}
          </group>
          <mesh
            position={[-0.3, DIORAMA_SURFACE_Y + 0.018, 0.95]}
            rotation={[-Math.PI / 2 + 0.06, 0, -0.15]}
          >
            <planeGeometry args={[3.4, 0.9]} />
            <meshBasicMaterial
              map={trackTex}
              transparent
              opacity={0.76}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        </group>
      )}

      {/* ─── Beat 18: Phoenix · Dual Decagonal Wings (5.52 m true span) + Arctic Polygon Plain + Water-Ice Trench ─── */}
      {slug === "mars-phoenix" && (
        <group>
          <PhoenixLanderModel baseY={DIORAMA_SURFACE_Y} scale={1.06} />
          {/* Dug "Dodo–Goldilocks" subsurface white water-ice sample trench beside robotic arm */}
          <group position={[1.22, DIORAMA_SURFACE_Y, 0.85]} rotation={[0, -0.45, 0]}>
            <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.52, 0.28]} />
              <meshStandardMaterial color="#3A1D13" roughness={0.96} />
            </mesh>
            <mesh position={[0.04, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.26, 0.15]} />
              <meshStandardMaterial color="#E6EEF6" roughness={0.38} metalness={0.08} />
            </mesh>
          </group>
        </group>
      )}

      {/* ─── Beat 19: InSight · Smooth Flat Elysium Plain + GLB Lander + SEIS Copper Dome & HP3 Mole ─── */}
      {slug === "mars-insight" && (
        <group>
          {children}
          <InSightSurfaceInstruments baseY={DIORAMA_SURFACE_Y} />
        </group>
      )}

      {/* ─── Beat 20: Ingenuity · Valinor Hills Rippled Sand + GLB Helicopter + Snapped Blade + Backshell ─── */}
      {slug === "mars-ingenuity" && (
        <group>
          {children}
          <IngenuityAndBackshellProps baseY={DIORAMA_SURFACE_Y} />
        </group>
      )}
    </group>
  );
}
