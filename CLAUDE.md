# SpaceMuse — Project Instructions

A step-scroll museum website about NASA hardware left on the Moon and Mars (NASA Space Apps Challenge 2026, 14–15 Nov). Team 2Boy1Mac. Builders: **Fable** (Cinematographer) and **Sonnet** (Curator & Architect).

## Read first (in this order)
1. `PLAN.md` — the master plan (storyboard §3, design system §6, architecture §7, data model §8, ownership §9).
2. `docs/ROLES.md` (who does what, per milestone), then your brief: `docs/BRIEF_FABLE.md` or `docs/BRIEF_SONNET.md`.
3. `materials/MANIFEST.md` — every asset is already downloaded. `materials/web/` holds **final web-ready** footage, posters and images.
4. `docs/COPY.md` — every word shown on the site, with sources. `docs/EXHIBITS.md` — verified facts.
5. `docs/SUBMISSION.md` — demo script, submission text, test checklist.

## Hard rules
- **Research is finished.** Do not search for new assets or facts. Do not invent numbers, dates or quotes. If something is missing, write it in `docs/CHANGE_REQUESTS.md` and continue.
- **Copy is fixed.** Use text from `docs/COPY.md` verbatim (typos may be fixed). Every stat shows its source.
- **Roles:** Sonnet is the **main builder** (most of the code). Fable is called only for short, scoped sessions (F1 step engine, F2 3D foundation, F3 cinematic polish, F4 emergency) — see `docs/ROLES.md`. While a Fable session runs, Sonnet does not touch the files in that session's scope; afterwards Sonnet may edit them and logs changes in `docs/HANDOFF_FABLE.md`.
- **Fable:** stay strictly inside your session scope, do not read the whole repo, and end every session by updating `docs/HANDOFF_FABLE.md`.
- **No NASA logo as UI/brand.** No AI-generated imagery. No audio. English only on the site.
- **Never** delete or overwrite anything in `materials/` or `docs/COPY.md` / `docs/EXHIBITS.md`.
- Deploy **preview** only (`vercel deploy`); production deploys are done by the humans.

## Stack
Next.js (latest stable, App Router, TypeScript) · Tailwind CSS v4 · GSAP (Observer, SplitText) · React Three Fiber + drei · zustand · Vercel.
Journey page uses the **step-scroll engine** (one input = one fixed segment) — no Lenis, no ScrollTrigger scrub there.

## Useful skills
- Project skills (if installed from `setup/claude/skills/`): `spacemuse-step-engine`, `spacemuse-media`, `spacemuse-content`, `spacemuse-review`, `spacemuse-ship`.
- Built-in/plugin skills worth using: `vercel:nextjs`, `vercel:react-best-practices`, `vercel:deploy`, `run` (launch & screenshot), `code-review`.

## Progress
At each milestone append to `docs/PROGRESS.md`: done / next / risks, plus the preview URL.
