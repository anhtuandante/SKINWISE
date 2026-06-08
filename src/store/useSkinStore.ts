import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DiaryLog } from "@/types";

// Default metrics based on mood for partial logs
const MOOD_METRIC_DEFAULTS: Record<string, DiaryLog["metrics"]> = {
  great: { oiliness: 1, dryness: 1, redness: 1, acne: 1, barrierComfort: 5 },
  okay: { oiliness: 2, dryness: 2, redness: 2, acne: 2, barrierComfort: 3 },
  irritated: { oiliness: 3, dryness: 3, redness: 4, acne: 4, barrierComfort: 1 },
};

interface SkinState {
  diaryLogs: DiaryLog[];
  selectedRange: "day" | "week" | "month";
  pinnedMetrics: string[];
  checkinStreak: number;
  lastCheckinDate: string | null;
  recoveryMode: boolean;
  isHydrated: boolean;

  addDiaryLog: (log: Omit<DiaryLog, "id">) => void;
  addPartialLog: (mood: DiaryLog["mood"], date: string, dayName: string) => void;
  upgradeLog: (date: string, data: Partial<Omit<DiaryLog, "id" | "date" | "dayName" | "mood">>) => void;
  deleteDiaryLog: (date: string) => void;
  setRange: (range: "day" | "week" | "month") => void;
  setPinnedMetrics: (metrics: string[]) => void;
  clearJournal: () => void;
  setHydrated: () => void;
  setRecoveryMode: (mode: boolean) => void;
}



function parseDateStr(dStr: string): Date {
  const parts = dStr.split("/");
  if (parts.length !== 3) return new Date(0);
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

function sortLogs(logs: DiaryLog[]): DiaryLog[] {
  return [...logs].sort(
    (a, b) => parseDateStr(a.date).getTime() - parseDateStr(b.date).getTime()
  );
}

function calculateStreakFromLogs(logs: DiaryLog[]): { checkinStreak: number; lastCheckinDate: string | null } {
  if (logs.length === 0) return { checkinStreak: 0, lastCheckinDate: null };

  const sorted = sortLogs(logs);
  const uniqueDates = Array.from(new Set(sorted.map((l) => l.date)));
  if (uniqueDates.length === 0) return { checkinStreak: 0, lastCheckinDate: null };

  const lastCheckinStr = uniqueDates[uniqueDates.length - 1];
  const lastCheckinDate = parseDateStr(lastCheckinStr);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const lastCheckinTime = lastCheckinDate.getTime();
  if (lastCheckinTime < yesterday.getTime() && lastCheckinTime < today.getTime()) {
    // Last checkin was before yesterday (and not today either), streak is broken
    return { checkinStreak: 0, lastCheckinDate: lastCheckinStr };
  }

  let streak = 1;
  let currentIdx = uniqueDates.length - 1;

  while (currentIdx > 0) {
    const curr = parseDateStr(uniqueDates[currentIdx]);
    const prev = parseDateStr(uniqueDates[currentIdx - 1]);
    const diffTime = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentIdx--;
    } else if (diffDays === 0) {
      currentIdx--;
    } else {
      break;
    }
  }

  return { checkinStreak: streak, lastCheckinDate: lastCheckinStr };
}

export const useSkinStore = create<SkinState>()(
  persist(
    (set, get) => ({
      isHydrated: false,
      diaryLogs: [],
      selectedRange: "week",
      pinnedMetrics: ["acne", "redness", "pores"],
      checkinStreak: 0,
      lastCheckinDate: null,
      recoveryMode: false,
      setRecoveryMode: (mode) => set({ recoveryMode: mode }),

      addDiaryLog: (log) => {
        const newLog: DiaryLog = {
          ...log,
          id: Date.now(),
          metrics: {
            ...log.metrics,
            pores: log.metrics.pores ?? Math.max(0, 10 - log.metrics.barrierComfort),
            texture: log.metrics.texture ?? Math.max(0, 10 - log.metrics.oiliness),
          }
        };
        const filtered = get().diaryLogs.filter((l) => l.date !== log.date);
        const updated = sortLogs([...filtered, newLog]);
        const streak = calculateStreakFromLogs(updated);
        set({ diaryLogs: updated, ...streak });
      },

      addPartialLog: (mood, date, dayName) => {
        const defaults = MOOD_METRIC_DEFAULTS[mood] || MOOD_METRIC_DEFAULTS.okay;
        const partialLog: DiaryLog = {
          id: Date.now(),
          date,
          dayName,
          mood,
          isPartial: true,
          source: "manual",
          metrics: { ...defaults },
          lifestyle: [],
          note: "",
        };
        const filtered = get().diaryLogs.filter((l) => l.date !== date);
        const updated = sortLogs([...filtered, partialLog]);
        const streak = calculateStreakFromLogs(updated);
        set({ diaryLogs: updated, ...streak });
      },

      upgradeLog: (date, data) => {
        const logs = get().diaryLogs.map((log) => {
          if (log.date !== date) return log;
          return {
            ...log,
            ...data,
            isPartial: false,
            metrics: data.metrics
              ? {
                  ...log.metrics,
                  ...data.metrics,
                  pores: data.metrics.pores ?? Math.max(0, 10 - (data.metrics.barrierComfort ?? log.metrics.barrierComfort)),
                  texture: data.metrics.texture ?? Math.max(0, 10 - (data.metrics.oiliness ?? log.metrics.oiliness)),
                }
              : log.metrics,
          };
        });
        const updated = sortLogs(logs);
        const streak = calculateStreakFromLogs(updated);
        set({ diaryLogs: updated, ...streak });
      },

      deleteDiaryLog: (date) => {
        const updated = get().diaryLogs.filter((l) => l.date !== date);
        const streak = calculateStreakFromLogs(updated);
        set({ diaryLogs: updated, ...streak });
      },

      setRange: (range) => set({ selectedRange: range }),
      
      setPinnedMetrics: (metrics) => {
        if (metrics.length >= 1 && metrics.length <= 7) {
          set({ pinnedMetrics: metrics });
        }
      },

      clearJournal: () => set({ diaryLogs: [], checkinStreak: 0, lastCheckinDate: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "skinwise-skin-store",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
