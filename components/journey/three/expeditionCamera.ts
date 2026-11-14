import * as THREE from "three";
import { beats } from "@/content/beats";
import { smoothstep, clamp01 } from "@/lib/scroll/progress";
import { expeditionState } from "./expeditionState";
import {
  BEAT_POSES,
  EXHIBIT_PLINTH_ANCHORS,
  type SampledTrajectory,
} from "./trajectory";

const tmpPosA = new THREE.Vector3();
const tmpPosB = new THREE.Vector3();
const tmpLookA = new THREE.Vector3();
const tmpLookB = new THREE.Vector3();

function setFromVec3(v: THREE.Vector3, arr: readonly [number, number, number]) {
  v.set(arr[0], arr[1], arr[2]);
}

/**
 * Updates exported `expeditionState` from continuous scroll progress `p` (zero allocations).
 */
export function updateExpeditionState(p: number): void {
  if (p < 6.45 || p > 20.55) {
    expeditionState.phase = "space";
    expeditionState.targetSlug = null;
    expeditionState.proximity = 0;
    return;
  }

  // Lunar orbit & Apollo 11 descent/touchdown/search (6.45..8.0)
  if (p < 8.0) {
    expeditionState.targetSlug = "moon-apollo-11";
    if (p < 7.06) {
      expeditionState.phase = "orbit";
      expeditionState.proximity = 0;
    } else if (p < 7.5) {
      expeditionState.phase = "descent";
      expeditionState.proximity = smoothstep(7.06, 7.5, p) * 0.45;
    } else if (p < 7.72) {
      expeditionState.phase = "touchdown";
      expeditionState.proximity = 0.45 + 0.25 * smoothstep(7.5, 7.72, p);
    } else {
      expeditionState.phase = p >= 7.88 ? "arrived" : "tracking";
      expeditionState.proximity = 0.7 + 0.3 * smoothstep(7.72, 7.88, p);
    }
    return;
  }

  // Moon low surface expedition beats 8..12
  if (p <= 12.14) {
    const seg = Math.min(11, Math.floor(p));
    const frac = p - seg;
    if (frac <= 0.14) {
      expeditionState.phase = "arrived";
      expeditionState.targetSlug = beats[seg]?.exhibitSlug ?? null;
      expeditionState.proximity = 1;
    } else if (frac >= 0.86) {
      expeditionState.phase = "arrived";
      expeditionState.targetSlug = beats[seg + 1]?.exhibitSlug ?? null;
      expeditionState.proximity = 1;
    } else {
      expeditionState.phase = "tracking";
      expeditionState.targetSlug = beats[seg + 1]?.exhibitSlug ?? null;
      expeditionState.proximity = smoothstep(0.14, 0.86, frac);
    }
    return;
  }

  // Moon departure & Mars orbital cruise / Mars entry / descent / touchdown (12.14..14.0)
  if (p < 14.0) {
    if (p < 12.55) {
      expeditionState.phase = "space";
      expeditionState.targetSlug = null;
      expeditionState.proximity = 0;
    } else if (p < 13.06) {
      expeditionState.phase = "orbit";
      expeditionState.targetSlug = "mars-viking-1";
      expeditionState.proximity = 0;
    } else if (p < 13.5) {
      expeditionState.phase = "descent";
      expeditionState.targetSlug = "mars-viking-1";
      expeditionState.proximity = smoothstep(13.06, 13.5, p) * 0.45;
    } else if (p < 13.72) {
      expeditionState.phase = "touchdown";
      expeditionState.targetSlug = "mars-viking-1";
      expeditionState.proximity = 0.45 + 0.25 * smoothstep(13.5, 13.72, p);
    } else {
      expeditionState.phase = p >= 13.88 ? "arrived" : "tracking";
      expeditionState.targetSlug = "mars-viking-1";
      expeditionState.proximity = 0.7 + 0.3 * smoothstep(13.72, 13.88, p);
    }
    return;
  }

  // Mars low surface expedition beats 14..20
  if (p <= 20.14) {
    const seg = Math.min(19, Math.floor(p));
    const frac = p - seg;
    if (frac <= 0.14) {
      expeditionState.phase = "arrived";
      expeditionState.targetSlug = beats[seg]?.exhibitSlug ?? null;
      expeditionState.proximity = 1;
    } else if (frac >= 0.86) {
      expeditionState.phase = "arrived";
      expeditionState.targetSlug = beats[seg + 1]?.exhibitSlug ?? null;
      expeditionState.proximity = 1;
    } else {
      expeditionState.phase = "tracking";
      expeditionState.targetSlug = beats[seg + 1]?.exhibitSlug ?? null;
      expeditionState.proximity = smoothstep(0.14, 0.86, frac);
    }
    return;
  }

  expeditionState.phase = "space";
  expeditionState.targetSlug = null;
  expeditionState.proximity = 0;
}

