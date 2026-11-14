# GEMINI.md — SpaceMuse 3D Scroll Motion Handoff & Full Source Code

> **Document Purpose**: Handoff documentation and complete verbatim source code of all changes implemented by Gemini (Antigravity) so **Claude Code** can immediately review the current state, understand the 3D Scroll Motion architecture, and plan the next pipeline stages.

---

## 1. Context & User Requirements Implemented

1. **Why We Replaced the Video Footage Backdrop**:
   - Previously, `Stage.tsx` used a wheel/touch step-locked discrete scroller (`lib/step-scroll.ts`) combined with `<video>` tags (`ActVideo` in `Backdrops.tsx`) playing NASA footage on each beat. Scrubbing/switching video clips caused noticeable frame drops, decode stalls, and scroll lag.
   - The user requested a **continuous 3D background** simulating the **SLS Block 1 + Orion** spacecraft from the launchpad at Kennedy Space Center through liftoff, ascent, booster separation, fairing jettison, Trans-Lunar Injection, Hall I (The Moon), Interplanetary Transit, Hall II (Mars), Hall III (Beyond silhouettes), and the Finale Earthrise.

2. **Required Tech Stack Applied**:
   - **React 19 + Next.js 16.4.6 + TypeScript**
   - **Three.js + React Three Fiber (`@react-three/fiber`) + `@react-three/drei`**
   - **GSAP + `ScrollTrigger`** (`scrub: true` across the 24-section `2400dvh` scroll track, plus per-beat HUD card entrance animations)
   - **Lenis (`lenis@^1.3.23`)** synchronized with `gsap.ticker` (`lagSmoothing(0)`) for silky continuous scroll damping
   - **Tailwind CSS v4**

3. **Key Visual & UX Decisions Requested by User**:
   - **VAB Sunrise Landing Page + Scroll-1 Walk-In Transition (`hero` → `enter`, `progress: 0.0 → 1.0`)**:
     - **Beat 0 (`hero`)**: Uses `/media/images/hero_vab_sunrise_alt-{1280,2560}.{avif,jpg}` (Vehicle Assembly Building at sunrise with the US Flag, NASA insignia, and Artemis banner) + `.fog-a`/`.fog-b` coastal dawn mist as the initial landing page image.
     - **Scroll 1 (`0.0 → 1.0`)**: Driven by `VabEntrancePortal` in `components/journey/Stage.tsx` in sync with `scrollState.current`, the camera dollies forward into the VAB campus corridor (`scale3d` toward the Transfer Aisle / High Bay), passes through the open High Bay doors (`/media/images/enter_vab_doors_open-{1280,2560}.{avif,jpg}`) and morning mist, and dissolves seamlessly into the live **3D Launch Complex scene** right in front of the floodlit SLS + Orion spacecraft standing on **Pad LC-39B** (`enter`, Beat 1).
     - **Camera Path Sync (`trajectory.ts`)**: `BEAT_POSES[0]` → `BEAT_POSES[1]` moves the 3D camera along the same VAB-to-Pad corridor (`[-13.5, 4.2, 27.5]` → `[-6.4, 8.6, 11.8]`) so the 2D portal dolly and 3D camera motion match in perspective and direction.
   - **No Countdown (`T-5..T-0` Removed)**:
     - Per explicit user instruction, the `T-5..T-0` countdown overlay on `ignition` was removed; `IgnitionOverlay` now highlights `MAIN ENGINE START · ROFI SPARK IGNITION` and propulsion telemetry (`4× RS-25 LH2/LOX` + `2× 5-SEG RSRMV SOLID`).
   - **High-Craft Aerospace Micro-Detailing (Earth → Ascent → Lunar Approach, Beats `0..8`)**:
     - Eliminated flat/plastic appearance using procedural high-resolution `CanvasTexture` + bump maps (`rocketTextures.ts`) and custom procedural HDR IBL environment lighting (`configureAerospaceEnvironment` in `SpaceScene.tsx`).
     - **SLS Core Stage**: Corrugated vertical stringer ribs (96 ribs), circumferential friction-stir weld seams, weathered SOFI cryogenic orange insulation foam, external `LO2` feedlines + system tunnels + 10 structural attachment brackets, intertank thrust crossbeam, `UNITED STATES` vertical stencil, station numbers (`STA 1720 INTK`, `STA 2480 LH2`), and 20 black/white photogrammetry calibration targets.
     - **4× RS-25 Engines**: Contoured graphite-epoxy nozzle bells with horizontal regenerative cooling tube ridges, glowing throat internals, and **4 pulsing supersonic Mach shock diamonds** (`shockDiamondRefs`) inside the exhaust plume.
     - **Twin 5-Segment Solid Rocket Boosters (SRBs)**: 5 factory/field splice bands with 96 bolts each, black/white roll-tracking checkerboard bands, red/orange ordnance stripes, `UNITED STATES` / `ARTEMIS II` stencils, 3 aft stiffener rings, 16 Booster Separation Motor (`BSM`) pods, and BSM separation flame jets at `ascent-3`.
     - **Orion MPCV + European Service Module (ESM) + LAS**: Tiled TPS backshell, 4 recessed quartz crew windows, forward docking ring, crinkled gold Kapton MLI foil (`getKaptonBumpMap`), 4 articulated X-wing solar arrays deploying at `deep-space`, 3 jettisoning ESM fairing panels + LAS tower jettison at `ascent-4`.
     - **3 GPU Particle Systems (`SLSRocket.tsx`)**:
       1. `padSteamRef`: 140 acoustic water deluge steam puffs billowing out of the Mobile Launcher flame trench (`0.5 ≤ progress ≤ 2.9`).
       2. `padSparksRef`: **260 ROFI (Radial Outward Firing Igniter) & SRB aluminum-slag sparks ("tia lửa")** showering downward and ricocheting off the flame deflector with gravity (`1.15 ≤ progress ≤ 3.35`).
       3. `pyroSparksRef`: 120 pyrotechnic ordnance sparks firing radially at SRB separation (`p ≈ 5.0`), fairing/LAS jettison (`p ≈ 6.0`), and Core/ICPS separation (`p ≈ 7.0`).
     - **LC-39B Launch Complex (`LaunchComplex.tsx`)**: 2-story steel Mobile Launcher Platform with flame trench & angled deflector wedge, 6 vehicle support posts, 2 Tail Service Masts, dual Crawlerway tracks, 10-bay steel lattice Umbilical Tower ML-1 with 4 corner H-columns + 40 diagonal X-braces + hammerhead crane + 4 retracting umbilical swing arms (Crew Access Arm + White Room, OSMU, ICPS, Intertank), Sound Suppression Water Tower + deluge pipe, LH2 storage sphere, 3 lightning masts with pulsing aviation beacons, 4 volumetric floodlight cones, and detailed 3D VAB complex (matching the VAB sunrise photo with US flag, blue circular insignia, and Artemis Low Bay banner).

---

## 2. File Inventory & Architecture Map

| File Path | Status | Responsibility |
| :--- | :--- | :--- |
| `package.json` | Modified | Added `"lenis": "^1.3.23"` |
| `lib/scroll/progress.ts` | Created | Zero-rerender shared scroll state (`scrollState = { target, current, velocity, maxBeat: 23 }`), `registerScroller`, `scrollToBeat`, math helpers (`clamp01`, `smoothstep`, `remapClamp`) |
| `components/journey/Stage.tsx` | Modified | Master client wrapper: initializes `Lenis` + `GSAP ScrollTrigger` (`scrub: true`), renders `<SpaceScene />`, `<VabEntrancePortal />` (VAB sunrise hero + Scroll-1 dolly transition), `<BeatSection />` track, `<TopHudBar />`, `<ProgressRail />`, `<ExhibitPanel />` |
| `components/journey/BeatOverlays.tsx` | Created | 24 scroll sections (`100dvh` each) with GSAP `ScrollTrigger` card reveal animations (`[data-hud-card]`) and HUD overlays for `hero`, `enter`, `ignition` (no countdown), `ascent-1..4`, `deep-space`, `transit`, 12 exhibits, `silence`, `beyond`, `finale` |
| `components/journey/three/trajectory.ts` | Created | `WORLD_ANCHORS`, 24 `BEAT_POSES` keyframes (`0..23`), allocation-free `CatmullRomCurve3` C1 interpolation (`sampleTrajectory`), and `EXHIBIT_PLINTH_ANCHORS` for all 12 Moon/Mars exhibits |
| `components/journey/three/rocketTextures.ts` | Created | Procedural `CanvasTexture` + bump map generators for SLS Core Stage, SRBs, Orion TPS, Fairing panels, RS-25 nozzle bells, crinkled Kapton foil, solar cells, glowing sparks, and deluge steam puffs |
| `components/journey/three/SLSRocket.tsx` | Created | Detailed procedural 3D SLS Block 1 + Orion assembly, staging kinematics (SRB, Fairing/LAS, Core separation, X-wing solar array deployment), Mach shock diamonds, Max-Q vapor cone, and 3 particle systems (ROFI sparks, deluge steam, pyro staging sparks) |
| `components/journey/three/LaunchComplex.tsx` | Created | LC-39B Mobile Launcher Platform, 10-bay lattice Umbilical Tower with 4 retracting swing arms, Water Tower, LH2 sphere, 3 lightning towers, volumetric floodlights, and 3D VAB complex with US Flag / NASA / Artemis facade details |
| `components/journey/three/CelestialWorlds.tsx` | Created | `AscentSkyDome` shader, `SpaceBackdrop` (`starfield_4k.jpg` + 1100 3D stars), 3D Earth (`earth_color_2k.jpg` + `AtmosphereRim`), TLI trajectory arc, 3D Moon (`moon_color_4k.jpg` + `moon_displacement_2k.png`), Mars transit arc, 3D Mars (`mars_color_4k.jpg`), and Finale Earthrise |
| `components/journey/three/ExhibitStage3D.tsx` | Created | Loads all 9 Meshopt-compressed `.web.glb` models via `useGLTF(url, false, true)` + 5 framed 2.5D lightboxes (`-800.jpg`), Y-axis clipping plane on Apollo LM (`SM-L-001` & `SM-L-004`), Apollo 11 `10×10` LRRR + green laser beam, and 4 Hall III silhouettes |
| `components/journey/three/SpaceScene.tsx` | Created | Persistent `<Canvas>` (`z-0`), procedural HDR PMREM environment map (`configureAerospaceEnvironment`), `SceneChoreographer` (`useFrame` damping `scrollState.current` toward `scrollState.target`), and adaptive lighting |

---

## 3. Suggested Next Pipeline Tasks for Claude Code

1. **Act III & IV Deep-Space Polish (`beats 7..23` — Moon, Transit, Mars, Silence, Beyond, Finale)**:
   - Enhance orbital approach cinematography for **Hall I (The Moon, beats 8..12)** and **Hall II (Mars, beats 14..20)**: e.g., subtle lunar regolith dust motes / Martian atmospheric dust haze around each exhibit plinth, custom per-exhibit camera orbit micro-motion, or surface coordinate target reticles projected onto the Moon/Mars spheres.
2. **Legacy Dead-Code Cleanup (Optional)**:
   - `components/journey/Backdrops.tsx` and `lib/step-scroll.ts` are no longer imported by `Stage.tsx` (replaced by `components/journey/three/*` and `components/journey/BeatOverlays.tsx`). Claude Code can decide whether to archive or remove them once the pipeline is finalized.
3. **ESLint Config Cleanup**:
   - Consider adding `.claude/**` to `globalIgnores` in `eslint.config.mjs` so `npm run lint` ignores stale `.claude/worktrees/` build artifacts.
4. **Verification Commands**:
   - Typecheck & Lint: `npx tsc --noEmit && npx eslint app components lib content`
   - Clean & Production Build: `rm -rf .next && npm run build`

---

## 4. Complete Verbatim Source Code of Changed & Created Files

### `package.json`

```json
{
  "name": "sm-scaffold",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.9",
    "@react-three/fiber": "^9.8.2",
    "gsap": "^3.15.1",
    "lenis": "^1.3.27",
    "next": "16.4.6",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "three": "^0.187.0",
    "zustand": "^5.1.0"
  },
  "devDependencies": {
    "@tailwindcss/turbopack": "4.3.3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/three": "^0.187.0",
    "eslint": "^9",
    "eslint-config-next": "16.4.6",
    "tailwindcss": "4.3.3",
    "typescript": "^5"
  }
}
```

### `app/globals.css`

```css
@import "tailwindcss";

:root {
  --void: #04060b;
  --surface: #0a0e18;
  --raised: #111726;
  --line: #1e2638;
  --text: #e8ecf4;
  --mute: #8089a0;
  --platinum: #c7cdd8;
  --starlight: #9db8ff;
  --ignite: #ff6a3d;
  --lunar: #b9bec8;
  --oxide: #c8603a;
  --spot: #dce6ff;
}

@theme inline {
  --color-void: var(--void);
  --color-surface: var(--surface);
  --color-raised: var(--raised);
  --color-line: var(--line);
  --color-text: var(--text);
  --color-mute: var(--mute);
  --color-platinum: var(--platinum);
  --color-starlight: var(--starlight);
  --color-ignite: var(--ignite);
  --color-lunar: var(--lunar);
  --color-oxide: var(--oxide);
  --color-spot: var(--spot);
  --font-display: var(--font-archivo), sans-serif;
  --font-sans: var(--font-inter), sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;
}

html,
body {
  background: var(--void);
  color: var(--text);
}

body {
  font-family: var(--font-sans);
  font-size: 17px;
  line-height: 1.6;
}

.font-display {
  font-family: var(--font-display);
  font-variation-settings: "wdth" 125;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.font-hud {
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.text-shadow-display {
  text-shadow:
    0 2px 6px rgba(4, 6, 11, 0.96),
    0 8px 24px rgba(4, 6, 11, 0.9),
    0 18px 48px rgba(4, 6, 11, 0.8);
}

.text-shadow-copy {
  text-shadow:
    0 1.5px 4px rgba(4, 6, 11, 0.98),
    0 5px 16px rgba(4, 6, 11, 0.92),
    0 12px 32px rgba(4, 6, 11, 0.82);
}

a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--starlight);
  outline-offset: 3px;
}

/* ── Journey scene layers (Sonnet, M1) ── */
.grain {
  position: absolute;
  inset: -50%;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  animation: grain-shift 0.9s steps(6) infinite;
}
@keyframes grain-shift {
  0% { transform: translate(0, 0); }
  17% { transform: translate(-3%, 2%); }
  33% { transform: translate(2%, -4%); }
  50% { transform: translate(-4%, -1%); }
  67% { transform: translate(3%, 3%); }
  83% { transform: translate(-1%, 4%); }
  100% { transform: translate(0, 0); }
}
.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(120% 95% at 50% 45%, transparent 55%, rgb(4 6 11 / 0.55) 100%);
}
.fog {
  position: absolute;
  left: -30%;
  width: 160%;
  pointer-events: none;
  background: radial-gradient(50% 50% at 50% 50%, rgb(199 205 216 / 0.16), transparent 70%);
  animation: fog-drift 38s ease-in-out infinite alternate;
}
.fog-b { animation-duration: 55s; animation-direction: alternate-reverse; opacity: 0.7; }
@keyframes fog-drift {
  from { transform: translate3d(-6%, 0, 0); }
  to { transform: translate3d(6%, 0, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .grain, .fog { animation: none; }
}
```

### `lib/scroll/progress.ts`

```ts
import { beats } from "@/content/beats";

export type ScrollState = {
  /** Target beat progress in [0, beats.length - 1], updated immediately on scroll. */
  target: number;
  /** Damped beat progress in [0, beats.length - 1], updated inside R3F useFrame. */
  current: number;
  /** Signed instantaneous scroll velocity in beats/sec for camera/plume dynamics. */
  velocity: number;
  /** Maximum beat index (beats.length - 1). */
  readonly maxBeat: number;
};

export const scrollState: ScrollState = {
  target: 0,
  current: 0,
  velocity: 0,
  maxBeat: beats.length - 1,
};

type ScrollHandler = (beatIndex: number, instant?: boolean) => void;
let scrollHandler: ScrollHandler | null = null;

/** Register the Stage's native scroller so ProgressRail, Skip, and hash links can jump smoothly. */
export function registerScroller(fn: ScrollHandler | null) {
  scrollHandler = fn;
}

/** Scroll smoothly (or instantly) to a beat by index or id. */
export function scrollToBeat(target: number | string, instant = false) {
  const index = typeof target === "string" ? beats.findIndex((b) => b.id === target) : target;
  if (index < 0 || index > scrollState.maxBeat) return;
  scrollHandler?.(index, instant);
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
}

export function remapClamp(v: number, inMin: number, inMax: number, outMin = 0, outMax = 1): number {
  const t = clamp01((v - inMin) / (inMax - inMin || 1));
  return outMin + (outMax - outMin) * t;
}
```

### `components/journey/Stage.tsx`

```tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { beats, beatIndexById } from "@/content/beats";
import { site } from "@/content/site";
import type { Beat } from "@/content/types";
import {
  registerScroller,
  scrollState,
  scrollToBeat,
  smoothstep,
} from "@/lib/scroll/progress";
import { useMuseum } from "@/lib/store";
import { ExhibitPanel } from "@/components/museum/ExhibitPanel";
import { BeatSection } from "./BeatOverlays";

gsap.registerPlugin(ScrollTrigger);

const SpaceScene = dynamic(() => import("./three/SpaceScene"), {
  ssr: false,
  loading: () => <div aria-hidden className="fixed inset-0 z-0 bg-void" />,
});

const railGroups = beats.reduce<{ rail: Beat["rail"]; items: { beat: Beat; index: number }[] }[]>(
  (groups, beat, index) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.rail === beat.rail) lastGroup.items.push({ beat, index });
    else groups.push({ rail: beat.rail, items: [{ beat, index }] });
    return groups;
  },
  [],
);

function TopHudBar() {
  const beatIndex = useMuseum((s) => s.beatIndex);
  const visitedCount = useMuseum((s) => s.visited.length);
  const beat = beats[beatIndex] ?? beats[0];
  const pad = String(beatIndex).padStart(2, "0");

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-10">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-line/80 bg-surface/65 px-3.5 py-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => scrollToBeat(0)}
          className="font-display cursor-pointer text-xs tracking-widest text-text hover:text-starlight"
        >
          {site.wordmark}
        </button>
        <span aria-hidden className="text-line">|</span>
        <span className="font-hud text-[10px] text-platinum">
          {pad} / {String(beats.length - 1).padStart(2, "0")} · {beat.rail}
        </span>
      </div>

      <nav
        aria-label="Museum navigation"
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-line/80 bg-surface/65 px-3.5 py-1.5 backdrop-blur-md"
      >
        <span className="font-hud hidden text-[10px] text-mute sm:inline">
          {visitedCount}/12 STAMPS
        </span>
        <span aria-hidden className="hidden text-line sm:inline">|</span>
        <Link href="/gallery" className="font-hud text-[10px] text-text transition-colors hover:text-starlight">
          Gallery
        </Link>
        <Link href="/about" className="font-hud text-[10px] text-mute transition-colors hover:text-text">
          About
        </Link>
      </nav>
    </header>
  );
}

function ProgressRail() {
  const beatIndex = useMuseum((s) => s.beatIndex);
  return (
    <nav
      aria-label="Mission progress"
      className="fixed right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-6"
    >
      {railGroups.map((group) => {
        const current = group.items.some((it) => it.index === beatIndex);
        return (
          <div key={group.rail} className="flex items-center gap-3">
            <span className={`font-hud hidden text-[10px] sm:block ${current ? "text-text" : "text-mute"}`}>
              {group.rail}
            </span>
            <ul className="flex flex-col items-center">
              {group.items.map(({ beat, index }) => {
                const on = index === beatIndex;
                return (
                  <li key={beat.id}>
                    <button
                      type="button"
                      onClick={() => scrollToBeat(index)}
                      title={beat.title ?? beat.sub ?? beat.id}
                      aria-label={`Go to ${beat.title ?? beat.sub ?? beat.id}`}
                      aria-current={on ? "step" : undefined}
                      className="flex h-4 w-6 cursor-pointer items-center justify-center"
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          on
                            ? "h-2 w-2 bg-starlight shadow-[0_0_8px_var(--starlight)]"
                            : index < beatIndex
                              ? "h-1 w-1 bg-platinum"
                              : "h-1 w-1 bg-mute/70"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function ScrollLiveCaption() {
  const beatIndex = useMuseum((s) => s.beatIndex);
  const beat = beats[beatIndex] ?? beats[0];
  return (
    <p aria-live="polite" className="sr-only">
      {[beat.title, beat.caption ?? beat.sub].filter(Boolean).join(". ")}
    </p>
  );
}

/**
 * Landing Page VAB Sunrise Backdrop + Scroll-1 Dolly Walk-In Portal (`progress: 0.0 -> 1.0`).
 * - At Beat 0 (`hero`): Displays the VAB sunrise photograph (`hero_vab_sunrise_alt`) full-screen.
 * - On Scroll 1 (`hero` -> `enter`): Smoothly dollies into the VAB campus / High Bay doors and
 *   dissolves through KSC dawn mist directly into the 3D scene where the SLS + Orion stands on Pad LC-39B.
 */
function VabEntrancePortal({ reducedMotion }: { reducedMotion: boolean }) {
  const portalRef = useRef<HTMLDivElement>(null);
  const exteriorRef = useRef<HTMLDivElement>(null);
  const campusRef = useRef<HTMLDivElement>(null);
  const mistVeilRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const portal = portalRef.current;
    const exterior = exteriorRef.current;
    const campus = campusRef.current;
    const mist = mistVeilRef.current;
    if (!portal || !exterior || !campus || !mist) return;

    const updatePortal = () => {
      const p = scrollState.current;
      if (p >= 0.96) {
        if (portal.style.visibility !== "hidden") {
          portal.style.visibility = "hidden";
          portal.style.opacity = "0";
        }
        return;
      }

      if (portal.style.visibility !== "visible") {
        portal.style.visibility = "visible";
        portal.style.opacity = "1";
      }

      // 1. VAB Sunrise Exterior: dollies into the VAB campus corridor & Transfer Aisle
      const extZoom = reducedMotion ? 1 : 1 + smoothstep(0.0, 0.72, p) * 0.78;
      const extOpacity = 1 - smoothstep(0.18, 0.64, p);
      exterior.style.opacity = extOpacity.toFixed(3);
      exterior.style.transform = `scale3d(${extZoom.toFixed(4)}, ${extZoom.toFixed(4)}, 1)`;

      // 2. Inside VAB Campus / Open High Bay Doors: intermediate walk-in portal into the 3D launchpad
      const campusIn = smoothstep(0.1, 0.36, p);
      const campusOut = 1 - smoothstep(0.44, 0.88, p);
      const campusOpacity = campusIn * campusOut;
      const campusZoom = reducedMotion ? 1 : 1.02 + smoothstep(0.1, 0.9, p) * 0.56;
      campus.style.opacity = campusOpacity.toFixed(3);
      campus.style.transform = `scale3d(${campusZoom.toFixed(4)}, ${campusZoom.toFixed(4)}, 1)`;

      // 3. KSC Morning Coastal Mist Veil: bridges the transition into the 3D SLS + Orion on Pad LC-39B
      const mistBell = Math.sin(smoothstep(0.12, 0.92, p) * Math.PI);
      mist.style.opacity = (mistBell * 0.38).toFixed(3);
    };

    updatePortal();
    gsap.ticker.add(updatePortal);
    return () => {
      gsap.ticker.remove(updatePortal);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={portalRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden will-change-[opacity]"
    >
      {/* Layer 2: Inside VAB Campus / Open High Bay Doors (intermediate dolly layer) */}
      <div
        ref={campusRef}
        className="absolute inset-0 origin-[50%_56%] opacity-0 will-change-[transform,opacity]"
      >
        <picture>
          <source
            type="image/avif"
            srcSet="/media/images/enter_vab_doors_open-1280.avif 1280w, /media/images/enter_vab_doors_open-2560.avif 2560w"
            sizes="100vw"
          />
          <source
            type="image/jpeg"
            srcSet="/media/images/enter_vab_doors_open-1280.jpg 1280w, /media/images/enter_vab_doors_open-2560.jpg 2560w"
            sizes="100vw"
          />
          <img
            src="/media/images/enter_vab_doors_open-2560.jpg"
            alt=""
            decoding="async"
            className="h-full w-full object-cover object-center brightness-[0.88] contrast-[1.06]"
          />
        </picture>
      </div>

      {/* Layer 1: VAB Sunrise Hero Theme Image (First image of the landing page) */}
      <div
        ref={exteriorRef}
        className="absolute inset-0 origin-[54%_60%] will-change-[transform,opacity]"
      >
        <picture>
          <source
            type="image/avif"
            srcSet="/media/images/hero_vab_sunrise_alt-1280.avif 1280w, /media/images/hero_vab_sunrise_alt-2560.avif 2560w"
            sizes="100vw"
          />
          <source
            type="image/jpeg"
            srcSet="/media/images/hero_vab_sunrise_alt-1280.jpg 1280w, /media/images/hero_vab_sunrise_alt-2560.jpg 2560w"
            sizes="100vw"
          />
          <img
            src="/media/images/hero_vab_sunrise_alt-2560.jpg"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-center brightness-[0.94] contrast-[1.04]"
          />
        </picture>

        {/* Subtle drifting KSC dawn mist */}
        <div className="fog fog-a" />
        <div className="fog fog-b" />
      </div>

      {/* Layer 3: Atmospheric dawn mist bloom when entering the 3D Launchpad */}
      <div
        ref={mistVeilRef}
        className="absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 52% 54%, rgba(168, 198, 255, 0.35) 0%, rgba(16, 26, 48, 0.65) 58%, rgba(5, 6, 10, 0.85) 100%)",
        }}
      />
    </div>
  );
}

export default function Stage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMuseum((s) => s.reducedMotion);

  // Hydrate visited passport stamps + reduced-motion media query once on mount
  useEffect(() => {
    useMuseum.getState().hydrateVisited();
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMql = () => useMuseum.getState().setReducedMotion(mql.matches);
    syncMql();
    mql.addEventListener("change", syncMql);
    return () => mql.removeEventListener("change", syncMql);
  }, []);

  // Master Lenis + GSAP ScrollTrigger integration
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxIdx = beats.length - 1;
    let hashTimer = 0;

    const lenis = reducedMotion
      ? null
      : new Lenis({
          lerp: 0.085,
          smoothWheel: true,
          syncTouch: true,
        });

    const onLenisScroll = () => ScrollTrigger.update();
    lenis?.on("scroll", onLenisScroll);

    const tickerRaf = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(tickerRaf);
    gsap.ticker.lagSmoothing(0);

    const applyProgress = (clamped: number, snapCurrent = false) => {
      scrollState.target = clamped;
      if (snapCurrent) scrollState.current = clamped;

      const nearest = Math.round(clamped);
      const store = useMuseum.getState();
      if (store.beatIndex !== nearest) {
        store.setBeat(nearest, beats[nearest].id);
        window.clearTimeout(hashTimer);
        hashTimer = window.setTimeout(() => {
          const hash = `#${beats[nearest].id}`;
          if (window.location.hash !== hash && !(nearest === 0 && !window.location.hash)) {
            window.history.replaceState(window.history.state, "", hash);
          }
        }, 140);
      }
    };

    const masterTrigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        applyProgress(self.progress * maxIdx, false);
      },
    });

    const scrollTo = (index: number, instant = false) => {
      const top = index * Math.max(window.innerHeight, 1);
      if (lenis) {
        lenis.scrollTo(top, {
          immediate: instant || useMuseum.getState().reducedMotion,
          duration: 1.35,
        });
      } else {
        window.scrollTo({
          top,
          behavior: instant || useMuseum.getState().reducedMotion ? "auto" : "smooth",
        });
      }
    };

    registerScroller(scrollTo);

    // Jump immediately to initial URL hash if present (e.g. /#ignition or /#moon-apollo-11)
    const readHash = () => {
      try {
        return beatIndexById(decodeURIComponent(window.location.hash.slice(1)));
      } catch {
        return -1;
      }
    };
    const initialIdx = readHash();
    if (initialIdx >= 0) {
      const top = initialIdx * Math.max(window.innerHeight, 1);
      if (lenis) lenis.scrollTo(top, { immediate: true });
      else window.scrollTo({ top, behavior: "auto" });
      applyProgress(initialIdx, true);
    } else {
      const raw = (window.scrollY / Math.max(window.innerHeight, 1));
      applyProgress(Math.max(0, Math.min(maxIdx, raw)), true);
    }

    const onHashChange = () => {
      const i = readHash();
      if (i >= 0) scrollTo(i);
    };
    window.addEventListener("hashchange", onHashChange);

    // Pause Lenis while ExhibitPanel modal is open
    const unsubStore = useMuseum.subscribe((s, p) => {
      if ((s.activeExhibit !== null) !== (p.activeExhibit !== null)) {
        if (s.activeExhibit !== null) lenis?.stop();
        else lenis?.start();
      }
    });

    ScrollTrigger.refresh();

    return () => {
      window.clearTimeout(hashTimer);
      registerScroller(null);
      unsubStore();
      window.removeEventListener("hashchange", onHashChange);
      masterTrigger.kill();
      gsap.ticker.remove(tickerRaf);
      lenis?.off("scroll", onLenisScroll);
      lenis?.destroy();
    };
  }, [reducedMotion]);

  return (
    <div className="relative min-h-screen w-full bg-void">
      {/* Persistent 60fps 3D Rocket + Spaceflight Background */}
      <SpaceScene />

      {/* VAB Sunrise Landing Page Backdrop + Scroll-1 Dolly Portal into 3D Launchpad */}
      <VabEntrancePortal reducedMotion={reducedMotion} />

      {/* Subtle museum film grain & edge vignette layered softly over 3D & VAB Portal */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
        <div className="vignette" />
        <div className="grain" />
      </div>

      {/* Lenis + GSAP ScrollTrigger story track (24 sections = 2400dvh) */}
      <div ref={trackRef} className="pointer-events-none relative z-10 flex flex-col">
        {beats.map((beat) => (
          <BeatSection key={beat.id} beat={beat} />
        ))}
      </div>

      <TopHudBar />
      <ProgressRail />
      <ScrollLiveCaption />
      <ExhibitPanel />
    </div>
  );
}
```

### `components/journey/BeatOverlays.tsx`

```tsx
"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { beats } from "@/content/beats";
import { exhibitBySlug } from "@/content/exhibits";
import { silence } from "@/content/silence";
import { site } from "@/content/site";
import { teaser, teaserItems } from "@/content/teaser";
import type { Beat } from "@/content/types";
import { scrollToBeat } from "@/lib/scroll/progress";
import { useMuseum } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

const ASCENT_HUD: Record<
  string,
  { event: string; met: string; sys: string; thrust: string }
> = {
  "ascent-1": {
    event: "CLEAR THE TOWER",
    met: "T+00:00:12",
    sys: "4× RS-25 + 2× RSRMV ACTIVE",
    thrust: "39.1 MN · PITCH & ROLL PROGRAM",
  },
  "ascent-2": {
    event: "MAX-Q · SUPERSONIC",
    met: "T+00:01:30",
    sys: "PEAK AERODYNAMIC STRESS",
    thrust: "CORE THROTTLE BUCKET · MACH 1.8+",
  },
  "ascent-3": {
    event: "BOOSTER SEPARATION",
    met: "T+00:02:06",
    sys: "8× BSM PYROTECHNIC SEPARATION",
    thrust: "SRB JETTISON · CORE STAGE CONTINUES",
  },
  "ascent-4": {
    event: "EDGE OF SPACE",
    met: "ABOVE 100 KM",
    sys: "ESM FAIRING & LAS JETTISON",
    thrust: "ORION MPCV EXPOSED TO VACUUM",
  },
};

function HeroOverlay({ beat }: { beat: Beat }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between px-6 pb-8 pt-20 pr-12 sm:px-12 sm:pb-10 sm:pt-20 sm:pr-20 lg:pr-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/90 via-void/15 to-void/45"
      />
      {/* Directional dark-charcoal sky scrim on the right side to separate white typography from bright dawn clouds */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 56% 48% at 74% 34%, rgba(6, 9, 16, 0.62) 0%, rgba(6, 9, 16, 0.34) 54%, transparent 84%)",
        }}
      />

      <div
        data-hud-card
        className="font-hud text-shadow-copy relative z-10 flex flex-wrap items-center justify-end gap-3 text-right text-[11px] text-platinum"
      >
        <span>{beat.sub}</span>
        <span className="text-line">·</span>
        <span className="text-starlight">VEHICLE ASSEMBLY BUILDING · HIGH BAY 3</span>
      </div>

      <div
        data-hud-card
        className="relative z-10 mt-[10dvh] mb-auto ml-auto flex w-fit flex-col items-end text-right sm:mt-[12dvh] sm:mr-6 lg:mr-10"
      >
        {/* Soft feathered charcoal halo directly behind heading & subtitle */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -inset-y-7 -z-10 rounded-3xl bg-void/45 blur-2xl"
        />
        <h1 className="font-display text-shadow-display mr-[-0.06em] text-[clamp(2.1rem,5.2vw,4.85rem)] leading-none text-white">
          {beat.title}
        </h1>
        <p className="text-shadow-copy mt-3.5 text-right text-base font-medium text-white/95 sm:whitespace-nowrap sm:text-xl">
          {beat.caption}
        </p>
      </div>

      <div
        data-hud-card
        className="text-shadow-copy relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="pointer-events-auto flex max-w-xl flex-col gap-2.5">
          <p className="font-hud text-[11px] text-platinum">ADMISSION FREE · EST. VISIT 10 MIN</p>
          <button
            type="button"
            onClick={() => scrollToBeat("deep-space")}
            className="font-hud w-fit cursor-pointer border-b border-platinum/40 pb-0.5 text-xs text-text transition-colors hover:border-starlight hover:text-starlight"
          >
            {site.skip}
          </button>
          <p className="font-hud text-[9px] leading-relaxed text-platinum/85 normal-case tracking-normal">
            {site.disclaimer}
          </p>
        </div>

        <p className="font-hud text-xs text-starlight">Scroll to enter VAB &amp; launchpad ↓</p>
      </div>
    </div>
  );
}

function EnterOverlay({ beat }: { beat: Beat }) {
  return (
    <div className="relative flex h-full w-full items-end px-6 pb-14 pr-14 sm:px-12 sm:pb-16 sm:pr-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/90 to-transparent"
      />
      <div data-hud-card className="relative z-10 max-w-2xl">
        <div className="font-hud text-shadow-copy mb-3 flex flex-wrap items-center gap-2.5 text-[11px] text-platinum">
          <span>{beat.sub}</span>
          <span className="text-line">·</span>
          <span className="text-starlight">PAD LC-39B · SLS BLOCK 1 ON MOBILE LAUNCHER</span>
        </div>
        <p className="font-display text-shadow-display text-[clamp(1.5rem,4.2vw,3rem)] leading-tight text-white">
          {beat.caption}
        </p>
      </div>
    </div>
  );
}

/** Ignition overlay — no countdown clutter in center; highlights ROFI sparks, RS-25 + SRB thrust & liftoff. */
function IgnitionOverlay({ beat }: { beat: Beat }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-end px-6 pb-14 pr-14 sm:px-12 sm:pb-16 sm:pr-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/90 to-transparent"
      />

      <div
        data-hud-card
        className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="max-w-2xl">
          <div className="font-hud text-shadow-copy mb-2.5 flex flex-wrap items-center gap-2.5 text-[11px] text-platinum">
            <span className="inline-block h-2 w-2 rounded-full bg-ignite" />
            <span>MAIN ENGINE START · ROFI SPARK IGNITION</span>
            <span className="text-line">·</span>
            <span>T+00:00:00</span>
          </div>
          <h2
            className="font-display text-shadow-display text-[clamp(2.5rem,8.5vw,6.2rem)] leading-none"
            style={{ color: "var(--ignite)" }}
          >
            {beat.title}
          </h2>
          <p className="font-hud text-shadow-copy mt-3 text-xs text-text">{beat.sub}</p>
        </div>

        <div className="font-hud rounded border border-line/80 bg-surface/75 px-4 py-3 text-[10px] leading-relaxed text-platinum backdrop-blur-md">
          <div className="text-text">PROPULSION TELEMETRY</div>
          <div className="mt-1 text-mute">CORE: 4× RS-25 LH2/LOX · 109% RATED</div>
          <div className="text-mute">BOOSTERS: 2× 5-SEG RSRMV SOLID</div>
        </div>
      </div>
    </div>
  );
}

function AscentOverlay({ beat }: { beat: Beat }) {
  const hud = ASCENT_HUD[beat.id];
  return (
    <div className="relative flex h-full w-full items-end justify-between px-6 pb-14 pr-14 sm:px-12 sm:pb-16 sm:pr-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/90 to-transparent"
      />
      <div
        data-hud-card
        className="relative z-10 flex w-full flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="font-hud flex flex-col gap-1 rounded border border-line/80 bg-surface/75 px-4 py-3 text-[11px] text-platinum backdrop-blur-md">
          <span className="text-starlight">{hud?.event}</span>
          <span className="text-text">{hud?.met}</span>
          <span className="mt-1 text-[10px] text-mute">{hud?.sys}</span>
          <span className="text-[10px] text-mute">{hud?.thrust}</span>
        </div>
        <div className="max-w-lg">
          {beat.title ? (
            <h2 className="font-display text-shadow-display mb-3 text-[clamp(1.75rem,4.5vw,3.25rem)] leading-tight text-white">
              {beat.title}
            </h2>
          ) : null}
          <p className="text-shadow-copy text-base font-medium text-white/95 sm:text-lg">{beat.caption}</p>
        </div>
      </div>
    </div>
  );
}

function HallTitleOverlay({ beat }: { beat: Beat }) {
  const isMars = beat.rail === "MARS";
  return (
    <div className="relative flex h-full w-full items-end px-6 pb-16 pr-14 sm:px-12 sm:pb-20 sm:pr-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/90 to-transparent"
      />
      <div data-hud-card className="relative z-10 max-w-2xl">
        <div
          className="font-hud text-shadow-copy mb-3 flex flex-wrap items-center gap-2.5 text-xs"
          style={{ color: isMars ? "var(--oxide)" : "var(--starlight)" }}
        >
          <span>{beat.sub}</span>
          <span className="text-line">·</span>
          <span>
            {isMars
              ? "INTERPLANETARY CRUISE · HOHMANN TRANSFER"
              : "TRANS-LUNAR INJECTION · ORION SOLAR ARRAYS DEPLOYED"}
          </span>
        </div>
        <h2 className="font-display text-shadow-display text-[clamp(2rem,6vw,4.5rem)] leading-none text-white">
          {beat.title}
        </h2>
        <p className="text-shadow-copy mt-4 text-base font-medium text-white/95 sm:text-xl">{beat.caption}</p>
      </div>
    </div>
  );
}

function ExhibitBeatOverlay({ beat }: { beat: Beat }) {
  const ex = beat.exhibitSlug ? exhibitBySlug(beat.exhibitSlug) : undefined;
  const openExhibit = useMuseum((s) => s.openExhibit);
  const visited = useMuseum((s) => s.visited);
  if (!ex) return null;

  const isMoon = ex.hall === "moon";
  const hasStamp = visited.includes(ex.slug);
  const coords =
    ex.location.lat !== undefined && ex.location.lon !== undefined
      ? ` · ${Math.abs(ex.location.lat).toFixed(2)}°${ex.location.lat >= 0 ? "N" : "S"} ${Math.abs(
          ex.location.lon,
        ).toFixed(2)}°${ex.location.lon >= 0 ? "E" : "W"}`
      : "";

  return (
    <div className="relative flex h-full w-full items-end px-6 pb-12 pr-14 sm:px-12 sm:pb-14 sm:pr-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-void/90 via-void/35 to-transparent"
      />
      <div
        data-hud-card
        className="pointer-events-auto relative z-10 max-w-lg rounded-lg border border-line bg-surface/75 p-5 backdrop-blur-md sm:p-6"
      >
        <div className="font-hud flex flex-wrap items-center gap-2 text-[11px] text-mute">
          <span style={{ color: isMoon ? "var(--lunar)" : "var(--oxide)" }}>{ex.catalogNo}</span>
          <span>·</span>
          <span>{isMoon ? "HALL I · THE MOON" : "HALL II · MARS"}</span>
          <span>·</span>
          <span className={ex.status === "still-active" ? "text-starlight" : "text-ignite"}>
            {ex.statusLabel ?? (ex.status === "still-active" ? "STILL ACTIVE" : "SILENT")}
          </span>
        </div>

        <h2 className="font-display mt-2 text-2xl leading-tight text-text sm:text-3xl">{ex.name}</h2>
        <p className="font-hud mt-1 text-[10px] text-platinum">
          {ex.location.site}
          {coords}
        </p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text/90">{ex.plaque}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => openExhibit(ex.slug)}
            className="font-hud cursor-pointer rounded border border-starlight/60 bg-raised/90 px-4 py-2 text-xs text-starlight transition-colors hover:border-starlight hover:bg-starlight hover:text-void"
          >
            {site.explore} →
          </button>
          {hasStamp ? <span className="font-hud text-[10px] text-platinum">◉ Stamp collected</span> : null}
        </div>
      </div>
    </div>
  );
}

