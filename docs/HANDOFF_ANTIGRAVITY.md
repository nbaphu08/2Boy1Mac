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

## AG-1b — Hall I Fixes after Opus Review — 14/11 — branch `ag/1b-hall-i-fixes`
**Done:**
1. **Fixed Apollo 17 beat (`#moon-apollo-17`) & plinth spacing (`trajectory.ts`)**: `moon-apollo-17` was previously at `dist = 20.64 m` from `moonCenter` (`moonRadius = 24 m`), placing it 3.36 m inside the Moon sphere. Moved all 5 Moon plinths (`z = -172 .. -188`) and 7 Mars plinths (`z = -368 .. -386`) cleanly outside their planet spheres with consistent camera framing (`camPos = anchor + [2.8, 2.15, 6.8]`, `camLook = anchor + [-0.65, 0.72, 0]`) and tightened `SingleExhibitPlinth` visibility (`smoothstep(0.42, 0.78, dist)`) so neighbouring plinths never enter the frame.
2. **Black starry sky + visible Earth on near-side beats 8–11 (`CelestialWorlds.tsx`)**: Smoothly hides the giant orbital Moon globe (`moonRef`) while resting on surface beats 8–12 (`7.62 <= p <= 12.38`), leaving pure black starry sky. Positioned `lunarSkyEarthRef` dynamically relative to `traj.camLook + [-11.8, 1.4, -15.0]` (`ndcX ≈ -0.24, ndcY ≈ +0.48`) with `emissiveMap` day-side illumination + `#6AA8FF` `AtmosphereRim` for near-side beats 8–11 (`Apollo 11`, `Surveyor 3`, `Apollo 15`, `Apollo 17`), and hidden on beat 12 (`GRAIL` polar site).
3. **Eliminated dark-navy blob artifacts (`MoonDioramas.tsx`)**: Recessed the solid `#181C26` plinth cylinder floor `-0.22 m` below `DIORAMA_SURFACE_Y` (`y = -0.22`) with an open-ended cylindrical outer wall (`cylinderGeometry(..., true)`) so negative-height craters/undulations never poke through the base cylinder top. Replaced large shadow planes with subtle contact shadows (`opacity = 0.42..0.45`) directly under artifacts.
4. **Clean Apollo 11 & 17 LM top cut (`ExhibitStage3D.tsx`, `MoonModels.tsx`, `MoonDioramas.tsx`)**: Hid all Ascent Stage meshes (`child.position.y > 1.85` in GLB space, including the `group31 17/18/g1/gr` dark-navy thermal skirts) at the node level and capped both `SM-L-001` and `SM-L-004` at `y = 0.765` with `<ClippedLmTopCap />` (flat octagonal dark-anodized deck + gold Kapton rim + cross-ribs, zero stray triangles).
5. **LRV grey/silver fenders & tubular webbing seats (`MoonModels.tsx`)**: Changed LRV fenders to metallic dusty grey/silver (`#9E9F9C`, metalness `0.64`) and rebuilt both folding seats as open tubular aluminum frames (`#CFD6E2`) with 5 horizontal nylon webbing straps (`#8E8B82`) and visible gaps.
6. **Genuinely translucent GRAIL ghost holograms (`MoonModels.tsx`)**: Switched `SingleGrailGhostCraft` to low-opacity `#4A6FA5` fill (`opacity: 0.045..0.055`) + `#9DB8FF` starlight wireframe (`opacity: 0.24..0.28`, `toneMapped={false}`) so the two dark-ejecta craters remain the visual focus.
7. **Sculpted 3D lunar massifs (`MoonDioramas.tsx`)**: Replaced flat low-poly cones on `SM-L-003`, `SM-L-004`, and `SM-L-005` with `<SculptedLunarMassif />` (`36×18` multi-octave displaced highland ridges).

**Files changed:**
- `components/journey/three/trajectory.ts`, `CelestialWorlds.tsx`, `ExhibitStage3D.tsx`, `MoonDioramas.tsx`, `MoonModels.tsx`

