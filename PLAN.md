# SPACEMUSE — Master Plan v4 (3D continuous scroll · Antigravity + Sonnet + Opus)

> Cập nhật: **11:50 thứ Bảy 14/11/2026**. Hạn nộp: **23:59 Chủ nhật 15/11** (còn khoảng 36 giờ). **Mục tiêu nộp bài: 20:00 Chủ nhật.**
> Plan cũ (step-scroll + footage) đã lưu tại `docs/archive/PLAN_v3_step-scroll-footage.md`. **Các phần vẫn còn giá trị** từ plan cũ: ba nguyên tắc cốt lõi, danh mục 12 hiện vật, dữ liệu/nguồn (`docs/EXHIBITS.md`, `docs/COPY.md`), design system Deep Field (§6 cũ), quy tắc pháp lý và nội dung.

---

## 1. Những gì đã thay đổi (quyết định của team, sáng 14/11)

| Hạng mục | Trước (v3) | **Bây giờ (v4)** |
|---|---|---|
| Kiểu cuộn | Mỗi lần cuộn = 1 đoạn cố định (step engine `lib/step`) | **Cuộn liên tục**: Lenis + GSAP ScrollTrigger `scrub`, dải cuộn 24 màn hình (`2400dvh`), camera 3D nội suy liên tục qua 24 keyframe |
| Hình ảnh Act I–II | Footage NASA thật (Artemis II) | **3D procedural**: SLS Block 1 + Orion, bệ LC‑39B, VAB, hơi nước, tia lửa ROFI, tách tầng. Chỉ beat 0 (hero) dùng ảnh thật VAB lúc bình minh |
| Đếm ngược | T‑5 → LIFTOFF | **Bỏ** (theo yêu cầu của team). Ignition hiển thị `MAIN ENGINE START` |
| Builder chính | Sonnet + Fable | **Sonnet 5.5**. **Fable chỉ được gọi khi team chỉ định** |
| 3D / mô hình | Fable F2 (đã dừng vì hết hạn mức) | **Antigravity (Gemini Argon 4)** |
| Research / nội dung | Opus | **Opus**: research, storytelling, kiểm chứng số liệu, review |

**Code hiện tại** (commit `a5633df`, build và lint sạch): `components/journey/Stage.tsx`, `BeatOverlays.tsx`, `lib/scroll/progress.ts`, `components/journey/three/*` (SpaceScene, SLSRocket, LaunchComplex, CelestialWorlds, ExhibitStage3D, trajectory, rocketTextures). Chi tiết kiến trúc: `GEMINI.md` §1–2.
**Code chết cần dọn:** `lib/step/**`, `components/journey/acts/**`, `public/media/footage/` (29 MB; bản gốc vẫn còn trong `materials/`).

---

## 2. Ba vai trò

| Agent | Vai trò | Sở hữu file | Cách giao việc |
|---|---|---|---|
| **Opus (Claude Opus 5.5)** | Research chính, storytelling, kiểm chứng số liệu, gói tham chiếu cho 3D, review từng phase, điều phối và merge | `docs/**`, `content/journey.ts` (chữ trên HUD/overlay), `content/*.ts` (nội dung) | Chạy trong Claude Code; tự điều khiển Sonnet bằng subagent |
| **Sonnet 5.5** | Builder chính: UI/UX, frontend, tích hợp, hiệu năng, a11y, deploy, phần backend nếu có | `app/**`, `components/journey/Stage.tsx`, `components/journey/BeatOverlays.tsx`, `components/museum/**`, `components/ui/**`, `lib/**` | Opus giao qua subagent (`model: sonnet`) |
| **Antigravity (Gemini Argon 4)** | Đạo diễn 3D: mô hình thiết bị, diorama hiện trường, ánh sáng, vật liệu, hiệu ứng, camera, render poster | `components/journey/three/**`, `public/media/three/**` (asset mới) | **Người A dán gói việc** `docs/antigravity/AG-*.md` vào Antigravity; Antigravity ghi bàn giao vào `docs/HANDOFF_ANTIGRAVITY.md` |
| Fable 5.2 | Chỉ khi team chỉ định (ví dụ: lỗi shader hoặc hiệu năng cực khó) | Theo nhiệm vụ | Team quyết định |

