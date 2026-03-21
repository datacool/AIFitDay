import type { Metadata } from "next"
import Link from "next/link"

import { ContactForm } from "@/components/contact-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "문의",
  description:
    "AIFitDay 고객 문의 — FAQ를 확인한 뒤 온사이트 양식으로 남겨 주세요.",
  alternates: { canonical: "/contact" },
}

const googleFormUrl = process.env.NEXT_PUBLIC_CONTACT_FORM_URL?.trim()

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">문의</h1>
      <p className="mt-2 text-muted-foreground">
        이용 중 궁금한 점, 불편 사항, 오류 제보, 제휴 문의 등 편한 방법으로
        남겨 주세요. 먼저{" "}
        <Link href="/faq" className="font-medium text-primary underline">
          자주 묻는 질문
        </Link>
        을 확인하시면 더 빠르게 해결되는 경우가 많습니다.
      </p>

      <div className="mt-6">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-secondary/50 hover:bg-secondary/10 hover:text-foreground"
        >
          <Link href="/faq">FAQ로 이동</Link>
        </Button>
      </div>

      <div className="mt-8 space-y-8">
        <ContactForm />

        {googleFormUrl ? (
          <Card className="border-border/70 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">추가 설문 (선택)</CardTitle>
              <CardDescription>
                긴 설문·표 형식이 필요할 때만 Google 폼을 이용해 주세요. 일반 문의는
                위 양식을 권장합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-secondary/50 hover:bg-secondary/10 hover:text-foreground"
              >
                <a href={googleFormUrl} target="_blank" rel="noopener noreferrer">
                  Google 폼 열기
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        <Link href="/about" className="text-primary underline">
          서비스 소개로 돌아가기
        </Link>
      </p>
    </main>
  )
}
