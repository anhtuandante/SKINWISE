# 🚀 Getting Started — Hướng dẫn bắt đầu session với AI Agent

## Mục đích

File này giúp bạn (người điều phối) biết **đọc gì, làm gì** mỗi khi mở một session mới với bất kỳ AI agent nào. Đảm bảo agent luôn có đủ context để làm việc hiệu quả.

---

## Bước 1: Xác định mục tiêu session

Trước khi mở agent, tự hỏi:
- **Tôi muốn đạt được gì cuối session này?** (1-2 câu)
- **Phần nào của dự án bị ảnh hưởng?** (data, UI, logic, devops)
- **Agent nào phù hợp nhất?** (xem bảng dưới)

| Mục tiêu | Agent phù hợp |
|-----------|---------------|
| Sửa giao diện, thêm component UI | `design-system` |
| Sửa data, thêm sản phẩm, fix logic filter | `data-logic` |
| Thêm tính năng mới, trang mới | `feature-dev` |
| Viết test, setup CI/CD, review code | `qa-devops` |
| Không chắc | Bắt đầu với `feature-dev` (tổng hợp nhất) |

---

## Bước 2: Context injection — Kêu agent đọc gì trước

Khi bắt đầu session, **luôn kêu agent đọc theo thứ tự**:

```
Đọc các file sau theo thứ tự:
1. .claude/CLAUDE.md              ← Hiểu tổng quan dự án
2. .claude/memory.md              ← Facts quan trọng, quirks, "đừng làm" list
3. .claude/agents/{tên-agent}.md  ← Responsibilities + rules riêng
4. .claude/rules/style.md         ← Coding conventions
```

### Prompt mẫu để bắt đầu session:

```
Hãy đọc các file config theo thứ tự:
1. .claude/CLAUDE.md
2. .claude/memory.md
3. .claude/agents/feature-dev.md
4. .claude/rules/style.md

Sau đó tôi sẽ giao task cho bạn.
```

> **Quan trọng**: CLAUDE.md là "bộ não" — agent PHẢI đọc file này trước MỌII thao tác khác.

---

## Bước 3: Giao task

Sau khi agent đã đọc context, giao task cụ thể:

```
Task: Thêm trang /compare cho so sánh 2 sản phẩm

Yêu cầu:
- Route mới ở src/app/compare/page.tsx
- Nhận 2 product IDs qua query params
- Show so sánh song song: giá, thành phần, loại da phù hợp
- Dùng design tokens từ tailwind.config.ts
- Tuân thủ style.md

Ưu tiên: Giao diện đẹp trước, logic sau.
```

### Checklist cho task tốt:
- [ ] Nêu rõ FILE cụ thể cần tạo/sửa
- [ ] Nêu rõ INPUT/OUTPUT mong muốn
- [ ] Nêu ưu tiên (UI trước hay logic trước)
- [ ] Nhắc agent check rules nếu cần

---

## Bước 4: Review và iterate

Sau khi agent hoàn thành:
1. Chạy `npm run build` — check lỗi compilation
2. Chạy `npm run dev` — xem kết quả visual
3. Nếu cần sửa → giao task tiếp, **không cần đọc lại context**
4. Cuối session → kêu agent cập nhật `memory.md` với facts mới

### Prompt cuối session:

```
Cập nhật .claude/memory.md với những facts/decisions/quirks mới
từ session này. Giữ format hiện tại.
```

---

## Bước 5: Khi gặp vấn đề

| Tình huống | Giải pháp |
|------------|-----------|
| Agent "quên" context | Kêu đọc lại CLAUDE.md + memory.md |
| Agent làm sai style | Kêu đọc lại rules/style.md + specific example |
| Agent sửa file không liên quan | Nhắc "CHỈ sửa file X, không đụng file khác" |
| Agent tạo code quá phức tạp | Nhắc "Keep it simple, follow CLAUDE.md conventions" |
| Không biết bắt đầu từ đâu | Đọc `project-roadmap.md` để biết task tiếp theo |

---

## Quick reference: File structure

```
.claude/
├── CLAUDE.md              ← ĐỌC TRƯỚC TIÊN, mọi session
├── memory.md              ← Facts, quirks, "đừng" list
├── settings.json          ← Permissions (ít khi cần đọc)
├── guides/                ← 📍 BẠN ĐANG Ở ĐÂY
│   ├── getting-started.md
│   ├── agent-orchestration.md
│   ├── project-roadmap.md
│   └── design-decisions.md
├── agents/                ← Role definitions cho từng agent
├── rules/                 ← Coding conventions
└── skills/                ← Stitch + data pipeline tools
```
