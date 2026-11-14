"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

let cachedLrrrPrismTex: THREE.CanvasTexture | null = null;
let cachedBootprintTex: THREE.CanvasTexture | null = null;
let cachedRoverTrackTex: THREE.CanvasTexture | null = null;
let cachedDarkEjectaTex: THREE.CanvasTexture | null = null;
let cachedWireMeshTex: THREE.CanvasTexture | null = null;
let cachedSurveyorSolarTex: THREE.CanvasTexture | null = null;
let cachedSurveyorPlanarTex: THREE.CanvasTexture | null = null;
let cachedSurveyorBoxTex: THREE.CanvasTexture | null = null;

const SURVEYOR_UP = new THREE.Vector3(0, 1, 0);
const UNIT_STRUT_GEO = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false);

type StrutTransform = {
  mid: [number, number, number];
  quat: [number, number, number, number];
  len: number;
  r: number;
};

/** Compute exact midpoint, quaternion, and length connecting vertex `a` to vertex `b`. */
function computeStrut(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  r: number,
): StrutTransform {
  const va = new THREE.Vector3(a[0], a[1], a[2]);
  const vb = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const mid = va.clone().addScaledVector(dir, 0.5);
  const q = new THREE.Quaternion();
  if (len > 1e-5) {
    q.setFromUnitVectors(SURVEYOR_UP, dir.divideScalar(len));
  }
  return {
    mid: [mid.x, mid.y, mid.z],
    quat: [q.x, q.y, q.z, q.w],
    len: Math.max(len, 1e-4),
    r,
  };
}

/** 10×10 corner-cube prism array texture for the Apollo 11 LRRR. */
export function getLrrrPrismTexture(): THREE.CanvasTexture {
  if (cachedLrrrPrismTex) return cachedLrrrPrismTex;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1B2230";
  ctx.fillRect(0, 0, 256, 256);

  const cell = 256 / 10;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const cx = (c + 0.5) * cell;
      const cy = (r + 0.5) * cell;
      const rad = cell * 0.42;

      const grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, rad);
      grad.addColorStop(0, "#D8F4FF");
      grad.addColorStop(0.45, "#5A86B8");
      grad.addColorStop(0.85, "#1E2B3C");
      grad.addColorStop(1, "#0D131D");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();

      // 3-facet corner-cube internal retro-reflection lines
      ctx.strokeStyle = "rgba(220, 245, 255, 0.55)";
      ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI * 2) / 3 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * rad * 0.85, cy + Math.sin(a) * rad * 0.85);
        ctx.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedLrrrPrismTex = tex;
  return tex;
}

/** Procedural astronaut bootprint trail strip texture (ribbed Apollo overshoe soles). */
export function getBootprintTrailTexture(): THREE.CanvasTexture {
  if (cachedBootprintTex) return cachedBootprintTex;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, 512, 128);

  const numSteps = 11;
  for (let i = 0; i < numSteps; i++) {
    const bx = 28 + i * 44;
    const by = i % 2 === 0 ? 44 : 84;
    const angle = (i % 2 === 0 ? 0.08 : -0.08) + Math.sin(i * 1.7) * 0.05;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);

    // Subtle raised rim shadow around bootprint depression
    const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 20);
    halo.addColorStop(0, "rgba(22, 20, 18, 0.78)");
    halo.addColorStop(0.7, "rgba(38, 36, 33, 0.45)");
    halo.addColorStop(1, "rgba(90, 86, 80, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal Apollo boot tread ribs
    ctx.fillStyle = "rgba(15, 14, 12, 0.85)";
    for (let r = -11; r <= 11; r += 4) {
      ctx.fillRect(r - 1.2, -6.5, 2.2, 13);
    }
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  cachedBootprintTex = tex;
  return tex;
}

/** Dual parallel LRV chevron wheel track texture for Apollo 15 & Apollo 17. */
export function getRoverTrackTexture(): THREE.CanvasTexture {
  if (cachedRoverTrackTex) return cachedRoverTrackTex;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, 512, 256);

  const wheelY = [68, 188];
  for (const wy of wheelY) {
    // Dark disturbed regolith rut
    const grad = ctx.createLinearGradient(0, wy - 22, 0, wy + 22);
    grad.addColorStop(0, "rgba(40, 38, 35, 0)");
    grad.addColorStop(0.25, "rgba(24, 22, 20, 0.65)");
    grad.addColorStop(0.5, "rgba(16, 15, 13, 0.82)");
    grad.addColorStop(0.75, "rgba(24, 22, 20, 0.65)");
    grad.addColorStop(1, "rgba(40, 38, 35, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, wy - 22, 512, 44);

    // Titanium chevron tread imprints along the rut
    ctx.strokeStyle = "rgba(10, 9, 8, 0.75)";
    ctx.lineWidth = 2.2;
    for (let x = 8; x < 508; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x - 4, wy - 11);
      ctx.lineTo(x + 3, wy);
      ctx.lineTo(x - 4, wy + 11);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  cachedRoverTrackTex = tex;
  return tex;
}

/** Radial dark ejecta blanket texture for the two ~5 m GRAIL impact craters. */
export function getDarkEjectaTexture(): THREE.CanvasTexture {
  if (cachedDarkEjectaTex) return cachedDarkEjectaTex;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, 256, 256);
  const cx = 128;
  const cy = 128;

  // Dark central crater pit + diffuse ejecta halo
  const core = ctx.createRadialGradient(cx, cy, 4, cx, cy, 115);
  core.addColorStop(0, "rgba(12, 12, 14, 0.95)");
  core.addColorStop(0.28, "rgba(20, 19, 21, 0.82)");
  core.addColorStop(0.55, "rgba(32, 30, 32, 0.42)");
  core.addColorStop(1, "rgba(32, 30, 32, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 256, 256);

  // Asymmetric dark ejecta rays (matching LROC GRAIL impact images)
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2 + Math.sin(i * 3.1) * 0.12;
    const len = 52 + ((i * 37) % 58);
    ctx.strokeStyle = "rgba(16, 15, 17, 0.45)";
    ctx.lineWidth = 2 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 14, cy + Math.sin(angle) * 14);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  cachedDarkEjectaTex = tex;
  return tex;
}

/** Woven wire-mesh + titanium chevron tread texture for LRV wheels. */
function getLrvWheelTexture(): THREE.CanvasTexture {
  if (cachedWireMeshTex) return cachedWireMeshTex;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#5B5852";
  ctx.fillRect(0, 0, 256, 128);

  // Fine zinc-coated woven steel wire mesh
  ctx.strokeStyle = "rgba(180, 184, 192, 0.35)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 256; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 16, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 16, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }

  // Titanium chevron tread strips (~50% coverage)
  ctx.fillStyle = "#8C929E";
  for (let x = 8; x < 256; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x + 7, 64);
    ctx.lineTo(x, 110);
    ctx.lineTo(x + 5, 110);
    ctx.lineTo(x + 12, 64);
    ctx.lineTo(x + 5, 18);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  cachedWireMeshTex = tex;
  return tex;
}

