"use client";

import { useSkinStore } from "@/store/useSkinStore";
import { useUserStore } from "@/store/user-store";
import { useRoutineStore } from "@/store/routine-store";
import { calculateSkinScore } from "@/utils/trendAnalysis";
import { SkinPredictorNetwork } from "@/utils/skinPredictor";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Sparkles, Camera, Settings, Check, ChevronDown, ChevronUp, Droplets, Sun, Moon, ShieldAlert, Info, Calendar, Sparkle, Brain, Download, Upload, Trash2, Salad, Clock, BookOpen, ArrowRight, Ban, X, Heart, ShoppingBag, ExternalLink } from "lucide-react";
import { getCyclePhase } from "@/utils/cyclePredictor";
import { useToastStore } from "@/store/toast-store";
import { trackEvent } from "@/lib/tracking";
import { CATEGORY_LABELS } from "@/lib/constants";
import { calculateSkinWalletAllocation, calculateSmartSpendScore } from "@/lib/recommendation-engine";
import { Product } from "@/types";
import TrendVisualizer from "./TrendVisualizer";
import VisionLab from "@/components/quiz/VisionLab";
import SkinCheckinFlow from "./SkinCheckinFlow";
import { cn } from "@/lib/utils";
import skinDietData from "@/data/skin-diet.json";


const METRIC_LABELS: Record<string, string> = {
  acne: "Mụn",
  redness: "Mẩn đỏ",
  pores: "Lỗ chân lông",
  oiliness: "Dầu thừa",
  dryness: "Khô căng",
  barrierComfort: "Dễ chịu",
  texture: "Kết cấu"
};

interface CityWeather {
  name: string;
  uv: number;
  status: string;
  desc: string;
  advice: string;
  icon: string;
}

