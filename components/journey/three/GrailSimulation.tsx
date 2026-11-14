"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState, smoothstep, clamp01 } from "@/lib/scroll/progress";
import { usePerfBudget } from "./perfTier";
import {
  applyWorldTerrainShader,
  blendCorridorHeight,
  type CraterAnchor,
  createNearFieldHorizonGeometry,
  InstancedLandscapeRocks,
} from "./landscapeMaterials";
import { BEAT_POSES, EXHIBIT_PLINTH_ANCHORS } from "./trajectory";
import { grailSimState, subscribeGrailReplay } from "./simulationBus";

const GRAIL_BEAT = 12;
const SIM_DURATION = 14.0;
const GLOBE_LOCAL_POS: [number, number, number] = [0, 38, -36];
const GLOBE_RADIUS = 11.2;
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
  if (d2 > 14.0) return 0;
  const radial = Math.exp(-d2 * 0.72);
  const shoulder = Math.exp(-d2 * 0.38);
  return h * (radial * 0.76 + shoulder * 0.24);
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

const ANCHOR_WORLD = new THREE.Vector3(...EXHIBIT_PLINTH_ANCHORS["moon-grail"].pos);
const REST_CAM_WORLD = new THREE.Vector3(...BEAT_POSES[12].camPos);
const REST_LOOK_WORLD = new THREE.Vector3(...BEAT_POSES[12].camLook);

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
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#081020";
  ctx.fillRect(0, 0, size, size);

  const cols = 6;
  const rows = 10;
  const cw = size / cols;
  const ch = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw;
      const y = r * ch;
      ctx.fillStyle = (r + col) % 2 === 0 ? "#0D172E" : "#0A1326";
      ctx.fillRect(x + 2.5, y + 2.5, cw - 5, ch - 5);

      // Fine interior photovoltaic cell collector grid
      ctx.strokeStyle = "rgba(180, 202, 232, 0.22)";
      ctx.lineWidth = 0.8;
      for (let k = 1; k < 4; k++) {
        const subY = y + (ch * k) / 4;
        ctx.beginPath();
        ctx.moveTo(x + 3, subY);
        ctx.lineTo(x + cw - 3, subY);
        ctx.stroke();
      }

      // Crisp thin silver busbar perimeter around each GaAs cell
      ctx.strokeStyle = "rgba(210, 224, 242, 0.52)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
    }
  }

  // Two vertical silver collector traces
  ctx.fillStyle = "rgba(218, 228, 240, 0.65)";
  ctx.fillRect(size * 0.25 - 1, 0, 2, size);
  ctx.fillRect(size * 0.75 - 1, 0, 2, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cachedGrailSolarTex = tex;
  return tex;
}

