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

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      if (err instanceof Error) {
        addToast(err.message, "error");
      } else {
        addToast(`Có lỗi xảy ra khi kết nối tới ${provider}`, "error");
      }
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-bg px-4 text-muted">Hoặc đăng nhập bằng</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin("google")}
              className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white border border-line rounded-2xl text-caption font-bold hover:bg-surface active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.728 5.728 0 0 1 8.24 12.8a5.728 5.728 0 0 1 5.751-5.714c1.558 0 2.96.613 3.993 1.612l3.056-3.055A9.917 9.917 0 0 0 13.991 3c-5.522 0-10 4.478-10 10s4.478 10 10 10c5.782 0 10.155-4.062 10.155-9.845 0-.62-.056-1.226-.155-1.87H12.24Z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin("facebook")}
              className="flex items-center justify-center gap-2 py-3.5 px-4 bg-[#1877F2] text-white rounded-2xl text-caption font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

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
