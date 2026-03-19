![1773763692826](image/troubleshooting-auth/1773763692826.png)![1773763701293](image/troubleshooting-auth/1773763701293.png)![1773763720636](image/troubleshooting-auth/1773763720636.png)![1773763750735](image/troubleshooting-auth/1773763750735.png)![1773765885729](image/troubleshooting-auth/1773765885729.png)![1773765887782](image/troubleshooting-auth/1773765887782.png)![1773765916672](image/troubleshooting-auth/1773765916672.png)![1773765917656](image/troubleshooting-auth/1773765917656.png)![1773765923123](image/troubleshooting-auth/1773765923123.png)# Auth 트러블슈팅 회고

## 개요

- 대상 프로젝트: AI Todo 웹 서비스
- 이슈 요약:
  - 로그아웃 후 페이지 전환이 멈추고 렌더링만 지속됨
  - 로그인 성공 후에도 메인 페이지 전환이 불안정함
  - 특정 시점에서 `Internal Server Error` 발생

## 주요 증상

- `/`와 `/login` 사이를 반복 요청하는 패턴
- 로그인 폼 요청이 `GET /login?email=...&password=...` 형태로 나타남
- 서버 로그에 `.next` 산출물 접근 오류(`page_client-reference-manifest.js`) 발생
- 개발 서버 `lock` 충돌로 `next dev` 중복 실행 에러 발생

## 원인 진단

### 1) 인증 리다이렉트 충돌

- 클라이언트(`useEffect`, `onAuthStateChange`)와 서버(`middleware`)가
  동시에 인증 라우팅을 강제하면서 타이밍 충돌이 발생했다.

### 2) 폼 기본 제출 방식 이슈

- 로그인 폼이 기본 GET 제출로 동작할 가능성이 있어 URL query가 오염되고
  상태 전환 흐름을 불안정하게 만들었다.

### 3) 개발 캐시 손상

- `.next` 내부 manifest 파일 접근 오류로 `Internal Server Error`가
  발생해 인증 이슈와 별개로 렌더링 장애를 유발했다.

### 4) 개발 서버 중복 실행

- 이미 실행 중인 `next dev` 프로세스가 포트/lock을 점유해
  재실행 시도 때 문제를 증폭시켰다.

## 수행한 조치

1. 개발 서버 충돌 정리
   - 포트 점유 프로세스 종료 후 재실행
2. Turbopack 경로 이슈 우회
   - `next dev --webpack` 적용
3. 인증 기능 구현
   - `signInWithPassword`, `signUp`, `signOut` 연결
4. 인증 상태 관리 강화
   - `getSession()` 기반 초기 확인
   - `onAuthStateChange` 구독 적용
5. 라우팅 충돌 완화
   - `middleware` 범위를 `/` 보호 중심으로 축소
6. 전환 안정화
   - 로그인/회원가입/로그아웃 성공 시 `window.location.assign(...)` 사용
   - 로그아웃 타임아웃 안전장치 추가
7. 캐시 복구
   - `.next` 삭제 후 dev 서버 클린 재기동

## 최종 안정화 포인트

- 서버단 가드와 클라이언트 가드를 동시에 과도하게 강제하지 않는다.
- 보호 라우트는 서버단에서 명확히 제어한다.
- 인증 직후 전환은 하드 네비게이션으로 확정해 상태 꼬임을 줄인다.
- 문제가 재현되면 라우팅 로그와 `.next` 상태를 먼저 분리 확인한다.

## 재발 방지 체크리스트

- [ ] `next dev` 중복 실행 여부 확인
- [ ] `.next` 캐시 손상 여부 확인
- [ ] 폼 제출 방식(`method="post"`) 명시 확인
- [ ] 인증 라우팅 책임(서버/클라이언트) 중복 여부 점검
- [ ] 로그인/로그아웃 E2E 시나리오 수동 테스트

## 빠른 대응 가이드

1. `lock` 에러 발생 시
   - 기존 `node` 프로세스 종료 후 `npm run dev`
2. `Internal Server Error` 반복 시
   - 서버 종료 -> `.next` 삭제 -> 재실행
3. 로그인/로그아웃 전환 멈춤 시
   - 네트워크 탭에서 `/` ↔ `/login` 반복 요청 확인
   - 인증 가드 충돌 여부 점검