/** 792-cell photovoltaic grid texture with silver busbars and 2.5-year lunar dust-tan weathering for Surveyor 3. */
function getSurveyorSolarTexture(): THREE.CanvasTexture {
  if (cachedSurveyorSolarTex) return cachedSurveyorSolarTex;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#161E2E";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle module sectors (6 × 4 sub-panels) + cell grid
  const cols = 24;
  const rows = 33;
  const pad = 14;
  const cw = (512 - pad * 2) / cols;
  const ch = (512 - pad * 2) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shade = 22 + ((r * 7 + c * 13) % 10);
      ctx.fillStyle = `rgb(${shade}, ${shade + 10}, ${shade + 28})`;
      ctx.fillRect(pad + c * cw + 0.8, pad + r * ch + 0.8, cw - 1.6, ch - 1.6);
    }
  }

  // Silver collector busbars every 6 columns / 11 rows
  ctx.fillStyle = "rgba(195, 202, 212, 0.55)";
  for (let c = 0; c <= cols; c += 6) {
    ctx.fillRect(pad + c * cw - 1, pad, 2, 512 - pad * 2);
  }
  for (let r = 0; r <= rows; r += 11) {
    ctx.fillRect(pad, pad + r * ch - 1, 512 - pad * 2, 2);
  }

  // Aluminum anodized border + light dust-tan film on exposed edges
  ctx.strokeStyle = "#C6C0B4";
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 498, 498);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedSurveyorSolarTex = tex;
  return tex;
}

