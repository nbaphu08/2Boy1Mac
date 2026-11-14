import { beats } from "@/content/beats";
import { narration } from "@/content/journey";
import { narrationV5 } from "@/content/guide";
import { scrollState, clamp01 } from "@/lib/scroll/progress";

/** Narration with the v5 "Expedition" overrides applied. */
export function narrationFor(id: string): string | undefined {
  return narrationV5[id] ?? narration[id];
}

export type ExpeditionPhase = "approach" | "arrived";
export type ExpeditionSnapshot = {
  phase: ExpeditionPhase;
  targetSlug: string | null;
  proximity: number; // 0..1
};

const FIRST = beats.findIndex((b) => b.id === "deep-space");
const LAST = beats.findIndex((b) => b.id === "mars-ingenuity");
const exhibitBeats = beats
  .map((b, i) => ({ slug: b.exhibitSlug, i }))
  .filter((x): x is { slug: string; i: number } => !!x.slug);

/** Whether the tracker should be visible for a given beat position. */
export function trackerActive(pos: number): boolean {
  return pos >= FIRST - 0.2 && pos <= LAST + 0.5;
}

/** Derived from scroll position: target = next exhibit beat ahead, proximity = 1 - distance in beats. */
function derive(): ExpeditionSnapshot {
  const pos = scrollState.current;
  const next = exhibitBeats.find((e) => e.i >= pos - 0.02) ?? exhibitBeats[exhibitBeats.length - 1];
  const proximity = clamp01(1 - Math.abs(next.i - pos));
  return { phase: proximity > 0.9 ? "arrived" : "approach", targetSlug: next.slug, proximity };
}

/**
 * Adapter: swap to AG-11's export by replacing the body with
 *   `return expeditionState;`  (import { expeditionState } from "@/components/journey/three/expeditionState")
 */
export function readExpedition(): ExpeditionSnapshot {
  return derive();
}
