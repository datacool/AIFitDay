# 검색엔진 등록 (Google · 네이버)

배포 URL은 Vercel 환경 변수 `NEXT_PUBLIC_SITE_URL` 과 일치해야 합니다  
(예: `https://ai-fit-day.vercel.app`, 끝에 `/` 없이).

## 1. Google Search Console

1. [Search Console](https://search.google.com/search-console) → **속성 추가** → **URL 접두어** 에 사이트 루트 URL 입력.
2. **소유권 확인**
   - **HTML 태그**: Search Console이 보여 주는 태그에서 **`content="..."` 안의 문자열만** 복사합니다.  
     (태그 전체를 넣지 마세요. 앞뒤에 `"` 를 추가하지 마세요.)
   - Vercel → Project → **Settings → Environment Variables** 에  
     `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 이름으로 위 문자열만 저장합니다.
   - **저장 후 반드시 재배포**(Redeploy)하세요. `NEXT_PUBLIC_*` 값은 **빌드 시점**에 HTML에 박히므로, 배포 없이 확인만 누르면 구글이 옛 HTML을 봅니다.
   - 배포 후 브라우저에서 사이트 연 다음 **페이지 소스 보기**로  
     `<meta name="google-site-verification" content="여기에_토큰" />` 가 `<head>` 에 있는지 확인합니다.
   - 태그 전체를 실수로 넣었다면 `lib/verification-env.ts` 가 `content` 만 추출하도록 정규화하지만, 가능하면 **토큰만** 넣는 것이 가장 안전합니다.
   - 또는 **DNS TXT** / HTML 파일 방식을 사용해도 됩니다.
3. **색인** → **Sitemaps** 에 다음을 제출합니다.  
   `{SITE_URL}/sitemap.xml`  
   예: `https://ai-fit-day.vercel.app/sitemap.xml`
4. **URL 검사**로 `/about`, `/faq` 등 공개 페이지에 대해 색인 생성을 요청합니다(가능한 경우).

## 2. 네이버 서치어드바이저

1. [서치어드바이저](https://searchadvisor.naver.com/) → 사이트 추가 → 동일한 루트 URL.
2. **소유 확인** 메타 태그의 `content` 값을  
   `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` 에 넣고 재배포합니다.  
   `<meta name="naver-site-verification" ... />` 는 `metadata.other` 로 출력됩니다.
3. **사이트맵 제출**에 동일하게 `.../sitemap.xml` 을 등록합니다.
4. UI 안내에 따라 **수집 요청** 등을 진행합니다.

## 3. 환경 변수 요약

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SITE_URL` | 사이트 절대 URL (sitemap·robots·metadataBase) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console HTML 태그의 verification 값 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | 네이버 소유확인 meta content 값 |

로컬 `.env.local` 예시는 버전 관리에 넣지 마세요.

## 4. 구현 참고

- `app/sitemap.ts` — 공개 경로만 `/sitemap.xml` 으로 노출.
- `app/robots.ts` — `Allow: /`, `Disallow: /dashboard`, `Sitemap` URL 포함.
- `app/dashboard/layout.tsx` — `robots: noindex` 로 대시보드 색인 완화.

## 5. (선택) Bing

[Bing Webmaster Tools](https://www.bing.com/webmasters) 에서 동일하게 소유 확인 및 사이트맵 제출.
