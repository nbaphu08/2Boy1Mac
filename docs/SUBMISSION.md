# SpaceMuse — Submission Pack (v2, 15 Nov 2026)

> **Cách dùng:** Phần A–F là **văn bản nộp bài bằng tiếng Anh**, dán thẳng vào form Space Apps. Phần G là kịch bản video demo, phần H là checklist trước 20:00.
> **Link nộp:** chỉ dùng **https://spacemuse-beta.vercel.app**. Các link deploy dạng `spacemuse-xxxx-nbaphu08.vercel.app` bị Vercel SSO chặn, giám khảo sẽ không mở được.
> Tên trường trong form có thể khác bản 2026. Hãy đối chiếu với Project Submission Guide 2026 và đặt mỗi khối vào ô gần nghĩa nhất.
> **Cần team chốt:** độ tuổi mục tiêu. Bản nháp dưới đây ghi "ages 10–15 and curious adults"; nếu muốn khác thì sửa ở phần A và C.

---

## A. Project name & one-liner

**SpaceMuse** — *A museum of the machines we left behind, on the Moon and Mars.*

**Challenge:** Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars

**Final project link:** https://spacemuse-beta.vercel.app
**Demo video (≤ 30 s):** `<YouTube/Drive link>`

## B. High-level summary (≈ 150 words)

Every machine NASA left on the Moon and Mars once had a job, a team and a last message home. SpaceMuse turns twelve of them into a museum you can fly through. Visitors scroll through one continuous 3D journey: from the Vehicle Assembly Building and an Artemis-era launch, past the Moon, and on to Mars. On the way they find the real machines in reconstructed settings: Apollo 11's laser mirror, still answering, Spirit stuck in the sand at Troy, InSight under its dust. Each exhibit opens like a museum label and explains what the machine was built to do, how it actually worked, and what we learned from it, with a Then/Now slider comparing surface photos with today's orbital images. A story map shows where each machine rests. The Hall of Silence lists the last time each one talked to Earth. All 72 sources are NASA, JPL, NSSDCA or Smithsonian pages, linked next to the facts they support.

## C. Project details

### What it does
SpaceMuse is a free, story-driven web museum for **school-age space enthusiasts (about ages 10–15) and curious adults**. It answers the four questions a newcomer actually asks about an abandoned spacecraft: *What is it? What did it do? How did it work? Why is it still there?*

