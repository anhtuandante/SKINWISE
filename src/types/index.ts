export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  type: "skincare" | "makeup";
  category: "cleanser" | "toner" | "serum" | "moisturizer" | "sunscreen" | "exfoliant" | "eye-cream" | "mask" | "base-makeup" | "lip" | "eye" | "brow" | "blush";
  skinTypes: string[];
  concerns: string[];
  texture: string;
  size: string;
  ingredients: string[];
  timeOfDay?: "AM" | "PM" | "both";
  spf?: number;
  phValue?: number;
  isSiliconeBased?: boolean;
  isWaterBased?: boolean;
  shopeeUrl: string;
  image?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  nameVi: string;
  category: string;
  benefits: string[];
  skinTypes: string[] | "all";
  timeOfDay: "AM" | "PM" | "both";
  pregnancy: boolean;
  conflictsWith?: string[];
}

export interface ConflictWarning {
  type: "ingredient" | "texture";
  severity: "high" | "medium" | "low";
  reason: string;
  solution: string;
  items: string[];
}

export interface UserProfile {
  skinType: string;
  concerns: string[];
  budget: string;
  allergies: string;
  quizCompleted: boolean;
  barrier?: string;
  barrierStatus?: "stable" | "redness" | "flaking" | "stinging";
  lifestyle?: string[];
  preference?: string;
  title?: string;
  mainGoal?: string;
  subscriptionPlan?: "free" | "premium" | "ultimate";
  age?: string;
  gender?: string;
  environment?: string;
  makeupFrequency?: string;
  texturePreference?: string;
  activeIngredients?: string[];
  avoidedIngredients?: string[];
  cycleStartDate?: string;
  cycleLength?: number;
}

