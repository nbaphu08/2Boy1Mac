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
