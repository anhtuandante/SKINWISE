"use client";

import { useState } from "react";
import { useUserStore } from "@/store/user-store";
import { useToastStore } from "@/store/toast-store";
import { trackEvent } from "@/lib/tracking";
import { 
  Check, 
  X, 
  ShieldCheck, 
  CreditCard, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PricingPanel() {
  const { plan = "free", setPlan } = useUserStore();
  const addToast = useToastStore((s) => s.addToast);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<"smart" | "premium" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "card">("qr");
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const plans = [
    {
      id: "free",
      name: "Gói Free",
      price: "0đ",
      desc: "Trải nghiệm chăm sóc da cơ bản",
      features: [
        { name: "Làm quiz chẩn đoán da cơ bản", available: true },
        { name: "Đề xuất routine tiêu chuẩn", available: true },
        { name: "Tra cứu bách khoa thành phần", available: true },
        { name: "Cá nhân hóa routine chuyên sâu", available: false },
        { name: "Nhắc lịch skincare AM/PM", available: false },
        { name: "Theo dõi tiến trình & biểu đồ da", available: false },
        { name: "Phát hiện xung đột hoạt chất", available: false },
        { name: "Kiểm tra độ tương thích AI Match", available: false },
        { name: "Phân tích chuyên sâu (Safety Lab)", available: false },
      ],
      buttonText: "Gói mặc định",
      accentColor: "border-line",
    },
    {
      id: "smart",
      name: "Gói Smart",
      price: "49.000đ",
      desc: "Đồng hành cải thiện làn da thông minh",
      features: [
        { name: "Làm quiz chẩn đoán da cơ bản", available: true },
        { name: "Đề xuất routine tiêu chuẩn", available: true },
        { name: "Tra cứu bách khoa thành phần", available: true },
        { name: "Cá nhân hóa routine chuyên sâu", available: true },
        { name: "Nhắc lịch skincare AM/PM", available: true },
        { name: "Theo dõi tiến trình & biểu đồ da", available: true },
        { name: "Phát hiện xung đột hoạt chất", available: false },
        { name: "Kiểm tra độ tương thích AI Match", available: false },
        { name: "Phân tích chuyên sâu (Safety Lab)", available: false },
      ],
      buttonText: "Nâng cấp Smart",
      accentColor: "border-[#C4A882]/60 shadow-[0_8px_30px_rgb(196,168,130,0.08)]",
    },
    {
      id: "premium",
      name: "Gói Premium",
      price: "99.000đ",
      desc: "Trải nghiệm AI tối ưu & an toàn tuyệt đối",
      features: [
        { name: "Làm quiz chẩn đoán da cơ bản", available: true },
        { name: "Đề xuất routine tiêu chuẩn", available: true },
        { name: "Tra cứu bách khoa thành phần", available: true },
        { name: "Cá nhân hóa routine chuyên sâu", available: true },
        { name: "Nhắc lịch skincare AM/PM", available: true },
        { name: "Theo dõi tiến trình & biểu đồ da", available: true },
        { name: "Phát hiện xung đột hoạt chất", available: true },
        { name: "Kiểm tra độ tương thích AI Match", available: true },
        { name: "Phân tích chuyên sâu (Safety Lab)", available: true },
      ],
      buttonText: "Nâng cấp Premium",
      accentColor: "border-[#8B7355] shadow-[0_12px_40px_rgba(139,115,85,0.15)] bg-gradient-to-b from-white to-[#FAF6F0]/20",
    },
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === plan) return;
    
    if (planId === "free") {
      setLoadingPlan("free");
      setTimeout(() => {
        setPlan("free");
        setLoadingPlan(null);
        addToast("Đã chuyển về gói Free miễn phí.", "info");
        trackEvent("plan_change", { toPlan: "free" });
      }, 800);
      return;
    }

    // Smart or Premium requires checkout
    setCheckoutPlan(planId as "smart" | "premium");
  };

  const handleSimulatePayment = () => {
    if (!checkoutPlan) return;
    setSimulatingPayment(true);
    
    setTimeout(() => {
      setPlan(checkoutPlan);
      setSimulatingPayment(false);
      setCheckoutPlan(null);
      addToast(`Nâng cấp thành công gói ${checkoutPlan.toUpperCase()}! 🎉`, "success");
      trackEvent("plan_change", { toPlan: checkoutPlan, method: paymentMethod });
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Header section */}
      <div className="text-center space-y-3">
        <span className="text-micro font-bold text-accent-dark uppercase tracking-widest bg-accent-light/35 px-4 py-1.5 rounded-full">
          Hội viên SkinWise
        </span>
        <h2 className="text-display font-light text-fg leading-tight">
          Nâng tầm trải nghiệm <span className="font-semibold text-accent-dark">làn da</span>
        </h2>
        <p className="text-caption text-muted max-w-md mx-auto leading-relaxed">
          Đăng ký gói thành viên phù hợp để mở khóa các giải pháp cá nhân hóa chuẩn y khoa và công cụ phân tích AI độc quyền.
        </p>
      </div>

      {/* Plans comparison list */}
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {plans.map((p) => {
          const isActive = plan === p.id;
          return (
            <div 
              key={p.id}
              className={`border rounded-[28px] p-6 bg-white flex flex-col justify-between min-h-[500px] relative transition-all ${p.accentColor} ${
                isActive ? "ring-2 ring-[#C4A882]" : ""
              }`}
            >
              {isActive && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C4A882] text-white text-[9px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <ShieldCheck size={11} /> Gói hiện tại
                </div>
              )}

              {/* Package header */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-title font-extrabold text-fg">{p.name}</h3>
                  <p className="text-[11px] text-muted font-medium">{p.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-display font-semibold text-fg">{p.price}</span>
                  {p.id !== "free" && <span className="text-caption text-muted">/ tháng</span>}
                </div>
                
                {/* Action button */}
                <button
                  onClick={() => handleSelectPlan(p.id)}
                  disabled={isActive || loadingPlan !== null}
                  className={`w-full py-3.5 rounded-2xl text-caption font-bold transition-all flex items-center justify-center gap-2 ${
                    isActive 
                      ? "bg-surface border border-line text-muted cursor-default" 
                      : p.id === "premium"
                        ? "bg-fg text-bg hover:opacity-90 shadow-lg active:scale-[0.98]"
                        : "bg-[#FAF6F0] hover:bg-[#EADFD2] text-accent-dark active:scale-[0.98]"
                  }`}
                >
                  {loadingPlan === p.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isActive ? (
                    "Đang hoạt động"
                  ) : (
                    p.buttonText
                  )}
                </button>
              </div>

              {/* Separator line */}
              <div className="h-px bg-line/60 my-5" />

              {/* Feature check list */}
              <div className="flex-1 space-y-3.5">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Tính năng gồm có:</span>
                <ul className="space-y-3">
                  {p.features.map((f, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      {f.available ? (
                        <Check size={14} className="text-[#C4A882] shrink-0 mt-0.5" />
                      ) : (
                        <X size={14} className="text-line shrink-0 mt-0.5" />
                      )}
                      <span className={`text-[12px] leading-relaxed font-medium ${
                        f.available ? "text-[#3E3E3F]" : "text-slate-300 line-through"
                      }`}>
                        {f.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment / Checkout Simulator modal */}
      <AnimatePresence>
        {checkoutPlan && (
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-fg/5 border border-line/10 p-2 rounded-[2.5rem] max-w-md w-full shadow-2xl"
            >
              <div className="bg-white border border-line rounded-[calc(2.5rem-0.5rem)] p-6 space-y-6">
                
                {/* Checkout Header */}
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <h3 className="text-title font-bold text-fg">💳 Cổng thanh toán giả lập</h3>
                    <p className="text-[11px] text-muted mt-0.5">Xác nhận thanh toán nâng cấp gói hội viên</p>
                  </div>
                  <button 
                    onClick={() => setCheckoutPlan(null)} 
                    disabled={simulatingPayment}
                    className="p-1 text-muted hover:text-fg hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Billing Summary */}
                <div className="bg-[#FAF6F0] border border-[#EADFD2]/55 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-muted font-medium">Sản phẩm nâng cấp:</span>
                    <span className="text-caption font-bold text-fg">Gói {checkoutPlan.toUpperCase()} (Hội viên)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-muted font-medium">Chu kỳ gia hạn:</span>
                    <span className="text-caption font-medium text-fg">1 tháng (Tự động)</span>
                  </div>
                  <div className="h-px bg-line/50 my-1" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-caption font-bold text-fg">Tổng thanh toán:</span>
                    <span className="text-title font-black text-accent-dark">{checkoutPlan === "smart" ? "49.000đ" : "99.000đ"}</span>
                  </div>
                </div>

                {/* Payment Method Switcher */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Phương thức thanh toán</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("qr")}
                      className={`py-3 border rounded-xl font-bold text-caption flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === "qr"
                          ? "border-fg bg-surface text-fg"
                          : "border-line text-muted hover:text-fg"
                      }`}
                    >
                      📱 Mã QR (VietQR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`py-3 border rounded-xl font-bold text-caption flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === "card"
                          ? "border-fg bg-surface text-fg"
                          : "border-line text-muted hover:text-fg"
                      }`}
                    >
                      💳 Thẻ Quốc tế (Visa)
                    </button>
                  </div>
                </div>

                {/* Simulated payment area */}
                <div className="border border-line rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 min-h-[160px]">
                  {paymentMethod === "qr" ? (
                    <div className="text-center space-y-3">
                      <div className="w-28 h-28 bg-white border border-line rounded-xl flex items-center justify-center mx-auto p-1.5 shadow-sm">
                        {/* Mock QR Code */}
                        <div className="w-full h-full bg-slate-100 rounded border border-dashed flex flex-col items-center justify-center text-[10px] text-slate-400 font-mono">
                          <span>VietQR CODE</span>
                          <span className="text-[7px]">SkinWise Upgrade</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed font-medium">
                        Quét mã QR bằng App Ngân hàng bất kỳ để chuyển khoản giả lập.<br />
                        Số tiền: <strong className="text-fg">{checkoutPlan === "smart" ? "49.000đ" : "99.000đ"}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted uppercase block">Số thẻ (Giả lập)</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            disabled 
                            value="4111 2222 3333 4444" 
                            className="w-full bg-white border border-line rounded-xl py-2.5 px-3 text-caption outline-none select-none font-mono text-muted"
                          />
                          <CreditCard size={16} className="absolute right-3 top-3 text-muted" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted uppercase block">Ngày hết hạn</label>
                          <input type="text" disabled value="12/29" className="w-full bg-white border border-line rounded-xl py-2 px-3 text-caption font-mono text-muted select-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted uppercase block">CVV</label>
                          <input type="text" disabled value="888" className="w-full bg-white border border-line rounded-xl py-2 px-3 text-caption font-mono text-muted select-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulation button */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={simulatingPayment}
                    className="w-full bg-fg text-bg py-4 rounded-2xl text-caption font-bold hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {simulatingPayment ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang xử lý giao dịch giả lập...</span>
                      </>
                    ) : (
                      <>
                        <span>Xác nhận & Thanh toán giả lập</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-muted text-center flex items-center gap-1 justify-center leading-normal">
                    <AlertCircle size={10} className="shrink-0 text-amber-500" />
                    <span>Lưu ý: Đây là cổng thanh toán giả lập dùng cho môi trường thử nghiệm.</span>
                  </p>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
