import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { beats, beatIndexById } from "@/content/beats";
import { useMuseum } from "@/lib/store";
import { createWheelFilter } from "./inertia";
import type { BeatFactory, BeatSegment, TransitionKind } from "./types";

export const STEP = {
  FAST_FORWARD: 3, // timeScale while the same-direction input repeats
  REWIND_S: 0.6,
  WARP_OUT_S: 0.3,
  WARP_IN_S: 0.5,
  REDUCED_S: 0.4,
  VIDEO_STALL_MS: 2500, // no currentTime progress for this long -> give up on the video
  HANG_GRACE_S: 4, // hard cap after the expected end of a segment: a beat must never hang
  SWIPE_TOLERANCE: 30, // px of touch / pointer drag for one step
} as const;

type Mount = { stage: HTMLElement; veil: HTMLElement; panels: HTMLElement[] };

const registry = new Map<string, BeatFactory>();
const last = beats.length - 1;

let m: Mount | null = null;
let index = 0;
let locked = false;
let kind: TransitionKind | null = null;
let run = 0; // token: every transition bumps it, stale callbacks bail out
let active: BeatSegment | null = null;
let transitionTl: gsap.core.Timeline | null = null;
let stopWatch: (() => void) | null = null;

const store = () => useMuseum.getState();
const canAct = () => m !== null && store().activeExhibit === null;

// ───────────────────────── default beat ─────────────────────────
export const defaultFactory: BeatFactory = ({ el, beat }) => {
  const d = Math.max(1, beat.duration);
  const body = el.querySelector<HTMLElement>("[data-beat-body]");
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.6, ease: "power3.inOut" }, 0);
  if (body) {
    // text arrives after the "camera" move has mostly settled (PLAN §6 motion rule 3)
    tl.fromTo(
      body,
      { autoAlpha: 0, yPercent: 8 },
      { autoAlpha: 1, yPercent: 0, duration: d * 0.55, ease: "expo.out" },
      d * 0.45,
    );
  }
  const padding = d - tl.duration();
  if (padding > 0.001) tl.to({}, { duration: padding }); // pad to exactly d
  return { timeline: tl };
};

// ───────────────────────── internals ─────────────────────────
function build(i: number, mode: "play" | "rest"): BeatSegment {
  const beat = beats[i];
  const ctx = { beat, index: i, el: m!.panels[i], mode, reducedMotion: store().reducedMotion };
  const factory = registry.get(beat.id);
  if (factory) {
    try {
      return factory(ctx);
    } catch (err) {
      console.error(`[step] beat "${beat.id}" factory threw, using default`, err);
    }
  }
  return defaultFactory(ctx);
}

function disposeActive() {
  stopWatch?.();
  stopWatch = null;
  if (!active) return;
  active.timeline.kill();
  if (active.video) {
    active.video.pause();
    active.video.playbackRate = 1;
  }
  try {
    active.cleanup?.();
  } catch (err) {
    console.error("[step] cleanup threw", err);
  }
  active = null;
}

function showOnly(i: number) {
  m!.panels.forEach((p, j) => {
    gsap.set(p, { autoAlpha: j === i ? 1 : 0, zIndex: j === i ? 2 : 0, clearProps: "filter,transform" });
  });
}

function seekToEnd(v: HTMLVideoElement) {
  v.pause();
  const seek = () => {
    if (Number.isFinite(v.duration) && v.duration > 0) v.currentTime = Math.max(0, v.duration - 0.05);
  };
  if (v.readyState >= 1) seek();
  else v.addEventListener("loadedmetadata", seek, { once: true }); // until then the poster shows
}

/** Put beat i in its rest state (timeline at its end, video on its last frame). Does not change visibility. */
function setRest(i: number) {
  disposeActive();
  const seg = build(i, "rest");
  seg.timeline.progress(1);
  if (seg.video && !store().reducedMotion) seekToEnd(seg.video); // reduced motion: poster only
  active = seg;
}

function begin(to: number, k: TransitionKind) {
  locked = true;
  kind = k;
  run += 1;
  transitionTl?.kill();
  transitionTl = null;
  const s = store();
  s.setBeat(to, beats[to].id); // the store shows the TARGET beat while isTransitioning is true
  s.setTransitioning(true);
  return run;
}

function finish(i: number) {
  index = i;
  showOnly(i);
  locked = false;
  kind = null;
  transitionTl = null;
  const s = store();
  if (s.beatIndex !== i) s.setBeat(i, beats[i].id);
  s.setTransitioning(false);
  const hash = `#${beats[i].id}`;
  if (window.location.hash !== hash && !(i === 0 && !window.location.hash)) {
    window.history.replaceState(window.history.state, "", hash);
  }
}