function SilenceOverlay() {
  return (
    <div className="relative flex h-full w-full items-center px-6 py-12 pr-14 sm:px-12 sm:pr-32">
      <div
        data-hud-card
        className="pointer-events-auto max-h-[82dvh] w-full max-w-4xl overflow-y-auto rounded-lg border border-line bg-surface/80 p-6 backdrop-blur-lg sm:p-8"
      >
        <p className="font-hud text-[11px] text-mute">EPILOGUE</p>
        <h2 className="font-display mt-2 text-2xl text-text sm:text-4xl">{silence.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-mute sm:text-base">{silence.intro}</p>

        <ul className="mt-5 grid gap-x-8 gap-y-2 border-y border-line py-4 text-sm sm:grid-cols-2">
          {silence.wall.map((row) => (
            <li
              key={row.name}
              className="flex items-baseline justify-between gap-3 border-b border-line/40 pb-1.5 last:border-b-0"
            >
              <span className="font-medium text-text">{row.name}</span>
              <span className={`font-hud text-[10px] ${row.active ? "text-starlight" : "text-mute"}`}>
                {row.last}
                {row.note ? ` · ${row.note}` : ""}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {silence.numbers.map((n, idx) => (
            <p
              key={idx}
              className="rounded border border-line bg-raised/50 p-3 text-xs leading-relaxed text-text/90"
            >
              {n.text}
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-mute">{silence.heritage.text}</p>
      </div>
    </div>
  );
}

function BeyondOverlay() {
  return (
    <div className="relative flex h-full w-full items-end px-6 pb-12 pr-14 sm:px-12 sm:pb-14 sm:pr-32">
      <div
        data-hud-card
        className="pointer-events-auto w-full max-w-5xl rounded-lg border border-platinum/25 bg-surface/65 p-5 backdrop-blur-md sm:p-7"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-hud text-[11px] text-starlight">{teaser.title}</p>
            <p className="mt-1.5 text-sm text-text/90 sm:text-base">{teaser.line}</p>
          </div>
          <span className="font-hud rounded border border-platinum/30 px-2.5 py-1 text-[10px] text-platinum">
            TEASER · 3D SILHOUETTES
          </span>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {teaserItems.map((item) => (
            <li
              key={item.catalogNo}
              className="rounded border border-line bg-raised/65 p-3.5 transition-colors hover:border-starlight/50"
            >
              <p className="font-hud text-[10px] text-mute">
                {item.catalogNo} · {item.year}
              </p>
              <h3 className="font-display mt-1 text-base text-text">{item.name}</h3>
              <p className="font-hud mt-0.5 text-[10px] text-platinum">{item.target}</p>
              <p
                className={`mt-2 text-xs ${
                  item.status === "still-travelling" ? "font-hud text-starlight" : "text-mute"
                }`}
              >
                {item.line}
              </p>
            </li>
          ))}
        </ul>

        <p className="font-hud mt-4 text-[10px] text-starlight">{teaser.voyagerNote}</p>
      </div>
    </div>
  );
}

function FinaleOverlay({ beat }: { beat: Beat }) {
  return (
    <div className="relative flex h-full w-full items-end px-6 pb-14 pr-14 sm:px-12 sm:pb-20 sm:pr-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-void/90 to-transparent"
      />
      <div data-hud-card className="pointer-events-auto relative z-10 max-w-2xl">
        <p className="font-hud mb-3 text-[11px] text-platinum">ARTEMIS ERA EARTHRISE · 6 APR 2026</p>
        <p className="text-lg leading-relaxed text-text sm:text-2xl">{beat.caption}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/gallery"
            className="font-hud rounded border border-starlight/60 bg-raised/85 px-4 py-2 text-xs text-starlight transition-colors hover:bg-starlight hover:text-void"
          >
            Revisit the galleries →
          </Link>
          <Link
            href="/about"
            className="font-hud rounded border border-line bg-surface/80 px-4 py-2 text-xs text-text transition-colors hover:border-platinum"
          >
            Sources &amp; Credits
          </Link>
          <button
            type="button"
            onClick={() => scrollToBeat(0)}
            className="font-hud cursor-pointer px-2 py-2 text-xs text-mute transition-colors hover:text-text"
          >
            Back to launchpad ↑
          </button>
        </div>
      </div>
    </div>
  );
}

export function BeatSection({ beat }: { beat: Beat }) {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-hud-card]");
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: {
            trigger: el,
            start: "top 78%",
            end: "bottom 22%",
            toggleActions: "play reverse play reverse",
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  let content: React.ReactNode = null;
  if (beat.id === "hero") content = <HeroOverlay beat={beat} />;
  else if (beat.id === "enter") content = <EnterOverlay beat={beat} />;
  else if (beat.id === "ignition") content = <IgnitionOverlay beat={beat} />;
  else if (beat.act === "ascent") content = <AscentOverlay beat={beat} />;
  else if (beat.id === "deep-space" || beat.id === "transit") content = <HallTitleOverlay beat={beat} />;
  else if (beat.exhibitSlug) content = <ExhibitBeatOverlay beat={beat} />;
  else if (beat.id === "silence") content = <SilenceOverlay />;
  else if (beat.id === "beyond") content = <BeyondOverlay />;
  else if (beat.id === "finale") content = <FinaleOverlay beat={beat} />;

  return (
    <section
      ref={sectionRef}
      id={beat.id}
      data-beat={beat.id}
      className="pointer-events-none relative h-dvh w-full shrink-0"
    >
      {content}
    </section>
  );
}

export { beats };
```

### `components/journey/three/trajectory.ts`

```ts
import * as THREE from "three";

export type Vec3 = [number, number, number];

export type BeatPose = {
  camPos: Vec3;
  camLook: Vec3;
  rocketPos: Vec3;
  /** Euler rotation in radians [rx, ry, rz]. */
  rocketRot: Vec3;
  /** Uniform scale of the rocket assembly. */
  rocketScale: number;
};

export const WORLD_ANCHORS = {
  pad: [0, 0, 0] as Vec3,
  vab: [-28, 0, -48] as Vec3,
  earthCenter: [0, -140, -10] as Vec3,
  earthRadius: 155,
  moonCenter: [0, 340, -215] as Vec3,
  moonRadius: 24,
  marsCenter: [0, 485, -415] as Vec3,
  marsRadius: 26,
  finaleEarthCenter: [-22, 578, -660] as Vec3,
  finaleMoonCenter: [10, 540, -565] as Vec3,
} as const;

/**
 * 24 keyframe poses (index 0..23 matching content/beats.ts).
 * Continuous C1 Catmull-Rom interpolation drives camera + rocket across the entire journey.
 */
export const BEAT_POSES: BeatPose[] = [
  // 0: hero — VAB campus entrance corridor aligned with the VAB sunrise hero portal; dollies straight toward the pad on Scroll 1
  {
    camPos: [-13.5, 4.2, 27.5],
    camLook: [-1.5, 7.6, -2.5],
    rocketPos: [0, 0, 0],
    rocketRot: [0, 0.2, 0],
    rocketScale: 1,
  },
  // 1: enter — Inside the VAB / Launch Complex perimeter directly in front of the floodlit SLS + Orion on the launchpad
  {
    camPos: [-6.4, 8.6, 11.8],
    camLook: [0, 9.4, 0],
    rocketPos: [0, 0, 0],
    rocketRot: [0, 0.15, 0],
    rocketScale: 1,
  },
  // 2: ignition — liftoff! Rocket rises cleanly off LC-39B while camera tilts up
  {
    camPos: [9.5, 6.5, 16.5],
    camLook: [0, 14, 0],
    rocketPos: [0, 10, 0],
    rocketRot: [0, 0.08, -0.02],
    rocketScale: 1,
  },
  // 3: ascent-1 — Clear the tower, climbing into bright blue sky
  {
    camPos: [10, 46, 21],
    camLook: [1.5, 52, -3],
    rocketPos: [1.5, 50, -3],
    rocketRot: [-0.08, 0.1, -0.14],
    rocketScale: 1,
  },
  // 4: ascent-2 — Max-Q supersonic pitch-over, stratosphere darkening
  {
    camPos: [11, 104, 19],
    camLook: [6, 114, -10],
    rocketPos: [6.5, 112, -10],
    rocketRot: [-0.22, 0.12, -0.34],
    rocketScale: 1,
  },
  // 5: ascent-3 — Side booster separation (~2 min)
  {
    camPos: [14, 166, 14],
    camLook: [13, 178, -22],
    rocketPos: [13.5, 176, -22],
    rocketRot: [-0.42, 0.1, -0.58],
    rocketScale: 1,
  },
  // 6: ascent-4 — Edge of space (above 100 km), curved blue Earth below, fairing jettison
  {
    camPos: [17, 232, -30],
    camLook: [14, 240, -56],
    rocketPos: [17.5, 244, -46],
    rocketRot: [-0.65, 0.15, -0.82],
    rocketScale: 0.92,
  },
  // 7: deep-space — Core separation, Orion solar wings deploy, TLI burn toward Moon
  {
    camPos: [9, 294, -112],
    camLook: [2, 318, -178],
    rocketPos: [6, 298, -124],
    rocketRot: [-0.88, 0.05, -0.25],
    rocketScale: 0.72,
  },
  // 8: moon-apollo-11 (SM-L-001) — Descending to Sea of Tranquility plinth
  {
    camPos: [13.5, 344, -172],
    camLook: [5.5, 340.8, -187],
    rocketPos: [-12, 355, -186],
    rocketRot: [-0.3, 0.8, 0.15],
    rocketScale: 0.45,
  },
  // 9: moon-surveyor-3 (SM-L-002) — Gliding across lunar hemisphere
  {
    camPos: [-10.5, 336.5, -173],
    camLook: [-1.5, 335, -189],
    rocketPos: [-16, 352, -192],
    rocketRot: [-0.2, 0.9, 0.1],
    rocketScale: 0.42,
  },
  // 10: moon-apollo-15-lrv (SM-L-003) — Northern Hadley-Apennine ridge
  {
    camPos: [10.5, 354, -176],
    camLook: [2.5, 350.5, -191],
    rocketPos: [-14, 362, -195],
    rocketRot: [-0.25, 1.0, 0.08],
    rocketScale: 0.42,
  },
  // 11: moon-apollo-17 (SM-L-004) — Taurus-Littrow valley
  {
    camPos: [19.5, 349, -184],
    camLook: [10.5, 346, -198],
    rocketPos: [-10, 360, -200],
    rocketRot: [-0.2, 1.1, 0.05],
    rocketScale: 0.42,
  },
  // 12: moon-grail (SM-L-005) — North polar impact site
  {
    camPos: [3.5, 367, -184],
    camLook: [0.5, 360, -199],
    rocketPos: [-12, 372, -206],
    rocketRot: [-0.4, 0.7, 0.1],
    rocketScale: 0.45,
  },
  // 13: transit — Orbital arc from Moon to Mars (7-10 months)
  {
    camPos: [18, 415, -278],
    camLook: [2, 445, -352],
    rocketPos: [7, 422, -295],
    rocketRot: [-0.95, 0.25, -0.2],
    rocketScale: 0.65,
  },
  // 14: mars-viking-1 (SM-M-001) — Chryse Planitia
  {
    camPos: [14.5, 488, -368],
    camLook: [6, 484.8, -384],
    rocketPos: [-14, 502, -386],
    rocketRot: [-0.2, 0.7, 0.12],
    rocketScale: 0.45,
  },
  // 15: mars-pathfinder (SM-M-002) — Ares Vallis
  {
    camPos: [-11.5, 483, -369],
    camLook: [-2, 481, -385],
    rocketPos: [-18, 498, -390],
    rocketRot: [-0.25, 0.85, 0.1],
    rocketScale: 0.42,
  },
  // 16: mars-spirit (SM-M-003) — Gusev Crater
  {
    camPos: [-19, 474, -384],
    camLook: [-9, 475, -398],
    rocketPos: [-22, 494, -402],
    rocketRot: [-0.3, 0.95, 0.05],
    rocketScale: 0.42,
  },
  // 17: mars-opportunity (SM-M-004) — Meridiani Planum
  {
    camPos: [7, 479, -368],
    camLook: [0.5, 479, -384],
    rocketPos: [-16, 496, -394],
    rocketRot: [-0.2, 1.0, 0.08],
    rocketScale: 0.42,
  },
  // 18: mars-phoenix (SM-M-005) — Vastitas Borealis north pole
  {
    camPos: [2.5, 513, -382],
    camLook: [0.5, 506, -398],
    rocketPos: [-14, 518, -405],
    rocketRot: [-0.35, 0.8, 0.1],
    rocketScale: 0.42,
  },
  // 19: mars-insight (SM-M-006) — Elysium Planitia
  {
    camPos: [22.5, 489, -383],
    camLook: [12, 486, -397],
    rocketPos: [-12, 504, -402],
    rocketRot: [-0.22, 0.9, 0.06],
    rocketScale: 0.42,
  },
  // 20: mars-ingenuity (SM-M-007) — Jezero Crater
  {
    camPos: [18, 498, -376],
    camLook: [8.5, 494, -391],
    rocketPos: [-15, 508, -398],
    rocketRot: [-0.28, 1.05, 0.08],
    rocketScale: 0.42,
  },
  // 21: silence — Pull back into tranquil starfield for The Hall of Silence
  {
    camPos: [0, 526, -455],
    camLook: [0, 532, -520],
    rocketPos: [-18, 534, -490],
    rocketRot: [-0.5, 0.6, 0.1],
    rocketScale: 0.48,
  },
  // 22: beyond — Outer darkness + Hall III 4 spacecraft silhouettes
  {
    camPos: [0, 538, -502],
    camLook: [0, 538, -536],
    rocketPos: [-24, 546, -528],
    rocketRot: [-0.45, 0.5, 0.1],
    rocketScale: 0.42,
  },
  // 23: finale — Artemis Era Earthrise over the lunar limb
  {
    camPos: [2, 558, -542],
    camLook: [-14, 566, -630],
    rocketPos: [5.2, 557.2, -552],
    rocketRot: [-0.35, -0.55, 0.18],
    rocketScale: 0.55,
  },
];

// Pre-build Catmull-Rom curves once (zero per-frame allocations)
const camPosCurve = new THREE.CatmullRomCurve3(
  BEAT_POSES.map((p) => new THREE.Vector3(...p.camPos)),
  false,
  "catmullrom",
  0.35,
);
const camLookCurve = new THREE.CatmullRomCurve3(
  BEAT_POSES.map((p) => new THREE.Vector3(...p.camLook)),
  false,
  "catmullrom",
  0.35,
);
const rocketPosCurve = new THREE.CatmullRomCurve3(
  BEAT_POSES.map((p) => new THREE.Vector3(...p.rocketPos)),
  false,
  "catmullrom",
  0.35,
);

const maxIdx = BEAT_POSES.length - 1;

export type SampledTrajectory = {
  camPos: THREE.Vector3;
  camLook: THREE.Vector3;
  rocketPos: THREE.Vector3;
  rocketRot: THREE.Euler;
  rocketScale: number;
};

/**
 * Sample smoothed camera + rocket state for any continuous `progress` in [0, 23].
 * Reuses caller-provided vectors to keep useFrame allocation-free.
 */
export function sampleTrajectory(progress: number, out: SampledTrajectory): SampledTrajectory {
  const clamped = Math.max(0, Math.min(maxIdx, progress));
  const u = clamped / maxIdx;

  // Slightly flatten curve velocity right near beat 0..1.9 so the rocket stands steady on LC-39B until ignition
  const rocketProgress =
    clamped < 1.85 ? 0 : clamped < 2.3 ? ((clamped - 1.85) / 0.45) * 0.25 + 1.85 : clamped;
  const ru = Math.max(0, Math.min(1, rocketProgress / maxIdx));

  camPosCurve.getPoint(u, out.camPos);
  camLookCurve.getPoint(u, out.camLook);
  rocketPosCurve.getPoint(ru, out.rocketPos);

  const i0 = Math.floor(clamped);
  const i1 = Math.min(maxIdx, i0 + 1);
  const alpha = clamped - i0;
  const smooth = alpha * alpha * (3 - 2 * alpha);

  const r0 = BEAT_POSES[i0].rocketRot;
  const r1 = BEAT_POSES[i1].rocketRot;
  out.rocketRot.set(
    THREE.MathUtils.lerp(r0[0], r1[0], smooth),
    THREE.MathUtils.lerp(r0[1], r1[1], smooth),
    THREE.MathUtils.lerp(r0[2], r1[2], smooth),
  );
  out.rocketScale = THREE.MathUtils.lerp(BEAT_POSES[i0].rocketScale, BEAT_POSES[i1].rocketScale, smooth);

  return out;
}

/** World position of each exhibit plinth (beats 8..12 Moon, beats 14..20 Mars). */
export const EXHIBIT_PLINTH_ANCHORS: Record<string, { pos: Vec3; rotY: number; planet: "moon" | "mars" }> = {
  "moon-apollo-11": { pos: [5.5, 340.6, -187.5], rotY: -0.3, planet: "moon" },
  "moon-surveyor-3": { pos: [-1.5, 334.8, -189.2], rotY: 0.35, planet: "moon" },
  "moon-apollo-15-lrv": { pos: [2.5, 350.3, -191.2], rotY: -0.25, planet: "moon" },
  "moon-apollo-17": { pos: [10.5, 345.8, -198.2], rotY: -0.45, planet: "moon" },
  "moon-grail": { pos: [0.5, 359.8, -199.2], rotY: -0.1, planet: "moon" },

  "mars-viking-1": { pos: [6, 484.6, -384.2], rotY: -0.35, planet: "mars" },
  "mars-pathfinder": { pos: [-2, 480.8, -385.2], rotY: 0.3, planet: "mars" },
  "mars-spirit": { pos: [-9, 474.8, -398.2], rotY: 0.55, planet: "mars" },
  "mars-opportunity": { pos: [0.5, 478.8, -384.2], rotY: -0.15, planet: "mars" },
  "mars-phoenix": { pos: [0.5, 505.8, -398.2], rotY: 0.0, planet: "mars" },
  "mars-insight": { pos: [12, 485.8, -397.2], rotY: -0.5, planet: "mars" },
  "mars-ingenuity": { pos: [8.5, 493.8, -391.2], rotY: -0.4, planet: "mars" },
};
```

### `components/journey/three/rocketTextures.ts`

```ts
import * as THREE from "three";

type TexturePair = {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap?: THREE.CanvasTexture;
};

let coreCache: TexturePair | null = null;
let srbCache: TexturePair | null = null;
let orionCache: TexturePair | null = null;
let fairingCache: TexturePair | null = null;
let nozzleCache: TexturePair | null = null;
let kaptonBumpCache: THREE.CanvasTexture | null = null;
let solarCache: THREE.CanvasTexture | null = null;
let sparkTexCache: THREE.CanvasTexture | null = null;
let smokeTexCache: THREE.CanvasTexture | null = null;

/** Draw a NASA photogrammetry black/white quadrant calibration target. */
function drawCalibrationTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#E8ECF4";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#10141D";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r * 0.82, 0, Math.PI / 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r * 0.82, Math.PI, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#10141D";
  ctx.lineWidth = Math.max(1, r * 0.14);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** 1. SLS Core Stage SOFI Cryogenic Foam + Intertank Stringers + Stencils */
export function getCoreStageTextures(): TexturePair {
  if (coreCache) return coreCache;

  const W = 1024;
  const H = 2048;

  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  // Base weathered SOFI orange foam gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
  baseGrad.addColorStop(0, "#B85222");
  baseGrad.addColorStop(0.28, "#C65D2B");
  baseGrad.addColorStop(0.36, "#9A4119"); // Intertank darker cured foam
  baseGrad.addColorStop(0.48, "#C25927");
  baseGrad.addColorStop(0.88, "#B44E20");
  baseGrad.addColorStop(1, "#8E3A15");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, W, H);

  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, W, H);

  // Organic foam cell variation & subtle vertical milling lines
  for (let i = 0; i < 3200; i++) {
    const x = (i * 173) % W;
    const y = (i * 311) % H;
    const w = 8 + (i % 24);
    const h = 4 + (i % 14);
    ctx.fillStyle = i % 2 === 0 ? "rgba(255, 165, 95, 0.045)" : "rgba(60, 20, 5, 0.05)";
    ctx.fillRect(x, y, w, h);
    bctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    bctx.fillRect(x, y, w, h);
  }

  // Horizontal circumferential weld / acreage foam bands
  const weldY = [140, 310, 480, 680, 880, 1080, 1280, 1480, 1680, 1860];
  weldY.forEach((y) => {
    ctx.fillStyle = "rgba(72, 24, 8, 0.42)";
    ctx.fillRect(0, y - 5, W, 10);
    ctx.fillStyle = "rgba(235, 130, 70, 0.25)";
    ctx.fillRect(0, y + 5, W, 3);

    bctx.fillStyle = "#484848";
    bctx.fillRect(0, y - 4, W, 8);
    bctx.fillStyle = "#B8B8B8";
    bctx.fillRect(0, y + 4, W, 4);
  });

  // Intertank vertical corrugated stringer ribs (y: 480..880)
  const ribs = 96;
  for (let i = 0; i < ribs; i++) {
    const rx = (i / ribs) * W;
    const rw = W / ribs;
    ctx.fillStyle = i % 2 === 0 ? "rgba(50, 16, 4, 0.34)" : "rgba(240, 135, 72, 0.18)";
    ctx.fillRect(rx, 480, rw * 0.55, 400);

    bctx.fillStyle = "#D8D8D8";
    bctx.fillRect(rx, 480, rw * 0.48, 400);
    bctx.fillStyle = "#303030";
    bctx.fillRect(rx + rw * 0.48, 480, rw * 0.52, 400);
  }

  // Subtle vertical barrel stringers across LOX and LH2 tanks
  for (let i = 0; i < 64; i++) {
    const rx = (i / 64) * W;
    ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    ctx.fillRect(rx, 0, 2, H);
    bctx.fillStyle = "#969696";
    bctx.fillRect(rx, 0, 3, H);
  }

  // Dark metallic intertank avionics & sensor panels
  [180, 440, 700, 920].forEach((px) => {
    ctx.fillStyle = "#1E2430";
    ctx.fillRect(px, 610, 48, 95);
    ctx.strokeStyle = "#C7CDD8";
    ctx.lineWidth = 2;
    ctx.strokeRect(px, 610, 48, 95);
    bctx.fillStyle = "#E0E0E0";
    bctx.fillRect(px, 610, 48, 95);
  });

  // Crisp aerospace stencils (UNITED STATES, ARTEMIS II, station numbers)
  ctx.save();
  ctx.fillStyle = "rgba(236, 240, 248, 0.78)";
  ctx.font = "bold 26px monospace";
  ctx.letterSpacing = "6px";

  // Vertical UNITED STATES on two opposite quadrants
  [256, 768].forEach((cx) => {
    const chars = "UNITED STATES".split("");
    chars.forEach((ch, idx) => {
      ctx.fillText(ch, cx - 10, 960 + idx * 44);
    });
  });

  ctx.font = "bold 14px monospace";
  ctx.fillStyle = "rgba(236, 240, 248, 0.72)";
  const stations = [
    [220, "LOX TANK · STA 2410"],
    [455, "FWD INTERTANK FLANGE"],
    [865, "AFT INTERTANK FLANGE"],
    [1120, "LH2 TANK · STA 1640"],
    [1520, "SYSTEM TUNNEL · LV-002"],
    [1830, "AFT MANIFOLD INTERFACE"],
  ] as const;
  stations.forEach(([sy, label]) => {
    ctx.fillText(label, 64, sy);
    ctx.fillText(label, 576, sy);
  });
  ctx.restore();

  // Photogrammetry calibration targets
  const targetCoords = [
    [120, 260], [380, 260], [640, 260], [900, 260],
    [120, 540], [380, 540], [640, 540], [900, 540],
    [120, 820], [380, 820], [640, 820], [900, 820],
    [160, 1220], [480, 1220], [680, 1220], [920, 1220],
    [160, 1620], [480, 1620], [680, 1620], [920, 1620],
  ];
  targetCoords.forEach(([tx, ty]) => drawCalibrationTarget(ctx, tx, ty, 11));

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = 8;

  coreCache = { map, bumpMap };
  return coreCache;
}

/** 2. Twin Solid Rocket Boosters (SRB) — 5 Segments, Field Joints, Roll Checkerboards, Stencils */
export function getSrbTextures(): TexturePair {
  if (srbCache) return srbCache;

  const W = 1024;
  const H = 2048;

  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  // Painted steel white casing
  ctx.fillStyle = "#E6EAF2";
  ctx.fillRect(0, 0, W, H);
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, W, H);

  // Subtle metallic panel sheen variations
  for (let i = 0; i < 40; i++) {
    const y = (i / 40) * H;
    ctx.fillStyle = i % 2 === 0 ? "rgba(18, 24, 38, 0.025)" : "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(0, y, W, H / 40);
  }

  // 5 SRB segment field joints with bolted tang/clevis bands
  const jointsY = [360, 740, 1120, 1500, 1840];
  jointsY.forEach((jy, idx) => {
    ctx.fillStyle = "#C5CCD9";
    ctx.fillRect(0, jy - 14, W, 28);
    ctx.fillStyle = "#6B7488";
    ctx.fillRect(0, jy - 3, W, 6);

    bctx.fillStyle = "#E2E2E2";
    bctx.fillRect(0, jy - 12, W, 24);
    bctx.fillStyle = "#2A2A2A";
    bctx.fillRect(0, jy - 2, W, 4);

    // 96 pin-retainer bolts along each field joint
    for (let b = 0; b < 96; b++) {
      const bx = (b / 96) * W + 4;
      ctx.fillStyle = "#2D3444";
      ctx.fillRect(bx, jy - 9, 4, 4);
      ctx.fillRect(bx, jy + 5, 4, 4);
      bctx.fillStyle = "#FFFFFF";
      bctx.fillRect(bx, jy - 9, 4, 4);
    }

    ctx.fillStyle = "#181E2C";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`FIELD JOINT 0${idx + 1} · RSRMV`, 42, jy - 22);
    ctx.fillText(`FIELD JOINT 0${idx + 1} · RSRMV`, 554, jy - 22);
  });

  // Iconic NASA Roll-Pattern Black Bands & Checkerboard
  ctx.fillStyle = "#121620";
  ctx.fillRect(0, 150, W, 72);
  ctx.fillRect(0, 1620, W, 68);

  // Checkerboard roll tracking band at y = 240
  const checks = 16;
  const cw = W / checks;
  for (let c = 0; c < checks; c++) {
    if (c % 2 === 0) {
      ctx.fillStyle = "#121620";
      ctx.fillRect(c * cw, 222, cw, 38);
    }
  }

  // Orange-red ordnance / separation warning stripes
  ctx.fillStyle = "#D4512A";
  ctx.fillRect(0, 128, W, 10);
  ctx.fillRect(0, 1700, W, 10);

  // Vertical UNITED STATES & NASA stencils
  ctx.save();
  ctx.fillStyle = "#151A26";
  ctx.font = "bold 30px monospace";
  "UNITED STATES".split("").forEach((ch, idx) => {
    ctx.fillText(ch, 240, 440 + idx * 48);
  });
  "ARTEMIS II".split("").forEach((ch, idx) => {
    ctx.fillText(ch, 760, 520 + idx * 52);
  });
  ctx.restore();

  // Photogrammetry targets on SRBs
  [300, 620, 940, 1320, 1760].forEach((ty) => {
    drawCalibrationTarget(ctx, 180, ty, 13);
    drawCalibrationTarget(ctx, 512, ty, 13);
    drawCalibrationTarget(ctx, 840, ty, 13);
  });

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = 8;

  srbCache = { map, bumpMap };
  return srbCache;
}

/** 3. Orion Crew Module Thermal Tile Backshell + Hatch + Windows + Stencils */
export function getOrionTextures(): TexturePair {
  if (orionCache) return orionCache;

  const W = 1024;
  const H = 1024;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  // Metallic silver-grey thermal backshell coating
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#CFD6E3");
  grad.addColorStop(0.5, "#DEE4F0");
  grad.addColorStop(1, "#B8C1D1");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, W, H);

  // Thermal Protection System (TPS) tile grid + staggered brick lines
  const rows = 28;
  const cols = 36;
  const rh = H / rows;
  const cw = W / cols;
  ctx.strokeStyle = "rgba(25, 32, 48, 0.22)";
  ctx.lineWidth = 1.5;
  bctx.strokeStyle = "#3A3A3A";
  bctx.lineWidth = 2;

  for (let r = 0; r < rows; r++) {
    const y = r * rh;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    bctx.beginPath();
    bctx.moveTo(0, y);
    bctx.lineTo(W, y);
    bctx.stroke();

    const offset = (r % 2) * (cw * 0.5);
    for (let c = 0; c < cols; c++) {
      const x = (c * cw + offset) % W;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rh);
      ctx.stroke();
      bctx.beginPath();
      bctx.moveTo(x, y);
      bctx.lineTo(x, y + rh);
      bctx.stroke();
    }
  }

  // 4 Forward Crew Viewport Windows (dark tinted fused silica glass with aluminum bezels)
  [180, 340, 680, 840].forEach((wx) => {
    ctx.fillStyle = "#3E485C";
    ctx.fillRect(wx - 28, 340, 56, 42);
    ctx.fillStyle = "#081020";
    ctx.fillRect(wx - 22, 346, 44, 30);
    // Specular window glint
    ctx.fillStyle = "rgba(157, 184, 255, 0.35)";
    ctx.fillRect(wx - 18, 349, 14, 24);

    bctx.fillStyle = "#202020";
    bctx.fillRect(wx - 24, 344, 48, 34);
  });

  // Side Crew Access Hatch
  ctx.strokeStyle = "#252D3F";
  ctx.lineWidth = 4;
  ctx.strokeRect(460, 480, 104, 130);
  ctx.fillStyle = "#182030";
  ctx.font = "bold 13px monospace";
  ctx.fillText("ORION · INTEGRITY", 448, 462);
  ctx.fillText("MPCV-002 · ARTEMIS II", 438, 636);

  // Reaction Control System (RCS) thruster ports
  [
    [120, 740], [150, 740],
    [410, 740], [440, 740],
    [620, 740], [650, 740],
    [880, 740], [910, 740],
  ].forEach(([rx, ry]) => {
    ctx.fillStyle = "#10141F";
    ctx.beginPath();
    ctx.arc(rx, ry, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8C96AC";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;

  orionCache = { map, bumpMap };
  return orionCache;
}

/** 4. Fairing / LVSA / ICPS Composite Panel Texture + Bump */
export function getFairingTextures(): TexturePair {
  if (fairingCache) return fairingCache;

  const W = 1024;
  const H = 1024;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  ctx.fillStyle = "#E2E7F0";
  ctx.fillRect(0, 0, W, H);
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, W, H);

  // Vertical & horizontal aerospace panel seams + rivets
  for (let x = 0; x < W; x += 128) {
    ctx.fillStyle = "#8D97AB";
    ctx.fillRect(x, 0, 3, H);
    bctx.fillStyle = "#383838";
    bctx.fillRect(x, 0, 4, H);
  }
  for (let y = 0; y < H; y += 128) {
    ctx.fillStyle = "#9BA5B8";
    ctx.fillRect(0, y, W, 3);
    bctx.fillStyle = "#404040";
    bctx.fillRect(0, y, W, 4);
  }

  ctx.fillStyle = "#1C2333";
  ctx.font = "bold 16px monospace";
  ctx.fillText("ESM FAIRING · JETTISON PANEL", 64, 512);
  ctx.fillText("ICPS · CRYOGENIC STAGE", 560, 512);

  drawCalibrationTarget(ctx, 256, 256, 14);
  drawCalibrationTarget(ctx, 768, 256, 14);
  drawCalibrationTarget(ctx, 256, 768, 14);
  drawCalibrationTarget(ctx, 768, 768, 14);

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;

  fairingCache = { map, bumpMap };
  return fairingCache;
}

/** 5. RS-25 / OMS Regeneratively Cooled Nozzle Bell Texture + Bump */
export function getNozzleBellTextures(): TexturePair {
  if (nozzleCache) return nozzleCache;

  const W = 512;
  const H = 512;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = W;
  colCanvas.height = H;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W;
  bumpCanvas.height = H;
  const bctx = bumpCanvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#4B5468");
  grad.addColorStop(0.35, "#2E3543");
  grad.addColorStop(0.75, "#232834");
  grad.addColorStop(1, "#3A2C28"); // Thermal bluing/tempering near exit lip
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  bctx.fillStyle = "#707070";
  bctx.fillRect(0, 0, W, H);

  // Fine vertical regenerative cooling tubes
  for (let x = 0; x < W; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.18)";
    ctx.fillRect(x, 0, 2, H);
    bctx.fillStyle = x % 8 === 0 ? "#C8C8C8" : "#303030";
    bctx.fillRect(x, 0, 2, H);
  }

  // Horizontal structural hat-bands / manifolds around the nozzle bell
  for (let y = 48; y < H; y += 56) {
    ctx.fillStyle = "#8C96AA";
    ctx.fillRect(0, y, W, 7);
    ctx.fillStyle = "#181C26";
    ctx.fillRect(0, y + 7, W, 3);
    bctx.fillStyle = "#FFFFFF";
    bctx.fillRect(0, y, W, 8);
  }

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;

  nozzleCache = { map, bumpMap };
  return nozzleCache;
}

/** 6. Crinkled Gold Kapton MLI Foil Bump Map */
export function getKaptonBumpMap(): THREE.CanvasTexture {
  if (kaptonBumpCache) return kaptonBumpCache;
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 420; i++) {
    const x1 = (i * 53) % S;
    const y1 = (i * 97) % S;
    const x2 = x1 + ((i % 7) - 3) * 18;
    const y2 = y1 + (((i * 3) % 7) - 3) * 18;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  kaptonBumpCache = tex;
  return tex;
}

/** 7. Solar Array Photovoltaic Cell Grid Texture */
export function getSolarPanelTexture(): THREE.CanvasTexture {
  if (solarCache) return solarCache;
  const W = 512;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0A1936";
  ctx.fillRect(0, 0, W, H);

  // Individual solar cells
  const cols = 8;
  const rows = 32;
  const cw = W / cols;
  const rh = H / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#10254F" : "#0D2044";
      ctx.fillRect(c * cw + 3, r * rh + 2, cw - 6, rh - 4);
      // Fine silver collector lines
      ctx.fillStyle = "rgba(157, 184, 255, 0.28)";
      ctx.fillRect(c * cw + cw * 0.5, r * rh + 2, 1.5, rh - 4);
    }
  }

  // Gold hinge / busbar lines at 1/3 and 2/3 panel length
  [H * 0.33, H * 0.66].forEach((hy) => {
    ctx.fillStyle = "#B58A42";
    ctx.fillRect(0, hy - 5, W, 10);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  solarCache = tex;
  return tex;
}

/** 8. Hot Incandescent Spark Texture (elongated bright core) */
export function getSparkTexture(): THREE.CanvasTexture {
  if (sparkTexCache) return sparkTexCache;
  const S = 64;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0.5, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255, 255, 255, 1)");
  g.addColorStop(0.22, "rgba(255, 230, 160, 0.95)");
  g.addColorStop(0.55, "rgba(255, 110, 50, 0.45)");
  g.addColorStop(1, "rgba(255, 60, 10, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  sparkTexCache = tex;
  return tex;
}

/** 9. Soft Billowing Exhaust Steam / Smoke Puff Texture */
export function getSmokePuffTexture(): THREE.CanvasTexture {
  if (smokeTexCache) return smokeTexCache;
  const S = 128;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(245, 248, 255, 0.95)");
  g.addColorStop(0.35, "rgba(220, 230, 250, 0.6)");
  g.addColorStop(0.7, "rgba(180, 195, 225, 0.2)");
  g.addColorStop(1, "rgba(150, 170, 210, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  smokeTexCache = tex;
  return tex;
}
```

### `components/journey/three/SLSRocket.tsx`

```tsx
"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp01, remapClamp, scrollState, smoothstep } from "@/lib/scroll/progress";
import {
  getCoreStageTextures,
  getFairingTextures,
  getKaptonBumpMap,
  getNozzleBellTextures,
  getOrionTextures,
  getSmokePuffTexture,
  getSolarPanelTexture,
  getSparkTexture,
  getSrbTextures,
} from "./rocketTextures";
import { WORLD_ANCHORS } from "./trajectory";

const SRB_OFFSETS: [-1 | 1, number][] = [
  [-1, -1.06],
  [1, 1.06],
];

const RS25_POS: [number, number][] = [
  [-0.27, -0.27],
  [0.27, -0.27],
  [-0.27, 0.27],
  [0.27, 0.27],
];

const CLAMP_Y = [1.8, 2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.2, 6.8, 7.4];
const SRB_RING_Y = [-2.9, -3.18, -3.45];
const BSM_ANGLES = [0.4, -0.4, Math.PI - 0.4, Math.PI + 0.4];
const FAIRING_ANGLES = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
const SOLAR_WING_ANGLES = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
const MACH_DIAMOND_Offsets = [-0.55, -1.25, -2.05, -2.95];

const STEAM_COUNT = 140;
const SPARK_COUNT = 260;
const PYRO_SPARK_COUNT = 120;

export function SLSRocket({
  rocketRef,
  reducedMotion,
}: {
  rocketRef: RefObject<THREE.Group | null>;
  reducedMotion: boolean;
}) {
  const coreStageRef = useRef<THREE.Group>(null);
  const leftSrbRef = useRef<THREE.Group>(null);
  const rightSrbRef = useRef<THREE.Group>(null);
  const lasRef = useRef<THREE.Group>(null);
  const fairingRefs = useRef<(THREE.Group | null)[]>([]);
  const solarWingRefs = useRef<(THREE.Group | null)[]>([]);
  const corePlumeRef = useRef<THREE.Group>(null);
  const srbPlumeLeftRef = useRef<THREE.Group>(null);
  const srbPlumeRightRef = useRef<THREE.Group>(null);
  const bsmLeftRef = useRef<THREE.Group>(null);
  const bsmRightRef = useRef<THREE.Group>(null);
  const vacuumPlumeRef = useRef<THREE.Group>(null);
  const rcsJetsRef = useRef<THREE.Group>(null);
  const maxQConeRef = useRef<THREE.Mesh>(null);
  const padSteamRef = useRef<THREE.Points>(null);
  const padSparksRef = useRef<THREE.Points>(null);
  const pyroSparksRef = useRef<THREE.Points>(null);
  const engineLightRef = useRef<THREE.PointLight>(null);

  const coreTex = useMemo(() => getCoreStageTextures(), []);
  const srbTex = useMemo(() => getSrbTextures(), []);
  const orionTex = useMemo(() => getOrionTextures(), []);
  const fairingTex = useMemo(() => getFairingTextures(), []);
  const nozzleTex = useMemo(() => getNozzleBellTextures(), []);
  const kaptonBump = useMemo(() => getKaptonBumpMap(), []);
  const solarTex = useMemo(() => getSolarPanelTexture(), []);
  const sparkTex = useMemo(() => getSparkTexture(), []);
  const smokeTex = useMemo(() => getSmokePuffTexture(), []);

  // Pre-seed pad acoustic deluge steam particles
  const steamData = useMemo(() => {
    const positions = new Float32Array(STEAM_COUNT * 3);
    const seeds = new Float32Array(STEAM_COUNT * 4);
    for (let i = 0; i < STEAM_COUNT; i++) {
      seeds[i * 4 + 0] = (i / STEAM_COUNT) * Math.PI * 2 + (i % 7) * 0.17;
      seeds[i * 4 + 1] = 2.8 + (i % 6) * 1.25;
      seeds[i * 4 + 2] = ((i * 19) % 13) / 13;
      seeds[i * 4 + 3] = (i % 17) / 17;
    }
    return { positions, seeds };
  }, []);

  // Pre-seed ROFI igniter + exhaust spark particles
  const sparkData = useMemo(() => {
    const positions = new Float32Array(SPARK_COUNT * 3);
    const seeds = new Float32Array(SPARK_COUNT * 4); // angle, radialSpeed, vy, phase
    for (let i = 0; i < SPARK_COUNT; i++) {
      seeds[i * 4 + 0] = ((i * 137.5) % 360) * (Math.PI / 180);
      seeds[i * 4 + 1] = 1.6 + ((i * 29) % 10) * 0.55;
      seeds[i * 4 + 2] = 3.2 + ((i * 43) % 9) * 0.65;
      seeds[i * 4 + 3] = (i % 31) / 31;
    }
    return { positions, seeds };
  }, []);

  // Pre-seed staging pyrotechnic ordnance sparks
  const pyroData = useMemo(() => {
    const positions = new Float32Array(PYRO_SPARK_COUNT * 3);
    const dirs = new Float32Array(PYRO_SPARK_COUNT * 3);
    for (let i = 0; i < PYRO_SPARK_COUNT; i++) {
      const a = (i / PYRO_SPARK_COUNT) * Math.PI * 2;
      const spd = 1.2 + (i % 5) * 0.65;
      dirs[i * 3 + 0] = Math.cos(a) * spd;
      dirs[i * 3 + 1] = (((i * 7) % 11) / 11 - 0.5) * 2.2;
      dirs[i * 3 + 2] = Math.sin(a) * spd;
    }
    return { positions, dirs };
  }, []);

  useFrame((state) => {
    const p = scrollState.current;
    const t = state.clock.elapsedTime;

    // 1. Pre-ignition ROFI sparks start at p=1.35, full liftoff thrust builds at p=1.78..2.04
    const rofiActive = smoothstep(1.32, 1.65, p) * (1 - smoothstep(3.1, 3.6, p));
    const ignitionBuild = smoothstep(1.75, 2.02, p);
    const coreCutoff = 1 - smoothstep(6.75, 7.12, p);
    const srbBurnFade = 1 - smoothstep(4.52, 5.1, p);

    const flicker = reducedMotion
      ? 1
      : 0.92 + 0.08 * Math.sin(t * 54) + 0.05 * Math.cos(t * 37);
    const coreThrust = ignitionBuild * coreCutoff;
    const srbThrust = ignitionBuild * srbBurnFade;

    if (engineLightRef.current) {
      engineLightRef.current.intensity =
        (rofiActive * 6 + coreThrust * 22 + srbThrust * 30) * flicker;
    }

    // Core RS-25 Plume + Mach Shock Diamonds
    if (corePlumeRef.current) {
      corePlumeRef.current.visible = coreThrust > 0.01;
      const s = Math.max(0.01, coreThrust);
      corePlumeRef.current.scale.set(
        0.88 + 0.12 * flicker,
        s * (1.08 + 0.14 * flicker),
        0.88 + 0.12 * flicker,
      );
    }

    // SRB Plumes
    if (srbPlumeLeftRef.current) {
      srbPlumeLeftRef.current.visible = srbThrust > 0.01;
      const s = Math.max(0.01, srbThrust);
      srbPlumeLeftRef.current.scale.set(0.92 * flicker, s * (1.06 + 0.15 * flicker), 0.92 * flicker);
    }
    if (srbPlumeRightRef.current) {
      srbPlumeRightRef.current.visible = srbThrust > 0.01;
      const s = Math.max(0.01, srbThrust);
      srbPlumeRightRef.current.scale.set(0.92 * flicker, s * (1.06 + 0.15 * flicker), 0.92 * flicker);
    }

    // 2. SRB separation (beat 5: ascent-3, progress 4.52 -> 5.95) + BSM separation motor jets
    const srbSep = remapClamp(p, 4.52, 5.95);
    const bsmFire = smoothstep(4.5, 4.58, p) * (1 - smoothstep(4.85, 5.15, p));
    const srbVisible = p < 6.05;
    SRB_OFFSETS.forEach(([side], idx) => {
      const ref = idx === 0 ? leftSrbRef.current : rightSrbRef.current;
      const bsmRef = idx === 0 ? bsmLeftRef.current : bsmRightRef.current;
      if (!ref) return;
      ref.visible = srbVisible;
      const lateral = side * (1.06 + srbSep * 7.8);
      const drop = -srbSep * srbSep * 18.5;
      const roll = side * srbSep * 0.9;
      ref.position.set(lateral, 3.8 + drop, -srbSep * 2.6);
      ref.rotation.set(srbSep * 0.36, 0, -roll);
      const fadeScale = 1 - smoothstep(5.55, 6.05, p);
      ref.scale.setScalar(Math.max(0.001, fadeScale));

      if (bsmRef) {
        bsmRef.visible = bsmFire > 0.02;
        bsmRef.scale.setScalar(Math.max(0.01, bsmFire * flicker));
      }
    });

    // 3. LAS tower jettison (progress 4.32 -> 5.1)
    if (lasRef.current) {
      const lasSep = remapClamp(p, 4.32, 5.1);
      lasRef.current.visible = p < 5.15;
      lasRef.current.position.set(lasSep * 2.3, 12.1 + lasSep * 14.5, -lasSep * 2.1);
      lasRef.current.rotation.set(lasSep * 0.42, 0, -lasSep * 0.35);
      lasRef.current.scale.setScalar(Math.max(0.001, 1 - smoothstep(4.85, 5.15, p)));
    }

    // 4. Fairing panels jettison (beat 6: ascent-4, progress 5.55 -> 6.35)
    const fairingSep = remapClamp(p, 5.55, 6.35);
    fairingRefs.current.forEach((panel, i) => {
      if (!panel) return;
      panel.visible = p < 6.4;
      const angle = FAIRING_ANGLES[i];
      const radial = fairingSep * 4.4;
      panel.position.set(
        Math.sin(angle) * radial,
        10.6 - fairingSep * 6.6,
        Math.cos(angle) * radial,
      );
      panel.rotation.set(
        Math.cos(angle) * fairingSep * 0.75,
        angle,
        -Math.sin(angle) * fairingSep * 0.75,
      );
      panel.scale.setScalar(Math.max(0.001, 1 - smoothstep(6.0, 6.4, p)));
    });

    // 5. Core stage + ICPS separation (beat 7: deep-space, progress 6.72 -> 7.45)
    if (coreStageRef.current) {
      const coreSep = remapClamp(p, 6.72, 7.45);
      coreStageRef.current.visible = p < 7.5;
      coreStageRef.current.position.set(0, -coreSep * 16.5, -coreSep * 4.2);
      coreStageRef.current.rotation.set(coreSep * 0.3, 0, coreSep * 0.15);
      coreStageRef.current.scale.setScalar(Math.max(0.001, 1 - smoothstep(7.15, 7.5, p)));
    }

    // 6. Orion 4-wing Solar Array deployment (progress 6.82 -> 7.55)
    const wingDeploy = smoothstep(6.82, 7.55, p);
    solarWingRefs.current.forEach((wing) => {
      if (!wing) return;
      wing.visible = p > 5.65;
      wing.rotation.x = THREE.MathUtils.lerp(Math.PI * 0.48, 0.1, wingDeploy);
      wing.scale.setScalar(clamp01((p - 5.65) / 0.25));
    });

    // 7. Orion OMS-E Vacuum Plume + Lunar Orbit Insertion RCS Jets (beats 7..8.4 & 13)
    if (vacuumPlumeRef.current) {
      const tli = smoothstep(6.85, 7.15, p) * (1 - smoothstep(8.15, 8.65, p));
      const marsBurn = smoothstep(12.55, 12.95, p) * (1 - smoothstep(13.6, 14.0, p));
      const vacThrust = Math.max(tli, marsBurn);
      vacuumPlumeRef.current.visible = vacThrust > 0.02;
      vacuumPlumeRef.current.scale.set(
        0.9,
        Math.max(0.01, vacThrust * (1 + 0.08 * flicker)),
        0.9,
      );
    }
    if (rcsJetsRef.current) {
      const lunarInsertion = smoothstep(7.25, 7.55, p) * (1 - smoothstep(8.35, 8.75, p));
      rcsJetsRef.current.visible = lunarInsertion > 0.02;
      rcsJetsRef.current.scale.setScalar(Math.max(0.01, lunarInsertion * flicker));
    }

    // 8. Max-Q vapor shock cone (beat 4: ascent-2, progress 3.45 -> 4.45)
    if (maxQConeRef.current) {
      const maxQ = smoothstep(3.45, 3.88, p) * (1 - smoothstep(4.15, 4.5, p));
      maxQConeRef.current.visible = maxQ > 0.02;
      const mat = maxQConeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = maxQ * 0.28 * flicker;
      maxQConeRef.current.scale.setScalar(0.96 + 0.05 * flicker);
    }

    // 9. Pad Acoustic Deluge Steam Cloud (anchored at LC-39B)
    if (padSteamRef.current) {
      const steamActive = smoothstep(1.72, 1.98, p) * (1 - smoothstep(2.75, 3.35, p));
      padSteamRef.current.visible = steamActive > 0.01;
      if (steamActive > 0.01) {
        const posAttr = padSteamRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const { seeds } = steamData;
        const drift = Math.max(0, p - 1.72) * 1.5;
        for (let i = 0; i < STEAM_COUNT; i++) {
          const ang = seeds[i * 4 + 0];
          const spd = seeds[i * 4 + 1];
          const hBias = seeds[i * 4 + 2];
          const phase = seeds[i * 4 + 3];
          const cyc = ((reducedMotion ? 0.35 : t * 0.48) + phase + drift) % 1;
          const radius = 1.0 + cyc * spd * 4.2;
          arr[i * 3 + 0] = Math.cos(ang) * radius;
          arr[i * 3 + 1] = 0.25 + cyc * 2.8 + hBias * 1.6;
          arr[i * 3 + 2] = Math.sin(ang) * radius;
        }
        posAttr.needsUpdate = true;
        const pMat = padSteamRef.current.material as THREE.PointsMaterial;
        pMat.opacity = steamActive * 0.46;
      }
    }

    // 10. ROFI Igniter Sparks & Exhaust Sparks ("tia lửa")
    if (padSparksRef.current) {
      padSparksRef.current.visible = rofiActive > 0.01;
      if (rofiActive > 0.01) {
        const posAttr = padSparksRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const { seeds } = sparkData;
        const rocketLiftY = p < 1.85 ? 0 : Math.min(28, (p - 1.85) * 32);
        for (let i = 0; i < SPARK_COUNT; i++) {
          const ang = seeds[i * 4 + 0];
          const rSpd = seeds[i * 4 + 1];
          const vSpd = seeds[i * 4 + 2];
          const phase = seeds[i * 4 + 3];
          const life = ((reducedMotion ? 0.25 : t * 1.85) + phase) % 1;

          // Sparks shoot down from the engine nozzles, hit the flame trench, and ricochet outward
          const nozzleX = Math.cos(ang) * 0.75;
          const nozzleZ = Math.sin(ang) * 0.75;
          const rawY = rocketLiftY + 0.15 - life * vSpd * 2.4;
          const bounce = rawY < 0.1 ? Math.abs(rawY) * 0.45 : 0;
          const outR = life * rSpd * (rawY < 0.1 ? 3.2 : 1.3);

          arr[i * 3 + 0] = nozzleX + Math.cos(ang) * outR;
          arr[i * 3 + 1] = Math.max(0.08, rawY) + bounce;
          arr[i * 3 + 2] = nozzleZ + Math.sin(ang) * outR;
        }
        posAttr.needsUpdate = true;
        const sMat = padSparksRef.current.material as THREE.PointsMaterial;
        sMat.opacity = Math.min(1, rofiActive * 1.15);
      }
    }

    // 11. Staging Pyrotechnic Sparks (SRB sep at 4.55, Fairing sep at 5.58, Core sep at 6.75)
    if (pyroSparksRef.current) {
      const srbBurst = 1 - clamp01(Math.abs(p - 4.62) / 0.22);
      const fairBurst = 1 - clamp01(Math.abs(p - 5.65) / 0.22);
      const coreBurst = 1 - clamp01(Math.abs(p - 6.8) / 0.22);
      const burst = Math.max(srbBurst, fairBurst, coreBurst);

      pyroSparksRef.current.visible = burst > 0.02;
      if (burst > 0.02) {
        const yOrigin = coreBurst > 0.1 ? 9.8 : fairBurst > 0.1 ? 10.6 : 6.2;
        const expand = (1 - burst * 0.5) * 2.8 + (reducedMotion ? 0 : (t * 3.2) % 1.4);
        const posAttr = pyroSparksRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const { dirs } = pyroData;
        for (let i = 0; i < PYRO_SPARK_COUNT; i++) {
          arr[i * 3 + 0] = dirs[i * 3 + 0] * expand;
          arr[i * 3 + 1] = yOrigin + dirs[i * 3 + 1] * expand;
          arr[i * 3 + 2] = dirs[i * 3 + 2] * expand;
        }
        posAttr.needsUpdate = true;
        const m = pyroSparksRef.current.material as THREE.PointsMaterial;
        m.opacity = burst * 0.95;
      }
    }
  });

  return (
    <>
      {/* ─── PAD ACOUSTIC DELUGE STEAM CLOUD ─── */}
      <points ref={padSteamRef} position={WORLD_ANCHORS.pad} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[steamData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={smokeTex}
          size={4.8}
          transparent
          opacity={0.45}
          depthWrite={false}
          color="#DCE6FF"
          blending={THREE.NormalBlending}
        />
      </points>

      {/* ─── ROFI IGNITER & EXHAUST SPARKS ("TIA LỬA") ─── */}
      <points ref={padSparksRef} position={WORLD_ANCHORS.pad} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={sparkTex}
          size={0.55}
          transparent
          opacity={0.95}
          depthWrite={false}
          color="#FFB464"
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* ─── MAIN SLS BLOCK 1 + ORION SPACECRAFT ASSEMBLY ─── */}
      <group ref={rocketRef}>
        <pointLight
          ref={engineLightRef}
          position={[0, -0.8, 1.0]}
          color="#FF8E52"
          intensity={0}
          distance={52}
          decay={1.7}
        />

        {/* Pyrotechnic Staging Ordnance Sparks */}
        <points ref={pyroSparksRef} visible={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pyroData.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={sparkTex}
            size={0.42}
            transparent
            opacity={0.9}
            depthWrite={false}
            color="#FFD28A"
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* ═══════════════════ CORE STAGE + ICPS ═══════════════════ */}
        <group ref={coreStageRef}>
          {/* Aft Engine Compartment with thermal protection ribs */}
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.642, 0.68, 1.32, 36]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.015}
              color="#DCE2EC"
              roughness={0.38}
              metalness={0.48}
            />
          </mesh>
          {/* Aft boat-tail heat shield baseplate */}
          <mesh position={[0, 0.21, 0]}>
            <cylinderGeometry args={[0.66, 0.62, 0.12, 32]} />
            <meshStandardMaterial color="#1A202C" roughness={0.6} metalness={0.5} />
          </mesh>

          {/* 4 RS-25 Liquid Hydrogen / Liquid Oxygen Main Engines */}
          {RS25_POS.map(([ex, ez], idx) => (
            <group key={idx} position={[ex, 0.08, ez]}>
              {/* Gimbal actuator collar */}
              <mesh position={[0, 0.16, 0]}>
                <cylinderGeometry args={[0.09, 0.13, 0.14, 16]} />
                <meshStandardMaterial color="#586278" roughness={0.3} metalness={0.85} />
              </mesh>
              {/* Contoured Regeneratively-Cooled Nozzle Bell */}
              <mesh position={[0, -0.08, 0]}>
                <cylinderGeometry args={[0.11, 0.22, 0.46, 24, 1, true]} />
                <meshStandardMaterial
                  map={nozzleTex.map}
                  bumpMap={nozzleTex.bumpMap}
                  bumpScale={0.025}
                  roughness={0.28}
                  metalness={0.88}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Nozzle structural stiffener exit lip */}
              <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.218, 0.014, 10, 24]} />
                <meshStandardMaterial color="#8E98AD" roughness={0.25} metalness={0.9} />
              </mesh>
              {/* Glowing inner combustion throat */}
              <mesh position={[0, -0.12, 0]}>
                <cylinderGeometry args={[0.09, 0.18, 0.28, 16]} />
                <meshBasicMaterial color="#DCE6FF" transparent opacity={0.65} />
              </mesh>
            </group>
          ))}

          {/* Main SOFI Cryogenic Core Tank (LOX + Intertank + LH2) */}
          <mesh position={[0, 4.72, 0]}>
            <cylinderGeometry args={[0.64, 0.64, 6.45, 48]} />
            <meshStandardMaterial
              map={coreTex.map}
              bumpMap={coreTex.bumpMap}
              bumpScale={0.032}
              roughness={0.68}
              metalness={0.12}
            />
          </mesh>

          {/* Raised Intertank Corrugated Thrust Flanges & Avionics Umbilical Plate */}
          <mesh position={[0, 5.65, 0]}>
            <cylinderGeometry args={[0.658, 0.658, 0.12, 48]} />
            <meshStandardMaterial color="#963D16" roughness={0.6} metalness={0.22} />
          </mesh>
          <mesh position={[0, 6.38, 0]}>
            <cylinderGeometry args={[0.658, 0.658, 0.12, 48]} />
            <meshStandardMaterial color="#963D16" roughness={0.6} metalness={0.22} />
          </mesh>
          {/* Intertank crossbeam thrust structure */}
          <mesh position={[0, 6.02, 0]}>
            <boxGeometry args={[1.38, 0.26, 0.24]} />
            <meshStandardMaterial color="#7C3110" roughness={0.55} metalness={0.35} />
          </mesh>

          {/* 2 External LO2 Feedlines & System Tunnels + 10 Bracket Clamps */}
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.635, 3.85, 0.18]}>
                <cylinderGeometry args={[0.042, 0.042, 5.3, 12]} />
                <meshStandardMaterial color="#C86330" roughness={0.55} metalness={0.3} />
              </mesh>
              <mesh position={[side * 0.61, 4.4, -0.22]}>
                <boxGeometry args={[0.06, 6.0, 0.09]} />
                <meshStandardMaterial color="#A84A1E" roughness={0.6} metalness={0.25} />
              </mesh>
              {CLAMP_Y.map((cy, ci) => (
                <mesh key={ci} position={[side * 0.635, cy, 0.18]}>
                  <cylinderGeometry args={[0.056, 0.056, 0.05, 12]} />
                  <meshStandardMaterial color="#D6DCE8" roughness={0.35} metalness={0.75} />
                </mesh>
              ))}
            </group>
          ))}

          {/* Forward Core Stage Skirt Ring */}
          <mesh position={[0, 7.82, 0]}>
            <cylinderGeometry args={[0.65, 0.65, 0.26, 36]} />
            <meshStandardMaterial color="#181D29" roughness={0.42} metalness={0.55} />
          </mesh>

          {/* Launch Vehicle Stage Adapter (LVSA) Frustum */}
          <mesh position={[0, 8.48, 0]}>
            <cylinderGeometry args={[0.48, 0.642, 1.1, 36]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.018}
              roughness={0.38}
              metalness={0.35}
            />
          </mesh>

          {/* Interim Cryogenic Propulsion Stage (ICPS) */}
          <mesh position={[0, 9.36, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.72, 36]} />
            <meshStandardMaterial color="#1D2434" roughness={0.35} metalness={0.62} />
          </mesh>
          <mesh position={[0, 9.88, 0]}>
            <cylinderGeometry args={[0.505, 0.48, 0.34, 36]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.015}
              roughness={0.36}
              metalness={0.45}
            />
          </mesh>

          {/* Core RS-25 Supersonic Exhaust Plume + Pulsing Mach Shock Diamonds */}
          <group ref={corePlumeRef} position={[0, -0.15, 0]} visible={false}>
            {/* Outer hydrogen-oxygen plasma envelope */}
            <mesh position={[0, -3.1, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.78, 6.2, 24, 1, true]} />
              <meshBasicMaterial
                color="#FF6A3D"
                transparent
                opacity={0.68}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Inner high-velocity blue-white core */}
            <mesh position={[0, -2.1, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.44, 4.2, 20, 1, true]} />
              <meshBasicMaterial
                color="#DCE6FF"
                transparent
                opacity={0.92}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* 4 Supersonic Mach Shock Diamonds */}
            {MACH_DIAMOND_Offsets.map((dy, di) => (
              <mesh key={di} position={[0, dy, 0]} scale={[1 - di * 0.16, 1.35, 1 - di * 0.16]}>
                <octahedronGeometry args={[0.26, 1]} />
                <meshBasicMaterial
                  color="#FFFFFF"
                  transparent
                  opacity={0.85 - di * 0.15}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* ═══════════════════ TWIN 5-SEGMENT SOLID ROCKET BOOSTERS ═══════════════════ */}
        {SRB_OFFSETS.map(([side, xOff], idx) => (
          <group
            key={side}
            ref={idx === 0 ? leftSrbRef : rightSrbRef}
            position={[xOff, 3.8, 0]}
          >
            {/* Main 5-segment textured steel motor casing */}
            <mesh>
              <cylinderGeometry args={[0.315, 0.315, 7.25, 36]} />
              <meshStandardMaterial
                map={srbTex.map}
                bumpMap={srbTex.bumpMap}
                bumpScale={0.024}
                roughness={0.36}
                metalness={0.32}
              />
            </mesh>

            {/* External System Tunnel cable raceway running vertically down booster */}
            <mesh position={[-side * 0.28, 0, 0.15]}>
              <boxGeometry args={[0.05, 6.9, 0.07]} />
              <meshStandardMaterial color="#D8DEE8" roughness={0.4} metalness={0.45} />
            </mesh>

            {/* 3 Aft External Stiffener Rings */}
            {SRB_RING_Y.map((ry, ri) => (
              <mesh key={ri} position={[0, ry, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.322, 0.016, 10, 32]} />
                <meshStandardMaterial color="#CFD6E4" roughness={0.35} metalness={0.55} />
              </mesh>
            ))}

            {/* Forward Skirt & Ogive Nose Frustum + Aero Tip */}
            <mesh position={[0, 4.02, 0]}>
              <cylinderGeometry args={[0.14, 0.315, 0.82, 32]} />
              <meshStandardMaterial color="#EAEEF6" roughness={0.34} metalness={0.3} />
            </mesh>
            <mesh position={[0, 4.55, 0]}>
              <coneGeometry args={[0.14, 0.32, 24]} />
              <meshStandardMaterial color="#181E2B" roughness={0.35} metalness={0.6} />
            </mesh>

            {/* 4 Forward & 4 Aft Booster Separation Motor (BSM) Fairing Pods */}
            {BSM_ANGLES.map((ba, bi) => (
              <group key={bi} rotation={[0, ba, 0]}>
                <mesh position={[0.22, 3.85, 0]} rotation={[0, 0, -0.35]}>
                  <cylinderGeometry args={[0.025, 0.042, 0.22, 10]} />
                  <meshStandardMaterial color="#B8C2D4" roughness={0.4} metalness={0.6} />
                </mesh>
                <mesh position={[0.32, -3.68, 0]} rotation={[0, 0, 0.35]}>
                  <cylinderGeometry args={[0.03, 0.048, 0.26, 10]} />
                  <meshStandardMaterial color="#B8C2D4" roughness={0.4} metalness={0.6} />
                </mesh>
              </group>
            ))}

            {/* BSM Separation Thruster Flame Jets (fire during ascent-3 separation) */}
            <group ref={idx === 0 ? bsmLeftRef : bsmRightRef} visible={false}>
              <mesh position={[side * 0.55, 3.9, 0]} rotation={[0, 0, -side * 1.2]}>
                <coneGeometry args={[0.16, 0.95, 12]} />
                <meshBasicMaterial
                  color="#FF9E58"
                  transparent
                  opacity={0.9}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              <mesh position={[side * 0.62, -3.65, 0]} rotation={[0, 0, -side * 1.2]}>
                <coneGeometry args={[0.18, 1.05, 12]} />
                <meshBasicMaterial
                  color="#FF9E58"
                  transparent
                  opacity={0.9}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>

            {/* Flared Aft Booster Skirt + Carbon-Phenolic Gimbaled Nozzle */}
            <mesh position={[0, -3.74, 0]}>
              <cylinderGeometry args={[0.315, 0.395, 0.48, 32]} />
              <meshStandardMaterial color="#D4DAE6" roughness={0.4} metalness={0.42} />
            </mesh>
            <mesh position={[0, -4.1, 0]}>
              <cylinderGeometry args={[0.19, 0.29, 0.42, 24, 1, true]} />
              <meshStandardMaterial
                map={nozzleTex.map}
                bumpMap={nozzleTex.bumpMap}
                bumpScale={0.02}
                roughness={0.32}
                metalness={0.82}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Forward Thrust Attachment + Aft Diagonal Sway Struts */}
            <mesh position={[-side * 0.34, 2.25, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.055, 0.44, 12]} />
              <meshStandardMaterial color="#9BA5B8" metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={[-side * 0.34, -2.85, 0.14]} rotation={[0.3, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.46, 10]} />
              <meshStandardMaterial color="#8590A6" metalness={0.8} roughness={0.28} />
            </mesh>
            <mesh position={[-side * 0.34, -2.85, -0.14]} rotation={[-0.3, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.46, 10]} />
              <meshStandardMaterial color="#8590A6" metalness={0.8} roughness={0.28} />
            </mesh>

            {/* Roaring SRB Aluminized Propellant Flame Plume */}
            <group
              ref={idx === 0 ? srbPlumeLeftRef : srbPlumeRightRef}
              position={[0, -4.25, 0]}
              visible={false}
            >
              <mesh position={[0, -3.4, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.64, 6.8, 22, 1, true]} />
                <meshBasicMaterial
                  color="#FF7838"
                  transparent
                  opacity={0.84}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <mesh position={[0, -2.2, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.32, 4.5, 16, 1, true]} />
                <meshBasicMaterial
                  color="#FFF6E0"
                  transparent
                  opacity={0.96}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>
        ))}

        {/* ═══════════════════ ORION CREW & EUROPEAN SERVICE MODULE ═══════════════════ */}
        <group position={[0, 10.65, 0]}>
          {/* European Service Module (ESM) cylindrical bus with radiator panels */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.46, 0.46, 0.92, 32]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.016}
              color="#2A3346"
              roughness={0.32}
              metalness={0.78}
            />
          </mesh>

          {/* Crinkled Gold Kapton MLI Thermal Foil Collar & Aft Deck */}
          <mesh position={[0, -0.43, 0]}>
            <cylinderGeometry args={[0.45, 0.44, 0.16, 32]} />
            <meshStandardMaterial
              color="#D4A24C"
              bumpMap={kaptonBump}
              bumpScale={0.028}
              roughness={0.26}
              metalness={0.92}
            />
          </mesh>

          {/* OMS-E Main Gimbaled Engine Bell + 8 Auxiliary Thrusters */}
          <mesh position={[0, -0.64, 0]}>
            <cylinderGeometry args={[0.12, 0.23, 0.34, 24, 1, true]} />
            <meshStandardMaterial
              map={nozzleTex.map}
              bumpMap={nozzleTex.bumpMap}
              bumpScale={0.02}
              roughness={0.28}
              metalness={0.88}
              side={THREE.DoubleSide}
            />
          </mesh>
          {[0, 1, 2, 3].map((ai) => {
            const a = (ai * Math.PI) / 2 + Math.PI / 4;
            return (
              <mesh
                key={ai}
                position={[Math.cos(a) * 0.32, -0.54, Math.sin(a) * 0.32]}
              >
                <cylinderGeometry args={[0.035, 0.06, 0.14, 12]} />
                <meshStandardMaterial color="#707B90" roughness={0.3} metalness={0.85} />
              </mesh>
            );
          })}

          {/* Translucent Blue-White Vacuum Thruster Plume (TLI & Lunar/Mars Insertion) */}
          <group ref={vacuumPlumeRef} position={[0, -0.8, 0]} visible={false}>
            <mesh position={[0, -1.1, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.44, 2.2, 20, 1, true]} />
              <meshBasicMaterial
                color="#9DB8FF"
                transparent
                opacity={0.75}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.2, 1.2, 16, 1, true]} />
              <meshBasicMaterial
                color="#FFFFFF"
                transparent
                opacity={0.95}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* RCS Attitude Control Nitrogen/Hydrazine Puffs during Lunar Orbit Insertion */}
          <group ref={rcsJetsRef} visible={false}>
            {[-1, 1].map((s) => (
              <mesh
                key={s}
                position={[s * 0.62, 0.55, 0]}
                rotation={[0, 0, -s * (Math.PI / 2)]}
              >
                <coneGeometry args={[0.09, 0.48, 12, 1, true]} />
                <meshBasicMaterial
                  color="#DCE6FF"
                  transparent
                  opacity={0.72}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>

          {/* Orion Crew Module Tiled Backshell Cone (57.5° slope) */}
          <mesh position={[0, 0.78, 0]}>
            <cylinderGeometry args={[0.21, 0.495, 0.68, 36]} />
            <meshStandardMaterial
              map={orionTex.map}
              bumpMap={orionTex.bumpMap}
              bumpScale={0.022}
              roughness={0.3}
              metalness={0.55}
            />
          </mesh>
          {/* Avcoat Heatshield Base Ring */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.498, 0.468, 0.1, 36]} />
            <meshStandardMaterial color="#181D28" roughness={0.55} metalness={0.35} />
          </mesh>
          {/* Forward Docking Mechanism + Optical Navigation Ring */}
          <mesh position={[0, 1.18, 0]}>
            <cylinderGeometry args={[0.165, 0.21, 0.14, 24]} />
            <meshStandardMaterial color="#AEB7C8" roughness={0.26} metalness={0.85} />
          </mesh>
          <mesh position={[0, 1.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.155, 0.015, 10, 24]} />
            <meshStandardMaterial color="#D4A24C" roughness={0.25} metalness={0.9} />
          </mesh>

          {/* 4 Articulated X-Wing Solar Arrays with Photovoltaic Grid Texture */}
          {SOLAR_WING_ANGLES.map((ang, i) => (
            <group key={i} rotation={[0, ang, 0]} position={[0, 0.08, 0]}>
              <group
                ref={(el) => {
                  solarWingRefs.current[i] = el;
                }}
                position={[0, 0, 0.48]}
              >
                {/* Gimbal yoke & deployment scissor truss */}
                <mesh position={[0, 0, 0.18]}>
                  <boxGeometry args={[0.12, 0.05, 0.36]} />
                  <meshStandardMaterial color="#8E98AD" roughness={0.3} metalness={0.85} />
                </mesh>
                {/* Gold structural backbone boom */}
                <mesh position={[0, -0.01, 1.05]}>
                  <boxGeometry args={[0.05, 0.035, 1.95]} />
                  <meshStandardMaterial color="#C89B48" roughness={0.3} metalness={0.88} />
                </mesh>
                {/* High-detail Photovoltaic Cell Wing */}
                <mesh position={[0, 0.012, 1.12]}>
                  <boxGeometry args={[0.48, 0.018, 1.78]} />
                  <meshStandardMaterial
                    map={solarTex}
                    emissive="#0C1F45"
                    emissiveIntensity={0.35}
                    roughness={0.18}
                    metalness={0.82}
                  />
                </mesh>
              </group>
            </group>
          ))}
        </group>

        {/* ═══════════════════ SERVICE MODULE FAIRINGS (Jettison at Ascent-4) ═══════════════════ */}
        {FAIRING_ANGLES.map((ang, i) => (
          <group
            key={i}
            ref={(el) => {
              fairingRefs.current[i] = el;
            }}
            position={[0, 10.6, 0]}
            rotation={[0, ang, 0]}
          >
            <mesh position={[0, 0, 0.49]}>
              <cylinderGeometry args={[0.512, 0.512, 0.98, 16, 1, false, -0.98, 1.96]} />
              <meshStandardMaterial
                map={fairingTex.map}
                bumpMap={fairingTex.bumpMap}
                bumpScale={0.016}
                roughness={0.36}
                metalness={0.32}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* ═══════════════════ LAUNCH ABORT SYSTEM (LAS) TOWER ═══════════════════ */}
        <group ref={lasRef} position={[0, 12.1, 0]}>
          {/* Ogive protective shroud */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.17, 0.495, 1.02, 32]} />
            <meshStandardMaterial
              map={fairingTex.map}
              bumpMap={fairingTex.bumpMap}
              bumpScale={0.014}
              roughness={0.35}
              metalness={0.28}
            />
          </mesh>
          {/* LAS Abort Motor section + 4 Reverse-Flow Abort Nozzles */}
          <mesh position={[0, 1.26, 0]}>
            <cylinderGeometry args={[0.085, 0.165, 1.22, 24]} />
            <meshStandardMaterial color="#EAEFF7" roughness={0.34} metalness={0.3} />
          </mesh>
          {[0, 1, 2, 3].map((li) => {
            const la = (li * Math.PI) / 2 + Math.PI / 4;
            return (
              <mesh
                key={li}
                position={[Math.cos(la) * 0.15, 1.48, Math.sin(la) * 0.15]}
                rotation={[Math.sin(la) * 0.42, 0, -Math.cos(la) * 0.42]}
              >
                <cylinderGeometry args={[0.025, 0.052, 0.22, 12]} />
                <meshStandardMaterial color="#2C3446" roughness={0.3} metalness={0.85} />
              </mesh>
            );
          })}
          {/* Attitude Control Motor (ACM) ring + 8 radial ports + nose cone */}
          <mesh position={[0, 1.92, 0]}>
            <cylinderGeometry args={[0.08, 0.085, 0.16, 20]} />
            <meshStandardMaterial color="#242C3D" roughness={0.35} metalness={0.78} />
          </mesh>
          <mesh position={[0, 2.16, 0]}>
            <coneGeometry args={[0.08, 0.36, 20]} />
            <meshStandardMaterial color="#8B95AA" roughness={0.25} metalness={0.85} />
          </mesh>
        </group>

        {/* ═══════════════════ MAX-Q AERODYNAMIC SHOCK CONE ═══════════════════ */}
        <mesh ref={maxQConeRef} position={[0, 10.8, 0]} visible={false}>
          <coneGeometry args={[3.5, 5.4, 36, 1, true]} />
          <meshBasicMaterial
            color="#DCE6FF"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
}
```

### `components/journey/three/LaunchComplex.tsx`

```tsx
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { WORLD_ANCHORS } from "./trajectory";

const TOWER_BAYS = [0.6, 1.9, 3.2, 4.5, 5.8, 7.1, 8.4, 9.7, 11.0, 12.3];
const MAST_COORDS: [number, number][] = [
  [-12.5, -10.5],
  [12.5, -10.5],
  [0, 14.5],
];

const FLOODLIGHT_BEAMS: { pos: [number, number, number]; rot: [number, number, number]; color: string }[] = [
  { pos: [7.5, 0.4, 7.5], rot: [-0.55, 0.58, 0.35], color: "#DCE6FF" },
  { pos: [-7.8, 0.4, 7.8], rot: [-0.55, -0.58, -0.35], color: "#9DB8FF" },
  { pos: [8.2, 0.4, -6.8], rot: [0.52, -0.62, 0.35], color: "#DCE6FF" },
  { pos: [-8.2, 0.4, -6.8], rot: [0.52, 0.62, -0.35], color: "#9DB8FF" },
];

export function LaunchComplex() {
  const groupRef = useRef<THREE.Group>(null);
  const crewArmRef = useRef<THREE.Group>(null);
  const osmArmRef = useRef<THREE.Group>(null);
  const icpsArmRef = useRef<THREE.Group>(null);
  const intertankArmRef = useRef<THREE.Group>(null);
  const beaconRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Procedural steel deck plate bump texture
  const deckBump = useMemo(() => {
    const S = 256;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = "#484848";
    ctx.lineWidth = 2;
    for (let i = 0; i < S; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, S);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(S, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const p = scrollState.current;
    if (groupRef.current) {
      groupRef.current.visible = p < 4.4;
    }
    if (p >= 4.4) return;

    // Swing arms retract smoothly before T-0 (progress 1.4 -> 1.92)
    const retract = smoothstep(1.4, 1.92, p);
    if (crewArmRef.current) crewArmRef.current.rotation.y = retract * 1.18;
    if (osmArmRef.current) osmArmRef.current.rotation.y = retract * 0.95;
    if (icpsArmRef.current) icpsArmRef.current.rotation.y = retract * 1.05;
    if (intertankArmRef.current) intertankArmRef.current.rotation.y = retract * 0.88;

    // Subtle aviation beacon pulse on lightning towers
    const pulse = 0.55 + 0.45 * Math.sin(clock.elapsedTime * 3.2);
    beaconRefs.current.forEach((b) => {
      if (b) {
        const mat = b.material as THREE.MeshBasicMaterial;
        mat.opacity = pulse;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* ─── LC-39B PAD APRON, CRAWLERWAY & FLAME TRENCH ─── */}
      <group position={WORLD_ANCHORS.pad}>
        {/* Octagonal concrete pad perimeter apron */}
        <mesh position={[0, -0.95, 0]}>
          <cylinderGeometry args={[52, 60, 1.3, 48]} />
          <meshStandardMaterial
            color="#0B101A"
            bumpMap={deckBump}
            bumpScale={0.04}
            roughness={0.88}
            metalness={0.14}
          />
        </mesh>

        {/* Dual Crawlerway tracks leading toward VAB */}
        {[-2.4, 2.4].map((tx) => (
          <mesh key={tx} position={[tx - 8, -0.28, -22]} rotation={[0, 0.52, 0]}>
            <boxGeometry args={[2.6, 0.08, 42]} />
            <meshStandardMaterial color="#171E2E" roughness={0.92} metalness={0.08} />
          </mesh>
        ))}

        {/* Concrete Flame Trench Walls & Angled Flame Deflector Wedge */}
        <mesh position={[-3.8, -0.1, 0]}>
          <boxGeometry args={[2.2, 0.9, 14]} />
          <meshStandardMaterial color="#1D2536" roughness={0.82} metalness={0.2} />
        </mesh>
        <mesh position={[3.8, -0.1, 0]}>
          <boxGeometry args={[2.2, 0.9, 14]} />
          <meshStandardMaterial color="#1D2536" roughness={0.82} metalness={0.2} />
        </mesh>
        {/* Angled steel/refractory flame deflector under the rocket nozzles */}
        <mesh position={[0, -0.22, 0]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[4.8, 0.65, 3.6]} />
          <meshStandardMaterial color="#2E3648" roughness={0.65} metalness={0.45} />
        </mesh>

        {/* ─── MOBILE LAUNCHER PLATFORM (MLP) TWO-STORY DECK ─── */}
        <group position={[0, 0.18, 0]}>
          {/* Main steel deck platform */}
          <mesh position={[-0.8, 0, 0]}>
            <boxGeometry args={[8.6, 0.42, 9.4]} />
            <meshStandardMaterial
              color="#2A3346"
              bumpMap={deckBump}
              bumpScale={0.025}
              roughness={0.52}
              metalness={0.62}
            />
          </mesh>
          {/* 6 Mount Pedestals supporting the MLP */}
          {[
            [-3.8, -3.6],
            [2.4, -3.6],
            [-3.8, 0],
            [2.4, 0],
            [-3.8, 3.6],
            [2.4, 3.6],
          ].map(([px, pz], pi) => (
            <mesh key={pi} position={[px, -0.42, pz]}>
              <cylinderGeometry args={[0.24, 0.28, 0.65, 12]} />
              <meshStandardMaterial color="#3E485E" roughness={0.48} metalness={0.7} />
            </mesh>
          ))}

          {/* Blast deck coaming ring & SRB hold-down posts */}
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[3.4, 0.14, 3.2]} />
            <meshStandardMaterial color="#19202E" roughness={0.65} metalness={0.5} />
          </mesh>

          {/* 2 Tail Service Masts (TSMs) flanking the Core Stage aft section */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 1.62, 0.55, 0.55]}>
              <mesh>
                <boxGeometry args={[0.46, 0.88, 0.68]} />
                <meshStandardMaterial color="#D4DBE8" roughness={0.38} metalness={0.45} />
              </mesh>
              {/* Cryogenic umbilical shroud */}
              <mesh position={[-side * 0.28, 0.12, -0.18]} rotation={[0, 0, side * 0.35]}>
                <cylinderGeometry args={[0.09, 0.12, 0.55, 12]} />
                <meshStandardMaterial color="#7C879E" roughness={0.35} metalness={0.75} />
              </mesh>
            </group>
          ))}
        </group>

        {/* ─── MOBILE LAUNCHER UMBILICAL TOWER (ML-1, x = -3.45) ─── */}
        <group position={[-3.45, 0.38, 0]}>
          {/* 4 Heavy Corner Steel H-Columns */}
          {[
            [-0.92, -0.92],
            [0.92, -0.92],
            [-0.92, 0.92],
            [0.92, 0.92],
          ].map(([cx, cz], i) => (
            <mesh key={i} position={[cx, 6.85, cz]}>
              <boxGeometry args={[0.16, 13.7, 0.16]} />
              <meshStandardMaterial color="#68738A" roughness={0.42} metalness={0.72} />
            </mesh>
          ))}

          {/* Central Elevator & Utility Core Shaft */}
          <mesh position={[-0.18, 6.8, 0]}>
            <boxGeometry args={[0.72, 13.5, 0.78]} />
            <meshStandardMaterial color="#273042" roughness={0.55} metalness={0.58} />
          </mesh>

          {/* 10 Structural Bay Decks + Diagonal X-Bracing Trusses on All 4 Faces */}
          {TOWER_BAYS.map((by, idx) => (
            <group key={idx} position={[0, by, 0]}>
              {/* Floor deck grating */}
              <mesh>
                <boxGeometry args={[1.96, 0.1, 1.96]} />
                <meshStandardMaterial color="#4B556B" roughness={0.5} metalness={0.65} />
              </mesh>
              {/* Safety perimeter handrail */}
              <mesh position={[0, 0.18, 0]}>
                <boxGeometry args={[2.0, 0.03, 2.0]} />
                <meshStandardMaterial color="#8A95AB" roughness={0.4} metalness={0.7} />
              </mesh>

              {/* Diagonal truss braces on +Z and -Z faces */}
              {[-0.92, 0.92].map((fz) => (
                <group key={fz} position={[0, 0.65, fz]}>
                  <mesh rotation={[0, 0, 0.62]}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial color="#58637A" roughness={0.45} metalness={0.68} />
                  </mesh>
                  <mesh rotation={[0, 0, -0.62]}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial color="#58637A" roughness={0.45} metalness={0.68} />
                  </mesh>
                </group>
              ))}

              {/* Diagonal truss braces on +X and -X faces */}
              {[-0.92, 0.92].map((fx) => (
                <group key={fx} position={[fx, 0.65, 0]}>
                  <mesh rotation={[0.62, 0, 0]}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial color="#58637A" roughness={0.45} metalness={0.68} />
                  </mesh>
                  <mesh rotation={[-0.62, 0, 0]}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial color="#58637A" roughness={0.45} metalness={0.68} />
                  </mesh>
                </group>
              ))}
            </group>
          ))}

          {/* Tower Crown Platform + Hammerhead Jib Crane + Upper Fiberglass Mast */}
          <mesh position={[0, 13.75, 0]}>
            <boxGeometry args={[2.25, 0.32, 2.25]} />
            <meshStandardMaterial color="#78839B" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0.95, 14.22, 0]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[2.8, 0.18, 0.32]} />
            <meshStandardMaterial color="#C8603A" roughness={0.45} metalness={0.5} />
          </mesh>
          <mesh position={[-0.3, 14.95, 0]}>
            <cylinderGeometry args={[0.04, 0.11, 2.1, 12]} />
            <meshStandardMaterial color="#EAEFF7" roughness={0.35} metalness={0.3} />
          </mesh>

          {/* 1. Crew Access Arm (CAA) + White Room Cab (Orion Crew Module level y = 11.15) */}
          <group ref={crewArmRef} position={[0.92, 11.15, 0.15]}>
            {/* Enclosed walkway truss */}
            <mesh position={[1.08, 0, 0]}>
              <boxGeometry args={[2.15, 0.34, 0.38]} />
              <meshStandardMaterial color="#E2E7F0" roughness={0.38} metalness={0.4} />
            </mesh>
            {/* White Room environmental seal cab */}
            <mesh position={[2.22, 0.02, -0.08]}>
              <boxGeometry args={[0.42, 0.48, 0.52]} />
              <meshStandardMaterial color="#F2F5FA" roughness={0.32} metalness={0.3} />
            </mesh>
          </group>

          {/* 2. Orion Service Module Umbilical Arm (OSMU, y = 10.1) */}
          <group ref={osmArmRef} position={[0.92, 10.1, -0.18]}>
            <mesh position={[0.98, 0, 0]}>
              <boxGeometry args={[1.95, 0.18, 0.24]} />
              <meshStandardMaterial color="#8A95AA" roughness={0.42} metalness={0.65} />
            </mesh>
          </group>

          {/* 3. ICPS Cryogenic Umbilical Arm (y = 9.15) */}
          <group ref={icpsArmRef} position={[0.92, 9.15, 0.12]}>
            <mesh position={[0.96, 0, 0]}>
              <boxGeometry args={[1.92, 0.2, 0.26]} />
              <meshStandardMaterial color="#7C879C" roughness={0.45} metalness={0.65} />
            </mesh>
          </group>

          {/* 4. Core Stage Intertank & Forward Skirt Umbilicals (y = 6.1 & 7.6) */}
          <group ref={intertankArmRef} position={[0.92, 6.1, -0.1]}>
            <mesh position={[0.92, 0, 0]}>
              <boxGeometry args={[1.85, 0.22, 0.28]} />
              <meshStandardMaterial color="#6D788E" roughness={0.48} metalness={0.68} />
            </mesh>
            <mesh position={[0.92, 1.5, 0.15]}>
              <boxGeometry args={[1.82, 0.16, 0.2]} />
              <meshStandardMaterial color="#7E89A0" roughness={0.45} metalness={0.65} />
            </mesh>
          </group>
        </group>

        {/* ─── SOUND SUPPRESSION WATER TOWER & DELUGE PIPING (x = 9.5, z = -7.5) ─── */}
        <group position={[9.5, 0, -7.5]}>
          {/* Elevated spherical/conical water tank */}
          <mesh position={[0, 7.6, 0]}>
            <sphereGeometry args={[1.45, 24, 20]} />
            <meshStandardMaterial color="#DCE2EE" roughness={0.38} metalness={0.45} />
          </mesh>
          {/* Central riser column */}
          <mesh position={[0, 3.8, 0]}>
            <cylinderGeometry args={[0.38, 0.48, 7.2, 16]} />
            <meshStandardMaterial color="#B8C2D4" roughness={0.45} metalness={0.55} />
          </mesh>
          {/* 6 perimeter legs */}
          {[0, 1, 2, 3, 4, 5].map((li) => {
            const a = (li * Math.PI) / 3;
            return (
              <mesh
                key={li}
                position={[Math.cos(a) * 1.15, 3.6, Math.sin(a) * 1.15]}
                rotation={[-Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08]}
              >
                <cylinderGeometry args={[0.07, 0.09, 7.3, 8]} />
                <meshStandardMaterial color="#8E99AE" roughness={0.5} metalness={0.6} />
              </mesh>
            );
          })}
          {/* Main water deluge supply pipe leading to MLP */}
          <mesh position={[-4.5, 0.32, 3.6]} rotation={[0, 0.65, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 10.5, 12]} />
            <meshStandardMaterial color="#6F7A90" roughness={0.45} metalness={0.65} />
          </mesh>
        </group>

        {/* ─── LH2 CRYOGENIC STORAGE SPHERE (x = -13.5, z = 7.5) ─── */}
        <group position={[-13.5, 0, 7.5]}>
          <mesh position={[0, 1.9, 0]}>
            <sphereGeometry args={[1.65, 24, 20]} />
            <meshStandardMaterial color="#E2E7F2" roughness={0.32} metalness={0.58} />
          </mesh>
          {[0, 1, 2, 3].map((si) => {
            const a = (si * Math.PI) / 2 + Math.PI / 4;
            return (
              <mesh key={si} position={[Math.cos(a) * 1.2, 0.9, Math.sin(a) * 1.2]}>
                <cylinderGeometry args={[0.08, 0.1, 1.9, 8]} />
                <meshStandardMaterial color="#68738A" roughness={0.5} metalness={0.6} />
              </mesh>
            );
          })}
        </group>

        {/* ─── 3 LIGHTNING PROTECTION TOWERS + AVIATION BEACONS ─── */}
        {MAST_COORDS.map(([mx, mz], i) => (
          <group key={i} position={[mx, 0, mz]}>
            {/* Steel mast base + fiberglass upper insulator */}
            <mesh position={[0, 7.2, 0]}>
              <cylinderGeometry args={[0.14, 0.34, 14.4, 12]} />
              <meshStandardMaterial color="#505A70" roughness={0.5} metalness={0.68} />
            </mesh>
            <mesh position={[0, 16.4, 0]}>
              <cylinderGeometry args={[0.05, 0.14, 4.2, 10]} />
              <meshStandardMaterial color="#DCE2EE" roughness={0.38} metalness={0.35} />
            </mesh>
            {/* Pulsing aviation warning beacon */}
            <mesh
              ref={(el) => {
                beaconRefs.current[i] = el;
              }}
              position={[0, 18.6, 0]}
            >
              <sphereGeometry args={[0.16, 10, 10]} />
              <meshBasicMaterial color="#FF6A3D" transparent opacity={0.9} />
            </mesh>
          </group>
        ))}

        {/* ─── VOLUMETRIC PAD FLOODLIGHT BEAMS & SPOTLIGHTS ─── */}
        {FLOODLIGHT_BEAMS.map((b, bi) => (
          <group key={bi} position={b.pos} rotation={b.rot}>
            <mesh position={[0, 6.2, 0]}>
              <coneGeometry args={[2.8, 12.4, 20, 1, true]} />
              <meshBasicMaterial
                color={b.color}
                transparent
                opacity={0.045}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        <spotLight
          position={[9, 4.5, 11]}
          angle={0.58}
          penumbra={0.85}
          intensity={185}
          distance={65}
          color="#DCE6FF"
        />
        <spotLight
          position={[-9, 3.8, 10]}
          angle={0.58}
          penumbra={0.85}
          intensity={135}
          distance={65}
          color="#9DB8FF"
        />
      </group>

      {/* ─── VEHICLE ASSEMBLY BUILDING (VAB) ARCHITECTURAL COMPLEX & CAMPUS CORRIDOR ─── */}
      <group position={WORLD_ANCHORS.vab}>
        {/* Main High Bay structure — bright KSC light-gray insulated aluminum panels */}
        <mesh position={[0, 14.5, 0]}>
          <boxGeometry args={[27, 29, 23]} />
          <meshStandardMaterial color="#C8D0DC" roughness={0.68} metalness={0.22} />
        </mesh>

        {/* Dark anthracite side High Bay door towers (matching VAB sunrise photo left/center/right bays) */}
        {[-10.2, -3.4, 3.4, 10.2].map((vx) => (
          <mesh key={vx} position={[vx, 14.5, 11.55]}>
            <boxGeometry args={[1.65, 28.9, 0.24]} />
            <meshStandardMaterial color="#1B2230" roughness={0.8} metalness={0.25} />
          </mesh>
        ))}

        {/* Dark vertical High Bay door slots on left/west wall */}
        {[-5.5, 4.5].map((vz) => (
          <mesh key={vz} position={[-13.55, 14.5, vz]}>
            <boxGeometry args={[0.25, 27.5, 4.2]} />
            <meshStandardMaterial color="#151C28" roughness={0.82} metalness={0.25} />
          </mesh>
        ))}

        {/* Iconic US Flag painted on the VAB Left High Bay facade */}
        <group position={[-6.8, 19.2, 11.64]}>
          {/* Flag white backing */}
          <mesh>
            <planeGeometry args={[4.2, 7.8]} />
            <meshBasicMaterial color="#E8EEF6" />
          </mesh>
          {/* 7 Red vertical stripes */}
          {[-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8].map((sx, si) => (
            <mesh key={si} position={[sx, 0, 0.01]}>
              <planeGeometry args={[0.32, 7.8]} />
              <meshBasicMaterial color="#B31942" />
            </mesh>
          ))}
          {/* Blue star canton (upper-left) */}
          <mesh position={[-0.95, 1.95, 0.02]}>
            <planeGeometry args={[2.1, 3.8]} />
            <meshBasicMaterial color="#0A3161" />
          </mesh>
        </group>

        {/* Iconic Blue Circular Insignia on the VAB Right High Bay facade */}
        <group position={[6.8, 17.5, 11.64]}>
          <mesh>
            <circleGeometry args={[1.85, 28]} />
            <meshBasicMaterial color="#0B3D91" />
          </mesh>
          <mesh position={[0, 0.1, 0.01]} rotation={[0, 0, -0.35]}>
            <planeGeometry args={[3.4, 0.28]} />
            <meshBasicMaterial color="#FC3D21" />
          </mesh>
        </group>

        {/* Stepped Low Bay & Transfer Aisle wing (front-right in VAB sunrise photo) */}
        <mesh position={[17.5, 7.2, 3.5]}>
          <boxGeometry args={[14, 14.4, 18]} />
          <meshStandardMaterial color="#BFC8D6" roughness={0.72} metalness={0.2} />
        </mesh>
        {/* Dark lower trim of Low Bay */}
        <mesh position={[17.5, 3.2, 12.55]}>
          <boxGeometry args={[14.1, 6.4, 0.2]} />
          <meshStandardMaterial color="#1E2533" roughness={0.8} metalness={0.22} />
        </mesh>
        {/* Artemis Program vertical banner on Low Bay front facade */}
        <group position={[20.5, 8.2, 12.66]}>
          <mesh>
            <planeGeometry args={[3.2, 5.2]} />
            <meshBasicMaterial color="#EEF3FA" />
          </mesh>
          <mesh position={[0, 0.3, 0.01]}>
            <coneGeometry args={[0.95, 2.4, 3]} />
            <meshBasicMaterial color="#0B3D91" />
          </mesh>
          <mesh position={[0, -0.2, 0.02]} rotation={[0, 0, 0.25]}>
            <planeGeometry args={[2.2, 0.22]} />
            <meshBasicMaterial color="#E03C31" />
          </mesh>
        </group>

        {/* Illuminated High Bay 3 Rollout Door Slit + Horizontal Gantry Levels */}
        <mesh position={[0, 11.8, 11.62]}>
          <planeGeometry args={[4.6, 22.5]} />
          <meshBasicMaterial color="#9DB8FF" transparent opacity={0.22} />
        </mesh>
        {[4, 8, 12, 16, 20].map((gy) => (
          <mesh key={gy} position={[0, gy, 11.65]}>
            <boxGeometry args={[4.6, 0.18, 0.1]} />
            <meshBasicMaterial color="#161D2B" />
          </mesh>
        ))}

        {/* KSC Campus Approach Roadway & Dawn Light Poles leading from VAB toward LC-39B */}
        {[16, 24, 32, 40].map((rz, ri) => (
          <group key={ri} position={[12 + ri * 1.8, 0, rz]}>
            <mesh position={[0, 2.2, 0]}>
              <cylinderGeometry args={[0.05, 0.08, 4.4, 8]} />
              <meshStandardMaterial color="#2A3346" roughness={0.5} metalness={0.7} />
            </mesh>
            <mesh position={[0.35, 4.35, 0]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshBasicMaterial color="#FFCC88" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
```

### `components/journey/three/CelestialWorlds.tsx`

```tsx
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { EXHIBIT_PLINTH_ANCHORS, WORLD_ANCHORS } from "./trajectory";

/** Fresnel atmosphere / rim glow shader for Earth, Moon & Mars limbs. */
function AtmosphereRim({
  radius,
  color,
  intensity = 0.75,
  power = 3.2,
}: {
  radius: number;
  color: string;
  intensity?: number;
  power?: number;
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    }),
    [color, intensity, power],
  );

  return (
    <mesh>
      <sphereGeometry args={[radius, 56, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uIntensity;
          uniform float uPower;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float rim = pow(clamp(0.74 - dot(-vNormal, vViewDir), 0.0, 1.0), uPower);
            gl_FragColor = vec4(uColor * uIntensity, rim);
          }
        `}
      />
    </mesh>
  );
}

const DAWN_ZENITH = new THREE.Color("#071630");
const DAWN_HORIZON = new THREE.Color("#3D374B");
const DAY_ZENITH = new THREE.Color("#0C2858");
const DAY_HORIZON = new THREE.Color("#3262A2");
const HIGH_ZENITH = new THREE.Color("#040712");
const HIGH_HORIZON = new THREE.Color("#0E2044");

/** Dynamic Earth sky dome that clears smoothly into Deep Field space during ascent. */
function AscentSkyDome() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color("#050B1A") },
      uHorizon: { value: new THREE.Color("#252236") },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useFrame(({ camera }) => {
    const p = scrollState.current;
    if (!meshRef.current || !matRef.current) return;
    const opacity = 1 - smoothstep(5.0, 6.6, p);
    meshRef.current.visible = opacity > 0.01;
    if (!meshRef.current.visible) return;

    meshRef.current.position.copy(camera.position);

    const launchDay = smoothstep(1.9, 3.3, p);
    const upperStrat = smoothstep(3.3, 5.2, p);

    matRef.current.uniforms.uZenith.value
      .copy(DAWN_ZENITH)
      .lerp(DAY_ZENITH, launchDay)
      .lerp(HIGH_ZENITH, upperStrat);
    matRef.current.uniforms.uHorizon.value
      .copy(DAWN_HORIZON)
      .lerp(DAY_HORIZON, launchDay)
      .lerp(HIGH_HORIZON, upperStrat);
    matRef.current.uniforms.uOpacity.value = opacity;
  });

  return (
    <mesh ref={meshRef} renderOrder={-10}>
      <sphereGeometry args={[850, 32, 24]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        vertexShader={`
          varying vec3 vLocalPos;
          void main() {
            vLocalPos = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uZenith;
          uniform vec3 uHorizon;
          uniform float uOpacity;
          varying vec3 vLocalPos;
          void main() {
            float h = clamp(vLocalPos.y * 1.45 + 0.15, 0.0, 1.0);
            vec3 col = mix(uHorizon, uZenith, pow(h, 0.78));
            gl_FragColor = vec4(col, uOpacity);
          }
        `}
      />
    </mesh>
  );
}

/** 3D twinkling star points + NASA Deep Star Maps equirectangular skybox. */
function SpaceBackdrop({ reducedMotion }: { reducedMotion: boolean }) {
  const starTex = useTexture("/media/textures/starfield_4k.jpg");
  const skyRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const starPositions = useMemo(() => {
    const count = 1100;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = ((i * 73) % 1000) / 1000;
      const v = ((i * 197) % 1000) / 1000;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 400 + (i % 6) * 60;
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);

  useFrame(({ camera, clock }) => {
    if (skyRef.current) {
      skyRef.current.position.copy(camera.position);
      const p = scrollState.current;
      const starVis = smoothstep(2.4, 5.2, p);
      const mat = skyRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + starVis * 0.75;
    }
    if (pointsRef.current) {
      pointsRef.current.position.copy(camera.position);
      if (!reducedMotion) {
        pointsRef.current.rotation.y = clock.elapsedTime * 0.0035;
      }
      const p = scrollState.current;
      const pMat = pointsRef.current.material as THREE.PointsMaterial;
      pMat.opacity = 0.25 + smoothstep(2.2, 4.8, p) * 0.65;
    }
  });

  return (
    <>
      <mesh ref={skyRef} renderOrder={-20}>
        <sphereGeometry args={[1200, 48, 32]} />
        <meshBasicMaterial map={starTex} side={THREE.BackSide} transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <points ref={pointsRef} renderOrder={-15}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={1.6} sizeAttenuation={false} color="#DCE6FF" transparent opacity={0.85} depthWrite={false} />
      </points>
    </>
  );
}

export function CelestialWorlds({ reducedMotion }: { reducedMotion: boolean }) {
  const [earthTex, moonTex, moonBump, marsTex] = useTexture([
    "/media/textures/earth_color_2k.jpg",
    "/media/textures/moon_color_4k.jpg",
    "/media/textures/moon_displacement_2k.png",
    "/media/textures/mars_color_4k.jpg",
  ]);

  const earthRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);
  const marsRef = useRef<THREE.Group>(null);
  const finaleRef = useRef<THREE.Group>(null);
  const lunarApproachArcRef = useRef<THREE.Group>(null);
  const transitArcRef = useRef<THREE.Group>(null);

  // Trans-Lunar Injection -> Sea of Tranquility approach trajectory (beats 6.4 -> 8.6)
  const lunarApproachPoints = useMemo(() => {
    const apolloPos = EXHIBIT_PLINTH_ANCHORS["moon-apollo-11"].pos;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(16, 248, -52),
      new THREE.Vector3(6, 298, -124),
      new THREE.Vector3(-8, 344, -172),
      new THREE.Vector3(apolloPos[0], apolloPos[1] + 0.6, apolloPos[2]),
    ]);
    return curve.getPoints(56);
  }, []);

  // Moon -> Mars Hohmann transfer arc (beat 13)
  const transitPoints = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-4, 358, -225),
      new THREE.Vector3(24, 425, -305),
      new THREE.Vector3(-6, 475, -395),
    );
    return curve.getPoints(48);
  }, []);

  useFrame((_, delta) => {
    const p = scrollState.current;
    const spin = reducedMotion ? 0 : delta * 0.014;

    if (earthRef.current) {
      earthRef.current.visible = p > 2.3 && p < 10.5;
      earthRef.current.rotation.y += spin * 0.55;
    }
    if (moonRef.current) {
      moonRef.current.visible = p > 4.8 && p < 16.0;
      moonRef.current.rotation.y += spin * 0.35;
    }
    if (lunarApproachArcRef.current) {
      lunarApproachArcRef.current.visible = p > 6.2 && p < 8.7;
    }
    if (marsRef.current) {
      marsRef.current.visible = p > 11.2 && p < 22.8;
      marsRef.current.rotation.y += spin * 0.65;
    }
    if (transitArcRef.current) {
      transitArcRef.current.visible = p > 12.1 && p < 14.2;
    }
    if (finaleRef.current) {
      finaleRef.current.visible = p > 21.5;
    }
  });

  return (
    <>
      <SpaceBackdrop reducedMotion={reducedMotion} />
      <AscentSkyDome />

      {/* ─── 3D EARTH (Below ascent & visible during edge-of-space / deep-space) ─── */}
      <group ref={earthRef} position={WORLD_ANCHORS.earthCenter} rotation={[0.15, -1.9, 0.1]}>
        <mesh>
          <sphereGeometry args={[WORLD_ANCHORS.earthRadius, 72, 56]} />
          <meshStandardMaterial map={earthTex} roughness={0.68} metalness={0.1} />
        </mesh>
        <AtmosphereRim radius={WORLD_ANCHORS.earthRadius * 1.026} color="#6AA8FF" intensity={0.92} power={3.3} />
      </group>

      {/* ─── TRANS-LUNAR INJECTION & SEA OF TRANQUILITY DESCENT ARC (beats 6.5..8.5) ─── */}
      <group ref={lunarApproachArcRef} visible={false}>
        <Line
          points={lunarApproachPoints}
          color="#9DB8FF"
          lineWidth={1.5}
          dashed
          dashSize={1.8}
          gapSize={1.1}
          transparent
          opacity={0.55}
        />
      </group>

      {/* ─── 3D MOON (Hall I — beats 7..13) ─── */}
      <group ref={moonRef} position={WORLD_ANCHORS.moonCenter} rotation={[0.1, -1.35, 0]}>
        <mesh>
          <sphereGeometry args={[WORLD_ANCHORS.moonRadius, 72, 56]} />
          <meshStandardMaterial
            map={moonTex}
            bumpMap={moonBump}
            bumpScale={0.48}
            roughness={0.92}
            metalness={0.04}
          />
        </mesh>
        <AtmosphereRim radius={WORLD_ANCHORS.moonRadius * 1.022} color="#B9BEC8" intensity={0.32} power={4.2} />
      </group>

      {/* ─── TRANSIT TRAJECTORY ARC (Moon -> Mars, beat 13) ─── */}
      <group ref={transitArcRef} visible={false}>
        <Line
          points={transitPoints}
          color="#9DB8FF"
          lineWidth={1.5}
          dashed
          dashSize={2.4}
          gapSize={1.4}
          transparent
          opacity={0.65}
        />
      </group>

      {/* ─── 3D MARS (Hall II — beats 13..21) ─── */}
      <group ref={marsRef} position={WORLD_ANCHORS.marsCenter} rotation={[0.18, -0.7, 0.06]}>
        <mesh>
          <sphereGeometry args={[WORLD_ANCHORS.marsRadius, 72, 56]} />
          <meshStandardMaterial map={marsTex} roughness={0.86} metalness={0.05} />
        </mesh>
        <AtmosphereRim radius={WORLD_ANCHORS.marsRadius * 1.032} color="#C8603A" intensity={0.68} power={3.8} />
      </group>

      {/* ─── FINALE EARTHRISE (Moon limb + rising blue Earth, beat 23) ─── */}
      <group ref={finaleRef} visible={false}>
        <group position={WORLD_ANCHORS.finaleMoonCenter} rotation={[0.2, -1.6, 0]}>
          <mesh>
            <sphereGeometry args={[26, 56, 42]} />
            <meshStandardMaterial map={moonTex} bumpMap={moonBump} bumpScale={0.4} roughness={0.94} />
          </mesh>
        </group>
        <group position={WORLD_ANCHORS.finaleEarthCenter} rotation={[0.2, -1.2, 0.25]}>
          <mesh>
            <sphereGeometry args={[18, 56, 42]} />
            <meshStandardMaterial map={earthTex} roughness={0.68} metalness={0.1} />
          </mesh>
          <AtmosphereRim radius={18 * 1.035} color="#7EB6FF" intensity={0.95} power={3.0} />
        </group>
      </group>
    </>
  );
}
```

### `components/journey/three/ExhibitStage3D.tsx`

```tsx
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { beats } from "@/content/beats";
import { exhibitBySlug } from "@/content/exhibits";
import { teaserItems } from "@/content/teaser";
import type { Exhibit } from "@/content/types";
import { useMuseum } from "@/lib/store";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { EXHIBIT_PLINTH_ANCHORS } from "./trajectory";

const PLINTH_SURFACE_Y = 0.22;

function GlbExhibitMesh({
  url,
  isApolloLm,
  spinRef,
}: {
  url: string;
  isApolloLm: boolean;
  spinRef: React.RefObject<THREE.Group | null>;
}) {
  const { scene } = useGLTF(url, false, true);
  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 100), []);
  const cutRef = useRef<THREE.Object3D>(null);
  const normalRef = useRef(new THREE.Vector3(0, -1, 0));
  const worldPtRef = useRef(new THREE.Vector3());

  const { cloned, scale, offset } = useMemo(() => {
    const copy = scene.clone(true);
    const box = new THREE.Box3().setFromObject(copy);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const s = (isApolloLm ? 2.8 : 2.15) / maxDim;

    if (isApolloLm) {
      copy.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const nextMats = mats.map((m) => {
            const c = m.clone();
            c.clippingPlanes = [clipPlane];
            c.clipShadows = true;
            return c;
          });
          mesh.material = Array.isArray(mesh.material) ? nextMats : nextMats[0];
        }
      });
    }

    return {
      cloned: copy,
      scale: s,
      offset: [-center.x * s, PLINTH_SURFACE_Y - box.min.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene, isApolloLm, clipPlane]);

  // Dynamically keep the Apollo LM descent-stage clipping plane synced in world space
  useFrame(() => {
    if (!isApolloLm || !cutRef.current || !spinRef.current) return;
    cutRef.current.getWorldPosition(worldPtRef.current);
    normalRef.current.set(0, -1, 0).applyQuaternion(spinRef.current.getWorldQuaternion(new THREE.Quaternion())).normalize();
    clipPlane.setFromNormalAndCoplanarPoint(normalRef.current, worldPtRef.current);
  });

  return (
    <group>
      <primitive object={cloned} scale={scale} position={offset} />
      {isApolloLm ? (
        <>
          <object3D ref={cutRef} position={[0, PLINTH_SURFACE_Y + 1.08, 0]} />
          {/* Apollo 11 Laser Ranging Retroreflector (LRRR) 10x10 prism array + active ranging beam */}
          <group position={[0.92, PLINTH_SURFACE_Y + 0.08, 0.52]} rotation={[0, -0.45, 0]}>
            {/* Tilted pallet base */}
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[0.34, 0.08, 0.32]} />
              <meshStandardMaterial color="#D6DCE8" roughness={0.35} metalness={0.75} />
            </mesh>
            {/* 10x10 Corner-Cube Mirror Array */}
            <mesh position={[0, 0.11, 0.02]} rotation={[-0.42, 0, 0]}>
              <boxGeometry args={[0.28, 0.03, 0.28]} />
              <meshStandardMaterial
                color="#9DB8FF"
                emissive="#4A78E0"
                emissiveIntensity={0.65}
                roughness={0.12}
                metalness={0.95}
              />
            </mesh>
            {/* Subtle laser ranging beam returning to Earth */}
            <mesh position={[0, 2.1, 0.85]} rotation={[0.38, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.035, 4.2, 8, 1, true]} />
              <meshBasicMaterial
                color="#9DB8FF"
                transparent
                opacity={0.32}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        </>
      ) : null}
    </group>
  );
}

function LightboxExhibitMesh({ imageSrc }: { imageSrc: string }) {
  const tex = useTexture(imageSrc);
  return (
    <group position={[0, PLINTH_SURFACE_Y + 1.05, 0]}>
      {/* Platinum bezel frame */}
      <mesh>
        <boxGeometry args={[2.52, 1.72, 0.08]} />
        <meshStandardMaterial color="#C7CDD8" roughness={0.32} metalness={0.78} />
      </mesh>
      {/* Obsidian inner backing */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[2.36, 1.56, 0.06]} />
        <meshStandardMaterial color="#0A0E18" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Illuminated NASA archival image */}
      <mesh position={[0, 0, 0.055]}>
        <planeGeometry args={[2.24, 1.46]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function PlinthFallback() {
  return (
    <mesh position={[0, PLINTH_SURFACE_Y + 0.75, 0]}>
      <octahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color="#9DB8FF" wireframe transparent opacity={0.45} />
    </mesh>
  );
}

function SingleExhibitPlinth({
  exhibit,
  beatIndex,
  reducedMotion,
}: {
  exhibit: Exhibit;
  beatIndex: number;
  reducedMotion: boolean;
}) {
  const anchor = EXHIBIT_PLINTH_ANCHORS[exhibit.slug];
  const openExhibit = useMuseum((s) => s.openExhibit);
  const activeExhibit = useMuseum((s) => s.activeExhibit);
  const spinRef = useRef<THREE.Group>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const isApolloLm = exhibit.catalogNo === "SM-L-001" || exhibit.catalogNo === "SM-L-004";
  const lightboxImg = exhibit.media.then.src.replace("-1600.avif", "-800.jpg");

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useFrame((_, delta) => {
    const p = scrollState.current;
    const dist = Math.abs(p - beatIndex);
    const vis = 1 - smoothstep(0.65, 1.35, dist);
    if (!rootRef.current) return;
    rootRef.current.visible = vis > 0.01;
    if (!rootRef.current.visible) return;

    rootRef.current.scale.setScalar(0.7 + 0.3 * vis);

    if (spinRef.current && !reducedMotion) {
      spinRef.current.rotation.y += delta * 0.22;
    }

    const boost = activeExhibit === exhibit.slug ? 1.5 : hovered ? 1.25 : 1.0;
    if (spotRef.current) {
      spotRef.current.intensity = 42 * vis * boost;
    }
    if (coneRef.current) {
      const mat = coneRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 * vis * boost;
    }
  });

  if (!anchor) return null;
  const plinthColor = anchor.planet === "moon" ? "#3A404D" : "#4E2E24";
  const accentColor = anchor.planet === "moon" ? "#B9BEC8" : "#C8603A";

  return (
    <group
      ref={rootRef}
      position={anchor.pos}
      rotation={[0, anchor.rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        openExhibit(exhibit.slug);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Cold museum spotlight (#DCE6FF) */}
      <spotLight
        ref={spotRef}
        position={[0, 5.2, 1.1]}
        angle={0.42}
        penumbra={0.85}
        intensity={42}
        distance={14}
        color="#DCE6FF"
      />

      {/* Volumetric spotlight beam */}
      <mesh ref={coneRef} position={[0, 2.65, 0.35]} rotation={[0.16, 0, 0]}>
        <coneGeometry args={[2.1, 5.2, 24, 1, true]} />
        <meshBasicMaterial
          color="#DCE6FF"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bevelled planetary museum plinth */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.55, 1.85, 0.44, 32]} />
        <meshStandardMaterial color={plinthColor} roughness={0.86} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.48, 1.55, 36]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.45} />
      </mesh>

      {/* Rotating exhibit model or 2.5D platinum lightbox */}
      <group ref={spinRef}>
        <Suspense fallback={<PlinthFallback />}>
          {exhibit.media.model ? (
            <GlbExhibitMesh url={exhibit.media.model} isApolloLm={isApolloLm} spinRef={spinRef} />
          ) : (
            <LightboxExhibitMesh imageSrc={lightboxImg} />
          )}
        </Suspense>
      </group>
    </group>
  );
}

function SilhouetteModel({ url, x, reducedMotion }: { url: string; x: number; reducedMotion: boolean }) {
  const { scene } = useGLTF(url, false, true);
  const spinRef = useRef<THREE.Group>(null);

  const { cloned, scale, offset } = useMemo(() => {
    const copy = scene.clone(true);
    const darkMat = new THREE.MeshStandardMaterial({
      color: "#090D16",
      emissive: "#162442",
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.75,
    });
    copy.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = darkMat;
      }
    });
    const box = new THREE.Box3().setFromObject(copy);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const s = 2.6 / maxDim;
    return {
      cloned: copy,
      scale: s,
      offset: [-center.x * s, -center.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene]);

  useFrame((_, delta) => {
    if (spinRef.current && !reducedMotion) {
      spinRef.current.rotation.y += delta * 0.16;
    }
  });

  return (
    <group ref={spinRef} position={[x, 0, 0]}>
      <primitive object={cloned} scale={scale} position={offset} />
    </group>
  );
}

function BeyondSilhouettes3D({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = scrollState.current;
    groupRef.current.visible = p > 21.1 && p < 22.9;
  });

  const offsets = [-6.3, -2.1, 2.1, 6.3];

  return (
    <group ref={groupRef} position={[0, 538.2, -522]} visible={false}>
      <spotLight position={[0, 6, -4]} angle={0.9} penumbra={0.9} intensity={160} distance={28} color="#9DB8FF" />
      {teaserItems.map((item, idx) => (
        <Suspense key={item.catalogNo} fallback={null}>
          <SilhouetteModel url={item.model} x={offsets[idx]} reducedMotion={reducedMotion} />
        </Suspense>
      ))}
    </group>
  );
}

/**
 * Mounts all 12 Moon + Mars exhibit plinths + Hall III silhouettes.
 * Individual plinths cull themselves smoothly when out of range, and preloading starts once in space.
 */
export function ExhibitStage3D({ reducedMotion }: { reducedMotion: boolean }) {
  const exhibitBeats = useMemo(
    () =>
      beats
        .map((b, i) => ({ beat: b, index: i, exhibit: b.exhibitSlug ? exhibitBySlug(b.exhibitSlug) : undefined }))
        .filter((x): x is { beat: (typeof beats)[number]; index: number; exhibit: Exhibit } => !!x.exhibit),
    [],
  );

  // Lazy-preload GLB models gently after mount so Moon/Mars transitions feel instant
  useEffect(() => {
    const urls = new Set<string>();
    exhibitBeats.forEach((x) => {
      if (x.exhibit.media.model) urls.add(x.exhibit.media.model);
    });
    teaserItems.forEach((t) => urls.add(t.model));
    const timer = window.setTimeout(() => {
      urls.forEach((u) => useGLTF.preload(u, false, true));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [exhibitBeats]);

  return (
    <>
      {exhibitBeats.map(({ exhibit, index }) => (
        <SingleExhibitPlinth
          key={exhibit.slug}
          exhibit={exhibit}
          beatIndex={index}
          reducedMotion={reducedMotion}
        />
      ))}
      <BeyondSilhouettes3D reducedMotion={reducedMotion} />
    </>
  );
}
```

### `components/journey/three/SpaceScene.tsx`

```tsx
"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMuseum } from "@/lib/store";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { CelestialWorlds } from "./CelestialWorlds";
import { ExhibitStage3D } from "./ExhibitStage3D";
import { LaunchComplex } from "./LaunchComplex";
import { SLSRocket } from "./SLSRocket";
import { sampleTrajectory, type SampledTrajectory } from "./trajectory";

/** Build a true HDR studio + orbital sky environment map for realistic metallic & Kapton reflections. */
function configureAerospaceEnvironment(gl: THREE.WebGLRenderer, scene: THREE.Scene) {
  gl.localClippingEnabled = true;

  const pmrem = new THREE.PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#060A14");

  // Upper orbital sky hemisphere
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 24, 16),
    new THREE.MeshBasicMaterial({ color: "#112042", side: THREE.BackSide }),
  );
  envScene.add(skyDome);

  // HDR Solar Key Reflector (float RGB > 1 for crisp metallic specular glints)
  const sunCard = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(5.2, 5.5, 6.2), side: THREE.DoubleSide }),
  );
  sunCard.position.set(24, 28, 26);
  sunCard.lookAt(0, 0, 0);
  envScene.add(sunCard);

  // Cool Earthshine / Starlight Rim Reflector
  const rimCard = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 22),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 2.1, 3.8), side: THREE.DoubleSide }),
  );
  rimCard.position.set(-28, 10, -20);
  rimCard.lookAt(0, 0, 0);
  envScene.add(rimCard);

  // Secondary Zenith Specular Strip
  const topStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 3.0, 4.0), side: THREE.DoubleSide }),
  );
  topStrip.position.set(0, 38, 0);
  topStrip.lookAt(0, 0, 0);
  envScene.add(topStrip);

  // Warm Ignition / Pad Horizon Bounce
  const padBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.95, 0.5), side: THREE.DoubleSide }),
  );
  padBounce.position.set(0, -32, 10);
  padBounce.lookAt(0, 0, 0);
  envScene.add(padBounce);

  const envTarget = pmrem.fromScene(envScene, 0.035);
  scene.environment = envTarget.texture;
  pmrem.dispose();
}

function SceneChoreographer({
  rocketRef,
  reducedMotion,
}: {
  rocketRef: React.RefObject<THREE.Group | null>;
  reducedMotion: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const activeExhibit = useMuseum((s) => s.activeExhibit);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const traj = useMemo<SampledTrajectory>(
    () => ({
      camPos: new THREE.Vector3(),
      camLook: new THREE.Vector3(),
      rocketPos: new THREE.Vector3(),
      rocketRot: new THREE.Euler(),
      rocketScale: 1,
    }),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (reducedMotion) {
      scrollState.current = scrollState.target;
    } else {
      const prev = scrollState.current;
      scrollState.current = THREE.MathUtils.damp(prev, scrollState.target, 8.5, dt);
      scrollState.velocity = (scrollState.current - prev) / Math.max(dt, 0.001);
    }

    const p = scrollState.current;
    sampleTrajectory(p, traj);

    const t = state.clock.elapsedTime;
    // Living breathing drift + subtle acoustic rumble at liftoff (beat 2)
    const breathX = reducedMotion ? 0 : Math.sin(t * 0.42) * 0.12;
    const breathY = reducedMotion ? 0 : Math.cos(t * 0.31) * 0.09;
    const liftoffRumble = reducedMotion
      ? 0
      : smoothstep(1.82, 1.98, p) * (1 - smoothstep(2.25, 2.52, p));
    const shakeX = liftoffRumble * Math.sin(t * 52) * 0.2;
    const shakeY = liftoffRumble * Math.cos(t * 59) * 0.15;

    camera.position.set(
      traj.camPos.x + breathX + shakeX,
      traj.camPos.y + breathY + shakeY,
      traj.camPos.z,
    );
    camera.lookAt(traj.camLook);

    if (rocketRef.current) {
      rocketRef.current.position.copy(traj.rocketPos);
      rocketRef.current.rotation.copy(traj.rocketRot);
      rocketRef.current.scale.setScalar(traj.rocketScale);
      rocketRef.current.visible = p < 20.8 || p > 22.7;
    }

    // Dim global background lights by 60% when ExhibitPanel is open (PLAN §4)
    const dim = activeExhibit ? 0.4 : 1.0;
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.damp(sunRef.current.intensity, 3.1 * dim, 6, dt);
    }
    if (rimRef.current) {
      rimRef.current.intensity = THREE.MathUtils.damp(rimRef.current.intensity, 0.85 * dim, 6, dt);
    }
    if (ambRef.current) {
      ambRef.current.intensity = THREE.MathUtils.damp(ambRef.current.intensity, 0.42 * dim, 6, dt);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.damp(hemiRef.current.intensity, 0.48 * dim, 6, dt);
    }
  });

  return (
    <>
      <ambientLight ref={ambRef} color="#1A2644" intensity={0.42} />
      <hemisphereLight ref={hemiRef} args={["#ADC8FF", "#0A0E18", 0.48]} />
      <directionalLight ref={sunRef} position={[65, 95, 85]} color="#F5F8FF" intensity={3.1} />
      <directionalLight ref={rimRef} position={[-60, 15, -55]} color="#6E96FF" intensity={0.85} />
    </>
  );
}

export default function SpaceScene() {
  const reducedMotion = useMuseum((s) => s.reducedMotion);
  const rocketRef = useRef<THREE.Group | null>(null);

  return (
    <div aria-hidden className="fixed inset-0 z-0 bg-void">
      <Canvas
        dpr={reducedMotion ? 1 : [1, 1.85]}
        camera={{ fov: 44, near: 0.25, far: 2600, position: [14, 5.2, 23] }}
        onCreated={({ gl, scene }) => {
          configureAerospaceEnvironment(gl, scene);
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
      >
        <color attach="background" args={["#04060B"]} />
        <SceneChoreographer rocketRef={rocketRef} reducedMotion={reducedMotion} />
        <Suspense fallback={null}>
          <CelestialWorlds reducedMotion={reducedMotion} />
          <LaunchComplex />
          <SLSRocket rocketRef={rocketRef} reducedMotion={reducedMotion} />
          <ExhibitStage3D reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
```
