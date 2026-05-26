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
  };
  lifestyle: string[];
  note: string;
  image?: string | null;
}

interface JournalState {
  diaryLogs: DiaryLog[];
  recoveryMode: boolean;
  addDiaryLog: (log: Omit<DiaryLog, "id">) => void;
  setRecoveryMode: (mode: boolean) => void;
  clearJournal: () => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      diaryLogs: [],
      recoveryMode: false,
      addDiaryLog: (log) =>
        set((state) => {
          const newLog = { ...log, id: Date.now() };
          // Keep logs unique by date. If date already logged, replace it, otherwise prepend.
          const filtered = state.diaryLogs.filter((l) => l.date !== log.date);
          return {
            diaryLogs: [newLog, ...filtered],
          };
        }),
      setRecoveryMode: (mode) => set({ recoveryMode: mode }),
      clearJournal: () => set({ diaryLogs: [], recoveryMode: false }),
    }),
    {
      name: "skinwise-journal",
      skipHydration: true,
    }
  )
);

if (typeof window !== 'undefined') {
  useJournalStore.persist.rehydrate();
}
