# SpaceMuse — Submission Pack (v3, Sun 15 Nov 2026)

Copy each block into the matching field of the Space Apps **Project** tab (all content must be in English).
Follows the official *2026 Project Submission Guide* (form fields, demo rules, SI disclosure, NASA data).
Deadline: **Sun 15 Nov, 11:59 p.m. local time** of our Local Event — target: click **Submit for Judging by 20:00**.
Only use **https://spacemuse-beta.vercel.app** (deployment URLs like `spacemuse-xxxx-nbaphu08.vercel.app` are behind Vercel login).

---

## 1. Project Name
**SpaceMuse: The Expedition to the Machines We Left Behind**

## 2. High-Level Project Summary
SpaceMuse is a free, interactive online museum of twelve NASA machines left behind on the Moon and Mars, from Apollo 11's still-working laser mirror to the Ingenuity helicopter. Visitors don't browse a list: they launch on an SLS rocket, land on the Moon, track each machine down on the ground, then fly on to Mars and do the same. At every stop a museum label answers the questions a newcomer actually asks — *What is it? Why is it still here? What did it teach us? What is left today?* — with real NASA "then" photos and orbital "now" images. The tour opens with a question (*"Are these machines junk, or history?"*) and ends with the answer: they are the first historic sites beyond Earth, now protected by NASA guidance (2011) and U.S. law (2020). It answers "Abandoned but not Forgotten" by turning discarded hardware into stories students can follow, hear and remember — with every fact sourced.

## 3. Link to Project Demo
`<public YouTube (unlisted) or Google Drive link to the 30-second video>` — script in §9.

## 4. Link to Final Project
**https://spacemuse-beta.vercel.app** — public, no login; desktop and phone; a Lightweight (no-3D) mode is built in.
Also: 7-slide deck `<public link — see §10>` · source code https://github.com/nbaphu08/2Boy1Mac

## 5. Detailed Project Description

