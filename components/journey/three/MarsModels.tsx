"use client";

import { useMemo } from "react";
import * as THREE from "three";

let cachedPathfinderSolarTex: THREE.CanvasTexture | null = null;
let cachedPhoenixSolarTex: THREE.CanvasTexture | null = null;
let cachedMarsTrackTex: THREE.CanvasTexture | null = null;

/** Procedural solar cell array texture with warm Martian dust frosting for Pathfinder & Sojourner. */
export function getPathfinderSolarTexture(): THREE.CanvasTexture {
  if (cachedPathfinderSolarTex) return cachedPathfinderSolarTex;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Dark blue-slate gallium arsenide solar cells dusted with warm ochre
  ctx.fillStyle = "#262E3D";
  ctx.fillRect(0, 0, 256, 256);

  const cols = 12;
  const rows = 16;
  const cw = 256 / cols;
  const ch = 256 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#243044" : "#2B364B";
      ctx.fillRect(c * cw + 1.5, r * ch + 1.5, cw - 3, ch - 3);
      ctx.strokeStyle = "rgba(195, 138, 98, 0.38)";
      ctx.lineWidth = 1;
      ctx.strokeRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
    }
  }

  // Subtle Martian dust film
  const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 160);
  grad.addColorStop(0, "rgba(184, 102, 62, 0.18)");
  grad.addColorStop(1, "rgba(184, 102, 62, 0.38)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedPathfinderSolarTex = tex;
  return tex;
}

/** Procedural 10-sector radial decagonal fan solar array texture for Phoenix (PIA11719). */
export function getPhoenixDecagonalSolarTexture(): THREE.CanvasTexture {
  if (cachedPhoenixSolarTex) return cachedPhoenixSolarTex;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#5C4033";
  ctx.fillRect(0, 0, 256, 256);

  const cx = 128;
  const cy = 128;
  const sectors = 10;

  for (let s = 0; s < sectors; s++) {
    const a0 = (s / sectors) * Math.PI * 2;
    const a1 = ((s + 1) / sectors) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 124, a0, a1);
    ctx.closePath();
    ctx.fillStyle = s % 2 === 0 ? "#4D3930" : "#563F34";
    ctx.fill();
    ctx.strokeStyle = "#B89378";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Small white calibration/fiducial squares along sector edges as seen in PIA11719
    for (let ring = 42; ring <= 108; ring += 22) {
      const am = (a0 + a1) * 0.5;
      const fx = cx + Math.cos(am) * ring;
      const fy = cy + Math.sin(am) * ring;
      ctx.fillStyle = "rgba(218, 198, 180, 0.65)";
      ctx.fillRect(fx - 2.5, fy - 2.5, 5, 5);
    }
  }

  // Center hub
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fillStyle = "#8C583A";
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedPhoenixSolarTex = tex;
  return tex;
}

/** Dual parallel rover wheel tracks in rusty Martian soil. */
export function getMarsRoverTrackTexture(): THREE.CanvasTexture {
  if (cachedMarsTrackTex) return cachedMarsTrackTex;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, 512, 128);

  for (const ry of [30, 98]) {
    const rutGrad = ctx.createLinearGradient(0, ry - 15, 0, ry + 15);
    rutGrad.addColorStop(0, "rgba(185, 108, 68, 0.35)");
    rutGrad.addColorStop(0.5, "rgba(48, 22, 12, 0.72)");
    rutGrad.addColorStop(1, "rgba(185, 108, 68, 0.35)");
    ctx.fillStyle = rutGrad;
    ctx.fillRect(0, ry - 15, 512, 30);

    ctx.strokeStyle = "rgba(32, 14, 8, 0.65)";
    ctx.lineWidth = 2.5;
    for (let x = 6; x < 506; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, ry - 10);
      ctx.lineTo(x + 4, ry);
      ctx.lineTo(x, ry + 10);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  cachedMarsTrackTex = tex;
  return tex;
}

