"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  ShoppingBag,
  FlaskConical,
  Search,
  AlertTriangle,
  ShieldAlert,
  ShieldOff,
  X,
} from "lucide-react";
import { Product } from "@/types";
import { getProductsByCategory } from "@/lib/quiz-logic";
import { CATEGORY_LABELS, BUDGET_LABELS } from "@/lib/constants";
import { useRoutineStore } from "@/store/routine-store";
import { useSkinStore } from "@/store/useSkinStore";
import { useUserStore } from "@/store/user-store";
import { cn } from "@/lib/utils";

import RoutineBuilder from "@/components/routine/RoutineBuilder";
import SkinWallet from "@/components/routine/SkinWallet";
import ProductCard from "@/components/routine/ProductCard";
import ProductCatalog from "@/components/dashboard/ProductCatalog";
import SafetyLabPanel from "@/components/dashboard/SafetyLabPanel";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

interface ProductsTabProps {
  recommended: Product[];
  isLoadingProducts: boolean;
  onAddProduct: (product: Product) => void;
}

type Segment = "routine" | "explore" | "safety";

const SEGMENTS: { id: Segment; label: string; icon: React.ElementType }[] = [
  { id: "routine", label: "Routine", icon: ClipboardList },
  { id: "explore", label: "Khám phá", icon: ShoppingBag },
  { id: "safety", label: "Safety Lab", icon: FlaskConical },
];

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────

export default function ProductsTab({
  recommended,
  isLoadingProducts,
  onAddProduct,
}: ProductsTabProps) {
  const [activeSegment, setActiveSegment] = useState<Segment>("routine");

  return (
    <div className="space-y-6">
      {/* ── Segmented Control ── */}
      <SegmentedControl active={activeSegment} onChange={setActiveSegment} />

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeSegment === "routine" && (
          <TabPanel key="routine">
            <RoutineSegment />
          </TabPanel>
        )}
        {activeSegment === "explore" && (
          <TabPanel key="explore">
            <ExploreSegment
              recommended={recommended}
              isLoadingProducts={isLoadingProducts}
              onAddProduct={onAddProduct}
            />
          </TabPanel>
        )}
        {activeSegment === "safety" && (
          <TabPanel key="safety">
            <SafetySegment />
          </TabPanel>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────
// Segmented Control
// ────────────────────────────────────────────────

function SegmentedControl({
  active,
  onChange,
}: {
  active: Segment;
  onChange: (s: Segment) => void;
}) {
  return (
    <div className="flex items-center bg-surface border border-line rounded-full p-1 gap-1">
      {SEGMENTS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full text-[12px] font-semibold transition-colors duration-200 select-none",
              isActive ? "text-bg" : "text-muted hover:text-fg"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="segment-pill"
                className="absolute inset-0 bg-fg rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={14} />
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────
// Tab Panel Wrapper (animation)
// ────────────────────────────────────────────────

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ────────────────────────────────────────────────
// Routine Segment
// ────────────────────────────────────────────────

function RoutineSegment() {
  const recoveryMode = useSkinStore((s) => s.recoveryMode);
  const setRecoveryMode = useSkinStore((s) => s.setRecoveryMode);

  return (
    <div className="space-y-6">
      {/* Recovery Mode Banner */}
      <RecoveryBanner
        isActive={recoveryMode}
        onToggle={() => setRecoveryMode(!recoveryMode)}
      />

      {/* Routine Builder */}
      <RoutineBuilder />

      {/* Skin Wallet */}
      <SkinWallet />
    </div>
  );
}

// ────────────────────────────────────────────────
// Recovery Mode Banner
// ────────────────────────────────────────────────

function RecoveryBanner({
  isActive,
  onToggle,
}: {
  isActive: boolean;
  onToggle: () => void;
}) {
  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative border border-red-200 bg-red-50 rounded-2xl p-4 overflow-hidden"
      >
        {/* Subtle pulse ring */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-red-100 opacity-40 animate-pulse" />

        <div className="relative flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert size={18} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-red-800">
              Recovery Mode đang hoạt động
            </p>
            <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">
              Routine đã được đơn giản hóa để phục hồi hàng rào bảo vệ da.
              Chỉ giữ lại bước làm sạch nhẹ, dưỡng ẩm và chống nắng.
            </p>
          </div>
          <button
            onClick={onToggle}
            className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ShieldOff size={13} />
            Tắt
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="border border-amber-200 bg-amber-50/60 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-amber-800">
            Da đang kích ứng?
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
            Kích hoạt Recovery Mode để tạm lược bỏ các bước treatment mạnh, chỉ
            giữ lại routine tối giản nhất.
          </p>
        </div>
        <button
          onClick={onToggle}
          className="shrink-0 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Kích hoạt Recovery Mode
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Explore Segment (Khám phá)
// ────────────────────────────────────────────────

function ExploreSegment({
  recommended,
  isLoadingProducts,
  onAddProduct,
}: {
  recommended: Product[];
  isLoadingProducts: boolean;
  onAddProduct: (product: Product) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "skincare" | "makeup">(
    "all"
  );

  const routine = useRoutineStore();
  const user = useUserStore();

  // Check if a product is already in routine
  const routineIds = useMemo(() => {
    const ids = new Set<string>();
    routine.morningRoutine.forEach((p) => ids.add(p.id));
    routine.eveningRoutine.forEach((p) => ids.add(p.id));
    return ids;
  }, [routine.morningRoutine, routine.eveningRoutine]);

  // Filter products by search + type
  const filteredProducts = useMemo(() => {
    return recommended.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === "all" || product.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [recommended, searchQuery, typeFilter]);

  // Group filtered products by category
  const groupedProducts = useMemo(() => {
    return getProductsByCategory(filteredProducts);
  }, [filteredProducts]);

  const budgetLabel = user.budget ? BUDGET_LABELS[user.budget] : "";

  const TYPE_FILTERS: { id: "all" | "skincare" | "makeup"; label: string }[] = [
    { id: "all", label: "Tất cả" },
    { id: "skincare", label: "Skincare" },
    { id: "makeup", label: "Makeup" },
  ];

  if (isLoadingProducts) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-surface rounded-2xl animate-pulse border border-line"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Budget badge */}
      {budgetLabel && (
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="px-2.5 py-1 bg-surface border border-line rounded-full font-medium">
            Ngân sách: {budgetLabel}
          </span>
        </div>
      )}

      {/* Search + Type filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm sản phẩm, thương hiệu..."
            className="w-full pl-9 pr-9 py-2.5 bg-surface border border-line rounded-xl text-[13px] text-fg placeholder:text-muted/60 outline-none focus:border-fg/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTypeFilter(filter.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
                typeFilter === filter.id
                  ? "bg-fg text-bg border-fg"
                  : "bg-surface text-muted border-line hover:border-fg/30"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped product list */}
      {Object.keys(groupedProducts).length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[13px] text-muted">
            Không tìm thấy sản phẩm phù hợp.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([category, products]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[14px] font-bold text-fg">
                  {CATEGORY_LABELS[category] || category}
                </h3>
                <span className="text-[11px] text-muted bg-surface border border-line px-2 py-0.5 rounded-full">
                  {products.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={onAddProduct}
                    isInRoutine={routineIds.has(product.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Safety Segment
// ────────────────────────────────────────────────

function SafetySegment() {
  return (
    <div className="space-y-8">
      <ProductCatalog />
      <SafetyLabPanel />
    </div>
  );
}
