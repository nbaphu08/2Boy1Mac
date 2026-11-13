# Fable handoff

## Session F1 — step engine (14 Nov 2026)

### Files
| File | What |
|---|---|
| `lib/step/engine.ts` | The engine (module singleton): input, transitions, hash, store sync, beat registry. |
| `lib/step/inertia.ts` | Trackpad inertia filter + `INERTIA` constants. Pure, no DOM. |
| `lib/step/types.ts` | `BeatFactory`, `BeatContext`, `BeatSegment`. |
| `lib/step/index.ts` | Public exports — import from `@/lib/step`. |
| `components/journey/Stage.tsx` | Fixed full-screen stage, 24 **dummy** panels, progress rail, sr-only caption, "Scroll ↓" hint. |
| `app/page.tsx` | Mounts `<Stage />`. |

### Public API (`@/lib/step`)
```ts
next(): void                       // forward one beat; while a forward segment plays → fast-forward ×3 (never queues)
prev(): void                       // 0.6 s rewind to the previous rest frame; ignored while anything plays
goTo(target: number | string): void // 0.8 s warp (index or beat id); ignored while anything plays
registerBeat(id: string, factory: BeatFactory): () => void   // returns unregister

type BeatFactory = (ctx: BeatContext) => BeatSegment;
type BeatContext = { beat: Beat; index: number; el: HTMLElement; mode: "play" | "rest"; reducedMotion: boolean };
type BeatSegment = { timeline: gsap.core.Timeline; video?: HTMLVideoElement; cleanup?: () => void };
```
Also exported: `STEP` (timing constants), `INERTIA`, `defaultFactory`, `getBeatIndex()`, `isLocked()`, `mountStepEngine()` (Stage only).

### How the engine uses a factory (the contract)
- `ctx.el` is the beat's panel: the element with `data-beat="<id>"` inside the Stage. **Keep that attribute on the wrapper** when the dummy panels are replaced; the engine finds panels with `stage.querySelectorAll("[data-beat]")` at mount, in `beats` order.
- **Forward (`mode: "play"`)**: the engine puts the panel on top (`autoAlpha 1`, `z-index 2`; the previous beat stays visible underneath at `z-index 1`), calls the factory, then `timeline.play(0)`. The timeline owns the entrance (fade/cut from the previous beat). The beat rests when the timeline completes **and** (if `video` is returned) the video fired `ended` — or errored, or `play()` was rejected, or `currentTime` did not move for 2.5 s (`STEP.VIDEO_STALL_MS`). Then every other panel is hidden.
- **Rest (`mode: "rest"`)** — rewind, warp, hash on load, reduced motion: the engine calls the factory and does `timeline.progress(1)`, pauses the video and seeks it to its last frame (reduced motion: no seek, poster only). So **the end state of the timeline must be the complete rest frame**, and anything that must be visible at rest must be set by the timeline (or be static).
- The timeline must be created **paused**, must be finite (no `repeat: -1`), and may have its own `onComplete` (the engine chains it). Ambient rest loops belong in separate tweens started from the timeline's end and killed in `cleanup`.
- `cleanup` runs when the engine leaves the beat or rebuilds it. The engine kills the timeline and pauses the video itself.
- A factory is called again on every visit, so build fresh tweens each time (`fromTo`, not `to`).
- The engine sets `muted`, `playsInline`, `currentTime = 0`, `playbackRate` and calls `play()` synchronously inside the input handler. Do not call `play()` yourself.
- Fast-forward sets `timeline.timeScale(3)` and `video.playbackRate = 3`.
- Safety net: a segment is forced to rest `STEP.HANG_GRACE_S` (4 s) after its expected end, with a console warning.
- The engine animates `opacity/visibility`, `z-index`, `transform` (yPercent) and `filter` on the **panel element** during rewind/fade and clears `transform`/`filter` at rest. Animate children of the panel, not the panel's own transform.
- Unregistered beats use `defaultFactory`: panel fade-in, then `[data-beat-body]` rises in, total `max(1, beat.duration)` s.

