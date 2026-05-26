"use client";

import { useState, useMemo, useCallback } from "react";
import { FlaskConical, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

const LAB_ACTIVE_INGREDIENTS = [
  { id: "retinol", name: "Retinol", nameVi: "Retinol (Chống lão hóa/Trị mụn)" },
  { id: "bha", name: "Salicylic Acid (BHA)", nameVi: "Salicylic Acid (BHA - Tẩy da chết)" },
  { id: "aha", name: "Glycolic/Lactic Acid (AHA)", nameVi: "AHA (Tẩy da chết bề mặt)" },
  { id: "vitamin-c", name: "Vitamin C (L-Ascorbic Acid)", nameVi: "Vitamin C (Sáng da/Trị thâm)" },
  { id: "niacinamide", name: "Niacinamide (Vitamin B3)", nameVi: "Niacinamide (Phục hồi/Kiểm soát dầu)" },
  { id: "benzoyl-peroxide", name: "Benzoyl Peroxide", nameVi: "Benzoyl Peroxide (Trị mụn viêm)" },
  { id: "hyaluronic-acid", name: "Hyaluronic Acid (HA)", nameVi: "Hyaluronic Acid (Cấp nước)" },
  { id: "peptide", name: "Peptides", nameVi: "Peptides (Tăng đàn hồi/Trẻ hóa)" },
  { id: "ceramide", name: "Ceramides", nameVi: "Ceramides (Bảo vệ hàng rào da)" },
  { id: "centella", name: "Centella Asiatica (Rau má)", nameVi: "Rau má (Làm dịu da)" }
];

export default function SafetyLabPanel() {
  const [safetyMode, setSafetyMode] = useState<"pair" | "full">("pair");
  const [ingA, setIngA] = useState("");
  const [ingB, setIngB] = useState("");
  const [safetyMorningIngs, setSafetyMorningIngs] = useState<string[]>([]);
  const [safetyNightIngs, setSafetyNightIngs] = useState<string[]>([]);

  // Load rules from conflicts JSON
  const rawConflicts = useMemo(() => {
    return {
      danger: [
        ["retinol", "bha"], ["retinol", "aha"], ["benzoyl-peroxide", "retinol"],
        ["retinol", "benzoyl-peroxide"], ["bha", "retinol"], ["aha", "retinol"]
      ],
      warning: [
        ["vitamin-c", "niacinamide"], ["niacinamide", "vitamin-c"],
        ["retinol", "vitamin-c"], ["vitamin-c", "retinol"],
        ["aha", "vitamin-c"], ["vitamin-c", "aha"],
        ["bha", "vitamin-c"], ["vitamin-c", "bha"],
        ["aha", "bha"], ["bha", "aha"]
      ]
    };
  }, []);

  const checkLabIngredients = useCallback((a: string, b: string) => {
    if (!a || !b || a === b) return null;
    const isDanger = rawConflicts.danger.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    if (isDanger) return "danger";
    const isWarning = rawConflicts.warning.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    if (isWarning) return "warning";
    return "safe";
  }, [rawConflicts]);

  const currentPairResult = useMemo(() => {
    return checkLabIngredients(ingA, ingB);
  }, [ingA, ingB, checkLabIngredients]);

  const fullSafetyIssues = useMemo(() => {
    const issues: { level: "danger" | "warning"; text: string }[] = [];
    const checkList = (list: string[], routineLabel: string) => {
      list.forEach((a, i) => {
        list.slice(i + 1).forEach((b) => {
          const r = checkLabIngredients(a, b);
          const nameA = LAB_ACTIVE_INGREDIENTS.find((x) => x.id === a)?.name || a;
          const nameB = LAB_ACTIVE_INGREDIENTS.find((x) => x.id === b)?.name || b;
          if (r === "danger") {
            issues.push({ level: "danger", text: `[${routineLabel}] ${nameA} + ${nameB}: Xung đột nghiêm trọng! Tuyệt đối không dùng chung một buổi.` });
          } else if (r === "warning") {
            issues.push({ level: "warning", text: `[${routineLabel}] ${nameA} + ${nameB}: Có nguy cơ kích ứng. Cần dùng cách nhau 15-20 phút hoặc chia sáng/tối.` });
          }
        });
      });
    };
    checkList(safetyMorningIngs, "Sáng");
    checkList(safetyNightIngs, "Tối");
    return issues;
  }, [safetyMorningIngs, safetyNightIngs, checkLabIngredients]);

  const toggleSafetyIng = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    if (list.includes(val)) {
      setList(list.filter((x) => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-950 to-slate-900 rounded-[32px] p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical size={18} className="text-violet-400" />
          <span className="text-violet-400 text-caption font-bold uppercase tracking-wider">Routine Safety Lab</span>
        </div>
        <h2 className="text-headline font-light mb-1">Kiểm tra kết hợp hoạt chất</h2>
        <p className="text-slate-300 text-caption">Tránh kích ứng da bằng cách kiểm tra các thành phần mỹ phẩm tương khắc trước khi thoa lên mặt.</p>
      </div>

      {/* Mode switch */}
      <div className="flex bg-surface rounded-2xl p-1 gap-1 border border-line">
        <button
          onClick={() => setSafetyMode("pair")}
          className={`flex-1 py-2.5 rounded-xl text-caption font-bold transition-all ${
            safetyMode === "pair" ? "bg-white text-fg shadow-soft" : "text-muted hover:text-fg"
          }`}
        >
          Kiểm tra cặp hoạt chất
        </button>
        <button
          onClick={() => setSafetyMode("full")}
          className={`flex-1 py-2.5 rounded-xl text-caption font-bold transition-all ${
            safetyMode === "full" ? "bg-white text-fg shadow-soft" : "text-muted hover:text-fg"
          }`}
        >
          Kiểm tra cả Routine sáng/tối
        </button>
      </div>

      {safetyMode === "pair" ? (
        // Mode 1: Pair check
        <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">Hoạt chất 1</label>
              <select
                value={ingA}
                onChange={(e) => setIngA(e.target.value)}
                className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-caption text-fg font-medium outline-none focus:border-fg transition-all"
              >
                <option value="">Chọn hoạt chất đầu tiên</option>
                {LAB_ACTIVE_INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">Hoạt chất 2</label>
              <select
                value={ingB}
                onChange={(e) => setIngB(e.target.value)}
                className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-caption text-fg font-medium outline-none focus:border-fg transition-all"
              >
                <option value="">Chọn hoạt chất thứ hai</option>
                {LAB_ACTIVE_INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result display */}
          <div className="pt-4 border-t border-line">
            {!ingA || !ingB ? (
              <div className="py-8 text-center text-caption text-muted border border-dashed border-line rounded-xl bg-surface/50">
                Chọn 2 hoạt chất ở trên để hiển thị phân tích tương thích hóa học.
              </div>
            ) : ingA === ingB ? (
              <div className="py-4 text-center text-caption text-warning bg-warning/5 border border-warning/15 rounded-xl">
                Vui lòng chọn 2 hoạt chất khác nhau để so sánh.
              </div>
            ) : currentPairResult === "danger" ? (
              <div className="p-5 border border-danger/25 bg-danger/[0.02] text-danger rounded-xl space-y-2 animate-in">
                <div className="flex items-center gap-2 font-bold text-body">
                  <AlertTriangle size={18} />
                  <span>DANGER - XUNG ĐỘT NGHIÊM TRỌNG</span>
                </div>
                <p className="text-caption text-muted leading-relaxed">
                  Tuyệt đối không nên dùng chung trong cùng một buổi. Hai thành phần này hoạt động ở môi trường pH khác nhau hoặc có đặc tính tẩy lột quá mạnh. Kết hợp trực tiếp sẽ làm tổn thương lớp màng ẩm lipit, gây bong tróc nặng, đỏ rát và có thể bùng mụn dị ứng.
                </p>
                <div className="text-caption text-muted pt-2 border-t border-danger/10">
                  <strong>Gợi ý khắc phục:</strong> Dùng chất này buổi sáng, chất kia buổi tối, hoặc luân phiên cách ngày trong tuần.
                </div>
              </div>
            ) : currentPairResult === "warning" ? (
              <div className="p-5 border border-warning/25 bg-warning/[0.02] text-warning rounded-xl space-y-2 animate-in">
                <div className="flex items-center gap-2 font-bold text-body">
                  <AlertCircle size={18} />
                  <span>WARNING - CẦN CẨN TRỌNG</span>
                </div>
                <p className="text-caption text-muted leading-relaxed">
                  Sự kết hợp này có thể gây khô hoặc đỏ nhẹ cho nền da nhạy cảm hoặc hàng rào da đang yếu. Với nền da khỏe hoặc đã làm quen với hoạt chất lâu ngày, việc kết hợp này vẫn có thể thực hiện nếu sử dụng đúng cách.
                </p>
                <div className="text-caption text-muted pt-2 border-t border-warning/10">
                  <strong>Gợi ý khắc phục:</strong> Chờ sản phẩm thứ nhất thẩm thấu khô hoàn toàn (15-20 phút) rồi mới thoa sản phẩm thứ hai, hoặc giãn tần suất dùng.
                </div>
              </div>
            ) : (
              <div className="p-5 border border-success/25 bg-success/[0.02] text-success rounded-xl space-y-2 animate-in">
                <div className="flex items-center gap-2 font-bold text-body">
                  <CheckCircle2 size={18} />
                  <span>SAFE - KẾT HỢP AN TOÀN / BỔ TRỢ TỐT</span>
                </div>
                <p className="text-caption text-muted leading-relaxed">
                  Không tìm thấy xung đột hóa học nào. Sự kết hợp này hoạt động rất êm dịu trên da, thường tương hỗ lẫn nhau để sửa chữa hàng rào da, tăng hiệu quả cấp nước phục hồi hoặc làm dịu các tác dụng phụ của treatment.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Mode 2: Full routine check
        <div className="border border-line rounded-[24px] p-6 bg-white shadow-soft space-y-6">
          <div className="space-y-5">
            <div className="space-y-2.5">
              <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">☀️ Hoạt chất có trong routine SÁNG</label>
              <div className="flex flex-wrap gap-2">
                {LAB_ACTIVE_INGREDIENTS.map((ing) => {
                  const active = safetyMorningIngs.includes(ing.id);
                  return (
                    <button
                      key={ing.id}
                      onClick={() => toggleSafetyIng(safetyMorningIngs, setSafetyMorningIngs, ing.id)}
                      className={`px-3 py-2 rounded-full border text-caption transition-all ${
                        active ? "bg-fg text-bg border-fg" : "bg-white text-muted border-line hover:border-fg/40"
                      }`}
                    >
                      {ing.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-caption font-bold text-muted uppercase tracking-wider block font-semibold">🌙 Hoạt chất có trong routine TỐI</label>
              <div className="flex flex-wrap gap-2">
                {LAB_ACTIVE_INGREDIENTS.map((ing) => {
                  const active = safetyNightIngs.includes(ing.id);
                  return (
                    <button
                      key={ing.id}
                      onClick={() => toggleSafetyIng(safetyNightIngs, setSafetyNightIngs, ing.id)}
                      className={`px-3 py-2 rounded-full border text-caption transition-all ${
                        active ? "bg-fg text-bg border-fg" : "bg-white text-muted border-line hover:border-fg/40"
                      }`}
                    >
                      {ing.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-line">
            {safetyMorningIngs.length === 0 && safetyNightIngs.length === 0 ? (
              <div className="py-8 text-center text-caption text-muted border border-dashed border-line rounded-xl bg-surface/50">
                Chọn các hoạt chất bạn đang dùng trong routine sáng hoặc tối ở trên để kiểm tra chéo xung đột.
              </div>
            ) : fullSafetyIssues.length === 0 ? (
              <div className="p-4 border border-success/20 bg-success/[0.02] text-success rounded-xl flex items-center gap-2 text-caption">
                <CheckCircle2 size={16} />
                <span>Tuyệt vời! Không phát hiện bất kỳ xung đột hoạt chất nào trong routine sáng/tối đã chọn.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-body font-bold text-fg flex items-center gap-2">
                  <AlertCircle size={16} className="text-danger" />
                  <span>Phát hiện {fullSafetyIssues.length} điểm xung đột:</span>
                </h4>
                <div className="space-y-2">
                  {fullSafetyIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border rounded-xl text-caption leading-relaxed flex items-start gap-2 ${
                        issue.level === "danger" ? "bg-danger/[0.02] border-danger/15 text-danger" : "bg-warning/[0.02] border-warning/15 text-warning"
                      }`}
                    >
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{issue.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
