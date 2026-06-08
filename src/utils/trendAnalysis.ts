import { DiaryLog } from "@/types";

export interface SkinMetrics {
  oiliness: number;
  dryness: number;
  redness: number;
  acne: number;
  barrierComfort: number;
  pores?: number;
  texture?: number;
}

/**
 * Calculates a skin health score from 0 to 100 based on weighted metrics.
 * Auto-normalizes inputs depending on whether they are 0-10 or 0-100 scale.
 */
export function calculateSkinScore(metrics: SkinMetrics): number {
  const normalize = (val: number) => {
    if (val > 10) return val; // Already 0-100 scale
    return (val / 10) * 100;  // Scale 0-10 to 0-100
  };

  const acneVal = normalize(metrics.acne || 0);
  const rednessVal = normalize(metrics.redness || 0);
  const oilinessVal = normalize(metrics.oiliness || 0);
  const drynessVal = normalize(metrics.dryness || 0);
  const comfortVal = normalize(metrics.barrierComfort || 5); // Default to mid comfort
  const poresVal = metrics.pores !== undefined ? normalize(metrics.pores) : oilinessVal;

  // Weighted penalties (higher means worse skin)
  const acnePenalty = acneVal * 0.35;
  const rednessPenalty = rednessVal * 0.25;
  const poresPenalty = poresVal * 0.15;
  const drynessPenalty = drynessVal * 0.15;
  // Weighted comfort bonus (higher means better skin)
  const comfortBonus = comfortVal * 0.1;

  const penaltySum = acnePenalty + rednessPenalty + poresPenalty + drynessPenalty;
  const score = 100 - penaltySum + comfortBonus;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Analyzes skin logs to detect:
 * 1. 3-day consecutive acne increase (acne spikes)
 * 2. Weekly delta comparisons (changes between latest week and previous week)
 */
export function analyzeSkinTrends(logs: DiaryLog[]) {
  const parseDate = (dStr: string) => {
    const parts = dStr.split("/");
    if (parts.length !== 3) return 0;
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
  };

  // Sort logs by date ascending for chronological analysis
  const sortedLogs = [...logs].sort((a, b) => parseDate(a.date) - parseDate(b.date));

  // 1. Detect 3-day consecutive acne increase
  let hasThreeDayAcneIncrease = false;
  if (sortedLogs.length >= 3) {
    const len = sortedLogs.length;
    const day3 = sortedLogs[len - 1].metrics.acne;
    const day2 = sortedLogs[len - 2].metrics.acne;
    const day1 = sortedLogs[len - 3].metrics.acne;
    if (day3 > day2 && day2 > day1) {
      hasThreeDayAcneIncrease = true;
    }
  }

  // 2. Weekly Delta comparisons
  const thisWeekLogs = sortedLogs.slice(-7);
  const prevWeekLogs = sortedLogs.slice(-14, -7);

  const getAverage = (logsArray: DiaryLog[], key: keyof DiaryLog["metrics"]) => {
    if (logsArray.length === 0) return 0;
    const sum = logsArray.reduce((acc, log) => acc + (log.metrics[key] || 0), 0);
    return sum / logsArray.length;
  };

  const delta: Record<string, number> = {};
  const metricsKeys: (keyof DiaryLog["metrics"])[] = [
    "acne",
    "redness",
    "oiliness",
    "dryness",
    "barrierComfort",
    "pores",
    "texture"
  ];

  metricsKeys.forEach((key) => {
    if (thisWeekLogs.length > 0 && prevWeekLogs.length > 0) {
      delta[key] = parseFloat((getAverage(thisWeekLogs, key) - getAverage(prevWeekLogs, key)).toFixed(1));
    } else if (thisWeekLogs.length >= 2) {
      const latest = thisWeekLogs[thisWeekLogs.length - 1].metrics[key] || 0;
      const prev = thisWeekLogs[thisWeekLogs.length - 2].metrics[key] || 0;
      delta[key] = parseFloat((latest - prev).toFixed(1));
    } else {
      delta[key] = 0;
    }
  });

  return {
    hasThreeDayAcneIncrease,
    delta,
  };
}
