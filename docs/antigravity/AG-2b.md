# AG-2b — Fixes after Opus review of AG-1b + AG-2 (do first, ≤ 60 min, then AG-4)

**Branch:** `ag/2b-fixes` from latest `main`. Review shots: `docs/antigravity/shots/review-AG1b-moon.jpg`, `review-AG2-mars.jpg`.

## Must fix
1. **Ascent stage still visible on Apollo 11 and Apollo 17** (large white blocky mass on top of the gold descent stage). Historically only the descent stage remains — the plaque text says "its lower half stayed behind". Hide every ascent-stage mesh (check by bounding box in world space after load, not only `child.position.y`), keep the flat `ClippedLmTopCap`.
2. **Mars daytime sky:** beats 14–20 currently show a black starry sky. Use the REF_MARS look: butterscotch/tan sky gradient filling the background while resting on a Mars surface beat (stars hidden); keep the museum spotlight cone subtle so it reads as "museum light in Martian daylight".
3. **Framing / scale:** InSight (6 m span) looks smaller than its seismometer dome — check model scale vs REF (deck 1.56 m, 6 m with arrays; dome much smaller than the lander). Ingenuity (0.49 m) and Viking 1 are too small in frame — move the camera closer per exhibit so each machine fills ~35–45% of the frame height like the Moon exhibits.
4. **Pathfinder "Yogi" rock** is a smooth brown sphere — make it an irregular boulder (displaced icosahedron) roughly 1 m tall next to Sojourner.

## Acceptance
Opus will re-shoot all 12 exhibit beats. Typecheck, lint, build pass. Short handoff.