/**
 * AG-3b #1 & #2 · Mars Pathfinder Lander + Sojourner Rover (SM-M-002, Ares Vallis)
 * - Opened tetrahedron lander: central base + 3 triangular solar petals (2.75 m total span)
 * - Imager for Mars Pathfinder (IMP) camera on a ~1.5 m mast + HGA & LGA antennas
 * - Deflated multi-lobe airbags bunched around the petal edges (matching PIA00614 & PIA00632)
 * - Unrolled rover deployment ramp leading down to the Martian regolith
 * - Sojourner microrover (0.65 × 0.48 × 0.30 m, 6-wheel rocker-bogie, flat solar panel top, whip antenna)
 *   positioned beside the "Yogi" boulder a few meters from the lander
 */
export function PathfinderAndSojournerModel({ baseY }: { baseY: number }) {
  const solarTex = useMemo(() => getPathfinderSolarTexture(), []);
  const trackTex = useMemo(() => getMarsRoverTrackTexture(), []);

  // Create triangular solar petal geometry once
  const petalGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.56, 0);
    shape.lineTo(0.56, 0);
    shape.lineTo(0, 0.96);
    shape.closePath();
    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 1,
    });
    extrude.rotateX(-Math.PI / 2);
    return extrude;
  }, []);

  // Craggy displaced "Yogi" boulder geometry (Ares Vallis flood boulder ~1 m tall, AG-2b #4)
  const yogiRockGeo = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.56, 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      // Flatten base slightly and create craggy angular flood-boulder facets + overhanging nose
      const n1 = Math.sin(x * 5.2 + z * 3.8) * 0.12 + Math.cos(y * 6.4 - x * 4.1) * 0.09;
      const n2 = Math.sin(z * 7.5 - y * 4.7) * 0.07;
      const radial = 1 + n1 + n2;
      x *= radial * 1.18;
      z *= radial * 0.96;
      y = y < 0 ? y * 0.45 : y * radial * 0.95;
      // Slight overhang toward Sojourner (-x/-z side)
      if (y > 0.12) {
        x -= 0.08 * y;
        z -= 0.05 * y;
      }
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Deflated airbag lobe clusters around the 3 petal edges
  const airbagLobes = useMemo(() => {
    const lobes: { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      // Leave a gap near the front-left ramp where Sojourner drove off
      if (a > 0.65 && a < 1.15) continue;
      const r = 0.92 + Math.sin(i * 2.1) * 0.26;
      lobes.push({
        pos: [Math.cos(a) * r, 0.09 + (i % 3) * 0.035, Math.sin(a) * r],
        scale: [0.34 + (i % 3) * 0.08, 0.13 + (i % 2) * 0.04, 0.28 + ((i + 1) % 3) * 0.07],
        rot: [(i % 5) * 0.12, a + 0.4, ((i + 2) % 4) * 0.1],
      });
    }
    return lobes;
  }, []);

  return (
    <group position={[0, baseY, 0]} scale={1.18}>
      {/* ─── MARS PATHFINDER TETRAHEDRAL LANDER (shifted slightly back-left to frame Sojourner + Yogi in foreground) ─── */}
      <group position={[-0.45, 0.04, -0.22]} rotation={[0, 0.25, 0]}>
        {/* Deflated Vectran airbag lobes bunched around the opened petals (PIA00614) */}
        {airbagLobes.map((lobe, idx) => (
          <mesh key={idx} position={lobe.pos} scale={lobe.scale} rotation={lobe.rot}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? "#C9B79C" : "#BCAA8E"}
              roughness={0.86}
              metalness={0.08}
            />
          </mesh>
        ))}

        {/* Central tetrahedral base deck */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.58, 0.64, 0.12, 3]} />
          <meshStandardMaterial color="#C89246" roughness={0.45} metalness={0.68} />
        </mesh>

        {/* 3 Opened Triangular Petals (spanning 2.75 m across) with dark solar cell arrays */}
        {[0, 1, 2].map((pi) => {
          const angle = (pi * Math.PI * 2) / 3;
          return (
            <group key={pi} rotation={[0, angle, 0]}>
              <group position={[0, 0.09, 0.34]} rotation={[0.06, 0, 0]}>
                {/* Structural aluminum/gold petal backing */}
                <mesh geometry={petalGeo}>
                  <meshStandardMaterial color="#C49A5C" roughness={0.5} metalness={0.62} />
                </mesh>
                {/* Solar cell array panel on top of petal */}
                <mesh position={[0, 0.042, 0.42]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.68, 0.64]} />
                  <meshStandardMaterial map={solarTex} roughness={0.42} metalness={0.55} />
                </mesh>
                {/* Metallic petal hinge actuator cylinders at base */}
                {[-0.24, 0.24].map((hx, hi) => (
                  <mesh key={hi} position={[hx, 0.04, 0.02]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.032, 0.032, 0.14, 10]} />
                    <meshStandardMaterial color="#B8BFC8" roughness={0.38} metalness={0.78} />
                  </mesh>
                ))}
              </group>
            </group>
          );
        })}

        {/* Central Warm Electronics Enclosure + Gold Kapton Thermal Blankets */}
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.38, 0.44, 0.24, 6]} />
          <meshStandardMaterial color="#CD8E36" roughness={0.4} metalness={0.75} />
        </mesh>

        {/* Imager for Mars Pathfinder (IMP) Camera on ~1.5 m Pop-Up Mast */}
        <group position={[0.08, 0.36, -0.06]}>
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.026, 0.034, 0.92, 8]} />
            <meshStandardMaterial color="#9CA4B0" roughness={0.42} metalness={0.74} />
          </mesh>
          {/* IMP stereo camera head */}
          <mesh position={[0, 0.95, 0]} rotation={[0.1, 0.4, 0]}>
            <boxGeometry args={[0.18, 0.11, 0.12]} />
            <meshStandardMaterial color="#D8D2C6" roughness={0.45} metalness={0.48} />
          </mesh>
          {/* Twin stereo lens ports */}
          {[-0.055, 0.055].map((lx, li) => (
            <mesh key={li} position={[lx, 0.95, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.02, 10]} />
              <meshStandardMaterial color="#18202C" roughness={0.25} metalness={0.85} />
            </mesh>
          ))}
        </group>

        {/* Steerable High-Gain Antenna dish + Low-Gain Mast */}
        <group position={[-0.18, 0.42, 0.12]} rotation={[0.38, -0.4, 0]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.14, 0.04, 16]} />
            <meshStandardMaterial color="#DDD6CA" roughness={0.48} metalness={0.35} />
          </mesh>
        </group>
        <mesh position={[-0.22, 0.62, -0.14]}>
          <cylinderGeometry args={[0.012, 0.016, 0.56, 8]} />
          <meshStandardMaterial color="#C8C2B8" roughness={0.45} metalness={0.65} />
        </mesh>

        {/* Unrolled Rover Deployment Ramp extending from front petal to Martian soil */}
        <group position={[0.42, 0.09, 0.68]} rotation={[0.14, 0.52, 0]}>
          {[-0.14, 0.14].map((rx, ri) => (
            <mesh key={ri} position={[rx, 0, 0.38]}>
              <boxGeometry args={[0.055, 0.016, 0.82]} />
              <meshStandardMaterial color="#C8CFD8" roughness={0.38} metalness={0.78} />
            </mesh>
          ))}
          {[-0.28, -0.12, 0.04, 0.2, 0.36, 0.52, 0.68].map((rz, rzi) => (
            <mesh key={rzi} position={[0, 0.006, rz + 0.35]}>
              <boxGeometry args={[0.32, 0.008, 0.035]} />
              <meshStandardMaterial color="#B8863B" roughness={0.45} metalness={0.68} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ─── SOJOURNER ROVER WHEEL TRACKS leading from ramp to "Yogi" Rock ─── */}
      <mesh
        position={[0.52, 0.032, 0.72]}
        rotation={[-Math.PI / 2, 0, -0.62]}
      >
        <planeGeometry args={[1.45, 0.48]} />
        <meshBasicMaterial map={trackTex} transparent opacity={0.85} depthWrite={false} />
      </mesh>

      {/* ─── "YOGI" BOULDER (Craggy ~1 m tall dark reddish-grey Ares Vallis flood boulder inspected by Sojourner in PIA00632, AG-2b #4) ─── */}
      <group position={[1.78, 0.1, 1.2]} rotation={[0.06, 0.55, -0.05]} scale={0.5}>
        <mesh geometry={yogiRockGeo} scale={[1.05, 0.96, 0.94]}>
          <meshStandardMaterial color="#5E3A2C" roughness={0.95} metalness={0.04} flatShading />
        </mesh>
        {/* Dusty lighter ochre wind-streak cap on upper Windward face of Yogi */}
        <mesh geometry={yogiRockGeo} position={[0.02, 0.03, -0.01]} scale={[0.98, 0.92, 0.89]}>
          <meshStandardMaterial color="#8A5238" roughness={0.96} metalness={0.02} flatShading />
        </mesh>
      </group>

      {/* ─── SOJOURNER MICROROVER (65 × 48 × 30 cm real proportions, 6-wheel rocker-bogie, flat solar top, whip antenna) ─── */}
      <group position={[0.88, 0.02, 0.90]} rotation={[0, 0.88, 0]} scale={1.14}>
        {/* Gold Kapton Warm Electronics Box (WEB) body */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.36, 0.12, 0.52]} />
          <meshStandardMaterial color="#C88E32" roughness={0.38} metalness={0.78} />
        </mesh>
        {/* Flat rectangular GaAs solar panel on top */}
        <mesh position={[0, 0.246, 0]}>
          <boxGeometry args={[0.42, 0.015, 0.58]} />
          <meshStandardMaterial map={solarTex} roughness={0.38} metalness={0.6} />
        </mesh>
        {/* 6 Cleated Aluminum Wheels + Rocker-Bogie Suspension */}
        {[-0.23, 0.23].map((wx, si) => (
          <group key={si} position={[wx, 0.085, 0]}>
            {/* Rocker-bogie side linkage bar */}
            <mesh position={[si === 0 ? 0.03 : -0.03, 0.04, 0]}>
              <boxGeometry args={[0.02, 0.025, 0.46]} />
              <meshStandardMaterial color="#CBD2DC" roughness={0.35} metalness={0.82} />
            </mesh>
            {[-0.22, 0, 0.22].map((wz, wi) => (
              <group key={wi} position={[0, 0, wz]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.085, 0.085, 0.065, 14]} />
                  <meshStandardMaterial color="#282C34" roughness={0.55} metalness={0.68} />
                </mesh>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.055, 0.055, 0.07, 12]} />
                  <meshStandardMaterial color="#D4DBE6" roughness={0.35} metalness={0.82} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
        {/* Front APXS (Alpha Proton X-Ray Spectrometer) deployment arm nosing against Yogi rock */}
        <mesh position={[0, 0.14, 0.31]} rotation={[0.35, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.036, 0.14, 10]} />
          <meshStandardMaterial color="#D6DCE6" roughness={0.4} metalness={0.78} />
        </mesh>
        {/* Rear UHF whip antenna */}
        <mesh position={[-0.14, 0.38, -0.22]}>
          <cylinderGeometry args={[0.005, 0.007, 0.28, 6]} />
          <meshStandardMaterial color="#DCE2EC" roughness={0.35} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * AG-3b #3 · Phoenix Mars Lander (SM-M-005, Vastitas Borealis arctic plain)
 * - 1.5 m octagonal/round deck on 3 landing legs
 * - Two decagonal UltraFlex fan-fold solar arrays (5.52 m span deployed) with radial gore ribs
 * - One solar array visibly CRACKED / COLLAPSED downward under winter CO2 ice load (AG-2 #5 & AG-3b #3)
 * - 2.35 m articulated Robotic Arm (RA) with scoop resting over an excavated water-ice trench
 * - Surface Stereo Imager (SSI) mast camera + Meteorology (MET) mast
 */
export function PhoenixLanderModel({ baseY, scale = 0.92 }: { baseY: number; scale?: number }) {
  const decagonalTex = useMemo(() => getPhoenixDecagonalSolarTexture(), []);

  return (
    <group position={[0, baseY, 0]} scale={scale}>
      {/* Octagonal 1.5 m Spacecraft Science Deck + Copper-Gold Thermal MLI Enclosure */}
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.76, 0.72, 0.36, 8]} />
        <meshStandardMaterial color="#B87A3D" roughness={0.46} metalness={0.68} />
      </mesh>
      {/* Dusty white/silver top instrument deck plate */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.04, 8]} />
        <meshStandardMaterial color="#C8A286" roughness={0.62} metalness={0.35} />
      </mesh>

      {/* 3 Tripod Landing Legs + Footpads */}
      {[0, 1, 2].map((li) => {
        const a = (li * Math.PI * 2) / 3 + Math.PI / 6;
        const lx = Math.cos(a) * 0.92;
        const lz = Math.sin(a) * 0.92;
        return (
          <group key={li}>
            <mesh
              position={[lx * 0.74, 0.34, lz * 0.74]}
              rotation={[Math.sin(a) * 0.52, 0, -Math.cos(a) * 0.52]}
            >
              <cylinderGeometry args={[0.042, 0.036, 0.78, 8]} />
              <meshStandardMaterial color="#C8B8A8" roughness={0.48} metalness={0.62} />
            </mesh>
            <mesh position={[lx, 0.03, lz]}>
              <cylinderGeometry args={[0.18, 0.21, 0.05, 14]} />
              <meshStandardMaterial color="#8E6E5A" roughness={0.72} metalness={0.42} />
            </mesh>
          </group>
        );
      })}

      {/* ─── LEFT DECAGONAL SOLAR ARRAY (Intact, heavily dust-coated, 10-sided UltraFlex fan) ─── */}
      <group position={[-1.62, 0.74, 0]} rotation={[0.04, 0, 0.03]}>
        {/* Boom arm */}
        <mesh position={[0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.028, 0.032, 0.52, 8]} />
          <meshStandardMaterial color="#B89882" roughness={0.5} metalness={0.6} />
        </mesh>
        {/* 10-sided decagonal solar fan disc */}
        <mesh>
          <cylinderGeometry args={[0.96, 0.96, 0.022, 10]} />
          <meshStandardMaterial map={decagonalTex} roughness={0.58} metalness={0.35} />
        </mesh>
      </group>

      {/* ─── RIGHT DECAGONAL SOLAR ARRAY (CRACKED / COLLAPSED downward under winter CO2 ice load!) ─── */}
      <group position={[0.78, 0.72, 0]}>
        {/* Fractured, bent deployment yoke hinge */}
        <mesh position={[0.18, -0.08, 0]} rotation={[0, 0, -0.58]}>
          <cylinderGeometry args={[0.026, 0.03, 0.42, 8]} />
          <meshStandardMaterial color="#9C7E6A" roughness={0.58} metalness={0.55} />
        </mesh>
        {/* Collapsed decagonal array drooping down to touch the arctic soil (-36° pitch/roll) with torn sector */}
        <group position={[0.88, -0.38, 0.08]} rotation={[0.18, -0.12, -0.46]}>
          <mesh>
            <cylinderGeometry args={[0.94, 0.94, 0.022, 10, 1, false, 0, Math.PI * 1.65]} />
            <meshStandardMaterial map={decagonalTex} roughness={0.68} metalness={0.28} />
          </mesh>
          {/* Detached/buckled solar gore shard resting beside the collapsed wing */}
          <mesh position={[0.25, -0.12, 0.52]} rotation={[0.32, 0.4, 0.28]}>
            <boxGeometry args={[0.48, 0.015, 0.32]} />
            <meshStandardMaterial color="#4D3930" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      </group>

      {/* ─── DECK INSTRUMENTS (TEGA ovens, MECA chemistry box, Bio-barrier) ─── */}
      <mesh position={[-0.22, 0.88, -0.18]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.38, 0.22, 0.28]} />
        <meshStandardMaterial color="#C8B4A0" roughness={0.5} metalness={0.52} />
      </mesh>
      <mesh position={[0.24, 0.86, -0.22]} rotation={[0, -0.25, 0]}>
        <boxGeometry args={[0.32, 0.18, 0.26]} />
        <meshStandardMaterial color="#B88A58" roughness={0.45} metalness={0.65} />
      </mesh>

      {/* ─── SURFACE STEREO IMAGER (SSI) CAMERA MAST ─── */}
      <group position={[-0.12, 0.76, 0.28]}>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.034, 0.04, 0.84, 10]} />
          <meshStandardMaterial color="#C4B2A0" roughness={0.48} metalness={0.58} />
        </mesh>
        <mesh position={[0, 0.86, 0]} rotation={[0.18, 0.25, 0]}>
          <boxGeometry args={[0.22, 0.14, 0.15]} />
          <meshStandardMaterial color="#D4C2B0" roughness={0.45} metalness={0.48} />
        </mesh>
      </group>

      {/* ─── METEOROLOGY (MET) MAST (tall thin mast with wind teller) ─── */}
      <mesh position={[0.36, 1.32, -0.12]}>
        <cylinderGeometry args={[0.012, 0.018, 1.15, 8]} />
        <meshStandardMaterial color="#D8C8B8" roughness={0.42} metalness={0.68} />
      </mesh>

      {/* ─── 2.35 m ARTICULATED ROBOTIC ARM + SCOOP poised over excavated water-ice trench ─── */}
      <group position={[0.18, 0.82, 0.46]} rotation={[0, -0.18, 0]}>
        {/* Shoulder turret */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.09, 0.16, 12]} />
          <meshStandardMaterial color="#B89882" roughness={0.45} metalness={0.68} />
        </mesh>
        {/* Upper arm boom */}
        <mesh position={[0, 0.16, 0.48]} rotation={[1.18, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.036, 1.05, 10]} />
          <meshStandardMaterial color="#B49A88" roughness={0.46} metalness={0.65} />
        </mesh>
        {/* Forearm boom */}
        <mesh position={[0, -0.22, 1.18]} rotation={[2.12, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.032, 0.98, 10]} />
          <meshStandardMaterial color="#B49A88" roughness={0.46} metalness={0.65} />
        </mesh>
        {/* Excavator scoop resting right above the bright ice trench */}
        <mesh position={[0, -0.68, 1.54]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.14, 0.09, 0.22]} />
          <meshStandardMaterial color="#9E8472" roughness={0.52} metalness={0.62} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * SM-M-001 · Viking 1 Lander foreground sampler boom, trench & RTG wind screen accents (Chryse Planitia).
 */
