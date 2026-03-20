import { redirect } from "next/navigation"

/** 루트 URL은 서비스 소개(`/about`)로 안내한다. */
export default function RootPage() {
  redirect("/about")
}
