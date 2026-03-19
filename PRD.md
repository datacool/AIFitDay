# AI 할일 관리 웹 서비스 PRD

## 1) 문서 개요

- 문서명: AI Todo Manager PRD
- 버전: v1.0
- 작성일: 2026-03-15
- 대상: 기획, 프론트엔드, 백엔드, AI 기능 개발자
- 목적: 본 문서는 MVP 개발에 바로 착수 가능한 수준의 제품 요구사항을 정의한다.

## 2) 제품 비전 및 목표

### 2.1 비전
사용자가 자연어로 빠르게 할 일을 등록하고, AI 기반 요약/분석을 통해
일의 우선순위를 명확히 관리할 수 있는 개인 생산성 웹 서비스를 제공한다.

### 2.2 핵심 목표
- 인증된 사용자별로 안전하게 할 일을 관리한다.
- 생성/조회/수정/삭제, 검색/필터/정렬을 직관적으로 제공한다.
- AI를 통해 입력 비용(작성 시간)을 줄이고, 주간/일간 인사이트를 제공한다.
- 로딩/빈 상태/오류 상태를 명확히 보여 UX 완성도를 확보한다.
- 날씨/옷차림 정보를 통해 매일 다시 방문하고 싶은 사용 경험을 제공한다.

### 2.4 제품 인상(브랜드 톤)
- 핵심 인상: 트렌디함, 편안함, 재방문 유도
- UX 원칙: 빠른 정보 인지, 감성적인 비주얼, 행동 유도 문구의 친근한 톤

### 2.3 비목표(초기 MVP 제외)
- 팀/조직 협업(공유 워크스페이스, 멘션)
- 푸시 알림, 캘린더 양방향 동기화
- 모바일 네이티브 앱

## 3) 대상 사용자 및 시나리오

### 3.1 주요 사용자
- 개인 사용자(직장인/학생/프리랜서)
- 반복적으로 할 일을 기록하고, 마감/우선순위를 관리해야 하는 사용자

### 3.2 대표 시나리오
1. 이메일/비밀번호로 회원가입 후 로그인한다.
2. 자연어로 할 일을 입력해 AI 자동 구조화를 수행한다.
3. 리스트에서 검색/필터/정렬로 오늘 할 일을 빠르게 찾는다.
4. 완료 처리 후 일일/주간 요약을 확인한다.

## 4) 범위(Scope)

## 4.1 필수 범위(MVP)
- 이메일/비밀번호 로그인, 회원가입, 로그아웃
- 개인 할일 CRUD
- 검색(제목/설명), 필터(우선순위/카테고리/상태), 정렬(우선순위/마감/생성일)
- AI 할일 생성(자연어 -> 구조화 데이터)
- AI 요약/분석(일일, 주간)
- 날씨 허브(오늘/내일/주간) + 활동지수 + 옷차림 추천(WeatherAPI)

### 4.2 확장 범위(Post-MVP)
- 통계/분석 대시보드(완료율, 카테고리 통계, 활동량 차트)
- 반복 할일, 알림, 캘린더 연동

## 5) 화면 구성 정보 구조(IA)

### 5.1 라우트 구성(제안)
- `/`: 날씨 중심 홈 화면(오늘/내일/주간, 활동지수, 옷차림 추천)
- `/auth/login`: 로그인
- `/auth/signup`: 회원가입
- `/todos`: 할일 메인 화면
- `/stats` (확장): 통계/분석 화면

### 5.2 화면별 요구사항

#### A. 홈 화면(`/`) - 날씨 허브
- 목적:
  - 내일 날씨, 이번 주 날씨, 기온별 옷차림을 빠르게 확인
  - 사용자에게 트렌디하고 편안한 첫인상 제공
- 레이아웃:
  - 좌측(약 65~70%): 오늘의 날씨 정보 메인 카드
  - 우측 상단: 활동지수(Activity Score) 카드
  - 우측 하단: 캐릭터 옷차림 추천 카드
- 포함 정보:
  - 오늘의 날씨: 온도/체감온도/강수확률/풍속/날씨 아이콘
  - 내일 날씨 요약
  - 이번 주(7일) 예보 요약
- 활동지수 문구:
  - 80점 이상: "지금 나가면 딱 좋아요. 가볍게 실외 활동을 즐겨보세요."
  - 80점 미만: "오늘은 실내에서 집중하기 좋은 날이에요."
- 옷차림 추천:
  - 캐릭터에 의상 asset을 조합해 시각적으로 표시
  - 기본 asset: 반팔티, 반바지, 바람막이, 후드티, 패딩, 코트
  - 기온/강수/바람 기반 추천 규칙 적용
