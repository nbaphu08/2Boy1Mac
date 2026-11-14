"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  Apollo11SiteProps,
  ClippedLmTopCap,
  DistantApolloLmSilhouette,
  GrailTwinHolograms,
  LunarRovingVehicleModel,
  Surveyor3Model,
  getBootprintTrailTexture,
  getDarkEjectaTexture,
  getRoverTrackTexture,
} from "./MoonModels";

export const DIORAMA_SURFACE_Y = 0.22;

let cachedRegolithColor: THREE.CanvasTexture | null = null;
let cachedRegolithBump: THREE.CanvasTexture | null = null;
let cachedContactShadow: THREE.CanvasTexture | null = null;

/** Procedural medium-dark grey lunar regolith with subtle warm brown-taupe tint & micro-craters. */
export function getLunarRegolithTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  if (cachedRegolithColor && cachedRegolithBump) {
    return { map: cachedRegolithColor, bumpMap: cachedRegolithBump };
  }

  const size = 512;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext("2d")!;

  // Base regolith tone: medium-dark grey with subtle brown-taupe tint (REF_MOON §Global look)
  cCtx.fillStyle = "#68635C";
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, size, size);

  // Fine granular regolith noise
  for (let i = 0; i < 9500; i++) {
    const x = (i * 173) % size;
    const y = (i * 311) % size;
    const r = 1 + (i % 3);
    const bright = i % 2 === 0;
    cCtx.fillStyle = bright ? "rgba(138, 132, 124, 0.22)" : "rgba(42, 39, 36, 0.25)";
    cCtx.fillRect(x, y, r, r);

    bCtx.fillStyle = bright ? "rgba(210, 210, 210, 0.28)" : "rgba(50, 50, 50, 0.28)";
    bCtx.fillRect(x, y, r, r);
  }

  // Small pockmark micro-craters with raised rims
  for (let c = 0; c < 65; c++) {
    const cx = 24 + ((c * 197) % (size - 48));
    const cy = 24 + ((c * 263) % (size - 48));
    const rad = 4 + (c % 14);

    const cGrad = cCtx.createRadialGradient(cx - rad * 0.2, cy - rad * 0.2, rad * 0.1, cx, cy, rad);
    cGrad.addColorStop(0, "rgba(36, 34, 31, 0.65)");
    cGrad.addColorStop(0.68, "rgba(58, 54, 49, 0.4)");
    cGrad.addColorStop(0.86, "rgba(145, 138, 130, 0.45)");
    cGrad.addColorStop(1, "rgba(104, 99, 92, 0)");
    cCtx.fillStyle = cGrad;
    cCtx.beginPath();
    cCtx.arc(cx, cy, rad, 0, Math.PI * 2);
    cCtx.fill();

    const bGrad = bCtx.createRadialGradient(cx, cy, rad * 0.15, cx, cy, rad);
    bGrad.addColorStop(0, "rgba(28, 28, 28, 0.85)");
    bGrad.addColorStop(0.76, "rgba(225, 225, 225, 0.7)");
    bGrad.addColorStop(1, "rgba(128, 128, 128, 0)");
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.arc(cx, cy, rad, 0, Math.PI * 2);
    bCtx.fill();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);

  cachedRegolithColor = map;
  cachedRegolithBump = bumpMap;
  return { map, bumpMap };
}

/** Soft radial contact shadow decal texture placed under landers and rovers (AG-1b #3). */
export function getSoftContactShadowTexture(): THREE.CanvasTexture {
  if (cachedContactShadow) return cachedContactShadow;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 58);
  grad.addColorStop(0, "rgba(8, 9, 12, 0.46)");
  grad.addColorStop(0.45, "rgba(8, 9, 12, 0.22)");
  grad.addColorStop(0.8, "rgba(8, 9, 12, 0.06)");
  grad.addColorStop(1, "rgba(8, 9, 12, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  cachedContactShadow = tex;
  return tex;
}

/**
 * Sculpted, multi-octave displaced 3D lunar massif / ridge silhouette (AG-1b #7).
 * Replaces flat low-poly cones with smooth, weathered lunar highland relief.
 */
