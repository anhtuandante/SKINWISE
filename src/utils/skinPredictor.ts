import { DiaryLog } from "@/types";
import { calculateSkinScore } from "./trendAnalysis";

// Helper: Sigmoid activation
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// Helper: Sigmoid derivative
function sigmoidDerivative(sigmoidVal: number): number {
  return sigmoidVal * (1 - sigmoidVal);
}

export class SkinPredictorNetwork {
  // Layer dimensions
  private inputDim = 15;
  private hiddenDim = 8;
  private outputDim = 3; // 0: Score (0-1), 1: Acne (0-1), 2: Redness (0-1)

  // Weights and Biases
  private w1: number[][]; // inputDim x hiddenDim
  private b1: number[];   // hiddenDim
  private w2: number[][]; // hiddenDim x outputDim
  private b2: number[];   // outputDim

  constructor() {
    this.w1 = Array.from({ length: this.inputDim }, () => new Array(this.hiddenDim).fill(0));
    this.b1 = new Array(this.hiddenDim).fill(0);
    this.w2 = Array.from({ length: this.hiddenDim }, () => new Array(this.outputDim).fill(0));
    this.b2 = new Array(this.outputDim).fill(0);

    this.initializeDefaultWeights();
  }

  // Pre-initialize network to represent standard clinical heuristics on day 1
  private initializeDefaultWeights() {
    // Inputs:
    // 0: Yesterday Oiliness (0-1)
    // 1: Yesterday Dryness (0-1)
    // 2: Yesterday Redness (0-1)
    // 3: Yesterday Acne (0-1)
    // 4: Yesterday Barrier (0-1)
    // 5: Sleep Late (0 or 1)
    // 6: Stress (0 or 1)
    // 7: Sugar/Milk (0 or 1)
    // 8: Wear Mask (0 or 1)
    // 9: Heavy Makeup (0 or 1)
    // 10: Forgot Sunscreen (0 or 1)
    // 11: Heavy Treatment (0 or 1)
    // 12: Weather Change (0 or 1)
    // 13: AM Completed (0 or 1)
    // 14: PM Completed (0 or 1)

    // Hidden neurons:
    // Neuron 0: General inflammation risk
    // Neuron 1: Barrier recovery status
    // Neuron 2: Sebum/oil trend
    // Neuron 3: Dryness trend
    // Neuron 4: Acne persistence
    // Neuron 5: Redness/irritation persistence
    // Neuron 6: Routine benefits
    // Neuron 7: General baseline

    // General inflammation
    this.w1[5][0] = 0.8;  // sleep late -> inflammation
    this.w1[6][0] = 0.7;  // stress -> inflammation
    this.w1[7][0] = 0.9;  // sugar -> inflammation
    this.w1[2][0] = 0.5;  // yesterday redness -> inflammation
    this.w1[3][0] = 0.5;  // yesterday acne -> inflammation

    // Barrier recovery
    this.w1[4][1] = 1.0;  // yesterday barrier comfort
    this.w1[13][1] = 0.8; // AM completed
    this.w1[14][1] = 0.8; // PM completed
    this.w1[11][1] = -0.5; // heavy treatment penalizes barrier comfort
    this.w1[12][1] = -0.4; // weather change penalizes barrier comfort

    // Sebum/Oil
    this.w1[0][2] = 1.2;  // yesterday oiliness
    this.w1[5][2] = 0.4;  // sleep late
    this.w1[7][2] = 0.5;  // sugar
    this.w1[13][2] = -0.3; // AM routine reduces oil slightly

    // Dryness
    this.w1[1][3] = 1.2;  // yesterday dryness
    this.w1[12][3] = 0.6; // weather change
    this.w1[13][3] = -0.5; // AM routine hydrates
    this.w1[14][3] = -0.6; // PM routine hydrates

    // Acne persistence
    this.w1[3][4] = 1.8;  // yesterday acne
    this.w1[5][4] = 0.6;  // sleep late
    this.w1[7][4] = 0.8;  // sugar
    this.w1[13][4] = -0.4; // AM routine helps
    this.w1[14][4] = -0.5; // PM routine helps

    // Redness/Irritation persistence
    this.w1[2][5] = 1.8;  // yesterday redness
    this.w1[11][5] = 0.8; // heavy treatment causes redness
    this.w1[12][5] = 0.5; // weather change
    this.w1[10][5] = 0.4; // forgot sunscreen
    this.w1[13][5] = -0.4; // AM routine helps
    this.w1[14][5] = -0.5; // PM routine helps

    // Routine benefits
    this.w1[13][6] = 1.0;  // AM routine
    this.w1[14][6] = 1.2;  // PM routine
    this.w1[10][6] = -0.8; // forgot sunscreen offsets benefits

    // General baseline
    this.b1[0] = -0.5;
    this.b1[1] = 0.0;
    this.b1[2] = -0.2;
    this.b1[3] = -0.2;
    this.b1[4] = -0.5;
    this.b1[5] = -0.5;
    this.b1[6] = -0.2;
    this.b1[7] = 0.2;

    // Output Layer Weights
    // Output 0: Skin Health Score (higher barrier, high routine, low inflammation/acne/redness/dryness)
    this.w2[1][0] = 0.8;   // barrier comfort -> +Score
    this.w2[6][0] = 0.6;   // routine benefits -> +Score
    this.w2[0][0] = -0.5;  // inflammation -> -Score
    this.w2[2][0] = -0.2;  // sebum -> -Score
    this.w2[3][0] = -0.3;  // dryness -> -Score
    this.w2[4][0] = -0.8;  // acne -> -Score
    this.w2[5][0] = -0.6;  // redness -> -Score
    this.b2[0] = 0.5;      // baseline positive offset

    // Output 1: Acne (driven by acne persistence, inflammation, sebum)
    this.w2[4][1] = 1.2;   // acne persistence -> +Acne
    this.w2[0][1] = 0.6;   // inflammation -> +Acne
    this.w2[2][1] = 0.4;   // sebum -> +Acne
    this.w2[6][1] = -0.3;  // routine benefits -> -Acne
    this.b2[1] = -0.3;

    // Output 2: Redness (driven by redness persistence, inflammation, dryness, minus barrier)
    this.w2[5][2] = 1.2;   // redness persistence -> +Redness
    this.w2[0][2] = 0.6;   // inflammation -> +Redness
    this.w2[3][2] = 0.3;   // dryness -> +Redness
    this.w2[1][2] = -0.5;  // barrier -> -Redness
    this.w2[6][2] = -0.3;  // routine -> -Redness
    this.b2[2] = -0.3;
  }

