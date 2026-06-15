"use client"

import { ConflictWarning } from "@/types"

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
  const visibleWarnings = warnings.filter(w => !dismissedWarnings.includes(w.items.sort().join("-")))

  if (visibleWarnings.length === 0) {
    return null;
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
