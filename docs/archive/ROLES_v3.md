# SpaceMuse — Phân công Fable / Sonnet theo milestone

> **Thay thế phần phân công trong PLAN §9 và hai brief.** Bối cảnh: Fable 5.2 chỉ dùng được bản test, với khoảng 50% hạn mức của gói đó. Vì vậy:
> - **Sonnet 5.5 là builder chính**, viết khoảng 80–85% code và chạy liên tục suốt 39 giờ.
> - **Fable 5.2 là chuyên gia gọi theo phiên**: chỉ 3 phiên bắt buộc + 1 phiên dự phòng, mỗi phiên làm **một module khó, phạm vi hẹp**, viết xong thì bàn giao cho Sonnet.

## 1. Nguyên tắc chọn ai làm

Chỉ gọi Fable khi việc đó thoả **cả ba** điều kiện:
1. **Khó làm đúng**: cần thuật toán, kiến trúc hoặc cảm giác chuyển động tinh tế.
2. **Là nền móng**: các phần khác phụ thuộc vào nó, nên nếu sai thì sai dây chuyền.
3. **Phạm vi khép kín**: làm xong trong một phiên mà không cần đọc cả repo.

Mọi việc còn lại giao cho Sonnet: dựng giao diện, nhập dữ liệu, các trang, nối media, sửa lỗi, tối ưu, deploy, nộp bài.

## 2. Lịch theo milestone

| Mốc | Giờ | **Sonnet (chạy liên tục)** | **Fable (theo phiên)** | Người điều khiển |
|---|---|---|---|---|
| **M0** | T6 9:00–13:00 | Khởi tạo Next.js + Tailwind + fonts + tokens (PLAN §6) · `lib/store.ts` + các kiểu dữ liệu · `content/beats.ts` (24 beat) · sao chép media · deploy preview · bắt đầu `content/exhibits.ts` | **Phiên F1 (9:30–12:00): Step engine.** Làm song song, chỉ trong `lib/step/**` và `components/journey/Stage.tsx` | A: Fable · B: Sonnet |
| **M1** | T6 13:00–20:00 | Act I–II **dùng engine của F1**: `FootageClip`, đếm ngược, HUD, letterbox, caption (cuộn 0–6) · `ExhibitPanel` + dữ liệu Hall I · trang `/exhibit/[slug]` | **Phiên F2 (15:00–18:00): Nền 3D.** Chỉ trong `components/journey/three/**` | A test trackpad, B điều khiển Sonnet |
| **M2** | T6 20:00–01:00 | Gắn **dữ liệu** Hall I + Hall II vào camera rig của F2 (cuộn 7–20) · lightbox cho 5 hiện vật không có model · `/gallery` · dữ liệu Hall II | — (Fable nghỉ, giữ hạn mức) | Cả hai cùng Sonnet (2 phiên, 2 branch) |
| — | 01:00–07:00 | Ngủ | — | |
| **M3** | T7 7:00–14:00 | Hall of Silence, teaser Hall III, Finale, passport, `/about`, mobile, a11y | **Phiên F3 (9:00–11:30): Polish điện ảnh.** Tinh chỉnh timing, easing và chuyển cảnh trên toàn hành trình | A: Fable · B: Sonnet |
| **M4** | T7 14:00–20:00 | Feature freeze 14:00 · skill `spacemuse-review` · hiệu năng · video demo · nộp bài | **Phiên F4 (dự phòng):** chỉ gọi khi có lỗi khó mà Sonnet sửa quá 45 phút chưa xong | B: Sonnet + nộp bài |

**Phân bổ hạn mức Fable (ước lượng):** F1 khoảng 30% · F2 khoảng 30% · F3 khoảng 20% · **giữ 20% cho F4**. Nếu sau F1 đã tiêu quá 40%, rút gọn F3 hoặc giao F3 cho Sonnet.

## 3. Chi tiết từng phiên Fable (prompt dán nguyên văn)

### F1: Step engine (T6 9:30)
```
Bạn là Fable, chuyên gia được gọi theo phiên ngắn cho dự án SpaceMuse. Hạn mức của bạn rất hạn chế: KHÔNG đọc cả repo,
KHÔNG viết UI ngoài phạm vi dưới đây.
Đọc: CLAUDE.md, PLAN.md §3.1, skill spacemuse-step-engine, lib/store.ts (Sonnet đang tạo; nếu chưa có thì tự định nghĩa
interface tạm trong lib/step/types.ts theo PLAN §9).
Nhiệm vụ: viết lib/step/** (Observer, next/prev/goTo, chống quán tính trackpad, fast-forward, rewind 0.6s, warp 0.8s,
hash sync, reduced motion, pause khi activeExhibit != null) + components/journey/Stage.tsx chạy với 24 beat giả
(mỗi beat là một màn hình màu kèm tên beat).
API cho Sonnet: mỗi beat đăng ký một factory trả về gsap timeline (+ tuỳ chọn một <video>), engine tự lo phần còn lại.
Xong khi: một cú vuốt luôn đi đúng một beat trên trackpad, chuột, bàn phím và cảm ứng.
Cuối phiên: viết docs/HANDOFF_FABLE.md (API, cách thêm beat, các bẫy cần tránh) cho Sonnet.
```

