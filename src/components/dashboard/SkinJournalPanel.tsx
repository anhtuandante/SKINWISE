"use client";

import { useState, useMemo, useEffect } from "react";
import { Smile, Meh, Frown, ChevronLeft, ChevronRight, Plus, ArrowUpCircle, Search } from "lucide-react";
import { useSkinStore } from "@/store/useSkinStore";
import { DiaryLog } from "@/types";
import { useToastStore } from "@/store/toast-store";
import SkinCheckinFlow from "./SkinCheckinFlow";

const MOOD_CONFIG = {
  great: { label: "Rất tốt", icon: Smile, colorClass: "bg-success/10 text-success" },
  okay: { label: "Bình thường", icon: Meh, colorClass: "bg-warning/10 text-warning" },
  irritated: { label: "Kích ứng", icon: Frown, colorClass: "bg-danger/10 text-danger" },
};

const METRIC_SHORT_LABELS: Record<string, string> = {
  oiliness: "Dầu",
  dryness: "Khô",
  redness: "Đỏ",
  acne: "Mụn",
  barrierComfort: "Khỏe",
};

export default function SkinJournalPanel() {
  const { diaryLogs, deleteDiaryLog, checkinStreak } = useSkinStore();
  const addToast = useToastStore((s) => s.addToast);

  const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showCheckin, setShowCheckin] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return [...diaryLogs]
      .reverse()
      .filter((log) => {
        const matchSearch = !searchTerm || log.note.toLowerCase().includes(searchTerm.toLowerCase());
        const matchTag = !activeFilterTag || log.lifestyle.includes(activeFilterTag);
        return matchSearch && matchTag;
      });
  }, [diaryLogs, searchTerm, activeFilterTag]);

  const [mounted, setMounted] = useState(false);
  const isHydrated = useSkinStore((s) => s.isHydrated);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [checkinStartStep, setCheckinStartStep] = useState(0);
  const [checkinInitialMood, setCheckinInitialMood] = useState<"great" | "okay" | "irritated" | null>(null);
  const [checkinTargetDateStr, setCheckinTargetDateStr] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCheckinStartStep(customEvent.detail?.startStep ?? 0);
      setCheckinInitialMood(customEvent.detail?.initialMood ?? null);
      setCheckinTargetDateStr(customEvent.detail?.targetDateStr);
      setShowCheckin(true);
    };
    window.addEventListener("open-checkin-flow", handler as EventListener);
    return () => window.removeEventListener("open-checkin-flow", handler as EventListener);
  }, []);

  // --- Dynamic Weekdays Generator ---
  const currentWeekDays = useMemo(() => {
    const current = new Date();
    current.setDate(current.getDate() + weekOffset * 7);
    const day = current.getDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);

    const weekDays = [];
    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push({
        dayName: dayNames[i],
        dateNum: d.getDate(),
        fullDate: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
      });
    }
    return weekDays;
  }, [weekOffset]);

  const currentSelectedDayLog = useMemo(() => {
    const activeDay = currentWeekDays[selectedDayIdx];
    return diaryLogs.find((l) => l.date === activeDay.fullDate);
  }, [selectedDayIdx, diaryLogs, currentWeekDays]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }, []);

  const isToday = currentWeekDays[selectedDayIdx]?.fullDate === todayStr;
  const todayHasLog = diaryLogs.some((l) => l.date === todayStr);

  if (!mounted || !isHydrated) {
    return (
      <div className="flex items-center justify-center p-12 bg-white border border-line rounded-[24px] shadow-soft">
        <span className="text-caption text-muted font-bold animate-pulse">Đang tải nhật ký da...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between bg-white border border-line rounded-[24px] p-4 shadow-soft">
        <h3 className="text-body font-bold text-fg">
          Tháng {new Date(new Date().setDate(new Date().getDate() + weekOffset * 7)).getMonth() + 1}, {new Date(new Date().setDate(new Date().getDate() + weekOffset * 7)).getFullYear()}
        </h3>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 text-muted hover:text-fg bg-surface hover:bg-line/50 rounded-full transition-colors">
            <ChevronLeft size={18} />
          </button>
          {weekOffset !== 0 && (
            <button 
              onClick={() => { 
                setWeekOffset(0); 
                setSelectedDayIdx(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); 
              }} 
              className="text-[10px] font-bold text-fg bg-fg/5 hover:bg-fg/10 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
            >
              Hôm nay
            </button>
          )}
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 text-muted hover:text-fg bg-surface hover:bg-line/50 rounded-full transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar week grid */}
      <div className="grid grid-cols-7 gap-2">
        {currentWeekDays.map((d, idx) => {
          const isSel = selectedDayIdx === idx;
          const hasLog = diaryLogs.some((l) => l.date === d.fullDate);
          const logForDay = diaryLogs.find((l) => l.date === d.fullDate);
          const isPartialDay = logForDay?.isPartial;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIdx(idx)}
              className={`border rounded-xl py-3 text-center transition-all relative ${
                isSel ? "bg-fg text-bg border-fg" : "bg-white border-line text-muted hover:border-fg/40"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider">{d.dayName}</div>
              <div className="text-body font-extrabold mt-0.5">{d.dateNum}</div>
              {hasLog && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full ${
                  isPartialDay ? "w-1.5 h-1.5" : "w-1 h-1"
                } ${isSel ? "bg-bg" : isPartialDay ? "bg-warning" : "bg-fg"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Check-in CTA for today */}
      {isToday && !todayHasLog && (
        <button
          onClick={() => {
            setCheckinStartStep(0);
            setCheckinInitialMood(null);
            setCheckinTargetDateStr(todayStr);
            setShowCheckin(true);
          }}
          className="w-full border-2 border-dashed border-fg/20 hover:border-fg/40 rounded-[24px] p-6 text-center transition-all group bg-fg/[0.01] hover:bg-fg/[0.03]"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-fg/5 group-hover:bg-fg/10 flex items-center justify-center transition-colors">
              <Plus size={20} className="text-fg" />
            </div>
            <div className="text-left">
              <span className="text-body font-bold text-fg block">Check-in da hôm nay</span>
              <span className="text-caption text-muted">Chỉ mất 3 giây — hoặc kể thêm để AI dự đoán ngày mai</span>
            </div>
          </div>
          {checkinStreak > 0 && (
            <div className="mt-3 text-[10px] font-bold text-muted uppercase tracking-wider">
              🔥 Streak hiện tại: {checkinStreak} ngày
            </div>
          )}
        </button>
      )}

      {/* Existing entry view */}
      {currentSelectedDayLog ? (
        <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft space-y-4 animate-in">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="text-caption text-muted font-bold uppercase">Nhật ký ngày {currentSelectedDayLog.date}</span>
              {currentSelectedDayLog.isPartial && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning">Ghi nhanh</span>
              )}
              {currentSelectedDayLog.source === "ai" && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600">AI</span>
              )}
            </div>
            {(() => {
              const config = MOOD_CONFIG[currentSelectedDayLog.mood] || MOOD_CONFIG.okay;
              const MoodIcon = config.icon;
              return (
                <span className={`text-caption font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${config.colorClass}`}>
                  <MoodIcon size={14} />
                  {config.label}
                </span>
              );
            })()}
          </div>

          {/* Routine check-offs */}
          {!currentSelectedDayLog.isPartial && (
            <div className="flex gap-2.5">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${currentSelectedDayLog.amRoutineCompleted ? "bg-amber-500/10 text-amber-600" : "bg-line/10 text-muted"}`}>
                🌅 AM: {currentSelectedDayLog.amRoutineCompleted ? "Đã xong ✓" : "Chưa hoàn thành"}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${currentSelectedDayLog.pmRoutineCompleted ? "bg-indigo-500/10 text-indigo-600" : "bg-line/10 text-muted"}`}>
                🌙 PM: {currentSelectedDayLog.pmRoutineCompleted ? "Đã xong ✓" : "Chưa hoàn thành"}
              </span>
            </div>
          )}

          {/* Metrics */}
          {!currentSelectedDayLog.isPartial && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-surface/50 border border-line rounded-xl p-4">
              {Object.entries(currentSelectedDayLog.metrics)
                .filter(([k]) => METRIC_SHORT_LABELS[k])
                .map(([k, v]) => (
                  <div key={k} className="text-center">
                    <span className="text-micro font-bold text-muted uppercase block">{METRIC_SHORT_LABELS[k]}</span>
                    <span className="text-body font-extrabold text-fg">{v} / 5</span>
                  </div>
                ))}
            </div>
          )}

          {currentSelectedDayLog.note && (
            <div className="p-4 bg-surface/30 border border-line rounded-xl">
              <p className="text-caption italic text-muted">{`"${currentSelectedDayLog.note}"`}</p>
            </div>
          )}

          {currentSelectedDayLog.lifestyle.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-micro font-bold text-muted uppercase">Yếu tố thói quen:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentSelectedDayLog.lifestyle.map((tag) => (
                  <span key={tag} className="text-[10px] bg-surface border border-line text-muted px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade partial log CTA */}
          {currentSelectedDayLog.isPartial && (
            <button
              onClick={() => {
                setCheckinStartStep(1);
                setCheckinInitialMood(currentSelectedDayLog.mood);
                setCheckinTargetDateStr(currentSelectedDayLog.date);
                setShowCheckin(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-fg/5 hover:bg-fg/10 rounded-xl text-caption font-bold text-fg transition-all"
            >
              <ArrowUpCircle size={16} />
              Bổ sung chi tiết để xem dự đoán AI
            </button>
          )}

          <div className="text-center">
            <button
              onClick={() => {
                deleteDiaryLog(currentSelectedDayLog.date);
                addToast("Đã xóa nhật ký để bạn nhập lại.", "info");
              }}
              className="text-caption text-danger hover:underline font-bold"
            >
              Xóa nhật ký ngày này
            </button>
          </div>
        </div>
      ) : !isToday ? (
        <div className="border border-line rounded-[24px] p-8 bg-white shadow-soft text-center animate-in space-y-4">
          <p className="text-caption text-muted">Chưa có nhật ký cho ngày này.</p>
          <button
            onClick={() => {
              setCheckinStartStep(0);
              setCheckinInitialMood(null);
              setCheckinTargetDateStr(currentWeekDays[selectedDayIdx].fullDate);
              setShowCheckin(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-fg text-fg hover:bg-fg/5 rounded-xl text-caption font-bold transition-all"
          >
            <Plus size={16} /> Bổ sung nhật ký ngày này
          </button>
        </div>
      ) : null}

      {/* Log History */}
      {diaryLogs.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-body font-bold text-fg">Lịch sử nhật ký da</h3>
            <span className="text-micro text-muted font-bold">Tìm thấy: {filteredLogs.length} ngày</span>
          </div>

          {/* Search & Tag Filter Widget */}
          <div className="space-y-3 bg-white border border-line rounded-[20px] p-4 shadow-soft">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-muted" size={14} />
              <input
                type="text"
                placeholder="Tìm kiếm từ khóa trong ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-line rounded-xl text-caption text-fg outline-none focus:border-fg transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2 text-caption text-muted hover:text-fg font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider mr-1">Lọc thói quen:</span>
              <button
                onClick={() => setActiveFilterTag(null)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                  !activeFilterTag ? "bg-fg text-bg border-fg" : "bg-white text-muted border-line hover:border-fg/30"
                }`}
              >
                Tất cả
              </button>
              {[
                "Ngủ muộn",
                "Stress công việc",
                "Ăn đồ ngọt / sữa",
                "Đeo khẩu trang lâu",
                "Trang điểm đậm",
                "Quên chống nắng",
                "Dùng treatment nặng",
                "Thay đổi thời tiết"
              ].map((tag) => {
                const isSelected = activeFilterTag === tag;
                const count = diaryLogs.filter(l => l.lifestyle.includes(tag)).length;
                if (count === 0) return null;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveFilterTag(isSelected ? null : tag)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                      isSelected ? "bg-fg text-bg border-fg" : "bg-white text-muted border-line hover:border-fg/30"
                    }`}
                  >
                    <span>{tag}</span>
                    <span className={`text-[8px] font-extrabold rounded px-1 py-0.5 ${isSelected ? "bg-bg/20 text-bg" : "bg-line/40 text-muted"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-line rounded-[20px] bg-white text-caption text-muted">
                Không tìm thấy nhật ký da nào khớp với bộ lọc của bạn.
              </div>
            ) : (
              filteredLogs.map((log: DiaryLog) => (
                <div key={log.id} className="border border-line rounded-[20px] p-5 bg-white shadow-soft space-y-3 hover:scale-[1.002] transition-all">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-caption text-muted font-bold">{log.date} ({log.dayName})</span>
                      {log.isPartial && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-warning/10 text-warning">Nhanh</span>}
                    </div>
                    {(() => {
                      const config = MOOD_CONFIG[log.mood] || MOOD_CONFIG.okay;
                      const MoodIcon = config.icon;
                      return (
                        <span className={`text-caption font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${config.colorClass}`}>
                          <MoodIcon size={12} />
                          {config.label}
                        </span>
                      );
                    })()}
                  </div>

                  {!log.isPartial && (
                    <>
                      <div className="flex gap-2 pt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${log.amRoutineCompleted ? "bg-amber-500/10 text-amber-600" : "bg-line/15 text-muted"}`}>
                          🌅 AM: {log.amRoutineCompleted ? "Xong ✓" : "—"}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${log.pmRoutineCompleted ? "bg-indigo-500/10 text-indigo-600" : "bg-line/15 text-muted"}`}>
                          🌙 PM: {log.pmRoutineCompleted ? "Xong ✓" : "—"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-muted font-medium">
                        {Object.entries(log.metrics)
                          .filter(([k]) => METRIC_SHORT_LABELS[k])
                          .map(([k, v]) => (
                            <span key={k}>
                              {METRIC_SHORT_LABELS[k]}: <strong>{v}/5</strong>
                            </span>
                          ))}
                      </div>
                    </>
                  )}

                  {log.note && <p className="text-caption italic text-muted">{`"${log.note}"`}</p>}

                  {log.lifestyle.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {log.lifestyle.map((tag) => (
                        <span key={tag} className="text-[9px] bg-surface text-muted px-2 py-0.5 rounded-full border border-line">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckin && (
        <SkinCheckinFlow
          initialMood={checkinInitialMood}
          startStep={checkinStartStep}
          targetDateStr={checkinTargetDateStr}
          onComplete={() => {
            setShowCheckin(false);
            setCheckinStartStep(0);
            setCheckinInitialMood(null);
            setCheckinTargetDateStr(undefined);
          }}
          onClose={() => {
            setShowCheckin(false);
            setCheckinStartStep(0);
            setCheckinInitialMood(null);
            setCheckinTargetDateStr(undefined);
          }}
        />
      )}
    </div>
  );
}
