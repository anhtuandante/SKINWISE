"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Info,
  AlertTriangle,
  ShieldCheck,
  Home,
  ClipboardList,
  FlaskConical,
  BookOpen,
  ShoppingBag
} from "lucide-react";

import { useUserStore } from "@/store/user-store";
import { useRoutineStore } from "@/store/routine-store";
import { useSkinStore } from "@/store/useSkinStore";
import { useAddToRoutine } from "@/hooks/useAddToRoutine";
import SkinDashboard from "@/components/dashboard/SkinDashboard";
import SkinProfileCard from "@/components/dashboard/SkinProfileCard";
import SafetyLabPanel from "@/components/dashboard/SafetyLabPanel";
import SkinJournalPanel from "@/components/dashboard/SkinJournalPanel";

import ProductCatalog from "@/components/dashboard/ProductCatalog";

import { filterProducts, getProductsByCategory } from "@/lib/quiz-logic";
import { 
  CATEGORY_LABELS,
  BUDGET_LABELS
} from "@/lib/constants";
import ProductCard from "@/components/routine/ProductCard";
import RoutineBuilder from "@/components/routine/RoutineBuilder";
import { Product } from "@/types";

// Mock weather conditions by city (initial fallback)
const CITIES_WEATHER = {
  hanoi: { name: "Hà Nội", uv: 6, status: "Vừa phải", desc: "Trời có mây, nắng nhẹ.", advice: "Nên thoa kem chống nắng khi ra đường vào buổi trưa.", icon: "⛅" },
  danang: { name: "Đà Nẵng", uv: 8, status: "Rất cao", desc: "Trời nắng gắt, ít mây.", advice: "UV rất mạnh. Hãy thoa lại kem chống nắng sau mỗi 2-3 giờ hoạt động ngoài trời.", icon: "☀️" },
  hcm: { name: "TP. Hồ Chí Minh", uv: 10, status: "Cực kỳ nguy hiểm", desc: "Nắng nóng gay gắt kéo dài.", advice: "Hạn chế ra ngoài từ 11h - 15h. Đeo kính râm và che chắn cơ thể kỹ càng.", icon: "🥵" }
};

const CITY_COORDS = {
  hanoi: { lat: 21.0285, lon: 105.8542 },
  danang: { lat: 16.0544, lon: 108.2022 },
  hcm: { lat: 10.8231, lon: 106.6297 }
};

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCity, setSelectedCity] = useState<keyof typeof CITIES_WEATHER>("danang");
  const [citiesWeather, setCitiesWeather] = useState(CITIES_WEATHER);

  // Live weather fetching using Open-Meteo API
  useEffect(() => {
    async function fetchLiveWeather() {
      const coords = CITY_COORDS[selectedCity];
      if (!coords) return;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&daily=uv_index_max&timezone=auto&forecast_days=1`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        const temp = Math.round(data.current?.temperature_2m ?? 30);
        const uv = Math.round(data.daily?.uv_index_max?.[0] ?? 6);
        const code = data.current?.weather_code ?? 0;
        
        let status = "Vừa phải";
        let advice = "Nên thoa kem chống nắng khi ra đường vào buổi trưa.";
        let icon = "⛅";
        let desc = "Trời có mây, nắng nhẹ.";

        if (uv >= 8) {
          status = "Rất cao 🚨";
          advice = "UV rất mạnh. Hãy thoa lại kem chống nắng sau mỗi 2-3 giờ hoạt động ngoài trời.";
        } else if (uv >= 6) {
          status = "Cao ⚠️";
          advice = "Nên thoa kem chống nắng đầy đủ, đeo kính râm khi ra ngoài.";
        } else if (uv >= 3) {
          status = "Vừa phải";
          advice = "Thoa kem chống nắng trước khi ra đường.";
        } else {
          status = "Thấp ✅";
          advice = "Chỉ số UV an toàn cho da.";
        }

        if (code >= 71) { desc = "Có tuyết."; icon = "❄️"; }
        else if (code >= 51) { desc = "Trời mưa ẩm ướt."; icon = "🌧️"; }
        else if (code >= 1) { desc = "Nắng ấm, có mây rải rác."; icon = "⛅"; }
        else { desc = "Trời nắng trong xanh."; icon = "☀️"; }

        setCitiesWeather(prev => ({
          ...prev,
          [selectedCity]: {
            name: prev[selectedCity].name,
            uv,
            status,
            desc: `${desc} (Nhiệt độ: ${temp}°C)`,
            advice,
            icon
          }
        }));
      } catch (err) {
        console.error("Failed to fetch live weather", err);
      }
    }
    fetchLiveWeather();
  }, [selectedCity]);

  const user = useUserStore();
  const routine = useRoutineStore();
  const { recoveryMode, setRecoveryMode } = useSkinStore();
  const { handleAddToRoutine } = useAddToRoutine();

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
    handleAddToRoutine(product);
  };

  // --- Quiz logic removed. Now points to /quiz ---

  return (
    <div className="min-h-screen bg-bg text-fg pb-24">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SkinWise Logo" className="w-8 h-8 rounded-xl object-contain bg-white border border-line" />
            <span className="text-title font-light tracking-tight">Skin<span className="font-semibold text-accent-dark">Wise</span> Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-caption text-muted hover:text-fg transition-colors">
              Trang chủ
            </Link>
            <Link href="/ingredients" className="text-caption text-muted hover:text-fg transition-colors">
              Bách khoa thành phần
            </Link>
            <Link href="/admin/tracking" className="text-caption text-muted hover:text-fg transition-colors">
              Báo cáo Admin
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
                citiesWeather={citiesWeather}
                recommendedProducts={recommended}
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
                />
              ) : (
                <div className="border border-line rounded-[32px] p-10 bg-white shadow-soft text-center space-y-5">
                  <div className="w-16 h-16 bg-fg/5 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles size={28} className="text-accent" />
                  </div>
                  <h2 className="text-headline font-semibold">Chẩn đoán da cá nhân hóa</h2>
                  <p className="text-body text-muted max-w-md mx-auto">
                    Trả lời 6 câu hỏi ngắn để SkinWise AI tạo hồ sơ da và gợi ý
                    routine phù hợp nhất cho bạn.
                  </p>
                  <Link
                    href="/quiz"
                    className="inline-flex items-center gap-2 bg-fg text-bg px-6 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-all"
                  >
                    <Sparkles size={16} /> Làm quiz chẩn đoán da
                  </Link>
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
                    onClick={() => router.push("/quiz")}
                    className="text-caption text-muted hover:text-fg font-medium underline shrink-0"
                  >
                    Thay đổi hồ sơ
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-line rounded-[24px] p-6 text-center shadow-soft">
                  <p className="text-body text-muted mb-3">Bạn chưa hoàn thành chẩn đoán da.</p>
                  <button
                    onClick={() => router.push("/quiz")}
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
                        <AlertTriangle size={18} />
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
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide border border-line rounded-2xl p-4 bg-white/50">
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

    </div>
  );
}
