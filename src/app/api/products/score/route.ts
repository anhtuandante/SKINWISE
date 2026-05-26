import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT } from "../../../../lib/ai/prompts";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.product || !body?.userContext) {
      return new Response(JSON.stringify({ error: "Missing product or userContext" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { product, userContext } = body;

    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        score: z.number().min(0).max(100),
        reason: z.string(),
        highlightIngredient: z.string().optional(),
        warning: z.string().optional(),
      }),
      system: `${SYSTEM_PROMPT}\n\nBạn hãy tính toán độ tương thích giữa sản phẩm và người dùng. 
      Trả về điểm số (%) và một lời giải thích ngắn gọn (tối đa 15 từ). 
      Hãy chú ý đến skinType và concerns của người dùng.`,
      messages: [
        {
          role: "user",
          content: `Sản phẩm: ${JSON.stringify(product)}\nNgười dùng: ${JSON.stringify(userContext)}`,
        },
      ],
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("Score API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
