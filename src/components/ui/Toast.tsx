"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useToastStore, type ToastTone } from "@/store/toast-store"
import { CheckCircle, XCircle, Info } from "lucide-react"

const TONE_STYLES: Record<ToastTone, string> = {
  success: "bg-success text-white",
  error: "bg-danger text-white",
  info: "bg-fg text-bg",
}

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div 
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-body font-medium cursor-pointer ${TONE_STYLES[toast.tone]}`}
            onClick={() => removeToast(toast.id)}
          >
            {TONE_ICON[toast.tone]}
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
