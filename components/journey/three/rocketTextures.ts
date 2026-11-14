import * as THREE from "three";

type TexturePair = {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap?: THREE.CanvasTexture;
};

let coreCache: TexturePair | null = null;
let srbCache: TexturePair | null = null;
let orionCache: TexturePair | null = null;
let fairingCache: TexturePair | null = null;
let nozzleCache: TexturePair | null = null;
let kaptonBumpCache: THREE.CanvasTexture | null = null;
let solarCache: THREE.CanvasTexture | null = null;
let sparkTexCache: THREE.CanvasTexture | null = null;
let smokeTexCache: THREE.CanvasTexture | null = null;

/** Draw a NASA photogrammetry black/white quadrant calibration target. */
function drawCalibrationTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#E8ECF4";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#10141D";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r * 0.82, 0, Math.PI / 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r * 0.82, Math.PI, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#10141D";
  ctx.lineWidth = Math.max(1, r * 0.14);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** 1. SLS Core Stage SOFI Cryogenic Foam + Intertank Stringers + Stencils */
export function getCoreStageTextures(): TexturePair {
  if (coreCache) return coreCache;

  const W = 1024;
  const H = 2048;

  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  // Base weathered SOFI orange foam gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
  baseGrad.addColorStop(0, "#B85222");
  baseGrad.addColorStop(0.28, "#C65D2B");
  baseGrad.addColorStop(0.36, "#9A4119"); // Intertank darker cured foam
  baseGrad.addColorStop(0.48, "#C25927");
  baseGrad.addColorStop(0.88, "#B44E20");
  baseGrad.addColorStop(1, "#8E3A15");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, W, H);

  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, W, H);

  // Organic foam cell variation & subtle vertical milling lines
  for (let i = 0; i < 3200; i++) {
    const x = (i * 173) % W;
    const y = (i * 311) % H;
    const w = 8 + (i % 24);
    const h = 4 + (i % 14);
    ctx.fillStyle = i % 2 === 0 ? "rgba(255, 165, 95, 0.045)" : "rgba(60, 20, 5, 0.05)";
    ctx.fillRect(x, y, w, h);
    bctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    bctx.fillRect(x, y, w, h);
  }

  // Horizontal circumferential weld / acreage foam bands
  const weldY = [140, 310, 480, 680, 880, 1080, 1280, 1480, 1680, 1860];
  weldY.forEach((y) => {
    ctx.fillStyle = "rgba(72, 24, 8, 0.42)";
    ctx.fillRect(0, y - 5, W, 10);
    ctx.fillStyle = "rgba(235, 130, 70, 0.25)";
    ctx.fillRect(0, y + 5, W, 3);

    bctx.fillStyle = "#484848";
    bctx.fillRect(0, y - 4, W, 8);
    bctx.fillStyle = "#B8B8B8";
    bctx.fillRect(0, y + 4, W, 4);
  });

  // Intertank vertical corrugated stringer ribs (y: 480..880)
  const ribs = 96;
  for (let i = 0; i < ribs; i++) {
    const rx = (i / ribs) * W;
    const rw = W / ribs;
    ctx.fillStyle = i % 2 === 0 ? "rgba(50, 16, 4, 0.34)" : "rgba(240, 135, 72, 0.18)";
    ctx.fillRect(rx, 480, rw * 0.55, 400);

    bctx.fillStyle = "#D8D8D8";
    bctx.fillRect(rx, 480, rw * 0.48, 400);
    bctx.fillStyle = "#303030";
    bctx.fillRect(rx + rw * 0.48, 480, rw * 0.52, 400);
  }

  // Subtle vertical barrel stringers across LOX and LH2 tanks
  for (let i = 0; i < 64; i++) {
    const rx = (i / 64) * W;
    ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    ctx.fillRect(rx, 0, 2, H);
    bctx.fillStyle = "#969696";
    bctx.fillRect(rx, 0, 3, H);
  }

  // Dark metallic intertank avionics & sensor panels
  [180, 440, 700, 920].forEach((px) => {
    ctx.fillStyle = "#1E2430";
    ctx.fillRect(px, 610, 48, 95);
    ctx.strokeStyle = "#C7CDD8";
    ctx.lineWidth = 2;
    ctx.strokeRect(px, 610, 48, 95);
    bctx.fillStyle = "#E0E0E0";
    bctx.fillRect(px, 610, 48, 95);
  });

  // Crisp aerospace stencils (UNITED STATES, ARTEMIS II, station numbers)
  ctx.save();
  ctx.fillStyle = "rgba(236, 240, 248, 0.78)";
  ctx.font = "bold 26px monospace";
  ctx.letterSpacing = "6px";

  // Vertical UNITED STATES on two opposite quadrants
  [256, 768].forEach((cx) => {
    const chars = "UNITED STATES".split("");
    chars.forEach((ch, idx) => {
      ctx.fillText(ch, cx - 10, 960 + idx * 44);
    });
  });

  ctx.font = "bold 14px monospace";
  ctx.fillStyle = "rgba(236, 240, 248, 0.72)";
  const stations = [
    [220, "LOX TANK · STA 2410"],
    [455, "FWD INTERTANK FLANGE"],
    [865, "AFT INTERTANK FLANGE"],
    [1120, "LH2 TANK · STA 1640"],
    [1520, "SYSTEM TUNNEL · LV-002"],
    [1830, "AFT MANIFOLD INTERFACE"],
  ] as const;
  stations.forEach(([sy, label]) => {
    ctx.fillText(label, 64, sy);
    ctx.fillText(label, 576, sy);
  });
  ctx.restore();

  // Photogrammetry calibration targets
  const targetCoords = [
    [120, 260], [380, 260], [640, 260], [900, 260],
    [120, 540], [380, 540], [640, 540], [900, 540],
    [120, 820], [380, 820], [640, 820], [900, 820],
    [160, 1220], [480, 1220], [680, 1220], [920, 1220],
    [160, 1620], [480, 1620], [680, 1620], [920, 1620],
  ];
  targetCoords.forEach(([tx, ty]) => drawCalibrationTarget(ctx, tx, ty, 11));

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = 8;

  coreCache = { map, bumpMap };
  return coreCache;
}

