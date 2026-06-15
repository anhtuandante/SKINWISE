"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Settings, 
  ShoppingBag, 
  ExternalLink, 
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/user-store";
import { useRoutineStore } from "@/store/routine-store";
import { useToastStore } from "@/store/toast-store";
import { filterProducts } from "@/lib/quiz-logic";
import { Product } from "@/types";
import { CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function SkinWallet() {
  const user = useUserStore();
  const routine = useRoutineStore();
  const addToast = useToastStore((s) => s.addToast);

  const [recommended, setRecommended] = useState<Product[]>([]);
  const [walletInput, setWalletInput] = useState((user.totalBudget || 1500000).toString());
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  // Fetch recommendations for upgrades/gaps
  useEffect(() => {
    async function load() {
      if (user.skinType && user.budget) {
        try {
          const data = await filterProducts(user);
          setRecommended(data);
        } catch (err) {
          console.error("Failed to load products for wallet recommendations:", err);
        }
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.skinType, user.budget]);

  useEffect(() => {
    setWalletInput((user.totalBudget || 1500000).toString());
  }, [user.totalBudget]);

  const ownedProductIds = useMemo(() => {
    return routine.ownedProductIds || [];
  }, [routine.ownedProductIds]);

  const uniqueProducts = useMemo(() => {
    const all = [...routine.morningRoutine, ...routine.eveningRoutine];
    return Array.from(new Map(all.map(p => [p.id, p])).values());
  }, [routine.morningRoutine, routine.eveningRoutine]);

  const toBuyProducts = useMemo(() => {
    return uniqueProducts.filter(p => !ownedProductIds.includes(p.id));
  }, [uniqueProducts, ownedProductIds]);

  const toBuySpendTotal = useMemo(() => {
    return toBuyProducts.reduce((sum, p) => sum + p.price, 0);
  }, [toBuyProducts]);

  const ownedProductsCost = useMemo(() => {
    return uniqueProducts
      .filter(p => ownedProductIds.includes(p.id))
      .reduce((sum, p) => sum + p.price, 0);
  }, [uniqueProducts, ownedProductIds]);

  const walletBalance = useMemo(() => {
    return (user.totalBudget || 1500000) - toBuySpendTotal;
  }, [user.totalBudget, toBuySpendTotal]);

  const upgradeSuggestions = useMemo(() => {
    const suggestions = [];
    if (walletBalance <= 100000 || recommended.length === 0) return [];

    for (const p of uniqueProducts) {
      const alternatives = recommended.filter(alt => 
        alt.category === p.category && 
        alt.id !== p.id &&
        alt.price > p.price && 
        alt.price - p.price <= walletBalance
      );

      if (alternatives.length > 0) {
        const bestAlt = alternatives.sort((a, b) => b.price - a.price)[0];
        if (bestAlt.price > p.price * 1.25) { 
          suggestions.push({
            currentProduct: p,
            upgradeProduct: bestAlt,
            costDiff: bestAlt.price - p.price
          });
        }
      }
    }
    return suggestions.slice(0, 2);
  }, [uniqueProducts, recommended, walletBalance]);

  const walletSuggestions = useMemo(() => {
    const allProducts = [...routine.morningRoutine, ...routine.eveningRoutine];
    const hasCleanser = allProducts.some(p => p.category === "cleanser");
    const hasMoisturizer = allProducts.some(p => p.category === "toner" || p.category === "moisturizer");
    const hasSunscreen = allProducts.some(p => p.category === "sunscreen");

    const suggestions = [];

    if (!hasSunscreen) {
      const recommendedSunscreen = recommended.find(p => p.category === "sunscreen" && p.price <= walletBalance);
      suggestions.push({
        type: "danger",
        title: "Thiếu Kem Chống Nắng ☀️",
        desc: "Chống nắng là bước tối quan trọng bảo vệ da khỏi tia UV. Hãy bổ sung ngay.",
        recommendedProduct: recommendedSunscreen || recommended.find(p => p.category === "sunscreen")
      });
    }

    if (!hasCleanser) {
      const recommendedCleanser = recommended.find(p => p.category === "cleanser" && p.price <= walletBalance);
      suggestions.push({
        type: "danger",
        title: "Thiếu Sữa Rửa Mặt 🧼",
        desc: "Bụi bẩn và dầu nhờn tích tụ cả ngày cần được làm sạch để tránh bít tắc gây mụn.",
        recommendedProduct: recommendedCleanser || recommended.find(p => p.category === "cleanser")
      });
    }

    if (!hasMoisturizer) {
      const recommendedMoisturizer = recommended.find(p => (p.category === "moisturizer" || p.category === "toner") && p.price <= walletBalance);
      suggestions.push({
        type: "warning",
        title: "Thiếu Kem Dưỡng Ẩm 💧",
        desc: "Thiếu khóa ẩm làm tăng thất thoát nước xuyên biểu bì, khiến da dễ khô sần.",
        recommendedProduct: recommendedMoisturizer || recommended.find(p => p.category === "moisturizer")
      });
    }

    return suggestions;
  }, [routine.morningRoutine, routine.eveningRoutine, recommended, walletBalance]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Visa-style Card */}
        <div className="relative w-full aspect-[1.586/1] rounded-3xl overflow-hidden p-6 text-white shadow-xl border border-white/20 select-none flex flex-col justify-between bg-zinc-950">
          <div className={cn(
            "absolute inset-0 opacity-40 blur-2xl -z-10 bg-gradient-to-br transition-all duration-700",
            user.skinType === "oily" ? "from-emerald-500 via-teal-600 to-zinc-950" :
            user.skinType === "dry" ? "from-blue-500 via-cyan-600 to-zinc-950" :
            user.skinType === "sensitive" ? "from-rose-500 via-amber-600 to-zinc-950" :
            "from-zinc-700 via-zinc-800 to-zinc-950"
          )} />
          <div className="absolute inset-0 bg-black/10 -z-10" />

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] tracking-[0.2em] font-extrabold text-white/50 block font-semibold">SKINWISE AI CARD</span>
              <span className="text-[11px] font-bold text-white/80 uppercase px-2 py-0.5 bg-white/10 rounded-full border border-white/5">
                {user.skinType === "oily" ? "Da dầu" : user.skinType === "dry" ? "Da khô" : user.skinType === "sensitive" ? "Da nhạy cảm" : "Da thường"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center shrink-0">
              <div className="w-6 h-4 bg-gradient-to-r from-yellow-500/80 to-yellow-600/90 rounded opacity-90 relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-yellow-900/40" />
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-yellow-900/40" />
              </div>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] tracking-[0.15em] font-bold text-white/50 uppercase block">Số dư khả dụng</span>
            <div className="text-3xl font-extrabold tracking-tight tabular-nums flex items-baseline gap-1 font-sans">
              {walletBalance.toLocaleString()}
              <span className="text-lg font-bold text-white/70">đ</span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <span className="text-[9px] tracking-wider text-white/40 block">CHỦ THẺ</span>
              <span className="text-caption font-extrabold tracking-wide uppercase">{user.title || "SkinWise Member"}</span>
            </div>
            <button
              onClick={() => setIsEditingBudget(!isEditingBudget)}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 rounded-xl transition-all flex items-center gap-1 text-micro font-bold"
            >
              <Settings size={12} />
              Sửa ví
            </button>
          </div>
        </div>

        {/* Smart spend progress */}
        <div className="space-y-4 p-5 bg-line/10 rounded-2xl border border-line/40">
          <div className="flex justify-between items-center text-caption font-bold">
            <span className="text-muted">Tiến trình chi tiêu</span>
            <span className={cn(
              walletBalance >= 0 ? "text-emerald-600" : "text-red-500"
            )}>
              {walletBalance >= 0 
                ? `Dư ví: ${walletBalance.toLocaleString()}đ` 
                : `Vượt ví: ${Math.abs(walletBalance).toLocaleString()}đ ⚠️`
              }
            </span>
          </div>

          <div className="w-full h-3 bg-line/45 rounded-full overflow-hidden flex">
            {(() => {
              const total = user.totalBudget || 1500000;
              const ownedPct = Math.min(100, (ownedProductsCost / total) * 100);
              const toBuyPct = Math.min(100 - ownedPct, (toBuySpendTotal / total) * 100);
              
              if (toBuySpendTotal > total) {
                return <div className="h-full bg-red-500 w-full transition-all duration-500" />;
              }

              return (
                <>
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${ownedPct}%` }}
                    title={`Đã sở hữu: ${ownedProductsCost.toLocaleString()}đ`}
                  />
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${toBuyPct}%` }}
                    title={`Cần chi thêm: ${toBuySpendTotal.toLocaleString()}đ`}
                  />
                </>
              );
            })()}
          </div>

          <div className="grid grid-cols-3 text-[10px] font-semibold text-muted text-center divide-x divide-line">
            <div>
              <span>Đã sở hữu</span>
              <span className="text-fg font-extrabold block mt-0.5 font-sans">{ownedProductsCost.toLocaleString()}đ</span>
            </div>
            <div>
              <span>Cần mua</span>
              <span className="text-fg font-extrabold block mt-0.5 font-sans">{toBuySpendTotal.toLocaleString()}đ</span>
            </div>
            <div>
              <span>Tổng ví</span>
              <span className="text-fg font-extrabold block mt-0.5 font-sans">{(user.totalBudget || 1500000).toLocaleString()}đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Budget Editor Form */}
      <AnimatePresence>
        {isEditingBudget && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="p-4 bg-surface border border-line rounded-2xl space-y-4 overflow-hidden animate-in"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-caption font-bold text-fg">Thiết lập ngân sách mới</h4>
                <p className="text-micro text-muted font-medium">Nhập số tiền tối đa bạn muốn đầu tư cho cả chu trình da.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    user.setTotalBudget(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(e.currentTarget.value) || 0;
                      user.setTotalBudget(val);
                      setIsEditingBudget(false);
                      addToast("Đã cập nhật ngân sách SkinWallet", "success");
                    }
                  }}
                  className="w-32 bg-white border border-line rounded-xl px-3 py-2 text-caption text-right outline-none focus:border-fg transition-all font-bold"
                />
                <span className="text-caption font-bold text-muted">VND</span>
                <button
                  onClick={() => {
                    const val = parseInt(walletInput) || 0;
                    user.setTotalBudget(val);
                    setIsEditingBudget(false);
                    addToast("Đã cập nhật ngân sách SkinWallet", "success");
                  }}
                  className="px-3 py-2 bg-fg text-bg rounded-xl text-caption font-bold hover:opacity-90 active:scale-95 transition-all"
                >
                  Lưu
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-micro text-muted font-bold uppercase tracking-wider">Chọn nhanh:</span>
              {[300000, 500000, 1000000, 1500000, 2500000, 4000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setWalletInput(preset.toString());
                    user.setTotalBudget(preset);
                    addToast("Đã cập nhật ngân sách SkinWallet", "success");
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-micro font-bold border transition-all",
                    user.totalBudget === preset
                      ? "bg-fg text-bg border-fg"
                      : "bg-bg text-fg border-line hover:border-fg/40"
                  )}
                >
                  {preset >= 1000000 ? `${(preset / 1000000).toFixed(1).replace(".0", "")}tr` : `${preset / 1000}k`}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shopping List & Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-line/60">
        {/* Real-time Shopping List */}
        <div className="space-y-3">
          <h4 className="text-caption font-extrabold text-fg flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-accent-dark" />
            <span>Danh sách cần mua ({toBuyProducts.length})</span>
          </h4>

          {toBuyProducts.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {toBuyProducts.map((p) => (
                <div 
                  key={p.id} 
                  className="p-3 bg-surface border border-line rounded-xl flex items-center justify-between gap-3 hover:border-fg/10 transition-all bg-surface/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input 
                      type="checkbox"
                      checked={false}
                      onChange={() => {
                        routine.toggleProductOwned(p.id);
                        addToast(`Đã chuyển ${p.name} vào tủ đồ`, "success");
                      }}
                      className="w-4 h-4 rounded border-line text-emerald-500 focus:ring-emerald-500 cursor-pointer bg-white"
                    />
                    <div className="min-w-0">
                      <span className="text-caption font-bold text-fg block truncate">{p.name}</span>
                      <span className="text-micro text-muted font-semibold block truncate">
                        {p.brand} · {CATEGORY_LABELS[p.category] || p.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-caption font-bold text-fg whitespace-nowrap">{p.price.toLocaleString()}đ</span>
                    <a 
                      href={`${p.shopeeUrl}${p.shopeeUrl.includes('?') ? '&' : '?'}utm_source=affiliate&utm_medium=skincare_app&utm_campaign=skinwise_workspace`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-orange-500/10 border border-orange-500/20 text-[#EE4D2D] rounded-lg transition-all"
                      title="Mua ngay trên Shopee"
                    >
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-green-500/[0.02] border border-green-500/10 rounded-2xl text-[11px] text-green-700 leading-normal flex items-start gap-2">
              <span className="text-xs shrink-0">🎉</span>
              <span>Đã sở hữu tất cả sản phẩm! Không cần chi tiêu thêm.</span>
            </div>
          )}
        </div>

        {/* AI Shopping Gaps / Upgrades */}
        <div className="space-y-4">
          <h4 className="text-caption font-extrabold text-fg flex items-center gap-1.5">
            <Sparkles size={14} className="text-accent animate-pulse" />
            <span>Đề xuất tối ưu hóa từ AI</span>
          </h4>

          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
            {walletSuggestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-red-500 block uppercase tracking-wider">Lỗ hổng chu trình đề xuất bù đắp:</span>
                {walletSuggestions.slice(0, 2).map((sug, idx) => {
                  const prod = sug.recommendedProduct;
                  return (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl border bg-red-500/[0.02] border-red-500/15 text-caption space-y-2"
                    >
                      <div>
                        <span className="font-bold text-red-600 block">{sug.title}</span>
                        <p className="text-[11px] text-muted leading-relaxed">{sug.desc}</p>
                      </div>
                      {prod && (
                        <div className="bg-bg border border-line rounded-lg p-2 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-fg block truncate">{prod.name}</span>
                            <span className="text-[9px] text-muted block mt-0.5 truncate">{prod.brand} · {prod.price.toLocaleString()}đ</span>
                          </div>
                          {prod.price <= walletBalance ? (
                            <button
                              onClick={() => {
                                if (prod.timeOfDay === "AM") routine.addToMorning(prod);
                                else if (prod.timeOfDay === "PM") routine.addToEvening(prod);
                                else {
                                  if (prod.category === "sunscreen") routine.addToMorning(prod);
                                  else {
                                    routine.addToMorning(prod);
                                    routine.addToEvening(prod);
                                  }
                                }
                                addToast(`Đã thêm ${prod.name} vào chu trình`, "success");
                              }}
                              className="text-[9px] bg-green-500/10 text-green-600 hover:bg-green-500/20 px-2 py-1 rounded font-extrabold shrink-0 uppercase transition-all"
                            >
                              Thêm vào ví
                            </button>
                          ) : (
                            <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-extrabold shrink-0 uppercase">Thiếu ví</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {upgradeSuggestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-accent-dark block uppercase tracking-wider">Cơ hội nâng cấp routine:</span>
                {upgradeSuggestions.map((up, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-gradient-to-r from-accent/5 to-transparent border border-accent/15 rounded-xl text-caption space-y-2"
                  >
                    <div>
                      <span className="font-bold text-accent-dark block">Nâng cấp {CATEGORY_LABELS[up.currentProduct.category] || up.currentProduct.category} ⚡</span>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Nâng cấp từ <strong>{up.currentProduct.name}</strong> lên dòng cao cấp hơn <strong>{up.upgradeProduct.name}</strong> (+{up.costDiff.toLocaleString()}đ).
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        routine.removeFromMorning(up.currentProduct.id);
                        routine.removeFromEvening(up.currentProduct.id);
                        const upgraded = up.upgradeProduct;
                        if (upgraded.timeOfDay === "AM") routine.addToMorning(upgraded);
                        else if (upgraded.timeOfDay === "PM") routine.addToEvening(upgraded);
                        else {
                          routine.addToMorning(upgraded);
                          routine.addToEvening(upgraded);
                        }
                        addToast(`Đã nâng cấp lên ${upgraded.name}`, "success");
                      }}
                      className="text-[9px] bg-accent/10 text-accent-dark hover:bg-accent/20 px-2 py-1 rounded font-extrabold uppercase transition-all"
                    >
                      Đồng ý nâng cấp
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
