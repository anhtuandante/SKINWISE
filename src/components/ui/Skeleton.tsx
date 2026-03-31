"use client"

import clsx from "clsx"

interface SkeletonProps {
  className?: string
  variant?: "text" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
}

export default function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-gradient-to-r from-line via-surface to-line bg-[length:200%_100%]",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded",
        variant === "rectangular" && "rounded-xl",
        className,
      )}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx("border border-line rounded-xl p-5 bg-white space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  )
}
