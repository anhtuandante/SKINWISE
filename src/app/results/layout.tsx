import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kết quả & Routine Builder | SkinWise",
  description: "Xem sản phẩm gợi ý theo loại da và ngân sách. Xây dựng routine sáng/tối với kiểm tra xung đột thành phần.",
  openGraph: {
    title: "Kết quả & Routine Builder | SkinWise",
    description: "Sản phẩm gợi ý + routine builder với kiểm tra xung đột thành phần.",
  },
}

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
