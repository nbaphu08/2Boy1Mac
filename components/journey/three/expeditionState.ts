export type ExpeditionPhase =
  | "space"
  | "orbit"
  | "descent"
  | "touchdown"
  | "tracking"
  | "arrived";

export type ExpeditionState = {
  phase: ExpeditionPhase;
  targetSlug: string | null;
  /** Normalized approach progress in [0, 1] toward `targetSlug` (0 = far / departing, 1 = arrived). */
  proximity: number;
};

/**
 * Live per-frame expedition telemetry updated directly from `scrollState.current`
 * inside `SpaceScene`. Read by Sonnet's HUD tracker without React re-renders.
 */
export const expeditionState: ExpeditionState = {
  phase: "space",
  targetSlug: null,
  proximity: 0,
};
