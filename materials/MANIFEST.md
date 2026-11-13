# SPACEMUSE — Materials Manifest

> Toàn bộ asset đã được thu thập ngày 12/11/2026. **Builder không cần tìm thêm asset nào.**
> Thư mục này chứa **nguyên liệu thô** (khoảng 4,5 GB, không commit lên git; xem `.gitignore`). Sonnet xuất bản cho web vào `public/media/` theo mục "Việc còn lại" ở cuối file.
> Credit mặc định là `NASA`, trừ khi bảng ghi khác. Nội dung chữ và chú thích ảnh nằm trong `docs/COPY.md`.

```
materials/
  footage/            8 đoạn footage gốc 4K/8K (raw_*.mp4) + proxy_1080p/ (bản nhẹ để dựng)
  images/             ảnh gốc cho hero, enter, finale
  thennow/            ảnh Then/Now cho 12 hiện vật + vitrine
  models/             model .glb gốc + web/ (đã nén Meshopt + WebP, đều < 3 MB)
  textures/           texture Mặt Trăng / Sao Hỏa / Trái Đất / nền sao (bản 2K, 4K, 8K + file nguồn src_*)
  _contact/           contact sheet dùng để chọn điểm cắt (chỉ để tham khảo)
```

---

## 1. Footage (Act I–II): Artemis II, phóng ngày 1/4/2026

Các đoạn `raw_*` được cắt thẳng từ file `~orig` (stream copy, giữ nguyên chất lượng). **Cột "Cắt đề xuất" tính theo thời gian *bên trong file raw*** (giây 0 = đầu file raw).

| File raw | NASA ID nguồn | Đoạn trong file nguồn | Độ phân giải | Beat | Cắt đề xuất (trong file raw) | Tốc độ đề xuất | Credit |
|---|---|---|---|---|---|---|---|
| `raw_enter_rollout_vab_door.mp4` | `KSC-20260319-MH-CSH01-0001-Artemis_II_Rollout_For_Launch_VAB-M19827.MP4` | 0:36–1:21 | 3840×2160 · 59.94 | `enter` | **4–14 s**: lúc chạng vạng, toà VAB với SLS phát sáng trong khung cửa mở (đã kiểm tra trên proxy). Dự phòng: 22–30 s (cận SLS) · 30–34 s (toàn cảnh VAB lúc hoàng hôn) | 1× (hoặc 0.75× cho trang nghiêm) | NASA/Cory S. Huston |
| `raw_ignition_pad_sunset.mp4` | `SLS_KSC_01282026_ART II at Pad sunset anamorphic` | 0:00–1:00 | **6144×2160** (anamorphic) · 29.97 | `ignition` (rest frame trước đếm ngược) | **0–10 s**: cỏ vàng tiền cảnh, bóng tên lửa ngược sáng · 15–25 s: bóng tên lửa + lens flare | 1×, lặp (loop) | NASA/Sam Lott |
| `raw_ignition_ascent1_vabroof.mp4` | `KSC-20260401-MH-AJN01-0001-Artemis_II_Launch_ISO_VAB_Roof_4K` | 0:00–1:40 | 3840×2160 · 59.94 | `ignition` + `ascent-1` | Rest frame trên bệ: **0–56 s** (SLS + biển phía sau, gần như tĩnh) · **Đánh lửa ở ~58–60 s, cất cánh ~64 s → rời tháp: 54–74 s** · **ascent-1: 72–96 s** (trời xanh đậm dần) — đã kiểm tra trên proxy | ignition 1× (đúng thời gian thật, khớp đếm ngược) · ascent-1 khoảng 6× | NASA |
| `raw_ascent2_cessna8k.mp4` | `KSC-20260401-MH-JBP01-0001-Artemis_II_Launch_Cessna_GSS_8k_60fps-M19183` | 0:40–1:50 | **7680×4320** · 60 | `ascent-2` | **0–44 s**: trời chuyển từ xanh xám sang xanh thẫm, tên lửa nghiêng dần · 48–68 s: vệt lửa nằm ngang (dự phòng) | khoảng 11× (44 s → 4 s) | NASA/Jamie Peer |
| `raw_ascent3_boostersep_cessna8k.mp4` | (cùng clip Cessna 8K) | 2:05–2:40 | 7680×4320 · 60 | `ascent-3` | **18–32 s**: hai đốm sáng tách đôi (khoảng 20–22 s), các mảnh rơi xa (24–32 s). Tương ứng 2:23–2:37 trong file nguồn. Crop/zoom vào tên lửa | khoảng 3.5× | NASA/Jamie Peer |
| `raw_ascent3_boostersep_vabroof.mp4` | (cùng clip VAB Roof) | 3:00–3:30 | 3840×2160 | `ascent-3` (dự phòng) | 10–20 s | 2× | NASA |
| `raw_ascent4_orion_saj.mp4` | `art002m1200912231B_SAJ-Jettison_SAW4` | 0:00–0:48 (toàn bộ) | 1280×720 · 59.94 | `ascent-4` | **3–14 s**: tấm vỏ (có logo NASA) bay ra rồi nhỏ dần, phía sau là mây. Bỏ 0–3 s (khung hình tối rồi trắng) | 1× | NASA |
| `raw_deepspace_orion_earth.mp4` | `art002m1200920011_Apogee_Raise_Burn` | 0:00–1:30 | 1280×1024 · 25 | `deep-space` | **60–88 s**: Trái Đất cong, viền trên nền đen, thân Orion ở tiền cảnh. **Khung hình ~86 s** là điểm match cut lý tưởng sang 3D | khoảng 7× | NASA |

