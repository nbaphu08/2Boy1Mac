- Preview: https://spacemuse-hwyttcac4-nbaphu08.vercel.app (Vercel project `spacemuse`; `.vercelignore` excludes materials/ because of the 100 MB upload limit; may be behind Deployment Protection).

## M0 part 2 / M1 content start (Sonnet)
- Done: `content/{sources,exhibits,teaser,silence,site}.ts` (12 exhibits, S1–S70), `components/museum/{ExhibitPanel,ExhibitContent,Plaque,ThenNowSlider,SourceList,PageVisit}`, `components/ui/AgeCounter`, routes `/exhibit/[slug]` (12 static pages), `/gallery`, `/about`. Build + lint clean.
- Dropped/adjusted vs COPY: Spirit "unable to tilt its solar panels toward the Sun" clause removed ("Stuck in soft soil, Spirit faced…"); Hall of Silence heritage paragraph no longer claims "asking future visitors to keep their distance" (S13 not read); "Lưu ý" notes never displayed.
- Verified true: SM-L-001, L-005, M-001, M-002, M-003, M-005, M-006, M-007. False: L-002, L-003, L-004, M-004 (see CHANGE_REQUESTS).
- Next: mount `<ExhibitPanel/>` in the journey (Fable's files), 3D viewer in panel, passport/certificate, Hall of Silence + Hall III components.
- Risks: panel ←/→ listens on document; Journey must pause its engine while `activeExhibit` is set. Preview URL: not deployed (orchestrator deploys after merge).

## Creative Director review (Opus) — content
- Credits confirmed from NASA image metadata: PIA22929 = NASA/JPL-Caltech/Cornell/ASU; PIA13965 = NASA/JPL-Caltech/MIT (labelled Artist's concept); PIA17759 = NASA/JPL-Caltech/Cornell Univ./Arizona State Univ.
- SM-L-002, L-003, L-004, M-004 set to verified: the flagged sentences are interpretive (no numbers/dates) and approved by the Creative Director.

## M1 — Act I–II scenes (Sonnet, 14 Nov 2026)
**Done:** beats 0–6 as real scenes in `components/journey/acts/**` (hero with SplitText title + push-in + fog; enter dolly→footage crossfade + letterbox; ignition with ambient loop, T-5…T-1 countdown, T-0 flash/shake/MET; ascent-1..4 with event HUD + captions), registered via `registerBeat`. Footage uses 720p on ≤768 px, lazy `src` within [-1,+2] beats, poster as rest frame; reduced motion = posters only. ExhibitPanel mounted on Stage (`data-step-ignore`); disclaimer on hero; `metadataBase` set. Stage renders scenes via a `scenes` map (`acts/index.ts`). Build + lint pass; headless-Chrome smoke test of hero → enter → ignition → ascent-1 (keyboard), no console errors.
**Next:** F2/F3 beats ≥ 7 (Fable), mobile pass, real-device tests.
**Risks:** MET values indicative (see CHANGE_REQUESTS); iOS Low Power Mode / autoplay unverified; countdown timing vs footage unverified by eye on a real device; edge-blur uses `backdrop-filter` (check perf on phones). Preview URL: none (not deployed).

## S-1 / S-2 (Sonnet, 14 Nov 2026)
**Done:** deleted `lib/step`, `components/journey/acts`, `public/media/footage`, `clip` fields; eslint ignores `.claude/graphify-out/materials`; package name `spacemuse`. New `content/journey.ts` is the single source for overlay/HUD text; `BeatOverlays.tsx` and `Stage.tsx` read from it. PLAN §3 fact fixes applied. "3D reconstructions are illustrative…" added via `site.illustrative` to layout footer, hero disclaimer, About.
**Next:** Opus fills unverified strings (see CHANGE_REQUESTS). **Risks:** none known. tsc/eslint/build pass; `/` returns 200. No deploy.

## S-3 / S-4 (Sonnet, 14 Nov 2026)
**Done:** S-3: `ModelViewer` (own R3F canvas, lazy, drei `useGLTF(url,false,true)`, OrbitControls, zoom-out capped at 2x, cold key light, transparent bg, no auto-rotate under reduced motion) in `ExhibitMedia` (panel + page) for exhibits with `media.model`. "Explore exhibit" buttons already existed in `BeatOverlays`; 3D stage also calls `openExhibit` on click. `/exhibit/[slug]` has "View in the journey ->" to `/#<beatId>`; Stage already honours initial hash. Gallery cards already link to exhibit pages. Keyboard: PageDown/PageUp/Space/Shift+Space snap one beat (skipped when panel open, in inputs, or Space on focused button/link). S-4: Silence wall reveals row by row from `scrollState.current` (reflector line glows), numbers + heritage; Beyond tiles focusable with name · year · line on hover/focus, Voyager note; Finale unchanged (links to /gallery, /about). Mobile-compact layouts.
**Next:** AG places silhouettes above tiles (see CHANGE_REQUESTS). **Risks:** untested on real devices; Silence card height on 360x640 phones is tight; model viewer GLB sizes (check load on mobile). No deploy.

## S-6 baseline + narration layer (Sonnet, 14 Nov 2026)
**Narration:** every beat's `narration` line is shown as an audio-guide line (Inter 18-22px desktop / 16px mobile, max 34ch, top-left under the HUD bar) that fades in when `scrollState.current` is within ~0.2 beat of the beat. Skipped on Silence (card intro says the same) and hidden below `sm` on Beyond (card fills the screen). Transit shows `transitTimeline` as a mono year strip with a platinum hairline, revealed left to right while approaching the beat. Reduced motion: all static and visible. Captions dropped because narration duplicates them: enter, ascent-1/2/3/4, finale. Kept: hero, deep-space, transit, hall titles.
**Measured** (production build, `next start`, headless Chrome 1440x900 / 390x844 / 360x640 on a laptop with SOFTWARE WebGL (SwiftShader), so FPS and LCP are pessimistic and only useful for relative comparison; re-measure on a real GPU/phone):
- JS: 1764 KB raw across all chunks after load (3D scene chunk ~1 MB raw is a lazy `dynamic(ssr:false)` chunk); first-paint HTML references about 200 KB gzip of scripts.
- rAF FPS (median / min over 24 beats): 1440x900 9 / 6; 390x844 20 / 8; 360x640 25 / 10; 1440x900 reduced-motion 10 / 1. All software-GL numbers.
- LCP (software GL, main thread starved): 33.5 s / 22.9 s / 22.2 s / 24.9 s. Not meaningful; the hero `<img>` is `fetchPriority="high"` in SSR HTML.
- Console: no errors. One warning every load: `THREE.Clock deprecated` (in `three/**`, requested from Antigravity). Desktop once: GL "GPU stall due to ReadPixels" (software GL).
- Overlay overflow check on all 24 beats: clean at 1440x900 and 390x844; at 360x640 only the Silence card overflowed.
**Fixes:** gsap ticker (Lenis, portal, narration, silence wall) sleeps + Lenis stops while the tab is hidden; Silence card now starts under the HUD bar, `max-h` = viewport - 6.5rem with internal scroll (`data-lenis-prevent`) so it never overflows at 360x640. 3D canvas was already code-split; hero LCP image already prioritized.
**Reduced motion:** Lenis is not created (native scroll), overlay reveals/narration/timeline/silence rows render static. The Vab portal zoom is off. 3D layer behaviour is Antigravity's (request logged).
**Security:** `npm audit --omit=dev` = 0 vulnerabilities.
**Risks:** FPS/LCP on real devices unmeasured. No deploy.

## S-5 / S-7 + rail + gallery polish (Sonnet, main)
- Done: rail labels only for active group (others on hover/focus, hidden on mobile); passport sheet (header "n/12 STAMPS" opens dialog, focus trap, Esc, dates in `spacemuse:visited-at`, 12/12 canvas PNG certificate); per-page metadata + title template; `next/og` images for `/` and `/exhibit/[slug]`; `app/sitemap.ts`, `app/robots.ts`; gallery cards (badge, hall, lift hover).
- Next: hand-test passport at 390px; deploy preview by humans.
- Risks: OG routes render dynamically (read public JPG via fs); certificate uses system fonts.
