import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/site"

/**
 * 공개 색인 대상 경로만 나열한다.
 * `/dashboard` 등 로그인 앱 화면은 제외한다.
 */
const publicPaths = [
  "/",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/login",
  "/signup",
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const lastModified = new Date()

  return publicPaths.map((path) => {
    const isMain = path === "/" || path === "/about"
    return {
      url: `${base}${path}`,
      lastModified,
      changeFrequency: isMain ? "weekly" : "monthly",
      priority: isMain ? 1 : 0.8,
    }
  })
}
