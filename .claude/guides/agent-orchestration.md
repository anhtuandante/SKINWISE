# 🎯 Agent Orchestration — Cách điều phối AI agents

## Roster — Đội hình Agent

### 🎨 Design System Architect
**File:** `.claude/agents/design-system.md`
**Khi nào dùng:** Mọi thứ liên quan UI — component, layout, animation, responsive, accessibility
**Mạnh:** Hiểu design tokens, Tailwind, component patterns, Stitch
**Yếu:** Không nên giao logic phức tạp, data processing

### 🗄️ Data & Logic Engineer  
**File:** `.claude/agents/data-logic.md`
**Khi nào dùng:** Sửa data JSON, thêm sản phẩm/thành phần, fix conflict engine, filter logic
**Mạnh:** Data integrity, referential checks, algorithm optimization
**Yếu:** Không nên giao giao diện, CSS

### 🏗️ Feature Developer
**File:** `.claude/agents/feature-dev.md`
**Khi nào dùng:** Tính năng mới end-to-end (cả UI + logic), page mới, flow mới
**Mạnh:** Full-stack approach, connects components to data
**Yếu:** Có thể tạo code "works but not polished" — cần Design System agent review sau

### 🔍 QA & DevOps
**File:** `.claude/agents/qa-devops.md`
**Khi nào dùng:** Viết test, setup CI/CD, performance audit, code review
**Mạnh:** Test strategies, build optimization, error detection
**Yếu:** Không nên giao feature implementation

---

## Patterns — Cách phối hợp

### Pattern 1: Single Agent (đơn giản nhất)
```
[Bạn] → giao task → [1 Agent] → output
```
**Dùng khi:** Task nhỏ, rõ ràng, trong phạm vi 1 agent
**Ví dụ:** "Thêm 5 sản phẩm makeup vào products.json" → Data & Logic

### Pattern 2: Pipeline (nối tiếp)
```
[Bạn] → task 1 → [Agent A] → output → task 2 → [Agent B] → output
```
**Dùng khi:** Task cần nhiều chuyên môn, output của agent này là input cho agent kia
**Ví dụ:**
1. Data & Logic: "Thêm category makeup + products"
2. Feature Dev: "Tạo trang /makeup dùng data mới"
3. Design System: "Polish UI trang /makeup cho đẹp"

### Pattern 3: Parallel (song song)
```
[Bạn] → task A → [Agent A]  ↘
                                → [Bạn merge]
[Bạn] → task B → [Agent B]  ↗
```
**Dùng khi:** 2 task không phụ thuộc nhau
**Ví dụ:**
- Agent A (Data): "Thêm conflict rules cho makeup"
- Agent B (Design): "Redesign landing page"

---

## Prompt Templates — Mẫu câu lệnh

### Template: Thêm tính năng mới

```
Đọc: .claude/CLAUDE.md, .claude/memory.md, .claude/agents/feature-dev.md

Task: Tạo tính năng [TÊN TÍNH NĂNG]

Mô tả:
- [Mô tả ngắn tính năng]
- [User story: "Người dùng muốn ... để ..."]

Files cần tạo/sửa:
- [Liệt kê cụ thể]

Requirements:
- [Requirement 1]
- [Requirement 2]

Constraints:
- Tuân thủ .claude/rules/style.md
- Dùng shared constants từ src/lib/constants.ts
- Không tạo component mới trong page file, tách ra src/components/

Ưu tiên: [UI trước / Logic trước / Cả hai]
```

### Template: Fix bug

```
Đọc: .claude/CLAUDE.md, .claude/memory.md

Bug: [Mô tả bug]
Expected: [Behavior mong muốn]
Actual: [Behavior thực tế]
Reproduce: [Bước tái hiện]
File nghi ngờ: [File cụ thể nếu biết]

Hãy tìm root cause, fix, và verify bằng cách build.
```

### Template: Refactor

```
Đọc: .claude/CLAUDE.md, .claude/rules/style.md

Refactor: [Mô tả cần refactor gì]
Motivation: [Tại sao cần refactor — duplication? complexity? readability?]
Files ảnh hưởng: [Liệt kê]

Rules:
- Không thay đổi behavior
- Chạy build sau khi refactor
- Cập nhật memory.md nếu có pattern mới
```

### Template: Review code

```
Đọc: .claude/CLAUDE.md, .claude/rules/style.md, .claude/rules/security.md

Review các file sau:
- [file1]
- [file2]

Checklist:
- [ ] Tuân thủ style guide?
- [ ] Có security issue không?
- [ ] Có duplication không?
- [ ] Naming conventions OK?
- [ ] TypeScript strict types?

Output format:
- File: ... Line: ... Issue: ... Suggestion: ...
```

---

## Anti-patterns — Đừng làm

| ❌ Sai | ✅ Đúng |
|--------|---------|
| Giao task mơ hồ: "Làm đẹp hơn" | Cụ thể: "Redesign ProductCard: thêm hover animation, sử dụng shadow-soft" |
| Không cho đọc context | Luôn kêu đọc CLAUDE.md trước |
| Giao quá nhiều task 1 lúc | Mỗi session focus 1-2 tasks rõ ràng |
| Không review output | Luôn chạy `npm run build` sau mỗi thay đổi |
| Quên update memory | Cuối session kêu agent update memory.md |

---

## Workflow điển hình 1 ngày

```
Session sáng (Feature Dev):
  1. Đọc project-roadmap.md → chọn task ưu tiên cao nhất
  2. Inject context → giao task → review output
  3. Kêu agent update memory.md

Session chiều (Design System):
  1. Review UI từ session sáng
  2. Polish, add animations, responsive check
  3. Update CLAUDE.md nếu có component mới

Session tối (QA):
  1. Chạy build check
  2. Viết tests cho features mới
  3. Review security rules
```
