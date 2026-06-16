"use client";

import { CheckCircle2, Sparkles, Check, RotateCcw, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useUserStore } from "@/store/user-store";
import { useRoutineStore } from "@/store/routine-store";
import { useAddToRoutine } from "@/hooks/useAddToRoutine";
import { SKIN_LABELS, CONCERN_LABELS, BUDGET_LABELS } from "@/lib/constants";
import ProductCard from "@/components/routine/ProductCard";
import { Product } from "@/types";
import Link from "next/link";

interface SkinProfileCardProps {
  recommended: Product[];
  setActiveTab: (tab: string) => void;
}

export default function SkinProfileCard({
  recommended,
  setActiveTab,
}: SkinProfileCardProps) {
  const user = useUserStore();
  const routine = useRoutineStore();
  const { handleAddToRoutine } = useAddToRoutine();

  const handleAddProduct = (product: Product) => {
    handleAddToRoutine(product);
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
            Ví: {user.totalBudget ? `${user.totalBudget.toLocaleString()}đ` : BUDGET_LABELS[user.budget]}
          </span>
        </div>
      </div>

      {/* Suggested care goals — dynamically generated from user profile */}
      <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft space-y-4">
        <h3 className="text-body font-bold text-fg">Mục tiêu chăm sóc đề xuất</h3>
        <div className="space-y-3">
          {(() => {
            const goals: string[] = [];

            // Barrier-specific goals (highest priority)
            if (user.barrierStatus === "stinging" || user.barrierStatus === "flaking" || user.barrierStatus === "redness") {
              goals.push("Ưu tiên phục hồi hàng rào bảo vệ da: tạm dừng mọi hoạt chất đặc trị.");
              goals.push("Chỉ sử dụng sản phẩm chứa Ceramide, B5, Centella — làm dịu và cấp ẩm.");
            } else {
              goals.push("Duy trì hàng rào bảo vệ da khỏe mạnh với dưỡng ẩm đều đặn.");
            }

            // Skin type goals
            if (user.skinType === "oily") {
              goals.push("Kiểm soát dầu thừa bằng sản phẩm kết cấu gel hoặc lotion nhẹ, không bít tắc lỗ chân lông.");
            } else if (user.skinType === "dry") {
              goals.push("Tăng cường cấp ẩm sâu với hyaluronic acid và kem dưỡng giàu lipid.");
            } else if (user.skinType === "combination") {
              goals.push("Phân vùng chăm sóc: dưỡng ẩm nhẹ vùng T, cấp ẩm sâu hai bên má.");
            } else if (user.skinType === "sensitive") {
              goals.push("Tối giản chu trình: chọn sản phẩm dịu nhẹ, không hương liệu, không cồn.");
            }

            // Concern-specific goals
            if (user.concerns?.includes("acne")) {
              goals.push("Tập trung trị mụn với BHA/Salicylic Acid, nhưng xen kẽ ngày nghỉ để da phục hồi.");
            }
            if (user.concerns?.includes("aging")) {
              goals.push("Sử dụng Retinol 2-3 lần/tuần vào buổi tối, kết hợp chống nắng SPF50+ ban ngày.");
            }
            if (user.concerns?.includes("dark_spots") || user.concerns?.includes("pigmentation")) {
              goals.push("Dùng Vitamin C buổi sáng + Niacinamide để làm sáng da và mờ thâm.");
            }
            if (user.concerns?.includes("pores")) {
              goals.push("Thu nhỏ lỗ chân lông bằng Niacinamide 10% và tẩy da chết BHA nhẹ nhàng.");
            }

            // Always add sunscreen reminder
            goals.push("Bảo vệ da mỗi ngày bằng kem chống nắng SPF30+ — cả trong nhà và trời râm.");

            return goals.slice(0, 5).map((g, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-caption text-muted leading-relaxed">
                <Check size={14} className="text-success shrink-0 mt-0.5" />
                <span>{g}</span>
              </div>
            ));
          })()}
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
          <div className="bg-surface/40 border border-line rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-accent-dark font-bold text-caption">
              <span>🌙 ROUTINE BUỔI TỐI (Điều trị & Dưỡng)</span>
            </div>
            <div className="space-y-2 text-micro">
              {(user.barrierStatus === "stinging" || user.barrierStatus === "flaking" || user.barrierStatus === "redness") ? (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Nước tẩy trang dịu nhẹ không cồn</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Sữa rửa mặt phục hồi hàng rào da</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Kem dưỡng Ceramide / B5 phục hồi sâu</span>
                  </div>
                </>
              ) : user.concerns.includes("acne") ? (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Tẩy trang làm sạch sâu bụi mịn</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Sữa rửa mặt tạo bọt mịn sạch sâu</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Tẩy da chết hóa học (BHA 2% Liquid)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">4</span>
                    <span>Kem dưỡng ẩm mỏng nhẹ kiểm soát dầu (Gel-cream)</span>
                  </div>
                </>
              ) : user.concerns.includes("aging") ? (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Tẩy trang dạng sáp/dầu loại bỏ sạch cặn trang điểm</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Sữa rửa mặt cấp ẩm chống lão hóa</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Serum Retinol tái tạo trẻ hóa làn da</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">4</span>
                    <span>Kem dưỡng ẩm phục hồi chống nhăn chứa Peptide</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Tẩy trang dịu nhẹ dịu mát da</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Sữa rửa mặt làm sạch nhẹ nhàng</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Serum cấp nước Hyaluronic Acid</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="w-5 h-5 bg-accent-light/40 text-accent-dark rounded-full flex items-center justify-center font-bold">4</span>
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

      {/* Quiz History Timeline */}
      {user.quizHistory && user.quizHistory.length > 0 && (
        <QuizHistoryTimeline snapshots={user.quizHistory} />
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab("routine")}
          className="flex-1 py-4 bg-fg text-bg rounded-2xl text-body font-bold shadow-lg shadow-fg/10 active:scale-95 transition-all text-center"
        >
          Xem chiến lược Routine →
        </button>
        <Link
          href="/quiz"
          className="px-5 py-4 border border-accent/30 bg-accent/5 rounded-2xl hover:bg-accent/10 text-accent-dark hover:text-accent transition-all flex items-center gap-2"
          aria-label="Làm lại chẩn đoán"
        >
          <RotateCcw size={16} />
          <span className="text-caption font-bold hidden sm:inline">Làm lại Quiz</span>
        </Link>
      </div>
    </div>
  );
}

// --- Quiz History Timeline Component ---
function QuizHistoryTimeline({ snapshots }: { snapshots: Array<{ id: string; completedAt: string; skinType: string; concerns: string[]; barrierStatus: string; totalBudget: number; isRetake: boolean }> }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const skinTypeLabel = (t: string) => {
    const m: Record<string, string> = { oily: 'Dầu', dry: 'Khô', sensitive: 'Nhạy cảm', combination: 'Hỗn hợp', normal: 'Thường' };
    return m[t] || t;
  };

  const concernLabel = (c: string) => {
    const m: Record<string, string> = { acne: 'Mụn', pores: 'Lỗ chân lông', 'dark-spots': 'Thâm', aging: 'Lão hóa', dullness: 'Xỉn màu', dryness: 'Thiếu ẩm' };
    return m[c] || c;
  };

  return (
    <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body font-bold text-fg flex items-center gap-2">
          <Clock size={16} className="text-muted" />
          <span>Lịch sử Quiz ({snapshots.length} lần)</span>
        </h3>
      </div>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-line" />
        <div className="space-y-3">
          {[...snapshots].reverse().map((snap, idx) => {
            const isExpanded = expandedId === snap.id;
            return (
              <div key={snap.id} className="relative pl-8">
                {/* Dot */}
                <div className={`absolute left-[5px] top-2 w-[14px] h-[14px] rounded-full border-2 ${
                  idx === 0 ? 'bg-accent border-accent-dark' : 'bg-white border-line'
                }`} />
                <button
                  onClick={() => setExpandedId(isExpanded ? null : snap.id)}
                  className="w-full text-left p-3 rounded-xl hover:bg-surface/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-caption font-bold text-fg">
                        {idx === 0 ? 'Hiện tại' : `Lần ${snapshots.length - idx}`}
                      </span>
                      <span className="text-[10px] text-muted ml-2">{formatDate(snap.completedAt)}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                  </div>
                  {!isExpanded && (
                    <p className="text-[11px] text-muted mt-0.5">
                      Da {skinTypeLabel(snap.skinType)} · {snap.concerns.map(concernLabel).join(', ')}
                    </p>
                  )}
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] bg-fg/5 text-fg px-2 py-1 rounded-full font-bold">Da: {skinTypeLabel(snap.skinType)}</span>
                      {snap.concerns.map(c => (
                        <span key={c} className="text-[10px] bg-fg/5 text-fg px-2 py-1 rounded-full font-bold">{concernLabel(c)}</span>
                      ))}
                      <span className="text-[10px] bg-fg/5 text-fg px-2 py-1 rounded-full font-bold">{snap.totalBudget.toLocaleString()}đ</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