/**
 * Low fast surface flight between exhibit `i` and exhibit `i + 1` on the Moon (8..12) or Mars (14..20).
 * - First half (`0 <= u < 0.5`): lifts off from site `i` to low cruise height (`~8 m`) streaming over terrain `i`.
 * - Second half (`0.5 <= u <= 1`): sweeps low from far horizon (`+36 m` Z) over terrain `i+1` straight toward
 *   target machine `i+1` ahead on the horizon, easing smoothly to ground-level rest at `BEAT_POSES[i+1]`.
 */
function sampleInterSiteFlight(
  i: number,
  u: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
): void {
  if (u < 0.5) {
    const slugA = beats[i]?.exhibitSlug;
    const anchorA = slugA ? EXHIBIT_PLINTH_ANCHORS[slugA] : undefined;
    const poseA = BEAT_POSES[i];
    if (!anchorA || !poseA) return;

    const s = clamp01(u / 0.5);
    const sEase = smoothstep(0, 1, s);
    const [ax, ay, az] = anchorA.pos;
    setFromVec3(tmpPosA, poseA.camPos);
    setFromVec3(tmpLookA, poseA.camLook);

    // Lift cleanly up to ~5.8 m altitude and skim over textured regolith/soil pitched slightly down at horizon
    tmpPosB.set(ax + 1.2, ay + 5.8, az - 10.5);
    tmpLookB.set(ax, ay + 0.25, az - 34.0);
    outPos.lerpVectors(tmpPosA, tmpPosB, sEase);
    outLook.lerpVectors(tmpLookA, tmpLookB, sEase);
    return;
  }

  const slugB = beats[i + 1]?.exhibitSlug;
  const anchorB = slugB ? EXHIBIT_PLINTH_ANCHORS[slugB] : undefined;
  const poseB = BEAT_POSES[i + 1];
  if (!anchorB || !poseB) return;

  const s = clamp01((u - 0.5) / 0.5);
  // Decelerating glide curve so horizon rush slows crisply into documentary rest framing
  const sGlide = 1 - Math.pow(1 - s, 1.85);
  const [bx, by, bz] = anchorB.pos;

  tmpPosA.set(bx + 1.4, by + 5.6, bz + 19.5);
  tmpLookA.set(bx, by + 0.35, bz - 10.0);
  setFromVec3(tmpPosB, poseB.camPos);
  setFromVec3(tmpLookB, poseB.camLook);

  outPos.lerpVectors(tmpPosA, tmpPosB, sGlide);
  outLook.lerpVectors(tmpLookA, tmpLookB, smoothstep(0, 1, s));
}

/**
 * Overrides `traj.camPos` and `traj.camLook` inside expedition segments (`7..20.55`)
 * with orbital arrival, descent, touchdown, and low ground tracking across Moon and Mars.
 */
