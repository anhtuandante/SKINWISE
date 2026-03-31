"use client"

import clsx from "clsx"
import type { ReactNode } from "react"

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return <div className={clsx("border border-line rounded-2xl bg-white shadow-soft", className)}>{children}</div>
}

export function CardSection({ children, className }: CardProps) {
  return <div className={clsx("px-5 py-4", className)}>{children}</div>
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="text-body font-semibold text-fg">{children}</div>
}

export function CardMuted({ children }: { children: ReactNode }) {
  return <div className="text-caption text-muted">{children}</div>
}
