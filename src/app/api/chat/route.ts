import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import conflicts from "@/data/conflicts.json";

export const maxDuration = 60;

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid request: messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { messages, userContext } = body;

    // Validate message content length
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content || typeof lastMessage.content !== 'string' || lastMessage.content.length > 5000) {
      return new Response(JSON.stringify({ error: "Invalid message content or too long (max 5000 chars)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!apiKey) {
      throw new Error("AI_LoadAPIKeyError: Missing GOOGLE_GENERATIVE_AI_API_KEY");
    }

    const conflictRules = JSON.stringify(conflicts);
    const systemInstruction = `${SYSTEM_PROMPT}

    DỮ LIỆU THỰC TẾ (FACT-CHECK RULES):
    ${conflictRules}

    QUY TẮC CỐ VẤN CHUYÊN NGHIỆP:
    1. Tuyệt đối tuân thủ bảng xung đột thành phần trên. 
    2. Nếu người dùng hỏi về Routine hiện tại, đối chiếu Morning/Evening của họ với bảng Layering Order và Texture Order.
    3. Nếu phát hiện xung đột, hãy cảnh báo ngay lập tức với tiêu đề [AI WARNING] và giải thích lý do cụ thể.
    4. Trả lời bằng Tiếng Việt thân thiện, điềm đạm.
    5. Chỉ trả lời các câu hỏi liên quan đến Chăm sóc da (Skincare).
    
    NGỮ CẢNH NGƯỜI DÙNG HIỆN TẠI:
    ${JSON.stringify(userContext)}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    const formattedHistory = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    const latestMessage = messages[messages.length - 1].content;
    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessageStream(latestMessage);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      }
    });
  } catch (error) {
    console.error("API Chat Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
