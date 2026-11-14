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
import { applyWorldTerrainShader, InstancedLandscapeRocks } from "./landscapeMaterials";

export const DIORAMA_SURFACE_Y = 0.22;

const MOON_ANCHOR_XZ: Record<string, [number, number]> = {
  "moon-apollo-11": [5.5, -172.0],
  "moon-surveyor-3": [-9.5, -176.0],
  "moon-apollo-15-lrv": [4.5, -180.0],
  "moon-apollo-17": [16.5, -184.0],
};

function craterBowl(x: number, z: number, cx: number, cz: number, radius: number, depth: number): number {
  const r = Math.hypot(x - cx, z - cz);
  if (r > radius * 1.48) return 0;
  const u = r / radius;
  const rim = depth * 0.28;
  if (u < 1.0) {
    return -depth * (1 - u * u) + rim * Math.exp(-Math.pow((u - 0.94) / 0.16, 2));
  }
  return rim * Math.exp(-Math.pow((u - 0.94) / 0.2, 2));
}

function ridgeHill(x: number, z: number, cx: number, cz: number, rx: number, rz: number, h: number): number {
  const dx = (x - cx) / rx;
  const dz = (z - cz) / rz;
  const d2 = dx * dx + dz * dz;
  if (d2 > 4.5) return 0;
  const base = Math.exp(-d2 * 0.9);
  const strata = 0.88 + 0.12 * Math.sin(x * 0.35 + z * 0.28);
  return h * Math.pow(base, 0.85) * strata;
}

export function getMoonTerrainHeight(slug: string, x: number, z: number): number {
  const dist = Math.hypot(x, z);
  const farBlend = Math.min(1, Math.max(0, (dist - 3.2) / 9.0));

  if (slug === "moon-surveyor-3") {
    // Broad Surveyor Crater bowl (~14 m diameter): Surveyor rests on inner slope; far rim holds Apollo 12 LM
    const innerSlope = Math.max(-0.42, Math.min(0.65, x * 0.085 - z * 0.095));
    const bowlDist = Math.hypot(x + 0.8, z + 3.8);
    const bowlShape = bowlDist * bowlDist * 0.011 - 0.32 * Math.exp(-bowlDist * 0.14);
    const bowl = farBlend * bowlShape + (1 - farBlend) * innerSlope;
    const farCrater =
      craterBowl(x, z, -12, -19, 4.5, 0.55) + craterBowl(x, z, 11, -24, 5.2, 0.65);
    const horizonRim =
      z < -11 ? Math.pow(Math.min(1, (-z - 11) / 34), 1.3) * (2.6 + 0.8 * Math.sin(x * 0.12)) : 0;
    return innerSlope * 0.65 + bowl * 0.55 + farCrater + horizonRim;
  }

  if (slug === "moon-apollo-15-lrv") {
    // Hadley–Apennine plain + sinuous Hadley Rille gorge mid-ground + soaring Mount Hadley massif
    const rilleCenter = -9.5 + Math.sin(x * 0.18) * 2.8;
    const dRille = Math.abs(z - rilleCenter);
    const rilleTrench = dRille < 5.5 ? -1.85 * Math.exp(-Math.pow(dRille / 2.2, 2)) : 0;
    const mountHadley = ridgeHill(x, z, 11.5, -34.0, 18.0, 11.5, 11.8);
    const deltaMassif = ridgeHill(x, z, -18.0, -32.0, 14.0, 10.0, 6.8);
    const craters =
      craterBowl(x, z, -6.5, -2.5, 1.8, 0.28) +
      craterBowl(x, z, 6.2, -5.0, 1.4, 0.22) +
      craterBowl(x, z, -12.0, 4.0, 2.5, 0.35);
    return (
      farBlend * (Math.sin(x * 0.16 + z * 0.14) * 0.16 + craters) +
      rilleTrench +
      mountHadley +
      deltaMassif
    );
  }

  if (slug === "moon-apollo-17") {
    // Taurus–Littrow flat bright regolith valley framed by steep North & South Massifs
    const valleySlope = farBlend * Math.sin(x * 0.14 - z * 0.11) * 0.18;
    const southMassif = ridgeHill(x, z, -24.0, -30.0, 15.0, 12.0, 10.4);
    const northMassif = ridgeHill(x, z, 22.0, -33.0, 16.0, 12.0, 11.2);
    const familyMt = ridgeHill(x, z, 1.5, -42.0, 12.0, 8.5, 6.2);
    const craters =
      craterBowl(x, z, -5.2, -3.5, 1.5, 0.24) + craterBowl(x, z, 5.8, -5.5, 2.0, 0.32);
    return valleySlope + craters + southMassif + northMassif + familyMt;
  }

  // Beat 8: moon-apollo-11 — Tranquility flat basaltic mare with Double Crater & distant crater rims
  const undulation =
    farBlend *
    (Math.sin(x * 0.22 + z * 0.18) * 0.14 + Math.cos(x * 0.11 - z * 0.15) * 0.12);
  const craters =
    craterBowl(x, z, -5.5, -4.8, 2.1, 0.32) +
    craterBowl(x, z, 6.8, -8.5, 2.8, 0.42) +
    craterBowl(x, z, -11.5, -15.5, 4.2, 0.58) +
    craterBowl(x, z, 14.5, -22.0, 5.0, 0.65);
  const farRims =
    dist > 26
      ? Math.min(1, (dist - 26) / 22) * (1.2 + 0.65 * Math.cos(x * 0.09 + 0.5) + 0.45 * Math.sin(z * 0.1))
      : 0;
  return undulation + craters + farRims;
}