function playSegment(to: number) {
  const id = begin(to, "segment");
  const from = index;
  disposeActive();
  gsap.set(m!.panels[from], { zIndex: 1 });
  gsap.set(m!.panels[to], { autoAlpha: 1, zIndex: 2, yPercent: 0, clearProps: "filter" });

  const seg = build(to, "play");
  active = seg;
  const { timeline: tl, video } = seg;
  let tlDone = false;
  let videoDone = !video;
  const done = () => {
    if (run !== id || !tlDone || !videoDone) return;
    stopWatch?.();
    stopWatch = null;
    finish(to);
  };

  const userComplete = tl.eventCallback("onComplete") as unknown;
  tl.eventCallback("onComplete", () => {
    if (typeof userComplete === "function") userComplete();
    tlDone = true;
    done();
  });

  const cleanups: (() => void)[] = [];
  if (video) {
    const endVideo = () => {
      videoDone = true;
      done();
    };
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.playbackRate = 1;
    try {
      video.currentTime = 0;
    } catch {}
    video.addEventListener("ended", endVideo);
    video.addEventListener("error", endVideo);
    let lastT = -1;
    let lastMove = performance.now();
    const iv = window.setInterval(() => {
      if (video.ended) return endVideo();
      if (video.currentTime !== lastT) {
        lastT = video.currentTime;
        lastMove = performance.now();
      } else if (performance.now() - lastMove > STEP.VIDEO_STALL_MS) {
        video.pause(); // stalled (network / decode / Low Power Mode): keep whatever frame shows, move on
        endVideo();
      }
    }, 250);
    cleanups.push(() => {
      window.clearInterval(iv);
      video.removeEventListener("ended", endVideo);
      video.removeEventListener("error", endVideo);
    });
    // called synchronously inside the input handler (needed by iOS)
    video.play()?.catch(endVideo);
  }

  // absolute safety net: never hang on a beat
  const videoLen = video && Number.isFinite(video.duration) ? video.duration : 0;
  const expected = Math.max(Math.min(tl.totalDuration(), 60), beats[to].duration, videoLen, 1);
  const hang = window.setTimeout(() => {
    if (run !== id) return;
    console.warn(`[step] beat "${beats[to].id}" did not finish in time, forcing rest`);
    tl.progress(1);
    tlDone = videoDone = true;
    done();
  }, (expected + STEP.HANG_GRACE_S) * 1000);
  cleanups.push(() => window.clearTimeout(hang));
  stopWatch = () => cleanups.forEach((c) => c());

  tl.timeScale(1).play(0);
}

function fastForward() {
  if (!active) return;
  active.timeline.timeScale(STEP.FAST_FORWARD);
  if (active.video) {
    try {
      active.video.playbackRate = STEP.FAST_FORWARD;
    } catch {}
  }
}

/** Rewind (blur + vertical drift + crossfade) or plain reduced-motion fade to the rest frame of `to`. */
function crossfade(to: number, k: "rewind" | "fade") {
  const id = begin(to, k);
  const out = m!.panels[index];
  const inn = m!.panels[to];
  setRest(to);
  const rewind = k === "rewind";
  const duration = rewind ? STEP.REWIND_S : STEP.REDUCED_S;
  gsap.set(out, { zIndex: 1 });
  gsap.set(inn, { autoAlpha: 0, zIndex: 2, yPercent: rewind ? -4 : 0 });
  const tl = gsap.timeline({
    onComplete: () => {
      if (run === id) finish(to);
    },
  });
  if (rewind) {
    tl.to(out, { autoAlpha: 0, yPercent: 6, filter: "blur(8px)", duration, ease: "power3.inOut" }, 0);
    tl.to(inn, { autoAlpha: 1, yPercent: 0, duration, ease: "power3.inOut" }, 0);
  } else {
    tl.to(out, { autoAlpha: 0, duration, ease: "none" }, 0);
    tl.to(inn, { autoAlpha: 1, duration, ease: "none" }, 0);
  }
  transitionTl = tl;
}

function warp(to: number) {
  const id = begin(to, "warp");
  const veil = m!.veil;
  transitionTl = gsap
    .timeline({
      onComplete: () => {
        if (run === id) finish(to);
      },
    })
    .to(veil, { autoAlpha: 1, duration: STEP.WARP_OUT_S, ease: "power2.in" })
    .add(() => {
      if (run !== id) return;
      setRest(to);
      showOnly(to);
    })
    .to(veil, { autoAlpha: 0, duration: STEP.WARP_IN_S, ease: "power2.out" });
}

/** Instant jump to a rest state (hash on load). */
function jump(to: number) {
  run += 1;
  transitionTl?.kill();
  setRest(to);
  gsap.set(m!.veil, { autoAlpha: 0 });
  finish(to);
}

// ───────────────────────── public API ─────────────────────────
/** Forward one beat. While a forward segment is playing: fast-forward it (never queues). */
export function next() {
  if (!canAct()) return;
  if (locked) {
    if (kind === "segment") fastForward();
    return;
  }
  if (index >= last) return;
  if (store().reducedMotion) crossfade(index + 1, "fade");
  else playSegment(index + 1);
}

/** Back one beat: 0.6 s rewind to the previous rest frame. Ignored while anything is playing. */
export function prev() {
  if (!canAct() || locked || index <= 0) return;
  crossfade(index - 1, store().reducedMotion ? "fade" : "rewind");
}

