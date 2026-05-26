"use client";

import { CheckCircle2, Sparkles, Check, RotateCcw } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { useRoutineStore } from "@/store/routine-store";
import { useToastStore } from "@/store/toast-store";
import { SKIN_LABELS, CONCERN_LABELS, BUDGET_LABELS } from "@/lib/constants";
import ProductCard from "@/components/routine/ProductCard";
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

interface SkinProfileCardProps {
  recommended: Product[];
  setActiveTab: (tab: string) => void;
  setQuizStep: (step: number) => void;
  setQuizAnswers: React.Dispatch<React.SetStateAction<QuizAnswers>>;
}

export default function SkinProfileCard({
  recommended,
  setActiveTab,
  setQuizStep,
  setQuizAnswers,
}: SkinProfileCardProps) {
  const user = useUserStore();
  const routine = useRoutineStore();
  const addToast = useToastStore((s) => s.addToast);

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

  return (
    <div className="space-y-6">
      {/* Summary profile card */}
      <div className="bg-gradient-to-br from-fg to-slate-900 rounded-[32px] p-8 text-white relative shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={18} className="text-accent animate-pulse" />
          <span className="text-accent text-[10px] font-extrabold uppercase tracking-widest">Hồ sơ da của bạn</span>
        </div>
        <h2 className="text-headline font-light mb-2">{user.title}</h2>
        <p className="text-slate-300 text-body">{user.mainGoal}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white/10 rounded-full text-caption border border-white/5 text-slate-200">
            {SKIN_LABELS[user.skinType]}
          </span>
          {user.concerns.map((c) => (
            <span key={c} className="px-3 py-1 bg-white/10 rounded-full text-caption border border-white/5 text-slate-200">
              Mục tiêu: {CONCERN_LABELS[c] || c}
            </span>
          ))}
          <span className="px-3 py-1 bg-white/10 rounded-full text-caption border border-white/5 text-slate-200">
            {BUDGET_LABELS[user.budget]}
          </span>
        </div>
      </div>

      {/* Suggested care goals */}
      <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft space-y-4">
        <h3 className="text-body font-bold text-fg">Mục tiêu chăm sóc đề xuất</h3>
        <div className="space-y-3">
          {[
            "Cân bằng độ ẩm tự nhiên của hàng rào bảo vệ da.",
            "Tập trung làm dịu đốm mụn viêm/thâm đỏ dịu nhẹ.",
            "Lựa chọn kết cấu sản phẩm mỏng nhẹ (gel/lotion) để hấp thụ tối đa.",
            "Tránh lạm dụng AHA/BHA khi da đang có dấu hiệu châm chích.",
          ].map((g, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-caption text-muted leading-relaxed">
              <Check size={14} className="text-success shrink-0 mt-0.5" />
              <span>{g}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Routine */}
      <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft space-y-4">
        <h3 className="text-body font-bold text-fg flex items-center gap-2">
          <Sparkles size={18} className="text-accent-dark" />
          <span>Chu trình Skincare (Routine) gợi ý cho bạn</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* AM Routine */}
          <div className="bg-[#FFFDF9] border border-amber-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-caption">
              <span>☀️ ROUTINE BUỔI SÁNG (Bảo vệ)</span>
            </div>
            <div className="space-y-2 text-micro">
              {(user.barrierStatus === "stinging" || user.barrierStatus === "flaking" || user.barrierStatus === "redness") ? (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Rửa mặt dịu nhẹ / Nước ấm</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Toner phục hồi dịu nhẹ</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Serum B5 / Rau má làm dịu da</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">4</span>
                    <span>Kem chống nắng vật lý lành tính</span>
                  </div>
                </>
              ) : user.concerns.includes("acne") ? (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Gel rửa mặt kiềm dầu (Salicylic Acid)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Toner se khít lỗ chân lông</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Serum Niacinamide kiểm soát bã nhờn</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">4</span>
                    <span>Kem chống nắng phổ rộng dạng sữa ráo mịn</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Sữa rửa mặt cấp ẩm</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Toner HA cấp nước sâu</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Serum Vitamin C làm sáng da & chống oxy hóa</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">4</span>
                    <span>Kem chống nắng bảo vệ toàn diện</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* PM Routine */}
          <div className="bg-[#FAF9FF] border border-violet-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-violet-700 font-bold text-caption">
              <span>🌙 ROUTINE BUỔI TỐI (Điều trị & Dưỡng)</span>
            </div>
            <div className="space-y-2 text-micro">
              {(user.barrierStatus === "stinging" || user.barrierStatus === "flaking" || user.barrierStatus === "redness") ? (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Nước tẩy trang dịu nhẹ không cồn</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Sữa rửa mặt phục hồi hàng rào da</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Kem dưỡng Ceramide / B5 phục hồi sâu</span>
                  </div>
                </>
              ) : user.concerns.includes("acne") ? (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Tẩy trang làm sạch sâu bụi mịn</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Sữa rửa mặt tạo bọt mịn sạch sâu</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Tẩy da chết hóa học (BHA 2% Liquid)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">4</span>
                    <span>Kem dưỡng ẩm mỏng nhẹ kiểm soát dầu (Gel-cream)</span>
                  </div>
                </>
              ) : user.concerns.includes("aging") ? (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Tẩy trang dạng sáp/dầu loại bỏ sạch cặn trang điểm</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Sữa rửa mặt cấp ẩm chống lão hóa</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Serum Retinol tái tạo trẻ hóa làn da</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">4</span>
                    <span>Kem dưỡng ẩm phục hồi chống nhăn chứa Peptide</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Tẩy trang dịu nhẹ dịu mát da</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Sữa rửa mặt làm sạch nhẹ nhàng</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Serum cấp nước Hyaluronic Acid</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold">4</span>
                    <span>Kem dưỡng ẩm bảo vệ da qua đêm</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Skincare Recommendations */}
        <div className="space-y-3">
          <h3 className="text-body font-bold text-fg flex items-center gap-2">
            <Sparkles size={16} className="text-[#C4A882]" />
            <span>Sản phẩm Dưỡng da (Skincare) phù hợp nhất</span>
          </h3>
          {recommended.filter((p) => p.type === "skincare").length === 0 ? (
            <p className="text-caption text-muted bg-surface/50 border border-line p-4 rounded-xl">
              Không tìm thấy sản phẩm dưỡng da nào phù hợp.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {recommended
                .filter((p) => p.type === "skincare")
                .slice(0, 4)
                .map((p: Product) => {
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
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Makeup Recommendations */}
        <div className="space-y-3">
          <h3 className="text-body font-bold text-fg flex items-center gap-2">
            <Sparkles size={16} className="text-[#C4A882]" />
            <span>Sản phẩm Trang điểm (Makeup) phù hợp nhất</span>
          </h3>
          {recommended.filter((p) => p.type === "makeup").length === 0 ? (
            <p className="text-caption text-muted bg-surface/50 border border-line p-4 rounded-xl">
              Không tìm thấy sản phẩm trang điểm nào phù hợp.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {recommended
                .filter((p) => p.type === "makeup")
                .slice(0, 4)
                .map((p: Product) => {
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
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab("routine")}
          className="flex-1 py-4 bg-fg text-bg rounded-2xl text-body font-bold shadow-lg shadow-fg/10 active:scale-95 transition-all text-center"
        >
          Xem chiến lược Routine →
        </button>
        <button
          onClick={() => {
            user.resetQuiz();
            setQuizStep(0);
            setQuizAnswers({
              skinType: "",
              concern: "",
              barrier: "",
              lifestyle: [],
              preference: "",
              budget: "",
            });
          }}
          className="px-6 py-4 border border-line rounded-2xl hover:bg-surface text-muted hover:text-fg transition-all"
          aria-label="Làm lại chẩn đoán"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
