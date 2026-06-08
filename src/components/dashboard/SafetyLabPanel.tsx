"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { 
  FlaskConical, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  X, 
  ArrowRightLeft, 
  Sparkles, 
  Baby, 
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
  Camera
} from "lucide-react";
import { getAllProducts, formatPrice } from "@/lib/quiz-logic";
import { Product, Ingredient } from "@/types";
import { checkConflicts, getSortedRoutine } from "@/lib/conflict-checker";
import { SKIN_LABELS, CATEGORY_LABELS } from "@/lib/constants";
import { useRoutineStore } from "@/store/routine-store";
import ProductAvatar from "@/components/ui/ProductAvatar";
import VisionLab from "@/components/quiz/VisionLab";
import ingredientsData from "@/data/ingredients.json";

const allIngredients = (ingredientsData as { ingredients: Ingredient[] }).ingredients;

const INGREDIENT_CATEGORY_LABELS: Record<string, string> = {
  brightening: "Sáng da",
  "anti-aging": "Chống lão hóa",
  hydrating: "Cấp ẩm",
  exfoliant: "Tẩy da chết",
  soothing: "Làm dịu",
  barrier: "Hàng rào",
  "acne-fighting": "Trị mụn",
  moisturizing: "Dưỡng ẩm",
  antioxidant: "Chống oxy hóa",
  texture: "Kết cấu",
  sunscreen: "Chống nắng",
  solvent: "Dung môi",
};

const SAMPLE_COMPARISONS = [
  {
    name: "Cặp Treatment Mụn & Phục Hồi",
    prodA: "paulas-choice-2-bha-liquid-exfoliant",
    prodB: "la-roche-posay-cicaplast-baume-b5",
    desc: "BHA làm sạch sâu cổ nang lông kết hợp kem phục hồi B5 giảm kích ứng"
  },
  {
    name: "Cặp Sáng Da Mờ Thâm",
    prodA: "dear-klairs-freshly-juiced-vitamin-drop",
    prodB: "the-ordinary-niacinamide-10-zinc-1",
    desc: "Vitamin C và Niacinamide dưỡng sáng, mờ thâm mụn hiệu quả"
  },
  {
    name: "Cặp Cấp Nước Chuyên Sâu",
    prodA: "loreal-paris-revitalift-hyaluronic-acid-serum",
    prodB: "cerave-moisturizing-cream",
    desc: "HA ngậm nước kết hợp Ceramides giúp củng cố hàng rào bảo vệ"
  },
  {
    name: "Cặp Dễ Gây Vón Cục (Pilling)",
    prodA: "vichy-mineral-89-serum",
    prodB: "maybelline-fit-me-matte-poreless-foundation",
    desc: "Serum gốc nước căng bóng da dùng chung kem nền gốc Silicone tạo mịn"
  }
];

const getProductActiveIngredients = (product: Product): Ingredient[] => {
  if (!product.ingredients) return [];
  return product.ingredients
    .map(ingId => allIngredients.find(i => i.id === ingId))
    .filter((ing): ing is Ingredient => !!ing);
};

