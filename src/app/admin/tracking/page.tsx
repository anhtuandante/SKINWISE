"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  Activity,
  Users,
  Compass,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronRight,
  ShoppingBag,
  Info
} from "lucide-react";

interface TrackedEvent {
  id: string;
  session_id: string;
  event_name: string;
  page_path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  created_at: string;
  fallback_log?: boolean;
  db_error?: string | null;
}

const COLORS = ["#C4A882", "#8B7355", "#E8DDD0", "#3E3E3F", "#A3A3A3", "#5C5C5D"];

// Admin email whitelist — only these emails can access the tracking dashboard
const ADMIN_EMAILS = [
  "tuandante@gmail.com",
  "admin@skinwise.vn",
];

export default function TrackingDashboard() {
  const [events, setEvents] = useState<TrackedEvent[]>([]);
  const [source, setSource] = useState("database");
  const [dbError, setDbError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<TrackedEvent | null>(null);

  // Auth guard state
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/track");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setSource(data.source || "database");
        setDbError(data.db_error || null);
      }
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Compute KPIs
  const stats = useMemo(() => {
    if (events.length === 0) return {
      totalViews: 0,
      totalSessions: 0,
      quizStarts: 0,
      quizCompletions: 0,
      completionRate: 0,
      faceScans: 0,
      aiChats: 0,
      conflicts: 0
    };

    const totalViews = events.filter(e => e.event_name === "page_view").length;
    const sessionIds = new Set(events.map(e => e.session_id));
    const quizStarts = events.filter(e => e.event_name === "quiz_start").length;
    const quizCompletions = events.filter(e => e.event_name === "quiz_complete").length;
    const faceScans = events.filter(e => e.event_name === "ai_face_scan_success").length;
    const aiChats = events.filter(e => e.event_name === "ai_chat_send").length;
    const conflicts = events.filter(e => e.event_name === "conflict_detected").length;

    const completionRate = quizStarts > 0 ? Math.round((quizCompletions / quizStarts) * 100) : 0;

    return {
      totalViews,
      totalSessions: sessionIds.size,
      quizStarts,
      quizCompletions,
      completionRate,
      faceScans,
      aiChats,
      conflicts
    };
  }, [events]);

  // Compute Funnel Data
  const funnelData = useMemo(() => {
    const steps = [
      { name: "Khởi động Quiz", count: events.filter(e => e.event_name === "quiz_start").length },
      { name: "Bước 1: Độ tuổi", count: events.filter(e => e.event_name === "quiz_step_view" && e.metadata.step === 1).length },
      { name: "Bước 2: Loại da", count: events.filter(e => e.event_name === "quiz_step_view" && e.metadata.step === 2).length },
      { name: "Bước 3: Vấn đề da", count: events.filter(e => e.event_name === "quiz_step_view" && e.metadata.step === 3).length },
      { name: "Bước 4: Độ nhạy cảm", count: events.filter(e => e.event_name === "quiz_step_view" && e.metadata.step === 4).length },
      { name: "Bước 5: Ngân sách", count: events.filter(e => e.event_name === "quiz_step_view" && e.metadata.step === 5).length },
      { name: "Bước 6: Chu kỳ", count: events.filter(e => e.event_name === "quiz_step_view" && e.metadata.step === 6).length },
      { name: "Hoàn thành", count: events.filter(e => e.event_name === "quiz_complete").length }
    ];
    
    // Normalize step counts to make sure funnel flows correctly
    // If step 1 view is missing, use start quiz as base
    if (steps[0].count > 0 && steps[1].count === 0) {
      steps[1].count = steps[0].count; // Mock / fallbacks if route view not captured
    }

    return steps;
  }, [events]);

  // Compute Skin Types Distribution
  const skinTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    events
      .filter(e => e.event_name === "quiz_complete" && e.metadata && e.metadata.skinType)
      .forEach(e => {
        const t = e.metadata.skinType;
        types[t] = (types[t] || 0) + 1;
      });

    const skinTypeLabels: Record<string, string> = {
      oily: "Da dầu",
      dry: "Da khô",
      combination: "Da hỗn hợp",
      sensitive: "Da nhạy cảm",
      normal: "Da thường"
    };

    return Object.entries(types).map(([key, val]) => ({
      name: skinTypeLabels[key] || key,
      value: val
    }));
  }, [events]);

  // Compute Skin Concerns Distribution
  const concernData = useMemo(() => {
    const concerns: Record<string, number> = {};
    events
      .filter(e => e.event_name === "quiz_complete" && e.metadata && Array.isArray(e.metadata.concerns))
      .forEach(e => {
        e.metadata.concerns.forEach((c: string) => {
          concerns[c] = (concerns[c] || 0) + 1;
        });
      });

    const concernLabels: Record<string, string> = {
      acne: "Trị mụn",
      pores: "Lỗ chân lông",
      dryness: "Khô ráp",
      aging: "Lão hóa",
      dark_spots: "Thâm sạm",
      redness: "Mẩn đỏ/Nhạy cảm",
      dullness: "Xỉn màu",
      oiliness: "Dầu thừa"
    };

    return Object.entries(concerns)
      .map(([key, val]) => ({
        name: concernLabels[key] || key,
        count: val
      }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  // Compute Top Shopee Clicks
  const topProducts = useMemo(() => {
    const clicks: Record<string, { id: string; name: string; brand: string; count: number; category: string }> = {};
    events
      .filter(e => e.event_name === "shopee_click" && e.metadata)
      .forEach(e => {
        const { productId, name, brand, category } = e.metadata;
        const key = productId || name;
        if (!key) return;
        if (!clicks[key]) {
          clicks[key] = { id: productId, name, brand, category, count: 0 };
        }
        clicks[key].count++;
      });

    return Object.values(clicks).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [events]);

  // Compute Top Search Queries
  const topSearches = useMemo(() => {
    const searches: Record<string, number> = {};
    events
      .filter(e => e.event_name === "ingredient_search" && e.metadata && e.metadata.query)
      .forEach(e => {
        const q = e.metadata.query.trim().toLowerCase();
        if (q) {
          searches[q] = (searches[q] || 0) + 1;
        }
      });

    return Object.entries(searches)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [events]);

  // Compute Top Conflict Warnings
  const topConflicts = useMemo(() => {
    const conflicts: Record<string, { pair: string; reason: string; severity: string; count: number }> = {};
    events
      .filter(e => e.event_name === "conflict_detected" && e.metadata)
      .forEach(e => {
        const { itemA, itemB, severity, reason } = e.metadata;
        const pair = `${itemA} × ${itemB}`;
        if (!conflicts[pair]) {
          conflicts[pair] = { pair, reason: reason || "", severity: severity || "high", count: 0 };
        }
        conflicts[pair].count++;
      });

    return Object.values(conflicts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [events]);

  // Daily Event Trend Data
  const trendData = useMemo(() => {
    const days: Record<string, { date: string; events: number; pageviews: number }> = {};
    
    // Last 7 days template
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" });
      days[dateStr] = { date: dateStr, events: 0, pageviews: 0 };
    }

    events.forEach(e => {
      const date = new Date(e.created_at);
      const dateStr = date.toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" });
      if (days[dateStr]) {
        days[dateStr].events++;
        if (e.event_name === "page_view") {
          days[dateStr].pageviews++;
        }
      }
    });

    return Object.values(days);
  }, [events]);

  // Unique Event Names List for filter
  const eventNames = useMemo(() => {
    return Array.from(new Set(events.map(e => e.event_name))).sort();
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (filterEvent === "all") return events.slice(0, 150);
    return events.filter(e => e.event_name === filterEvent).slice(0, 150);
  }, [events, filterEvent]);

  // Auth guard: show loading or access denied
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#C4A882] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#8B8B8B] font-medium">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Truy cập bị từ chối</h1>
          <p className="text-sm text-[#8B8B8B]">
            Bạn không có quyền truy cập trang quản trị này. Vui lòng đăng nhập bằng tài khoản admin.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-[#C4A882] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md border-b border-[#EADFD2] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SkinWise Logo" className="w-9 h-9 rounded-xl object-contain bg-white border border-line" />
            <div>
              <h1 className="text-body font-bold tracking-tight">SkinWise Analytics</h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted opacity-80 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-[#C4A882] rounded-full"></span>
                Admin Panel · Mode: {source === "database" ? "Supabase Live" : "Local Logs fallback"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/quiz"
              className="text-caption font-bold text-[#C4A882] hover:text-[#8B7355] transition-colors"
            >
              Vào Quiz
            </Link>
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="p-2 border border-[#EADFD2] rounded-xl hover:bg-[#C4A882]/5 transition-all text-[#C4A882] hover:border-[#C4A882] disabled:opacity-50"
              title="Tải lại dữ liệu"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {dbError && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-caption flex items-start gap-3 shadow-soft">
            <AlertTriangle className="shrink-0 text-amber-600 mt-0.5" size={16} />
            <div>
              <span className="font-bold">Lưu ý kết nối:</span> {dbError}. Hệ thống đang tự động fallback và tải lịch sử sự kiện lưu trữ cục bộ. Hãy chạy tập lệnh SQL trên bảng điều khiển Supabase của bạn để kích hoạt cơ sở dữ liệu live tracking.
            </div>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Activity className="text-[#C4A882]" size={20} />}
            label="Lượt Xem Trang"
            value={stats.totalViews}
            desc="Tổng số pageviews được ghi nhận"
          />
          <KpiCard
            icon={<Users className="text-[#C4A882]" size={20} />}
            label="Phiên Truy Cập"
            value={stats.totalSessions}
            desc="Số lượng thiết bị/trình duyệt độc nhất"
          />
          <KpiCard
            icon={<Compass className="text-[#C4A882]" size={20} />}
            label="Hoàn Thành Quiz"
            value={stats.quizCompletions}
            desc={`Tỷ lệ chuyển đổi: ${stats.completionRate}% (Khởi động: ${stats.quizStarts})`}
          />
          <KpiCard
            icon={<Sparkles className="text-[#C4A882]" size={20} />}
            label="Tương Tác AI"
            value={stats.aiChats + stats.faceScans}
            desc={`Face-scan: ${stats.faceScans} · Chatbot: ${stats.aiChats}`}
          />
        </div>

        {/* Funnel & Traffic Trend */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quiz Funnel */}
          <div className="lg:col-span-1 border border-[#EADFD2] rounded-2xl p-6 bg-white flex flex-col shadow-soft">
            <h3 className="text-caption font-bold uppercase tracking-wider text-muted mb-4">
              Phễu Chuyển Đổi Quiz
            </h3>
            {stats.quizStarts === 0 ? (
              <NoDataPlaceholder text="Chưa có lượt thực hiện Quiz để thống kê phễu." />
            ) : (
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {funnelData.map((step, idx) => {
                  const percent = stats.quizStarts > 0 ? Math.round((step.count / stats.quizStarts) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-caption font-medium">
                        <span className="truncate">{step.name}</span>
                        <span className="text-muted font-bold">
                          {step.count} ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 bg-[#F5EFE6] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C4A882] rounded-full"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Line Chart: Event Trend */}
          <div className="lg:col-span-2 border border-[#EADFD2] rounded-2xl p-6 bg-white shadow-soft">
            <h3 className="text-caption font-bold uppercase tracking-wider text-muted mb-4">
              Biểu Đồ Lượt Xem và Hoạt Động (7 Ngày qua)
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E5D8" />
                  <XAxis dataKey="date" stroke="#8B7355" fontSize={12} />
                  <YAxis stroke="#8B7355" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FDFCFB",
                      borderColor: "#EADFD2",
                      borderRadius: "12px",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    name="Tổng Sự Kiện"
                    dataKey="events"
                    stroke="#C4A882"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    name="Xem Trang"
                    dataKey="pageviews"
                    stroke="#8B7355"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Distributions: Skin Types & Concerns */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Skin Type Pie Chart */}
          <div className="border border-[#EADFD2] rounded-2xl p-6 bg-white shadow-soft">
            <h3 className="text-caption font-bold uppercase tracking-wider text-muted mb-4">
              Phân Phối Loại Da (Quiz)
            </h3>
            {skinTypeData.length === 0 ? (
              <NoDataPlaceholder text="Chưa có dữ liệu loại da được ghi nhận." />
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skinTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {skinTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FDFCFB",
                        borderColor: "#EADFD2",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Skin Concerns Bar Chart */}
          <div className="border border-[#EADFD2] rounded-2xl p-6 bg-white shadow-soft">
            <h3 className="text-caption font-bold uppercase tracking-wider text-muted mb-4">
              Mối Quan Tâm Da Phổ Biến
            </h3>
            {concernData.length === 0 ? (
              <NoDataPlaceholder text="Chưa có mối quan tâm da được ghi nhận." />
            ) : (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={concernData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0E5D8" horizontal={false} />
                    <XAxis type="number" stroke="#8B7355" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#8B7355" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FDFCFB",
                        borderColor: "#EADFD2",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="count" name="Số người chọn" fill="#C4A882" radius={[0, 4, 4, 0]}>
                      {concernData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Metrics Tables */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Shopee Clicks */}
          <div className="border border-[#EADFD2] rounded-2xl p-6 bg-white shadow-soft flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-caption font-bold uppercase tracking-wider text-muted">
                Mua Sắm Hot (Shopee Clicks)
              </h3>
              <ShoppingBag size={16} className="text-[#C4A882]" />
            </div>
            {topProducts.length === 0 ? (
              <NoDataPlaceholder text="Chưa ghi nhận click sản phẩm Shopee." />
            ) : (
              <div className="divide-y divide-[#EADFD2]/50 flex-1">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-caption font-bold text-fg truncate">{p.name}</div>
                      <div className="text-[10px] text-muted font-medium">{p.brand}</div>
                    </div>
                    <span className="shrink-0 text-caption font-bold bg-[#C4A882]/10 text-[#8B7355] px-2 py-0.5 rounded-full">
                      {p.count} clicks
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Searched Ingredients */}
          <div className="border border-[#EADFD2] rounded-2xl p-6 bg-white shadow-soft flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-caption font-bold uppercase tracking-wider text-muted">
                Thành Phần Tra Cứu Nhiều Nhất
              </h3>
              <Search size={16} className="text-[#C4A882]" />
            </div>
            {topSearches.length === 0 ? (
              <NoDataPlaceholder text="Chưa ghi nhận truy vấn tra cứu thành phần." />
            ) : (
              <div className="divide-y divide-[#EADFD2]/50 flex-1">
                {topSearches.map((s, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 last:pb-0">
                    <span className="text-caption font-bold text-fg capitalize truncate">
                      &quot;{s.query}&quot;
                    </span>
                    <span className="shrink-0 text-caption font-bold bg-[#8B7355]/10 text-[#8B7355] px-2 py-0.5 rounded-full">
                      {s.count} lượt
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Conflict Warnings */}
          <div className="border border-[#EADFD2] rounded-2xl p-6 bg-white shadow-soft flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-caption font-bold uppercase tracking-wider text-muted">
                Xung Đột Kích Hoạt Nhiều Nhất
              </h3>
              <AlertTriangle size={16} className="text-[#C4A882]" />
            </div>
            {topConflicts.length === 0 ? (
              <NoDataPlaceholder text="Chưa phát hiện xung đột nào được kích hoạt." />
            ) : (
              <div className="divide-y divide-[#EADFD2]/50 flex-1">
                {topConflicts.map((c, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-caption font-bold text-fg truncate">{c.pair}</div>
                      <div className="text-[10px] text-muted truncate">{c.reason}</div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      c.severity === "high" ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                      {c.count} lần
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Event Log */}
        <div className="border border-[#EADFD2] rounded-2xl bg-white overflow-hidden shadow-soft">
          <div className="p-6 border-b border-[#EADFD2] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-caption font-bold uppercase tracking-wider text-muted">
                Nhật Ký Sự Kiện Thời Gian Thực (Mới Nhất)
              </h3>
              <p className="text-[11px] text-muted font-medium mt-0.5">
                Hiển thị tối đa 150 hoạt động gần nhất của người dùng
              </p>
            </div>
            
            {/* Filter controls */}
            <div className="flex gap-2">
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="bg-[#FDFCFB] border border-[#EADFD2] rounded-xl px-3 py-2 text-caption outline-none focus:border-[#C4A882] transition-colors"
              >
                <option value="all">Tất cả sự kiện</option>
                {eventNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#EADFD2]">
            {/* Events List Table */}
            <div className="lg:col-span-2 overflow-x-auto max-h-[450px] overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-caption text-muted">
                  Không tìm thấy sự kiện nào trùng khớp.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FDFCFB] border-b border-[#EADFD2] text-[10px] font-extrabold uppercase tracking-wider text-muted">
                      <th className="p-4">Thời gian</th>
                      <th className="p-4">Sự kiện</th>
                      <th className="p-4">Đường dẫn</th>
                      <th className="p-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADFD2]/30 text-caption font-medium">
                    {filteredEvents.map((e) => (
                      <tr 
                        key={e.id} 
                        className={`hover:bg-[#C4A882]/5 cursor-pointer transition-colors ${selectedEvent?.id === e.id ? "bg-[#C4A882]/10" : ""}`}
                        onClick={() => setSelectedEvent(e)}
                      >
                        <td className="p-4 text-muted whitespace-nowrap">
                          {new Date(e.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-[#FDFCFB] border-[#EADFD2] text-[#8B7355]">
                            {e.event_name}
                          </span>
                        </td>
                        <td className="p-4 text-muted truncate max-w-[150px]">
                          {e.page_path}
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-[#C4A882] hover:text-[#8B7355] flex items-center gap-0.5 ml-auto text-[11px] font-bold">
                            Xem <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Event Payload Viewer */}
            <div className="lg:col-span-1 p-6 bg-[#FDFCFB] flex flex-col justify-between min-h-[300px]">
              {selectedEvent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EADFD2] pb-3">
                    <h4 className="text-caption font-bold text-fg">Chi tiết sự kiện</h4>
                    <span className="text-[10px] text-muted font-bold">ID: {selectedEvent.id.slice(0, 8)}...</span>
                  </div>
                  
                  <div className="space-y-2 text-caption">
                    <div className="flex justify-between">
                      <span className="text-muted">Sự kiện:</span>
                      <span className="font-bold">{selectedEvent.event_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Đường dẫn:</span>
                      <span className="font-medium text-right font-mono truncate max-w-[200px]" title={selectedEvent.page_path}>
                        {selectedEvent.page_path}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Session ID:</span>
                      <span className="font-mono text-muted text-[10px] truncate max-w-[150px]" title={selectedEvent.session_id}>
                        {selectedEvent.session_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Thời gian:</span>
                      <span className="font-medium">
                        {new Date(selectedEvent.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-caption text-muted block">Metadata (Dữ liệu đính kèm):</span>
                    <pre className="p-3 bg-white border border-[#EADFD2] rounded-xl text-[11px] text-[#3E3E3F] overflow-x-auto font-mono max-h-[200px]">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-caption text-muted flex-1">
                  <Info size={28} className="text-[#C4A882]/60 mb-2" />
                  <p className="font-bold">Chưa chọn sự kiện</p>
                  <p className="text-[11px] max-w-[200px] mt-1 font-medium">
                    Hãy bấm vào một dòng sự kiện bên trái để xem dữ liệu JSON chi tiết.
                  </p>
                </div>
              )}
              
              <div className="border-t border-[#EADFD2] pt-4 mt-4 text-[10px] text-muted font-medium text-center">
                Mỗi sự kiện tự động thu thập Session ID để theo dõi phễu mà không vi phạm quyền riêng tư.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ icon, label, value, desc }: { icon: React.ReactNode; label: string; value: number | string; desc: string }) {
  return (
    <div className="border border-[#EADFD2] rounded-2xl p-6 bg-white flex flex-col justify-between shadow-soft">
      <div className="flex justify-between items-center mb-3">
        <span className="text-caption font-bold text-[#8B7355]">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-[#C4A882]/5 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-tight text-[#1A1A1A]">
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
        </div>
        <div className="text-[11px] text-muted font-medium mt-1 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

function NoDataPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-caption text-muted">
      <div className="w-12 h-12 rounded-full border border-dashed border-[#C4A882] flex items-center justify-center text-[#C4A882] mb-3">
        📊
      </div>
      <p className="font-bold text-[#8B7355]">{text}</p>
      <p className="text-[11px] max-w-[220px] mt-1 font-medium">
        Hãy mở trang web ở một tab khác, trải nghiệm các tính năng và quay lại đây.
      </p>
    </div>
  );
}
