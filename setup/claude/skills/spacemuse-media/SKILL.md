---
name: spacemuse-media
description: Where every SpaceMuse media file lives and how to load it (final footage per beat, posters, images, Then/Now, 3D models, planet textures), plus browser gotchas. Use when wiring videos, posters, images, glb models or textures into the site, copying assets to public/media, or debugging media loading.
---

# SpaceMuse media map

All final web assets are already encoded in `materials/web/` and `materials/models/web/`, `materials/textures/`. **Copy, don't re-encode.** Credits: `materials/MANIFEST.md` / `docs/COPY.md`.

Suggested copy step (Sonnet, M0):
```
mkdir -p public/media/{footage,images,thennow,models,textures}
cp materials/web/footage/*            public/media/footage/
cp materials/web/images/*             public/media/images/
cp materials/web/thennow/*            public/media/thennow/
cp materials/models/web/*.web.glb     public/media/models/
cp materials/textures/{moon_color_4k,moon_color_2k,mars_color_4k,mars_color_2k,earth_color_2k,starfield_4k}.jpg materials/textures/moon_displacement_2k.png public/media/textures/
```

## Footage per beat (H.264, 30 fps, no audio)
Each beat has `<name>.1080.mp4`, `<name>.720.mp4` (mobile), `<name>.poster.jpg` and `<name>.poster.avif` (= last frame = rest frame).

| Beat | File | Duration | Notes |
|---|---|---|---|
| `enter` | `enter` | 3.0 s | VAB at dusk, SLS glowing in open doors |
| `ignition` (pre-roll, loop) | `ignition-pad` | 10 s | Ultra-wide 6144:2160 sunset silhouette → letterbox; loop as ambient before the countdown, or skip |
| `ignition` (rest before go) | `ignition-rest` | 10 s | Static pad + ocean, loopable ambient rest frame |
| `ignition` | `ignition` | 7.0 s | Pad → engine ignition (~2–3 s) → **liftoff ≈ 5.0 s** → clearing tower. Run T-5…T-0 overlay so **T-0 lands at 5.0 s**; fine-tune by eye |
| `ascent-1` | `ascent-1` | 3.5 s | Rocket climbing in blue sky (6.9× speed) |
| `ascent-2` | `ascent-2` | 3.5 s | Sky deepens to dark blue, Cessna 8K crop (12.6×) |
| `ascent-3` | `ascent-3` | 3.5 s | Booster separation (4×) |
| `ascent-4` | `ascent-4` | 4.0 s | Orion solar-array camera: fairing panel flies off, clouds below |
| `deep-space` | `deep-space` | 4.0 s | Earth limb from Orion; **last frame = match-cut target for the 3D Earth** |

Sizes: 1080p total ≈ 26 MB, 720p ≈ 9 MB. Preload only n+1 and n+2.

## Images
- Hero: `images/hero_vab_storm-2560.avif` (117 KB) with `-2560.jpg` fallback; `-1280` for mobile. Alt hero: `hero_vab_sunrise_alt-*`.
- Enter still (dolly-through door): `images/enter_vab_doors_open-*`.
- Finale: `images/finale_artemis_era_earthrise-*`.
- Then/Now: `thennow/<SM-ID>_<role>_<NASA-ID>-1600|800.{avif,jpg}`. Use `<picture>` with AVIF first, JPEG fallback.

## 3D
- Models (Meshopt + WebP compressed): `models/*.web.glb`. Load with drei `useGLTF(url, false, true)` (third arg enables the Meshopt decoder). Textures are WebP (glTF `EXT_texture_webp`) — supported by Safari 14+.
- Apollo LM model includes the ascent stage. Only the descent stage remains on the Moon → use a clipping plane on Y (bbox Y 0.10–5.12; cut ≈ 2.3–2.6, tune by eye) or label the model clearly.
- 5 exhibits have no NASA model (Surveyor 3, LRV, Pathfinder, Phoenix, GRAIL): render their Then photo in a platinum-framed lightbox on the plinth.
- Teaser silhouettes: render the 4 `SM-B-*.web.glb` with a black unlit material + rim light.
- Textures (equirectangular): `moon_color_4k.jpg` (+ `moon_displacement_2k.png` as bump/displacement), `mars_color_4k.jpg`, `earth_color_2k.jpg`, skybox `starfield_4k.jpg`. Set `texture.colorSpace = SRGBColorSpace`. Use 2K versions on mobile.

## Gotchas
- `<video muted playsInline preload="metadata" poster=...>`; set `src` per breakpoint (`matchMedia('(max-width: 768px)')` → `.720.mp4`).
- Never let a beat wait on `canplaythrough` forever: timeout 2.5 s → show poster and continue.
- Posters double as the reduced-motion experience.
- Keep the long-cache headers default from Vercel for `/media/*`; file names are already unique.