export default function SafetyLabPanel() {
  const [safetyMode, setSafetyMode] = useState<"pair" | "full">("pair");
  const [showVisionModal, setShowVisionModal] = useState(false);
  
  // Zustand Routine Store
  const routineStore = useRoutineStore();
  const amList = routineStore.morningRoutine;
  const pmList = routineStore.eveningRoutine;
  
  // Tab 1: Product comparison state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductA, setSelectedProductA] = useState<Product | null>(null);
  const [selectedProductB, setSelectedProductB] = useState<Product | null>(null);
  const [searchQueryA, setSearchQueryA] = useState("");
  const [searchQueryB, setSearchQueryB] = useState("");
  const [showDropdownA, setShowDropdownA] = useState(false);
  const [showDropdownB, setShowDropdownB] = useState(false);

  const dropdownRefA = useRef<HTMLDivElement>(null);
  const dropdownRefB = useRef<HTMLDivElement>(null);

  // Fetch all products on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products in SafetyLabPanel:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Dropdown click outside listeners
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRefA.current && !dropdownRefA.current.contains(event.target as Node)) {
        setShowDropdownA(false);
      }
      if (dropdownRefB.current && !dropdownRefB.current.contains(event.target as Node)) {
        setShowDropdownB(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete filtering for Product A
  const filteredProductsA = useMemo(() => {
    const query = searchQueryA.toLowerCase().trim();
    if (!query) return products.slice(0, 15);
    return products.filter(
      p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query)
    );
  }, [products, searchQueryA]);

  // Autocomplete filtering for Product B
  const filteredProductsB = useMemo(() => {
    const query = searchQueryB.toLowerCase().trim();
    if (!query) return products.slice(0, 15);
    return products.filter(
      p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query)
    );
  }, [products, searchQueryB]);

  // Handle sample comparison click
  const handleSelectSample = (idA: string, idB: string) => {
    const prodA = products.find(p => p.id === idA);
    const prodB = products.find(p => p.id === idB);
    if (prodA) {
      setSelectedProductA(prodA);
      setSearchQueryA("");
    }
    if (prodB) {
      setSelectedProductB(prodB);
      setSearchQueryB("");
    }
  };

  // Reset comparison
  const handleResetComparison = () => {
    setSelectedProductA(null);
    setSelectedProductB(null);
    setSearchQueryA("");
    setSearchQueryB("");
  };



  // ==========================================
  // TAB 1 LOGIC: 2-Product Comparison Memos
  // ==========================================
  
  const conflicts = useMemo(() => {
    if (!selectedProductA || !selectedProductB) return [];
    return checkConflicts([selectedProductA, selectedProductB]);
  }, [selectedProductA, selectedProductB]);

  const baseComparison = useMemo(() => {
    if (!selectedProductA || !selectedProductB) return null;
    
    const getBaseType = (p: Product) => {
      if (p.isSiliconeBased) return "silicone";
      if (p.isWaterBased) return "water";
      const ingIds = p.ingredients || [];
      if (ingIds.includes("dimethicone") || ingIds.includes("silicone")) return "silicone";
      if (p.texture === "liquid" || p.texture === "gel") return "water";
      return "other";
    };

    const baseA = getBaseType(selectedProductA);
    const baseB = getBaseType(selectedProductB);

    let pillingRisk: "none" | "low" | "medium" | "high" = "none";
    let message = "";

    if (baseA === "silicone" && baseB === "silicone") {
      pillingRisk = "high";
      message = "Cả hai sản phẩm đều chứa gốc silicone (Dimethicone,...). Việc apply chồng 2 lớp khóa ẩm dạng màng silicone liên tiếp rất dễ tạo ra hiện tượng ghét trắng, bết và bong vón (pilling).";
    } else if ((baseA === "silicone" && baseB === "water") || (baseA === "water" && baseB === "silicone")) {
      pillingRisk = "medium";
      message = "Sản phẩm chứa gốc nước (Water-based) kết hợp với sản phẩm gốc silicone. Lớp silicone tạo màng chống thấm nước, nếu bôi chất gốc nước sau chất gốc silicone sẽ khiến chất gốc nước không thẩm thấu được, gây đọng bề mặt và vón cục.";
    } else {
      pillingRisk = "low";
      message = "Không phát hiện nguy cơ vón cục do phản ứng kết cấu. Thành phần dung môi của hai sản phẩm tương đối hài hòa.";
    }

    return { baseA, baseB, pillingRisk, message };
  }, [selectedProductA, selectedProductB]);

  const activeIngredientsComparison = useMemo(() => {
    if (!selectedProductA || !selectedProductB) return null;

    const activesA = getProductActiveIngredients(selectedProductA);
    const activesB = getProductActiveIngredients(selectedProductB);

    const activeIdsA = activesA.map(a => a.id);
    const activeIdsB = activesB.map(b => b.id);

    const sharedActives = activesA.filter(a => activeIdsB.includes(a.id));
    const uniqueActivesA = activesA.filter(a => !activeIdsB.includes(a.id));
    const uniqueActivesB = activesB.filter(b => !activeIdsA.includes(b.id));

    return { activesA, activesB, sharedActives, uniqueActivesA, uniqueActivesB };
  }, [selectedProductA, selectedProductB]);

  const pregnancySafety = useMemo(() => {
    if (!selectedProductA || !selectedProductB) return null;

    const activesA = getProductActiveIngredients(selectedProductA);
    const activesB = getProductActiveIngredients(selectedProductB);

    const unsafeA = activesA.filter(a => !a.pregnancy);
    const unsafeB = activesB.filter(b => !b.pregnancy);

    const isSafe = unsafeA.length === 0 && unsafeB.length === 0;

    return { isSafe, unsafeA, unsafeB };
  }, [selectedProductA, selectedProductB]);

  const layeringRecommendation = useMemo(() => {
    if (!selectedProductA || !selectedProductB) return null;

    const sorted = getSortedRoutine([selectedProductA, selectedProductB]);
    const first = sorted[0];
    const second = sorted[1];

    const activesA = getProductActiveIngredients(selectedProductA);
    const activesB = getProductActiveIngredients(selectedProductB);

    const hasPmOnlyA = activesA.some(a => a.timeOfDay === "PM");
    const hasPmOnlyB = activesB.some(b => b.timeOfDay === "PM");
    const hasAmOnlyA = activesA.some(a => a.timeOfDay === "AM");
    const hasAmOnlyB = activesB.some(b => b.timeOfDay === "AM");

    let timingAdvice = "Cả hai sản phẩm đều dịu nhẹ và có thể thoa chung một chu trình (Sáng hoặc Tối).";
    
    if ((hasPmOnlyA && hasAmOnlyB) || (hasAmOnlyA && hasPmOnlyB)) {
      const pmProduct = hasPmOnlyA ? selectedProductA : selectedProductB;
      const amProduct = hasPmOnlyA ? selectedProductB : selectedProductA;
      timingAdvice = `Nên tách chu trình: Dùng ${amProduct.name} vào buổi SÁNG (có công dụng sáng da, tăng hiệu quả chống nắng) và dùng ${pmProduct.name} vào buổi TỐI (phục hồi hoặc điều trị mạnh lúc da nghỉ ngơi).`;
    } else if (hasPmOnlyA && hasPmOnlyB) {
      timingAdvice = `Cả hai đều có hoạt chất khuyên dùng buổi tối. Để bảo vệ hàng rào da, khuyến nghị dùng CÁCH NGÀY (ví dụ sản phẩm A tối 2-4-6, sản phẩm B tối 3-5-7), tránh dồn cả hai active mạnh vào một buổi bôi.`;
    }

    return { first, second, timingAdvice };
  }, [selectedProductA, selectedProductB]);

  const safetyLevel = useMemo(() => {
    if (!selectedProductA || !selectedProductB) return "safe";
    
    const hasHighConflict = conflicts.some(c => c.severity === "high");
    if (hasHighConflict) return "danger";
    
    const hasMedConflict = conflicts.some(c => c.severity === "medium");
    const pillingHigh = baseComparison?.pillingRisk === "high";
    if (hasMedConflict || pillingHigh) return "warning";
    
    return "safe";
  }, [conflicts, baseComparison, selectedProductA, selectedProductB]);

  // ==========================================
  // TAB 2 LOGIC: User Full Routine Audit Memos
  // ==========================================
  
  // 1. Session conflicts
  const amConflicts = useMemo(() => checkConflicts(amList), [amList]);
  const pmConflicts = useMemo(() => checkConflicts(pmList), [pmList]);

  // 2. Sunscreen-Makeup Pilling Risk
  const makeupPillingWarnings = useMemo(() => {
    const warnings: string[] = [];
    const sunscreens = amList.filter(p => p.category === "sunscreen");
    const makeups = amList.filter(p => ["base-makeup", "blush", "eye", "brow", "lip"].includes(p.category));
    
    if (sunscreens.length > 0 && makeups.length > 0) {
      sunscreens.forEach(sun => {
        makeups.forEach(make => {
          const sunBase = sun.isSiliconeBased ? "silicone" : (sun.isWaterBased ? "water" : "other");
          const makeBase = make.isSiliconeBased ? "silicone" : (make.isWaterBased ? "water" : "other");
          
          if (sunBase === "water" && makeBase === "silicone") {
            warnings.push(`Kem chống nắng gốc nước (${sun.name}) dùng trước sản phẩm trang điểm gốc Silicone (${make.name}). Sự lệch pha này dễ làm mốc nền, trượt nền hoặc vón cục.`);
          } else if (sunBase === "silicone" && makeBase === "water") {
            warnings.push(`Kem chống nắng gốc Silicone (${sun.name}) dùng trước sản phẩm trang điểm gốc nước (${make.name}). Lớp màng silicone chống thấm của chống nắng sẽ cản trở lớp trang điểm gốc nước bám tệp, dễ gây bết và loang lổ.`);
          }
        });
      });
    }
    return warnings;
  }, [amList]);

  // 3. Double Cleansing warning
  const hasMakeupInAm = useMemo(() => {
    return amList.some(p => ["base-makeup", "blush", "eye", "brow", "lip"].includes(p.category));
  }, [amList]);

  const hasCleanserInPm = useMemo(() => {
    return pmList.some(p => p.category === "cleanser");
  }, [pmList]);

  const showDoubleCleansingWarning = useMemo(() => {
    return hasMakeupInAm && !hasCleanserInPm;
  }, [hasMakeupInAm, hasCleanserInPm]);

  // 4. Pregnancy check across the entire routine
  const routinePregnancyAudit = useMemo(() => {
    const unsafeProducts: { product: Product; unsafeIngredients: Ingredient[] }[] = [];
    const allProductsInRoutine = [...amList, ...pmList];
    
    allProductsInRoutine.forEach(p => {
      const actives = getProductActiveIngredients(p);
      const unsafeIngs = actives.filter(ing => !ing.pregnancy);
      if (unsafeIngs.length > 0) {
        if (!unsafeProducts.some(item => item.product.id === p.id)) {
          unsafeProducts.push({ product: p, unsafeIngredients: unsafeIngs });
        }
      }
    });
    
    return unsafeProducts;
  }, [amList, pmList]);

  // 5. Overall Routine Safety Level
  const routineSafetyLevel = useMemo(() => {
    if (amList.length === 0 && pmList.length === 0) return "safe";

    const hasHighWarning = amConflicts.some(c => c.severity === "high") || pmConflicts.some(c => c.severity === "high") || showDoubleCleansingWarning;
    if (hasHighWarning) return "danger";

    const hasMediumWarning = amConflicts.some(c => c.severity === "medium") || pmConflicts.some(c => c.severity === "medium") || makeupPillingWarnings.length > 0 || routinePregnancyAudit.length > 0;
    if (hasMediumWarning) return "warning";

    return "safe";
  }, [amList, pmList, amConflicts, pmConflicts, showDoubleCleansingWarning, makeupPillingWarnings, routinePregnancyAudit]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-950 to-slate-900 rounded-[32px] p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical size={18} className="text-violet-400" />
          <span className="text-violet-400 text-caption font-bold uppercase tracking-wider">Routine Safety Lab</span>
        </div>
        <h2 className="text-headline font-light mb-1">Kiểm tra kết hợp hoạt chất</h2>
        <p className="text-slate-300 text-caption">Tránh kích ứng da bằng cách đối chiếu thành phần & kết cấu trước khi thoa dưỡng da hoặc trang điểm lên mặt.</p>
      </div>

      {/* Mode switch */}
      <div className="flex bg-surface rounded-2xl p-1 gap-1 border border-line">
        <button
          onClick={() => setSafetyMode("pair")}
          className={`flex-1 py-2.5 rounded-xl text-caption font-bold transition-all ${
            safetyMode === "pair" ? "bg-white text-fg shadow-soft" : "text-muted hover:text-fg"
          }`}
        >
          So sánh & Kiểm tra 2 sản phẩm
        </button>
        <button
          onClick={() => setSafetyMode("full")}
          className={`flex-1 py-2.5 rounded-xl text-caption font-bold transition-all ${
            safetyMode === "full" ? "bg-white text-fg shadow-soft" : "text-muted hover:text-fg"
          }`}
        >
          Kiểm tra chéo cả Routine
        </button>
      </div>

      {safetyMode === "pair" ? (
        // Mode 1: Product comparison (Deep Ingredient comparison)
        <div className="space-y-6 animate-in">
          {/* AI Camera Onboarding CTA */}
          <div className="border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 rounded-[24px] p-6 flex flex-col sm:flex-row items-center gap-5 shadow-soft">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md">
              <Camera size={24} className="text-violet-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-body font-bold text-fg mb-1">Kiểm tra sản phẩm của bạn chưa có trong kho?</h3>
              <p className="text-caption text-muted">Sử dụng Camera AI để chụp ảnh nhãn thành phần. Hệ thống sẽ phân tích lập tức mức độ an toàn.</p>
            </div>
            <button 
              onClick={() => setShowVisionModal(true)}
              className="w-full sm:w-auto bg-violet-600 text-white px-5 py-3 rounded-xl font-bold text-caption hover:opacity-90 active:scale-95 transition-all whitespace-nowrap shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Quét ảnh ngay
            </button>
          </div>

          {/* Product search box */}
          <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft">
            <h3 className="text-body font-semibold mb-4 flex items-center gap-2 text-fg">
              <Sparkles size={16} className="text-accent-dark" />
              Chọn sản phẩm cần kiểm tra tương thích
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Product A Search */}
              <div ref={dropdownRefA} className="space-y-2 relative">
                <label className="text-caption font-bold text-muted uppercase tracking-wider block">Sản phẩm thứ nhất (A)</label>
                
                {selectedProductA ? (
                  <div className="relative p-4 border border-accent rounded-xl bg-accent-light/10 flex items-start gap-3">
                    <ProductAvatar brand={selectedProductA.brand} name={selectedProductA.name} className="w-12 h-12 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-accent-dark font-bold uppercase">{selectedProductA.brand}</p>
                      <h4 className="text-caption font-bold text-fg truncate">{selectedProductA.name}</h4>
                      <p className="text-micro text-muted">{CATEGORY_LABELS[selectedProductA.category] || selectedProductA.category} • {selectedProductA.size}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedProductA(null)}
                      className="absolute top-2 right-2 text-muted hover:text-danger transition-colors p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 text-muted" size={16} />
                    <input
                      type="text"
                      placeholder="Tìm theo tên sản phẩm hoặc thương hiệu..."
                      value={searchQueryA}
                      onChange={(e) => {
                        setSearchQueryA(e.target.value);
                        setShowDropdownA(true);
                      }}
                      onFocus={() => setShowDropdownA(true)}
                      className="w-full bg-surface border border-line rounded-xl pl-10 pr-4 py-3 text-caption text-fg outline-none focus:border-fg transition-all font-medium"
                    />
                    {showDropdownA && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-line rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto divide-y divide-line">
                        {loading ? (
                          <div className="p-4 text-center text-caption text-muted">Đang tải dữ liệu...</div>
                        ) : filteredProductsA.length === 0 ? (
                          <div className="p-4 text-center text-caption text-muted">Không tìm thấy sản phẩm phù hợp.</div>
                        ) : (
                          filteredProductsA.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setSelectedProductA(p);
                                setShowDropdownA(false);
                                setSearchQueryA("");
                              }}
                              className="w-full text-left p-3 hover:bg-surface flex items-center gap-3 transition-colors"
                            >
                              <ProductAvatar brand={p.brand} name={p.name} className="w-8 h-8 rounded shrink-0" />
                              <div className="min-w-0">
                                <div className="text-caption font-bold text-fg truncate">{p.name}</div>
                                <div className="text-[10px] text-muted">{p.brand} • {CATEGORY_LABELS[p.category] || p.category}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product B Search */}
              <div ref={dropdownRefB} className="space-y-2 relative">
                <label className="text-caption font-bold text-muted uppercase tracking-wider block">Sản phẩm thứ hai (B)</label>
                
                {selectedProductB ? (
                  <div className="relative p-4 border border-accent rounded-xl bg-accent-light/10 flex items-start gap-3">
                    <ProductAvatar brand={selectedProductB.brand} name={selectedProductB.name} className="w-12 h-12 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-accent-dark font-bold uppercase">{selectedProductB.brand}</p>
                      <h4 className="text-caption font-bold text-fg truncate">{selectedProductB.name}</h4>
                      <p className="text-micro text-muted">{CATEGORY_LABELS[selectedProductB.category] || selectedProductB.category} • {selectedProductB.size}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedProductB(null)}
                      className="absolute top-2 right-2 text-muted hover:text-danger transition-colors p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 text-muted" size={16} />
                    <input
                      type="text"
                      placeholder="Tìm theo tên sản phẩm hoặc thương hiệu..."
                      value={searchQueryB}
                      onChange={(e) => {
                        setSearchQueryB(e.target.value);
                        setShowDropdownB(true);
                      }}
                      onFocus={() => setShowDropdownB(true)}
                      className="w-full bg-surface border border-line rounded-xl pl-10 pr-4 py-3 text-caption text-fg outline-none focus:border-fg transition-all font-medium"
                    />
                    {showDropdownB && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-line rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto divide-y divide-line">
                        {loading ? (
                          <div className="p-4 text-center text-caption text-muted">Đang tải dữ liệu...</div>
                        ) : filteredProductsB.length === 0 ? (
                          <div className="p-4 text-center text-caption text-muted">Không tìm thấy sản phẩm phù hợp.</div>
                        ) : (
                          filteredProductsB.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setSelectedProductB(p);
                                setShowDropdownB(false);
                                setSearchQueryB("");
                              }}
                              className="w-full text-left p-3 hover:bg-surface flex items-center gap-3 transition-colors"
                            >
                              <ProductAvatar brand={p.brand} name={p.name} className="w-8 h-8 rounded shrink-0" />
                              <div className="min-w-0">
                                <div className="text-caption font-bold text-fg truncate">{p.name}</div>
                                <div className="text-[10px] text-muted">{p.brand} • {CATEGORY_LABELS[p.category] || p.category}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Clear Button */}
            {(selectedProductA || selectedProductB) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleResetComparison}
                  className="text-caption text-muted hover:text-fg font-semibold flex items-center gap-1 transition-colors"
                >
                  <X size={14} /> Xóa so sánh hiện tại
                </button>
              </div>
            )}
          </div>

          {/* Result rendering */}
          {!selectedProductA || !selectedProductB ? (
            // Empty state: show template recommendations
            <div className="space-y-6">
              <div className="border border-dashed border-line rounded-[24px] py-12 text-center bg-white shadow-soft">
                <div className="w-16 h-16 bg-surface border border-line rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft className="text-muted" size={24} />
                </div>
                <h3 className="text-body font-semibold text-fg mb-1">Chọn hai sản phẩm</h3>
                <p className="text-caption text-muted max-w-sm mx-auto px-6">
                  Vui lòng chọn hoặc tìm kiếm sản phẩm A và sản phẩm B ở trên để bắt đầu phân tích tương thích hoạt chất và kết cấu da.
                </p>
              </div>

              {/* Sample comparisons */}
              <div className="space-y-3">
                <h4 className="text-caption font-bold text-muted uppercase tracking-wider">Cặp so sánh mẫu phổ biến</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SAMPLE_COMPARISONS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSample(sample.prodA, sample.prodB)}
                      className="text-left p-4 border border-line rounded-2xl bg-white hover:border-accent hover:shadow-soft transition-all space-y-2 group"
                    >
                      <div className="text-caption font-bold text-fg group-hover:text-accent-dark transition-colors flex items-center justify-between">
                        <span>{sample.name}</span>
                        <ChevronRight size={14} className="text-muted group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-micro text-muted leading-relaxed">{sample.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Full Comparison Results Layout
            <div className="space-y-6">
              {/* 1. Global Compatibility Score Banner */}
              <div className="pt-2">
                {safetyLevel === "danger" ? (
                  <div className="p-6 border border-danger/25 bg-danger/[0.03] text-danger rounded-[24px] space-y-3 animate-in shadow-sm">
                    <div className="flex items-center gap-3 font-bold text-body">
                      <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <span className="block text-micro uppercase tracking-wider text-danger/80">Trạng thái kết hợp</span>
                        <span className="text-title">Xung đột nghiêm trọng (DANGER)</span>
                      </div>
                    </div>
                    <p className="text-caption text-muted leading-relaxed pl-11">
                      Tuyệt đối không nên dùng chung hai sản phẩm này trong cùng một buổi skincare. Sự kết hợp trực tiếp giữa các active cực mạnh sẽ gây tổn thương nặng lớp màng lipid, gây đỏ rát, bong tróc mảng và có khả năng bùng mụn kích ứng.
                    </p>
                  </div>
                ) : safetyLevel === "warning" ? (
                  <div className="p-6 border border-warning/25 bg-warning/[0.03] text-warning rounded-[24px] space-y-3 animate-in shadow-sm">
                    <div className="flex items-center gap-3 font-bold text-body">
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <span className="block text-micro uppercase tracking-wider text-warning/80">Trạng thái kết hợp</span>
                        <span className="text-title">Cần cẩn trọng (WARNING)</span>
                      </div>
                    </div>
                    <p className="text-caption text-muted leading-relaxed pl-11">
                      Sự kết hợp này có nguy cơ gây khô, châm chích nhẹ đối với nền da nhạy cảm hoặc da chưa làm quen với hoạt chất. Bạn vẫn có thể sử dụng nếu dãn cách thời gian thoa, phân bổ sáng/tối hoặc da đã có hàng rào bảo vệ rất khỏe.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 border border-success/25 bg-success/[0.03] text-success rounded-[24px] space-y-3 animate-in shadow-sm">
                    <div className="flex items-center gap-3 font-bold text-body">
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <span className="block text-micro uppercase tracking-wider text-success/80">Trạng thái kết hợp</span>
                        <span className="text-title">Tương thích tốt (SAFE)</span>
                      </div>
                    </div>
                    <p className="text-caption text-muted leading-relaxed pl-11">
                      Tuyệt vời! Không phát hiện xung đột thành phần hóa học nào. Hai sản phẩm tương tác an toàn trên bề mặt da, mang tính bổ trợ ẩm hoặc hồi phục tốt cho nhau.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Side by side Product specs comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product A Spec Card */}
                <div className="border border-line rounded-2xl p-5 bg-white space-y-4">
                  <div className="flex gap-4">
                    <ProductAvatar brand={selectedProductA.brand} name={selectedProductA.name} className="w-16 h-16 rounded-xl shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-accent-dark font-bold uppercase tracking-wider">{selectedProductA.brand}</span>
                      <h4 className="text-body font-bold text-fg leading-snug">{selectedProductA.name}</h4>
                      <p className="text-caption text-muted mt-0.5">{CATEGORY_LABELS[selectedProductA.category] || selectedProductA.category} • {selectedProductA.size}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-caption border-t border-line pt-3">
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-medium">Giá niêm yết</span>
                      <span className="font-semibold text-fg">{formatPrice(selectedProductA.price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-medium">Kết cấu</span>
                      <span className="font-semibold text-fg capitalize">{selectedProductA.texture}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-medium">Dung môi nền</span>
                      <span className="font-semibold text-fg">
                        {selectedProductA.isSiliconeBased ? "Gốc Silicone" : selectedProductA.isWaterBased ? "Gốc Nước" : "Gốc Dầu / Khác"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-medium">Phù hợp loại da</span>
                      <span className="font-semibold text-fg truncate block">
                        {selectedProductA.skinTypes.map(st => SKIN_LABELS[st] || st).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product B Spec Card */}
                <div className="border border-line rounded-2xl p-5 bg-white space-y-4">
                  <div className="flex gap-4">
                    <ProductAvatar brand={selectedProductB.brand} name={selectedProductB.name} className="w-16 h-16 rounded-xl shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-accent-dark font-bold uppercase tracking-wider">{selectedProductB.brand}</span>
                      <h4 className="text-body font-bold text-fg leading-snug">{selectedProductB.name}</h4>
                      <p className="text-caption text-muted mt-0.5">{CATEGORY_LABELS[selectedProductB.category] || selectedProductB.category} • {selectedProductB.size}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-caption border-t border-line pt-3">
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-medium">Giá niêm yết</span>
                      <span className="font-semibold text-fg">{formatPrice(selectedProductB.price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-medium">Kết cấu</span>
                      <span className="font-semibold text-fg capitalize">{selectedProductB.texture}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-medium">Dung môi nền</span>
                      <span className="font-semibold text-fg">
                        {selectedProductB.isSiliconeBased ? "Gốc Silicone" : selectedProductB.isWaterBased ? "Gốc Nước" : "Gốc Dầu / Khác"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-medium">Phù hợp loại da</span>
                      <span className="font-semibold text-fg truncate block">
                        {selectedProductB.skinTypes.map(st => SKIN_LABELS[st] || st).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Detailed Warnings List (Ingredients conflicts + Pilling) */}
              <div className="border border-line rounded-2xl p-5 bg-white space-y-4">
                <h4 className="text-body font-bold text-fg border-b border-line pb-2">1. Phân tích xung đột & Tương tác cụ thể</h4>
                
                <div className="space-y-4">
                  {/* Active Ingredient Conflicts */}
                  {conflicts.filter(c => c.type === "ingredient").length > 0 ? (
                    conflicts.filter(c => c.type === "ingredient").map((conflict, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-danger/[0.01] border border-danger/10 space-y-1.5">
                        <div className="flex items-center gap-2 text-caption font-bold text-danger">
                          <AlertTriangle size={14} />
                          <span>Xung đột hoạt chất: {conflict.items.join(" + ")}</span>
                        </div>
                        <p className="text-caption text-fg font-medium">{conflict.reason}</p>
                        <p className="text-[11px] text-muted leading-relaxed">
                          <strong>Khắc phục:</strong> {conflict.solution}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-2.5 text-caption text-muted bg-success/[0.01] border border-success/10 p-3.5 rounded-xl">
                      <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                      <span>Không phát hiện cặp hoạt chất hóa học nào kị nhau trực tiếp.</span>
                    </div>
                  )}

                  {/* Pilling Risk Warning */}
                  {baseComparison && (baseComparison.pillingRisk === "medium" || baseComparison.pillingRisk === "high") && (
                    <div className={`p-4 rounded-xl space-y-1.5 border ${
                      baseComparison.pillingRisk === "high" ? "bg-danger/[0.01] border-danger/10 text-danger" : "bg-warning/[0.01] border-warning/10 text-warning"
                    }`}>
                      <div className="flex items-center gap-2 text-caption font-bold">
                        <AlertCircle size={14} />
                        <span>Tương tác cấu trúc (Nguy cơ vón cục - Pilling): {baseComparison.pillingRisk.toUpperCase()}</span>
                      </div>
                      <p className="text-caption text-muted leading-relaxed">{baseComparison.message}</p>
                      <p className="text-[11px] text-muted leading-relaxed border-t border-line/10 pt-1.5 mt-1">
                        <strong>Cách xử lý:</strong> Luôn thoa sản phẩm dạng lỏng nhẹ/gốc nước trước, đợi thẩm thấu hoàn toàn (10-15 phút) cho lớp màng khô ráo rồi mới thoa sản phẩm dạng đặc/gốc silicone lên trên. Khi thoa, sử dụng động tác vỗ nhẹ, tránh xoa miết mạnh tay.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Active Ingredients Breakdown side-by-side table */}
              <div className="border border-line rounded-2xl p-5 bg-white space-y-4">
                <h4 className="text-body font-bold text-fg border-b border-line pb-2">2. So sánh sâu hoạt chất nổi bật (Active Ingredients)</h4>
                
                {activeIngredientsComparison && (
                  <div className="space-y-4">
                    {/* Shared Active Ingredients */}
                    {activeIngredientsComparison.sharedActives.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-warning/5 border border-warning/15 text-warning text-caption space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          <span>Cảnh báo trùng lặp hoạt chất:</span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed">
                          Cả hai sản phẩm cùng chứa: <strong className="text-fg">{activeIngredientsComparison.sharedActives.map(a => `${a.nameVi} (${a.name})`).join(", ")}</strong>. 
                          Việc kết hợp có thể làm tăng đáng kể nồng độ của hoạt chất này lên da, dễ dẫn đến hiện tượng quá tải da hoặc kích ứng nhẹ. Bạn hãy theo dõi phản ứng của nền da và dãn bớt lượng thoa.
                        </p>
                      </div>
                    )}

                    {/* Table display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Product A Actives */}
                      <div className="space-y-3">
                        <div className="text-caption font-bold text-fg border-l-2 border-accent-dark pl-2">
                          Hoạt chất của {selectedProductA.brand}
                        </div>
                        {activeIngredientsComparison.activesA.length === 0 ? (
                          <p className="text-caption text-muted italic">Không chứa hoạt chất mạnh đặc trị (chủ yếu là chất dưỡng cơ bản).</p>
                        ) : (
                          <div className="space-y-2.5">
                            {activeIngredientsComparison.activesA.map((ing) => (
                              <div key={ing.id} className="p-3 border border-line rounded-xl bg-surface/50 text-caption space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-fg">{ing.name}</span>
                                  <span className="text-[9px] font-bold text-accent-dark bg-accent-light/30 px-2 py-0.5 rounded-full uppercase">
                                    {INGREDIENT_CATEGORY_LABELS[ing.category] || ing.category}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted">{ing.nameVi}</p>
                                <div className="text-[10px] text-muted pt-1 border-t border-line/40 mt-1">
                                  <strong>Lợi ích chính:</strong> {ing.benefits.join(", ")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Product B Actives */}
                      <div className="space-y-3">
                        <div className="text-caption font-bold text-fg border-l-2 border-accent-dark pl-2">
                          Hoạt chất của {selectedProductB.brand}
                        </div>
                        {activeIngredientsComparison.activesB.length === 0 ? (
                          <p className="text-caption text-muted italic">Không chứa hoạt chất mạnh đặc trị (chủ yếu là chất dưỡng cơ bản).</p>
                        ) : (
                          <div className="space-y-2.5">
                            {activeIngredientsComparison.activesB.map((ing) => (
                              <div key={ing.id} className="p-3 border border-line rounded-xl bg-surface/50 text-caption space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-fg">{ing.name}</span>
                                  <span className="text-[9px] font-bold text-accent-dark bg-accent-light/30 px-2 py-0.5 rounded-full uppercase">
                                    {INGREDIENT_CATEGORY_LABELS[ing.category] || ing.category}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted">{ing.nameVi}</p>
                                <div className="text-[10px] text-muted pt-1 border-t border-line/40 mt-1">
                                  <strong>Lợi ích chính:</strong> {ing.benefits.join(", ")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Pregnancy Safety status card */}
              {pregnancySafety && (
                <div className="border border-line rounded-2xl p-5 bg-white space-y-3">
                  <h4 className="text-body font-bold text-fg border-b border-line pb-2 flex items-center gap-2">
                    <Baby size={16} className="text-[#C4A882]" />
                    <span>3. Mức độ an toàn trong thai kỳ (Pregnancy Safety)</span>
                  </h4>
                  
                  {pregnancySafety.isSafe ? (
                    <div className="flex items-start gap-2.5 text-caption text-success bg-success/[0.01] border border-success/15 p-3.5 rounded-xl">
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <strong>An toàn cho mẹ bầu và mẹ cho con bú:</strong> Cả hai sản phẩm đều không chứa các hoạt chất cần lưu ý hoặc có nguy cơ ảnh hưởng sức khỏe thai kỳ. Bạn hoàn toàn có thể yên tâm sử dụng.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-warning/[0.02] border border-warning/20 text-warning text-caption space-y-2">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-warning" />
                        <span>Phát hiện thành phần cần cẩn trọng / tránh trong thai kỳ:</span>
                      </div>
                      
                      <div className="space-y-1.5 text-muted pl-5 text-[11px]">
                        {pregnancySafety.unsafeA.length > 0 && (
                          <div>
                            <span className="font-semibold text-fg block">{selectedProductA.name}:</span>
                            Chứa {pregnancySafety.unsafeA.map(a => `[${a.nameVi} / ${a.name}]`).join(", ")} (Tránh dùng liều cao, hỏi ý kiến bác sĩ).
                          </div>
                        )}
                        {pregnancySafety.unsafeB.length > 0 && (
                          <div>
                            <span className="font-semibold text-fg block">{selectedProductB.name}:</span>
                            Chứa {pregnancySafety.unsafeB.map(b => `[${b.nameVi} / ${b.name}]`).join(", ")} (Tránh dùng liều cao, hỏi ý kiến bác sĩ).
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Layering order & timing timeline */}
              {layeringRecommendation && (
                <div className="border border-line rounded-2xl p-5 bg-white space-y-4">
                  <h4 className="text-body font-bold text-fg border-b border-line pb-2 flex items-center gap-2">
                    <Clock size={16} className="text-accent-dark" />
                    <span>4. Hướng dẫn bôi & Thứ tự layer chuẩn khoa học</span>
                  </h4>

                  <div className="space-y-4">
                    {/* Layering Timeline UI */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">Thứ tự apply khuyên dùng:</span>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                        {/* Step 1 */}
                        <div className="flex-1 p-3.5 border border-accent rounded-xl bg-accent-light/10 text-caption relative">
                          <span className="absolute top-2 left-3 text-[9px] bg-accent-dark text-bg px-2 py-0.5 rounded-full font-bold">LỚP 1</span>
                          <div className="pt-3 min-w-0">
                            <span className="text-[9px] text-accent-dark font-bold uppercase tracking-wider block">{layeringRecommendation.first.brand}</span>
                            <span className="font-bold text-fg block truncate">{layeringRecommendation.first.name}</span>
                            <span className="text-micro text-muted">Phân loại: {CATEGORY_LABELS[layeringRecommendation.first.category] || layeringRecommendation.first.category}</span>
                          </div>
                        </div>

                        {/* Arrow separator */}
                        <div className="flex items-center justify-center text-muted font-bold py-1">
                          <span className="hidden sm:inline">&rarr;</span>
                          <span className="sm:hidden text-center">&darr;</span>
                        </div>

                        {/* Step 2 */}
                        <div className="flex-1 p-3.5 border border-line rounded-xl bg-white text-caption relative">
                          <span className="absolute top-2 left-3 text-[9px] bg-muted text-bg px-2 py-0.5 rounded-full font-bold">LỚP 2</span>
                          <div className="pt-3 min-w-0">
                            <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">{layeringRecommendation.second.brand}</span>
                            <span className="font-bold text-fg block truncate">{layeringRecommendation.second.name}</span>
                            <span className="text-micro text-muted">Phân loại: {CATEGORY_LABELS[layeringRecommendation.second.category] || layeringRecommendation.second.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Advice Text */}
                    <div className="p-3.5 bg-surface rounded-xl border border-line/60 text-caption space-y-2 text-muted leading-relaxed">
                      <div>
                        <strong>Mẹo thoa:</strong> Sau khi thoa xong lớp thứ nhất (<span className="text-fg font-semibold">{layeringRecommendation.first.brand}</span>), hãy vỗ nhẹ bằng lòng bàn tay và đợi khoảng 3 - 5 phút cho sản phẩm ráo hoàn toàn trước khi thoa tiếp lớp thứ hai (<span className="text-fg font-semibold">{layeringRecommendation.second.brand}</span>).
                      </div>
                      
                      <div className="pt-2 border-t border-line/60">
                        <strong>Thời gian khuyên dùng:</strong> {layeringRecommendation.timingAdvice}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Mode 2: Live Routine Auditor (skincare & makeup connection)
        <div className="space-y-6 animate-in">
          {/* If both routines are empty */}
          {amList.length === 0 && pmList.length === 0 ? (
            <div className="border border-dashed border-line rounded-[24px] py-12 text-center bg-white shadow-soft px-6 space-y-4">
              <div className="w-16 h-16 bg-surface border border-line rounded-full flex items-center justify-center mx-auto">
                <FlaskConical className="text-muted" size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-body font-semibold text-fg">Routine của bạn đang trống</h3>
                <p className="text-caption text-muted max-w-sm mx-auto">
                  Vui lòng quay lại tab **Routine** trên thanh điều hướng để thêm các sản phẩm dưỡng da và trang điểm thực tế của bạn trước khi tiến hành thẩm định.
                </p>
              </div>
            </div>
          ) : (
            // Full Live Routine Audit UI
            <div className="space-y-6">
              
              {/* Overall Routine Safety Status Banner */}
              <div>
                {routineSafetyLevel === "danger" ? (
                  <div className="p-6 border border-danger/25 bg-danger/[0.03] text-danger rounded-[24px] space-y-3 shadow-sm">
                    <div className="flex items-center gap-3 font-bold text-body">
                      <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                        <ShieldCheck size={18} className="text-danger" />
                      </div>
                      <div>
                        <span className="block text-micro uppercase tracking-wider text-danger/80">Thẩm định Routine tổng thể</span>
                        <span className="text-title">Routine phát hiện xung đột nặng (DANGER)</span>
                      </div>
                    </div>
                    <p className="text-caption text-muted leading-relaxed pl-11">
                      Chu trình của bạn đang có điểm xung đột nghiêm trọng hoặc thiếu bước làm sạch bắt buộc. Bạn cần điều chỉnh ngay lập tức để tránh tổn hại hàng rào bảo vệ da.
                    </p>
                  </div>
                ) : routineSafetyLevel === "warning" ? (
                  <div className="p-6 border border-warning/25 bg-warning/[0.03] text-warning rounded-[24px] space-y-3 shadow-sm">
                    <div className="flex items-center gap-3 font-bold text-body">
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                        <AlertCircle size={18} className="text-warning" />
                      </div>
                      <div>
                        <span className="block text-micro uppercase tracking-wider text-warning/80">Thẩm định Routine tổng thể</span>
                        <span className="text-title">Cần tối ưu hóa chu trình (WARNING)</span>
                      </div>
                    </div>
                    <p className="text-caption text-muted leading-relaxed pl-11">
                      Hệ thống phát hiện một số nguy cơ kích ứng nhẹ, lệch pha kết cấu trang điểm hoặc thành phần lưu ý thai kỳ. Bạn vẫn có thể dùng nhưng hãy lưu ý hướng dẫn điều chỉnh dưới đây.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 border border-success/25 bg-success/[0.03] text-success rounded-[24px] space-y-3 shadow-sm">
                    <div className="flex items-center gap-3 font-bold text-body">
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} className="text-success" />
                      </div>
                      <div>
                        <span className="block text-micro uppercase tracking-wider text-success/80">Thẩm định Routine tổng thể</span>
                        <span className="text-title">Routine hoàn hảo & An toàn (SAFE)</span>
                      </div>
                    </div>
                    <p className="text-caption text-muted leading-relaxed pl-11">
                      Xin chúc mừng! Toàn bộ sản phẩm trong cả routine Sáng và Tối của bạn tương thích hoàn toàn. Không phát hiện xung đột hóa học hay bít tắc kết cấu.
                    </p>
                  </div>
                )}
              </div>

              {/* Live Routine Timeline Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AM Routine Column */}
                <div className="border border-line rounded-[24px] p-5 bg-white space-y-4">
                  <h4 className="text-caption font-bold text-fg border-b border-line pb-2 flex items-center gap-1.5">
                    <Clock size={15} className="text-orange-500" />
                    ☀️ Chu trình buổi SÁNG ({amList.length} sản phẩm)
                  </h4>
                  {amList.length === 0 ? (
                    <p className="text-caption text-muted italic py-4 text-center">Không có sản phẩm nào buổi sáng.</p>
                  ) : (
                    <div className="space-y-3">
                      {amList.map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 p-3 border border-line rounded-xl bg-surface/30">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-accent-dark text-bg flex items-center justify-center text-[9px] font-bold shrink-0">{idx + 1}</span>
                            <div className="min-w-0">
                              <span className="font-bold text-fg block text-caption truncate">{p.name}</span>
                              <span className="text-[10px] text-muted block">{p.brand} • {CATEGORY_LABELS[p.category] || p.category}</span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${
                            p.isSiliconeBased ? "bg-purple-150 text-purple-700 border border-purple-200" : p.isWaterBased ? "bg-blue-150 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-500"
                          }`}>
                            {p.isSiliconeBased ? "Silicone" : p.isWaterBased ? "Gốc Nước" : "Khác"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PM Routine Column */}
                <div className="border border-line rounded-[24px] p-5 bg-white space-y-4">
                  <h4 className="text-caption font-bold text-fg border-b border-line pb-2 flex items-center gap-1.5">
                    <Clock size={15} className="text-indigo-500" />
                    🌙 Chu trình buổi TỐI ({pmList.length} sản phẩm)
                  </h4>
                  {pmList.length === 0 ? (
                    <p className="text-caption text-muted italic py-4 text-center">Không có sản phẩm nào buổi tối.</p>
                  ) : (
                    <div className="space-y-3">
                      {pmList.map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 p-3 border border-line rounded-xl bg-surface/30">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-fg text-bg flex items-center justify-center text-[9px] font-bold shrink-0">{idx + 1}</span>
                            <div className="min-w-0">
                              <span className="font-bold text-fg block text-caption truncate">{p.name}</span>
                              <span className="text-[10px] text-muted block">{p.brand} • {CATEGORY_LABELS[p.category] || p.category}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted font-medium">{p.texture}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Auditing Results Sections */}
              
              {/* Section 1: Intra-session chemical active conflicts */}
              <div className="border border-line rounded-2xl p-5 bg-white space-y-4">
                <h4 className="text-body font-bold text-fg border-b border-line pb-2 flex items-center gap-1.5">
                  <Zap size={16} className="text-[#C4A882]" />
                  <span>1. Thẩm định hoạt chất chéo (Active Ingredient Audit)</span>
                </h4>
                
                <div className="space-y-4">
                  {/* AM conflicts */}
                  {amList.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-[10px] text-muted block uppercase font-bold tracking-wider">☀️ Chu trình buổi Sáng:</div>
                      {amConflicts.length === 0 ? (
                        <p className="text-caption text-success font-medium flex items-center gap-1.5 pl-2"><CheckCircle2 size={13} /> Sáng an toàn, không có xung đột hoạt chất.</p>
                      ) : (
                        amConflicts.map((c, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-danger/10 bg-danger/[0.01] text-caption space-y-1">
                            <div className="font-bold text-danger flex items-center gap-1">
                              <AlertTriangle size={13} /> {c.items.join(" + ")} (Xung đột)
                            </div>
                            <p className="text-[11px] text-muted leading-relaxed font-medium">{c.reason}</p>
                            <p className="text-[10px] text-muted"><strong>Khắc phục:</strong> {c.solution}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* PM conflicts */}
                  {pmList.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-line/50">
                      <div className="text-[10px] text-muted block uppercase font-bold tracking-wider">🌙 Chu trình buổi Tối:</div>
                      {pmConflicts.length === 0 ? (
                        <p className="text-caption text-success font-medium flex items-center gap-1.5 pl-2"><CheckCircle2 size={13} /> Tối an toàn, không có xung đột hoạt chất.</p>
                      ) : (
                        pmConflicts.map((c, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-danger/10 bg-danger/[0.01] text-caption space-y-1">
                            <div className="font-bold text-danger flex items-center gap-1">
                              <AlertTriangle size={13} /> {c.items.join(" + ")} (Xung đột)
                            </div>
                            <p className="text-[11px] text-muted leading-relaxed font-medium">{c.reason}</p>
                            <p className="text-[10px] text-muted"><strong>Khắc phục:</strong> {c.solution}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Sunscreen & Makeup compatibility */}
              {amList.length > 0 && (
                <div className="border border-line rounded-2xl p-5 bg-white space-y-3">
                  <h4 className="text-body font-bold text-fg border-b border-line pb-2 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-[#C4A882]" />
                    <span>2. Tương hợp Chống nắng & Lớp nền trang điểm (Pilling Check)</span>
                  </h4>
                  
                  {makeupPillingWarnings.length > 0 ? (
                    <div className="space-y-2.5">
                      {makeupPillingWarnings.map((warn, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-warning/15 bg-warning/[0.02] text-warning text-caption space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertCircle size={14} /> Cảnh báo mốc/vón nền:
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">{warn}</p>
                          <p className="text-[10px] text-muted pt-1 border-t border-line/20 mt-1">
                            <strong>Mẹo trang điểm:</strong> Luôn vỗ nhẹ sản phẩm, đợi lớp chống nắng ráo hoàn toàn (5-10 phút) rồi mới tán kem nền/cushion. Nên dặm nhẹ tay thay vì xoa hay miết chổi.
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 text-caption text-success bg-success/[0.01] border border-success/15 p-3.5 rounded-xl">
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <strong>Không phát hiện lệch pha kết cấu:</strong> Chu trình sáng của bạn có sự phân chia dung môi nền đồng nhất, hoặc bạn không đồng thời dưỡng da gốc nước và makeup gốc silicone chồng chéo quá nhanh. Lớp nền sẽ bám tệp tốt hơn.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Section 3: Double Cleansing warning (Skincare - Makeup integration) */}
              <div className="border border-line rounded-2xl p-5 bg-white space-y-3">
                <h4 className="text-body font-bold text-fg border-b border-line pb-2 flex items-center gap-1.5">
                  <ArrowRightLeft size={16} className="text-[#C4A882]" />
                  <span>3. Cảnh báo làm sạch kép buổi tối (Double Cleansing Alert)</span>
                </h4>
                
                {showDoubleCleansingWarning ? (
                  <div className="p-4 rounded-xl border border-danger/20 bg-danger/[0.02] text-danger text-caption space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={15} />
                      <span>Thiếu bước Tẩy trang tối do có sử dụng trang điểm ban ngày:</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Chu trình sáng của bạn có các sản phẩm trang điểm ({amList.filter(p => ["base-makeup", "blush", "eye", "brow", "lip"].includes(p.category)).map(p => p.name).join(", ")}). Tuy nhiên chu trình tối lại **chưa có bước Tẩy trang**. 
                      Sữa rửa mặt thông thường không thể rửa sạch hạt phấn bám sâu hay chất silicone khóa nền, dễ gây tích tụ mụn ẩn, to lỗ chân lông.
                    </p>
                    <p className="text-[10px] text-muted border-t border-line/20 pt-2 mt-1">
                      <strong>Gợi ý:</strong> Hãy bổ sung một sản phẩm làm sạch (loại Tẩy trang micellar hoặc dầu tẩy trang) vào bước 1 của Chu trình buổi Tối.
                    </p>
                  </div>
                ) : hasMakeupInAm ? (
                  <div className="flex items-start gap-2.5 text-caption text-success bg-success/[0.01] border border-success/15 p-3.5 rounded-xl">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>Đã có Tẩy trang hợp lệ:</strong> Bạn có trang điểm buổi sáng và đã trang bị sản phẩm làm sạch (Cleanser) ở chu trình tối để cuốn trôi lớp trang điểm. Hãy đảm bảo sản phẩm cleanser buổi tối đó là dầu tẩy trang/nước tẩy trang chuyên dụng.
                    </div>
                  </div>
                ) : (
                  <p className="text-caption text-muted italic pl-2">Không trang điểm ban ngày, không yêu cầu làm sạch kép buổi tối.</p>
                )}
              </div>

              {/* Section 4: Whole-routine pregnancy checker */}
              <div className="border border-line rounded-2xl p-5 bg-white space-y-3">
                <h4 className="text-body font-bold text-fg border-b border-line pb-2 flex items-center gap-2">
                  <Baby size={16} className="text-[#C4A882]" />
                  <span>4. Quét mức độ an toàn thai kỳ toàn chu trình (Pregnancy Audit)</span>
                </h4>
                
                {routinePregnancyAudit.length > 0 ? (
                  <div className="p-3.5 rounded-xl bg-warning/[0.02] border border-warning/20 text-warning text-caption space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-warning" />
                      <span>Phát hiện sản phẩm chứa hoạt chất cần lưu ý trong thai kỳ:</span>
                    </div>
                    
                    <div className="space-y-2 text-muted pl-4 text-[11px]">
                      {routinePregnancyAudit.map((item) => (
                        <div key={item.product.id}>
                          <span className="font-semibold text-fg block">{item.product.name} ({item.product.brand}):</span>
                          Chứa {item.unsafeIngredients.map(ing => `[${ing.nameVi} / ${ing.name}]`).join(", ")} (Tránh sử dụng khi mang bầu/cho con bú).
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-caption text-success bg-success/[0.01] border border-success/15 p-3.5 rounded-xl">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>An toàn thai kỳ 100%:</strong> Không phát hiện bất kỳ sản phẩm nào trong toàn chu trình chứa hoạt chất cần tránh cho phụ nữ mang thai. Lành tính với mẹ và bé.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showVisionModal && (
        <VisionLab
          onComplete={() => setShowVisionModal(false)}
          onClose={() => setShowVisionModal(false)}
        />
      )}
    </div>
  );
}
