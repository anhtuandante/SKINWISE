import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Quiz phân tích da | SkinWise",
  description: "Trả lời 4 câu hỏi để xác định loại da, vấn đề da, ngân sách và nhận gợi ý sản phẩm phù hợp.",
  openGraph: {
    title: "Quiz phân tích da | SkinWise",
    description: "Trả lời 4 câu hỏi — nhận routine skincare cá nhân hóa.",
  },
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
