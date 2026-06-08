"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Camera,
  CheckCircle2, Sparkles, Brain, Flame,
  ChevronRight, ChevronLeft, Loader2
} from "lucide-react";
import { useSkinStore } from "@/store/useSkinStore";
import { useUserStore } from "@/store/user-store";
import { useToastStore } from "@/store/toast-store";
import { SkinPredictorNetwork } from "@/utils/skinPredictor";
import { calculateSkinScore } from "@/utils/trendAnalysis";
import { DiaryLog } from "@/types";

interface SkinCheckinFlowProps {
  onComplete: () => void;
  onClose: () => void;
  initialMood?: "great" | "okay" | "irritated" | null;
  startStep?: number;
  targetDateStr?: string;
}

const LIFESTYLE_OPTIONS = [
  "Ngủ muộn", "Stress công việc", "Ăn đồ ngọt / sữa", "Đeo khẩu trang lâu",
  "Trang điểm đậm", "Quên chống nắng", "Dùng treatment nặng", "Thay đổi thời tiết"
];

const METRICS_CONFIG = [
  { key: "oiliness", label: "Dầu thừa", descriptions: ["Rất ít", "Nhẹ", "Vừa phải", "Nhiều", "Rất nhiều"] },
  { key: "dryness", label: "Khô căng", descriptions: ["Rất ít", "Nhẹ", "Vừa phải", "Nhiều", "Rất nhiều"] },
  { key: "redness", label: "Mẩn đỏ", descriptions: ["Rất ít", "Nhẹ", "Vừa phải", "Nhiều", "Rất nhiều"] },
  { key: "acne", label: "Mụn mới", descriptions: ["Rất ít", "Nhẹ", "Vừa phải", "Nhiều", "Rất nhiều"] },
  { key: "barrierComfort", label: "Độ dễ chịu", descriptions: ["Rất khó chịu", "Khó chịu", "Bình thường", "Dễ chịu", "Rất khỏe"] },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function SkinCheckinFlow({
  onComplete,
  onClose,
  initialMood = null,
  startStep = 0,
  targetDateStr
}: SkinCheckinFlowProps) {
  const { diaryLogs, addPartialLog, addDiaryLog, checkinStreak } = useSkinStore();
  const user = useUserStore();
  const addToast = useToastStore((s) => s.addToast);

  const [step, setStep] = useState(startStep);
  const [direction, setDirection] = useState(1);

  // Step 1 state
  const [mood, setMood] = useState<"great" | "okay" | "irritated" | null>(initialMood);

  // Step 2 state
  const [metrics, setMetrics] = useState<Record<string, number>>({
    oiliness: 2, dryness: 2, redness: 1, acne: 1, barrierComfort: 4,
  });
  const [metricsSource, setMetricsSource] = useState<"manual" | "ai">("manual");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  // Step 3 state
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [amDone, setAmDone] = useState(false);
  const [pmDone, setPmDone] = useState(false);

  // Step 4 state
  const [note, setNote] = useState("");

  // Date
  const today = useMemo(() => {
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    if (targetDateStr) {
      const parts = targetDateStr.split("/");
      if (parts.length === 3) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return {
          str: targetDateStr,
          dayName: dayNames[d.getDay()],
        };
      }
    }
    const d = new Date();
    return {
      str: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
      dayName: dayNames[d.getDay()],
    };
  }, [targetDateStr]);

  // Escape key overlay close handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Memoize trained predictor to avoid redundant training
  const predictor = useMemo(() => {
    const p = new SkinPredictorNetwork();
    if (diaryLogs.length >= 2) p.trainOnLogs(diaryLogs);
    return p;
  }, [diaryLogs]);

  // Forecast
  const forecast = useMemo(() => {
    if (step < 3) return null;
    try {
      const todayLog: DiaryLog = {
        id: 0, date: today.str, dayName: today.dayName, mood: mood || "okay",
        metrics: {
          oiliness: metrics.oiliness, dryness: metrics.dryness,
          redness: metrics.redness, acne: metrics.acne, barrierComfort: metrics.barrierComfort,
        },
        lifestyle, note: "",
        amRoutineCompleted: amDone, pmRoutineCompleted: pmDone,
      };

      const yesterdayLog = diaryLogs.length > 0 ? diaryLogs[diaryLogs.length - 1] : null;
      return predictor.getForecast(yesterdayLog, todayLog, {
        concerns: user.concerns, skinType: user.skinType, barrierStatus: user.barrierStatus,
      });
    } catch { return null; }
  }, [step, predictor, today, mood, metrics, lifestyle, amDone, pmDone, user, diaryLogs]);

  const todayScore = useMemo(() => calculateSkinScore(metrics as { oiliness: number; dryness: number; redness: number; acne: number; barrierComfort: number }), [metrics]);

  // Navigation
  const goNext = () => { setDirection(1); setStep((s) => s + 1); };
  const goBack = () => { setDirection(-1); setStep((s) => s - 1); };

  // Quick save (mood only)
  const handleQuickSave = () => {
    if (!mood) return;
    addPartialLog(mood, today.str, today.dayName);
    const savedMood = mood;
    const savedDateStr = today.str;
    addToast("Đã ghi nhanh nhật ký!", "success", {
      label: "Bổ sung",
      onClick: () => {
        window.dispatchEvent(new CustomEvent("open-checkin-flow", {
          detail: { startStep: 1, initialMood: savedMood, targetDateStr: savedDateStr }
        }));
      }
    });
    onComplete();
  };

  // Full save
  const handleFullSave = () => {
    if (!mood) return;
    addDiaryLog({
      date: today.str, dayName: today.dayName, mood,
      isPartial: false, source: metricsSource,
      metrics: {
        oiliness: metrics.oiliness, dryness: metrics.dryness,
        redness: metrics.redness, acne: metrics.acne, barrierComfort: metrics.barrierComfort,
      },
      lifestyle, note,
      image: selfieImage,
      amRoutineCompleted: amDone, pmRoutineCompleted: pmDone,
    });
    addToast("Đã lưu nhật ký đầy đủ!", "success");
    onComplete();
  };

  // Selfie analysis
  const handleSelfie = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      addToast("Ảnh quá lớn, tối đa 10MB", "error");
      return;
    }
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setSelfieImage(base64);

      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mode: "dailyCheckin" }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      if (data.estimatedMetrics) {
        setMetrics({
          oiliness: data.estimatedMetrics.oiliness,
          dryness: data.estimatedMetrics.dryness,
          redness: data.estimatedMetrics.redness,
          acne: data.estimatedMetrics.acne,
          barrierComfort: data.estimatedMetrics.barrierComfort,
        });
        setMetricsSource("ai");
        addToast("AI đã phân tích ảnh thành công!", "success");
      }
    } catch {
      addToast("Không thể phân tích ảnh. Hãy tự đánh giá.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleLifestyle = (tag: string) => {
    setLifestyle((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const streakLabel = useMemo(() => {
    const s = checkinStreak;
    if (s < 1) return null;
    if (s < 3) return `Bắt đầu streak!`;
    if (s < 7) return `🔥 ${s} ngày liên tiếp!`;
    if (s < 14) return `🏆 ${s} ngày! Da bạn cảm ơn bạn đó.`;
    return `🎯 ${s} ngày! AI đã học đủ để dự đoán chuẩn hơn.`;
  }, [checkinStreak]);

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <button onClick={onClose} className="p-2 -ml-2 text-muted hover:text-fg transition-colors">
          <X size={22} />
        </button>
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-6 bg-fg" : i < step ? "w-3 bg-fg/40" : "w-3 bg-line"
            }`} />
          ))}
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ───── STEP 0: MOOD ───── */}
            {step === 0 && (
              <motion.div
                key="mood"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-8 pt-6"
              >
                <div>
                  <h2 className="text-[22px] font-bold text-fg">Da bạn hôm nay thế nào?</h2>
                  <p className="text-caption text-muted mt-1">Chạm để ghi nhận — chỉ mất 3 giây.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: "great" as const, label: "Rất tốt", emoji: "😊" },
                    { value: "okay" as const, label: "Bình thường", emoji: "😐" },
                    { value: "irritated" as const, label: "Kích ứng", emoji: "😣" },
                  ]).map((item) => {
                    const active = mood === item.value;
                    return (
                      <motion.button
                        key={item.value}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMood(item.value)}
                        className={`border rounded-2xl p-5 text-center transition-all ${
                          active ? "border-fg bg-fg/[0.04] shadow-soft" : "border-line bg-white hover:border-fg/30"
                        }`}
                      >
                        <span className="text-3xl block mb-2">{item.emoji}</span>
                        <span className={`text-caption font-bold block ${active ? "text-fg" : "text-muted"}`}>
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {mood && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <button onClick={handleQuickSave} className="flex-1 py-3.5 border border-line bg-white hover:bg-surface rounded-2xl text-caption font-bold text-fg transition-all">
                      Lưu nhanh & xong
                    </button>
                    <button onClick={goNext} className="flex-1 py-3.5 bg-fg text-bg rounded-2xl text-caption font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5">
                      Kể thêm cho AI <ChevronRight size={16} />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ───── STEP 1: METRICS ───── */}
            {step === 1 && (
              <motion.div
                key="metrics"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-6 pt-6"
              >
                <div>
                  <h2 className="text-[22px] font-bold text-fg">Trạng thái da chi tiết</h2>
                  <p className="text-caption text-muted mt-1">Chụp selfie để AI tự đánh giá, hoặc tự chấm điểm.</p>
                </div>

                {/* Selfie upload */}
                <div className="relative">
                  <label className={`block border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    selfieImage ? "border-fg/30 bg-fg/[0.02]" : "border-line hover:border-fg/30 bg-surface/30"
                  }`}>
                    <input
                      type="file" accept="image/*" capture="user"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelfie(f); }}
                    />
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <Loader2 size={20} className="animate-spin text-fg" />
                        <span className="text-caption font-bold text-fg">AI đang phân tích...</span>
                      </div>
                    ) : selfieImage ? (
                      <div className="flex items-center justify-center gap-2 py-1">
                        <CheckCircle2 size={18} className="text-success" />
                        <span className="text-caption font-bold text-success">Đã phân tích — chạm để chụp lại</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <Camera size={20} className="text-muted" />
                        <span className="text-caption font-bold text-fg">Chụp selfie để AI tự đánh giá</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Metric dot ratings */}
                <div className="space-y-4">
                  {metricsSource === "ai" && (
                    <div className="flex items-center gap-2 px-1">
                      <Sparkles size={14} className="text-violet-500" />
                      <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">AI đề xuất — bạn có thể chỉnh lại</span>
                    </div>
                  )}
                  {METRICS_CONFIG.map(({ key, label, descriptions }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-caption font-bold text-fg">{label}</span>
                        <span className="text-[10px] font-bold text-muted bg-surface/50 border border-line/50 px-2 py-0.5 rounded-md">{descriptions[(metrics[key] || 1) - 1]}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 bg-surface/40 p-2.5 rounded-2xl border border-line/60">
                        {[1, 2, 3, 4, 5].map((v) => {
                          const active = metrics[key] === v;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                setMetrics((m) => ({ ...m, [key]: v }));
                                if (metricsSource === "ai") setMetricsSource("manual");
                              }}
                              className="flex-1 flex flex-col items-center gap-1 py-1 group focus:outline-none"
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                active ? "bg-fg scale-110 shadow-soft" : "border-2 border-line bg-white group-hover:border-muted"
                              }`}>
                                {active && <div className="w-1.5 h-1.5 rounded-full bg-bg" />}
                              </div>
                              <span className={`text-[10px] font-bold ${active ? "text-fg" : "text-muted opacity-60"}`}>
                                {v}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-3">
                    <button onClick={goBack} className="flex-1 py-3.5 border border-line bg-white rounded-2xl text-caption font-bold text-fg transition-all flex items-center justify-center gap-1">
                      <ChevronLeft size={16} /> Quay lại
                    </button>
                    <button onClick={goNext} className="flex-1 py-3.5 bg-fg text-bg rounded-2xl text-caption font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1">
                      Tiếp tục <ChevronRight size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDirection(1); setStep(3); }}
                    className="w-full py-2.5 text-micro text-muted hover:text-fg font-bold transition-all text-center"
                  >
                    Bỏ qua & Xem dự đoán AI →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ───── STEP 2: LIFESTYLE & ROUTINE ───── */}
            {step === 2 && (
              <motion.div
                key="lifestyle"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-6 pt-6"
              >
                <div>
                  <h2 className="text-[22px] font-bold text-fg">Hôm nay bạn có gì đặc biệt?</h2>
                  <p className="text-caption text-muted mt-1">Chọn các yếu tố ảnh hưởng đến da hôm nay.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {LIFESTYLE_OPTIONS.map((tag) => {
                    const active = lifestyle.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleLifestyle(tag)}
                        className={`px-3.5 py-2 rounded-full border text-caption font-medium transition-all ${
                          active ? "bg-fg text-bg border-fg" : "bg-white text-muted border-line hover:border-fg/30"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-caption font-bold text-muted uppercase tracking-wider block">Routine đã thực hiện</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setAmDone(!amDone)} className={`border rounded-xl p-3.5 flex items-center justify-center gap-2 transition-all ${amDone ? "border-fg bg-fg/[0.04] shadow-soft font-bold" : "border-line bg-white hover:border-fg/30"}`}>
                      <span>🌅</span><span className="text-caption">AM</span>
                      {amDone && <CheckCircle2 size={14} className="text-success" />}
                    </button>
                    <button onClick={() => setPmDone(!pmDone)} className={`border rounded-xl p-3.5 flex items-center justify-center gap-2 transition-all ${pmDone ? "border-fg bg-fg/[0.04] shadow-soft font-bold" : "border-line bg-white hover:border-fg/30"}`}>
                      <span>🌙</span><span className="text-caption">PM</span>
                      {pmDone && <CheckCircle2 size={14} className="text-success" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-3">
                    <button onClick={goBack} className="flex-1 py-3.5 border border-line bg-white rounded-2xl text-caption font-bold text-fg transition-all flex items-center justify-center gap-1">
                      <ChevronLeft size={16} /> Quay lại
                    </button>
                    <button onClick={goNext} className="flex-1 py-3.5 bg-fg text-bg rounded-2xl text-caption font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1">
                      <Brain size={16} /> Xem dự đoán AI
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDirection(1); setStep(3); }}
                    className="w-full py-2.5 text-micro text-muted hover:text-fg font-bold transition-all text-center"
                  >
                    Bỏ qua & Xem dự đoán AI →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ───── STEP 3: AI FORECAST (REWARD) ───── */}
            {step === 3 && (
              <motion.div
                key="forecast"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-6 pt-6"
              >
                <div className="flex items-center gap-2">
                  <Brain size={22} className="text-fg" />
                  <h2 className="text-[22px] font-bold text-fg">Dự đoán ngày mai</h2>
                </div>

                <div className="bg-gradient-to-br from-fg to-slate-800 text-bg rounded-2xl p-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Skin Score hôm nay</div>
                  <div className="text-3xl font-extrabold">{todayScore}<span className="text-lg opacity-50">/100</span></div>
                </div>

                {forecast && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="border border-line rounded-2xl p-4 text-center bg-white">
                      <div className="text-[10px] font-bold text-muted uppercase mb-1">Score</div>
                      <div className="text-title font-extrabold text-fg">{forecast.score}</div>
                      <div className={`text-[10px] font-bold mt-0.5 ${forecast.score >= todayScore ? "text-success" : "text-danger"}`}>
                        {forecast.score >= todayScore ? "↑" : "↓"}{Math.abs(forecast.score - todayScore)}
                      </div>
                    </div>
                    <div className="border border-line rounded-2xl p-4 text-center bg-white">
                      <div className="text-[10px] font-bold text-muted uppercase mb-1">Mụn</div>
                      <div className="flex justify-center gap-0.5 my-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i <= forecast.acne ? "bg-danger" : "bg-line"}`} />
                        ))}
                      </div>
                      <div className="text-[10px] text-muted font-medium">{forecast.acne <= 2 ? "Ổn" : forecast.acne <= 3 ? "Vừa" : "Cao"}</div>
                    </div>
                    <div className="border border-line rounded-2xl p-4 text-center bg-white">
                      <div className="text-[10px] font-bold text-muted uppercase mb-1">Mẩn đỏ</div>
                      <div className="flex justify-center gap-0.5 my-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i <= forecast.redness ? "bg-warning" : "bg-line"}`} />
                        ))}
                      </div>
                      <div className="text-[10px] text-muted font-medium">{forecast.redness <= 2 ? "Nhẹ" : forecast.redness <= 3 ? "Vừa" : "Nặng"}</div>
                    </div>
                  </div>
                )}

                {forecast && forecast.riskFactors.length > 0 && (
                  <div className="border border-warning/30 bg-warning/[0.03] rounded-2xl p-4 space-y-2">
                    <div className="text-caption font-bold text-warning">⚠️ Lưu ý cho ngày mai</div>
                    <ul className="space-y-1">
                      {forecast.riskFactors.map((r, i) => (
                        <li key={i} className="text-caption text-muted flex items-start gap-1.5">
                          <span className="text-warning mt-0.5">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-caption font-bold text-muted uppercase tracking-wider block">Ghi chú thêm (tuỳ chọn)</label>
                  <textarea
                    value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Vùng cằm hơi đỏ rát sau BHA tối qua..."
                    className="w-full bg-surface border border-line rounded-2xl p-4 text-caption text-fg outline-none focus:border-fg h-20 resize-none transition-all placeholder:text-muted/60"
                  />
                </div>

                {streakLabel && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 py-3 bg-fg/[0.03] border border-line rounded-2xl">
                    <Flame size={16} className="text-fg" />
                    <span className="text-caption font-bold text-fg">{streakLabel}</span>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={goBack} className="py-3.5 px-5 border border-line bg-white rounded-2xl text-caption font-bold text-fg transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={handleFullSave}
                    className="flex-1 py-3.5 bg-fg text-bg rounded-2xl text-caption font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md">
                    <CheckCircle2 size={16} /> Hoàn tất
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
