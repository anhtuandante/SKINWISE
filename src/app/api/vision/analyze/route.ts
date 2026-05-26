import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.image || typeof body.image !== 'string') {
      return new Response(JSON.stringify({ error: "Missing or invalid image data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { image } = body;

    // Validate base64 size (~10MB limit for raw base64)
    if (image.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "Image too large. Max 10MB." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
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
      }),
      system: `Bạn là Chuyên gia Da liễu AI của SkinWise. 
      Hãy phân tích ảnh chụp khuôn mặt của người dùng để xác định loại da và các vấn đề về da. 
      Chỉ trả về dữ liệu JSON chính xác. 
      Phát hiện các vấn đề: Mụn (Acne), Mẩn đỏ (Redness), Lỗ chân lông (Pores), Kết cấu da (Texture).
      Hãy cực kỳ thận trọng và chuyên nghiệp.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Hãy phân tích tình trạng da của tôi từ bức ảnh này.",
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
