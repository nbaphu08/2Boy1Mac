# AG-3b — New procedural models: Mars Pathfinder lander + Sojourner, Phoenix

**For:** Antigravity · **Issued by:** Opus · **Window:** with AG-2 (Sat evening)
**Branch:** `ag/3b-mars-models` (or inside `ag/2-hall-ii`; say which in the handoff).

## Read
`docs/antigravity/REF_MARS.md` (SM-M-002, SM-M-005), photos `public/media/thennow/SM-M-002_*`, `SM-M-005_*`.

## Build (each ≤ 30k triangles, meters)
1. **Mars Pathfinder lander** — opened tetrahedron (3 petals + base, 2.75 m across opened), solar cells on petals, mast camera ~1.5 m high, **deflated airbag lobes** bunched at the petal edges, one ramp to the ground.
2. **Sojourner** — 65 × 48 × 30 cm, 6 wheels rocker-bogie, flat solar panel on top, whip antenna.
3. **Phoenix** — 1.5 m deck on 3 legs, two round decagonal solar arrays (5.52 m span) with **one array cracked/collapsed**, 2.35 m robotic arm with scoop resting over a trench, mast camera, small meteorology mast.
Replace the lightboxes for SM-M-002 and SM-M-005.

## Acceptance
Silhouettes match the reference photos (save comparisons `docs/antigravity/shots/AG-3b-<model>.png`); no invented markings; perf/typecheck/lint/build as AG-2.

## Handoff
Short section in `docs/HANDOFF_ANTIGRAVITY.md`.
