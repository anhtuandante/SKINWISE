# 🔌 Tài liệu API Endpoints (SkinWise)

Tài liệu này chi tiết hóa các API Routes hiện có trong ứng dụng **SkinWise** và cách tích hợp chúng với Google Gemini AI. Tất cả API đều sử dụng phương thức `POST` và nhận/trả về định dạng JSON (hoặc Text Stream).

---

## 🧭 Danh sách API Routes

Hệ thống có 4 API Endpoints chính nằm trong thư mục `src/app/api/`:
1. `POST /api/chat` - Trợ lý tư vấn da liễu cá nhân (Streaming)
2. `POST /api/products/score` - Đánh giá độ tương thích của sản phẩm qua AI
3. `POST /api/vision/analyze` - Phân tích ảnh selfie (Quiz & Daily Check-in)
4. `POST /api/vision/scan` - Quét bảng thành phần nhãn chai mỹ phẩm (OCR & Check xung đột)

---

### 1. 💬 AI Chat Advisor (`POST /api/chat`)

Dùng để gửi tin nhắn đến Trợ lý AI và nhận phản hồi dưới dạng Stream (truyền tải trực tiếp chữ đang sinh).

*   **URL**: `/api/chat`
*   **Mã nguồn**: [src/app/api/chat/route.ts](file:///e:/SKINWISE/skinwise-app/src/app/api/chat/route.ts)
*   **Payload gửi lên (Body)**:
    ```json
    {
      "messages": [
        { "role": "user", "content": "Routine của mình có Retinol và AHA dùng chung có sao không?" }
      ],
      "userContext": {
        "skinType": "oily",
        "concerns": ["acne", "pores"],
        "barrierStatus": "stable",
        "morningRoutine": [],
        "eveningRoutine": []
      }
    }
    ```
*   **Phản hồi trả về (Response)**:
    *   **Headers**: `Content-Type: text/plain; charset=utf-8`
    *   **Body**: Trả về text stream trực tiếp từ Gemini AI.
*   **Đặc điểm nổi bật**:
    *   Sử dụng mô hình **Gemini 2.5 Flash** server-side (`sendMessageStream`).
    *   Tự động inject danh sách xung đột gốc từ `conflicts.json` để thực hiện *Fact-Check* trực tiếp, ngăn chặn AI bịa luật dưỡng da.

---

### 2. 📊 AI Product Scoring (`POST /api/products/score`)

Sử dụng AI để tính điểm tương thích (%) giữa một sản phẩm cụ thể và cấu hình da của người dùng.

*   **URL**: `/api/products/score`
*   **Mã nguồn**: [src/app/api/products/score/route.ts](file:///e:/SKINWISE/skinwise-app/src/app/api/products/score/route.ts)
*   **Payload gửi lên (Body)**:
    ```json
    {
      "product": {
        "id": "123",
        "name": "BHA Obagi Clenziderm MD",
        "brand": "Obagi",
        "ingredients": ["bha", "menthol"]
      },
      "userContext": {
        "skinType": "oily",
        "concerns": ["acne"]
      }
    }
    ```
*   **Phản hồi trả về (Response)**:
    *   **Headers**: `Content-Type: application/json`
    *   **Body**:
        ```json
        {
          "score": 92,
          "reason": "Chứa BHA nồng độ cao giúp loại bỏ bã nhờn, rất phù hợp với da dầu mụn.",
          "highlightIngredient": "BHA (Salicylic Acid)",
          "warning": "Có chứa Menthol (Bạc hà), có thể gây châm chích nhẹ đối với da nhạy cảm."
        }
        ```

---

### 3. 📷 AI Face Scan (`POST /api/vision/analyze`)

Nhận diện tình trạng da qua ảnh selfie của người dùng (hỗ trợ 2 chế độ: Quiz phân tích lần đầu và Daily Check-in theo dõi hàng ngày).

*   **URL**: `/api/vision/analyze`
*   **Mã nguồn**: [src/app/api/vision/analyze/route.ts](file:///e:/SKINWISE/skinwise-app/src/app/api/vision/analyze/route.ts)
*   **Payload gửi lên (Body)**:
    ```json
    {
      "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
      "mode": "quiz" 
    }
    ```
    *(Mẹo: `mode` có thể là `"quiz"` hoặc `"dailyCheckin"`)*

*   **Phản hồi trả về (Response) - `quiz` mode**:
    ```json
    {
      "skinType": "combination",
      "concerns": ["pores", "acne"],
      "analysis": {
        "acne": 25,
        "redness": 10,
        "pores": 60,
        "texture": 30
      },
      "summary": "Da hỗn hợp thiên dầu, lỗ chân lông to ở vùng chữ T và có một vài nốt mụn ẩn.",
      "recommendation": "Tập trung làm sạch sâu bằng sữa rửa mặt tạo bọt nhẹ và sử dụng toner kiềm dầu."
    }
    ```

*   **Phản hồi trả về (Response) - `dailyCheckin` mode**:
    ```json
    {
      "skinType": "combination",
      "concerns": ["acne"],
      "analysis": {
        "acne": 20,
        "redness": 5,
        "pores": 55,
        "texture": 25
      },
      "estimatedMetrics": {
        "oiliness": 4,
        "dryness": 2,
        "redness": 1,
        "acne": 2,
        "barrierComfort": 4
      },
      "summary": "Da hôm nay cải thiện tốt, ít mẩn đỏ, độ ẩm ổn định.",
      "recommendation": "Tiếp tục duy trì routine phục hồi nhẹ nhàng."
    }
    ```

---

### 4. 🏷️ AI Product Scanner (`POST /api/vision/scan`)

Thực hiện nhận dạng văn bản (OCR) bảng thành phần trên nhãn chai mỹ phẩm, ánh xạ sang database và cảnh báo xung đột trực tiếp với routine hiện tại.

*   **URL**: `/api/vision/scan`
*   **Mã nguồn**: [src/app/api/vision/scan/route.ts](file:///e:/SKINWISE/skinwise-app/src/app/api/vision/scan/route.ts)
*   **Payload gửi lên (Body)**:
    ```json
    {
      "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
      "userContext": {
        "morningRoutine": [
          { "id": "prod-1", "name": "Vitamin C Serum", "category": "serum", "ingredients": ["vitamin-c"], "isWaterBased": true, "isSiliconeBased": false }
        ],
        "eveningRoutine": [
          { "id": "prod-2", "name": "Retinol 1% Cream", "category": "moisturizer", "ingredients": ["retinol"], "isWaterBased": false, "isSiliconeBased": true }
        ]
      }
    }
    ```

*   **Phản hồi trả về (Response)**:
    ```json
    {
      "product": {
        "id": "scanned-product",
        "name": "BHA Liquid Exfoliant",
        "brand": "Paula's Choice",
        "price": 0,
        "type": "skincare",
        "category": "exfoliant",
        "skinTypes": ["all"],
        "concerns": [],
        "texture": "water-based",
        "size": "unknown",
        "ingredients": ["bha"],
        "isSiliconeBased": false,
        "isWaterBased": true,
        "shopeeUrl": ""
      },
      "rawDetectedText": "Ingredients: Water, Methylpropanediol, Salicylic Acid 2%, Camellia Oleifera Leaf Extract...",
      "otherActiveIngredients": ["Camellia Oleifera (Green Tea) Extract"],
      "conflicts": {
        "morning": [],
        "evening": [
          {
            "type": "ingredient",
            "severity": "high",
            "reason": "Sử dụng chung BHA (quét) và Retinol (Routine tối) trong cùng một buổi tối dễ gây quá tải và làm tổn thương hàng rào bảo vệ da.",
            "solution": "Hãy chia lịch dùng: BHA buổi sáng/Retinol buổi tối, hoặc dùng xen kẽ các ngày chẵn lẻ.",
            "items": ["BHA Liquid Exfoliant", "Retinol 1% Cream"]
          }
        ]
      }
    }
    ```
