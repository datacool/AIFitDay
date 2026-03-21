/**
 * 배포 기준 사이트 원점 URL (트레일링 슬래시 없음).
 * 레이아웃·사이트맵·robots·검색 콘솔과 동일한 값을 쓴다.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (raw) {
    return raw.replace(/\/$/, "")
  }
  return "https://ai-fit-day.vercel.app"
}