function SculptedLunarMassif({
  position,
  rotation = [0, 0, 0],
  width = 3.2,
  depth = 1.6,
  height = 1.25,
  seed = 1,
  color = "#54504A",
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  depth?: number;
  height?: number;
  seed?: number;
  color?: string;
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, depth, 36, 18);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const nx = vx / (width * 0.5);
      const nz = vz / (depth * 0.5);
      // Smooth bell-shaped massif envelope tapering to 0 at all edges
      const envX = Math.max(0, 1 - nx * nx);
      const envZ = Math.max(0, 1 - Math.pow(nz, 2));
      const envelope = Math.pow(envX, 1.35) * Math.pow(envZ, 1.25);

      // Multi-peak rounded lunar highland ridgeline + subtle gullies
      const ridge =
        0.68 +
        0.22 * Math.cos(nx * 2.6 + seed * 1.1) +
        0.12 * Math.sin(nx * 5.4 - nz * 2.2 + seed * 2.3) +
        0.06 * Math.cos(nx * 9.2 + nz * 4.5);

      const y = Math.max(0, envelope * ridge * height);
      pos.setY(i, y);
    }
    g.computeVertexNormals();
    return g;
  }, [width, depth, height, seed]);

  return (
    <mesh position={position} rotation={rotation} geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.95} metalness={0.03} />
    </mesh>
  );
}

/** Helper to sculpt a bowl crater into a vertex heightfield. */
function craterBowl(dx: number, dz: number, radius: number, depth: number, rimHeight: number): number {
  const r = Math.hypot(dx, dz) / radius;
  if (r >= 1.35) return 0;
  if (r < 0.82) {
    const t = r / 0.82;
    return -depth * (1 - t * t);
  }
  const rimT = (r - 0.82) / 0.53;
  return rimHeight * Math.sin(rimT * Math.PI);
}

/**
 * Generates a displaced circular lunar regolith terrain mesh customized per Hall I site.
 * Radius = 3.25 units, 52 radial × 28 ring subdivisions.
 */
function createLunarTerrainGeometry(slug: string): THREE.BufferGeometry {
  const radius = 3.25;
  const geo = new THREE.CircleGeometry(radius, 56);
  // CircleGeometry only has outer ring + center; use PlaneGeometry warped to a disc for rich interior vertex displacement!
  geo.dispose();

  const segs = 48;
  const plane = new THREE.PlaneGeometry(radius * 2, radius * 2, segs, segs);
  plane.rotateX(-Math.PI / 2);

  const pos = plane.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    // Elliptical mapping from square [-R, R]^2 to circular disc of radius R
    const nx = vx / radius;
    const nz = vz / radius;
    const cx = nx * Math.sqrt(Math.max(0, 1 - (nz * nz) / 2)) * radius;
    const cz = nz * Math.sqrt(Math.max(0, 1 - (nx * nx) / 2)) * radius;
    const rNorm = Math.min(1, Math.hypot(cx, cz) / radius);
    const edgeTaper = 1 - Math.pow(rNorm, 3.5);

    // Base micro-undulation
    let h =
      (Math.sin(cx * 1.9 + cz * 1.3) * 0.035 +
        Math.cos(cx * 3.4 - cz * 2.7) * 0.02) *
      edgeTaper;

    if (slug === "moon-apollo-11") {
      // Sea of Tranquility: flat mare plain with small secondary craters away from the LM pad
      h += craterBowl(cx - 1.55, cz + 0.9, 0.52, 0.09, 0.035);
      h += craterBowl(cx + 1.45, cz - 1.15, 0.65, 0.11, 0.04);
      h += craterBowl(cx - 1.65, cz - 1.05, 0.42, 0.07, 0.025);
    } else if (slug === "moon-surveyor-3") {
      // Surveyor Crater: concave crater inner slope dipping in front/center, rising to a northern crater rim in back
      const rimArc = Math.exp(-Math.pow((cz + 1.85) / 0.85, 2)) * 0.42;
      const bowlDip = -Math.exp(-((cx * cx + (cz - 0.35) * (cz - 0.35)) / 3.2)) * 0.22;
      h += (rimArc + bowlDip) * (1 - Math.pow(rNorm, 6));
      h += craterBowl(cx - 1.2, cz + 0.6, 0.38, 0.06, 0.02);
    } else if (slug === "moon-apollo-15-lrv") {
      // Hadley–Apennine: mare plain + Hadley Rille channel on the left + Mount Hadley massif rising in the back
      const rilleChannel =
        cx < -1.15 ? -Math.exp(-Math.pow((cx + 1.95 - Math.sin(cz) * 0.25) / 0.55, 2)) * 0.28 : 0;
      const mtHadleyFoot = cz < -1.1 ? Math.pow(Math.max(0, (-cz - 1.1) / 2.1), 1.6) * 0.65 : 0;
      h += (rilleChannel + mtHadleyFoot) * (1 - Math.pow(rNorm, 8));
    } else if (slug === "moon-apollo-17") {
      // Taurus–Littrow: flat valley floor flanked by North Massif & South Massif slopes on left/back and right/back
      const massifLeft =
        cx < -1.2 && cz < 0.5
          ? Math.pow(Math.max(0, (-cx - 1.2) / 2.0), 1.5) * 0.55
          : 0;
      const massifRight =
        cx > 1.2 && cz < 0.5
          ? Math.pow(Math.max(0, (cx - 1.2) / 2.0), 1.5) * 0.48
          : 0;
      h += (massifLeft + massifRight) * (1 - Math.pow(rNorm, 8));
      h += craterBowl(cx + 0.15, cz + 1.65, 0.48, 0.08, 0.03);
    } else if (slug === "moon-grail") {
      // Sally K. Ride Impact Site: southern slope of ~2.5 km mountain + two ~5 m impact craters with raised rims
      const mountainSlope = ((-cz + 1.2) * 0.18 + Math.cos(cx * 0.8) * 0.08) * (1 - Math.pow(rNorm, 5));
      const craterEbb = craterBowl(cx + 0.95, cz - 0.35, 0.56, 0.16, 0.055);
      const craterFlow = craterBowl(cx - 1.05, cz + 0.32, 0.56, 0.16, 0.055);
      h += mountainSlope + craterEbb + craterFlow;
    }

    pos.setXYZ(i, cx, h, cz);
  }

  plane.computeVertexNormals();
  return plane;
}

