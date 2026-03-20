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

const MIN_PASSWORD_LENGTH = 8
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Supabase 이메일 회원가입 폼을 렌더링한다. */
const SignupPage = () => {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    if (!supabase) {
      setIsCheckingAuth(false)
      setErrorMessage(
        "Supabase 연결 정보가 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 설정한 뒤 개발 서버를 다시 실행해 주세요.",
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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          router.replace("/dashboard")
        }
      },
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase])

  /** 회원가입 폼을 검증한다. */
  const validateForm = () => {
    if (!displayName.trim()) {
      return "이름을 입력해주세요."
    }

    if (!emailRegex.test(email.trim())) {
      return "올바른 이메일 형식으로 입력해주세요."
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`
    }

    if (password !== confirmPassword) {
      return "비밀번호 확인이 일치하지 않습니다."
    }

    return ""
  }

  /** 회원가입 요청을 처리한다. */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    const validationMessage = validateForm()
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    if (!supabase) {
      setErrorMessage(
        "Supabase 설정이 필요합니다. .env.local을 확인한 뒤 dev 서버를 재시작해 주세요.",
      )
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: displayName.trim(),
          },
        },
      })

      if (error) {
        const friendlyMessage = error.message.includes("already registered")
          ? "이미 가입된 이메일입니다. 로그인 페이지를 이용해주세요."
          : "회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
        setErrorMessage(friendlyMessage)
        return
      }

      if (data.session) {
        window.location.assign("/dashboard")
        return
      }

      setConfirmPassword("")
      setPassword("")
      setSuccessMessage(
        "회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.",
      )
    } catch {
      setErrorMessage(
        "회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          인증 상태를 확인하는 중입니다...
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
              <CardTitle className="text-2xl">새 계정 만들기</CardTitle>
              <CardDescription>
                이메일과 비밀번호로 회원가입하고
                <br />
                AI 기반 할일 관리를 시작하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-7 md:px-8 md:pb-8">
              <form
                className="grid gap-5"
                method="post"
                onSubmit={handleSubmit}
              >
                <div className="grid gap-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    className="h-10 px-3"
                    placeholder="홍길동"
                    autoComplete="name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
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
                  autoComplete="new-password"
                  placeholder={`최소 ${MIN_PASSWORD_LENGTH}자 이상 입력하세요`}
                />
                <PasswordField
                  id="confirm-password"
                  name="confirm-password"
                  label="비밀번호 확인"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  placeholder="비밀번호를 한 번 더 입력하세요"
                />

                <Button
                  type="submit"
                  className="mt-2 h-10 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      가입 처리 중...
                    </span>
                  ) : (
                    "회원가입"
                  )}
                </Button>
              </form>

              {errorMessage ? (
                <p className="mt-3 text-sm font-medium text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p className="mt-3 text-sm font-medium text-emerald-600">
                  {successMessage}
                </p>
              ) : null}

              <p className="mt-4 text-center text-sm text-muted-foreground">
                이미 계정이 있으신가요?{" "}
                <Button asChild variant="link" className="h-auto px-0">
                  <Link href="/login">로그인</Link>
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

export default SignupPage
