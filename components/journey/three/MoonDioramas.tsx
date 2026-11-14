"use client";

import { type ReactNode, useMemo } from "react";
import * as THREE from "three";
import { usePerfBudget } from "./perfTier";
import {
  Apollo11SiteProps,
  ClippedLmTopCap,
  DistantApolloLmSilhouette,
  getBootprintTrailTexture,
  getRoverTrackTexture,
  LunarRovingVehicleModel,
  Surveyor3Model,
} from "./MoonModels";
import {
  applyWorldTerrainShader,
  type CraterAnchor,
  createNearFieldHorizonGeometry,
  InstancedLandscapeRocks,
} from "./landscapeMaterials";

export const DIORAMA_SURFACE_Y = 0.22;

const MOON_ANCHOR_XZ: Record<string, [number, number]> = {
  "moon-apollo-11": [5.5, -172.0],
  "moon-surveyor-3": [-9.5, -176.0],
  "moon-apollo-15-lrv": [4.5, -180.0],
  "moon-apollo-17": [16.5, -184.0],
};

type CraterDef = CraterAnchor & { d: number };

const MOON_CRATERS: Record<string, readonly CraterDef[]> = {
  "moon-apollo-11": [
    // Overlapping small-to-medium eroded Tranquility mare bowls (clear around 9.2m Eagle footpads)
    { x: -3.9, z: 3.1, r: 0.72, d: 0.14 },
    { x: 4.8, z: 2.6, r: 0.95, d: 0.18 },
    { x: -5.4, z: -2.9, r: 1.45, d: 0.28 },
    { x: 5.9, z: -4.2, r: 1.15, d: 0.22 },
    { x: -2.8, z: 5.4, r: 0.62, d: 0.12 },
    { x: 2.6, z: 5.8, r: 0.52, d: 0.1 },
    { x: -8.2, z: -6.5, r: 2.4, d: 0.42 },
    { x: 7.2, z: -9.0, r: 2.9, d: 0.48 },
    { x: -12.0, z: -15.5, r: 4.2, d: 0.64 },
    { x: 14.5, z: -22.0, r: 5.0, d: 0.72 },
    { x: 1.4, z: -13.5, r: 1.85, d: 0.34 },
  ],
  "moon-surveyor-3": [
    // Rim & flank craters outside immediate 1.8 m Surveyor 3 footpad patch
    { x: -3.2, z: 2.8, r: 0.68, d: 0.14 },
    { x: 3.5, z: 2.2, r: 0.85, d: 0.16 },
    { x: -4.8, z: -3.6, r: 1.35, d: 0.25 },
    { x: 5.2, z: -4.8, r: 1.55, d: 0.29 },
    { x: 0.9, z: 4.1, r: 0.55, d: 0.11 },
    { x: -7.5, z: -8.5, r: 2.3, d: 0.38 },
    { x: -12.0, z: -19.0, r: 4.5, d: 0.62 },
    { x: 11.0, z: -24.0, r: 5.2, d: 0.72 },
  ],
  "moon-apollo-15-lrv": [
    // Dense 0.3–2.5 m Hadley plain craters right around LRV + larger midground craters
    { x: -2.4, z: 2.9, r: 0.65, d: 0.14 },
    { x: 2.9, z: 2.5, r: 0.78, d: 0.16 },
    { x: -4.2, z: -1.8, r: 1.25, d: 0.24 },
    { x: 4.6, z: -2.9, r: 1.1, d: 0.22 },
    { x: 0.8, z: 3.9, r: 0.48, d: 0.1 },
    { x: -1.8, z: -3.9, r: 0.92, d: 0.19 },
    { x: -6.8, z: -3.4, r: 1.95, d: 0.34 },
    { x: 6.8, z: -5.4, r: 1.65, d: 0.28 },
    { x: -11.5, z: 4.2, r: 2.6, d: 0.42 },
    { x: 9.8, z: -14.0, r: 3.6, d: 0.56 },
  ],
  "moon-apollo-17": [
    { x: -4.8, z: 2.8, r: 0.75, d: 0.15 },
    { x: 2.4, z: 4.8, r: 0.65, d: 0.13 },
    { x: -5.8, z: -3.5, r: 1.65, d: 0.3 },
    { x: 6.4, z: -5.8, r: 2.1, d: 0.36 },
    { x: 8.6, z: 2.4, r: 1.15, d: 0.22 },
    { x: -9.8, z: -9.5, r: 2.8, d: 0.48 },
    { x: 1.2, z: -13.8, r: 2.2, d: 0.38 },
    { x: 12.5, z: -18.5, r: 4.4, d: 0.68 },
  ],
};

