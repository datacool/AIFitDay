# FAQ·문의 채널 (운영자 가이드)

## 라우트

- `/faq` — 자주 묻는 질문 (마케팅 레이아웃)
- `/contact` — 온사이트 문의 폼 + (선택) Google 폼 (MVP: 공개 `mailto` 이메일 블록은 비표시)

## 문의 접수 API

- `POST /api/contact`
- **권장:** `multipart/form-data` — `name`, `email`, `category`, `message`, 선택 `attachments`(이미지 파일 여러 개), 선택 `website`(허니팟·비어 있어야 함)
- **호환:** `application/json`(첨부 없음)
- `category`: `general` | `bug` | `account` | `partnership` | `privacy` | `other`
- 첨부: JPG/PNG/WebP/GIF, 최대 3장, 장당 5MB → Storage 버킷 `contact-attachments`에 저장 후 `attachment_paths`에 경로 저장

### 환경 변수

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 기존과 동일 |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** — DB insert·Storage 업로드 (클라이언트·깃에 넣지 말 것) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | **(선택)** 정식 출시 시 공개 문의 메일 등에 사용 예정. 현재 `/contact`에는 노출하지 않음. `개인정보처리방침` 등 다른 페이지에서만 필요 시 사용 가능. |

서비스 롤 키가 없으면 API는 **503**이며, 화면에는 “접수 시스템 준비 중” 류의 문구만 노출됩니다.

### 데이터베이스·스토리지

1. [`schema.sql`](../schema.sql)의 `contact_submissions`·`attachment_paths`·Storage 버킷(`contact-attachments`) 구문을 Supabase SQL Editor에서 실행합니다.
2. 이미 테이블만 있는 경우: `alter table … add column if not exists attachment_paths` 및 `storage.buckets` insert 구문만 실행해도 됩니다.

## 자동 이메일 (선택)

현재는 DB·스토리지 저장 + 화면 접수 확인만 합니다. 접수 즉시 사용자 메일로 자동 회신하려면 Resend 등을 `POST /api/contact` 성공 분기에 연결하면 됩니다.

## 고객용 문구

[`components/contact-form.tsx`](../components/contact-form.tsx), [`app/(marketing)/contact/page.tsx`](../app/(marketing)/contact/page.tsx)에서 수정합니다.
