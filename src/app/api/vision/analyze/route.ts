import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 60;

const quizSchema = z.object({
  skinType: z.enum(["oily", "dry", "combination", "normal"]),
  concerns: z.array(z.string()),
  analysis: z.object({
    acne: z.number().min(0).max(100),
    redness: z.number().min(0).max(100),
    pores: z.number().min(0).max(100),
    texture: z.number().min(0).max(100),
  }),
  summary: z.string(),
  recommendation: z.string(),
});

const dailyCheckinSchema = z.object({
  skinType: z.enum(["oily", "dry", "combination", "normal"]),
  concerns: z.array(z.string()),
  analysis: z.object({
    acne: z.number().min(0).max(100),
    redness: z.number().min(0).max(100),
    pores: z.number().min(0).max(100),
    texture: z.number().min(0).max(100),
  }),
  estimatedMetrics: z.object({
    oiliness: z.number().min(1).max(5),
    dryness: z.number().min(1).max(5),
    redness: z.number().min(1).max(5),
    acne: z.number().min(1).max(5),
    barrierComfort: z.number().min(1).max(5),
  }),
  summary: z.string(),
  recommendation: z.string(),
});

const QUIZ_SYSTEM_PROMPT = `Bạn là Chuyên gia Da liễu AI của SkinWise. 
Hãy phân tích ảnh chụp khuôn mặt của người dùng để xác định loại da và các vấn đề về da. 
Chỉ trả về dữ liệu JSON chính xác. 
Phát hiện các vấn đề: Mụn (Acne), Mẩn đỏ (Redness), Lỗ chân lông (Pores), Kết cấu da (Texture).
Hãy cực kỳ thận trọng và chuyên nghiệp.`;

const DAILY_CHECKIN_PROMPT = `Bạn là Chuyên gia Da liễu AI của SkinWise, đang thực hiện check-in da hàng ngày.
Hãy phân tích ảnh selfie của người dùng và đánh giá trạng thái da HÔM NAY.

Trả về:
1. skinType, concerns, analysis (0-100) — như bình thường
2. estimatedMetrics — ước lượng 5 chỉ số da trên thang 1-5:
   - oiliness (1=rất ít dầu, 5=rất nhiều dầu)
   - dryness (1=không khô, 5=rất khô căng)
   - redness (1=không đỏ, 5=đỏ rát nghiêm trọng)
   - acne (1=không mụn, 5=mụn rất nhiều/viêm)
   - barrierComfort (1=rất khó chịu/kích ứng, 5=da rất khỏe mạnh dễ chịu)
3. summary — nhận xét ngắn gọn tình trạng da hôm nay bằng tiếng Việt
4. recommendation — lời khuyên cụ thể cho hôm nay bằng tiếng Việt

Hãy cực kỳ thận trọng, chuyên nghiệp, và chính xác.`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.image || typeof body.image !== 'string') {
      return new Response(JSON.stringify({ error: "Missing or invalid image data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { image, mode = "quiz" } = body;

    // Validate base64 size (~10MB limit for raw base64)
    if (image.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "Image too large. Max 10MB." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const isDaily = mode === "dailyCheckin";

    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: isDaily ? dailyCheckinSchema : quizSchema,
      system: isDaily ? DAILY_CHECKIN_PROMPT : QUIZ_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: isDaily
                ? "Hãy check-in trạng thái da hôm nay của tôi từ bức ảnh selfie này."
                : "Hãy phân tích tình trạng da của tôi từ bức ảnh này.",
            },
            {
              type: "image",
              image: image,
            },
          ],
        },
      ],
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("Vision API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
