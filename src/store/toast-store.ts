import { create } from "zustand"

export type ToastTone = "success" | "error" | "info"

export interface Toast {
  id: string
  message: string
  tone: ToastTone
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, tone?: ToastTone) => void
  removeToast: (id: string) => void
}

let counter = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, tone = "info") => {
    const id = `toast-${++counter}-${Date.now()}`
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { id, message, tone }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 3000)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