export function Viking1SiteProps({ baseY }: { baseY: number }) {
  return (
    <group position={[0, baseY, 0]}>
      {/* Extended Surface Sampler Collector Arm reaching forward into Chryse soil */}
      <group position={[0.18, 0.58, 0.55]} rotation={[0.38, -0.22, 0]}>
        <mesh position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.026, 1.15, 8]} />
          <meshStandardMaterial color="#C8B49E" roughness={0.48} metalness={0.65} />
        </mesh>
        {/* Collector scoop head touching the soil */}
        <mesh position={[0, -0.02, 1.12]}>
          <boxGeometry args={[0.09, 0.07, 0.18]} />
          <meshStandardMaterial color="#B89E88" roughness={0.55} metalness={0.58} />
        </mesh>
      </group>
      {/* Excavated Chryse sample trench in front of collector head */}
      <mesh position={[-0.08, 0.028, 1.58]} rotation={[-Math.PI / 2, 0, -0.22]}>
        <planeGeometry args={[0.22, 0.62]} />
        <meshStandardMaterial color="#4A2214" roughness={0.95} metalness={0.02} />
      </mesh>
    </group>
  );
}

/**
 * SM-M-006 · InSight Deployed Surface Instruments (Elysium Planitia):
 * 1. SEIS Seismometer under its iconic white/gold dome-shaped Wind and Thermal Shield (WTS)
 * 2. HP3 Heat Flow Probe ("the mole") vertical support housing beside SEIS
 * 3. Flat umbilical tethers connecting both instruments back to the lander deck
 */
