import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DbIngredient = {
  id: string;
  name: string;
  name_vi: string;
  category: string;
  benefits: string[];
  skin_types: string[];
  time_of_day: "AM" | "PM" | "both";
  pregnancy: boolean;
  conflicts_with: string[];
};

export type DbProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  type: "skincare" | "makeup";
  category: string;
  skin_types: string[];
  concerns: string[];
  texture: string;
  size: string;
  time_of_day?: "AM" | "PM" | "both";
  spf?: number;
  ph_value?: number;
  is_silicone_based: boolean;
  is_water_based: boolean;
  shopee_url: string;
  image?: string;
};
