# 🌟 SkinWise - Personal Care & Beauty AI Advisor

**SkinWise** là ứng dụng cá nhân hóa quy trình chăm sóc da và trang điểm (Skincare & Makeup) dựa trên Trí tuệ nhân tạo (AI-driven) dành cho phụ nữ Việt Nam trong độ tuổi từ 18–35. 

Ứng dụng giúp giải quyết nỗi đau của người tiêu dùng khi lạc lối giữa hàng ngàn sản phẩm mỹ phẩm bằng cách chấm điểm độ tương thích, tự động xây dựng routine an toàn, phân tích da qua camera và cảnh báo các hoạt chất xung đột gây kích ứng.

---

## ✨ Các Tính năng Chính (Core Features)

*   **🔍 AI Skin Face Scan (VisionLab)**: Phân tích selfie cận cảnh khuôn mặt của người dùng bằng **Gemini Vision** để tự động nhận dạng loại da (Dầu/Khô/Hỗn hợp) cùng các khuyết điểm (mụn, đỏ rát, lỗ chân lông to, độ mịn màng) và tự điền vào hồ sơ da.
*   **🩺 Real-time Conflict Checker**: Tự động phát hiện xung đột hoạt chất (vd: Retinol dùng chung AHA/BHA) và xung đột kết cấu gây vón cục (Layering Pilling) dựa trên nguyên tắc hóa học mỹ phẩm chuyên sâu và thuật toán Nước - Silicone (Water-Silicone Layering Asymmetry).
*   **⚖️ Knapsack Optimization Solver**: Tự động cân bằng và hoán đổi các sản phẩm trong quy trình sáng/tối để tối ưu hóa hiệu quả dưỡng da nhưng vẫn đảm bảo tuyệt đối nằm trong hạn mức ngân sách mà người dùng yêu cầu (Affordable, Mid-range, Premium, v.v.).
*   **💬 Floating AI Advisor**: Cố vấn da liễu túc trực 24/7. Trò chuyện dạng *Streaming* mượt mà với mô hình **Gemini 2.5 Flash**, được trang bị cơ chế tự động đối chiếu luật chống ảo giác (Fact-checking) giúp đưa ra lời khuyên khoa học, an toàn nhất.
*   **📸 AI Product Label Scanner**: Chụp mặt sau chứa bảng thành phần của chai mỹ phẩm bất kỳ, AI sẽ đọc chữ (OCR), ánh xạ sang kho hoạt chất, phân loại và cảnh báo ngay lập tức xem sản phẩm này có phản ứng phụ gì với routine hiện tại của bạn hay không.
*   **📖 Từ điển Thành phần (Encyclopedia)**: Tra cứu nhanh công dụng, mức độ lành tính và độ phù hợp của các hoạt chất dưỡng da phổ biến bằng tiếng Việt.

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

*   **Frontend Framework**: Next.js 14 (App Router) + TypeScript 5
*   **Styling**: Tailwind CSS (Thiết kế theo tông màu Luxury Sand ấm áp `#C4A882`, mượt mà với Framer Motion)
*   **State Management**: Zustand 5 (Lưu trữ và đồng bộ cục bộ qua LocalStorage)
*   **Database**: Supabase (PostgreSQL) tích hợp bộ phân quyền Row Level Security (RLS) an toàn
*   **AI Engine**: Google Gemini 2.5 Flash / 1.5 Flash (Sử dụng `@google/generative-ai` & `@ai-sdk/google`)
*   **Drag & Drop**: `@dnd-kit/core` cho trải nghiệm sắp xếp routine trực quan
*   **Performance**: Font chữ tối ưu `next/font/google` (Be Vietnam Pro) và tích hợp `@vercel/analytics`

---

## 🚀 Khởi chạy Dự án (Getting Started)

### 1. Cài đặt các biến môi trường
Tạo file `.env.local` ở thư mục gốc của dự án và điền đầy đủ các thông tin sau:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### 2. Khởi chạy Local Development
Cài đặt dependencies và chạy server phát triển:
```bash
npm install
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt để trải nghiệm ứng dụng.

### 3. Đóng gói Production
Kiểm tra lỗi build trước khi triển khai:
```bash
npm run build
npm run start
```

---

## 📁 Cấu trúc Thư mục Tài liệu (Documentation)

Dự án cung cấp tài liệu chi tiết cho nhà phát triển và vận hành hệ thống tại thư mục [**`docs/`**](file:///e:/SKINWISE/skinwise-app/docs/):

1.  [**Kiến trúc Hệ thống & Thuật toán (System Architecture)**](file:///e:/SKINWISE/skinwise-app/docs/architecture/system-overview.md)
2.  [**Cơ sở Dữ liệu & Luồng dữ liệu (Database Schema)**](file:///e:/SKINWISE/skinwise-app/docs/architecture/database-and-data-flow.md)
3.  [**Đặc tả API Endpoints (API Specification)**](file:///e:/SKINWISE/skinwise-app/docs/api/endpoints.md)
4.  [**Hướng dẫn Triển khai & Migrate dữ liệu (Dev & Deployment Guide)**](file:///e:/SKINWISE/skinwise-app/docs/guides/deployment-and-dev-guide.md)

---
*Bản quyền phát triển © 2026 SkinWise Team. Đã đăng ký bảo hộ.*
