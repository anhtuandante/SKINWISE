"use client"

import { motion } from "framer-motion"
import { Product } from "@/types"
import { formatPrice } from "@/lib/quiz-logic"
import { CATEGORY_LABELS } from "@/lib/constants"

interface ProductCardProps {
  product: Product
  onAdd?: (product: Product) => void
  onRemove?: (productId: string) => void
  isInRoutine?: boolean
  compact?: boolean
}

export default function ProductCard({ product, onAdd, onRemove, isInRoutine, compact }: ProductCardProps) {
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
      whileHover={{ y: -2, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
      transition={{ duration: 0.2 }}
      className="border border-line rounded-xl p-5 hover:border-muted/40 transition-colors group bg-white"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-body font-semibold text-fg">{product.name}</div>
          <div className="text-caption text-muted">{product.brand}</div>
        </div>
        <span className="text-caption text-muted font-medium">{formatPrice(product.price)}</span>
      </div>

      <div className="text-caption text-muted flex items-center gap-2 mb-2">
        <span className="px-2 py-1 rounded-md bg-surface border border-line">
          {CATEGORY_LABELS[product.category] || product.category}
        </span>
        <span className="px-2 py-1 rounded-md bg-surface border border-line">{product.texture}</span>
        {product.spf && (
          <span className="px-2 py-1 rounded-md bg-surface border border-line">SPF {product.spf}</span>
        )}
      </div>

      <div className="text-caption text-muted line-clamp-2 mb-3">
        Phù hợp: {product.skinTypes.join(", ")} · {product.concerns.join(", ")}
      </div>

      <div className="flex items-center justify-between">
        <a
          href={product.shopeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-muted hover:text-fg transition-colors"
        >
          Shopee ↗
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
            className="text-caption font-medium px-4 py-2 rounded-lg bg-fg text-bg hover:opacity-90 disabled:opacity-30 transition-all"
          >
            {isInRoutine ? "Đã thêm ✓" : "Thêm vào routine"}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