- **The journey (`/journey`).** One continuous scroll. A briefing sets the mission ("find the machines we left behind") and says plainly that the voyage is imagined while every machine and fact is real. The visitor rides an illustrative SLS/Orion launch from Launch Complex 39B, then flies low over the Moon and Mars to **12 exhibits**:
  - **Hall I, the Moon:** Apollo 11 (Eagle's descent stage and laser reflector), Surveyor 3, the Apollo 15 Lunar Roving Vehicle, Apollo 17, GRAIL Ebb & Flow.
  - **Hall II, Mars:** Viking 1, Mars Pathfinder & Sojourner, Spirit, Opportunity, Phoenix, InSight, Ingenuity.
  - **Hall of Silence:** the last time Earth heard from each machine.
  - **Hall III, Beyond (teaser):** NEAR Shoemaker, MESSENGER, Cassini, Voyager 1.
- **Exhibit panels.** Each one is a museum label with a catalogue number, a live counter of time on the surface, status (SILENT / STILL ACTIVE), and a three-step **"How did it work?"** strip: *Built to → How it worked → What we learned*. It also has the story, the discoveries, why the machine went silent, a "For young explorers" line, a Then/Now photo slider, a 3D model viewer and a numbered source list.
- **Showing how missions operated, not just listing facts.** Examples:
  - Pathfinder bounced to a stop inside airbags.
  - Spirit's broken wheel scraped open the soil and exposed silica, evidence of an ancient wetter Mars.
  - GRAIL's twins measured tiny changes in the distance between them to map the Moon's gravity. GRAIL also has a time-compressed 3D simulation that uses NASA's real gravity map.
- **Accuracy as part of the story.** Myths are corrected on the page:
  - Opportunity's famous "My battery is low and it's getting dark" is labelled as a journalist's paraphrase, not a real message.
  - A **Plot twist** card on Surveyor 3 explains why the "germs that survived on the Moon" were probably contaminated back on Earth.
- **Story map (`/collection`).** Moon and Mars maps with clickable pins placed from published NASA coordinates (Ingenuity is left unpinned because NASA has not published its final position). Each pin opens a story card.
- **Audio guide.** AI-voiced narration of our sourced scripts: one clip per exhibit plus a narrated tour along the journey.
- **Explore further.** Exhibit pages link to the same spacecraft in **NASA's Eyes on the Solar System**, where NASA's Eyes includes them.
- **Field log.** Visitors collect a stamp at each machine and earn a printable certificate when they have found all twelve.

### How it works (technical)
- **Stack:**
  - Next.js 16 (App Router, TypeScript) and Tailwind CSS v4.
  - Three.js with React Three Fiber and drei for the 3D scenes.
  - GSAP ScrollTrigger and Lenis to drive the camera from scroll position.
  - Deployed on Vercel.
- **3D:** procedural reconstructions and NASA 3D Resources models, sized from NASA dimensions (NSSDCA, JPL press kits). Terrain uses NASA SVS lunar color and elevation, the Viking MDIM 2.1 Mars mosaic and NASA Deep Star Maps. All reconstructions are labelled illustrative.
- **Content pipeline:** every visible fact lives in typed content files with a source ID, checked against a fact sheet built from primary sources. No unsourced numbers, dates or quotes.
- **Accessibility and performance:**
  - Full keyboard navigation and visible focus.
  - `prefers-reduced-motion` support.
  - A **Lightweight mode**, and an automatic fallback when WebGL is unavailable, that replace the 3D canvas with pre-rendered 3D posters while keeping all text and navigation.
  - Every exhibit also has a static, shareable page (`/exhibit/<name>`).
  - Lighthouse accessibility 0.96–1.00 on the exhibit and collection pages.

### Benefits & intended impact
- **Brings dormant missions into the classroom.** Students mostly hear about active missions. SpaceMuse gives a dozen past ones a face, a place on a map, and a reason they matter today. For example, laser ranging to Apollo 11's reflector shows the Moon drifting away by about 3.8 cm a year.
- **Teaches engineering and science together.** Each "How did it work?" strip links a piece of hardware to the discovery it made possible.
- **Models good science habits.** Visitors can see sources, corrected myths and honest uncertainty, including an unpinned Ingenuity and dates shown the way NASA states them.
- **Frames the machines as heritage.** The Hall of Silence draws on NASA's 2011 recommendations for protecting U.S. lunar artifacts, so visitors leave seeing these machines as heritage rather than space junk.

### What we would do next
- Open Hall III fully: Voyager 1 and 2, Pioneer 10 and 11, Dawn at Ceres, Kepler.
- Add Viking 2 and the other Apollo sites.
- Translate the site and audio guide, starting with Vietnamese.
- Add a teacher mode with printable activity sheets.
- Add a "keep the rover alive" mini-game about power, dust and winter.
- Add new Artemis-era landing sites as they happen.

## D. NASA data & resources used

- **NSSDCA Master Catalog** (NASA Goddard): mission dates, spacecraft dimensions, final status (Surveyor 3, Apollo LM, LRV, Viking, NEAR…).
- **NASA History Program Office**, *Catalogue of Manmade Material on the Moon* (2012): coordinates and objects for every lunar exhibit; *NASA's Recommendations to Space-Faring Entities: How to Protect and Preserve the Historic and Scientific Value of U.S. Government Lunar Artifacts* (2011).
- **NASA Science, JPL and NASA mission pages** for Apollo 11/15/17, Surveyor 3, GRAIL, Viking, Mars Pathfinder, Spirit, Opportunity, Phoenix, InSight and Ingenuity: stories, discoveries and end-of-mission details.
- **Apollo Lunar Surface Journal** and Apollo Preliminary Science Reports.
- **Lunar Reconnaissance Orbiter Camera** (NASA/GSFC/Arizona State University): "Now" images of the Apollo and GRAIL sites.
- **HiRISE on Mars Reconnaissance Orbiter** (NASA/JPL-Caltech/University of Arizona): "Now" images of the Mars landers and rovers.
- **NASA Image and Video Library:** Apollo surface photography, PIA mission images, Vehicle Assembly Building photography, Artemis II imagery.
- **NASA Scientific Visualization Studio:** CGI Moon Kit (LRO color and elevation), Deep Star Maps 2020.
- **NASA/JPL/USGS:** Viking MDIM 2.1 colorized Mars mosaic.
- **NASA 3D Resources:** spacecraft models (Apollo LM, Viking Lander, MER, InSight, Ingenuity, NEAR, MESSENGER, Cassini, Voyager).
- **NASA's Eyes on the Solar System:** deep links from exhibit pages.
- **NASA GSFC research** (Glavin et al., *In Situ Biological Contamination Studies of the Moon*): the Surveyor 3 contamination story.
- The full list of **72 sources** is on the About page and in every exhibit panel.

**Space agency partner data:** none used directly.

## E. Use of AI (disclosure)

We used AI assistants (Anthropic Claude models and Google Gemini) to plan the project, research and cross-check facts against NASA sources, draft text, write code and build procedural 3D reconstructions. Every fact on the site was verified by the team against the primary sources it cites. All photographs are real NASA or partner images. The 3D scenes are reconstructions built in code from NASA dimensions and imagery and are labelled illustrative. No AI-generated image or video is presented as real. The audio guide is AI-generated speech (ElevenLabs) reading our sourced scripts, and the About page says so.

## F. Team

**2Boy1Mac** — `<tên thành viên, quốc gia: Vietnam>`

---

## G. Demo video, 30 seconds (English subtitles)

Thứ tự cảnh bám theo các tiêu chí chấm: mở bằng câu chuyện, chứng minh "how it worked" và độ chính xác, kết bằng cảm xúc.

| t (s) | Màn hình | Phụ đề |
|---|---|---|
| 0–3 | Landing `/`: tiêu đề SPACEMUSE trên ảnh VAB | NASA left machines on the Moon and Mars. We built them a museum. |
| 3–7 | `/journey`: briefing YOUR MISSION → SLS rời bệ (tua nhanh) | Scroll to fly. Your mission: find what we left behind. |
| 7–11 | Bay thấp trên Mặt Trăng → spotlight Apollo 11, nhãn STILL ACTIVE | Apollo 11's laser mirror still answers us today. |
| 11–16 | Mở panel Spirit: cuộn tới HOW DID IT WORK? (3 bước) | Every exhibit shows how it worked, and what we learned. |
| 16–19 | Panel Surveyor 3: thẻ PLOT TWIST, hover vào tag nguồn S71 | Myths corrected. Every fact linked to its NASA source. |
| 19–23 | `/collection`: Story map, bấm pin Opportunity trên Mars | A story map of where each machine rests. |
| 23–27 | Hall of Silence, các dòng hiện lần lượt | The last time we heard from each of them. |
| 27–30 | End card: SpaceMuse · spacemuse-beta.vercel.app · 2Boy1Mac · NASA Space Apps 2026 | Abandoned, but not forgotten. |

### `demo.srt`

```
1
00:00:00,000 --> 00:00:03,000
NASA left machines on the Moon and Mars. We built them a museum.

2
00:00:03,000 --> 00:00:07,000
Scroll to fly. Your mission: find what we left behind.

3
00:00:07,000 --> 00:00:11,000
Apollo 11's laser mirror still answers us today.

4
00:00:11,000 --> 00:00:16,000
Every exhibit shows how it worked, and what we learned.

5
00:00:16,000 --> 00:00:19,000
Myths corrected. Every fact linked to its NASA source.

6
00:00:19,000 --> 00:00:23,000
A story map of where each machine rests.

7
00:00:23,000 --> 00:00:27,000
The last time we heard from each of them.

8
00:00:27,000 --> 00:00:30,000
Abandoned, but not forgotten.
```

**Mẹo quay:**
- Quay ở 1920×1080 trên máy có GPU thật, tắt thông báo hệ thống, ẩn con trỏ khi không cần.
- Không quay kèm âm thanh (site không dùng nhạc nền). Nếu muốn có giọng đọc, dùng đoạn audio guide Apollo 11 làm nền cho giây 7–11.
- Đăng lên YouTube ở chế độ **Unlisted hoặc Public**, rồi mở thử link trong cửa sổ ẩn danh.

## H. Checklist trước 20:00

- [ ] Production `spacemuse-beta.vercel.app` đã chạy bản mới nhất: có mục "How did it work?", thẻ Plot twist và link NASA's Eyes.
- [ ] Mở link trong cửa sổ ẩn danh, trên 1 laptop và 1 điện thoại thật. Thử cả chế độ Lightweight.
- [ ] Bấm thử 3 link NASA's Eyes (Spirit, Opportunity, InSight): app phải mở đúng tàu.
- [ ] Chốt độ tuổi mục tiêu (phần A và C) và điền tên thành viên (phần F).
- [ ] Quay video theo phần G, đăng lên, mở thử link công khai.
- [ ] Dán phần A–E vào form, kiểm tra giới hạn ký tự từng ô, bấm Submit trước 20:00 (hạn chót 23:59).
- [ ] Sau khi nộp: không deploy lên production nữa, trừ khi sửa lỗi nghiêm trọng.
