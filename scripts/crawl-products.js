const { GoogleGenAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY in .env.local");
  process.exit(1);
}

// Initialize the Gemini API client
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(apiKey);

async function crawlAndEnrichProducts() {
  console.log("Starting Product Crawling & AI Enrichment pipeline...");

  try {
    const productsPath = path.join(__dirname, "../src/data/products.json");
    const ingredientsPath = path.join(__dirname, "../src/data/ingredients.json");

    const productsFile = fs.readFileSync(productsPath, "utf8");
    const productsJson = JSON.parse(productsFile);
    const existingProducts = productsJson.products;

    const ingredientsFile = fs.readFileSync(ingredientsPath, "utf8");
    const ingredientsJson = JSON.parse(ingredientsFile);
    const validIngredientIds = ingredientsJson.ingredients.map(i => i.id);

    console.log(`Current product count: ${existingProducts.length}`);
    console.log(`Available ingredient IDs for referential integrity check: ${validIngredientIds.length}`);

    // If we already have 150+ products, we don't need to add more. Let's check:
    if (existingProducts.length >= 150) {
      console.log("Database already has 150+ products. Skipping AI generation.");
      return;
    }

    // List of brands to generate products for
    const targetBrands = [
      "La Roche-Posay", "CeraVe", "Cocoon", "The Ordinary", "Paula's Choice", 
      "Obagi", "Vichy", "Anessa", "L'Oreal", "Bioderma", "Klairs", "Some By Mi",
      "Skin1004", "Cosrx", "Hada Labo", "Eucerin", "Innisfree", "Neutrogena"
    ];

    const prompt = `
      You are a skincare database expert. I need you to generate additional popular Vietnamese skincare and makeup products.
      Each product MUST strictly match the following TypeScript Schema structure:
      
      interface Product {
        id: string; // unique lowercase-kebab-case id, e.g. "cerave-hydrating-cleanser"
        name: string; // Full official product name
        brand: string; // Brand name
        price: number; // Price in VNĐ (integer, e.g. 350000)
        type: "skincare" | "makeup";
        category: "cleanser" | "toner" | "serum" | "moisturizer" | "sunscreen" | "exfoliant" | "mask" | "base-makeup" | "lip" | "eye" | "brow";
        skinTypes: ("oily" | "dry" | "combination" | "normal" | "sensitive" | "all" | "acne-prone")[];
        concerns: ("acne" | "pores" | "dark-spots" | "aging" | "dullness" | "dryness")[];
        texture: string; // gel, cream, liquid, serum, clay, balm, etc.
        size: string; // ml or g, e.g. "150ml", "50g"
        timeOfDay?: "AM" | "PM" | "both";
        spf?: number; // only if sunscreen or makeup with SPF, integer
        phValue?: number; // optional, e.g. 5.5
        isSiliconeBased: boolean;
        isWaterBased: boolean;
        shopeeUrl: string; // Shopee search URL, e.g., "https://shopee.vn/search?keyword=..."
        image: string; // simulated local image path, e.g., "/images/products/{id}.jpg"
        ingredients: string[]; // MUST ONLY contain items from this list: [${validIngredientIds.join(", ")}]
      }

      Generate 55 new, distinct popular skincare/makeup products from brands: ${targetBrands.join(", ")}.
      Make sure to populate correct price ranges in VNĐ (e.g. 150000 to 1200000).
      Ensure the "ingredients" array ONLY contains values from the allowed list: ${JSON.stringify(validIngredientIds)}. Do not add other ingredients that are not in the list.
      Ensure the output is ONLY a valid JSON array of products. Do not include markdown code block formatting or conversational text.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown formatting if Gemini included it
    const cleanJsonText = text.replace(/^```json/, "").replace(/```$/, "").trim();
    const newProducts = JSON.parse(cleanJsonText);

    if (Array.isArray(newProducts)) {
      console.log(`Generated ${newProducts.length} new products from AI enrichment.`);
      
      // Filter out duplicates and invalid items
      const uniqueNewProducts = newProducts.filter(newP => {
        const isDuplicate = existingProducts.some(p => p.id === newP.id);
        const hasValidIngredients = newP.ingredients.every(ingId => validIngredientIds.includes(ingId));
        return !isDuplicate && hasValidIngredients;
      });

      console.log(`Staging ${uniqueNewProducts.length} validated new products to append.`);

      const mergedProducts = [...existingProducts, ...uniqueNewProducts];
      
      productsJson.products = mergedProducts;
      productsJson.metadata.totalProducts = mergedProducts.length;
      productsJson.metadata.note = `Danh sách ${mergedProducts.length} sản phẩm thực tế hot nhất tại thị trường Việt Nam`;

      fs.writeFileSync(productsPath, JSON.stringify(productsJson, null, 2), "utf8");
      console.log(`Successfully updated products.json! Total products: ${mergedProducts.length} 🎉`);
    } else {
      console.error("AI did not return a valid array of products.");
    }
  } catch (err) {
    console.error("Failed to enrich products dataset:", err);
  }
}

crawlAndEnrichProducts();
