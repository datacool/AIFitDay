import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "AIFitDay 서비스의 개인정보 수집·이용 및 보관에 관한 안내입니다.",
  alternates: { canonical: "/privacy" },
}

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        개인정보처리방침
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        시행일: 2026년 3월 19일 · 서비스명: AIFitDay (에이핏데이)
      </p>

      <div className="mt-8 max-w-none space-y-4 text-sm leading-relaxed">
        <h2 className="mt-8 text-lg font-semibold text-foreground">1. 개요</h2>
        <p className="text-muted-foreground">
          AIFitDay(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요하게
          생각합니다. 본 방침은 서비스가 어떤 정보를 수집·이용하는지와 관련
          권리를 설명합니다. 서비스 이용 시 본 방침에 동의하는 것으로
          간주됩니다.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-foreground">
          2. 수집하는 항목
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">계정</strong>: 이메일 주소,
            비밀번호(해시 저장), 표시 이름 등 회원가입 시 입력 정보
          </li>
          <li>
            <strong className="text-foreground">서비스 이용 데이터</strong>:
            생성한 할 일(제목, 설명, 마감일, 우선순위, 카테고리, 완료 여부
            등), 로그인·세션에 필요한 식별자
          </li>
          <li>
            <strong className="text-foreground">기기·접속 정보</strong>: IP,
            쿠키, 브라우저 유형 등은 인증·보안·분석 목적으로 제3자
            인프라(Supabase, 호스팅사 등)를 통해 처리될 수 있습니다.
          </li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-foreground">3. 이용 목적</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>회원 식별, 로그인·보안, 서비스 제공 및 유지</li>
          <li>할 일 데이터 저장·동기화</li>
          <li>문의 처리 및 고지·알림(필요 시)</li>
          <li>
            서비스 개선, 품질 분석 —{" "}
            <strong className="text-foreground">
              Google Analytics 등 분석 도구
            </strong>
            를 연동하는 경우 이용 및 쿠키 정책에 따릅니다.
          </li>
          <li>
            <strong className="text-foreground">Google AdSense</strong> 등
            광고를 게재하는 경우, 광고 맞춤·측정을 위한 정보가 처리될 수
            있으며 관련 정책을 준수합니다.
          </li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-foreground">
          4. 제3자 제공·처리 위탁
        </h2>
        <p className="text-muted-foreground">
          서비스 운영을 위해 다음과 같은 사업자의 서비스를 이용할 수 있습니다.
          각 사업자의 개인정보 처리방침을 함께 확인해 주세요.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Supabase</strong>: 인증 및 DB
            호스팅
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong> 등 호스팅·배포
          </li>
          <li>WeatherAPI 등 날씨 데이터 API</li>
          <li>OpenAI 등 AI 기능 제공 사(해당 기능 이용 시)</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-foreground">
          5. 보관 및 파기
        </h2>
        <p className="text-muted-foreground">
          이용 목적 달성 후 관련 법령에 따른 보관 기간이 있는 경우를 제외하고
          지체 없이 파기합니다. 회원 탈퇴·삭제 절차가 마련되는 경우 해당
          절차에 따릅니다.
        </p>

        <h2 className="mt-8 text-lg font-semibold">6. 이용자 권리</h2>
        <p className="text-muted-foreground">
          개인정보 열람·정정·삭제·처리 정지를 요청할 수 있으며, 문의
          경로로 연락 주시면 성실히 조치하겠습니다.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-foreground">7. 문의</h2>
        <p className="text-muted-foreground">
          개인정보 관련 문의:{" "}
          <Link href="/contact" className="font-medium text-primary underline">
            문의 페이지
          </Link>
          {contactEmail && contactEmail.includes("@") ? (
            <>
              {" "}
              또는{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="font-medium text-primary underline"
              >
                {contactEmail}
              </a>
            </>
          ) : null}
        </p>

        <h2 className="mt-8 text-lg font-semibold text-foreground">8. 방침 변경</h2>
        <p className="text-muted-foreground">
          법령·서비스 변경에 따라 본 방침을 수정할 수 있으며, 중요한 변경 시
          서비스 내 공지 등 합리적인 방법으로 안내합니다.
        </p>
      </div>
    </main>
  )
}