/** 2. Twin Solid Rocket Boosters (SRB) — 5 Segments, Field Joints, Roll Checkerboards, Stencils */
export function getSrbTextures(): TexturePair {
  if (srbCache) return srbCache;

  const W = 1024;
  const H = 2048;

  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  // Painted steel white casing
  ctx.fillStyle = "#E6EAF2";
  ctx.fillRect(0, 0, W, H);
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, W, H);

  // Subtle metallic panel sheen variations
  for (let i = 0; i < 40; i++) {
    const y = (i / 40) * H;
    ctx.fillStyle = i % 2 === 0 ? "rgba(18, 24, 38, 0.025)" : "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(0, y, W, H / 40);
  }

  // 5 SRB segment field joints with bolted tang/clevis bands
  const jointsY = [360, 740, 1120, 1500, 1840];
  jointsY.forEach((jy, idx) => {
    ctx.fillStyle = "#C5CCD9";
    ctx.fillRect(0, jy - 14, W, 28);
    ctx.fillStyle = "#6B7488";
    ctx.fillRect(0, jy - 3, W, 6);

    bctx.fillStyle = "#E2E2E2";
    bctx.fillRect(0, jy - 12, W, 24);
    bctx.fillStyle = "#2A2A2A";
    bctx.fillRect(0, jy - 2, W, 4);

    // 96 pin-retainer bolts along each field joint
    for (let b = 0; b < 96; b++) {
      const bx = (b / 96) * W + 4;
      ctx.fillStyle = "#2D3444";
      ctx.fillRect(bx, jy - 9, 4, 4);
      ctx.fillRect(bx, jy + 5, 4, 4);
      bctx.fillStyle = "#FFFFFF";
      bctx.fillRect(bx, jy - 9, 4, 4);
    }

    ctx.fillStyle = "#181E2C";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`FIELD JOINT 0${idx + 1} · RSRMV`, 42, jy - 22);
    ctx.fillText(`FIELD JOINT 0${idx + 1} · RSRMV`, 554, jy - 22);
  });

  // Iconic NASA Roll-Pattern Black Bands & Checkerboard
  ctx.fillStyle = "#121620";
  ctx.fillRect(0, 150, W, 72);
  ctx.fillRect(0, 1620, W, 68);

  // Checkerboard roll tracking band at y = 240
  const checks = 16;
  const cw = W / checks;
  for (let c = 0; c < checks; c++) {
    if (c % 2 === 0) {
      ctx.fillStyle = "#121620";
      ctx.fillRect(c * cw, 222, cw, 38);
    }
  }

  // Orange-red ordnance / separation warning stripes
  ctx.fillStyle = "#D4512A";
  ctx.fillRect(0, 128, W, 10);
  ctx.fillRect(0, 1700, W, 10);

  // Vertical UNITED STATES & NASA stencils
  ctx.save();
  ctx.fillStyle = "#151A26";
  ctx.font = "bold 30px monospace";
  "UNITED STATES".split("").forEach((ch, idx) => {
    ctx.fillText(ch, 240, 440 + idx * 48);
  });
  "ARTEMIS II".split("").forEach((ch, idx) => {
    ctx.fillText(ch, 760, 520 + idx * 52);
  });
  ctx.restore();

  // Photogrammetry targets on SRBs
  [300, 620, 940, 1320, 1760].forEach((ty) => {
    drawCalibrationTarget(ctx, 180, ty, 13);
    drawCalibrationTarget(ctx, 512, ty, 13);
    drawCalibrationTarget(ctx, 840, ty, 13);
  });

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = 8;

  srbCache = { map, bumpMap };
  return srbCache;
}

