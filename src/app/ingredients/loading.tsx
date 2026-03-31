"use client"

export default function IngredientsLoading() {
  return (
    <div className="min-h-screen bg-bg px-6 py-12">
      <div className="max-w-screen-lg mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-64 bg-line rounded" />
        <div className="h-12 w-full bg-line rounded-xl" />
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-line rounded-xl p-4 bg-white space-y-3">
              <div className="h-4 w-32 bg-line rounded" />
              <div className="h-3 w-24 bg-line rounded" />
              <div className="h-3 w-full bg-line rounded" />
              <div className="h-3 w-5/6 bg-line rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
