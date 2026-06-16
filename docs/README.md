# 🌟 Tài liệu Dự án SkinWise

Chào mừng bạn đến với thư mục tài liệu kỹ thuật của **SkinWise** - ứng dụng cá nhân hóa quy trình chăm sóc da dựa trên trí tuệ nhân tạo (AI-driven) và cơ sở dữ liệu mỹ phẩm chuyên sâu dành riêng cho phụ nữ Việt Nam.

---

## 📁 Sơ đồ Thư mục Tài liệu (Documentation Map)

Để dễ dàng nắm bắt toàn bộ dự án, tài liệu được phân tách thành các danh mục sau:

### 1. 🏗️ Kiến trúc & Hệ thống (Architecture)
*   [**Kiến trúc Hệ thống & Thuật toán Cốt lõi (System Overview)**](file:///e:/SKINWISE/skinwise-app/docs/architecture/system-overview.md): Chi tiết về luồng dữ liệu, thuật toán tính điểm Match Score, bộ tối ưu ngân sách (Knapsack Solver), bộ quét xung đột hoạt chất và kết cấu, cùng cơ chế tích hợp Gemini AI.
*   [**Database & Data Flow**](file:///e:/SKINWISE/skinwise-app/docs/architecture/database-and-data-flow.md): Sơ đồ các bảng trong cơ sở dữ liệu Supabase, các chính sách Row Level Security (RLS) và cách thức dữ liệu di chuyển từ Client lên DB.
*   [**Báo cáo Đánh giá Kỹ thuật (Technical Audit Report)**](file:///e:/SKINWISE/skinwise-app/docs/architecture/audit-report.md): Đánh giá gắt gao chất lượng phần mềm, bảo mật, thuật toán và các khoản nợ kỹ thuật (Tech Debt) hiện có.

### 2. 🔌 Giao tiếp Hệ thống (APIs)
*   [**Tài liệu chi tiết API Endpoints**](file:///e:/SKINWISE/skinwise-app/docs/api/endpoints.md): Hướng dẫn cấu trúc payload request/response cho Chat (Streaming), Scoring (Tính điểm AI), Skin Analyze (Quét da mặt) và Product Scan (Quét bảng thành phần nhãn chai).

### 3. 🚀 Hướng dẫn Vận hành & Phát triển (Developer Guides)
*   [**Deployment & Dev Guide**](file:///e:/SKINWISE/skinwise-app/docs/guides/deployment-and-dev-guide.md): Cài đặt môi trường local, các lệnh dev thường dùng, quy trình đóng gói và deploy lên Vercel, cùng quy trình đồng bộ hóa cơ sở dữ liệu từ file JSON tĩnh lên Supabase.

### 🌸 Tài liệu Dành cho Người dùng (User Guides)
*   [**Giới thiệu SkinWise (High-level Intro)**](file:///e:/SKINWISE/skinwise-app/docs/guides/gioi-thieu-skinwise.md): Giới thiệu nhanh các tính năng cốt lõi và hành trình sử dụng ứng dụng dưới góc nhìn phi kỹ thuật (Dành cho mọi đối tượng độc giả).
*   [**Hướng dẫn Sử dụng chi tiết (User Guide)**](file:///e:/SKINWISE/skinwise-app/docs/guides/user-guide.md): Cẩm nang chi tiết từng bước tạo tài khoản, làm quiz, quản lý Workspace và các khuyến cáo an toàn khi chăm sóc da.

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

*   **Framework**: Next.js 14 (App Router) + TypeScript
*   **Database**: Supabase (PostgreSQL)
*   **State Management**: Zustand (Persisted)
*   **Styling & UI**: Tailwind CSS + Framer Motion (Luxury Beauty design system)
*   **AI Engine**: Google Gemini 2.5 Flash / 1.5 Flash (SDK & Vercel AI SDK)
*   **Font chữ**: Be Vietnam Pro (Tối ưu hóa tiếng Việt)

---
*Cập nhật lần cuối: Tháng 6 năm 2026*
