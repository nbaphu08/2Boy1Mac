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
https://drive.google.com/file/d/1qXoWgO7DGME5F0zWnRyzlQEiVjsAWXxv/view?usp=sharing (29.9 s, English subtitles; verified public without login)

## 4. Link to Final Project
**https://spacemuse-beta.vercel.app** — public, no login; desktop and phone; a Lightweight (no-3D) mode is built in.
Also: 7-slide deck https://spacemuse-beta.vercel.app/slides (PDF: https://spacemuse-beta.vercel.app/slides/SpaceMuse-deck-2Boy1Mac.pdf) · source code https://github.com/nbaphu08/2Boy1Mac

## 5. Project Details (form field "Project Details *") — paste as plain text, bold the headings
**What it does**
SpaceMuse is a free, interactive 3D museum of twelve NASA machines that were left behind on the Moon and Mars — from Apollo 11's laser reflector, still used today, to the Ingenuity helicopter. Instead of browsing a list, visitors go on an expedition: they launch on an SLS rocket from Launch Complex 39B, see five targets glowing on the Moon at their real coordinates, land, and track each machine down on the ground; then they fly on to Mars, enter the atmosphere, and find seven more. The journey ends in a "Hall of Silence" (the last time each machine talked to Earth) and a closing message.

**How it works**
At every stop, a museum label answers the questions a newcomer actually asks: What is it? Why is it still here? What did it teach us? What is left today? A full panel adds the story, key dates and numbers (each with its source), sourced landing coordinates, and a Then/Now slider comparing a NASA surface photo with an orbital image of the same spot today (LRO or HiRISE). An audio tour speaks at every stop and each exhibit has its own audio guide. A tracker with a mini-map lets visitors fly to any site, and a Field Log stamps each machine they find. A 14-second GRAIL simulation paints NASA's real lunar gravity map onto the Moon.

**Benefits and intended impact**
Students meet space history the way they meet places: by going there. A discarded machine becomes a story with a reason (why it stayed), a result (what it taught us) and a present (what is there now). The tour opens with a question — "Are these machines junk, or history?" — and answers it with NASA's 2011 guidance and the 2020 U.S. law protecting Apollo sites: these are the first historic sites beyond Earth. Our goal is a one-click classroom visit that any teacher can use, on a laptop or a phone.

**How it is creative**
We turned a catalogue into a mission: the visitor earns each discovery by flying, landing and searching, so the 3D is not decoration but the way the story is told. The GRAIL exhibit is not a model on a shelf but a short simulation using the mission's own gravity data. Each machine ends with "what it taught us", so debris becomes discovery.

**Factors our team considered**
- Accuracy: every number and date has a cited NASA or partner source; where sources disagree we do not state a number. The voyage is clearly labelled imagined, and 3D scenes are labelled illustrative reconstructions.
- Audience: written for students with no prior knowledge — plain language, a mission briefing, and voice narration for visitors who prefer to listen.
- Accessibility and devices: keyboard navigation, reduced-motion support, a Lightweight no-3D mode, and quality tiers so it runs on phones.
- Honesty about AI: real NASA photos are shown unmodified and credited; AI-assisted 3D is watermarked; AI narration is disclosed in text and file metadata.
- Respect for heritage: our generated 3D contains no NASA logos, flags or mission identifiers.

**Tools**
TypeScript, React 19, Next.js 16, Three.js / React Three Fiber, GSAP and Lenis for scroll animation, Tailwind CSS, Vercel hosting; Playwright for automated visual and performance tests; ffmpeg for media; ElevenLabs for the exhibit narration voice; AI assistants (Anthropic Claude, Google Gemini) for research cross-checking, writing support, code and procedural 3D. Data: NASA NSSDCA, LRO/LROC, HiRISE, NASA SVS (GRAIL gravity map, CGI Moon Kit), NASA 3D Resources, NASA Image and Video Library, NASA History Program Office.

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
| 0:00–0:02 | Title card over the landing VAB photo | Team 2Boy1Mac (Vietnam): Nguyễn Bá Phú, Võ Bảo Duy |
| 0:02–0:05 | Landing hero, cursor on *Visit gallery* | Challenge: Abandoned but not Forgotten — NASA's equipment left on the Moon and Mars. |
| 0:05–0:10 | SLS on the pad across the lagoon → ignition | SpaceMuse: an expedition to the machines we left behind. |
| 0:10–0:15 | Lunar orbit with 5 pins → touchdown → Apollo 11 card | Fly, land and track down 12 real machines — built from NASA data, images and 3D models. |
| 0:15–0:20 | GRAIL gravity-map simulation → Mars entry → Ingenuity | Every stop answers: What is it? Why is it still here? What did it teach us? |
| 0:20–0:30 | Finale "They are not junk. They are history." + URL | The first historic sites beyond Earth — worth remembering. spacemuse-beta.vercel.app |

## 10. Slide deck — 7 slides (extra visual aid, linked from §4)
1. **Title** — SpaceMuse · Team 2Boy1Mac · members Nguyễn Bá Phú, Võ Bảo Duy · Challenge: *Abandoned but not Forgotten*.
2. **The problem** — hundreds of objects left on the Moon and Mars; most people don't know they exist, why they stayed, or why they matter.
3. **Our idea** — an expedition, not a list: launch → land → track down 12 machines.
4. **The visitor experience** — exhibit card (questions), Then/Now, audio tour, mini-map, Field Log.
5. **Built on NASA data** — NSSDCA, LRO/LROC, HiRISE, GRAIL gravity map, NASA 3D Resources, NASA History Office catalogue (names only, no logos).
6. **The message** — "Junk or history?" → NASA 2011 guidance + 2020 law → heritage sites beyond Earth.
7. **What's next + links** — more sites, worksheets, languages; site, video, GitHub; SI disclosure line.

---

## 11. Pre-submit checklist
- [x] Team members: Nguyễn Bá Phú, Võ Bảo Duy (slide 1, About page, form).
- [ ] Demo video ≤ 30 s, English subtitles, uploaded public — tested in a private window.
- [ ] Slide deck ≤ 7 slides, public link — tested in a private window.
- [ ] Site opens without login in a private window (desktop + phone).
- [ ] No NASA logos/flags in our generated 3D; SI label visible; MP3 metadata tagged; About AI statement present.
- [ ] No images/video/audio of anyone under 18.
- [ ] All fields in English; tick "Terms and Conditions" + "Confirm All Work is Original" → **Submit for Judging** (resubmitting is allowed; the last save counts).
- [ ] Recommended: request a FortiGuard Web Filter Classification for spacemuse-beta.vercel.app (Category: Education; Company Name: N/A).
