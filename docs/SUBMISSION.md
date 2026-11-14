# SpaceMuse — Submission Pack & Team Playbook

> Phần 1–5 là **văn bản nộp bài (tiếng Anh)**, dán thẳng vào form Space Apps sau khi điền URL thật. Phần 6–7 là **cách vận hành team 2 người** trong 39 giờ.
> Theo hướng dẫn nộp bài 2025, demo là **video ≤ 30 giây (phụ đề tiếng Anh) hoặc ≤ 7 slide, đăng ở link công khai**. Hãy đối chiếu lại với Project Submission Guide 2026 (công bố 13/11).

---

## 1. Project text

**Project name:** SpaceMuse

**Challenge:** Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars

**High-level summary (≈150 words):**
SpaceMuse is an interactive museum for the machines humanity left behind on the Moon and Mars. Visitors start at Kennedy Space Center's Vehicle Assembly Building, ride a 3D reconstruction of the SLS rocket and Orion spacecraft from Launch Complex 39B into space — scrolling continuously — and arrive at two galleries built on other worlds. Each of the twelve exhibits, from Apollo 11's still-working laser reflector to the Ingenuity helicopter, is recreated in its real setting — Spirit stuck in the sand, Phoenix with its ice-crushed solar panel, InSight under its dust — and stands under a spotlight with a museum plaque: catalogue number, a live counter of how long it has been there, its story, what it discovered, why it went silent, and a "Then / Now" slider pairing surface photos with today's orbital images from LRO and HiRISE. Every number links to its NASA source. A final Hall of Silence lists the last time Earth heard from each machine. Built for school-age explorers, SpaceMuse turns "space junk" into heritage worth remembering — and protecting.

**Details / how it works:**
- Continuous-scroll 3D journey (Three.js / React Three Fiber, GSAP ScrollTrigger, Lenis): a procedural SLS Block 1 + Orion launch from LC-39B, ascent, booster separation and fairing jettison, then real-time dioramas on the Moon and Mars built on NASA 3D Resources models, LRO lunar textures and the Viking Mars mosaic. Every model is checked against NASA dimensions (NSSDCA, JPL press kits) and labelled as an illustrative reconstruction.
- 12 exhibits (5 Moon, 7 Mars) + a "Hall III — Beyond" teaser (NEAR, MESSENGER, Cassini, Voyager 1).
- Museum features: catalogue numbers, live "time on the surface" counters, Then/Now orbital comparisons, sources on every fact, a visitor passport, and an accessible gallery view.
- Tech: Next.js, TypeScript, GSAP, React Three Fiber, deployed on Vercel. Works with keyboard and reduced-motion settings.

**Benefits / impact:** Makes NASA's open imagery and mission records approachable for students; teaches mission science through objects; raises awareness that these sites are historic heritage (NASA's 2011 recommendations for protecting Apollo sites).

**Future work:** Open Hall III (deep space), add Artemis-era sites as new landings happen, a teacher mode with printable activity sheets, and translations.

## 2. Demo video — shot list (30 s)

| t (s) | Screen | Subtitle |
|---|---|---|
| 0–3 | Hero: VAB at dawn, title SPACEMUSE | A museum of the machines we left behind. |
| 3–7 | Scroll → VAB → SLS on the pad → main engine start → liftoff | Scroll to fly: a 3D reconstruction of the Artemis II launch. |
| 7–11 | Ascent → booster separation → WELCOME TO SPACE | From Kennedy Space Center to space… |
| 11–15 | Moon appears → spotlight on Apollo 11 | …to galleries on the Moon and Mars. |
| 15–20 | Open Apollo 11 panel: live counter, STILL ACTIVE, Then/Now slider drag | Each exhibit: its story, its age, and how it looks from orbit today. |
| 20–25 | Mars: Opportunity panel, sources list | 12 NASA machines. Every fact linked to its NASA source. |
| 25–28 | Hall of Silence wall | The last time we heard from each of them. |
| 28–30 | End card: SpaceMuse · URL · team 2Boy1Mac · NASA Space Apps 2026 | SpaceMuse — abandoned, but not forgotten. |

## 3. `demo.srt`

```
1
00:00:00,000 --> 00:00:03,000
A museum of the machines we left behind.

2
00:00:03,000 --> 00:00:07,000
Scroll to fly: a 3D reconstruction of the Artemis II launch.

3
00:00:07,000 --> 00:00:11,000
From Kennedy Space Center to space…

4
00:00:11,000 --> 00:00:15,000
…to galleries on the Moon and Mars.

5
00:00:15,000 --> 00:00:20,000
Each exhibit: its story, its age, and how it looks from orbit today.

6
00:00:20,000 --> 00:00:25,000
12 NASA machines. Every fact linked to its NASA source.

7
00:00:25,000 --> 00:00:28,000
The last time we heard from each of them.

8
00:00:28,000 --> 00:00:30,000
SpaceMuse — abandoned, but not forgotten.
```

