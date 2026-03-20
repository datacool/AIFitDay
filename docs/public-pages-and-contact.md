# 공개 페이지 · 문의 환경 변수

AdSense 등 공개 심사를 위해 `/about`, `/privacy`, `/contact`가 제공됩니다.

## Vercel(·로컬)에 선택적으로 설정

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SITE_URL` | 공개 사이트 베이스 URL. 미설정 시 `https://ai-fit-day.vercel.app` (`app/layout.tsx`의 `metadataBase`). 커스텀 도메인 연결 시 해당 URL로 지정 권장. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | (선택) 정식 출시 후 공개 문의 메일 등. MVP `/contact`에는 미표시. `개인정보처리방침` 등에서만 사용 가능. |
| `NEXT_PUBLIC_CONTACT_FORM_URL` | Google Forms 등 문의 폼 전체 URL. 설정 시 `/contact`에 링크 버튼 표시. |

변경 후 **재배포**하면 반영됩니다.
