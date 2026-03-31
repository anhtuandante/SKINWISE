"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { useUserStore } from "@/store/user-store"
import { useRoutineStore } from "@/store/routine-store"
import { filterProducts, getProductsByCategory } from "@/lib/quiz-logic"
import { CATEGORY_LABELS } from "@/lib/constants"
import { useToastStore } from "@/store/toast-store"
import UserSummaryCard from "@/components/quiz/UserSummaryCard"
import RoutineBuilder from "@/components/routine/RoutineBuilder"
import ProductCard from "@/components/routine/ProductCard"
import { Product } from "@/types"
import { ExpandingSearchDock } from "@/components/ui/expanding-search-dock-shadcnui"

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
}

export default function ResultsPage() {
  const { skinType, concerns, budget } = useUserStore()
  const routine = useRoutineStore()
  const addToast = useToastStore((s) => s.addToast)

  const [recommended, setRecommended] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadProducts() {
      if (!skinType || !budget) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const data = await filterProducts(skinType, concerns, budget)
      setRecommended(data)
      setIsLoading(false)
    }
    loadProducts()
  }, [skinType, concerns, budget])

  const filteredRecommended = useMemo(() => {
    if (!searchQuery) return recommended;
    return recommended.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [recommended, searchQuery])

  const grouped = useMemo(() => getProductsByCategory(filteredRecommended), [filteredRecommended])
  const hasData = !!skinType && !!budget

  const handleAdd = (product: Product) => {
    if (product.timeOfDay === "PM") {
      routine.addToEvening(product)
      addToast(`Đã thêm ${product.name} vào routine tối`, "success")
      return
    }
    if (product.timeOfDay === "AM") {
      routine.addToMorning(product)
      addToast(`Đã thêm ${product.name} vào routine sáng`, "success")
      return
    }
    const addedMorning = routine.addToMorning(product)
    if (addedMorning) {
      addToast(`Đã thêm ${product.name} vào routine sáng`, "success")
    } else {
      routine.addToEvening(product)
      addToast(`Đã thêm ${product.name} vào routine tối`, "success")
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-bg/90 backdrop-blur-sm border-b border-line">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-caption text-muted hover:text-fg transition-colors">
            ← Trang chủ
          </Link>
          <span className="text-body font-semibold">Kết quả</span>
          <Link href="/ingredients" className="text-caption text-muted hover:text-fg transition-colors">
            Thành phần
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-22 pb-12 space-y-10">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-40 bg-line/50 rounded-2xl animate-pulse"></div>
            <div className="h-64 bg-line/30 rounded-2xl animate-pulse"></div>
            <div className="h-64 bg-line/30 rounded-2xl animate-pulse"></div>
          </div>
        ) : !hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="py-20 text-center"
          >
            <div className="text-[3rem] mb-4">🧴</div>
            <p className="text-body text-muted mb-2">Bạn chưa hoàn thành quiz</p>
            <p className="text-caption text-muted mb-6">Trả lời vài câu hỏi để nhận gợi ý sản phẩm phù hợp.</p>
            <Link
              href="/quiz"
              className="text-body font-medium px-6 py-3 bg-fg text-bg rounded-xl hover:opacity-90 transition-opacity inline-flex items-center"
            >
              Làm quiz
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <UserSummaryCard />
            </motion.div>

            <section className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-title font-semibold">Sản phẩm gợi ý</h2>
                  <span className="text-caption text-muted">{filteredRecommended.length} sản phẩm</span>
                </div>
                <ExpandingSearchDock onSearch={setSearchQuery} placeholder="Tìm sản phẩm..." />
              </motion.div>

              <div className="space-y-6">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    <div className="text-body font-semibold text-muted">{CATEGORY_LABELS[category] || category}</div>
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-30px" }}
                      variants={stagger}
                      className="grid sm:grid-cols-2 gap-3"
                    >
                      {items.map((p) => {
                        const isInRoutine =
                          routine.morningRoutine.some((r) => r.id === p.id) ||
                          routine.eveningRoutine.some((r) => r.id === p.id)

                        return (
                          <motion.div key={p.id} variants={item}>
                            <ProductCard
                              product={p}
                              onAdd={handleAdd}
                              isInRoutine={isInRoutine}
                            />
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  </div>
                ))}
              </div>
            </section>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <RoutineBuilder />
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
