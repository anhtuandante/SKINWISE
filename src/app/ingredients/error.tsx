"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function IngredientsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Ingredients error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-[3rem] mb-4">🔬</div>
        <h2 className="text-title font-semibold mb-2">Không thể tải bách khoa thành phần</h2>
        <p className="text-body text-muted mb-6">
          Đã có lỗi khi tải dữ liệu thành phần. Vui lòng thử lại.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center font-medium rounded-xl px-5 py-2.5 bg-fg text-bg hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center font-medium rounded-xl px-5 py-2.5 border border-line text-fg hover:border-fg/70 bg-white transition-all"
          >
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