**Giao thức với Antigravity** (vì Opus không điều khiển trực tiếp được Antigravity):
1. Opus viết gói việc `docs/antigravity/AG-x.md`, gồm: mục tiêu, gói tham chiếu, file được phép sửa, tiêu chí nghiệm thu.
2. **Người A** dán *"Đọc docs/antigravity/AG-x.md và làm theo"* vào Antigravity.
3. Antigravity làm trên branch `ag/x`, commit, rồi ghi **bàn giao ngắn** (≤ 60 dòng: file đã đổi, API, việc còn lại, ảnh chụp màn hình) vào `docs/HANDOFF_ANTIGRAVITY.md`. **Không dán lại toàn bộ source** như GEMINI.md: file 170 KB đó tốn token mà không cần thiết.
4. Người A nhắn Opus "AG-x xong". Opus review (đúng sự thật, hiệu năng, không đụng file của người khác), merge, deploy preview.
5. Khi một gói AG đang mở, Sonnet **không sửa** `components/journey/three/**`.

---

## 3. Kiểm chứng nội dung hiện có (Opus, 11:50 14/11)

HUD Act II trong `BeatOverlays.tsx` có các số liệu **chưa có nguồn**. Phải sửa (giao Sonnet ở S‑2):

| Chuỗi hiện tại | Vấn đề | Thay bằng |
|---|---|---|
| `T+00:00:12`, `T+00:02:06` | Mốc thời gian không xác minh được cho Artemis II | Bỏ đồng hồ MET. Chỉ dùng `ABOUT 90 SECONDS` (Max‑Q) và `ABOUT 2 MINUTES` (tách tầng đẩy phụ); cả hai đã xác minh |
| `MACH 1.8+` | Không có nguồn | Bỏ |
| `109% RATED` | Không có nguồn trong bộ dữ liệu của dự án | `4× RS-25 · LIQUID HYDROGEN / LIQUID OXYGEN` |
| `8× BSM PYROTECHNIC SEPARATION` | Số lượng chưa xác minh | `BOOSTER SEPARATION MOTORS FIRE` |
| `39.1 MN` | ✅ Đúng (quy đổi từ 8.8 triệu pound lực đẩy [S41]) | Giữ, ghi thêm `8.8 MILLION LB` |
| `TRANS-LUNAR INJECTION · ORION SOLAR ARRAYS DEPLOYED` | Gộp hai sự kiện xảy ra cách nhau nhiều giờ | `SOLAR ARRAYS DEPLOYED` ở ascent‑4/deep‑space; `TRANS-LUNAR INJECTION` ở transit sang Mặt Trăng |

**Nguyên tắc từ nay:** mọi chữ hiển thị trên overlay/HUD phải nằm trong `content/journey.ts` (một nguồn duy nhất, do Opus soạn). Component chỉ đọc file này. Chi tiết kỹ thuật thuần hình ảnh trên mô hình 3D (gân thân, mối hàn, chữ stencil `UNITED STATES`) được phép nếu đúng với vật thật.

**Ghi chú thương hiệu:** biểu tượng NASA chỉ xuất hiện như một chi tiết của toà VAB thật trong cảnh 3D, không được dùng làm logo hay UI của SpaceMuse.

---

## 4. Pipeline 36 giờ

```
          Sat 12   14        20        01   07        13        16        20  23:59
Opus      │A:audit+refpack│B: storytelling│C:review│ │D: copy final│E:review│F:submit│
Sonnet    │A:cleanup+S2│B: S3 S4 │C: S6 perf/mobile│ │D: S5 S7  │E: integrate│F: QA │
Antigrav. │A:AG-1 Hall I  │B: AG-3 models│C: AG-2 Hall II│ │D: AG-4 AG-5 │E: AG-6 AG-7│
                                         (ngủ 01–07)                    freeze 16:00
```