function createMoonHorizonTerrainGeometry(slug: string): THREE.BufferGeometry {
  const size = 124;
  const segs = 132;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    pos.setY(i, getMoonTerrainHeight(slug, vx, vz));
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Hall I · Moon Exhibition Continuous Horizon Landscapes (Beats 8..11).
 * - Zero cylindrical pedestals, zero spotlight cones, zero dot-grid textures.
 * - Continuous 124 m procedural FBM regolith fading cleanly into black lunar sky.
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
  const terrainGeo = useMemo(() => createMoonHorizonTerrainGeometry(slug), [slug]);
  const anchorXZ = useMemo<[number, number]>(
    () => MOON_ANCHOR_XZ[slug] ?? [0, -172.0],
    [slug],
  );

  const bootTex = useMemo(() => getBootprintTrailTexture(), []);
  const trackTex = useMemo(() => getRoverTrackTexture(), []);

  const terrainMat = useMemo(() => {
    const isTaurus = slug === "moon-apollo-17";
    const mat = new THREE.MeshStandardMaterial({
      color: "#8E8980",
      roughness: 0.96,
      metalness: 0.02,
    });
    applyWorldTerrainShader(mat, {
      planet: "moon",
      anchorXZ,
      baseTint: isTaurus ? "#544F48" : "#45413C",
      brightTint: isTaurus ? "#999389" : "#7D776E",
      fadeStart: 38,
      fadeEnd: 60,
    });
    return mat;
  }, [slug, anchorXZ]);

  const rockCount =
    slug === "moon-apollo-17"
      ? budget.tier === "high"
        ? 210
        : 95
      : slug === "moon-surveyor-3"
        ? budget.tier === "high"
          ? 145
          : 70
        : budget.tier === "high"
          ? 110
          : 55;

  const rockSeed =
    slug === "moon-apollo-11"
      ? 101
      : slug === "moon-surveyor-3"
        ? 202
        : slug === "moon-apollo-15-lrv"
          ? 303
          : 404;

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

      {/* Instanced fractured lunar basalt & highland breccia boulders */}
      <InstancedLandscapeRocks
        planet="moon"
        anchorXZ={anchorXZ}
        count={rockCount}
        seed={rockSeed}
        maxRadius={36}
        clearRadius={slug === "moon-apollo-11" || slug === "moon-apollo-17" ? 5.0 : 2.6}
        scaleRange={slug === "moon-apollo-17" ? [0.07, 0.42] : [0.05, 0.28]}
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
          >
            <planeGeometry args={[3.4, 1.0]} />
            <meshBasicMaterial
              map={bootTex}
              transparent
              opacity={0.78}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        </group>
      )}

      {/* ─── Beat 9: Surveyor 3 (~3.0 m tall) · Ocean of Storms Inner Crater Slope + Distant Apollo 12 LM on Rim ─── */}
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
          >
            <planeGeometry args={[2.6, 0.9]} />
            <meshBasicMaterial
              map={bootTex}
              transparent
              opacity={0.72}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        </group>
      )}

      {/* ─── Beat 10: Apollo 15 · Hadley–Apennine Plain + Parked LRV (3.1 m long) + Falcon LM Silhouette ─── */}
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
          >
            <planeGeometry args={[4.6, 1.2]} />
            <meshBasicMaterial
              map={trackTex}
              transparent
              opacity={0.78}
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
          >
            <planeGeometry args={[4.2, 1.1]} />
            <meshBasicMaterial
              map={trackTex}
              transparent
              opacity={0.74}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
          <mesh
            position={[-1.4, DIORAMA_SURFACE_Y + 0.014, 2.85]}
            rotation={[-Math.PI / 2, 0, 0.28]}
          >
            <planeGeometry args={[2.6, 0.9]} />
            <meshBasicMaterial
              map={bootTex}
              transparent
              opacity={0.7}
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
