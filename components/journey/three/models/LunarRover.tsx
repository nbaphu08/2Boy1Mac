"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePerfBudget } from "../perfTier";
import { getGoldFoilTile, getLunarFoilEnv, mulberry32 } from "./foilTextures";

/*
 * SM-L-003 (Apollo 15) and the Apollo 17 rover · Lunar Roving Vehicle, rebuilt from NSSDCA
 * "The Apollo Lunar Roving Vehicle" + photos AS15-88-11901 and AS15-86-11603.
 * Units: metres, origin on the ground under the chassis centre, +Z = forward (antenna end).
 *  - frame 3.1 m long, wheelbase 2.3 m, tread 1.83 m, max height 1.14 m, ground clearance 0.36 m
 *  - 4 wire-mesh tyres 0.818 m × 0.23 m with titanium chevrons over ~50 % of the tread,
 *    inner bump-stop frame, spun-aluminium outer disc
 *  - thin fibreglass dust guards (fenders) above each wheel
 *  - two folding tubular seats with nylon webbing, footrests, T-handle hand controller between them,
 *    control & display console with the low-gain antenna mast
 *  - umbrella-type mesh high-gain antenna on a mast and the TV camera (GCTA) at the front,
 *    LCRU communications box between them; tool / sample pallet on the aft chassis
 */

const WHEEL_R = 0.409;
const WHEEL_W = 0.23;
const TRACK_HALF = 0.915; // 1.83 m tread
const AXLE_Z = 1.15; // 2.3 m wheelbase

