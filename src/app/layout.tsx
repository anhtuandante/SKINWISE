import type { Metadata } from "next"
import { Be_Vietnam_Pro } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"
import ToastContainer from "@/components/ui/Toast"

const beVietnamPro = Be_Vietnam_Pro({ 
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam"
})

export const metadata: Metadata = {
  title: "SkinWise - Skincare & Makeup cá nhân hóa",
  description: "Xây dựng routine skincare và makeup phù hợp loại da, ngân sách - từ drugstore Việt đến luxury quốc tế.",
  keywords: ["skincare", "makeup", "routine", "da", "mỹ phẩm", "skinwise", "chăm sóc da"],
  metadataBase: new URL("https://skinwise.vn"),
  openGraph: {
    title: "SkinWise - Skincare & Makeup cá nhân hóa",
    description: "Trả lời vài câu hỏi, nhận routine phù hợp loại da và ngân sách của bạn.",
    type: "website",
    locale: "vi_VN",
    siteName: "SkinWise",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "theme-color": "#1A1A1A",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`antialiased ${beVietnamPro.variable}`}>
      <body className="font-sans">
        {children}
        <ToastContainer />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "SkinWise",
              description: "Cá nhân hóa routine skincare & makeup cho thị trường Việt Nam",
              applicationCategory: "HealthApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
              inLanguage: "vi",
            }),
          }}
        />
      </body>
    </html>
  )
}
