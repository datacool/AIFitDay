/**
 * Search Console / 서치어드바이저용 소유확인 토큰을 env에서 안전하게 만든다.
 * 사용자가 실수로 전체 meta 태그나 따옴표까지 붙여넣은 경우를 완화한다.
 */
export function normalizeSiteVerificationToken(
  raw: string | undefined,
): string | undefined {
  if (!raw) {
    return undefined
  }

  let value = raw.trim()
  // BOM 제거
  if (value.charCodeAt(0) === 0xfeff) {
    value = value.slice(1).trim()
  }

  // 바깥쪽 따옴표 한 쌍 제거 (Vercel/복붙 시 흔함)
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }

  // 전체 <meta ... content="..." /> 를 붙여넣은 경우
  const fromMeta = value.match(/content\s*=\s*["']([^"']+)["']/i)
  if (fromMeta?.[1]) {
    value = fromMeta[1].trim()
  }

  // 잘못된 값(태그 조각 등)은 제외
  if (!value || /[<>]/.test(value)) {
    return undefined
  }

  return value
}
