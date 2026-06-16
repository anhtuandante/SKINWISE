"use client";

import { useSkinStore } from "@/store/useSkinStore";
import { useUserStore } from "@/store/user-store";
import { useRoutineStore } from "@/store/routine-store";
import { calculateSkinScore } from "@/utils/trendAnalysis";
import { SkinPredictorNetwork } from "@/utils/skinPredictor";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Camera, Settings, Check, Droplets, Sun, Moon, ShieldAlert, Calendar, Sparkle, Brain, Download, Upload, Trash2, Salad, Clock, BookOpen, ArrowRight, Ban, X, Heart, Info, Bell, Luggage, RotateCcw } from "lucide-react";
import { getCyclePhase } from "@/utils/cyclePredictor";
import { useToastStore } from "@/store/toast-store";
import { trackEvent } from "@/lib/tracking";
import { CATEGORY_LABELS } from "@/lib/constants";
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
  userName?: string;
}

export default function SkinDashboard({
  onNavigate,
  selectedCity,
  setSelectedCity,
  citiesWeather,
  userName
}: SkinDashboardProps) {
  const user = useUserStore();
  const routine = useRoutineStore();
  const { 
    diaryLogs, pinnedMetrics, setPinnedMetrics, toggleRoutineCompleted,
    recoveryMode, setRecoveryMode 
  } = useSkinStore();

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return "Chào buổi sáng";
    if (hours >= 12 && hours < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  // Heuristic for auto-suggesting Recovery Mode
  const shouldSuggestRecovery = useMemo(() => {
    if (recoveryMode || diaryLogs.length < 2) return false;

    // Helper to parse date
    const parseDateStrLocal = (dStr: string): Date => {
      const parts = dStr.split("/");
      if (parts.length !== 3) return new Date(0);
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    };

    // Sort logs descending by date
    const sorted = [...diaryLogs].sort(
      (a, b) => parseDateStrLocal(b.date).getTime() - parseDateStrLocal(a.date).getTime()
    );

    const lastTwoLogs = sorted.slice(0, 2);
    if (lastTwoLogs.length < 2) return false;

    // Check if both of the last 2 entries show redness >= 4 or barrierComfort <= 2
    const isRednessHigh = lastTwoLogs.every(l => l.metrics.redness !== undefined && l.metrics.redness >= 4);
    const isBarrierLow = lastTwoLogs.every(l => l.metrics.barrierComfort !== undefined && l.metrics.barrierComfort <= 2);

    return isRednessHigh || isBarrierLow;
  }, [recoveryMode, diaryLogs]);

  const [showVisionModal, setShowVisionModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [tempPinnedMetrics, setTempPinnedMetrics] = useState<string[]>([]);
  
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
  const [insightTab, setInsightTab] = useState<"forecast" | "diet" | "cycle">("forecast");

  const [mounted, setMounted] = useState(false);
  const isSkinStoreHydrated = useSkinStore((s) => s.isHydrated);
  const isUserStoreHydrated = useUserStore((s) => s.isHydrated);
  const [surveyDismissed, setSurveyDismissed] = useState(false);
  const [retakeReminderDismissed, setRetakeReminderDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setSurveyDismissed(localStorage.getItem("skinwise_survey_dismissed") === "true");
      // Check retake reminder dismissal (7-day cooldown)
      const retakeDismissedAt = localStorage.getItem("skinwise_retake_dismissed_at");
      if (retakeDismissedAt) {
        const dismissedDate = new Date(retakeDismissedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        setRetakeReminderDismissed(daysDiff < 7);
      }
    }
  }, []);

  const handleDismissSurvey = () => {
    localStorage.setItem("skinwise_survey_dismissed", "true");
    setSurveyDismissed(true);
    trackEvent("survey_dismissed");
  };

  const handleCompleteSurvey = () => {
    localStorage.setItem("skinwise_survey_dismissed", "true");
    setSurveyDismissed(true);
    trackEvent("survey_click");
  };

  const handleDismissRetakeReminder = () => {
    localStorage.setItem("skinwise_retake_dismissed_at", new Date().toISOString());
    setRetakeReminderDismissed(true);
    trackEvent("retake_reminder_dismissed");
  };

  // Smart retake reminder logic
  const shouldShowRetakeReminder = useMemo(() => {
    if (retakeReminderDismissed) return false;
    const quizHistory = user.quizHistory || [];
    if (quizHistory.length === 0) return false;
    const lastQuizDate = new Date(quizHistory[quizHistory.length - 1].completedAt);
    const daysSinceLastQuiz = (Date.now() - lastQuizDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastQuiz >= 30 && diaryLogs.length >= 14;
  }, [retakeReminderDismissed, user.quizHistory, diaryLogs.length]);

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
      {/* Dynamic Personal Greeting Header */}
      <div className="flex items-baseline justify-between mb-4 mt-2">
        <h1 className="text-[28px] font-light text-fg leading-none tracking-tight">
          {greeting}, <span className="font-semibold text-accent-dark">{userName || "bạn 🌸"}</span>
        </h1>
        <span className="text-[11px] text-muted font-bold tracking-wider uppercase">
          {todayStr}
        </span>
      </div>

      {/* Intelligent Recovery Prompt */}
      {shouldSuggestRecovery && (
        <div className="p-5 bg-red-500/[0.03] border border-red-500/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <ShieldAlert size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <p className="text-caption font-bold text-red-600">Da bạn đang có dấu hiệu kích ứng liên tục ⚠️</p>
              <p className="text-[11px] text-muted leading-relaxed">
                Nhật ký 2 ngày qua cho thấy hàng rào bảo vệ da yếu hoặc mẩn đỏ cao. Bạn nên kích hoạt **Chế độ Phục hồi (Recovery Mode)** để tạm treo treatment và làm dịu da.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setRecoveryMode(true);
              addToast("Đã kích hoạt Recovery Mode!", "info");
            }}
            className="w-full sm:w-auto shrink-0 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold active:scale-[0.98] transition-all text-center shadow-sm"
          >
            Kích hoạt ngay
          </button>
        </div>
      )}

      {/* Smart Quiz Retake Reminder */}
      {shouldShowRetakeReminder && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-300"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-accent-light text-accent-dark flex items-center justify-center shrink-0">
              <RotateCcw size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-caption font-bold text-fg">Da bạn có thể đã thay đổi 🌿</p>
              <p className="text-[11px] text-muted leading-relaxed">
                Đã hơn 30 ngày kể từ lần chẩn đoán cuối. Cập nhật hồ sơ da để AI tối ưu lại Routine?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/quiz"
              onClick={() => trackEvent("retake_reminder_click")}
              className="bg-fg text-bg px-3 py-2 rounded-xl text-[11px] font-bold hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              Cập nhật
            </Link>
            <button
              onClick={handleDismissRetakeReminder}
              className="p-1.5 text-muted hover:text-fg transition-colors rounded-lg hover:bg-surface"
              title="Ẩn nhắc nhở"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* 1. Daily Health & Environmental Briefing */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Sparkle size={180} />
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent animate-pulse" />
            <span className="text-accent text-[10px] font-extrabold uppercase tracking-widest">Bản tin da liễu hàng ngày</span>
          </div>
          <button
            onClick={handleOpenCustomize}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
            title="Tùy chỉnh chỉ số ghim"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-8 items-stretch">
          {/* Left: Skin Score */}
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-caption text-slate-400 font-bold uppercase tracking-wider">Chỉ số hôm nay</h2>
                <button 
                  onClick={() => setShowScoreInfo(!showScoreInfo)} 
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                  title="Cách tính điểm"
                >
                  <Info size={14} />
                </button>
              </div>
              
              <AnimatePresence>
                {showScoreInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/10 border border-white/20 rounded-xl p-4 mt-2 mb-4 text-[11px] text-slate-300 space-y-2 relative">
                      <button onClick={() => setShowScoreInfo(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white">
                        <X size={12} />
                      </button>
                      <strong className="text-white block mb-1">Công thức tính (Max 100)</strong>
                      <p>Điểm được nội suy từ chỉ số Mụn, Mẩn đỏ, Dầu thừa và Lỗ chân lông.</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400">
                        <li>Mức độ nghiêm trọng tăng 1 bậc: Trừ 2 điểm.</li>
                        <li>Hàng rào da yếu (kích ứng): Trừ thêm 5 điểm.</li>
                        <li>Bùng mụn cấp tính: Trừ tối đa 10 điểm.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-6xl font-extrabold tracking-tight text-white inline-block animate-pulse-slow"
                  >
                    {displayScore}
                  </motion.span>
                  <span className="text-body text-slate-400">/100</span>
                </div>
                {recoveryMode && (
                  <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/35 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    🛡️ SOS Phục hồi
                  </span>
                )}
              </div>
              <p className="text-caption text-slate-300 mt-2">
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
            
            <div className="text-caption text-slate-300 leading-relaxed bg-white/5 border border-white/10 p-4 rounded-xl">
              <span className="font-semibold text-accent block mb-1">💡 Khuyến nghị từ AI:</span>
              {(user.barrierStatus === "stinging" || user.barrierStatus === "flaking" || user.barrierStatus === "redness")
                ? "Hàng rào da của bạn đang mỏng yếu. Ưu tiên cấp ẩm phục hồi và dừng các hoạt chất đặc trị mạnh."
                : todayScore >= 75
                ? "Làn da đang ở trạng thái tốt nhất. Bạn có thể duy trì treatment hoặc tập trung dưỡng sáng nhẹ."
                : "Thời tiết khắc nghiệt dễ gây mất ẩm. Hãy uống đủ nước và bôi dưỡng ẩm kết cấu mỏng nhẹ."}
            </div>
          </div>

          {/* Right: Weather & Climate */}
          <div className="flex-1 bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-micro font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>{citiesWeather[selectedCity].icon}</span> Môi trường
              </span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg text-[11px] px-2 py-1 outline-none text-white font-medium cursor-pointer"
              >
                {Object.entries(citiesWeather).map(([key, val]) => (
                  <option key={key} value={key} className="bg-slate-900 text-white">
                    {val.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-caption text-slate-200">
                  {citiesWeather[selectedCity].desc}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-micro font-bold text-slate-400 uppercase tracking-wider">Tia cực tím:</span>
                  <span className={cn(
                    "text-caption font-bold px-2.5 py-0.5 rounded-full text-xs",
                    citiesWeather[selectedCity].uv >= 8 ? "bg-red-500/20 text-red-400" :
                    citiesWeather[selectedCity].uv >= 6 ? "bg-amber-500/20 text-amber-400" :
                    "bg-green-500/20 text-green-400"
                  )}>
                    UV {citiesWeather[selectedCity].uv}/11 · {citiesWeather[selectedCity].status}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-2">
                {citiesWeather[selectedCity].advice}
              </p>
            </div>
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

      {/* 3. Daily Activities & Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Skincare Checklist Widget */}
        <div className="md:col-span-2 bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-body font-bold text-fg flex items-center gap-2">
                <Check size={18} className="text-accent-dark" />
                <span>Theo dõi chu trình hôm nay</span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if ("Notification" in window) {
                      Notification.requestPermission().then(permission => {
                        if (permission === "granted") addToast("Đã bật thông báo nhắc nhở skincare!", "success");
                        else addToast("Bạn đã từ chối quyền thông báo.", "error");
                      });
                    } else {
                      addToast("Trình duyệt không hỗ trợ thông báo.", "error");
                    }
                  }}
                  className="p-1.5 bg-surface rounded-lg text-muted hover:text-fg hover:bg-line/40 transition-all"
                  title="Nhắc nhở chu trình"
                >
                  <Bell size={14} />
                </button>
                <button
                  onClick={() => {
                    routine.toggleSnooze();
                    addToast(routine.isSnoozed ? "Đã bật lại chu trình." : "Đã tạm dừng chu trình (Du lịch/Nghỉ ngơi).", "info");
                  }}
                  className={cn("p-1.5 rounded-lg transition-all", routine.isSnoozed ? "bg-accent text-bg" : "bg-surface text-muted hover:text-fg hover:bg-line/40")}
                  title="Chế độ Du Lịch / Nghỉ ngơi"
                >
                  <Luggage size={14} />
                </button>
              </div>
            </div>
            {todayLog?.amRoutineCompleted && todayLog?.pmRoutineCompleted && !routine.isSnoozed && (
              <span className="text-[10px] bg-success/10 text-success px-2.5 py-1 rounded-full font-bold border border-success/10 uppercase tracking-wider inline-block">
                Hoàn thành cả hai! 🎉
              </span>
            )}
            {!routine.isSnoozed && <p className="text-caption text-muted">Đánh dấu sau khi bôi để AI theo dõi độ ẩm da chính xác.</p>}
          </div>

          {routine.isSnoozed ? (
             <div className="flex items-center justify-center p-8 border border-dashed border-line rounded-2xl bg-surface/50 h-full">
               <div className="text-center space-y-2">
                 <Luggage size={32} className="text-muted mx-auto" />
                 <h4 className="text-caption font-bold text-fg">Đang trong chế độ Nghỉ ngơi</h4>
                 <p className="text-micro text-muted">Chu trình skincare đã được tạm dừng để bạn không bị lỡ streak.</p>
                 <button onClick={() => routine.toggleSnooze()} className="mt-3 text-[10px] bg-fg text-bg px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all">Bật lại chu trình</button>
               </div>
             </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {routine.morningRoutine.map((p, idx) => {
                      const isPaused = routine.pausedProductIds?.includes(p.id);
                      return (
                        <span key={p.id} className={`flex items-center gap-1.5 ${isPaused ? 'opacity-40 line-through' : ''}`}>
                          <span className="text-fg">{CATEGORY_LABELS[p.category] || p.category}</span>
                          {idx < routine.morningRoutine.length - 1 && <span className="text-subtle font-light no-underline">&rarr;</span>}
                        </span>
                      )
                    })}
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
                    {routine.eveningRoutine.map((p, idx) => {
                      const isPaused = routine.pausedProductIds?.includes(p.id);
                      return (
                        <span key={p.id} className={`flex items-center gap-1.5 ${isPaused ? 'opacity-40 line-through' : ''}`}>
                          <span className="text-fg">{CATEGORY_LABELS[p.category] || p.category}</span>
                          {idx < routine.eveningRoutine.length - 1 && <span className="text-subtle font-light no-underline">&rarr;</span>}
                        </span>
                      )
                    })}
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
          )}
        </div>

        {/* Action CTAs */}
        <div className="bg-white border border-line rounded-[24px] p-6 shadow-soft flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-body font-bold text-fg">Nhật ký & Check-in</h3>
            <p className="text-caption text-muted font-medium">Ghi nhận chỉ số da hàng ngày hoặc chẩn đoán qua ảnh.</p>
          </div>

          <div className="space-y-3">
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
              className="w-full bg-fg hover:bg-slate-900 text-bg py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-sm transition-all active:scale-[0.99] text-caption"
            >
              <Calendar size={16} />
              {todayLog && !todayLog.isPartial ? "Xem nhật ký da" : todayLog ? "Bổ sung nhật ký" : "Check-in da (3s)"}
            </button>
            <button
              onClick={() => setShowVisionModal(true)}
              className="w-full bg-white hover:bg-surface border border-line text-fg py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-sm transition-all active:scale-[0.99] text-caption"
            >
              <Camera size={16} />
              Check-in khuôn mặt AI
            </button>
          </div>
        </div>
      </div>

      {/* 3.5 Survey Bento Card */}
      {!surveyDismissed && (
        <div className="bg-gradient-to-r from-accent/[0.04] via-[#C4A882]/5 to-bg border border-line rounded-[28px] p-6 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Heart size={120} className="text-accent-dark" />
          </div>
          
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent-dark flex items-center justify-center shrink-0 shadow-sm">
              <Heart size={22} className="fill-accent-dark text-accent-dark" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-body font-bold text-fg">Đóng góp ý kiến cho SkinWise 💬</h4>
              <p className="text-caption text-muted leading-relaxed max-w-xl">
                Cảm ơn bạn đã đồng hành cùng SkinWise! Hãy dành ra 1 phút để thực hiện bản khảo sát ngắn này giúp tụi mình cải thiện AI và mang đến nhiều tính năng hữu ích hơn nữa nhé.
              </p>
            </div>
          </div>
          
          <div className="flex sm:flex-col items-center gap-3 w-full sm:w-auto shrink-0 relative z-10">
            <a
              href="https://docs.google.com/forms/d/1m8GuSjkyuvKsIryVfr6okucPgHmId6je6fFZLTUKOvs/viewform?usp=sf_link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCompleteSurvey}
              className="flex-1 sm:w-full bg-fg hover:bg-slate-900 text-bg py-2.5 px-5 rounded-xl text-caption font-bold text-center transition-all active:scale-[0.98] whitespace-nowrap"
            >
              Làm khảo sát
            </a>
            <button
              onClick={handleDismissSurvey}
              className="text-muted hover:text-fg text-micro font-bold py-2 px-3 transition-colors"
            >
              Ẩn thông báo này ✕
            </button>
          </div>
        </div>
      )}

      {/* 4. AI Insights Hub (Tabbed) */}
      <div className="bg-white border border-line rounded-[28px] p-6 shadow-soft space-y-6 animate-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <h3 className="text-body font-bold text-fg flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              <span>AI Cố Vấn & Dự Báo</span>
            </h3>
            <p className="text-caption text-muted">Khuyến nghị cá nhân hóa dựa trên dữ liệu hàng ngày của bạn.</p>
          </div>
          
          <div className="bg-surface border border-line rounded-xl p-0.5 flex flex-wrap gap-1 text-[11px] font-bold">
            {[
              { id: "forecast", label: "Dự báo da", icon: Brain },
              { id: "diet", label: "Dinh dưỡng", icon: Salad },
              { id: "cycle", label: "Chu kỳ", icon: Calendar }
            ].map((t) => {
              const Icon = t.icon;
              const active = insightTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setInsightTab(t.id as "forecast" | "diet" | "cycle")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all select-none",
                    active ? "bg-fg text-bg shadow-sm" : "text-muted hover:text-fg"
                  )}
                >
                  <Icon size={12} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={insightTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {insightTab === "forecast" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {!todayLog ? (
                  <div className="bg-accent/[0.01] border border-accent/15 rounded-xl p-6 text-center space-y-2">
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
                    <div className="space-y-4">
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
                        <span className="font-bold text-accent-dark block mb-1">💡 Lời khuyên chăm sóc da ngày mai:</span>
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
                          <span className="font-bold text-accent-dark block font-semibold">🧠 AI Phân Tích Thói Quen (Cá nhân hóa):</span>
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
            )}

            {insightTab === "diet" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted">Dinh dưỡng cá nhân hóa dựa trên loại da và tình trạng của bạn.</span>
                  <button
                    onClick={() => {
                      setDietTab("menu");
                      setShowDietModal(true);
                    }}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-500/[0.04] border border-emerald-500/10 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-[0.98] select-none shrink-0"
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
                            placeholder="Tìm món ăn (vd: bơ, cá hồi...)"
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
                            Chưa ghi chép món ăn nào.
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
            )}

            {insightTab === "cycle" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted">Theo dõi và dự báo tình trạng da dựa trên chu kỳ sinh lý của bạn.</span>
                  <button
                    onClick={() => {
                      setTempCycleDate(user.cycleStartDate || "");
                      setTempCycleLength(user.cycleLength || 28);
                      setShowCycleModal(true);
                    }}
                    className="p-1.5 hover:bg-surface border border-line rounded-lg text-muted hover:text-fg transition-all text-micro font-bold flex items-center gap-1 select-none"
                  >
                    <Settings size={12} /> Cài đặt chu kỳ
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
                          <p className="text-muted leading-relaxed">{cycleInfo.advice}</p>
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
            )}
          </motion.div>
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
