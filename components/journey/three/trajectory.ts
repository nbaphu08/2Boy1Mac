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
  // 1: enter — Inside the Launch Complex perimeter framing the full dusk-lit SLS + Orion & ML-1 tower on LC-39B
  {
    camPos: [-10.8, 5.0, 17.6],
    camLook: [-0.6, 7.2, -1.0],
    rocketPos: [0, 0, 0],
    rocketRot: [0, 0.15, 0],
    rocketScale: 1,
  },
  // 2: ignition — liftoff! Rocket rises above ground-lit deluge steam with VAB silhouetted against western sunset
  {
    camPos: [12.5, 6.2, 21.5],
    camLook: [-0.5, 11.8, -1.5],
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
    camPos: [9.4, 337.75, -161.2],
    camLook: [4.85, 335.85, -172.0],
    rocketPos: [-18, 352, -182],
    rocketRot: [-0.3, 0.8, 0.15],
    rocketScale: 0.42,
  },
  // 9: moon-surveyor-3 (SM-L-002) — Ocean of Storms crater slope (3.0 m Surveyor + distant Apollo 12 LM on rim)
  {
    camPos: [-7.1, 344.55, -170.2],
    camLook: [-9.75, 343.62, -176.0],
    rocketPos: [-22, 356, -188],
    rocketRot: [-0.2, 0.9, 0.1],
    rocketScale: 0.4,
  },
  // 10: moon-apollo-15-lrv (SM-L-003) — Hadley–Apennine plain (3.1 m LRV, Mt Hadley massif, distant Falcon LM)
  {
    camPos: [6.75, 353.45, -174.4],
    camLook: [4.25, 352.58, -180.0],
    rocketPos: [-20, 364, -194],
    rocketRot: [-0.25, 1.0, 0.08],
    rocketScale: 0.4,
  },
  // 11: moon-apollo-17 (SM-L-004) — Taurus–Littrow valley massifs, Challenger 9.4 m descent stage + 3.1 m LRV + tracks
  {
    camPos: [21.6, 364.15, -171.6],
    camLook: [17.7, 361.95, -184.0],
    rocketPos: [-16, 370, -198],
    rocketRot: [-0.2, 1.1, 0.05],
    rocketScale: 0.4,
  },
  // 12: moon-grail (SM-L-005) — North polar Goldschmidt mountain slope, two ~5 m craters with dark ejecta & twin ghost holograms
  {
    camPos: [2.95, 372.6, -181.1],
    camLook: [0.85, 371.5, -188.25],
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
    camPos: [8.65, 474.4, -362.8],
    camLook: [6.65, 473.45, -368.0],
    rocketPos: [-20, 496, -384],
    rocketRot: [-0.2, 0.7, 0.12],
    rocketScale: 0.42,
  },
  // 15: mars-pathfinder (SM-M-002) — Ares Vallis flood plain (opened 2.75 m lander + deflated airbags + Sojourner/Yogi + Twin Peaks horizon)
  {
    camPos: [-5.7, 481.55, -364.6],
    camLook: [-8.15, 480.5, -370.9],
    rocketPos: [-24, 500, -388],
    rocketRot: [-0.25, 0.85, 0.1],
    rocketScale: 0.4,
  },
  // 16: mars-spirit (SM-M-003) — Gusev Crater ("Troy" beside Home Plate, 2.3 m MER)
  {
    camPos: [-16.3, 488.45, -368.5],
    camLook: [-18.25, 487.52, -374.0],
    rocketPos: [-28, 504, -392],
    rocketRot: [-0.3, 0.95, 0.05],
    rocketScale: 0.4,
  },
  // 17: mars-opportunity (SM-M-004) — Meridiani Planum (Perseverance Valley rim of Endeavour Crater, 2.3 m MER)
  {
    camPos: [-1.3, 495.45, -371.5],
    camLook: [-3.25, 494.52, -377.0],
    rocketPos: [-22, 508, -396],
    rocketRot: [-0.2, 1.0, 0.08],
    rocketScale: 0.4,
  },
  // 18: mars-phoenix (SM-M-005) — Vastitas Borealis north pole (5.52 m span lander + ice trench)
  {
    camPos: [12.35, 502.75, -372.4],
    camLook: [9.65, 501.55, -380.0],
    rocketPos: [-18, 514, -400],
    rocketRot: [-0.35, 0.8, 0.1],
    rocketScale: 0.4,
  },
  // 19: mars-insight (SM-M-006) — Elysium Planitia (6.0 m span InSight lander + SEIS/HP3)
  {
    camPos: [23.35, 509.95, -374.4],
    camLook: [20.6, 508.6, -383.0],
    rocketPos: [-16, 518, -404],
    rocketRot: [-0.22, 0.9, 0.06],
    rocketScale: 0.4,
  },
  // 20: mars-ingenuity (SM-M-007) — Jezero Crater ("Valinor Hills", true 0.49 m tall / 1.21 m rotor helicopter hero close-up)
  {
    camPos: [9.15, 515.95, -382.9],
    camLook: [7.82, 515.25, -386.0],
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

// Pre-build Catmull-Rom curves once (zero per-frame allocations)
const camPosCurve = new THREE.CatmullRomCurve3(
  BEAT_POSES.map((p) => new THREE.Vector3(...p.camPos)),
  false,
  "catmullrom",
  0.35,
);
const camLookCurve = new THREE.CatmullRomCurve3(
  BEAT_POSES.map((p) => new THREE.Vector3(...p.camLook)),
  false,
  "catmullrom",
  0.35,
);
const rocketPosCurve = new THREE.CatmullRomCurve3(
  BEAT_POSES.map((p) => new THREE.Vector3(...p.rocketPos)),
  false,
  "catmullrom",
  0.35,
);

const maxIdx = BEAT_POSES.length - 1;

export type SampledTrajectory = {
  camPos: THREE.Vector3;
  camLook: THREE.Vector3;
  rocketPos: THREE.Vector3;
  rocketRot: THREE.Euler;
  rocketScale: number;
};

/**
 * Sample smoothed camera + rocket state for any continuous `progress` in [0, 23].
 * Reuses caller-provided vectors to keep useFrame allocation-free.
 */
export function sampleTrajectory(progress: number, out: SampledTrajectory): SampledTrajectory {
  const clamped = Math.max(0, Math.min(maxIdx, progress));
  const u = clamped / maxIdx;

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

/** World position of each exhibit plinth (beats 8..12 Moon, beats 14..20 Mars). */
export const EXHIBIT_PLINTH_ANCHORS: Record<string, { pos: Vec3; rotY: number; planet: "moon" | "mars" }> = {
  "moon-apollo-11": { pos: [5.5, 334.6, -172.0], rotY: -0.3, planet: "moon" },
  "moon-surveyor-3": { pos: [-9.5, 342.6, -176.0], rotY: 0.35, planet: "moon" },
  "moon-apollo-15-lrv": { pos: [4.5, 351.6, -180.0], rotY: -0.25, planet: "moon" },
  "moon-apollo-17": { pos: [16.5, 360.6, -184.0], rotY: -0.45, planet: "moon" },
  "moon-grail": { pos: [0.5, 370.6, -188.0], rotY: -0.1, planet: "moon" },

  "mars-viking-1": { pos: [7.0, 472.6, -368.0], rotY: -0.35, planet: "mars" },
  "mars-pathfinder": { pos: [-8.0, 479.6, -371.0], rotY: 0.25, planet: "mars" },
  "mars-spirit": { pos: [-18.0, 486.6, -374.0], rotY: 0.35, planet: "mars" },
  "mars-opportunity": { pos: [-3.0, 493.6, -377.0], rotY: -0.15, planet: "mars" },
  "mars-phoenix": { pos: [10.0, 500.6, -380.0], rotY: 0.0, planet: "mars" },
  "mars-insight": { pos: [21.0, 507.6, -383.0], rotY: -0.35, planet: "mars" },
  "mars-ingenuity": { pos: [8.0, 514.6, -386.0], rotY: -0.3, planet: "mars" },
};
