# Day 2 plan — Sun 15/11 (submit by 20:00)

Audit shots (real WebGL, 1600×900, current main): `docs/review/audit-moon-earth.jpg` (enter, ignition, 5 Moon exhibits), `docs/review/audit-mars.jpg` (7 Mars exhibits).

## Roles today
| Who | Owns (files) | Work |
|---|---|---|
| **Opus 5.5 (high) — "3D model" agent** | `components/journey/three/MoonModels.tsx`, `MarsModels.tsx`, `PathfinderLandscape.tsx` (models only), `ExhibitStage3D.tsx` (per-exhibit framing/scale), `public/media/models/**` | Model fidelity pass M1–M7 below |
| **Antigravity** | `LaunchComplex.tsx`, `CelestialWorlds.tsx`, `SpaceScene.tsx`, `SLSRocket.tsx`, `RenderPipeline.tsx`, `landscapeMaterials.tsx`, `public/media/three/**` | Earth background E1–E6 below (packet AG-16) |
| **Opus (me)** | `docs/**`, `content/**`, reviews, merges, posters, deploys | Review each hand-off with real captures, re-capture posters, demo video, submission |
| **Sonnet** | `app/**`, `components/journey/Stage.tsx`, `BeatOverlays.tsx`, `components/museum/**`, `lib/**` | Only bug fixes found in review; final QA pass |
Nobody edits another agent's files. Each agent works on its own branch (`opus/models-*`, `ag/16-*`) and hands off; I merge.

## Model audit — what a stronger 3D pass can improve (priority order)
| # | Exhibit | Source today | Problem in the audit | Improvement |
|---|---|---|---|---|
| **M1** | Apollo 11 + Apollo 17 LM descent stage | hand-built | Blocky boxes, flat saturated yellow panel, no octagonal body, no crinkled gold/black Kapton, legs too thin, descent engine bell too big | **Use the real NASA LM model** we already have (`public/media/models/SM-L-001_apollo_lunar_module.web.glb`, NASA 3D Resources) **clipped to the descent stage** (MANIFEST: cut at y ≈ 2.3–2.6), proper foil materials, ladder on the front leg, plaque on that leg, LRRR + ALSEP left beside it (Apollo 11) |
| **M2** | Apollo 15 LRV (+ the LRV at Apollo 17) | hand-built | Looks like a toy: thick tube fenders, solid rubber tyres, plain slab chassis | Wire-mesh wheels with chevron treads, thin grey fenders, folding seats with webbing, console, high-gain umbrella antenna on a mast, TV camera, tool pallet at the back (ref `as15-88-11901`) |
| **M3** | Phoenix | hand-built | Deck reads as a bright orange drum; arrays OK | Decagonal deck with instruments (MECA, TEGA, SSI mast), real dark arrays, robotic arm with scoop, frost hints (ref `PIA11719`) |
| **M4** | Pathfinder + Sojourner | hand-built | Rocks are low-poly beige blobs; airbags still puffy-white; small in frame | Darker, angular, dust-coated rocks; collapsed fabric airbags; closer framing (ref `PIA00614`) |
| **M5** | InSight, Ingenuity, Viking 1 | NASA GLBs | Models are fine but **too small in the frame** (InSight/Ingenuity are specks) | Re-frame: subject ≈ 35–50 % of frame height; InSight with its dome instruments (SEIS, HP³) on the ground; Ingenuity with the broken rotor blade nearby (it lost a blade on flight 72) |
| **M6** | Spirit | NASA GLB | A bright white disc under the rover looks like a rendering error | Make the "bright soil" a narrow churned trench behind a wheel, wheels sunk to the hubs (ref `REF_MARS.md`) |
| **M7** | All models | — | Plastic-looking | PBR pass: roughness/metalness variation, foil normal maps, edge wear, contact AO, dust accumulation on top faces (Mars) |
Surveyor 3 (rebuilt in AG-15) and GRAIL (AG-14) are acceptable; touch only for materials.

## Earth background — packet AG-16 for Antigravity (beats 1–2, VAB & SLS on the pad before launch)
- **E1 Sky:** physically-based dusk sky (sun just above the western horizon, 6:35 p.m. EDT), soft cloud layer with sunlit edges, no flat gradient.
- **E2 Ocean & coast:** Atlantic with a real water shader (normals, sun glint, distant haze), beach line; KSC wetlands — marsh grass / scrub instancing around the crawlerway and pad.
- **E3 Pad:** flame trench, sound-suppression water tower (real silhouette, not a chrome ball), lightning-protection towers with catenary wires, the mobile launcher's umbilical arms and textures.
- **E4 VAB & distance:** VAB at its true distance (~5 km) in atmospheric haze, the crawlerway leading to it, a few distant buildings.
- **E5 Light & atmosphere:** warm low key light + cool sky fill, floodlights as soft volumetric glows (not hard cones), aerial perspective fog.
- **E6 Ignition:** replace the bokeh-ball "steam" with billowing volumetric-looking steam clouds lit orange from below.
References: `public/media/images/hero_vab_sunrise_alt-2560.jpg` (real VAB) + NASA Artemis II pad photos (search images.nasa.gov "Artemis II launch pad 39B").

## Timeline (Sun 15/11)
| Time | Opus 5.5 model agent | Antigravity | Me |
|---|---|---|---|
| 08:00–11:00 | M1, M2 (Moon) | AG-16 E1–E3 | Review captures as they land; demo video script final |
| 11:00 | hand-off 1 | hand-off 1 | merge + deploy preview |
| 11:00–14:00 | M3–M6 (Mars), M7 | AG-16 E4–E6 | review + merge |
| **15:00** | **3D freeze** | **3D freeze** | full regression (jank script, console, mobile) |
| 15:00–17:00 | — | — | re-capture all posters, record 30 s demo video, `docs/SUBMISSION.md` |
| 17:00–19:00 | — | — | humans: real-device test, promote to production, submit |
| 20:00 | **Submission deadline buffer** | | |
Rule: anything not merged and verified by 15:00 is dropped — the current preview is the fallback and already works.
