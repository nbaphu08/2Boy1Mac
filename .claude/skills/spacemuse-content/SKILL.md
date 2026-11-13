---
name: spacemuse-content
description: Rules for entering and displaying SpaceMuse museum content (exhibits, captions, stats, sources, credits). Use whenever editing content/*.ts, exhibit panels, plaques, the Hall of Silence, the About page, or any user-visible text or number.
---

# SpaceMuse content rules

Inputs: `docs/COPY.md` (all visible text + sources S1–S70), `docs/EXHIBITS.md` (fact sheet), `materials/MANIFEST.md` (media + credits).

## Golden rules
1. **Copy text verbatim from `docs/COPY.md`.** Do not paraphrase facts, add adjectives that change meaning, or add new facts.
2. **Every stat renders with its source.** In `content/exhibits.ts` each `stats[]` item has `sourceId` → `sources[]` entry (map `[S#]` from COPY.md to `{id,title,url,publisher}`).
3. Lines marked **"Lưu ý"** in COPY.md are instructions for you, not site text. Resolve them (drop the flagged clause if you cannot confirm it from the linked source) — never display them.
4. `verified: true` only when every stat and sentence for that exhibit traces to a source in COPY.md.
5. Exact display rules for conflicting sources (⚠️ in EXHIBITS.md): Viking 1 last contact = `Nov 1982`; Phoenix last signal = `2 Nov 2008`; NEAR = year only; Surveyor 3 = `20 Apr 1967`.
6. Never present "My battery is low and it's getting dark" as Opportunity's words. The 7,119 kg Mars figure is always labelled an independent estimate (Cagri Kilic, WVU, 2022), never NASA's.
7. Artist's concepts (GRAIL `PIA13965`) must carry the label **"Artist's concept"**.
8. Credits under every image, exactly as in COPY.md/MANIFEST.md (e.g. `NASA/GSFC/Arizona State University`, `NASA/JPL-Caltech/University of Arizona`).

## AgeCounter
- Input: `dates.landing` ISO date (UTC). Output `Xy Ym Zd` computed on the client, updated daily (no need for seconds).
- For SM-L-005 GRAIL use "Impact" date and label `SINCE IMPACT`; for Apollo exhibits label `ON THE MOON FOR`; Mars `ON MARS FOR`.
- Render on client only (avoid hydration mismatch): show a skeleton during SSR.

## Catalogue ordering
Hall I: SM-L-001 Apollo 11 → 002 Surveyor 3 → 003 Apollo 15 LRV → 004 Apollo 17 → 005 GRAIL.
Hall II: SM-M-001 Viking 1 → 002 Pathfinder → 003 Spirit → 004 Opportunity → 005 Phoenix → 006 InSight → 007 Ingenuity.
Teaser: SM-B-001…004 in `content/teaser.ts` (name, year, line, status, model path).

## Voice
English (US spelling), museum-calm, short sentences, plaque ≤ 60 words, metric first with imperial in parentheses.
