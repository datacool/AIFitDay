import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

/** 인증 상태에 따라 라우트를 보호하고 리다이렉트한다. */
export async function middleware(request: NextRequest) {
  if (!supabaseUrl || !supabasePublishableKey) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const pathname = request.nextUrl.pathname
  const isProtectedPage = pathname === "/dashboard"

  let user = null
  try {
    // 미들웨어에서는 getUser()가 네트워크 재시도를 유발해 500이 나는 경우가 있어
    // 세션 기반 조회를 우선 사용해 안정성을 높인다.
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user = session?.user ?? null
  } catch {
    // 인증 서비스 일시 장애 시에도 500 대신 로그인 화면으로 유도한다.
    user = null
  }

  if (!user && isProtectedPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/dashboard"],
}
