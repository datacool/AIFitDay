import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "로그인",
  description: "AIFitDay 계정으로 로그인합니다.",
  alternates: { canonical: "/login" },
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
