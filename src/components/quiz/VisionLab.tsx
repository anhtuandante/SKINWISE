"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  Camera,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Fingerprint,
  ScanEye,
  FileText,
  AlertTriangle,
  ShieldCheck
} from "lucide-react"
import { Product, ConflictWarning } from "@/types"

interface ScannedProductResult {
  product: Product;
  rawDetectedText: string;
  otherActiveIngredients: string[];
  conflicts: {
    morning: ConflictWarning[];
    evening: ConflictWarning[];
  };
}
import { useUserStore } from "@/store/user-store"
import { useRoutineStore } from "@/store/routine-store"
import { CATEGORY_LABELS } from "@/lib/constants"
import ingredientsData from "@/data/ingredients.json"

interface VisionLabProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function VisionLab({ onComplete, onClose }: VisionLabProps) {
  const [mode, setMode] = useState<"skin" | "product">("skin")
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<{ skinType: string; concerns: string[]; summary: string } | null>(null)
  const [productResult, setProductResult] = useState<ScannedProductResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const store = useUserStore()
  const { morningRoutine, eveningRoutine } = useRoutineStore()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError("Ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setResult(null)
        setProductResult(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCancel = () => {
    setImage(null)
    setResult(null)
    setProductResult(null)
    setError(null)
  }

  const analyzeSkin = async () => {
    if (!image) return
    setIsAnalyzing(true)
    setError(null)

    try {
      if (mode === "skin") {
        const response = await fetch("/api/vision/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: image.split(",")[1] }),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || "Phân tích thất bại");
        }

        const data = await response.json()
        setResult(data)
        
        // Auto-map to store
        store.setSkinType(data.skinType)
        data.concerns.forEach((c: string) => {
          if (!store.concerns.includes(c.toLowerCase())) {
            store.toggleConcern(c.toLowerCase())
          }
        })
      } else {
        const response = await fetch("/api/vision/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: image.split(",")[1],
            userContext: {
              skinType: store.skinType,
              concerns: store.concerns,
              allergies: store.allergies,
              morningRoutine,
              eveningRoutine,
            }
          }),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || "Quét bảng thành phần thất bại");
        }

        const data = await response.json()
        setProductResult(data)
      }
    } catch (err) {
      console.error("Analysis error", err)
      setError(err instanceof Error ? err.message : "Không thể kết nối với AI. Vui lòng thử lại.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const hasResult = result || productResult

  return (
    <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-xl flex items-center justify-center p-6 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-bg border border-line w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative"
      >
        {/* Biometric Background Ornament */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Fingerprint size={120} />
        </div>

        {/* Header */}
        <div className="p-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-fg text-bg rounded-2xl flex items-center justify-center">
              {mode === "skin" ? <ScanEye size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <h3 className="text-body font-bold">
                {mode === "skin" ? "Biometric Skin Lab" : "Ingredient Scanner"}
              </h3>
              <p className="text-[10px] text-muted uppercase tracking-widest">
                {mode === "skin" ? "AI Precision Analysis" : "AI Ingredient Detection"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-fg hover:bg-line/10 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector - Show only when not showing scan result */}
        {!hasResult && !isAnalyzing && (
          <div className="flex bg-line/20 p-1 rounded-2xl mx-6 mb-2">
            <button
              onClick={() => { setMode("skin"); handleCancel(); }}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-caption font-bold transition-all flex items-center justify-center gap-2",
                mode === "skin" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
              )}
            >
              <ScanEye size={14} /> Chẩn đoán da
            </button>
            <button
              onClick={() => { setMode("product"); handleCancel(); }}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-caption font-bold transition-all flex items-center justify-center gap-2",
                mode === "product" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
              )}
            >
              <FileText size={14} /> Quét sản phẩm
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col min-h-[350px]">
          {!image ? (
            <div className="space-y-6 w-full flex-1 flex flex-col justify-center">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/5] border-2 border-dashed border-line/60 rounded-[40px] flex flex-col items-center justify-center gap-6 hover:border-fg/40 hover:bg-line/5 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-line/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-line/20 rounded-3xl flex items-center justify-center group-hover:bg-fg group-hover:text-bg transition-all duration-300">
                  <Camera size={36} className="text-muted group-hover:text-bg" />
                </div>
                <div className="text-center z-10 px-6">
                  <p className="text-body font-bold mb-1">
                    {mode === "skin" ? "Bắt đầu quét khuôn mặt" : "Chụp bảng thành phần"}
                  </p>
                  <p className="text-caption text-muted leading-relaxed">
                    {mode === "skin"
                      ? "Chụp ảnh selfie cận cảnh trong điều kiện đủ sáng để có kết quả tốt nhất"
                      : "Chụp cận cảnh mặt sau sản phẩm, nơi ghi danh sách thành phần bằng tiếng Anh để AI bóc tách"}
                  </p>
                </div>
              </motion.div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Show original image overlay scan effect only during analysis */}
              {!hasResult && (
                <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-black shadow-inner group">
                  <img src={image} alt="Target" className="w-full h-full object-cover opacity-90 transition-all duration-700" />
                  
                  {/* HUD Corner Targets */}
                  <div className="absolute inset-x-6 top-6 flex justify-between z-20 pointer-events-none">
                    <div className="w-12 h-12 border-t-2 border-l-2 border-fg/40 rounded-tl-xl" />
                    <div className="w-12 h-12 border-t-2 border-r-2 border-fg/40 rounded-tr-xl" />
                  </div>
                  <div className="absolute inset-x-6 bottom-6 flex justify-between z-20 pointer-events-none">
                    <div className="w-12 h-12 border-b-2 border-l-2 border-fg/40 rounded-bl-xl" />
                    <div className="w-12 h-12 border-b-2 border-r-2 border-fg/40 rounded-br-xl" />
                  </div>

                  {/* Scanning HUD overlay */}
                  {isAnalyzing && (
                    <motion.div
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 z-30 pointer-events-none"
                    >
                      <div className="w-full h-full bg-fg shadow-[0_0_20px_rgba(255,255,255,1),0_0_40px_var(--fg)] relative">
                        <span className="absolute right-4 top-2 text-[8px] font-mono text-fg uppercase tracking-widest">
                          {mode === "skin" ? "Scanning Layer 7..." : "Performing OCR Scan..."}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div className={cn(
                    "absolute inset-0 bg-black/40 transition-opacity duration-500 flex items-center justify-center",
                    isAnalyzing ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}>
                    <p className="text-bg font-mono text-[10px] tracking-[0.5em] animate-pulse">
                      {mode === "skin" ? "ANALYZING BIOMETRICS" : "EXTRACTING ACTIVE CHEMICALS"}
                    </p>
                  </div>
                </div>
              )}

              {/* Render Skin Analysis Results */}
              {mode === "skin" && result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex gap-3">
                    <div className="flex-1 p-4 bg-line/10 rounded-2xl border border-line/20">
                      <p className="text-[9px] text-muted uppercase tracking-widest mb-1">Skin Type</p>
                      <p className="text-body font-bold capitalize">{result.skinType}</p>
                    </div>
                    <div className="flex-1 p-4 bg-line/10 rounded-2xl border border-line/20">
                      <p className="text-[9px] text-muted uppercase tracking-widest mb-1">Condition</p>
                      <p className="text-body font-bold">Stable</p>
                    </div>
                  </div>
                  <div className="p-4 bg-fg text-bg rounded-2xl">
                    <p className="text-caption leading-relaxed opacity-90 italic">{`"${result.summary}"`}</p>
                  </div>
                </motion.div>
              )}

              {/* Render Product Ingredient Scanner Results */}
              {mode === "product" && productResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col max-h-[360px] overflow-y-auto pr-1 space-y-4"
                >
                  {/* Product basic details card */}
                  <div className="p-4 bg-line/10 rounded-2xl border border-line/20">
                    <p className="text-[9px] text-muted uppercase tracking-widest mb-1">
                      {productResult.product.brand || "Thương hiệu chưa rõ"}
                    </p>
                    <h4 className="text-body font-bold mb-2">{productResult.product.name}</h4>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-surface border border-line text-[10px] text-muted capitalize">
                        {CATEGORY_LABELS[productResult.product.category] || productResult.product.category}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface border border-line text-[10px] text-muted">
                        {productResult.product.texture === "water-based"
                          ? "Gốc nước (Water-based)"
                          : productResult.product.texture === "silicone-based"
                          ? "Gốc silicone (Silicone-based)"
                          : "Cream/Oil base"}
                      </span>
                    </div>
                  </div>

                  {/* Scanned Ingredients badges */}
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-widest mb-2 font-bold">Thành phần đặc biệt</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {productResult.product.ingredients.length === 0 && productResult.otherActiveIngredients.length === 0 ? (
                        <span className="text-caption text-muted">Không phát hiện hoạt chất hệ thống theo dõi.</span>
                      ) : (
                        <>
                          {productResult.product.ingredients.map((ingId: string) => {
                            const ingName = ingredientsData.ingredients.find(i => i.id === ingId)?.nameVi || ingId;
                            return (
                              <span key={ingId} className="px-2.5 py-1 rounded-full bg-fg text-bg text-[10px] font-medium capitalize">
                                {ingName}
                              </span>
                            )
                          })}
                          {productResult.otherActiveIngredients.map((ing: string) => (
                            <span key={ing} className="px-2.5 py-1 rounded-full bg-line/30 text-fg text-[10px] font-medium capitalize">
                              {ing}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Routine Conflicts status */}
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Khả năng tương thích</p>

                    {/* AM Routine Check */}
                    <div className="p-4 rounded-2xl border bg-surface/50 border-line">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Routine Sáng (AM)</span>
                      </div>
                      {productResult.conflicts.morning.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-500 text-caption font-medium">
                          <ShieldCheck size={16} /> An toàn, tương thích tốt
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {productResult.conflicts.morning.map((c: ConflictWarning, idx: number) => (
                            <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-caption space-y-1">
                              <div className="flex items-center gap-1.5 font-bold">
                                <AlertTriangle size={14} /> Xung đột: {c.items.join(" vs ")}
                              </div>
                              <p className="text-[11px] leading-relaxed opacity-95">{c.reason}</p>
                              <p className="text-[10px] text-fg/80 leading-relaxed font-medium">Giải pháp: {c.solution}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PM Routine Check */}
                    <div className="p-4 rounded-2xl border bg-surface/50 border-line">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Routine Tối (PM)</span>
                      </div>
                      {productResult.conflicts.evening.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-500 text-caption font-medium">
                          <ShieldCheck size={16} /> An toàn, tương thích tốt
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {productResult.conflicts.evening.map((c: ConflictWarning, idx: number) => (
                            <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-caption space-y-1">
                              <div className="flex items-center gap-1.5 font-bold">
                                <AlertTriangle size={14} /> Xung đột: {c.items.join(" vs ")}
                              </div>
                              <p className="text-[11px] leading-relaxed opacity-95">{c.reason}</p>
                              <p className="text-[10px] text-fg/80 leading-relaxed font-medium">Giải pháp: {c.solution}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-caption border border-red-100">
              <AlertCircle size={18} /> {error}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-2 flex gap-4">
          {image && !hasResult && (
            <>
              <button
                onClick={handleCancel}
                className="flex-1 py-4 border border-line rounded-2xl text-body font-bold hover:bg-line/10 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={analyzeSkin}
                disabled={isAnalyzing}
                className="flex-[2] py-4 bg-fg text-bg rounded-2xl text-body font-bold flex items-center justify-center gap-3 shadow-lg shadow-fg/20 active:scale-95 transition-all"
              >
                {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Fingerprint size={20} />}
                {isAnalyzing ? "Đang xử lý..." : "Xác nhận & Phân tích"}
              </button>
            </>
          )}
          {hasResult && (
            <button
              onClick={onComplete}
              className="w-full py-4 bg-fg text-bg rounded-2xl text-body font-bold flex items-center justify-center gap-2 shadow-xl shadow-fg/20 hover:translate-y-[-2px] transition-all"
            >
              Hoàn thành
              <Sparkles size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