### Phase A — Sat 12:00–14:00: nền móng
- **Opus:** O‑1 (kiểm chứng xong §3) · O‑3 gói tham chiếu cho Hall I (`docs/antigravity/REF_MOON.md`) · viết gói AG‑1, AG‑3.
- **Sonnet:** S‑1 dọn code chết · S‑2 tạo `content/journey.ts` và sửa HUD theo §3.
- **Antigravity:** AG‑1 (Hall I) bắt đầu ngay khi có REF_MOON.

### Phase B — Sat 14:00–20:00: Mặt Trăng hoàn chỉnh
- **Antigravity:** AG‑1 xong → AG‑3a dựng mô hình cho **Surveyor 3, LRV, GRAIL** (thay thế lightbox ảnh).
- **Sonnet:** S‑3 tương tác hiện vật (nhấn bục → ExhibitPanel, viewer 3D trong panel, deep link) · S‑4 overlay Hall of Silence / Beyond / Finale lấy từ `content/silence.ts`, `teaser.ts`.
- **Opus:** O‑2 lời dẫn chuyện cho hành trình (§6) · O‑3 gói tham chiếu Hall II (`REF_MARS.md`) · review AG‑1.
- **Mốc 20:00:** deploy preview, **người test toàn bộ Hall I trên trackpad và điện thoại**.

### Phase C — Sat 20:00–01:00: Sao Hỏa
- **Antigravity:** AG‑2 (Hall II) + AG‑3b mô hình **Pathfinder/Sojourner, Phoenix**.
- **Sonnet:** S‑6 hiệu năng & mobile (đo FPS, giới hạn DPR, LOD, lazy load GLB), chế độ reduced motion.
- **Opus:** review, viết gói AG‑4/AG‑5, cập nhật `docs/SUBMISSION.md` theo hướng 3D.

### Ngủ 01:00–07:00 (bắt buộc cho cả hai người)

### Phase D — Sun 07:00–13:00: kết thúc hành trình
- **Antigravity:** AG‑4 (Hall of Silence 3D, cửa Hall III với 4 bóng mờ, Finale Earthrise) · AG‑5 chuyển cảnh (TLI, transit Mặt Trăng → Sao Hỏa, quay về Trái Đất).
- **Sonnet:** S‑5 passport/stamps (tuỳ chọn) · S‑7 SEO/OG image từng hiện vật, sitemap.
- **Opus:** chốt nội dung, kiểm chứng lại toàn bộ chữ trên site.

### Phase E — Sun 13:00–16:00: tối ưu & render
- **Antigravity:** AG‑6 hiệu năng 3D theo tier thiết bị · AG‑7 render poster tĩnh cho từng beat (dùng cho reduced motion, OG image, gallery, video demo).
- **Sonnet:** tích hợp poster, chế độ reduced motion, Lighthouse.
- **16:00: FEATURE FREEZE.**

### Phase F — Sun 16:00–20:00: nộp bài
- Chạy skill `spacemuse-review`, sửa lỗi FAIL. Quay video demo 30 giây (cảnh 3D cuộn liên tục rất hợp để quay). Người duyệt promote lên production. **Nộp trước 20:00**, dự phòng đến 23:59.

**Thứ tự cắt giảm nếu trễ:** AG‑3b (dùng lightbox cho Pathfinder/Phoenix) → passport → AG‑5 (dùng chuyển cảnh mờ dần) → mobile polish → AG‑4 bản đơn giản (overlay 2D).
**Không bao giờ cắt:** 12 bảng thuyết minh có nguồn, Then/Now, AgeCounter, nút Skip, khả năng dùng hoàn toàn bằng bàn phím, footer disclaimer.

---

## 5. Danh sách gói việc

