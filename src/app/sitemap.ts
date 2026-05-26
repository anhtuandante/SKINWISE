import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://skinwise.vn"
  const staticDate = new Date("2026-05-25")

  return [
    {
      url: baseUrl,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/results`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ingredients`,
      lastModified: staticDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]
}