let cachedCrinkledGoldNormal: THREE.DataTexture | null = null;
function getCrinkledGoldNormalMap(): THREE.DataTexture {
  if (cachedCrinkledGoldNormal) return cachedCrinkledGoldNormal;
  const S = 256;
  const heights = new Float32Array(S * S);

  // Build angular folded Kapton MLI facets from pseudo-random crease planes
  for (let i = 0; i < 64; i++) {
    const k = i * 97 + 19;
    const fx = (((k * 31) % 100) / 100 - 0.5) * 14.0;
    const fy = (((k * 53) % 100) / 100 - 0.5) * 14.0;
    const phase = ((k * 71) % 360) * (Math.PI / 180);
    const amp = 0.28 + ((k * 13) % 10) * 0.045;
    for (let y = 0; y < S; y++) {
      const v = y / S;
      for (let x = 0; x < S; x++) {
        const u = x / S;
        const w = Math.abs(Math.sin((u * fx + v * fy) * Math.PI * 2 + phase));
        heights[y * S + x] += Math.pow(w, 0.65) * amp;
      }
    }
  }

  const data = new Uint8Array(S * S * 4);
  const strength = 2.6;
  for (let y = 0; y < S; y++) {
    const ym = (y - 1 + S) % S;
    const yp = (y + 1) % S;
    for (let x = 0; x < S; x++) {
      const xm = (x - 1 + S) % S;
      const xp = (x + 1) % S;
      const dx = (heights[y * S + xp] - heights[y * S + xm]) * strength;
      const dy = (heights[yp * S + x] - heights[ym * S + x]) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1.0;
      const inv = 1 / Math.hypot(nx, ny, nz);
      nx *= inv;
      ny *= inv;
      nz *= inv;
      const idx = (y * S + x) * 4;
      data[idx + 0] = Math.round((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  cachedCrinkledGoldNormal = tex;
  return tex;
}

type GrailSharedAssets = {
  goldMliMat: THREE.MeshPhysicalMaterial;
  radiatorMat: THREE.MeshStandardMaterial;
  frameBlackMat: THREE.MeshStandardMaterial;
  aluminumMat: THREE.MeshStandardMaterial;
  goldCollarMat: THREE.MeshStandardMaterial;
  nozzleMat: THREE.MeshStandardMaterial;
  solarMat: THREE.MeshStandardMaterial;
  busGeo: THREE.BoxGeometry;
  frontPlateGeo: THREE.ExtrudeGeometry;
  sidePlateGeo: THREE.ExtrudeGeometry;
  wingGeo: THREE.BoxGeometry;
  wingFrameHGeo: THREE.BoxGeometry;
  wingFrameVGeo: THREE.BoxGeometry;
};

let cachedGrailAssets: GrailSharedAssets | null = null;
function getGrailSharedAssets(): GrailSharedAssets {
  if (cachedGrailAssets) return cachedGrailAssets;

  const goldNormal = getCrinkledGoldNormalMap();
  const solarTex = getGrailSolarTexture();

  const goldMliMat = new THREE.MeshPhysicalMaterial({
    color: "#E4A42B",
    emissive: "#382003",
    emissiveIntensity: 0.16,
    metalness: 0.86,
    roughness: 0.28,
    normalMap: goldNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    anisotropy: 0.65,
    anisotropyRotation: 0.35,
    clearcoat: 0.22,
    clearcoatRoughness: 0.24,
    sheen: 0.35,
    sheenColor: new THREE.Color("#FFE088"),
  });

  const radiatorMat = new THREE.MeshStandardMaterial({
    color: "#ECEFF3",
    roughness: 0.42,
    metalness: 0.08,
  });

  const frameBlackMat = new THREE.MeshStandardMaterial({
    color: "#171B24",
    roughness: 0.56,
    metalness: 0.38,
  });

  const aluminumMat = new THREE.MeshStandardMaterial({
    color: "#C4CDD8",
    roughness: 0.28,
    metalness: 0.85,
  });

  const goldCollarMat = new THREE.MeshStandardMaterial({
    color: "#D99C30",
    roughness: 0.24,
    metalness: 0.9,
  });

  const nozzleMat = new THREE.MeshStandardMaterial({
    color: "#363D49",
    roughness: 0.36,
    metalness: 0.84,
  });

  const solarMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    roughness: 0.24,
    metalness: 0.58,
  });

  const makeChamferPlate = (w: number, h: number, c: number, depth: number) => {
    const hw = w / 2;
    const hh = h / 2;
    const s = new THREE.Shape();
    s.moveTo(-hw + c, -hh);
    s.lineTo(hw - c, -hh);
    s.lineTo(hw, -hh + c);
    s.lineTo(hw, hh - c);
    s.lineTo(hw - c, hh);
    s.lineTo(-hw + c, hh);
    s.lineTo(-hw, hh - c);
    s.lineTo(-hw, -hh + c);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 1,
    });
  };

  cachedGrailAssets = {
    goldMliMat,
    radiatorMat,
    frameBlackMat,
    aluminumMat,
    goldCollarMat,
    nozzleMat,
    solarMat,
    busGeo: new THREE.BoxGeometry(0.95, 1.09, 0.76),
    frontPlateGeo: makeChamferPlate(0.96, 0.64, 0.08, 0.022),
    sidePlateGeo: makeChamferPlate(0.56, 0.66, 0.06, 0.018),
    wingGeo: new THREE.BoxGeometry(1.04, 0.88, 0.028),
    wingFrameHGeo: new THREE.BoxGeometry(1.08, 0.032, 0.042),
    wingFrameVGeo: new THREE.BoxGeometry(0.032, 0.92, 0.042),
  };
  return cachedGrailAssets;
}

/**
 * Procedural PIA14157 / KSC-2011-6345 / PIA12009 / PIA13966 GRAIL Spacecraft (Ebb or Flow).
 * Shared geometry & material assets instanced cleanly between Ebb and Flow:
 * - Washing-machine composite bus (0.95 × 1.09 × 0.76 m) wrapped in crinkled gold MLI
 * - Chamfered white radiator panels, black composite corner rails & mounting brackets
 * - Facing (+Z) gold-ringed Ka-band LGRS ranging horn + bipod feed + instrument deck
 * - Fixed top (+Y) & bottom (−Y) vertical solar wings with silver grid & aluminum frame
 * - Aft (−Z) 22 N main thruster nozzle, 0.8 N RCS corner quads, MoonKAM optical heads
 */
