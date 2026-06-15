"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Image from "next/image"
import {
  Camera,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Fingerprint,
  ScanEye,
  CheckCircle2,
  BookOpen
} from "lucide-react"
import { useUserStore } from "@/store/user-store"
import { useSkinStore } from "@/store/useSkinStore"
import { calculateSkinScore } from "@/utils/trendAnalysis"
import { trackEvent } from "@/lib/tracking"

interface VisionLabProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function VisionLab({ onComplete, onClose }: VisionLabProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<{ 
    skinType: string; concerns: string[]; summary: string;
    estimatedMetrics?: { oiliness: number; dryness: number; redness: number; acne: number; barrierComfort: number };
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLiveCamera, setIsLiveCamera] = useState(false)
  const [skinScore, setSkinScore] = useState<number | null>(null)
  const [savedToDiary, setSavedToDiary] = useState(false)
  
  const store = useUserStore()
  const skinStore = useSkinStore()

  const startLiveCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLiveCamera(true);
      setError(null);
    } catch (err) {
      console.warn("Camera access denied or unavailable", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "NotFoundError") {
          setError("Không thể truy cập camera. Vui lòng cấp quyền hoặc tải ảnh lên từ thiết bị.");
        } else {
          setError("Lỗi camera: " + err.message);
        }
      } else {
        setError("Lỗi camera không xác định.");
      }
      setIsLiveCamera(false);
    }
  };

  const captureLiveImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL("image/jpeg", 0.9));
        stopLiveCamera();
      }
    }
  };

  const stopLiveCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsLiveCamera(false);
  };

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

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
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCancel = () => {
    setImage(null)
    setResult(null)
    setError(null)
    stopLiveCamera()
  }

  const handleClose = () => {
    stopLiveCamera()
    onClose()
  }

  const analyzeSkin = async () => {
    if (!image) return
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image.split(",")[1], mode: "quiz" }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Phân tích thất bại");
      }

      const data = await response.json()
      setResult(data)

      // Calculate skin score from estimated metrics
      if (data.estimatedMetrics) {
        const score = calculateSkinScore(data.estimatedMetrics);
        setSkinScore(score);
      }
      
      // Track success
      trackEvent("ai_face_scan_success", { 
        skinType: data.skinType, 
        concerns: data.concerns 
      });

      // Auto-map to store
      store.setSkinType(data.skinType)
      data.concerns.forEach((c: string) => {
        if (!store.concerns.includes(c.toLowerCase())) {
          store.toggleConcern(c.toLowerCase())
        }
      })
    } catch (err) {
      console.error("Analysis error", err)
      setError(err instanceof Error ? err.message : "Không thể kết nối với AI. Vui lòng thử lại.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const hasResult = !!result

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
              <ScanEye size={20} />
            </div>
            <div>
              <h3 className="text-body font-bold">
                Check-in khuôn mặt AI
              </h3>
              <p className="text-[10px] text-muted uppercase tracking-widest">
                AI Phân tích da chính xác
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-muted hover:text-fg hover:bg-line/10 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col min-h-[350px]">
          {!image ? (
            isLiveCamera ? (
              <div className="relative w-full aspect-[4/5] bg-black rounded-[32px] overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                
                {/* Face framing guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-3/4 h-2/3 border-2 border-white/40 border-dashed rounded-[100px] flex items-center justify-center relative">
                    <div className="absolute -bottom-8 text-white/80 text-[10px] bg-black/50 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                      Đảm bảo đủ sáng & khuôn mặt ở giữa
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={captureLiveImage}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-white/20 shadow-2xl flex items-center justify-center active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 bg-fg rounded-full" />
                </button>
              </div>
            ) : (
              <div className="space-y-6 w-full flex-1 flex flex-col justify-center">
                <div className="flex gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startLiveCamera}
                    className="flex-1 aspect-square border-2 border-dashed border-line/60 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-fg/40 hover:bg-line/5 transition-all cursor-pointer group"
                  >
                    <div className="w-14 h-14 bg-line/20 rounded-2xl flex items-center justify-center group-hover:bg-fg group-hover:text-bg transition-all">
                      <Camera size={28} className="text-muted group-hover:text-bg" />
                    </div>
                    <span className="text-caption font-bold text-center px-2">Chụp trực tiếp</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 aspect-square border-2 border-dashed border-line/60 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-fg/40 hover:bg-line/5 transition-all cursor-pointer group"
                  >
                    <div className="w-14 h-14 bg-line/20 rounded-2xl flex items-center justify-center group-hover:bg-fg group-hover:text-bg transition-all">
                      <Camera size={28} className="text-muted group-hover:text-bg" />
                    </div>
                    <span className="text-caption font-bold text-center px-2">Tải ảnh lên</span>
                  </motion.div>
                </div>
                <div className="text-center px-6">
                  <p className="text-caption text-muted leading-relaxed">
                    Chụp ảnh selfie cận cảnh trong điều kiện đủ sáng để có kết quả phân tích AI tốt nhất.
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  capture="user"
                  className="hidden"
                />
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Show original image overlay scan effect only during analysis */}
              {!hasResult && (
                <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-black shadow-inner group">
                  <Image src={image} alt="Target" fill className="object-cover opacity-90 transition-all duration-700" />
                  
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
                          Đang phân tích cấu trúc da...
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div className={cn(
                    "absolute inset-0 bg-black/40 transition-opacity duration-500 flex items-center justify-center",
                    isAnalyzing ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}>
                    <p className="text-bg font-mono text-[10px] tracking-[0.5em] animate-pulse">
                      ĐANG PHÂN TÍCH CHỈ SỐ DA
                    </p>
                  </div>
                </div>
              )}

              {/* Render Skin Analysis Results */}
              {hasResult && result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Skin Type + Score Row */}
                  <div className="flex gap-3">
                    <div className="flex-1 p-4 bg-line/10 rounded-2xl border border-line/20">
                      <p className="text-[9px] text-muted uppercase tracking-widest mb-1">Loại da</p>
                      <p className="text-body font-bold capitalize">{
                        result.skinType === "oily" ? "Da dầu" :
                        result.skinType === "dry" ? "Da khô" :
                        result.skinType === "combination" ? "Da hỗn hợp" : "Da thường"
                      }</p>
                    </div>
                    {skinScore !== null && (
                      <div className="flex-1 p-4 bg-line/10 rounded-2xl border border-line/20">
                        <p className="text-[9px] text-muted uppercase tracking-widest mb-1">Điểm sức khỏe</p>
                        <div className="flex items-end gap-1.5">
                          <span className="text-[24px] font-bold leading-none">{skinScore}</span>
                          <span className="text-[10px] text-muted mb-0.5">/100</span>
                        </div>
                        <div className="w-full bg-line/30 rounded-full h-1.5 mt-2">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              skinScore >= 75 ? "bg-emerald-500" :
                              skinScore >= 50 ? "bg-amber-400" : "bg-red-400"
                            }`}
                            style={{ width: `${skinScore}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detected Concerns Tags */}
                  {result.concerns.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] text-muted uppercase tracking-widest">Vấn đề phát hiện</p>
                      <div className="flex flex-wrap gap-2">
                        {result.concerns.map((c) => {
                          const CONCERN_LABELS: Record<string, string> = {
                            acne: "Mụn", dark_spots: "Thâm nám", wrinkles: "Nếp nhăn",
                            redness: "Mẩn đỏ", pores: "Lỗ chân lông", dryness: "Khô da",
                            oiliness: "Da dầu", sensitivity: "Da nhạy cảm", pigmentation: "Sạm màu",
                            dark_circles: "Quầng thâm", texture: "Kết cấu da",
                          };
                          return (
                            <span key={c} className="px-3 py-1.5 bg-fg/[0.06] border border-line rounded-full text-[11px] font-medium text-fg">
                              {CONCERN_LABELS[c.toLowerCase()] || c}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  <div className="p-4 bg-fg text-bg rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="opacity-70" />
                      <span className="text-[9px] uppercase tracking-widest opacity-60">Nhận xét AI</span>
                    </div>
                    <p className="text-caption leading-relaxed opacity-90">{result.summary}</p>
                  </div>

                  {/* Estimated Metrics (if available) */}
                  {result.estimatedMetrics && (
                    <div className="grid grid-cols-5 gap-2">
                      {([
                        { key: "acne", label: "Mụn" },
                        { key: "redness", label: "Đỏ" },
                        { key: "oiliness", label: "Dầu" },
                        { key: "dryness", label: "Khô" },
                        { key: "barrierComfort", label: "Barrier" },
                      ] as const).map(({ key, label }) => (
                        <div key={key} className="text-center p-2 bg-line/10 rounded-xl border border-line/20">
                          <span className="text-[16px] font-bold block">{result.estimatedMetrics![key]}</span>
                          <span className="text-[8px] text-muted uppercase tracking-wider">{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl flex flex-col gap-2 text-caption border border-red-100">
              <div className="flex items-center gap-2 font-bold"><AlertCircle size={18} /> Lỗi hệ thống</div>
              <p>{error}</p>
              {error.includes("camera") && (
                <p className="mt-1 text-red-500/80 italic">
                  💡 Hướng dẫn: Nhấn vào biểu tượng 🔒 (ổ khóa) trên thanh địa chỉ trình duyệt, bật &quot;Camera&quot; (hoặc Máy ảnh) và tải lại trang.
                </p>
              )}
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
            <div className="w-full space-y-3">
              {/* Save to diary button */}
              {result?.estimatedMetrics && !savedToDiary && (
                <button
                  onClick={() => {
                    const now = new Date();
                    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
                    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                    const dayName = dayNames[now.getDay()];

                    skinStore.addDiaryLog({
                      date: dateStr, dayName, mood: "okay",
                      isPartial: false, source: "ai",
                      metrics: {
                        oiliness: result.estimatedMetrics!.oiliness,
                        dryness: result.estimatedMetrics!.dryness,
                        redness: result.estimatedMetrics!.redness,
                        acne: result.estimatedMetrics!.acne,
                        barrierComfort: result.estimatedMetrics!.barrierComfort,
                      },
                      aiOriginalMetrics: result.estimatedMetrics,
                      userCorrected: false,
                      lifestyle: [], note: "",
                      images: image ? [image] : undefined,
                    });
                    setSavedToDiary(true);
                    trackEvent("vision_saved_to_diary");
                  }}
                  className="w-full py-4 border-2 border-fg rounded-2xl text-body font-bold flex items-center justify-center gap-3 hover:bg-fg hover:text-bg transition-all"
                >
                  <BookOpen size={18} /> Lưu vào nhật ký hôm nay
                </button>
              )}
              {savedToDiary && (
                <div className="w-full py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-caption font-bold text-emerald-600 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Đã lưu vào nhật ký!
                </div>
              )}
              <button
                onClick={onComplete}
                className="w-full py-4 bg-fg text-bg rounded-2xl text-body font-bold flex items-center justify-center gap-2 shadow-xl shadow-fg/20 hover:translate-y-[-2px] transition-all"
              >
                {savedToDiary ? "Đóng" : "Hoàn thành"}
                {!savedToDiary && <Sparkles size={18} />}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
