"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles, User, Bot, AlertCircle, ImageIcon, MonitorIcon, Paperclip, Command, Loader2 } from "lucide-react"
import { useUserStore } from "@/store/user-store"
import { useRoutineStore } from "@/store/routine-store"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/tracking"

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Command Suggestion Interface
interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

export default function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  
  const { skinType, concerns, allergies } = useUserStore()
  const { morningRoutine, eveningRoutine } = useRoutineStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    }
  }, []);

  const userContext = {
    skinType,
    concerns,
    allergies,
    currentRoutine: {
      morning: morningRoutine.map(p => p.name),
      evening: eveningRoutine.map(p => p.name)
    }
  }

  const [localInput, setLocalInput] = useState("")

  const [fallbackMessages, setFallbackMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-ai",
      role: "assistant",
      content: `Chào bạn! Tôi là SkinWise Advisor. Tôi đã sẵn sàng hỗ trợ cho hồ sơ da ${skinType || 'của'} bạn. Bạn muốn tôi giải đáp thắc mắc gì hôm nay?`
    }
  ]);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayMessages = fallbackMessages;
  const showLoading = isFallbackLoading;

  const onFormSubmit = async (e?: React.FormEvent) => { 
    if (e && e.preventDefault) e.preventDefault();
    if (!localInput.trim()) return;
    
    const submittedText = localInput;
    setLocalInput("");
    setShowCommandPalette(false);

    // Track user message sent
    trackEvent("ai_chat_send", { length: submittedText.length });

    try {
      // Update local UI optimistic
      const newMsg = { id: Date.now().toString(), role: "user" as const, content: submittedText };
      const newList = [...displayMessages, newMsg];
      setFallbackMessages(newList);
      setIsFallbackLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newList, userContext }),
        signal: controller.signal
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "API returned failure");
      }
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream reader");

      const aiId = "ai-" + Date.now().toString();
      let aiText = "";
      
      if (!controller.signal.aborted) {
        setFallbackMessages([...newList, { id: aiId, role: "assistant" as const, content: "" }]);
      }

      while (true) {
        const { done, value } = await reader.read();
        if (controller.signal.aborted) break;
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;
        setFallbackMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: aiText } : m));
      }

      // Track AI response received
      trackEvent("ai_chat_receive", { 
        length: aiText.length, 
        hasAiWarning: aiText.includes("[AI WARNING]") 
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error("Chat submit error:", err);
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
    } finally {
      if (abortRef.current && !abortRef.current.signal.aborted) {
        setIsFallbackLoading(false);
      }
    }
  }

  const commandSuggestions: CommandSuggestion[] = [
    { icon: <ImageIcon className="w-4 h-4" />, label: "Phân tích Routine", description: "Kiểm tra xung đột routine", prefix: "/routine" },
    { icon: <Sparkles className="w-4 h-4" />, label: "Gợi ý sản phẩm", description: "Tìm sản phẩm phù hợp da", prefix: "/recommend" },
    { icon: <MonitorIcon className="w-4 h-4" />, label: "HDSD Chi tiết", description: "Cách dùng Retinol/BHA...", prefix: "/guide" },
  ]

  useEffect(() => {
    if (localInput.startsWith('/') && !localInput.includes(' ')) {
      setShowCommandPalette(true)
    } else {
      setShowCommandPalette(false)
    }
  }, [localInput])

  const selectSuggestion = (prefix: string) => {
    setLocalInput(prefix + " ");
    setShowCommandPalette(false);
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayMessages])

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0A0A0B] text-white rounded-full flex items-center justify-center shadow-2xl border border-white/10 hover:border-white/20 transition-all font-medium"
      >
        {isOpen ? <X size={20} /> : <Sparkles size={20} className="text-accent" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] h-[600px] backdrop-blur-3xl bg-black/90 border border-white/10 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 border border-accent/25 text-accent rounded-2xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90">SkinWise Intelligence</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Systems Online</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/40 hover:text-white/90 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
              {displayMessages.map((m: ChatMessage) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={m.id}
                  className={cn(
                    "flex gap-4 max-w-[90%]",
                    m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border",
                    m.role === "user" 
                      ? "bg-white/5 border-white/10 text-white/60" 
                      : "bg-accent/10 border-accent/25 text-accent"
                  )}>
                    {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-[13px] leading-relaxed",
                    m.role === "user" 
                      ? "bg-white text-black font-medium" 
                      : "bg-white/[0.03] text-white/80 border border-white/5"
                  )}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              
              {showLoading && (
                <div className="flex gap-4 mr-auto items-center">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-duration:0.8s]"></span>
                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3 text-xs">
                  <AlertCircle size={14} /> {error || "Đã xảy ra lỗi không xác định."}
                </div>
              )}
            </div>

            {/* Input & Palette UI */}
            <div className="p-6 relative bg-gradient-to-t from-white/[0.02] to-transparent">
              <AnimatePresence>
                {showCommandPalette && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-6 right-6 bottom-full mb-4 bg-[#0A0A0B] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
                  >
                    <div className="p-2">
                      {commandSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectSuggestion(suggestion.prefix)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-all group text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                            {suggestion.icon}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white/90">{suggestion.label}</div>
                            <div className="text-[10px] text-white/30">{suggestion.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-[24px] p-2 transition-all focus-within:border-white/20 focus-within:bg-white/[0.05]">
                <textarea
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="Hỏi về da của bạn..."
                  className="w-full bg-transparent border-none text-white/90 text-sm px-4 py-3 min-h-[50px] max-h-[150px] resize-none outline-none placeholder:text-white/20 scrollbar-hide"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onFormSubmit(e);
                    }
                  } }
                />
                <div className="flex items-center justify-between px-2 pb-2">
                  <div className="flex items-center gap-1">
                    <button className="p-2 text-white/20 hover:text-white/60 transition-colors">
                      <Paperclip size={16} />
                    </button>
                    <button 
                      onClick={() => setShowCommandPalette(!showCommandPalette)}
                      className={cn(
                        "p-2 transition-colors",
                        showCommandPalette ? "text-accent" : "text-white/20 hover:text-white/60"
                      )}
                    >
                      <Command size={16} />
                    </button>
                  </div>
                  <button
                    onClick={onFormSubmit}
                    disabled={!localInput.trim() || showLoading}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      localInput.trim() 
                        ? "bg-white text-black shadow-lg shadow-white/10" 
                        : "bg-white/5 text-white/20"
                    )}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Health Disclaimer */}
            <div className="px-6 pb-6 text-[9px] text-white/20 text-center uppercase tracking-widest leading-relaxed">
              Tư vấn AI chỉ mang tính tham khảo. <br/> Không thay thế chẩn đoán y khoa chuyên sâu.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
