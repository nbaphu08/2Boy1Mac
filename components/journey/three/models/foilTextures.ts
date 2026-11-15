"use client";

import * as THREE from "three";

/**
 * Shared procedural surface textures for the hand-built / GLB-hybrid exhibit models
 * (Opus model pass M1–M7). Every texture is generated once on first use and cached at
 * module level (never disposed: the exhibits stay mounted for the whole journey).
 */

/** Small deterministic PRNG so every texture is identical between loads (poster captures). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!];
}

/**
 * Crumpled multi-layer-insulation look: hundreds of small random facets, each with its own
 * brightness, drawn into the colour canvas (as a light/dark modulation) and the bump canvas
 * (as grey height) at the same time, followed by long thin creases.
 */
function drawCrinkle(
  ctx: CanvasRenderingContext2D,
  bctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  rng: () => number,
  density = 1,
  strength = 1,
) {
  ctx.save();
  bctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();
  bctx.beginPath();
  bctx.rect(x0, y0, w, h);
  bctx.clip();
  // Broad, soft brightness blotches first (large folds catching the sun)
  const blotches = Math.round(((w * h) / 1800) * density);
  for (let i = 0; i < blotches; i++) {
    const cx = x0 + rng() * w;
    const cy = y0 + rng() * h;
    const r = 14 + rng() * 34;
    const light = rng() > 0.5;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, light ? `rgba(255,236,190,${0.16 * strength})` : `rgba(30,12,0,${0.22 * strength})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const bg = bctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    bg.addColorStop(0, light ? "rgba(200,200,200,0.5)" : "rgba(60,60,60,0.5)");
    bg.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = bg;
    bctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  const n = Math.round(((w * h) / 110) * density);
  for (let i = 0; i < n; i++) {
    const cx = x0 + rng() * w;
    const cy = y0 + rng() * h;
    const r = 4 + rng() * 14;
    const sides = 3 + Math.floor(rng() * 3);
    const a0 = rng() * Math.PI * 2;
    const light = rng();
    ctx.fillStyle =
      light > 0.5
        ? `rgba(255,246,220,${(0.05 + (light - 0.5) * 0.32) * strength})`
        : `rgba(0,0,0,${(0.05 + (0.5 - light) * 0.36) * strength})`;
    const g = Math.round(70 + light * 120);
    bctx.fillStyle = `rgba(${g},${g},${g},0.55)`;
    ctx.beginPath();
    bctx.beginPath();
    for (let k = 0; k < sides; k++) {
      const a = a0 + (k / sides) * Math.PI * 2 + (rng() - 0.5) * 0.9;
      const rr = r * (0.55 + rng() * 0.75);
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr * 0.8;
      if (k === 0) {
        ctx.moveTo(px, py);
        bctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
        bctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    bctx.closePath();
    ctx.fill();
    bctx.fill();
  }
  // Long creases where the blanket folds over itself
  const creases = Math.round(((w * h) / 9000) * density);
  for (let i = 0; i < creases; i++) {
    const sx = x0 + rng() * w;
    const sy = y0 + rng() * h;
    const len = 14 + rng() * 46;
    const ang = rng() * Math.PI;
    const ex = sx + Math.cos(ang) * len;
    const ey = sy + Math.sin(ang) * len;
    const bright = rng() > 0.5;
    ctx.strokeStyle = bright ? `rgba(255,240,200,${0.1 * strength})` : `rgba(0,0,0,${0.2 * strength})`;
    ctx.lineWidth = 0.8 + rng() * 1.0;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    bctx.strokeStyle = bright ? "rgba(235,235,235,0.7)" : "rgba(25,25,25,0.7)";
    bctx.lineWidth = 1.2 + rng() * 1.2;
    bctx.beginPath();
    bctx.moveTo(sx, sy);
    bctx.lineTo(ex, ey);
    bctx.stroke();
  }
  ctx.restore();
  bctx.restore();
}

export type MapPair = { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };

function finish(map: HTMLCanvasElement, bump: HTMLCanvasElement, repeat?: [number, number]): MapPair {
  const m = new THREE.CanvasTexture(map);
  m.colorSpace = THREE.SRGBColorSpace;
  m.anisotropy = 4;
  const b = new THREE.CanvasTexture(bump);
  if (repeat) {
    m.wrapS = m.wrapT = b.wrapS = b.wrapT = THREE.RepeatWrapping;
    m.repeat.set(repeat[0], repeat[1]);
    b.repeat.set(repeat[0], repeat[1]);
  }
  return { map: m, bumpMap: b };
}

// ─── Apollo LM descent stage side blankets ──────────────────────────────────────────────
const KAPTON_AMBER = "#B27728";
const KAPTON_DEEP = "#7E4A16";
const BLACK_FILM = "#17171A";

let lmSidesCache: MapPair | null = null;

/**
 * 8 faces × 256 px strip for the octagonal descent stage (u runs around the octagon starting at
 * the forward/ladder face, canvas top = top of the stage). Look from AS11-40-5948 / AS11-40-5927:
 * crinkled amber Kapton blankets, a black film band along the top edge and black panels on the
 * side quadrants, taped vertical seams, a thin aluminised strip along the bottom edge, and the
 * (no flag or insignia is drawn).
 */
export function getLmDescentStageTextures(): MapPair {
  if (lmSidesCache) return lmSidesCache;
  const FW = 256;
  const H = 288;
  const [c, ctx] = makeCanvas(FW * 8, H);
  const [bc, bctx] = makeCanvas(FW * 8, H);
  const rng = mulberry32(1969);
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, FW * 8, H);

  for (let f = 0; f < 8; f++) {
    const x = f * FW;
    const diagonal = f % 2 === 1;
    // Base amber Kapton with a slight per-panel tint change
    const grad = ctx.createLinearGradient(x, 0, x + FW, H);
    grad.addColorStop(0, KAPTON_AMBER);
    grad.addColorStop(0.55, f % 3 === 0 ? "#A9732A" : "#C08A36");
    grad.addColorStop(1, KAPTON_DEEP);
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, FW, H);

    // Black film: top band on every face, larger panels on the four main (leg) faces
    ctx.fillStyle = BLACK_FILM;
    const band = diagonal ? 34 + rng() * 14 : 52 + rng() * 18;
    ctx.fillRect(x, 0, FW, band);
    if (!diagonal && f !== 0) {
      // side/aft quadrants: black panel either side of the leg attachment
      const pw = 54 + rng() * 20;
      ctx.fillRect(x, band, pw, H * (0.38 + rng() * 0.2));
      ctx.fillRect(x + FW - pw, band, pw, H * (0.3 + rng() * 0.25));
    } else if (diagonal && f !== 1 && f !== 7) {
      ctx.fillRect(x + FW * 0.18, band, FW * 0.5, H * 0.22);
    }

    // Taped vertical seams + horizontal blanket joins
    ctx.fillStyle = "rgba(226,190,120,0.55)";
    for (let s = 1; s < 3; s++) ctx.fillRect(x + (FW * s) / 3 + (rng() - 0.5) * 18, band, 3, H - band);
    ctx.fillRect(x, band + (H - band) * (0.45 + rng() * 0.15), FW, 2);
    // Face edge (frame) lines
    ctx.fillStyle = "rgba(20,14,8,0.65)";
    ctx.fillRect(x, 0, 3, H);
    ctx.fillRect(x + FW - 3, 0, 3, H);
    // Aluminised Mylar strip along the bottom edge
    ctx.fillStyle = "#B9B6AE";
    ctx.fillRect(x, H - 12, FW, 12);

    drawCrinkle(ctx, bctx, x, 0, FW, H, rng, 1.15, 1);

  }
  lmSidesCache = finish(c, bc);
  return lmSidesCache;
}

let goldTileCache: MapPair | null = null;
/** Tileable crinkled amber Kapton patch (repeat-wrapped) for decks, pads, small boxes. */
export function getGoldFoilTile(): MapPair {
  if (goldTileCache) return goldTileCache;
  const S = 256;
  const [c, ctx] = makeCanvas(S, S);
  const [bc, bctx] = makeCanvas(S, S);
  ctx.fillStyle = KAPTON_AMBER;
  ctx.fillRect(0, 0, S, S);
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, S, S);
  drawCrinkle(ctx, bctx, 0, 0, S, S, mulberry32(11), 1.2, 1);
  goldTileCache = finish(c, bc, [1, 1]);
  return goldTileCache;
}

let blackTileCache: MapPair | null = null;
/** Tileable crinkled black film (H-film / black Kapton) patch. */
export function getBlackFoilTile(): MapPair {
  if (blackTileCache) return blackTileCache;
  const S = 256;
  const [c, ctx] = makeCanvas(S, S);
  const [bc, bctx] = makeCanvas(S, S);
  ctx.fillStyle = "#1C1C20";
  ctx.fillRect(0, 0, S, S);
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, S, S);
  drawCrinkle(ctx, bctx, 0, 0, S, S, mulberry32(23), 1.2, 0.7);
  blackTileCache = finish(c, bc, [1, 1]);
  return blackTileCache;
}

// ─── Lunar reflection environment for metallic foil ─────────────────────────────────────
let lunarEnvCache: THREE.Texture | null = null;

/**
 * Tiny pre-filtered environment for foil/metal on the Moon: black sky above, bright grey-beige
 * regolith below the horizon (what a crumpled blanket on the surface actually reflects). The
 * shared scene environment is dimmed to ~0.09 on the Moon, which left all metals flat and dark.
 */
export function getLunarFoilEnv(gl: THREE.WebGLRenderer): THREE.Texture {
  if (lunarEnvCache) return lunarEnvCache;
  const W = 128;
  const H = 64;
  const data = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    // DataTexture row 0 = bottom of the equirect (looking straight down)
    const v = y / (H - 1); // 0 = nadir, 1 = zenith
    const elev = (v - 0.5) * Math.PI; // -90°..+90°
    let r: number, g: number, b: number;
    if (elev < 0) {
      const t = Math.min(1, -elev / 0.6);
      // bright sunlit regolith near the horizon, a bit darker straight down
      r = 150 - t * 40;
      g = 144 - t * 38;
      b = 132 - t * 34;
    } else {
      const t = Math.min(1, elev / 0.12);
      r = 40 * (1 - t) + 2;
      g = 38 * (1 - t) + 2;
      b = 36 * (1 - t) + 3;
    }
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(gl);
  const rt = pmrem.fromEquirectangular(tex);
  pmrem.dispose();
  tex.dispose();
  lunarEnvCache = rt.texture;
  return lunarEnvCache;
}
