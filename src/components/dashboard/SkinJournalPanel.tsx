"use client";

import { useState, useMemo, useEffect } from "react";
import { Smile, Meh, Frown, Camera, CheckCircle2 } from "lucide-react";
import { useSkinStore, DiaryLog } from "@/store/useSkinStore";
import { useToastStore } from "@/store/toast-store";

const LIFESTYLE_OPTIONS = [
  "Ngủ muộn",
  "Stress công việc",
  "Ăn đồ ngọt / sữa",
  "Đeo khẩu trang lâu",
  "Trang điểm đậm",
  "Quên chống nắng",
  "Dùng treatment nặng",
  "Thay đổi thời tiết"
];

const METRICS = [
  { key: "oiliness", label: "Mức dầu thừa" },
  { key: "dryness", label: "Độ khô căng" },
  { key: "redness", label: "Độ đỏ rát / Kích ứng" },
  { key: "acne", label: "Mụn mới xuất hiện" },
  { key: "barrierComfort", label: "Độ dễ chịu hàng rào" }
];

export default function SkinJournalPanel() {
  const { diaryLogs, addDiaryLog, deleteDiaryLog } = useSkinStore();
  const addToast = useToastStore((s) => s.addToast);

  const [selectedDayIdx, setSelectedDayIdx] = useState(0); // 0 (Mon) - 6 (Sun)
  const [journalMood, setJournalMood] = useState<"great" | "okay" | "irritated" | null>(null);
  const [journalMetrics, setJournalMetrics] = useState<Record<string, number>>({
    oiliness: 2,
    dryness: 2,
    redness: 1,
    acne: 1,
    barrierComfort: 4
  });
  const [journalLifestyle, setJournalLifestyle] = useState<string[]>([]);
  const [journalNote, setJournalNote] = useState("");
  const [journalImage, setJournalImage] = useState<string | null>(null);
  const [amRoutineCompleted, setAmRoutineCompleted] = useState(false);
  const [pmRoutineCompleted, setPmRoutineCompleted] = useState(false);
  const [isJournalSaved, setIsJournalSaved] = useState(false);

  // --- Dynamic Weekdays Generator ---
  const currentWeekDays = useMemo(() => {
    const current = new Date();
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
  }, []);

  const toggleJournalLifestyle = (tag: string) => {
    if (journalLifestyle.includes(tag)) {
      setJournalLifestyle(journalLifestyle.filter((x) => x !== tag));
    } else {
      setJournalLifestyle([...journalLifestyle, tag]);
    }
  };

  // Reset form inputs when selected day changes
  useEffect(() => {
    setJournalMood(null);
    setJournalNote("");
    setJournalLifestyle([]);
    setJournalImage(null);
    setAmRoutineCompleted(false);
    setPmRoutineCompleted(false);
    setJournalMetrics({
      oiliness: 2,
      dryness: 2,
      redness: 1,
      acne: 1,
      barrierComfort: 4
    });
  }, [selectedDayIdx]);

  const handleSaveJournal = () => {
    if (!journalMood) return;
    const activeDay = currentWeekDays[selectedDayIdx];

    addDiaryLog({
      date: activeDay.fullDate,
      dayName: activeDay.dayName,
      mood: journalMood,
      metrics: {
        oiliness: journalMetrics.oiliness,
        dryness: journalMetrics.dryness,
        redness: journalMetrics.redness,
        acne: journalMetrics.acne,
        barrierComfort: journalMetrics.barrierComfort
      },
      lifestyle: [...journalLifestyle],
      note: journalNote,
      image: journalImage,
      amRoutineCompleted,
      pmRoutineCompleted
    });

    setIsJournalSaved(true);
    addToast(`Đã lưu nhật ký ngày ${activeDay.fullDate}`, "success");
    setTimeout(() => setIsJournalSaved(false), 2000);

    // Reset temporary states
    setJournalMood(null);
    setJournalNote("");
    setJournalLifestyle([]);
    setJournalImage(null);
    setAmRoutineCompleted(false);
    setPmRoutineCompleted(false);
  };

  // Preset diary templates to select dates
  const currentSelectedDayLog = useMemo(() => {
    const activeDay = currentWeekDays[selectedDayIdx];
    return diaryLogs.find((l) => l.date === activeDay.fullDate);
  }, [selectedDayIdx, diaryLogs, currentWeekDays]);

  return (
    <div className="space-y-6">
      {/* Calendar header switcher */}
      <div className="grid grid-cols-7 gap-2">
        {currentWeekDays.map((d, idx) => {
          const isSel = selectedDayIdx === idx;
          const hasLog = diaryLogs.some((l) => l.date === d.fullDate);
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
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSel ? "bg-bg" : "bg-fg"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Show existing entry for this day if recorded */}
      {currentSelectedDayLog ? (
        <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft space-y-4 animate-in">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-caption text-muted font-bold uppercase">Nhật ký ngày {currentSelectedDayLog.date}</span>
            <span
              className={`text-caption font-bold px-3 py-1 rounded-full ${
                currentSelectedDayLog.mood === "great"
                  ? "bg-success/10 text-success"
                  : currentSelectedDayLog.mood === "okay"
                  ? "bg-warning/10 text-warning"
                  : "bg-danger/10 text-danger"
              }`}
            >
              {currentSelectedDayLog.mood === "great" ? "Mood: Rất tốt" : currentSelectedDayLog.mood === "okay" ? "Mood: Bình thường" : "Mood: Kích ứng"}
            </span>
          </div>

          {/* Routine check-offs status */}
          <div className="flex gap-2.5">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${currentSelectedDayLog.amRoutineCompleted ? "bg-amber-500/10 text-amber-600" : "bg-line/10 text-muted"}`}>
              🌅 AM: {currentSelectedDayLog.amRoutineCompleted ? "Đã xong ✓" : "Chưa hoàn thành"}
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${currentSelectedDayLog.pmRoutineCompleted ? "bg-indigo-500/10 text-indigo-600" : "bg-line/10 text-muted"}`}>
              🌙 PM: {currentSelectedDayLog.pmRoutineCompleted ? "Đã xong ✓" : "Chưa hoàn thành"}
            </span>
          </div>

          {/* Metrics status */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-surface/50 border border-line rounded-xl p-4">
            {Object.entries(currentSelectedDayLog.metrics).map(([k, v]) => {
              const labels: Record<string, string> = { oiliness: "Dầu thừa", dryness: "Độ khô", redness: "Độ đỏ rát", acne: "Mụn mới", barrierComfort: "Độ khỏe" };
              return (
                <div key={k} className="text-center">
                  <span className="text-micro font-bold text-muted uppercase block">{labels[k] || k}</span>
                  <span className="text-body font-extrabold text-fg">{v} / 5</span>
                </div>
              );
            })}
          </div>

          {currentSelectedDayLog.note && (
            <div className="p-4 bg-surface/30 border border-line rounded-xl">
              <p className="text-caption italic text-muted">{`"${currentSelectedDayLog.note}"`}</p>
            </div>
          )}

          {currentSelectedDayLog.lifestyle.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-micro font-bold text-muted uppercase">Yếu tố thói quen ghi nhận:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentSelectedDayLog.lifestyle.map((tag) => (
                  <span key={tag} className="text-[10px] bg-surface border border-line text-muted px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => {
                deleteDiaryLog(currentSelectedDayLog.date);
                addToast("Đã xóa nhật ký để bạn nhập lại.", "info");
              }}
              className="text-caption text-danger hover:underline font-bold animate-pulse"
            >
              Xóa và Ghi nhận lại nhật ký cho ngày này
            </button>
          </div>
        </div>
      ) : (
        // Input tracker for the day
        <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft space-y-6 animate-in">
          <div>
            <h3 className="text-body font-bold text-fg">Nhật ký da ngày {currentWeekDays[selectedDayIdx].fullDate}</h3>
            <p className="text-caption text-muted mt-0.5">Theo dõi trạng thái da để AI dự đoán xu hướng kích ứng chuẩn xác.</p>
          </div>

          {/* Routine Completion Check-offs */}
          <div className="space-y-2">
            <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">Routine dưỡng da đã thực hiện hôm nay</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAmRoutineCompleted(!amRoutineCompleted)}
                className={`border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${
                  amRoutineCompleted ? "border-fg bg-surface shadow-soft scale-102 font-bold" : "border-line bg-white hover:border-fg/40"
                }`}
              >
                <span className="text-base">🌅</span>
                <span className="text-caption">Routine Sáng (AM)</span>
                {amRoutineCompleted && <span className="text-success text-micro font-extrabold">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => setPmRoutineCompleted(!pmRoutineCompleted)}
                className={`border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${
                  pmRoutineCompleted ? "border-fg bg-surface shadow-soft scale-102 font-bold" : "border-line bg-white hover:border-fg/40"
                }`}
              >
                <span className="text-base">🌙</span>
                <span className="text-caption">Routine Tối (PM)</span>
                {pmRoutineCompleted && <span className="text-success text-micro font-extrabold">✓</span>}
              </button>
            </div>
          </div>

          {/* Mood Selector */}
          <div className="space-y-2">
            <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">Trạng thái biểu hiện chung</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "great", label: "Rất tốt", icon: Smile, color: "text-success border-success/30 bg-success/[0.02]" },
                { value: "okay", label: "Bình thường", icon: Meh, color: "text-warning border-warning/30 bg-warning/[0.02]" },
                { value: "irritated", label: "Mẩn đỏ / Lên mụn", icon: Frown, color: "text-danger border-danger/30 bg-danger/[0.02]" }
              ].map((item) => {
                const Icon = item.icon;
                const active = journalMood === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setJournalMood(item.value as "great" | "okay" | "irritated")}
                    className={`border rounded-xl p-4 text-center transition-all ${
                      active ? "border-fg bg-surface shadow-soft scale-102" : "border-line bg-white hover:border-fg/40"
                    }`}
                  >
                    <Icon size={22} className={`mx-auto mb-1 ${active ? "text-fg" : "text-muted"}`} />
                    <span className="text-caption font-semibold leading-none block">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metrics ratings */}
          <div className="space-y-4 border-t border-line pt-4">
            <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">Chỉ số da hôm nay (1: Rất nhẹ &rarr; 5: Cực kỳ nặng/Rõ rệt)</label>
            <div className="space-y-3.5">
              {METRICS.map(({ key, label }) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-caption text-fg font-medium sm:w-44 shrink-0">{label}</span>
                  <div className="flex gap-1.5 flex-1">
                    {[1, 2, 3, 4, 5].map((v) => {
                      const active = journalMetrics[key] === v;
                      return (
                        <button
                          key={v}
                          onClick={() => setJournalMetrics((m) => ({ ...m, [key]: v }))}
                          className={`flex-1 h-8 rounded-lg text-caption font-bold transition-all ${
                            active ? "bg-fg text-bg font-extrabold shadow-sm scale-105" : "bg-surface hover:bg-line text-muted border border-line"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lifestyle trigger tags */}
          <div className="space-y-2 border-t border-line pt-4">
            <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">Hôm nay bạn có:</label>
            <div className="flex flex-wrap gap-2">
              {LIFESTYLE_OPTIONS.map((tag) => {
                const active = journalLifestyle.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleJournalLifestyle(tag)}
                    className={`px-3 py-1.5 rounded-full border text-caption transition-all ${
                      active ? "bg-fg text-bg border-fg" : "bg-white text-muted border-line hover:border-fg/40"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulating Skin Photo upload */}
          <div className="border-2 border-dashed border-line rounded-[24px] p-6 text-center hover:border-fg/40 transition-colors cursor-pointer group bg-surface/20 relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setJournalImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {journalImage ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={journalImage} alt="Da hôm nay" className="max-h-32 mx-auto rounded-lg object-cover" />
                <p className="text-caption text-muted">Đã tải ảnh lên thành công. Click để đổi ảnh khác.</p>
              </div>
            ) : (
              <>
                <Camera size={24} className="mx-auto mb-2 text-muted group-hover:text-fg transition-colors" />
                <span className="text-caption font-bold text-fg block">Chụp ảnh làn da hôm nay</span>
                <span className="text-[10px] text-muted leading-relaxed block mt-0.5">Lưu trữ ảnh để so sánh tiến triển mụn và đỏ da theo tuần.</span>
              </>
            )}
          </div>

          {/* Written notes */}
          <div className="space-y-2">
            <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold" htmlFor="journalNote">Ghi chú cụ thể</label>
            <textarea
              id="journalNote"
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              placeholder="Ví dụ: Vùng cằm đỏ rát nhẹ sau khi bôi BHA tối qua. Vùng trán bớt dầu nhờn..."
              className="w-full bg-surface border border-line rounded-2xl p-4 text-caption text-fg outline-none focus:border-fg h-20 resize-none transition-all placeholder:text-muted/65"
            />
          </div>

          {/* Submit save button */}
          <button
            onClick={handleSaveJournal}
            disabled={!journalMood || isJournalSaved}
            className={`w-full py-4 rounded-2xl text-caption font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
              isJournalSaved
                ? "bg-success text-bg shadow-success/10"
                : "bg-fg text-bg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-fg/10 active:scale-98"
            }`}
          >
            {isJournalSaved ? (
              <>
                <CheckCircle2 size={16} />
                Lưu nhật ký thành công!
              </>
            ) : (
              "Lưu nhật ký hôm nay"
            )}
          </button>
        </div>
      )}

      {/* Log History */}
      {diaryLogs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-body font-bold text-fg">Lịch sử nhật ký da</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {diaryLogs.map((log: DiaryLog) => (
              <div key={log.id} className="border border-line rounded-[20px] p-5 bg-white shadow-soft space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="text-caption text-muted font-bold">{log.date} ({log.dayName})</span>
                  <span
                    className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                      log.mood === "great"
                        ? "bg-success/10 text-success"
                        : log.mood === "okay"
                        ? "bg-warning/10 text-warning"
                        : "bg-danger/10 text-danger"
                    }`}
                  >
                    {log.mood === "great" ? "Rất tốt" : log.mood === "okay" ? "Bình thường" : "Kích ứng"}
                  </span>
                </div>

                {/* Routine completion history list */}
                <div className="flex gap-2 pt-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${log.amRoutineCompleted ? "bg-amber-500/10 text-amber-600" : "bg-line/15 text-muted"}`}>
                    🌅 AM: {log.amRoutineCompleted ? "Xong ✓" : "—"}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${log.pmRoutineCompleted ? "bg-indigo-500/10 text-indigo-600" : "bg-line/15 text-muted"}`}>
                    🌙 PM: {log.pmRoutineCompleted ? "Xong ✓" : "—"}
                  </span>
                </div>

                {log.note && <p className="text-caption italic text-muted">{`"${log.note}"`}</p>}

                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-muted font-medium">
                  {Object.entries(log.metrics).map(([k, v]) => {
                    const shortLabels: Record<string, string> = { oiliness: "Dầu", dryness: "Khô", redness: "Đỏ", acne: "Mụn", barrierComfort: "Khỏe" };
                    return (
                      <span key={k}>
                        {shortLabels[k] || k}: <strong>{v}/5</strong>
                      </span>
                    );
                  })}
                </div>

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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