function craterBowl(x: number, z: number, cx: number, cz: number, radius: number, depth: number): number {
  const r = Math.hypot(x - cx, z - cz);
  if (r > radius * 1.48) return 0;
  const u = r / radius;
  const rim = depth * 0.16;
  if (u < 1.0) {
    return -depth * (1 - u * u) + rim * Math.exp(-Math.pow((u - 0.94) / 0.22, 2));
  }
  return rim * Math.exp(-Math.pow((u - 0.94) / 0.26, 2));
}

/** Monumental smooth rounded lunar highland massif (Mount Hadley / North & South Massifs, zero wave stripes). */
function ridgeHill(x: number, z: number, cx: number, cz: number, rx: number, rz: number, h: number): number {
  const dx = (x - cx) / rx;
  const dz = (z - cz) / rz;
  const d2 = dx * dx + dz * dz;
  if (d2 > 5.0) return 0;
  const radial = Math.exp(-d2 * 0.85);
  const shoulder = Math.exp(-d2 * 0.36) * 0.28;
  return h * (radial * 0.82 + shoulder * 0.18);
}

export function getMoonTerrainHeight(slug: string, x: number, z: number): number {
  const dist = Math.hypot(x, z);
  const farBlend = Math.min(1, Math.max(0, (dist - 1.75) / 3.4));
  const craterList = MOON_CRATERS[slug] ?? MOON_CRATERS["moon-apollo-11"];
  let craters = 0;
  for (let i = 0; i < craterList.length; i++) {
    const c = craterList[i];
    craters += craterBowl(x, z, c.x, c.z, c.r, c.d);
  }

  if (slug === "moon-surveyor-3") {
    // Bounded Surveyor Crater bowl (~30 m span, natural ~3.8 m far crater rim against pure black sky)
    const innerSlope = Math.max(-0.36, Math.min(0.45, x * 0.065 - z * 0.075));
    const bowlDist = Math.hypot(x + 0.8, z + 3.8);
    const bowlShape = Math.min(2.6, bowlDist * bowlDist * 0.0085) - 0.3 * Math.exp(-bowlDist * 0.14);
    const bowl = farBlend * bowlShape + (1 - farBlend) * innerSlope;
    const farWall =
      ridgeHill(x, z, 3.5, -52.0, 34.0, 18.0, 3.6) + ridgeHill(x, z, -28.0, -48.0, 24.0, 15.0, 2.8);
    return innerSlope * 0.52 + bowl * 0.62 + farBlend * craters + farWall;
  }

  if (slug === "moon-apollo-15-lrv") {
    // Hadley–Apennine plain + Hadley Rille gorge mid-ground + soaring smooth convex Mount Hadley massif
    const rilleCenter = -11.5 + Math.sin(x * 0.14) * 2.2;
    const dRille = Math.abs(z - rilleCenter);
    const rilleTrench = dRille < 6.0 ? -1.85 * Math.exp(-Math.pow(dRille / 2.4, 2)) : 0;
    const mountHadley = ridgeHill(x, z, 11.0, -52.0, 24.0, 16.5, 19.8);
    const deltaMassif = ridgeHill(x, z, -27.0, -54.0, 20.0, 14.5, 11.4);
    const softRoll =
      farBlend * (Math.sin(x * 0.14 + z * 0.12) * 0.12 + Math.cos(x * 0.08 - z * 0.1) * 0.09);
    return softRoll + farBlend * craters + rilleTrench + mountHadley + deltaMassif;
  }

  if (slug === "moon-apollo-17") {
    // Taurus–Littrow bright valley floor framed by towering rounded North & South Massifs
    const valleySlope = farBlend * Math.sin(x * 0.12 - z * 0.09) * 0.14;
    const southMassif = ridgeHill(x, z, -28.0, -50.0, 22.0, 16.0, 17.5);
    const northMassif = ridgeHill(x, z, 24.0, -52.0, 22.0, 16.0, 18.6);
    const familyMt = ridgeHill(x, z, 0.5, -64.0, 19.0, 13.5, 10.6);
    return valleySlope + farBlend * craters + southMassif + northMassif + familyMt;
  }

  // Beat 8: moon-apollo-11 — Tranquility mare floor with crisp small-to-medium craters & smooth far crater-rim swell
  const undulation =
    farBlend * (Math.sin(x * 0.18 + z * 0.15) * 0.1 + Math.cos(x * 0.09 - z * 0.12) * 0.09);
  const farRims =
    ridgeHill(x, z, -18.0, -58.0, 28.0, 15.0, 3.6) + ridgeHill(x, z, 22.0, -60.0, 26.0, 15.0, 3.2);
  return undulation + farBlend * craters + farRims;
}