/** Slotted planar high-gain antenna waveguide array texture with dust-tan aging for Surveyor 3. */
function getSurveyorPlanarTexture(): THREE.CanvasTexture {
  if (cachedSurveyorPlanarTex) return cachedSurveyorPlanarTex;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#DDD6C8";
  ctx.fillRect(0, 0, 512, 512);

  // Fine waveguide slot grid
  ctx.strokeStyle = "rgba(115, 108, 96, 0.36)";
  ctx.lineWidth = 1.2;
  for (let i = 28; i < 484; i += 14) {
    ctx.beginPath();
    ctx.moveTo(i, 24);
    ctx.lineTo(i, 488);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(92, 86, 76, 0.42)";
  for (let y = 30; y < 482; y += 22) {
    for (let x = 32; x < 480; x += 28) {
      ctx.fillRect(x, y, 10, 3);
    }
  }

  // Sun-baked dust-tan outer vignette
  const grad = ctx.createRadialGradient(256, 256, 110, 256, 256, 330);
  grad.addColorStop(0, "rgba(182, 168, 146, 0)");
  grad.addColorStop(1, "rgba(168, 152, 128, 0.35)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "#B8B0A2";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 500, 500);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedSurveyorPlanarTex = tex;
  return tex;
}

/** Thermal compartment white/dust-tan painted finish with diamond radiator louvers (per AS12-48-7121). */
function getSurveyorCompartmentTexture(): THREE.CanvasTexture {
  if (cachedSurveyorBoxTex) return cachedSurveyorBoxTex;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#DFD8CA";
  ctx.fillRect(0, 0, 256, 256);

  // Embossed diagonal stiffening lines & radiator louvers
  ctx.strokeStyle = "rgba(130, 122, 108, 0.42)";
  ctx.lineWidth = 2;
  for (let i = -256; i < 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i + 256, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(105, 98, 86, 0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 240, 240);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedSurveyorBoxTex = tex;
  return tex;
}

/**
 * Distant silhouette/miniature of an Apollo Lunar Module (used on the crater rim for SM-L-002
 * at 155 m and in the background of SM-L-003 at 150 m).
 */
export function DistantApolloLmSilhouette({
  position,
  scale = 0.22,
  includeAscentStage = true,
}: {
  position: [number, number, number];
  scale?: number;
  includeAscentStage?: boolean;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Octagonal descent stage */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.68, 8]} />
        <meshStandardMaterial color="#B88938" roughness={0.45} metalness={0.65} />
      </mesh>
      {/* 4 landing legs + footpads */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const lx = Math.cos(a) * 1.35;
        const lz = Math.sin(a) * 1.35;
        return (
          <group key={i}>
            <mesh position={[lx * 0.72, 0.45, lz * 0.72]} rotation={[Math.sin(a) * 0.52, 0, -Math.cos(a) * 0.52]}>
              <cylinderGeometry args={[0.04, 0.04, 1.15, 6]} />
              <meshStandardMaterial color="#9CA3B0" roughness={0.5} metalness={0.7} />
            </mesh>
            <mesh position={[lx, 0.04, lz]}>
              <cylinderGeometry args={[0.22, 0.24, 0.06, 12]} />
              <meshStandardMaterial color="#8A8E96" roughness={0.6} metalness={0.6} />
            </mesh>
          </group>
        );
      })}
      {/* Ascent stage (still present when Apollo 12 astronauts visited Surveyor 3) */}
      {includeAscentStage ? (
        <group position={[0, 1.35, 0]}>
          <mesh>
            <dodecahedronGeometry args={[0.68, 0]} />
            <meshStandardMaterial color="#B6BDC8" roughness={0.5} metalness={0.6} />
          </mesh>
          {/* Erectable S-band dish antenna beside lander */}
          <mesh position={[1.85, -0.75, 0.4]} rotation={[0.35, 0.4, 0]}>
            <coneGeometry args={[0.38, 0.18, 12, 1, true]} />
            <meshStandardMaterial color="#DCE2EE" roughness={0.4} metalness={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

/**
 * Clean flat octagonal interstage deck cap + gold Kapton foil rim for the clipped Apollo LM
 * descent stage (shared by SM-L-001 Apollo 11 Eagle and SM-L-004 Apollo 17 Challenger).
 */
export function ClippedLmTopCap({ baseY, scale = 1 }: { baseY: number; scale?: number }) {
  return (
    <group position={[0, baseY + 0.765 * scale, 0]} scale={scale}>
      {/* Outer gold Kapton octagonal collar rim */}
      <mesh rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[0.86, 0.88, 0.045, 8]} />
        <meshStandardMaterial color="#C88A2E" roughness={0.38} metalness={0.76} />
      </mesh>
      {/* Flat dark-anodized octagonal interstage structural deck cap */}
      <mesh position={[0, 0.024, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 0.014, 8]} />
        <meshStandardMaterial color="#1D222B" roughness={0.58} metalness={0.68} />
      </mesh>
      {/* Central ascent-engine blast deflector depression & structural cross-ribs */}
      <mesh position={[0, 0.033, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.008, 16]} />
        <meshStandardMaterial color="#12151C" roughness={0.7} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.034, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.31, 0.36, 16]} />
        <meshStandardMaterial color="#9CA3B0" roughness={0.42} metalness={0.78} />
      </mesh>
      {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((rot, idx) => (
        <mesh key={idx} position={[0, 0.032, 0]} rotation={[0, rot, 0]}>
          <boxGeometry args={[1.56, 0.01, 0.028]} />
          <meshStandardMaterial color="#6C7380" roughness={0.45} metalness={0.75} />
        </mesh>
      ))}
      {/* Conical descent engine bell underneath center bay */}
      <mesh position={[0, -0.54, 0]}>
        <cylinderGeometry args={[0.21, 0.33, 0.3, 16, 1, true]} />
        <meshStandardMaterial color="#2A2F3A" roughness={0.5} metalness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * Apollo 11 (SM-L-001) specific props per REF_MOON.md:
 * 1. Top octagonal interstage deck cap + Kapton foil accents on the clipped LM Eagle descent stage
 * 2. Forward leg egress platform + 9-rung ladder + commemorative plaque plate behind the ladder (no text)
 * 3. EASEP package (~17 m south, scaled into diorama foreground): square gold-Kapton body, two canted east/west solar panels, short cylindrical antenna mast
 * 4. LRRR (~5 m NNW of EASEP): flat tilted stand with 10×10 corner-cube prism array (no power, no cables) + faint 532 nm green laser line from the sky
 */
export function Apollo11SiteProps({ baseY, lmScale = 1 }: { baseY: number; lmScale?: number }) {
  const prismTex = useMemo(() => getLrrrPrismTexture(), []);
  const laserRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    if (!laserRef.current) return;
    elapsedRef.current += Math.min(delta, 0.05);
    const mat = laserRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.24 + Math.sin(elapsedRef.current * 3.2) * 0.06;
  });

  return (
    <group position={[0, baseY, 0]}>
      {/* 1. Clipped LM Descent Stage Top-Deck Structural Cap & Gold Kapton Thermal Foil Rim */}
      <ClippedLmTopCap baseY={0} scale={lmScale} />

      {/* 2. Forward Leg Egress Platform, 9-Rung Ladder & Commemorative Plaque Plate */}
      <group position={[0, 0, 0.95 * lmScale]} scale={lmScale}>
        {/* Small egress porch platform at top of forward leg */}
        <mesh position={[0, 0.96, -0.08]}>
          <boxGeometry args={[0.26, 0.03, 0.28]} />
          <meshStandardMaterial color="#C7CDD8" roughness={0.4} metalness={0.78} />
        </mesh>
        {/* Ladder side rails */}
        {[-0.08, 0.08].map((rx, ri) => (
          <mesh key={ri} position={[rx, 0.52, 0.14]} rotation={[-0.36, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.94, 6]} />
            <meshStandardMaterial color="#D6DCE6" roughness={0.35} metalness={0.82} />
          </mesh>
        ))}
        {/* 9 Ladder rungs */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((ri) => {
          const t = ri / 8;
          const ry = 0.14 + t * 0.76;
          const rz = 0.28 - t * 0.29;
          return (
            <mesh key={ri} position={[0, ry, rz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.006, 0.006, 0.16, 6]} />
              <meshStandardMaterial color="#DCE2EC" roughness={0.35} metalness={0.85} />
            </mesh>
          );
        })}
        {/* Commemorative plaque plate mounted on the strut behind the ladder (small curved metal plate, no text) */}
        <mesh position={[0, 0.58, 0.09]} rotation={[-0.36, 0, 0]}>
          <boxGeometry args={[0.11, 0.075, 0.008]} />
          <meshStandardMaterial color="#E4E9F2" roughness={0.22} metalness={0.92} />
        </mesh>
      </group>

      {/* 3. EASEP Package (Passive Seismic Experiment — south of LM) */}
      <group position={[-1.05, 0.02, 3.85]} rotation={[0, 0.25, 0]} scale={1.35}>
        {/* Square thermal base skirt */}
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[0.38, 0.04, 0.38]} />
          <meshStandardMaterial color="#C88E32" roughness={0.38} metalness={0.78} />
        </mesh>
        {/* Central cylindrical gold-Kapton experiment housing */}
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.18, 16]} />
          <meshStandardMaterial color="#D49636" roughness={0.32} metalness={0.84} />
        </mesh>
        {/* Two canted rectangular solar panels facing East and West */}
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.24, 0.09, 0]}
            rotation={[0, 0, -side * 0.58]}
          >
            <mesh>
              <boxGeometry args={[0.26, 0.012, 0.34]} />
              <meshStandardMaterial color="#1F2D46" roughness={0.28} metalness={0.72} />
            </mesh>
            <mesh position={[0, 0.007, 0]}>
              <boxGeometry args={[0.27, 0.004, 0.35]} />
              <meshStandardMaterial color="#C8D0DC" roughness={0.35} metalness={0.8} wireframe />
            </mesh>
          </group>
        ))}
        {/* Short cylindrical telemetry antenna mast */}
        <mesh position={[0.03, 0.31, -0.04]} rotation={[-0.18, 0, 0.12]}>
          <cylinderGeometry args={[0.01, 0.014, 0.28, 8]} />
          <meshStandardMaterial color="#E6ECF5" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* 4. LRRR (Laser Ranging Retroreflector — ~5 m NNW of EASEP, 10×10 corner-cube array, no cables) */}
      <group position={[-2.15, 0.02, 3.15]} rotation={[0, 0.42, 0]} scale={1.35}>
        {/* Compact stand & white thermal pallet base */}
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.34, 0.07, 0.32]} />
          <meshStandardMaterial color="#DCE2EE" roughness={0.42} metalness={0.58} />
        </mesh>
        {/* Tilted 10×10 Corner-Cube Prism Array frame (aimed toward Earth) */}
        <group position={[0, 0.11, 0.01]} rotation={[-0.46, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 0.026, 0.3]} />
            <meshStandardMaterial color="#B8C2D2" roughness={0.32} metalness={0.82} />
          </mesh>
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.27, 0.27]} />
            <meshStandardMaterial
              map={prismTex}
              roughness={0.14}
              metalness={0.92}
              emissive="#2CE878"
              emissiveIntensity={0.22}
            />
          </mesh>
        </group>

        {/* Faint thin 532 nm green laser ranging line coming down from the sky */}
        <mesh ref={laserRef} position={[0, 2.85, 1.38]} rotation={[0.45, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.016, 6.2, 8, 1, true]} />
          <meshBasicMaterial
            color={[0.55, 2.5, 1.05]}
            toneMapped={false}
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Subtle green retro-reflection glint on the prism face */}
        <mesh position={[0, 0.13, 0.02]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial
            color={[0.75, 2.8, 1.35]}
            toneMapped={false}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * SM-L-002 · Surveyor 3 procedural 3D model per REF_MOON.md, NSSDCA 1967-035A, & AS12-48-7133 / 7121:
 * - ~3.0 m tall tetrahedral aluminum space-frame with exact vertex-jointed lower/mid triangles & diagonal braces
 * - Continuous central mast rising through machined apex collar & guy-strut sleeve to AOPP masthead gimbal
 * - Dual top flat panels hinged directly onto AOPP yoke: 0.855 m² (792-cell) solar panel + slotted planar HGA
 * - 3 splayed hinged A-frame landing legs with telescoping shock absorbers, crush blocks & compact (~0.32 m) footpads
 * - Grounded accurately onto crater slope (`groundHeightFn`) so all 3 footpads sit flush on regolith
 * - Thermal Compartments A & B with louvered covers, 3 internal propellant spheres, 2 hinged omni booms
 * - Empty TV camera pedestal mount (camera head removed by Apollo 12) + 5-bay pantograph sampler arm WITHOUT scoop
 */
export function Surveyor3Model({
  scale = 0.92,
  groundHeightFn,
}: {
  scale?: number;
  groundHeightFn?: (localX: number, localZ: number) => number;
}) {
  const solarTex = useMemo(() => getSurveyorSolarTexture(), []);
  const planarTex = useMemo(() => getSurveyorPlanarTexture(), []);
  const boxTex = useMemo(() => getSurveyorCompartmentTexture(), []);

  // Crater inner slope matches getMoonTerrainHeight("moon-surveyor-3") near origin: dy/dx = +0.0741, dy/dz = -0.0855
  const slopeRx = 0.0855;
  const slopeRz = 0.0741;

  const rig = useMemo(() => {
    const legAngles = [
      (62 * Math.PI) / 180,  // Leg 0: foreground-right (AS12-48-7133 foreground leg)
      (182 * Math.PI) / 180, // Leg 1: far-left
      (302 * Math.PI) / 180, // Leg 2: back-right
    ];

    const rBase = 0.66;
    const yBase = 0.56;
    const apex: [number, number, number] = [0, 1.82, 0];
    const mastBottom: [number, number, number] = [0, yBase, 0];
    const mastTop: [number, number, number] = [0, 2.78, 0];
    const mastGuyCollar: [number, number, number] = [0, 2.12, 0];

    const baseVerts: [number, number, number][] = legAngles.map((a) => [
      Math.cos(a) * rBase,
      yBase,
      Math.sin(a) * rBase,
    ]);
    const lerp3 = (
      p0: readonly [number, number, number],
      p1: readonly [number, number, number],
      t: number,
    ): [number, number, number] => [
      p0[0] + (p1[0] - p0[0]) * t,
      p0[1] + (p1[1] - p0[1]) * t,
      p0[2] + (p1[2] - p0[2]) * t,
    ];

    const midVerts = baseVerts.map((b) => lerp3(b, apex, 0.54));
    const guyNodes = baseVerts.map((b) => lerp3(b, apex, 0.68));
    const upperShockNodes = baseVerts.map((b) => lerp3(b, apex, 0.44));

    // Transform helper to align footpads flush on actual curved lunar terrain
    const bodyEuler = new THREE.Euler(slopeRx, 0, slopeRz, "XYZ");
    const bodyQuat = new THREE.Quaternion().setFromEuler(bodyEuler);
    const bodyMat = new THREE.Matrix4().compose(
      new THREE.Vector3(0, 0, 0),
      bodyQuat,
      new THREE.Vector3(scale, scale, scale),
    );
    const invBodyMat = bodyMat.clone().invert();
    const rPad = 1.84;

    const padData = legAngles.map((a, idx) => {
      const fx = Math.cos(a) * rPad;
      const fz = Math.sin(a) * rPad;
      const prelimWorld = new THREE.Vector3(fx, 0, fz).applyMatrix4(bodyMat);
      const terrainY = groundHeightFn ? groundHeightFn(prelimWorld.x, prelimWorld.z) : prelimWorld.y;
      const localContact = new THREE.Vector3(prelimWorld.x, terrainY + 0.004, prelimWorld.z).applyMatrix4(invBodyMat);

      const padCenter: [number, number, number] = [localContact.x, localContact.y + 0.044, localContact.z];
      const ankle: [number, number, number] = [localContact.x, localContact.y + 0.1, localContact.z];
      const b = baseVerts[idx];
      const tx = -Math.sin(a);
      const tz = Math.cos(a);
      const bLeft: [number, number, number] = [b[0] - tx * 0.11, b[1], b[2] - tz * 0.11];
      const bRight: [number, number, number] = [b[0] + tx * 0.11, b[1], b[2] + tz * 0.11];
      const aLeft: [number, number, number] = [ankle[0] - tx * 0.032, ankle[1], ankle[2] - tz * 0.032];
      const aRight: [number, number, number] = [ankle[0] + tx * 0.032, ankle[1], ankle[2] + tz * 0.032];
      const shockLow = lerp3(b, ankle, 0.65);

      return { a, padCenter, ankle, bLeft, bRight, aLeft, aRight, shockLow };
    });

    // Primary aluminum structural frame struts (zero disconnected tubes)
    const aluStruts: StrutTransform[] = [];
    for (let i = 0; i < 3; i++) {
      const next = (i + 1) % 3;
      // Lower triangle edge + inner hub cross-spider + tripod main column
      aluStruts.push(computeStrut(baseVerts[i], baseVerts[next], 0.024));
      aluStruts.push(computeStrut(baseVerts[i], mastBottom, 0.02));
      aluStruts.push(computeStrut(baseVerts[i], apex, 0.025));
      // Mid triangle collar + diagonal truss brace across each face
      aluStruts.push(computeStrut(midVerts[i], midVerts[next], 0.017));
      aluStruts.push(computeStrut(baseVerts[i], midVerts[next], 0.015));
      // Mast guy brace from tripod node to mast collar
      aluStruts.push(computeStrut(guyNodes[i], mastGuyCollar, 0.015));

      // Leg A-frame twin booms + hinge pin + two cross-ties + honeycomb block hanger
      const pd = padData[i];
      aluStruts.push(computeStrut(pd.bLeft, pd.bRight, 0.018));
      aluStruts.push(computeStrut(pd.bLeft, pd.aLeft, 0.022));
      aluStruts.push(computeStrut(pd.bRight, pd.aRight, 0.022));
      aluStruts.push(computeStrut(lerp3(pd.bLeft, pd.aLeft, 0.42), lerp3(pd.bRight, pd.aRight, 0.42), 0.015));
      aluStruts.push(computeStrut(lerp3(pd.bLeft, pd.aLeft, 0.72), lerp3(pd.bRight, pd.aRight, 0.72), 0.015));
      aluStruts.push(computeStrut(baseVerts[i], [baseVerts[i][0], baseVerts[i][1] - 0.13, baseVerts[i][2]], 0.02));
    }

    // Telescoping shock absorbers (upper barrel + lower piston along exact joint axis)
    const shockBarrels: StrutTransform[] = [];
    const shockPistons: StrutTransform[] = [];
    for (let i = 0; i < 3; i++) {
      const u = upperShockNodes[i];
      const l = padData[i].shockLow;
      shockBarrels.push(computeStrut(u, lerp3(u, l, 0.56), 0.025));
      shockPistons.push(computeStrut(lerp3(u, l, 0.44), l, 0.016));
    }

    // Continuous central mast + AOPP masthead gimbal crossbar (panel braces live inside each hinge group)
    const mastStruts: StrutTransform[] = [
      computeStrut(mastBottom, apex, 0.036),
      computeStrut(apex, mastTop, 0.033),
      computeStrut([-0.09, 2.8, 0.01], [0.09, 2.84, 0.01], 0.028),
    ];

    // 2 Folding Omnidirectional Conical Antenna Booms hinged at Frame Corners 1 & 2
    const omniConfigs = [
      { base: baseVerts[1], elbow: [-1.1, 1.02, -0.28] as const, tip: [-1.46, 1.42, -0.44] as const },
      { base: baseVerts[2], elbow: [0.68, 1.04, -1.04] as const, tip: [0.88, 1.44, -1.36] as const },
    ];
    const omniStruts: StrutTransform[] = [];
    for (const o of omniConfigs) {
      const hinge: [number, number, number] = [o.base[0], o.base[1] + 0.16, o.base[2]];
      omniStruts.push(computeStrut(o.base, hinge, 0.016));
      omniStruts.push(computeStrut(hinge, o.elbow, 0.013));
      omniStruts.push(computeStrut(o.elbow, o.tip, 0.011));
    }

    // Empty TV Camera Pedestal mount clamped onto Leg 0's upper tripod strut
    const camAnchor = lerp3(baseVerts[0], apex, 0.56);
    const camPedestalBase: [number, number, number] = [camAnchor[0] + 0.08, camAnchor[1] - 0.06, camAnchor[2] + 0.13];
    const camBracketStrut = computeStrut(camAnchor, camPedestalBase, 0.016);

    // 5-Bay Pin-Jointed Pantograph Surface Sampler Arm WITHOUT Scoop (extending outward along +18 deg azimuth)
    const pDirX = Math.cos(0.3);
    const pDirZ = Math.sin(0.3);
    const pOrigin: [number, number, number] = [0.56 * Math.cos(0.3), 0.74, 0.56 * Math.sin(0.3)];
    const frameTie = lerp3(baseVerts[0], baseVerts[2], 0.42);
    const pantoStruts: StrutTransform[] = [computeStrut(frameTie, pOrigin, 0.016)];
    const pantoPins: [number, number, number][] = [pOrigin];
    const bayStep = 0.22;
    const halfH = 0.105;
    for (let b = 0; b < 5; b++) {
      const d0 = b * bayStep;
      const d1 = (b + 1) * bayStep;
      const dMid = (d0 + d1) * 0.5;
      const drop0 = d0 * 0.22;
      const drop1 = d1 * 0.22;
      const dropMid = dMid * 0.22;
      const top0: [number, number, number] = [pOrigin[0] + pDirX * d0, pOrigin[1] + halfH - drop0, pOrigin[2] + pDirZ * d0];
      const bot0: [number, number, number] = [pOrigin[0] + pDirX * d0, pOrigin[1] - halfH - drop0, pOrigin[2] + pDirZ * d0];
      const top1: [number, number, number] = [pOrigin[0] + pDirX * d1, pOrigin[1] + halfH - drop1, pOrigin[2] + pDirZ * d1];
      const bot1: [number, number, number] = [pOrigin[0] + pDirX * d1, pOrigin[1] - halfH - drop1, pOrigin[2] + pDirZ * d1];
      const centerPin: [number, number, number] = [pOrigin[0] + pDirX * dMid, pOrigin[1] - dropMid, pOrigin[2] + pDirZ * dMid];
      pantoStruts.push(computeStrut(top0, bot1, 0.008));
      pantoStruts.push(computeStrut(bot0, top1, 0.008));
      pantoPins.push(top1, bot1, centerPin);
    }
    const pEnd = 5 * bayStep;
    const pTip: [number, number, number] = [
      pOrigin[0] + pDirX * pEnd,
      pOrigin[1] - pEnd * 0.22,
      pOrigin[2] + pDirZ * pEnd,
    ];
    pantoStruts.push(
      computeStrut([pTip[0], pTip[1] + halfH, pTip[2]], pTip, 0.009),
      computeStrut([pTip[0], pTip[1] - halfH, pTip[2]], pTip, 0.009),
    );

    return {
      baseVerts,
      midVerts,
      guyNodes,
      apex,
      mastGuyCollar,
      mastTop,
      padData,
      aluStruts,
      shockBarrels,
      shockPistons,
      mastStruts,
      omniConfigs,
      omniStruts,
      camPedestalBase,
      camBracketStrut,
      pOrigin,
      pantoStruts,
      pantoPins,
      pTip,
    };
  }, [scale, groundHeightFn]);

  return (
    <group rotation={[slopeRx, 0, slopeRz]} scale={scale}>
      {/* Bare aluminum spaceframe struts, mid-ring, diagonal braces, leg A-frames & mast guys */}
      {rig.aluStruts.map((s, i) => (
        <mesh
          key={`alu-${i}`}
          position={s.mid}
          quaternion={s.quat}
          scale={[s.r, s.len, s.r]}
          geometry={UNIT_STRUT_GEO}
          castShadow
        >
          <meshStandardMaterial color="#CFC9BC" roughness={0.46} metalness={0.62} />
        </mesh>
      ))}

      {/* Continuous central mast & AOPP masthead gimbal struts */}
      {rig.mastStruts.map((s, i) => (
        <mesh
          key={`mast-${i}`}
          position={s.mid}
          quaternion={s.quat}
          scale={[s.r, s.len, s.r]}
          geometry={UNIT_STRUT_GEO}
          castShadow
        >
          <meshStandardMaterial color="#D6D0C4" roughness={0.44} metalness={0.58} />
        </mesh>
      ))}

      {/* Machined joint hubs: 3 lower clevises, 3 mid hubs, apex hub collar, guy-strut sleeve & AOPP gearbox */}
      {rig.baseVerts.map((v, i) => (
        <group key={`hub-${i}`}>
          <mesh position={v}>
            <sphereGeometry args={[0.044, 10, 8]} />
            <meshStandardMaterial color="#9BA2AE" roughness={0.36} metalness={0.78} />
          </mesh>
          <mesh position={rig.midVerts[i]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshStandardMaterial color="#A8AEB8" roughness={0.38} metalness={0.74} />
          </mesh>
          {/* Crushable honeycomb impact damper drum beneath each lower spaceframe corner */}
          <mesh position={[v[0], v[1] - 0.14, v[2]]} castShadow>
            <cylinderGeometry args={[0.095, 0.095, 0.14, 14]} />
            <meshStandardMaterial color="#C8C0B0" roughness={0.58} metalness={0.35} />
          </mesh>
        </group>
      ))}
      <mesh position={rig.apex}>
        <cylinderGeometry args={[0.068, 0.072, 0.12, 12]} />
        <meshStandardMaterial color="#9BA2AE" roughness={0.36} metalness={0.78} />
      </mesh>
      <mesh position={rig.mastGuyCollar}>
        <cylinderGeometry args={[0.056, 0.056, 0.075, 12]} />
        <meshStandardMaterial color="#9BA2AE" roughness={0.36} metalness={0.78} />
      </mesh>
      <mesh position={rig.mastTop} castShadow>
        <cylinderGeometry args={[0.065, 0.062, 0.12, 14]} />
        <meshStandardMaterial color="#AEB4BE" roughness={0.38} metalness={0.72} />
      </mesh>

      {/* Telescoping shock absorber barrels & polished chrome piston shafts */}
      {rig.shockBarrels.map((s, i) => (
        <mesh
          key={`sb-${i}`}
          position={s.mid}
          quaternion={s.quat}
          scale={[s.r, s.len, s.r]}
          geometry={UNIT_STRUT_GEO}
          castShadow
        >
          <meshStandardMaterial color="#D6CFC2" roughness={0.5} metalness={0.45} />
        </mesh>
      ))}
      {rig.shockPistons.map((s, i) => (
        <mesh
          key={`sp-${i}`}
          position={s.mid}
          quaternion={s.quat}
          scale={[s.r, s.len, s.r]}
          geometry={UNIT_STRUT_GEO}
          castShadow
        >
          <meshStandardMaterial color="#A8B0BC" roughness={0.28} metalness={0.85} />
        </mesh>
      ))}

      {/* 3 Compact Crushable Round Footpads (~0.32 m diameter) seated flush on crater regolith */}
      {rig.padData.map((pd, i) => (
        <group key={`pad-${i}`}>
          {/* Ankle clevis fork */}
          <mesh position={pd.ankle}>
            <sphereGeometry args={[0.042, 10, 8]} />
            <meshStandardMaterial color="#959CA8" roughness={0.38} metalness={0.76} />
          </mesh>
          {/* Crushable beveled round dish footpad */}
          <mesh position={pd.padCenter} castShadow receiveShadow>
            <cylinderGeometry args={[0.145, 0.165, 0.088, 18]} />
            <meshStandardMaterial color="#C8C0B2" roughness={0.68} metalness={0.34} />
          </mesh>
          {/* Inner upper aluminum retainer ring */}
          <mesh position={[pd.padCenter[0], pd.padCenter[1] + 0.042, pd.padCenter[2]]}>
            <cylinderGeometry args={[0.105, 0.12, 0.018, 16]} />
            <meshStandardMaterial color="#B5ADA0" roughness={0.55} metalness={0.52} />
          </mesh>
        </group>
      ))}

      {/* Thermal Compartment A (left-front face 0-1, angled louvered thermal cover per AS12-48-7133) */}
      <group position={[-0.25, 0.78, 0.36]} rotation={[0, 0.56, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.56, 0.38, 0.34]} />
          <meshStandardMaterial map={boxTex} color="#E2DBD0" roughness={0.56} metalness={0.18} />
        </mesh>
        {/* Pitched top thermal radiator hood */}
        <mesh position={[0, 0.21, 0]} rotation={[0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.58, 0.055, 0.36]} />
          <meshStandardMaterial map={boxTex} color="#E7E1D6" roughness={0.52} metalness={0.2} />
        </mesh>
      </group>

      {/* Thermal Compartment B (right-back face 2-0, angled companion thermal cover) */}
      <group position={[0.42, 0.76, -0.18]} rotation={[0, -0.46, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.35, 0.32]} />
          <meshStandardMaterial map={boxTex} color="#DDD6CA" roughness={0.58} metalness={0.18} />
        </mesh>
        <mesh position={[0, 0.195, 0]} rotation={[0.16, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.05, 0.34]} />
          <meshStandardMaterial map={boxTex} color="#E3DDD2" roughness={0.52} metalness={0.2} />
        </mesh>
      </group>

      {/* 3 Spherical Vernier Propellant / Helium Tanks tucked inside base spaceframe */}
      {[
        [0.14, 0.72, 0.22],
        [-0.24, 0.72, 0.02],
        [0.12, 0.72, -0.24],
      ].map(([tx, ty, tz], ti) => (
        <mesh key={`tank-${ti}`} position={[tx, ty, tz]} castShadow>
          <sphereGeometry args={[0.135, 14, 12]} />
          <meshStandardMaterial color="#C8C2B8" roughness={0.34} metalness={0.76} />
        </mesh>
      ))}

      {/* Planar High-Gain Antenna hinged directly onto left AOPP yoke arm (NO floating gap) */}
      <group position={[-0.08, 2.8, 0.01]} rotation={[0, 0.76, 0]}>
        <group rotation={[0, 0, 1.02]}>
          {/* Hinge knuckle attached directly at AOPP crossbar end */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.034, 0.034, 0.18, 10]} />
            <meshStandardMaterial color="#9BA2AE" roughness={0.36} metalness={0.76} />
          </mesh>
          {/* Twin mounting arms connecting AOPP hinge to planar array board */}
          <mesh position={[-0.24, -0.025, 0.18]}>
            <boxGeometry args={[0.48, 0.026, 0.026]} />
            <meshStandardMaterial color="#C8C2B6" roughness={0.45} metalness={0.62} />
          </mesh>
          <mesh position={[-0.24, -0.025, -0.18]}>
            <boxGeometry args={[0.48, 0.026, 0.026]} />
            <meshStandardMaterial color="#C8C2B6" roughness={0.45} metalness={0.62} />
          </mesh>
          {/* Flat perforated planar waveguide array board (0.92 × 0.90 m) */}
          <mesh position={[-0.47, 0.005, 0]} castShadow>
            <boxGeometry args={[0.92, 0.03, 0.9]} />
            <meshStandardMaterial map={planarTex} color="#E4DDD0" roughness={0.5} metalness={0.28} />
          </mesh>
          {/* Coaxial waveguide feed box on shadowed back */}
          <mesh position={[-0.47, -0.035, 0]}>
            <boxGeometry args={[0.24, 0.055, 0.24]} />
            <meshStandardMaterial color="#A8AEB8" roughness={0.42} metalness={0.68} />
          </mesh>
        </group>
      </group>

      {/* Flat 792-Cell Solar Panel (0.855 m²) hinged directly onto right AOPP yoke arm */}
      <group position={[0.08, 2.84, 0.01]} rotation={[0.24, -0.32, -0.42]}>
        {/* Hinge knuckle */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.034, 0.034, 0.2, 10]} />
          <meshStandardMaterial color="#9BA2AE" roughness={0.36} metalness={0.76} />
        </mesh>
        {/* Yoke support rails connecting hinge directly to underside */}
        <mesh position={[0.22, -0.022, 0.16]}>
          <boxGeometry args={[0.44, 0.024, 0.026]} />
          <meshStandardMaterial color="#C8C2B6" roughness={0.44} metalness={0.62} />
        </mesh>
        <mesh position={[0.22, -0.022, -0.16]}>
          <boxGeometry args={[0.44, 0.024, 0.026]} />
          <meshStandardMaterial color="#C8C2B6" roughness={0.44} metalness={0.62} />
        </mesh>
        {/* Top photovoltaic 792-cell panel */}
        <mesh position={[0.48, 0.02, 0]} castShadow>
          <boxGeometry args={[0.94, 0.02, 0.86]} />
          <meshStandardMaterial map={solarTex} roughness={0.3} metalness={0.64} />
        </mesh>
        {/* Aluminum backing plate + perimeter bezel */}
        <mesh position={[0.48, 0.004, 0]} castShadow>
          <boxGeometry args={[0.96, 0.012, 0.88]} />
          <meshStandardMaterial color="#D4CEC2" roughness={0.48} metalness={0.55} />
        </mesh>
        {/* Structural aluminum lattice backing ribs (clearly visible underside in AS12-48-7121) */}
        {[-0.28, 0, 0.28].map((rz) => (
          <mesh key={`ribz-${rz}`} position={[0.48, -0.012, rz]}>
            <boxGeometry args={[0.92, 0.022, 0.024]} />
            <meshStandardMaterial color="#C8C2B6" roughness={0.44} metalness={0.62} />
          </mesh>
        ))}
        {[0.18, 0.48, 0.78].map((rx) => (
          <mesh key={`ribx-${rx}`} position={[rx, -0.012, 0]}>
            <boxGeometry args={[0.024, 0.022, 0.84]} />
            <meshStandardMaterial color="#C8C2B6" roughness={0.44} metalness={0.62} />
          </mesh>
        ))}
      </group>

      {/* 2 Conical Omnidirectional Antennas on hinged folding booms */}
      {rig.omniStruts.map((s, i) => (
        <mesh
          key={`omni-s-${i}`}
          position={s.mid}
          quaternion={s.quat}
          scale={[s.r, s.len, s.r]}
          geometry={UNIT_STRUT_GEO}
          castShadow
        >
          <meshStandardMaterial color="#CCC6BA" roughness={0.46} metalness={0.58} />
        </mesh>
      ))}
      {rig.omniConfigs.map((o, i) => (
        <group key={`omni-head-${i}`}>
          <mesh position={o.elbow}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshStandardMaterial color="#9BA2AE" roughness={0.38} metalness={0.76} />
          </mesh>
          <mesh position={[o.tip[0], o.tip[1] + 0.055, o.tip[2]]} castShadow>
            <coneGeometry args={[0.058, 0.13, 12]} />
            <meshStandardMaterial color="#DDD6CA" roughness={0.45} metalness={0.42} />
          </mesh>
          <mesh position={[o.tip[0], o.tip[1] + 0.15, o.tip[2]]}>
            <cylinderGeometry args={[0.005, 0.005, 0.08, 6]} />
            <meshStandardMaterial color="#AEB4BE" roughness={0.32} metalness={0.82} />
          </mesh>
        </group>
      ))}

      {/* Empty TV Survey Camera Turret Mount clamped on Leg 0 tripod strut (NO camera head / mirror hood) */}
      <mesh
        position={rig.camBracketStrut.mid}
        quaternion={rig.camBracketStrut.quat}
        scale={[rig.camBracketStrut.r, rig.camBracketStrut.len, rig.camBracketStrut.r]}
        geometry={UNIT_STRUT_GEO}
      >
        <meshStandardMaterial color="#B5BCC6" roughness={0.42} metalness={0.72} />
      </mesh>
      <group position={rig.camPedestalBase} rotation={[0.08, 0.25, -0.06]}>
        {/* Pedestal mounting cylinder */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.058, 0.066, 0.24, 12]} />
          <meshStandardMaterial color="#DBD4C8" roughness={0.5} metalness={0.36} />
        </mesh>
        {/* Empty open detachment collar ring */}
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.054, 0.011, 8, 16]} />
          <meshStandardMaterial color="#8E96A2" roughness={0.35} metalness={0.78} />
        </mesh>
        {/* Open empty saddle yoke bracket where camera head was unbolted by Pete Conrad */}
        <mesh position={[-0.045, 0.29, 0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.016, 0.09, 0.04]} />
          <meshStandardMaterial color="#A8AEB8" roughness={0.4} metalness={0.72} />
        </mesh>
        <mesh position={[0.045, 0.29, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.016, 0.09, 0.04]} />
          <meshStandardMaterial color="#A8AEB8" roughness={0.4} metalness={0.72} />
        </mesh>
      </group>

      {/* Deployed 5-Bay Pin-Jointed Pantograph Surface Sampler Arm WITHOUT Scoop (scoop removed by Apollo 12) */}
      <group position={rig.pOrigin}>
        <mesh castShadow>
          <boxGeometry args={[0.09, 0.14, 0.09]} />
          <meshStandardMaterial color="#B8BFC8" roughness={0.42} metalness={0.7} />
        </mesh>
      </group>
      {rig.pantoStruts.map((s, i) => (
        <mesh
          key={`panto-s-${i}`}
          position={s.mid}
          quaternion={s.quat}
          scale={[s.r, s.len, s.r]}
          geometry={UNIT_STRUT_GEO}
          castShadow
        >
          <meshStandardMaterial color="#C8CED8" roughness={0.38} metalness={0.76} />
        </mesh>
      ))}
      {rig.pantoPins.map((p, i) => (
        <mesh key={`pin-${i}`} position={p}>
          <sphereGeometry args={[0.014, 6, 6]} />
          <meshStandardMaterial color="#8E96A4" roughness={0.35} metalness={0.82} />
        </mesh>
      ))}
      {/* Empty distal mounting bracket at sampler arm tip (no scoop) */}
      <mesh position={rig.pTip}>
        <boxGeometry args={[0.036, 0.048, 0.056]} />
        <meshStandardMaterial color="#8E96A4" roughness={0.38} metalness={0.82} />
      </mesh>
    </group>
  );
}

