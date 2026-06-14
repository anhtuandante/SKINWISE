# 🩺 Báo cáo Đánh giá Dự án Gắt gao (SkinWise Project Audit Report)

Tài liệu này đánh giá toàn diện mã nguồn hiện tại của dự án **SkinWise** dựa trên bộ 6 tiêu chí nghiêm ngặt đã thiết lập.

---

## 🎨 1. Trải nghiệm người dùng & Thiết kế Mỹ thuật (UI/UX & Aesthetics)
*   **Điểm đánh giá**: **9/10** (Xuất sắc)
*   **Chi tiết thực tế**:
    *   **Hệ thống thiết kế (Design System)**: Tailwind config sử dụng thống nhất các token sang trọng (`accent` `#C4A882`, `bg` `#FAFAF8`). Font chữ **Be Vietnam Pro** được tích hợp qua `next/font/google` giúp tối ưu tốc độ và triệt tiêu lỗi CLS (Cumulative Layout Shift).
    *   **Animation**: Các trang được bọc trong `<AnimatePresence>` và hiệu ứng của **Framer Motion** đem lại cảm giác mượt mà khi đổi tab AM/PM trong `RoutineBuilder` và khi mở popup `VisionLab`.
    *   **Mobile-first**: Bố cục layout dùng Flex/Grid linh hoạt, giao diện modal phân tích da `VisionLab` thiết bị di động hiển thị co giãn tốt, không bị tràn màn hình.
*   **Điểm cần khắc phục**:
    *   Component `VisionLab.tsx` tự viết lại helper `clsx` thay vì import hàm `cn()` dùng chung tại `src/lib/utils.ts`. Đây là điểm không đồng bộ về mặt code style.

---

## 🧠 2. Tính Chính xác & An toàn Y khoa của AI (AI Safety & Medical Rules)
*   **Điểm đánh giá**: **8.5/10** (Khá tốt)
*   **Chi tiết thực tế**:
    *   **Kiểm soát ảo giác**: API `/api/chat` sử dụng cơ chế **Fact-check Injection**, trực tiếp bơm dữ liệu xung đột thật (`conflicts.json`) và ngữ cảnh da người dùng (`userContext`) vào `systemInstruction` của Gemini 2.5 Flash. Điều này giảm thiểu tối đa hiện tượng AI tư vấn bừa bãi.
    *   **Độ nhạy cảnh báo**: Toàn bộ các cảnh báo y tế/kích ứng (ví dụ: Retinol dùng chung AHA/BHA) đều có tiêu đề rõ ràng và khuyến nghị giải pháp giãn cách ngày bôi rất thực tế.
    *   **Hạn chế rủi ro**: Trong `prompts.ts`, AI được thiết lập hành vi cốt lõi: *"KHÔNG đưa ra lời khuyên y tế thay thế bác sĩ. Nếu da gặp vấn đề nghiêm trọng... khuyên đi khám bác sĩ da liễu."*
*   **Điểm cần khắc phục**:
    *   OCR của `VisionLab` dựa hoàn toàn vào prompt yêu cầu trả về JSON của Gemini. Nếu ảnh chụp quá mờ hoặc có nhãn chai phản quang mạnh, mô hình có thể trả về JSON lỗi hoặc không đúng định dạng. Cần tích hợp cơ chế tiền xử lý ảnh hoặc thử lại (retry logic) tự động ở phía API.

---

## ⚖️ 3. Tính Logic của Thuật toán (Algorithmic Rigor)
*   **Điểm đánh giá**: **9.5/10** (Rất xuất sắc)
*   **Chi tiết thực tế**:
    *   **Bộ tối ưu hóa ngân sách (Knapsack Solver)**: Logic chạy trong `quiz-logic.ts` rất thông minh. Hệ thống tự động tính tỷ lệ giữa mức điểm giảm và số tiền tiết kiệm được ($\Delta \text{Score} / \Delta \text{Price}$) để thay thế sản phẩm đắt tiền bằng sản phẩm rẻ hơn mà vẫn giữ được độ hiệu quả cao nhất của routine.
    *   **Match Score & Menstrual Cycle Adjustments**: Thuật toán tính điểm tương thích tại `recommendation-engine.ts` chia tỷ lệ điểm chặt chẽ. Hệ thống tự động phát hiện pha hành kinh (Menstrual phase) qua `cyclePredictor.ts` để trừ điểm (-10) các hoạt chất peel da mạnh và cộng điểm (+8) cho hoạt chất phục hồi (B5, Ceramide, Rau má) rất thực tiễn với sinh học phụ nữ.
    *   **Bảo vệ da yếu**: Tự động ép buộc routine tối giản nếu hàng rào bảo vệ da của người dùng bị kích ứng (stinging, redness, flaking).

---

