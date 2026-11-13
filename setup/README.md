# Cài bộ cấu hình Claude Code cho SpaceMuse

Thư mục này chứa cấu hình mà bạn **tự duyệt rồi cài vào dự án** (Claude không tự cấp quyền cho chính mình).

## 1. Skills dự án (nên cài)
5 skill dành riêng cho SpaceMuse. Builder sẽ tự dùng khi làm đúng loại việc tương ứng:

| Skill | Dùng khi |
|---|---|
| `spacemuse-step-engine` | Xây và debug cơ chế cuộn từng bước (thuật toán chống quán tính trackpad, lưu ý cho iOS) |
| `spacemuse-media` | Gắn footage, ảnh, model, texture (đường dẫn file, thời lượng clip, mốc T‑0) |
| `spacemuse-content` | Nhập nội dung, hiển thị số liệu và nguồn, AgeCounter |
| `spacemuse-review` | Kiểm tra cuối mỗi milestone |
| `spacemuse-ship` | Feature freeze, quay video demo, nộp bài |

Cài đặt (chạy ở thư mục gốc dự án):
```bash
mkdir -p .claude/skills && cp -R setup/claude/skills/* .claude/skills/
```

## 2. Danh sách quyền cho phép (tuỳ chọn, giúp builder ít phải hỏi xác nhận)
`setup/claude/settings.json`:
- **Cho phép:** npm/npx/node, ffmpeg, các lệnh git không phá huỷ, `vercel deploy` (bản preview), sửa file trong `app/`, `components/`, `content/`, `lib/`, `public/`.
- **Chặn:** xoá `materials/` hoặc `docs/`, `git push --force`, `git reset --hard`, deploy production, sửa `materials/`, `docs/COPY.md`, `docs/EXHIBITS.md`.

Đọc lại file rồi cài:
```bash
cp setup/claude/settings.json .claude/settings.json
```

## 3. Mở phiên làm việc ngày 14/11
- Người A: mở Claude Code với model Fable, gõ: `Đọc CLAUDE.md và docs/BRIEF_FABLE.md rồi bắt đầu M0.`
- Người B: mở Claude Code với model Sonnet, gõ: `Đọc CLAUDE.md và docs/BRIEF_SONNET.md rồi bắt đầu M0.`