/** 3. Orion Crew Module Thermal Tile Backshell + Hatch + Windows + Stencils */
export function getOrionTextures(): TexturePair {
  if (orionCache) return orionCache;

  const W = 1024;
  const H = 1024;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  // Metallic silver-grey thermal backshell coating
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#CFD6E3");
  grad.addColorStop(0.5, "#DEE4F0");
  grad.addColorStop(1, "#B8C1D1");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, W, H);

  // Thermal Protection System (TPS) tile grid + staggered brick lines
  const rows = 28;
  const cols = 36;
  const rh = H / rows;
  const cw = W / cols;
  ctx.strokeStyle = "rgba(25, 32, 48, 0.22)";
  ctx.lineWidth = 1.5;
  bctx.strokeStyle = "#3A3A3A";
  bctx.lineWidth = 2;

  for (let r = 0; r < rows; r++) {
    const y = r * rh;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    bctx.beginPath();
    bctx.moveTo(0, y);
    bctx.lineTo(W, y);
    bctx.stroke();

    const offset = (r % 2) * (cw * 0.5);
    for (let c = 0; c < cols; c++) {
      const x = (c * cw + offset) % W;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rh);
      ctx.stroke();
      bctx.beginPath();
      bctx.moveTo(x, y);
      bctx.lineTo(x, y + rh);
      bctx.stroke();
    }
  }

  // 4 Forward Crew Viewport Windows (dark tinted fused silica glass with aluminum bezels)
  [180, 340, 680, 840].forEach((wx) => {
    ctx.fillStyle = "#3E485C";
    ctx.fillRect(wx - 28, 340, 56, 42);
    ctx.fillStyle = "#081020";
    ctx.fillRect(wx - 22, 346, 44, 30);
    // Specular window glint
    ctx.fillStyle = "rgba(157, 184, 255, 0.35)";
    ctx.fillRect(wx - 18, 349, 14, 24);

    bctx.fillStyle = "#202020";
    bctx.fillRect(wx - 24, 344, 48, 34);
  });

  // Side Crew Access Hatch
  ctx.strokeStyle = "#252D3F";
  ctx.lineWidth = 4;
  ctx.strokeRect(460, 480, 104, 130);
  ctx.fillStyle = "#182030";
  ctx.font = "bold 13px monospace";
  ctx.fillText("ORION · INTEGRITY", 448, 462);
  ctx.fillText("MPCV-002 · ARTEMIS II", 438, 636);

  // Reaction Control System (RCS) thruster ports
  [
    [120, 740], [150, 740],
    [410, 740], [440, 740],
    [620, 740], [650, 740],
    [880, 740], [910, 740],
  ].forEach(([rx, ry]) => {
    ctx.fillStyle = "#10141F";
    ctx.beginPath();
    ctx.arc(rx, ry, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8C96AC";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;

  orionCache = { map, bumpMap };
  return orionCache;
}

/** 4. Fairing / LVSA / ICPS Composite Panel Texture + Bump */
export function getFairingTextures(): TexturePair {
  if (fairingCache) return fairingCache;

  const W = 1024;
  const H = 1024;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  ctx.fillStyle = "#E2E7F0";
  ctx.fillRect(0, 0, W, H);
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, W, H);

  // Vertical & horizontal aerospace panel seams + rivets
  for (let x = 0; x < W; x += 128) {
    ctx.fillStyle = "#8D97AB";
    ctx.fillRect(x, 0, 3, H);
    bctx.fillStyle = "#383838";
    bctx.fillRect(x, 0, 4, H);
  }
  for (let y = 0; y < H; y += 128) {
    ctx.fillStyle = "#9BA5B8";
    ctx.fillRect(0, y, W, 3);
    bctx.fillStyle = "#404040";
    bctx.fillRect(0, y, W, 4);
  }

  ctx.fillStyle = "#1C2333";
  ctx.font = "bold 16px monospace";
  ctx.fillText("ESM FAIRING · JETTISON PANEL", 64, 512);
  ctx.fillText("ICPS · CRYOGENIC STAGE", 560, 512);

  drawCalibrationTarget(ctx, 256, 256, 14);
  drawCalibrationTarget(ctx, 768, 256, 14);
  drawCalibrationTarget(ctx, 256, 768, 14);
  drawCalibrationTarget(ctx, 768, 768, 14);

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;

  fairingCache = { map, bumpMap };
  return fairingCache;
}

/** 5. RS-25 / OMS Regeneratively Cooled Nozzle Bell Texture + Bump */
export function getNozzleBellTextures(): TexturePair {
  if (nozzleCache) return nozzleCache;

  const W = 512;
  const H = 512;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#4B5468");
  grad.addColorStop(0.35, "#2E3543");
  grad.addColorStop(0.75, "#232834");
  grad.addColorStop(1, "#3A2C28"); // Thermal bluing/tempering near exit lip
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  bctx.fillStyle = "#707070";
  bctx.fillRect(0, 0, W, H);

  // Fine vertical regenerative cooling tubes
  for (let x = 0; x < W; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.18)";
    ctx.fillRect(x, 0, 2, H);
    bctx.fillStyle = x % 8 === 0 ? "#C8C8C8" : "#303030";
    bctx.fillRect(x, 0, 2, H);
  }

  // Horizontal structural hat-bands / manifolds around the nozzle bell
  for (let y = 48; y < H; y += 56) {
    ctx.fillStyle = "#8C96AA";
    ctx.fillRect(0, y, W, 7);
    ctx.fillStyle = "#181C26";
    ctx.fillRect(0, y + 7, W, 3);
    bctx.fillStyle = "#FFFFFF";
    bctx.fillRect(0, y, W, 8);
  }

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;

  nozzleCache = { map, bumpMap };
  return nozzleCache;
}