- 디자인 소스:
  - V0 디자인 페이지를 기준으로 구현
  - `npx shadcn@latest add "<v0-url>"` 방식으로 컴포넌트 초안 반영 가능

#### B. 로그인/회원가입 화면
- 입력: 이메일, 비밀번호
- 동작:
  - 회원가입 성공 시 안내 메시지 후 로그인 화면 또는 메인 이동
  - 로그인 성공 시 `/todos`로 이동
- 예외 처리:
  - 잘못된 계정 정보, 중복 이메일, 네트워크 오류를 한글 메시지로 표기
- 상태 UI:
  - 제출 중 버튼 로딩 상태
  - 오류 문구 표시 영역

#### C. 할일 관리 메인 화면
- 섹션:
  - 상단: 사용자 정보, 로그아웃, 오늘 날씨
  - 입력: 일반 추가 폼 + AI 자연어 입력 폼
  - 목록: 할일 카드/테이블
  - 제어: 검색, 필터(우선순위/카테고리/상태), 정렬
  - 분석: AI 일일/주간 요약 버튼 및 결과 패널
- 상태 UI:
  - 로딩: 스켈레톤/스피너
  - 빈 상태: "등록된 할 일이 없습니다" + 생성 유도 CTA
  - 오류 상태: 재시도 버튼 + 사용자 친화적 안내 문구

#### D. 통계/분석 화면(확장)
- 주간 활동량, 완료율, 카테고리 분포 차트
- 기간 선택(이번 주/이번 달)

## 6) 기능 요구사항 상세

## 6.1 인증(Supabase Auth)
- 이메일/비밀번호 회원가입
- 이메일/비밀번호 로그인
- 세션 유지(새로고침 후 로그인 상태 복원)
- 로그아웃
- 비인증 사용자의 보호 라우트 접근 차단

### 수용 기준(Acceptance Criteria)
- [ ] 유효한 계정으로 로그인 시 `/todos`로 이동한다.
- [ ] 잘못된 자격 증명 입력 시 한글 오류 메시지를 보여준다.
- [ ] 로그아웃 시 보호 라우트 접근이 차단된다.

## 6.2 할일 CRUD
- 생성: 제목 필수, 그 외 항목 선택 또는 기본값
- 조회: 로그인 사용자 본인 데이터만 조회
- 수정: 제목/설명/마감일/우선순위/카테고리/완료 상태
- 삭제: 소프트 삭제(`is_deleted`) 기본, 필요 시 하드 삭제 정책 별도

### 할일 필드 정의
- `title` (string, required)
- `description` (string, optional)
- `created_date` (datetime, required, default now)
- `due_date` (datetime, optional)
- `priority` (enum: high | medium | low, default medium)
- `category` (string or string[], default "개인")
- `completed` (boolean, default false)

### 수용 기준
- [ ] 제목 없이 생성 시 저장되지 않고 오류 메시지 표시
- [ ] 수정/삭제 후 목록이 즉시 갱신
- [ ] 사용자 A는 사용자 B의 할일을 조회/수정/삭제할 수 없다.

## 6.3 검색/필터/정렬
- 검색: 제목, 설명 부분 일치(대소문자 무시)
- 필터:
  - 우선순위: 높음/중간/낮음
  - 카테고리: 업무/개인/학습/기타(확장 가능)
  - 진행상태:
    - 진행중: `completed = false` and `due_date >= now or null`
    - 완료: `completed = true`
    - 지연: `completed = false` and `due_date < now`
- 정렬:
  - 우선순위순(high > medium > low)
  - 마감일순(오름차순)
  - 생성일순(내림차순 기본)

### 수용 기준
- [ ] 검색어 입력 시 300ms 디바운스로 결과 갱신
- [ ] 복수 필터 조합 시 결과가 논리적으로 일치
- [ ] 정렬 변경 시 재조회 또는 클라이언트 정렬이 일관 동작

## 6.4 AI 할일 생성
- 입력: 자유 텍스트
- 출력: 구조화된 할일 JSON
- 파싱 실패 시:
  - 안전한 기본값으로 폴백 또는 재생성 요청
  - 사용자에게 한글 안내 메시지 노출

### 출력 스키마(목표)
```json
{
  "title": "팀 회의 준비",
  "description": "내일 오전 10시에 있을 팀 회의를 위해 자료 작성하기",
  "created_date": "YYYY-MM-DDTHH:mm:ssZ",
  "due_date": "YYYY-MM-DDTHH:mm:ssZ",
  "priority": "high",
  "category": ["업무"],
  "completed": false
}
```

