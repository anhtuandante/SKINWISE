# 🗺️ Project Roadmap — Lộ trình phát triển SkinWise

## Trạng thái hiện tại (Tháng 3/2026)

### ✅ Đã hoàn thành
- Landing page với design premium
- Quiz 4 bước (loại da, vấn đề, budget, dị ứng)
- Gợi ý sản phẩm theo hồ sơ da (26+ skincare products)
- Conflict engine (6 ingredient + 3 texture conflicts)
- Routine builder sáng/tối + drag-drop
- Trang bách khoa thành phần (/ingredients)
- Shared constants (lib/constants.ts)
- .claude/ agent configuration (14 files)
- Data validation scripts

### 🟡 Cần cải thiện
- Giao diện còn dùng nhiều emoji, chưa đủ "editorial"
- Chỉ có skincare, chưa có makeup
- Data 26 sản phẩm — cần mở rộng
- Chưa có test nào
- Product images chưa có
- Chưa có loading states thực sự

---

## Lộ trình phát triển

### Phase 1: Foundation Polish ← **ƯU TIÊN CAO NHẤT**
> Mục tiêu: Nền tảng vững chắc trước khi mở rộng

| Task | Agent | Effort | Priority |
|------|-------|--------|----------|
| Redesign toàn bộ UI sang editorial minimalist | Design System | Lớn | 🔴 Cao |
| Mở rộng data: 50+ products (skincare + makeup) | Data & Logic | Trung bình | 🔴 Cao |
| Quiz thêm bước makeup preference | Feature Dev | Nhỏ | 🟡 TB |
| Budget optimizer (hiện tổng budget vs chi phí routine) | Feature Dev | Trung bình | 🟡 TB |

### Phase 2: New Features
> Mục tiêu: Tính năng tạo giá trị thêm

| Task | Agent | Effort |
|------|-------|--------|
| Trang so sánh sản phẩm (/compare) | Feature Dev | Trung bình |
| Trang makeup routine builder | Feature Dev | Lớn |
| Share routine qua link (URL encoding) | Feature Dev | Nhỏ |
| Skin diary / tracking | Feature Dev | Lớn |
| Dark mode | Design System | Nhỏ |

### Phase 3: Quality & Scale
> Mục tiêu: Production-ready

| Task | Agent | Effort |
|------|-------|--------|
| Unit tests cho lib/ và store/ | QA & DevOps | Trung bình |
| E2E tests (quiz flow, routine builder) | QA & DevOps | Trung bình |
| GitHub Actions CI/CD | QA & DevOps | Nhỏ |
| Performance audit (<3s FCP) | QA & DevOps | Nhỏ |
| SEO audit (structured data, sitemap) | QA & DevOps | Nhỏ |
| Accessibility audit (WCAG 2.1 AA) | Design System | Trung bình |

### Phase 4: Growth (tương lai)
> Mục tiêu: Mở rộng user base

| Task | Notes |
|------|-------|
| CMS integration (Contentful/Sanity) | Thay thế static JSON |
| User authentication | Lưu routine online |
| Backend API | Product database real-time |
| Mobile app (React Native) | Reuse logic layer |
| Affiliate system (Shopee, Lazada) | Revenue |

---

## Dependency Graph

```
Phase 1 Foundation → ┬→ Phase 2 Features
                      └→ Phase 3 Quality  → Phase 4 Growth
```

> **Rule**: Không bắt đầu Phase 2/3 cho tới khi Phase 1 hoàn thành. Foundation phải vững trước.

---

## Cách chọn task tiếp theo

1. Mở file này
2. Xem Phase hiện tại (Phase 1)
3. Chọn task Priority 🔴 Cao nhất chưa hoàn thành
4. Xem cột "Agent" → mở session với agent đó
5. Follow `getting-started.md` để bắt đầu

---

## Definition of Done (DOD)

Một task được coi là "xong" khi:
- [ ] `npm run build` pass, 0 errors
- [ ] Visual check trên browser OK
- [ ] Responsive check (mobile, tablet, desktop)
- [ ] memory.md được cập nhật
- [ ] Không tạo tech debt mới (no TODOs, no shortcuts)
