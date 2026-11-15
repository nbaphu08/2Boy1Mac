import * as THREE from "three";

export type Vec3 = [number, number, number];

export type BeatPose = {
  camPos: Vec3;
  camLook: Vec3;
  rocketPos: Vec3;
  /** Euler rotation in radians [rx, ry, rz]. */
  rocketRot: Vec3;
  /** Uniform scale of the rocket assembly. */
  rocketScale: number;
};

export const WORLD_ANCHORS = {
  pad: [0, 0, 0] as Vec3,
  vab: [-72, 0, -125] as Vec3,
  earthCenter: [0, -140, -10] as Vec3,
  earthRadius: 155,
  moonCenter: [0, 340, -215] as Vec3,
  moonRadius: 24,
  marsCenter: [0, 485, -415] as Vec3,
  marsRadius: 26,
  finaleEarthCenter: [-22, 578, -660] as Vec3,
  finaleMoonCenter: [10, 540, -565] as Vec3,
} as const;

/**
 * 24 keyframe poses (index 0..23 matching content/beats.ts).
 * Continuous C1 Catmull-Rom interpolation drives camera + rocket across the entire journey.
 */
export const BEAT_POSES: BeatPose[] = [
  // 0: hero — VAB campus entrance corridor aligned with the VAB sunrise hero portal; dollies straight toward the pad on Scroll 1
  {
    camPos: [-13.5, 4.2, 27.5],
    camLook: [-1.5, 7.6, -2.5],
    rocketPos: [0, 0, 0],
    rocketRot: [0, 0.2, 0],
    rocketScale: 1,
  },
  // 1: enter — Opus pad scene: low across the lagoon (reference: launch seen across the water), SLS + ML-1 on LC-39B,
  // dark tree line between, VAB small on the left horizon
  {
    camPos: [-9.0, -0.75, 62.0],
    camLook: [-1.6, 10.6, 0.0],
    rocketPos: [0, 0, 0],
    rocketRot: [0, 0.15, 0],
    rocketScale: 1,
  },
  // 2: ignition — liftoff seen from the same shore: ground clouds roll out, smoke column rises under the rocket
  {
    camPos: [-4.0, -0.6, 66.0],
    camLook: [0.2, 13.6, 0.0],
    rocketPos: [0, 10, 0],
    rocketRot: [0, 0.08, -0.02],
    rocketScale: 1,
  },
  // 3: ascent-1 — Just cleared ML-1 tower: pad/tower/coastal horizon visible below & behind, normal flat ocean horizon
  {
    camPos: [23, 19.5, 37],
    camLook: [-1.5, 16.5, -5.0],
    rocketPos: [0.8, 18.5, -1.2],
    rocketRot: [-0.04, 0.08, -0.06],
    rocketScale: 1,
  },
  // 4: ascent-2 — Max-Q supersonic pitch-over with vapor collar & ocean clouds receding below
  {
    camPos: [15, 121, 18],
    camLook: [6.5, 111, -10],
    rocketPos: [6.5, 113, -10],
    rocketRot: [-0.22, 0.12, -0.34],
    rocketScale: 1,
  },
  // 5: ascent-3 — Side booster separation (~2 min)
  {
    camPos: [18, 182, 8],
    camLook: [13, 174, -22],
    rocketPos: [13.5, 177, -22],
    rocketRot: [-0.42, 0.1, -0.58],
    rocketScale: 1,
  },
  // 6: ascent-4 — Edge of space (above 100 km), curved blue Earth limb & atmosphere halo below, fairing jettison
  {
    camPos: [21, 247, -33],
    camLook: [19.5, 239, -54],
    rocketPos: [16, 240, -48],
    rocketRot: [-0.65, 0.15, -0.82],
    rocketScale: 0.92,
  },
  // 7: deep-space — Core stage separated; Orion + ESM with 4 solar arrays deployed & main engine glow heading to Moon
  {
    camPos: [9.5, 303, -113.5],
    camLook: [2.5, 314, -158],
    rocketPos: [7.6, 305.2, -124],
    rocketRot: [-0.86, 0.22, -0.32],
    rocketScale: 1.85,
  },
  // 8: moon-apollo-11 (SM-L-001) — Descending to Sea of Tranquility diorama (9.4 m Eagle descent stage, EASEP, LRRR + green laser)
  {
    camPos: [9.4, 337.75, -165.2],
    camLook: [4.85, 335.85, -176.0],
    rocketPos: [-18, 352, -182],
    rocketRot: [-0.3, 0.8, 0.15],
    rocketScale: 0.42,
  },
  // 9: moon-surveyor-3 (SM-L-002) — Ocean of Storms crater slope (3.0 m Surveyor + distant Apollo 12 LM on rim)
  {
    camPos: [107.9, 336.55, -170.2],
    camLook: [105.25, 335.62, -176.0],
    rocketPos: [-22, 356, -188],
    rocketRot: [-0.2, 0.9, 0.1],
    rocketScale: 0.4,
  },
  // 10: moon-apollo-15-lrv (SM-L-003) — Hadley–Apennine plain (3.1 m LRV, Mt Hadley massif, distant Falcon LM)
  {
    camPos: [207.75, 336.45, -170.4],
    camLook: [205.25, 335.58, -176.0],
    rocketPos: [-20, 364, -194],
    rocketRot: [-0.25, 1.0, 0.08],
    rocketScale: 0.4,
  },
  // 11: moon-apollo-17 (SM-L-004) — Taurus–Littrow valley massifs, Challenger 9.4 m descent stage + 3.1 m LRV + tracks
  {
    camPos: [310.6, 338.15, -163.6],
    camLook: [306.7, 335.95, -176.0],
    rocketPos: [-16, 370, -198],
    rocketRot: [-0.2, 1.1, 0.05],
    rocketScale: 0.4,
  },
  // 12: moon-grail (SM-L-005) — North polar Goldschmidt mountain slope, two ~5 m craters with dark ejecta & twin ghost holograms
  {
    camPos: [407.95, 336.6, -169.1],
    camLook: [405.85, 335.5, -176.25],
    rocketPos: [-18, 380, -204],
    rocketRot: [-0.4, 0.7, 0.1],
    rocketScale: 0.42,
  },
  // 13: transit — Orbital arc from Moon to Mars (7-10 months)
  {
    camPos: [18, 415, -278],
    camLook: [2, 445, -352],
    rocketPos: [7, 422, -295],
    rocketRot: [-0.95, 0.25, -0.2],
    rocketScale: 0.65,
  },
  // 14: mars-viking-1 (SM-M-001) — Chryse Planitia (2.95 m Viking 1 Lander + trench)
  {
    camPos: [8.65, 474.4, -370.8],
    camLook: [6.65, 473.45, -376.0],
    rocketPos: [-20, 496, -384],
    rocketRot: [-0.2, 0.7, 0.12],
    rocketScale: 0.42,
  },
  // 15: mars-pathfinder (SM-M-002) — Ares Vallis flood plain (opened 2.75 m lander + deflated airbags + Sojourner/Yogi + Twin Peaks horizon)
  {
    camPos: [109.3, 474.55, -369.6],
    camLook: [106.85, 473.5, -375.9],
    rocketPos: [-24, 500, -388],
    rocketRot: [-0.25, 0.85, 0.1],
    rocketScale: 0.4,
  },
  // 16: mars-spirit (SM-M-003) — Gusev Crater ("Troy" beside Home Plate, 2.3 m MER)
  {
    camPos: [208.7, 474.45, -370.5],
    camLook: [206.75, 473.52, -376.0],
    rocketPos: [-28, 504, -392],
    rocketRot: [-0.3, 0.95, 0.05],
    rocketScale: 0.4,
  },
  // 17: mars-opportunity (SM-M-004) — Meridiani Planum (Perseverance Valley rim of Endeavour Crater, 2.3 m MER)
  {
    camPos: [308.7, 474.45, -370.5],
    camLook: [306.75, 473.52, -376.0],
    rocketPos: [-22, 508, -396],
    rocketRot: [-0.2, 1.0, 0.08],
    rocketScale: 0.4,
  },
  // 18: mars-phoenix (SM-M-005) — Vastitas Borealis north pole (5.52 m span lander + ice trench)
  {
    camPos: [409.35, 474.75, -368.4],
    camLook: [406.65, 473.55, -376.0],
    rocketPos: [-18, 514, -400],
    rocketRot: [-0.35, 0.8, 0.1],
    rocketScale: 0.4,
  },
  // 19: mars-insight (SM-M-006) — Elysium Planitia (6.0 m span InSight lander + SEIS/HP3)
  {
    camPos: [508.6, 475.35, -370.2], // Opus M5: closer 3/4 view so the lander fills ~40 % of frame height
    camLook: [506.5, 473.35, -375.8],
    rocketPos: [-16, 518, -404],
    rocketRot: [-0.22, 0.9, 0.06],
    rocketScale: 0.4,
  },
  // 20: mars-ingenuity (SM-M-007) — Jezero Crater ("Valinor Hills", true 0.49 m tall / 1.21 m rotor helicopter hero close-up)
  {
    camPos: [607.75, 473.57, -374.45], // Opus M5: ~1.9 m from the 0.49 m helicopter
    camLook: [606.8, 473.08, -376.05],
    rocketPos: [-18, 524, -408],
    rocketRot: [-0.28, 1.05, 0.08],
    rocketScale: 0.4,
  },
  // 21: silence — Pull back into tranquil starfield for The Hall of Silence
  {
    camPos: [0, 526, -455],
    camLook: [0, 532, -520],
    rocketPos: [-18, 534, -490],
    rocketRot: [-0.5, 0.6, 0.1],
    rocketScale: 0.48,
  },
  // 22: beyond — Outer darkness + Hall III 4 spacecraft silhouettes
  {
    camPos: [0, 538, -502],
    camLook: [0, 538, -536],
    rocketPos: [-24, 546, -528],
    rocketRot: [-0.45, 0.5, 0.1],
    rocketScale: 0.42,
  },
  // 23: finale — Artemis Era Earthrise over the lunar limb
  {
    camPos: [2, 558, -542],
    camLook: [-14, 566, -630],
    rocketPos: [5.2, 557.2, -552],
    rocketRot: [-0.35, -0.55, 0.18],
    rocketScale: 0.55,
  },
];

