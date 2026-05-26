"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { useJournalStore } from "@/store/journal-store";

export default function TreatmentCalendarPanel() {
  const user = useUserStore();
  const { recoveryMode } = useJournalStore();

  const treatmentCalendar = useMemo(() => {
    if (recoveryMode) {
      return [
        { day: "T2", focus: "Phục hồi", type: "recovery" },
        { day: "T3", focus: "Phục hồi", type: "recovery" },
        { day: "T4", focus: "Nghỉ ngơi", type: "rest" },
        { day: "T5", focus: "Phục hồi", type: "recovery" },
        { day: "T6", focus: "Phục hồi", type: "recovery" },
        { day: "T7", focus: "Dưỡng ẩm", type: "rest" },
        { day: "CN", focus: "Nghỉ ngơi", type: "rest" }
      ];
    }
    
    if (user.concerns?.includes("acne")) {
      return [
        { day: "T2", focus: "BHA tẩy tế bào chết", type: "treatment" },
        { day: "T3", focus: "Phục hồi làm dịu", type: "recovery" },
        { day: "T4", focus: "Dưỡng ẩm nhẹ", type: "rest" },
        { day: "T5", focus: "Serum mụn chuyên sâu", type: "treatment" },
        { day: "T6", focus: "Phục hồi da", type: "recovery" },
        { day: "T7", focus: "Mặt nạ đất sét", type: "treatment" },
        { day: "CN", focus: "Nghỉ ngơi dưỡng da", type: "rest" }
      ];
    }
    if (user.concerns?.includes("aging")) {
      return [
        { day: "T2", focus: "Retinol trẻ hóa", type: "treatment" },
        { day: "T3", focus: "Cấp ẩm căng bóng", type: "recovery" },
        { day: "T4", focus: "Nghỉ ngơi dưỡng ẩm", type: "rest" },
        { day: "T5", focus: "Retinol trẻ hóa", type: "treatment" },
        { day: "T6", focus: "Đắp mặt nạ Peptide", type: "recovery" },
        { day: "T7", focus: "Tẩy tế bào chết AHA", type: "treatment" },
        { day: "CN", focus: "Nghỉ ngơi", type: "rest" }
      ];
    }
    return [
      { day: "T2", focus: "Cấp ẩm sâu HA", type: "recovery" },
      { day: "T3", focus: "Tẩy da chết dịu nhẹ", type: "treatment" },
      { day: "T4", focus: "Nghỉ dưỡng", type: "rest" },
      { day: "T5", focus: "Phục hồi B5", type: "recovery" },
      { day: "T6", focus: "Sáng da Vitamin C", type: "treatment" },
      { day: "T7", focus: "Cấp nước chuyên sâu", type: "recovery" },
      { day: "CN", focus: "Nghỉ ngơi", type: "rest" }
    ];
  }, [recoveryMode, user.concerns]);

  if (!user.quizCompleted) return null;

  return (
    <div className="border border-line bg-white rounded-[24px] p-6 shadow-soft space-y-4">
      <h3 className="text-body font-bold text-fg flex items-center gap-2">
        <CalendarDays size={18} className="text-[#C4A882]" />
        <span>Lịch hoạt chất đề xuất tuần này</span>
      </h3>
      <p className="text-caption text-muted">Phân bổ hoạt chất tránh chồng chéo gây tổn thương da.</p>
      
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {treatmentCalendar.map((d, i) => {
          const bgClass =
            d.type === "treatment"
              ? "bg-violet-500/5 border-violet-500/20 text-violet-600"
              : d.type === "recovery"
              ? "bg-success/5 border-success/20 text-success"
              : "bg-surface border-line text-muted";

          return (
            <div key={i} className={`border rounded-xl p-3 text-center transition-all ${bgClass}`}>
              <div className="text-caption font-extrabold">{d.day}</div>
              <div className="text-[10px] mt-1 font-medium leading-snug break-words">{d.focus}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
