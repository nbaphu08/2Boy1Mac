import { beats } from "@/content/beats";
import { smoothstep } from "@/lib/scroll/progress";
import { expeditionState } from "./expeditionState";
import { BEAT_POSES, type SampledTrajectory } from "./trajectory";

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
    } else if (p < 7.52) {
      expeditionState.phase = "descent";
      expeditionState.proximity = smoothstep(7.06, 7.52, p) * 0.45;
    } else if (p < 7.78) {
      expeditionState.phase = "touchdown";
      expeditionState.proximity = 0.45 + 0.25 * smoothstep(7.52, 7.78, p);
    } else {
      expeditionState.phase = p >= 7.88 ? "arrived" : "tracking";
      expeditionState.proximity = 0.7 + 0.3 * smoothstep(7.78, 7.88, p);
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
    } else if (p < 13.54) {
      expeditionState.phase = "descent";
      expeditionState.targetSlug = "mars-viking-1";
      expeditionState.proximity = smoothstep(13.06, 13.54, p) * 0.45;
    } else if (p < 13.78) {
      expeditionState.phase = "touchdown";
      expeditionState.targetSlug = "mars-viking-1";
      expeditionState.proximity = 0.45 + 0.25 * smoothstep(13.54, 13.78, p);
    } else {
      expeditionState.phase = p >= 13.88 ? "arrived" : "tracking";
      expeditionState.targetSlug = "mars-viking-1";
      expeditionState.proximity = 0.7 + 0.3 * smoothstep(13.78, 13.88, p);
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
 * In AG-13, `sampleTrajectory(p, traj)` drives the full continuous C1 centripetal spline
 * across space, landings, and site hops. Under reduced motion, snap directly to nearest rest pose.
 */
export function applyExpeditionCamera(
  p: number,
  reducedMotion: boolean,
  traj: SampledTrajectory,
): void {
  if (reducedMotion && p >= 7.05 && p <= 20.5) {
    const nearest = Math.max(7, Math.min(21, Math.round(p)));
    const pBeat = BEAT_POSES[nearest];
    if (pBeat) {
      traj.camPos.set(...pBeat.camPos);
      traj.camLook.set(...pBeat.camLook);
    }
  }
}
