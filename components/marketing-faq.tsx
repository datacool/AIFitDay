"use client"

import type { ReactNode } from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type FaqItem = { q: string; a: ReactNode }

const faqSections: { id: string; title: string; items: FaqItem[] }[] = [
  {
    id: "service",
    title: "서비스 소개",
    items: [
      {
        q: "AIFitDay는 어떤 서비스인가요?",
        a: (
          <>
            <p>
              날씨 정보와 할 일 관리를 한곳에서 할 수 있는 웹 서비스입니다. 로그인
              후 대시보드에서 오늘의 날씨·할 일 목록·AI 요약 등을 이용할 수
              있습니다.
            </p>
          </>
        ),
      },
      {
        q: "모바일 앱도 있나요?",
        a: (
          <p>
            현재는 웹 브라우저에서 이용하실 수 있습니다. 스마트폰에서도 브라우저로
            접속해 사용할 수 있으며, 홈 화면에 추가해 두시면 앱처럼 편하게 쓰실 수
            있습니다.
          </p>
        ),
      },
    ],
  },
  {
    id: "account",
    title: "계정·로그인",
    items: [
      {
        q: "회원가입은 어떻게 하나요?",
        a: (
          <p>
            상단의「회원가입」에서 이메일과 비밀번호로 가입할 수 있습니다. 일부
            환경에서는 이메일 인증 후 로그인해야 할 수 있습니다.
          </p>
        ),
      },
      {
        q: "로그인이 되지 않아요.",
        a: (
          <p>
            이메일·비밀번호를 다시 확인해 주세요. 비밀번호를 잊으셨다면 Supabase
            대시보드에서 제공하는 비밀번호 재설정 흐름을 이용해야 할 수 있습니다.
            지속되면 문의하기로 오류 화면이나 시도 시각을 알려 주시면 확인에
            도움이 됩니다.
          </p>
        ),
      },
    ],
  },
  {
    id: "data",
    title: "데이터·개인정보",
    items: [
      {
        q: "내 할 일 데이터는 어떻게 보호되나요?",
        a: (
          <p>
            할 일 등 개인 데이터는 로그인한 계정에 연결되어 저장되며, 자세한
            처리 방침은「개인정보처리방침」페이지를 참고해 주세요.
          </p>
        ),
      },
      {
        q: "계정을 삭제하고 싶어요.",
        a: (
          <p>
            서비스 내 계정 삭제 기능이 없을 수 있습니다. 계정 및 데이터 삭제를
            원하시면 문의하기로 가입 이메일을 남겨 주시면 안내해 드리겠습니다.
          </p>
        ),
      },
    ],
  },
  {
    id: "support",
    title: "오류 제보·문의",
    items: [
      {
        q: "버그는 어떻게 제보하면 되나요?",
        a: (
          <p>
            문의하기에서 유형을「기능 오류」로 선택한 뒤, 가능하면 사용 중인
            브라우저, 발생 시각, 화면 캡처와 함께 설명해 주시면 수정에 큰 도움이
            됩니다.
          </p>
        ),
      },
      {
        q: "답변은 언제쯤 오나요?",
        a: (
          <p>
            접수 확인을 우선 드리고, 내용에 따라 순차적으로 답변합니다. 다만
            영업일·업무 시간 외에는 다소 지연될 수 있으며, 긴급한 보안 이슈는
            제목에「보안」을 포함해 주시면 검토를 우선하겠습니다.
          </p>
        ),
      },
    ],
  },
]

/** 마케팅 FAQ(아코디언). */
export function MarketingFaq() {
  return (
    <div className="mt-8 space-y-10">
      {faqSections.map((section) => (
        <section key={section.id} aria-labelledby={`faq-${section.id}-heading`}>
          <h2
            id={`faq-${section.id}-heading`}
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            {section.title}
          </h2>
          <Accordion
            type="multiple"
            className="mt-3 w-full"
          >
            {section.items.map((item, index) => (
              <AccordionItem
                key={`${section.id}-${index}`}
                value={`${section.id}-${index}`}
              >
                <AccordionTrigger className="text-sm">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  )
}
