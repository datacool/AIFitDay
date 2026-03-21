import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "회원가입",
  description: "AIFitDay 신규 계정을 만듭니다.",
  alternates: { canonical: "/signup" },
}

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
