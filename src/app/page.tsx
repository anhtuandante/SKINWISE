"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, type Variants } from "framer-motion"
import Button from "@/components/ui/Button"
import AboutUsSection from "@/components/ui/about-us-section"
import { useUserStore } from "@/store/user-store"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

export default function HomePage() {
  const router = useRouter()
  const store = useUserStore()

  const handleDemo = () => {
    store.setAge("25-34")
    store.setSkinType("combination")
    store.toggleConcern("acne")
    store.toggleConcern("pores")
    store.setBudget("mid-range")
    store.setBarrierStatus("stable")
    store.setQuizCompleted(true)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-line">
        <div className="max-w-screen-lg mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="SkinWise Logo" className="h-7 w-auto object-contain" />
            <span className="text-body font-semibold tracking-tight">SkinWise</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/ingredients" className="text-caption text-muted hover:text-fg transition-colors">
              Thành phần
            </Link>
            <Link href="/login?mode=login" className="text-caption text-muted hover:text-fg transition-colors">
              Đăng nhập
            </Link>
            <Button href="/login?mode=signup" size="sm">
              Đăng ký
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-screen-lg mx-auto">
          <motion.p
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="text-micro uppercase text-accent-dark tracking-widest mb-6"
          >
            Skincare & Makeup — Cá nhân hóa
          </motion.p>
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-display font-light text-fg mb-8 max-w-2xl"
          >
            Routine phù hợp
            <br />
            <span className="font-semibold">da và ngân sách</span> của bạn
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-body text-muted max-w-md mb-12 leading-relaxed"
          >
            Trả lời vài câu hỏi. Nhận danh sách sản phẩm skincare và makeup được chọn lọc theo loại da, vấn đề và ngân
            sách thực tế tại Việt Nam.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="flex items-center gap-3"
          >
            <Button href="/login?mode=signup" size="lg">
              Bắt đầu ngay
            </Button>
            <Button onClick={handleDemo} variant="outline">
              Xem demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Line */}
      <div className="max-w-screen-lg mx-auto px-6">
        <div className="h-px bg-line" />
      </div>

      {/* Premium About & Features Section */}
      <AboutUsSection />

      {/* Dark section */}
      <section className="bg-fg text-bg py-20 px-6">
        <div className="max-w-screen-lg mx-auto grid sm:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-micro uppercase tracking-widest opacity-40 mb-4">Tại sao</p>
            <h2 className="text-headline font-semibold mb-4">
              Ngừng mò mẫm
              <br />
              với skincare
            </h2>
            <p className="text-body opacity-60 leading-relaxed">
              Phối Retinol với Vitamin C, chồng acid, dùng kem chống nắng SPF quá thấp — những sai lầm phổ biến dễ tránh
              khi có công cụ đúng.
            </p>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-4"
          >
            {[
              "Routine sáng và tối riêng biệt",
              "Cảnh báo xung đột theo mức độ nghiêm trọng",
              "Gợi ý thứ tự thoa đúng chuẩn da liễu",
              "Hỗ trợ từ Thorakao 50k đến La Mer 8.5tr",
              "Bách khoa thành phần tra cứu nhanh",
            ].map((text) => (
              <motion.div key={text} variants={item} className="flex items-start gap-3">
                <span className="text-caption opacity-30 mt-0.5">—</span>
                <span className="text-body opacity-80">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-screen-lg mx-auto"
        >
          <motion.p variants={item} className="text-micro uppercase text-accent-dark tracking-widest mb-4">
            Miễn phí · Không cần đăng ký
          </motion.p>
          <motion.h2 variants={item} className="text-headline font-semibold mb-6">
            Bắt đầu ngay
          </motion.h2>
          <motion.div variants={item}>
            <Button href="/login?mode=signup" size="lg">
              Tạo tài khoản miễn phí
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-8 px-6">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between">
          <span className="text-caption font-medium">SkinWise</span>
          <div className="flex items-center gap-6 text-caption text-muted">
            <Link href="/ingredients" className="hover:text-fg transition-colors">
              Thành phần
            </Link>
            <span>Demo · Giá tham khảo</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
