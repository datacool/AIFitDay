import type { Metadata } from "next"

import { MarketingLandingBody } from "@/components/marketing-landing-body"

export const metadata: Metadata = {
  title: "서비스 소개",
  description:
    "AIFitDay(에이핏데이) — 실시간 날씨와 AI로 데일리 루틴·할 일을 스마트하게 관리하는 서비스입니다.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return <MarketingLandingBody />
}
