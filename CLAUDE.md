# SpaceMuse — Project Instructions (v4)

A continuous-scroll 3D museum website about NASA hardware left on the Moon and Mars (NASA Space Apps Challenge 2026, deadline 23:59 Sun 15 Nov; target submit 20:00). Team 2Boy1Mac.

## Read first
1. `PLAN.md` (v4) — roles §2, content fixes §3, pipeline §4, task IDs §5.
2. `GEMINI.md` §1–2 only (architecture of the 3D journey; do NOT read the verbatim source dump in §4 — read the real files instead).
3. `docs/COPY.md` (all site text + sources), `docs/EXHIBITS.md` (verified facts), `materials/MANIFEST.md` (assets).
4. Design system: `docs/archive/PLAN_v3_step-scroll-footage.md` §6 (Deep Field palette, Archivo/Inter/JetBrains Mono) — still valid.

## Roles & file ownership
- **Opus** — research, storytelling, fact-checking, reviews, merges. Owns `docs/**` and all user-visible text in `content/**` (incl. `content/journey.ts`).
- **Sonnet** — main builder (UI/UX, frontend, integration, perf, a11y, deploy). Owns `app/**`, `components/journey/Stage.tsx`, `components/journey/BeatOverlays.tsx`, `components/museum/**`, `components/ui/**`, `lib/**`.
- **Antigravity (Gemini Argon 4)** — 3D director. Owns `components/journey/three/**` and `public/media/three/**`. Works from task packets `docs/antigravity/AG-*.md`, on branch `ag/<id>`, and reports in `docs/HANDOFF_ANTIGRAVITY.md` (short summary — never paste whole source files).
- **Fable** — only when the humans explicitly ask.
- While an AG packet is open, nobody else edits `components/journey/three/**`.

## Working directories (avoid branch collisions)
- **Antigravity** works in the main folder `/Users/nguyenbaphu/2Boy1Mac` on its `ag/*` branches.
- **Opus and Sonnet** work in the separate worktree `/Users/nguyenbaphu/2Boy1Mac-main` on branch `main` (own `node_modules`, own `.vercel`). Never run `git checkout` in the other agent's folder.
- Opus merges `ag/*` branches into `main` from the worktree after review, then deploys preview from the worktree.

## Hard rules
- No invented numbers, dates or quotes. Every visible string comes from `docs/COPY.md` or `content/journey.ts` and is sourced.
- 3D reconstructions are illustrative: keep the "3D reconstructions are illustrative, based on NASA imagery and data." line in footer/About.
- No NASA logo as SpaceMuse branding (a NASA insignia may appear only as part of the real VAB building in 3D). No audio. English UI.
- Never delete/overwrite `materials/`, `docs/COPY.md`, `docs/EXHIBITS.md`.
- Deploy preview only (`vercel deploy --yes`); production is promoted by the humans.

## Stack
Next.js 16 (App Router, TS) · Tailwind v4 · Three.js via React Three Fiber + drei · GSAP ScrollTrigger (scrub) + Lenis · zustand · Vercel.
Shared scroll state: `lib/scroll/progress.ts` (`scrollState`, `scrollToBeat`). Camera keyframes: `components/journey/three/trajectory.ts`.

## Checks before every commit
`npx tsc --noEmit && npx eslint app components lib content && npm run build`

## Progress
Append to `docs/PROGRESS.md` at each phase: done / next / risks + preview URL.
