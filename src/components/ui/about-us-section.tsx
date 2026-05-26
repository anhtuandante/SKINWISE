"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Sparkles,
  Search,
  BookOpen,
  ScanFace,
  ShieldCheck,
  HeartHandshake,
  Award,
  Users,
  Database,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  TrendingUp,
} from "lucide-react"
import { motion, useScroll, useTransform, useInView, useSpring, type Variants } from "framer-motion"

export default function AboutUsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 })
  const isStatsInView = useInView(statsRef, { once: false, amount: 0.3 })

  // Parallax effect for decorative elements
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50])
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 20])
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -20])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const services = [
    {
      icon: <ScanFace className="w-6 h-6" />,
      secondaryIcon: <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-violet-400" />,
      title: "Trí tuệ nhân tạo (AI)",
      description:
        "Ứng dụng AI tiên tiến để phân tích tình trạng da, đưa ra nhận định cá nhân hóa với độ chính xác cao.",
      position: "left",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      secondaryIcon: <CheckCircle className="w-4 h-4 absolute -top-1 -right-1 text-violet-400" />,
      title: "Khoa học & Thực chứng",
      description:
        "Mọi công thức và gợi ý đều dựa trên dữ liệu thành phần chuẩn xác, được xác minh từ các chuyên gia da liễu.",
      position: "left",
    },
    {
      icon: <Search className="w-6 h-6" />,
      secondaryIcon: <Star className="w-4 h-4 absolute -top-1 -right-1 text-violet-400" />,
      title: "Phân tích bảng thành phần",
      description:
        "Phát hiện các tương kỵ (conflicts) giữa các hoạt chất, giúp bạn sử dụng mỹ phẩm an toàn và hiệu quả nhất.",
      position: "left",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      secondaryIcon: <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-violet-400" />,
      title: "Gợi ý cá nhân hóa",
      description:
        "Xây dựng chu trình dưỡng da (routine) độc bản phù hợp với loại da, vấn đề da và tài chính của riêng bạn.",
      position: "right",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      secondaryIcon: <CheckCircle className="w-4 h-4 absolute -top-1 -right-1 text-violet-400" />,
      title: "Bảo mật & An toàn",
      description:
        "Dữ liệu hình ảnh sinh trắc học của bạn chỉ được xử lý tạm thời và hoàn toàn không lưu trữ trên máy chủ.",
      position: "right",
    },
    {
      icon: <HeartHandshake className="w-6 h-6" />,
      secondaryIcon: <Star className="w-4 h-4 absolute -top-1 -right-1 text-violet-400" />,
      title: "Đồng hành thấu hiểu",
      description:
        "SkinWise không chỉ là công cụ, mà là người bạn đồng hành theo sát sự tiến bộ của làn da bạn mỗi ngày.",
      position: "right",
    },
  ]

  const stats = [
    { icon: <Award />, value: 98, label: "Độ chính xác AI", suffix: "%" },
    { icon: <Users />, value: 12500, label: "Người dùng tin chọn", suffix: "+" },
    { icon: <Database />, value: 5000, label: "Dữ liệu sản phẩm", suffix: "+" },
    { icon: <TrendingUp />, value: 100, label: "Cải thiện sau 4 tuần", suffix: "%" },
  ]

  return (
    <section
      id="about-section"
      ref={sectionRef}
      className="w-full py-24 px-4 bg-gradient-to-b from-[#FAFAF8] to-[#F5F3F0] text-[#1A1A1A] overflow-hidden relative"
    >
      {/* Decorative background elements */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl"
        style={{ y: y1, rotate: rotate1 }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl"
        style={{ y: y2, rotate: rotate2 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-4 h-4 rounded-full bg-violet-400/30"
        animate={{
          y: [0, -15, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full bg-indigo-400/30"
        animate={{
          y: [0, 20, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <motion.div
        className="container mx-auto max-w-6xl relative z-10"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <motion.div className="flex flex-col items-center mb-6" variants={itemVariants}>
          <motion.span
            className="text-violet-600 font-medium mb-2 flex items-center gap-2 tracking-widest text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Zap className="w-4 h-4" />
            CÂU CHUYỆN CỦA CHÚNG TÔI
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-semibold mb-4 text-center">Về SkinWise</h2>
          <motion.div
            className="w-24 h-1 bg-violet-300"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 1, delay: 0.5 }}
          ></motion.div>
        </motion.div>

        <motion.p className="text-center max-w-2xl mx-auto mb-16 text-[#1A1A1A]/80 leading-relaxed" variants={itemVariants}>
          SkinWise ra đời với sứ mệnh dân chủ hóa kiến thức chăm sóc da chuyên sâu. Chúng tôi kết hợp sức mạnh của 
          Trí tuệ Nhân tạo (AI) và Khoa học Da liễu để mang đến cho bạn một trợ lý cá nhân, giúp bạn thấu hiểu 
          làn da và tự tin tỏa sáng mộc mạc.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Left Column */}
          <div className="space-y-16">
            {services
              .filter((service) => service.position === "left")
              .map((service, index) => (
                <ServiceItem
                  key={`left-${index}`}
                  icon={service.icon}
                  secondaryIcon={service.secondaryIcon}
                  title={service.title}
                  description={service.description}
                  variants={itemVariants}
                  delay={index * 0.2}
                  direction="left"
                />
              ))}
          </div>

          {/* Center Image */}
          <div className="flex justify-center items-center order-first md:order-none mb-8 md:mb-0 relative">
            <motion.div className="relative w-full max-w-[280px]" variants={itemVariants}>
              <motion.div
                className="rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(8,112,184,0.1)]"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
              >
                <img
                  src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=3000&auto=format&fit=crop"
                  alt="Healthy Skin Beauty"
                  className="w-full aspect-[4/5] object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                >
                  <motion.button
                    className="bg-white/95 backdrop-blur-sm text-black px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-semibold shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Bắt đầu hành trình <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </motion.div>
              <motion.div
                className="absolute inset-0 border-[3px] border-violet-200/50 rounded-3xl -m-4 z-[-1]"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              ></motion.div>

              {/* Floating accent elements */}
              <motion.div
                className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-violet-100/80 backdrop-blur-3xl z-[-2]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
                style={{ y: y1 }}
              ></motion.div>
              <motion.div
                className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-indigo-100/60 backdrop-blur-3xl z-[-2]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.1 }}
                style={{ y: y2 }}
              ></motion.div>

              {/* Additional decorative elements */}
              <motion.div
                className="absolute -top-12 left-1/2 -translate-x-1/2 w-4 h-4 flex items-center justify-center text-violet-400"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              ><Sparkles size={16} /></motion.div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-16">
            {services
              .filter((service) => service.position === "right")
              .map((service, index) => (
                <ServiceItem
                  key={`right-${index}`}
                  icon={service.icon}
                  secondaryIcon={service.secondaryIcon}
                  title={service.title}
                  description={service.description}
                  variants={itemVariants}
                  delay={index * 0.2}
                  direction="right"
                />
              ))}
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          ref={statsRef}
          className="mt-28 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          animate={isStatsInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {stats.map((stat, index) => (
            <StatCounter
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              delay={index * 0.1}
            />
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="mt-24 bg-[#1A1A1A] text-white p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative"
          initial={{ opacity: 0, y: 30 }}
          animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="flex-1 relative z-10 text-center md:text-left">
            <h3 className="text-3xl font-semibold mb-3">Sẵn sàng nâng tầm làn da bạn?</h3>
            <p className="text-white/70 text-lg">Hãy để AI của chúng tôi phân tích và thiết kế routine chỉ dành riêng cho bạn.</p>
          </div>
          <motion.button
            className="relative z-10 bg-white text-black px-8 py-4 rounded-xl flex items-center gap-2 font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Mở khóa Routine <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  )
}

interface ServiceItemProps {
  icon: React.ReactNode
  secondaryIcon?: React.ReactNode
  title: string
  description: string
  variants: Variants
  delay: number
  direction: "left" | "right"
}

function ServiceItem({ icon, secondaryIcon, title, description, variants, delay, direction }: ServiceItemProps) {
  return (
    <motion.div
      className="flex flex-col group"
      variants={variants}
      transition={{ delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="flex items-center gap-4 mb-3"
        initial={{ x: direction === "left" ? -20 : 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
      >
        <motion.div
          className="text-violet-600 bg-violet-50 p-3.5 rounded-2xl transition-all duration-300 group-hover:bg-violet-100 group-hover:scale-110 group-hover:shadow-sm relative"
          whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
        >
          {icon}
          {secondaryIcon}
        </motion.div>
        <h3 className="text-xl font-semibold text-[#1A1A1A] group-hover:text-violet-700 transition-colors duration-300">
          {title}
        </h3>
      </motion.div>
      <motion.p
        className="text-[15px] text-[#1A1A1A]/70 leading-relaxed md:pl-0 pl-[60px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.4 }}
      >
        {description}
      </motion.p>
    </motion.div>
  )
}

interface StatCounterProps {
  icon: React.ReactNode
  value: number
  label: string
  suffix: string
  delay: number
}

function StatCounter({ icon, value, label, suffix, delay }: StatCounterProps) {
  const countRef = useRef(null)
  const isInView = useInView(countRef, { once: false })
  const [hasAnimated, setHasAnimated] = useState(false)

  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 10,
  })

  useEffect(() => {
    if (isInView && !hasAnimated) {
      springValue.set(value)
      setHasAnimated(true)
    } else if (!isInView && hasAnimated) {
      springValue.set(0)
      setHasAnimated(false)
    }
  }, [isInView, value, springValue, hasAnimated])

  const displayValue = useTransform(springValue, (latest) => Math.floor(latest))

  return (
    <motion.div
      className="bg-white border border-black/5 p-8 rounded-3xl flex flex-col items-center text-center group hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay },
        },
      }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      <motion.div
        className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-5 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300"
        whileHover={{ rotate: 360, transition: { duration: 0.8 } }}
      >
        {icon}
      </motion.div>
      <motion.div ref={countRef} className="text-4xl font-bold text-[#1A1A1A] flex items-center tracking-tight">
        <motion.span>{displayValue}</motion.span>
        <span>{suffix}</span>
      </motion.div>
      <p className="text-[#1A1A1A]/60 font-medium mt-2">{label}</p>
      <motion.div className="w-12 h-1 bg-violet-200 rounded-full mt-4 group-hover:w-20 group-hover:bg-violet-500 transition-all duration-300" />
    </motion.div>
  )
}
