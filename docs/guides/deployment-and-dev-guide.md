# 🚀 Hướng dẫn Triển khai & Vận hành

Dự án SkinWise được thiết kế để triển khai nhanh (Fast Deployment) lên nền tảng **Vercel** và quản lý Database qua **Supabase**.

## 💻 Cấu hình Môi trường (Local)

Mọi dự án Next.js yêu cầu file `.env.local` tại thư mục gốc với:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 🛠️ Triển khai lên Vercel (Production)

1. **Chuẩn bị**: Kiểm tra production build ở local (`npm run build`).
2. **Setup Vercel**:
    - Project Settings -> Environment Variables.
    - Thêm 2 biến `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Deploy**: Kết nối repo với Vercel Dashboard hoặc dùng `vercel --prod`.

## 🔄 Quy trình Cập nhật Dữ liệu

1. **Chỉnh sửa SQL**: Sử dụng SQL Editor trên Supabase Dashboard.
2. **Migrate script**: Sử dụng `scripts/migrate-to-supabase.js` nếu cần đổ dữ liệu từ JSON lên DB.
    - **Lưu ý**: Tắt RLS tạm thời nếu dùng Anon Key để migrate dữ liệu ghi (Write).

## ✨ Ghi chú Phát triển

- **Thành phần UI**: Sử dụng cấu trúc thư mục `/src/components/ui/`.
- **Search Dock**: Một component đặc biệt kết hợp Framer Motion để tạo trải nghiệm tìm kiếm sống động.
- **Analytics**: Vercel Analytics được kích hoạt trong `layout.tsx` cho phiên bản Production.