### Registering a beat with footage (Sonnet)
```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { registerBeat } from "@/lib/step";

export function IgnitionBeat() {
  const video = useRef<HTMLVideoElement>(null);
  const text = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      registerBeat("ignition", ({ el, beat }) => {
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power3.inOut" }, 0);
        tl.fromTo(text.current, { autoAlpha: 0, yPercent: 20 }, { autoAlpha: 1, yPercent: 0, duration: 0.8, ease: "expo.out" }, beat.duration * 0.7);
        return { timeline: tl, video: video.current ?? undefined };
      }),
    [],
  );
  return (
    <>
      <video ref={video} muted playsInline preload="none" poster={/* beat.clip.poster */ undefined} className="absolute inset-0 h-full w-full object-cover" />
      <div ref={text}>…</div>
    </>
  );
}
```
Render it inside `<section data-beat="ignition" …>` in `Stage.tsx`. Registration order does not matter: if the beat is the one currently at rest when it registers, the engine rebuilds its rest state at once.

### Store (`lib/store.ts`)
- `beatIndex` / `beatId` are set to the **target** beat at the **start** of a transition (rail and HUD react at once); `isTransitioning` is `true` until the rest frame. "At rest on beat n" = `beatIndex === n && !isTransitioning`.
- `reducedMotion` is written from `matchMedia` at mount and on change.
- `activeExhibit !== null` pauses everything: `next/prev/goTo` and keys return early, the Observer is disabled so the exhibit panel scrolls natively, and on close the wheel filter is reset so the tail of panel scrolling cannot step the stage.

### Input
- **Wheel**: a native `wheel` listener on the stage feeds raw per-event deltas to the inertia filter. GSAP Observer (`type: "wheel,touch,pointer"`, `preventDefault: true`) is still created on the stage, but for wheel it only does `preventDefault`: Observer batches wheel deltas per animation frame, which hides the decay curve the filter needs.
- **Touch / mouse drag**: Observer `onUp` (finger moves up) → `next()`, `onDown` → `prev()`, 30 px tolerance (`STEP.SWIPE_TOLERANCE`), at most one step per press.
- **Keyboard** (window): `↓` `PageDown` `Space` → next; `↑` `PageUp` `Shift+Space` → prev. Key auto-repeat is ignored. Space is left alone when focus is on a button/link. Keys are ignored inside inputs.
- Elements with `data-step-ignore` (the rail) do not start swipes. Put that attribute on any interactive overlay inside the stage.
- **Hash**: `history.replaceState` to `#<beatId>` at every rest (not on a first load of `/` without a hash). Load with a hash → that rest frame, no animation. `hashchange` → `goTo`.
- **Reduced motion**: next/prev/goTo are all 400 ms crossfades between rest frames; factories are only called in `"rest"` mode; videos are never played.

