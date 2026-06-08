"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Product } from "@/types"
import { useRoutineStore } from "@/store/routine-store"
import { useToastStore } from "@/store/toast-store"
import { checkConflicts, getMissingCategories } from "@/lib/conflict-checker"
import { formatPrice, calculateTotal } from "@/lib/quiz-logic"
import { CATEGORY_LABELS } from "@/lib/constants"
import ProductCard from "./ProductCard"
import ConflictWarnings from "./ConflictWarnings"

function SortableItem({ product, onRemove }: { product: Product; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Kéo để sắp xếp"
      >
        ⋮⋮
      </button>
      <div className="flex-1">
        <ProductCard product={product} onRemove={onRemove} compact />
      </div>
    </div>
  )
}

function RoutineList({
  products,
  onRemove,
  onReorder,
}: {
  products: Product[]
  onRemove: (id: string) => void
  onReorder: (p: Product[]) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id)
      const newIndex = products.findIndex((p) => p.id === over.id)
      onReorder(arrayMove(products, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-line">
          <AnimatePresence>
            {products.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SortableItem product={p} onRemove={onRemove} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default function RoutineBuilder() {
  const [tab, setTab] = useState<"AM" | "PM">("AM")
  const store = useRoutineStore()
  const addToast = useToastStore((s) => s.addToast)

  const activeList = tab === "AM" ? store.morningRoutine : store.eveningRoutine
  const total = calculateTotal(activeList)
  const warnings = checkConflicts(activeList)
  const missing = getMissingCategories(activeList)

  const handleRemove = (id: string) => {
    const product = activeList.find((p) => p.id === id)
    if (tab === "AM") store.removeFromMorning(id)
    else store.removeFromEvening(id)
    if (product) {
      addToast(`Đã xóa ${product.name}`, "info")
    }
  }

  return (
    <section className="border border-line rounded-2xl p-6 bg-white space-y-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          {["AM", "PM"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as "AM" | "PM")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-body font-medium transition-all relative ${
                tab === t ? "bg-fg text-bg" : "border border-line text-muted hover:border-fg/50"
              }`}
            >
              Routine {t}
              {(t === "AM" ? store.morningRoutine : store.eveningRoutine).length > 0 && (
                <span className={`ml-1.5 text-[10px] ${tab === t ? "opacity-60" : "text-muted"}`}>
                  ({(t === "AM" ? store.morningRoutine : store.eveningRoutine).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="text-caption text-muted">Tổng: {formatPrice(total)}</div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeList.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-[2rem] mb-2">{tab === "AM" ? "🌅" : "🌙"}</div>
              <div className="text-body text-muted">
                Chưa có sản phẩm nào trong routine {tab === "AM" ? "sáng" : "tối"}.
              </div>
              <div className="text-caption text-muted mt-1">Thêm từ danh sách gợi ý ở trên.</div>
            </div>
          ) : (
            <RoutineList
              products={activeList}
              onRemove={handleRemove}
              onReorder={(items) => (tab === "AM" ? store.reorderMorning(items) : store.reorderEvening(items))}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {missing.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-caption text-warning"
        >
          Thiếu: {missing.map((c) => CATEGORY_LABELS[c] || c).join(", ")}. Thêm đủ cleanser + moisturizer để routine cân
          bằng.
        </motion.div>
      )}

      <ConflictWarnings warnings={warnings} />
    </section>
  )
}
