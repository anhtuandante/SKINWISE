"use client";

import { useSkinStore } from "@/store/useSkinStore";
import { analyzeSkinTrends } from "@/utils/trendAnalysis";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const METRIC_LABELS: Record<string, string> = {
  acne: "Mụn",
  redness: "Mẩn đỏ",
  pores: "Lỗ chân lông",
  oiliness: "Dầu thừa",
  dryness: "Khô căng",
  barrierComfort: "Dễ chịu",
  texture: "Kết cấu"
};

const METRIC_COLORS: Record<string, string> = {
  acne: "#EF4444",         // Red
  redness: "#F97316",      // Orange
  pores: "#A855F7",        // Purple
  oiliness: "#EAB308",     // Yellow
  dryness: "#06B6D4",      // Cyan
  barrierComfort: "#10B981", // Green
  texture: "#EC4899"       // Pink
};

export default function TrendVisualizer() {
  const { diaryLogs, selectedRange, pinnedMetrics, setRange } = useSkinStore();

  // Compute trends and deltas
  const trends = useMemo(() => analyzeSkinTrends(diaryLogs), [diaryLogs]);

  // Filter logs based on selected range
  const chartData = useMemo(() => {
    // logs are already sorted ascending in useSkinStore
    let sliceCount = 7;
    if (selectedRange === "day") sliceCount = 3;
    else if (selectedRange === "week") sliceCount = 7;
    else if (selectedRange === "month") sliceCount = 30;

    const sliced = diaryLogs.slice(-sliceCount);

    return sliced.map((log) => ({
      name: selectedRange === "month" ? log.date.split("/").slice(0, 2).join("/") : log.dayName,
      ...log.metrics,
      // Map score for visualization
      score: 100 - ((log.metrics.acne + log.metrics.redness + (log.metrics.pores ?? 0) + log.metrics.oiliness) * 2)
    }));
  }, [diaryLogs, selectedRange]);

  return (
    <div className="bg-white border border-line rounded-[24px] p-6 shadow-soft space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-body font-bold text-fg flex items-center gap-2">
            Xu hướng chỉ số da
          </h3>
          <p className="text-caption text-muted">
            Biểu đồ theo dõi các hoạt chất và chỉ số sinh trắc học được ghim.
          </p>
        </div>

        {/* Segmented Range Controller */}
        <div className="flex bg-line/25 p-1 rounded-xl self-start sm:self-auto border border-line/10">
          {(["day", "week", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-micro font-bold capitalize transition-all",
                selectedRange === r ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
              )}
            >
              {r === "day" ? "3 Ngày" : r === "week" ? "Tuần" : "Tháng"}
            </button>
          ))}
        </div>
      </div>

      {/* Delta Trend Badges */}
      {diaryLogs.length >= 2 ? (
        <div className="flex flex-wrap gap-2.5">
          {pinnedMetrics.map((metric) => {
            const val = trends.delta[metric] ?? 0;
            const label = METRIC_LABELS[metric] || metric;
            const isBarrier = metric === "barrierComfort";
            
            // For barrier comfort: positive is good (green), negative is bad (red)
            // For others: positive is bad (red), negative is good (green)
            const isGood = isBarrier ? val >= 0 : val <= 0;
            const isNoChange = val === 0;

            return (
              <div
                key={metric}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-caption font-bold",
                  isNoChange
                    ? "bg-line/10 text-muted border-line"
                    : isGood
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                )}
              >
                {isNoChange ? (
                  <TrendingDown size={14} className="rotate-90 text-muted" />
                ) : isGood ? (
                  <TrendingDown size={14} className={cn(!isBarrier && "rotate-180")} />
                ) : (
                  <TrendingUp size={14} className={cn(isBarrier && "rotate-180")} />
                )}
                <span>
                  {isNoChange ? "" : val > 0 ? `+${val}` : val}{" "}
                  {label}
                </span>
              </div>
            );
          })}
          
          {/* Acne spike alert */}
          {trends.hasThreeDayAcneIncrease && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-500 px-3 py-1.5 rounded-xl text-caption font-bold flex items-center gap-1.5 animate-pulse col-span-2">
              ⚠️ Phát hiện bùng mụn liên tiếp 3 ngày!
            </div>
          )}
        </div>
      ) : (
        <div className="text-caption text-muted flex items-center gap-2 p-3 bg-line/10 rounded-xl">
          <HelpCircle size={14} /> Ghi nhật ký da ít nhất 2 ngày để so sánh xu hướng chỉ số da.
        </div>
      )}

      {/* Recharts Visualizer */}
      <div className="h-[260px] w-full mt-4">
        {diaryLogs.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center border border-dashed border-line/60 rounded-2xl bg-line/5">
            <span className="text-caption text-muted">Chưa có dữ liệu nhật ký da</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                {pinnedMetrics.map((metric) => (
                  <linearGradient key={metric} id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={METRIC_COLORS[metric]} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={METRIC_COLORS[metric]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717A", fontSize: 10, fontWeight: "bold" }}
              />
              <YAxis
                domain={[0, 10]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717A", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0A0B",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  color: "#FFFFFF",
                  fontSize: "11px",
                }}
                labelStyle={{ fontWeight: "bold", color: "#A1A1AA", marginBottom: "4px" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[10px] text-muted font-bold capitalize mr-2">
                    {METRIC_LABELS[value] || value}
                  </span>
                )}
              />
              {pinnedMetrics.map((metric) => (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={METRIC_COLORS[metric]}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#grad-${metric})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