## ⚡ 4. Hiệu năng & Kỹ thuật (Performance & Engineering Quality)
*   **Điểm đánh giá**: **8/10** (Khá)
*   **Chi tiết thực tế**:
    *   **Cơ chế dự phòng (Resiliency)**: Trong `quiz-logic.ts`, các cuộc gọi tới database Supabase đều nằm trong khối `try/catch`. Nếu Supabase bị lỗi hoặc hết băng thông, hệ thống sẽ tự động hạ cấp (fallback) sang đọc file JSON cục bộ (`products.json`), giúp người dùng không bao giờ gặp màn hình trắng.
    *   **Độ trễ API**: Streaming Chat giúp phản hồi được hiển thị ngay lập tức, tăng cảm giác nhanh chóng cho người dùng.
*   **Điểm cần khắc phục**:
    *   **Vulnerability về Rate Limit**: Các API Route như `/api/chat` và `/api/vision/analyze` gọi trực tiếp đến API Gemini của Google nhưng không có Middleware hay cơ chế giới hạn tần suất gọi (Rate limiting). Kẻ xấu có thể spam API để tiêu hao token và chi phí của chủ dự án.
    *   **Cache Invalidation**: Việc lưu điểm sản phẩm vào `sessionStorage` giúp tăng tốc độ chuyển trang nhưng có thể làm trễ cập nhật điểm số nếu người dùng thay đổi thông tin loại da trong cùng một phiên mà không tải lại trang.

---

## 🗄️ 5. Tính Nhất quán và Toàn vẹn Dữ liệu (Data Integrity)
*   **Điểm đánh giá**: **6/10** (Trung bình - Đây là điểm yếu lớn nhất của hệ thống)
*   **Chi tiết thực tế**:
    *   **Nợ kỹ thuật lớn (Asymmetry)**: 
        1.  Bộ kiểm tra xung đột (`conflict-checker.ts`) vẫn đang đọc từ file JSON tĩnh `conflicts.json` tại client thay vì gọi bảng `rules` trên Supabase Database.
        2.  Trang Bách khoa thành phần (`/ingredients`) đọc trực tiếp file JSON tĩnh `ingredients.json` tại client thay vì query bảng `ingredients` trên Supabase.
*   **Hậu quả**:
    *   Admin cập nhật dữ liệu mới trên Supabase Dashboard thì người dùng trên môi trường production vẫn thấy dữ liệu cũ (do code vẫn đang đọc file JSON tĩnh đi kèm bản build). Muốn dữ liệu mới có hiệu lực, developer phải sửa file JSON cục bộ và deploy lại toàn bộ ứng dụng.

---

## 🔒 6. Bảo mật & Khả năng tiếp cận (Security & Accessibility)
*   **Điểm đánh giá**: **9/10** (Xuất sắc)
*   **Chi tiết thực tế**:
    *   **Bảo vệ API Key**: Biến môi trường nhạy cảm `GOOGLE_GENERATIVE_AI_API_KEY` chỉ được gọi ở phía server trong Route Handler (`/api/chat/route.ts`), không bị rò rỉ ra phía Client.
    *   **Phân quyền Database (Supabase RLS)**: File `schema.sql` cho thấy RLS được kích hoạt chặt chẽ cho toàn bộ 4 bảng. Quyền SELECT được mở công khai (`true`), nhưng quyền ghi/sửa/xóa chỉ dành cho tài khoản Admin/Service Key.
    *   **Accessibility (a11y)**: Nút kéo thả trong `RoutineBuilder` có đầy đủ `aria-label="Kéo để sắp xếp"`, các Toast Alert sử dụng `role="status"` và `aria-live="polite"` cho trình đọc màn hình của người khiếm thị.

---

## 📊 Bảng điểm tổng hợp (Summary Dashboard)

| Tiêu chí | Điểm số | Trạng thái | Hành động đề xuất |
|---|---|---|---|
| **UI/UX & Aesthetics** | **9.0 / 10** | 🟢 Tốt | Refactor lại hàm `clsx` trong `VisionLab.tsx` sử dụng `cn`. |
| **AI Safety & Accuracy** | **8.5 / 10** | 🟢 Tốt | Thêm fallback UI cho trường hợp OCR nhãn chai bị mờ. |
| **Algorithmic Rigor** | **9.5 / 10** | 🟢 Xuất sắc | Duy trì cấu trúc hiện tại của Knapsack Solver. |
| **Performance & Resiliency**| **8.0 / 10** | 🟡 Khá | Thêm Rate Limit middleware bằng `upstash/ratelimit` hoặc tương đương để bảo vệ API. |
| **Data Integrity** | **6.0 / 10** | 🔴 Yếu (Nợ kỹ thuật)| Đồng bộ hóa `conflict-checker` và trang `/ingredients` sử dụng API/Supabase thay vì file JSON tĩnh. |
| **Security & a11y** | **9.0 / 10** | 🟢 Xuất sắc | Duy trì Row Level Security và cấu hình biến môi trường server-only. |