`proxy_1080p/` chứa bản H.264 1080p (CRF 20) của từng file raw, cùng tên nhưng bỏ tiền tố `raw_`. Dùng proxy để dựng và thử timing nhanh; khi xuất bản cuối thì encode lại từ raw.

**Ghi chú khi cắt:**
- Clip **VAB Roof** góc phải đôi khi có **số "933"** hoặc mã camera chèn lên hình. Cần crop/scale nếu số này xuất hiện trong đoạn được chọn.
- Clip **Cessna 8K**: tên lửa nhỏ dần trong khung hình, nên **crop vào khoảng 2K–4K quanh tên lửa** (8K đủ dư để crop mà vẫn nét).
- Clip **pad sunset** có tỉ lệ siêu rộng 2.84:1: hiển thị dạng letterbox, rất hợp với Act I.
- **Không dùng** clip WB‑57 (quá tối, có dải dữ liệu chèn lên hình).

---

## 2. Ảnh Act I / Finale (`images/`)

| File | NASA ID | Kích thước | Dùng cho | Credit |
|---|---|---|---|---|
| `hero_vab_storm.jpg` | KSC-20200725-PH-JBS01_0003 | 6720×4480 | **Hero** (đề xuất): VAB lúc rạng sáng, mây giông | NASA/Ben Smegelsky |
| `hero_vab_sunrise_alt.jpg` | KSC-20220119-PH-CSH01_0009 | 5760×3840 | Hero dự phòng | NASA/Cory Huston |
| `enter_vab_doors_open.jpg` | KSC-20220317-PH-KLS02_0002 | 6720×4480 | `enter`: camera đi xuyên cửa VAB | NASA/Kim Shiflett |
| `enter_sls_inside_highbay3.jpg` | KSC-20210917-PH-FMX01_0124 | 6720×3780 | `enter` dự phòng: nhìn ngước lên SLS trong High Bay 3 | NASA/Frank Michaux |
| `ascent3_booster_sep_photo.jpg` | KSC-20260401-PH-SFL01_0029 | 3456×2234 | `ascent-3` dự phòng (ảnh tĩnh) | NASA |
| `deepspace_earth_from_orion_night.jpg` | art002e000192 | — | Trái Đất về đêm, phi hành đoàn Artemis II chụp sau khi đốt động cơ rời quỹ đạo Trái Đất | NASA |
| `finale_artemis_era_earthrise.jpg` | art002e009280b | 5568×3712 | **Finale**: "Artemis Era Earthrise", 6/4/2026 (file nhẹ vì phần lớn khung hình là nền đen) | NASA |