### 수용 기준
- [ ] 자연어 1문장 입력으로 `title`과 `due_date`가 가능한 범위에서 자동 추출된다.
- [ ] 스키마 검증 실패 시 저장하지 않고 오류 메시지를 표시한다.

## 6.5 AI 요약/분석
- 일일 요약:
  - 오늘 완료 항목 수, 미완료 핵심 항목, 추천 우선순위
- 주간 요약:
  - 주간 완료율, 카테고리별 진행률, 지연 항목 요약

### 수용 기준
- [ ] 버튼 클릭 1회로 요약 생성
- [ ] 데이터가 없을 때는 "요약할 할 일이 없습니다" 메시지 표시
- [ ] 요약 생성 실패 시 재시도 액션 제공

## 6.6 날씨 허브 및 옷차림 추천(WeatherAPI)
- 위치 기준: 기본은 사용자 브라우저 locale 또는 고정 도시(초기값 서울)
- 표시 정보:
  - 오늘: 현재 온도, 체감 온도, 날씨 상태 텍스트, 아이콘
  - 내일: 최저/최고 기온, 강수 확률, 요약 문구
  - 이번 주: 7일 예보(요일별 상태/최저/최고)
  - 활동지수(Activity Score, 0~100) 및 문구
  - 기온/날씨 기반 캐릭터 옷차림 추천
- 홈 레이아웃 요구사항(`/`):
  - 좌측 메인 날씨 카드가 화면 폭의 65~70%를 차지
  - 우측 상단에 활동지수 카드 배치
  - 우측 하단에 캐릭터 옷차림 추천 카드 배치
- 활동지수 기준:
  - 80점 이상: 실외활동 추천 문구 노출
  - 80점 미만: 실내활동 추천 문구 노출
- 옷차림 추천 로직(초안):
  - 27도 이상: 반팔티 + 반바지
  - 20~26도: 반팔티 + 바람막이(바람 강하면 가중)
  - 12~19도: 후드티
  - 5~11도: 코트
  - 4도 이하: 패딩
  - 비/눈 예보 시 방수/보온 우선 아이템으로 보정
- 실패 처리:
  - 날씨 영역만 독립적으로 오류 처리(앱 전체에 영향 없음)

### 수용 기준
- [ ] `/` 진입 시 오늘/내일/주간 날씨를 비동기 로드한다.
- [ ] 좌우 2컬럼 레이아웃에서 좌측 날씨 카드 폭이 65~70% 범위를 유지한다.
- [ ] 활동지수 점수 구간(80 기준)에 따라 문구가 정확히 바뀐다.
- [ ] 기온/날씨 조건에 따라 캐릭터 의상 조합이 변경된다.
- [ ] Weather API 오류 시 나머지 기능은 정상 동작한다.

## 7) 비기능 요구사항

## 7.1 성능
- 초기 주요 화면(LCP) 목표: 2.5초 이내(일반 네트워크 기준)
- 검색/필터 상호작용 반응 목표: 200ms 내 체감 응답
- 목록은 페이지네이션 또는 가상화 전략 고려(데이터 증가 대비)

## 7.2 안정성/오류 처리
- 서버/클라이언트 모두 try-catch 및 공통 에러 포맷 적용
- 사용자 메시지는 한글, 개발 로그는 상세 정보 포함
- 에러 로깅 레벨 분리(info/warn/error)

## 7.3 보안
- Supabase RLS 필수 활성화
- 사용자별 데이터 격리 정책 강제
- API 키는 `.env.local`로만 관리, 클라이언트 노출 금지

## 7.4 접근성
- 폼 요소 label 연결
- 키보드 내비게이션 및 포커스 스타일 제공
- 색상 대비 WCAG AA 수준 준수 권장

## 8) 기술 스택 및 아키텍처

- 프레임워크: Next.js(App Router)
- 언어: TypeScript(`strict` 권장)
- UI: Tailwind CSS, Shadcn/ui
- 인증/DB: Supabase(Auth + Postgres)
- AI: AI SDK + Google Gemini
- 품질: ESLint(Next + TS 규칙)

### 아키텍처(제안)
- UI 레이어: `app/*`, `components/*`
- 서버 액션/라우트 핸들러: `app/api/*` 또는 Server Actions
- 데이터 접근: `lib/supabase/*`
- AI 모듈: `lib/ai/*` (프롬프트/스키마/파서 분리)
- 날씨 모듈: `lib/weather/*` (스코어 계산, 의상 추천 규칙)
- 날씨 UI: `components/weather/*` (`WeatherHero`, `ActivityScoreCard`, `OutfitAvatar`)
- 의상 asset: `public/assets/outfits/*`

## 9) 데이터 구조(Supabase)

## 9.1 테이블 설계

