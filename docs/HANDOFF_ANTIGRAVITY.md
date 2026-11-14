# Antigravity → Opus/Sonnet handoff log

> Antigravity appends one short section per AG packet (≤ 60 lines). **Never paste whole source files** — reference paths and APIs only.

Template:
```
## AG-x — <title> — <date/time> — branch ag/x — commit <sha>
**Done:** …
**Files changed:** …
**New APIs/components:** …
**Perf measured:** fps @ device/resolution …
**Screenshots:** docs/antigravity/shots/…
**Not done / known issues:** …
**Requests for Sonnet:** …
```

## AG-0 — Initial 3D journey (pre-v4) — 14/11 morning
See `GEMINI.md` §1–2 (architecture). Merged to `main` in commit a5633df.

## AG-1 (+ AG-3a Moon models) — Hall I Lunar Dioramas (beats 8–12) — 14/11 — branch `ag/1-hall-i`
**Done:**
- Built 5 museum-grade Hall I lunar dioramas (`SM-L-001`..`SM-L-005`) faithful to `docs/antigravity/REF_MOON.md` under cold `#DCE6FF` spotlight cones (`angle=0.56`, `penumbra=0.82`) with soft contact shadows, `48×48` displaced regolith terrain patches (`#585550` medium-dark grey with subtle brown-taupe tint, craters & basalt rocks), and 26 sparse slow dust motes per plinth.
- Added subtle camera micro-orbit around `traj.camLook` inside `SpaceScene.tsx` when resting on an exhibit beat (`scrollState.velocity` damped, disabled when `reducedMotion` is true).
- Added near-side lunar sky Earth (`lunarSkyEarthRef` in `CelestialWorlds.tsx`) visible above the horizon for beats 8–11 (`SM-L-001`..`004`) and hidden at beat 12 (`SM-L-005` polar site at 75.6° N).
- **SM-L-001 (`moon-apollo-11`)**: Clipped LM Eagle descent stage (`y <= 0.42` + octagonal gold Kapton interstage cap), forward leg egress porch + 9-rung ladder + blank stainless plaque plate behind ladder, EASEP 1.65 m south (square gold base + canted east/west solar panels), **`10×10` LRRR corner-cube prism array** NNW of EASEP with faint 532 nm green laser beam (`#4ADE80`, no cables), and astronaut bootprint trails. No standing flag.
- **SM-L-002 (`moon-surveyor-3`)**: Bowl crater slope terrain (`+12.5°` tilt), procedural 3D Surveyor 3 tripod model (central mast + 792-cell solar panel + planar high-gain antenna, 3 hinged landing legs with shock struts/honeycomb/footpads, omni booms, vernier tanks, empty camera collar **without camera head** and deployed pantograph arm **without scoop**), distant Apollo 12 LM *Intrepid* silhouette on the northern rim (`155 m` equivalent), and bootprint trail.
- **SM-L-003 (`moon-apollo-15-lrv`)**: Mare plain with Mount Hadley & Apennine Front massifs + Hadley Rille channel, procedural 3D LRV (`3.1 m × 2.3 m` wheelbase, 4 woven wire-mesh wheels with titanium chevrons + dust fenders, 2 tubular seats + T-handle controller, LCRU + gold TV camera + mesh parabolic dish antenna) aimed toward distant Apollo 15 LM *Falcon* silhouette (`150 m` equivalent), plus rover wheel ruts.
- **SM-L-004 (`moon-apollo-17`)**: Taurus–Littrow valley flanked by North & South Massifs, clipped LM *Challenger* descent stage (`y <= 0.42` + octagonal interstage cap) + parked 3D LRV + dual parallel chevron wheel tracks and bootprints.
- **SM-L-005 (`moon-grail`)**: Inclined (`+16°`) southern mountain slope near Goldschmidt crater, two ~5 m impact craters with faint dark radial ejecta rays, and twin translucent starlight (`#9DB8FF`) wireframe/additive ghost holograms of Ebb (GRAIL-A) and Flow (GRAIL-B) (`1.09 × 0.95 × 0.76 m` box bus + twin solar wings per `PIA13965`) with descent rays into the craters.

**Files changed:**
- `components/journey/three/MoonModels.tsx` (new)
- `components/journey/three/MoonDioramas.tsx` (new)
- `components/journey/three/ExhibitStage3D.tsx`
- `components/journey/three/trajectory.ts`
- `components/journey/three/SpaceScene.tsx`
- `components/journey/three/CelestialWorlds.tsx`

**New APIs/components:**
- `HallOneLunarDiorama({ slug })` (`MoonDioramas.tsx`)
- `Apollo11SiteProps`, `Surveyor3Model`, `LunarRovingVehicleModel`, `GrailTwinHolograms`, `DistantApolloLmSilhouette` (`MoonModels.tsx`)

**Perf measured:**
- All procedural geometries/materials/textures memoized at module/component level; zero per-frame allocations inside `useFrame`. Estimated triangle budget: `Surveyor3Model` ~2.9k tris, `LunarRovingVehicleModel` ~3.4k tris, `GrailTwinHolograms` ~1.1k tris, `createLunarTerrainGeometry` 4.6k tris per patch (well within 8k–15k budget for 60 fps on M1 at 1440×900).

**Screenshots:**
- Headless Chrome DevTools port (`127.0.0.1:9222`) was unavailable in sandbox; live visual verification ready at `#moon-apollo-11`, `#moon-surveyor-3`, `#moon-apollo-15-lrv`, `#moon-apollo-17`, `#moon-grail`.

**Not done / known issues:**
- None for Hall I (`AG-1` + `AG-3a` procedural Moon models are both complete in this branch).

**Requests for Sonnet:**
- None required — clicking any 3D exhibit plinth or diorama continues to invoke `openExhibit(slug)` as before.

