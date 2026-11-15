// Auto tour engine: dwell on a beat -> travel to the next -> wait until landed -> dwell ... until `finale`.
// Never drifts: each travel targets the exact pixel top of the next beat and the dwell timer only starts once landed.
import { useSyncExternalStore } from "react";
import { beats } from "@/content/beats";
import { clipRemaining, unlockAudio } from "@/lib/audioGuide";
import { isScrollBusy, scrollState, scrollToBeat, setScrollGuard } from "@/lib/scroll/progress";
import { useMuseum } from "@/lib/store";

export type TourStatus = "off" | "running" | "paused" | "ended";

const MIN_BEAT = 1;
const MAX_BEAT = beats.length - 1;
const TOL = 0.01;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const DWELL_BY_ID: Record<string, number> = {
  enter: 7,
  ignition: 4,
  "ascent-1": 3,
  "ascent-2": 3,
  "ascent-3": 3,
  "ascent-4": 3,
  "deep-space": 5,
  "moon-grail": 16,
  transit: 5,
  silence: 8,
  beyond: 7,
};
/** Seconds to rest on beat `i` (exhibit beats default to 8). */
export function dwellFor(i: number): number {
  return DWELL_BY_ID[beats[i].id] ?? 8;
}

/** Seconds to travel from beat `i` to `i + 1`. */
export function travelFor(i: number): number {
  const id = beats[i].id;
  if (i >= 1 && i <= 5) return 2.4; // enter..ascent-3 -> next
  if (i === 6) return 3.5; // ascent-4 -> deep-space (lunar orbit)
  if (id === "deep-space") return 4.5; // landing
  if (id === "moon-grail") return 4.0; // leave the Moon
  if (id === "transit") return 4.5; // Mars entry & landing
  if (id === "mars-ingenuity" || id === "silence" || id === "beyond") return 3.5;
  return 3.8; // site hops
}

let status: TourStatus = "off";
const subs = new Set<() => void>();
function setStatus(s: TourStatus) {
  if (status === s) return;
  status = s;
  subs.forEach((l) => l());
}
export const getTourStatus = () => status;
export const isTourRunning = () => status === "running";
export function useTourStatus(): TourStatus {
  return useSyncExternalStore(
    (l) => {
      subs.add(l);
      return () => {
        subs.delete(l);
      };
    },
    () => status,
    () => "off" as TourStatus,
  );
}

let runId = 0;
let hiddenWhileRunning = false;
let detach: (() => void) | null = null;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function position(): number {
  const st = useMuseum.getState();
  const isStatic = st.reducedMotion || st.lightweight || st.webglFailed;
  return isStatic ? scrollState.target : scrollState.current;
}
const nearest = () => Math.max(MIN_BEAT, Math.min(MAX_BEAT, Math.round(scrollState.target)));

async function travel(to: number, duration: number, id: number): Promise<boolean> {
  const reduced = useMuseum.getState().reducedMotion;
  const t0 = performance.now();
  scrollToBeat(to, reduced, { duration, easing: easeInOutCubic });
  const limit = (duration + 2) * 1000;
  while (id === runId) {
    await sleep(40);
    if (id !== runId) return false;
    const el = performance.now() - t0;
    if (el > 120 && Math.abs(position() - to) < TOL && !isScrollBusy()) return true;
    if (el > limit) {
      if (process.env.NODE_ENV !== "production") console.warn(`[autotour] beat ${to} not landed in time, snapping`);
      scrollToBeat(to, true, {});
      await sleep(250);
      return id === runId;
    }
  }
  return false;
}

async function dwell(i: number, id: number): Promise<boolean> {
  const base = dwellFor(i);
  let elapsed = 0;
  let last = performance.now();
  while (id === runId) {
    await sleep(50);
    const now = performance.now();
    elapsed += (now - last) / 1000;
    last = now;
    const rem = clipRemaining(beats[i].id);
    const need = Math.max(base, rem !== null ? elapsed + rem + 0.8 : 0);
    if (elapsed >= need) return true;
  }
  return false;
}

async function run(id: number, fromStart = false) {
  let k = fromStart ? MIN_BEAT : nearest();
  if (Math.abs(position() - k) > TOL || isScrollBusy()) {
    if (!(await travel(k, 1.2, id))) return;
  }
  while (id === runId && k < MAX_BEAT) {
    if (!(await dwell(k, id))) return;
    const next = k + 1;
    if (!(await travel(next, travelFor(k), id))) return;
    k = next;
  }
  if (id === runId) {
    detachGuards();
    setStatus("ended");
  }
}

function attachGuards() {
  detachGuards();
  const pause = () => pauseTour();
  let down: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: PointerEvent) => {
    if (!down || e.buttons === 0) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) pause();
  };
  const onUp = () => {
    down = null;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!["PageUp", "PageDown", "ArrowUp", "ArrowDown", " ", "Home", "End"].includes(e.key)) return;
    const t = e.target as HTMLElement | null;
    if (t && /^(BUTTON|A|SUMMARY|INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && (e.key === " " || e.key.startsWith("Arrow"))) return;
    pause();
  };
  const onVis = () => {
    if (document.hidden) {
      if (status === "running") {
        hiddenWhileRunning = true;
        runId++;
      }
    } else if (hiddenWhileRunning && status === "running") {
      hiddenWhileRunning = false;
      void run(++runId);
    }
  };
  const unsub = useMuseum.subscribe((s) => {
    if (s.activeExhibit !== null) pause();
  });
  window.addEventListener("wheel", pause, { passive: true, capture: true });
  window.addEventListener("touchmove", pause, { passive: true, capture: true });
  window.addEventListener("pointerdown", onDown, { capture: true });
  window.addEventListener("pointermove", onMove, { capture: true });
  window.addEventListener("pointerup", onUp, { capture: true });
  window.addEventListener("keydown", onKey, { capture: true });
  document.addEventListener("visibilitychange", onVis);
  setScrollGuard(pause);
  detach = () => {
    window.removeEventListener("wheel", pause, { capture: true });
    window.removeEventListener("touchmove", pause, { capture: true });
    window.removeEventListener("pointerdown", onDown, { capture: true });
    window.removeEventListener("pointermove", onMove, { capture: true });
    window.removeEventListener("pointerup", onUp, { capture: true });
    window.removeEventListener("keydown", onKey, { capture: true });
    document.removeEventListener("visibilitychange", onVis);
    unsub();
    setScrollGuard(null);
  };
}
function detachGuards() {
  detach?.();
  detach = null;
}

export function startTour() {
  if (status === "running") return;
  unlockAudio(); // user gesture: lets narration clips start later from timers
  hiddenWhileRunning = false;
  attachGuards();
  const fromStart = status === "ended";
  setStatus("running");
  void run(++runId, fromStart);
}

export function pauseTour() {
  if (status !== "running") return;
  runId++;
  hiddenWhileRunning = false;
  detachGuards();
  setStatus("paused");
}

export function toggleTour() {
  if (status === "running") pauseTour();
  else startTour();
}