### Antigravity (3D)

| ID | Nội dung | Tiêu chí nghiệm thu |
|---|---|---|
| **AG‑1** | Diorama Hall I (beat 8–12): bề mặt regolith có displacement; bụi lơ lửng; đèn rọi lạnh `#DCE6FF`; camera xoay nhẹ quanh từng bục. Chi tiết riêng: Apollo 11 (tầng hạ cánh + gương LRRR + chùm laser xanh), Surveyor 3 trong miệng hố, LRV đỗ hướng về bãi hạ cánh, Apollo 17 có **vết bánh xe và dấu chân**, GRAIL với **hai hố va chạm khoảng 5 m trên sườn núi** | 60 fps trên M1; khớp ảnh tham chiếu trong REF_MOON; không có chữ hay logo tự bịa |
| **AG‑2** | Diorama Hall II (beat 14–20): bầu trời màu bơ‑nâu, sương bụi; Viking 1 giữa đá Chryse; Pathfinder với túi khí xẹp + Sojourner; **Spirit lún bánh trong cát** tại Troy; Opportunity phủ bụi; **Phoenix có tấm pin cong gãy**; **InSight phủ bụi** + vòm seismometer; Ingenuity trên Valinor Hills với cánh quạt hỏng | Như trên, khớp REF_MARS |
| **AG‑3a** | Mô hình 3D procedural: **Surveyor 3, LRV, GRAIL (Ebb/Flow)** | Đúng tỉ lệ và hình dáng theo REF; ≤ 30k tam giác mỗi mô hình |
| **AG‑3b** | Mô hình: **Mars Pathfinder lander + Sojourner, Phoenix** | Như trên |
| **AG‑4** | Hall of Silence (bức tường chữ phát sáng dần), cửa Hall III kính mờ với 4 bóng mờ từ `SM-B-*.web.glb`, Finale Earthrise (có thể dựa trên ảnh `art002e009280b`) | Chữ trên tường lấy từ `content/silence.ts` (Sonnet render chữ DOM hoặc Antigravity dùng troika text, nhưng nội dung phải từ file) |
| **AG‑5** | Chuyển cảnh: TLI ra Mặt Trăng, transit Mặt Trăng → Sao Hỏa, Finale quay về Trái Đất | Liền mạch, không giật khi cuộn nhanh |
| **AG‑6** | 3 tier hiệu năng (cao / trung / thấp): số hạt, DPR, độ phân giải texture, bóng đổ, postprocessing; tự chọn tier theo GPU/viewport | ≥ 30 fps trên iPhone tầm trung, ≥ 55 fps trên M1 |
| **AG‑7** | Render poster tĩnh 1920×1080 + 1080×1350 cho 24 beat và 12 hiện vật → `public/media/three/posters/` | Ảnh đẹp như poster, không có UI |

### Sonnet (frontend / UX)

| ID | Nội dung |
|---|---|
| **S‑1** | Dọn code chết: `lib/step/**`, `components/journey/acts/**`, `public/media/footage/`; thêm `.claude/**` vào `globalIgnores` của ESLint; đổi `name` trong package.json thành `spacemuse` |
| **S‑2** | Tạo `content/journey.ts` (Opus cung cấp nội dung), chuyển toàn bộ chữ HUD/overlay vào đó, sửa theo bảng §3 |
| **S‑3** | Tương tác hiện vật: hotspot trên bục 3D → `openExhibit(slug)`; panel có viewer 3D (dùng lại model); `/exhibit/[slug]` ↔ hành trình (link "View in journey" → `scrollToBeat`); bàn phím: PageDown/PageUp nhảy theo beat |
| **S‑4** | Overlay Hall of Silence, Beyond, Finale từ content |
| **S‑5** | Passport 12 con dấu + certificate PNG (tuỳ chọn) |
| **S‑6** | Hiệu năng & mobile: đo FPS, giới hạn DPR, dừng render khi tab ẩn, lazy load GLB theo beat; **reduced motion = chế độ tĩnh** dùng poster AG‑7 và cuộn bình thường; kiểm tra iOS Safari |
| **S‑7** | Metadata, OG image từng hiện vật, sitemap, `robots` |
| **S‑8** | QA, deploy, hỗ trợ video demo, nộp bài |