### F2: Nền 3D (T6 15:00)
```
Bạn là Fable, phiên ngắn cho SpaceMuse. Không đọc cả repo.
Đọc: CLAUDE.md, PLAN.md §3.2 (cuộn 7–22) + §6, skill spacemuse-media, docs/HANDOFF_FABLE.md, content/beats.ts, lib/store.ts.
Nhiệm vụ: components/journey/three/**:
1) <SpaceScene> (R3F canvas, chỉ nạp từ cuộn 6): nền sao, Trái Đất/Mặt Trăng/Sao Hỏa với texture NASA, ánh sáng lạnh.
2) Camera rig điều khiển bằng dữ liệu: flyTo({body, lat, lon, altitude}, duration) trả về gsap timeline để engine dùng.
3) <SitePlinth> dùng lại được: mảng bề mặt + model .glb (meshopt) HOẶC lightbox ảnh viền platinum + <Spotlight> (cột
   sáng lạnh #DCE6FF, bóng mềm, bật "tách") + hotspot gọi openExhibit(slug).
4) Match cut: khung hình cuối của clip deep-space → Trái Đất 3D khớp vị trí và màu.
5) Clipping plane cho Apollo LM (chỉ hiện tầng hạ cánh).
Làm mẫu đầy đủ 1 beat: moon-apollo-11. Các beat còn lại Sonnet sẽ nhân bản bằng dữ liệu.
Ngân sách hiệu năng: 60fps trên M1, DPR ≤ 1.5 trên mobile, tắt postprocessing trên mobile.
Cuối phiên: cập nhật docs/HANDOFF_FABLE.md (cách thêm một hiện vật mới chỉ bằng dữ liệu).
```

### F3: Polish điện ảnh (T7 9:00)
```
Bạn là Fable, phiên polish cho SpaceMuse. Không thêm tính năng mới.
Đọc: CLAUDE.md, PLAN.md §3 + §6 (nguyên tắc chuyển động), docs/HANDOFF_FABLE.md, docs/PROGRESS.md.
Chạy site (skill run), đi hết 24 beat, rồi tinh chỉnh: easing, thời lượng, thời điểm chữ xuất hiện (sau khi camera ổn
định khoảng 70%), letterbox, match cut footage→3D, đèn rọi, grain/vignette. Sửa trực tiếp trong components/journey/**
và lib/step/**.
Trả về danh sách thay đổi + 3 vấn đề còn lại (nếu có) để Sonnet xử lý.
```

### F4: Dự phòng (chỉ khi cần)
```
Bạn là Fable, phiên sửa lỗi khẩn cho SpaceMuse. Lỗi: <mô tả, cách tái hiện, file liên quan, những gì Sonnet đã thử>.
Chỉ sửa đúng lỗi này, không refactor. Ghi chú cách sửa vào docs/HANDOFF_FABLE.md.
```

## 4. Quy tắc phối hợp

- **Quyền sở hữu file theo phiên**, không theo người:
  - Trong lúc một phiên Fable đang chạy, Sonnet **không sửa** các file nằm trong phạm vi của phiên đó.
  - Khi phiên Fable kết thúc, Sonnet được sửa các file đó, nhưng phải ghi lại thay đổi vào `docs/HANDOFF_FABLE.md` (mục "Sonnet đã sửa").
- **Git:** Fable làm trên branch `fable/f1-step-engine`, `fable/f2-three`, `fable/f3-polish`. Merge vào `main` ngay khi phiên kết thúc. Sonnet làm trên branch `sonnet/*` và merge theo từng milestone.
- **Mẹo tiết kiệm hạn mức Fable:**
  - Luôn mở **phiên mới** cho mỗi lần gọi; không dùng tiếp một phiên dài.
  - Dán đúng prompt ở trên. Đừng yêu cầu Fable "xem qua toàn bộ dự án".
  - Việc lặp lại (nhân bản beat, nhập dữ liệu, CSS) luôn giao cho Sonnet.
  - Nếu Fable vượt quá thời gian dự kiến của phiên: yêu cầu nó dừng, viết handoff, rồi giao phần còn lại cho Sonnet.
- **Kế hoạch dự phòng khi hết hạn mức Fable:** Sonnet đã có đủ spec trong các skill `spacemuse-step-engine` và `spacemuse-media` để tự làm phần còn lại; chấp nhận cắt bớt cảnh camera bay trên quả cầu, thay bằng chuyển cảnh mờ dần (fade/dissolve) giữa các bục.

## 5. Prompt khởi động cho Sonnet (T6 9:00)
```
Đọc CLAUDE.md, docs/ROLES.md và docs/BRIEF_SONNET.md. Bạn là builder chính của SpaceMuse. Bắt đầu M0 theo docs/ROLES.md §2.
Fable đang làm lib/step/** và components/journey/Stage.tsx song song, không sửa các file đó. Tạo lib/store.ts và các kiểu
dữ liệu TRƯỚC TIÊN (trong 30 phút đầu), commit ngay để Fable dùng.
```
