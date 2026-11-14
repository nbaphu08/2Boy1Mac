# AG-1 — Hall I dioramas (The Moon, beats 8–12)

**For:** Antigravity (Gemini Argon 4) · **Issued by:** Opus · **Deadline:** Sat 14/11 18:00
**Branch:** create `ag/1-hall-i` from `main`. Commit there. Do NOT push to main.

## Read
`CLAUDE.md`, `PLAN.md` §2 + §5, `docs/antigravity/REF_MOON.md` (mandatory — dimensions and features), your own files in `components/journey/three/**`, `content/exhibits.ts` (only `location`, `media`, `slug` fields).

## You may edit
`components/journey/three/**`, new assets in `public/media/three/**`. Nothing else. If you need a change elsewhere (Stage, overlays, content), write it in your handoff under "Requests for Sonnet".

## Goal
Make each of the 5 Hall I exhibit stops a **museum-grade diorama** under a cold spotlight, faithful to REF_MOON:
1. **Shared:** regolith ground patch with displacement + small craters/rocks; sparse slow dust motes; cold spotlight `#DCE6FF` cone + soft contact shadow; subtle camera micro-orbit while the visitor rests on a beat (respect `reducedMotion` → no orbit).
2. **SM-L-001 Apollo 11:** LM descent stage only (ascent stage clipped), ladder + plaque strut, EASEP 17 m south (simplified), **LRRR 10×10 panel** ~5 m NNW of EASEP with a faint green laser line; footprints.
3. **SM-L-002 Surveyor 3:** in a small crater; distant Apollo 12 LM silhouette on the rim (155 m). Use the AG-3a model when available — until then keep the lightbox.
4. **SM-L-003 Apollo 15 LRV:** mare plain, Mount Hadley silhouette, parked rover facing the LM direction (LM small in the distance). AG-3a model when available.
5. **SM-L-004 Apollo 17:** descent stage + rover + **visible rover tracks and footprints**; valley massifs.
6. **SM-L-005 GRAIL:** mountain slope with **two ~5 m craters with faint dark ejecta**, plus translucent "ghost" holograms of the twin spacecraft above them.

## Acceptance
- ≥ 55 fps on an M1 MacBook at 1440×900 while resting on each beat; no visible popping when scrolling quickly through beats 7–13.
- Matches REF_MOON dimensions/proportions; no invented text, logos, flags or numbers.
- Clicking/tapping an exhibit still calls `openExhibit(slug)` (keep existing behavior).
- `npx tsc --noEmit && npx eslint components/journey/three && npm run build` pass.

## Handoff
Append a short section to `docs/HANDOFF_ANTIGRAVITY.md` (≤ 60 lines): files changed, new components/APIs, perf numbers measured, screenshots saved to `docs/antigravity/shots/AG-1-*.png` (one per exhibit), remaining issues, requests for Sonnet. **Do not paste whole source files.**
