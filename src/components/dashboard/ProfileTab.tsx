"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Download,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Product } from "@/types";
import { useUserStore } from "@/store/user-store";
import { useSkinStore } from "@/store/useSkinStore";
import { useRoutineStore } from "@/store/routine-store";
import { useToastStore } from "@/store/toast-store";

import SkinProfileCard from "@/components/dashboard/SkinProfileCard";
import TrendVisualizer from "@/components/dashboard/TrendVisualizer";
import SkinJournalPanel from "@/components/dashboard/SkinJournalPanel";
import PricingPanel from "@/components/dashboard/PricingPanel";

interface ProfileTabProps {
  recommended: Product[];
}

export default function ProfileTab({ recommended }: ProfileTabProps) {
  const user = useUserStore();
  const addToast = useToastStore((s) => s.addToast);

  const [dataOpen, setDataOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ───────── Export backup ───────── */
  const handleExportBackup = () => {
    try {
      const backupData = {
        userStore: useUserStore.getState(),
        skinStore: useSkinStore.getState(),
        routineStore: useRoutineStore.getState(),
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
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

  /* ───────── Import backup ───────── */
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

    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  /* ───────── Clear all data ───────── */
  const handleClearAllData = () => {
    if (
      window.confirm(
        "CẢNH BÁO: Hành động này sẽ xóa sạch tất cả nhật ký, chu trình skincare và hồ sơ chẩn đoán da của bạn. Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?"
      )
    ) {
      useUserStore.getState().resetQuiz();
      useSkinStore.getState().clearJournal();
      useRoutineStore.getState().clearRoutine();
      addToast("Đã xóa toàn bộ dữ liệu trên thiết bị.", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. Skin Profile Card (or Quiz CTA) ─── */}
      {user.quizCompleted ? (
        <SkinProfileCard recommended={recommended} setActiveTab={() => {}} />
      ) : (
        <div className="border border-line rounded-[32px] p-10 bg-white shadow-soft text-center space-y-5">
          <div className="w-16 h-16 bg-fg/5 rounded-full flex items-center justify-center mx-auto">
            <Sparkles size={28} className="text-accent" />
          </div>
          <h2 className="text-headline font-semibold text-fg">
            Khám phá làn da của bạn
          </h2>
          <p className="text-body text-muted max-w-md mx-auto leading-relaxed">
            Hoàn thành bài chẩn đoán da ngắn để SkinWise AI tạo hồ sơ da cá
            nhân hóa và gợi ý chu trình skincare phù hợp nhất cho bạn.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 bg-fg text-bg px-6 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
          >
            <Sparkles size={16} />
            Bắt đầu chẩn đoán da
          </Link>
        </div>
      )}

      {/* ─── 2. Trend Visualizer ─── */}
      <TrendVisualizer />

      {/* ─── 3. Skin Journal ─── */}
      <SkinJournalPanel />

      {/* ─── 4. Membership / Pricing ─── */}
      <PricingPanel />

      {/* ─── 5. Data Management (collapsible) ─── */}
      <div className="border border-line rounded-2xl bg-white shadow-soft overflow-hidden">
        <button
          onClick={() => setDataOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-surface/40"
        >
          <span className="text-body font-bold text-fg">
            Quản lý dữ liệu
          </span>
          {dataOpen ? (
            <ChevronUp size={18} className="text-muted" />
          ) : (
            <ChevronDown size={18} className="text-muted" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {dataOpen && (
            <motion.div
              key="data-management"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-3">
                {/* Export */}
                <button
                  onClick={handleExportBackup}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-line bg-surface/30 hover:bg-surface/60 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent-dark flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                    <Download size={16} />
                  </div>
                  <div>
                    <span className="text-caption font-bold text-fg block">
                      Xuất bản sao lưu
                    </span>
                    <span className="text-[11px] text-muted">
                      Tải về file JSON chứa toàn bộ dữ liệu của bạn
                    </span>
                  </div>
                </button>

                {/* Import */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-line bg-surface/30 hover:bg-surface/60 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <Upload size={16} />
                  </div>
                  <div>
                    <span className="text-caption font-bold text-fg block">
                      Nhập bản sao lưu
                    </span>
                    <span className="text-[11px] text-muted">
                      Khôi phục dữ liệu từ file JSON đã xuất trước đó
                    </span>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />

                {/* Clear */}
                <button
                  onClick={handleClearAllData}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-red-200 bg-red-50/40 hover:bg-red-50 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                    <Trash2 size={16} />
                  </div>
                  <div>
                    <span className="text-caption font-bold text-red-600 block">
                      Xóa toàn bộ dữ liệu
                    </span>
                    <span className="text-[11px] text-muted">
                      Xóa hết nhật ký, routine và hồ sơ da — không thể hoàn tác
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
