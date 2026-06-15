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
  // Phase 3 Features:
  daysOfWeek?: number[]; // e.g. [1, 3, 5] for Mon, Wed, Fri
  purchaseDate?: string;
  volumeRemaining?: number; // percentage 0-100
  expiryDate?: string;
  userNotes?: string;
  dosage?: string;
  customPrice?: number;
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

export interface WalletAllocation {
  cleanser: number;
  moisturizer: number;
  treatment: number;
  sunscreen: number;
}

export interface UserProfile {
  isGuest: boolean;
  quizStep: number;
  skinType: string;
  concerns: string[];
  budget: string;
  totalBudget?: number; // In VND, e.g. 1500000
  budgetStrategy?: "even" | "serum" | "save";
  allergies: string[];
  quizCompleted: boolean;
  barrier?: string;
  barrierStatus?: "stable" | "redness" | "flaking" | "stinging";
  lifestyle?: string[];
  preference?: string;
  title?: string;
  mainGoal?: string;

  birthYear?: number;
  gender?: string;
  environment?: string;
  makeupFrequency?: string;
  texturePreference?: string;
  activeIngredients?: string[];
  avoidedIngredients?: string[];
  cycleStartDate?: string;
  cycleLength?: number;
}
export interface DiaryLog {
  id: number;
  date: string;
  dayName: string; // T2, T3, T4, T5, T6, T7, CN
  mood: "great" | "okay" | "irritated";
  isPartial?: boolean;        // true = mood-only quick save
  source?: "manual" | "ai";   // how metrics were collected
  metrics: {
    oiliness: number;
    dryness: number;
    redness: number;
    acne: number;
    barrierComfort: number;
    pores?: number;
    texture?: number;
  };

  lifestyle: string[];
  diet?: string[];
  note: string;
  images?: string[];
  sleepHours?: number;
  stressLevel?: number;
  waterIntake?: number;
  aiOriginalMetrics?: {
    oiliness: number;
    dryness: number;
    redness: number;
    acne: number;
    barrierComfort: number;
  };
  userCorrected?: boolean;

  amRoutineCompleted?: boolean;
  pmRoutineCompleted?: boolean;
}