/** 6. Crinkled Gold Kapton MLI Foil Bump Map */
export function getKaptonBumpMap(): THREE.CanvasTexture {
  if (kaptonBumpCache) return kaptonBumpCache;
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 420; i++) {
    const x1 = (i * 53) % S;
    const y1 = (i * 97) % S;
    const x2 = x1 + ((i % 7) - 3) * 18;
    const y2 = y1 + (((i * 3) % 7) - 3) * 18;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  kaptonBumpCache = tex;
  return tex;
}

/** 7. Solar Array Photovoltaic Cell Grid Texture */
export function getSolarPanelTexture(): THREE.CanvasTexture {
  if (solarCache) return solarCache;
  const W = 512;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0A1936";
  ctx.fillRect(0, 0, W, H);

  // Individual solar cells
  const cols = 8;
  const rows = 32;
  const cw = W / cols;
  const rh = H / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#10254F" : "#0D2044";
      ctx.fillRect(c * cw + 3, r * rh + 2, cw - 6, rh - 4);
      // Fine silver collector lines
      ctx.fillStyle = "rgba(157, 184, 255, 0.28)";
      ctx.fillRect(c * cw + cw * 0.5, r * rh + 2, 1.5, rh - 4);
    }
  }

  // Gold hinge / busbar lines at 1/3 and 2/3 panel length
  [H * 0.33, H * 0.66].forEach((hy) => {
    ctx.fillStyle = "#B58A42";
    ctx.fillRect(0, hy - 5, W, 10);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  solarCache = tex;
  return tex;
}

/** 8. Hot Incandescent Spark Texture (elongated bright core) */
export function getSparkTexture(): THREE.CanvasTexture {
  if (sparkTexCache) return sparkTexCache;
  const S = 64;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0.5, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255, 255, 255, 1)");
  g.addColorStop(0.22, "rgba(255, 230, 160, 0.95)");
  g.addColorStop(0.55, "rgba(255, 110, 50, 0.45)");
  g.addColorStop(1, "rgba(255, 60, 10, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  sparkTexCache = tex;
  return tex;
}

/** 9. Soft Billowing Exhaust Steam / Smoke Puff Texture */
export function getSmokePuffTexture(): THREE.CanvasTexture {
  if (smokeTexCache) return smokeTexCache;
  const S = 128;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(245, 248, 255, 0.95)");
  g.addColorStop(0.35, "rgba(220, 230, 250, 0.6)");
  g.addColorStop(0.7, "rgba(180, 195, 225, 0.2)");
  g.addColorStop(1, "rgba(150, 170, 210, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  smokeTexCache = tex;
  return tex;
}
