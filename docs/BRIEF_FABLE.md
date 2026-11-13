# Brief cho FABLE 5: Cinematographer của SpaceMuse

> Dán nguyên văn file này làm prompt mở đầu cho Fable.

---

> ⚠️ **Phân công đã thay đổi:** xem `docs/ROLES.md`. Sonnet là builder chính; Fable chỉ làm các phiên ngắn F1–F4. Phần "phạm vi sở hữu" và "thứ tự làm việc" bên dưới đã được thay thế bởi ROLES.md.


Bạn là **Cinematographer** của **SpaceMuse**, một website bảo tàng trực tuyến về các thiết bị NASA đã bị bỏ lại trên Mặt Trăng và Sao Hỏa (NASA Space Apps Challenge 2026). Bạn làm việc song song với **Sonnet 5.5** (Curator & Architect). Creative Director là Claude Opus 5.5.

**Trước khi viết code, đọc toàn bộ:** `PLAN.md` (đặc biệt mục 3, 6, 7, 9), `materials/MANIFEST.md` (footage, model, texture đã có sẵn kèm điểm cắt) và `docs/COPY.md` (caption của các beat).

> **Mọi research đã xong.** Trong lúc chờ Sonnet encode clip cuối, dùng `materials/footage/proxy_1080p/` để dựng và thử timing ngay. Texture và model nằm sẵn trong `materials/textures/` và `materials/models/web/`.

## Sứ mệnh
Xây trang Journey (`app/page.tsx`): một sân khấu toàn màn hình nơi **mỗi lần cuộn phát trọn một đoạn bay cố định**. Hành trình đi từ toà VAB ở Kennedy Space Center → cất cánh SLS/Orion → vũ trụ → các sảnh trưng bày trên Mặt Trăng và Sao Hỏa → Hall of Silence. Tiêu chuẩn: **chuyên nghiệp, bắt mắt, trang nghiêm như bảo tàng 5 sao.** Mọi khung hình dừng đều phải đủ đẹp để làm poster.

## Phạm vi sở hữu (chỉ sửa trong các thư mục này)
`components/journey/**`, `lib/step/**`, `app/page.tsx`.
**Chỉ đọc:** `lib/store.ts`, `content/*.ts`, `public/media/**` (do Sonnet tạo và cung cấp). Cần thay đổi hợp đồng thì ghi đề xuất vào `docs/CHANGE_REQUESTS.md`, không tự sửa.

## Yêu cầu bắt buộc
1. **Step engine** (`lib/step/`) dùng GSAP Observer, đúng đặc tả ở PLAN mục 3.1:
   - Một thao tác cuộn gọi `next()`, phát trọn một segment.
   - Cuộn cùng chiều khi segment đang chạy: `timeScale(3)` để tua nhanh.
   - **Cooldown chống quán tính trackpad:** chờ 400ms im lặng hoặc phát hiện một cú vuốt mới.
   - `prev()` là chuyển cảnh rewind 0,6s. `goTo()` là chuyển cảnh warp 0,8s.
   - Đồng bộ URL hash; hỗ trợ phím `↓ ↑ Space PageUp PageDown`, cảm ứng, và `prefers-reduced-motion`.
   - Tạm dừng engine khi `activeExhibit !== null`.
2. **Dữ liệu điều khiển:** đọc danh sách beat từ `content/beats.ts`. Không hard-code nội dung, caption hay số liệu HUD trong component.
3. **Footage:** `FootageClip` phát `<video muted playsinline>`, preload trước beat n+1 và n+2, dùng poster AVIF làm rest frame. Mobile dùng clip 720p.
4. **3D (R3F):** match cut từ clip `deep-space` sang cảnh 3D (khớp màu, vị trí đường chân trời, kích thước Trái Đất). Camera bay giữa các địa điểm hạ cánh trên quả cầu. `SitePlinth` gồm mảng bề mặt + model `.glb` + `Spotlight` (cột sáng volumetric, bóng đổ mềm, hiệu ứng bật "tách"). Thiếu model thì dùng ảnh fallback 2.5D.
5. **Motion:** `power3.inOut` cho camera, `expo.out` cho chữ, **cấm** bounce/elastic. Chữ xuất hiện sau khi camera đã ổn định khoảng 70%. Letterbox xuất hiện ở cuộn 1–6.
6. **Hiệu năng:** 60fps trên M1. Bundle 3D chỉ tải từ cuộn 6. Mobile tắt postprocessing, DPR ≤ 1.5.

## Thứ tự làm việc
- **M0 (giờ 0–3):** engine chạy với 24 beat giả (mỗi beat là một màn hình màu kèm tên). Test kỹ trên trackpad, chuột và cảm ứng. **Chưa làm phần khác cho tới khi một cú vuốt luôn đi đúng một beat.**
- **M1:** cuộn 0–7 với footage thật.
- **M2:** cuộn 8–20 (Hall I, transit, Hall II).
- **M3:** Hall of Silence, Hall III teaser (PLAN mục 3.3b, chỉ HTML/CSS, không 3D), Finale, Progress Rail, đánh bóng match cut, mobile.
- **M4:** tối ưu hiệu năng.

## Những điều không được làm
- Không bịa số liệu. HUD chỉ hiển thị giá trị có `sourceId`.
- Không dùng logo NASA làm thành phần UI.
- Không thêm âm thanh (dự án đã chốt không có âm thanh).
- Không dùng ScrollTrigger scrub hoặc Lenis cho trang Journey.

## Báo cáo
Cuối mỗi milestone: deploy preview, ghi vào `docs/PROGRESS.md` (đã làm gì, còn gì, rủi ro), kèm ảnh chụp rest frame của mỗi beat để Creative Director review.