### users (프로필, Auth 보조)
- `id` uuid pk (auth.users.id 참조)
- `email` text unique
- `display_name` text null
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

### todos
- `id` uuid pk default gen_random_uuid()
- `user_id` uuid not null references auth.users(id)
- `title` text not null
- `description` text null
- `created_date` timestamptz not null default now()
- `due_date` timestamptz null
- `priority` text not null default 'medium'
- `category` text[] not null default '{개인}'
- `completed` boolean not null default false
- `is_deleted` boolean not null default false
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### weather_preferences (선택, 개인화 확장용)
- `id` uuid pk default gen_random_uuid()
- `user_id` uuid not null references auth.users(id)
- `preferred_style` text not null default '편안함'  -- 예: 편안함/트렌디/포멀
- `cold_sensitivity` int not null default 0         -- 추위 민감도(-2~+2)
- `hot_sensitivity` int not null default 0          -- 더위 민감도(-2~+2)
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### 권장 인덱스
- `todos(user_id, created_date desc)`
- `todos(user_id, due_date asc)`
- `todos(user_id, completed)`
- `todos using gin(category)`

## 9.2 RLS 정책(필수)
- `select`: `auth.uid() = user_id`
- `insert`: `auth.uid() = user_id`
- `update`: `auth.uid() = user_id`
- `delete`: `auth.uid() = user_id`

## 10) API/인터페이스 계약(제안)

## 10.1 Todo API
- `GET /api/todos`
  - query: `q`, `priority`, `category`, `status`, `sort`
- `POST /api/todos`
- `PATCH /api/todos/:id`
- `DELETE /api/todos/:id`

## 10.2 AI API
- `POST /api/ai/todos/parse`
  - input: `{ text: string }`
  - output: Todo draft(JSON)
- `POST /api/ai/todos/summary`
  - input: `{ period: "daily" | "weekly" }`
  - output: `{ summary: string, stats: object }`

## 10.3 Weather API 프록시
- `GET /api/weather/today?location=Seoul`
  - 서버에서 WeatherAPI 호출 후 필요한 데이터만 반환
- `GET /api/weather/tomorrow?location=Seoul`
- `GET /api/weather/weekly?location=Seoul&days=7`
- `GET /api/weather/activity-score?location=Seoul`
  - output: `{ score: number, message: string, factors: object }`
- `POST /api/weather/outfit-recommendation`
  - input: `{ tempC: number, condition: string, windKph?: number, precipMm?: number }`
  - output: `{ items: string[], reason: string }`

## 11) 환경 변수 요구사항

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (Google Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=

# Weather API
WEATHERAPI_KEY=
```

## 12) 분석 지표(KPI)

- DAU/WAU
- 할일 생성 수(일/주)
- 완료율(%), 지연 항목 비율(%)
- AI 생성 기능 사용률
- AI 요약 기능 재사용률
- 홈(`/`) 재방문율(1일/7일 리텐션)
- 날씨 카드 상호작용률(내일/주간 탭 클릭률)
- 옷차림 추천 기능 조회율

## 13) 개발 단계 및 일정(제안)

### Phase 1 (1주)
- 인증, 기본 라우팅, DB 스키마, RLS 구축

### Phase 2 (1주)
- Todo CRUD + 검색/필터/정렬 + 상태 UI 완성

### Phase 3 (1주)
- AI 할일 생성, AI 요약/분석, 오류 처리 고도화

### Phase 4 (0.5주)
- 날씨 허브(오늘/내일/주간) + 활동지수 + 옷차림 추천 연동
- V0 디자인 반영, 의상 asset 적용, QA, 성능/접근성 점검

## 14) 테스트 전략

- 단위 테스트: 유틸(정렬/필터/파서), 스키마 검증
- 통합 테스트: 인증 플로우, CRUD, AI API, Weather API fallback
- E2E 테스트:
  - 회원가입 -> 로그인 -> 할일 생성/완료 -> 요약 확인
- 회귀 체크:
  - 로딩/빈/오류 상태 UI 항상 표시되는지 확인

## 15) 완료 정의(Definition of Done)

- [ ] 필수 기능(인증, CRUD, 검색/필터/정렬, AI 생성/요약, 날씨 허브) 구현
- [ ] 사용자별 데이터 격리(RLS) 검증 완료
- [ ] 주요 플로우 E2E 통과
- [ ] 오류 메시지 한글화 및 개발 로그 확인 가능
- [ ] 성능/접근성 최소 기준 충족

---

본 PRD는 MVP 기준이며, 구현 과정에서 발견되는 기술 제약 및 UX 피드백에
따라 버전 업데이트(v1.1+)를 수행한다.
