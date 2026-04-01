# 💾 Supabase Database Schema

Dự án SkinWise hiện đang sử dụng Supabase (PostgreSQL) làm cơ sở dữ liệu lưu trữ mỹ phẩm và thành phần skin-care.

## 📋 Các Bảng Chính

- **`ingredients`**: Lưu trữ danh sách thành phần, tên tiếng Việt, tác dụng, loại da phù hợp và thông tin mang thai.
- **`products`**: Danh sách sản phẩm, thương hiệu, giá cả, SPF, pH và kết cấu (silicone-based/water-based).
- **`product_ingredients`**: Bảng trung gian (Many-to-Many) liên kết sản phẩm với các thành phần cấu thành.
- **`rules`**: Chứa các quy tắc xung đột (Conflicts) về thành phần và kết cấu (vd: vón cục - pilling).

## 🔒 Security (RLS)

Hệ thống đang sử dụng Row Level Security (RLS) để:
- Cho phép tất cả người dùng (Anon/Public) đọc các bảng (`SELECT`).
- Chỉ Admin (qua Supabase Dashboard) mới có quyền chỉnh sửa/thêm mới data (`INSERT`, `UPDATE`, `DELETE`).

## 🛠️ Data Flow

1. Người dùng làm Quiz -> App thu thập `skinType`, `concerns`, `budget`.
2. Trình gọi `filterProducts` (src/lib/quiz-logic.ts) gửi request lên Supabase Table `products`.
3. Dữ liệu trả về được ánh xạ (mapping) từ snake_case sang camelCase và lọc (filter) tại Client-side để đảm bảo tốc độ phản hồi.