/**
 * SM-L-003 & SM-L-004 · Apollo Lunar Roving Vehicle (LRV) procedural 3D model per REF_MOON.md & AG-3a:
 * - Frame length 3.1 m, wheelbase 2.3 m, max height 1.14 m, ground clearance 0.36 m
 * - 4 woven wire-mesh wheels (0.818 m diameter, 0.23 m wide) with titanium chevrons + spun aluminum hubs
 * - Curved dust guards (fenders) above each wheel
 * - 2 side-by-side folding tubular seats with nylon webbing, footrests & T-shaped hand controller
 * - Front center mast with wire-mesh parabolic high-gain dish antenna + gold-blanketed TV camera
 */
export function LunarRovingVehicleModel({ scale = 0.72 }: { scale?: number }) {
  const wheelTex = useMemo(() => getLrvWheelTexture(), []);
  const wheelPositions: [number, number, number, number][] = [
    [-0.78, 0.41, 1.15, 1],   // Front-left
    [0.78, 0.41, 1.15, -1],   // Front-right
    [-0.78, 0.41, -1.15, 1],  // Rear-left
    [0.78, 0.41, -1.15, -1],  // Rear-right
  ];

  return (
    <group scale={scale}>
      {/* 3-part hinged welded aluminum tubular chassis & beaded floor panels (ground clearance 0.36 m) */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[1.18, 0.06, 3.05]} />
        <meshStandardMaterial color="#D4DAE4" roughness={0.42} metalness={0.72} />
      </mesh>
      {/* Perimeter chassis frame rails */}
      {[-0.58, 0.58].map((rx, ri) => (
        <mesh key={ri} position={[rx, 0.41, 0]}>
          <boxGeometry args={[0.045, 0.07, 3.1]} />
          <meshStandardMaterial color="#E2E7F0" roughness={0.35} metalness={0.78} />
        </mesh>
      ))}

      {/* 4 Wire-Mesh Wheels (0.818 m diameter = 0.409 m radius, 0.23 m wide) + Dust Fenders */}
      {wheelPositions.map(([wx, wy, wz, side], wi) => (
        <group key={wi} position={[wx, wy, wz]}>
          {/* Suspension A-arm strut */}
          <mesh position={[-side * 0.16, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.32, 8]} />
            <meshStandardMaterial color="#B8C0CE" roughness={0.4} metalness={0.78} />
          </mesh>
          {/* Woven steel wire-mesh tire with titanium chevrons */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.31, 0.1, 12, 24]} />
            <meshStandardMaterial map={wheelTex} roughness={0.62} metalness={0.58} />
          </mesh>
          {/* Inner aluminum rim disc & bump-stop hub */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.08, 16]} />
            <meshStandardMaterial color="#DCE2EC" roughness={0.35} metalness={0.75} />
          </mesh>
          <mesh position={[side * 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <sphereGeometry args={[0.11, 12, 10]} />
            <meshStandardMaterial color="#B8BFC8" roughness={0.42} metalness={0.7} />
          </mesh>
          {/* Curved grey/silver metallic dust guard (fender) above wheel (AG-1b #5) */}
          <mesh position={[0, 0.06, 0]} rotation={[0.25, Math.PI / 2, 0]}>
            <torusGeometry args={[0.44, 0.082, 6, 14, Math.PI * 0.72]} />
            <meshStandardMaterial color="#9E9F9C" roughness={0.44} metalness={0.64} />
          </mesh>
        </group>
      ))}

      {/* 2 Side-by-Side Folding Tubular Aluminum Seats + Open Nylon Webbing Straps (AG-1b #5) */}
      {[-0.3, 0.3].map((sx, si) => (
        <group key={si} position={[sx, 0.44, -0.1]}>
          {/* Seat bottom left/right tubular rails */}
          {[-0.19, 0.19].map((tx, ti) => (
            <mesh key={`sr-${ti}`} position={[tx, 0.04, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.42, 8]} />
              <meshStandardMaterial color="#CFD6E2" roughness={0.35} metalness={0.82} />
            </mesh>
          ))}
          {/* Seat bottom front/rear crossbars */}
          {[-0.08, 0.32].map((tz, ti) => (
            <mesh key={`sc-${ti}`} position={[0, 0.04, tz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.38, 8]} />
              <meshStandardMaterial color="#CFD6E2" roughness={0.35} metalness={0.82} />
            </mesh>
          ))}
          {/* Seat bottom 5 nylon webbing straps with open gaps */}
          {[-0.03, 0.045, 0.12, 0.195, 0.27].map((wz, wi) => (
            <mesh key={`sw-${wi}`} position={[0, 0.042, wz]}>
              <boxGeometry args={[0.36, 0.008, 0.048]} />
              <meshStandardMaterial color="#8E8B82" roughness={0.82} metalness={0.08} />
            </mesh>
          ))}

          {/* Backrest tubular frame + 5 horizontal nylon webbing straps with open gaps */}
          <group position={[0, 0.31, -0.09]} rotation={[-0.14, 0, 0]}>
            {[-0.19, 0.19].map((tx, ti) => (
              <mesh key={`br-${ti}`} position={[tx, 0, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.54, 8]} />
                <meshStandardMaterial color="#CFD6E2" roughness={0.35} metalness={0.82} />
              </mesh>
            ))}
            {[-0.26, 0.26].map((ty, ti) => (
              <mesh key={`bc-${ti}`} position={[0, ty, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.012, 0.012, 0.38, 8]} />
                <meshStandardMaterial color="#CFD6E2" roughness={0.35} metalness={0.82} />
              </mesh>
            ))}
            {[-0.19, -0.095, 0, 0.095, 0.19].map((wy, wi) => (
              <mesh key={`bw-${wi}`} position={[0, wy, 0]}>
                <boxGeometry args={[0.36, 0.052, 0.008]} />
                <meshStandardMaterial color="#8E8B82" roughness={0.82} metalness={0.08} />
              </mesh>
            ))}
          </group>

          {/* Tubular side armrests */}
          {[-0.19, 0.19].map((ax, ai) => (
            <mesh key={`arm-${ai}`} position={[ax, 0.18, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.32, 6]} />
              <meshStandardMaterial color="#C8D0DC" roughness={0.38} metalness={0.78} />
            </mesh>
          ))}

          {/* Footrest pan ahead of seat */}
          <mesh position={[0, 0.03, 0.68]} rotation={[0.45, 0, 0]}>
            <boxGeometry args={[0.32, 0.02, 0.22]} />
            <meshStandardMaterial color="#C8D0DC" roughness={0.45} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Center Console & T-Shaped Hand Controller between the seats */}
      <group position={[0, 0.52, 0.22]}>
        <mesh position={[0, 0.08, 0.08]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.22, 0.18, 0.14]} />
          <meshStandardMaterial color="#E2E7F0" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* T-handle controller stem & grip */}
        <mesh position={[0, 0.22, -0.02]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.015, 0.22, 8]} />
          <meshStandardMaterial color="#9CA4B2" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.32, 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 0.14, 8]} />
          <meshStandardMaterial color="#242934" roughness={0.5} metalness={0.4} />
        </mesh>
      </group>

      {/* Forward Electronics Battery Boxes & Gold Kapton LCRU (Lunar Communications Relay Unit) */}
      <mesh position={[0, 0.52, 0.96]}>
        <boxGeometry args={[0.88, 0.22, 0.52]} />
        <meshStandardMaterial color="#E4E8F0" roughness={0.42} metalness={0.55} />
      </mesh>
      <mesh position={[-0.28, 0.66, 1.12]}>
        <boxGeometry args={[0.28, 0.16, 0.22]} />
        <meshStandardMaterial color="#C88B2E" roughness={0.35} metalness={0.8} />
      </mesh>

      {/* Front TV Camera on Pan/Tilt Mast (aimed forward toward the LM) */}
      <group position={[0.32, 0.78, 1.15]}>
        <mesh position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.016, 0.02, 0.32, 8]} />
          <meshStandardMaterial color="#D8DEE8" roughness={0.38} metalness={0.75} />
        </mesh>
        <mesh position={[0, 0.04, 0.02]}>
          <boxGeometry args={[0.11, 0.12, 0.22]} />
          <meshStandardMaterial color="#D49532" roughness={0.32} metalness={0.82} />
        </mesh>
        <mesh position={[0, 0.04, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.036, 0.08, 10]} />
          <meshStandardMaterial color="#1E2430" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* Front Center Mast + Wire-Mesh Parabolic High-Gain Dish Antenna */}
      <group position={[-0.08, 0.62, 0.85]}>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.88, 8]} />
          <meshStandardMaterial color="#DCE2EE" roughness={0.35} metalness={0.78} />
        </mesh>
        {/* Parabolic mesh dish */}
        <group position={[0, 0.88, 0.04]} rotation={[0.52, 0.25, 0]}>
          <mesh>
            <coneGeometry args={[0.42, 0.18, 16, 1, true]} />
            <meshStandardMaterial
              color="#D8E0EC"
              roughness={0.35}
              metalness={0.75}
              wireframe
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh>
            <coneGeometry args={[0.42, 0.18, 16, 1, true]} />
            <meshStandardMaterial
              color="#C8D2E2"
              roughness={0.45}
              metalness={0.65}
              transparent
              opacity={0.42}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Feed horn */}
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.014, 0.024, 0.24, 8]} />
            <meshStandardMaterial color="#E6ECF5" roughness={0.35} metalness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Aft Lunar Payload Stowage Rack (scientific tools rack behind seats) */}
      <mesh position={[0, 0.62, -1.08]}>
        <boxGeometry args={[0.92, 0.36, 0.34]} />
        <meshStandardMaterial color="#DCE2EC" roughness={0.45} metalness={0.62} />
      </mesh>
    </group>
  );
}

