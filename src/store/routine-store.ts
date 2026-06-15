import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

const MAX_PRODUCTS = 8;

interface RoutineState {
  morningRoutine: Product[];
  eveningRoutine: Product[];
  ownedProductIds: string[];
  addToMorning: (product: Product) => boolean;
  addToEvening: (product: Product) => boolean;
  removeFromMorning: (productId: string) => void;
  removeFromEvening: (productId: string) => void;
  reorderMorning: (products: Product[]) => void;
  reorderEvening: (products: Product[]) => void;
  clearRoutine: () => void;
  toggleProductOwned: (productId: string) => void;
  isSnoozed: boolean;
  toggleSnooze: () => void;
  // Phase 3 Features:
  routineVersions: { id: string; name: string; date: string; morningRoutine: Product[]; eveningRoutine: Product[] }[];
  saveRoutineVersion: (name: string) => void;
  restoreRoutineVersion: (id: string) => void;
  deleteRoutineVersion: (id: string) => void;
  dismissedWarnings: string[];
  dismissWarning: (warningId: string) => void;
  pausedProductIds: string[];
  togglePauseProduct: (productId: string) => void;
  updateMorningProduct: (productId: string, updates: Partial<Product>) => void;
  updateEveningProduct: (productId: string, updates: Partial<Product>) => void;

  isHydrated: boolean;
  setHydrated: () => void;
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      isHydrated: false,
      isSnoozed: false,
      morningRoutine: [],
      eveningRoutine: [],
      ownedProductIds: [],
      routineVersions: [],
      dismissedWarnings: [],
      pausedProductIds: [],

      toggleSnooze: () => set((state) => ({ isSnoozed: !state.isSnoozed })),

      saveRoutineVersion: (name) => set((state) => ({
        routineVersions: [
          ...state.routineVersions,
          { id: crypto.randomUUID(), name, date: new Date().toISOString(), morningRoutine: state.morningRoutine, eveningRoutine: state.eveningRoutine }
        ]
      })),
      restoreRoutineVersion: (id) => set((state) => {
        const version = state.routineVersions.find((v) => v.id === id);
        if (version) {
          return { morningRoutine: version.morningRoutine, eveningRoutine: version.eveningRoutine };
        }
        return state;
      }),
      deleteRoutineVersion: (id) => set((state) => ({
        routineVersions: state.routineVersions.filter((v) => v.id !== id)
      })),

      dismissWarning: (warningId) => set((state) => ({
        dismissedWarnings: state.dismissedWarnings.includes(warningId) ? state.dismissedWarnings : [...state.dismissedWarnings, warningId]
      })),

      togglePauseProduct: (productId) => set((state) => ({
        pausedProductIds: state.pausedProductIds.includes(productId)
          ? state.pausedProductIds.filter((id) => id !== productId)
          : [...state.pausedProductIds, productId]
      })),

      updateMorningProduct: (productId, updates) => set((state) => ({
        morningRoutine: state.morningRoutine.map((p) => p.id === productId ? { ...p, ...updates } : p)
      })),

      updateEveningProduct: (productId, updates) => set((state) => ({
        eveningRoutine: state.eveningRoutine.map((p) => p.id === productId ? { ...p, ...updates } : p)
      })),

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
          ownedProductIds: (state.ownedProductIds || []).filter((id) => id !== productId),
        })),

      removeFromEvening: (productId) =>
        set((state) => ({
          eveningRoutine: state.eveningRoutine.filter((p) => p.id !== productId),
          ownedProductIds: (state.ownedProductIds || []).filter((id) => id !== productId),
        })),

      reorderMorning: (products) => set({ morningRoutine: products }),
      reorderEvening: (products) => set({ eveningRoutine: products }),

      clearRoutine: () => set({ morningRoutine: [], eveningRoutine: [], ownedProductIds: [] }),
      toggleProductOwned: (productId) =>
        set((state) => {
          const owned = state.ownedProductIds || [];
          return {
            ownedProductIds: owned.includes(productId)
              ? owned.filter((id) => id !== productId)
              : [...owned, productId],
          };
        }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "skinwise-routine",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
