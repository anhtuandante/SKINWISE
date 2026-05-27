import { supabase, DbProduct } from "@/lib/supabase"
import { Product, UserProfile } from "@/types"
import productsLocal from "@/data/products.json"
import { calculateMatchScore } from "./recommendation-engine"
import { checkConflicts, getSortedRoutine } from "./conflict-checker"

interface DbProductWithIngredients extends DbProduct {
  product_ingredients?: { ingredient_id: string }[];
}

// Convert DB snake_case structure to App camelCase structure
function mapDbProductToApp(p: DbProductWithIngredients): Product {
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
    ingredients: p.product_ingredients?.map((pi) => pi.ingredient_id) || [],
  }
}

export async function getAllProducts(): Promise<Product[]> {
  let products: Product[] = [];
  try {
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('*, product_ingredients(ingredient_id)');

    if (!error && dbProducts && dbProducts.length > 0) {
      products = (dbProducts as DbProductWithIngredients[]).map(mapDbProductToApp);
    } else {
      // Fallback to local products.json if DB is empty/fails
      products = (productsLocal.products as unknown) as Product[];
    }
  } catch (err) {
    console.error("Error fetching products from DB, falling back to local:", err);
    products = (productsLocal.products as unknown) as Product[];
  }
  return products;
}

export async function filterProducts(
  profile: UserProfile,
  type?: "skincare" | "makeup"
): Promise<Product[]> {
  const products = await getAllProducts()

  // Calculate scores for all products
  const scoredProducts = products.map((product) => {
    return {
      product,
      match: calculateMatchScore(product, profile)
    }
  })

  return scoredProducts
    .filter(({ product }) => {
      // Only hard-filter by product type if specified
      return !type || product.type === type
    })
    .sort((a, b) => b.match.score - a.match.score)
    .map(p => p.product)
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

export function calculateTotal(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.price, 0)
}