function GrailSpacecraftModel({ assets }: { assets: GrailSharedAssets }) {
  return (
    <group>
      {/* Core washing-machine bus wrapped in crinkled gold MLI (0.95 × 1.09 × 0.76 m) */}
      <mesh geometry={assets.busGeo} material={assets.goldMliMat} />

      {/* Black structural corner edge rails & mounting frame brackets */}
      {[-0.475, 0.475].map((x) =>
        [-0.38, 0.38].map((z) => (
          <mesh key={`vr-${x}-${z}`} position={[x, 0, z]} material={assets.frameBlackMat}>
            <boxGeometry args={[0.045, 1.12, 0.045]} />
          </mesh>
        )),
      )}
      {[-0.545, 0.545].map((y) => (
        <group key={`hr-${y}`} position={[0, y, 0]}>
          {[-0.38, 0.38].map((z) => (
            <mesh key={`hz-${z}`} position={[0, 0, z]} material={assets.frameBlackMat}>
              <boxGeometry args={[0.99, 0.04, 0.042]} />
            </mesh>
          ))}
          {[-0.475, 0.475].map((x) => (
            <mesh key={`hx-${x}`} position={[x, 0, 0]} material={assets.frameBlackMat}>
              <boxGeometry args={[0.042, 0.04, 0.8]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Facing (+Z) Chamfered White Radiator Deck + Gold-Ringed Ka-Band Ranging Horn (PIA12009 / PIA13966) */}
      <group position={[0, 0, 0.385]}>
        <mesh geometry={assets.frontPlateGeo} material={assets.radiatorMat} />

        {/* Central machined gold Ka-band antenna mounting collar & dish ring */}
        <mesh position={[0, 0.02, 0.028]} rotation={[Math.PI / 2, 0, 0]} material={assets.goldCollarMat}>
          <cylinderGeometry args={[0.19, 0.21, 0.028, 28]} />
        </mesh>
        <mesh position={[0, 0.02, 0.044]} material={assets.goldCollarMat}>
          <torusGeometry args={[0.18, 0.02, 12, 32]} />
        </mesh>

        {/* Ka-band conical waveguide horn + flared rim pointing along +Z toward twin mate */}
        <mesh position={[0, 0.02, 0.115]} rotation={[Math.PI / 2, 0, 0]} material={assets.frameBlackMat}>
          <cylinderGeometry args={[0.072, 0.048, 0.14, 20]} />
        </mesh>
        <mesh position={[0, 0.02, 0.175]} material={assets.goldCollarMat}>
          <torusGeometry args={[0.072, 0.011, 10, 24]} />
        </mesh>

        {/* Three carbon-composite antenna feed struts */}
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, si) => (
          <mesh
            key={si}
            position={[Math.cos(ang) * 0.11, 0.02 + Math.sin(ang) * 0.11, 0.095]}
            rotation={[Math.sin(ang) * 0.42, -Math.cos(ang) * 0.42, 0]}
            material={assets.frameBlackMat}
          >
            <cylinderGeometry args={[0.01, 0.01, 0.13, 6]} />
          </mesh>
        ))}

        {/* Small S-band telemetry patch box & star-tracker baffle beside horn */}
        <mesh position={[-0.31, -0.1, 0.04]} material={assets.aluminumMat}>
          <boxGeometry args={[0.11, 0.14, 0.04]} />
        </mesh>
        <mesh position={[0.31, 0.12, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={assets.frameBlackMat}>
          <cylinderGeometry args={[0.04, 0.055, 0.09, 12]} />
        </mesh>
      </group>

      {/* Side (±X) White Louver Radiator Plates & S-band Patches (PIA14157) */}
      {[-1, 1].map((side) => (
        <group
          key={`rad-${side}`}
          position={[side * 0.482, 0, 0]}
          rotation={[0, (side * Math.PI) / 2, 0]}
        >
          <mesh geometry={assets.sidePlateGeo} material={assets.radiatorMat} />
          <mesh position={[0, 0.16, 0.024]} material={assets.aluminumMat}>
            <boxGeometry args={[0.32, 0.16, 0.016]} />
          </mesh>
          <mesh position={[0, -0.15, 0.024]} material={assets.frameBlackMat}>
            <boxGeometry args={[0.26, 0.14, 0.016]} />
          </mesh>
        </group>
      ))}

      {/* Aft (−Z) Wall: 22 N Hydrazine Main Engine Nozzle, MoonKAM Optics & 4 RCS Thrusters */}
      <group position={[0, 0, -0.385]}>
        <mesh position={[0, 0, -0.008]} material={assets.aluminumMat}>
          <cylinderGeometry args={[0.26, 0.28, 0.024, 20]} />
        </mesh>
        <mesh position={[0, 0, -0.09]} rotation={[-Math.PI / 2, 0, 0]} material={assets.nozzleMat}>
          <cylinderGeometry args={[0.06, 0.13, 0.16, 20, 1, true]} />
        </mesh>
        {/* Two compact MoonKAM optical camera heads toward nadir edge */}
        {[-0.24, 0.24].map((kx) => (
          <mesh key={kx} position={[kx, -0.32, -0.04]} rotation={[-Math.PI / 2, 0, 0]} material={assets.frameBlackMat}>
            <cylinderGeometry args={[0.036, 0.044, 0.075, 12]} />
          </mesh>
        ))}
        {/* Four 0.8 N RCS thruster pods */}
        {[-0.36, 0.36].map((rx) =>
          [-0.4, 0.4].map((ry) => (
            <mesh key={`rcs-${rx}-${ry}`} position={[rx, ry, -0.035]} material={assets.nozzleMat}>
              <boxGeometry args={[0.065, 0.065, 0.06]} />
            </mesh>
          )),
        )}
      </group>

      {/* Two Fixed Solar-Array Wings Extending Above (+Y) & Below (−Y) in a Vertical Line */}
      {[-1, 1].map((wy) => (
        <group key={`wing-${wy}`} position={[0, wy * 1.07, -0.04]}>
          {/* Twin machined aluminum structural yoke struts linking wing to bus */}
          {[-0.26, 0.26].map((yx) => (
            <mesh key={yx} position={[yx, -wy * 0.49, 0]} material={assets.aluminumMat}>
              <boxGeometry args={[0.055, 0.14, 0.075]} />
            </mesh>
          ))}
          {/* Central aluminum spine spar */}
          <mesh position={[0, 0, -0.004]} material={assets.aluminumMat}>
            <boxGeometry args={[0.048, 0.9, 0.04]} />
          </mesh>
          {/* Aluminum perimeter frame bars */}
          <mesh position={[0, 0.445, 0]} geometry={assets.wingFrameHGeo} material={assets.aluminumMat} />
          <mesh position={[0, -0.445, 0]} geometry={assets.wingFrameHGeo} material={assets.aluminumMat} />
          <mesh position={[-0.525, 0, 0]} geometry={assets.wingFrameVGeo} material={assets.aluminumMat} />
          <mesh position={[0.525, 0, 0]} geometry={assets.wingFrameVGeo} material={assets.aluminumMat} />
          {/* Dark blue-black GaAs solar array cells with crisp silver grid */}
          <mesh geometry={assets.wingGeo} material={assets.solarMat} />
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
  if (r > radius * 1.9) return 0;
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
  return blendCorridorHeight("moon", ANCHOR_WORLD.x + vx, ANCHOR_WORLD.z + vz, vx, baseSlope + craters);
}

/** Smooth continuous north-polar Goldschmidt mountain slope extending to the horizon (near-field tessellated, zero tracks/boots). */
function createPolarLandscapeGeometry(tier: "high" | "medium" | "low"): THREE.BufferGeometry {
  const segs = tier === "high" ? 192 : tier === "medium" ? 136 : 92;
  return createNearFieldHorizonGeometry(200, segs, getPolarFullHeight);
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
      fadeStart: 74,
      fadeEnd: 96,
      qualityTier: budget.tier,
      moonSunDir: [9.4, 2.85, 4.3],
    });
    return mat;
  }, [budget.tier]);

  const ejectaTex = useMemo(() => getStarburstEjectaTexture(), []);
  const flashTex = useMemo(() => getSoftImpactFlashTexture(), []);
  const grailAssets = useMemo(() => getGrailSharedAssets(), []);
  const terrainGeo = useMemo(() => createPolarLandscapeGeometry(budget.tier), [budget.tier]);

  const ejectaPerImpact = budget.tier === "high" ? 220 : budget.tier === "medium" ? 130 : 48;
  const ballistic = useMemo(() => buildBallisticData(ejectaPerImpact), [ejectaPerImpact]);

  // Sunlit polar orbit frame around GLOBE_LOCAL_POS matching PIA12009 / PIA13966
  const orbitBasis = useMemo(() => {
    const right = new THREE.Vector3(0.2, 0.28, 0.939).normalize();
    const upGuess = new THREE.Vector3(-0.34, 0.93, -0.14);
    const up = upGuess.sub(right.clone().multiplyScalar(upGuess.dot(right))).normalize();
    const normal = new THREE.Vector3().crossVectors(right, up).normalize();
    return { right, up, normal, radius: GLOBE_RADIUS + 1.85 };
  }, []);

  // Swath-painted Moon globe shader uniforms
  const globeUniforms = useMemo(
    () => ({
      uMoonMap: { value: moonTex },
      uGravityMap: { value: gravityTex },
      uBumpMap: { value: moonBump },
      uSweepProgress: { value: 0 },
      uGroundOffset: { value: 0 },
      uGravityMix: { value: 0 },
      uTime: { value: 0 },
      uSkipSwath: { value: isLow ? 1 : 0 },
      uSunDir: { value: new THREE.Vector3(9.4, 2.85, 4.3).normalize() },
    }),
    [moonTex, gravityTex, moonBump, isLow],
  );

  const rangingUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0.92 },
    }),
    [],
  );

  // Refs for animated 3D assemblies
  const globeGroupRef = useRef<THREE.Group>(null);
  const globeMeshRef = useRef<THREE.Mesh>(null);
  const globeMatRef = useRef<THREE.ShaderMaterial>(null);
  const orbiterEbbRef = useRef<THREE.Group>(null);
  const orbiterFlowRef = useRef<THREE.Group>(null);
  const rangingBeamRef = useRef<THREE.Mesh>(null);
  const rangingMatRef = useRef<THREE.ShaderMaterial>(null);
  const orbitRingRef = useRef<THREE.Mesh>(null);

  const craterARef = useRef<THREE.Mesh>(null);
  const craterBRef = useRef<THREE.Mesh>(null);
  const flashARef = useRef<THREE.Sprite>(null);
  const flashBRef = useRef<THREE.Sprite>(null);
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
  const tmpFlowTan = useMemo(() => new THREE.Vector3(), []);
  const tmpFlowRad = useMemo(() => new THREE.Vector3(), []);
  const tmpEbbRad = useMemo(() => new THREE.Vector3(), []);
  const tmpHornA = useMemo(() => new THREE.Vector3(), []);
  const tmpHornB = useMemo(() => new THREE.Vector3(), []);
  const tmpMid = useMemo(() => new THREE.Vector3(), []);
  const tmpDir = useMemo(() => new THREE.Vector3(), []);
  const tmpUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpCamWorld = useMemo(() => new THREE.Vector3(), []);
  const tmpLookWorld = useMemo(() => new THREE.Vector3(), []);
  const tmpPullCam = useMemo(() => new THREE.Vector3(), []);
  const tmpPullLook = useMemo(() => new THREE.Vector3(), []);
  const tmpGlobeCenter = useMemo(() => new THREE.Vector3(...GLOBE_LOCAL_POS), []);

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
      grailSimState.impactIntensity = 0;
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
    const showGlobe = st.playing && t < 7.15;
    if (globeGroupRef.current && globeMatRef.current) {
      globeGroupRef.current.visible = showGlobe;
      if (showGlobe) {
        const orbitIn = smoothstep(0.0, 0.45, t);
        const orbitOut = 1 - smoothstep(5.95, 7.05, t);
        globeGroupRef.current.scale.setScalar((0.88 + 0.12 * orbitIn) * Math.max(0.05, orbitOut));

        // Time-compressed lunar rotation under the sunlit polar orbital plane
        const sweepT = clamp01((t - 0.15) / 4.65);
        const rotAngle = sweepT * Math.PI * 1.65;
        if (globeMeshRef.current) {
          globeMeshRef.current.rotation.y = -Math.PI * 0.48 + rotAngle;
        }
        const uniforms = globeMatRef.current.uniforms;
        uniforms.uGravityMap.value = gravityTex;
        uniforms.uSkipSwath.value = isLow ? 1 : 0;
        uniforms.uGroundOffset.value = 0.28 + sweepT * 0.85;
        uniforms.uSweepProgress.value = sweepT;
        uniforms.uTime.value = t;

        const gravIn = smoothstep(0.08, 0.42, t);
        const gravOut = 1 - smoothstep(5.9, 6.9, t);
        uniforms.uGravityMix.value = gravIn * gravOut;
      }
    }

    if (orbitRingRef.current) {
      orbitRingRef.current.visible = st.playing && t < 6.35;
      if (orbitRingRef.current.visible) {
        const ringMat = orbitRingRef.current.material as THREE.MeshBasicMaterial;
        ringMat.opacity = 0.22 * (1 - smoothstep(5.6, 6.35, t));
      }
    }

    // ─── 2. SPACECRAFT PAIR (Sunlit Mapping Orbit -> Grazing Polar Descent) ───
    const showPair = st.playing && t < 11.9;
    let activeScale = 0.88;
    if (orbiterEbbRef.current && orbiterFlowRef.current) {
      orbiterEbbRef.current.visible = showPair;
      orbiterFlowRef.current.visible = showPair;

      if (showPair) {
        if (t < 6.1) {
          // Near-polar sunlit circular orbit sweeping visibly across front-upper Moon limb (PIA13966 / PIA12009)
          const thetaFlow = 0.12 + t * 0.19;
          const thetaEbb = thetaFlow + 0.42;

          tmpEbbPos
            .copy(orbitBasis.right)
            .multiplyScalar(Math.cos(thetaEbb) * orbitBasis.radius)
            .addScaledVector(orbitBasis.up, Math.sin(thetaEbb) * orbitBasis.radius)
            .add(tmpGlobeCenter);

          tmpFlowPos
            .copy(orbitBasis.right)
            .multiplyScalar(Math.cos(thetaFlow) * orbitBasis.radius)
            .addScaledVector(orbitBasis.up, Math.sin(thetaFlow) * orbitBasis.radius)
            .add(tmpGlobeCenter);

          activeScale = 0.88;
          orbiterEbbRef.current.position.copy(tmpEbbPos);
          orbiterFlowRef.current.position.copy(tmpFlowPos);
          orbiterEbbRef.current.scale.setScalar(activeScale);
          orbiterFlowRef.current.scale.setScalar(activeScale);

          // Align +Y solar wings radially perpendicular to lunar horizon & point +Z Ka horns horn-to-horn
          tmpEbbRad.set(
            tmpEbbPos.x - GLOBE_LOCAL_POS[0],
            tmpEbbPos.y - GLOBE_LOCAL_POS[1],
            tmpEbbPos.z - GLOBE_LOCAL_POS[2],
          ).normalize();
          tmpFlowRad.set(
            tmpFlowPos.x - GLOBE_LOCAL_POS[0],
            tmpFlowPos.y - GLOBE_LOCAL_POS[1],
            tmpFlowPos.z - GLOBE_LOCAL_POS[2],
          ).normalize();

          orbiterEbbRef.current.up.copy(tmpEbbRad);
          orbiterEbbRef.current.lookAt(
            ANCHOR_WORLD.x + tmpFlowPos.x,
            ANCHOR_WORLD.y + tmpFlowPos.y,
            ANCHOR_WORLD.z + tmpFlowPos.z,
          );
          orbiterFlowRef.current.up.copy(tmpFlowRad);
          orbiterFlowRef.current.lookAt(
            ANCHOR_WORLD.x + tmpEbbPos.x,
            ANCHOR_WORLD.y + tmpEbbPos.y,
            ANCHOR_WORLD.z + tmpEbbPos.z,
          );
        } else {
          // Grazing polar descent down north-polar Goldschmidt mountain slope toward craters A and B
          const ebbU = clamp01((t - 6.1) / 5.1);
          const flowU = clamp01((t - 6.75) / 5.1);

          const startEbbX = -4.2;
          const startEbbY = 5.4;
          const startEbbZ = -19.5;
          const endAY = SURFACE_Y + IMPACT_A_LOCAL[1];

          tmpEbbPos.set(
            THREE.MathUtils.lerp(startEbbX, IMPACT_A_LOCAL[0], ebbU),
            THREE.MathUtils.lerp(startEbbY, endAY, Math.pow(ebbU, 0.84)),
            THREE.MathUtils.lerp(startEbbZ, IMPACT_A_LOCAL[2], ebbU),
          );

          const startFlowX = -1.6;
          const startFlowY = 6.2;
          const startFlowZ = -22.2;
          const endBY = SURFACE_Y + IMPACT_B_LOCAL[1];

          tmpFlowPos.set(
            THREE.MathUtils.lerp(startFlowX, IMPACT_B_LOCAL[0], flowU),
            THREE.MathUtils.lerp(startFlowY, endBY, Math.pow(flowU, 0.84)),
            THREE.MathUtils.lerp(startFlowZ, IMPACT_B_LOCAL[2], flowU),
          );

          activeScale = 0.62;
          orbiterEbbRef.current.visible = t < 11.24;
          orbiterFlowRef.current.visible = t < 11.88;
          orbiterEbbRef.current.position.copy(tmpEbbPos);
          orbiterFlowRef.current.position.copy(tmpFlowPos);
          orbiterEbbRef.current.scale.setScalar(activeScale);
          orbiterFlowRef.current.scale.setScalar(activeScale);

          orbiterEbbRef.current.up.set(0, 1, 0);
          orbiterFlowRef.current.up.set(0, 1, 0);
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

    // Thin pulsing bidirectional #6EB8FF Ka-band link beam attached right to the Ka-band antenna horns
    if (rangingBeamRef.current && rangingMatRef.current) {
      const showLink = showPair && t < 11.15;
      rangingBeamRef.current.visible = showLink;
      if (showLink) {
        tmpDir.copy(tmpEbbPos).sub(tmpFlowPos);
        const rawLen = tmpDir.length();
        if (rawLen > 0.25) {
          tmpDir.divideScalar(rawLen);
          const hornOffset = 0.54 * activeScale;
          tmpHornA.copy(tmpFlowPos).addScaledVector(tmpDir, hornOffset);
          tmpHornB.copy(tmpEbbPos).addScaledVector(tmpDir, t < 6.1 ? -hornOffset : -0.35 * activeScale);
          tmpMid.copy(tmpHornA).add(tmpHornB).multiplyScalar(0.5);
          const sep = Math.max(0.1, tmpHornA.distanceTo(tmpHornB));
          tmpQuat.setFromUnitVectors(tmpUp, tmpDir);

          rangingBeamRef.current.position.copy(tmpMid);
          rangingBeamRef.current.quaternion.copy(tmpQuat);
          const beamWidth = 1.0 + smoothstep(4.55, 5.15, t) * 1.45 * (1 - smoothstep(5.95, 6.4, t));
          rangingBeamRef.current.scale.set(beamWidth, sep, beamWidth);

          rangingMatRef.current.uniforms.uTime.value = t;
          const linkFade = t > 10.6 ? 1 - smoothstep(10.6, 11.15, t) : 1;
          rangingMatRef.current.uniforms.uOpacity.value = 0.94 * linkFade;
        } else {
          rangingBeamRef.current.visible = false;
        }
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
    const peak = Math.max(flashA, flashB);
    grailSimState.impactIntensity = peak * 26;
    if (flashB > flashA) {
      grailSimState.impactPos.set(
        ANCHOR_WORLD.x + IMPACT_B_LOCAL[0],
        ANCHOR_WORLD.y + SURFACE_Y + IMPACT_B_LOCAL[1] + 0.35,
        ANCHOR_WORLD.z + IMPACT_B_LOCAL[2],
      );
    } else {
      grailSimState.impactPos.set(
        ANCHOR_WORLD.x + IMPACT_A_LOCAL[0],
        ANCHOR_WORLD.y + SURFACE_Y + IMPACT_A_LOCAL[1] + 0.35,
        ANCHOR_WORLD.z + IMPACT_A_LOCAL[2],
      );
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
      // Smooth blend in at start (0 -> 0.55s) and smooth blend back to resting framing (12.75 -> 13.95s)
      const blendIn = smoothstep(0.0, 0.55, t);
      const blendOut = 1 - smoothstep(12.75, 13.95, t);
      grailSimState.camBlend = blendIn * blendOut;

      // Exact pullback overview local target (shared continuously between 4.55..6.0s and 6.0..7.6s)
      tmpPullLook.set(GLOBE_LOCAL_POS[0], GLOBE_LOCAL_POS[1], GLOBE_LOCAL_POS[2]);
      tmpPullCam
        .copy(tmpPullLook)
        .addScaledVector(orbitBasis.normal, 25.5)
        .addScaledVector(orbitBasis.right, 13.5)
        .addScaledVector(orbitBasis.up, 5.2);

      if (t < 6.0) {
        // Phase 1 (0..4.6s): behind & slightly above Flow looking along Ka-band beam at Ebb + curved Moon (PIA13966)
        // Phase 2 (4.6..6.0s): pull back smoothly to frame the entire painted gravity globe + glowing red mascons
        const thetaFlow = 0.12 + t * 0.19;
        tmpFlowTan
          .copy(orbitBasis.right)
          .multiplyScalar(-Math.sin(thetaFlow))
          .addScaledVector(orbitBasis.up, Math.cos(thetaFlow))
          .normalize();

        tmpCamWorld
          .copy(tmpFlowPos)
          .addScaledVector(tmpFlowTan, -4.25)
          .addScaledVector(tmpFlowRad, 1.05)
          .addScaledVector(orbitBasis.normal, 1.55);

        tmpLookWorld
          .copy(tmpFlowPos)
          .lerp(tmpEbbPos, 0.44)
          .addScaledVector(tmpFlowRad, -0.55);

        const pullU = smoothstep(4.55, 5.15, t);
        if (pullU > 0.001) {
          tmpCamWorld.lerp(tmpPullCam, pullU);
          tmpLookWorld.lerp(tmpPullLook, pullU);
        }
        tmpCamWorld.add(ANCHOR_WORLD);
        tmpLookWorld.add(ANCHOR_WORLD);
      } else if (t < 7.6) {
        // Slew continuously from orbital globe pullback down behind Ebb & Flow descending over the polar ridge
        const u = smoothstep(6.0, 7.6, t);
        tmpCamWorld.set(
          ANCHOR_WORLD.x + THREE.MathUtils.lerp(tmpPullCam.x, -1.8, u),
          ANCHOR_WORLD.y + THREE.MathUtils.lerp(tmpPullCam.y, 5.6, u),
          ANCHOR_WORLD.z + THREE.MathUtils.lerp(tmpPullCam.z, -10.5, u),
        );
        tmpLookWorld.set(
          ANCHOR_WORLD.x + THREE.MathUtils.lerp(tmpPullLook.x, -1.5, u),
          ANCHOR_WORLD.y + THREE.MathUtils.lerp(tmpPullLook.y, 2.8, u),
          ANCHOR_WORLD.z + THREE.MathUtils.lerp(tmpPullLook.z, -9.2, u),
        );
      } else if (t < 11.4) {
        // Low grazing chase camera swooping along north-polar Goldschmidt slope toward Ebb & Flow impacts
        const u = smoothstep(7.6, 11.4, t);
        tmpCamWorld.set(
          ANCHOR_WORLD.x + THREE.MathUtils.lerp(-1.8, 2.85, u),
          ANCHOR_WORLD.y + THREE.MathUtils.lerp(5.6, 2.45, u),
          ANCHOR_WORLD.z + THREE.MathUtils.lerp(-10.5, 5.4, u),
        );
        tmpLookWorld.set(
          ANCHOR_WORLD.x + THREE.MathUtils.lerp(-1.5, -0.1, u),
          ANCHOR_WORLD.y + THREE.MathUtils.lerp(2.8, 0.55, u),
          ANCHOR_WORLD.z + THREE.MathUtils.lerp(-9.2, 0.15, u),
        );
      } else {
        // Pull smoothly into final rest crater slope framing
        const u = smoothstep(11.4, 13.9, t);
        tmpCamWorld.set(
          THREE.MathUtils.lerp(ANCHOR_WORLD.x + 2.85, REST_CAM_WORLD.x, u),
          THREE.MathUtils.lerp(ANCHOR_WORLD.y + 2.45, REST_CAM_WORLD.y, u),
          THREE.MathUtils.lerp(ANCHOR_WORLD.z + 5.4, REST_CAM_WORLD.z, u),
        );
        tmpLookWorld.set(
          THREE.MathUtils.lerp(ANCHOR_WORLD.x - 0.1, REST_LOOK_WORLD.x, u),
          ANCHOR_WORLD.y + THREE.MathUtils.lerp(0.55, REST_LOOK_WORLD.y - ANCHOR_WORLD.y, u),
          THREE.MathUtils.lerp(ANCHOR_WORLD.z + 0.15, REST_LOOK_WORLD.z, u),
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

      {/* Faint non-shadow-casting holographic wireframes indicating Ebb & Flow's final descent trajectories */}
      <group ref={restGhostsRef}>
        {[-1, 1].map((side) => {
          const base = side < 0 ? IMPACT_A_LOCAL : IMPACT_B_LOCAL;
          return (
            <group
              key={side}
              position={[base[0] - 0.32, SURFACE_Y + base[1] + 1.25, base[2] - 0.65]}
              rotation={[0.28, 0.2, -0.08]}
              scale={0.56}
            >
              <mesh name="grail-ghost-bus" castShadow={false} receiveShadow={false}>
                <boxGeometry args={[0.95, 1.09, 0.76]} />
                <meshBasicMaterial
                  color="#9DB8FF"
                  wireframe
                  transparent
                  opacity={0.13}
                  depthWrite={false}
                />
              </mesh>
              <mesh name="grail-ghost-wing-top" position={[0, 1.07, -0.04]} castShadow={false} receiveShadow={false}>
                <boxGeometry args={[1.04, 0.88, 0.03]} />
                <meshBasicMaterial
                  color="#9DB8FF"
                  wireframe
                  transparent
                  opacity={0.11}
                  depthWrite={false}
                />
              </mesh>
              <mesh name="grail-ghost-wing-bot" position={[0, -1.07, -0.04]} castShadow={false} receiveShadow={false}>
                <boxGeometry args={[1.04, 0.88, 0.03]} />
                <meshBasicMaterial
                  color="#9DB8FF"
                  wireframe
                  transparent
                  opacity={0.11}
                  depthWrite={false}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ─── ORBITAL MAPPING STAGE: MOON GLOBE + SWATH-BY-SWATH GRAVITY SHADER + MASCON GLOW ─── */}
      <group ref={globeGroupRef} position={GLOBE_LOCAL_POS} visible={false}>
        <mesh ref={globeMeshRef} rotation={[0, -Math.PI * 0.48, 0]}>
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
              uniform float uTime;
              uniform float uSkipSwath;
              uniform vec3 uSunDir;
              varying vec2 vUv;
              varying vec3 vNormalWorld;

              void main() {
                vec3 moonCol = texture2D(uMoonMap, vUv).rgb;
                vec3 gravRaw = texture2D(uGravityMap, vUv).rgb;
                // Keep SVS 4014 gravity reds & blues vivid under ACES tone mapping
                vec3 gravSat = pow(max(gravRaw, vec3(0.001)), vec3(1.48));

                // Progressive swath-by-swath reveal (18 polar strips painting across rotating globe)
                float reveal = 1.0;
                float scanGlow = 0.0;
                if (uSkipSwath < 0.5) {
                  float progress = clamp(uSweepProgress, 0.0, 1.0);
                  float swathU = floor(vUv.x * 18.0) / 18.0;
                  float delta = fract(uGroundOffset - swathU);
                  reveal = smoothstep(progress + 0.055, progress - 0.015, delta);
                  float distFront = abs(delta - progress);
                  scanGlow = exp(-distFront * 62.0) * step(0.02, progress) * (1.0 - smoothstep(0.94, 1.0, progress));
                }

                float mixAmt = uGravityMix * reveal;
                float NdotL = max(0.09, dot(normalize(vNormalWorld), normalize(uSunDir)));
                vec3 litMoon = moonCol * (0.18 + 0.94 * NdotL);
                vec3 litGrav = gravSat * (0.36 + 0.74 * NdotL);

                // Make lunar mascon positive gravity anomalies glow unmistakably crimson-red
                float redLead = gravRaw.r - max(gravRaw.g * 0.85, gravRaw.b);
                float masconMask = clamp((redLead - 0.12) * 3.5, 0.0, 1.0);
                float masconPulse = 0.88 + 0.12 * sin(uTime * 3.1);
                vec3 masconGlow = vec3(1.35, 0.16, 0.05) * masconMask * masconPulse * mixAmt * 0.72;

                vec3 col = mix(litMoon, litGrav, mixAmt * 0.88) + masconGlow;
                col += vec3(0.55, 0.92, 1.65) * scanGlow * uGravityMix * 0.55;

                gl_FragColor = vec4(col, 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
              }
            `}
          />
        </mesh>

        {/* Subtle polar orbital track ring around Moon globe */}
        <mesh ref={orbitRingRef} rotation={[0, Math.PI / 2, 0]} visible={false}>
          <torusGeometry args={[orbitBasis.radius, 0.02, 8, 96]} />
          <meshBasicMaterial
            color="#9DB8FF"
            transparent
            opacity={0.22}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Active Ebb (GRAIL-A) & Flow (GRAIL-B) Spacecraft Pair (Single model instanced twice via shared assets) */}
      <group ref={orbiterEbbRef} visible={false}>
        <GrailSpacecraftModel assets={grailAssets} />
      </group>
      <group ref={orbiterFlowRef} visible={false}>
        <GrailSpacecraftModel assets={grailAssets} />
      </group>

      {/* Thin pulsing bidirectional blue Ka-band Ranging Link between Ka horns */}
      <mesh ref={rangingBeamRef} visible={false}>
        <cylinderGeometry args={[0.022, 0.022, 1, 10, 32, true]} />
        <shaderMaterial
          ref={rangingMatRef}
          uniforms={rangingUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            uniform float uTime;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vec3 pos = position;
              float env = sin(uv.y * 3.14159265);
              float wave = sin(uv.y * 42.0 - uTime * 11.0) * 0.012 + cos(uv.y * 38.0 + uTime * 11.0) * 0.012;
              pos.x += wave * env;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform float uOpacity;
            varying vec2 vUv;
            void main() {
              float endFade = smoothstep(0.0, 0.06, vUv.y) * (1.0 - smoothstep(0.94, 1.0, vUv.y));
              float fwdPulse = exp(-pow(fract(vUv.y * 2.5 - uTime * 1.8) - 0.5, 2.0) * 34.0);
              float revPulse = exp(-pow(fract(vUv.y * 2.5 + uTime * 1.8 + 0.5) - 0.5, 2.0) * 34.0);
              float carrier = 0.34 + 0.14 * sin(vUv.y * 56.0 - uTime * 14.0);
              float intensity = (carrier + 0.95 * max(fwdPulse, revPulse)) * endFade;
              vec3 col = mix(vec3(0.42, 0.74, 1.45), vec3(0.88, 0.96, 1.8), max(fwdPulse, revPulse));
              gl_FragColor = vec4(col * intensity, intensity * uOpacity);
            }
          `}
        />
      </mesh>
    </group>
  );
}
