"use client"

import { ConflictWarning } from "@/types"

interface Props {
  warnings: ConflictWarning[]
}

const SEV_LABEL: Record<string, string> = {
  high: "Nghiêm trọng",
  medium: "Trung bình",
  low: "Nhẹ",
}

export default function ConflictWarnings({ warnings }: Props) {
  if (warnings.length === 0) {
    return (
      <div className="py-4 px-5 border border-line rounded-xl">
        <p className="text-body text-muted">Không có xung đột - routine tương thích tốt.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-micro uppercase text-muted tracking-widest">Cảnh báo · {warnings.length}</p>

      {warnings.map((w, i) => (
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
          <div className="flex items-center gap-2 mb-1.5">
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
          <p className="text-body font-medium text-fg mb-0.5">{w.items.join(" + ")}</p>
          <p className="text-caption text-muted">{w.reason}</p>
          <p className="text-caption text-muted mt-2 pt-2 border-t border-line">Giải pháp: {w.solution}</p>
        </div>
      ))}
    </div>
  )
}
