"use client"

export default function QuizLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto px-6 pt-20 space-y-4 animate-pulse">
        <div className="h-5 w-24 bg-line rounded" />
        <div className="h-8 w-64 bg-line rounded" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white border border-line rounded-xl" />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 bg-line rounded" />
          <div className="h-10 w-28 bg-line rounded-xl" />
        </div>
      </div>
    </div>
  )
}
