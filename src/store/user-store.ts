import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@/types";

interface UserStore extends UserProfile {
  setGuest: (guest: boolean) => void;
  setQuizStep: (step: number) => void;
  setSkinType: (type: string) => void;
  toggleConcern: (concern: string) => void;
  setBudget: (budget: string) => void;
  setTotalBudget: (totalBudget: number) => void;
  setBudgetStrategy: (strategy: "even" | "serum" | "save") => void;
  toggleAllergy: (allergy: string) => void;
  setQuizCompleted: (completed: boolean) => void;
  setBarrier: (barrier: string) => void;
  setLifestyle: (lifestyle: string[]) => void;
  setPreference: (preference: string) => void;
  setProfileMetadata: (title: string, mainGoal: string, barrierStatus: "stable" | "redness" | "flaking" | "stinging") => void;
  setBarrierStatus: (status: "stable" | "redness" | "flaking" | "stinging") => void;

  setBirthYear: (year: number | undefined) => void;
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
  isGuest: false,
  quizStep: 1,
  skinType: "",
  concerns: [],
  budget: "",
  totalBudget: 1500000,
  budgetStrategy: "even",
  allergies: [],
  quizCompleted: false,
  barrier: "",
  barrierStatus: "stable",
  lifestyle: [],
  preference: "",
  title: "",
  mainGoal: "",

  birthYear: undefined,
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
      setGuest: (guest) => set({ isGuest: guest }),
      setQuizStep: (step) => set({ quizStep: step }),
      setSkinType: (type) => set({ skinType: type }),
      toggleConcern: (concern) =>
        set((state) => ({
          concerns: state.concerns.includes(concern)
            ? state.concerns.filter((c) => c !== concern)
            : [...state.concerns, concern],
        })),
      setBudget: (budget) => set({ budget }),
      setTotalBudget: (totalBudget) => {
        let budget = "mid-range";
        if (totalBudget <= 200000) budget = "budget";
        else if (totalBudget <= 400000) budget = "affordable";
        else if (totalBudget <= 1000000) budget = "mid-range";
        else if (totalBudget <= 3000000) budget = "premium";
        else budget = "luxury";
        set({ totalBudget, budget });
      },
      setBudgetStrategy: (budgetStrategy) => set({ budgetStrategy }),
      toggleAllergy: (allergy) =>
        set((state) => ({
          allergies: state.allergies.includes(allergy)
            ? state.allergies.filter((a) => a !== allergy)
            : [...state.allergies, allergy],
        })),
      setQuizCompleted: (completed) => set({ quizCompleted: completed }),
      setBarrier: (barrier) => set({ barrier }),
      setLifestyle: (lifestyle) => set({ lifestyle }),
      setPreference: (preference) => set({ preference }),
      setProfileMetadata: (title, mainGoal, barrierStatus) => set({ title, mainGoal, barrierStatus }),
      setBarrierStatus: (status) => set({ barrierStatus: status }),

      setBirthYear: (year) => set({ birthYear: year }),
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

