# AG-3a — New procedural models: Surveyor 3, Lunar Roving Vehicle, GRAIL twins

**For:** Antigravity · **Issued by:** Opus · **Start:** right after AG-1 (or in parallel if you can) · **Deadline:** Sat 14/11 20:00
**Branch:** `ag/3a-moon-models` from `main` (or continue on `ag/1-hall-i` if AG-1 is not merged yet — say which in the handoff).

## Read
`docs/antigravity/REF_MOON.md` (exact dimensions per model), reference photos in `public/media/thennow/` (`SM-L-002_*`, `SM-L-003_*`, `SM-L-005_*`), your `components/journey/three/ExhibitStage3D.tsx`.

## You may edit
`components/journey/three/**`, `public/media/three/**`.

## Build
Three procedural Three.js/R3F models (or GLB exported to `public/media/three/models/` with Meshopt), each **≤ 30k triangles**, real-world scale in meters:
1. **Surveyor 3** — tripod frame, mast + solar panel + planar antenna on top, 3 legs with crushable footpads (~4.3 m from center), 2 omni antennas on booms, camera mount **without camera head** and sampler arm **without scoop** (removed by Apollo 12), white thermal finish, slight dust tint.
2. **Lunar Roving Vehicle** — 3.1 m frame, 2.3 m wheelbase, 1.14 m height, 4 wire-mesh wheels (81.8 cm) with chevrons, dust guards, 2 folding seats, T-handle controller, front mast with mesh dish antenna + TV camera. Reused for Apollo 15 and Apollo 17.
3. **GRAIL spacecraft** — box bus 1.09 × 0.95 × 0.76 m with solar wings per the artist concept `PIA13965`; rendered as translucent "ghost" holograms (two instances, Ebb and Flow) above the impact craters.
Replace the lightbox for SM-L-002, SM-L-003, SM-L-005 with these models in the exhibit stage.

## Acceptance
- Silhouettes recognizable side-by-side with the reference photos (save comparison screenshots `docs/antigravity/shots/AG-3a-<model>.png`).
- No invented markings/text. Performance as AG-1.
- Typecheck, lint, build pass.

## Handoff
Short section in `docs/HANDOFF_ANTIGRAVITY.md`: models, triangle counts, file paths, screenshots, issues.