### Inertia — constants and tuning (`lib/step/inertia.ts`)
| Constant | Value | Meaning |
|---|---|---|
| `GAP_MS` | 400 | Silence after which the next wheel event starts a new gesture. |
| `RISE_RATIO` | 1.6 | A delta (and delta-per-ms) this many times above the last two events = fresh push during a tail. |
| `RISE_MIN` | 15 | …only if the delta is at least this many px. |
| `RISE_GUARD_MS` | 180 | Rise/notch rules are off this long after a gesture starts (a swipe's own ramp-up). |
| `NOTCH_GAP_MS` / `NOTCH_MIN` | 80 / 40 | Mouse-wheel notch: an event ≥ 80 ms after the previous one and ≥ 40 px is a new input. |
| `JITTER_MIN` | 4 | Smaller deltas never trigger. |

A gesture fires **once** (`armed` is consumed by the first delta ≥ `JITTER_MIN`); everything after it is tail until a new gesture is detected. When the filter fires: idle → `next()`/`prev()`; forward segment playing → fast-forward if forward, ignored if backward.

Differences from the skill's pseudo-code (all deliberate):
1. While a segment plays, the skill fast-forwards on **every** same-direction wheel event. The tail of the swipe that started the segment would then always fast-forward it. Here fast-forward also needs a new gesture.
2. `armed` persists: a swipe whose first event is below `JITTER_MIN` is not lost.
3. The rise rule compares against the last two events, also requires the per-ms rate to rise (browser-coalesced events double the delta but not the rate), and is disabled for 180 ms after gesture start.
4. Added the notch rule, otherwise a mouse wheel turned steadily with < 400 ms between notches would fire once and then never again.
5. Event time is `e.timeStamp`, so a main-thread stall cannot look like a 400 ms pause.

**How to tune:** open `/?stepdebug` — every wheel event is logged as `[step:wheel] dt=… dy=… locked=… <-- FIRE`.
- One swipe skips two beats → find the second `FIRE` in the tail. If its `dy` is small, raise `RISE_MIN` (try 25) or `RISE_RATIO` (try 2). If it follows a `dt` > 80, raise `NOTCH_MIN` (try 60) or `NOTCH_GAP_MS`. If it follows a `dt` > 400, raise `GAP_MS` (try 500).
- A segment fast-forwards by itself during one swipe → same fixes; or raise `RISE_GUARD_MS` (try 250).
- A deliberate second swipe is ignored → lower `RISE_RATIO` (1.4) or `GAP_MS` (300).

### What was verified, and how
- `npm run build`, `tsc --noEmit`, `eslint` pass.
- Headless Chrome driven over CDP against `npm run dev`, with **synthetic** input: keys (next, fast-forward on second press, rewind, spam during rewind), synthetic wheel streams shaped like a swipe with an inertia tail (one swipe = one beat; second swipe during a segment = fast-forward only; swipe up = rewind), mouse-wheel notches, rail click warp, `hashchange`, load with `#moon-apollo-11`, reduced-motion fade. Hash and store state were correct in every case, no console errors.
- The filter was also run against simulated streams in Node (single swipe, overlapping swipes, coalesced events, mouse notches).
- **Not tested: any real device.** No real trackpad, Magic Mouse, touch screen or Safari. The synthetic swipe is an idealised decay curve at ~50 ms per event, not real macOS data. The video path (`video` in a segment: `ended`, stall timeout, rejected `play()`, seek-to-end at rest) has **not been run at all** — no beat registers footage yet.

### Humans must test by hand
1. MacBook trackpad, Chrome and Safari: light swipe, hard flick, two quick swipes. One swipe = one beat. Hard flick is the likely failure — use `/?stepdebug`.
2. Magic Mouse (inertial, like a trackpad) and a notched mouse wheel (slow notches, continuous spin).
3. iPhone Safari + Android Chrome: swipe up/down = one step; no rubber-band, no pull-to-refresh, address bar does not break `100dvh`; rail dots tappable.
4. Keyboard only: ↓ ↑ Space PageUp PageDown; Tab to the rail, Enter on a dot.
5. Refresh on `/#moon-apollo-11` lands on that beat; back/forward buttons.
6. OS "Reduce motion" on: 400 ms fades only.
7. Once footage is wired: iOS Low Power Mode (autoplay blocked → beat must still advance within ~2.5 s), slow network.

### Known risks / not done
- **Layout footer**: `app/layout.tsx` renders the disclaimer footer after `{children}`; the fixed stage covers it on `/`. The disclaimer needs a place on the Journey page (layout is outside F1 scope).
- Rest-frame ambient motion (fog, twinkle, slow scale), letterbox, grain, SplitText captions: not built (F3 / Sonnet).
- Video preload policy from the skill (`preload="auto"` for n+1/n+2, drop `src` ≥ 4 beats away): not built. It belongs with the footage components; subscribe to `beatIndex`.
- Rewind blurs the whole outgoing panel (`filter: blur(8px)`) for 0.6 s; with a full-screen video on a weak phone this may drop frames. If so, remove the `filter` tween in `crossfade()`.
- Fast-forward sets `video.playbackRate = 3`; if the timeline is much shorter than the clip, the beat still waits for the video's `ended`.
- `goTo` / `hashchange` during a transition is ignored, not queued (per spec).
- The engine is a module singleton: one Stage per page.
- The "Scroll ↓" hint text comes from PLAN §3.1; check it against `docs/COPY.md`.
- The dummy panels show debug text (index, id, act, duration) that is not site copy; it goes away with the real scenes.
