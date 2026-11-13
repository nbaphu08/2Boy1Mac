// Trackpad inertia filter — "one swipe = one beat".
// Based on .claude/skills/spacemuse-step-engine (gap / rising-delta rule), with three hardenings
// documented in docs/HANDOFF_FABLE.md (Inertia section).

export const INERTIA = {
  /** Silence (ms) after which the next wheel event is a new gesture. */
  GAP_MS: 400,
  /** A delta this many times larger than the recent deltas means a fresh push after decay... */
  RISE_RATIO: 1.6,
  /** ...but only if it is at least this big (px). Inertia tails are usually below this late in the decay. */
  RISE_MIN: 15,
  /** The rising-delta rule is off for this long after a gesture starts, so a swipe's own ramp-up is not read as a second swipe. */
  RISE_GUARD_MS: 180,
  /** Mouse-wheel notches: an event at least this long after the previous one… */
  NOTCH_GAP_MS: 80,
  /** …and at least this big (px) is a new input even without a 400 ms pause. */
  NOTCH_MIN: 40,
  /** Deltas below this never trigger anything (jitter). */
  JITTER_MIN: 4,
} as const;

export type WheelFilter = {
  /** Feed every wheel event. Returns true when this event is the (single) trigger of a new gesture. */
  feed: (dy: number, now?: number) => boolean;
  /** Forget everything and demand a fresh gesture (call after the engine was paused). */
  reset: (now?: number) => void;
};

export function createWheelFilter(): WheelFilter {
  let lastTs = -Infinity;
  let gestureStart = -Infinity;
  let prevA = 0; // |delta| of the previous event
  let prevB = 0; // |delta| of the event before that
  let rateA = 0; // |delta| per ms of the previous event
  let rateB = 0;
  let armed = false;

  return {
    feed(dy, now = performance.now()) {
      const a = Math.abs(dy);
      const gap = now - lastTs;
      // delta per ms: a browser-coalesced event (2 events merged) doubles `a` but not the rate,
      // a late-delivered event raises the rate but not `a` — a real new push raises both.
      const rate = a / Math.min(Math.max(gap, 4), 100);
      const byGap = gap > INERTIA.GAP_MS;
      const settled = now - gestureStart > INERTIA.RISE_GUARD_MS;
      const byRise =
        settled &&
        a > INERTIA.RISE_MIN &&
        a > Math.max(prevA, prevB) * INERTIA.RISE_RATIO &&
        rate > Math.max(rateA, rateB) * INERTIA.RISE_RATIO;
      // classic mouse wheel turned steadily: big discrete notches, far apart compared with a trackpad stream
      const byNotch = settled && gap > INERTIA.NOTCH_GAP_MS && a >= INERTIA.NOTCH_MIN;

      lastTs = now;
      prevB = byGap ? 0 : prevA;
      prevA = a;
      rateB = byGap ? 0 : rateA;
      rateA = byGap ? 0 : rate;

      if (byGap || byRise || byNotch) {
        armed = true;
        gestureStart = now;
      }
      if (!armed) return false; // inertia tail
      if (a < INERTIA.JITTER_MIN) return false; // jitter: stay armed, a real delta of this gesture may follow
      armed = false;
      return true;
    },
    reset(now = performance.now()) {
      lastTs = now;
      gestureStart = now;
      prevA = prevB = rateA = rateB = Number.MAX_SAFE_INTEGER;
      armed = false;
    },
  };
}