function createMoonHorizonTerrainGeometry(
  slug: string,
  tier: "high" | "medium" | "low",
): THREE.BufferGeometry {
  const segs = tier === "high" ? 192 : tier === "medium" ? 136 : 92;
  return createNearFieldHorizonGeometry(176, segs, (vx, vz) => getMoonTerrainHeight(slug, vx, vz));
}

/**
 * Hall I · Moon Exhibition Continuous Horizon Landscapes (Beats 8..11).
 * - Zero cylindrical pedestals, zero spotlight cones, zero dot-grid textures.
 * - Warped 176 m near-field-dense regolith with cauliflower micro-relief & crisp sunlit massifs.
 */
export function HallOneLunarDiorama({
  slug,
  reducedMotion: _reducedMotion,
  children,
}: {
  slug: string;
  reducedMotion: boolean;
  children?: ReactNode;
}) {
  void _reducedMotion;
  const budget = usePerfBudget();
  const terrainGeo = useMemo(
    () => createMoonHorizonTerrainGeometry(slug, budget.tier),
    [slug, budget.tier],
  );
  const anchorXZ = useMemo<[number, number]>(
    () => MOON_ANCHOR_XZ[slug] ?? [0, -172.0],
    [slug],
  );
  const craters = useMemo(
    () => MOON_CRATERS[slug] ?? MOON_CRATERS["moon-apollo-11"],
    [slug],
  );

  const bootTex = useMemo(() => getBootprintTrailTexture(), []);
  const trackTex = useMemo(() => getRoverTrackTexture(), []);

  const terrainMat = useMemo(() => {
    const isTaurus = slug === "moon-apollo-17";
    const mat = new THREE.MeshStandardMaterial({
      color: "#FFFFFF",
      roughness: 0.96,
      metalness: 0.01,
    });
    applyWorldTerrainShader(mat, {
      planet: "moon",
      anchorXZ,
      baseTint: isTaurus ? "#4E4840" : "#443E37",
      brightTint: isTaurus ? "#989185" : "#898276",
      highlandBrightTint: isTaurus ? "#CCC5B8" : "#C4BDB0",
      fadeStart: 72,
      fadeEnd: 87.5,
      qualityTier: budget.tier,
      moonSunDir: [9.4, 2.85, 4.3],
    });
    return mat;
  }, [slug, anchorXZ, budget.tier]);

  const boulderCount =
    budget.tier === "high"
      ? slug === "moon-apollo-17"
        ? 145
        : 110
      : budget.tier === "medium"
        ? 70
        : 32;
  const pebbleCount =
    budget.tier === "high" ? 680 : budget.tier === "medium" ? 360 : 140;

  const rockSeed =
    slug === "moon-apollo-11"
      ? 101
      : slug === "moon-surveyor-3"
        ? 202
        : slug === "moon-apollo-15-lrv"
          ? 303
          : 404;
  const rockClear = slug === "moon-apollo-11" || slug === "moon-apollo-17" ? 4.4 : 1.75;

  // Surface heights for distant Apollo 12 & Apollo 15 LM silhouettes on crater rim / rille shoulder
  const apollo12LmY = useMemo(
    () =>
      slug === "moon-surveyor-3"
        ? DIORAMA_SURFACE_Y + getMoonTerrainHeight("moon-surveyor-3", 4.6, -15.5)
        : 0,
    [slug],
  );
  const apollo15LmY = useMemo(
    () =>
      slug === "moon-apollo-15-lrv"
        ? DIORAMA_SURFACE_Y + getMoonTerrainHeight("moon-apollo-15-lrv", -5.2, -16.8)
        : 0,
    [slug],
  );

  return (
    <group>
      {/* Continuous Moon regolith terrain stretching to black horizon */}
      <mesh
        name="diorama-terrain"
        geometry={terrainGeo}
        material={terrainMat}
        position={[0, DIORAMA_SURFACE_Y, 0]}
        receiveShadow
      />

      {/* Instanced dense deeply-seated 2–10 cm pebbles + scattered 14–48 cm floor rocks */}
      <InstancedLandscapeRocks
        planet="moon"
        anchorXZ={anchorXZ}
        count={pebbleCount}
        seed={rockSeed + 17}
        maxRadius={15}
        clearRadius={rockClear}
        scaleRange={[0.028, 0.105]}
        scalePower={1.75}
        embedOffset={-0.16}
        moonCraters={craters}
        maxLocalHeight={0.95}
        castShadows={false}
        surfaceY={DIORAMA_SURFACE_Y}
        heightFn={(vx, vz) => getMoonTerrainHeight(slug, vx, vz)}
      />
      <InstancedLandscapeRocks
        planet="moon"
        anchorXZ={anchorXZ}
        count={boulderCount}
        seed={rockSeed}
        maxRadius={28}
        clearRadius={rockClear + 0.5}
        scaleRange={slug === "moon-apollo-17" ? [0.15, 0.48] : [0.14, 0.38]}
        scalePower={2.35}
        embedOffset={-0.1}
        moonCraters={craters}
        maxLocalHeight={1.05}
        surfaceY={DIORAMA_SURFACE_Y}
        heightFn={(vx, vz) => getMoonTerrainHeight(slug, vx, vz)}
      />

      {/* GLB Exhibit Model (Apollo 11 & 17 clipped LM descent stage) passed from ExhibitStage3D */}
      {children}

      {/* ─── Beat 8: Apollo 11 · Sea of Tranquility (Eagle 9.2 m leg span + Top Cap + EASEP + LRRR + Bootprints) ─── */}
      {slug === "moon-apollo-11" && (
        <group>
          <Apollo11SiteProps baseY={DIORAMA_SURFACE_Y} lmScale={9.2 / 2.8} />
          <mesh
            position={[0.65, DIORAMA_SURFACE_Y + 0.014, 3.35]}
            rotation={[-Math.PI / 2, 0, -0.35]}
            receiveShadow
          >
            <planeGeometry args={[3.4, 1.0]} />
            <meshStandardMaterial
              map={bootTex}
              color="#7A7369"
              roughness={0.98}
              metalness={0}
              transparent
              opacity={0.9}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        </group>
      )}

      {/* ─── Beat 9: Surveyor 3 (~3.0 m tall) · Ocean of Storms Inner Crater Slope (untouched except Apollo 12 bootpath) ─── */}
      {slug === "moon-surveyor-3" && (
        <group>
          <group position={[0, DIORAMA_SURFACE_Y, 0]} rotation={[0.1, 0.28, -0.08]}>
            <Surveyor3Model scale={0.92} />
          </group>
          <DistantApolloLmSilhouette
            position={[4.6, apollo12LmY + 0.05, -15.5]}
            scale={0.34}
          />
          <mesh
            position={[-0.65, DIORAMA_SURFACE_Y + 0.025, 1.35]}
            rotation={[-Math.PI / 2 + 0.09, 0, 0.42]}
            receiveShadow
          >
            <planeGeometry args={[2.6, 0.9]} />
            <meshStandardMaterial
              map={bootTex}
              color="#787167"
              roughness={0.98}
              metalness={0}
              transparent
              opacity={0.86}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        </group>
      )}

      {/* ─── Beat 10: Apollo 15 · Hadley–Apennine Plain + Parked LRV (3.1 m long) + Falcon LM + Churned Tracks ─── */}
      {slug === "moon-apollo-15-lrv" && (
        <group>
          <group position={[0.1, DIORAMA_SURFACE_Y, 0]} rotation={[0, -0.25, 0]}>
            <LunarRovingVehicleModel scale={1.0} />
          </group>
          <DistantApolloLmSilhouette
            position={[-5.2, apollo15LmY + 0.05, -16.8]}
            scale={0.38}
          />
          <mesh
            position={[-0.45, DIORAMA_SURFACE_Y + 0.014, 1.45]}
            rotation={[-Math.PI / 2, 0, 0.22]}
            receiveShadow
          >
            <planeGeometry args={[4.8, 1.25]} />
            <meshStandardMaterial
              map={trackTex}
              color="#7A7369"
              roughness={0.98}
              metalness={0}
              transparent
              opacity={0.92}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
          <mesh
            position={[1.35, DIORAMA_SURFACE_Y + 0.014, 2.35]}
            rotation={[-Math.PI / 2, 0, -0.32]}
            receiveShadow
          >
            <planeGeometry args={[3.2, 0.95]} />
            <meshStandardMaterial
              map={bootTex}
              color="#746D63"
              roughness={0.98}
              metalness={0}
              transparent
              opacity={0.88}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        </group>
      )}

      {/* ─── Beat 11: Apollo 17 · Taurus–Littrow Valley Floor + Challenger Top Cap + Parked LRV (3.1 m) + Tracks ─── */}
      {slug === "moon-apollo-17" && (
        <group>
          <ClippedLmTopCap baseY={DIORAMA_SURFACE_Y} scale={9.2 / 2.8} />
          <group position={[4.15, DIORAMA_SURFACE_Y, -0.85]} rotation={[0, 0.65, 0]}>
            <LunarRovingVehicleModel scale={1.0} />
          </group>
          <mesh
            position={[1.95, DIORAMA_SURFACE_Y + 0.014, 2.35]}
            rotation={[-Math.PI / 2, 0, -0.42]}
            receiveShadow
          >
            <planeGeometry args={[4.4, 1.15]} />
            <meshStandardMaterial
              map={trackTex}
              color="#857E73"
              roughness={0.98}
              metalness={0}
              transparent
              opacity={0.88}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
          <mesh
            position={[-1.4, DIORAMA_SURFACE_Y + 0.014, 2.85]}
            rotation={[-Math.PI / 2, 0, 0.28]}
            receiveShadow
          >
            <planeGeometry args={[2.8, 0.95]} />
            <meshStandardMaterial
              map={bootTex}
              color="#80796E"
              roughness={0.98}
              metalness={0}
              transparent
              opacity={0.85}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
