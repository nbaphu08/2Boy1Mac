"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

let cachedLrrrPrismTex: THREE.CanvasTexture | null = null;
let cachedBootprintTex: THREE.CanvasTexture | null = null;
let cachedRoverTrackTex: THREE.CanvasTexture | null = null;
let cachedDarkEjectaTex: THREE.CanvasTexture | null = null;
let cachedWireMeshTex: THREE.CanvasTexture | null = null;

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
export function ClippedLmTopCap({ baseY }: { baseY: number }) {
  return (
    <group position={[0, baseY + 0.765, 0]}>
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
export function Apollo11SiteProps({ baseY }: { baseY: number }) {
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
      <ClippedLmTopCap baseY={0} />

      {/* 2. Forward Leg Egress Platform, 9-Rung Ladder & Commemorative Plaque Plate */}
      <group position={[0, 0, 0.95]}>
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
      <group position={[-0.78, 0.02, 1.72]} rotation={[0, 0.25, 0]}>
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
      <group position={[-1.25, 0.02, 1.18]} rotation={[0, 0.42, 0]}>
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
 * SM-L-002 · Surveyor 3 procedural 3D model per REF_MOON.md & AG-3a:
 * - ~3 m tall tripod of thin-walled aluminum tubing with dust-tan weathered white finish
 * - Central mast (~1 m above apex) with flat solar panel (792 cells) + flat planar high-gain antenna
 * - 3 hinged landing legs with shock absorbers + crushable honeycomb blocks + round footpads
 * - 2 omnidirectional conical antennas on folding booms
 * - Spherical vernier propellant tanks & electronics compartments (no retrorocket case)
 * - Camera mount WITHOUT camera head & pantograph surface sampler arm WITHOUT scoop (removed by Apollo 12)
 */
export function Surveyor3Model({ scale = 0.62 }: { scale?: number }) {
  const legAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];

  return (
    <group scale={scale}>
      {/* Central spaceframe lower triangle ring */}
      <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.68, 0.028, 8, 3]} />
        <meshStandardMaterial color="#D4CEC2" roughness={0.55} metalness={0.38} />
      </mesh>

      {/* 3 Tripod primary tubular struts rising to apex at y = 1.88 */}
      {legAngles.map((a, i) => {
        const bx = Math.cos(a) * 0.68;
        const bz = Math.sin(a) * 0.68;
        return (
          <group key={i}>
            {/* Main tripod column */}
            <mesh
              position={[bx * 0.5, 1.25, bz * 0.5]}
              rotation={[Math.sin(a) * 0.48, 0, -Math.cos(a) * 0.48]}
            >
              <cylinderGeometry args={[0.026, 0.03, 1.42, 8]} />
              <meshStandardMaterial color="#D8D1C4" roughness={0.52} metalness={0.35} />
            </mesh>

            {/* Hinged landing leg + shock absorber + crushable honeycomb block + footpad */}
            <group rotation={[0, -a, 0]}>
              {/* Main leg A-frame boom extending to radius ~2.05 */}
              <mesh position={[1.32, 0.34, 0]} rotation={[0, 0, 0.42]}>
                <cylinderGeometry args={[0.032, 0.04, 1.48, 8]} />
                <meshStandardMaterial color="#CEC7BA" roughness={0.55} metalness={0.42} />
              </mesh>
              {/* Telescoping shock absorber strut */}
              <mesh position={[1.08, 0.62, 0]} rotation={[0, 0, -0.58]}>
                <cylinderGeometry args={[0.022, 0.026, 0.92, 8]} />
                <meshStandardMaterial color="#9CA2AE" roughness={0.38} metalness={0.75} />
              </mesh>
              {/* Crushable honeycomb block under lower corner */}
              <mesh position={[0.72, 0.38, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 0.18, 12]} />
                <meshStandardMaterial color="#B8AF9E" roughness={0.62} metalness={0.32} />
              </mesh>
              {/* Crushable circular landing footpad */}
              <mesh position={[1.98, 0.07, 0]}>
                <cylinderGeometry args={[0.24, 0.28, 0.12, 16]} />
                <meshStandardMaterial color="#BFB6A6" roughness={0.65} metalness={0.35} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* 2 White thermal electronics compartments (Compartment A & B) */}
      <mesh position={[-0.36, 0.82, 0.24]} rotation={[0, 0.52, 0]}>
        <boxGeometry args={[0.58, 0.42, 0.38]} />
        <meshStandardMaterial color="#DCD5C8" roughness={0.48} metalness={0.28} />
      </mesh>
      <mesh position={[0.38, 0.78, 0.2]} rotation={[0, -0.45, 0]}>
        <boxGeometry args={[0.52, 0.38, 0.34]} />
        <meshStandardMaterial color="#D6CFC2" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Spherical vernier propellant & helium tanks (polished metal + tan dust) */}
      {[
        [0.18, 0.76, -0.34],
        [-0.22, 0.74, -0.32],
        [0.0, 0.92, 0.35],
      ].map(([tx, ty, tz], ti) => (
        <mesh key={ti} position={[tx, ty, tz]}>
          <sphereGeometry args={[0.16, 14, 12]} />
          <meshStandardMaterial color="#C8C2B8" roughness={0.35} metalness={0.72} />
        </mesh>
      ))}

      {/* Central Mast (~1 m above tripod apex) + Positioner + Solar Panel + Planar High-Gain Antenna */}
      <mesh position={[0, 2.38, 0]}>
        <cylinderGeometry args={[0.036, 0.042, 1.15, 10]} />
        <meshStandardMaterial color="#D2CBC0" roughness={0.48} metalness={0.48} />
      </mesh>
      {/* Flat 792-cell Solar Panel (tilted) */}
      <group position={[0.12, 2.86, 0.08]} rotation={[0.42, 0.35, -0.22]}>
        <mesh>
          <boxGeometry args={[0.96, 0.025, 0.88]} />
          <meshStandardMaterial color="#1C263B" roughness={0.32} metalness={0.68} />
        </mesh>
        <mesh position={[0, -0.016, 0]}>
          <boxGeometry args={[0.98, 0.01, 0.9]} />
          <meshStandardMaterial color="#D8D2C6" roughness={0.5} metalness={0.4} />
        </mesh>
      </group>
      {/* Flat Planar High-Gain Antenna beside solar panel */}
      <group position={[-0.24, 2.92, -0.12]} rotation={[-0.28, -0.25, 0.15]}>
        <mesh>
          <boxGeometry args={[0.68, 0.72, 0.035]} />
          <meshStandardMaterial color="#E2DDD2" roughness={0.46} metalness={0.32} />
        </mesh>
      </group>

      {/* 2 Omnidirectional conical antennas on folding booms */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.55, 1.05, -0.2]} rotation={[0.15, side * 0.4, -side * 0.25]}>
          <mesh position={[side * 0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.016, 0.9, 6]} />
            <meshStandardMaterial color="#C8C2B6" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[side * 0.92, 0.06, 0]}>
            <coneGeometry args={[0.075, 0.16, 10]} />
            <meshStandardMaterial color="#DDD6CA" roughness={0.45} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Empty TV Survey Camera Mount (camera head removed by Apollo 12 astronauts in Nov 1969) */}
      <group position={[0.18, 1.38, 0.36]} rotation={[0.12, 0.3, 0]}>
        <mesh>
          <cylinderGeometry args={[0.065, 0.075, 0.26, 12]} />
          <meshStandardMaterial color="#D6CFC2" roughness={0.5} metalness={0.38} />
        </mesh>
        {/* Open mounting collar ring where the camera head was detached */}
        <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.012, 8, 16]} />
          <meshStandardMaterial color="#8E95A2" roughness={0.35} metalness={0.78} />
        </mesh>
      </group>

      {/* Deployed Pantograph Surface Sampler Arm WITHOUT Scoop (scoop removed by Apollo 12) */}
      <group position={[0.34, 0.72, 0.42]} rotation={[0.28, -0.35, 0]}>
        {[0, 1, 2].map((seg) => (
          <group key={seg} position={[0, 0, seg * 0.28]}>
            <mesh rotation={[0.45, 0, 0]}>
              <boxGeometry args={[0.018, 0.22, 0.018]} />
              <meshStandardMaterial color="#B8BFC8" roughness={0.4} metalness={0.75} />
            </mesh>
            <mesh rotation={[-0.45, 0, 0]}>
              <boxGeometry args={[0.018, 0.22, 0.018]} />
              <meshStandardMaterial color="#B8BFC8" roughness={0.4} metalness={0.75} />
            </mesh>
          </group>
        ))}
        {/* Empty distal mounting bracket (no scoop attached) */}
        <mesh position={[0, -0.02, 0.82]}>
          <boxGeometry args={[0.04, 0.04, 0.06]} />
          <meshStandardMaterial color="#8E96A4" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>
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