interface SkinDashboardProps {
  onNavigate: (tab: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  citiesWeather: Record<string, CityWeather>;
  recommendedProducts?: Product[];
}

export default function SkinDashboard({
  onNavigate,
  selectedCity,
  setSelectedCity,
  citiesWeather,
  recommendedProducts = []
}: SkinDashboardProps) {
  const user = useUserStore();
  const routine = useRoutineStore();
  const { diaryLogs, pinnedMetrics, setPinnedMetrics, toggleRoutineCompleted } = useSkinStore();

  const [showVisionModal, setShowVisionModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [tempPinnedMetrics, setTempPinnedMetrics] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const addToast = useToastStore((s) => s.addToast);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [tempCycleDate, setTempCycleDate] = useState(user.cycleStartDate || "");
  const [tempCycleLength, setTempCycleLength] = useState(user.cycleLength || 28);
  const [settingsTab, setSettingsTab] = useState<"metrics" | "backup">("metrics");
  const [showDietModal, setShowDietModal] = useState(false);
  const [dietTab, setDietTab] = useState<"menu" | "nutrients" | "avoid" | "recipe" | "lifestyle">("menu");
  const [activeDay, setActiveDay] = useState<string>("day1");
  const [searchFoodQuery, setSearchFoodQuery] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [recipeChecklist, setRecipeChecklist] = useState<Record<string, boolean>>({});
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);

  const [mounted, setMounted] = useState(false);
  const isSkinStoreHydrated = useSkinStore((s) => s.isHydrated);
  const isUserStoreHydrated = useUserStore((s) => s.isHydrated);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Format today's date (DD/MM/YYYY)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }, []);

  // Today's log
  const todayLog = useMemo(() => {
    return diaryLogs.find((log) => log.date === todayStr);
  }, [diaryLogs, todayStr]);

  // Format yesterday's date (DD/MM/YYYY)
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }, []);

  // Yesterday's log
  const yesterdayLog = useMemo(() => {
    return diaryLogs.find((log) => log.date === yesterdayStr);
  }, [diaryLogs, yesterdayStr]);

  // Latest log (fallback)
  const latestLog = useMemo(() => {
    if (diaryLogs.length === 0) return null;
    return diaryLogs[diaryLogs.length - 1];
  }, [diaryLogs]);

  // Active metrics to calculate score
  const todayMetrics = useMemo(() => {
    return todayLog?.metrics || latestLog?.metrics || {
      acne: user.concerns.includes("acne") ? 3 : 1,
      redness: user.skinType === "sensitive" || (user.barrierStatus === "redness" || user.barrierStatus === "stinging" || user.barrierStatus === "flaking") ? 4 : 1,
      oiliness: user.skinType === "oily" ? 4 : 2,
      dryness: user.skinType === "dry" ? 4 : 2,
      barrierComfort: (user.barrierStatus === "stinging" || user.barrierStatus === "flaking" || user.barrierStatus === "redness") ? 4 : 8,
      pores: 2,
      texture: 2
    };
  }, [todayLog, latestLog, user.concerns, user.skinType, user.barrierStatus]);

  // Today's score
  const todayScore = useMemo(() => {
    return calculateSkinScore(todayMetrics);
  }, [todayMetrics]);

  // Initialize Predictor model
  const predictor = useMemo(() => new SkinPredictorNetwork(), []);



  // Compute tomorrow's forecast if today is logged
  const forecast = useMemo(() => {
    if (!todayLog) return null;
    return predictor.getForecast(yesterdayLog || null, todayLog, user, diaryLogs);
  }, [todayLog, yesterdayLog, predictor, user, diaryLogs]);

  // Dynamic Skin Plan Type
  const activeSkinPlanType = useMemo(() => {
    const acne = todayMetrics.acne ?? 1;
    const redness = todayMetrics.redness ?? 1;
    const comfort = todayMetrics.barrierComfort ?? 5;
    
    if (acne >= 3 || user.concerns.includes("acne")) return "acne-prone";
    if (redness >= 3 || comfort <= 3 || user.skinType === "sensitive") return "sensitive";
    if (user.skinType === "oily") return "oily";
    if (user.skinType === "dry") return "dry";
    if (user.skinType === "combination") return "combination";
    return "acne-prone";
  }, [todayMetrics, user.skinType, user.concerns]);

  // Helper to get food emoji
  const getFoodEmoji = (id: string): string => {
    const emojiMap: Record<string, string> = {
      salmon: "🐟",
      avocado: "🥑",
      "green-tea": "🍵",
      tomato: "🍅",
      blueberries: "🫐",
      "sweet-potato": "🍠",
      spinach: "🥬",
      almonds: "🥜",
      yogurt: "🥛",
      orange: "🍊",
      pomegranate: "🍎",
      walnuts: "🫚",
      cucumber: "🥒",
      tofu: "⬜",
      turmeric: "🫚",
      water: "💧",
      kombucha: "🍹",
      broccoli: "🥦",
      strawberries: "🍓",
      "chia-seeds": "🥣",
      oatmeal: "🥣",
      "milk-tea": "🧋",
      "fried-chicken": "🍗",
      "sugar-candy": "🍬",
      "instant-noodles": "🍜",
      "alcohol-beer": "🍺",
      "cow-milk": "🥛",
      "white-bread": "🍞",
      "canned-meat": "🥫",
      "soft-drink": "🥤",
      "chili-spicy": "🌶️",
      "pizza-fastfood": "🍕",
      chips: "🍟"
    };
    return emojiMap[id] || "🍽️";
  };

  // Helper to get day name for partial log creation
  const getDayNameLocal = (dateStr: string) => {
    const parts = dateStr.split("/");
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return dayNames[d.getDay()];
  };

  // Handle logging a food item
  const handleLogFood = (foodId: string) => {
    const log = diaryLogs.find(l => l.date === todayStr);
    if (!log) {
      useSkinStore.getState().addPartialLog("okay", todayStr, getDayNameLocal(todayStr));
    }
    const currentDiet = log ? (log.diet || []) : [];
    const newDiet = currentDiet.includes(foodId)
      ? currentDiet.filter(id => id !== foodId)
      : [...currentDiet, foodId];
    
    useSkinStore.getState().upgradeLog(todayStr, { diet: newDiet });
    addToast(
      currentDiet.includes(foodId) ? "Đã xóa món ăn khỏi nhật ký" : "Đã ghi nhận món ăn thành công!",
      "success"
    );
  };

  // Diet recommendation based on today's metrics
  const dietGuide = useMemo(() => {
    const acne = todayMetrics.acne ?? 1;
    const redness = todayMetrics.redness ?? 1;
    const comfort = todayMetrics.barrierComfort ?? 5;

    let type = "normal";
    let title = "Dinh dưỡng cân bằng & Trẻ hóa làn da";
    let desc = "Duy trì chế độ ăn giàu chất chống oxy hóa, vitamin C và collagen sạch để giữ da luôn săn chắc rạng rỡ.";
    let goal = "Cung cấp đầy đủ vitamin và khoáng chất vi lượng chống lại stress oxy hóa, nuôi dưỡng da khỏe mạnh bền vững và trì hoãn quá trình lão hóa tự nhiên.";

    if (acne >= 3 || user.concerns.includes("acne")) {
      type = "acne";
      title = "Dinh dưỡng ngừa mụn & Kháng viêm";
      desc = "Hạn chế sữa bò, đường ngọt tinh luyện và tinh bột trắng. Tăng chất béo tốt (omega-3) và kẽm.";
      goal = "Giảm thiểu phản ứng sưng viêm, ức chế vi khuẩn gây mụn, kiểm soát hoạt động tiết bã nhờn của nang lông và hỗ trợ làm lành nhanh các mô tổn thương.";
    } else if (redness >= 3 || comfort <= 3 || user.skinType === "sensitive") {
      type = "irritated";
      title = "Dinh dưỡng làm mát & Làm dịu kích ứng";
      desc = "Hạn chế rượu bia, caffeine và đồ cay nóng. Ưu tiên làm dịu hệ thần kinh và cấp nước từ bên trong.";
      goal = "Làm mát và dịu hệ thống mao mạch dưới da, giảm sưng đỏ, tái tạo hàng rào biểu bì bị suy yếu và nâng cao khả năng tự vệ tự nhiên.";
    } else if (user.skinType === "dry") {
      type = "dry";
      title = "Dinh dưỡng cấp ẩm & Tái sinh màng lipid";
      desc = "Tăng cường axit béo thiết yếu, nước và các thực phẩm giàu Vitamin E để củng cố hàng rào dưỡng ẩm da.";
      goal = "Bổ sung lượng nước và chất béo lành mạnh tối ưu, sửa chữa màng bảo vệ khô ráp, ngăn chặn tình trạng mất nước xuyên biểu bì (TEWL) và phục hồi vẻ căng bóng.";
    } else if (user.skinType === "oily" || user.skinType === "combination") {
      type = "oily";
      title = "Dinh dưỡng kiểm soát dầu & Se khít lỗ chân lông";
      desc = "Hạn chế chất béo chuyển hóa, đường sữa béo. Ưu tiên thực phẩm giàu kẽm, trà xanh và vitamin B2, B6.";
      goal = "Điều tiết lượng dầu thừa tuyến bã nhờn, chống oxy hóa lớp lipid bề mặt để tránh bít tắc nhân mụn và thúc đẩy phục hồi kết cấu da màng mịn.";
    }

    // Filter superfoods for this guide
    const matchingSuperfoods = skinDietData.superfoods.filter(food => {
      if (type === "acne") return food.concerns.includes("acne");
      if (type === "irritated") return food.skinTypes.includes("sensitive");
      if (type === "dry") return food.skinTypes.includes("dry") || food.concerns.includes("dryness");
      if (type === "oily") return food.skinTypes.includes("oily") || food.concerns.includes("combination") || food.concerns.includes("acne");
      return true;
    }).slice(0, 4);

    const foods = matchingSuperfoods.map(f => ({
      name: f.name,
      desc: f.category,
      emoji: getFoodEmoji(f.id)
    }));

    return {
      type,
      title,
      desc,
      goal,
      foods
    };
  }, [todayMetrics, user.skinType, user.concerns]);

  // Map logged foods to database info (support legacy tags)
  const loggedFoodsInfo = useMemo(() => {
    const dietList = todayLog?.diet || [];
    return dietList.map(foodId => {
      const food = skinDietData.loggableFoods.find(f => f.id === foodId);
      if (food) return food;
      const legacyMap: Record<string, { id: string; name: string; score: number }> = {
        dairy: { id: "cow-milk", name: "Sữa & Phô mai", score: -12 },
        sugar: { id: "sugar-candy", name: "Đồ ngọt/Đường", score: -15 },
        greasy_spicy: { id: "fried-chicken", name: "Đồ cay/Dầu mỡ", score: -12 },
        greens: { id: "spinach", name: "Rau xanh", score: 12 },
        water: { id: "water", name: "Nước lọc", score: 5 },
      };
      return legacyMap[foodId] || { id: foodId, name: foodId, score: 0 };
    });
  }, [todayLog]);

  // Compute daily diet score out of 100
  const dailyDietScore = useMemo(() => {
    let score = 75; // Baseline
    if (!todayLog || !todayLog.diet || todayLog.diet.length === 0) return 75;
    
    loggedFoodsInfo.forEach(food => {
      score += food.score;
    });
    
    return Math.max(0, Math.min(100, score));
  }, [todayLog, loggedFoodsInfo]);

  // Generate real-time clinical-style AI advice
  const dynamicDietFeedback = useMemo(() => {
    if (!todayLog || !todayLog.diet || todayLog.diet.length === 0) {
      return "Chưa ghi nhận món ăn nào hôm nay. Hãy bắt đầu tìm kiếm món ăn hoặc chọn nhanh bên dưới để nhận phân tích dinh dưỡng chuyên sâu.";
    }
    
    const goods = loggedFoodsInfo.filter(f => f.score > 0);
    const bads = loggedFoodsInfo.filter(f => f.score < 0);
    
    let feedback = "";
    if (bads.length > 0 && goods.length > 0) {
      feedback = `Hôm nay bạn đã nạp món kháng viêm rất tốt: ${goods.map(g => g.name).join(", ")}. Tuy nhiên, việc ăn ${bads.map(b => b.name).join(", ")} dễ kích thích mụn bùng phát hoặc tăng tiết bã nhờn do đường tinh luyện và chất béo xấu. Hãy bù lại bằng nước lọc và rau xanh nhé!`;
    } else if (bads.length > 0) {
      feedback = `Chú ý: Thực đơn của bạn có chứa tác nhân xấu cho da: ${bads.map(b => b.name).join(", ")}. Các thực phẩm này kích hoạt insulin tăng vọt và thúc đẩy viêm tế bào da. Bạn nên hạn chế ăn vào ngày mai.`;
    } else if (goods.length > 0) {
      feedback = `Tuyệt vời! Bạn đang nuôi dưỡng da rất tốt với: ${goods.map(g => g.name).join(", ")}. Nguồn dinh dưỡng dồi dào các omega-3, kẽm và chất chống oxy hóa này sẽ làm dịu nhanh sưng viêm da và hỗ trợ bảo vệ collagen rất bền vững.`;
    }
    
    return feedback;
  }, [todayLog, loggedFoodsInfo]);



  // Score count-up micro-animation (Tắt theo feedback user)
  const [displayScore, setDisplayScore] = useState(todayScore);
  useEffect(() => {
    setDisplayScore(todayScore);
  }, [todayScore]);

  // Today's glance strip items status
  const hydrationStatus = useMemo(() => {
    if (!todayLog) return null;
    // Calculated based on texture metric (0-10 scale where high texture is bad/dry)
    const texture = todayLog.metrics.texture ?? 0;
    if (texture >= 7) return { label: "Thấp 💧", color: "text-red-500 bg-red-50" };
    if (texture >= 4) return { label: "Bình thường 💧", color: "text-blue-500 bg-blue-50" };
    return { label: "Tốt 💧", color: "text-green-500 bg-green-50" };
  }, [todayLog]);

  const hasSunscreen = useMemo(() => {
    return routine.morningRoutine.some((p) => p.category === "sunscreen");
  }, [routine.morningRoutine]);

  const irritationAlert = useMemo(() => {
    const redness = todayMetrics.redness ?? 0;
    // High alert if redness > 50 (on 0-100 scale; if 1-5 scale, we normalize to 20-100)
    const normalizedRedness = redness > 10 ? redness : redness * 20;
    return normalizedRedness > 50;
  }, [todayMetrics]);

  // --- SkinWallet Calculations ---
  const [walletInput, setWalletInput] = useState((user.totalBudget || 1500000).toString());
  const [isWalletExpanded, setIsWalletExpanded] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);

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

  const walletAllocation = useMemo(() => {
    return calculateSkinWalletAllocation(user.totalBudget || 1500000, user);
  }, [user]);

  const actualSpend = useMemo(() => {
    const allocation = { cleanser: 0, moisturizer: 0, treatment: 0, sunscreen: 0 };
    for (const p of uniqueProducts) {
      if (p.category === "cleanser") allocation.cleanser += p.price;
      else if (p.category === "sunscreen") allocation.sunscreen += p.price;
      else if (p.category === "serum" || p.category === "exfoliant" || p.category === "mask") allocation.treatment += p.price;
      else allocation.moisturizer += p.price;
    }
    return allocation;
  }, [uniqueProducts]);


  const upgradeSuggestions = useMemo(() => {
    const suggestions = [];
    if (walletBalance <= 100000 || recommendedProducts.length === 0) return [];

    for (const p of uniqueProducts) {
      // Find better alternatives in recommendedProducts of the same category
      const alternatives = recommendedProducts.filter(alt => 
        alt.category === p.category && 
        alt.id !== p.id &&
        alt.price > p.price && 
        alt.price - p.price <= walletBalance
      );

      if (alternatives.length > 0) {
        // Sort by price to find a premium alternative
        const bestAlt = alternatives.sort((a, b) => b.price - a.price)[0];
        if (bestAlt.price > p.price * 1.25) { // at least 25% more premium
          suggestions.push({
            currentProduct: p,
            upgradeProduct: bestAlt,
            costDiff: bestAlt.price - p.price
          });
        }
      }
    }
    return suggestions.slice(0, 2);
  }, [uniqueProducts, recommendedProducts, walletBalance]);

  const walletSuggestions = useMemo(() => {
    const allProducts = [...routine.morningRoutine, ...routine.eveningRoutine];
    const hasCleanser = allProducts.some(p => p.category === "cleanser");
    const hasMoisturizer = allProducts.some(p => p.category === "toner" || p.category === "moisturizer");
    const hasSunscreen = allProducts.some(p => p.category === "sunscreen");
    const hasTreatment = allProducts.some(p => p.category === "serum" || p.category === "exfoliant" || p.category === "mask");

    const suggestions = [];

    // 1. Crucial routine gap check
    if (!hasSunscreen) {
      const recommendedSunscreen = recommendedProducts.find(p => p.category === "sunscreen" && p.price <= walletBalance);
      suggestions.push({
        type: "danger",
        title: "Thiếu Kem Chống Nắng ☀️",
        desc: "Chống nắng là bước tối quan trọng bảo vệ da khỏi tia UV và ung thư da. Hãy bổ sung ngay.",
        recommendedProduct: recommendedSunscreen || recommendedProducts.find(p => p.category === "sunscreen")
      });
    }

    if (!hasCleanser) {
      const recommendedCleanser = recommendedProducts.find(p => p.category === "cleanser" && p.price <= walletBalance);
      suggestions.push({
        type: "danger",
        title: "Thiếu Sữa Rửa Mặt 🧼",
        desc: "Bụi bẩn và dầu nhờn tích tụ cả ngày cần được làm sạch để tránh bít tắc gây mụn.",
        recommendedProduct: recommendedCleanser || recommendedProducts.find(p => p.category === "cleanser")
      });
    }

    if (!hasMoisturizer) {
      const recommendedMoisturizer = recommendedProducts.find(p => (p.category === "moisturizer" || p.category === "toner") && p.price <= walletBalance);
      suggestions.push({
        type: "warning",
        title: "Thiếu Kem Dưỡng Ẩm 💧",
        desc: "Thiếu khóa ẩm làm tăng thất thoát nước xuyên biểu bì (TEWL), khiến da dễ khô sần hoặc tăng tiết dầu bù.",
        recommendedProduct: recommendedMoisturizer || recommendedProducts.find(p => p.category === "moisturizer")
      });
    }

    // 2. Skin condition check
    const acne = todayMetrics.acne ?? 1;
    const redness = todayMetrics.redness ?? 1;
    const comfort = todayMetrics.barrierComfort ?? 5;
    const dryness = todayMetrics.dryness ?? 1;

    if ((acne >= 3 || user.concerns.includes("acne")) && !hasTreatment) {
      const acneProd = recommendedProducts.find(p => 
        (p.category === "serum" || p.category === "exfoliant") && 
        p.price <= walletBalance &&
        (p.concerns.includes("acne") || p.name.toLowerCase().includes("bha") || p.name.toLowerCase().includes("mụn") || p.name.toLowerCase().includes("salicylic"))
      );
      suggestions.push({
        type: "info",
        title: "Cần Serum Đặc Trị Mụn 🧪",
        desc: "Da đang gặp tình trạng mụn sưng/mụn ẩn. Một sản phẩm chứa BHA hoặc Niacinamide sẽ giúp cải thiện cồi mụn.",
        recommendedProduct: acneProd || recommendedProducts.find(p => p.category === "serum" && p.concerns.includes("acne"))
      });
    }

    if ((redness >= 3 || comfort <= 3) && !hasTreatment) {
      const recoveryProd = recommendedProducts.find(p => 
        (p.category === "serum" || p.category === "moisturizer") && 
        p.price <= walletBalance &&
        (p.name.toLowerCase().includes("b5") || p.name.toLowerCase().includes("centella") || p.name.toLowerCase().includes("phục hồi") || p.name.toLowerCase().includes("recovery"))
      );
      suggestions.push({
        type: "info",
        title: "Tinh Chất Phục Hồi Dịu Da 🛡️",
        desc: "Hàng rào bảo vệ da đang đỏ rát/kích ứng. Bạn nên bổ sung tinh chất chứa B5, Ceramide hoặc Rau má.",
        recommendedProduct: recoveryProd || recommendedProducts.find(p => p.name.toLowerCase().includes("b5") || p.name.toLowerCase().includes("phục hồi"))
      });
    }

    if (dryness >= 3 && !hasMoisturizer) {
      const dryProd = recommendedProducts.find(p => 
        p.category === "moisturizer" && 
        p.price <= walletBalance &&
        (p.name.toLowerCase().includes("cấp ẩm") || p.name.toLowerCase().includes("dry") || p.name.toLowerCase().includes("hyaluronic"))
      );
      suggestions.push({
        type: "info",
        title: "Ưu Tiên Kem Dưỡng Cấp Ẩm Sâu 💧",
        desc: "Da đang bị khô căng, tróc vảy. Hãy sắm ngay kem dưỡng ẩm chuyên sâu để củng cố độ mềm mại.",
        recommendedProduct: dryProd || recommendedProducts.find(p => p.category === "moisturizer")
      });
    }

    return suggestions;
  }, [routine.morningRoutine, routine.eveningRoutine, todayMetrics, user.concerns, recommendedProducts, walletBalance]);

  const smartSpendResult = useMemo(() => {
    return calculateSmartSpendScore(user.totalBudget || 1500000, actualSpend, user);
  }, [actualSpend, user]);

  // Available metrics for customization
  const availableMetrics = Object.keys(METRIC_LABELS);

  const handleOpenCustomize = () => {
    setTempPinnedMetrics(pinnedMetrics);
    setShowCustomizeModal(true);
  };

  const cycleInfo = useMemo(() => {
    return getCyclePhase(user.cycleStartDate, user.cycleLength || 28);
  }, [user.cycleStartDate, user.cycleLength]);

  const handleSelectMetric = (key: string) => {
    if (tempPinnedMetrics.includes(key)) {
      setTempPinnedMetrics(tempPinnedMetrics.filter((m) => m !== key));
    } else {
      if (tempPinnedMetrics.length < 5) {
        setTempPinnedMetrics([...tempPinnedMetrics, key]);
      } else {
        addToast("Bạn chỉ có thể ghim tối đa 5 chỉ số da.", "info");
      }
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        userStore: useUserStore.getState(),
        skinStore: useSkinStore.getState(),
        routineStore: useRoutineStore.getState(),
        exportedAt: new Date().toISOString(),
        version: "1.0.0"
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skinwise_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("Đã xuất file sao lưu thành công!", "success");
    } catch (err) {
      console.error(err);
      addToast("Không thể tạo file sao lưu.", "error");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        
        if (!data.userStore || !data.skinStore || !data.routineStore) {
          addToast("File sao lưu không hợp lệ.", "error");
          return;
        }

        // Restore stores
        useUserStore.setState(data.userStore);
        useSkinStore.setState(data.skinStore);
        useRoutineStore.setState(data.routineStore);

        addToast("Khôi phục dữ liệu thành công! Đang tải lại...", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error(err);
        addToast("Không thể đọc file sao lưu. Vui lòng thử lại.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa sạch tất cả nhật ký, chu trình skincare và hồ sơ chẩn đoán da của bạn. Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?")) {
      useUserStore.getState().resetQuiz();
      useSkinStore.getState().clearJournal();
      useRoutineStore.getState().clearRoutine();
      addToast("Đã xóa toàn bộ dữ liệu trên thiết bị.", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const isLoggedToday = !!todayLog;

  if (!mounted || !isSkinStoreHydrated || !isUserStoreHydrated) {
    return (
      <div className="flex items-center justify-center p-20 bg-white border border-line rounded-[32px] shadow-soft animate-pulse">
        <span className="text-caption text-muted font-bold">Đang tải Dashboard...</span>
      </div>
    );
  }

  if (!user.quizCompleted) {
    return (
      <div className="border border-line rounded-[32px] p-10 bg-white shadow-soft text-center space-y-5 animate-in mt-10">
        <div className="w-16 h-16 bg-fg/5 rounded-full flex items-center justify-center mx-auto">
          <Sparkles size={28} className="text-accent" />
        </div>
        <h2 className="text-headline font-semibold">Chào mừng đến với SkinWise</h2>
        <p className="text-body text-muted max-w-md mx-auto leading-relaxed">
          Hãy hoàn thành bài kiểm tra ngắn gọn về làn da để SkinWise AI có thể tạo chu trình dưỡng da và theo dõi chỉ số sức khỏe da riêng biệt dành cho bạn.
        </p>
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2 bg-fg text-bg px-6 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
        >
          <Sparkles size={16} /> Bắt đầu chẩn đoán da
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero Skin Score Section */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Sparkle size={180} />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent animate-pulse" />
            <span className="text-accent text-[10px] font-extrabold uppercase tracking-widest">Chỉ số sức khỏe da</span>
          </div>
          <button
            onClick={handleOpenCustomize}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
            title="Tùy chỉnh chỉ số ghim"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-caption text-slate-400 font-bold uppercase tracking-wider">Hôm nay</h2>
            <div className="flex items-baseline gap-2">
              {/* Score animated counter */}
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-6xl font-extrabold tracking-tight text-white inline-block"
              >
                {displayScore}
              </motion.span>
              <span className="text-body text-slate-400">/100</span>
            </div>
            <p className="text-caption text-slate-300">
              Trạng thái:{" "}
              <span className="font-bold text-accent">
                {todayScore >= 75
                  ? "Khỏe mạnh & Ổn định"
                  : todayScore >= 50
                  ? "Nhạy cảm nhẹ"
                  : "Đang tổn thương / Cần phục hồi gấp"}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2 bg-white/5 border border-white/10 p-5 rounded-2xl max-w-sm">
            <p className="text-micro font-bold text-slate-400 uppercase tracking-widest">Gợi ý hôm nay</p>
            <p className="text-caption text-slate-200 leading-relaxed">
              {(user.barrierStatus === "stinging" || user.barrierStatus === "flaking" || user.barrierStatus === "redness")
                ? "Hàng rào da của bạn đang mỏng yếu. Ưu tiên cấp ẩm phục hồi và dừng các hoạt chất đặc trị mạnh."
                : todayScore >= 75
                ? "Làn da đang ở trạng thái tốt nhất. Bạn có thể duy trì treatment hoặc tập trung dưỡng sáng nhẹ."
                : "Thời tiết khắc nghiệt dễ gây mất ẩm. Hãy uống đủ nước và bôi dưỡng ẩm kết cấu mỏng nhẹ."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Today at a Glance Strip */}
      <div className="bg-white border border-line rounded-2xl p-4 shadow-soft">
        <div className="grid grid-cols-3 divide-x divide-line">
          {/* Hydration Status */}
          <div className="relative group flex justify-center w-full">
            <div
              onClick={() => onNavigate("journal")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1 cursor-pointer transition-all hover:scale-[1.01]",
                !isLoggedToday && "opacity-60 saturate-50 hover:opacity-100 hover:saturate-100"
              )}
            >
              <div className={cn("p-2 rounded-full", isLoggedToday && hydrationStatus ? hydrationStatus.color : "text-muted bg-line/25")}>
                <Droplets size={16} />
              </div>
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Độ ẩm</span>
              <span className="text-caption font-bold text-fg">
                {isLoggedToday && hydrationStatus ? hydrationStatus.label.replace(" 💧", "") : "Chưa log"}
              </span>
            </div>
            {!isLoggedToday && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md whitespace-nowrap z-30 pointer-events-none">
                Nhấp để Check-in! 📝
              </div>
            )}
          </div>

          {/* Sun Protection Status */}
          <div className="relative group flex justify-center w-full">
            <div
              onClick={() => onNavigate(isLoggedToday ? "routine" : "journal")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1 cursor-pointer transition-all hover:scale-[1.01]",
                !isLoggedToday && "opacity-60 saturate-50 hover:opacity-100 hover:saturate-100"
              )}
            >
              <div className={cn("p-2 rounded-full", isLoggedToday && hasSunscreen ? "text-amber-500 bg-amber-50" : "text-muted bg-line/25")}>
                <Sun size={16} />
              </div>
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Chống nắng</span>
              <span className="text-caption font-bold text-fg">
                {isLoggedToday ? (hasSunscreen ? "Đang bảo vệ" : "Chưa bôi") : "Chưa log"}
              </span>
            </div>
            {!isLoggedToday && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md whitespace-nowrap z-30 pointer-events-none">
                Nhấp để Check-in! 📝
              </div>
            )}
          </div>

          {/* Irritation alert */}
          <div className="relative group flex justify-center w-full">
            <div
              onClick={() => onNavigate("journal")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1 cursor-pointer transition-all hover:scale-[1.01]",
                !isLoggedToday && "opacity-60 saturate-50 hover:opacity-100 hover:saturate-100"
              )}
            >
              <div className={cn("p-2 rounded-full", isLoggedToday ? (irritationAlert ? "text-red-500 bg-red-50" : "text-green-500 bg-green-50") : "text-muted bg-line/25")}>
                <ShieldAlert size={16} />
              </div>
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Kích ứng</span>
              <span className="text-caption font-bold text-fg">
                {isLoggedToday ? (irritationAlert ? "Cảnh báo ⚠️" : "An toàn ✅") : "Chưa log"}
              </span>
            </div>
            {!isLoggedToday && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md whitespace-nowrap z-30 pointer-events-none">
                Nhấp để Check-in! 📝
              </div>
            )}
          </div>
        </div>

        {!isLoggedToday && (
          <div 
            className="text-center text-micro text-muted border-t border-line mt-3 pt-2 font-bold cursor-pointer hover:text-fg hover:scale-[1.005] transition-all" 
            onClick={() => onNavigate("journal")}
          >
            👉 Bạn chưa cập nhật nhật ký da hôm nay. Click để Check-in ngay!
          </div>
        )}
      </div>

      {/* 2c. Today's Skincare Checklist Widget */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-4 animate-in">
        <div className="flex items-center justify-between">
          <h3 className="text-body font-bold text-fg flex items-center gap-2">
            <Check size={18} className="text-accent-dark" />
            <span>Theo dõi chu trình hôm nay</span>
          </h3>
          {todayLog?.amRoutineCompleted && todayLog?.pmRoutineCompleted && (
            <span className="text-[10px] bg-success/10 text-success px-2.5 py-1 rounded-full font-bold border border-success/10 uppercase tracking-wider">
              Hoàn thành cả hai! 🎉
            </span>
          )}
        </div>
        <p className="text-caption text-muted">Đánh dấu sau khi bôi để AI theo dõi tính kiên trì và đo lường độ ẩm da chính xác.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AM Routine Card */}
          <div className={cn(
            "border rounded-2xl p-4 transition-all duration-250 flex items-start gap-3.5",
            todayLog?.amRoutineCompleted 
              ? "bg-accent-light/10 border-accent/40" 
              : "bg-surface/30 border-line hover:border-fg/20"
          )}>
            <button
              onClick={() => {
                toggleRoutineCompleted(todayStr, "AM");
                const completed = !todayLog?.amRoutineCompleted;
                addToast(completed ? "Đã xong chu trình sáng! 🌅" : "Đã hủy chu trình sáng.", "success");
                trackEvent("routine_completed_toggle", { period: "AM", completed });
              }}
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                todayLog?.amRoutineCompleted 
                  ? "bg-accent border-accent text-bg" 
                  : "border-muted hover:border-fg bg-white"
              )}
            >
              {todayLog?.amRoutineCompleted && <Check size={12} className="stroke-[3.5px] text-white" />}
            </button>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-1.5">
                <Sun size={14} className="text-amber-500 shrink-0" />
                <span className="text-caption font-bold text-fg">Chu trình Sáng (AM)</span>
              </div>
              
              {routine.morningRoutine.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-muted font-medium">
                  {routine.morningRoutine.map((p, idx) => (
                    <span key={p.id} className="flex items-center gap-1.5">
                      <span className="text-fg">{CATEGORY_LABELS[p.category] || p.category}</span>
                      {idx < routine.morningRoutine.length - 1 && <span className="text-subtle font-light">&rarr;</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => onNavigate("routine")}
                  className="text-[10px] text-accent-dark hover:underline font-bold block"
                >
                  + Thiết lập chu trình sáng
                </button>
              )}
            </div>
          </div>

          {/* PM Routine Card */}
          <div className={cn(
            "border rounded-2xl p-4 transition-all duration-250 flex items-start gap-3.5",
            todayLog?.pmRoutineCompleted 
              ? "bg-accent/[0.03] border-accent/35" 
              : "bg-surface/30 border-line hover:border-fg/20"
          )}>
            <button
              onClick={() => {
                toggleRoutineCompleted(todayStr, "PM");
                const completed = !todayLog?.pmRoutineCompleted;
                addToast(completed ? "Đã xong chu trình tối! 🌙" : "Đã hủy chu trình tối.", "success");
                trackEvent("routine_completed_toggle", { period: "PM", completed });
              }}
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                todayLog?.pmRoutineCompleted 
                  ? "bg-accent-dark border-accent-dark text-bg" 
                  : "border-muted hover:border-fg bg-white"
              )}
            >
              {todayLog?.pmRoutineCompleted && <Check size={12} className="stroke-[3.5px] text-white" />}
            </button>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-1.5">
                <Moon size={14} className="text-accent-dark shrink-0" />
                <span className="text-caption font-bold text-fg">Chu trình Tối (PM)</span>
              </div>
              
              {routine.eveningRoutine.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-muted font-medium">
                  {routine.eveningRoutine.map((p, idx) => (
                    <span key={p.id} className="flex items-center gap-1.5">
                      <span className="text-fg">{CATEGORY_LABELS[p.category] || p.category}</span>
                      {idx < routine.eveningRoutine.length - 1 && <span className="text-subtle font-light">&rarr;</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => onNavigate("routine")}
                  className="text-[10px] text-accent-dark hover:underline font-bold block"
                >
                  + Thiết lập chu trình tối
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Tomorrow's Skin Forecast */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-4">
        <h3 className="text-body font-bold text-fg flex items-center gap-2">
          <Brain size={18} className="text-accent-dark animate-pulse" />
          <span>Dự báo làn da ngày mai</span>
        </h3>
        
        {!todayLog ? (
          <div className="bg-accent/[0.01] border border-accent/15 rounded-xl p-4 text-center space-y-2">
            <p className="text-caption text-muted">
              Nhập nhật ký da hôm nay để AI phân tích thói quen và dự đoán trạng thái da ngày mai của bạn.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("journal")}
              className="text-caption text-accent-dark hover:underline font-bold"
            >
              Check-in ngay &rarr;
            </button>
          </div>
        ) : (
          forecast && (
            <div className="space-y-4 animate-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Predictor */}
                <div className="border border-line rounded-xl p-4 bg-surface/30 flex items-center justify-between">
                  <div>
                    <span className="text-micro font-bold text-muted uppercase block">Điểm da dự đoán</span>
                    <span className="text-xl font-extrabold text-fg">{forecast.score}/100</span>
                  </div>
                  {(() => {
                    const diff = forecast.score - todayScore;
                    if (diff > 0) {
                      return (
                        <span className="text-micro font-bold bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          ▲ +{diff}
                        </span>
                      );
                    }
                    if (diff < 0) {
                      return (
                        <span className="text-micro font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          ▼ {diff}
                        </span>
                      );
                    }
                    return (
                      <span className="text-micro font-bold bg-line/25 text-muted px-2 py-0.5 rounded-full">
                        — 0
                      </span>
                    );
                  })()}
                </div>

                {/* Acne Predictor */}
                <div className="border border-line rounded-xl p-4 bg-surface/30 flex flex-col justify-center">
                  <span className="text-micro font-bold text-muted uppercase block">Mụn trứng cá</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-caption font-bold">
                      {forecast.acne === 1 ? "Rất thấp ✅" : forecast.acne === 2 ? "Thấp" : forecast.acne === 3 ? "Trung bình" : forecast.acne === 4 ? "Cao ⚠️" : "Rất cao 🚨"}
                    </span>
                    <span className="text-micro text-muted font-bold">({forecast.acne}/5)</span>
                  </div>
                </div>

                {/* Redness Predictor */}
                <div className="border border-line rounded-xl p-4 bg-surface/30 flex flex-col justify-center">
                  <span className="text-micro font-bold text-muted uppercase block">Đỏ da & Kích ứng</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-caption font-bold">
                      {forecast.redness === 1 ? "An toàn ✅" : forecast.redness === 2 ? "Nhẹ" : forecast.redness === 3 ? "Kích ứng nhẹ" : forecast.redness === 4 ? "Kích ứng ⚠️" : "Bùng phát đỏ rát 🚨"}
                    </span>
                    <span className="text-micro text-muted font-bold">({forecast.redness}/5)</span>
                  </div>
                </div>
              </div>

              {/* Risk/Benefit factors explanation */}
              {forecast.riskFactors.length > 0 ? (
                <div className="p-3 bg-red-500/5 border border-red-500/10 text-red-500/90 rounded-xl text-caption flex items-start gap-2">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <span className="font-bold">Các yếu tố nguy cơ:</span> Ngày mai da bạn có thể bị ảnh hưởng tiêu cực do hôm nay {forecast.riskFactors.join(", ")}.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-500/5 border border-green-500/10 text-green-600 rounded-xl text-caption flex items-start gap-2">
                  <span className="text-base shrink-0">🎉</span>
                  <div>
                    <span className="font-bold">Làn da tối ưu:</span> Da ngày mai dự kiến sẽ cải thiện nhờ thói quen sinh hoạt lành mạnh và thực hiện routine đầy đủ!
                  </div>
                </div>
              )}

              {/* AI Recommendation dynamic box */}
              <div className="p-4 bg-accent/10 border border-accent/15 rounded-xl text-caption leading-relaxed">
                <span className="font-bold text-accent-dark block mb-1">💡 Lời khuyên ngừa kích ứng ngày mai:</span>
                {(() => {
                  if (forecast.redness >= 3) {
                    return "Hôm nay hàng rào da chịu áp lực hoặc dùng treatment nặng. Tối nay hãy ưu tiên kem dưỡng phục hồi chứa B5, Ceramide, Centella. Tạm ngưng AHA/BHA/Retinol nếu cảm thấy châm chích.";
                  }
                  if (forecast.acne >= 3) {
                    return "Mụn có dấu hiệu gia tăng. Tránh nặn mụn tay, tăng cường làm sạch với sữa rửa mặt dịu nhẹ tối nay. Sử dụng thêm tinh chất tràm trà hoặc chấm mụn salicylic acid ở nốt sưng.";
                  }
                  if (todayLog.lifestyle.includes("Quên chống nắng")) {
                    return "Hôm nay bạn quên chống nắng. Da đang bị tổn thương âm thầm bởi tia UV. Hãy đắp mặt nạ cấp ẩm làm dịu tối nay và tuyệt đối không quên thoa kem chống nắng vào sáng mai.";
                  }
                  return "Chỉ số da đang ở mức an toàn. Hãy duy trì routine dưỡng ẩm tối nay và bôi chống nắng bảo vệ vào ngày mai.";
                })()}
              </div>

              {/* Personal AI Insights from correlation */}
              {forecast.personalInsights && forecast.personalInsights.length > 0 && (
                <div className="p-4 bg-accent-light/30 border border-accent/15 rounded-xl text-caption space-y-2">
                  <span className="font-bold text-accent-dark block">🧠 AI Phân Tích Thói Quen (Cá nhân hóa):</span>
                  <ul className="list-disc pl-4 space-y-1 text-fg/80">
                    {forecast.personalInsights.map((insight, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        )}
      </div>
 
      {/* 2a. Today's Skin Diet Guide */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-body font-bold text-fg flex items-center gap-2">
            <Salad size={18} className="text-emerald-500" />
            <span>Dinh dưỡng đẹp da hôm nay</span>
          </h3>
          <button
            onClick={() => {
              setDietTab("menu");
              setShowDietModal(true);
            }}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-500/[0.04] border border-emerald-500/10 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-[0.98] select-none"
          >
            <span>Thực đơn 7 ngày & Công thức</span>
            <ArrowRight size={10} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Diet recommendations */}
          <div className="p-4 bg-emerald-500/[0.01] border border-emerald-500/10 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-micro font-bold text-emerald-600 uppercase tracking-wider block">Thực đơn khuyến nghị</span>
              <span className="text-caption font-extrabold text-fg block">{dietGuide.title}</span>
              <p className="text-[11px] text-muted leading-relaxed">{dietGuide.desc}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {dietGuide.foods.map((food, idx) => (
                <div key={idx} className="bg-white border border-line rounded-xl p-2 text-center space-y-0.5 hover:border-emerald-500/30 transition-all select-none">
                  <span className="text-lg block">{food.emoji}</span>
                  <span className="text-[10px] font-bold text-fg block truncate">{food.name}</span>
                  <span className="text-[8px] text-muted block truncate">{food.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Diet Logger */}
          <div className="p-4 bg-surface border border-line rounded-2xl space-y-3 flex flex-col justify-between relative">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-micro font-bold text-muted uppercase tracking-wider">Nhật ký ăn uống</span>
                <span className={cn(
                  "text-[10px] font-extrabold px-2 py-0.5 rounded-full",
                  dailyDietScore >= 75 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                )}>
                  Điểm da: {dailyDietScore}/100
                </span>
              </div>

              {/* Autocomplete Search input */}
              <div className="relative z-30">
                <div className="flex items-center bg-white border border-line rounded-xl px-3 py-1.5 focus-within:border-fg transition-all shadow-soft">
                  <input
                    type="text"
                    value={foodSearchQuery}
                    onChange={(e) => {
                      setFoodSearchQuery(e.target.value);
                      setShowFoodSuggestions(true);
                    }}
                    onFocus={() => setShowFoodSuggestions(true)}
                    placeholder="Tìm món ăn (vd: bơ, cá hồi, trà sữa...)"
                    className="w-full bg-transparent border-none outline-none text-caption text-fg placeholder:text-muted/60"
                  />
                  {foodSearchQuery ? (
                    <button
                      onClick={() => {
                        setFoodSearchQuery("");
                        setShowFoodSuggestions(false);
                      }}
                      className="text-muted hover:text-fg text-xs"
                    >
                      ×
                    </button>
                  ) : (
                    <span className="text-muted text-xs">🔍</span>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showFoodSuggestions && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-line rounded-xl shadow-lg z-40 max-h-48 overflow-y-auto divide-y divide-line p-1">
                    {skinDietData.loggableFoods
                      .filter(food =>
                        food.name.toLowerCase().includes(foodSearchQuery.toLowerCase())
                      )
                      .slice(0, 5)
                      .map(food => (
                        <div
                          key={food.id}
                          onClick={() => {
                            handleLogFood(food.id);
                            setFoodSearchQuery("");
                            setShowFoodSuggestions(false);
                          }}
                          className="flex items-center justify-between px-3 py-2 hover:bg-surface cursor-pointer transition-all rounded-lg select-none"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{getFoodEmoji(food.id)}</span>
                            <div className="text-left">
                              <span className="text-[11px] font-bold text-fg block">{food.name}</span>
                              <span className="text-[9px] text-muted block leading-none truncate max-w-[150px]">
                                {food.score > 0 ? `Tốt cho da (+${food.score})` : `Hạn chế (${food.score})`}
                              </span>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded",
                            food.score > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                          )}>
                            {food.score > 0 ? `+${food.score}` : food.score}
                          </span>
                        </div>
                      ))}
                    {skinDietData.loggableFoods.filter(food =>
                      food.name.toLowerCase().includes(foodSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-[10px] text-muted text-center">
                        Không tìm thấy món ăn này
                      </div>
                    )}
                  </div>
                )}
              </div>
              {showFoodSuggestions && (
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowFoodSuggestions(false)} 
                />
              )}

              {/* Logged foods display */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-0.5">
                {loggedFoodsInfo.map(food => (
                  <div
                    key={food.id}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 border rounded-lg text-[10px] font-medium transition-all select-none animate-in",
                      food.score > 0 
                        ? "bg-emerald-500/[0.02] border-emerald-500/20 text-emerald-700" 
                        : "bg-red-500/[0.02] border-red-500/20 text-red-600"
                    )}
                  >
                    <span>{getFoodEmoji(food.id)}</span>
                    <span className="font-bold">{food.name}</span>
                    <span className="text-[8px] opacity-85">({food.score > 0 ? `+${food.score}` : food.score})</span>
                    <button
                      onClick={() => handleLogFood(food.id)}
                      className="ml-1 text-[11px] font-bold hover:opacity-80 leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {loggedFoodsInfo.length === 0 && (
                  <div className="text-[10px] text-muted/60 py-2">
                    Chưa có món ăn nào được ghi chép.
                  </div>
                )}
              </div>
            </div>

            {/* Quick choices list */}
            {loggedFoodsInfo.length === 0 && (
              <div className="space-y-1">
                <span className="text-[8px] text-muted font-bold block uppercase tracking-wider">Chọn nhanh món ăn</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {skinDietData.loggableFoods.slice(0, 8).map(food => (
                    <button
                      key={food.id}
                      onClick={() => handleLogFood(food.id)}
                      className="px-2 py-1 bg-white border border-line hover:border-emerald-500/30 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all shrink-0 select-none"
                    >
                      <span>{getFoodEmoji(food.id)}</span>
                      <span>{food.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time AI Advice Bubble */}
        <div className="p-3.5 bg-accent/5 border border-accent/15 rounded-xl text-caption leading-relaxed flex items-start gap-2.5 animate-in">
          <span className="text-base shrink-0">🍽️</span>
          <div className="space-y-0.5 text-left">
            <span className="font-bold text-accent-dark block">Phân tích dinh dưỡng & Khuyên dùng:</span>
            <span className="text-muted text-[11px] leading-relaxed block">{dynamicDietFeedback}</span>
          </div>
        </div>
      </div>

      {/* 2b. Menstrual Cycle Skin Predictor */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-body font-bold text-fg flex items-center gap-2">
            <Calendar size={18} className="text-pink-500" />
            <span>Theo dõi chu kỳ & Mụn nội tiết</span>
          </h3>
          <button
            onClick={() => {
              setTempCycleDate(user.cycleStartDate || "");
              setTempCycleLength(user.cycleLength || 28);
              setShowCycleModal(true);
            }}
            className="p-1.5 hover:bg-surface border border-line rounded-lg text-muted hover:text-fg transition-all text-micro font-bold flex items-center gap-1 select-none"
          >
            <Settings size={12} /> Cài đặt
          </button>
        </div>

        {user.cycleStartDate ? (
          cycleInfo && (
            <div className="space-y-4 animate-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-pink-500/[0.02] border border-pink-500/10">
                <div className="space-y-1">
                  <span className="text-micro font-bold text-pink-600 uppercase tracking-wider block">
                    {cycleInfo.label} (Ngày {cycleInfo.day}/{user.cycleLength})
                  </span>
                  <p className="text-caption text-fg font-medium leading-relaxed">{cycleInfo.desc}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {cycleInfo.phase === "luteal" ? (
                    <span className="px-2.5 py-1 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/10 uppercase tracking-wider animate-pulse">
                      ⚠️ Nguy cơ mụn cao
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-green-500/10 text-green-600 text-[10px] font-bold border border-green-500/10 uppercase tracking-wider">
                      ✅ Da ổn định
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-surface/50 border border-line rounded-xl text-caption leading-relaxed flex gap-2">
                <span className="text-base shrink-0">💡</span>
                <div>
                  <span className="font-bold text-fg block mb-1">Lời khuyên chăm sóc da chu kỳ:</span>
                  <p className="text-muted">{cycleInfo.advice}</p>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="bg-surface/50 border border-line rounded-xl p-6 text-center space-y-3">
            <p className="text-caption text-muted max-w-sm mx-auto">
              Chưa kích hoạt theo dõi chu kỳ nội tiết. Hãy bật để AI dự đoán nguy cơ bùng phát mụn nội tiết (hormonal acne) và tối ưu hóa chu trình dưỡng da.
            </p>
            <button
              type="button"
              onClick={() => {
                setTempCycleDate(new Date().toISOString().split("T")[0]);
                setTempCycleLength(28);
                setShowCycleModal(true);
              }}
              className="px-4 py-2 bg-fg text-bg hover:opacity-90 rounded-xl text-caption font-bold transition-all shadow-sm"
            >
              + Kích hoạt theo dõi
            </button>
          </div>
        )}
      </div>

      {/* 3. Action CTAs */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowVisionModal(true)}
          className="bg-fg hover:bg-slate-900 text-bg py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-md transition-all active:scale-[0.99]"
        >
          <Camera size={18} />
          Quét sản phẩm mới (OCR)
        </button>
        <button
          onClick={() => {
            const isFullLoggedToday = todayLog && !todayLog.isPartial;
            if (isFullLoggedToday) {
              onNavigate("journal");
            } else {
              if (todayLog) {
                setCheckinStartStep(1);
                setCheckinInitialMood(todayLog.mood);
                setCheckinTargetDateStr(todayLog.date);
              } else {
                setCheckinStartStep(0);
                setCheckinInitialMood(null);
                setCheckinTargetDateStr(todayStr);
              }
              setShowCheckinModal(true);
            }
          }}
          className="bg-white hover:bg-surface border border-line text-fg py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-md transition-all active:scale-[0.99]"
        >
          <Calendar size={18} />
          {todayLog && !todayLog.isPartial ? "Xem nhật ký da" : todayLog ? "Bổ sung nhật ký" : "Check-in da (3s)"}
        </button>
      </div>

      {/* 3.5 SkinWallet Optimizer */}
      <div className="bg-white border border-line rounded-[24px] overflow-hidden shadow-soft">
        <button
          onClick={() => setIsWalletExpanded(!isWalletExpanded)}
          className="w-full p-6 flex items-center justify-between text-body font-bold text-fg hover:bg-line/5 transition-all"
        >
          <span className="flex items-center gap-2">
            <Wallet size={18} className="text-accent-dark" />
            Ví Skincare Thông Minh (SkinWallet)
          </span>
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-micro font-bold px-2 py-1 rounded-full",
              smartSpendResult.score >= 90 ? "bg-green-500/10 text-green-600" :
              smartSpendResult.score >= 70 ? "bg-amber-500/10 text-amber-600" :
              "bg-red-500/10 text-red-500"
            )}>
              Điểm chi tiêu: {smartSpendResult.score}/100
            </span>
            {isWalletExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        <AnimatePresence>
          {isWalletExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-line p-6 space-y-6"
            >
              {/* Glassmorphism Visa-style Card */}
              <div className="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-3xl overflow-hidden p-6 text-white shadow-xl border border-white/20 select-none flex flex-col justify-between bg-zinc-950">
                {/* Glowing Gradients behind */}
                <div className={cn(
                  "absolute inset-0 opacity-40 blur-2xl -z-10 bg-gradient-to-br transition-all duration-700",
                  user.skinType === "oily" ? "from-emerald-500 via-teal-600 to-zinc-950" :
                  user.skinType === "dry" ? "from-blue-500 via-cyan-600 to-zinc-950" :
                  user.skinType === "sensitive" ? "from-rose-500 via-amber-600 to-zinc-950" :
                  "from-zinc-700 via-zinc-800 to-zinc-950"
                )} />
                <div className="absolute inset-0 bg-black/10 -z-10" />

                {/* Top of Card */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-[0.2em] font-extrabold text-white/50 block">SKINWISE AI CARD</span>
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

                {/* Center of Card: Available Balance */}
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-[10px] tracking-[0.15em] font-bold text-white/50 uppercase block">Số dư khả dụng</span>
                  <div className="text-3xl font-extrabold tracking-tight tabular-nums flex items-baseline justify-center sm:justify-start gap-1">
                    {walletBalance.toLocaleString()}
                    <span className="text-lg font-bold text-white/70">đ</span>
                  </div>
                </div>

                {/* Bottom of Card */}
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <span className="text-[9px] tracking-wider text-white/40 block">CHỦ THẺ</span>
                    <span className="text-caption font-extrabold tracking-wide uppercase">{user.title || "SkinWise Member"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingBudget(!isEditingBudget)}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 rounded-xl transition-all flex items-center gap-1 text-micro font-bold"
                    >
                      <Settings size={12} />
                      Sửa ví
                    </button>
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
                    className="p-4 bg-surface border border-line rounded-2xl space-y-4 overflow-hidden"
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

                    {/* Quick Suggestions */}
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
                          className={`px-2.5 py-1 rounded-lg text-micro font-bold border transition-all ${
                            user.totalBudget === preset
                              ? "bg-fg text-bg border-fg"
                              : "bg-bg text-fg border-line hover:border-fg/40"
                          }`}
                        >
                          {preset >= 1000000 ? `${(preset / 1000000).toFixed(1).replace(".0", "")}tr` : `${preset / 1000}k`}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wallet real-time progress bar (3 states: Owned, To buy, Remaining) */}
              <div className="space-y-3 p-4 bg-line/10 rounded-2xl border border-line/40">
                <div className="flex justify-between items-center text-caption font-bold">
                  <span className="text-muted">Tiến trình chi tiêu thực tế</span>
                  <span className={cn(
                    walletBalance >= 0 ? "text-emerald-600" : "text-red-500"
                  )}>
                    {walletBalance >= 0 
                      ? `Số dư ví khả dụng: ${walletBalance.toLocaleString()}đ` 
                      : `Vượt ví: ${Math.abs(walletBalance).toLocaleString()}đ ⚠️`
                    }
                  </span>
                </div>
                
                {/* 3-State Progress Bar */}
                <div className="w-full h-3 bg-line/45 rounded-full overflow-hidden flex">
                  {(() => {
                    const total = user.totalBudget || 1500000;
                    
                    // Owned percentage
                    const ownedPct = Math.min(100, (ownedProductsCost / total) * 100);
                    // To Buy percentage
                    const toBuyPct = Math.min(100 - ownedPct, (toBuySpendTotal / total) * 100);
                    
                    const isOver = toBuySpendTotal > total;
                    if (isOver) {
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
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1 justify-center"><span className="w-2 h-2 rounded-full bg-green-500" /> Đã sở hữu</span>
                    <span className="text-fg font-extrabold mt-0.5">{ownedProductsCost.toLocaleString()}đ</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1 justify-center"><span className="w-2 h-2 rounded-full bg-amber-500" /> Cần chi thêm</span>
                    <span className="text-fg font-extrabold mt-0.5">{toBuySpendTotal.toLocaleString()}đ</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1 justify-center">Tổng ví thiết lập</span>
                    <span className="text-fg font-extrabold mt-0.5">{(user.totalBudget || 1500000).toLocaleString()}đ</span>
                  </div>
                </div>
              </div>

              {/* Real-time Shopping List */}
              <div className="space-y-3.5 border-t border-line/60 pt-5">
                <h4 className="text-caption font-extrabold text-fg flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-amber-500" />
                  <span>Danh sách cần mua ({toBuyProducts.length} sản phẩm)</span>
                </h4>

                {toBuyProducts.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {toBuyProducts.map((p) => (
                      <div 
                        key={p.id} 
                        className="p-3 bg-surface border border-line rounded-xl flex items-center justify-between gap-3 hover:border-fg/10 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox to mark as Owned / Purchased */}
                          <input 
                            type="checkbox"
                            checked={false}
                            onChange={() => {
                              routine.toggleProductOwned(p.id);
                              addToast(`Đã chuyển ${p.name} vào kho tủ đồ cá nhân`, "success");
                              trackEvent("product_marked_owned", { productId: p.id, name: p.name });
                            }}
                            className="w-4 h-4 rounded border-line text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className="text-caption font-bold text-fg block truncate">{p.name}</span>
                            <span className="text-micro text-muted font-bold block truncate">
                              {p.brand} · {CATEGORY_LABELS[p.category] || p.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-caption font-extrabold text-fg">{p.price.toLocaleString()}đ</span>
                          <a 
                            href={`${p.shopeeUrl}${p.shopeeUrl.includes('?') ? '&' : '?'}utm_source=affiliate&utm_medium=skincare_app&utm_campaign=skinwise_workspace`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-orange-500/10 border border-orange-500/20 text-[#EE4D2D] rounded-lg transition-all"
                            title="Mua ngay trên Shopee"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-green-500/[0.02] border border-green-500/10 rounded-2xl text-[11px] text-green-700 leading-normal flex items-start gap-2">
                    <span className="text-xs shrink-0">🎉</span>
                    <span>Tuyệt vời! Bạn đã sở hữu tất cả sản phẩm trong chu trình. Không cần chi tiêu mua sắm thêm tại thời điểm này!</span>
                  </div>
                )}
              </div>

              {/* Medical Category Allocation */}
              <div className="space-y-3 border-t border-line/60 pt-5">
                <h4 className="text-caption font-bold text-fg">Hạn mức gợi ý chuẩn Y khoa (Invest vs. Save)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface/50 border border-line rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="text-micro font-bold text-muted block uppercase">Serum Treatment (Invest)</span>
                      <span className="text-caption font-bold text-fg">{walletAllocation.treatment.toLocaleString()}đ</span>
                    </div>
                    <span className="text-[10px] bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full font-bold">Invest</span>
                  </div>
                  <div className="bg-surface/50 border border-line rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="text-micro font-bold text-muted block uppercase">Chống nắng (Invest)</span>
                      <span className="text-caption font-bold text-fg">{walletAllocation.sunscreen.toLocaleString()}đ</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold">Invest</span>
                  </div>
                  <div className="bg-surface/50 border border-line rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="text-micro font-bold text-muted block uppercase">Dưỡng ẩm (Save)</span>
                      <span className="text-caption font-bold text-fg">{walletAllocation.moisturizer.toLocaleString()}đ</span>
                    </div>
                    <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold">Save</span>
                  </div>
                  <div className="bg-surface/50 border border-line rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="text-micro font-bold text-muted block uppercase">Làm sạch (Save)</span>
                      <span className="text-caption font-bold text-fg">{walletAllocation.cleanser.toLocaleString()}đ</span>
                    </div>
                    <span className="text-[10px] bg-slate-500/10 text-slate-500 px-2 py-0.5 rounded-full font-bold">Save</span>
                  </div>
                </div>
              </div>

              {/* Shopping Advice & Upgrades */}
              <div className="space-y-4 border-t border-line/60 pt-5">
                <h4 className="text-caption font-extrabold text-fg flex items-center gap-1.5">
                  <Sparkles size={14} className="text-accent animate-pulse" />
                  <span>Dự báo & Đề xuất tối ưu hóa AI</span>
                </h4>

                {/* Routine Gaps (Missing items) */}
                {walletSuggestions.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-red-500 block uppercase tracking-wider">Lỗ hổng chu trình & Đề xuất bù đắp:</span>
                    {walletSuggestions.map((sug, idx) => {
                      const prod = sug.recommendedProduct;
                      return (
                        <div 
                          key={idx} 
                          className={cn(
                            "p-3 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4",
                            sug.type === "danger" ? "bg-red-500/[0.02] border-red-500/15" :
                            sug.type === "warning" ? "bg-amber-500/[0.02] border-amber-500/15" :
                            "bg-blue-500/[0.02] border-blue-500/15"
                          )}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <span className={cn(
                              "text-caption font-bold block",
                              sug.type === "danger" ? "text-red-600" :
                              sug.type === "warning" ? "text-amber-600" :
                              "text-blue-600"
                            )}>{sug.title}</span>
                            <p className="text-[11px] text-muted leading-relaxed">{sug.desc}</p>
                          </div>

                          {prod && (
                            <div className="bg-bg border border-line rounded-xl p-2 flex items-center gap-3 shrink-0 md:max-w-[280px]">
                              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0 text-base">
                                {prod.category === "cleanser" ? "🧼" :
                                 prod.category === "sunscreen" ? "☀️" :
                                 prod.category === "moisturizer" ? "💦" : "🧪"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold text-fg block truncate">{prod.name}</span>
                                <span className="text-[9px] text-muted block mt-0.5 truncate">{prod.brand} · {prod.price.toLocaleString()}đ</span>
                              </div>
                              {prod.price <= walletBalance ? (
                                <button
                                  onClick={() => {
                                    // Add to routine
                                    if (prod.timeOfDay === "AM") {
                                      routine.addToMorning(prod);
                                    } else if (prod.timeOfDay === "PM") {
                                      routine.addToEvening(prod);
                                    } else {
                                      if (prod.category === "sunscreen") {
                                        routine.addToMorning(prod);
                                      } else if (prod.category === "cleanser" || prod.category === "moisturizer") {
                                        routine.addToMorning(prod);
                                        routine.addToEvening(prod);
                                      } else {
                                        routine.addToEvening(prod);
                                      }
                                    }
                                    addToast(`Đã thêm ${prod.name} vào chu trình`, "success");
                                    trackEvent("wallet_suggestion_add", { productId: prod.id });
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

                {/* Upgrade suggestions when budget is healthy */}
                {upgradeSuggestions.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-accent-dark block uppercase tracking-wider">Cơ hội nâng cấp routine (Premium Upgrade):</span>
                    {upgradeSuggestions.map((up, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-gradient-to-r from-accent/5 to-transparent border border-accent/15 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <span className="text-caption font-bold text-accent-dark block">Nâng cấp {CATEGORY_LABELS[up.currentProduct.category] || up.currentProduct.category} ⚡</span>
                          <p className="text-[11px] text-muted leading-relaxed">
                            Ví của bạn dư <strong>{walletBalance.toLocaleString()}đ</strong>. Bạn có thể nâng cấp từ <strong>{up.currentProduct.name}</strong> lên dòng cao cấp hơn <strong>{up.upgradeProduct.name}</strong>.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="bg-white border border-line rounded-xl p-2 flex items-center gap-2 max-w-[200px]">
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-fg block truncate">{up.upgradeProduct.name}</span>
                              <span className="text-[8px] text-muted block truncate">+{up.costDiff.toLocaleString()}đ</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              // Swap in routine: remove current, add upgraded
                              routine.removeFromMorning(up.currentProduct.id);
                              routine.removeFromEvening(up.currentProduct.id);
                              
                              const upgraded = up.upgradeProduct;
                              if (upgraded.timeOfDay === "AM") {
                                routine.addToMorning(upgraded);
                              } else if (upgraded.timeOfDay === "PM") {
                                routine.addToEvening(upgraded);
                              } else {
                                if (upgraded.category === "sunscreen") {
                                  routine.addToMorning(upgraded);
                                } else if (upgraded.category === "cleanser" || upgraded.category === "moisturizer") {
                                  routine.addToMorning(upgraded);
                                  routine.addToEvening(upgraded);
                                } else {
                                  routine.addToEvening(upgraded);
                                }
                              }
                              addToast(`Đã nâng cấp lên ${upgraded.name}`, "success");
                              trackEvent("wallet_upgrade_swap", { oldId: up.currentProduct.id, newId: upgraded.id });
                            }}
                            className="text-[9px] bg-accent text-bg hover:opacity-90 px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap"
                          >
                            Nâng cấp ngay
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {walletSuggestions.length === 0 && upgradeSuggestions.length === 0 && (
                  <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl text-[11px] text-emerald-700 leading-normal flex items-start gap-2">
                    <span className="text-xs shrink-0">🎉</span>
                    <span>Tuyệt vời! Chu trình của bạn không có lỗ hổng lớn nào và đã tận dụng ngân sách rất hợp lý.</span>
                  </div>
                )}
              </div>

              {/* Bottom part: Smart Spend Score Result */}
              <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 space-y-2">
                <span className="text-micro font-bold text-accent-dark block uppercase">Đánh giá thực tế từ AI</span>
                <ul className="space-y-1.5">
                  {smartSpendResult.reasons.map((reason, idx) => (
                    <li key={idx} className="text-caption text-fg flex items-start gap-2 leading-relaxed">
                      <span className="text-base shrink-0 mt-0.5">{reason.includes("Tuyệt vời") ? "🎉" : reason.includes("⚠️") || reason.includes("lệch trục") || reason.includes("quá ít") ? "⚠️" : "💡"}</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Trend Visualizer */}
      <TrendVisualizer />

      {/* 5. See More Panel (Avoid cognitive overload) */}
      <div className="border border-line rounded-[24px] bg-white overflow-hidden shadow-soft">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-5 flex items-center justify-between text-body font-bold text-fg hover:bg-line/5 transition-all"
        >
          <span className="flex items-center gap-2">
            <Info size={16} className="text-muted" />
            Xem khuyến nghị thời tiết & UV hôm nay
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-line p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-4xl shrink-0">{citiesWeather[selectedCity].icon}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-body font-bold text-fg">Khí hậu & Chỉ số UV</h4>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="bg-surface border border-line rounded-lg text-caption px-2 py-1 outline-none text-fg font-medium"
                      >
                        {Object.entries(citiesWeather).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-caption text-muted mt-1 leading-relaxed">
                      Chỉ số UV: <span className="text-danger font-bold">{citiesWeather[selectedCity].uv}/11</span> ({citiesWeather[selectedCity].status})
                    </p>
                    <p className="text-caption text-muted leading-relaxed mt-1">{citiesWeather[selectedCity].advice}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. Vision Scanner Modal */}
      {showVisionModal && (
        <VisionLab
          onComplete={() => setShowVisionModal(false)}
          onClose={() => setShowVisionModal(false)}
        />
      )}

      {/* 6b. Check-in Flow Modal */}
      {showCheckinModal && (
        <SkinCheckinFlow
          initialMood={checkinInitialMood}
          startStep={checkinStartStep}
          targetDateStr={checkinTargetDateStr}
          onComplete={() => {
            setShowCheckinModal(false);
            setCheckinStartStep(0);
            setCheckinInitialMood(null);
            setCheckinTargetDateStr(undefined);
          }}
          onClose={() => {
            setShowCheckinModal(false);
            setCheckinStartStep(0);
            setCheckinInitialMood(null);
            setCheckinTargetDateStr(undefined);
          }}
        />
      )}

      {/* 7. Settings & Customization Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-bg border border-line rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in">
            {/* Header with Tab Switcher */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex bg-line/25 p-1 rounded-xl border border-line/10">
                <button
                  onClick={() => setSettingsTab("metrics")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-caption font-bold transition-all",
                    settingsTab === "metrics" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
                  )}
                >
                  Tùy chọn biểu đồ
                </button>
                <button
                  onClick={() => setSettingsTab("backup")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-caption font-bold transition-all",
                    settingsTab === "backup" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
                  )}
                >
                  Sao lưu dữ liệu
                </button>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="text-caption text-muted hover:text-fg font-bold animate-pulse"
              >
                Đóng
              </button>
            </div>

            {settingsTab === "metrics" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-body font-bold text-fg">Ghim chỉ số da</h3>
                  <p className="text-caption text-muted">Chọn từ 1 đến 5 chỉ số da bạn muốn hiển thị trên biểu đồ xu hướng chính.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {availableMetrics.map((key) => {
                    const isSelected = tempPinnedMetrics.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectMetric(key)}
                        className={cn(
                          "p-3 rounded-xl border text-left flex items-center justify-between font-bold text-[11px] transition-all",
                          isSelected ? "border-fg bg-surface hover:scale-[1.01]" : "border-line bg-bg hover:border-fg/40 hover:scale-[1.01]"
                        )}
                      >
                        <span className="capitalize">{METRIC_LABELS[key] || key}</span>
                        {isSelected && (
                          <span className="w-4 h-4 bg-fg text-bg rounded-full flex items-center justify-center shrink-0">
                            <Check size={10} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setPinnedMetrics(tempPinnedMetrics);
                    setShowCustomizeModal(false);
                  }}
                  disabled={tempPinnedMetrics.length < 1 || tempPinnedMetrics.length > 5}
                  className="w-full py-3 bg-fg text-bg rounded-xl font-bold disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99] transition-all text-caption"
                >
                  Lưu cài đặt biểu đồ ({tempPinnedMetrics.length}/5)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-body font-bold text-fg">Sao lưu & Phục hồi</h3>
                  <p className="text-caption text-muted">Vì toàn bộ dữ liệu của bạn nằm offline trên trình duyệt hiện tại, hãy thường xuyên sao lưu để tránh mất mát dữ liệu.</p>
                </div>

                <div className="space-y-2.5">
                  {/* Export */}
                  <button
                    onClick={handleExportBackup}
                    className="w-full p-4 border border-line bg-surface hover:bg-line/20 rounded-2xl flex items-center gap-3 transition-all text-caption font-bold text-fg hover:scale-[1.005]"
                  >
                    <Download size={16} className="text-accent-dark" />
                    <div className="text-left">
                      <span>Sao lưu dữ liệu ra file (.json)</span>
                      <span className="text-[10px] text-muted block font-normal mt-0.5">Tải xuống toàn bộ nhật ký da và chu trình skincare hiện tại.</span>
                    </div>
                  </button>

                  {/* Import */}
                  <label className="w-full p-4 border border-line bg-surface hover:bg-line/20 rounded-2xl flex items-center gap-3 transition-all text-caption font-bold text-fg hover:scale-[1.005] cursor-pointer block">
                    <div className="flex items-center gap-3">
                      <Upload size={16} className="text-accent-dark" />
                      <div className="text-left">
                        <span>Khôi phục từ file sao lưu</span>
                        <span className="text-[10px] text-muted block font-normal mt-0.5">Chọn file .json đã tải về trước đó để phục hồi dữ liệu.</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>

                  {/* Reset/Clear */}
                  <button
                    onClick={handleClearAllData}
                    className="w-full p-4 border border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/5 rounded-2xl flex items-center gap-3 transition-all text-caption font-bold text-red-500 hover:scale-[1.005]"
                  >
                    <Trash2 size={16} />
                    <div className="text-left">
                      <span>Xóa toàn bộ dữ liệu</span>
                      <span className="text-[10px] text-red-500/60 block font-normal mt-0.5">Xóa vĩnh viễn tất cả chẩn đoán, nhật ký, chu trình và bắt đầu lại từ đầu.</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. Specialized Skin Diet Modal (Double-Bezel Redesign) */}
      {showDietModal && (
        <div className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-bg border border-line rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 animate-in my-8 relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Salad size={20} />
                  </span>
                  <h3 className="text-body font-bold text-fg">Chuyên Gia Dinh Dưỡng Da SkinWise</h3>
                </div>
                <p className="text-caption text-muted">Hướng dẫn chế độ ăn cá nhân hóa giúp cải thiện làn da từ gốc rễ tế bào.</p>
              </div>
              <button
                onClick={() => {
                  setShowDietModal(false);
                  setSelectedRecipeId(null);
                }}
                className="p-1 hover:bg-surface border border-line rounded-lg text-muted hover:text-fg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Skin Diet Target Card (Double Bezel) */}
            <div className="p-1.5 bg-line/20 border border-line/10 rounded-2xl">
              <div className="bg-bg border border-line/45 rounded-[calc(1rem-0.125rem)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted">Chỉ dẫn hiện tại cho da {
                    activeSkinPlanType === "acne-prone" ? "Mụn & Kháng viêm" :
                    activeSkinPlanType === "sensitive" ? "Nhạy cảm & Kích ứng" :
                    activeSkinPlanType === "dry" ? "Da khô & Mất nước" :
                    activeSkinPlanType === "oily" ? "Da dầu nhờn" : "Hỗn hợp/Thanh lọc"
                  }</span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Chuyên sâu</span>
                </div>
                <h4 className="text-caption font-extrabold text-fg">{dietGuide.title}</h4>
                <p className="text-[11px] text-muted leading-relaxed"><strong className="text-fg font-semibold">Mục tiêu:</strong> {dietGuide.goal}</p>
              </div>
            </div>

            {/* Tab Swapping Header */}
            <div className="flex bg-line/25 p-1 rounded-xl border border-line/10 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => setDietTab("menu")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-caption font-bold transition-all flex items-center gap-1.5 shrink-0",
                  dietTab === "menu" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
                )}
              >
                <Clock size={14} /> Thực đơn 7 ngày
              </button>
              <button
                onClick={() => setDietTab("nutrients")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-caption font-bold transition-all flex items-center gap-1.5 shrink-0",
                  dietTab === "nutrients" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
                )}
              >
                <Sparkles size={14} /> Cẩm nang thực phẩm
              </button>
              <button
                onClick={() => setDietTab("avoid")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-caption font-bold transition-all flex items-center gap-1.5 shrink-0",
                  dietTab === "avoid" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
                )}
              >
                <Ban size={14} /> Thực phẩm cần tránh
              </button>
              <button
                onClick={() => setDietTab("recipe")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-caption font-bold transition-all flex items-center gap-1.5 shrink-0",
                  dietTab === "recipe" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
                )}
              >
                <BookOpen size={14} /> Công thức nấu ăn
              </button>
              <button
                onClick={() => setDietTab("lifestyle")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-caption font-bold transition-all flex items-center gap-1.5 shrink-0",
                  dietTab === "lifestyle" ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
                )}
              >
                <Heart size={14} /> Lối sống khoa học
              </button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[280px] max-h-[380px] overflow-y-auto pr-1">
              <AnimatePresence mode="wait">
                {/* 1. 7-day Sample Menu Tab */}
                {dietTab === "menu" && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Day Picker */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-line">
                      {["day1", "day2", "day3", "day4", "day5", "day6", "day7"].map((day, idx) => (
                        <button
                          key={day}
                          onClick={() => setActiveDay(day)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border shrink-0",
                            activeDay === day 
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                              : "bg-surface text-muted border-line hover:border-emerald-500/30"
                          )}
                        >
                          Ngày {idx + 1}
                        </button>
                      ))}
                    </div>

                    <div className="border border-line rounded-2xl overflow-hidden divide-y divide-line bg-line/5 shadow-soft">
                      {(() => {
                        const plan = skinDietData.mealPlans[activeSkinPlanType]?.[activeDay as "day1"] || {
                          breakfast: "Chưa cập nhật thực đơn",
                          lunch: "Chưa cập nhật thực đơn",
                          snack: "Chưa cập nhật thực đơn",
                          dinner: "Chưa cập nhật thực đơn"
                        };
                        return (
                          <>
                            <div className="p-3.5 flex items-start gap-3 bg-bg">
                              <span className="text-lg">🍳</span>
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Bữa Sáng (07:30)</span>
                                <p className="text-caption font-bold text-fg leading-relaxed">{plan.breakfast}</p>
                              </div>
                            </div>
                            <div className="p-3.5 flex items-start gap-3 bg-bg">
                              <span className="text-lg">🍲</span>
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Bữa Trưa (12:00)</span>
                                <p className="text-caption font-bold text-fg leading-relaxed">{plan.lunch}</p>
                              </div>
                            </div>
                            <div className="p-3.5 flex items-start gap-3 bg-bg">
                              <span className="text-lg">🥛</span>
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Bữa Phụ (15:00)</span>
                                <p className="text-caption font-bold text-fg leading-relaxed">{plan.snack}</p>
                              </div>
                            </div>
                            <div className="p-3.5 flex items-start gap-3 bg-bg">
                              <span className="text-lg">🥗</span>
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Bữa Tối (18:30)</span>
                                <p className="text-caption font-bold text-fg leading-relaxed">{plan.dinner}</p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}

                {/* 2. Skin Food Encyclopedia Tab */}
                {dietTab === "nutrients" && (
                  <motion.div
                    key="nutrients"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Search bar */}
                    <div className="flex items-center bg-surface border border-line rounded-xl px-3 py-2 focus-within:border-emerald-500 transition-all">
                      <span className="text-muted mr-2">🔍</span>
                      <input
                        type="text"
                        value={searchFoodQuery}
                        onChange={(e) => setSearchFoodQuery(e.target.value)}
                        placeholder="Tìm kiếm siêu thực phẩm đẹp da (vd: cá hồi, việt quất...)"
                        className="w-full bg-transparent border-none outline-none text-caption text-fg placeholder:text-muted/60"
                      />
                    </div>

                    <div className="space-y-3">
                      {skinDietData.superfoods
                        .filter(food => 
                          food.name.toLowerCase().includes(searchFoodQuery.toLowerCase()) ||
                          food.nutrients.some(n => n.toLowerCase().includes(searchFoodQuery.toLowerCase()))
                        )
                        .map(food => (
                          <div key={food.id} className="p-4 bg-bg border border-line rounded-2xl space-y-2 hover:border-emerald-500/20 transition-all text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-caption font-extrabold text-fg flex items-center gap-1.5">
                                <span className="text-lg">{getFoodEmoji(food.id)}</span>
                                {food.name}
                              </span>
                              <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                                {food.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted leading-relaxed">{food.skinBenefits}</p>
                            
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {food.nutrients.map((n, i) => (
                                <span key={i} className="text-[9px] bg-line/30 text-fg/80 px-2 py-0.5 rounded-md">
                                  {n}
                                </span>
                              ))}
                            </div>
                            
                            <div className="text-[10px] text-fg/70 bg-surface px-2.5 py-1.5 rounded-lg border border-line/30 flex items-start gap-1">
                              <strong className="font-bold shrink-0 text-emerald-700">Mẹo ăn đúng:</strong>
                              <span className="leading-snug">{food.tips}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. Foods to Avoid Tab */}
                {dietTab === "avoid" && (
                  <motion.div
                    key="avoid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="p-3 bg-amber-500/[0.03] border border-amber-500/10 rounded-xl text-[10px] text-amber-700 leading-normal flex items-start gap-1.5 text-left">
                      <span className="text-xs shrink-0">⚠️</span>
                      <span>Việc cắt giảm các thực phẩm này sẽ làm giảm đáng kể tốc độ lão hóa đường (glycation), ngừa bùng mụn ẩn và phục hồi hàng rào bảo vệ.</span>
                    </div>

                    <div className="space-y-2.5">
                      {skinDietData.avoidFoods.map(food => (
                        <div key={food.id} className="bg-bg border border-line rounded-2xl p-4 space-y-3 text-left">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getFoodEmoji(food.id)}</span>
                              <div>
                                <span className="text-caption font-extrabold text-fg">{food.name}</span>
                                <span className="text-[9px] text-red-500/80 font-bold block bg-red-50 px-1.5 py-0.5 rounded w-max mt-0.5">Hạn chế ăn</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-[11px] text-muted leading-relaxed"><strong className="text-fg/80 font-semibold">Ảnh hưởng da:</strong> {food.skinNegatives}</p>

                          <div className="p-2.5 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl flex items-start gap-2">
                            <span className="text-xs shrink-0">🔄</span>
                            <div className="text-[10px] leading-relaxed">
                              <strong className="font-bold text-emerald-700 block">Lựa chọn thay thế tốt hơn:</strong>
                              <span className="text-muted">{food.alternatives}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 4. Recipes Catalog and Interactive Checklist Tab */}
                {dietTab === "recipe" && (
                  <motion.div
                    key="recipe"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {selectedRecipeId ? (
                      // Detail Recipe View
                      (() => {
                        const recipe = skinDietData.recipes.find(r => r.id === selectedRecipeId);
                        if (!recipe) return null;
                        return (
                          <div className="space-y-4 text-left">
                            {/* Back button */}
                            <button
                              onClick={() => setSelectedRecipeId(null)}
                              className="text-[10px] font-bold text-muted hover:text-fg flex items-center gap-1 bg-surface border border-line px-2.5 py-1 rounded-lg transition-all"
                            >
                              ← Quay lại danh sách
                            </button>

                            <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl">
                              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Chi tiết công thức</span>
                              <span className="text-caption font-extrabold text-fg mt-0.5 block">{recipe.name}</span>
                              <p className="text-[11px] text-muted mt-1 leading-relaxed">{recipe.description}</p>
                              
                              <div className="flex gap-4 pt-3.5 border-t border-line mt-3">
                                <div className="text-center flex-1">
                                  <span className="text-[8px] text-muted uppercase tracking-wider block">Calo</span>
                                  <span className="text-xs font-bold text-fg">{recipe.calories} kcal</span>
                                </div>
                                <div className="text-center flex-1 border-x border-line">
                                  <span className="text-[8px] text-muted uppercase tracking-wider block">Thời gian</span>
                                  <span className="text-xs font-bold text-fg">{recipe.prepTime}</span>
                                </div>
                                <div className="text-center flex-1">
                                  <span className="text-[8px] text-muted uppercase tracking-wider block">Độ khó</span>
                                  <span className="text-xs font-bold text-fg">{recipe.difficulty}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Ingredients */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">🥣 Nguyên liệu chuẩn bị</span>
                                <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-muted">
                                  {recipe.ingredients.map((ing, idx) => (
                                    <li key={idx} className="leading-relaxed">{ing}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Checklist steps */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">🍳 Các bước chế biến (Nhấp để đánh dấu)</span>
                                <div className="space-y-2">
                                  {recipe.steps.map((step, idx) => {
                                    const stepKey = `${recipe.id}-${idx}`;
                                    const isChecked = !!recipeChecklist[stepKey];
                                    return (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setRecipeChecklist(prev => ({
                                            ...prev,
                                            [stepKey]: !isChecked
                                          }));
                                        }}
                                        className={cn(
                                          "flex items-start gap-2 p-2 border rounded-xl cursor-pointer select-none transition-all",
                                          isChecked 
                                            ? "bg-line/10 border-line/40 line-through text-muted/65" 
                                            : "bg-white border-line hover:border-emerald-500/25"
                                        )}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          readOnly
                                          className="mt-0.5 rounded border-line text-emerald-500 focus:ring-emerald-500"
                                        />
                                        <span className="text-[11px] leading-relaxed">{step}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Expert Tip */}
                            <div className="p-3 bg-surface border border-line rounded-xl text-[10px] leading-relaxed flex items-start gap-2">
                              <span className="text-xs shrink-0">💡</span>
                              <div>
                                <span className="font-bold text-fg">Mẹo chuyên gia: </span>
                                <span className="text-muted">{recipe.expertTips}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      // Grid recipes list
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        {skinDietData.recipes.map(recipe => (
                          <div
                            key={recipe.id}
                            onClick={() => setSelectedRecipeId(recipe.id)}
                            className="p-4 bg-bg border border-line hover:border-emerald-500/25 rounded-2xl cursor-pointer hover:shadow-soft transition-all space-y-2 flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                                  {recipe.difficulty}
                                </span>
                                <span className="text-[10px] font-bold text-muted">{recipe.calories} kcal</span>
                              </div>
                              <h4 className="text-caption font-extrabold text-fg leading-snug">{recipe.name}</h4>
                              <p className="text-[10px] text-muted line-clamp-2 leading-relaxed">{recipe.description}</p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-line/30 mt-1">
                              <span className="text-[9px] text-muted">Chuẩn bị: {recipe.prepTime}</span>
                              <span className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
                                Xem cách làm ➔
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 5. Lifestyle Tab */}
                {dietTab === "lifestyle" && (
                  <motion.div
                    key="lifestyle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="p-4 bg-bg border border-line rounded-2xl space-y-3 text-left">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Thói quen sinh hoạt đẹp da bổ trợ</span>
                      <ul className="space-y-2.5">
                        {(() => {
                          const tipsMap: Record<string, string[]> = {
                            "acne-prone": [
                              "Đảm bảo uống đủ 2-2.5 lít nước lọc ấm mỗi ngày để hỗ trợ cơ thể thanh nhiệt.",
                              "Không ăn đồ ngọt tinh chế hoặc sữa béo sau 20h tối để giảm tiết dầu ban đêm.",
                              "Vệ sinh vỏ gối, chăn ga và cọ trang điểm hàng tuần để tránh lây nhiễm vi khuẩn.",
                              "Duy trì thói quen ngủ trước 23h hỗ trợ quá trình sửa chữa tế bào sừng của biểu bì."
                            ],
                            sensitive: [
                              "Bảo vệ da tuyệt đối khỏi ánh nắng mặt trời gắt và môi trường khói bụi.",
                              "Hạn chế chà xát mạnh hoặc sờ tay lên mặt lúc da đang châm chích, nổi mẩn đỏ.",
                              "Tuyệt đối không đắp các loại mặt nạ tự chế chưa được tiệt trùng lên da nhạy cảm.",
                              "Thực hành hít thở sâu hoặc thiền nhẹ 10 phút để giảm tiết cortisol làm giãn mạch máu."
                            ],
                            dry: [
                              "Bổ sung máy phun sương cấp ẩm trong phòng làm việc và phòng ngủ điều hòa.",
                              "Tuyệt đối không rửa mặt bằng nước quá nóng vì sẽ làm mất đi lớp dầu tự nhiên khóa ẩm.",
                              "Thực hiện dưỡng ẩm ngay sau khi rửa mặt 3 phút khi tế bào sừng đang còn ngậm nước.",
                              "Tránh trà cà phê đậm đặc sau buổi trưa vì caffeine gây mất nước tế bào da."
                            ],
                            oily: [
                              "Dùng giấy thấm dầu nhẹ nhàng thấm bớt vùng chữ T thay vì rửa mặt quá nhiều lần.",
                              "Chọn các sản phẩm rửa mặt dạng gel tạo bọt nhẹ dịu có độ pH chuẩn 5.5.",
                              "Hạn chế trang điểm quá dày vào những ngày nắng nóng, dùng kem lót mỏng kiềm dầu tốt.",
                              "Tập thể dục đều đặn 15-20 phút mỗi ngày giúp tăng cường lưu thông máu nuôi dưỡng da."
                            ],
                            normal: [
                              "Uống nước lọc ấm vắt thêm vài giọt cốt chanh tươi buổi sáng để thải độc da.",
                              "Không quên bôi lại kem chống nắng SPF 30-50 sau mỗi 3-4 tiếng hoạt động ngoài trời.",
                              "Duy trì thói quen tập luyện thể thao giúp tăng sinh mạch máu hồng hào dưới cơ mặt.",
                              "Ngủ đủ giấc 7-8 tiếng mỗi ngày để duy trì màng bảo vệ da luôn căng nảy."
                            ]
                          };
                          const tips = tipsMap[activeSkinPlanType] || tipsMap.normal;
                          return tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-[11px] text-muted leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{idx + 1}</span>
                              <span>{tip}</span>
                            </li>
                          ));
                        })()}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-line">
              <button
                onClick={() => {
                  setShowDietModal(false);
                  setSelectedRecipeId(null);
                }}
                className="px-5 py-2.5 bg-fg text-bg hover:opacity-90 active:scale-[0.98] rounded-xl text-caption font-bold transition-all"
              >
                Đóng hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Menstrual Cycle Settings Modal */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-bg border border-line rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-6 animate-in">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 className="text-body font-bold text-fg">Cài đặt chu kỳ kinh nguyệt</h3>
              <button
                onClick={() => setShowCycleModal(false)}
                className="text-caption text-muted hover:text-fg font-bold"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              user.setCycleStartDate(tempCycleDate);
              user.setCycleLength(tempCycleLength);
              setShowCycleModal(false);
              addToast("Đã lưu cài đặt chu kỳ thành công!", "success");
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-micro font-bold text-muted uppercase tracking-wider block" htmlFor="modal-period-date">
                  Ngày bắt đầu kỳ gần nhất
                </label>
                <input
                  id="modal-period-date"
                  type="date"
                  required
                  value={tempCycleDate}
                  onChange={(e) => setTempCycleDate(e.target.value)}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-caption text-fg outline-none focus:border-fg transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-micro font-bold text-muted uppercase tracking-wider block" htmlFor="modal-cycle-len">
                  Độ dài chu kỳ trung bình (ngày)
                </label>
                <input
                  id="modal-cycle-len"
                  type="number"
                  min={15}
                  max={45}
                  required
                  value={tempCycleLength}
                  onChange={(e) => setTempCycleLength(parseInt(e.target.value) || 28)}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-caption text-fg outline-none focus:border-fg transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    user.setCycleStartDate("");
                    setShowCycleModal(false);
                    addToast("Đã tắt theo dõi chu kỳ.", "info");
                  }}
                  className="flex-1 py-2.5 border border-line hover:bg-surface rounded-xl text-caption font-bold text-red-500 hover:text-red-600 transition-all"
                >
                  Tắt theo dõi
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-fg text-bg hover:opacity-90 rounded-xl text-caption font-bold transition-all"
                >
                  Lưu cài đặt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
