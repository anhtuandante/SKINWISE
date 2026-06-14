"use client"

import Link from "next/link"
import { useUserStore } from "@/store/user-store"
import { SKIN_LABELS, CONCERN_LABELS, BUDGET_LABELS } from "@/lib/constants"

export default function UserSummaryCard() {
  const { skinType, concerns, budget, totalBudget, allergies } = useUserStore()

  return (
    <div className="border border-line rounded-xl divide-y divide-line bg-white">
      <div className="px-5 py-3 flex items-center justify-between">
        <span className="text-micro uppercase text-muted tracking-widest">Hồ sơ da</span>
        <Link href="/quiz" className="text-caption text-muted hover:text-fg transition-colors">
          Sửa
        </Link>
      </div>
      <div className="px-5 py-3.5 grid grid-cols-2 gap-4">
        <div>
          <div className="text-caption text-muted">Loại da</div>
          <div className="text-body font-medium mt-0.5">{SKIN_LABELS[skinType] || "-"}</div>
        </div>
        <div>
          <div className="text-caption text-muted">Ngân sách</div>
          <div className="text-body font-medium mt-0.5">
            {totalBudget ? `${totalBudget.toLocaleString()}đ` : (BUDGET_LABELS[budget] || "-")}
          </div>
        </div>
      </div>
      <div className="px-5 py-3.5">
        <div className="text-caption text-muted mb-1.5">Vấn đề da</div>
        <div className="text-body font-medium">
          {concerns.map((c) => CONCERN_LABELS[c]).filter(Boolean).join(", ") || "-"}
        </div>
      </div>
      {allergies && (
        <div className="px-5 py-3.5">
          <div className="text-caption text-muted">Dị ứng</div>
          <div className="text-body mt-0.5">{allergies}</div>
        </div>
      )}
    </div>
  )
}
