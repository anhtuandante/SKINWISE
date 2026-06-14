"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useUserStore } from "@/store/user-store"
import { buildInitialRoutine, formatPrice, calculateTotal, getAllProducts } from "@/lib/quiz-logic"
import { Product, UserProfile } from "@/types"
import { calculateMatchScore } from "@/lib/recommendation-engine"
import { getCyclePhase } from "@/utils/cyclePredictor"
import { Sparkles, ArrowRight, Loader2, Sun, Moon, CheckCircle2, PlusCircle, ShoppingBag, ExternalLink, Salad } from "lucide-react"
import { useRoutineStore } from "@/store/routine-store"
import { useToastStore } from "@/store/toast-store"
import ProductAvatar from "@/components/ui/ProductAvatar"

// Step labels and tips per category
const STEP_INFO: Record<string, { label: string, tip: string }> = {
  cleanser: { label: "Rửa mặt", tip: "Massage nhẹ 60 giây với da ướt, rửa sạch bằng nước ấm." },
  toner: { label: "Toner", tip: "Đổ ra bông tẩy trang hoặc lòng bàn tay, vỗ nhẹ lên mặt." },
  serum: { label: "Serum đặc trị", tip: "3-4 giọt, ấn nhẹ vào da. Đợi 1 phút trước bước tiếp." },
  moisturizer: { label: "Kem dưỡng ẩm", tip: "Lượng bằng hạt đậu, thoa đều mặt và cổ." },
  sunscreen: { label: "Chống nắng", tip: "2 ngón tay kem. Thoa lại mỗi 2-3 giờ nếu ra ngoài." },
  exfoliant: { label: "Tẩy da chết", tip: "Chỉ dùng 2-3 lần/tuần vào buổi tối. Không dùng khi da đang kích ứng." },
}

