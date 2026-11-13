---
name: spacemuse-step-engine
description: Spec and gotchas for SpaceMuse's step-scroll engine (one wheel/swipe/key = one fixed cinematic segment). Use when building or debugging lib/step/**, the Journey stage, beat transitions, trackpad inertia, rewind/warp, URL hash sync or reduced-motion behavior.
---

# SpaceMuse step-scroll engine

Source of truth: `PLAN.md` §3.1 (behavior) and §3.2 (beat table). Beat data lives in `content/beats.ts` (24 beats, index 0–23).

## Behavior contract
| Input | Idle (rest frame) | Segment playing |
|---|---|---|
| Wheel/swipe down, `↓`, `Space`, `PageDown` | `next()` | same direction → `tl.timeScale(3)` (fast-forward), never queue |
| Wheel/swipe up, `↑`, `PageUp` | `prev()` = 0.6s rewind | ignored |
| Rail click / hash change | `goTo(i)` = 0.8s warp | ignored until done |
| `activeExhibit !== null` | engine paused (panel scrolls natively) | — |

## Trackpad inertia (the #1 bug — must get right)
macOS trackpads emit `wheel` events for ~1s after the finger lifts. Without filtering, one swipe skips 2–3 beats.

Algorithm (per wheel event, after GSAP Observer normalizes delta):
```
state: locked (segment playing), lastWheelTs, lastAbsDelta, armed
on wheel(dy):
  now = performance.now(); a = |dy|
  if locked: if sameDirection → fastForward(); lastWheelTs = now; return
  gap = now - lastWheelTs
  isNewGesture = gap > 400 || (a > lastAbsDelta * 1.6 && a > 15)   // fresh push after decay
  lastWheelTs = now; lastAbsDelta = a
  if !armed && !isNewGesture: return          // inertia tail after a segment
  if a < 4: return                             // jitter
  armed = false; dy > 0 ? next() : prev()
on segment complete: locked = false   (armed stays false until isNewGesture)
```
Mouse wheels send large discrete deltas (≈100) with gaps → always new gestures. Test on: MacBook trackpad, Magic Mouse, normal mouse, iPhone swipe, keyboard.

## Implementation notes
- Stage: `position:fixed; inset:0; overflow:hidden; overscroll-behavior:none;` and `touch-action:none` on the stage only (not on the exhibit panel).
- GSAP `Observer.create({ type: "wheel,touch,pointer", wheelSpeed: -1, tolerance: 10, preventDefault: true, onUp, onDown })` — remember touch direction is inverted vs wheel; verify on device.
- Each beat = a factory returning a paused `gsap.timeline()`; a beat with footage resolves when the `<video>` reaches its end (`ended`) AND the timeline finishes.
- Rest frame = beat's poster/last frame + subtle ambient loop (fog drift, star twinkle, 1.00→1.02 slow scale). Show "Scroll ↓" hint after 3s idle.
- Rewind: snapshot current frame → blur(8px)+vertical motion → crossfade to previous beat's poster in 0.6s. Never play video backwards.
- Warp: fade to black 0.3s → set target beat's rest state → fade in 0.5s.
- Hash: `history.replaceState` to `#<beatId>` on rest; on load parse hash and jump directly to that rest state (no animation).
- Reduced motion (`matchMedia('(prefers-reduced-motion: reduce)')`): every transition = 400ms crossfade between posters; videos never autoplay.
- Expose `beatIndex`, `beatId`, `isTransitioning` to `lib/store.ts`; read `activeExhibit` from it.
- Preload: when resting on beat n, set `preload="auto"` on videos for n+1 and n+2, `preload="none"` elsewhere; remove `src` of videos ≥ 4 beats away to free memory on mobile.

## iOS / Safari gotchas
- Video needs `muted playsInline autoplay` attributes set **before** `play()`; call `play()` inside the input handler on first interaction.
- Low Power Mode blocks autoplay → `play()` rejects: catch it, show the poster and still advance the timeline (beat must never hang).
- `100dvh` not `100vh`.

## Done when
One swipe = exactly one beat on all five input devices; spamming input never desyncs; refresh on `#moon-apollo-11` lands on that beat.
