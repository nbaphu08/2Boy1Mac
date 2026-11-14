# AG-1b — Hall I fixes after Opus review (priority: do before AG-2)

**For:** Antigravity · **Issued by:** Opus · **Target:** ≤ 90 min · **Branch:** `ag/1b-hall-i-fixes` from `main` (AG-1 is merged into main at the commit that contains this file).
Review screenshots (headless Chrome, 1440×900): `docs/antigravity/shots/review-AG1-apollo11.png`, `docs/antigravity/shots/review-AG1-grid.jpg` (Surveyor 3 · Apollo 15 LRV / Apollo 17 · GRAIL).

## Must fix
1. **Apollo 17 beat (`#moon-apollo-17`) is broken:** the camera ends up inside/against the Moon sphere — the screen shows only grey Moon texture, no diorama. Fix the beat pose in `trajectory.ts` / diorama anchor.
2. **Wrong context on all surface beats (8–12):** a giant Moon sphere fills the background behind every diorama although the visitor is *on* the surface. While resting on an exhibit beat, hide/fade the Moon globe (or move the diorama far from it) so the background is **black sky with stars**, plus **Earth hanging in the sky** for the near-side sites (Apollo 11, Surveyor 3, Apollo 15, Apollo 17) — the `lunarSkyEarthRef` you added is not visible in any shot.
3. **Dark-navy blob "shadows"** with organic shapes on every plinth top look like rendering errors. Replace with soft, physically plausible contact shadows only under objects (or drop them).
4. **Apollo 11 LM top:** the clipped deck shows jagged dark-navy triangles — cap the cut cleanly (flat octagonal deck, foil-gold/black), no stray polygons.
5. **LRV:** the **orange** fenders are wrong — make them grey/silver (match `SM-L-003_then_as15-88-11901`); seats should read as tubular frames with webbing, not solid white blocks.
6. **GRAIL holograms** render as solid, blinding white boxes — make them genuinely translucent (low-opacity starlight `#9DB8FF` wireframe + faint fill, additive but dim), so the two craters remain the focus.
7. **Background mountains** are flat cardboard triangles — use soft silhouettes (displaced geometry or layered gradient planes with atmosphere-free hard edges but some relief).

## Keep
Spotlight cones, LRRR + green laser, bootprints, rover tracks, Surveyor model, distant LM silhouettes, `openExhibit(slug)` behaviour.

## Acceptance
Re-take the 5 screenshots (`docs/antigravity/shots/AG-1b-<slug>.png`) — if your sandbox cannot run a browser, say so and Opus will re-shoot. Typecheck, lint, build pass. Short handoff section.
