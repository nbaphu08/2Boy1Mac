"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getGoldFoilTile, mulberry32 } from "./foilTextures";

/*
 * SM-M-005 · Phoenix Mars Lander (Opus M3), from the Phoenix landing press kit + PIA11719 self-portrait.
 * Metres, origin on the ground under the deck centre.
 *  - ~1.5 m ten-sided science deck on three legs, instruments on top: TEGA (row of small oven doors),
 *    MECA, SSI stereo camera on its mast (~2 m above ground), MET mast with the lidar box beside it
 *  - two ten-sided UltraFlex arrays (5.52 m span deployed); one is shown collapsed, as HiRISE later
 *    showed the arrays broken, very likely by winter CO2 ice
 *  - 2.35 m robotic arm with the scoop over the dug trench; light frost in the lander's shadow
 */

const DECK_Y = 0.92;
const DECK_R = 0.78; // ~1.5 m across
const ARRAY_R = 1.05; // 2.1 m ten-sided array
const UP = new THREE.Vector3(0, 1, 0);

function tube(a: [number, number, number], b: [number, number, number], r: number) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const d = vb.clone().sub(va);
  const len = Math.max(d.length(), 1e-4);
  return {
    pos: va.clone().addScaledVector(d, 0.5),
    quat: new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()),
    scale: new THREE.Vector3(r, len, r),
  };
}

