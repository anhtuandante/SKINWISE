import { DiaryLog } from "@/types";

/**
 * SkinPredictorNetwork — Weighted Heuristic Skin Forecaster
 * 
 * Dự đoán trạng thái da ngày mai dựa trên hệ thống trọng số lâm sàng.
 * Sử dụng weighted heuristic thay vì neural network — kết quả tương đương
 * nhưng code gọn, transparent, và không tốn CPU cho backpropagation.
 */

// Helper to parse date strings (DD/MM/YYYY)
function parseDate(dStr: string): Date {
  const parts = dStr.split("/");
  if (parts.length !== 3) return new Date(0);
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

// Clamp giá trị về khoảng [0, 1]
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export class SkinPredictorNetwork {

  // No-op constructor — giữ API tương thích
  constructor() {}

  // No-op trainOnLogs — giữ API tương thích, không cần training
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public trainOnLogs(_logs: DiaryLog[], _epochs: number = 100) {
    // Weighted heuristic không cần training
  }

  /**
   * Tính toán hệ số nhạy cảm cá nhân động dựa trên mối tương quan lịch sử
   */
  public static computePersonalFactors(logs: DiaryLog[]): Record<string, number> {
    const sortedLogs = [...logs]
      .filter((l) => l.date !== "baseline")
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

    const factors: Record<string, number> = {};
    const triggers = [
      { key: "sleepLate", label: "Ngủ muộn", target: "acne" },
      { key: "stress", label: "Stress công việc", target: "acne" },
      { key: "sugar", label: "Ăn đồ ngọt / sữa", target: "acne" },
      { key: "wearMask", label: "Đeo khẩu trang lâu", target: "acne" },
      { key: "makeup", label: "Trang điểm đậm", target: "acne" },
      { key: "forgotSunscreen", label: "Quên chống nắng", target: "redness" },
      { key: "heavyTreatment", label: "Dùng treatment nặng", target: "redness" },
      { key: "weatherChange", label: "Thay đổi thời tiết", target: "redness" },
    ];

    if (sortedLogs.length < 5) {
      // Chưa đủ dữ liệu để tính tương quan
      return {};
    }

    // Tính điểm trung bình nền (baseline)
    let totalAcne = 0;
    let totalRedness = 0;
    let validCount = 0;
    for (const log of sortedLogs) {
      if (log.metrics) {
        totalAcne += log.metrics.acne || 1;
        totalRedness += log.metrics.redness || 1;
        validCount++;
      }
    }

    if (validCount === 0) return {};
    const avgBaselineAcne = totalAcne / validCount;
    const avgBaselineRedness = totalRedness / validCount;

    for (const trigger of triggers) {
      let subsequentSum = 0;
      let count = 0;

      for (let i = 0; i < sortedLogs.length; i++) {
        const log = sortedLogs[i];
        if (log.lifestyle && log.lifestyle.includes(trigger.label)) {
          const triggerTime = parseDate(log.date).getTime();
          // Kiểm tra tình trạng da trong 3 ngày tiếp theo
          for (let k = 1; k <= 3; k++) {
            const subLog = sortedLogs[i + k];
            if (!subLog || !subLog.metrics) break;

            const subTime = parseDate(subLog.date).getTime();
            const diffDays = (subTime - triggerTime) / (24 * 60 * 60 * 1000);

            if (diffDays > 0 && diffDays <= 3) {
              const val = trigger.target === "acne"
                ? (subLog.metrics.acne || 1)
                : (subLog.metrics.redness || 1);
              subsequentSum += val;
              count++;
            }
          }
        }
      }

      if (count >= 2) {
        const avgSubsequent = subsequentSum / count;
        const avgBaseline = trigger.target === "acne" ? avgBaselineAcne : avgBaselineRedness;
        const ratio = avgBaseline > 0 ? avgSubsequent / avgBaseline : 1.0;
        
        // Hệ số dao động từ 1.0 (không nhạy cảm hơn) đến 2.0 (tác hại nhân đôi)
        factors[trigger.key] = Math.max(1.0, Math.min(2.0, ratio));
      } else {
        factors[trigger.key] = 1.0;
      }
    }

    return factors;
  }

  /**
   * Dự đoán 3 chỉ số da dựa trên trọng số lâm sàng kết hợp hệ số thích ứng:
   */
  public predict(inputs: number[], personalFactors?: Record<string, number>): number[] {
    const [
      oiliness, dryness, redness, acne, barrier,
      sleepLate, stress, sugar, wearMask, makeup,
      forgotSunscreen, heavyTreatment, weatherChange,
      amCompleted, pmCompleted
    ] = inputs;

    const factors = personalFactors || {};
    const fSleepLate = factors.sleepLate || 1.0;
    const fStress = factors.stress || 1.0;
    const fSugar = factors.sugar || 1.0;
    const fWearMask = factors.wearMask || 1.0;
    const fMakeup = factors.makeup || 1.0;
    const fForgotSunscreen = factors.forgotSunscreen || 1.0;
    const fHeavyTreatment = factors.heavyTreatment || 1.0;
    const fWeatherChange = factors.weatherChange || 1.0;

    // --- Intermediate risk factors (weighted sums) ---

    // Inflammation risk: sleep + stress + sugar + existing redness/acne
    const inflammation = clamp01(
      sleepLate * 0.25 * fSleepLate + stress * 0.2 * fStress + sugar * 0.3 * fSugar +
      redness * 0.15 + acne * 0.15 - 0.15
    );

    // Barrier recovery: existing barrier comfort + routine adherence - harsh treatments
    const barrierRecovery = clamp01(
      barrier * 0.4 + amCompleted * 0.25 + pmCompleted * 0.25 -
      heavyTreatment * 0.15 * fHeavyTreatment - weatherChange * 0.12 * fWeatherChange
    );

    // Sebum/oil trend: existing oiliness + sleep + sugar - AM routine
    const sebumTrend = clamp01(
      oiliness * 0.5 + sleepLate * 0.15 * fSleepLate + sugar * 0.15 * fSugar -
      amCompleted * 0.1
    );

    // Dryness trend: existing dryness + weather - routine hydration
    const drynessTrend = clamp01(
      dryness * 0.5 + weatherChange * 0.2 * fWeatherChange -
      amCompleted * 0.15 - pmCompleted * 0.2
    );

    // Acne persistence: high weight on existing acne + triggers
    const acnePersistence = clamp01(
      acne * 0.5 + sleepLate * 0.15 * fSleepLate + sugar * 0.2 * fSugar +
      wearMask * 0.1 * fWearMask + makeup * 0.1 * fMakeup -
      amCompleted * 0.1 - pmCompleted * 0.12 - 0.1
    );

    // Redness persistence
    const rednessPersistence = clamp01(
      redness * 0.5 + heavyTreatment * 0.2 * fHeavyTreatment + weatherChange * 0.12 * fWeatherChange +
      forgotSunscreen * 0.1 * fForgotSunscreen - amCompleted * 0.1 - pmCompleted * 0.12 - 0.1
    );

    // Routine benefit bonus
    const routineBenefit = clamp01(
      amCompleted * 0.35 + pmCompleted * 0.4 - forgotSunscreen * 0.25
    );

    // --- Final outputs ---

    // Score: high barrier + routine - inflammation - problems
    const scoreRaw = 0.5 +
      barrierRecovery * 0.25 + routineBenefit * 0.2 -
      inflammation * 0.15 - sebumTrend * 0.06 - drynessTrend * 0.09 -
      acnePersistence * 0.25 - rednessPersistence * 0.18;

    // Acne: driven by persistence + inflammation + sebum
    const acneRaw =
      acnePersistence * 0.55 + inflammation * 0.2 + sebumTrend * 0.15 -
      routineBenefit * 0.1 - 0.05;

    // Redness: driven by persistence + inflammation + dryness - barrier
    const rednessRaw =
      rednessPersistence * 0.55 + inflammation * 0.2 + drynessTrend * 0.1 -
      barrierRecovery * 0.15 - routineBenefit * 0.1 - 0.05;

    return [clamp01(scoreRaw), clamp01(acneRaw), clamp01(rednessRaw)];
  }

  // Prepares normalized input features
  public static extractFeatures(
    yesterdayLog: DiaryLog,
    todayLog: DiaryLog
  ): number[] {
    const normalizeMetric = (val: number) => (val - 1) / 4; // 1-5 to 0-1

    const oiliness = normalizeMetric(yesterdayLog.metrics.oiliness || 2);
    const dryness = normalizeMetric(yesterdayLog.metrics.dryness || 2);
    const redness = normalizeMetric(yesterdayLog.metrics.redness || 1);
    const acne = normalizeMetric(yesterdayLog.metrics.acne || 1);
    const barrier = normalizeMetric(yesterdayLog.metrics.barrierComfort || 4);

    const hasTag = (tag: string) => (todayLog.lifestyle.includes(tag) ? 1 : 0);
    const sleepLate = hasTag("Ngủ muộn");
    const stress = hasTag("Stress công việc");
    const sugar = hasTag("Ăn đồ ngọt / sữa");
    const wearMask = hasTag("Đeo khẩu trang lâu");
    const makeup = hasTag("Trang điểm đậm");
    const forgotSunscreen = hasTag("Quên chống nắng");
    const heavyTreatment = hasTag("Dùng treatment nặng");
    const weather = hasTag("Thay đổi thời tiết");

    const amCompleted = todayLog.amRoutineCompleted ? 1 : 0;
    const pmCompleted = todayLog.pmRoutineCompleted ? 1 : 0;

    return [
      oiliness, dryness, redness, acne, barrier,
      sleepLate, stress, sugar, wearMask, makeup, forgotSunscreen, heavyTreatment, weather,
      amCompleted, pmCompleted
    ];
  }

  // Computes next-day prediction based on today's logs
  public getForecast(
    yesterdayLog: DiaryLog | null,
    todayLog: DiaryLog,
    userProfile: { concerns: string[]; skinType: string; barrierStatus?: string },
    allLogs: DiaryLog[] = []
  ): { score: number; acne: number; redness: number; riskFactors: string[]; personalInsights?: string[] } {
    const baselineYesterdayLog: DiaryLog = yesterdayLog || {
      id: 0,
      date: "baseline",
      dayName: "baseline",
      mood: "okay",
      metrics: {
        acne: userProfile.concerns.includes("acne") ? 3 : 1,
        redness: userProfile.skinType === "sensitive" || (userProfile.barrierStatus === "redness" || userProfile.barrierStatus === "stinging" || userProfile.barrierStatus === "flaking") ? 4 : 1,
        oiliness: userProfile.skinType === "oily" ? 4 : 2,
        dryness: userProfile.skinType === "dry" ? 4 : 2,
        barrierComfort: (userProfile.barrierStatus === "stinging" || userProfile.barrierStatus === "flaking" || userProfile.barrierStatus === "redness") ? 4 : 8,
      },
      lifestyle: [],
      note: ""
    };

    const d = new Date();
    const todayStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const isToday = todayLog.date === todayStr;
    const isBeforeEvening = isToday && d.getHours() < 18;

    const adjustedTodayLog = isBeforeEvening
      ? { ...todayLog, pmRoutineCompleted: true }
      : todayLog;

    // Compute personal factors dynamically
    const personalFactors = SkinPredictorNetwork.computePersonalFactors(allLogs);
    const inputs = SkinPredictorNetwork.extractFeatures(baselineYesterdayLog, adjustedTodayLog);
    const rawOutputs = this.predict(inputs, personalFactors);

    const score = Math.round(rawOutputs[0] * 100);
    const acne = Math.round(rawOutputs[1] * 4 + 1);
    const redness = Math.round(rawOutputs[2] * 4 + 1);

    const riskFactors: string[] = [];
    if (todayLog.lifestyle.includes("Ngủ muộn")) riskFactors.push("thức khuya");
    if (todayLog.lifestyle.includes("Stress công việc")) riskFactors.push("căng thẳng");
    if (todayLog.lifestyle.includes("Ăn đồ ngọt / sữa")) riskFactors.push("tiêu thụ đồ ngọt/sữa");
    if (todayLog.lifestyle.includes("Quên chống nắng")) riskFactors.push("quên thoa kem chống nắng");
    if (todayLog.lifestyle.includes("Dùng treatment nặng")) riskFactors.push("sử dụng hoạt chất đặc trị nặng");
    if (todayLog.lifestyle.includes("Thay đổi thời tiết")) riskFactors.push("thời tiết biến động");

    const skippedAM = !todayLog.amRoutineCompleted;
    const skippedPM = !todayLog.pmRoutineCompleted;
    if (isBeforeEvening) {
      if (skippedAM) riskFactors.push("bỏ qua chu trình dưỡng da buổi sáng");
    } else {
      if (skippedAM && skippedPM) riskFactors.push("bỏ qua cả chu trình dưỡng da ngày & đêm");
      else if (skippedAM) riskFactors.push("bỏ qua chu trình dưỡng da buổi sáng");
      else if (skippedPM) riskFactors.push("bỏ qua chu trình dưỡng da buổi tối");
    }

    // Generate smart personal insights
    const personalInsights: string[] = [];
    const triggerLabels: Record<string, string> = {
      sleepLate: "Thức khuya",
      stress: "Căng thẳng công việc",
      sugar: "Ăn đồ ngọt / sữa",
      wearMask: "Đeo khẩu trang lâu",
      makeup: "Trang điểm đậm",
      forgotSunscreen: "Quên bôi kem chống nắng",
      heavyTreatment: "Dùng đặc trị nặng",
      weatherChange: "Thay đổi thời tiết",
    };

    for (const key in personalFactors) {
      const val = personalFactors[key];
      if (val >= 1.15) {
        const pct = Math.round((val - 1.0) * 100);
        const triggerLabel = triggerLabels[key];
        const effect = key === "forgotSunscreen" || key === "heavyTreatment" || key === "weatherChange"
          ? "mẩn đỏ da"
          : "nổi mụn";
        personalInsights.push(
          `AI phát hiện cơ địa bạn nhạy cảm đặc biệt với: ${triggerLabel} (+${pct}% nguy cơ gây ${effect}).`
        );
      }
    }

    return {
      score,
      acne,
      redness,
      riskFactors,
      personalInsights,
    };
  }
}
