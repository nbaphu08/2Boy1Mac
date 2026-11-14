# AG-8b — Two fixes after AG-8 review

**For:** Antigravity · **Issued by:** Opus · **Target:** ≤ 45 min · **Branch:** `ag/8b-fixes` from latest `main` (AG-8 is merged).
Review grid (real WebGL, 1920×1080): `docs/antigravity/shots/review-AG8-grid.jpg` — order: enter, ignition / ascent-1, ascent-2 / ascent-3, ascent-4 / deep-space, moon-apollo-11.
AG-8 accepted overall — dusk sky, ocean, floodlights, steam, cloud deck, Earth limb and booster/fairing separation are a big step up. Do NOT edit `MarsModels.tsx`; do NOT generate posters.

## Must fix
1. **`ascent-1` (beat 3, LIFTOFF) — regression:** the VAB appears as a large white box standing on the cloud deck in mid-frame, with the rocket rising out of / behind it, and the horizon already shows Earth curvature. At liftoff the rocket has just cleared the tower: show the pad/tower/ground below and behind, coast and ocean at a normal horizon, no cloud deck under the VAB. Hide or place the launch complex correctly (it is on the ground, ~5 km from the VAB), and fade the cloud deck/curvature in only from `ascent-2` onward.
2. **`deep-space` (beat 7) — factual, pre-existing:** the full orange SLS core stage is shown flying to the Moon. The core stage separates about 8 minutes after launch and never leaves Earth orbit; on Artemis II the **Orion crew module + European Service Module** (with its four solar-array wings) flies to the Moon. From beat 7 onward show only Orion + ESM (solar arrays deployed, ESM main engine glow), no core stage, no boosters. Keep the core stage through `ascent-4` (still burning above 100 km — correct). Also identify the small spacecraft drawn in front of the Moon in this beat: if it is not a real, named spacecraft relevant to the story, remove it.

## Acceptance
Typecheck, lint, build pass. Short handoff in `docs/HANDOFF_ANTIGRAVITY.md`. Opus re-captures `?poster=ascent-1|deep-space`.
