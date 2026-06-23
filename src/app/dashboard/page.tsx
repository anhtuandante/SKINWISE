"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home,
  ShoppingBag,
  User,
  Info
} from "lucide-react";

import { useUserStore } from "@/store/user-store";
import { useAddToRoutine } from "@/hooks/useAddToRoutine";
import { useAuth } from "@/components/providers/AuthProvider";

import SimpleDashboard from "@/components/dashboard/SimpleDashboard";
import ProductsTab from "@/components/dashboard/ProductsTab";
import ProfileTab from "@/components/dashboard/ProfileTab";
import VisionLab from "@/components/quiz/VisionLab";
import SkinCheckinFlow from "@/components/dashboard/SkinCheckinFlow";

import { filterProducts } from "@/lib/quiz-logic";
import { Product } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("today");

  const user = useUserStore();
  const { handleAddToRoutine } = useAddToRoutine();
  const { user: authUser } = useAuth();

  const userName = useMemo(() => {
    if (!authUser || !authUser.email) return "bạn 🌸";
    const prefix = authUser.email.split("@")[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }, [authUser]);

  // Recommended Products
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

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

  // Redirect to quiz if user hasn't completed it and is not a guest
  useEffect(() => {
    if (user.isHydrated && !user.quizCompleted && !user.isGuest) {
      router.replace("/quiz");
    }
  }, [user.isHydrated, user.quizCompleted, user.isGuest, router]);

  // Product add handler
  const handleAddProduct = (product: Product) => {
    handleAddToRoutine(product);
  };

  // Vision Lab modal
  const [showVisionModal, setShowVisionModal] = useState(false);
  useEffect(() => {
    const handler = () => setShowVisionModal(true);
    window.addEventListener("open-vision-lab", handler);
    return () => window.removeEventListener("open-vision-lab", handler);
  }, []);

  // Check-in Flow modal
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinStartStep, setCheckinStartStep] = useState(0);
  const [checkinInitialMood, setCheckinInitialMood] = useState<"great" | "okay" | "irritated" | null>(null);
  const [checkinTargetDateStr, setCheckinTargetDateStr] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCheckinStartStep(customEvent.detail?.startStep ?? 0);
      setCheckinInitialMood(customEvent.detail?.initialMood ?? null);
      setCheckinTargetDateStr(customEvent.detail?.targetDateStr);
      setShowCheckinModal(true);
    };
    window.addEventListener("open-checkin-flow", handler as EventListener);
    return () => window.removeEventListener("open-checkin-flow", handler as EventListener);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-fg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SkinWise Logo" className="w-8 h-8 rounded-xl object-contain bg-white border border-line" />
            <span className="text-title font-light tracking-tight">Skin<span className="font-semibold text-accent-dark">Wise</span></span>
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
        {/* Guest Banner */}
        {user.isGuest && (
          <div className="mb-6 p-4 bg-amber-500/[0.03] border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Info size={16} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-fg leading-snug">Chế độ trải nghiệm khách</p>
                <p className="text-[11px] text-muted leading-relaxed">
                  Lưu ý: Dữ liệu của bạn đang được lưu tạm thời. Hãy đăng ký tài khoản để đồng bộ hóa và bảo mật vĩnh viễn trên Cloud.
                </p>
              </div>
            </div>
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto shrink-0 bg-fg text-bg px-4 py-2 rounded-xl text-[11px] font-bold hover:opacity-90 active:scale-[0.98] transition-all text-center"
            >
              Đăng ký tài khoản
            </Link>
          </div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* TAB 1: HÔM NAY */}
          {activeTab === "today" && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <SimpleDashboard
                userName={userName}
                onNavigate={setActiveTab}
              />
            </motion.div>
          )}

          {/* TAB 2: SẢN PHẨM */}
          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ProductsTab
                recommended={recommended}
                isLoadingProducts={isLoadingProducts}
                onAddProduct={handleAddProduct}
              />
            </motion.div>
          )}

          {/* TAB 3: TÔI */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileTab
                recommended={recommended}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Simplified 3-Tab Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur-md border-t border-line py-3 px-6 shadow-[0_-8px_24px_rgba(0,0,0,0.03)]">
        <div className="max-w-lg mx-auto flex items-center justify-around gap-2">
          {[
            { id: "today", label: "Hôm nay", icon: Home },
            { id: "products", label: "Sản phẩm", icon: ShoppingBag },
            { id: "profile", label: "Tôi", icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-all ${
                  active ? "text-[#C4A882] scale-105" : "text-muted hover:text-fg"
                }`}
              >
                <Icon size={20} className={active ? "stroke-[2.5px]" : "stroke-[2px]"} />
                <span className="text-[11px] font-bold tracking-tight mt-1 select-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Vision Lab Modal */}
      <AnimatePresence>
        {showVisionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowVisionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <VisionLab
                onClose={() => setShowVisionModal(false)}
                onComplete={() => {
                  setShowVisionModal(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in Flow Modal */}
      <AnimatePresence>
        {showCheckinModal && (
          <SkinCheckinFlow
            onComplete={() => setShowCheckinModal(false)}
            onClose={() => setShowCheckinModal(false)}
            initialMood={checkinInitialMood}
            startStep={checkinStartStep}
            targetDateStr={checkinTargetDateStr}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