## 4. NASA data & resources used

- NASA Image and Video Library — Vehicle Assembly Building photography (hero), Artemis II "Artemis Era Earthrise" (finale reference), Apollo surface photography and Mars mission images (PIA series) used in every exhibit's Then/Now comparison.
- NASA History Program Office — Catalogue of Manmade Material on the Moon (2012).
- Lunar Reconnaissance Orbiter Camera (NASA/GSFC/Arizona State University) — Apollo 11, 12, 15, 17 and GRAIL impact sites.
- HiRISE on Mars Reconnaissance Orbiter (NASA/JPL-Caltech/University of Arizona) — Viking 1, Pathfinder, Spirit, Opportunity, Phoenix, InSight, Ingenuity.
- NASA Scientific Visualization Studio — CGI Moon Kit (LRO color + elevation), Deep Star Maps 2020.
- NASA Earth Observatory — Blue Marble Next Generation.
- NASA/JPL/USGS — Viking MDIM 2.1 colorized Mars mosaic.
- NASA 3D Resources — Apollo Lunar Module, Viking Lander, Mars Exploration Rover, InSight, Ingenuity, NEAR, MESSENGER, Cassini, Voyager.
- NSSDCA Master Catalog, NASA Science and JPL mission pages, Apollo Lunar Surface Journal — fact-checking (70 cited sources, see the About page).

## 5. AI usage disclosure (dùng nếu form yêu cầu)

We used AI assistants (Anthropic Claude models and Google Gemini) to help plan the project, research and cross-check facts against NASA sources, draft text, write code and build procedural 3D reconstructions. All facts were verified against the primary sources cited on the site. All photographs are real NASA/partner media; the 3D scenes are procedural reconstructions built in code from NASA dimensions and imagery and are labelled as illustrative; no AI-generated images or video are presented as real (illustrations are labelled "Artist's concept").

---

## 6. Team playbook: 2 người, 2 builder

| | **Người A: "Pilot Fable"** | **Người B: "Pilot Sonnet"** |
|---|---|---|
| Điều khiển | Phiên Claude Code chạy **Fable** | Phiên Claude Code chạy **Sonnet** |
| Phụ trách | Trải nghiệm Journey: cảm giác cuộn, chuyển cảnh, 3D | Nội dung, các trang, asset, deploy, **nộp bài** |
| Test tay | Trackpad MacBook + chuột | iPhone/Android + Safari |
| Quyết định cắt giảm | Phạm vi 3D | Phạm vi nội dung, thời điểm feature freeze |

**Quy tắc làm việc:**
1. Cả hai làm trên **cùng một repo git, mỗi builder một branch** (`fable/*`, `sonnet/*`). Merge vào `main` theo từng milestone. Sonnet tạo `lib/store.ts` và các kiểu dữ liệu ngay từ đầu.
2. **Mỗi 2 giờ sync 10 phút**: xem preview URL, ghi quyết định vào `docs/PROGRESS.md`.
3. Khi builder bị kẹt quá 30 phút ở một lỗi: dừng lại, đổi cách làm, hoặc cắt tính năng theo danh sách cắt giảm trong PLAN §11.
4. Lệnh khởi động phiên: `Đọc CLAUDE.md và docs/BRIEF_<TÊN>.md rồi bắt đầu M0.`
5. Cuối mỗi milestone: chạy skill `spacemuse-review`.

**Thiết bị test thật (chuẩn bị từ trước):** MacBook có trackpad, một con chuột rời, một iPhone (Safari), Chrome và Safari trên desktop.

## 7. Trước 9:00 ngày 14/11: checklist chuẩn bị

- [ ] Cài Node.js LTS, `npm i -g vercel` (CLI đang cũ: 65.8.0 → 65.14.0), `vercel login`.
- [ ] Tạo repo GitHub (private), `git init` trong thư mục dự án, commit tài liệu và `materials/web/` (các file nặng đã nằm trong `.gitignore`).
- [ ] Cài bộ cấu hình Claude Code: xem `setup/README.md`.
- [ ] Đọc `docs/COPY.md`, chọn ảnh hero.
- [ ] Đọc Project Submission Guide 2026 ngay khi Space Apps công bố (13/11).
- [ ] Tạo sẵn kênh YouTube hoặc thư mục Drive để đăng video demo.
- [ ] Đi ngủ sớm đêm 13/11.
