"use client"

export default function ResultsLoading() {
  return (
    <div className="min-h-screen bg-bg px-6 pt-20">
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-5 w-24 bg-line rounded" />
        <div className="h-24 bg-white border border-line rounded-2xl" />
        <div className="h-6 w-40 bg-line rounded" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-line rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-white border border-line rounded-2xl" />
      </div>
    </div>
  )
}
