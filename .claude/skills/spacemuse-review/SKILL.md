---
name: spacemuse-review
description: Milestone review checklist for SpaceMuse (Definition of Done, poster-frame test, performance and accessibility gates). Use at the end of each milestone (M0–M4), before telling the humans a milestone is done, or when asked to review/QA the site.
---

# SpaceMuse milestone review

Run in this order; report each item PASS/FAIL with evidence (screenshot path, number, or command output). Append the report to `docs/PROGRESS.md`.

## 1. Build health
- `npm run build` succeeds with zero type errors; `npm run lint` clean.
- Preview deploy URL works (`vercel deploy`, not `--prod`).
- Browser console: zero errors/warnings on a full journey run.

## 2. Step engine (Fable milestones)
- One trackpad swipe = one beat (try 10 swipes, count beats). Same with mouse wheel, keyboard `↓`, iPhone swipe.
- Spam input for 5s → no desync, no blank frame, ends on a valid rest frame.
- `↑` rewinds cleanly; rail click warps; refresh with `#<beatId>` restores that beat.
- `prefers-reduced-motion` (macOS: Accessibility → Display → Reduce motion) → crossfades only.

## 3. Poster-frame test
Screenshot every beat's rest frame at 1440×900 and 390×844 (use the `run` skill or Playwright). Each must look like a finished poster: no layout shift, no half-loaded media, no overlapping text, captions legible.

## 4. Content (Sonnet milestones)
- Every exhibit: catalogue no., AgeCounter, Then/Now slider with credits, sources list with working links, `verified: true`.
- Spot-check 5 random numbers against `docs/COPY.md` — must match exactly.
- No "Lưu ý" text, no placeholder, no lorem ipsum anywhere (`grep -ri "lorem\|TODO\|Lưu ý" app components content`).

## 5. Performance & a11y
- Lighthouse (desktop) on `/`: Performance ≥ 85; on `/gallery` and `/exhibit/opportunity`: Accessibility ≥ 95.
- Hero LCP image ≤ 350 KB (use `materials/web/images/hero_vab_storm-2560.avif`, 117 KB).
- 3D bundle not loaded before beat 6 (check Network tab).
- Exhibit panel: focus trap, `Esc` closes, `←/→` navigate, visible focus ring.

## 6. Legal
Footer disclaimer present; `/about` has data credits and AI disclosure; no NASA logo used as branding.
