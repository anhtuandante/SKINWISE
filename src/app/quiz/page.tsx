"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useUserStore } from "@/store/user-store"
import { SKIN_TYPES, CONCERNS, BUDGETS, SKIN_LABELS, CONCERN_LABELS, BUDGET_LABELS } from "@/lib/constants"
import Button from "@/components/ui/Button"

const STEPS = [
  { title: "Loại da", sub: "Chọn loại phù hợp nhất" },
  { title: "Vấn đề da", sub: "Có thể chọn nhiều" },
  { title: "Ngân sách", sub: "Cho mỗi sản phẩm" },
  { title: "Dị ứng", sub: "Bỏ qua nếu không có" },
]

const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
}

export default function QuizPage() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const router = useRouter()
  const store = useUserStore()

  const canNext = () => {
    if (step === 1) return !!store.skinType
    if (step === 2) return store.concerns.length > 0
    if (step === 3) return !!store.budget
    return true
  }

  const handleNext = () => {
    if (step < 4) {
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
          <span className="text-body font-semibold">SkinWise Quiz</span>
          <span className="text-caption text-muted">Bước {step}/4</span>
        </div>
        {/* Animated progress bar */}
        <div className="max-w-md mx-auto px-6">
          <div className="h-0.5 bg-line rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-fg rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-22 pb-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="space-y-2 mb-8">
              <p className="text-caption uppercase tracking-[0.2em] text-muted">{STEPS[step - 1].sub}</p>
              <h1 className="text-headline font-semibold">{STEPS[step - 1].title}</h1>
            </div>

            <div className="space-y-3">
              {step === 1 &&
                SKIN_TYPES.map((item) => (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => store.setSkinType(item.id)}
                    className={`w-full text-left border rounded-xl px-4 py-3 transition-all ${
                      store.skinType === item.id ? "border-fg bg-surface shadow-soft" : "border-line hover:border-fg/60"
                    }`}
                  >
                    <div className="text-body font-semibold">{item.label}</div>
                    <div className="text-caption text-muted">{item.desc}</div>
                  </motion.button>
                ))}

              {step === 2 &&
                CONCERNS.map((item) => {
                  const active = store.concerns.includes(item.id)
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => store.toggleConcern(item.id)}
                      className={`w-full text-left border rounded-xl px-4 py-3 transition-all ${
                        active ? "border-fg bg-surface shadow-soft" : "border-line hover:border-fg/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-body font-semibold">{item.label}</div>
                        {active && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-fg flex items-center justify-center"
                          >
                            <span className="text-[10px] text-bg">✓</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}

              {step === 3 &&
                BUDGETS.map((item) => (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => store.setBudget(item.id)}
                    className={`w-full text-left border rounded-xl px-4 py-3 transition-all ${
                      store.budget === item.id ? "border-fg bg-surface shadow-soft" : "border-line hover:border-fg/60"
                    }`}
                  >
                    <div className="text-body font-semibold">{item.label}</div>
                    <div className="text-caption text-muted">{item.desc}</div>
                  </motion.button>
                ))}

              {step === 4 && (
                <div className="space-y-3">
                  <label className="text-body font-medium" htmlFor="allergies">
                    Thành phần bạn dị ứng (nếu có)
                  </label>
                  <input
                    id="allergies"
                    value={store.allergies}
                    onChange={(e) => store.setAllergies(e.target.value)}
                    placeholder="Ví dụ: cồn, hương liệu..."
                    className="w-full border border-line rounded-xl px-4 py-3 bg-white focus:border-fg outline-none transition-colors"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack} disabled={step === 1}>
            Quay lại
          </Button>
          <Button onClick={handleNext} disabled={!canNext()}>
            {step === 4 ? "Xem kết quả" : "Tiếp tục"}
          </Button>
        </div>

        <p className="text-caption text-muted mt-6">
          Đã chọn: {SKIN_LABELS[store.skinType] || "—"} ·{" "}
          {store.concerns.length > 0 ? store.concerns.map((c) => CONCERN_LABELS[c]).join(", ") : "Chưa chọn vấn đề"} ·{" "}
          {BUDGET_LABELS[store.budget] || "Chưa chọn ngân sách"}
        </p>
      </main>
    </div>
  )
}
