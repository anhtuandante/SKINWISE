"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function ResultsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Results error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-[3rem] mb-4">📋</div>
        <h2 className="text-title font-semibold mb-2">Không thể tải kết quả</h2>
        <p className="text-body text-muted mb-6">
          Đã có lỗi khi hiển thị kết quả. Bạn có thể thử lại hoặc làm quiz lại.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center font-medium rounded-xl px-5 py-2.5 bg-fg text-bg hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Thử lại
          </button>
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center font-medium rounded-xl px-5 py-2.5 border border-line text-fg hover:border-fg/70 bg-white transition-all"
          >
            Làm quiz lại
          </Link>
        </div>
      </div>
    </div>
  )
}