/**
 * SM-L-005 · GRAIL Twin Spacecraft (Ebb & Flow) Translucent "Ghost" Holograms per REF_MOON.md & AG-3a:
 * - Each spacecraft bus: 1.09 m high × 0.95 m wide × 0.76 m deep
 * - Two deployed solar wings (matching PIA13965 artist concept)
 * - Rendered as translucent cyan-starlight ("ghost") holograms floating in tandem above the two ~5 m impact craters.
 */
function SingleGrailGhostCraft({
  position,
  rotation,
  scale = 0.65,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Box bus (0.95 m wide × 1.09 m high × 0.76 m deep) — faint translucent fill + starlight #9DB8FF wireframe (AG-1b #6) */}
      <mesh>
        <boxGeometry args={[0.95, 1.09, 0.76]} />
        <meshBasicMaterial
          color="#4A6FA5"
          transparent
          opacity={0.055}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[0.96, 1.1, 0.77]} />
        <meshBasicMaterial
          color="#9DB8FF"
          wireframe
          transparent
          opacity={0.28}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Ka-band inter-spacecraft ranging horn assembly on front face */}
      <mesh position={[0, 0.05, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.16, 0.18, 10]} />
        <meshBasicMaterial
          color="#9DB8FF"
          wireframe
          transparent
          opacity={0.26}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Two fixed solar array wings (PIA13965 layout) */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.12, 0, -0.08]} rotation={[0, side * 0.12, 0]}>
          <mesh>
            <boxGeometry args={[1.22, 1.04, 0.025]} />
            <meshBasicMaterial
              color="#4A6FA5"
              transparent
              opacity={0.045}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[1.23, 1.05, 0.03]} />
            <meshBasicMaterial
              color="#9DB8FF"
              wireframe
              transparent
              opacity={0.24}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function GrailTwinHolograms({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion) return;
    elapsedRef.current += Math.min(delta, 0.05);
    groupRef.current.position.y = Math.sin(elapsedRef.current * 1.4) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* GRAIL-A (Ebb) ghost hologram hovering above Crater A */}
      <SingleGrailGhostCraft
        position={[-0.95, 1.52, 0.35]}
        rotation={[0.28, 0.32, -0.12]}
        scale={0.56}
      />
      {/* Faint descent trajectory ray from Ebb into Crater A */}
      <mesh position={[-0.95, 0.86, 0.35]}>
        <cylinderGeometry args={[0.008, 0.14, 1.12, 10, 1, true]} />
        <meshBasicMaterial
          color="#9DB8FF"
          transparent
          opacity={0.09}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* GRAIL-B (Flow) ghost hologram flying behind Ebb above Crater B */}
      <SingleGrailGhostCraft
        position={[1.05, 1.78, -0.32]}
        rotation={[0.28, 0.32, -0.08]}
        scale={0.56}
      />
      {/* Faint descent trajectory ray from Flow into Crater B */}
      <mesh position={[1.05, 1.1, -0.32]}>
        <cylinderGeometry args={[0.008, 0.14, 1.22, 10, 1, true]} />
        <meshBasicMaterial
          color="#9DB8FF"
          transparent
          opacity={0.09}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inter-spacecraft Ka-band gravity-mapping link line between Ebb & Flow */}
      <mesh position={[0.05, 1.65, 0.01]} rotation={[0.14, 0.3, -1.44]}>
        <cylinderGeometry args={[0.006, 0.006, 2.08, 6]} />
        <meshBasicMaterial
          color="#9DB8FF"
          transparent
          opacity={0.22}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