export function InSightSurfaceInstruments({ baseY }: { baseY: number }) {
  return (
    <group position={[0, baseY, 0]}>
      {/* 1. SEIS Wind and Thermal Shield (WTS) dome in front-left foreground (properly scaled smaller than the 6 m InSight lander) */}
      <group position={[-0.48, 0, 1.56]}>
        {/* Hexagonal-skirted white/dusty thermal shield dome */}
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.13, 0.17, 0.13, 12]} />
          <meshStandardMaterial color="#D4B89E" roughness={0.58} metalness={0.28} />
        </mesh>
        {/* Gold Kapton chainmail thermal apron around base */}
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.03, 12]} />
          <meshStandardMaterial color="#B88238" roughness={0.48} metalness={0.68} />
        </mesh>
        {/* Top grapple fixture pin */}
        <mesh position={[0, 0.155, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.045, 8]} />
          <meshStandardMaterial color="#C8923E" roughness={0.4} metalness={0.75} />
        </mesh>
      </group>

      {/* Flat umbilical tether from lander to SEIS dome */}
      <mesh position={[-0.27, 0.024, 0.92]} rotation={[-Math.PI / 2, 0, -0.3]}>
        <planeGeometry args={[0.048, 1.38]} />
        <meshStandardMaterial color="#B87E38" roughness={0.52} metalness={0.62} />
      </mesh>

      {/* 2. HP3 ("The Mole") Support Structure Housing in front-right foreground */}
      <group position={[0.42, 0, 1.64]} rotation={[0, 0.25, 0]}>
        {/* 3-foot base frame */}
        <mesh position={[0, 0.012, 0]}>
          <cylinderGeometry args={[0.095, 0.11, 0.02, 6]} />
          <meshStandardMaterial color="#8E7A6C" roughness={0.55} metalness={0.6} />
        </mesh>
        {/* Vertical cylindrical mole tube housing (tilted slightly from hammering) */}
        <mesh position={[0, 0.13, 0]} rotation={[0.08, 0, -0.05]}>
          <cylinderGeometry args={[0.024, 0.028, 0.24, 10]} />
          <meshStandardMaterial color="#2C2A28" roughness={0.5} metalness={0.7} />
        </mesh>
      </group>

      {/* Flat umbilical tether from lander to HP3 mole */}
      <mesh position={[0.24, 0.024, 0.96]} rotation={[-Math.PI / 2, 0, 0.28]}>
        <planeGeometry args={[0.042, 1.44]} />
        <meshStandardMaterial color="#B87E38" roughness={0.52} metalness={0.62} />
      </mesh>
    </group>
  );
}

