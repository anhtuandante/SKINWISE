"use client"

import Link from "next/link"
import clsx from "clsx"
import type { ReactNode } from "react"

type Variant = "primary" | "outline" | "ghost"
type Size = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  href?: string
  children: ReactNode
}

const base =
  "inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fg focus-visible:ring-offset-bg"

const variantClass: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:opacity-90",
  outline: "border border-line text-fg hover:border-fg/70 bg-white",
  ghost: "text-muted hover:text-fg",
}

const sizeClass: Record<Size, string> = {
  sm: "text-caption px-3 py-1.5",
  md: "text-body px-4 py-2.5",
  lg: "text-body px-6 py-3.5",
}

export default function Button({ variant = "primary", size = "md", href, className, children, ...props }: ButtonProps) {
  const classes = clsx(base, variantClass[variant], sizeClass[size], className)

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
