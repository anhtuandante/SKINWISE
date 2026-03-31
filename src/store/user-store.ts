import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@/types";

interface UserStore extends UserProfile {
  setSkinType: (type: string) => void;
  toggleConcern: (concern: string) => void;
  setBudget: (budget: string) => void;
  setAllergies: (allergies: string) => void;
  setQuizCompleted: (completed: boolean) => void;
  resetQuiz: () => void;
}

const initialState: UserProfile = {
  skinType: "",
  concerns: [],
  budget: "",
  allergies: "",
  quizCompleted: false,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSkinType: (type) => set({ skinType: type }),
      toggleConcern: (concern) =>
        set((state) => ({
          concerns: state.concerns.includes(concern)
            ? state.concerns.filter((c) => c !== concern)
            : [...state.concerns, concern],
        })),
      setBudget: (budget) => set({ budget }),
      setAllergies: (allergies) => set({ allergies }),
      setQuizCompleted: (completed) => set({ quizCompleted: completed }),
      resetQuiz: () => set(initialState),
    }),
    {
      name: "skinwise-user",
    }
  )
);