type CameraSplineNode = {
  p: number;
  camPos: Vec3;
  camLook: Vec3;
  bankRad: number;
};

/**
 * Single C1-continuous centripetal Catmull-Rom spline node list spanning beats 0..23
 * plus banked orbital descent, ridge-crest reveal hops (Moon 8..12 & Mars 14..20), and liftoff curves.
 */
const CAMERA_SPLINE_NODES: CameraSplineNode[] = (() => {
  const nodes: CameraSplineNode[] = [];
  const pushPose = (beatIdx: number, bankRad = 0) => {
    nodes.push({
      p: beatIdx,
      camPos: BEAT_POSES[beatIdx].camPos,
      camLook: BEAT_POSES[beatIdx].camLook,
      bankRad,
    });
  };
  const pushHopNodes = (fromBeat: number, ax: number, baseY: number, baseZ: number, ridgeH: number) => {
    // Rise smoothly & bank right out of site i toward the shared inter-site ridge crest
    nodes.push({
      p: fromBeat + 0.25,
      camPos: [ax + 18.0, baseY + 6.4, baseZ + 6.5],
      camLook: [ax + 48.0, baseY + ridgeH * 0.85, baseZ - 12.0],
      bankRad: -0.044,
    });
    // Cross the identical ridge crest (hardware behind crest is occluded) where chunk swap is invisible
    nodes.push({
      p: fromBeat + 0.5,
      camPos: [ax + 38.5, baseY + 7.2, baseZ + 1.0],
      camLook: [ax + 64.0, baseY + ridgeH * 0.68, baseZ - 3.0],
      bankRad: -0.032,
    });
    // Crest over the rim, revealing next machine ahead & banking smoothly left toward rest pose i+1
    nodes.push({
      p: fromBeat + 0.74,
      camPos: [ax + 76.0, baseY + 6.8, baseZ + 6.5],
      camLook: [ax + 99.5, baseY + 1.4, baseZ],
      bankRad: 0.04,
    });
  };

  // Launch & ascent beats 0..7
  for (let i = 0; i <= 7; i++) {
    pushPose(i, i === 4 ? -0.022 : i === 5 ? 0.018 : 0);
  }

  // Space -> Sea of Tranquility continuous banking descent (7 -> 8)
  nodes.push(
    {
      p: 7.28,
      camPos: [14.2, 342.0, -138.0],
      camLook: [5.5, 336.5, -184.0],
      bankRad: -0.042,
    },
    {
      p: 7.54,
      camPos: [11.6, 355.0, -150.0],
      camLook: [5.5, 335.4, -176.0],
      bankRad: -0.024,
    },
    {
      p: 7.78,
      camPos: [9.8, 339.2, -159.5],
      camLook: [5.1, 335.6, -175.5],
      bankRad: 0.016,
    },
  );

  // Moon surface sites (8..12) + smooth ridge-crest reveal hops
  for (let i = 8; i <= 11; i++) {
    pushPose(i, 0);
    pushHopNodes(i, 5.5 + (i - 8) * 100.0, 334.6, -176.0, 4.2);
  }
  pushPose(12, 0);

  // Moon GRAIL polar liftoff -> Hohmann transit -> Mars orbit (12 -> 13)
  nodes.push(
    {
      p: 12.28,
      camPos: [398.0, 356.0, -172.0],
      camLook: [365.0, 344.0, -200.0],
      bankRad: 0.036,
    },
    {
      p: 12.62,
      camPos: [200.0, 392.0, -230.0],
      camLook: [90.0, 418.0, -298.0],
      bankRad: 0.024,
    },
  );
  pushPose(13, 0);

  // Mars orbital entry -> Chryse touchdown flare -> Viking 1 (13 -> 14)
  nodes.push(
    {
      p: 13.28,
      camPos: [16.0, 482.0, -330.0],
      camLook: [8.5, 475.0, -378.0],
      bankRad: -0.04,
    },
    {
      p: 13.54,
      camPos: [11.5, 492.0, -350.0],
      camLook: [7.0, 473.6, -376.0],
      bankRad: -0.022,
    },
    {
      p: 13.78,
      camPos: [9.2, 476.5, -363.5],
      camLook: [6.8, 473.5, -376.0],
      bankRad: 0.014,
    },
  );

  // Mars surface sites (14..20) + smooth ridge-crest reveal hops
  for (let i = 14; i <= 19; i++) {
    pushPose(i, 0);
    pushHopNodes(i, 7.0 + (i - 14) * 100.0, 472.6, -376.0, 3.6);
  }
  pushPose(20, 0);

  // Mars lift-off -> Tranquil Hall of Silence -> Beyond -> Finale (20 -> 23)
  nodes.push(
    {
      p: 20.32,
      camPos: [555.0, 496.0, -384.0],
      camLook: [430.0, 505.0, -422.0],
      bankRad: 0.036,
    },
    {
      p: 20.66,
      camPos: [220.0, 518.0, -430.0],
      camLook: [70.0, 525.0, -482.0],
      bankRad: 0.02,
    },
  );
  pushPose(21, 0);
  pushPose(22, 0);
  pushPose(23, 0);

  return nodes;
})();

