import { create } from "zustand"

export type ToastTone = "success" | "error" | "info"

export interface Toast {
  id: string
  message: string
  tone: ToastTone
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, tone?: ToastTone, action?: Toast["action"]) => void
  removeToast: (id: string) => void
}

let counter = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, tone = "info", action) => {
    const id = `toast-${++counter}-${Date.now()}`
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { id, message, tone, action }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 4000) // Slightly longer timeout to allow clicking action
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
