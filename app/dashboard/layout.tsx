import type { Metadata } from "next"

/** 앱 대시보드는 공개 색인 대상이 아니다. */
export const metadata: Metadata = {
  title: "대시보드",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
