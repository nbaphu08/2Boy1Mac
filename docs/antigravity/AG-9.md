# AG-9 — Graphics v2: cinematic landscapes (3 stages)

**For:** Antigravity · **Issued by:** Opus · **Decision by the humans:** drop the round museum plinths; every exhibit stands on **real-looking ground that runs to the horizon**, like a NASA documentary. The "museum" lives in the DOM labels and a faint spotlight only.
Do the stages **in order**, one branch each (`ag/9a-render`, `ag/9b-landscapes`, `ag/9c-models`), each from latest `main`, each with a short handoff in `docs/HANDOFF_ANTIGRAVITY.md`, then STOP and tell the humans so Opus can review/merge before the next stage.
Rules as always: only `components/journey/three/**` + `public/media/three/**` (exception: 9a may add npm deps, below). **Do NOT generate posters** (Opus captures with `/journey?poster=<id>`). No invented text/logos/numbers. Respect perf tiers (`perfTier.ts`): every new effect must be switchable per tier; ≥ 55 fps M1 high, ≥ 30 fps phone low. Typecheck, lint, build pass.

Review contact sheet of the current 12 exhibits: `docs/antigravity/shots/review-AG9-before.jpg` (Moon row 1–2, Mars row 2–4). Problems seen there: dot-grid/striped plinth textures read as plastic; flat lighting with no ambient occlusion or soft shadows; metals/foil have nothing to reflect; no bloom on engines/laser/beacons; plinths fill half the frame; Pathfinder airbags look like clouds.

---

## AG-9a — Render pipeline & light (≈ 1.5 h) · branch `ag/9a-render`
1. **Post-processing** with `@react-three/postprocessing` (you may add `@react-three/postprocessing` and `postprocessing` to `package.json` with exact versions compatible with React 19 / three 0.187): SMAA, N8AO (or SSAO) ambient occlusion, selective soft **bloom** only on emissive things (engine plumes, ESM engine, LRRR laser, pad beacons, Voyager light), subtle depth-of-field on exhibit beats focused on the artifact, AgX or ACES tonemapping (pick one, consistent). Tiers: high = all; medium = SMAA + bloom + light AO; low = none (or SMAA only).
2. **Image-based lighting:** a `drei` `<Environment>` built from `Lightformer`s (no downloaded HDRI needed) so foil, gold Kapton, solar panels, rover decks and the SLS get believable reflections. Per hall: Moon = one hard white sun + near-black environment; Mars = warm dusty environment.
3. **Soft shadows:** one shadow-casting sun per scene with soft PCF/PCSS (high/medium), shadow camera tightly fitted to the exhibit; remove fake/blob shadows.
4. Precompile/warm up new shaders on load (no hitch mid-scroll).
**Acceptance:** same scenes, visibly richer light; no fps regression beyond tier targets.

## AG-9b — Cinematic landscapes for all 12 exhibits (≈ 3 h) · branch `ag/9b-landscapes`
1. **Remove the cylindrical plinths/pedestals and the big spotlight cones.** Keep exhibit world anchors and `openExhibit(slug)`; adjust `BEAT_POSES` so each beat is a composed shot (artifact on a rule-of-thirds point, horizon visible, 35–50 mm feel). Camera transitions between neighbouring exhibits must stay smooth — fade/fly through darkness or over terrain, no hard pops.
2. **Ground to the horizon** per exhibit: large terrain (displaced plane/chunk with distance fade), procedural PBR (fbm albedo + normal + roughness; no regular dot grids, no concentric stripes), small craters/pebbles/rocks with instancing, distant ridges/hills as soft silhouettes. Lunar regolith colour must match `moon_color_4k.jpg`; Mars soil matches HiRISE/Then photos.
3. **Moon (5):** black sky, Deep Star Map stars, **one hard low sun → long sharp shadows**, no atmosphere haze. Earth in the sky for Apollo 11, Surveyor 3, Apollo 15, Apollo 17 (near side); **not** high in the sky for GRAIL (polar site — low on the horizon at most; see `REF_MOON.md`). Site cues from `REF_MOON.md`: Hadley Rille + Mount Hadley behind the LRV; Taurus-Littrow valley walls at Apollo 17; Surveyor 3 sits inside a small crater with the Apollo 12 LM in the distance; bootprints/rover tracks kept.
4. **Mars (7):** daytime sky **butterscotch/tan with dust haze**, aerial perspective that softens distant hills, warm low sun; (Martian sunsets are blue — optional for one exhibit only, e.g. Opportunity's last beat, if it reads well). Site cues from `REF_MARS.md`: Spirit sunk to the hubs in bright soil at Troy beside Home Plate; Phoenix on polygon-patterned arctic plains with the white trench patches; InSight on a flat smooth plain with the dome instruments; Ingenuity on rippled sand near its last airfield; Viking on rock-strewn Chryse Planitia; Pathfinder in Ares Vallis with Twin Peaks on the horizon.
5. Subtle, slow ambient life only: drifting dust motes on Mars, star twinkle; nothing that distracts from the narration.
**Acceptance:** each exhibit beat looks like a still from a documentary; no visible pedestal; legible against the DOM cards (keep the lower-left area of the frame calm/darker where the card sits on desktop).

## AG-9c — Detail pass on the 5 hand-built models (≈ 2 h) · branch `ag/9c-models`
No NASA 3D model exists for these (verified, see `materials/MANIFEST.md` §4) — refine your procedural ones against the Then photos and `REF_*.md` dimensions:
- **Surveyor 3** (`AS12-48-7134`): triangular tubular frame, three legs with crushable footpads, planar array + high-gain antenna on the mast, TV camera mirror hood, sampler scoop arm; dusty tan-white.
- **Apollo 15 LRV** (`as15-88-11901`): wire-mesh wheels with chevron treads, grey fenders, folding seats with webbing, umbrella high-gain antenna, TV camera, console.
- **Pathfinder + Sojourner** (`PIA00614`): tetrahedral lander with **three open petals** and solar cells, **deflated airbags draped against the petals** (not puffy clouds), ramps down to the soil, IMP camera mast; Sojourner's six wheels, solar-panel top, APXS against a rock (Yogi scale from AG-2c).
- **Phoenix** (`PIA11719`): two **decagonal (ten-sided) solar arrays**, deck with instruments, robotic arm with scoop, three legs, Martian frost hints.
- **GRAIL**: keep the two impact craters as the focus; the twin spacecraft stay as faint translucent holograms above.
- All: proper PBR materials (gold Kapton with crinkle normal, anodised aluminium, solar-cell glass), sensible poly budgets, dispose on low tier.
**Acceptance:** side-by-side with the Then photo, a student recognises the machine.
