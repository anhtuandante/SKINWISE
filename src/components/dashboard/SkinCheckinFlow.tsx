"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Camera,
  CheckCircle2, Sparkles, Flame,
  ChevronRight, Loader2, Copy,
  Droplet, Sun, ShieldAlert, AlertCircle
} from "lucide-react";
import { useSkinStore } from "@/store/useSkinStore";
import { useToastStore } from "@/store/toast-store";
import { DiaryLog } from "@/types";

interface SkinCheckinFlowProps {
  onComplete: () => void;
  onClose: () => void;
  initialMood?: "great" | "okay" | "irritated" | null;
  startStep?: number;
  targetDateStr?: string;
}

const LIFESTYLE_OPTIONS = [
  { value: "Ngủ muộn", label: "Ngủ muộn" },
  { value: "Stress công việc", label: "Stress" },
  { value: "Ăn đồ ngọt / sữa", label: "Đồ ngọt/sữa" },
  { value: "Đeo khẩu trang lâu", label: "Khẩu trang" },
  { value: "Trang điểm đậm", label: "Trang điểm" },
  { value: "Quên chống nắng", label: "Quên chống nắng" },
  { value: "Dùng treatment nặng", label: "Treatment" },
  { value: "Thay đổi thời tiết", label: "Thời tiết" }
];

const DIET_OPTIONS = [
  { value: "dairy", label: "🥛 Sữa & phô mai" },
  { value: "sugar", label: "🍩 Đồ ngọt / đường" },
  { value: "greasy_spicy", label: "🌶️ Đồ cay / dầu mỡ" },
  { value: "greens", label: "🥦 Ăn nhiều rau quả" },
  { value: "water", label: "💧 Đủ >= 2L nước" }
];

const OILINESS_OPTIONS = [
  { value: "matte", label: "Khô thoáng, mịn màng", desc: "Da thông thoáng suốt cả ngày, không nhờn dính", oiliness: 1 },
  { value: "normal", label: "Bình thường / Ít dầu", desc: "Ẩm mịn tự nhiên, đổ dầu cực nhẹ vùng mũi", oiliness: 2 },
  { value: "t_zone", label: "Bóng dầu vùng chữ T", desc: "Đổ dầu trán/mũi/cằm rõ rệt, má bình thường", oiliness: 3 },
  { value: "greasy", label: "Bóng nhờn toàn mặt", desc: "Cả mặt đổ nhiều dầu, bóng loáng và dính", oiliness: 5 },
];

const DRYNESS_OPTIONS = [
  { value: "hydrated", label: "Ẩm mịn, đủ nước", desc: "Da mềm mại, không có cảm giác khô căng", dryness: 1 },
  { value: "tight", label: "Hơi căng nhẹ", desc: "Cảm giác hơi căng sau rửa mặt hoặc ngồi điều hòa", dryness: 3 },
  { value: "flaking", label: "Khô ráp / Bong tróc", desc: "Da khô căng khó chịu, thô ráp hoặc tróc vảy", dryness: 5 },
];

const IRRITATION_OPTIONS = [
  { value: "calm", label: "Êm dịu, bình thường", desc: "Da hoàn toàn bình thường, khỏe mạnh, không đỏ rát", redness: 1, barrierComfort: 5 },
  { value: "stinging", label: "Châm chích nhẹ", desc: "Hơi ngứa hoặc rát nhẹ lúc bôi kem dưỡng/treatment", redness: 2, barrierComfort: 3 },
  { value: "burning", label: "Đỏ rát, kích ứng", desc: "Da đỏ ửng rõ rệt, ngứa ngáy hoặc nóng rát dữ dội", redness: 4, barrierComfort: 1 },
];

const ACNE_OPTIONS = [
  { value: "none", label: "Không có mụn mới", desc: "Da êm, không mọc thêm nốt mụn nào", acne: 1 },
  { value: "tiny", label: "Mụn cám / Mụn li ti", desc: "Mọc vài nốt mụn đầu đen hoặc đầu trắng li ti", acne: 3 },
  { value: "inflamed", label: "Mụn sưng viêm đỏ", desc: "Có mụn đỏ, mụn bọc, mụn mủ sưng đau nhức", acne: 5 },
];

const getOilinessSelected = (oiliness: number) => {
  if (oiliness <= 1) return "matte";
  if (oiliness === 2) return "normal";
  if (oiliness === 3 || oiliness === 4) return "t_zone";
  return "greasy";
};

const getDrynessSelected = (dryness: number) => {
  if (dryness <= 1) return "hydrated";
  if (dryness >= 2 && dryness <= 4) return "tight";
  return "flaking";
};

