import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "홈",
  alternates: { canonical: "/" },
}

/** 루트 URL은 서비스 소개(`/about`)로 안내한다. */
export default function RootPage() {
  redirect("/about")
}
