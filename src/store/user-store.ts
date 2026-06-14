import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@/types";

interface UserStore extends UserProfile {
  setSkinType: (type: string) => void;
  toggleConcern: (concern: string) => void;
  setBudget: (budget: string) => void;
  setTotalBudget: (totalBudget: number) => void;
  setAllergies: (allergies: string) => void;
  setQuizCompleted: (completed: boolean) => void;
  setBarrier: (barrier: string) => void;
  setLifestyle: (lifestyle: string[]) => void;
  setPreference: (preference: string) => void;
  setProfileMetadata: (title: string, mainGoal: string, barrierStatus: "stable" | "redness" | "flaking" | "stinging") => void;
  setBarrierStatus: (status: "stable" | "redness" | "flaking" | "stinging") => void;

  setAge: (age: string) => void;
  setGender: (gender: string) => void;
  setEnvironment: (env: string) => void;
  setMakeupFrequency: (freq: string) => void;
  setTexturePreference: (tex: string) => void;
  toggleActiveIngredient: (ing: string) => void;
  toggleAvoidedIngredient: (ing: string) => void;
  setCycleStartDate: (date: string) => void;
  setCycleLength: (length: number) => void;
  resetQuiz: () => void;
  isHydrated: boolean;
  setHydrated: () => void;
}

const initialState: UserProfile & { isHydrated: boolean } = {
  isHydrated: false,
  skinType: "",
  concerns: [],
  budget: "",
  totalBudget: 1500000,
  allergies: "",
  quizCompleted: false,
  barrier: "",
  barrierStatus: "stable",
  lifestyle: [],
  preference: "",
  title: "",
  mainGoal: "",

  age: "",
  gender: "",
  environment: "",
  makeupFrequency: "",
  texturePreference: "",
  activeIngredients: [],
  avoidedIngredients: [],
  cycleStartDate: "",
  cycleLength: 28,
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
      setTotalBudget: (totalBudget) => set({ totalBudget }),
      setAllergies: (allergies) => set({ allergies }),
      setQuizCompleted: (completed) => set({ quizCompleted: completed }),
      setBarrier: (barrier) => set({ barrier }),
      setLifestyle: (lifestyle) => set({ lifestyle }),
      setPreference: (preference) => set({ preference }),
      setProfileMetadata: (title, mainGoal, barrierStatus) => set({ title, mainGoal, barrierStatus }),
      setBarrierStatus: (status) => set({ barrierStatus: status }),

      setAge: (age) => set({ age }),
      setGender: (gender) => set({ gender }),
      setEnvironment: (environment) => set({ environment }),
      setMakeupFrequency: (makeupFrequency) => set({ makeupFrequency }),
      setTexturePreference: (texturePreference) => set({ texturePreference }),
      toggleActiveIngredient: (ing) =>
        set((state) => ({
          activeIngredients: (state.activeIngredients || []).includes(ing)
            ? (state.activeIngredients || []).filter((c) => c !== ing)
            : [...(state.activeIngredients || []), ing],
        })),
      toggleAvoidedIngredient: (ing) =>
        set((state) => ({
          avoidedIngredients: (state.avoidedIngredients || []).includes(ing)
            ? (state.avoidedIngredients || []).filter((c) => c !== ing)
            : [...(state.avoidedIngredients || []), ing],
        })),
      setCycleStartDate: (date) => set({ cycleStartDate: date }),
      setCycleLength: (length) => set({ cycleLength: length }),
      resetQuiz: () => set(initialState),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "skinwise-user",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

