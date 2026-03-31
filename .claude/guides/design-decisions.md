# 🧠 Design Decisions — Tại sao chọn cách này

## Kiến trúc

### Tại sao Next.js 14 App Router?
- **Trade-off:** App Router mới hơn Pages Router, learning curve cao hơn, nhưng SSR/SSG mạnh hơn
- **Lý do chọn:** Static export dễ, SEO tốt, file-based routing trực quan, React Server Components tương lai
- **Alternative rejected:** Vite + React (không có SSG built-in), Remix (overkill cho static app)

### Tại sao Zustand mà không Redux?
- **Trade-off:** Zustand ít boilerplate hơn nhưng ecosystem nhỏ hơn
- **Lý do chọn:** App nhỏ, 2 stores (user + routine), không cần middleware phức tạp. Zustand cho `persist` middleware built-in, perfect cho localStorage
- **Khi nào chuyển Redux:** Nếu có >5 stores, complex async flows, hoặc cần devtools mạnh

### Tại sao static JSON mà không API?
- **Trade-off:** Không real-time, khó scale, nhưng zero infrastructure cost
- **Lý do chọn:** Demo/MVP phase, 50 products không cần database. Data thay đổi ít (không phải social feed). Deploy free trên Vercel
- **Khi nào chuyển API:** Khi data >200 products, cần user-generated content, hoặc admin dashboard

### Tại sao client-side filtering mà không server?
- **Trade-off:** Tải toàn bộ data lên client, nhưng filter instant
- **Lý do chọn:** <50 products, JSON < 20KB gzipped, search/filter phải instant (không chờ roundtrip)
- **Khi nào chuyển server:** Khi data >500 products hoặc filter query phức tạp

---

## Design System

### Tại sao warm monochrome mà không sage green?
- **Context:** Version đầu dùng sage green (#5C7A52) — cảm giác "eco/green" nhưng quá generic
- **Research:** Aesop, Glossier, Drunk Elephant dùng monochrome base + warm accent → luxury feel
- **Quyết định:** Chuyển sang warm white (#FAFAF8) + near-black (#1A1A1A) + warm tan accent (#C4A882)
- **Psychology:** Warm tones → trust, luxury, skin-related. Black + white → editorial, professional

### Tại sao editorial minimalism?
- **Problem:** Version 1 dùng quá nhiều emoji, gradient, cards → "noisy", không professional
- **Research (3/2026):** Top beauty apps đều trending minimal: Sephora, Glow Recipe, Hwahae
- **Principles áp dụng:**
  - Typography hierarchy thay emoji (headings > subtext, không cần 🧴 🌙)
  - Whitespace > cards (content tự đứng, không cần box)
  - 1 accent color = enough (warm tan cho important elements)
  - Photography > icons (khi có product images thực)

### Tại sao Be Vietnam Pro?
- **Requirement:** Vietnamese diacritical marks (ă, â, ơ, ư, đ...)
- **Options tested:** Inter (tốt nhưng Viet marks hơi lạ), Nunito (quá rounded), Be Vietnam Pro (designed cho Vietnamese, modern)
- **Quyết định:** Be Vietnam Pro light/regular/semibold/bold covers mọi use case

---

## Data Model

### Tại sao tách products/ingredients/conflicts thành 3 files?
- **Single file alternative:** Tất cả trong 1 JSON → đơn giản hơn nhưng hard maintain
- **Lý do tách:** Separation of concerns — products thay đổi thường xuyên (thêm sản phẩm), ingredients ít thay đổi, conflicts gần như static
- **Bonus:** Validation script có thể check referential integrity giữa 3 files

### Tại sao 5 budget tiers mà không 3?
- **VN Market research:** Average spend 450-740K VNĐ/month, range rất rộng
- **5 tiers:** < 200K (Thorakao) | 200-400K (Cocoon, CeraVe) | 400K-1M (La Roche-Posay) | 1-3M (Estée Lauder) | 3M+ (SK-II, La Mer)
- **Previous 4 tiers bị sai:** "under-300k" quá gộp, "over-1m" quá rộng

### Tại sao thêm makeup vào cùng app thay vì app riêng?
- **Insight:** 80% phụ nữ VN dùng skincare + makeup, quiz hỏi cả hai tự nhiên hơn
- **Technical:** Share cùng filter engine, conflict checker (một số skincare + makeup conflict), budget calculator
- **UX:** 1 quiz → gợi ý cả skincare lẫn makeup = giá trị cao hơn cho user

---

## Các quyết định thường bị hỏi

### "Sao không dùng Tailwind v4?"
- Next.js 14 official support cho Tailwind v3 — stability > bleeding edge
- Upgrade khi Next.js 15 stable

### "Sao không có authentication?"
- MVP không cần — routine lưu localStorage đủ cho demo
- Auth = cần backend = cost + complexity, chưa justified

### "Sao không dùng database thay JSON?"
- Zero cost deployment (Vercel free tier)
- Data < 100KB → JSON perfectly fine
- Add database khi cần user content hoặc admin panel

### "Sao dùng dnd-kit mà không react-beautiful-dnd?"
- react-beautiful-dnd deprecated (Atlassian stopped maintenance)
- dnd-kit actively maintained, smaller bundle, better TypeScript support
