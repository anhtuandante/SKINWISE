"use client"

import clsx from "clsx"
import type { ReactNode } from "react"

type Tone = "neutral" | "success" | "warning" | "danger" | "info"

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
}

const toneClass: Record<Tone, string> = {
  neutral: "bg-surface text-muted border-line",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  info: "bg-accent-light text-fg border-accent-light",
}

export default function Badge({ tone = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
