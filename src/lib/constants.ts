// ——— Labels ——————————————————————————————————————————————

export const SKIN_LABELS: Record<string, string> = {
  oily: "Da dầu",
  dry: "Da khô",
  combination: "Da hỗn hợp",
  normal: "Da thường",
  sensitive: "Da nhạy cảm",
  all: "Mọi loại da",
}

export const CONCERN_LABELS: Record<string, string> = {
  acne: "Mụn",
  pores: "Lỗ chân lông",
  "dark-spots": "Thâm nám",
  aging: "Lão hóa",
  dullness: "Xỉn màu",
  dryness: "Thiếu ẩm",
}

export const BUDGET_LABELS: Record<string, string> = {
  budget: "Dưới 200k",
  affordable: "200–400k",
  "mid-range": "400k–1tr",
  premium: "1–3tr",
  luxury: "Trên 3tr",
}

// ——— Quiz Options (text-only, no emoji) ——————————————

export const SKIN_TYPES = [
  { id: "oily", label: "Da dầu", desc: "Bóng nhờn, lỗ chân lông to" },
  { id: "dry", label: "Da khô", desc: "Căng tức, bong tróc" },
  { id: "combination", label: "Da hỗn hợp", desc: "Vùng T dầu, má khô" },
  { id: "normal", label: "Da thường", desc: "Cân bằng, ít vấn đề" },
  { id: "sensitive", label: "Da nhạy cảm", desc: "Dễ kích ứng, đỏ" },
] as const

export const CONCERNS = [
  { id: "acne", label: "Mụn" },
  { id: "pores", label: "Lỗ chân lông" },
  { id: "dark-spots", label: "Thâm nám" },
  { id: "aging", label: "Lão hóa" },
  { id: "dullness", label: "Xỉn màu" },
  { id: "dryness", label: "Thiếu ẩm" },
] as const

export const BUDGETS = [
  { id: "budget", label: "Dưới 200.000đ", desc: "Drugstore, Việt Nam" },
  { id: "affordable", label: "200 – 400.000đ", desc: "Cocoon, CeraVe, The Ordinary" },
  { id: "mid-range", label: "400.000 – 1.000.000đ", desc: "Klairs, La Roche-Posay" },
  { id: "premium", label: "1 – 3.000.000đ", desc: "Estée Lauder, Shiseido" },
  { id: "luxury", label: "Trên 3.000.000đ", desc: "SK-II, La Mer" },
] as const

// ——— Category Labels ————————————————————————————————

export const CATEGORY_LABELS: Record<string, string> = {
  cleanser: "Sữa rửa mặt",
  toner: "Toner",
  serum: "Serum",
  moisturizer: "Kem dưỡng",
  sunscreen: "Chống nắng",
  "eye-cream": "Kem mắt",
  mask: "Mặt nạ",
  exfoliant: "Tẩy da chết",
  "base-makeup": "Nền",
  lip: "Son",
  eye: "Mắt",
  brow: "Chân mày",
  blush: "Má hồng",
}
