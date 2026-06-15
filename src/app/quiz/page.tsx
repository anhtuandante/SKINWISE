"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useUserStore } from "@/store/user-store"
import { useToastStore } from "@/store/toast-store"
import { 
  SKIN_TYPES, CONCERNS,
  BARRIER_STATUS, AVOID_INGREDIENTS
} from "@/lib/constants"
import Button from "@/components/ui/Button"
import VisionLab from "@/components/quiz/VisionLab"
import { Sparkles, Check, Info } from "lucide-react"
import { trackEvent } from "@/lib/tracking"

const STEPS = [
  { title: "Năm sinh", sub: "Xác định chu kỳ tái tạo da" },
  { title: "Loại da", sub: "Cốt lõi của mọi quy trình" },
  { title: "Vấn đề da", sub: "Có thể chọn nhiều" },
  { title: "Thành phần cần tránh", sub: "Dị ứng hoặc không hợp (Tùy chọn)" },
  { title: "Da bạn có nhạy cảm không?", sub: "Ảnh hưởng đến sản phẩm được gợi ý" },
  { title: "Ngân sách", sub: "Cho mỗi sản phẩm" },
]

const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -40 : 40,
    opacity: 0,
  }),
}

export default function QuizPage() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const router = useRouter()
  const store = useUserStore()
  const addToast = useToastStore((s) => s.addToast)
  const [showVision, setShowVision] = useState(false)

  // Sync step from store on hydrate
  useEffect(() => {
    if (store.isHydrated && store.quizStep > 1 && store.quizStep <= 6) {
      setStep(store.quizStep)
    }
  }, [store.isHydrated, store.quizStep])

  // Track quiz load
  useEffect(() => {
    trackEvent("quiz_start");
  }, []);

  // Track step changes
  useEffect(() => {
    trackEvent("quiz_step_view", { step });
  }, [step]);

  const canNext = () => {
    switch (step) {
      case 1: return !!store.birthYear && store.birthYear > 1900 && store.birthYear <= new Date().getFullYear();
      case 2: return !!store.skinType;
      case 3: return store.concerns.length > 0;
      case 4: return true; // Optional allergies
      case 5: return !!store.barrierStatus;
      case 6: return !!store.totalBudget && store.totalBudget > 0;
      default: return true;
    }
  }

  const handleNext = () => {
    if (step < 6) {
      setDirection(1)
      setStep(step + 1)
      store.setQuizStep(step + 1)
    } else {
      trackEvent("quiz_complete", {
        birthYear: store.birthYear,
        skinType: store.skinType,
        concerns: store.concerns,
        barrierStatus: store.barrierStatus,
        totalBudget: store.totalBudget,
        budgetStrategy: store.budgetStrategy
      });
      store.setQuizCompleted(true)
      store.setGuest(false)
      store.setQuizStep(1)
      router.push("/results")
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(step - 1)
      store.setQuizStep(step - 1)
    }
  }

  const handleGuest = () => {
    store.setGuest(true)
    store.setQuizCompleted(true)
    if (!store.birthYear) store.setBirthYear(2000)
    if (!store.skinType) store.setSkinType("combination")
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-bg/90 backdrop-blur-sm border-b border-line">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SkinWise Logo" className="h-6 w-auto object-contain" />
            <span className="text-body font-semibold">SkinWise AI Quiz</span>
          </div>
          <span className="text-caption font-medium text-muted">Bước {step}/6</span>
        </div>
        {/* Animated progress bar */}
        <div className="max-w-md mx-auto px-6">
          <div className="h-1 bg-line rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-fg rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(step / 6) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-24 pb-32">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="space-y-2 mb-8">
              <p className="text-caption font-bold uppercase tracking-[0.15em] text-accent">{STEPS[step - 1].sub}</p>
              <h1 className="text-headline font-semibold text-fg">{STEPS[step - 1].title}</h1>
            </div>

            <div className="space-y-3">
              {/* Step 1: Age */}
              {step === 1 && (
                <div className="space-y-6 w-full bg-white border border-line rounded-[24px] p-6 shadow-soft animate-in">
                  <div className="text-center space-y-1">
                    <span className="text-caption font-bold text-fg block">Nhập năm sinh của bạn</span>
                    <p className="text-[11px] text-muted">Giúp AI xác định chính xác chu kỳ tái tạo da và ưu tiên dưỡng chất chống lão hóa nếu cần thiết.</p>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="VD: 1995"
                      value={store.birthYear || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        store.setBirthYear(val || undefined);
                      }}
                      className="w-full bg-surface border-2 border-line hover:border-fg/40 focus:border-fg rounded-2xl px-5 py-4 text-headline font-extrabold text-center text-fg outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Skin Type */}
              {step === 2 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      trackEvent("ai_face_scan_start");
                      setShowVision(true);
                    }}
                    className="w-full mb-6 p-4 bg-fg text-bg rounded-2xl flex items-center justify-center gap-3 shadow-lg"
                  >
                    <Sparkles size={20} className="animate-pulse" />
                    <span className="text-body font-bold text-bg">Phân tích da với AI (Mới)</span>
                  </motion.button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-px bg-line flex-1" />
                    <span className="text-caption text-muted uppercase tracking-wider font-medium">Hoặc tự chọn</span>
                    <div className="h-px bg-line flex-1" />
                  </div>
                  {SKIN_TYPES.map((item) => (
                    <OptionButton
                      key={item.id}
                      title={item.label}
                      desc={item.desc}
                      isActive={store.skinType === item.id}
                      onClick={() => {
                        trackEvent("quiz_answer", { step: 2, type: "skinType", value: item.id });
                        store.setSkinType(item.id);
                      }}
                    />
                  ))}
                </>
              )}

              {step === 3 && CONCERNS.map((item) => (
                <OptionButton
                  key={item.id}
                  title={item.label}
                  desc={item.desc}
                  tooltip={'tooltip' in item ? (item as { tooltip: string }).tooltip : undefined}
                  isActive={store.concerns.includes(item.id)}
                  onClick={() => {
                    const active = store.concerns.includes(item.id);
                    trackEvent("quiz_answer", { step: 3, type: "concern", value: item.id, selected: !active });
                    store.toggleConcern(item.id);
                  }}
                  isMulti
                />
              ))}

              {/* Step 4: Allergies / Avoided Ingredients */}
              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-caption text-muted px-2">Bỏ qua nếu bạn không bị dị ứng với thành phần nào.</p>
                  {AVOID_INGREDIENTS.map((item) => (
                    <OptionButton
                      key={item.id}
                      title={item.label}
                      desc={item.desc}
                      isActive={store.allergies.includes(item.id)}
                      onClick={() => {
                        trackEvent("quiz_answer", { step: 4, type: "allergy", value: item.id });
                        store.toggleAllergy(item.id);
                      }}
                      isMulti
                    />
                  ))}
                </div>
              )}

              {/* Step 5: Barrier Status (Sensitivity) */}
              {step === 5 && BARRIER_STATUS.map((item) => (
                <OptionButton
                  key={item.id}
                  title={item.label}
                  desc={item.desc}
                  isActive={store.barrierStatus === item.id}
                  onClick={() => {
                    trackEvent("quiz_answer", { step: 5, type: "barrierStatus", value: item.id });
                    store.setBarrierStatus(item.id as "stable" | "redness" | "flaking" | "stinging");
                  }}
                />
              ))}

              {/* Step 6: Budget (SkinWallet Input) */}
              {step === 6 && (
                <div className="space-y-6 w-full bg-white border border-line rounded-[24px] p-6 shadow-soft animate-in">
                  <div className="text-center space-y-1">
                    <span className="text-2xl block">💳</span>
                    <span className="text-caption font-bold text-fg block">Số tiền bạn muốn chi cho cả chu trình da</span>
                    <p className="text-[11px] text-muted">Nhập số tiền tối đa bạn sẵn sàng chi tiêu. Thuật toán AI sẽ tự động phân bổ và tối ưu hóa các sản phẩm để không vượt quá ngân sách này.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Ví dụ: 1.500.000"
                        value={store.totalBudget ? store.totalBudget.toLocaleString("vi-VN") : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          const num = parseInt(val) || 0;
                          store.setTotalBudget(num);
                          trackEvent("quiz_answer", { step: 5, type: "totalBudget", value: num });
                        }}
                        className="w-full bg-surface border-2 border-line hover:border-fg/40 focus:border-fg rounded-2xl px-5 py-4 text-headline font-extrabold text-center text-fg outline-none transition-all pr-12"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-body font-bold text-muted">đ</span>
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block text-center">Gợi ý nhanh</span>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[300000, 500000, 1000000, 1500000, 2500000, 4000000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            store.setTotalBudget(preset);
                            trackEvent("quiz_answer", { step: 5, type: "totalBudget_preset", value: preset });
                          }}
                          className={`px-3.5 py-2 rounded-xl text-caption font-bold border transition-all active:scale-95 select-none ${
                            store.totalBudget === preset
                              ? "bg-fg text-bg border-fg"
                              : "bg-bg text-fg border-line hover:border-fg/40"
                          }`}
                        >
                          {preset >= 1000000 ? `${(preset / 1000000).toFixed(1).replace(".0", "")} triệu` : `${preset / 1000}k`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget Strategy */}
                  {(store.totalBudget || 0) > 0 && (
                    <div className="pt-2 border-t border-line">
                      <span className="text-[11px] font-bold text-fg uppercase tracking-wider block mb-3">Chiến lược phân bổ AI</span>
                      <div className="grid gap-2">
                        {[
                          { id: "even", label: "Chia đều ngân sách", desc: "Phân bổ đồng đều cho mọi bước" },
                          { id: "serum", label: "Đầu tư Treatment/Serum", desc: "Dành phần lớn tiền cho đặc trị, mua làm sạch rẻ" },
                          { id: "save", label: "Tiết kiệm tối đa", desc: "Ưu tiên chọn các sản phẩm rẻ nhất có thể" }
                        ].map(strategy => (
                          <button
                            key={strategy.id}
                            onClick={() => store.setBudgetStrategy(strategy.id as "even" | "serum" | "save")}
                            className={`flex flex-col text-left px-4 py-3 border rounded-xl transition-all ${
                              store.budgetStrategy === strategy.id ? "bg-fg/[0.03] border-fg" : "bg-surface border-line hover:border-fg/40"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                store.budgetStrategy === strategy.id ? "border-fg" : "border-line"
                              }`}>
                                {store.budgetStrategy === strategy.id && <div className="w-2.5 h-2.5 rounded-full bg-fg" />}
                              </div>
                              <span className={`text-caption font-bold ${store.budgetStrategy === strategy.id ? "text-fg" : "text-fg/80"}`}>{strategy.label}</span>
                            </div>
                            <span className="text-[10px] text-muted ml-6 mt-1">{strategy.desc}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted italic mt-4 text-center">* Bạn có thể tinh chỉnh chi tiết trong SkinWallet sau khi hoàn thành quiz.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating Controls */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg via-bg to-transparent pointer-events-none z-10">
          <div className="max-w-md mx-auto pointer-events-auto flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                disabled={step === 1}
                className="bg-white shrink-0"
              >
                Quay lại
              </Button>
              {step === 4 ? (
                <div className="flex gap-2 flex-1">
                  <Button 
                    onClick={() => {
                      handleNext();
                    }} 
                    variant="outline" 
                    className="bg-white flex-1"
                  >
                    Bỏ qua
                  </Button>
                  <Button onClick={handleNext} disabled={!canNext()} className="flex-1">
                    Tiếp tục
                  </Button>
                </div>
              ) : step === 6 ? (
                <div className="flex gap-2 flex-1">
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    className="bg-white"
                  >
                    Quay lại
                  </Button>
                  <Button onClick={handleNext} disabled={!canNext()} className="flex-1">
                    Hoàn thành
                  </Button>
                </div>
              ) : (
                <Button onClick={handleNext} disabled={!canNext()} className="flex-1">
                  Tiếp tục
                </Button>
              )}
            </div>
            
            {step === 1 && (
              <button 
                onClick={handleGuest}
                className="text-[11px] font-bold text-muted hover:text-fg underline underline-offset-2 transition-colors mx-auto mt-2"
              >
                Khám phá ngay (Chế độ Khách)
              </button>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showVision && (
          <VisionLab 
            onClose={() => setShowVision(false)} 
            onComplete={() => {
              setShowVision(false)
              setStep(3) // Jump to concerns step
              setDirection(1)
              addToast("Phân tích da qua ảnh thành công!", "success")
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function OptionButton({ title, desc, tooltip, isActive, onClick, isMulti = false }: { title: string, desc?: string, tooltip?: string, isActive: boolean, onClick: () => void, isMulti?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative w-full">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`w-full text-left border rounded-2xl px-5 py-4 transition-all relative overflow-hidden group ${
          isActive ? "border-fg bg-fg/[0.03] shadow-soft" : "border-line bg-white hover:border-fg/40 hover:bg-fg/[0.01]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2">
              <div className={`text-body font-bold transition-colors ${isActive ? "text-fg" : "text-fg/80"}`}>{title}</div>
              {tooltip && (
                <div 
                  className="p-1 -m-1 text-muted hover:text-fg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowTooltip(!showTooltip)
                  }}
                >
                  <Info size={14} />
                </div>
              )}
            </div>
            {desc && <div className="text-caption text-muted font-medium mt-1">{desc}</div>}
          </div>
          {isMulti ? (
          <div className={`w-6 h-6 shrink-0 rounded-[6px] border flex items-center justify-center transition-all ${
            isActive ? "bg-fg border-fg text-bg" : "border-line text-transparent"
          }`}>
            <Check size={14} strokeWidth={3} />
          </div>
        ) : (
          isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 shrink-0 rounded-full bg-fg flex items-center justify-center shadow-sm"
            >
              <Check size={12} className="text-bg" strokeWidth={3} />
            </motion.div>
          )
        )}
      </div>
    </motion.button>
    <AnimatePresence>
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 8 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-surface border border-line p-3 rounded-xl text-caption text-muted">
            {tooltip}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  )
}
