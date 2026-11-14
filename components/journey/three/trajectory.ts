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
  vab: [-28, 0, -48] as Vec3,
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
  // 1: enter — Inside the VAB / Launch Complex perimeter directly in front of the floodlit SLS + Orion on the launchpad
  {
    camPos: [-6.4, 8.6, 11.8],
    camLook: [0, 9.4, 0],
    rocketPos: [0, 0, 0],
    rocketRot: [0, 0.15, 0],
    rocketScale: 1,
  },
  // 2: ignition — liftoff! Rocket rises cleanly off LC-39B while camera tilts up
  {
    camPos: [9.5, 6.5, 16.5],
    camLook: [0, 14, 0],
    rocketPos: [0, 10, 0],
    rocketRot: [0, 0.08, -0.02],
    rocketScale: 1,
  },
  // 3: ascent-1 — Clear the tower, climbing into bright blue sky
  {
    camPos: [10, 46, 21],
    camLook: [1.5, 52, -3],
    rocketPos: [1.5, 50, -3],
    rocketRot: [-0.08, 0.1, -0.14],
    rocketScale: 1,
  },
  // 4: ascent-2 — Max-Q supersonic pitch-over, stratosphere darkening
  {
    camPos: [11, 104, 19],
    camLook: [6, 114, -10],
    rocketPos: [6.5, 112, -10],
    rocketRot: [-0.22, 0.12, -0.34],
    rocketScale: 1,
  },
  // 5: ascent-3 — Side booster separation (~2 min)
  {
    camPos: [14, 166, 14],
    camLook: [13, 178, -22],
    rocketPos: [13.5, 176, -22],
    rocketRot: [-0.42, 0.1, -0.58],
    rocketScale: 1,
  },
  // 6: ascent-4 — Edge of space (above 100 km), curved blue Earth below, fairing jettison
  {
    camPos: [17, 232, -30],
    camLook: [14, 240, -56],
    rocketPos: [17.5, 244, -46],
    rocketRot: [-0.65, 0.15, -0.82],
    rocketScale: 0.92,
  },
  // 7: deep-space — Core separation, Orion solar wings deploy, TLI burn toward Moon
  {
    camPos: [9, 294, -112],
    camLook: [2, 318, -178],
    rocketPos: [6, 298, -124],
    rocketRot: [-0.88, 0.05, -0.25],
    rocketScale: 0.72,
  },
  // 8: moon-apollo-11 (SM-L-001) — Descending to Sea of Tranquility diorama (Eagle descent stage, EASEP, LRRR + green laser)
  {
    camPos: [8.6, 343.1, -180.6],
    camLook: [4.8, 341.2, -187.4],
    rocketPos: [-12, 355, -186],
    rocketRot: [-0.3, 0.8, 0.15],
    rocketScale: 0.45,
  },
  // 9: moon-surveyor-3 (SM-L-002) — Ocean of Storms crater slope + distant Apollo 12 LM on rim
  {
    camPos: [-5.1, 337.2, -182.3],
    camLook: [-1.8, 335.4, -189.2],
    rocketPos: [-16, 352, -192],
    rocketRot: [-0.2, 0.9, 0.1],
    rocketScale: 0.42,
  },
  // 10: moon-apollo-15-lrv (SM-L-003) — Hadley–Apennine plain, Mount Hadley massif, parked LRV & distant LM
  {
    camPos: [5.9, 352.8, -184.2],
    camLook: [2.1, 350.9, -191.2],
    rocketPos: [-14, 362, -195],
    rocketRot: [-0.25, 1.0, 0.08],
    rocketScale: 0.42,
  },
  // 11: moon-apollo-17 (SM-L-004) — Taurus–Littrow valley massifs, Challenger descent stage, LRV & tracks
  {
    camPos: [14.1, 348.4, -191.0],
    camLook: [10.1, 346.4, -198.2],
    rocketPos: [-10, 360, -200],
    rocketRot: [-0.2, 1.1, 0.05],
    rocketScale: 0.42,
  },
  // 12: moon-grail (SM-L-005) — North polar mountain slope, two ~5 m craters with dark ejecta & twin ghost holograms
  {
    camPos: [3.6, 362.7, -192.1],
    camLook: [0.2, 360.8, -199.2],
    rocketPos: [-12, 372, -206],
    rocketRot: [-0.4, 0.7, 0.1],
    rocketScale: 0.45,
  },
  // 13: transit — Orbital arc from Moon to Mars (7-10 months)
  {
    camPos: [18, 415, -278],
    camLook: [2, 445, -352],
    rocketPos: [7, 422, -295],
    rocketRot: [-0.95, 0.25, -0.2],
    rocketScale: 0.65,
  },
  // 14: mars-viking-1 (SM-M-001) — Chryse Planitia
  {
    camPos: [14.5, 488, -368],
    camLook: [6, 484.8, -384],
    rocketPos: [-14, 502, -386],
    rocketRot: [-0.2, 0.7, 0.12],
    rocketScale: 0.45,
  },
  // 15: mars-pathfinder (SM-M-002) — Ares Vallis
  {
    camPos: [-11.5, 483, -369],
    camLook: [-2, 481, -385],
    rocketPos: [-18, 498, -390],
    rocketRot: [-0.25, 0.85, 0.1],
    rocketScale: 0.42,
  },
  // 16: mars-spirit (SM-M-003) — Gusev Crater
  {
    camPos: [-19, 474, -384],
    camLook: [-9, 475, -398],
    rocketPos: [-22, 494, -402],
    rocketRot: [-0.3, 0.95, 0.05],
    rocketScale: 0.42,
  },
  // 17: mars-opportunity (SM-M-004) — Meridiani Planum
  {
    camPos: [7, 479, -368],
    camLook: [0.5, 479, -384],
    rocketPos: [-16, 496, -394],
    rocketRot: [-0.2, 1.0, 0.08],
    rocketScale: 0.42,
  },
  // 18: mars-phoenix (SM-M-005) — Vastitas Borealis north pole
  {
    camPos: [2.5, 513, -382],
    camLook: [0.5, 506, -398],
    rocketPos: [-14, 518, -405],
    rocketRot: [-0.35, 0.8, 0.1],
    rocketScale: 0.42,
  },
  // 19: mars-insight (SM-M-006) — Elysium Planitia
  {
    camPos: [22.5, 489, -383],
    camLook: [12, 486, -397],
    rocketPos: [-12, 504, -402],
    rocketRot: [-0.22, 0.9, 0.06],
    rocketScale: 0.42,
  },
  // 20: mars-ingenuity (SM-M-007) — Jezero Crater
  {
    camPos: [18, 498, -376],
    camLook: [8.5, 494, -391],
    rocketPos: [-15, 508, -398],
    rocketRot: [-0.28, 1.05, 0.08],
    rocketScale: 0.42,
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
  "moon-apollo-11": { pos: [5.5, 340.6, -187.5], rotY: -0.3, planet: "moon" },
  "moon-surveyor-3": { pos: [-1.5, 334.8, -189.2], rotY: 0.35, planet: "moon" },
  "moon-apollo-15-lrv": { pos: [2.5, 350.3, -191.2], rotY: -0.25, planet: "moon" },
  "moon-apollo-17": { pos: [10.5, 345.8, -198.2], rotY: -0.45, planet: "moon" },
  "moon-grail": { pos: [0.5, 359.8, -199.2], rotY: -0.1, planet: "moon" },

  "mars-viking-1": { pos: [6, 484.6, -384.2], rotY: -0.35, planet: "mars" },
  "mars-pathfinder": { pos: [-2, 480.8, -385.2], rotY: 0.3, planet: "mars" },
  "mars-spirit": { pos: [-9, 474.8, -398.2], rotY: 0.55, planet: "mars" },
  "mars-opportunity": { pos: [0.5, 478.8, -384.2], rotY: -0.15, planet: "mars" },
  "mars-phoenix": { pos: [0.5, 505.8, -398.2], rotY: 0.0, planet: "mars" },
  "mars-insight": { pos: [12, 485.8, -397.2], rotY: -0.5, planet: "mars" },
  "mars-ingenuity": { pos: [8.5, 493.8, -391.2], rotY: -0.4, planet: "mars" },
};
