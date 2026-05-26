import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DiaryLog {
  id: number;
  date: string;
  dayName: string; // T2, T3, T4, T5, T6, T7, CN
  mood: "great" | "okay" | "irritated";
  metrics: {
    oiliness: number;
    dryness: number;
    redness: number;
    acne: number;
    barrierComfort: number;
    pores?: number;
    texture?: number;
  };
  lifestyle: string[];
  note: string;
  image?: string | null;
  amRoutineCompleted?: boolean;
  pmRoutineCompleted?: boolean;
}

interface SkinState {
  diaryLogs: DiaryLog[];
  selectedRange: "day" | "week" | "month";
  pinnedMetrics: string[];
  addDiaryLog: (log: Omit<DiaryLog, "id">) => void;
  deleteDiaryLog: (date: string) => void;
  setRange: (range: "day" | "week" | "month") => void;
  setPinnedMetrics: (metrics: string[]) => void;
  clearJournal: () => void;
}

export const useSkinStore = create<SkinState>()(
  persist(
    (set, get) => ({
      diaryLogs: [],
      selectedRange: "week",
      pinnedMetrics: ["acne", "redness", "pores"],

      addDiaryLog: (log) => {
        const newLog: DiaryLog = {
          ...log,
          id: Date.now(),
          metrics: {
            ...log.metrics,
            // Automatically simulate pores/texture if not provided from VisionLab
            pores: log.metrics.pores ?? Math.max(0, 10 - log.metrics.barrierComfort),
            texture: log.metrics.texture ?? Math.max(0, 10 - log.metrics.oiliness),
          }
        };
        const filtered = get().diaryLogs.filter((l) => l.date !== log.date);
        
        // Sort ascending by date as required
        const updated = [...filtered, newLog].sort(
          (a, b) => new Date(a.date.split("/").reverse().join("-")).getTime() - 
                    new Date(b.date.split("/").reverse().join("-")).getTime()
        );
        
        set({ diaryLogs: updated });
      },

      deleteDiaryLog: (date) => {
        set({ diaryLogs: get().diaryLogs.filter((l) => l.date !== date) });
      },

      setRange: (range) => set({ selectedRange: range }),
      
      setPinnedMetrics: (metrics) => {
        if (metrics.length === 3) {
          set({ pinnedMetrics: metrics });
        }
      },

      clearJournal: () => set({ diaryLogs: [] }),
    }),
    {
      name: "skinwise-skin-store",
      skipHydration: true,
    }
  )
);

// Hydrate store on client side only to prevent SSR mismatch
if (typeof window !== "undefined") {
  useSkinStore.persist.rehydrate();
}
