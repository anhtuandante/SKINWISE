import conflictsData from "@/data/conflicts.json";
import ingredientsData from "@/data/ingredients.json";
import { Product, ConflictWarning, Ingredient } from "@/types";

const rawConflicts = conflictsData as {
  ingredientConflicts: {
    pair: [string, string];
    severity: "high" | "medium" | "low";
    reason: string;
    solution: string;
  }[];
  textureConflicts: {
    pair: [string, string];
    pillingRisk: "high" | "medium" | "low";
    reason: string;
    solution: string;
  }[];
  layeringOrder: string[];
  textureOrder: string[];
};

const allIngredients = (ingredientsData as { ingredients: Ingredient[] }).ingredients;

function getIngredientName(id: string): string {
  const ing = allIngredients.find((i) => i.id === id);
  return ing ? `${ing.nameVi} (${ing.name})` : id;
}

export function checkConflicts(products: Product[]): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const productIngredients: string[] = [];

  products.forEach((p) => {
    p.ingredients.forEach((ing) => {
      if (!productIngredients.includes(ing)) {
        productIngredients.push(ing);
      }
    });
  });

  // Check ingredient conflicts
  rawConflicts.ingredientConflicts.forEach((conflict) => {
    const [a, b] = conflict.pair;
    if (productIngredients.includes(a) && productIngredients.includes(b)) {
      warnings.push({
        type: "ingredient",
        severity: conflict.severity,
        reason: conflict.reason,
        solution: conflict.solution,
        items: [getIngredientName(a), getIngredientName(b)],
      });
    }
  });

  // Check texture conflicts
  const textures = products.map((p) => p.texture);
  rawConflicts.textureConflicts.forEach((conflict) => {
    const [a, b] = conflict.pair;
    const aTextures = textures.filter((t) => t === a);
    const bTextures = textures.filter((t) => t === b);
    const hasBoth = aTextures.length > 0 && bTextures.length > 0;
    const hasDuplicate = a === b && aTextures.length >= 2;

    if (hasBoth || hasDuplicate) {
      const productA = products.find((p) => p.texture === a);
      const productB = products.filter((p) => p.texture === b)[hasDuplicate ? 1 : 0];
      warnings.push({
        type: "texture",
        severity: conflict.pillingRisk,
        reason: conflict.reason,
        solution: conflict.solution,
        items: [productA?.name || a, productB?.name || b].filter(Boolean),
      });
    }
  });

  // Advanced: Silicone-Water Base Pilling Detection (Professional Logic)
  const sorted = getSortedRoutine(products);
  let hasSilicone = false;
  let siliconeProductName = "";

  sorted.forEach((p) => {
    if (p.isSiliconeBased) {
      hasSilicone = true;
      siliconeProductName = p.name;
    } else if (p.isWaterBased && hasSilicone) {
      warnings.push({
        type: "texture",
        severity: "high",
        reason: `Sản phẩm gốc nước (${p.name}) dùng sau sản phẩm gốc silicone (${siliconeProductName}) dễ gây hiện tượng vón cục (pilling).`,
        solution: "Hãy dùng sản phẩm gốc nước trước, hoặc đợi lớp silicone khô hoàn toàn (10-15ph).",
        items: [siliconeProductName, p.name],
      });
    }
  });

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  return warnings.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

export function getSortedRoutine(products: Product[]): Product[] {
  const order = rawConflicts.layeringOrder;
  return [...products].sort((a, b) => {
    const aIndex = order.indexOf(a.category);
    const bIndex = order.indexOf(b.category);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
}

export function getMissingCategories(products: Product[]): string[] {
  const essential = ["cleanser", "moisturizer"];
  const categories: string[] = products.map((p) => p.category);
  return essential.filter((c) => !categories.includes(c));
}
