"use client"

import { ConflictWarning } from "@/types"

import { useUserStore } from "@/store/user-store"
import { AlertTriangle, Lock } from "lucide-react"

interface Props {
  warnings: ConflictWarning[]
  dismissedWarnings?: string[]
  onDismiss?: (warningId: string) => void
}

const SEV_LABEL: Record<string, string> = {
  high: "Nghiêm trọng",
  medium: "Trung bình",
  low: "Nhẹ",
}

export default function ConflictWarnings({ warnings, dismissedWarnings = [], onDismiss }: Props) {
  const plan = useUserStore(s => s.plan) || "free";
  const isPremium = plan === "premium";
  const visibleWarnings = warnings.filter(w => !dismissedWarnings.includes(w.items.sort().join("-")))

  if (visibleWarnings.length === 0) {
    return null;
  }

  if (!isPremium) {
    return (
      <div className="border border-[#EADFD2] rounded-2xl p-6 bg-[#FAF6F0] text-center space-y-4 shadow-soft">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-500">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-caption font-bold text-fg">Phát hiện xung đột hoạt chất ({visibleWarnings.length})</h4>
          <p className="text-[11px] text-muted leading-relaxed max-w-sm mx-auto font-medium">
            Có sự kết hợp hoạt chất dễ gây kích ứng hoặc làm mất tác dụng của nhau trong routine của bạn. Nâng cấp Premium để xem chi tiết các thành phần xung khắc và giải pháp xử lý.
          </p>
        </div>
        <button
          onClick={() => window.location.href = "/dashboard?tab=upgrade"}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-fg text-bg rounded-xl text-caption font-bold hover:opacity-90 transition-all shadow-sm"
        >
          <Lock size={12} /> Nâng cấp Premium
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-micro uppercase text-muted tracking-widest">Cảnh báo · {visibleWarnings.length}</p>

      {visibleWarnings.map((w, i) => {
        const warningId = w.items.sort().join("-");
        return (
          <div
            key={i}
            className={`border rounded-xl p-4 ${
              w.severity === "high"
                ? "border-danger/30 bg-danger/[0.03]"
                : w.severity === "medium"
                  ? "border-warning/30 bg-warning/[0.03]"
                  : "border-line"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-caption font-semibold ${
                    w.severity === "high"
                      ? "text-danger"
                      : w.severity === "medium"
                        ? "text-warning"
                        : "text-muted"
                  }`}
                >
                  {SEV_LABEL[w.severity]}
                </span>
                <span className="text-micro text-subtle">{w.type === "ingredient" ? "thành phần" : "kết cấu"}</span>
              </div>
              {onDismiss && (
                <button 
                  onClick={() => onDismiss(warningId)}
                  className="text-[10px] uppercase font-bold tracking-wider text-muted hover:text-fg transition-colors px-2 py-1 rounded bg-line/20 hover:bg-line/50"
                >
                  Bỏ qua
                </button>
              )}
            </div>
            <p className="text-body font-medium text-fg mb-0.5">{w.items.join(" + ")}</p>
            <p className="text-caption text-muted">{w.reason}</p>
            <p className="text-caption text-muted mt-2 pt-2 border-t border-line">Giải pháp: {w.solution}</p>
          </div>
        )
      })}
    </div>
  )
}