**Backend:** không cần cho bài thi (site tĩnh trên Vercel). Có thể bật Vercel Analytics nếu muốn số liệu lượt xem để thuyết trình.

### Opus (research / nội dung)

| ID | Nội dung |
|---|---|
| **O‑1** | Kiểm chứng nội dung hiện có → §3 (xong) |
| **O‑2** | **Lời dẫn chuyện cho hành trình cuộn liên tục** (§6): mỗi beat có một câu dẫn kiểu audio guide; mỗi sảnh có phần mở đầu; transit có dòng thời gian "từ Mặt Trăng tới Sao Hỏa" |
| **O‑3** | **Gói tham chiếu cho 3D** (`REF_MOON.md`, `REF_MARS.md`): với mỗi thiết bị, ghi kích thước thật, hình dáng, vật liệu và màu, các chi tiết đặc trưng, trạng thái hiện tại (bụi, hư hỏng), ảnh tham chiếu (file trong `materials/thennow/` + NASA ID), kèm nguồn |
| **O‑4** | Review từng gói AG và S: đúng sự thật, đúng phạm vi file, hiệu năng |
| **O‑5** | Cập nhật `docs/COPY.md`, `docs/SUBMISSION.md` (mô tả dự án, kịch bản demo theo hướng 3D), `CLAUDE.md` |

---

## 6. Hướng storytelling cho bản cuộn liên tục (O‑2 sẽ viết đầy đủ trong `content/journey.ts`)

Cuộn liên tục cho phép kể chuyện như một **audio guide bằng chữ**: mỗi beat có 1 dòng dẫn (≤ 18 từ) hiện ra khi camera ổn định, cộng thêm thẻ HUD kỹ thuật.
- **Act I – Trái Đất:** *"Every machine in this museum began as a promise made here."*
- **Act II – Bay lên:** chỉ dùng các mốc đã xác minh (Max‑Q khoảng 90 giây, tách tầng đẩy phụ khoảng 2 phút, rìa không gian 100 km).
- **Hall I – Mặt Trăng:** chủ đề *"Where we stood."*: dấu chân, xe, những người đã đến.
- **Transit:** dòng thời gian 1976 → 2021 (từ Viking 1 đến Ingenuity), chủ đề *"Where we sent our machines instead."*
- **Hall II – Sao Hỏa:** mỗi robot một "lời cuối" bằng dữ liệu thật (ngày liên lạc cuối), không nhân hoá sai sự thật.
- **Hall of Silence → Beyond → Finale:** từ im lặng, đến những tàu vẫn đang bay (Voyager 1 đạt mốc một ngày ánh sáng vào 18/11/2026), rồi về lại Trái Đất qua ảnh Earthrise của Artemis II.

---

## 7. Quy tắc giữ nguyên từ plan cũ
- Không bịa số liệu, ngày tháng hay trích dẫn. Mọi chữ hiển thị đều lấy từ `docs/COPY.md` hoặc `content/journey.ts` và có nguồn.
- Không dùng logo NASA làm thương hiệu. Không dùng ảnh hoặc video do AI tạo ra để giả làm tư liệu thật; mô hình 3D phải được ghi rõ là **mô phỏng (simulation)**: thêm dòng *"3D reconstructions are illustrative, based on NASA imagery and data."* vào footer và trang About.
- Deploy chỉ ở dạng preview; production do người duyệt.
- Design system Deep Field (palette, Archivo/Inter/JetBrains Mono): xem `docs/archive/PLAN_v3_step-scroll-footage.md` §6. Toàn bộ quy tắc đó vẫn áp dụng.
