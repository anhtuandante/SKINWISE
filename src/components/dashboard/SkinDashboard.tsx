"use client";

import { useSkinStore } from "@/store/useSkinStore";
import { useUserStore } from "@/store/user-store";
import { useRoutineStore } from "@/store/routine-store";
import { calculateSkinScore } from "@/utils/trendAnalysis";
import { SkinPredictorNetwork } from "@/utils/skinPredictor";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Camera,
  Settings,
  Check,
  ChevronDown,
  ChevronUp,
  Droplets,
  Sun,
  ShieldAlert,
  Info,
  Calendar,
  Sparkle,
  Brain,
  Download,
  Upload,
  Trash2
} from "lucide-react";
import { getCyclePhase } from "@/utils/cyclePredictor";
import { useToastStore } from "@/store/toast-store";
import TrendVisualizer from "./TrendVisualizer";
import VisionLab from "@/components/quiz/VisionLab";
import SkinCheckinFlow from "./SkinCheckinFlow";
import { cn } from "@/lib/utils";

const METRIC_LABELS: Record<string, string> = {
  acne: "Mụn",
  redness: "Mẩn đỏ",
  pores: "Lỗ chân lông",
  oiliness: "Dầu thừa",
  dryness: "Khô căng",
  barrierComfort: "Dễ chịu",
  texture: "Kết cấu"
};

interface CityWeather {
  name: string;
  uv: number;
  status: string;
  desc: string;
  advice: string;
  icon: string;
}