/**
 * SM-M-007 · Ingenuity Flight 72 snapped rotor blade tip + optional distant mini-plinth
 * with Perseverance's conical backshell and supersonic parachute (PIA25219).
 */
export function IngenuityAndBackshellProps({ baseY }: { baseY: number }) {
  return (
    <group position={[0, baseY, 0]}>
      {/* Detached carbon-fiber rotor blade tip lying on the sand ripple beside Ingenuity (Flight 72 damage) */}
      <mesh position={[0.48, 0.036, 0.36]} rotation={[0.08, 0.58, 0.14]}>
        <boxGeometry args={[0.22, 0.008, 0.052]} />
        <meshStandardMaterial color="#1E2026" roughness={0.42} metalness={0.68} />
      </mesh>

      {/* Distant shattered Perseverance backshell + supersonic parachute resting on Martian sand (PIA25219) */}
      <group position={[-2.35, -0.02, -2.6]} rotation={[0, 0.45, 0]}>
        {/* Shattered cream-tan conical Perseverance backshell */}
        <mesh position={[0.12, 0.09, 0.12]} rotation={[0.22, 0.4, -0.18]} castShadow receiveShadow>
          <coneGeometry args={[0.26, 0.2, 14, 1, true]} />
          <meshStandardMaterial color="#DFC4A6" roughness={0.62} metalness={0.22} side={THREE.DoubleSide} />
        </mesh>
        {/* Draped orange-and-white supersonic parachute canopy behind backshell */}
        <mesh position={[-0.18, 0.025, -0.18]} rotation={[-Math.PI / 2 + 0.06, 0, 0.35]} receiveShadow>
          <circleGeometry args={[0.3, 12, 0, Math.PI * 1.3]} />
          <meshStandardMaterial color="#C85A32" roughness={0.82} metalness={0.05} />
        </mesh>
        <mesh position={[-0.16, 0.028, -0.16]} rotation={[-Math.PI / 2 + 0.06, 0, 0.85]} receiveShadow>
          <circleGeometry args={[0.25, 10, 0, Math.PI * 0.7]} />
          <meshStandardMaterial color="#E6D8C8" roughness={0.82} metalness={0.05} />
        </mesh>
      </group>
    </group>
  );
}