const getIrritationSelected = (redness: number, barrierComfort: number) => {
  if (redness >= 4 || barrierComfort <= 2) return "burning";
  if (redness >= 2 || barrierComfort <= 4) return "stinging";
  return "calm";
};

const getAcneSelected = (acne: number) => {
  if (acne <= 1) return "none";
  if (acne >= 2 && acne <= 4) return "tiny";
  return "inflamed";
};

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
  const addToast = useToastStore((s) => s.addToast);

  const [step, setStep] = useState(startStep);
  const [direction, setDirection] = useState(1);

  // Step 0 state
  const [mood, setMood] = useState<"great" | "okay" | "irritated" | null>(initialMood);

  // Step 1 state (Consolidated)
  const [metrics, setMetrics] = useState<Record<string, number>>({
    oiliness: 2, dryness: 2, redness: 1, acne: 1, barrierComfort: 4,
  });
  const [metricsSource, setMetricsSource] = useState<"manual" | "ai">("manual");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  
  const [aiOriginalMetrics, setAiOriginalMetrics] = useState<Record<string, number> | null>(null);
  const [userCorrected, setUserCorrected] = useState(false);

  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [diet, setDiet] = useState<string[]>([]);
  const [amDone, setAmDone] = useState(false);
  const [pmDone, setPmDone] = useState(false);
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

  const existingLog = useMemo(() => {
    return diaryLogs.find((l) => l.date === today.str);
  }, [diaryLogs, today.str]);

  const yesterdayLog = useMemo(() => {
    return diaryLogs.length > 0 && diaryLogs[diaryLogs.length - 1].date !== today.str
      ? diaryLogs[diaryLogs.length - 1]
      : null;
  }, [diaryLogs, today.str]);

  useEffect(() => {
    if (existingLog) {
      setAmDone(!!existingLog.amRoutineCompleted);
      setPmDone(!!existingLog.pmRoutineCompleted);
      if (existingLog.mood && !mood) setMood(existingLog.mood);
      if (existingLog.metrics) setMetrics(existingLog.metrics);
      if (existingLog.lifestyle && lifestyle.length === 0) setLifestyle(existingLog.lifestyle);
      if (existingLog.diet && diet.length === 0) setDiet(existingLog.diet);
      if (existingLog.note && !note) setNote(existingLog.note);
      if (existingLog.image && !selfieImage) setSelfieImage(existingLog.image);
      if (existingLog.source) setMetricsSource(existingLog.source);
      if (existingLog.aiOriginalMetrics) setAiOriginalMetrics(existingLog.aiOriginalMetrics);
      if (existingLog.userCorrected) setUserCorrected(existingLog.userCorrected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingLog]);

  // Escape key overlay close handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Navigation
  const goNext = () => { setDirection(1); setStep((s) => s + 1); };

  const handleCopyYesterday = () => {
    if (yesterdayLog) {
      setMetrics(yesterdayLog.metrics);
      setLifestyle(yesterdayLog.lifestyle);
      if (yesterdayLog.diet) setDiet(yesterdayLog.diet);
      setMetricsSource("manual");
      addToast("Đã copy dữ liệu ngày hôm qua", "success");
      goNext();
    }
  };

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
      aiOriginalMetrics: aiOriginalMetrics ? (aiOriginalMetrics as DiaryLog["aiOriginalMetrics"]) : undefined,
      userCorrected,
      lifestyle, diet, note,
      image: selfieImage,
      amRoutineCompleted: amDone, pmRoutineCompleted: pmDone,
    });
    addToast("Đã lưu nhật ký thành công!", "success");
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

      // Simulate analysis delay for visual effect
      await new Promise(r => setTimeout(r, 2000));

      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mode: "dailyCheckin" }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      if (data.estimatedMetrics) {
        // apply calibration offsets
        const store = useSkinStore.getState();
        const calibrated = { ...data.estimatedMetrics };
        Object.keys(calibrated).forEach((k) => {
          if (store.calibrationOffsets[k]) {
             calibrated[k] = Math.max(1, Math.min(5, calibrated[k] + store.calibrationOffsets[k]));
          }
        });

        setAiOriginalMetrics(calibrated);
        setMetrics(calibrated);
        setMetricsSource("ai");
        setUserCorrected(false);
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
    return `🎯 ${s} ngày! Da ngày một đẹp hơn.`;
  }, [checkinStreak]);

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <button onClick={onClose} className="p-2 -ml-2 text-muted hover:text-fg transition-colors">
          <X size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 0 ? "w-6 bg-fg" : "w-3 bg-fg/40"}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? "w-6 bg-fg" : "w-3 bg-line"}`} />
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
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                    {yesterdayLog && !existingLog && (
                      <button onClick={handleCopyYesterday} className="w-full py-3.5 bg-fg/[0.05] text-fg border border-fg/20 rounded-2xl text-caption font-bold hover:bg-fg/[0.08] transition-all flex items-center justify-center gap-2">
                        <Copy size={16} /> Giữ nguyên như hôm qua
                      </button>
                    )}
                    <div className="flex gap-3">
                      <button onClick={handleQuickSave} className="flex-1 py-3.5 border border-line bg-white hover:bg-surface rounded-2xl text-caption font-bold text-fg transition-all">
                        Lưu nhanh & xong
                      </button>
                      <button onClick={goNext} className="flex-1 py-3.5 bg-fg text-bg rounded-2xl text-caption font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5">
                        Kể chi tiết <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ───── STEP 1: CONSOLIDATED CHECK-IN ───── */}
            {step === 1 && (
              <motion.div
                key="consolidated"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-8 pt-6"
              >
                {/* Selfie upload with Scan Animation */}
                <div className="relative overflow-hidden rounded-2xl">
                  <label className={`block border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    selfieImage ? "border-accent/50 bg-accent/5" : "border-line hover:border-fg/30 bg-surface/30 rounded-2xl"
                  }`} style={{ backgroundImage: selfieImage ? `url(${selfieImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', height: selfieImage ? '180px' : 'auto', borderRadius: '1rem' }}>
                    
                    <input
                      type="file" accept="image/*" capture="user"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelfie(f); }}
                    />
                    
                    {/* Scanning Animation */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none">
                        <motion.div
                          initial={{ top: "-100%" }}
                          animate={{ top: "100%" }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent to-accent/60 border-b-2 border-accent-dark"
                        />
                      </div>
                    )}

                    {!selfieImage && !isAnalyzing && (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Camera size={24} className="text-muted" />
                        </div>
                        <span className="text-caption font-bold text-fg mt-2">Chụp selfie để AI phân tích</span>
                      </div>
                    )}

                    {isAnalyzing && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-bg/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                          <Loader2 size={16} className="animate-spin text-accent-dark" />
                          <span className="text-micro font-bold text-accent-dark">Đang quét...</span>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {/* Symptom Questions */}
                <div className="space-y-6">
                  {/* Header info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-micro font-bold text-muted uppercase tracking-wider">Trạng thái da hôm nay</span>
                      <p className="text-[11px] text-muted mt-0.5">Chọn mô tả khớp nhất với làn da của bạn.</p>
                    </div>
                    {metricsSource === "ai" && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent-light/20">
                        <Sparkles size={12} className="text-accent animate-pulse" />
                        <span className="text-[10px] font-bold text-accent-dark">AI Điền sẵn</span>
                      </div>
                    )}
                  </div>

                  {/* 1. Droplet: Oiliness */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border border-line shadow-soft">
                    <div className="flex items-center gap-2 text-fg border-b border-line pb-2 mb-2">
                      <Droplet size={15} className="text-blue-500" />
                      <span className="text-caption font-bold">Mức độ đổ dầu</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {OILINESS_OPTIONS.map((opt) => {
                        const isSelected = getOilinessSelected(metrics.oiliness) === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setMetrics((m) => ({ ...m, oiliness: opt.oiliness }));
                              if (metricsSource === "ai") setUserCorrected(true);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-fg bg-fg/[0.02] font-bold shadow-sm"
                                : "border-line bg-surface/30 hover:border-fg/20"
                            }`}
                          >
                            <span className="text-caption font-bold block text-fg">{opt.label}</span>
                            <span className="text-micro text-muted mt-0.5 block font-normal leading-relaxed">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Sun: Dryness */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border border-line shadow-soft">
                    <div className="flex items-center gap-2 text-fg border-b border-line pb-2 mb-2">
                      <Sun size={15} className="text-amber-500" />
                      <span className="text-caption font-bold">Cảm giác khô căng</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {DRYNESS_OPTIONS.map((opt) => {
                        const isSelected = getDrynessSelected(metrics.dryness) === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setMetrics((m) => ({ ...m, dryness: opt.dryness }));
                              if (metricsSource === "ai") setUserCorrected(true);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-fg bg-fg/[0.02] font-bold shadow-sm"
                                : "border-line bg-surface/30 hover:border-fg/20"
                            }`}
                          >
                            <span className="text-caption font-bold block text-fg">{opt.label}</span>
                            <span className="text-micro text-muted mt-0.5 block font-normal leading-relaxed">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. ShieldAlert: Irritation & Comfort */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border border-line shadow-soft">
                    <div className="flex items-center gap-2 text-fg border-b border-line pb-2 mb-2">
                      <ShieldAlert size={15} className="text-red-500" />
                      <span className="text-caption font-bold">Độ nhạy cảm & kích ứng</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {IRRITATION_OPTIONS.map((opt) => {
                        const isSelected = getIrritationSelected(metrics.redness, metrics.barrierComfort) === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setMetrics((m) => ({ ...m, redness: opt.redness, barrierComfort: opt.barrierComfort }));
                              if (metricsSource === "ai") setUserCorrected(true);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-fg bg-fg/[0.02] font-bold shadow-sm"
                                : "border-line bg-surface/30 hover:border-fg/20"
                            }`}
                          >
                            <span className="text-caption font-bold block text-fg">{opt.label}</span>
                            <span className="text-micro text-muted mt-0.5 block font-normal leading-relaxed">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. AlertCircle: Acne */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border border-line shadow-soft">
                    <div className="flex items-center gap-2 text-fg border-b border-line pb-2 mb-2">
                      <AlertCircle size={15} className="text-emerald-500" />
                      <span className="text-caption font-bold">Tình trạng mụn</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {ACNE_OPTIONS.map((opt) => {
                        const isSelected = getAcneSelected(metrics.acne) === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setMetrics((m) => ({ ...m, acne: opt.acne }));
                              if (metricsSource === "ai") setUserCorrected(true);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-fg bg-fg/[0.02] font-bold shadow-sm"
                                : "border-line bg-surface/30 hover:border-fg/20"
                            }`}
                          >
                            <span className="text-caption font-bold block text-fg">{opt.label}</span>
                            <span className="text-micro text-muted mt-0.5 block font-normal leading-relaxed">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Lifestyle Tags & Routine */}
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-line shadow-soft">
                  <span className="text-micro font-bold text-muted uppercase tracking-wider">Hoạt động & Thói quen</span>
                  
                  <div className="flex flex-wrap gap-2">
                    {LIFESTYLE_OPTIONS.map((tag) => {
                      const active = lifestyle.includes(tag.value);
                      return (
                        <button
                          key={tag.value}
                          onClick={() => toggleLifestyle(tag.value)}
                          className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                            active ? "bg-fg text-bg border-fg" : "bg-surface text-muted border-line hover:border-fg/30"
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => setAmDone(!amDone)} className={`border rounded-xl p-2.5 flex items-center justify-center gap-2 transition-all ${amDone ? "border-fg bg-fg/[0.04] font-bold" : "border-line bg-surface hover:border-fg/30 text-muted"}`}>
                      <span>🌅</span><span className="text-caption">Sáng</span>
                      {amDone && <CheckCircle2 size={14} className="text-success" />}
                    </button>
                    <button onClick={() => setPmDone(!pmDone)} className={`border rounded-xl p-2.5 flex items-center justify-center gap-2 transition-all ${pmDone ? "border-fg bg-fg/[0.04] font-bold" : "border-line bg-surface hover:border-fg/30 text-muted"}`}>
                      <span>🌙</span><span className="text-caption">Tối</span>
                      {pmDone && <CheckCircle2 size={14} className="text-success" />}
                    </button>
                  </div>
                </div>

                {/* Diet Tags */}
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-line shadow-soft">
                  <span className="text-micro font-bold text-muted uppercase tracking-wider">Dinh dưỡng hôm nay</span>
                  <div className="flex flex-wrap gap-2">
                    {DIET_OPTIONS.map((tag) => {
                      const active = diet.includes(tag.value);
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => {
                            setDiet((prev) =>
                              prev.includes(tag.value)
                                ? prev.filter((t) => t !== tag.value)
                                : [...prev, tag.value]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                            active ? "bg-fg text-bg border-fg" : "bg-surface text-muted border-line hover:border-fg/30"
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú thêm (tuỳ chọn)..."
                    className="w-full bg-white border border-line rounded-2xl p-4 text-caption text-fg outline-none focus:border-fg h-20 resize-none transition-all placeholder:text-muted/60 shadow-soft"
                  />
                </div>

                {streakLabel && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 py-3 bg-fg/[0.03] border border-line rounded-2xl">
                    <Flame size={16} className="text-fg" />
                    <span className="text-caption font-bold text-fg">{streakLabel}</span>
                  </motion.div>
                )}

                <button onClick={handleFullSave}
                  className="w-full py-4 bg-fg text-bg rounded-2xl text-caption font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg mb-8">
                  <CheckCircle2 size={18} /> Hoàn tất lưu nhật ký
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