/** Warp (0.8 s through black) to any beat, by index or id. Ignored while anything is playing. */
export function goTo(target: number | string) {
  const i = typeof target === "string" ? beatIndexById(target) : target;
  if (!canAct() || locked || !Number.isInteger(i) || i < 0 || i > last || i === index) return;
  if (store().reducedMotion) crossfade(i, "fade");
  else warp(i);
}

/**
 * Register the cinematic factory of a beat. Returns an unregister function (use it as the effect cleanup).
 * Safe to call before or after the Stage mounts; if the beat is the one currently at rest it is rebuilt at once.
 */
export function registerBeat(id: string, factory: BeatFactory): () => void {
  if (beatIndexById(id) < 0) console.warn(`[step] registerBeat: unknown beat id "${id}"`);
  registry.set(id, factory);
  if (m && !locked && beats[index].id === id) {
    setRest(index);
    showOnly(index);
  }
  return () => {
    if (registry.get(id) === factory) registry.delete(id);
  };
}

export const getBeatIndex = () => index;
export const isLocked = () => locked;

/** Called once by <Stage>. Returns the unmount function. */
export function mountStepEngine(mount: Mount): () => void {
  gsap.registerPlugin(Observer);
  m = mount;
  const { stage } = mount;
  const filter = createWheelFilter();
  const off: (() => void)[] = [];

  // reduced motion
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMql = () => store().setReducedMotion(mql.matches);
  onMql();
  mql.addEventListener("change", onMql);
  off.push(() => mql.removeEventListener("change", onMql));

  // initial state: hash -> that rest frame, no animation
  const readHash = () => {
    try {
      return beatIndexById(decodeURIComponent(window.location.hash.slice(1)));
    } catch {
      return -1;
    }
  };
  const fromHash = readHash();
  jump(fromHash >= 0 ? fromHash : 0);

  // wheel: raw per-event deltas through the inertia filter.
  // (Observer batches wheel deltas per animation frame, which hides the decay curve, so Observer only
  //  does preventDefault for wheel, and steps for touch / pointer.)
  const debug = window.location.search.includes("stepdebug"); // open /?stepdebug to log every wheel event
  let debugTs = 0;
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // pinch-zoom / horizontal swipe
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    const dy = e.deltaY * unit;
    // e.timeStamp (not "now"): a main-thread stall must not look like a 400 ms pause between events
    const fire = filter.feed(dy, e.timeStamp);
    if (debug) {
      const now = performance.now();
      console.log(`[step:wheel] dt=${Math.round(now - debugTs)} dy=${Math.round(dy)} locked=${locked}${fire ? "  <-- FIRE" : ""}`);
      debugTs = now;
    }
    if (!fire) return;
    if (dy > 0) next();
    else prev();
  };
  stage.addEventListener("wheel", onWheel, { passive: true });
  off.push(() => stage.removeEventListener("wheel", onWheel));

  // touch / pointer drag: one press = at most one step
  let swipeUsed = false;
  const swipe = (dir: 1 | -1) => (self: Observer) => {
    if (swipeUsed || (self.event?.type ?? "").startsWith("wheel")) return;
    swipeUsed = true;
    if (dir > 0) next();
    else prev();
  };
  const observer = Observer.create({
    target: stage,
    type: "wheel,touch,pointer",
    tolerance: STEP.SWIPE_TOLERANCE,
    preventDefault: true,
    ignore: "[data-step-ignore]",
    onPress: () => {
      swipeUsed = false;
    },
    onUp: swipe(1), // finger moves up = forward
    onDown: swipe(-1),
  });
  off.push(() => observer.kill());

  // keyboard
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey || !canAct()) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest?.("input, textarea, select, [contenteditable='true']")) return;
    const onControl = !!t?.closest?.("button, a, [role='button']");
    let dir = 0;
    if (e.key === "ArrowDown" || e.key === "PageDown") dir = 1;
    else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
    else if (e.key === " " && !onControl) dir = e.shiftKey ? -1 : 1;
    if (!dir) return;
    e.preventDefault();
    if (dir > 0) next();
    else prev();
  };
  window.addEventListener("keydown", onKey);
  off.push(() => window.removeEventListener("keydown", onKey));

  // hash typed / link clicked (replaceState on rest does not fire this)
  const onHash = () => {
    const i = readHash();
    if (i >= 0) goTo(i);
  };
  window.addEventListener("hashchange", onHash);
  off.push(() => window.removeEventListener("hashchange", onHash));

  // pause while an exhibit panel is open (it scrolls natively)
  const syncPause = (open: boolean) => {
    if (open) observer.disable();
    else {
      filter.reset(); // the tail of the panel's scrolling must not step the stage
      observer.enable();
    }
  };
  if (store().activeExhibit !== null) syncPause(true);
  off.push(
    useMuseum.subscribe((s, p) => {
      if ((s.activeExhibit !== null) !== (p.activeExhibit !== null)) syncPause(s.activeExhibit !== null);
    }),
  );

  return () => {
    run += 1;
    off.forEach((f) => f());
    transitionTl?.kill();
    transitionTl = null;
    disposeActive();
    locked = false;
    kind = null;
    m = null;
    store().setTransitioning(false);
  };
}
