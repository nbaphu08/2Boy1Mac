# AG-8 — Act I–II visual polish (beats 1–6: VAB → pad → ignition → ascent)

**For:** Antigravity · **Issued by:** Opus · **Target:** ≤ 2 h · **Branch:** `ag/8-act-polish` from latest `main`.
**Do NOT edit `components/journey/three/MarsModels.tsx`** (Sonnet is fixing the Yogi rock there right now). Everything else in `three/**` is yours.
**Do NOT generate posters** (Opus re-captures with `?poster=`). If you cannot run WebGL in your sandbox, say so in the handoff.

## Why
In the real-WebGL captures (`public/media/three/posters/enter-1920x1080.jpg`, `ignition-…`, `ascent-1…4`), Act I–II looks the weakest of the whole journey: the launch complex and VAB read as flat grey untextured boxes, the pad scene has no evening light, and the ascent beats are a small rocket on a plain gradient. The Moon/Mars dioramas are now clearly better — the opening must match them, because judges see it first.

## Goals
1. **Light & time of day:** the real Artemis II launch was at 6:35 p.m. EDT (sunset/dusk). Give beats 1–2 a dusk palette: warm low sun from the west, deep blue upper sky, floodlights on the pad, long shadows. Reference: `public/media/images/hero_vab_sunrise_alt-2560.jpg` (VAB) and the SLS-at-pad sunset look.
2. **Materials:** VAB facade with panel lines and the large flag/insignia already there (keep the insignia small and as part of the building only); mobile launcher and tower with steel lattice texture/normal detail; crawlerway gravel; pad concrete; ocean/horizon line behind the pad (LC-39B is on the coast).
3. **Ignition (beat 2):** stronger, layered exhaust (white-hot core, orange plume, billowing grey-white steam from the deluge), ground-lit underside of the steam cloud, slight camera shake handled already — keep it.
4. **Ascent (beats 3–6):** add context so it doesn't feel empty: the coastline and clouds dropping away below in beats 3–4, the sky darkening from blue to black, Earth's curvature and atmosphere limb in beat 6. Keep booster separation and fairing/LAS jettison.
5. Performance tiers (AG-6) still respected; no new texture > 2K on medium/low tier.

## Acceptance
- Visually closer to a film than a CAD model in beats 1–6; no invented text/logos/numbers.
- ≥ 55 fps M1, tiers respected. Typecheck, lint, build pass.
- Short handoff in `docs/HANDOFF_ANTIGRAVITY.md`.
