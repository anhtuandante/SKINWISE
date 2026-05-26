import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { checkConflicts } from "@/lib/conflict-checker";
import { Product } from "@/types";
import ingredientsData from "@/data/ingredients.json";

export const maxDuration = 60;

const KNOWN_INGREDIENT_IDS = ingredientsData.ingredients.map((i) => i.id);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.image || typeof body.image !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid image data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { image, userContext } = body;

    // Validate base64 size (~10MB limit for raw base64)
    if (image.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "Image too large. Max 10MB." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call Gemini to analyze the product label/ingredients image
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        productName: z.string().describe("Tên sản phẩm được nhận diện (nếu có)"),
        brand: z.string().describe("Thương hiệu sản phẩm (nếu có)"),
        category: z.enum([
          "cleanser",
          "toner",
          "serum",
          "moisturizer",
          "sunscreen",
          "exfoliant",
          "eye-cream",
          "mask",
          "base-makeup",
          "lip",
          "eye",
          "brow",
          "blush",
        ]).describe("Phân loại danh mục mỹ phẩm"),
        detectedIngredientsText: z.string().describe("Đoạn văn bản thô chứa bảng thành phần đọc được từ ảnh"),
        mappedIngredientIds: z.array(z.string()).describe("Mảng chứa các ID thành phần trùng khớp với KNOWN_INGREDIENT_IDS"),
        otherActiveIngredients: z.array(z.string()).describe("Các hoạt chất chính khác được phát hiện nhưng không nằm trong KNOWN_INGREDIENT_IDS"),
        isWaterBased: z.boolean().describe("true nếu nước (Water/Aqua) đứng đầu bảng thành phần và không có silicone đứng đầu"),
        isSiliconeBased: z.boolean().describe("true nếu có các thành phần silicone (như Dimethicone, Cyclomethicone, Cyclopentasiloxane) trong 5 thành phần đầu tiên"),
      }),
      system: `Bạn là Trợ lý phân tích thành phần mỹ phẩm của SkinWise.
      Nhiệm vụ của bạn là đọc bảng thành phần từ hình ảnh nhãn sản phẩm được cung cấp (OCR), phân loại sản phẩm, và ánh xạ các hoạt chất chính sang danh sách ID thành phần được hệ thống hỗ trợ dưới đây.
      
      DANH SÁCH ID THÀNH PHẦN HỆ THỐNG HỖ TRỢ (KNOWN_INGREDIENT_IDS):
      ${JSON.stringify(KNOWN_INGREDIENT_IDS)}
      
      HÃY CHỈ ÁNH XẠ đúng các ID có trong danh sách trên vào mảng mappedIngredientIds.
      Ví dụ: Nếu thấy "Salicylic Acid" hoặc "BHA", ánh xạ thành "bha". Nếu thấy "Niacinamide", ánh xạ thành "niacinamide".
      Nếu phát hiện các hoạt chất nổi tiếng khác (như Peptides, Panthenol, Adenosine, v.v.) không có trong danh sách, hãy đưa vào otherActiveIngredients.
      
      Trả về kết quả JSON chính xác theo cấu trúc schema.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Hãy phân tích bảng thành phần và thông tin sản phẩm từ bức ảnh nhãn chai này.",
            },
            {
              type: "image",
              image: image,
            },
          ],
        },
      ],
    });

    const parsedData = result.object;

    // Construct a temporary Product object from the scanned results
    const scannedProduct: Product = {
      id: "scanned-product",
      name: parsedData.productName || "Sản phẩm được quét",
      brand: parsedData.brand || "Chưa rõ",
      price: 0,
      type: ["base-makeup", "lip", "eye", "brow", "blush"].includes(parsedData.category)
        ? "makeup"
        : "skincare",
      category: parsedData.category,
      skinTypes: ["all"],
      concerns: [],
      texture: parsedData.isWaterBased
        ? "water-based"
        : parsedData.isSiliconeBased
        ? "silicone-based"
        : "cream",
      size: "unknown",
      ingredients: parsedData.mappedIngredientIds,
      isSiliconeBased: parsedData.isSiliconeBased,
      isWaterBased: parsedData.isWaterBased,
      shopeeUrl: "",
    };

    // Calculate conflicts against user's morning and evening routines if provided
    const morningRoutine = userContext?.morningRoutine || [];
    const eveningRoutine = userContext?.eveningRoutine || [];

    const morningConflicts = checkConflicts([...morningRoutine, scannedProduct]);
    const eveningConflicts = checkConflicts([...eveningRoutine, scannedProduct]);

    return Response.json({
      product: scannedProduct,
      rawDetectedText: parsedData.detectedIngredientsText,
      otherActiveIngredients: parsedData.otherActiveIngredients,
      conflicts: {
        morning: morningConflicts,
        evening: eveningConflicts,
      },
    });
  } catch (error) {
    console.error("Scan API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