const splineNodeMax = CAMERA_SPLINE_NODES.length - 1;

// Centripetal Catmull-Rom prevents loops/overshoots across mixed scale distances (pads -> planets -> rovers)
const camPosCurve = new THREE.CatmullRomCurve3(
  CAMERA_SPLINE_NODES.map((n) => new THREE.Vector3(...n.camPos)),
  false,
  "centripetal",
);
const camLookCurve = new THREE.CatmullRomCurve3(
  CAMERA_SPLINE_NODES.map((n) => new THREE.Vector3(...n.camLook)),
  false,
  "centripetal",
);
const rocketPosCurve = new THREE.CatmullRomCurve3(
  BEAT_POSES.map((p) => new THREE.Vector3(...p.rocketPos)),
  false,
  "centripetal",
);

const maxIdx = BEAT_POSES.length - 1;

/** Smootherstep dwell curve per unit beat so velocity and acceleration ease smoothly to 0 at every rest beat. */
function easeBeatProgress(progress: number): number {
  const clamped = Math.max(0, Math.min(maxIdx, progress));
  const i = Math.floor(clamped);
  const f = clamped - i;
  const fSmooth = f * f * f * (f * (f * 6 - 15) + 10);
  return i + fSmooth;
}

/** Map eased beat progress `pW` in [0, 23] onto normalized curve parameter `u` in [0, 1]. */
function progressToSplineU(pW: number): { u: number; k: number; localT: number } {
  if (pW <= 0) return { u: 0, k: 0, localT: 0 };
  if (pW >= maxIdx) return { u: 1, k: splineNodeMax - 1, localT: 1 };
  let k = 0;
  for (let i = 0; i < splineNodeMax; i++) {
    if (pW <= CAMERA_SPLINE_NODES[i + 1].p) {
      k = i;
      break;
    }
  }
  const p0 = CAMERA_SPLINE_NODES[k].p;
  const p1 = CAMERA_SPLINE_NODES[k + 1].p;
  const localT = (pW - p0) / (p1 - p0 || 1);
  return { u: (k + localT) / splineNodeMax, k, localT };
}

