"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useUserStore } from "@/store/user-store"
import { useToastStore } from "@/store/toast-store"
import { 
  SKIN_TYPES, CONCERNS, BUDGETS,
  AGES, BARRIER_STATUS
} from "@/lib/constants"
import Button from "@/components/ui/Button"
import VisionLab from "@/components/quiz/VisionLab"
import { Sparkles, Check } from "lucide-react"

const STEPS = [
  { title: "Độ tuổi", sub: "Xác định chu kỳ tái tạo da" },
  { title: "Loại da", sub: "Cốt lõi của mọi quy trình" },
  { title: "Vấn đề da", sub: "Có thể chọn nhiều" },
  { title: "Da bạn có nhạy cảm không?", sub: "Ảnh hưởng đến sản phẩm được gợi ý" },
  { title: "Ngân sách", sub: "Cho mỗi sản phẩm" },
  { title: "Chu kỳ kinh nguyệt (Tùy chọn)", sub: "Tối ưu hóa sản phẩm theo nội tiết tố" },
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

  const canNext = () => {
    switch (step) {
      case 1: return !!store.age;
      case 2: return !!store.skinType;
      case 3: return store.concerns.length > 0;
      case 4: return !!store.barrierStatus;
      case 5: return !!store.budget;
      case 6: return true; // Optional step
      default: return true;
    }
  }

  const handleNext = () => {
    if (step < 6) {
      setDirection(1)
      setStep(step + 1)
    } else {
      store.setQuizCompleted(true)
      router.push("/results")
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-bg/90 backdrop-blur-sm border-b border-line">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-body font-semibold">SkinWise AI Quiz</span>
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
              {step === 1 && AGES.map((item) => (
                <OptionButton
                  key={item.id}
                  title={item.label}
                  desc={item.desc}
                  isActive={store.age === item.id}
                  onClick={() => store.setAge(item.id)}
                />
              ))}

              {/* Step 2: Skin Type */}
              {step === 2 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowVision(true)}
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
                      onClick={() => store.setSkinType(item.id)}
                    />
                  ))}
                </>
              )}

              {/* Step 3: Concerns */}
              {step === 3 && CONCERNS.map((item) => (
                <OptionButton
                  key={item.id}
                  title={item.label}
                  isActive={store.concerns.includes(item.id)}
                  onClick={() => store.toggleConcern(item.id)}
                  isMulti
                />
              ))}

              {/* Step 4: Barrier Status (Sensitivity) */}
              {step === 4 && BARRIER_STATUS.map((item) => (
                <OptionButton
                  key={item.id}
                  title={item.label}
                  desc={item.desc}
                  isActive={store.barrierStatus === item.id}
                  onClick={() => store.setBarrierStatus(item.id as "stable" | "redness" | "flaking" | "stinging")}
                />
              ))}

              {/* Step 5: Budget */}
              {step === 5 && BUDGETS.map((item) => (
                <OptionButton
                  key={item.id}
                  title={item.label}
                  desc={item.desc}
                  isActive={store.budget === item.id}
                  onClick={() => store.setBudget(item.id)}
                />
              ))}

              {/* Step 6: Menstrual Cycle (Optional) */}
              {step === 6 && (
                <div className="space-y-5 bg-white border border-line rounded-2xl p-5 shadow-soft">
                  <p className="text-caption text-muted">
                    Bỏ qua nếu bạn là nam giới hoặc không có nhu cầu theo dõi da theo chu kỳ nội tiết.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-caption font-bold text-fg block" htmlFor="period-date">Ngày bắt đầu kỳ kinh gần nhất</label>
                    <input
                      id="period-date"
                      type="date"
                      value={store.cycleStartDate || ""}
                      onChange={(e) => store.setCycleStartDate(e.target.value)}
                      className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-body outline-none focus:border-fg transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-caption font-bold text-fg block" htmlFor="cycle-len">Chu kỳ kinh trung bình (ngày)</label>
                    <div className="flex gap-2">
                      {[25, 28, 30, 32].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => store.setCycleLength(l)}
                          className={`flex-1 py-2 rounded-xl text-caption font-bold border transition-all ${
                            store.cycleLength === l ? "bg-fg text-bg border-fg" : "bg-white text-muted border-line hover:border-fg/40"
                          }`}
                        >
                          {l} ngày
                        </button>
                      ))}
                    </div>
                    <input
                      id="cycle-len"
                      type="number"
                      min={15}
                      max={45}
                      value={store.cycleLength || 28}
                      onChange={(e) => store.setCycleLength(parseInt(e.target.value) || 28)}
                      placeholder="Số ngày khác..."
                      className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-caption outline-none focus:border-fg transition-all mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating Controls */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg via-bg to-transparent pointer-events-none z-10">
          <div className="max-w-md mx-auto pointer-events-auto flex items-center justify-between gap-4">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={step === 1}
              className="bg-white shrink-0"
            >
              Quay lại
            </Button>
            {step === 6 ? (
              <div className="flex gap-2 flex-1">
                <Button 
                  onClick={() => {
                    store.setCycleStartDate(""); // Xóa nếu bỏ qua
                    handleNext();
                  }} 
                  variant="outline" 
                  className="bg-white flex-1"
                >
                  Bỏ qua
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

function OptionButton({ title, desc, isActive, onClick, isMulti = false }: { title: string, desc?: string, isActive: boolean, onClick: () => void, isMulti?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left border rounded-2xl px-5 py-4 transition-all relative overflow-hidden group ${
        isActive ? "border-fg bg-fg/[0.03] shadow-soft" : "border-line bg-white hover:border-fg/40 hover:bg-fg/[0.01]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className={`text-body font-bold transition-colors ${isActive ? "text-fg" : "text-fg/80"}`}>{title}</div>
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
  )
}
