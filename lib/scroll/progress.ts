import { beats } from "@/content/beats";

export type ScrollState = {
  /** Target beat progress in [0, beats.length - 1], updated immediately on scroll. */
  target: number;
  /** Damped beat progress in [0, beats.length - 1], updated inside R3F useFrame. */
  current: number;
  /** Signed instantaneous scroll velocity in beats/sec for camera/plume dynamics. */
  velocity: number;
  /** Maximum beat index (beats.length - 1). */
  readonly maxBeat: number;
};

export const scrollState: ScrollState = {
  target: 0,
  current: 0,
  velocity: 0,
  maxBeat: beats.length - 1,
};

type ScrollHandler = (beatIndex: number, instant?: boolean) => void;
let scrollHandler: ScrollHandler | null = null;

/** Register the Stage's native scroller so ProgressRail, Skip, and hash links can jump smoothly. */
export function registerScroller(fn: ScrollHandler | null) {
  scrollHandler = fn;
}

/** Scroll smoothly (or instantly) to a beat by index or id. */
export function scrollToBeat(target: number | string, instant = false) {
  const index = typeof target === "string" ? beats.findIndex((b) => b.id === target) : target;
  if (index < 0 || index > scrollState.maxBeat) return;
  scrollHandler?.(index, instant);
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
}

export function remapClamp(v: number, inMin: number, inMax: number, outMin = 0, outMax = 1): number {
  const t = clamp01((v - inMin) / (inMax - inMin || 1));
  return outMin + (outMax - outMin) * t;
}
