"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  Loader2,
  FlaskConical,
  BookOpen,
  Info,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { useUserStore } from "@/store/user-store";
import { useRoutineStore } from "@/store/routine-store";
import { useJournalStore } from "@/store/journal-store";
import { useToastStore } from "@/store/toast-store";
import SkinDashboard from "@/components/dashboard/SkinDashboard";
import SkinProfileCard from "@/components/dashboard/SkinProfileCard";
import SafetyLabPanel from "@/components/dashboard/SafetyLabPanel";
import SkinJournalPanel from "@/components/dashboard/SkinJournalPanel";
import TreatmentCalendarPanel from "@/components/dashboard/TreatmentCalendarPanel";
import ProductCatalog from "@/components/dashboard/ProductCatalog";

import { filterProducts, getProductsByCategory } from "@/lib/quiz-logic";
import {
  SKIN_TYPES,
  CONCERNS,
  BUDGETS,
  BUDGET_LABELS,
  CATEGORY_LABELS,
} from "@/lib/constants";
import ProductCard from "@/components/routine/ProductCard";
import RoutineBuilder from "@/components/routine/RoutineBuilder";
import VisionLab from "@/components/quiz/VisionLab";
import { Product } from "@/types";

interface QuizAnswers {
  skinType: string;
  concern: string;
  barrier: string;
  lifestyle: string[];
  preference: string;
  budget: string;
  subscriptionPlan?: "free" | "premium" | "ultimate";
}

const LIFESTYLE_OPTIONS = [
  "Ngủ muộn",
  "Stress công việc",
  "Ăn đồ ngọt / sữa",
  "Đeo khẩu trang lâu",
  "Trang điểm đậm",
  "Quên chống nắng",
  "Dùng treatment nặng",
  "Thay đổi thời tiết",
];

