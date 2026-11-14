# AG-4 → AG-7 — Endings, transitions, performance tiers, poster renders

**For:** Antigravity · **Issued by:** Opus · **Window:** Sun 15/11 07:00–16:00 (feature freeze 16:00)
Rules as before: edit only `components/journey/three/**` + `public/media/three/**`; branch per packet `ag/<id>`; short handoff in `docs/HANDOFF_ANTIGRAVITY.md` + screenshots in `docs/antigravity/shots/`. Text shown in 3D must come from `content/silence.ts`, `content/teaser.ts`, `content/journey.ts` — never hard-code strings.

---

## AG-4 — Hall of Silence, Hall III "Beyond", Finale (beats 21–23) · target Sun 10:00
1. **Silence (21):** a dark, quiet memorial space: the camera pulls back from Mars into near-black; a long low wall or field of faint light points (one per exhibit) that dim one by one as the DOM wall rows (Sonnet, already built) reveal — the **Apollo 11 reflector point stays lit** (still active). Keep it calm: no particles storm, slow drift only.
2. **Beyond (22):** a tall frosted-glass doorway (platinum frame `#C7CDD8`) and behind it **4 silhouettes** from `public/media/models/SM-B-001…004*.web.glb` (black unlit material + thin cold rim light). **Sonnet's request:** the 4 silhouettes must line up **above the 4 DOM tiles near the bottom of the viewport** (tiles are evenly spaced, left→right in catalogue order SM-B-001…004). Either place them in screen-space accordingly or export their screen anchors via a tiny shared store (e.g. `lib/scroll/anchors.ts` request to Sonnet) — say which in the handoff. Voyager 1 (SM-B-004) gets a faint blinking "still talking" light.
3. **Finale (23):** return to Earth: an Earthrise composition (Earth rising over the lunar limb), echoing the NASA Artemis II "Artemis Era Earthrise" photo (`public/media/images/finale_artemis_era_earthrise-2560.jpg` can be used as reference or as a backdrop plane). Slow, quiet, final.

## AG-5 — Transitions (beats 6→7, 12→13→14, 22→23) · target Sun 12:00
- **6→7:** leaving Earth orbit toward the Moon (trans-lunar), Earth shrinking behind — no hard cuts.
- **13 transit:** Moon recedes, a thin arc traces toward Mars; optional subtle year ticks matching the DOM timeline (1976…2021) — DOM shows the years, 3D only the motion.
- **22→23:** from the Beyond doorway back toward Earth.
- Must stay smooth when the user scrolls fast or jumps with PageDown / the progress rail (no texture pop, no long shader compiles mid-scroll — precompile/warm up materials on load).

## AG-6 — Performance tiers · target Sun 14:00
- Three tiers auto-selected (GPU renderer string / `navigator.hardwareConcurrency` / viewport / measured FPS in the first 2 s): **high** (desktop), **medium** (laptop iGPU), **low** (phones).
- Per tier: particle counts, DPR cap (2 / 1.5 / 1.25), texture size (4K/2K), shadow maps on/off, procedural texture resolution, postprocessing on/off, star count.
- Lazy-load exhibit GLBs only when within ±2 beats; dispose far ones on low tier.
- `reducedMotion`: no camera micro-orbit, no particles, minimal motion (camera still follows scroll).
- Targets: ≥ 55 fps M1 @1440×900, ≥ 30 fps iPhone 12-class. Report measured numbers.
- **From Sonnet's S-6 baseline (must fix):** replace deprecated `THREE.Clock` (warning on every load); find and remove the `readPixels` GPU readback ("GPU stall due to ReadPixels"); pause the R3F loop when `document.hidden` (`frameloop="never"` or `setFrameloop`), since gsap sleep does not stop R3F; under `reducedMotion` snap `scrollState.current` to `target` (no damping drift), no plume/particle/camera micro-motion.

## AG-7 — Poster renders · target Sun 15:30
- Render a clean still (no DOM UI) for **each of the 24 beats** and **each of the 12 exhibits** at **1920×1080** and **1080×1350**, AVIF + JPG, into `public/media/three/posters/<beatId|slug>-<w>x<h>.{avif,jpg}`.
- Used by Sonnet for: reduced-motion static mode, OG images, gallery thumbnails, demo video, submission images.
- Best framing per exhibit (hero angle under the spotlight).
