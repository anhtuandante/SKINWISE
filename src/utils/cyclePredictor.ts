export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface CycleInfo {
  phase: CyclePhase;
  day: number;
  label: string;
  desc: string;
  advice: string;
}

export function getCyclePhase(
  startDateStr?: string,
  cycleLength: number = 28
): CycleInfo | null {
  if (!startDateStr) return null;

  const start = new Date(startDateStr);
  const today = new Date();
  
  // Set times to midnight for date-only comparison
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - start.getTime();
  if (diffTime < 0) {
    return null;
  }

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentDay = (diffDays % cycleLength) + 1;

  let phase: CyclePhase = "follicular";
  let label = "Pha nang trứng (Follicular)";
  let desc = "Lượng estrogen tăng lên giúp da căng bóng, khỏe mạnh và giữ nước tốt nhất.";
  let advice = "Thời điểm tốt nhất để bổ sung dưỡng chất hoặc sử dụng hoạt chất dưỡng sáng nhẹ.";

  if (currentDay >= 1 && currentDay <= 5) {
    phase = "menstrual";
    label = "Pha hành kinh (Menstrual)";
    desc = "Nồng độ nội tiết tố giảm xuống mức thấp nhất, da nhạy cảm, dễ khô rát và mỏng yếu.";
    advice = "Ưu tiên làm sạch dịu nhẹ và cấp ẩm sâu với B5, HA, Ceramide. Tránh treatment nặng.";
  } else if (currentDay >= 6 && currentDay <= 11) {
    phase = "follicular";
    label = "Pha nang trứng (Follicular)";
    desc = "Da ở trạng thái cân bằng và khỏe mạnh nhất trong chu kỳ.";
    advice = "Có thể duy trì routine tẩy da chết hoặc thử nghiệm các sản phẩm mới.";
  } else if (currentDay >= 12 && currentDay <= 16) {
    phase = "ovulatory";
    label = "Pha rụng trứng (Ovulatory)";
    desc = "Estrogen đạt đỉnh, da căng mịn nhưng bắt đầu tăng nhẹ bã nhờn.";
    advice = "Tập trung làm sạch sâu để ngăn ngừa bít tắc lỗ chân lông cuối ngày.";
  } else {
    phase = "luteal";
    label = "Pha hoàng thể (Luteal)";
    desc = "Progesterone tăng vọt kích thích tuyến bã nhờn hoạt động mạnh, da đổ dầu và rất dễ nổi mụn nội tiết.";
    advice = "Tăng cường làm sạch sâu. Tích cực dùng BHA kiềm dầu và các sản phẩm gel mỏng nhẹ.";
  }

  return {
    phase,
    day: currentDay,
    label,
    desc,
    advice
  };
}