export function applyExpeditionCamera(
  p: number,
  reducedMotion: boolean,
  traj: SampledTrajectory,
): void {
  const poseApollo11 = BEAT_POSES[8];
  const poseViking1 = BEAT_POSES[14];

  // Reduced motion: clean cuts between existing rest poses without entry/tracking motion
  if (reducedMotion && p >= 7.05 && p <= 20.5) {
    const nearest = Math.max(7, Math.min(21, Math.round(p)));
    const pBeat = BEAT_POSES[nearest];
    if (pBeat) {
      setFromVec3(traj.camPos, pBeat.camPos);
      setFromVec3(traj.camLook, pBeat.camLook);
    }
    return;
  }

  // ─── Beat 7 -> 8: Moon Orbit -> Tranquility Descent -> Touchdown -> Low Tracking to Apollo 11 ───
  if (p > 7.0 && p < 8.0) {
    const orbitPos = BEAT_POSES[7].camPos;
    const orbitLook = BEAT_POSES[7].camLook;
    const touchPos: readonly [number, number, number] = [5.5, 336.1, -158.0];
    const touchLook: readonly [number, number, number] = [5.0, 335.0, -172.0];
    const skimPos: readonly [number, number, number] = [6.4, 336.8, -161.5];

    if (p < 7.5) {
      // Smooth orbital drop down onto Sea of Tranquility plain
      const t = smoothstep(7.0, 7.5, p);
      setFromVec3(tmpPosA, orbitPos);
      setFromVec3(tmpPosB, touchPos);
      traj.camPos.lerpVectors(tmpPosA, tmpPosB, t);
      traj.camPos.y += Math.sin(t * Math.PI) * 5.2;

      setFromVec3(tmpLookA, orbitLook);
      setFromVec3(tmpLookB, touchLook);
      traj.camLook.lerpVectors(tmpLookA, tmpLookB, t);
    } else if (p < 7.72) {
      // Touchdown flare (low 1.3 m hover over landing spot as ballistic dust radiates outward)
      const t = smoothstep(7.5, 7.72, p);
      setFromVec3(tmpPosA, touchPos);
      setFromVec3(tmpPosB, skimPos);
      traj.camPos.lerpVectors(tmpPosA, tmpPosB, t);
      setFromVec3(traj.camLook, touchLook);
    } else {
      // Low surface tracking toward Eagle on the horizon ahead
      const t = smoothstep(7.72, 8.0, p);
      setFromVec3(tmpPosA, skimPos);
      setFromVec3(tmpPosB, poseApollo11.camPos);
      traj.camPos.lerpVectors(tmpPosA, tmpPosB, t);
      setFromVec3(tmpLookA, touchLook);
      setFromVec3(tmpLookB, poseApollo11.camLook);
      traj.camLook.lerpVectors(tmpLookA, tmpLookB, t);
    }
    return;
  }

  // ─── Beats 8..12: Low fast surface flights between Moon machines ───
  if (p >= 8.0 && p < 12.0) {
    const seg = Math.floor(p);
    sampleInterSiteFlight(seg, p - seg, traj.camPos, traj.camLook);
    return;
  }

  // ─── Beat 12 -> 13: Polar mountain liftoff blending into Mars transit orbit ───
  if (p >= 12.0 && p < 12.55) {
    const u = smoothstep(12.0, 12.55, p);
    setFromVec3(tmpPosA, BEAT_POSES[12].camPos);
    setFromVec3(tmpLookA, BEAT_POSES[12].camLook);
    // Lift off north polar ridge, then rejoin continuous Catmull-Rom orbital arc cleanly
    tmpPosB.copy(traj.camPos);
    tmpLookB.copy(traj.camLook);
    traj.camPos.lerpVectors(tmpPosA, tmpPosB, u);
    traj.camLook.lerpVectors(tmpLookA, tmpLookB, u);
    return;
  }

  // ─── Beat 13 -> 14: Mars Atmospheric Entry -> Touchdown at Chryse -> Low Tracking to Viking 1 ───
  if (p > 13.0 && p < 14.0) {
    const orbitPos = BEAT_POSES[13].camPos;
    const orbitLook = BEAT_POSES[13].camLook;
    const entryMid: readonly [number, number, number] = [9.5, 488.0, -330.0];
    const touchPos: readonly [number, number, number] = [7.0, 474.1, -349.5];
    const touchLook: readonly [number, number, number] = [6.65, 473.15, -368.0];
    const skimPos: readonly [number, number, number] = [7.6, 474.75, -354.5];

    if (p < 13.28) {
      const t = smoothstep(13.0, 13.28, p);
      setFromVec3(tmpPosA, orbitPos);
      setFromVec3(tmpPosB, entryMid);
      traj.camPos.lerpVectors(tmpPosA, tmpPosB, t);
      setFromVec3(tmpLookA, orbitLook);
      setFromVec3(tmpLookB, touchLook);
      traj.camLook.lerpVectors(tmpLookA, tmpLookB, t);
    } else if (p < 13.52) {
      const t = smoothstep(13.28, 13.52, p);
      setFromVec3(tmpPosA, entryMid);
      setFromVec3(tmpPosB, touchPos);
      traj.camPos.lerpVectors(tmpPosA, tmpPosB, t);
      setFromVec3(traj.camLook, touchLook);
    } else if (p < 13.72) {
      const t = smoothstep(13.52, 13.72, p);
      setFromVec3(tmpPosA, touchPos);
      setFromVec3(tmpPosB, skimPos);
      traj.camPos.lerpVectors(tmpPosA, tmpPosB, t);
      setFromVec3(traj.camLook, touchLook);
    } else {
      const t = smoothstep(13.72, 14.0, p);
      setFromVec3(tmpPosA, skimPos);
      setFromVec3(tmpPosB, poseViking1.camPos);
      traj.camPos.lerpVectors(tmpPosA, tmpPosB, t);
      setFromVec3(tmpLookA, touchLook);
      setFromVec3(tmpLookB, poseViking1.camLook);
      traj.camLook.lerpVectors(tmpLookA, tmpLookB, t);
    }
    return;
  }

  // ─── Beats 14..20: Low fast surface flights between Mars machines ───
  if (p >= 14.0 && p < 20.0) {
    const seg = Math.floor(p);
    sampleInterSiteFlight(seg, p - seg, traj.camPos, traj.camLook);
    return;
  }

  // ─── Beat 20 -> 21: Mars liftoff into Tranquil Silence ───
  if (p >= 20.0 && p < 20.5) {
    const u = smoothstep(20.0, 20.5, p);
    setFromVec3(tmpPosA, BEAT_POSES[20].camPos);
    setFromVec3(tmpLookA, BEAT_POSES[20].camLook);
    tmpPosB.copy(traj.camPos);
    tmpLookB.copy(traj.camLook);
    traj.camPos.lerpVectors(tmpPosA, tmpPosB, u);
    traj.camLook.lerpVectors(tmpLookA, tmpLookB, u);
  }
}