  // Forward Pass
  public predict(inputs: number[]): number[] {
    // Hidden Layer
    const hiddenOutputs = new Array(this.hiddenDim).fill(0);
    for (let j = 0; j < this.hiddenDim; j++) {
      let sum = this.b1[j];
      for (let i = 0; i < this.inputDim; i++) {
        sum += inputs[i] * this.w1[i][j];
      }
      hiddenOutputs[j] = sigmoid(sum);
    }

    // Output Layer
    const outputs = new Array(this.outputDim).fill(0);
    for (let k = 0; k < this.outputDim; k++) {
      let sum = this.b2[k];
      for (let j = 0; j < this.hiddenDim; j++) {
        sum += hiddenOutputs[j] * this.w2[j][k];
      }
      outputs[k] = sigmoid(sum);
    }

    return outputs;
  }

  // Backpropagation (Single Step SGD)
  public train(inputs: number[], targets: number[], lr: number = 0.1) {
    // Forward Pass
    const hiddenOutputs = new Array(this.hiddenDim).fill(0);
    for (let j = 0; j < this.hiddenDim; j++) {
      let sum = this.b1[j];
      for (let i = 0; i < this.inputDim; i++) {
        sum += inputs[i] * this.w1[i][j];
      }
      hiddenOutputs[j] = sigmoid(sum);
    }

    const outputs = new Array(this.outputDim).fill(0);
    for (let k = 0; k < this.outputDim; k++) {
      let sum = this.b2[k];
      for (let j = 0; j < this.hiddenDim; j++) {
        sum += hiddenOutputs[j] * this.w2[j][k];
      }
      outputs[k] = sigmoid(sum);
    }

    // Output layer gradients
    const outputDeltas = new Array(this.outputDim).fill(0);
    for (let k = 0; k < this.outputDim; k++) {
      const error = targets[k] - outputs[k];
      outputDeltas[k] = error * sigmoidDerivative(outputs[k]);
    }

    // Hidden layer gradients
    const hiddenDeltas = new Array(this.hiddenDim).fill(0);
    for (let j = 0; j < this.hiddenDim; j++) {
      let error = 0;
      for (let k = 0; k < this.outputDim; k++) {
        error += outputDeltas[k] * this.w2[j][k];
      }
      hiddenDeltas[j] = error * sigmoidDerivative(hiddenOutputs[j]);
    }

    // Update Hidden-to-Output Weights & Biases
    for (let j = 0; j < this.hiddenDim; j++) {
      for (let k = 0; k < this.outputDim; k++) {
        this.w2[j][k] += lr * outputDeltas[k] * hiddenOutputs[j];
      }
    }
    for (let k = 0; k < this.outputDim; k++) {
      this.b2[k] += lr * outputDeltas[k];
    }

    // Update Input-to-Hidden Weights & Biases
    for (let i = 0; i < this.inputDim; i++) {
      for (let j = 0; j < this.hiddenDim; j++) {
        this.w1[i][j] += lr * hiddenDeltas[j] * inputs[i];
      }
    }
    for (let j = 0; j < this.hiddenDim; j++) {
      this.b1[j] += lr * hiddenDeltas[j];
    }
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

  // Trains the network using sequential history (skips partial/mood-only logs)
  public trainOnLogs(logs: DiaryLog[], epochs: number = 100) {
    // Only train on full logs — partial (mood-only) entries have estimated metrics
    const fullLogs = logs.filter(l => !l.isPartial);
    if (fullLogs.length < 2) return;

    const parseDate = (dStr: string) => {
      const parts = dStr.split("/");
      if (parts.length !== 3) return 0;
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    };

    // Make sure they are chronological
    const sortedLogs = [...fullLogs].sort((a, b) => parseDate(a.date) - parseDate(b.date));

    const trainingSet: { inputs: number[]; targets: number[] }[] = [];

    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const yesterdayLog = sortedLogs[i];
      const todayLog = sortedLogs[i + 1];

      const inputs = SkinPredictorNetwork.extractFeatures(yesterdayLog, todayLog);

      const todayScore = calculateSkinScore(todayLog.metrics);
      const targetScore = todayScore / 100;
      const targetAcne = (todayLog.metrics.acne - 1) / 4;
      const targetRedness = (todayLog.metrics.redness - 1) / 4;

      trainingSet.push({
        inputs,
        targets: [targetScore, targetAcne, targetRedness]
      });
    }

    // Run gradient descent epochs
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const pair of trainingSet) {
        this.train(pair.inputs, pair.targets, 0.15);
      }
    }
  }

  // Computes next-day prediction based on today's logs
  public getForecast(
    yesterdayLog: DiaryLog | null,
    todayLog: DiaryLog,
    userProfile: { concerns: string[]; skinType: string; barrierStatus?: string }
  ): { score: number; acne: number; redness: number; riskFactors: string[] } {
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

    const inputs = SkinPredictorNetwork.extractFeatures(baselineYesterdayLog, adjustedTodayLog);
    const rawOutputs = this.predict(inputs);

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

    return {
      score,
      acne,
      redness,
      riskFactors
    };
  }
}
