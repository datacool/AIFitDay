import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** 공개 랜딩(홈·서비스 소개) 본문. */
export function MarketingLandingBody() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <div className="space-y-4 text-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            AIFitDay
          </p>
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          AI로 데일리 루틴을 스마트하게 관리하세요
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          실시간 날씨 · 옷차림 가이드와 AI 할 일 생성 · 요약으로 하루를 정리할
          수 있습니다.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg" variant="secondary">
            <Link href="/login">로그인하고 시작하기</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-secondary/50 hover:bg-secondary/10 hover:text-foreground"
          >
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">실시간 날씨</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            오늘·내일·3일 예보와 활동 지수, 시간대별 날씨로 외출·일정을
            계획하세요.
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">스마트 할 일</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            검색·필터·정렬과 AI 기반 자연어 입력으로 할 일을 빠르게
            등록·관리합니다.
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">AI 인사이트</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            오늘·이번 주 요약으로 완료율과 집중 구간을 파악하고 실행 가능한
            제안을 받아보세요.
          </CardContent>
        </Card>
      </div>

      <p className="mt-12 text-center text-xs text-muted-foreground">
        <Link href="/faq" className="font-medium text-primary underline">
          자주 묻는 질문
        </Link>
        을 먼저 확인하시고,{" "}
        <Link href="/contact" className="font-medium text-primary underline">
          문의하기
        </Link>
        로 1:1 접수도 가능합니다.
      </p>
    </main>
  )
}
