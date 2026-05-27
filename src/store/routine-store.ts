import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

const MAX_PRODUCTS = 8;

interface RoutineState {
  morningRoutine: Product[];
  eveningRoutine: Product[];
  addToMorning: (product: Product) => boolean;
  addToEvening: (product: Product) => boolean;
  removeFromMorning: (productId: string) => void;
  removeFromEvening: (productId: string) => void;
  reorderMorning: (products: Product[]) => void;
  reorderEvening: (products: Product[]) => void;
  clearRoutine: () => void;
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      morningRoutine: [],
      eveningRoutine: [],

      addToMorning: (product) => {
        const { morningRoutine } = get();
        if (morningRoutine.length >= MAX_PRODUCTS) return false;
        if (morningRoutine.find((p) => p.id === product.id)) return false;
        set({ morningRoutine: [...morningRoutine, product] });
        return true;
      },

      addToEvening: (product) => {
        const { eveningRoutine } = get();
        if (eveningRoutine.length >= MAX_PRODUCTS) return false;
        if (eveningRoutine.find((p) => p.id === product.id)) return false;
        set({ eveningRoutine: [...eveningRoutine, product] });
        return true;
      },

      removeFromMorning: (productId) =>
        set((state) => ({
          morningRoutine: state.morningRoutine.filter((p) => p.id !== productId),
        })),

      removeFromEvening: (productId) =>
        set((state) => ({
          eveningRoutine: state.eveningRoutine.filter((p) => p.id !== productId),
        })),

      reorderMorning: (products) => set({ morningRoutine: products }),
      reorderEvening: (products) => set({ eveningRoutine: products }),

      clearRoutine: () => set({ morningRoutine: [], eveningRoutine: [] }),
    }),
    {
      name: "skinwise-routine",
      skipHydration: true,
    }
  )
);

if (typeof window !== 'undefined') {
  useRoutineStore.persist.rehydrate();
}
