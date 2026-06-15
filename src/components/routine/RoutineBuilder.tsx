"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { trackEvent } from "@/lib/tracking"
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
import { useSkinStore } from "@/store/useSkinStore"
import { Check } from "lucide-react"
import { useMemo } from "react"
import { checkConflicts, getMissingCategories } from "@/lib/conflict-checker"
import { formatPrice, calculateTotal } from "@/lib/quiz-logic"
import { CATEGORY_LABELS } from "@/lib/constants"
import ProductCard from "./ProductCard"
import ConflictWarnings from "./ConflictWarnings"

function SortableItem({ 
  product, 
  onRemove,
  isOwned,
  onToggleOwned,
  onUpdate,
  isPaused,
  onTogglePause
}: { 
  product: Product; 
  onRemove: (id: string) => void;
  isOwned: boolean;
  onToggleOwned: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Product>) => void;
  isPaused: boolean;
  onTogglePause: (id: string) => void;
}) {
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
        <ProductCard 
          product={product} 
          onRemove={onRemove} 
          compact 
          isOwned={isOwned}
          onToggleOwned={onToggleOwned}
          onUpdate={(updates) => onUpdate(product.id, updates)}
          isPaused={isPaused}
          onTogglePause={() => onTogglePause(product.id)}
        />
      </div>
    </div>
  )
}

