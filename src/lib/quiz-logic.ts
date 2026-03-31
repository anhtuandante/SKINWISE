import { supabase, DbProduct } from "@/lib/supabase"
import { Product } from "@/types"

const BUDGET_RANGES: Record<string, [number, number]> = {
  budget: [0, 200000],
  affordable: [0, 400000],
  "mid-range": [0, 1000000],
  premium: [0, 3000000],
  luxury: [0, Infinity],
}

// Convert DB snake_case structure to App camelCase structure
function mapDbProductToApp(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price,
    type: p.type,
    category: p.category as Product["category"],
    skinTypes: p.skin_types,
    concerns: p.concerns,
    texture: p.texture,
    size: p.size,
    timeOfDay: p.time_of_day,
    spf: p.spf || undefined,
    phValue: p.ph_value || undefined,
    isSiliconeBased: p.is_silicone_based,
    isWaterBased: p.is_water_based,
    shopeeUrl: p.shopee_url,
    image: p.image || undefined,
    ingredients: [], // Optionally fetch product_ingredients if needed later, but the app usually relies on conflicts logic fetching this or it's not strictly required in the list view depending on implementation. Let's just default to empty array or fetch them if needed. 
  }
}

export async function filterProducts(
  skinType: string,
  concerns: string[],
  budget: string,
  type?: "skincare" | "makeup"
): Promise<Product[]> {
  const [, maxBudget] = BUDGET_RANGES[budget] || [0, Infinity]

  // Fetch all products from Supabase
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('*');

  if (error || !dbProducts) {
    console.error("Error fetching products from DB:", error);
    return [];
  }

  const products = (dbProducts as DbProduct[]).map(mapDbProductToApp);

  return products
    .filter((product) => {
      const skinTypeMatch =
        product.skinTypes.includes(skinType) ||
        product.skinTypes.includes("all")

      const budgetMatch = product.price <= maxBudget

      const typeMatch = !type || product.type === type

      return skinTypeMatch && budgetMatch && typeMatch
    })
    .sort((a, b) => {
      const aScore = concerns.filter((c) => a.concerns.includes(c)).length
      const bScore = concerns.filter((c) => b.concerns.includes(c)).length
      return bScore - aScore
    })
}

export function getProductsByCategory(products: Product[]) {
  const grouped: Record<string, Product[]> = {}

  products.forEach((product) => {
    if (!grouped[product.category]) {
      grouped[product.category] = []
    }
    grouped[product.category].push(product)
  })

  return grouped
}

export function formatPrice(price: number): string {
  if (price >= 1000000) {
    const m = price / 1000000
    return m % 1 === 0 ? `${m}tr` : `${m.toFixed(1)}tr`
  }
  return `${(price / 1000).toFixed(0)}k`
}

export function formatPriceFull(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ"
}

export function calculateTotal(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.price, 0)
}

export function getBudgetMax(budget: string): number {
  return BUDGET_RANGES[budget]?.[1] || Infinity
}
