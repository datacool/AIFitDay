import Link from "next/link"

import { Button } from "@/components/ui/button"

/** 로그인 전 공개 페이지에서 사용하는 상단 내비게이션. */
export function PublicMarketingNav() {
  return (
    <header className="border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/about"
          className="text-lg font-bold tracking-tight text-foreground hover:text-primary"
        >
          AIFitDay
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/about">서비스 소개</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/privacy">개인정보처리방침</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/faq">FAQ</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contact">문의</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login">로그인</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

/** 로그인 전 공통 푸터 링크. */
export function PublicMarketingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          © {year} AIFitDay. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Link href="/about" className="hover:text-foreground">
            서비스 소개
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            개인정보처리방침
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            문의
          </Link>
        </div>
      </div>
    </footer>
  )
}
