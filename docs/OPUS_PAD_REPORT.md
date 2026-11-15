# Opus pad scene: beats 1–2 (`enter`, `ignition`) rebuilt as a photograph across the water

Branch `opus/pad-scene`, cut from `origin/main` @ c50fac3. Not merged and not deployed.
Reference: `docs/antigravity/ref/earth/user-ref-launch-across-water.png`.

## What changed
- **Composition (`trajectory.ts`, BEAT_POSES 1–2 only):** the camera now sits low on the far shore of a lagoon, about 60 units (~0.5 km) from the pad. From front to back the frame reads: water, then a dark tree line, then the pad complex, then the sky. The VAB is small on the left horizon (about 650 units ≈ 5.5 km away), and the narration and panel areas stay clear. Ignition uses the same shore, pulled back slightly. Beats 0 and 3–23 and the timing curves are unchanged.
- **New `earth/` module (`components/journey/three/earth/`):**
  - `LagoonWater.tsx`: one water plane for the lagoon, the ponds and the Atlantic.
    - High and medium tiers get a planar mirror reflection (half-res on high, 0.36× on medium), rendered in `useFrame` with oblique clipping and no shadow re-render.
    - The reflection is distorted by tiled ripple normals, with fresnel, soft sun glints and haze.
    - Low tier gets an analytic sky reflection instead.
  - `WetlandLandscape.tsx`:
    - Marsh ground shader with ponds cut out procedurally.
    - Three jagged tree-line silhouette ribbons (near shore, behind the pad, far horizon). They sink into the ground as the camera climbs.
    - Instanced, noise-displaced canopy groves for the aerial ascent-1 view.
    - A distant transmission line (poles and sagging wires), as in the reference.
  - `LaunchSmoke.tsx`: camera-facing smoke puffs, CPU depth-sorted, at most 150 instances.
    - Wide billowing ground clouds out of the trench.
    - A smoke column from the pad up to the rocket's tail, lit from below by a warm engine glow and shaded toward the sun.
    - Faint cryogenic vapour wisps on the pad before T-0.
  - `LaunchAtmosphere.tsx`: a postprocessing effect that is always mounted.
    - Depth-based aerial haze plus a gentle Deep Field grade (slight desaturation, slate shadows).
    - Fades to 0 between p 3.35 and 4.0, so it adds nothing after ascent-1.
- **Sky (`CelestialWorlds.tsx`, AscentSkyDome only):** a soft overcast dusk: slate zenith, pale grey-blue horizon and low-contrast stratocumulus, with only a faint peach glow toward the low WNW sun. The day colours used during the ascent beats are slightly desaturated.
- **Pad (`LaunchComplex.tsx`):**
  - The berm is smaller and grassed.
  - The lightning-mast triangle is rotated 60° so no mast stands between the camera and the rocket. Catenaries and guy anchors moved with it.
  - The VAB is re-placed at about 5 km and faces the camera. The crawlerway and sodium lamps are re-aimed at it.
  - The LH2 sphere is matte. The stadium light banks are slimmer.
  - Removed: the stick marsh, the old ocean plane, the wetland and lagoon slabs.
- **`SLSRocket.tsx` (exhaust/steam only):** removed the point-sprite "bokeh" steam; it is replaced by `LaunchSmoke`. ROFI sparks are now limited to T-0 and are smaller, so there is no confetti during the climb.
- **`RenderPipeline.tsx`:** `<LaunchAtmosphere />` added to the high and medium composers. Nothing else changed.

## Before / after (`docs/review/opus-pad/`)
- `compare-ref-before-after.jpg`: reference | before | after, for enter (top) and ignition (bottom).
- `before-*.jpg` and `after-*.jpg`: `enter`, `ignition`, `ascent-1`, `enter-mobile` (390×844).
- `after-enter-low-tier.jpg`: low tier, forced with `hardwareConcurrency = 4`.

## Verification
- `npx tsc --noEmit && npx eslint app components lib content && npm run build`: all pass.
- Real WebGL in system Chrome (ANGLE Metal, Apple M1 Pro), `next start -p 3350`. Posters checked: enter, ignition, ascent-1 to ascent-4, and enter at 390×844. The low and medium tiers were also captured. **0 console errors** (only the pre-existing three.js deprecation warnings).
- Jank test: Playwright wheel-scroll, beats 1→7, recording requestAnimationFrame deltas.
  - Idle at beat 1: **60.0 fps**.
  - Scroll 1→7: p99 16.8 ms, **max frame 33.3 ms**, 0 frames over 50 ms.
  - Full journey 1→23: max 33.4 ms, 0 frames over 50 ms.
  - Headless Chrome is capped at 60 Hz by vsync.
- New materials live inside the `warmup-launch-complex` group, so the existing `MaterialPrewarmer` compiles them during beats 0–2. The post effect is mounted once and never toggled.

## Not done / notes
- The ML-1 tower and the rocket model were not rebuilt; they were outside scope.
- The ascent-1 aerial ground is still fairly plain: hazy marsh with canopy blobs and ponds.
- `?poster=` cannot reach fractional progress values, so the transition check used scrolled captures at p 1.5, 2.3, 2.6 and 2.85. All four were continuous.