function RoutineList({
  products,
  onRemove,
  onReorder,
  ownedProductIds = [],
  onToggleOwned,
  onUpdate,
  pausedProductIds = [],
  onTogglePause,
}: {
  products: Product[]
  onRemove: (id: string) => void
  onReorder: (p: Product[]) => void
  ownedProductIds: string[]
  onToggleOwned: (id: string) => void
  onUpdate: (id: string, updates: Partial<Product>) => void
  pausedProductIds: string[]
  onTogglePause: (id: string) => void
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
      
      const product = products[oldIndex];
      trackEvent("routine_reorder", {
        productId: product?.id,
        name: product?.name,
        oldIndex,
        newIndex
      });

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
                <SortableItem 
                  product={p} 
                  onRemove={onRemove} 
                  isOwned={ownedProductIds.includes(p.id)}
                  onToggleOwned={onToggleOwned}
                  onUpdate={onUpdate}
                  isPaused={pausedProductIds.includes(p.id)}
                  onTogglePause={onTogglePause}
                />
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
  const { diaryLogs, toggleRoutineCompleted } = useSkinStore()

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }, [])

  const todayLog = useMemo(() => {
    return diaryLogs.find((log) => log.date === todayStr)
  }, [diaryLogs, todayStr])

  const isCompleted = tab === "AM" ? !!todayLog?.amRoutineCompleted : !!todayLog?.pmRoutineCompleted

  const activeList = tab === "AM" ? store.morningRoutine : store.eveningRoutine
  const total = calculateTotal(activeList)
  const warnings = checkConflicts(activeList)
  const missing = getMissingCategories(activeList)

  const trackedConflictsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const activeKeys = new Set<string>();
    warnings.forEach((w) => {
      const itemA = w.items[0] || "unknown";
      const itemB = w.items[1] || "unknown";
      const key = `${tab}-${itemA}-${itemB}-${w.type}`;
      activeKeys.add(key);
      if (!trackedConflictsRef.current.has(key)) {
        trackEvent("conflict_detected", {
          tab,
          type: w.type,
          itemA,
          itemB,
          severity: w.severity,
          reason: w.reason
        });
        trackedConflictsRef.current.add(key);
      }
    });

    for (const key of Array.from(trackedConflictsRef.current)) {
      if (!activeKeys.has(key)) {
        trackedConflictsRef.current.delete(key);
      }
    }
  }, [warnings, tab]);

  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customCategory, setCustomCategory] = useState<Product["category"]>("serum");
  const [customTexture, setCustomTexture] = useState("water-based");
  const [customIngredients, setCustomIngredients] = useState<string[]>([]);
  const [customRawIngredients, setCustomRawIngredients] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleParseIngredients = () => {
    if (!customRawIngredients) return;
    const text = customRawIngredients.toLowerCase();
    const parsed: string[] = [];
    if (text.includes("niacinamide") || text.includes("vitamin b3")) parsed.push("niacinamide");
    if (text.includes("salicylic") || text.includes("bha")) parsed.push("bha");
    if (text.includes("glycolic") || text.includes("lactic") || text.includes("aha")) parsed.push("aha");
    if (text.includes("retinol") || text.includes("retinoid")) parsed.push("retinol");
    if (text.includes("ascorbic") || text.includes("vitamin c")) parsed.push("vitamin-c");
    if (text.includes("hyaluronic") || text.includes("sodium hyaluronate")) parsed.push("hyaluronic-acid");
    if (text.includes("centella") || text.includes("cica") || text.includes("madecassoside")) parsed.push("centella");
    if (text.includes("panthenol") || text.includes("vitamin b5")) parsed.push("panthenol");
    
    if (parsed.length > 0) {
      setCustomIngredients(Array.from(new Set([...customIngredients, ...parsed])));
      addToast(`Đã nhận diện ${parsed.length} hoạt chất chính!`, "success");
    } else {
      addToast(`Không nhận diện được hoạt chất chính quen thuộc nào.`, "info");
    }
  }

  const handleRemove = (id: string) => {
    const product = activeList.find((p) => p.id === id)
    if (tab === "AM") store.removeFromMorning(id)
    else store.removeFromEvening(id)
    if (product) {
      addToast(`Đã xóa ${product.name}`, "info")
    }
  }

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customBrand) return;

    const newProd: Product = {
      id: `custom-product-${Date.now()}`,
      name: customName,
      brand: customBrand,
      price: 0,
      type: "skincare",
      category: customCategory,
      skinTypes: ["all"],
      concerns: [],
      texture: customTexture,
      size: "unknown",
      ingredients: customIngredients,
      isSiliconeBased: customTexture === "silicone-based",
      isWaterBased: customTexture === "water-based",
      shopeeUrl: "",
    };

    let success = false;
    if (tab === "AM") {
      success = store.addToMorning(newProd);
    } else {
      success = store.addToEvening(newProd);
    }

    if (success) {
      addToast(`Đã thêm ${customName} vào routine ${tab}!`, "success");
      setCustomName("");
      setCustomBrand("");
      setCustomIngredients([]);
      setCustomRawIngredients("");
      setShowAddCustomModal(false);
    } else {
      addToast("Không thể thêm. Giới hạn tối đa 8 sản phẩm hoặc sản phẩm đã tồn tại.", "error");
    }
  };

  return (
    <section className="border border-line rounded-2xl p-6 bg-white space-y-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 w-full sm:w-auto items-center flex-wrap">
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
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-3 py-1.5 border border-dashed border-fg/30 hover:border-fg/60 rounded-lg text-caption font-bold text-fg hover:bg-fg/[0.02] transition-all flex items-center gap-1 select-none"
          >
            <span>+</span> Tự thêm sản phẩm
          </button>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-3 py-1.5 border border-line hover:border-fg/50 rounded-lg text-caption font-bold text-muted hover:text-fg transition-all flex items-center gap-1 select-none"
          >
            Lịch sử
          </button>
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
          {activeList.length > 0 && (
            <div className="mb-4 flex items-center justify-between p-3.5 border border-line rounded-xl bg-surface/30">
              <span className="text-caption text-muted font-medium">
                {isCompleted 
                  ? `Bạn đã thoa chu trình ${tab === "AM" ? "Sáng 🌅" : "Tối 🌙"} hôm nay!` 
                  : `Bạn đã thoa xong chu trình ${tab === "AM" ? "Sáng 🌅" : "Tối 🌙"} chưa?`}
              </span>
              <button
                onClick={() => {
                  toggleRoutineCompleted(todayStr, tab);
                  const completed = !isCompleted;
                  addToast(completed ? `Đã xong chu trình ${tab === "AM" ? "sáng" : "tối"}! ✨` : `Đã hủy chu trình ${tab === "AM" ? "sáng" : "tối"}.`, "success");
                  trackEvent("routine_completed_toggle", { period: tab, completed });
                }}
                className={`px-3 py-1.5 rounded-lg text-caption font-bold transition-all flex items-center gap-1.5 select-none ${
                  isCompleted 
                    ? "bg-success/15 text-success hover:bg-success/20 border border-success/20" 
                    : "bg-fg text-bg hover:opacity-90"
                }`}
              >
                {isCompleted ? (
                  <>
                    <Check size={12} className="stroke-[3px]" />
                    Đã xong
                  </>
                ) : (
                  "Đánh dấu xong"
                )}
              </button>
            </div>
          )}

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
              ownedProductIds={store.ownedProductIds || []}
              onToggleOwned={store.toggleProductOwned}
              onUpdate={(id, updates) => tab === "AM" ? store.updateMorningProduct(id, updates) : store.updateEveningProduct(id, updates)}
              pausedProductIds={store.pausedProductIds || []}
              onTogglePause={store.togglePauseProduct}
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

      <ConflictWarnings 
        warnings={warnings} 
        dismissedWarnings={store.dismissedWarnings}
        onDismiss={store.dismissWarning}
      />

      {/* Custom Product Add Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-bg border border-line rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in">
            <div>
              <h3 className="text-body font-bold text-fg">Thêm sản phẩm của bạn</h3>
              <p className="text-caption text-muted">Tự thêm các sản phẩm đang dùng ở nhà để AI kiểm tra xung khắc thành phần.</p>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-micro font-bold text-muted uppercase tracking-wider block">Tên sản phẩm</label>
                <input
                  type="text" required placeholder="Ví dụ: Retinol 1% Cream..."
                  value={customName} onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-caption text-fg outline-none focus:border-fg transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-micro font-bold text-muted uppercase tracking-wider block">Thương hiệu</label>
                <input
                  type="text" required placeholder="Ví dụ: The Ordinary, Obagi..."
                  value={customBrand} onChange={(e) => setCustomBrand(e.target.value)}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-caption text-fg outline-none focus:border-fg transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-micro font-bold text-muted uppercase tracking-wider block">Loại sản phẩm</label>
                  <select
                    value={customCategory} onChange={(e) => setCustomCategory(e.target.value as Product["category"])}
                    className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-caption text-fg outline-none focus:border-fg transition-all font-medium"
                  >
                    <option value="cleanser">Sữa rửa mặt</option>
                    <option value="toner">Nước hoa hồng (Toner)</option>
                    <option value="serum">Tinh chất (Serum)</option>
                    <option value="moisturizer">Kem dưỡng ẩm</option>
                    <option value="sunscreen">Kem chống nắng</option>
                    <option value="exfoliant">Tẩy da chết (BHA/AHA)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-micro font-bold text-muted uppercase tracking-wider block">Kết cấu nền</label>
                  <select
                    value={customTexture} onChange={(e) => setCustomTexture(e.target.value)}
                    className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-caption text-fg outline-none focus:border-fg transition-all font-medium"
                  >
                    <option value="water-based">Gốc nước (Water-based)</option>
                    <option value="silicone-based">Gốc Silicone</option>
                    <option value="cream">Kem đặc (Cream)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-micro font-bold text-muted uppercase tracking-wider block">
                  Phân tích bảng thành phần (Tùy chọn)
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="Dán bảng thành phần (Ingredients list) vào đây..."
                    value={customRawIngredients}
                    onChange={(e) => setCustomRawIngredients(e.target.value)}
                    className="flex-1 bg-surface border border-line rounded-xl px-3 py-2 text-caption text-fg outline-none focus:border-fg transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleParseIngredients}
                    className="px-4 py-2 bg-fg text-bg rounded-xl text-caption font-bold hover:opacity-90 transition-all shrink-0"
                  >
                    Quét
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-micro font-bold text-muted uppercase tracking-wider block">
                  Hoặc chọn thủ công Hoạt chất chính
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 border border-line rounded-xl bg-surface/50 max-h-24 overflow-y-auto">
                  {([
                    { id: "bha", label: "Salicylic Acid (BHA)" },
                    { id: "aha", label: "Glycolic/Lactic (AHA)" },
                    { id: "retinol", label: "Retinol / Retinoids" },
                    { id: "niacinamide", label: "Niacinamide (B3)" },
                    { id: "vitamin-c", label: "Vitamin C" },
                    { id: "hyaluronic-acid", label: "Hyaluronic Acid (HA)" },
                    { id: "centella", label: "Rau má (Centella)" },
                    { id: "panthenol", label: "Vitamin B5 (Panthenol)" },
                  ]).map((act) => {
                    const active = customIngredients.includes(act.id);
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setCustomIngredients(prev =>
                            prev.includes(act.id) ? prev.filter(x => x !== act.id) : [...prev, act.id]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                          active ? "bg-fg text-bg border-fg" : "bg-white text-muted border-line hover:border-fg/30"
                        }`}
                      >
                        {act.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="flex-1 py-2.5 border border-line hover:bg-surface rounded-xl text-caption font-bold text-fg transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-fg text-bg hover:opacity-90 rounded-xl text-caption font-bold transition-all"
                >
                  Thêm vào routine {tab}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routine History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-bg border border-line rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[80vh] animate-in">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-body font-bold text-fg">Lịch sử Routine</h3>
                <p className="text-caption text-muted">Lưu và phục hồi các phiên bản routine trước đó.</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-muted hover:text-fg font-bold px-2 py-1">Đóng</button>
            </div>

            <div className="mb-4">
              <button
                onClick={() => {
                  const name = prompt("Nhập tên phiên bản (ví dụ: Routine mùa hè):");
                  if (name) {
                    store.saveRoutineVersion(name);
                    addToast(`Đã lưu phiên bản: ${name}`, "success");
                  }
                }}
                className="w-full px-4 py-2 bg-surface border border-line rounded-xl text-caption font-bold text-fg hover:border-fg transition-all"
              >
                + Lưu routine hiện tại
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {store.routineVersions.length === 0 ? (
                <div className="text-center text-caption text-muted py-8">
                  Chưa có phiên bản nào được lưu.
                </div>
              ) : (
                store.routineVersions.map((v) => (
                  <div key={v.id} className="p-4 border border-line rounded-xl bg-surface/30 flex justify-between items-center group">
                    <div>
                      <div className="text-body font-bold text-fg mb-1">{v.name}</div>
                      <div className="text-micro text-muted">
                        Ngày lưu: {new Date(v.date).toLocaleDateString("vi-VN")} · {v.morningRoutine.length} Sáng, {v.eveningRoutine.length} Tối
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn phục hồi phiên bản "${v.name}"? Routine hiện tại sẽ bị ghi đè.`)) {
                            store.restoreRoutineVersion(v.id);
                            addToast(`Đã phục hồi phiên bản: ${v.name}`, "success");
                            setShowHistoryModal(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-fg text-bg rounded-lg text-caption font-bold hover:opacity-90 transition-all"
                      >
                        Khôi phục
                      </button>
                      <button
                        onClick={() => store.deleteRoutineVersion(v.id)}
                        className="px-2 py-1.5 text-danger border border-danger/20 hover:bg-danger/10 rounded-lg text-caption font-bold transition-all"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
