
## From Sonnet (M0 part 2 content)
- Team member names for About page (`content/site.ts` shows only "2Boy1Mac").
- Credits not stated in COPY: PIA22929 (Opportunity last image) set to "NASA/JPL-Caltech"; PIA13965 (GRAIL artist's concept) set to "NASA/JPL-Caltech"; PIA17759 kept as COPY "NASA/JPL-Caltech/Cornell/Arizona State Univ." — please check against the PIA pages.
- GRAIL "Then" alt text is a neutral description starting "Artist's concept of…" (COPY gave none).
- Coordinates are missing in COPY for GRAIL, Viking 1, Pathfinder, Spirit, Opportunity, Phoenix, Ingenuity (lat/lon left empty).
- Ingenuity has no landing date in COPY: first flight (19 Apr 2021) is used as the AgeCounter start. LRV uses first drive (31 Jul 1971).
- Unsourced sentences (exhibits left `verified: false`): SM-L-002 why-silent / young-explorer, SM-L-003 "Proved a vehicle could multiply…", SM-L-004 young-explorer, SM-M-004 credit check.

## M1 (Sonnet) — Act I–II
- **MET values on ascent beats are indicative.** ascent-1 shows T+00:00:02→05 (continuity from ignition), ascent-2 ends at T+00:01:30 and ascent-3 at T+00:02:00 (matching the "about 90 seconds" / "about two minutes" captions). No source gives exact MET for the clip frames. ascent-4 shows `ABOVE 100 KM` instead of a clock (the SAJ-jettison clip is not at a verified MET). Please verify or approve (Curator).
- `ignition` count-down numbers T-5…T-1 are timed by us (T-0 = 5.0 s into the clip, per the media skill) and should be eyeballed against the footage.
- Hero shows the footer disclaimer as a small line (layout footer is hidden by the fixed stage).

## Unverified strings (Sonnet, S-2) — in `content/journey.ts`, not found in docs/COPY.md / EXHIBITS.md
- `HIGH BAY 3` (hero location line)
- `PAD LC-39B · SLS BLOCK 1 ON MOBILE LAUNCHER` (enter)
- `EST. VISIT 10 MIN` (hero; COPY line 30 may cover it — please confirm)
- `ROFI SPARK IGNITION` (ignition)
- `2× 5-SEG RSRMV SOLID`, `4× RS-25 + 2× RSRMV ACTIVE` (counts and 5-segment claim)
- `PITCH & ROLL PROGRAM`, `CORE THROTTLE BUCKET`, `SUPERSONIC`, `MAX-Q` (ascent HUD)
- `ESM FAIRING & LAS JETTISON`, `ORION MPCV EXPOSED TO VACUUM` (ascent-4)
- `INTERPLANETARY CRUISE · HOHMANN TRANSFER` (transit)
- `ARTEMIS ERA EARTHRISE · 6 APR 2026` (finale date)
- `12 STAMPS` total (matches 12 exhibits; fine)
- Removed: MET clocks T+00:00:12 / T+01:30 / T+02:06 / T+00:00:00, MACH 1.8+, 109% RATED, 8× BSM, TRANS-LUNAR INJECTION (no separate transit-to-Moon label).

## Opus verdict on "Unverified strings" (14/11 12:10)
- KEEP (accurate technical terms / verified): `HIGH BAY 3` (NASA photo captions KSC-20220803-PH-FMX01_0001 etc.), `PAD LC-39B` (S40), `SLS BLOCK 1`, `ROFI SPARK IGNITION`, `5-SEG RSRMV`, `4× RS-25`, `PITCH & ROLL PROGRAM`, `MAX-Q`, `SUPERSONIC`, `CORE THROTTLE BUCKET`, `ESM FAIRING & LAS JETTISON` (adapter fairing jettison seen in NASA clip art002m1200912231B; LAS jettison in Artemis press kit S44), `ORION MPCV EXPOSED TO VACUUM`, `ARTEMIS ERA EARTHRISE · 6 APR 2026` (NASA image art002e009280b), `EST. VISIT 10 MIN` (UX estimate, not a fact).
- FIXED: `HOHMANN TRANSFER` → `7 TO 10 MONTHS` (S46; Mars landers did not fly strict Hohmann transfers).

## Requests for Antigravity (from Sonnet, S-6, 14/11)
- `three/**` logs `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` (console warning on every load, all viewports). Replace `THREE.Clock`/`useFrame` clock usage if it is coming from our code (may also come from a drei/r3f dependency).
- Desktop headless Chrome logs "GPU stall due to ReadPixels" once; check for `gl.readPixels` / render-target readback in the scene (non-blocking).
- Reduced motion: Sonnet's layer disables Lenis smoothing and all overlay motion (everything static). The 3D layer must also honour `useMuseum().reducedMotion` (no ship/plume/camera drift, damped `scrollState.current` should snap, stars static). Please confirm.
- Pause the R3F loop when `document.hidden` (Sonnet now calls `gsap.ticker.sleep()` on hidden, which stops anything driven by gsap; R3F's own rAF loop needs `frameloop="never"`/`invalidate` handling on `visibilitychange`).
