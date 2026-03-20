"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PasswordField } from "@/components/password-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Supabase 이메일 로그인 폼을 렌더링한다. */
const LoginPage = () => {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!supabase) {
      setIsCheckingAuth(false)
      setErrorMessage(
        "Supabase 연결 정보가 없습니다. 프로젝트 루트의 .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 설정한 뒤 개발 서버를 다시 실행해 주세요.",
      )
      return
    }

    const syncAuthState = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        router.replace("/dashboard")
        return
      }

      setIsCheckingAuth(false)
    }

    syncAuthState()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        router.replace("/dashboard")
        return
      }

      if (event === "SIGNED_OUT") {
        setIsCheckingAuth(false)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase])

  /** 로그인 폼을 검증한다. */
  const validateForm = () => {
    if (!emailRegex.test(email.trim())) {
      return "올바른 이메일 형식으로 입력해주세요."
    }

    if (!password.trim()) {
      return "비밀번호를 입력해주세요."
    }

    return ""
  }

  /** 로그인 요청을 처리한다. */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")

    if (!supabase) {
      setErrorMessage(
        "Supabase 설정이 필요합니다. .env.local을 확인한 뒤 dev 서버를 재시작해 주세요.",
      )
      return
    }

    const validationMessage = validateForm()
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setErrorMessage("이메일 또는 비밀번호가 올바르지 않습니다.")
        return
      }

      window.location.assign("/dashboard")
    } catch {
      setErrorMessage("로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-[100dvh] w-full flex-col bg-background">
        <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            인증 상태를 확인하는 중입니다...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-[100dvh] w-full flex-col bg-background">
      <div className="flex w-full flex-1 flex-col justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-lg space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              AIFitDay
            </p>
            <p className="text-sm text-muted-foreground">
              AI를 이용해서 여러분의 데일리 루틴을 스마트하게 관리하세요
            </p>
          </div>

          <Card className="w-full">
          <CardHeader className="space-y-2 px-5 pt-7 text-center md:px-8 md:pt-8">
            <CardTitle className="text-2xl">계정에 로그인</CardTitle>
            <CardDescription>
              이메일과 비밀번호로 로그인하고
              <br />
              오늘의 할일과 날씨를 한 번에 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-7 md:px-8 md:pb-8">
            <form className="grid gap-5" method="post" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className="h-10 px-3"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <PasswordField
                id="password"
                name="password"
                label="비밀번호"
                value={password}
                onValueChange={setPassword}
                disabled={isSubmitting}
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
              />
              <Button
                type="submit"
                className="mt-2 h-10 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    로그인 처리 중...
                  </span>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>

            {errorMessage ? (
              <p className="mt-3 text-sm font-medium text-destructive">{errorMessage}</p>
            ) : null}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              아직 계정이 없으신가요?{" "}
              <Button asChild variant="link" className="h-auto px-0">
                <Link href="/signup">회원가입</Link>
              </Button>
            </p>
          </CardContent>
          </Card>
        </div>
      </div>

      <footer
        className="mt-auto w-full shrink-0 border-t border-border/50 py-6 text-center"
        aria-label="바닥글 링크"
      >
        <nav className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Link href="/about" className="hover:text-foreground">
            서비스 소개
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            개인정보처리방침
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            문의
          </Link>
        </nav>
      </footer>
    </main>
  )
}

export default LoginPage