interface SkinDashboardProps {
  onNavigate: (tab: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  citiesWeather: Record<string, CityWeather>;
}

export default function SkinDashboard({
  onNavigate,
  selectedCity,
  setSelectedCity,
  citiesWeather
}: SkinDashboardProps) {
  const user = useUserStore();
  const routine = useRoutineStore();
  const { diaryLogs, pinnedMetrics, setPinnedMetrics } = useSkinStore();

  const [showVisionModal, setShowVisionModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [tempPinnedMetrics, setTempPinnedMetrics] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const addToast = useToastStore((s) => s.addToast);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [tempCycleDate, setTempCycleDate] = useState(user.cycleStartDate || "");
  const [tempCycleLength, setTempCycleLength] = useState(user.cycleLength || 28);
  const [settingsTab, setSettingsTab] = useState<"metrics" | "backup">("metrics");

  const [mounted, setMounted] = useState(false);
  const isSkinStoreHydrated = useSkinStore((s) => s.isHydrated);
  const isUserStoreHydrated = useUserStore((s) => s.isHydrated);

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
      setShowCheckinModal(true);
    };
    window.addEventListener("open-checkin-flow", handler as EventListener);
    return () => window.removeEventListener("open-checkin-flow", handler as EventListener);
  }, []);

  // Format today's date (DD/MM/YYYY)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }, []);

  // Today's log
  const todayLog = useMemo(() => {
    return diaryLogs.find((log) => log.date === todayStr);
  }, [diaryLogs, todayStr]);

  // Format yesterday's date (DD/MM/YYYY)
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }, []);

  // Yesterday's log
  const yesterdayLog = useMemo(() => {
    return diaryLogs.find((log) => log.date === yesterdayStr);
  }, [diaryLogs, yesterdayStr]);

  // Latest log (fallback)
  const latestLog = useMemo(() => {
    if (diaryLogs.length === 0) return null;
    return diaryLogs[diaryLogs.length - 1];
  }, [diaryLogs]);

  // Initialize Predictor model
  const predictor = useMemo(() => new SkinPredictorNetwork(), []);

  // Online training in background when logs update
  useEffect(() => {
    if (diaryLogs.length >= 2) {
      predictor.trainOnLogs(diaryLogs);
    }
  }, [diaryLogs, predictor]);

  // Compute tomorrow's forecast if today is logged
  const forecast = useMemo(() => {
    if (!todayLog) return null;
    return predictor.getForecast(yesterdayLog || null, todayLog, user);
  }, [todayLog, yesterdayLog, predictor, user]);

  // Active metrics to calculate score
  const todayMetrics = useMemo(() => {
    return todayLog?.metrics || latestLog?.metrics || {
      acne: user.concerns.includes("acne") ? 3 : 1,
      redness: user.skinType === "sensitive" || (user.barrierStatus === "redness" || user.barrierStatus === "stinging" || user.barrierStatus === "flaking") ? 4 : 1,
      oiliness: user.skinType === "oily" ? 4 : 2,
      dryness: user.skinType === "dry" ? 4 : 2,
      barrierComfort: (user.barrierStatus === "stinging" || user.barrierStatus === "flaking" || user.barrierStatus === "redness") ? 4 : 8,
      pores: 2,
      texture: 2
    };
  }, [todayLog, latestLog, user.concerns, user.skinType, user.barrierStatus]);

  // Today's score
  const todayScore = useMemo(() => {
    return calculateSkinScore(todayMetrics);
  }, [todayMetrics]);

  // Score count-up micro-animation (Tắt theo feedback user)
  const [displayScore, setDisplayScore] = useState(todayScore);
  useEffect(() => {
    setDisplayScore(todayScore);
  }, [todayScore]);

  // Today's glance strip items status
  const hydrationStatus = useMemo(() => {
    if (!todayLog) return null;
    // Calculated based on texture metric (0-10 scale where high texture is bad/dry)
    const texture = todayLog.metrics.texture ?? 0;
    if (texture >= 7) return { label: "Thấp 💧", color: "text-red-500 bg-red-50" };
    if (texture >= 4) return { label: "Bình thường 💧", color: "text-blue-500 bg-blue-50" };
    return { label: "Tốt 💧", color: "text-green-500 bg-green-50" };
  }, [todayLog]);

  const hasSunscreen = useMemo(() => {
    return routine.morningRoutine.some((p) => p.category === "sunscreen");
  }, [routine.morningRoutine]);

  const irritationAlert = useMemo(() => {
    const redness = todayMetrics.redness ?? 0;
    // High alert if redness > 50 (on 0-100 scale; if 1-5 scale, we normalize to 20-100)
    const normalizedRedness = redness > 10 ? redness : redness * 20;
    return normalizedRedness > 50;
  }, [todayMetrics]);

  // Available metrics for customization
  const availableMetrics = Object.keys(METRIC_LABELS);

  const handleOpenCustomize = () => {
    setTempPinnedMetrics(pinnedMetrics);
    setShowCustomizeModal(true);
  };

  const cycleInfo = useMemo(() => {
    return getCyclePhase(user.cycleStartDate, user.cycleLength || 28);
  }, [user.cycleStartDate, user.cycleLength]);

  const handleSelectMetric = (key: string) => {
    if (tempPinnedMetrics.includes(key)) {
      setTempPinnedMetrics(tempPinnedMetrics.filter((m) => m !== key));
    } else {
      if (tempPinnedMetrics.length < 5) {
        setTempPinnedMetrics([...tempPinnedMetrics, key]);
      } else {
        addToast("Bạn chỉ có thể ghim tối đa 5 chỉ số da.", "info");
      }
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        userStore: useUserStore.getState(),
        skinStore: useSkinStore.getState(),
        routineStore: useRoutineStore.getState(),
        exportedAt: new Date().toISOString(),
        version: "1.0.0"
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skinwise_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("Đã xuất file sao lưu thành công!", "success");
    } catch (err) {
      console.error(err);
      addToast("Không thể tạo file sao lưu.", "error");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        
        if (!data.userStore || !data.skinStore || !data.routineStore) {
          addToast("File sao lưu không hợp lệ.", "error");
          return;
        }

        // Restore stores
        useUserStore.setState(data.userStore);
        useSkinStore.setState(data.skinStore);
        useRoutineStore.setState(data.routineStore);

        addToast("Khôi phục dữ liệu thành công! Đang tải lại...", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error(err);
        addToast("Không thể đọc file sao lưu. Vui lòng thử lại.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa sạch tất cả nhật ký, chu trình skincare và hồ sơ chẩn đoán da của bạn. Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?")) {
      useUserStore.getState().resetQuiz();
      useSkinStore.getState().clearJournal();
      useRoutineStore.getState().clearRoutine();
      addToast("Đã xóa toàn bộ dữ liệu trên thiết bị.", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const isLoggedToday = !!todayLog;

  if (!mounted || !isSkinStoreHydrated || !isUserStoreHydrated) {
    return (
      <div className="flex items-center justify-center p-20 bg-white border border-line rounded-[32px] shadow-soft animate-pulse">
        <span className="text-caption text-muted font-bold">Đang tải Dashboard...</span>
      </div>
    );
  }

  if (!user.quizCompleted) {
    return (
      <div className="border border-line rounded-[32px] p-10 bg-white shadow-soft text-center space-y-5 animate-in mt-10">
        <div className="w-16 h-16 bg-fg/5 rounded-full flex items-center justify-center mx-auto">
          <Sparkles size={28} className="text-accent" />
        </div>
        <h2 className="text-headline font-semibold">Chào mừng đến với SkinWise</h2>
        <p className="text-body text-muted max-w-md mx-auto leading-relaxed">
          Hãy hoàn thành bài kiểm tra ngắn gọn về làn da để SkinWise AI có thể tạo chu trình dưỡng da và theo dõi chỉ số sức khỏe da riêng biệt dành cho bạn.
        </p>
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2 bg-fg text-bg px-6 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
        >
          <Sparkles size={16} /> Bắt đầu chẩn đoán da
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero Skin Score Section */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Sparkle size={180} />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent animate-pulse" />
            <span className="text-accent text-[10px] font-extrabold uppercase tracking-widest">Chỉ số sức khỏe da</span>
          </div>
          <button
            onClick={handleOpenCustomize}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
            title="Tùy chỉnh chỉ số ghim"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-caption text-slate-400 font-bold uppercase tracking-wider">Hôm nay</h2>
            <div className="flex items-baseline gap-2">
              {/* Score animated counter */}
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-6xl font-extrabold tracking-tight text-white inline-block"
              >
                {displayScore}
              </motion.span>
              <span className="text-body text-slate-400">/100</span>
            </div>
            <p className="text-caption text-slate-300">
              Trạng thái:{" "}
              <span className="font-bold text-accent">
                {todayScore >= 75
                  ? "Khỏe mạnh & Ổn định"
                  : todayScore >= 50
                  ? "Nhạy cảm nhẹ"
                  : "Đang tổn thương / Cần phục hồi gấp"}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2 bg-white/5 border border-white/10 p-5 rounded-2xl max-w-sm">
            <p className="text-micro font-bold text-slate-400 uppercase tracking-widest">Lời khuyên từ AI</p>
            <p className="text-caption text-slate-200 leading-relaxed">
              {(user.barrierStatus === "stinging" || user.barrierStatus === "flaking" || user.barrierStatus === "redness")
                ? "Hàng rào da của bạn đang mỏng yếu. Ưu tiên cấp ẩm phục hồi và dừng các hoạt chất đặc trị mạnh."
                : todayScore >= 75
                ? "Làn da đang ở trạng thái tốt nhất. Bạn có thể duy trì treatment hoặc tập trung dưỡng sáng nhẹ."
                : "Thời tiết khắc nghiệt dễ gây mất ẩm. Hãy uống đủ nước và bôi dưỡng ẩm kết cấu mỏng nhẹ."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Today at a Glance Strip */}
      <div className="bg-white border border-line rounded-2xl p-4 shadow-soft">
        <div className="grid grid-cols-3 divide-x divide-line">
          {/* Hydration Status */}
          <div className="relative group flex justify-center w-full">
            <div
              onClick={() => onNavigate("journal")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1 cursor-pointer transition-all hover:scale-[1.01]",
                !isLoggedToday && "opacity-60 saturate-50 hover:opacity-100 hover:saturate-100"
              )}
            >
              <div className={cn("p-2 rounded-full", isLoggedToday && hydrationStatus ? hydrationStatus.color : "text-muted bg-line/25")}>
                <Droplets size={16} />
              </div>
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Độ ẩm</span>
              <span className="text-caption font-bold text-fg">
                {isLoggedToday && hydrationStatus ? hydrationStatus.label.replace(" 💧", "") : "Chưa log"}
              </span>
            </div>
            {!isLoggedToday && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md whitespace-nowrap z-30 pointer-events-none">
                Nhấp để Check-in! 📝
              </div>
            )}
          </div>

          {/* Sun Protection Status */}
          <div className="relative group flex justify-center w-full">
            <div
              onClick={() => onNavigate(isLoggedToday ? "routine" : "journal")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1 cursor-pointer transition-all hover:scale-[1.01]",
                !isLoggedToday && "opacity-60 saturate-50 hover:opacity-100 hover:saturate-100"
              )}
            >
              <div className={cn("p-2 rounded-full", isLoggedToday && hasSunscreen ? "text-amber-500 bg-amber-50" : "text-muted bg-line/25")}>
                <Sun size={16} />
              </div>
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Chống nắng</span>
              <span className="text-caption font-bold text-fg">
                {isLoggedToday ? (hasSunscreen ? "Đang bảo vệ" : "Chưa bôi") : "Chưa log"}
              </span>
            </div>
            {!isLoggedToday && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md whitespace-nowrap z-30 pointer-events-none">
                Nhấp để Check-in! 📝
              </div>
            )}
          </div>

          {/* Irritation alert */}
          <div className="relative group flex justify-center w-full">
            <div
              onClick={() => onNavigate("journal")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1 cursor-pointer transition-all hover:scale-[1.01]",
                !isLoggedToday && "opacity-60 saturate-50 hover:opacity-100 hover:saturate-100"
              )}
            >
              <div className={cn("p-2 rounded-full", isLoggedToday ? (irritationAlert ? "text-red-500 bg-red-50" : "text-green-500 bg-green-50") : "text-muted bg-line/25")}>
                <ShieldAlert size={16} />
              </div>
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Kích ứng</span>
              <span className="text-caption font-bold text-fg">
                {isLoggedToday ? (irritationAlert ? "Cảnh báo ⚠️" : "An toàn ✅") : "Chưa log"}
              </span>
            </div>
            {!isLoggedToday && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md whitespace-nowrap z-30 pointer-events-none">
                Nhấp để Check-in! 📝
              </div>
            )}
          </div>
        </div>

        {!isLoggedToday && (
          <div 
            className="text-center text-micro text-muted border-t border-line mt-3 pt-2 font-bold cursor-pointer hover:text-fg hover:scale-[1.005] transition-all" 
            onClick={() => onNavigate("journal")}
          >
            👉 Bạn chưa cập nhật nhật ký da hôm nay. Click để Check-in ngay!
          </div>
        )}
      </div>

      {/* AI Tomorrow's Skin Forecast */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-4">
        <h3 className="text-body font-bold text-fg flex items-center gap-2">
          <Brain size={18} className="text-indigo-500 animate-pulse" />
          <span>Dự báo làn da ngày mai (AI Predictor)</span>
        </h3>
        
        {!todayLog ? (
          <div className="bg-indigo-500/[0.01] border border-indigo-500/10 rounded-xl p-4 text-center space-y-2">
            <p className="text-caption text-muted">
              Nhập nhật ký da hôm nay để AI phân tích thói quen và dự đoán trạng thái da ngày mai của bạn.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("journal")}
              className="text-caption text-indigo-600 hover:underline font-bold"
            >
              Check-in ngay &rarr;
            </button>
          </div>
        ) : (
          forecast && (
            <div className="space-y-4 animate-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Predictor */}
                <div className="border border-line rounded-xl p-4 bg-surface/30 flex items-center justify-between">
                  <div>
                    <span className="text-micro font-bold text-muted uppercase block">Điểm da dự đoán</span>
                    <span className="text-xl font-extrabold text-fg">{forecast.score}/100</span>
                  </div>
                  {(() => {
                    const diff = forecast.score - todayScore;
                    if (diff > 0) {
                      return (
                        <span className="text-micro font-bold bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          ▲ +{diff}
                        </span>
                      );
                    }
                    if (diff < 0) {
                      return (
                        <span className="text-micro font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          ▼ {diff}
                        </span>
                      );
                    }
                    return (
                      <span className="text-micro font-bold bg-line/25 text-muted px-2 py-0.5 rounded-full">
                        — 0
                      </span>
                    );
                  })()}
                </div>

                {/* Acne Predictor */}
                <div className="border border-line rounded-xl p-4 bg-surface/30 flex flex-col justify-center">
                  <span className="text-micro font-bold text-muted uppercase block">Mụn trứng cá</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-caption font-bold">
                      {forecast.acne === 1 ? "Rất thấp ✅" : forecast.acne === 2 ? "Thấp" : forecast.acne === 3 ? "Trung bình" : forecast.acne === 4 ? "Cao ⚠️" : "Rất cao 🚨"}
                    </span>
                    <span className="text-micro text-muted font-bold">({forecast.acne}/5)</span>
                  </div>
                </div>

                {/* Redness Predictor */}
                <div className="border border-line rounded-xl p-4 bg-surface/30 flex flex-col justify-center">
                  <span className="text-micro font-bold text-muted uppercase block">Đỏ da & Kích ứng</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-caption font-bold">
                      {forecast.redness === 1 ? "An toàn ✅" : forecast.redness === 2 ? "Nhẹ" : forecast.redness === 3 ? "Kích ứng nhẹ" : forecast.redness === 4 ? "Kích ứng ⚠️" : "Bùng phát đỏ rát 🚨"}
                    </span>
                    <span className="text-micro text-muted font-bold">({forecast.redness}/5)</span>
                  </div>
                </div>
              </div>

              {/* Risk/Benefit factors explanation */}
              {forecast.riskFactors.length > 0 ? (
                <div className="p-3 bg-red-500/5 border border-red-500/10 text-red-500/90 rounded-xl text-caption flex items-start gap-2">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <span className="font-bold">Các yếu tố nguy cơ:</span> Ngày mai da bạn có thể bị ảnh hưởng tiêu cực do hôm nay {forecast.riskFactors.join(", ")}.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-500/5 border border-green-500/10 text-green-600 rounded-xl text-caption flex items-start gap-2">
                  <span className="text-base shrink-0">🎉</span>
                  <div>
                    <span className="font-bold">Làn da tối ưu:</span> Da ngày mai dự kiến sẽ cải thiện nhờ thói quen sinh hoạt lành mạnh và thực hiện routine đầy đủ!
                  </div>
                </div>
              )}

              {/* AI Recommendation dynamic box */}
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-caption leading-relaxed">
                <span className="font-bold text-indigo-700 block mb-1">💡 Lời khuyên ngừa kích ứng ngày mai:</span>
                {(() => {
                  if (forecast.redness >= 3) {
                    return "Hôm nay hàng rào da chịu áp lực hoặc dùng treatment nặng. Tối nay hãy ưu tiên kem dưỡng phục hồi chứa B5, Ceramide, Centella. Tạm ngưng AHA/BHA/Retinol nếu cảm thấy châm chích.";
                  }
                  if (forecast.acne >= 3) {
                    return "Mụn có dấu hiệu gia tăng. Tránh nặn mụn tay, tăng cường làm sạch với sữa rửa mặt dịu nhẹ tối nay. Sử dụng thêm tinh chất tràm trà hoặc chấm mụn salicylic acid ở nốt sưng.";
                  }
                  if (todayLog.lifestyle.includes("Quên chống nắng")) {
                    return "Hôm nay bạn quên chống nắng. Da đang bị tổn thương âm thầm bởi tia UV. Hãy đắp mặt nạ cấp ẩm làm dịu tối nay và tuyệt đối không quên thoa kem chống nắng vào sáng mai.";
                  }
                  return "Chỉ số da đang ở mức an toàn. Hãy duy trì routine dưỡng ẩm tối nay và bôi chống nắng bảo vệ vào ngày mai.";
                })()}
              </div>
            </div>
          )
        )}
      </div>

      {/* 2b. Menstrual Cycle Skin Predictor */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-body font-bold text-fg flex items-center gap-2">
            <Calendar size={18} className="text-pink-500" />
            <span>Theo dõi chu kỳ & Mụn nội tiết</span>
          </h3>
          <button
            onClick={() => {
              setTempCycleDate(user.cycleStartDate || "");
              setTempCycleLength(user.cycleLength || 28);
              setShowCycleModal(true);
            }}
            className="p-1.5 hover:bg-surface border border-line rounded-lg text-muted hover:text-fg transition-all text-micro font-bold flex items-center gap-1 select-none"
          >
            <Settings size={12} /> Cài đặt
          </button>
        </div>

        {user.cycleStartDate ? (
          cycleInfo && (
            <div className="space-y-4 animate-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-pink-500/[0.02] border border-pink-500/10">
                <div className="space-y-1">
                  <span className="text-micro font-bold text-pink-600 uppercase tracking-wider block">
                    {cycleInfo.label} (Ngày {cycleInfo.day}/{user.cycleLength})
                  </span>
                  <p className="text-caption text-fg font-medium leading-relaxed">{cycleInfo.desc}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {cycleInfo.phase === "luteal" ? (
                    <span className="px-2.5 py-1 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/10 uppercase tracking-wider animate-pulse">
                      ⚠️ Nguy cơ mụn cao
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-green-500/10 text-green-600 text-[10px] font-bold border border-green-500/10 uppercase tracking-wider">
                      ✅ Da ổn định
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-surface/50 border border-line rounded-xl text-caption leading-relaxed flex gap-2">
                <span className="text-base shrink-0">💡</span>
                <div>
                  <span className="font-bold text-fg block mb-1">Lời khuyên chăm sóc da chu kỳ:</span>
                  <p className="text-muted">{cycleInfo.advice}</p>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="bg-surface/50 border border-line rounded-xl p-6 text-center space-y-3">
            <p className="text-caption text-muted max-w-sm mx-auto">
              Chưa kích hoạt theo dõi chu kỳ nội tiết. Hãy bật để AI dự đoán nguy cơ bùng phát mụn nội tiết (hormonal acne) và tối ưu hóa chu trình dưỡng da.
            </p>
            <button
              type="button"
              onClick={() => {
                setTempCycleDate(new Date().toISOString().split("T")[0]);
                setTempCycleLength(28);
                setShowCycleModal(true);
              }}
              className="px-4 py-2 bg-fg text-bg hover:opacity-90 rounded-xl text-caption font-bold transition-all shadow-sm"
            >
              + Kích hoạt theo dõi
            </button>
          </div>
        )}
      </div>

      {/* 3. Action CTAs */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowVisionModal(true)}
          className="bg-fg hover:bg-slate-900 text-bg py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-md transition-all active:scale-[0.99]"
        >
          <Camera size={18} />
          Quét sản phẩm mới (OCR)
        </button>
        <button
          onClick={() => {
            const isFullLoggedToday = todayLog && !todayLog.isPartial;
            if (isFullLoggedToday) {
              onNavigate("journal");
            } else {
              if (todayLog) {
                setCheckinStartStep(1);
                setCheckinInitialMood(todayLog.mood);
                setCheckinTargetDateStr(todayLog.date);
              } else {
                setCheckinStartStep(0);
                setCheckinInitialMood(null);
                setCheckinTargetDateStr(todayStr);
              }
              setShowCheckinModal(true);
            }
          }}
          className="bg-white hover:bg-surface border border-line text-fg py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-md transition-all active:scale-[0.99]"
        >
          <Calendar size={18} />
          {todayLog && !todayLog.isPartial ? "Xem nhật ký da" : todayLog ? "Bổ sung nhật ký" : "Check-in da (3s)"}
        </button>
      </div>

      {/* 4. Trend Visualizer */}
      <TrendVisualizer />

      {/* 5. See More Panel (Avoid cognitive overload) */}
      <div className="border border-line rounded-[24px] bg-white overflow-hidden shadow-soft">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-5 flex items-center justify-between text-body font-bold text-fg hover:bg-line/5 transition-all"
        >
          <span className="flex items-center gap-2">
            <Info size={16} className="text-muted" />
            Xem khuyến nghị thời tiết & UV hôm nay
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-line p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-4xl shrink-0">{citiesWeather[selectedCity].icon}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-body font-bold text-fg">Khí hậu & Chỉ số UV</h4>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="bg-surface border border-line rounded-lg text-caption px-2 py-1 outline-none text-fg font-medium"
                      >
                        {Object.entries(citiesWeather).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-caption text-muted mt-1 leading-relaxed">
                      Chỉ số UV: <span className="text-danger font-bold">{citiesWeather[selectedCity].uv}/11</span> ({citiesWeather[selectedCity].status})
                    </p>
                    <p className="text-caption text-muted leading-relaxed mt-1">{citiesWeather[selectedCity].advice}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. Vision Scanner Modal */}
      {showVisionModal && (
        <VisionLab
          onComplete={() => setShowVisionModal(false)}
          onClose={() => setShowVisionModal(false)}
        />
      )}

      {/* 6b. Check-in Flow Modal */}
      {showCheckinModal && (
        <SkinCheckinFlow
          initialMood={checkinInitialMood}
          startStep={checkinStartStep}
          targetDateStr={checkinTargetDateStr}
          onComplete={() => {
            setShowCheckinModal(false);
            setCheckinStartStep(0);
            setCheckinInitialMood(null);
            setCheckinTargetDateStr(undefined);
          }}
          onClose={() => {
            setShowCheckinModal(false);
            setCheckinStartStep(0);
            setCheckinInitialMood(null);
            setCheckinTargetDateStr(undefined);
          }}
        />
      )}

      {/* 7. Settings & Customization Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-bg border border-line rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in">
            {/* Header with Tab Switcher */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex bg-line/25 p-1 rounded-xl border border-line/10">
                <button
                  onClick={() => setSettingsTab("metrics")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-caption font-bold transition-all",
                    settingsTab === "metrics" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
                  )}
                >
                  Tùy chọn biểu đồ
                </button>
                <button
                  onClick={() => setSettingsTab("backup")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-caption font-bold transition-all",
                    settingsTab === "backup" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
                  )}
                >
                  Sao lưu dữ liệu
                </button>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="text-caption text-muted hover:text-fg font-bold animate-pulse"
              >
                Đóng
              </button>
            </div>

            {settingsTab === "metrics" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-body font-bold text-fg">Ghim chỉ số da</h3>
                  <p className="text-caption text-muted">Chọn từ 1 đến 5 chỉ số da bạn muốn hiển thị trên biểu đồ xu hướng chính.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {availableMetrics.map((key) => {
                    const isSelected = tempPinnedMetrics.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectMetric(key)}
                        className={cn(
                          "p-3 rounded-xl border text-left flex items-center justify-between font-bold text-[11px] transition-all",
                          isSelected ? "border-fg bg-surface hover:scale-[1.01]" : "border-line bg-bg hover:border-fg/40 hover:scale-[1.01]"
                        )}
                      >
                        <span className="capitalize">{METRIC_LABELS[key] || key}</span>
                        {isSelected && (
                          <span className="w-4 h-4 bg-fg text-bg rounded-full flex items-center justify-center shrink-0">
                            <Check size={10} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setPinnedMetrics(tempPinnedMetrics);
                    setShowCustomizeModal(false);
                  }}
                  disabled={tempPinnedMetrics.length < 1 || tempPinnedMetrics.length > 5}
                  className="w-full py-3 bg-fg text-bg rounded-xl font-bold disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99] transition-all text-caption"
                >
                  Lưu cài đặt biểu đồ ({tempPinnedMetrics.length}/5)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-body font-bold text-fg">Sao lưu & Phục hồi</h3>
                  <p className="text-caption text-muted">Vì toàn bộ dữ liệu của bạn nằm offline trên trình duyệt hiện tại, hãy thường xuyên sao lưu để tránh mất mát dữ liệu.</p>
                </div>

                <div className="space-y-2.5">
                  {/* Export */}
                  <button
                    onClick={handleExportBackup}
                    className="w-full p-4 border border-line bg-surface hover:bg-line/20 rounded-2xl flex items-center gap-3 transition-all text-caption font-bold text-fg hover:scale-[1.005]"
                  >
                    <Download size={16} className="text-accent-dark" />
                    <div className="text-left">
                      <span>Sao lưu dữ liệu ra file (.json)</span>
                      <span className="text-[10px] text-muted block font-normal mt-0.5">Tải xuống toàn bộ nhật ký da và chu trình skincare hiện tại.</span>
                    </div>
                  </button>

                  {/* Import */}
                  <label className="w-full p-4 border border-line bg-surface hover:bg-line/20 rounded-2xl flex items-center gap-3 transition-all text-caption font-bold text-fg hover:scale-[1.005] cursor-pointer block">
                    <div className="flex items-center gap-3">
                      <Upload size={16} className="text-indigo-500" />
                      <div className="text-left">
                        <span>Khôi phục từ file sao lưu</span>
                        <span className="text-[10px] text-muted block font-normal mt-0.5">Chọn file .json đã tải về trước đó để phục hồi dữ liệu.</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>

                  {/* Reset/Clear */}
                  <button
                    onClick={handleClearAllData}
                    className="w-full p-4 border border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/5 rounded-2xl flex items-center gap-3 transition-all text-caption font-bold text-red-500 hover:scale-[1.005]"
                  >
                    <Trash2 size={16} />
                    <div className="text-left">
                      <span>Xóa toàn bộ dữ liệu</span>
                      <span className="text-[10px] text-red-500/60 block font-normal mt-0.5">Xóa vĩnh viễn tất cả chẩn đoán, nhật ký, chu trình và bắt đầu lại từ đầu.</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Menstrual Cycle Settings Modal */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-bg border border-line rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-6 animate-in">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 className="text-body font-bold text-fg">Cài đặt chu kỳ kinh nguyệt</h3>
              <button
                onClick={() => setShowCycleModal(false)}
                className="text-caption text-muted hover:text-fg font-bold"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              user.setCycleStartDate(tempCycleDate);
              user.setCycleLength(tempCycleLength);
              setShowCycleModal(false);
              addToast("Đã lưu cài đặt chu kỳ thành công!", "success");
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-micro font-bold text-muted uppercase tracking-wider block" htmlFor="modal-period-date">
                  Ngày bắt đầu kỳ gần nhất
                </label>
                <input
                  id="modal-period-date"
                  type="date"
                  required
                  value={tempCycleDate}
                  onChange={(e) => setTempCycleDate(e.target.value)}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-caption text-fg outline-none focus:border-fg transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-micro font-bold text-muted uppercase tracking-wider block" htmlFor="modal-cycle-len">
                  Độ dài chu kỳ trung bình (ngày)
                </label>
                <input
                  id="modal-cycle-len"
                  type="number"
                  min={15}
                  max={45}
                  required
                  value={tempCycleLength}
                  onChange={(e) => setTempCycleLength(parseInt(e.target.value) || 28)}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-caption text-fg outline-none focus:border-fg transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    user.setCycleStartDate("");
                    setShowCycleModal(false);
                    addToast("Đã tắt theo dõi chu kỳ.", "info");
                  }}
                  className="flex-1 py-2.5 border border-line hover:bg-surface rounded-xl text-caption font-bold text-red-500 hover:text-red-600 transition-all"
                >
                  Tắt theo dõi
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-fg text-bg hover:opacity-90 rounded-xl text-caption font-bold transition-all"
                >
                  Lưu cài đặt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
