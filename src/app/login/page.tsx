"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useToastStore } from "@/store/toast-store";
import { useUserStore } from "@/store/user-store";
import { useSkinStore } from "@/store/useSkinStore";

import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { syncLocalToCloud } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      if (mode === "signup") {
        setIsLogin(false);
      } else if (mode === "login") {
        setIsLogin(true);
      }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        addToast("Đăng nhập thành công!", "success");
        router.push("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        const userState = useUserStore.getState();
        const skinState = useSkinStore.getState();
        
        // Check if user session was automatically established (email confirmation disabled)
        if (data.session) {
          addToast("Đăng ký thành công và đã tự động đăng nhập!", "success");
          
          // Push local data to cloud (Guest to Member migration)
          if (userState.skinType || skinState.diaryLogs.length > 0) {
            await syncLocalToCloud();
          }
          
          if (userState.quizCompleted) {
            router.push("/dashboard");
          } else {
            router.push("/quiz");
          }
        } else {
          addToast("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.", "success");
          setIsLogin(true); // Switch to login tab so they can login after confirming
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === "Failed to fetch") {
          addToast("Lỗi kết nối. Bạn đã cấu hình biến môi trường Supabase (.env.local) chưa?", "error");
        } else {
          addToast(err.message, "error");
        }
      } else {
        addToast("Có lỗi xảy ra", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <main className="min-h-screen bg-bg flex flex-col px-6">
      <div className="pt-12 pb-8">
        <Link href="/" className="inline-flex items-center text-muted hover:text-fg transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          <span className="text-caption font-bold">Trang chủ</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-[28px] font-bold text-fg tracking-tight">
              {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản SkinWise"}
            </h1>
            <p className="text-caption text-muted">
              {isLogin 
                ? "Đăng nhập để xem nhật ký làn da của bạn." 
                : "Tạo tài khoản để đồng bộ dữ liệu của bạn an toàn trên Cloud."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-muted" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  required
                  className="w-full bg-surface border border-line rounded-2xl py-3.5 pl-12 pr-4 text-caption text-fg outline-none focus:border-fg transition-all"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-muted" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  required
                  minLength={6}
                  className="w-full bg-surface border border-line rounded-2xl py-3.5 pl-12 pr-4 text-caption text-fg outline-none focus:border-fg transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-fg text-bg rounded-2xl text-caption font-bold hover:opacity-90 transition-all flex items-center justify-center shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isLogin ? "Đăng nhập" : "Đăng ký & Đồng bộ dữ liệu"}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-caption text-muted hover:text-fg transition-colors"
            >
              {isLogin 
                ? "Chưa có tài khoản? Đăng ký ngay" 
                : "Đã có tài khoản? Đăng nhập"}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