**What it does**
- **A guided expedition, not a gallery.** Landing page → *Visit gallery* → one continuous, scroll-driven 3D journey: SLS/Orion launch from Launch Complex 39B → lunar orbit with five target pins at their real coordinates → descent and touchdown → low flights from site to site → Mars orbit with seven pins → atmospheric entry and landing → the same search on Mars → *Hall of Silence* (each machine's last contact) → *Beyond* (machines still talking, e.g. Voyager 1) → finale.
- **Twelve exhibits:** Apollo 11 (Eagle descent stage + laser reflector), Surveyor 3, Apollo 15 Lunar Roving Vehicle, Apollo 17, GRAIL Ebb & Flow impact site, Viking 1, Mars Pathfinder & Sojourner, Spirit, Opportunity, Phoenix, InSight, Ingenuity.
- **Museum labels built for newcomers:** each exhibit answers *What is it? / Why is it still here? / What it taught us*; the full panel adds the story, key dates and numbers (each with its source), a Then/Now slider (NASA surface photo vs. LRO/HiRISE orbital image), sourced coordinates, and objects left nearby.
- **A through-line message:** a mission briefing asks *"Are these machines junk, or history?"*; the finale answers with NASA's 2011 recommendations to protect Apollo sites and the *One Small Step to Protect Human Heritage in Space Act* (2020), then asks visitors what future crews should do with these machines.
- **Interactive and accessible:** a target-tracking HUD with a mini-map (click a pin to fly there), a Field Log that stamps every machine you find, an audio tour that speaks at each stop plus an audio guide per exhibit, a 14-second GRAIL simulation that paints NASA's real gravity map onto the Moon, keyboard navigation, reduced-motion and Lightweight modes, and a Collection page with a story map.

**How it works**
Next.js 16 (App Router, TypeScript) and Tailwind on Vercel. The journey is React Three Fiber / Three.js driven by one scroll timeline (GSAP ScrollTrigger + Lenis) that moves a single continuous camera path. Scenes are built in code from NASA dimensions and imagery, plus NASA 3D Resources models (Apollo LM, Viking, MER, InSight, Ingenuity). Real NASA maps texture the worlds (LRO/CGI Moon Kit, Viking MDIM, GRAIL gravity map). Quality tiers adapt to the device, and shaders are pre-compiled during the launch so landings stay smooth. All text lives in typed content files with a source ID on every number.

**Benefits**
Students meet space history the way they meet places: by going there. Abstract hardware becomes a story with a reason (why it stayed), a result (what it taught us) and a present (what is there now). It shows that exploration leaves heritage, not just debris, and why that heritage matters as the Moon gets busy again.

**What we hope to achieve**
A free classroom resource teachers can open in one click. Next: more sites (Luna, Chang'e, Apollo 12/14/16), teacher worksheets, more languages, and updates as Artemis crews return to the lunar surface.

**Tools**
TypeScript, React 19, Next.js 16, Three.js / React Three Fiber / drei / postprocessing, GSAP + Lenis, Zustand, Tailwind CSS, Vercel; Playwright for automated visual and performance tests; ffmpeg for media; ElevenLabs for the narration voice; AI assistants (see §6).

## 6. Use of Super Intelligence (SI) *(data collection only, not shown to judges)*
Yes. AI assistants — Anthropic Claude (Opus, Sonnet) and Google Gemini (via Antigravity) — helped us plan, research and cross-check facts against NASA sources, draft text, write code, and build the procedural 3D reconstructions. The idea, story and every fact were decided and verified by the team against the primary sources cited on the site. Narration audio is AI-generated speech (ElevenLabs) reading our own sourced scripts.
**Visible to judges:** a label on every 3D view ("Illustrative 3D reconstruction · AI-assisted"); the AI statement on the About page; ID3 metadata on every MP3; `AI_DISCLOSURE.md` and `package.json` in the repository. Real NASA photographs are shown unmodified with credits; our generated 3D contains no NASA logos, flags or mission identifiers.

## 7. NASA Data
- **NSSDCA Master Catalog** (NASA GSFC): mission dates, spacecraft dimensions, landing coordinates (Surveyor 3, Apollo 11/15/17, Viking 1, Mars Pathfinder, Spirit, Opportunity).
- **NASA History Program Office:** *Catalogue of Manmade Material on the Moon* (2012); *Recommendations to Space-Faring Entities: How to Protect and Preserve the Historic and Scientific Value of U.S. Government Lunar Artifacts* (2011).
- **LRO / LROC** (NASA GSFC / Arizona State University): "now" images of Apollo and GRAIL sites; GRAIL impact-crater coordinates.
- **GRAIL gravity map:** NASA SVS 4014 free-air gravity (NASA/ARC-MIT/JPL-Caltech/GSFC), used in the GRAIL simulation.
- **HiRISE / Mars Reconnaissance Orbiter** (NASA/JPL-Caltech/University of Arizona): "now" images of Mars landers and rovers.
- **NASA Image and Video Library & JPL Photojournal:** Apollo surface photography (e.g. AS12-48-7133/7134, AS15-86-11603, AS16-113-18339), PIA mission images, VAB and Artemis II photography, GRAIL and Surveyor references.
- **NASA SVS:** CGI Moon Kit (LRO color + elevation), Deep Star Maps 2020 · **NASA/JPL/USGS:** Viking MDIM 2.1 Mars mosaic.
- **NASA 3D Resources:** Apollo Lunar Module, Viking Lander, MER, InSight, Ingenuity, NEAR Shoemaker, MESSENGER, Cassini, Voyager.
- **NASA Science & JPL mission pages, Apollo Lunar Surface Journal, NASA SP-284 (Surveyor 3 materials), NASA SP-350 (Apollo Expeditions to the Moon)**, **NASA PDS Geosciences Node** (Phoenix landing site).

## 8. Space Agency Partner Data and Other References
- Space Agency Partner data: none used directly.
- Other references: *Science* GRAIL papers (Dec 2012); InSight *Science* papers (2021); Public Law 116-275 (2020); Space.com, MIT News and Caltech records cited per fact. Fonts: Archivo, Inter, JetBrains Mono (Google Fonts, SIL OFL). Open-source libraries listed in `package.json` (MIT/Apache-2.0).
- Per-fact sources: About page, every exhibit panel, `docs/COORDINATES.md`, `docs/LEGACY_SOURCES.md`.

---

## 9. Demo video — 30 seconds, English subtitles (guide timeline)
Recorded from the live site; the SI label is visible on all 3D frames.
| Time | Picture | Subtitle |
|---|---|---|
| 0:00–0:02 | Title card over the landing VAB photo | Team 2Boy1Mac · Vietnam |
| 0:02–0:05 | Landing hero, cursor on *Visit gallery* | Challenge: Abandoned but not Forgotten — NASA's equipment left on the Moon and Mars. |
| 0:05–0:10 | SLS on the pad across the lagoon → ignition | SpaceMuse: an expedition to the machines we left behind. |
| 0:10–0:15 | Lunar orbit with 5 pins → touchdown → Apollo 11 card | Fly, land and track down 12 real machines — built from NASA data, images and 3D models. |
| 0:15–0:20 | GRAIL gravity-map simulation → Mars entry → Ingenuity | Every stop answers: What is it? Why is it still here? What did it teach us? |
| 0:20–0:30 | Finale "They are not junk. They are history." + URL | The first historic sites beyond Earth — worth remembering. spacemuse-beta.vercel.app |

## 10. Slide deck — 7 slides (extra visual aid, linked from §4)
1. **Title** — SpaceMuse · Team 2Boy1Mac · members `<names>` · Challenge: *Abandoned but not Forgotten*.
2. **The problem** — hundreds of objects left on the Moon and Mars; most people don't know they exist, why they stayed, or why they matter.
3. **Our idea** — an expedition, not a list: launch → land → track down 12 machines.
4. **The visitor experience** — exhibit card (questions), Then/Now, audio tour, mini-map, Field Log.
5. **Built on NASA data** — NSSDCA, LRO/LROC, HiRISE, GRAIL gravity map, NASA 3D Resources, NASA History Office catalogue (names only, no logos).
6. **The message** — "Junk or history?" → NASA 2011 guidance + 2020 law → heritage sites beyond Earth.
7. **What's next + links** — more sites, worksheets, languages; site, video, GitHub; SI disclosure line.

---

## 11. Pre-submit checklist
- [ ] Team members' full names (slide 1, About page, form).
- [ ] Demo video ≤ 30 s, English subtitles, uploaded public — tested in a private window.
- [ ] Slide deck ≤ 7 slides, public link — tested in a private window.
- [ ] Site opens without login in a private window (desktop + phone).
- [ ] No NASA logos/flags in our generated 3D; SI label visible; MP3 metadata tagged; About AI statement present.
- [ ] No images/video/audio of anyone under 18.
- [ ] All fields in English; tick "Terms and Conditions" + "Confirm All Work is Original" → **Submit for Judging** (resubmitting is allowed; the last save counts).
- [ ] Recommended: request a FortiGuard Web Filter Classification for spacemuse-beta.vercel.app (Category: Education; Company Name: N/A).
