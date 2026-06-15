"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Product } from "@/types"
import { formatPrice } from "@/lib/quiz-logic"
import { CATEGORY_LABELS } from "@/lib/constants"
import { useUserStore } from "@/store/user-store"
import { Sparkles, CheckCircle2, ChevronUp, Edit3 } from "lucide-react"
import { calculateMatchScore } from "@/lib/recommendation-engine"
import { useMemo, useState } from "react"
import ProductAvatar from "@/components/ui/ProductAvatar"
import { trackEvent } from "@/lib/tracking"

interface ProductCardProps {
  product: Product
  onAdd?: (product: Product) => void
  onRemove?: (productId: string) => void
  isInRoutine?: boolean
  compact?: boolean
  isOwned?: boolean
  onToggleOwned?: (productId: string) => void
  onUpdate?: (updates: Partial<Product>) => void
  isPaused?: boolean
  onTogglePause?: (productId: string) => void
}

export default function ProductCard({ 
  product, 
  onAdd, 
  onRemove, 
  isInRoutine, 
  compact,
  isOwned = false,
  onToggleOwned,
  onUpdate,
  isPaused = false,
  onTogglePause
}: ProductCardProps) {
  const profile = useUserStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const matchResult = useMemo(() => {
    if (compact || !profile.skinType) return null;
    return calculateMatchScore(product, profile);
  }, [product, profile, compact])

  if (compact) {
    return (
      <div className="flex flex-col w-full border-b border-line last:border-0">
        <div className="flex items-center justify-between py-3 gap-3">
        <ProductAvatar brand={product.brand} name={product.name} className="w-10 h-10" />
        <div className={`flex-1 min-w-0 ${isPaused ? "opacity-50" : ""}`}>
          <div className="text-body font-medium text-fg truncate flex items-center gap-2">
            {product.name}
            {isPaused && <span className="text-[9px] bg-warning/20 text-warning px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Tạm ngưng</span>}
          </div>
          <div className="text-caption text-muted">
            {product.brand} · {formatPrice(product.price)}
          </div>
        </div>
        
        {onToggleOwned && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleOwned(product.id);
            }}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all shrink-0 select-none ${
              isOwned
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:border-amber-500/40"
            } ${isPaused ? "opacity-50" : ""}`}
          >
            {isOwned ? "Đang có ✓" : "Cần mua 🛒"}
          </button>
        )}

        {onTogglePause && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePause(product.id);
            }}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all shrink-0 select-none ${
              isPaused
                ? "bg-warning/20 text-warning border-warning/30"
                : "bg-surface border-line text-muted hover:border-fg/30 hover:text-fg"
            }`}
            title={isPaused ? "Tiếp tục dùng" : "Tạm ngưng dùng"}
          >
            {isPaused ? "Tiếp tục" : "Tạm ngưng"}
          </button>
        )}

        {onRemove && (
          <div className="flex flex-col items-end gap-2 ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-caption text-muted hover:text-fg transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} /> : <Edit3 size={16} />}
            </button>
            <button
              onClick={() => {
                trackEvent("remove_from_routine", { productId: product.id, name: product.name });
                onRemove(product.id);
              }}
              className="text-caption text-muted hover:text-danger transition-colors"
            >
              Xóa
            </button>
          </div>
        )}
      </div>
      
      {/* Expanded Details Area for Routine Builder */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line/50"
          >
            <div className="py-3 px-2 grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface/30 rounded-b-xl text-[11px]">
              {/* Note & Dosage */}
              <div className="space-y-2">
                <div>
                  <label className="text-muted font-bold block mb-1">Ghi chú cá nhân</label>
                  <input 
                    type="text" 
                    placeholder="Vd: Dùng kèm kem phục hồi..."
                    value={product.userNotes || ""}
                    onChange={(e) => onUpdate?.({ userNotes: e.target.value })}
                    className="w-full bg-white border border-line rounded px-2 py-1 outline-none focus:border-fg"
                  />
                </div>
                <div>
                  <label className="text-muted font-bold block mb-1">Liều lượng</label>
                  <input 
                    type="text" 
                    placeholder="Vd: 2 giọt, 1 lóng tay..."
                    value={product.dosage || ""}
                    onChange={(e) => onUpdate?.({ dosage: e.target.value })}
                    className="w-full bg-white border border-line rounded px-2 py-1 outline-none focus:border-fg"
                  />
                </div>
                <div>
                  <label className="text-muted font-bold block mb-1">Giá thực tế mua (VNĐ)</label>
                  <input 
                    type="number" 
                    placeholder="Giá thực mua..."
                    value={product.customPrice || product.price}
                    onChange={(e) => onUpdate?.({ customPrice: Number(e.target.value) })}
                    className="w-full bg-white border border-line rounded px-2 py-1 outline-none focus:border-fg"
                  />
                </div>
              </div>
              
              {/* Inventory Tracking */}
              <div className="space-y-2">
                <div>
                  <label className="text-muted font-bold block mb-1">Lịch dùng trong tuần</label>
                  <div className="flex gap-1">
                    {["T2","T3","T4","T5","T6","T7","CN"].map((d, i) => {
                      const dayVal = i === 6 ? 0 : i + 1;
                      const active = product.daysOfWeek ? product.daysOfWeek.includes(dayVal) : true;
                      return (
                        <button 
                          key={d}
                          onClick={() => {
                            const current = product.daysOfWeek || [0,1,2,3,4,5,6];
                            const next = active ? current.filter(x => x !== dayVal) : [...current, dayVal];
                            onUpdate?.({ daysOfWeek: next });
                          }}
                          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[9px] ${active ? "bg-fg text-bg" : "bg-line/30 text-muted"}`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-muted font-bold block mb-1">Ngày hết hạn (HSD)</label>
                  <input 
                    type="date" 
                    value={product.expiryDate || ""}
                    onChange={(e) => onUpdate?.({ expiryDate: e.target.value })}
                    className="w-full bg-white border border-line rounded px-2 py-1 outline-none focus:border-fg"
                  />
                </div>
                <div>
                  <label className="text-muted font-bold block mb-1">Lượng còn lại ({product.volumeRemaining ?? 100}%)</label>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={product.volumeRemaining ?? 100}
                    onChange={(e) => onUpdate?.({ volumeRemaining: Number(e.target.value) })}
                    className="w-full accent-fg"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => trackEvent("product_click", { productId: product.id, name: product.name, brand: product.brand })}
      className="border border-line rounded-2xl p-6 hover:border-fg/20 transition-all group bg-white relative overflow-hidden flex flex-col h-full cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4 mb-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <ProductAvatar brand={product.brand} name={product.name} className="w-12 h-12" />
          <div className="flex-1 min-w-0">
            <div className="text-body font-bold text-fg group-hover:text-fg transition-colors truncate">{product.name}</div>
            <div className="text-caption text-muted font-medium opacity-80 truncate">{product.brand}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-caption text-fg font-bold bg-line/10 px-3 py-1 rounded-full whitespace-nowrap">{formatPrice(product.price)}</span>
          {onToggleOwned && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleOwned(product.id);
              }}
              className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all select-none ${
                isOwned
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}
            >
              {isOwned ? "Đang có" : "Cần mua"}
            </button>
          )}
        </div>
      </div>

      {/* AI Compatibility Badge - Premium Style */}
      {matchResult && (
        <div className="mb-5 flex-1" onClick={(e) => e.stopPropagation()}>
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 bg-gradient-to-br from-fg/[0.03] to-transparent border-l-2 border-fg rounded-r-xl"
          >
            <div className="flex items-center gap-2 mb-3 border-b border-line/50 pb-2">
              <Sparkles size={14} className="text-fg" />
              <span className="text-[12px] font-extrabold text-fg tracking-tight">AI MATCH {matchResult.score}%</span>
            </div>
            <ul className="space-y-2">
              {matchResult.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="text-success shrink-0 mt-0.5" />
                  <span className="text-[12px] text-muted leading-relaxed font-medium">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}

      <div className="text-caption text-muted flex flex-wrap items-center gap-2 mb-2 mt-auto" onClick={(e) => e.stopPropagation()}>
        <span className="px-2 py-1 rounded-md bg-surface border border-line whitespace-nowrap">
          {CATEGORY_LABELS[product.category] || product.category}
        </span>
        <span className="px-2 py-1 rounded-md bg-surface border border-line whitespace-nowrap">{product.texture}</span>
        {product.spf && (
          <span className="px-2 py-1 rounded-md bg-surface border border-line whitespace-nowrap">SPF {product.spf}</span>
        )}
      </div>

      <div className="text-caption text-muted line-clamp-2 mb-4" onClick={(e) => e.stopPropagation()}>
        Phù hợp: {product.skinTypes.join(", ")}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-line/50" onClick={(e) => e.stopPropagation()}>
        <a
          href={`${product.shopeeUrl}${product.shopeeUrl.includes('?') ? '&' : '?'}utm_source=affiliate&utm_medium=skincare_app&utm_campaign=skinwise_workspace`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("shopee_click", { productId: product.id, name: product.name, brand: product.brand, category: product.category, price: product.price })}
          className="text-caption font-bold text-[#EE4D2D] hover:bg-[#EE4D2D]/10 border border-[#EE4D2D]/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          Mua Shopee 🛒
        </a>

        {onRemove ? (
          <button
            onClick={() => {
              trackEvent("remove_from_routine", { productId: product.id, name: product.name });
              onRemove(product.id);
            }}
            className="text-caption text-danger hover:underline transition-colors"
          >
            Xóa
          </button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              trackEvent("add_to_routine", { productId: product.id, name: product.name, brand: product.brand, category: product.category });
              onAdd?.(product);
            }}
            disabled={isInRoutine}
            className="text-caption font-medium px-4 py-2 rounded-lg bg-fg text-bg hover:opacity-90 disabled:opacity-30 transition-all whitespace-nowrap"
          >
            {isInRoutine ? "Đã thêm ✓" : "Thêm vào routine"}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
