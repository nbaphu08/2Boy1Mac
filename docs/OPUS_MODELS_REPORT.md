# Opus model pass — report (branch `opus/models-1`)

All captures: production build (`next build && next start`), system Chrome via Playwright, 1600×900, `?poster=<slug>`.
Before/after pairs (before = main `c06e510`): `docs/review/opus-models/<slug>_before-after.jpg` (9 files, 48–132 KB each).
Part 1 (M1 + M2, commit `88bcbc8`) was already merged by Opus; this report covers both parts.

## M1 · Apollo 11 + Apollo 17 LM descent stage ✅ (merged)
- New `components/journey/three/models/ApolloLmDescentStage.tsx`: the **NASA SM-L-001 GLB** supplies the real landing gear, footpads, ladder and porch. The ascent stage and the interstage struts/fittings are **removed from the scene graph** (so they don't render or take clicks).
- The GLB's plain yellow drum is replaced by a procedural octagonal stage, 4.2 m across × 1.9 m. It is covered in crinkled amber Kapton with black film on the top band and side quads, taped seams and an aluminised bottom strip. It carries the US flag panel where the NASA model has it, plus an empty top deck, a base heat shield and a small blank plaque behind the ladder. "UNITED STATES" text is left out.
- Scale is 1 GLB unit = 1.4 m (from the 4.2 m stage width). This gives a 7.0 m total height and ~9.0 m between opposite pads (real: 9.4 m). The footpads are seated on the terrain.
- `foilTextures.ts`: shared crinkle/foil canvases plus a small **lunar reflection env** (black sky, bright regolith). The hall env is 0.09 on the Moon, which had left every metal flat.
- The LRRR, its green laser and the EASEP are unchanged. The old `ClippedLmTopCap` and the hand-built ladder are deleted.

## M2 · LRV (Apollo 15 + Apollo 17) ✅ (merged) + review fix
- New `models/LunarRover.tsx`, built to NSSDCA sizes (3.1 m frame, 2.3 m wheelbase, 1.83 m tread, 0.818 m tyres). It has:
  - alpha-tested wire-mesh tyres with chevrons, the bump-stop frame and outer discs
  - suspension arms and thin fenders
  - tubular seats with woven webbing, footrests, console + T-handle and the LGA helix
  - umbrella HGA with ribs, gold TV camera (GCTA), LCRU box and aft tool pallet
- **Review fix (this part):** fenders are now grey (`#B9B7B1`), not copper. The LCRU blanket is less orange.
- The Apollo 17 rover is re-parked clear of Challenger's footpads at local (6.9, 0.3). Its tracks were moved to lead into it. Edit is in `MoonDioramas.tsx`.

## M5 · Framing ✅
- `BEAT_POSES` changed **only for beats 19 (InSight) and 20 (Ingenuity)** in `trajectory.ts`.
  - InSight: closer 3/4 view, lander ≈ 43 % of frame height, sitting centre-right.
  - Ingenuity: camera ~1.9 m from the 0.49 m helicopter, ≈ 38 % of frame height.
  - Upper-left and lower-left stay empty ground or sky in both.
- Viking 1 measured ≈ 40 % already, so its pose is unchanged. Its sampler trench is now a soft-edged decal instead of a black slab.
- Ingenuity: the broken blade piece is now a tapered matte carbon tip to the right of the helicopter, not a blue bar in front. The small backshell prop was nudged back and left so it no longer sits directly above the rotor.

## M6 · Spirit ✅
- The terrain shader's Troy disc is switched off (`spiritTroyPatch: false` in `MarsDioramas.tsx`; the shader file itself is untouched).
- The rover sits 0.14 m lower, with wheels sunk to the hubs and soil heaped around all six.
- A **narrow bright churned trench** runs out from the right-front wheel. Spirit drove backwards dragging that wheel, so the trench runs ahead of the rover.
- The rover is turned to face the camera so the trench is on the near side. Wheel tracks lead in and are now lit.
- `SpiritTroyProps` is in `MarsModels.tsx`.

## M3 · Phoenix ✅
- New `models/PhoenixLander.tsx`, true scale (the old 1.06 scale is ignored). It has:
  - a ten-sided 1.5 m deck on three legs, with propellant tanks and a foil body underneath
  - TEGA with its 8 oven doors, MECA, lidar box + MET mast, and the SSI stereo head on a ~2 m mast
  - a 2.35 m arm whose scoop sits over a soft-edged trench with exposed ice
  - dark, dusty ten-gore arrays; the right one is collapsed (ice damage), with a torn piece on the ground
  - light frost in the lander's shadow
- The black/white rectangle trench in `MarsDioramas.tsx` is removed; the trench now lives in the model.

## M4 · Pathfinder ✅
- Rocks: own flat-faceted angular basalt geometry, dark with dust only on the flattest tops.
  **Bug found:** the rock haze shader measured distance from a stale anchor (−8.35, −371), so *every* rock was hazed to beige. It now uses the real Pathfinder anchor.
- Airbags are flatter, lower and duller (collapsed fabric, PIA00614).

## M7 · Materials (partial)
Done:
- Lunar foil environment for all LM/LRV metals.
- Mars GLBs (Spirit, Opportunity, InSight, Viking): solar arrays get a heavier dust film and much less metalness, so they are no longer mirror-blue.
- New PBR materials on the Phoenix, Pathfinder rocks and LRV.

Not done:
- normal-mapped edge wear
- dust accumulation on the Viking body (still bright white)
- Ingenuity's chrome-looking fuselage

## Checks
- `npx tsc --noEmit && npx eslint app components lib content && npm run build`: clean.
- Full-journey wheel scroll (160 steps) with `pageerror` and console listeners: **no errors**.
- FPS in headless Chrome at the poster rest shots (this environment caps everything at ~34–40 fps): changed exhibits run the same as unchanged references.

  | Exhibit | Status | fps |
  |---|---|---|
  | Apollo 11 | changed | 35 |
  | Apollo 17 | changed | 34 |
  | LRV (Apollo 15) | changed | 34 |
  | Phoenix | changed | 40 |
  | Spirit | changed | 40 |
  | Pathfinder | changed | 40 |
  | InSight | changed | 38 |
  | Surveyor 3 | unchanged reference | 36 |
  | Opportunity | unchanged reference | 39 |

  So there is no measurable regression. The ≥ 55 fps target on M1 needs a real-device check.
- No geometry is created in `useFrame`. All new geometries and materials are disposed on unmount; shared canvas textures are cached at module level. On the low tier the LRV uses fewer segments.

## Files touched
- **New:**
  - `components/journey/three/models/{foilTextures.ts, ApolloLmDescentStage.tsx, LunarRover.tsx, PhoenixLander.tsx}`
- **Changed:**
  - `ExhibitStage3D.tsx` (LM routing; Mars array dust)
  - `MoonModels.tsx`, `MarsModels.tsx`, `PathfinderLandscape.tsx`
  - `trajectory.ts` (BEAT_POSES 19 and 20 only)
- **Minimal edits outside my list** (placement only):
  - `MoonDioramas.tsx`: A17 rover position, removed the cap usage
  - `MarsDioramas.tsx`: Spirit group, Troy flag off, Phoenix trench removed
- Exhibit anchors, `openExhibit` click handling and the `minB`/`maxB` visibility windows are unchanged.
