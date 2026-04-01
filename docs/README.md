# 🌟 SkinWise Project Overview

SkinWise là ứng dụng cá nhân hóa quy trình chăm sóc da dựa trên trí tuệ nhân tạo (AI-driven) và cơ sở dữ liệu mỹ phẩm chuyên sâu.

## 🏗️ Kiến trúc Hệ thống

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion.
- **Backend/Database**: Supabase (PostgreSQL) với RLS (Row Level Security).
- **State Management**: Zustand.
- **Design System**: Hệ thống thiết kế tối giản, tập trung vào trải nghiệm người dùng (UX) và tính chuyên nghiệp.

## 📁 Cấu trúc Thư mục Documentation

Toàn bộ tài liệu dự án được tổ chức mới tại đây:

- [docs/architecture/](docs/architecture/): Chi tiết về cấu trúc dữ liệu, sơ đồ hệ thống và các quyết định kỹ thuật.
- [docs/guides/](docs/guides/): Hướng dẫn cho developer mới, quy trình triển khai (Vercel) và quản lý nội dung.
- [docs/api/](docs/api/): Tài liệu về cách tương tác với Supabase và các service nội bộ.

## 🚀 Tính năng Chính

1. **Skin Quiz**: Thu thập thông tin da và ngân sách người dùng.
2. **AI Recommendation**: Gợi ý sản phẩm phù hợp từ Database Supabase.
3. **Conflict Checker**: Kiểm tra xung đột giữa các thành phần (vd: Retinol vs AHA).
4. **Routine Builder**: Giúp người dùng xây dựng quy trình sáng/tối tối ưu.
5. **Advanced Search**: Tìm kiếm sản phẩm thông minh với Expanding Search Dock.

---
*Cập nhật lần cuối: 01/04/2026*
