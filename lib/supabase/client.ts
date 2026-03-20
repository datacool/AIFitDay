import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""

let cachedClient: SupabaseClient | null = null

/** 브라우저에서 Supabase 공개 환경 변수가 모두 있는지 검사한다. */
export function isSupabaseBrowserConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey)
}

/**
 * 클라ient 컴포넌트용 Supabase 클라이언트.
 * 환경 변수가 없으면 null (모듈 로드 시 throw 하지 않음 — 페이지 크래시 방지).
 */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseBrowserConfigured()) {
    return null
  }
  if (!cachedClient) {
    cachedClient = createBrowserClient(supabaseUrl, supabasePublishableKey)
  }
  return cachedClient
}