export type SampledTrajectory = {
  camPos: THREE.Vector3;
  camLook: THREE.Vector3;
  rocketPos: THREE.Vector3;
  rocketRot: THREE.Euler;
  rocketScale: number;
};

/**
 * Sample smoothed C1-continuous camera + rocket state for any continuous `progress` in [0, 23].
 * Reuses caller-provided vectors to keep useFrame allocation-free.
 */
export function sampleTrajectory(progress: number, out: SampledTrajectory): SampledTrajectory {
  const clamped = Math.max(0, Math.min(maxIdx, progress));
  const easedP = easeBeatProgress(clamped);
  const { u } = progressToSplineU(easedP);

  // Slightly flatten curve velocity right near beat 0..1.9 so the rocket stands steady on LC-39B until ignition
  const rocketProgress =
    clamped < 1.85 ? 0 : clamped < 2.3 ? ((clamped - 1.85) / 0.45) * 0.25 + 1.85 : clamped;
  const ru = Math.max(0, Math.min(1, rocketProgress / maxIdx));

  camPosCurve.getPoint(u, out.camPos);
  camLookCurve.getPoint(u, out.camLook);
  rocketPosCurve.getPoint(ru, out.rocketPos);

  const i0 = Math.floor(clamped);
  const i1 = Math.min(maxIdx, i0 + 1);
  const alpha = clamped - i0;
  const smooth = alpha * alpha * (3 - 2 * alpha);

  const r0 = BEAT_POSES[i0].rocketRot;
  const r1 = BEAT_POSES[i1].rocketRot;
  out.rocketRot.set(
    THREE.MathUtils.lerp(r0[0], r1[0], smooth),
    THREE.MathUtils.lerp(r0[1], r1[1], smooth),
    THREE.MathUtils.lerp(r0[2], r1[2], smooth),
  );
  out.rocketScale = THREE.MathUtils.lerp(BEAT_POSES[i0].rocketScale, BEAT_POSES[i1].rocketScale, smooth);

  return out;
}