/** Sparse, slow-drifting lunar dust motes suspended in the cold #DCE6FF spotlight beam (no haze). */
export function LunarDustMotes({ reducedMotion }: { reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 26;

  const basePositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i * 2.39996) % (Math.PI * 2);
      const r = 0.25 + ((i * 37) % 100) * 0.024;
      arr[i * 3 + 0] = Math.cos(a) * r;
      arr[i * 3 + 1] = DIORAMA_SURFACE_Y + 0.25 + ((i * 53) % 100) * 0.028;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current || reducedMotion) return;
    const t = clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3 + 0];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      pos.setXYZ(
        i,
        bx + Math.sin(t * 0.28 + i) * 0.06,
        by + Math.cos(t * 0.22 + i * 1.7) * 0.05,
        bz + Math.cos(t * 0.25 + i * 0.9) * 0.06,
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[basePositions.slice(), 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#DCE6FF"
        size={0.032}
        transparent
        opacity={0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Scattered angular lunar basalt rocks/clasts around each diorama patch. */
function ScatteredLunarRocks({ seed }: { seed: number }) {
  const rocks = useMemo(() => {
    const items: { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < 14; i++) {
      const k = seed * 31 + i * 17;
      const angle = ((k * 73) % 360) * (Math.PI / 180);
      const rad = 1.35 + ((k * 41) % 155) * 0.011;
      const rx = Math.cos(angle) * rad;
      const rz = Math.sin(angle) * rad;
      const s = 0.038 + (i % 4) * 0.022;
      items.push({
        pos: [rx, DIORAMA_SURFACE_Y + s * 0.35, rz],
        scale: [s * 1.25, s * 0.72, s],
        rot: [(k % 7) * 0.4, (k % 11) * 0.5, (k % 5) * 0.3],
      });
    }
    return items;
  }, [seed]);

  return (
    <group>
      {rocks.map((r, idx) => (
        <mesh key={idx} position={r.pos} scale={r.scale} rotation={r.rot}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#58544E" roughness={0.92} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Renders the complete Hall I lunar regolith diorama terrain, craters, massifs, tracks,
 * footprints, and site-specific hardware/silhouettes for SM-L-001 .. SM-L-005.
 */
export function HallOneLunarDiorama({
  slug,
  reducedMotion,
  children,
}: {
  slug: string;
  reducedMotion: boolean;
  children?: React.ReactNode;
}) {
  const { map: regolithMap, bumpMap: regolithBump } = useMemo(() => getLunarRegolithTextures(), []);
  const shadowTex = useMemo(() => getSoftContactShadowTexture(), []);
  const bootprintTex = useMemo(() => getBootprintTrailTexture(), []);
  const roverTrackTex = useMemo(() => getRoverTrackTexture(), []);
  const ejectaTex = useMemo(() => getDarkEjectaTexture(), []);
  const terrainGeo = useMemo(() => createLunarTerrainGeometry(slug), [slug]);

  return (
    <group>
      {/* Sleek dark-basalt museum diorama base: recessed floor (-0.22 m below terrain) + open outer skirt wall so craters NEVER intersect the base top (AG-1b #3) */}
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[3.32, 3.48, 0.36, 48]} />
        <meshStandardMaterial color="#181C26" roughness={0.82} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[3.26, 3.32, 0.28, 48, 1, true]} />
        <meshStandardMaterial color="#181C26" roughness={0.82} metalness={0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, DIORAMA_SURFACE_Y - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.29, 48]} />
        <meshBasicMaterial color="#B9BEC8" transparent opacity={0.42} />
      </mesh>

      {/* Displaced Lunar Regolith Terrain Patch */}
      <mesh geometry={terrainGeo} position={[0, DIORAMA_SURFACE_Y, 0]}>
        <meshStandardMaterial
          map={regolithMap}
          bumpMap={regolithBump}
          bumpScale={0.065}
          roughness={0.94}
          metalness={0.04}
        />
      </mesh>

      {/* Sparse slow lunar dust motes in the cold spotlight beam */}
      <LunarDustMotes reducedMotion={reducedMotion} />

      {/* Scattered lunar basalt rocks */}
      <ScatteredLunarRocks seed={slug.charCodeAt(slug.length - 1)} />

      {/* ─── SITE 1: SM-L-001 · APOLLO 11 (Sea of Tranquility) ─── */}
      {slug === "moon-apollo-11" ? (
        <group>
          {/* Soft physically plausible contact shadow directly beneath Eagle descent stage */}
          <mesh position={[0, DIORAMA_SURFACE_Y + 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.1, 2.1]} />
            <meshBasicMaterial map={shadowTex} transparent opacity={0.45} depthWrite={false} />
          </mesh>

          {/* Astronaut bootprint paths connecting LM ladder -> EASEP -> LRRR */}
          <mesh
            position={[-0.42, DIORAMA_SURFACE_Y + 0.036, 1.36]}
            rotation={[-Math.PI / 2, 0, -0.68]}
          >
            <planeGeometry args={[1.65, 0.36]} />
            <meshBasicMaterial map={bootprintTex} transparent opacity={0.85} depthWrite={false} />
          </mesh>
          <mesh
            position={[-0.98, DIORAMA_SURFACE_Y + 0.036, 1.42]}
            rotation={[-Math.PI / 2, 0, 0.78]}
          >
            <planeGeometry args={[1.15, 0.32]} />
            <meshBasicMaterial map={bootprintTex} transparent opacity={0.8} depthWrite={false} />
          </mesh>

          {/* Clipped LM Eagle Descent Stage (passed as children) + Ladder/Plaque + EASEP + LRRR */}
          {children}
          <Apollo11SiteProps baseY={DIORAMA_SURFACE_Y} />
        </group>
      ) : null}

      {/* ─── SITE 2: SM-L-002 · SURVEYOR 3 (Ocean of Storms crater + Apollo 12 LM on rim) ─── */}
      {slug === "moon-surveyor-3" ? (
        <group>
          {/* Soft contact shadow directly beneath Surveyor 3 on the inner crater slope */}
          <mesh
            position={[0.08, DIORAMA_SURFACE_Y - 0.11, 0.22]}
            rotation={[-Math.PI / 2 + 0.14, 0, 0]}
          >
            <planeGeometry args={[1.85, 1.85]} />
            <meshBasicMaterial map={shadowTex} transparent opacity={0.42} depthWrite={false} />
          </mesh>

          {/* Bootprint trail from Conrad & Bean walking down the crater slope to Surveyor 3 */}
          <mesh
            position={[0.62, DIORAMA_SURFACE_Y + 0.02, -0.58]}
            rotation={[-Math.PI / 2 + 0.14, 0, -1.12]}
          >
            <planeGeometry args={[2.1, 0.38]} />
            <meshBasicMaterial map={bootprintTex} transparent opacity={0.82} depthWrite={false} />
          </mesh>

          {/* Surveyor 3 3D lander tilted on the inner slope of its crater */}
          <group
            position={[0.08, DIORAMA_SURFACE_Y - 0.15, 0.22]}
            rotation={[0.14, -0.35, -0.09]}
          >
            <Surveyor3Model scale={0.76} />
          </group>

          {/* Distant Apollo 12 LM (Intrepid) silhouette on the northern crater rim (155 m away) */}
          <DistantApolloLmSilhouette
            position={[1.18, DIORAMA_SURFACE_Y + 0.38, -2.05]}
            scale={0.21}
            includeAscentStage
          />
        </group>
      ) : null}

      {/* ─── SITE 3: SM-L-003 · APOLLO 15 LRV (Hadley–Apennine, Mount Hadley, distant LM) ─── */}
      {slug === "moon-apollo-15-lrv" ? (
        <group>
          {/* Sculpted Mount Hadley & Apennine Front backdrop massifs along the northern horizon (AG-1b #7) */}
          <SculptedLunarMassif
            position={[0.65, DIORAMA_SURFACE_Y + 0.04, -2.1]}
            rotation={[0, -0.15, 0]}
            width={3.6}
            depth={1.65}
            height={1.45}
            seed={15}
            color="#58544E"
          />
          <SculptedLunarMassif
            position={[-1.35, DIORAMA_SURFACE_Y + 0.02, -1.95]}
            rotation={[0, 0.35, 0]}
            width={2.6}
            depth={1.4}
            height={0.98}
            seed={29}
            color="#4E4A45"
          />

          {/* Soft contact shadow under parked LRV */}
          <mesh position={[0.15, DIORAMA_SURFACE_Y + 0.032, 0.35]} rotation={[-Math.PI / 2, 0, -0.45]}>
            <planeGeometry args={[2.1, 1.4]} />
            <meshBasicMaterial map={shadowTex} transparent opacity={0.44} depthWrite={false} />
          </mesh>

          {/* Rover wheel tracks trailing behind the parked LRV */}
          <mesh
            position={[0.92, DIORAMA_SURFACE_Y + 0.036, 1.15]}
            rotation={[-Math.PI / 2, 0, -0.52]}
          >
            <planeGeometry args={[2.2, 1.15]} />
            <meshBasicMaterial map={roverTrackTex} transparent opacity={0.82} depthWrite={false} />
          </mesh>
          {/* Dave Scott's bootprints walking away from the parked rover */}
          <mesh
            position={[-0.55, DIORAMA_SURFACE_Y + 0.036, 0.15]}
            rotation={[-Math.PI / 2, 0, 0.85]}
          >
            <planeGeometry args={[1.85, 0.34]} />
            <meshBasicMaterial map={bootprintTex} transparent opacity={0.8} depthWrite={false} />
          </mesh>

          {/* Parked Apollo 15 LRV aimed toward the distant LM Falcon to televise liftoff */}
          <group position={[0.15, DIORAMA_SURFACE_Y, 0.35]} rotation={[0, -0.52, 0]}>
            <LunarRovingVehicleModel scale={0.76} />
          </group>

          {/* Distant Apollo 15 LM (Falcon) ~150 m away in the direction the rover's TV camera points */}
          <DistantApolloLmSilhouette
            position={[-1.35, DIORAMA_SURFACE_Y + 0.14, -1.55]}
            scale={0.19}
            includeAscentStage={false}
          />
        </group>
      ) : null}

      {/* ─── SITE 4: SM-L-004 · APOLLO 17 (Taurus–Littrow valley massifs, LM, LRV, tracks & footprints) ─── */}
      {slug === "moon-apollo-17" ? (
        <group>
          {/* Sculpted Taurus–Littrow North Massif & South Massif framing both sides of the valley (AG-1b #7) */}
          <SculptedLunarMassif
            position={[-1.85, DIORAMA_SURFACE_Y + 0.02, -1.55]}
            rotation={[0, 0.42, 0]}
            width={3.1}
            depth={1.55}
            height={1.38}
            seed={17}
            color="#56524C"
          />
          <SculptedLunarMassif
            position={[1.95, DIORAMA_SURFACE_Y + 0.02, -1.45]}
            rotation={[0, -0.38, 0]}
            width={2.9}
            depth={1.5}
            height={1.26}
            seed={41}
            color="#504C46"
          />

          {/* Prominent dual parallel LRV tracks & astronaut bootprints across the valley floor */}
          <mesh
            position={[0.35, DIORAMA_SURFACE_Y + 0.034, 0.68]}
            rotation={[-Math.PI / 2, 0, -0.32]}
          >
            <planeGeometry args={[3.4, 1.18]} />
            <meshBasicMaterial map={roverTrackTex} transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh
            position={[-0.25, DIORAMA_SURFACE_Y + 0.036, -0.65]}
            rotation={[-Math.PI / 2, 0, 0.42]}
          >
            <planeGeometry args={[2.8, 1.05]} />
            <meshBasicMaterial map={roverTrackTex} transparent opacity={0.82} depthWrite={false} />
          </mesh>
          <mesh
            position={[0.15, DIORAMA_SURFACE_Y + 0.038, 1.25]}
            rotation={[-Math.PI / 2, 0, -0.18]}
          >
            <planeGeometry args={[2.45, 0.38]} />
            <meshBasicMaterial map={bootprintTex} transparent opacity={0.88} depthWrite={false} />
          </mesh>

          {/* Soft contact shadows under Challenger descent stage & parked LRV */}
          <mesh position={[-0.58, DIORAMA_SURFACE_Y + 0.032, -0.18]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.95, 1.95]} />
            <meshBasicMaterial map={shadowTex} transparent opacity={0.44} depthWrite={false} />
          </mesh>
          <mesh position={[1.28, DIORAMA_SURFACE_Y + 0.032, 0.82]} rotation={[-Math.PI / 2, 0, 0.4]}>
            <planeGeometry args={[1.55, 1.15]} />
            <meshBasicMaterial map={shadowTex} transparent opacity={0.4} depthWrite={false} />
          </mesh>

          {/* Clipped LM Challenger Descent Stage + clean octagonal top cap */}
          <group position={[-0.58, 0, -0.18]} scale={0.88}>
            {children}
            <ClippedLmTopCap baseY={DIORAMA_SURFACE_Y} />
          </group>

          {/* Apollo 17 LRV parked a short distance away */}
          <group position={[1.28, DIORAMA_SURFACE_Y, 0.82]} rotation={[0, -0.78, 0]}>
            <LunarRovingVehicleModel scale={0.56} />
          </group>
        </group>
      ) : null}

      {/* ─── SITE 5: SM-L-005 · GRAIL EBB & FLOW (Mountain slope, two ~5 m craters + dark ejecta, twin ghost holograms) ─── */}
      {slug === "moon-grail" ? (
        <group>
          {/* Sculpted ~2.5 km polar mountain massif crest at top of southern slope (AG-1b #7) */}
          <SculptedLunarMassif
            position={[0, DIORAMA_SURFACE_Y + 0.18, -2.05]}
            rotation={[0, 0.08, 0]}
            width={4.6}
            depth={1.85}
            height={1.42}
            seed={53}
            color="#524E49"
          />

          {/* Crater A (Ebb / GRAIL-A) ~5 m impact crater + faint dark ejecta rays */}
          <mesh
            position={[-0.95, DIORAMA_SURFACE_Y + 0.16, 0.35]}
            rotation={[-Math.PI / 2 + 0.18, 0, 0.2]}
          >
            <planeGeometry args={[1.75, 1.75]} />
            <meshBasicMaterial map={ejectaTex} transparent opacity={0.88} depthWrite={false} />
          </mesh>

          {/* Crater B (Flow / GRAIL-B) ~5 m impact crater + faint dark ejecta rays */}
          <mesh
            position={[1.05, DIORAMA_SURFACE_Y + 0.28, -0.32]}
            rotation={[-Math.PI / 2 + 0.18, 0, -0.4]}
          >
            <planeGeometry args={[1.75, 1.75]} />
            <meshBasicMaterial map={ejectaTex} transparent opacity={0.88} depthWrite={false} />
          </mesh>

          {/* Translucent "Ghost" Holograms of Twin Spacecraft Ebb & Flow above the impact craters */}
          <GrailTwinHolograms reducedMotion={reducedMotion} />
        </group>
      ) : null}
    </group>
  );
}
