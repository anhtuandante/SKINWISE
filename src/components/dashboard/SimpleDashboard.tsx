"use client";

import { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Check, Sparkles, Camera } from "lucide-react";

import { useUserStore } from "@/store/user-store";
import { useRoutineStore } from "@/store/routine-store";
import { useSkinStore } from "@/store/useSkinStore";
import { calculateSkinScore } from "@/utils/trendAnalysis";
import { CATEGORY_LABELS } from "@/lib/constants";
import { trackEvent } from "@/lib/tracking";
import { cn } from "@/lib/utils";

// ————————————————————————————————————————————————————————————
// Types
// ————————————————————————————————————————————————————————————

interface SimpleDashboardProps {
  userName?: string;
  onNavigate?: (tab: string) => void;
}

// ————————————————————————————————————————————————————————————
// Helpers
// ————————————————————————————————————————————————————————————

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function getTodayStr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function getDayName(): string {
  const names = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return names[new Date().getDay()];
}

const FADE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

// ————————————————————————————————————————————————————————————
// Component
// ————————————————————————————————————————————————————————————

export default function SimpleDashboard({ userName, onNavigate }: SimpleDashboardProps) {
  const todayStr = useMemo(getTodayStr, []);
  const dayName = useMemo(getDayName, []);
  const greeting = useMemo(getGreeting, []);

  // — Stores —
  const barrierStatus = useUserStore((s) => s.barrierStatus);
  const diaryLogs = useSkinStore((s) => s.diaryLogs);
  const toggleRoutineCompleted = useSkinStore((s) => s.toggleRoutineCompleted);
  const morningRoutine = useRoutineStore((s) => s.morningRoutine);
  const eveningRoutine = useRoutineStore((s) => s.eveningRoutine);

  // — Derived —
  const todayLog = useMemo(
    () => diaryLogs.find((l) => l.date === todayStr),
    [diaryLogs, todayStr],
  );

  const latestMetrics = useMemo(() => {
    if (diaryLogs.length === 0) return null;
    const sorted = [...diaryLogs].sort(
      (a, b) => new Date(b.date.split("/").reverse().join("-")).getTime()
            - new Date(a.date.split("/").reverse().join("-")).getTime(),
    );
    return sorted[0].metrics;
  }, [diaryLogs]);

  const skinScore = useMemo(
    () => (latestMetrics ? calculateSkinScore(latestMetrics) : 72),
    [latestMetrics],
  );

  const statusText = useMemo(() => {
    if (skinScore >= 75) return "Khỏe mạnh & Ổn định";
    if (skinScore >= 50) return "Nhạy cảm nhẹ";
    return "Cần phục hồi";
  }, [skinScore]);

  const aiTip = useMemo(() => {
    switch (barrierStatus) {
      case "redness":   return "Ưu tiên làm dịu — tránh AHA/BHA hôm nay.";
      case "flaking":   return "Tăng cường dưỡng ẩm, hạn chế tẩy da chết.";
      case "stinging":  return "Dùng sản phẩm tối giản, không hương liệu.";
      default:          return "Da ổn định — tiếp tục chu trình hiện tại.";
    }
  }, [barrierStatus]);

  const amDone = todayLog?.amRoutineCompleted ?? false;
  const pmDone = todayLog?.pmRoutineCompleted ?? false;
  const todayMood = todayLog?.mood ?? null;

  // — Handlers —
  const handleToggleRoutine = useCallback(
    (period: "AM" | "PM") => {
      toggleRoutineCompleted(todayStr, period);
      trackEvent("routine_completed_toggle", { period, date: todayStr });
    },
    [todayStr, toggleRoutineCompleted],
  );

  const handleMoodCheckin = useCallback(
    (mood: "great" | "okay" | "irritated") => {
      useSkinStore.getState().addPartialLog(mood, todayStr, dayName);
      trackEvent("page_view", { action: "quick_checkin", mood });
    },
    [todayStr, dayName],
  );

  const handleOpenVisionLab = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-vision-lab"));
    trackEvent("ai_face_scan_start");
  }, []);

  // ——————————————————————————————————————————————————————————
  // Render
  // ——————————————————————————————————————————————————————————

  return (
    <div className="flex flex-col gap-4 pb-6">

      {/* ── Card 1: Skin Score ── */}
      <motion.div
        {...FADE}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 p-5 text-white shadow-soft"
      >
        <p className="text-sm text-white/60">
          {greeting}, <span className="text-white/90 font-medium">{userName || "bạn"}</span>
        </p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-5xl font-bold tracking-tight">{skinScore}</span>
            <span className="ml-1 text-lg text-white/40">/100</span>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              skinScore >= 75
                ? "bg-emerald-500/20 text-emerald-300"
                : skinScore >= 50
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-red-500/20 text-red-300",
            )}
          >
            {statusText}
          </span>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C4A882]" />
          <p className="text-xs leading-relaxed text-white/70">{aiTip}</p>
        </div>
      </motion.div>

      {/* ── Card 2: Routine Tracker ── */}
      <motion.div
        {...FADE}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="rounded-2xl border border-line bg-white p-5 shadow-soft"
      >
        <h3 className="text-sm font-semibold text-fg">Chu trình hôm nay</h3>

        {morningRoutine.length === 0 && eveningRoutine.length === 0 ? (
          <button
            onClick={() => onNavigate?.("products")}
            className="mt-3 w-full rounded-xl border border-dashed border-line py-3 text-sm text-muted hover:border-accent hover:text-accent transition-colors"
          >
            + Thiết lập chu trình
          </button>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {/* AM */}
            <RoutineToggle
              label="Sáng"
              icon={<Sun className="h-4 w-4" />}
              done={amDone}
              products={morningRoutine.map((p) => CATEGORY_LABELS[p.category] || p.name)}
              onToggle={() => handleToggleRoutine("AM")}
            />
            {/* PM */}
            <RoutineToggle
              label="Tối"
              icon={<Moon className="h-4 w-4" />}
              done={pmDone}
              products={eveningRoutine.map((p) => CATEGORY_LABELS[p.category] || p.name)}
              onToggle={() => handleToggleRoutine("PM")}
            />
          </div>
        )}

        {amDone && pmDone && (
          <p className="mt-3 text-center text-sm text-emerald-600 font-medium">
            Hoàn thành cả hai! 🎉
          </p>
        )}
      </motion.div>

      {/* ── Card 3: Quick Check-in ── */}
      <motion.div
        {...FADE}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="rounded-2xl border border-line bg-white p-5 shadow-soft"
      >
        <h3 className="text-sm font-semibold text-fg">Check-in nhanh</h3>

        {todayMood ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
            <Check className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-emerald-700">
              Đã check-in hôm nay ✅ —{" "}
              {todayMood === "great" ? "😊 Tuyệt" : todayMood === "okay" ? "😐 Ổn" : "😟 Kích ứng"}
            </span>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {([
              { mood: "great" as const, emoji: "😊", label: "Tuyệt" },
              { mood: "okay" as const, emoji: "😐", label: "Ổn" },
              { mood: "irritated" as const, emoji: "😟", label: "Kích ứng" },
            ]).map(({ mood, emoji, label }) => (
              <button
                key={mood}
                onClick={() => handleMoodCheckin(mood)}
                className="flex flex-col items-center gap-1 rounded-xl border border-line py-3 text-sm text-muted transition-colors hover:border-accent hover:text-fg active:scale-95"
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleOpenVisionLab}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm text-muted transition-colors hover:bg-slate-100 hover:text-fg"
        >
          <Camera className="h-4 w-4" />
          📸 Chẩn đoán AI
        </button>
      </motion.div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// Sub-component
// ————————————————————————————————————————————————————————————

function RoutineToggle({
  label,
  icon,
  done,
  products,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  done: boolean;
  products: string[];
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition-all active:scale-[0.97]",
        done
          ? "border-emerald-200 bg-emerald-50"
          : "border-line bg-slate-50 hover:border-accent/40",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-fg">
          {icon} {label}
        </div>
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full transition-colors",
            done ? "bg-emerald-500 text-white" : "border border-line bg-white",
          )}
        >
          {done && <Check className="h-3 w-3" />}
        </div>
      </div>

      {products.length > 0 && (
        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted">
          {products.join(" · ")}
        </p>
      )}
    </button>
  );
}
