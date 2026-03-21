import type { Metadata } from "next"
import Link from "next/link"

import { MarketingFaq } from "@/components/marketing-faq"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description:
    "AIFitDay 서비스 FAQ — 계정, 데이터, 오류 제보 등 자주 묻는 질문과 답변입니다.",
  alternates: { canonical: "/faq" },
}

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        자주 묻는 질문 (FAQ)
      </h1>
      <p className="mt-2 text-muted-foreground">
        아래에서 궁금한 내용을 먼저 찾아보세요. 원하는 답변이 없으면{" "}
        <Link href="/contact" className="font-medium text-primary underline">
          문의하기
        </Link>
        로 상세 내용을 남겨 주시면 됩니다.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href="/contact">문의하기</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/about">서비스 소개</Link>
        </Button>
      </div>

      <MarketingFaq />

      <p className="mt-12 text-center text-sm text-muted-foreground">
        더 도움이 필요하신가요?{" "}
        <Link href="/contact" className="font-medium text-primary underline">
          1:1 문의
        </Link>
      </p>
    </main>
  )
}