export default function ResultsPage() {
  const router = useRouter()
  const user = useUserStore()
  const isHydrated = useUserStore((s) => s.isHydrated)
  const routine = useRoutineStore()
  const addToast = useToastStore((s) => s.addToast)
  
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analyzeStep] = useState(0)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [morningRoutine, setMorningRoutine] = useState<Product[]>([])
  const [eveningRoutine, setEveningRoutine] = useState<Product[]>([])

  const dietGuide = useMemo(() => {
    const isSensitive = user.skinType === "sensitive";
    const isDry = user.skinType === "dry" || user.concerns.includes("dryness");
    const isOily = user.skinType === "oily" || user.concerns.includes("pores");
    const isAcne = user.concerns.includes("acne");

    if (isAcne) {
      return {
        title: "Dinh dưỡng ngừa mụn & Kháng viêm",
        desc: "Hạn chế sữa bò, đường ngọt tinh luyện và tinh bột trắng. Tăng chất béo tốt (omega-3) và kẽm.",
        foods: [
          { name: "Hạt bí ngô", desc: "Giàu kẽm kiểm soát bã nhờn", emoji: "🎃" },
          { name: "Trà xanh", desc: "Kháng viêm, chống oxy hóa", emoji: "🍵" },
          { name: "Cá hồi", desc: "Omega-3 giảm viêm sưng đỏ", emoji: "🐟" },
          { name: "Bông cải xanh", desc: "Hỗ trợ thải độc da", emoji: "🥦" }
        ],
        nutrients: [
          { name: "Kẽm (Zinc)", desc: "Giúp điều hòa tuyến bã nhờn, giảm dầu thừa và tăng tốc làm lành vết thương do mụn." },
          { name: "Omega-3", desc: "Làm giảm phản ứng viêm sưng ở cấp độ tế bào, xoa dịu mụn bọc, mụn sưng đỏ." }
        ]
      };
    }

    if (isSensitive) {
      return {
        title: "Dinh dưỡng làm mát & Làm dịu kích ứng",
        desc: "Hạn chế rượu bia, caffeine và đồ cay nóng. Ưu tiên làm dịu hệ thần kinh và cấp nước từ bên trong.",
        foods: [
          { name: "Nước dừa", desc: "Cấp nước, cân bằng điện giải", emoji: "🥥" },
          { name: "Sữa chua Hy Lạp", desc: "Probiotics phục hồi ruột & da", emoji: "🥛" },
          { name: "Dưa chuột", desc: "Làm mát cơ thể, chứa silica", emoji: "🥒" },
          { name: "Trà hoa cúc", desc: "Làm dịu hệ thần kinh & làn da", emoji: "🌼" }
        ],
        nutrients: [
          { name: "Apigenin", desc: "Chất kháng viêm tự nhiên dồi dào trong trà hoa cúc giúp làm giãn nở và xoa dịu mao mạch." },
          { name: "Probiotics", desc: "Lợi khuẩn củng cố hệ vi sinh đường ruột và hàng rào biểu bì thông qua trục Ruột - Da." }
        ]
      };
    }

    if (isDry) {
      return {
        title: "Dinh dưỡng cấp nước & Phục hồi màng ẩm",
        desc: "Bổ sung chất béo lành mạnh (axit oleic, vitamin E) để tái tạo lớp màng lipid. Uống đủ 2 - 2.5 lít nước.",
        foods: [
          { name: "Trái bơ", desc: "Chất béo tốt dưỡng ẩm tự nhiên", emoji: "🥑" },
          { name: "Hạt óc chó / chia", desc: "Cấp ẩm sâu cho tế bào da", emoji: "🌰" },
          { name: "Cà chua", desc: "Chứa Lycopene chống mất nước", emoji: "🍅" },
          { name: "Nước lọc", desc: "Cung cấp độ ẩm cho tế bào da", emoji: "💧" }
        ],
        nutrients: [
          { name: "Axit béo tốt", desc: "Nuôi dưỡng màng lipid, cải thiện tính thẩm thấu và làm mềm các lớp vảy thô ráp." },
          { name: "Lycopene", desc: "Ngăn chặn sự mất nước xuyên biểu bì (TEWL) và tăng tính dẻo dai liên kết mô da." }
        ]
      };
    }

    if (isOily) {
      return {
        title: "Dinh dưỡng kiểm soát bã nhờn",
        desc: "Tăng cường Vitamin A, B và Kẽm để ổn định hoạt động tuyến dầu. Hạn chế chất béo bão hòa từ đồ chiên xào.",
        foods: [
          { name: "Rau chân vịt", desc: "Giàu vitamin A giúp mịn da", emoji: "🥬" },
          { name: "Hạnh nhân", desc: "Vitamin E giảm oxy hóa dầu nhờn", emoji: "🥜" },
          { name: "Khoai lang", desc: "Beta-carotene điều hòa tuyến bã nhờn", emoji: "🍠" },
          { name: "Yến mạch", desc: "Chứa chất xơ ổn định đường huyết", emoji: "🌾" }
        ],
        nutrients: [
          { name: "Vitamin A", desc: "Thúc đẩy đổi mới biểu bì da, thu nhỏ gián tiếp kích thước lỗ chân lông và kiểm soát nhờn." },
          { name: "Crom (Chromium)", desc: "Giúp kiểm soát đột biến insulin đột ngột - tác nhân kích hoạt bùng phát androgen tiết dầu." }
        ]
      };
    }

    return {
      title: "Dinh dưỡng duy trì da khỏe mạnh",
      desc: "Tăng cường các chất chống oxy hóa và Vitamin C để thúc đẩy tổng hợp collagen tự nhiên của da.",
      foods: [
        { name: "Cam / Quả mọng", desc: "Vitamin C tăng collagen, sáng da", emoji: "🍊" },
        { name: "Hạt chia", desc: "Nguồn dinh dưỡng chống lão hóa", emoji: "🌱" },
        { name: "Rau cải xoăn", desc: "Chứa nhiều vitamin nuôi dưỡng da", emoji: "🥬" },
        { name: "Nước ép cần tây", desc: "Thanh lọc cơ thể, căng mịn da", emoji: "🥤" }
      ],
      nutrients: [
        { name: "Vitamin C", desc: "Co-factor thiết yếu sản sinh collagen sợi đàn hồi, ngăn ngừa lão hóa và thâm xạm da." },
        { name: "Anthocyanins", desc: "Chất chống oxy hóa tự nhiên dồi dào trong quả mọng giúp bảo vệ da trước tia UV từ bên trong." }
      ]
    };
  }, [user.skinType, user.concerns]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user.quizCompleted) {
      router.replace("/quiz")
      return
    }

    async function loadResults() {
      try {
        const data = await buildInitialRoutine(user)
        setMorningRoutine(data.morning)
        setEveningRoutine(data.evening)

        const prods = await getAllProducts()
        setAllProducts(prods)
      } finally {
        setIsAnalyzing(false)
      }
    }

    loadResults()
  }, [user, router, isHydrated])

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-muted" size={24} />
      </div>
    )
  }

  const handleApplyEntireRoutine = () => {
    // Clear previous routines first to prevent over-adding
    routine.clearRoutine();

    morningRoutine.forEach(p => {
      routine.addToMorning(p)
    });

    eveningRoutine.forEach(p => {
      routine.addToEvening(p)
    });

    addToast("Đã lưu toàn bộ Routine của bạn!", "success");
    router.push("/dashboard")
  }

  const handleSwapProduct = (timeOfDay: "AM" | "PM", idx: number, newProduct: Product) => {
    const oldProduct = timeOfDay === "AM" ? morningRoutine[idx] : eveningRoutine[idx];
    
    // Replace the old product with the new one in BOTH routines to keep them in sync
    const updatedMorning = morningRoutine.map(p => p.id === oldProduct.id ? newProduct : p);
    const updatedEvening = eveningRoutine.map(p => p.id === oldProduct.id ? newProduct : p);

    setMorningRoutine(updatedMorning);
    setEveningRoutine(updatedEvening);
    addToast(`Đã chọn ${newProduct.name}`, "success");
  }

  const morningTotal = calculateTotal(morningRoutine)
  const eveningTotal = calculateTotal(eveningRoutine)
  const allUniqueProducts = Array.from(
    new Map([...morningRoutine, ...eveningRoutine].map(p => [p.id, p])).values()
  )
  const grandTotal = calculateTotal(allUniqueProducts)

  const barrierIsWeak = user.barrierStatus === "stinging" || 
                        user.barrierStatus === "redness" || 
                        user.barrierStatus === "flaking"

  const cycleInfo = getCyclePhase(user.cycleStartDate, user.cycleLength || 28)

  return (
    <div className="min-h-screen bg-bg text-fg">
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-fg/10 blur-2xl rounded-full animate-pulse" />
              <div className="w-20 h-20 bg-fg rounded-[24px] flex items-center justify-center shadow-xl relative z-10 animate-bounce">
                <Sparkles size={32} className="text-bg animate-spin-slow" />
              </div>
            </div>
            
            <h2 className="text-title font-semibold mb-2">Đang xây dựng Routine cho bạn...</h2>
            <p className="text-caption text-muted max-w-[300px] mx-auto mb-10">
              SkinWise AI đang chọn lọc sản phẩm phù hợp nhất với da và ngân sách của bạn.
            </p>
            
            <div className="space-y-5 w-full max-w-[300px] text-left mx-auto">
              {[
                "Phân tích loại da và vấn đề",
                "Chọn sản phẩm phù hợp ngân sách",
                "Sắp xếp thứ tự bôi thoa"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-caption font-medium">
                  {analyzeStep > i ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 size={18} className="text-success" />
                    </motion.div>
                  ) : (
                    <Loader2 size={18} className="animate-spin text-muted/40" />
                  )}
                  <span className={analyzeStep > i ? "text-fg" : "text-muted"}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto px-6 py-10 pb-36"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", delay: 0.2 }}
                className="w-14 h-14 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle2 size={28} />
              </motion.div>
              <h1 className="text-headline font-semibold mb-2">Routine của bạn đã sẵn sàng!</h1>
              <p className="text-body text-muted max-w-md mx-auto mb-4">
                Dựa trên phân tích cơ địa và môi trường, SkinWise AI đã thiết kế chu trình <strong>tối ưu và an toàn nhất</strong> cho bạn.
              </p>
            </div>

            {/* Personalized Routine Profile Summary */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              <span className="text-[10px] font-bold bg-fg/5 text-fg px-3 py-1.5 rounded-full uppercase tracking-wider">
                Da: {user.skinType === 'oily' ? 'Dầu' : user.skinType === 'dry' ? 'Khô' : user.skinType === 'sensitive' ? 'Nhạy cảm' : user.skinType === 'combination' ? 'Hỗn hợp' : 'Thường'}
              </span>
              <span className="text-[10px] font-bold bg-fg/5 text-fg px-3 py-1.5 rounded-full uppercase tracking-wider">
                Vấn đề: {user.concerns.map(c => c === 'acne' ? 'Mụn' : c === 'pores' ? 'Lỗ chân lông' : c === 'dark-spots' ? 'Thâm nám' : c === 'aging' ? 'Lão hóa' : c === 'dullness' ? 'Xỉn màu' : c === 'dryness' ? 'Thiếu ẩm' : c).join(', ')}
              </span>
              <span className="text-[10px] font-bold bg-fg/5 text-fg px-3 py-1.5 rounded-full uppercase tracking-wider">
                Ngân sách: {user.totalBudget ? `${user.totalBudget.toLocaleString()}đ` : (user.budget === 'budget' ? 'Dưới 200k' : user.budget === 'affordable' ? '200k-400k' : user.budget === 'mid-range' ? '400k-1tr' : 'Cao cấp')}
              </span>
              {barrierIsWeak && (
                <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full uppercase tracking-wider border border-red-500/10 flex items-center gap-1">
                  🛡️ SOS Phục hồi
                </span>
              )}
              {cycleInfo && (
                <span className="text-[10px] font-bold bg-accent/10 text-accent-dark px-3 py-1.5 rounded-full uppercase tracking-wider border border-accent/20 flex items-center gap-1">
                  📅 {cycleInfo.label}
                </span>
              )}
            </div>

            {/* Grand Total Budget Card */}
            {grandTotal > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8 p-5 bg-white border border-line rounded-2xl shadow-soft text-center"
              >
                <div className="text-micro font-bold text-muted uppercase tracking-widest mb-1">💰 Tổng chi phí cả Routine</div>
                <div className="text-headline font-bold text-fg">{formatPrice(grandTotal)}</div>
                <div className="text-caption text-muted mt-1">
                  {allUniqueProducts.length} sản phẩm · Dùng được khoảng 2-3 tháng
                </div>
              </motion.div>
            )}

            <div className="space-y-10">
              {/* Morning Routine */}
              <RoutineTimeline
                title="Chu Trình Buổi Sáng"
                subtitle="Bảo vệ da khỏi tác hại môi trường"
                icon={<Sun size={18} />}
                gradientFrom="#FFB75E"
                gradientTo="#ED8F03"
                products={morningRoutine}
                total={morningTotal}
                profile={user}
                delay={0.4}
                allProducts={allProducts}
                onSwapProduct={(idx, newP) => handleSwapProduct("AM", idx, newP)}
              />

              {/* Evening Routine */}
              <RoutineTimeline
                title="Chu Trình Buổi Tối"
                subtitle="Phục hồi và dưỡng chất chuyên sâu"
                icon={<Moon size={18} />}
                gradientFrom="#2b5876"
                gradientTo="#4e4376"
                products={eveningRoutine}
                total={eveningTotal}
                profile={user}
                delay={0.6}
                allProducts={allProducts}
                onSwapProduct={(idx, newP) => handleSwapProduct("PM", idx, newP)}
              />
            </div>

            {/* 3. AI Skin Diet Advice Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-4 mt-8"
            >
              <h3 className="text-body font-bold text-fg flex items-center gap-2">
                <Salad size={18} className="text-emerald-500 animate-pulse" />
                <span>Dinh dưỡng chuyên sâu từ Quiz</span>
              </h3>
              
              <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl space-y-4">
                <div>
                  <span className="text-micro font-bold text-emerald-600 uppercase tracking-wider block">Chế độ dinh dưỡng AI gợi ý</span>
                  <span className="text-body font-extrabold text-fg mt-0.5 block">{dietGuide.title}</span>
                  <p className="text-caption text-muted mt-1 leading-relaxed">{dietGuide.desc}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {dietGuide.foods.map((food, idx) => (
                    <div key={idx} className="bg-white border border-line rounded-xl p-3 text-center space-y-1 hover:border-emerald-500/30 transition-all select-none">
                      <span className="text-2xl block">{food.emoji}</span>
                      <span className="text-caption font-bold text-fg block">{food.name}</span>
                      <span className="text-[10px] text-muted block leading-snug">{food.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-emerald-500/5 pt-3 space-y-2">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">🔑 Hoạt chất vàng cho làn da của bạn</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dietGuide.nutrients.map((nut, idx) => (
                      <div key={idx} className="text-[11px] text-muted bg-surface/50 border border-line/50 p-2.5 rounded-xl space-y-0.5 animate-in">
                        <strong className="text-fg font-extrabold block">{nut.name}</strong>
                        <p className="leading-relaxed text-[10px]">{nut.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-emerald-500/5 pt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted italic">Mẹo: Khi vào Workspace, bạn có thể nhấp &quot;Xem hướng dẫn chuyên sâu&quot; để xem công thức nấu món ăn này và thực đơn mẫu cả ngày!</span>
                </div>
              </div>
            </motion.div>

            {/* Floating Bottom Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pointer-events-none z-50"
            >
              <div className="max-w-2xl mx-auto pointer-events-auto flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleApplyEntireRoutine}
                  className="flex-1 bg-fg text-bg rounded-2xl py-4 font-bold text-body shadow-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle size={20} /> Lưu Routine & Vào Workspace
                </button>
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="bg-white text-fg border border-line rounded-2xl py-4 px-6 font-bold text-caption shadow-lg hover:bg-surface active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Tự chọn <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Routine Timeline Component ---
function RoutineTimeline({ 
  title, 
  subtitle, 
  icon, 
  gradientFrom, 
  gradientTo, 
  products, 
  total, 
  profile, 
  delay,
  allProducts,
  onSwapProduct
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  gradientFrom: string
  gradientTo: string
  products: Product[]
  total: number
  profile: UserProfile
  delay: number
  allProducts: Product[]
  onSwapProduct: (idx: number, newP: Product) => void
}) {
  if (products.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            {icon}
          </div>
          <div>
            <div className="text-body font-bold text-fg">{title}</div>
            <div className="text-micro text-muted">{subtitle}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-body font-bold text-fg">{formatPrice(total)}</div>
          <div className="text-micro text-muted">{products.length} sản phẩm</div>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-line" />

        <div className="space-y-0">
          {products.map((product, idx) => (
            <ProductStepCard
              key={product.id}
              product={product}
              idx={idx}
              profile={profile}
              gradientFrom={gradientFrom}
              gradientTo={gradientTo}
              allProducts={allProducts}
              delay={delay + 0.1 + (idx * 0.12)}
              onSwap={(newP) => onSwapProduct(idx, newP)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// --- Modular Step Card component to handle own dropdown state ---
function ProductStepCard({
  product,
  idx,
  profile,
  gradientFrom,
  gradientTo,
  allProducts,
  delay,
  onSwap
}: {
  product: Product
  idx: number
  profile: UserProfile
  gradientFrom: string
  gradientTo: string
  allProducts: Product[]
  delay: number
  onSwap: (newP: Product) => void
}) {
  const [showAlts, setShowAlts] = useState(false)
  const stepInfo = STEP_INFO[product.category] || { label: product.category, tip: "" }
  const match = calculateMatchScore(product, profile)

  // Filter 2 best alternative products in the same category
  const alternatives = useMemo(() => {
    if (allProducts.length === 0) return []
    return allProducts
      .filter((p) => p.category === product.category && p.id !== product.id && p.type === "skincare")
      .map((p) => ({
        product: p,
        match: calculateMatchScore(p, profile)
      }))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 2)
  }, [allProducts, product, profile])

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="relative pl-14 pb-6 last:pb-0"
    >
      {/* Step number circle */}
      <div 
        className="absolute left-[10px] top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm z-10"
        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
      >
        {idx + 1}
      </div>

      {/* Card */}
      <div className="bg-white border border-line rounded-2xl p-5 hover:border-fg/20 hover:shadow-soft transition-all">
        {/* Step label */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-micro font-bold text-muted uppercase tracking-widest">
            Bước {idx + 1}: {stepInfo.label}
          </div>
          {alternatives.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAlts(!showAlts)}
              className="text-[10px] text-accent-dark hover:text-accent font-extrabold transition-colors uppercase tracking-wider"
            >
              {showAlts ? "Đóng ✕" : "Thay sản phẩm khác ⇄"}
            </button>
          )}
        </div>

        {/* Product info */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <ProductAvatar brand={product.brand} name={product.name} className="w-12 h-12" />
            <div className="flex-1 min-w-0">
              <div className="text-body font-bold text-fg leading-tight truncate">{product.name}</div>
              <div className="text-caption text-muted mt-0.5 truncate">{product.brand} · {product.size}</div>
            </div>
          </div>
          <div className="text-body font-bold text-fg whitespace-nowrap pl-2">{formatPrice(product.price)}</div>
        </div>

        {/* AI Match reasons */}
        {match.reasons.length > 0 && (
          <div className="mb-3 p-3 bg-surface/50 rounded-xl border border-line/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={11} className="text-fg animate-pulse" />
              <span className="text-[11px] font-extrabold text-fg tracking-tight">TẠI SAO SẢN PHẨM NÀY?</span>
            </div>
            <ul className="space-y-1">
              {match.reasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="text-success shrink-0 mt-0.5" />
                  <span className="text-[12px] text-muted leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Usage tip */}
        {stepInfo.tip && (
          <div className="text-[12px] text-muted/70 italic leading-relaxed mb-3">
            💡 {stepInfo.tip}
          </div>
        )}

        {/* Shopee link */}
        <a
          href={`${product.shopeeUrl}${product.shopeeUrl.includes('?') ? '&' : '?'}utm_source=affiliate&utm_medium=skincare_app&utm_campaign=skinwise`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 text-caption font-bold text-[#EE4D2D] hover:bg-[#EE4D2D]/5 border border-[#EE4D2D]/20 px-4 py-2.5 rounded-xl transition-all"
        >
          <ShoppingBag size={14} /> Mua trên Shopee <ExternalLink size={12} />
        </a>

        {/* Alternative Product Drawer list */}
        {showAlts && alternatives.length > 0 && (
          <div className="mt-4 pt-4 border-t border-line/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Sản phẩm thay thế khuyên dùng:</div>
            <div className="space-y-2">
              {alternatives.map(({ product: altP, match: altM }) => (
                <div 
                  key={altP.id} 
                  className="flex items-center justify-between p-3 border border-line rounded-xl hover:border-accent/20 transition-all bg-surface/30 group gap-3"
                >
                  <ProductAvatar brand={altP.brand} name={altP.name} className="w-10 h-10" />
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="text-[13px] font-bold text-fg group-hover:text-accent-dark transition-colors leading-snug truncate">{altP.name}</div>
                    <div className="text-[11px] text-muted mt-0.5 truncate">
                      {altP.brand} · {formatPrice(altP.price)} · Match {altM.score}%
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSwap(altP)
                      setShowAlts(false)
                    }}
                    className="shrink-0 text-[11px] font-extrabold bg-fg text-bg px-3 py-1.5 rounded-lg hover:opacity-90 active:scale-95 transition-all"
                  >
                    Chọn
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