---

## 3. Then / Now (`thennow/`)

Quy ước tên file: `SM-<số hiệu>_<vai trò>_<NASA ID>.<ext>`. Caption và credit đầy đủ nằm trong `docs/COPY.md`.

| Hiện vật | Then | Now (ảnh từ quỹ đạo) | Ghi chú |
|---|---|---|---|
| SM-L-001 Apollo 11 | `as11-40-5948` (Aldrin, EASEP, Eagle) | `PIA12909` (LRO 2009, có chú thích) | |
| SM-L-002 Surveyor 3 | `AS12-48-7134` (Bean + Surveyor + LM) · alt `as12-48-7121` | `PIA12922` (LRO, Apollo 12) | |
| SM-L-003 Apollo 15 LRV | `as15-88-11901` | `GSFC_20171208_Archive_e001054` (LRO nhìn xiên qua rãnh Hadley và núi Hadley) | Ảnh Now **không thấy chiếc xe**, chú thích phải ghi là "khu hạ cánh" |
| SM-L-004 Apollo 17 | `as17-147-22526` (Cernan lái LRV) · alt ảnh bề mặt từ lithograph | `LRO-apollo17-litho` (tách từ lithograph NASA, có chú thích) | Độ phân giải 1600×1080 |
| SM-L-005 GRAIL | `PIA13965` (**artist's concept**, bắt buộc ghi nhãn) | `GRAIL_impacts_before_after.png` | |
| SM-M-001 Viking 1 | `PIA00381` (ảnh đầu tiên chụp từ bề mặt Sao Hỏa) | `PIA01881` (HiRISE 2006) | |
| SM-M-002 Pathfinder | `PIA00614` (túi khí + Sojourner) · alt `PIA00632` | `PIA09105` (HiRISE 2007) | Chưa xác nhận tàu có hiện rõ trong ảnh Now |
| SM-M-003 Spirit | `PIA05040` | `PIA12205` (HiRISE: Spirit tại Troy) | |
| SM-M-004 Opportunity | `PIA17759` (self-portrait 2014) · extra `PIA22929` (ảnh cuối cùng) | `PIA22549` (HiRISE sau bão bụi 2018) | |
| SM-M-005 Phoenix | `PIA11719` (self-portrait) | `PIA22223` (HiRISE, gần 10 năm sau) | |
| SM-M-006 InSight | `PIA22876` (selfie đầu) + `PIA25287` (selfie cuối) | `PIA23376` (HiRISE) | |
| SM-M-007 Ingenuity | `PIA26236` (Perseverance chụp Ingenuity tại sân bay cuối) · alt `PIA26237` (Valinor Hills) | `PIA25174` (HiRISE: Perseverance + Ingenuity) | Vitrine: `PIA25219`, `PIA25218` |

`_wrong_apollo14_PIA12889.jpg` là ảnh Apollo 14 (không phải Apollo 15). **Không dùng**, giữ lại chỉ để tham khảo.

---

## 4. Model 3D (`models/`, dùng bản trong `models/web/`)

| File web | Hiện vật | Dung lượng | Ghi chú |
|---|---|---|---|
| `SM-L-001_apollo_lunar_module.web.glb` | Apollo 11 (dùng lại cho Apollo 17) | 724 KB | Có cả tầng cất cánh. **Để hiển thị đúng sự thật (chỉ tầng hạ cánh còn lại trên Mặt Trăng)**, dùng clipping plane cắt theo trục Y; bbox Y từ 0.10 đến 5.12, điểm cắt cần chỉnh bằng mắt, ước khoảng y ≈ 2.3–2.6 |
| `SM-M-001_viking_lander.web.glb` | Viking 1 | 304 KB | |
| `SM-M-003-004_mer_spirit_opportunity.web.glb` | Spirit & Opportunity | 948 KB | Hai rover giống hệt nhau, dùng chung model |
| `SM-M-006_insight_panels_deployed.web.glb` | InSight | 2.4 MB | |
| `SM-M-007_ingenuity.web.glb` | Ingenuity | 356 KB | |
| `SM-B-001_near_shoemaker.web.glb` · `SM-B-002_messenger.web.glb` · `SM-B-003_cassini.web.glb` · `SM-B-004_voyager.web.glb` | Teaser Hall III | 108–332 KB | Render thành bóng mờ (material đen + rim light) |

**Không có model 3D từ NASA** cho: Surveyor 3, LRV, Pathfinder/Sojourner, Phoenix, GRAIL (đã kiểm tra cả NASA 3D Resources GitHub và science.nasa.gov). **Phương án 2.5D cho 5 hiện vật này:** đặt ảnh Then trong một "lightbox" có viền bạch kim, dựng đứng trên bục (plinth) dưới đèn rọi, như một bức ảnh trưng bày trong bảo tàng. Cách này trung thực và thống nhất về phong cách, không cần tách nền ảnh.

Nguồn: https://github.com/nasa/NASA-3D-Resources (thư mục `3D Models/`) · MER: https://science.nasa.gov/3d-resources/mars-exploration-rover/ · License: NASA 3D Resources, miễn phí sử dụng.

---

## 5. Texture (`textures/`)

| File | Nguồn | Ghi chú | Credit |
|---|---|---|---|
| `moon_color_4k.jpg`, `moon_color_2k.jpg` | NASA SVS CGI Moon Kit (svs 4720), `lroc_color_poles_8k.tif` | Equirectangular | NASA's Scientific Visualization Studio |
| `moon_displacement_2k.png` | CGI Moon Kit `ldem_16_uint.tif` | Displacement / bump map (grayscale) | NASA SVS |
| `mars_color_8k.jpg`, `mars_color_4k.jpg`, `mars_color_2k.jpg` | Viking MDIM 2.1 colorized mosaic 1 km (Wikimedia Commons, public domain, nguồn USGS) | Equirectangular | NASA/JPL/USGS |
| `earth_color_4k.jpg`, `earth_color_2k.jpg` | Blue Marble Next Generation (12/2004) | Equirectangular | NASA Earth Observatory |
| `starfield_8k.jpg`, `starfield_4k.jpg` | NASA SVS Deep Star Maps 2020 (svs 4851), `starmap_2020_8k.exr`, đã chuyển gamma sang sRGB | Skybox equirectangular, có dải Ngân Hà | NASA SVS |
| `src_*` | File nguồn gốc | Không đưa lên web | |

---

## 6. Bản web cuối cùng (ĐÃ ENCODE XONG, ngày 12/11)

| Thư mục | Nội dung |
|---|---|
| `web/footage/` | 9 clip theo beat: `enter`, `ignition-pad`, `ignition-rest`, `ignition`, `ascent-1..4`, `deep-space`. Mỗi clip có `.1080.mp4`, `.720.mp4`, `.poster.jpg`, `.poster.avif` (tổng 34 MB). Thời lượng khớp PLAN §3.2; `ignition` cất cánh ở khoảng 5.0 s |
| `web/images/` | Ảnh hero, enter, finale, dự phòng: các cỡ 2560 và 1280, định dạng AVIF + JPG (hero AVIF 117 KB) |
| `web/thennow/` | Toàn bộ ảnh Then/Now: các cỡ 1600 và 800, định dạng AVIF + JPG |
| `models/web/` | 9 file `.glb` đã nén |

Chi tiết cách dùng nằm trong skill `setup/claude/skills/spacemuse-media/SKILL.md`. **Việc của Sonnet chỉ còn là sao chép các file này vào `public/media/`** (lệnh có sẵn trong skill) rồi nhập dữ liệu từ `docs/COPY.md`.

Nếu cần encode lại một clip (đổi điểm cắt hoặc tốc độ), dùng lệnh mẫu sau (ví dụ cho `ascent-1`):
```
ffmpeg -ss 72 -to 96 -i footage/raw_ignition_ascent1_vabroof.mp4 -an \
  -vf "setpts=PTS/6.857,fps=30,eq=contrast=1.05:saturation=1.04,scale=1920:-2:flags=lanczos" \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart web/footage/ascent-1.1080.mp4
```
