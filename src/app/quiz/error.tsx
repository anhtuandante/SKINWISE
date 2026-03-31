"use client"

import { useEffect } from "react"

export default function QuizError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Quiz error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-[3rem] mb-4">🧪</div>
        <h2 className="text-title font-semibold mb-2">Không thể tải quiz</h2>
        <p className="text-body text-muted mb-6">
          Đã có lỗi khi tải trang quiz. Vui lòng thử lại.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center font-medium rounded-xl px-6 py-3 bg-fg text-bg hover:opacity-90 transition-all active:scale-[0.98]"
        >
          Thử lại
        </button>
      </div>
    </div>
  )
}
