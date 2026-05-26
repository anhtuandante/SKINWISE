"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { getAllProducts } from "@/lib/quiz-logic";
import { CATEGORY_LABELS } from "@/lib/constants";
import ProductCard from "@/components/routine/ProductCard";
import { useRoutineStore } from "@/store/routine-store";
import { useUserStore } from "@/store/user-store";
import { useToastStore } from "@/store/toast-store";

export default function ProductCatalog() {
  const user = useUserStore();
  const routine = useRoutineStore();
  const addToast = useToastStore((s) => s.addToast);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingAllProducts, setIsLoadingAllProducts] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogType, setCatalogType] = useState<"all" | "skincare" | "makeup">("all");
  const [catalogCategory, setCatalogCategory] = useState<string>("all");
  const [catalogSkinType, setCatalogSkinType] = useState<string>("all");
  const [catalogBudget, setCatalogBudget] = useState<string>("all");
  const [addingProduct, setAddingProduct] = useState<Product | null>(null);

  // Fetch All Products for Catalog
  useEffect(() => {
    async function loadAllProducts() {
      setIsLoadingAllProducts(true);
      try {
        const data = await getAllProducts();
        setAllProducts(data);
      } catch (err) {
        console.error("Failed to fetch all products for catalog:", err);
      } finally {
        setIsLoadingAllProducts(false);
      }
    }
    loadAllProducts();
  }, []);

  const filteredCatalogProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // 1. Search Query
      const matchSearch =
        !catalogSearch ||
        product.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        product.brand.toLowerCase().includes(catalogSearch.toLowerCase());

      // 2. Type (skincare vs makeup)
      const matchType = catalogType === "all" || product.type === catalogType;

      // 3. Category
      const matchCategory = catalogCategory === "all" || product.category === catalogCategory;

      // 4. Skin Type
      const matchSkinType =
        catalogSkinType === "all" ||
        product.skinTypes.includes(catalogSkinType) ||
        product.skinTypes.includes("all");

      // 5. Budget
      let matchBudget = true;
      if (catalogBudget !== "all") {
        if (catalogBudget === "budget") matchBudget = product.price <= 200000;
        else if (catalogBudget === "affordable") matchBudget = product.price > 200000 && product.price <= 400000;
        else if (catalogBudget === "mid-range") matchBudget = product.price > 400000 && product.price <= 1000000;
        else if (catalogBudget === "premium") matchBudget = product.price > 1000000 && product.price <= 3000000;
        else if (catalogBudget === "luxury") matchBudget = product.price > 3000000;
      }

      return matchSearch && matchType && matchCategory && matchSkinType && matchBudget;
    });
  }, [allProducts, catalogSearch, catalogType, catalogCategory, catalogSkinType, catalogBudget]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[32px] p-8 text-white relative shadow-xl border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <ShoppingBag size={180} />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag size={16} className="text-accent animate-pulse" />
          <span className="text-accent text-[10px] font-extrabold uppercase tracking-widest">Thư viện mỹ phẩm</span>
        </div>
        <h2 className="text-headline font-light mb-2">Kho Sản Phẩm SkinWise</h2>
        <p className="text-slate-300 text-caption max-w-xl leading-relaxed">
          Tra cứu và bộ lọc toàn bộ các dòng sản phẩm dưỡng da và trang điểm phù hợp cho thị trường Việt Nam. Được tích hợp tính tương thích AI tự động.
        </p>
      </div>

      {/* Filter controls */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 text-muted" size={16} />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm hoặc thương hiệu..."
              className="w-full pl-11 pr-4 py-2.5 bg-surface border border-line rounded-xl text-caption outline-none focus:border-fg transition-all"
            />
          </div>

          {/* Skincare vs Makeup Segmented Toggle */}
          <div className="bg-surface border border-line rounded-xl p-0.5 flex gap-1 text-caption font-bold shrink-0 self-start md:self-auto">
            {(["all", "skincare", "makeup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setCatalogType(t);
                  setCatalogCategory("all");
                }}
                className={`px-4 py-2 rounded-lg transition-all ${
                  catalogType === t
                    ? "bg-fg text-bg shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                {t === "all" ? "Tất cả" : t === "skincare" ? "Dưỡng da" : "Trang điểm"}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-line/60">
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Danh mục</label>
            <select
              value={catalogCategory}
              onChange={(e) => setCatalogCategory(e.target.value)}
              className="w-full bg-surface border border-line rounded-xl text-caption px-3 py-2.5 outline-none text-fg font-medium cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              {Object.entries(CATEGORY_LABELS)
                .filter(([catKey]) => {
                  if (catalogType === "skincare") {
                    return ["cleanser", "toner", "serum", "moisturizer", "sunscreen", "exfoliant", "eye-cream", "mask"].includes(catKey);
                  }
                  if (catalogType === "makeup") {
                    return ["base-makeup", "lip", "eye", "brow", "blush"].includes(catKey);
                  }
                  return true;
                })
                .map(([key, val]) => (
                  <option key={key} value={key}>
                    {val}
                  </option>
                ))}
            </select>
          </div>

          {/* Skin Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Phù hợp loại da</label>
            <select
              value={catalogSkinType}
              onChange={(e) => setCatalogSkinType(e.target.value)}
              className="w-full bg-surface border border-line rounded-xl text-caption px-3 py-2.5 outline-none text-fg font-medium cursor-pointer"
            >
              <option value="all">Tất cả loại da</option>
              <option value="oily">Da dầu</option>
              <option value="dry">Da khô</option>
              <option value="normal">Da thường</option>
              <option value="sensitive">Da nhạy cảm</option>
              <option value="combination">Da hỗn hợp</option>
            </select>
          </div>

          {/* Budget Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Ngân sách</label>
            <select
              value={catalogBudget}
              onChange={(e) => setCatalogBudget(e.target.value)}
              className="w-full bg-surface border border-line rounded-xl text-caption px-3 py-2.5 outline-none text-fg font-medium cursor-pointer"
            >
              <option value="all">Tất cả mức giá</option>
              <option value="budget">Dưới 200k</option>
              <option value="affordable">200k - 400k</option>
              <option value="mid-range">400k - 1M</option>
              <option value="premium">1M - 3M</option>
              <option value="luxury">Trên 3M</option>
            </select>
          </div>

          {/* Quick Reset */}
          <div className="flex items-end justify-end">
            <button
              onClick={() => {
                setCatalogSearch("");
                setCatalogType("all");
                setCatalogCategory("all");
                setCatalogSkinType("all");
                setCatalogBudget("all");
              }}
              className="w-full py-2.5 border border-line rounded-xl text-caption font-bold text-muted hover:text-fg hover:bg-surface transition-all text-center"
            >
              Xóa bộ lọc ✕
            </button>
          </div>
        </div>
      </div>

      {/* Product list grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-caption text-muted px-1">
          <span>Hiển thị: <strong>{filteredCatalogProducts.length}</strong> sản phẩm</span>
          {user.quizCompleted && (
            <span className="text-[11px] font-medium text-[#C4A882] flex items-center gap-1.5">
              <Sparkles size={12} /> Đã bật chấm điểm tương thích AI
            </span>
          )}
        </div>

        {isLoadingAllProducts ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-surface rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredCatalogProducts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-line rounded-[24px] bg-white text-caption text-muted">
            Không tìm thấy sản phẩm nào khớp với bộ lọc của bạn.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredCatalogProducts.map((p: Product) => {
              const isInRoutine =
                routine.morningRoutine.some((r) => r.id === p.id) ||
                routine.eveningRoutine.some((r) => r.id === p.id);

              return (
                <div key={p.id} className="relative">
                  <ProductCard
                    product={p}
                    onAdd={(prod) => setAddingProduct(prod)}
                    isInRoutine={isInRoutine}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Routine Selector Modal */}
      <AnimatePresence>
        {addingProduct && (
          <div className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg border border-line rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4"
            >
              <div>
                <h3 className="text-body font-bold text-fg">Thêm vào Routine</h3>
                <p className="text-caption text-muted mt-1">Chọn routine bạn muốn thêm <strong>{addingProduct.name}</strong> vào:</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    const success = routine.addToMorning(addingProduct);
                    if (success) addToast(`Đã thêm vào routine sáng`, "success");
                    else addToast("Routine sáng đã đầy (tối đa 5 sản phẩm)", "error");
                    setAddingProduct(null);
                  }}
                  className="w-full py-3 bg-surface hover:bg-line/25 border border-line rounded-xl text-caption font-bold text-fg transition-all text-center"
                >
                  🌅 Routine Buổi Sáng (AM)
                </button>
                <button
                  onClick={() => {
                    const success = routine.addToEvening(addingProduct);
                    if (success) addToast(`Đã thêm vào routine tối`, "success");
                    else addToast("Routine tối đã đầy (tối đa 5 sản phẩm)", "error");
                    setAddingProduct(null);
                  }}
                  className="w-full py-3 bg-surface hover:bg-line/25 border border-line rounded-xl text-caption font-bold text-fg transition-all text-center"
                >
                  🌙 Routine Buổi Tối (PM)
                </button>
              </div>
              <button
                onClick={() => setAddingProduct(null)}
                className="w-full py-2.5 text-caption text-muted hover:text-fg font-medium transition-all text-center"
              >
                Hủy bỏ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