// Mock weather conditions by city
const CITIES_WEATHER = {
  hanoi: { name: "Hà Nội", uv: 6, status: "Vừa phải", desc: "Trời có mây, nắng nhẹ.", advice: "Nên thoa kem chống nắng khi ra đường vào buổi trưa.", icon: "⛅" },
  danang: { name: "Đà Nẵng", uv: 8, status: "Rất cao", desc: "Trời nắng gắt, ít mây.", advice: "UV rất mạnh. Hãy thoa lại kem chống nắng sau mỗi 2-3 giờ hoạt động ngoài trời.", icon: "☀️" },
  hcm: { name: "TP. Hồ Chí Minh", uv: 10, status: "Cực kỳ nguy hiểm", desc: "Nắng nóng gay gắt kéo dài.", advice: "Hạn chế ra ngoài từ 11h - 15h. Đeo kính râm và che chắn cơ thể kỹ càng.", icon: "🥵" }
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCity, setSelectedCity] = useState<keyof typeof CITIES_WEATHER>("danang");

  // Stores
  const user = useUserStore();
  const routine = useRoutineStore();
  const { recoveryMode, setRecoveryMode } = useJournalStore();
  const addToast = useToastStore((s) => s.addToast);

  // Recommended Products State
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [routineFilterType, setRoutineFilterType] = useState<"all" | "skincare" | "makeup">("all");

  // Fetch Recommended Products
  useEffect(() => {
    async function loadProducts() {
      if (!user.skinType || !user.budget) {
        setIsLoadingProducts(false);
        return;
      }
      setIsLoadingProducts(true);
      const data = await filterProducts(user);
      setRecommended(data);
      setIsLoadingProducts(false);
    }
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user.skinType, user.concerns, user.budget, user.barrierStatus, 
    user.environment, user.makeupFrequency, user.texturePreference, 
    user.activeIngredients, user.avoidedIngredients
  ]);

  const filteredRecommended = useMemo(() => {
    let list = recommended;
    if (routineFilterType !== "all") {
      list = recommended.filter((p) => p.type === routineFilterType);
    }
    if (!searchQuery) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recommended, searchQuery, routineFilterType]);

  const groupedProducts = useMemo(() => getProductsByCategory(filteredRecommended), [filteredRecommended]);

  // --- Routine Builder handlers ---
  const handleAddProduct = (product: Product) => {
    if (product.timeOfDay === "PM") {
      const success = routine.addToEvening(product);
      if (success) addToast(`Đã thêm ${product.name} vào routine tối`, "success");
      else addToast("Giới hạn tối đa 5 sản phẩm", "error");
      return;
    }
    if (product.timeOfDay === "AM") {
      const success = routine.addToMorning(product);
      if (success) addToast(`Đã thêm ${product.name} vào routine sáng`, "success");
      else addToast("Giới hạn tối đa 5 sản phẩm", "error");
      return;
    }
    const addedMorning = routine.addToMorning(product);
    if (addedMorning) {
      addToast(`Đã thêm ${product.name} vào routine sáng`, "success");
    } else {
      const addedEvening = routine.addToEvening(product);
      if (addedEvening) {
        addToast(`Đã thêm ${product.name} vào routine tối`, "success");
      } else {
        addToast("Giới hạn tối đa 5 sản phẩm cho mỗi routine", "error");
      }
    }
  };

  // --- Quiz logic (tab: diagnosis) ---
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    skinType: "",
    concern: "",
    barrier: "",
    lifestyle: [],
    preference: "",
    budget: "",
    subscriptionPlan: "free",
  });
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [isQuizAnalyzing, setIsQuizAnalyzing] = useState(false);

  const handleQuizSelect = (field: keyof QuizAnswers, val: string, multi = false) => {
    if (multi) {
      const curr = (quizAnswers[field] as string[]) || [];
      const updated = curr.includes(val) ? curr.filter((v: string) => v !== val) : [...curr, val];
      setQuizAnswers((a: QuizAnswers) => ({ ...a, [field]: updated }));
    } else {
      setQuizAnswers((a: QuizAnswers) => ({ ...a, [field]: val }));
    }
  };

  const handleQuizSubmit = async () => {
    setIsQuizAnalyzing(true);
    // Simulate diagnostic engine computation
    await new Promise((r) => setTimeout(r, 1200));
    const { skinType, concern, barrier, preference, budget, lifestyle } = quizAnswers;

    // Map barrier answer directly to new barrierStatus type
    const barrierStatus = (barrier === "stinging" || barrier === "redness" || barrier === "flaking")
      ? (barrier as "redness" | "flaking" | "stinging")
      : ("stable" as const);
    const skinTypeMap: Record<string, string> = { oily: "Da dầu", dry: "Da khô", combination: "Da hỗn hợp", normal: "Da thường", sensitive: "Da nhạy cảm" };
    const concernMap: Record<string, string> = {
      acne: "mụn ẩn/viêm",
      "dark-spots": "thâm nám",
      sensitive: "nhạy cảm/đỏ",
      pores: "lỗ chân lông to",
      dryness: "thiếu ẩm/khô ráp",
      aging: "lão hóa da",
    };

    const barrierLabel = barrierStatus === "stable" ? "hàng rào khỏe" : "hàng rào yếu";
    const titleStr = `${skinTypeMap[skinType] || skinType}, ${barrierLabel}, ngân sách ${
      budget === "budget" ? "dưới 200k" : budget === "affordable" ? "200-400k" : budget === "mid-range" ? "400k-1tr" : "cao cấp"
    }`;
    const goalStr = `Cải thiện ${concernMap[concern] || concern}, bảo vệ và tăng độ đàn hồi`;

    user.setSkinType(skinType);
    user.setBudget(budget);
    if (user.concerns.length > 0) {
      user.resetQuiz();
      user.setSkinType(skinType);
      user.setBudget(budget);
    }
    user.toggleConcern(concern);

    user.setBarrier(barrier);
    user.setBarrierStatus(barrierStatus);
    user.setLifestyle(lifestyle);
    user.setPreference(preference);
    user.setProfileMetadata(titleStr, goalStr, barrierStatus);
    user.setQuizCompleted(true);

    setIsQuizAnalyzing(false);
    addToast("Tạo hồ sơ da thành công!", "success");
    setActiveTab("routine");
  };

  return (
    <div className="min-h-screen bg-bg text-fg pb-24">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-fg text-bg flex items-center justify-center font-bold text-body">SW</span>
            <span className="text-title font-light tracking-tight">Skin<span className="font-semibold text-accent-dark">Wise</span> Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-caption text-muted hover:text-fg transition-colors">
              Trang chủ
            </Link>
            <Link href="/ingredients" className="text-caption text-muted hover:text-fg transition-colors">
              Bách khoa thành phần
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8">
        <AnimatePresence mode="wait">
          {/* TAB 1: DASHBOARD (TỔNG QUAN) */}
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <SkinDashboard
                onNavigate={setActiveTab}
                selectedCity={selectedCity}
                setSelectedCity={(city) => setSelectedCity(city as "hanoi" | "danang" | "hcm")}
                citiesWeather={CITIES_WEATHER}
              />
            </motion.div>
          )}

          {/* TAB 2: SKIN DIAGNOSIS */}
          {activeTab === "diagnosis" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {user.quizCompleted ? (
                <SkinProfileCard
                  recommended={recommended}
                  setActiveTab={setActiveTab}
                  setQuizStep={setQuizStep}
                  setQuizAnswers={setQuizAnswers}
                />
              ) : (
                /* Diagnosis interactive quiz */
                <div className="border border-line rounded-[32px] p-8 bg-white shadow-soft space-y-6">
                  {/* Step indicator */}
                  <div>
                    <div className="flex justify-between text-micro text-muted uppercase tracking-widest mb-2 font-bold">
                      <span>Bước {quizStep + 1} / 5</span>
                      <span>{Math.round(((quizStep) / 5) * 100)}% HOÀN THÀNH</span>
                    </div>
                    <div className="h-1 bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full bg-fg rounded-full transition-all duration-300"
                        style={{ width: `${((quizStep) / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Diagnosis Step Content */}
                  <div>
                    {quizStep === 0 && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-headline font-light mb-1">Loại da của bạn</h2>
                          <p className="text-caption text-muted">Chọn cảm giác da rõ rệt nhất sau khi rửa mặt 30 phút mà không bôi gì.</p>
                        </div>
                        {/* New Camera / AI Skin scan option */}
                        <button
                          onClick={() => setShowVisionModal(true)}
                          className="w-full p-4 bg-fg text-bg rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-fg/10 hover:opacity-90 active:scale-98 transition-all"
                        >
                          <Sparkles size={18} className="animate-pulse text-accent" />
                          <span className="text-caption font-bold">Phân tích khuôn mặt với AI (Mới)</span>
                        </button>
                        <div className="text-center text-micro text-muted uppercase tracking-widest my-2">— Hoặc Tự Chọn Thủ Công —</div>

                        <div className="space-y-2.5">
                          {SKIN_TYPES.map((type) => (
                            <button
                              key={type.id}
                              onClick={() => handleQuizSelect("skinType", type.id)}
                              className={`w-full text-left p-4 border rounded-2xl transition-all ${
                                quizAnswers.skinType === type.id ? "border-fg bg-surface shadow-soft" : "border-line bg-white hover:border-fg/40"
                              }`}
                            >
                              <div className="text-body font-bold">{type.label}</div>
                              <div className="text-caption text-muted">{type.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {quizStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-headline font-light mb-1">Vấn đề chính bạn lo lắng</h2>
                          <p className="text-caption text-muted">Chọn vấn đề da bạn muốn tập trung cải thiện nhất trong giai đoạn này.</p>
                        </div>
                        <div className="space-y-2.5">
                          {CONCERNS.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleQuizSelect("concern", c.id)}
                              className={`w-full text-left p-4 border rounded-2xl transition-all ${
                                quizAnswers.concern === c.id ? "border-fg bg-surface shadow-soft" : "border-line bg-white hover:border-fg/40"
                              }`}
                            >
                              <div className="text-body font-bold">{c.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {quizStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-headline font-light mb-1">Tình trạng hàng rào da</h2>
                          <p className="text-caption text-muted">Bạn có cảm giác nào sau đây khi sử dụng mỹ phẩm hoặc tiếp xúc thời tiết?</p>
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { value: "stinging", label: "Châm chích rát nhẹ khi bôi dưỡng da" },
                            { value: "redness", label: "Dễ đỏ ửng mặt khi đi nắng hoặc dùng treatment" },
                            { value: "flaking", label: "Bong tróc da khô thành từng mảng nhỏ" },
                            { value: "stable", label: "Khá êm ái, hiếm khi châm chích hay đỏ mặt" }
                          ].map((b) => (
                            <button
                              key={b.value}
                              onClick={() => handleQuizSelect("barrier", b.value)}
                              className={`w-full text-left p-4 border rounded-2xl transition-all ${
                                quizAnswers.barrier === b.value ? "border-fg bg-surface shadow-soft" : "border-line bg-white hover:border-fg/40"
                              }`}
                            >
                              <div className="text-body font-bold">{b.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {quizStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-headline font-light mb-1">Yếu tố lối sống & Thói quen</h2>
                          <p className="text-caption text-muted">Chọn các yếu tố áp dụng cho bạn (có thể chọn nhiều hơn một).</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {LIFESTYLE_OPTIONS.map((o) => {
                            const isSel = (quizAnswers.lifestyle || []).includes(o);
                            return (
                              <button
                                key={o}
                                onClick={() => handleQuizSelect("lifestyle", o, true)}
                                className={`text-left p-4 border rounded-2xl transition-all ${
                                  isSel ? "border-fg bg-surface shadow-soft" : "border-line bg-white hover:border-fg/40"
                                }`}
                              >
                                <div className="text-caption font-semibold flex items-center justify-between">
                                  <span>{o}</span>
                                  {isSel && <CheckCircle2 size={14} className="text-fg shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {quizStep === 4 && (
                      <div className="space-y-5">
                        <div className="space-y-1">
                          <h2 className="text-headline font-light">Phong cách & Ngân sách</h2>
                          <p className="text-caption text-muted">Chọn định hướng tối ưu hóa routine của bạn.</p>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">Định hướng routine</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { value: "minimal", label: "Tối giản (ít bước)", desc: "Tiết kiệm thời gian" },
                                { value: "complete", label: "Đầy đủ khoa học", desc: "Đa bước tối ưu" }
                              ].map((pref) => (
                                <button
                                  key={pref.value}
                                  onClick={() => handleQuizSelect("preference", pref.value)}
                                  className={`text-left p-3 border rounded-xl transition-all ${
                                    quizAnswers.preference === pref.value ? "border-fg bg-surface" : "border-line bg-white hover:border-fg/60"
                                  }`}
                                >
                                  <div className="text-caption font-bold">{pref.label}</div>
                                  <div className="text-[10px] text-muted">{pref.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">Mức ngân sách / sản phẩm</label>
                            <div className="grid grid-cols-1 gap-2">
                              {BUDGETS.map((b) => (
                                <button
                                  key={b.id}
                                  onClick={() => handleQuizSelect("budget", b.id)}
                                  className={`text-left p-3 border rounded-xl transition-all flex items-center justify-between ${
                                    quizAnswers.budget === b.id ? "border-fg bg-surface" : "border-line bg-white hover:border-fg/60"
                                  }`}
                                >
                                  <div>
                                    <span className="text-caption font-bold">{b.label}</span>
                                    <span className="text-[10px] text-muted block">{b.desc}</span>
                                  </div>
                                  {quizAnswers.budget === b.id && <CheckCircle2 size={16} className="text-fg shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex gap-4 pt-4 border-t border-line">
                    <button
                      onClick={() => setQuizStep((s) => Math.max(0, s - 1))}
                      disabled={quizStep === 0}
                      className="px-6 py-3.5 border border-line rounded-xl text-caption font-semibold hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={() => {
                        if (quizStep < 4) {
                          setQuizStep((s) => s + 1);
                        } else {
                          handleQuizSubmit();
                        }
                      }}
                      disabled={
                        (quizStep === 0 && !quizAnswers.skinType) ||
                        (quizStep === 1 && !quizAnswers.concern) ||
                        (quizStep === 2 && !quizAnswers.barrier) ||
                        (quizStep === 3 && (quizAnswers.lifestyle || []).length === 0) ||
                        (quizStep === 4 && (!quizAnswers.preference || !quizAnswers.budget)) ||
                        isQuizAnalyzing
                      }
                      className="flex-1 py-3.5 bg-fg text-bg rounded-xl text-caption font-bold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isQuizAnalyzing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang phân tích và tạo hồ sơ...
                        </>
                      ) : quizStep === 4 ? (
                        "Phân tích & Hoàn thành"
                      ) : (
                        "Tiếp tục →"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: ROUTINE STRATEGY */}
          {activeTab === "routine" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Profile summary banner */}
              {user.quizCompleted ? (
                <div className="bg-white border border-line rounded-[24px] p-5 shadow-soft flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={14} className="text-[#C4A882]" />
                      <span className="text-micro font-bold text-muted uppercase tracking-wider">Routine cá nhân hóa</span>
                    </div>
                    <p className="text-body font-bold text-fg leading-none">{user.title}</p>
                    <p className="text-caption text-muted mt-1">{user.mainGoal}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("diagnosis")}
                    className="text-caption text-muted hover:text-fg font-medium underline shrink-0"
                  >
                    Thay đổi hồ sơ
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-line rounded-[24px] p-6 text-center shadow-soft">
                  <p className="text-body text-muted mb-3">Bạn chưa hoàn thành chẩn đoán da.</p>
                  <button
                    onClick={() => setActiveTab("diagnosis")}
                    className="bg-fg text-bg px-5 py-2.5 rounded-xl text-caption font-bold hover:opacity-90 transition-all"
                  >
                    Làm quiz chẩn đoán da →
                  </button>
                </div>
              )}

              {/* Recovery Mode Toggle */}
              {user.quizCompleted && (
                <div className="transition-all">
                  {!recoveryMode ? (
                    <button
                      onClick={() => setRecoveryMode(true)}
                      className="w-full border border-danger/30 bg-danger/[0.02] text-danger hover:bg-danger/[0.05] rounded-2xl py-4 px-6 text-caption font-bold flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="animate-bounce" />
                        <span>Da bạn đang kích ứng hoặc mẩn đỏ bất thường?</span>
                      </div>
                      <span className="underline">Kích hoạt Recovery Mode</span>
                    </button>
                  ) : (
                    <div className="bg-danger/[0.03] border border-danger/20 rounded-[24px] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-danger font-bold text-body">
                          <ShieldCheck size={20} />
                          <span>Recovery Mode Đang Bật</span>
                        </div>
                        <button
                          onClick={() => setRecoveryMode(false)}
                          className="text-caption text-danger hover:underline font-bold"
                        >
                          Tắt chế độ phục hồi
                        </button>
                      </div>
                      <p className="text-caption text-muted leading-relaxed">
                        Chế độ phục hồi tối giản da đang được áp dụng. Chu trình của bạn tự động treo các hoạt chất mạnh (AHA/BHA/Retinol/Serum treatment) và chỉ đề xuất các bước phục hồi dịu nhẹ để giữ da ổn định.
                      </p>
                      <div className="space-y-1.5 pt-2 border-t border-danger/10">
                        <div className="text-micro font-bold text-danger uppercase tracking-wider">HƯỚNG DẪN DA KÍCH ỨNG:</div>
                        <div className="text-caption text-muted flex items-center gap-2">
                          <span className="text-danger font-bold">✕</span> Tạm dừng mọi sản phẩm có hạt scrub, tẩy tế bào chết hóa học, vitamin C mạnh.
                        </div>
                        <div className="text-caption text-muted flex items-center gap-2">
                          <span className="text-success font-bold">✓</span> Giữ lại: Sữa rửa mặt dịu nhẹ, Kem dưỡng ẩm phục hồi và Kem chống nắng lành tính.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommended Products Hub */}
              {user.quizCompleted && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-title font-semibold">Sản phẩm gợi ý tốt nhất</h2>
                      <p className="text-caption text-muted">Được chọn lọc theo da và ngân sách {BUDGET_LABELS[user.budget]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-surface border border-line rounded-xl p-0.5 flex gap-1 text-[11px] font-bold">
                        {(["all", "skincare", "makeup"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setRoutineFilterType(t)}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              routineFilterType === t
                                ? "bg-fg text-bg"
                                : "text-muted hover:text-fg"
                            }`}
                          >
                            {t === "all" ? "Tất cả" : t === "skincare" ? "Dưỡng da" : "Trang điểm"}
                          </button>
                        ))}
                      </div>
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm sản phẩm gợi ý..."
                        className="border border-line rounded-xl px-4 py-2 bg-white text-caption outline-none focus:border-fg w-40 sm:w-48 transition-all"
                      />
                    </div>
                  </div>

                  {isLoadingProducts ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="h-44 bg-surface rounded-2xl animate-pulse"></div>
                      <div className="h-44 bg-surface rounded-2xl animate-pulse"></div>
                    </div>
                  ) : Object.keys(groupedProducts).length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-line rounded-2xl bg-white text-caption text-muted">
                      Không tìm thấy sản phẩm gợi ý nào phù hợp bộ lọc.
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide border border-line rounded-2xl p-4 bg-white/50">
                      {Object.entries(groupedProducts).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                          <div className="text-caption font-bold text-muted uppercase tracking-wider">
                            {CATEGORY_LABELS[category] || category}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {items.map((p: Product) => {
                              const isInRoutine =
                                routine.morningRoutine.some((r) => r.id === p.id) ||
                                routine.eveningRoutine.some((r) => r.id === p.id);

                              return (
                                <div key={p.id} className="relative">
                                  <ProductCard
                                    product={p}
                                    onAdd={handleAddProduct}
                                    isInRoutine={isInRoutine}
                                  />
                                  {recoveryMode && (p.category === "serum" || p.category === "exfoliant") && (
                                    <div className="absolute top-2 right-2 bg-danger text-bg text-[8px] font-bold px-2 py-0.5 rounded-full select-none">
                                      TẠM TREO
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Routine Builder timeline */}
              {user.quizCompleted && (
                <div className="space-y-3">
                  <h3 className="text-body font-bold text-fg">Xây dựng & Điều chỉnh Routine Sáng/Tối</h3>
                  
                  <div className="relative">
                    <RoutineBuilder />
                    
                    {recoveryMode && (
                      <div className="mt-4 p-4 border border-warning/30 bg-warning/[0.02] text-warning text-caption rounded-xl flex items-start gap-2.5">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <strong>Lưu ý chế độ phục hồi:</strong> Mặc dù bạn vẫn thấy các sản phẩm khác trong routine builder, chúng tôi khuyên bạn chỉ nên áp dụng 3 bước căn bản (Làm sạch &rarr; Dưỡng ẩm &rarr; Chống nắng). Hãy ngưng thoa mọi loại serum/peel khác cho đến khi bật lại chế độ bình thường.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weekly Treatment Calendar */}
              {user.quizCompleted && (
                <TreatmentCalendarPanel />
              )}

              {/* Smart Adjustment Tips */}
              <div className="space-y-3">
                <h3 className="text-body font-bold text-fg">Mẹo điều chỉnh thông minh</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="border border-line rounded-xl p-4 bg-white text-caption">
                    <div className="font-bold text-warning mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Nếu da bị căng rát
                    </div>
                    <p className="text-muted leading-relaxed">Giảm tần suất treatment xuống cách 2-3 ngày, tăng gấp đôi lượng kem phục hồi B5/Ceramide.</p>
                  </div>
                  <div className="border border-line rounded-xl p-4 bg-white text-caption">
                    <div className="font-bold text-success mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Nếu da thích ứng tốt
                    </div>
                    <p className="text-muted leading-relaxed">Sau 3 tuần không đỏ rát, bạn có thể tăng nhẹ nồng độ hoạt chất hoặc tần suất lên 3 lần/tuần.</p>
                  </div>
                  <div className="border border-line rounded-xl p-4 bg-white text-caption">
                    <div className="font-bold text-[#C4A882] mb-1.5 flex items-center gap-1.5">
                      <Info size={14} /> Thứ tự bôi đúng pH
                    </div>
                    <p className="text-muted leading-relaxed">Luôn bôi chất lỏng nhẹ trước (toner &rarr; serum &rarr; cream) và pH thấp trước (AHA/BHA &rarr; Niacinamide).</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: KHO SẢN PHẨM (CATALOG) */}
          {activeTab === "catalog" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <ProductCatalog />
            </motion.div>
          )}

          {/* TAB 5: SAFETY LAB */}
          {activeTab === "safety" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <SafetyLabPanel />
            </motion.div>
          )}

          {/* TAB 6: SKIN JOURNAL */}
          {activeTab === "journal" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <SkinJournalPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating navigation footer bar - mobile & desktop styled */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur-md border-t border-line py-3 px-6 shadow-[0_-8px_24px_rgba(0,0,0,0.03)]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          {[
            { id: "dashboard", label: "Tổng quan", icon: Home },
            { id: "diagnosis", label: "Chẩn đoán", icon: Sparkles },
            { id: "routine", label: "Routine", icon: ClipboardList },
            { id: "catalog", label: "Kho sản phẩm", icon: ShoppingBag },
            { id: "safety", label: "Safety Lab", icon: FlaskConical },
            { id: "journal", label: "Nhật ký", icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1 flex flex-col items-center justify-center transition-all ${
                  active ? "text-[#C4A882] scale-105" : "text-muted hover:text-fg"
                }`}
              >
                <Icon size={18} className={active ? "stroke-[2.5px]" : "stroke-[2px]"} />
                <span className="text-[10px] font-bold tracking-tight mt-1 select-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Embedded Vision face-scanning lab */}
      <AnimatePresence>
        {showVisionModal && (
          <VisionLab
            onClose={() => setShowVisionModal(false)}
            onComplete={() => {
              setShowVisionModal(false);
              addToast("Phân tích AI hoàn tất! Dữ liệu đã được nạp tự động.", "success");
              setQuizAnswers((a: QuizAnswers) => ({
                ...a,
                skinType: user.skinType || "oily",
                concern: user.concerns[0] || "acne",
                barrier: "stable",
                preference: "complete",
                budget: "affordable"
              }));
              setQuizStep(3); // Jump directly to step 4 (lifestyle factors) for users
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