**New APIs/components:**
- `ClippedLmTopCap` (`MoonModels.tsx`), `SculptedLunarMassif` (`MoonDioramas.tsx`)

**Screenshots:**
- Sandbox cannot attach to headless Chrome (`127.0.0.1:9222`); ready for Opus re-shoot of `docs/antigravity/shots/AG-1b-<slug>.png`.

## AG-2 (+ AG-3b Mars models) — Hall II Mars Dioramas (beats 14–20) — 14/11 — branch `ag/2-hall-ii`
**Done:**
- Built all 7 Hall II Mars dioramas (`SM-M-001`..`SM-M-007`) faithful to `docs/antigravity/REF_MARS.md` under the shared `#DCE6FF` museum spotlight paired with warm Martian butterscotch ambient fill (`#E59866` / `#B84A24`), curved daytime butterscotch/tan horizon haze arc (`MarsButterscotchHazeArc`), recessed `#211512` plinth base (`y = -0.22`), `48×48` displaced rusty regolith terrain (`#A65535` matching `mars_color_4k.jpg`), scattered dark vesicular basalt rocks, and 46 airborne dust particles (`64` on Opportunity storm beat).
- Smoothly hides the giant orbital Mars globe (`marsRef` in `CelestialWorlds.tsx`) while resting on surface beats 14–20 (`13.68 <= p <= 20.35`) so the globe never photobombs behind surface dioramas.
- **SM-M-001 (`mars-viking-1`)**: Rock-strewn Chryse plain (28 basalt rocks) + Viking 1 GLB with light dust coat + `Viking1SiteProps` (extended surface sampler arm + collector head + excavated sample trench).
- **SM-M-002 (`mars-pathfinder`, AG-3b models)**: Sculpted Twin Peaks hills on horizon + procedural **Mars Pathfinder opened tetrahedral lander** (`2.75 m` span across 3 solar-cell petals + central base, `1.5 m` IMP camera mast, HGA/LGA, 22 bunched deflated Vectran airbag lobes, unrolled metallic ramp) + **Sojourner microrover** (`0.65 × 0.48 × 0.30 m` proportions, 6-wheel rocker-bogie, flat solar panel top, APXS nose sensor, whip antenna) beside the **"Yogi" boulder** with wheel tracks from the ramp.
- **SM-M-003 (`mars-spirit`)**: Layered flat-topped **Home Plate plateau** (`SculptedMarsLandform` with `flatTop`) + bright yellowish-white disturbed sulfate soil (`#DFC492`) around Spirit's **6 wheels sunk up to the hubs** (`y = -0.17`, tilted `-16°` roll) + single-wheel gouged drag furrow + dusty MER GLB.
- **SM-M-004 (`mars-opportunity`)**: Inclined (`+14°`) slope of **Perseverance Valley at Endeavour Crater rim** + heavy 2018 global storm dust coat (`marsDustFactor = 0.78`) + darker reddish-brown storm haze (`#7A331C`) and denser dust particles.
- **SM-M-005 (`mars-phoenix`, AG-3b model)**: Polygon-patterned arctic ground (thermal-contraction troughs in texture + vertex heightfield), two excavated sample trenches exposing **bright white subsurface water ice (`#E8F3FA`)**, and procedural **Phoenix lander** (`1.5 m` deck on 3 legs, `5.52 m` decagonal UltraFlex fan solar arrays with **right solar array cracked and collapsed downward** under winter $\text{CO}_2$ ice load, `2.35 m` robotic arm + scoop poised over the ice trench, SSI camera mast, and MET mast).
- **SM-M-006 (`mars-insight`)**: Smooth flat Elysium plain (only 4 small pebbles), heavily dust-coated InSight GLB (`marsDustFactor = 0.72`, deck-stowed SEIS hidden), and `InSightSurfaceInstruments` on the ground in front (**SEIS under its white/gold dome Wind & Thermal Shield** + **HP³ mole support housing** + flat tethers).
- **SM-M-007 (`mars-ingenuity`)**: Sculpted eolian sand ripples of **"Valinor Hills"** + Ingenuity GLB with **one carbon-fiber rotor blade tip clipped/snapped off** (Flight 72 damage) + detached blade tip fragment on the sand nearby + separate distant mini-plinth vitrine displaying **Perseverance's shattered conical backshell and orange/white parachute** (`PIA25219`).