let tyreTexCache: THREE.CanvasTexture | null = null;
/** Woven zinc-coated steel-wire mesh with titanium chevrons over the central tread (alpha-tested). */
function getTyreTexture(): THREE.CanvasTexture {
  if (tyreTexCache) return tyreTexCache;
  const W = 256;
  const H = 128; // v runs across the tyre width (profile), u around the circumference
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  // Woven wire diamonds
  ctx.strokeStyle = "rgba(150,150,146,1)";
  ctx.lineWidth = 1.6;
  for (let x = -H; x < W + H; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H * 0.6, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + H * 0.6, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  // Titanium chevrons (inverted V across the tread), ~50 % of the contact area
  ctx.fillStyle = "rgba(122,124,124,1)";
  for (let x = 0; x < W; x += 21) {
    ctx.beginPath();
    ctx.moveTo(x, H * 0.2);
    ctx.lineTo(x + 9, H * 0.5);
    ctx.lineTo(x, H * 0.8);
    ctx.lineTo(x + 7, H * 0.8);
    ctx.lineTo(x + 16, H * 0.5);
    ctx.lineTo(x + 7, H * 0.2);
    ctx.closePath();
    ctx.fill();
  }
  // Lunar dust ground into the weave
  const rng = mulberry32(15);
  for (let i = 0; i < 900; i++) {
    const x = rng() * W;
    const y = rng() * H;
    ctx.fillStyle = `rgba(${120 + rng() * 40},${116 + rng() * 38},${108 + rng() * 34},${0.35 + rng() * 0.5})`;
    ctx.fillRect(x, y, 1 + rng() * 2.5, 1 + rng() * 2.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.repeat.set(9, 1);
  t.anisotropy = 4;
  tyreTexCache = t;
  return t;
}

let meshDishTexCache: THREE.CanvasTexture | null = null;
/** Gold-tinted knitted mesh of the umbrella high-gain antenna. */
function getDishMeshTexture(): THREE.CanvasTexture {
  if (meshDishTexCache) return meshDishTexCache;
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(196,170,120,0.55)";
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(230,214,170,0.95)";
  ctx.lineWidth = 1;
  for (let i = 0; i < S; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, S);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(S, i);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 2);
  meshDishTexCache = t;
  return t;
}

let railTexCache: THREE.CanvasTexture | null = null;
/** Chassis side members: white thermal paint with dark bands, dusty. */
function getRailTexture(): THREE.CanvasTexture {
  if (railTexCache) return railTexCache;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 16;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#CFCDC6";
  ctx.fillRect(0, 0, 256, 16);
  const rng = mulberry32(7);
  let x = 0;
  while (x < 256) {
    const w = 6 + rng() * 22;
    if (rng() > 0.55) {
      ctx.fillStyle = "#3B3C3E";
      ctx.fillRect(x, 0, w, 16);
    }
    x += w + 4 + rng() * 18;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  rangeWrap(t);
  railTexCache = t;
  return t;
}
function rangeWrap(t: THREE.Texture) {
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
}

let webTexCache: THREE.CanvasTexture | null = null;
/** Seat webbing: dark nylon straps woven over / under (as in AS15-88-11901). */
function getWebbingTexture(): THREE.CanvasTexture {
  if (webTexCache) return webTexCache;
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, S, S);
  const strap = 26;
  const gap = 6;
  const step = strap + gap;
  // horizontal straps (light grey nylon) and vertical straps (darker), woven over/under
  for (let i = 0; i < S; i += step) {
    ctx.fillStyle = "#9A9890";
    ctx.fillRect(0, i, S, strap);
  }
  for (let i = 0; i < S; i += step) {
    for (let y = 0; y < S; y += step) {
      const over = ((i + y) / step) % 2 === 0;
      if (over) {
        ctx.fillStyle = "#55565A";
        ctx.fillRect(i, y, strap, strap);
      }
      ctx.fillStyle = "#55565A";
      ctx.fillRect(i, y + strap, strap, gap);
    }
  }
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  for (let i = 0; i < S; i += step) {
    ctx.strokeRect(0, i + 0.5, S, strap - 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  webTexCache = t;
  return t;
}

/** Tyre cross-section revolved: rounded mesh carcass from the rim (r 0.30) out to the tread (r 0.409). */
function makeTyreGeometry(segments: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  const half = WHEEL_W / 2;
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // across the width
    const y = -half + t * WHEEL_W;
    const shoulder = 1 - Math.pow(Math.abs(t - 0.5) * 2, 4);
    const r = 0.322 + (WHEEL_R - 0.322) * (0.25 + 0.75 * shoulder);
    pts.push(new THREE.Vector2(r, y));
  }
  const g = new THREE.LatheGeometry(pts, segments);
  g.rotateZ(Math.PI / 2); // axle along X
  return g;
}

/** Shallow paraboloid for the umbrella HGA (opens toward +Y before tilting). */
function makeDishGeometry(radius: number, depth: number, segments: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const r = (i / 8) * radius;
    pts.push(new THREE.Vector2(r, (r * r) / (radius * radius) * depth));
  }
  return new THREE.LatheGeometry(pts, segments);
}

/** Fender: a thin curved fibreglass shell over the top/front/back of the wheel. */
function makeFenderGeometry(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.47, 0.47, 0.3, 24, 1, true, -Math.PI * 0.42, Math.PI * 0.9);
  g.rotateZ(Math.PI / 2); // axis along X
  return g;
}

type Seg = { a: [number, number, number]; b: [number, number, number]; r: number; m: "frame" | "white" | "dark" };

const UP = new THREE.Vector3(0, 1, 0);
function segTransform(s: Seg) {
  const va = new THREE.Vector3(...s.a);
  const vb = new THREE.Vector3(...s.b);
  const dir = vb.clone().sub(va);
  const len = Math.max(dir.length(), 1e-4);
  const mid = va.clone().addScaledVector(dir, 0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  return { pos: mid, quat: q, scale: new THREE.Vector3(s.r, len, s.r) };
}

export function LunarRover({ scale = 1 }: { scale?: number }) {
  const gl = useThree((s) => s.gl);
  const budget = usePerfBudget();
  const low = budget.tier === "low";
  const env = useMemo(() => getLunarFoilEnv(gl), [gl]);

  const kit = useMemo(() => {
    const tyreTex = getTyreTexture();
    const gold = getGoldFoilTile();
    const seg = low ? 20 : 36;
    const geos = {
      tyre: makeTyreGeometry(seg),
      bumpStop: new THREE.CylinderGeometry(0.31, 0.31, 0.17, seg, 1, true).rotateZ(Math.PI / 2),
      disc: new THREE.CircleGeometry(0.3, seg).rotateY(Math.PI / 2),
      discRing: new THREE.RingGeometry(0.2, 0.3, seg).rotateY(Math.PI / 2),
      hub: new THREE.CylinderGeometry(0.075, 0.09, 0.06, 16).rotateZ(Math.PI / 2),
      drive: new THREE.CylinderGeometry(0.11, 0.11, 0.16, 16).rotateZ(Math.PI / 2),
      fender: makeFenderGeometry(),
      tube: new THREE.CylinderGeometry(1, 1, 1, low ? 6 : 8),
      box: new THREE.BoxGeometry(1, 1, 1),
      plane: new THREE.PlaneGeometry(1, 1),
      dish: makeDishGeometry(0.455, 0.13, low ? 16 : 28),
      helix: new THREE.CylinderGeometry(0.035, 0.035, 0.24, 10),
      lens: new THREE.CylinderGeometry(0.035, 0.045, 0.1, 14).rotateX(Math.PI / 2),
    };
    const mats = {
      frame: new THREE.MeshStandardMaterial({ color: "#BFC1C2", metalness: 0.7, roughness: 0.42, envMap: env, envMapIntensity: 0.9 }),
      white: new THREE.MeshStandardMaterial({ color: "#D2D0C9", metalness: 0.08, roughness: 0.7, envMap: env, envMapIntensity: 0.6 }),
      dark: new THREE.MeshStandardMaterial({ color: "#2C2D30", metalness: 0.35, roughness: 0.6, envMap: env, envMapIntensity: 0.6 }),
      rail: new THREE.MeshStandardMaterial({ map: getRailTexture(), metalness: 0.1, roughness: 0.66, envMap: env, envMapIntensity: 0.6 }),
      tyre: new THREE.MeshStandardMaterial({
        map: tyreTex,
        alphaTest: 0.35,
        side: THREE.DoubleSide,
        metalness: 0.55,
        roughness: 0.6,
        envMap: env,
        envMapIntensity: 0.8,
      }),
      bumpStop: new THREE.MeshStandardMaterial({ color: "#3E3D3B", metalness: 0.5, roughness: 0.6, side: THREE.DoubleSide }),
      disc: new THREE.MeshStandardMaterial({ color: "#B4B1A8", metalness: 0.4, roughness: 0.55, envMap: env, side: THREE.DoubleSide }),
      discRing: new THREE.MeshStandardMaterial({ color: "#5E5D59", metalness: 0.5, roughness: 0.5, envMap: env, side: THREE.DoubleSide }),
      fender: new THREE.MeshStandardMaterial({ color: "#B9B7B1", metalness: 0.2, roughness: 0.55, envMap: env, envMapIntensity: 0.6, side: THREE.DoubleSide }),
      web: new THREE.MeshStandardMaterial({ map: getWebbingTexture(), alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.05, roughness: 0.85 }),
      dish: new THREE.MeshStandardMaterial({
        map: getDishMeshTexture(),
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        metalness: 0.5,
        roughness: 0.5,
        envMap: env,
      }),
      gold: new THREE.MeshStandardMaterial({ map: gold.map, bumpMap: gold.bumpMap, bumpScale: 1.2, metalness: 0.6, roughness: 0.38, envMap: env }),
      lcru: new THREE.MeshStandardMaterial({ color: "#8A7868", bumpMap: gold.bumpMap, bumpScale: 1.0, metalness: 0.25, roughness: 0.6, envMap: env, envMapIntensity: 0.6 }),
      glass: new THREE.MeshStandardMaterial({ color: "#0E1116", metalness: 0.9, roughness: 0.12, envMap: env }),
    };
    return { geos, mats };
  }, [env, low]);

  useEffect(
    () => () => {
      Object.values(kit.geos).forEach((g) => g.dispose());
      Object.values(kit.mats).forEach((m) => m.dispose());
    },
    [kit],
  );

  // ── Tubular frame members (chassis, suspension arms, seat frames, pallet, masts) ──
  const segs = useMemo<Seg[]>(() => {
    const s: Seg[] = [];
    const W = 0.56; // chassis half-width
    const Y = 0.44; // chassis main member height
    const L = 1.55;
    // perimeter + three-part chassis cross members
    for (const z of [-L, -0.78, 0.78, L]) s.push({ a: [-W, Y, z], b: [W, Y, z], r: 0.022, m: "frame" });
    // suspension: upper & lower arms from chassis to each wheel's traction drive
    for (const zs of [-1, 1]) {
      for (const xs of [-1, 1]) {
        const wz = zs * AXLE_Z;
        const wx = xs * (TRACK_HALF - 0.16);
        s.push({ a: [xs * W, Y + 0.05, wz - 0.18], b: [wx, WHEEL_R + 0.07, wz], r: 0.016, m: "frame" });
        s.push({ a: [xs * W, Y + 0.05, wz + 0.18], b: [wx, WHEEL_R + 0.07, wz], r: 0.016, m: "frame" });
        s.push({ a: [xs * W, Y - 0.06, wz - 0.2], b: [wx, WHEEL_R - 0.07, wz], r: 0.018, m: "frame" });
        s.push({ a: [xs * W, Y - 0.06, wz + 0.2], b: [wx, WHEEL_R - 0.07, wz], r: 0.018, m: "frame" });
        // fender support strut
        s.push({ a: [xs * W, Y + 0.02, wz], b: [xs * (TRACK_HALF - 0.08), 0.84, wz], r: 0.01, m: "frame" });
      }
    }
    // seats (pan + backrest tubular frames)
    for (const sx of [-0.31, 0.31]) {
      const x0 = sx - 0.22;
      const x1 = sx + 0.22;
      const zF = 0.2;
      const zB = -0.24;
      const yP = 0.6;
      s.push({ a: [x0, yP, zF], b: [x0, yP, zB], r: 0.013, m: "frame" });
      s.push({ a: [x1, yP, zF], b: [x1, yP, zB], r: 0.013, m: "frame" });
      s.push({ a: [x0, yP, zF], b: [x1, yP, zF], r: 0.013, m: "frame" });
      // backrest rising to 1.14 m (max vehicle height), leaning back
      s.push({ a: [x0, yP, zB], b: [x0, 1.12, zB - 0.12], r: 0.013, m: "frame" });
      s.push({ a: [x1, yP, zB], b: [x1, 1.12, zB - 0.12], r: 0.013, m: "frame" });
      s.push({ a: [x0, 1.12, zB - 0.12], b: [x1, 1.12, zB - 0.12], r: 0.013, m: "frame" });
      // legs of the seat frame down to the floor
      s.push({ a: [x0, yP, zF], b: [x0, Y + 0.03, zF + 0.05], r: 0.011, m: "frame" });
      s.push({ a: [x1, yP, zF], b: [x1, Y + 0.03, zF + 0.05], r: 0.011, m: "frame" });
      // armrest / outboard handhold
      const xo = sx < 0 ? x0 - 0.02 : x1 + 0.02;
      s.push({ a: [xo, 0.78, 0.15], b: [xo, 0.78, -0.22], r: 0.01, m: "frame" });
      s.push({ a: [xo, 0.78, 0.15], b: [xo, Y + 0.04, 0.32], r: 0.01, m: "frame" });
      // footrest frame
      s.push({ a: [x0 + 0.04, Y + 0.05, 0.58], b: [x1 - 0.04, Y + 0.05, 0.58], r: 0.01, m: "frame" });
    }
    // console post & hand-controller pedestal
    s.push({ a: [0, Y, 0.62], b: [0, 0.88, 0.62], r: 0.02, m: "frame" });
    s.push({ a: [0, Y, 0.18], b: [0, 0.66, 0.18], r: 0.024, m: "dark" });
    // low-gain (helix) antenna mast on the console
    s.push({ a: [0.02, 0.98, 0.66], b: [0.02, 1.52, 0.64], r: 0.009, m: "frame" });
    // high-gain antenna mast (front, left of centre) with a dogleg
    s.push({ a: [-0.24, Y + 0.08, 1.32], b: [-0.24, 1.32, 1.3], r: 0.016, m: "frame" });
    s.push({ a: [-0.24, 1.32, 1.3], b: [-0.2, 1.72, 1.24], r: 0.013, m: "frame" });
    // TV camera (GCTA) mast, front right of the HGA mast
    s.push({ a: [0.16, Y + 0.08, 1.42], b: [0.16, 1.12, 1.4], r: 0.014, m: "frame" });
    // aft pallet frame (tool / sample carrier), rising behind the seats
    for (const x of [-0.42, 0.42]) {
      s.push({ a: [x, Y, -1.22], b: [x, 1.04, -1.22], r: 0.014, m: "frame" });
      s.push({ a: [x, Y, -1.5], b: [x, 0.92, -1.5], r: 0.012, m: "frame" });
    }
    s.push({ a: [-0.42, 1.04, -1.22], b: [0.42, 1.04, -1.22], r: 0.014, m: "frame" });
    s.push({ a: [-0.42, 0.92, -1.5], b: [0.42, 0.92, -1.5], r: 0.012, m: "frame" });
    // tools standing in the carrier (tongs, scoop handle, rake handle)
    s.push({ a: [-0.3, 0.6, -1.4], b: [-0.34, 1.32, -1.42], r: 0.008, m: "frame" });
    s.push({ a: [-0.2, 0.6, -1.42], b: [-0.18, 1.26, -1.46], r: 0.008, m: "frame" });
    s.push({ a: [0.28, 0.6, -1.4], b: [0.3, 1.22, -1.44], r: 0.008, m: "dark" });
    return s;
  }, []);

  const segXf = useMemo(() => segs.map(segTransform), [segs]);
  const ribXf = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return segTransform({
          a: [0, 0, 0],
          b: [Math.cos(a) * 0.455, 0.13, Math.sin(a) * 0.455],
          r: 0.005,
          m: "white",
        });
      }),
    [],
  );

  const wheels: [number, number][] = [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ];

  const { geos: G, mats: M } = kit;
  return (
    <group scale={scale}>
      {/* Chassis side members (thermal-painted) & floor panels */}
      {[-0.56, 0.56].map((x) => (
        <mesh key={x} geometry={G.box} material={M.rail} position={[x, 0.44, 0]} scale={[0.05, 0.075, 3.1]} />
      ))}
      <mesh geometry={G.box} material={M.white} position={[0, 0.43, 0]} scale={[1.08, 0.025, 1.52]} />
      <mesh geometry={G.box} material={M.frame} position={[0, 0.43, 1.17]} scale={[1.08, 0.02, 0.74]} />
      <mesh geometry={G.box} material={M.frame} position={[0, 0.43, -1.17]} scale={[1.08, 0.02, 0.74]} />
      {/* Batteries / electronics boxes on the forward chassis */}
      <mesh geometry={G.box} material={M.white} position={[0, 0.53, 0.98]} scale={[0.86, 0.17, 0.32]} />
      <mesh geometry={G.box} material={M.dark} position={[0.3, 0.63, 0.98]} scale={[0.22, 0.03, 0.28]} />

      {segXf.map((t, i) => (
        <mesh
          key={i}
          geometry={G.tube}
          material={segs[i].m === "frame" ? M.frame : segs[i].m === "dark" ? M.dark : M.white}
          position={t.pos}
          quaternion={t.quat}
          scale={t.scale}
        />
      ))}

      {/* Wheels + fenders */}
      {wheels.map(([xs, zs], i) => (
        <group key={i} position={[xs * TRACK_HALF, WHEEL_R - 0.015, zs * AXLE_Z]}>
          <mesh geometry={G.tyre} material={M.tyre} />
          <mesh geometry={G.bumpStop} material={M.bumpStop} />
          {/* outer spun-aluminium disc and hub */}
          <group position={[xs * 0.07, 0, 0]} rotation={[0, xs > 0 ? 0 : Math.PI, 0]}>
            <mesh geometry={G.disc} material={M.disc} />
            <mesh geometry={G.discRing} material={M.discRing} position={[0.002, 0, 0]} />
            {/* dark diagonal hub band seen on the outer discs in AS15-88-11901 */}
            <mesh geometry={G.box} material={M.discRing} position={[0.004, 0, 0]} rotation={[0.7, 0, 0]} scale={[0.004, 0.42, 0.05]} />
          </group>
          <mesh geometry={G.hub} material={M.frame} position={[xs * 0.1, 0, 0]} />
          {/* inboard traction drive */}
          <mesh geometry={G.drive} material={M.dark} position={[-xs * 0.12, 0, 0]} />
          {/* thin fibreglass dust guard */}
          <mesh geometry={G.fender} material={M.fender} position={[0, 0.01, 0]} />
        </group>
      ))}

      {/* Seats: webbing on pan & backrest; footrests */}
      {[-0.31, 0.31].map((sx) => (
        <group key={sx}>
          <mesh geometry={G.plane} material={M.web} position={[sx, 0.602, -0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.44, 0.44, 1]} />
          <mesh
            geometry={G.plane}
            material={M.web}
            position={[sx, 0.86, -0.3]}
            rotation={[-0.228, 0, 0]}
            scale={[0.44, 0.52, 1]}
          />
          <mesh geometry={G.box} material={M.frame} position={[sx, 0.5, 0.6]} rotation={[0.5, 0, 0]} scale={[0.36, 0.012, 0.2]} />
        </group>
      ))}

      {/* Control & display console (dark face, no markings) + T-handle hand controller */}
      <group position={[0, 0.94, 0.62]} rotation={[-0.75, 0, 0]}>
        <mesh geometry={G.box} material={M.white} scale={[0.36, 0.22, 0.1]} />
        <mesh geometry={G.box} material={M.dark} position={[0, 0, 0.052]} scale={[0.3, 0.16, 0.006]} />
      </group>
      <mesh geometry={G.box} material={M.dark} position={[0, 0.68, 0.18]} scale={[0.08, 0.05, 0.1]} />
      <mesh geometry={G.tube} material={M.frame} position={[0, 0.76, 0.19]} scale={[0.009, 0.14, 0.009]} />
      <mesh geometry={G.tube} material={M.dark} position={[0, 0.83, 0.19]} rotation={[0, 0, Math.PI / 2]} scale={[0.014, 0.12, 0.014]} />
      {/* Low-gain helix antenna */}
      <mesh geometry={G.helix} material={M.white} position={[0.02, 1.62, 0.64]} />

      {/* LCRU (communications relay) in its blanket, between the antenna masts */}
      <mesh geometry={G.box} material={M.lcru} position={[0, 0.72, 1.36]} scale={[0.42, 0.26, 0.3]} />

      {/* Umbrella high-gain antenna, ~0.9 m mesh dish with ribs, pointed up toward Earth */}
      <group position={[-0.2, 1.74, 1.22]} rotation={[0.45, 0.3, 0]}>
        <mesh geometry={G.dish} material={M.dish} />
        {ribXf.map((t, i) => (
          <mesh key={i} geometry={G.tube} material={M.white} position={t.pos} quaternion={t.quat} scale={t.scale} />
        ))}
        <mesh geometry={G.tube} material={M.white} position={[0, 0.12, 0]} scale={[0.008, 0.24, 0.008]} />
        <mesh geometry={G.box} material={M.white} position={[0, 0.25, 0]} scale={[0.05, 0.04, 0.05]} />
      </group>

      {/* TV camera (GCTA) in gold blanket with dark lens */}
      <group position={[0.16, 1.2, 1.42]} rotation={[0.05, 0.25, 0]}>
        <mesh geometry={G.box} material={M.gold} scale={[0.13, 0.17, 0.3]} />
        <mesh geometry={G.lens} material={M.glass} position={[0, 0.01, 0.19]} />
      </group>

      {/* Aft pallet: sample bags / tool carrier boxes and the mesh-backed gate */}
      <mesh geometry={G.box} material={M.white} position={[0, 0.66, -1.36]} scale={[0.78, 0.4, 0.24]} />
      <mesh geometry={G.box} material={M.frame} position={[0.2, 0.92, -1.36]} scale={[0.3, 0.16, 0.2]} />
      <mesh geometry={G.box} material={M.white} position={[-0.2, 0.96, -1.3]} scale={[0.36, 0.1, 0.12]} />
      <mesh geometry={G.box} material={M.dark} position={[0.12, 0.62, -1.52]} scale={[0.5, 0.2, 0.04]} />
    </group>
  );
}
