"use client"

import { motion } from "framer-motion"
import { Product } from "@/types"
import { formatPrice } from "@/lib/quiz-logic"
import { CATEGORY_LABELS } from "@/lib/constants"
import { useUserStore } from "@/store/user-store"
import { Sparkles, CheckCircle2 } from "lucide-react"
import { calculateMatchScore } from "@/lib/recommendation-engine"
import { useMemo } from "react"

interface ProductCardProps {
  product: Product
  onAdd?: (product: Product) => void
  onRemove?: (productId: string) => void
  isInRoutine?: boolean
  compact?: boolean
}

export default function ProductCard({ product, onAdd, onRemove, isInRoutine, compact }: ProductCardProps) {
  const profile = useUserStore()

  const matchResult = useMemo(() => {
    if (compact || !profile.skinType) return null;
    return calculateMatchScore(product, profile);
  }, [product, profile, compact])

  if (compact) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
        <div className="flex-1 min-w-0">
          <div className="text-body font-medium text-fg truncate">{product.name}</div>
          <div className="text-caption text-muted">
            {product.brand} · {formatPrice(product.price)}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={() => onRemove(product.id)}
            className="text-caption text-muted hover:text-danger transition-colors ml-3"
          >
            Xóa
          </button>
        )}
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="border border-line rounded-2xl p-6 hover:border-fg/20 transition-all group bg-white relative overflow-hidden flex flex-col h-full"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="text-body font-bold text-fg group-hover:text-fg transition-colors">{product.name}</div>
          <div className="text-caption text-muted font-medium opacity-80">{product.brand}</div>
        </div>
        <span className="text-caption text-fg font-bold bg-line/10 px-3 py-1 rounded-full whitespace-nowrap">{formatPrice(product.price)}</span>
      </div>

      {/* AI Compatibility Badge - Premium Style */}
      {matchResult && (
        <div className="mb-5 flex-1">
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

      <div className="text-caption text-muted flex flex-wrap items-center gap-2 mb-2 mt-auto">
        <span className="px-2 py-1 rounded-md bg-surface border border-line whitespace-nowrap">
          {CATEGORY_LABELS[product.category] || product.category}
        </span>
        <span className="px-2 py-1 rounded-md bg-surface border border-line whitespace-nowrap">{product.texture}</span>
        {product.spf && (
          <span className="px-2 py-1 rounded-md bg-surface border border-line whitespace-nowrap">SPF {product.spf}</span>
        )}
      </div>

      <div className="text-caption text-muted line-clamp-2 mb-4">
        Phù hợp: {product.skinTypes.join(", ")}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-line/50">
        <a
          href={`${product.shopeeUrl}${product.shopeeUrl.includes('?') ? '&' : '?'}utm_source=affiliate&utm_medium=skincare_app&utm_campaign=skinwise_workspace`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption font-bold text-[#EE4D2D] hover:bg-[#EE4D2D]/10 border border-[#EE4D2D]/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          Mua Shopee 🛒
        </a>

        {onRemove ? (
          <button
            onClick={() => onRemove(product.id)}
            className="text-caption text-danger hover:underline transition-colors"
          >
            Xóa
          </button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onAdd?.(product)}
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
