import { Product, UserProfile } from "@/types"
import { getCyclePhase } from "../utils/cyclePredictor"

export const BUDGET_RANGES: Record<string, [number, number]> = {
  budget: [0, 200000],
  affordable: [0, 400000],
  "mid-range": [0, 1000000],
  premium: [0, 3000000],
  luxury: [0, Infinity],
}

export interface MatchResult {
  score: number; // 0 to 100
  matchDetails: {
    skinTypeMatch: boolean;
    concernsMatchCount: number;
    budgetMatch: boolean;
    textureMatch: boolean;
    activesMatch: boolean;
  };
  reasons: string[];
}

export function calculateMatchScore(product: Product, profile: UserProfile): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Skin Type & Avoided Ingredients (30 points)
  const isSkinTypeMatch = product.skinTypes.includes(profile.skinType) || product.skinTypes.includes("all");
  if (isSkinTypeMatch) {
    score += 20;
  }
  
  // Check avoided ingredients
  const hasAvoided = profile.avoidedIngredients?.some(ing => {
    if (ing === "alcohol" && product.ingredients.some(i => i.toLowerCase().includes("alcohol") && !i.toLowerCase().includes("cetearyl"))) return true;
    if (ing === "fragrance" && product.ingredients.some(i => i.toLowerCase().includes("fragrance") || i.toLowerCase().includes("parfum"))) return true;
    if (ing === "silicone" && product.ingredients.some(i => i.toLowerCase().includes("dimethicone") || i.toLowerCase().includes("siloxane"))) return true;
    return false;
  });

  if (!hasAvoided) {
    score += 10;
    if (isSkinTypeMatch) {
      const skinLabel = profile.skinType === 'oily' ? 'da dầu' : profile.skinType === 'dry' ? 'da khô' : profile.skinType === 'sensitive' ? 'da nhạy cảm' : profile.skinType === 'combination' ? 'da hỗn hợp' : 'da của bạn'
      reasons.push(`Công thức sinh học cực kỳ an toàn cho ${skinLabel} và tuyệt đối không chứa thành phần bạn muốn tránh.`);
    }
  } else {
    reasons.push(`Lưu ý: Có chứa thành phần bạn muốn tránh.`);
  }

  // 2. Concerns Match (25 points)
  const userConcerns = profile.concerns || [];
  let concernsMatchCount = 0;
  
  if (userConcerns.length > 0) {
    const matchedConcerns = userConcerns.filter((c) => product.concerns.includes(c));
    concernsMatchCount = matchedConcerns.length;
    
    if (concernsMatchCount > 0) {
      const concernScore = (concernsMatchCount / userConcerns.length) * 25;
      score += concernScore;
      const concernNames: Record<string, string> = {
        acne: "giảm mụn",
        pores: "thu nhỏ lỗ chân lông",
        "dark-spots": "mờ thâm nám",
        aging: "chống lão hóa",
        dullness: "cải thiện da xỉn màu",
        dryness: "cấp ẩm sâu"
      };
      const translated = matchedConcerns.map(c => concernNames[c] || c).join(' và ');
      reasons.push(`Thành phần đánh trúng đích giúp ${translated} (đúng với mong muốn hiện tại của bạn).`);
    }
  } else {
    score += 15; 
  }

  // 3. Environment & Texture (20 points)
  let textureMatch = false;
  let textureScore = 0;

  const pref = profile.texturePreference;
  const isGel = product.texture.toLowerCase().includes("gel") || product.texture.toLowerCase().includes("water") || product.texture.toLowerCase().includes("liquid");
  const isCream = product.texture.toLowerCase().includes("cream") || product.texture.toLowerCase().includes("lotion");

  if (pref === "gel" && isGel) { textureScore += 10; textureMatch = true; }
  else if (pref === "cream" && isCream) { textureScore += 10; textureMatch = true; }
  else if (pref === "any") { textureScore += 10; textureMatch = true; }

  // Environment logic
  const env = profile.environment;
  if (env === "hot-humid" && isGel) {
    textureScore += 10;
    reasons.push(`Kết cấu mỏng nhẹ, rất phù hợp với môi trường nóng ẩm, không gây bí da.`);
  } else if ((env === "ac-room" || env === "dry-cold") && isCream) {
    textureScore += 10;
    reasons.push(`Kết cấu dưỡng ẩm sâu, lý tưởng để chống khô da khi ngồi máy lạnh hoặc trời hanh khô.`);
  } else {
    textureScore += 5; // Partial
    if (textureMatch && pref !== "any") {
      reasons.push(`Đúng với sở thích kết cấu ${pref === 'gel' ? 'mỏng nhẹ' : 'đặc'} của bạn.`);
    }
  }
  score += textureScore;

  // 4. Budget Match (15 points)
  const [, maxBudget] = BUDGET_RANGES[profile.budget] || [0, Infinity];
  const isBudgetMatch = product.price <= maxBudget;
  
  if (isBudgetMatch) {
    score += 15;
    reasons.push(`Nằm trong mức ngân sách của bạn.`);
  } else {
    reasons.push(`Hơi vượt mức ngân sách một chút, nhưng chất lượng đáng cân nhắc.`);
  }

  // 5. Active Ingredients (10 points)
  let activesMatch = true;
  const strongActives = ["retinol", "tretinoin", "bha", "aha", "salicylic acid", "glycolic acid"];
  const hasStrongActives = product.ingredients.some(i => strongActives.some(a => i.toLowerCase().includes(a)));
  
  // Barrier is considered weakened if any of the 3 sensitive statuses is selected
  const barrierIsWeak = profile.barrierStatus === "stinging" || profile.barrierStatus === "flaking" || profile.barrierStatus === "redness";
  
  if (hasStrongActives) {
    if (profile.activeIngredients?.includes("none") || barrierIsWeak) {
      activesMatch = false;
      score -= 10; // Penalty
      if (barrierIsWeak) {
        reasons.push(`⚠️ Cảnh báo: Chứa hoạt chất mạnh (AHA/BHA/Retinol). Vui lòng thận trọng khi hàng rào da đang yếu để tránh bùng viêm.`);
      } else {
        reasons.push(`⚠️ Lưu ý: Có chứa hoạt chất mạnh, cần test vùng nhỏ trên da trước khi dùng vì da bạn chưa quen.`);
      }
    } else {
      score += 10;
      reasons.push(`Chứa hoạt chất đặc trị (AHA/BHA/Retinol) phù hợp với mức độ chịu đựng của da bạn, giúp đẩy nhanh hiệu quả.`);
    }
  } else {
    score += 10;
  }

  // 6. Menstrual Cycle Phase Adjustment (Model C)
  const cycle = getCyclePhase(profile.cycleStartDate, profile.cycleLength || 28);
  if (cycle) {
    const ingredientsJoined = product.ingredients.join(" ").toLowerCase();
    
    if (cycle.phase === "luteal") {
      const isOilControl = ingredientsJoined.includes("salicylic") || 
                           ingredientsJoined.includes("bha") || 
                           ingredientsJoined.includes("niacinamide") || 
                           ingredientsJoined.includes("zinc") || 
                           ingredientsJoined.includes("clay") || 
                           ingredientsJoined.includes("kaolin") || 
                           ingredientsJoined.includes("tea tree") ||
                           ingredientsJoined.includes("tràm trà");
      
      const isLightTexture = product.texture.toLowerCase().includes("gel") || 
                             product.texture.toLowerCase().includes("liquid") || 
                             product.texture.toLowerCase().includes("water");
      
      if (isOilControl) {
        score += 8;
        reasons.push("Kiểm soát dầu thừa chủ động cho pha hoàng thể (luteal) sắp đến.");
      }
      if (isLightTexture) {
        score += 4;
      }
    } else if (cycle.phase === "menstrual") {
      const isSoothing = ingredientsJoined.includes("panthenol") || 
                         ingredientsJoined.includes("b5") || 
                         ingredientsJoined.includes("centella") || 
                         ingredientsJoined.includes("rau má") || 
                         ingredientsJoined.includes("ceramide") || 
                         ingredientsJoined.includes("hyaluronic") || 
                         ingredientsJoined.includes("allantoin") ||
                         ingredientsJoined.includes("lành tính");
                         
      const isAggressiveTreatment = ingredientsJoined.includes("retinol") || 
                                   ingredientsJoined.includes("tretinoin") || 
                                   ingredientsJoined.includes("glycolic") || 
                                   ingredientsJoined.includes("peel");

      if (isSoothing) {
        score += 8;
        reasons.push("Cấp ẩm làm dịu sâu cho làn da nhạy cảm trong những ngày đèn đỏ.");
      }
      if (isAggressiveTreatment) {
        score -= 10; // Penalty during menstruation
        reasons.push("Hạn chế hoạt chất mạnh trong pha hành kinh do da đang mỏng yếu.");
      }
    }
  }

  // Round score to nearest integer
  score = Math.min(100, Math.max(0, Math.round(score)));

  // Fallback reason if none
  if (reasons.length === 0) {
    reasons.push("Sản phẩm cơ bản, lành tính.");
  }

  return {
    score,
    matchDetails: {
      skinTypeMatch: isSkinTypeMatch,
      concernsMatchCount,
      budgetMatch: isBudgetMatch,
      textureMatch,
      activesMatch
    },
    reasons
  };
}