export async function buildInitialRoutine(
  profile: UserProfile
): Promise<{ morning: Product[]; evening: Product[] }> {
  // Fetch products (both skincare and makeup)
  const products = await filterProducts(profile)

  const morning: Product[] = []
  const evening: Product[] = []

  const grouped = getProductsByCategory(products)

  // Non-conflicting selector helper
  const getBestNonConflicting = (category: string, currentRoutine: Product[]): Product | undefined => {
    const list = grouped[category] || []
    for (const prod of list) {
      const conflicts = checkConflicts([...currentRoutine, prod])
      const hasHighConflict = conflicts.some((c) => c.severity === "high")
      if (!hasHighConflict) {
        return prod
      }
    }
    return list[0] // Fallback to best match if all conflict
  }

  const barrierIsWeak = profile.barrierStatus === "stinging" || 
                        profile.barrierStatus === "redness" || 
                        profile.barrierStatus === "flaking"

  // Force minimal routine if barrier is weak to ensure skin safety
  const preference = barrierIsWeak ? "minimal" : (profile.preference || "balanced")

  // --- Step 1: Cleanser (Always in both AM and PM) ---
  const cleanser = getBestNonConflicting("cleanser", [])
  if (cleanser) {
    morning.push(cleanser)
    evening.push(cleanser)
  }

  // --- Step 2: Toner / Serum / Exfoliant depending on routine style ---
  if (preference === "minimal") {
    // AM: Cleanser -> Moisturizer -> Sunscreen
    // PM: Cleanser -> Moisturizer
    // If barrier is weak AND they have acne/sensitivity concern, we can add a soothing serum
    const needsSoothingSerum = barrierIsWeak && 
      (profile.concerns.includes("acne") || profile.concerns.includes("sensitivity") || profile.concerns.includes("dryness"))
    
    if (needsSoothingSerum) {
      const amSerum = getBestNonConflicting("serum", morning)
      if (amSerum) morning.push(amSerum)
      
      const pmSerum = getBestNonConflicting("serum", evening)
      if (pmSerum) evening.push(pmSerum)
    }
  } else if (preference === "balanced") {
    // AM: Cleanser -> (Toner OR Serum) -> Moisturizer -> Sunscreen
    // PM: Cleanser -> (Toner OR Serum) -> Moisturizer
    const wantsToner = profile.skinType === "oily" || profile.skinType === "combination" || 
                       profile.concerns.includes("pores")
    
    if (wantsToner) {
      const amToner = getBestNonConflicting("toner", morning)
      if (amToner) morning.push(amToner)
      
      const pmToner = getBestNonConflicting("toner", evening)
      if (pmToner) evening.push(pmToner)
    } else {
      const amSerum = getBestNonConflicting("serum", morning)
      if (amSerum) morning.push(amSerum)
      
      const pmSerum = getBestNonConflicting("serum", evening)
      if (pmSerum) evening.push(pmSerum)
    }
  } else { // preference === "complete"
    // AM: Cleanser -> Toner -> Serum -> Moisturizer -> Sunscreen
    // PM: Cleanser -> Toner -> Serum -> Exfoliant -> Moisturizer
    const amToner = getBestNonConflicting("toner", morning)
    if (amToner) morning.push(amToner)
    const pmToner = getBestNonConflicting("toner", evening)
    if (pmToner) evening.push(pmToner)

    const amSerum = getBestNonConflicting("serum", morning)
    if (amSerum) morning.push(amSerum)
    const pmSerum = getBestNonConflicting("serum", evening)
    if (pmSerum) evening.push(pmSerum)

    // Exfoliant PM (needs acne/pores/dullness, barrier is healthy)
    const needsExfoliant = profile.concerns.includes("acne") || 
                           profile.concerns.includes("pores") || 
                           profile.concerns.includes("dullness")
    if (needsExfoliant) {
      const exfoliant = getBestNonConflicting("exfoliant", evening)
      if (exfoliant) {
        evening.push(exfoliant)
      }
    }
  }

  // --- Step 3: Moisturizer (Always in both AM and PM) ---
  const moisturizer = getBestNonConflicting("moisturizer", morning)
  if (moisturizer) {
    morning.push(moisturizer)
  }
  const pmMoisturizer = getBestNonConflicting("moisturizer", evening)
  if (pmMoisturizer) {
    evening.push(pmMoisturizer)
  }

  // --- Step 4: Sunscreen (Always AM) ---
  const sunscreen = getBestNonConflicting("sunscreen", morning)
  if (sunscreen) {
    morning.push(sunscreen)
  }

  // --- Step 5: Makeup (Optional based on frequency) ---
  const makeupFrequency = profile.makeupFrequency || "occasionally"
  if (makeupFrequency !== "rarely") {
    // 5.1 Base Makeup
    const baseMakeup = getBestNonConflicting("base-makeup", morning)
    if (baseMakeup) morning.push(baseMakeup)

    // 5.2 Lip Makeup
    const lipMakeup = getBestNonConflicting("lip", morning)
    if (lipMakeup) morning.push(lipMakeup)

    // 5.3 Eyebrow / Eye Makeup
    if (makeupFrequency === "daily") {
      const browMakeup = getBestNonConflicting("brow", morning) || getBestNonConflicting("eye", morning)
      if (browMakeup) morning.push(browMakeup)
    }
  }

  // --- Knapsack Optimization Solver (Model D) ---
  const BUDGET_CAPS: Record<string, number> = {
    budget: 650000,      // Max total for student budget
    affordable: 1300000,  // Max total for affordable
    "mid-range": 3500000, // Max total for mid-range
    premium: 9000000,
    luxury: Infinity
  }
  const cap = BUDGET_CAPS[profile.budget] || Infinity

  // Function to calculate unique products in the routines
  const getUniqueProducts = (m: Product[], e: Product[]): Product[] => {
    return Array.from(new Map([...m, ...e].map(p => [p.id, p])).values())
  }

  let uniqueProducts = getUniqueProducts(morning, evening)
  let totalCost = calculateTotal(uniqueProducts)

  // Iteratively swap products to cheaper non-conflicting options if over budget
  let maxIterations = 15
  while (totalCost > cap && maxIterations > 0) {
    maxIterations--
    interface SwapInfo {
      timeOfDay: "AM" | "PM"
      index: number
      newProduct: Product
      savings: number
      scoreLoss: number
      ratio: number
    }

    let bestSwap: SwapInfo | null = null

    // Helper to evaluate a potential swap
    const evaluateSwap = (
      routineList: Product[],
      timeOfDay: "AM" | "PM",
      productIdx: number
    ): SwapInfo | null => {
      const currentProd = routineList[productIdx]
      const category = currentProd.category
      const candidates = grouped[category] || []
      let localBest: SwapInfo | null = null

      candidates.forEach((cand) => {
        // Must be cheaper
        if (cand.price >= currentProd.price) return

        // Must not introduce high conflicts in the respective routine
        const tempRoutine = [...routineList]
        tempRoutine[productIdx] = cand
        const conflicts = checkConflicts(tempRoutine)
        if (conflicts.some(c => c.severity === "high")) return

        // Calculate score delta
        const currentScore = calculateMatchScore(currentProd, profile).score
        const candScore = calculateMatchScore(cand, profile).score
        const scoreLoss = currentScore - candScore
        const savings = currentProd.price - cand.price

        if (savings <= 0) return

        // We want to minimize (scoreLoss / savings)
        const ratio = scoreLoss / savings

        if (!localBest || ratio < localBest.ratio) {
          localBest = {
            timeOfDay,
            index: productIdx,
            newProduct: cand,
            savings,
            scoreLoss,
            ratio
          }
        }
      })
      return localBest
    }

    // Evaluate all slots in morning
    for (let i = 0; i < morning.length; i++) {
      const swap = evaluateSwap(morning, "AM", i)
      if (swap && (!bestSwap || swap.ratio < bestSwap.ratio)) {
        bestSwap = swap
      }
    }
    // Evaluate all slots in evening
    for (let i = 0; i < evening.length; i++) {
      const swap = evaluateSwap(evening, "PM", i)
      if (swap && (!bestSwap || swap.ratio < bestSwap.ratio)) {
        bestSwap = swap
      }
    }

    // Apply the best swap found
    if (bestSwap) {
      if (bestSwap.timeOfDay === "AM") {
        morning[bestSwap.index] = bestSwap.newProduct
      } else {
        evening[bestSwap.index] = bestSwap.newProduct
      }
      // Re-evaluate unique products and total cost
      uniqueProducts = getUniqueProducts(morning, evening)
      totalCost = calculateTotal(uniqueProducts)
    } else {
      // No more valid cheaper swaps found
      break
    }
  }

  // Sort routines by layering order to ensure correct steps
  const sortedMorning = getSortedRoutine(morning)
  const sortedEvening = getSortedRoutine(evening)

  return {
    morning: sortedMorning.slice(0, 8),
    evening: sortedEvening.slice(0, 8)
  }
}
