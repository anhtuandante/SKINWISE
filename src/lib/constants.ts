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
  sensitivity: "Nhạy cảm",
  oiliness: "Dầu thừa",
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
  { id: "sensitivity", label: "Nhạy cảm" },
  { id: "oiliness", label: "Dầu thừa" },
] as const

export const BUDGETS = [
  { id: "budget", label: "Dưới 200.000đ", desc: "Drugstore, Việt Nam" },
  { id: "affordable", label: "200 – 400.000đ", desc: "Cocoon, CeraVe, The Ordinary" },
  { id: "mid-range", label: "400.000 – 1.000.000đ", desc: "Klairs, La Roche-Posay" },
  { id: "premium", label: "1 – 3.000.000đ", desc: "Estée Lauder, Shiseido" },
  { id: "luxury", label: "Trên 3.000.000đ", desc: "SK-II, La Mer" },
] as const

// ——— New 10-Step Quiz Options ——————————————

export const AGES = [
  { id: "under18", label: "Dưới 18 tuổi", desc: "Da tuổi dậy thì, thường tiết nhiều dầu" },
  { id: "18-24", label: "18 - 24 tuổi", desc: "Da trẻ, tập trung duy trì và ngừa mụn" },
  { id: "25-34", label: "25 - 34 tuổi", desc: "Da bắt đầu lão hóa sớm, cần phục hồi" },
  { id: "35+", label: "Từ 35 tuổi", desc: "Da lão hóa, cần dưỡng chất sâu" },
] as const

export const BARRIER_STATUS = [
  { id: "stable", label: "Không, da bình thường", desc: "Hiếm khi châm chích hay đỏ mặt" },
  { id: "redness", label: "Có, dễ đỏ rát", desc: "Dễ đỏ mặt khi đi nắng hoặc bôi mỹ phẩm" },
  { id: "flaking", label: "Có, dễ bong tróc", desc: "Khô nẻ, bong tróc thành mảng nhỏ" },
  { id: "stinging", label: "Có, hay châm chích", desc: "Thường xuyên xót khi bôi dưỡng da" },
] as const

export const ENVIRONMENTS = [
  { id: "hot-humid", label: "Nóng ẩm", desc: "Dễ đổ mồ hôi, thời tiết oi bức" },
  { id: "ac-room", label: "Ngồi máy lạnh", desc: "Làm việc văn phòng, da dễ mất nước" },
  { id: "dry-cold", label: "Khô hanh / Lạnh", desc: "Độ ẩm thấp, da thiếu ẩm" },
  { id: "polluted", label: "Nhiều khói bụi", desc: "Hay di chuyển ngoài đường" },
] as const

export const MAKEUP_FREQUENCIES = [
  { id: "daily", label: "Trang điểm hàng ngày", desc: "Cần tẩy trang sâu và lót tốt" },
  { id: "occasionally", label: "Thỉnh thoảng", desc: "Chỉ makeup khi đi tiệc / sự kiện" },
  { id: "rarely", label: "Không bao giờ", desc: "Chỉ dùng kem chống nắng / mặt mộc" },
] as const

export const TEXTURE_PREFERENCES = [
  { id: "gel", label: "Mỏng nhẹ (Gel / Nước)", desc: "Thấm nhanh, không bết rít" },
  { id: "cream", label: "Ẩm mượt (Cream)", desc: "Khóa ẩm tốt, giàu dưỡng chất" },
  { id: "any", label: "Không quan trọng", desc: "Miễn là hiệu quả tốt" },
] as const

export const ACTIVE_INGREDIENTS = [
  { id: "none", label: "Chưa từng dùng", desc: "Da nguyên bản, chưa quen treatment" },
  { id: "bha-aha", label: "Đã dùng BHA / AHA", desc: "Quen với tẩy da chết hóa học" },
  { id: "retinol", label: "Đã dùng Retinol", desc: "Da đã dung nạp Retinol" },
  { id: "heavy", label: "Treatment nặng", desc: "Đang dùng Tretinoin, HQ, v.v." },
] as const

export const AVOID_INGREDIENTS = [
  { id: "alcohol", label: "Cồn khô (Alcohol)", desc: "Dễ gây khô rát" },
  { id: "fragrance", label: "Hương liệu (Fragrance)", desc: "Dễ gây dị ứng" },
  { id: "silicone", label: "Silicone", desc: "Dễ gây bít tắc, bí da" },
] as const

export const PREFERENCES = [
  { id: "minimal", label: "Tối giản (3–4 bước)", desc: "Làm sạch → Dưỡng ẩm → Chống nắng. Tiết kiệm thời gian, tối ưu cơ bản." },
  { id: "balanced", label: "Cân bằng (4–5 bước)", desc: "Thêm Toner hoặc Serum. Phù hợp hầu hết lối sống." },
  { id: "complete", label: "Đầy đủ (5–6 bước)", desc: "Toner + Serum đặc trị + Peel buổi tối. Kết quả tối ưu nhất." },
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