let arrayTexCache: THREE.CanvasTexture | null = null;
/** Dusty ten-gore UltraFlex array: tan-grey cells, bright ribs, the small pale cell patches seen in PIA11719. */
function getArrayTexture(): THREE.CanvasTexture {
  if (arrayTexCache) return arrayTexCache;
  const S = 512;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  const cx = S / 2;
  const R = S / 2 - 4;
  ctx.fillStyle = "#4A3A31";
  ctx.fillRect(0, 0, S, S);
  const rng = mulberry32(5);
  for (let s = 0; s < 10; s++) {
    const a0 = (s / 10) * Math.PI * 2;
    const a1 = ((s + 1) / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cx);
    ctx.lineTo(cx + Math.cos(a0) * R, cx + Math.sin(a0) * R);
    ctx.lineTo(cx + Math.cos(a1) * R, cx + Math.sin(a1) * R);
    ctx.closePath();
    ctx.fillStyle = s % 2 ? "#54423A" : "#4C3B33";
    ctx.fill();
    // cell rows across the gore
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "rgba(40,28,22,0.45)";
    ctx.lineWidth = 1;
    for (let r = 30; r < R; r += 14) {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * r, cx + Math.sin(a0) * r);
      ctx.lineTo(cx + Math.cos(a1) * r, cx + Math.sin(a1) * r);
      ctx.stroke();
    }
    for (let k = 0; k < 9; k++) {
      const am = a0 + (a1 - a0) * (0.2 + rng() * 0.6);
      const rr = 50 + rng() * (R - 70);
      ctx.fillStyle = "rgba(205,192,174,0.6)";
      ctx.fillRect(cx + Math.cos(am) * rr - 3, cx + Math.sin(am) * rr - 2, 7, 4);
    }
    ctx.restore();
    // bright rib
    ctx.strokeStyle = "#CDBBA6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cx);
    ctx.lineTo(cx + Math.cos(a0) * R, cx + Math.sin(a0) * R);
    ctx.stroke();
  }
  // dust film
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(176,112,74,${0.05 + rng() * 0.12})`;
    ctx.fillRect(rng() * S, rng() * S, 2 + rng() * 6, 2 + rng() * 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  arrayTexCache = t;
  return t;
}

let frostTexCache: THREE.CanvasTexture | null = null;
function getFrostTexture(): THREE.CanvasTexture {
  if (frostTexCache) return frostTexCache;
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  const rng = mulberry32(77);
  for (let i = 0; i < 60; i++) {
    const x = S / 2 + (rng() - 0.5) * S * 0.7;
    const y = S / 2 + (rng() - 0.5) * S * 0.7;
    const r = 6 + rng() * 18;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(236,240,246,0.55)");
    g.addColorStop(1, "rgba(236,240,246,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  frostTexCache = t;
  return t;
}

let trenchTexCache: THREE.CanvasTexture | null = null;
/** Arm-dug trench: soft-edged dark disturbed soil with bright water-ice exposed at the bottom. */
function getTrenchTexture(): THREE.CanvasTexture {
  if (trenchTexCache) return trenchTexCache;
  const W = 128;
  const H = 96;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const rng = mulberry32(2008);
  const g = ctx.createRadialGradient(W / 2, H / 2, 6, W / 2, H / 2, W / 2);
  g.addColorStop(0, "rgba(70,34,22,0.95)");
  g.addColorStop(0.6, "rgba(84,42,26,0.8)");
  g.addColorStop(1, "rgba(110,56,34,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) {
    const x = W * 0.3 + rng() * W * 0.4;
    const y = H * 0.35 + rng() * H * 0.3;
    const r = 2 + rng() * 6;
    const ig = ctx.createRadialGradient(x, y, 0, x, y, r);
    ig.addColorStop(0, "rgba(232,238,244,0.95)");
    ig.addColorStop(1, "rgba(232,238,244,0)");
    ctx.fillStyle = ig;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  trenchTexCache = t;
  return t;
}

export function PhoenixLander() {
  const kit = useMemo(() => {
    const gold = getGoldFoilTile();
    // ten-sided array disc: circle geometry gives a planar UV for the gore texture
    const arrayGeo = new THREE.CircleGeometry(ARRAY_R, 10);
    arrayGeo.rotateX(-Math.PI / 2);
    const brokenGeo = new THREE.CircleGeometry(ARRAY_R, 10, 0, Math.PI * 1.4);
    brokenGeo.rotateX(-Math.PI / 2);
    const geos = {
      deck: new THREE.CylinderGeometry(DECK_R, DECK_R, 0.06, 10),
      body: new THREE.CylinderGeometry(0.58, 0.5, 0.34, 10),
      tank: new THREE.SphereGeometry(0.19, 16, 12),
      tube: new THREE.CylinderGeometry(1, 1, 1, 8),
      box: new THREE.BoxGeometry(1, 1, 1),
      pad: new THREE.CylinderGeometry(0.15, 0.17, 0.05, 14),
      array: arrayGeo,
      broken: brokenGeo,
      frost: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      scoop: new THREE.CylinderGeometry(0.07, 0.05, 0.16, 12, 1, true, 0, Math.PI),
    };
    const mats = {
      deck: new THREE.MeshStandardMaterial({ color: "#B8A394", roughness: 0.62, metalness: 0.35 }),
      white: new THREE.MeshStandardMaterial({ color: "#D6C8BA", roughness: 0.6, metalness: 0.15 }),
      metal: new THREE.MeshStandardMaterial({ color: "#A8998C", roughness: 0.45, metalness: 0.7 }),
      dark: new THREE.MeshStandardMaterial({ color: "#2E2A28", roughness: 0.55, metalness: 0.4 }),
      gold: new THREE.MeshStandardMaterial({
        map: gold.map,
        bumpMap: gold.bumpMap,
        bumpScale: 1.2,
        color: "#D8B898",
        roughness: 0.5,
        metalness: 0.55,
      }),
      array: new THREE.MeshStandardMaterial({
        map: getArrayTexture(),
        roughness: 0.78,
        metalness: 0.12,
        side: THREE.DoubleSide,
      }),
      trench: new THREE.MeshStandardMaterial({
        map: getTrenchTexture(),
        transparent: true,
        depthWrite: false,
        roughness: 0.9,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      frost: new THREE.MeshStandardMaterial({
        map: getFrostTexture(),
        opacity: 0.38,
        transparent: true,
        depthWrite: false,
        roughness: 0.5,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    };
    return { geos, mats };
  }, []);

  useEffect(
    () => () => {
      Object.values(kit.geos).forEach((g) => g.dispose());
      Object.values(kit.mats).forEach((m) => m.dispose());
    },
    [kit],
  );

  const struts = useMemo(() => {
    const t: ReturnType<typeof tube>[] = [];
    // three legs at 90°, 210°, 330° (arrays on ±X, arm toward +Z)
    for (const deg of [90 + 180, 30, 150]) {
      const a = (deg * Math.PI) / 180;
      const fx = Math.cos(a) * 1.02;
      const fz = Math.sin(a) * 1.02;
      const tx = Math.cos(a) * 0.5;
      const tz = Math.sin(a) * 0.5;
      t.push(tube([tx, DECK_Y - 0.18, tz], [fx, 0.06, fz], 0.032));
      const side = a + Math.PI / 2;
      t.push(tube([tx + Math.cos(side) * 0.28, DECK_Y - 0.3, tz + Math.sin(side) * 0.28], [fx, 0.1, fz], 0.016));
      t.push(tube([tx - Math.cos(side) * 0.28, DECK_Y - 0.3, tz - Math.sin(side) * 0.28], [fx, 0.1, fz], 0.016));
    }
    // array booms
    t.push(tube([DECK_R - 0.05, DECK_Y, 0], [DECK_R + 0.32, DECK_Y + 0.02, 0], 0.025));
    t.push(tube([-DECK_R + 0.05, DECK_Y, 0], [-DECK_R - 0.3, DECK_Y - 0.12, 0], 0.025));
    // SSI mast & MET mast
    t.push(tube([-0.2, DECK_Y, 0.32], [-0.2, 1.88, 0.32], 0.03));
    t.push(tube([0.28, DECK_Y, -0.36], [0.28, 2.0, -0.36], 0.012));
    // robotic arm: shoulder → elbow → wrist, reaching the trench
    t.push(tube([0.36, DECK_Y + 0.08, 0.46], [0.95, 1.5, 0.78], 0.035));
    t.push(tube([0.95, 1.5, 0.78], [1.14, 0.3, 0.84], 0.03));
    return t;
  }, []);

  const { geos: G, mats: M } = kit;
  const tegaDoors = Array.from({ length: 8 }, (_, i) => i);
  return (
    <group>
      {/* Deck + underside body with propellant tanks */}
      <mesh geometry={G.deck} material={M.deck} position={[0, DECK_Y, 0]} rotation={[0, Math.PI / 10, 0]} />
      <mesh geometry={G.body} material={M.gold} position={[0, DECK_Y - 0.21, 0]} rotation={[0, Math.PI / 10, 0]} />
      <mesh geometry={G.tank} material={M.metal} position={[0.28, DECK_Y - 0.42, 0.1]} />
      <mesh geometry={G.tank} material={M.metal} position={[-0.28, DECK_Y - 0.42, -0.1]} />

      {struts.map((s, i) => (
        <mesh key={i} geometry={G.tube} material={M.metal} position={s.pos} quaternion={s.quat} scale={s.scale} />
      ))}
      {[270, 30, 150].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return <mesh key={deg} geometry={G.pad} material={M.metal} position={[Math.cos(a) * 1.02, 0.025, Math.sin(a) * 1.02]} />;
      })}

      {/* TEGA: long box with a row of eight small oven doors */}
      <group position={[0.02, DECK_Y + 0.13, -0.05]} rotation={[0, 0.2, 0]}>
        <mesh geometry={G.box} material={M.white} scale={[0.62, 0.2, 0.22]} />
        {tegaDoors.map((i) => (
          <mesh key={i} geometry={G.box} material={M.metal} position={[-0.26 + i * 0.074, 0.105, 0]} scale={[0.05, 0.012, 0.09]} />
        ))}
      </group>
      {/* MECA wet-chemistry box */}
      <mesh geometry={G.box} material={M.white} position={[-0.36, DECK_Y + 0.14, -0.3]} rotation={[0, -0.3, 0]} scale={[0.32, 0.24, 0.28]} />
      {/* lidar box (aims up) beside the MET mast */}
      <mesh geometry={G.box} material={M.white} position={[0.42, DECK_Y + 0.09, -0.28]} scale={[0.16, 0.14, 0.14]} />
      <mesh geometry={G.box} material={M.dark} position={[0.42, DECK_Y + 0.165, -0.28]} scale={[0.07, 0.01, 0.07]} />
      {/* MET mast telltale */}
      <mesh geometry={G.tube} material={M.white} position={[0.28, 2.0, -0.36]} scale={[0.008, 0.1, 0.008]} />
      {/* SSI stereo camera head */}
      <group position={[-0.2, 1.94, 0.32]} rotation={[0.25, 0.6, 0]}>
        <mesh geometry={G.box} material={M.white} scale={[0.3, 0.12, 0.12]} />
        <mesh geometry={G.box} material={M.dark} position={[-0.08, 0, 0.062]} scale={[0.05, 0.05, 0.01]} />
        <mesh geometry={G.box} material={M.dark} position={[0.08, 0, 0.062]} scale={[0.05, 0.05, 0.01]} />
      </group>
      {/* Robotic-arm shoulder, wrist and scoop over the trench */}
      <mesh geometry={G.box} material={M.white} position={[0.36, DECK_Y + 0.1, 0.46]} scale={[0.14, 0.14, 0.14]} />
      <mesh geometry={G.scoop} material={M.metal} position={[1.14, 0.22, 0.85]} rotation={[0.9, 0.2, Math.PI / 2]} />

      {/* Intact array (left), slightly drooping */}
      <mesh geometry={G.array} material={M.array} position={[-DECK_R - 0.3 - ARRAY_R, DECK_Y - 0.14, 0]} rotation={[0.03, 0, 0.06]} />
      {/* Collapsed array (right): torn, tipped down onto the ground */}
      <group position={[DECK_R + 0.32, DECK_Y + 0.02, 0]} rotation={[0.12, -0.1, -0.52]}>
        <mesh geometry={G.broken} material={M.array} position={[ARRAY_R, 0, 0]} rotation={[0, 0.6, 0]} />
      </group>
      <mesh geometry={G.box} material={M.array} position={[2.3, 0.05, 0.85]} rotation={[0.1, 0.5, 0.18]} scale={[0.5, 0.012, 0.34]} />

      {/* Trench dug by the arm ("Dodo-Goldilocks"), bright ice at the bottom */}
      <mesh geometry={G.frost} material={M.trench} position={[1.18, 0.012, 0.86]} rotation={[0, -0.45, 0]} scale={[0.6, 1, 0.36]} />
      {/* Frost lingering in the lander's shadow */}
      <mesh geometry={G.frost} material={M.frost} position={[0.1, 0.012, -0.35]} scale={[1.6, 1, 1.2]} />
      <mesh geometry={G.frost} material={M.frost} position={[-1.0, 0.012, -0.55]} scale={[1.2, 1, 0.9]} />
    </group>
  );
}