/** Sample subtle C1 camera roll angle (in radians, clamped to <= 2.6 deg) during banked turns. */
export function sampleCameraBankRoll(progress: number): number {
  const easedP = easeBeatProgress(progress);
  const { k, localT } = progressToSplineU(easedP);
  const r0 = CAMERA_SPLINE_NODES[k]?.bankRad ?? 0;
  const r1 = CAMERA_SPLINE_NODES[k + 1]?.bankRad ?? 0;
  const smoothT = localT * localT * (3 - 2 * localT);
  return THREE.MathUtils.clamp(THREE.MathUtils.lerp(r0, r1, smoothT), -0.048, 0.048);
}

/** World position of each exhibit plinth (beats 8..12 Moon, beats 14..20 Mars). */
export const EXHIBIT_PLINTH_ANCHORS: Record<string, { pos: Vec3; rotY: number; planet: "moon" | "mars" }> = {
  "moon-apollo-11": { pos: [5.5, 334.6, -176.0], rotY: -0.3, planet: "moon" },
  "moon-surveyor-3": { pos: [105.5, 334.6, -176.0], rotY: 0.35, planet: "moon" },
  "moon-apollo-15-lrv": { pos: [205.5, 334.6, -176.0], rotY: -0.25, planet: "moon" },
  "moon-apollo-17": { pos: [305.5, 334.6, -176.0], rotY: -0.45, planet: "moon" },
  "moon-grail": { pos: [405.5, 334.6, -176.0], rotY: -0.1, planet: "moon" },

  "mars-viking-1": { pos: [7.0, 472.6, -376.0], rotY: -0.35, planet: "mars" },
  "mars-pathfinder": { pos: [107.0, 472.6, -376.0], rotY: 0.25, planet: "mars" },
  "mars-spirit": { pos: [207.0, 472.6, -376.0], rotY: 0.35, planet: "mars" },
  "mars-opportunity": { pos: [307.0, 472.6, -376.0], rotY: -0.15, planet: "mars" },
  "mars-phoenix": { pos: [407.0, 472.6, -376.0], rotY: 0.0, planet: "mars" },
  "mars-insight": { pos: [507.0, 472.6, -376.0], rotY: -0.35, planet: "mars" },
  "mars-ingenuity": { pos: [607.0, 472.6, -376.0], rotY: -0.3, planet: "mars" },
};