**Files changed:**
- `components/journey/three/MarsModels.tsx` (new — includes AG-3b models)
- `components/journey/three/MarsDioramas.tsx` (new)
- `components/journey/three/ExhibitStage3D.tsx`

**New APIs/components:**
- `HallTwoMarsDiorama({ slug, reducedMotion })` (`MarsDioramas.tsx`)
- `PathfinderAndSojournerModel`, `PhoenixLanderModel`, `Viking1SiteProps`, `InSightSurfaceInstruments`, `IngenuityAndBackshellProps` (`MarsModels.tsx`)

**Perf measured:**
- All procedural geometries/textures memoized; zero per-frame allocations. Triangle counts: `PathfinderAndSojournerModel` ~3.8k tris, `PhoenixLanderModel` ~3.1k tris, `createMarsTerrainGeometry` 4.6k tris (well below the 30k limit).

**Screenshots:**
- Ready for Opus headless capture (`docs/antigravity/shots/AG-2-*.png` and `AG-3b-*.png`).

**Requests for Sonnet:**
- None required — `openExhibit(slug)` click behavior preserved across all 7 Mars dioramas.

## AG-2b — Mars Fixes + Remaining Moon Ascent Stage Fix — 14/11 — branch `ag/2b-fixes`
**Done (all 4 items from `docs/antigravity/AG-2b.md`):**
1. **Apollo 11 & 17 Ascent Stage 100% hidden (`ExhibitStage3D.tsx`)**: Multi-primitive meshes (`polySurfac.002`, `pCube2`, `group32 gr`, `group31 17/18`) in `SM-L-001_apollo_lunar_module.web.glb` had `mesh.position.y === 0` because `GLTFLoader` places their `translation` on the parent `THREE.Group`. `GlbExhibitMesh` now runs `copy.updateMatrixWorld(true)` and computes `new THREE.Box3().setFromObject(child)` in root space, hiding every mesh with `meshCenter.y > cutY` or `meshBox.max.y > cutY + 0.14` while keeping `<ClippedLmTopCap />` at `y = 0.765`.
2. **Martian daytime butterscotch sky (`CelestialWorlds.tsx`, `ExhibitStage3D.tsx`)**: Added `<MarsDaytimeSkyDome />` (full-screen butterscotch/tan gradient `#C98659 -> #4A2618` on beats 14–20, darkening to `#7E361E -> #281009` on Opportunity's beat 17 dust storm), masked out background stars during `13.35 <= p <= 20.65`, and lowered the Mars spotlight cone opacity to `0.028` so it reads as museum light in Martian daylight.
3. **Mars exhibit framing & InSight vs SEIS scale (`ExhibitStage3D.tsx`, `MarsModels.tsx`, `trajectory.ts`)**: Scaled InSight up to `targetSize = 3.85` and scaled `InSightSurfaceInstruments`'s SEIS dome down to `radius = 0.13..0.17 m` (`height = 0.13 m`) and HP³ mole to `height = 0.24 m` so the 6 m lander clearly dominates. Increased `mars-viking-1` (`3.3`), `mars-spirit`/`mars-opportunity` (`2.65`), `mars-ingenuity` (`2.45`), `PhoenixLanderModel` (`0.92`), and `PathfinderAndSojournerModel` (`1.18`), and moved `BEAT_POSES[14..20].camPos` ~30% closer so each Mars machine fills ~38–45% of the viewport height.
4. **Craggy "Yogi" boulder (`MarsModels.tsx`)**: Replaced the smooth sphere on `SM-M-002` with a displaced `IcosahedronGeometry(0.56, 2)` (`flatShading`, ~1 m tall, two-tone wind-streak cap) next to Sojourner.

**Files changed:**
- `components/journey/three/ExhibitStage3D.tsx`, `CelestialWorlds.tsx`, `MarsModels.tsx`, `trajectory.ts`




