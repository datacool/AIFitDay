import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"

const inputSchema = z.object({
  text: z.string().trim().min(2).max(500),
})

const aiOutputSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000),
  dueDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]),
  dueTime: z.union([z.string().regex(/^\d{2}:\d{2}$/), z.null()]),
  priority: z.enum(["high", "medium", "low"]),
  category: z.array(z.string().min(1)).max(3),
  completed: z.boolean(),
})

const toIsoDateTime = (dueDate?: string | null, dueTime?: string | null) => {
  if (!dueDate) return null
  const normalizedTime = dueTime ?? "09:00"
  const parsed = new Date(`${dueDate}T${normalizedTime}:00+09:00`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

const collapseSpaces = (value: string) => value.replace(/\s+/g, " ").trim()

const sanitizeInputText = (value: string) =>
  collapseSpaces(value.normalize("NFC")).toLocaleLowerCase("ko-KR")

const limitTextLength = (value: string, max: number) => {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

const ensureTitleLength = (title: string, fallbackText: string) => {
  const base = collapseSpaces(title)
  if (base.length === 0) {
    return limitTextLength(fallbackText, 40) || "새 할일"
  }
  if (base.length < 2) {
    return `${base} 할일`
  }
  return limitTextLength(base, 40)
}

const parseDateYmd = (value: string) => {
  const [year, month, day] = value.split("-").map((v) => Number(v))
  if (!year || !month || !day) return null
  return { year, month, day }
}

const getKstNow = () => {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0")

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  }
}

const buildYmdFromDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`

const createLocalDate = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day)

const addDaysYmd = (baseYmd: string, days: number) => {
  const parsed = parseDateYmd(baseYmd)
  if (!parsed) return baseYmd
  const next = createLocalDate(parsed.year, parsed.month, parsed.day)
  next.setDate(next.getDate() + days)
  return buildYmdFromDate(next)
}

const getWeekdayFromYmd = (value: string) => {
  const parsed = parseDateYmd(value)
  if (!parsed) return 0
  const date = createLocalDate(parsed.year, parsed.month, parsed.day)
  return date.getDay()
}

const getNearestWeekdayYmd = (baseYmd: string, targetWeekday: number) => {
  const parsed = parseDateYmd(baseYmd)
  if (!parsed) return baseYmd
  const base = createLocalDate(parsed.year, parsed.month, parsed.day)
  const diff = (targetWeekday - base.getDay() + 7) % 7
  base.setDate(base.getDate() + diff)
  return buildYmdFromDate(base)
}

const getNextWeekWeekdayYmd = (baseYmd: string, targetWeekday: number) => {
  const nearest = getNearestWeekdayYmd(baseYmd, targetWeekday)
  const nearestWeekday = getWeekdayFromYmd(nearest)
  const baseWeekday = getWeekdayFromYmd(baseYmd)
  const isSameOrThisWeek = nearestWeekday >= baseWeekday
  return addDaysYmd(nearest, isSameOrThisWeek ? 7 : 0)
}

const getDateByKeywordRules = (text: string, todayYmd: string) => {
  if (text.includes("오늘")) return todayYmd
  if (text.includes("내일")) return addDaysYmd(todayYmd, 1)
  if (text.includes("모레")) return addDaysYmd(todayYmd, 2)
  if (text.includes("이번주 금요일")) return getNearestWeekdayYmd(todayYmd, 5)
  if (text.includes("다음주 월요일")) return getNextWeekWeekdayYmd(todayYmd, 1)
  return null
}

const getTimeByKeywordRules = (text: string) => {
  if (text.includes("아침")) return "09:00"
  if (text.includes("점심")) return "12:00"
  if (text.includes("오후")) return "14:00"
  if (text.includes("저녁")) return "18:00"
  if (text.includes("밤")) return "21:00"
  return null
}

const inferPriorityByKeywords = (text: string) => {
  if (/(급하게|중요한|빨리|꼭|반드시)/.test(text)) return "high" as const
  if (/(여유롭게|천천히|언젠가)/.test(text)) return "low" as const
  if (/(보통|적당히)/.test(text)) return "medium" as const
  return "medium" as const
}

const inferCategoryByKeywords = (text: string) => {
  if (/(회의|보고서|프로젝트|업무|개발|분석|미팅)/.test(text)) return "업무"
  if (/(공부|강의|책|도서관|학습|온라인 강의|무료강의|세미나|컨퍼런스|원데이 클래스)/.test(text))
    return "학습"
  if (/(운동|병원|건강|요가|필라테스)/.test(text)) return "건강"
  if (/(맛집|저녁식사|점심식사|아침식사|식사 약속)/.test(text)) return "음식"
  if (/(쇼핑|친구|가족|개인|휴식|여가)/.test(text)) return "개인"
  return "개인"
}

const buildTitleFromText = (text: string) => {
  const cleaned = collapseSpaces(
    text
      .replace(/(오늘|내일|모레|이번주 금요일|다음주 월요일)/g, "")
      .replace(/(아침|점심|오후|저녁|밤)/g, "")
      .replace(/(까지|에|에서|으로|로)\s*/g, " ")
      .replace(/\d{1,2}\s*시\s*\d{0,2}\s*분?/g, "")
      .replace(/[!?.]+$/g, "")
  )
  return ensureTitleLength(cleaned, text)
}

const buildRuleBasedDraft = (text: string, todayYmd: string) => {
  const dueDate = getDateByKeywordRules(text, todayYmd)
  const dueTime = getTimeByKeywordRules(text) ?? "09:00"
  const dueDateIso = dueDate ? toIsoDateTime(dueDate, dueTime) : null

  return {
    title: buildTitleFromText(text),
    description: limitTextLength(collapseSpaces(text), 1000),
    due_date: dueDateIso,
    priority: inferPriorityByKeywords(text),
    category: [inferCategoryByKeywords(text)],
    completed: false,
  }
}

const SYSTEM_PROMPT_TEMPLATE = (currentKoreanDate: string) => `당신은 한국어 일정 비서입니다.
- 사용자의 자연어 할일 문장을 구조화합니다.
- 기준 시간대는 Asia/Seoul 입니다.
- 오늘 날짜는 ${currentKoreanDate} 입니다.
- 출력은 반드시 JSON 스키마를 따릅니다.
- 날짜 처리 규칙:
  1) 오늘 -> 현재 날짜
  2) 내일 -> 현재 날짜 + 1일
  3) 모레 -> 현재 날짜 + 2일
  4) 이번주 금요일 -> 가장 가까운 금요일
  5) 다음주 월요일 -> 다음 주 월요일
- 시간 처리 규칙:
  - 사용자가 명시적 시간을 입력하면 그 시간을 우선합니다.
  - 명시적 시간이 없을 때 기본값:
    아침 09:00, 점심 12:00, 오후 14:00, 저녁 18:00, 밤 21:00
  - 위 키워드도 없으면 dueTime은 null로 반환합니다.
- 우선순위 키워드:
  - high: 급하게, 중요한, 빨리, 꼭, 반드시
  - medium: 보통, 적당히, 키워드 없음
  - low: 여유롭게, 천천히, 언젠가
- 카테고리 분류 키워드:
  - 업무: 회의, 보고서, 프로젝트, 업무, 개발, 분석, 미팅
  - 학습: 공부, 강의, 책, 도서관, 학습, 온라인 강의, 무료강의, 세미나, 컨퍼런스, 원데이 클래스
  - 개인: 쇼핑, 친구, 가족, 개인, 휴식, 여가
  - 건강: 운동, 병원, 건강, 요가, 필라테스
  - 음식: 맛집, 저녁식사, 점심식사, 아침식사, 식사 약속
- category는 한국어 태그 1~3개를 반환하세요.`

const PROMPT_TEMPLATE = (text: string) =>
  `다음 문장을 todos 데이터로 변환해 주세요: "${text}"`

const getOpenAiApiKeys = () => {
  const candidates = [
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_API_KEY2,
    process.env.OPENAI_API_KEY_2,
  ]

  return Array.from(
    new Set(
      candidates
        .filter((value): value is string => Boolean(value && value.trim()))
        .map((value) => value.trim())
    )
  )
}

const generateWithModelFallback = async (
  text: string,
  currentKoreanDate: string
) => {
  const modelCandidates = ["gpt-4.1-mini", "gpt-4o-mini", "gpt-4o"] as const
  const apiKeys = getOpenAiApiKeys()

  let lastError: unknown = null

  for (const apiKey of apiKeys) {
    const openai = createOpenAI({ apiKey })
    for (const modelName of modelCandidates) {
      try {
        const result = await generateObject({
          model: openai(modelName),
          schema: aiOutputSchema,
          system: SYSTEM_PROMPT_TEMPLATE(currentKoreanDate),
          prompt: PROMPT_TEMPLATE(text),
        })
        return result.object
      } catch (error) {
        lastError = error
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("사용 가능한 OpenAI 모델을 찾지 못했습니다.")
}

export async function POST(request: Request) {
  if (getOpenAiApiKeys().length === 0) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    )
  }

  let parsedText = ""

  try {
    const json = await request.json()
    const rawText = typeof json?.text === "string" ? json.text : ""
    const preprocessedText = sanitizeInputText(rawText)
    parsedText = preprocessedText
    const parsedInput = inputSchema.safeParse({ text: preprocessedText })

    if (!parsedInput.success) {
      const textLength = preprocessedText.length
      const message =
        textLength === 0
          ? "입력값이 비어 있습니다. 최소 2자 이상 입력해주세요."
          : textLength < 2
            ? "입력이 너무 짧습니다. 최소 2자 이상 입력해주세요."
            : "입력이 너무 깁니다. 500자 이하로 입력해주세요."
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }

    const kstNow = getKstNow()
    const currentKoreanDate = `${kstNow.year}-${String(kstNow.month).padStart(2, "0")}-${String(
      kstNow.day
    ).padStart(2, "0")}`

    const object = await generateWithModelFallback(
      parsedInput.data.text,
      currentKoreanDate
    )

    const fallbackDate = getDateByKeywordRules(parsedInput.data.text, currentKoreanDate)
    const fallbackTime = getTimeByKeywordRules(parsedInput.data.text)
    const finalDueDate = object.dueDate ?? fallbackDate
    const finalDueTime = object.dueTime ?? fallbackTime ?? "09:00"
    const dueDateIso = toIsoDateTime(finalDueDate, finalDueTime)

    const priority = object.priority ?? inferPriorityByKeywords(parsedInput.data.text)
    const category =
      object.category.length > 0
        ? object.category
        : [inferCategoryByKeywords(parsedInput.data.text)]
    const title = ensureTitleLength(object.title, parsedInput.data.text)
    const description = limitTextLength(collapseSpaces(object.description ?? ""), 1000)

    if (dueDateIso) {
      const nowIso = new Date(
        `${currentKoreanDate}T${String(kstNow.hour).padStart(2, "0")}:${String(
          kstNow.minute
        ).padStart(2, "0")}:${String(kstNow.second).padStart(2, "0")}+09:00`
      ).toISOString()
      if (dueDateIso < nowIso) {
        return NextResponse.json(
          {
            error:
              "생성된 마감일이 과거입니다. 이 날짜로 진행할지 확인이 필요합니다.",
            confirmationRequired: true,
            question: "마감일이 과거인데 그대로 저장할까요?",
            todoDraft: {
              title,
              description,
              due_date: dueDateIso,
              priority,
              category,
              completed: object.completed ?? false,
            },
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        todo: {
          title,
          description,
          due_date: dueDateIso,
          priority,
          category,
          completed: object.completed ?? false,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 할일 변환 중 오류가 발생했습니다."
    const normalized = message.toLowerCase()
    const isRateLimit =
      normalized.includes("429") ||
      normalized.includes("rate") ||
      normalized.includes("quota")

    if (isRateLimit) {
      const fallbackDraft = buildRuleBasedDraft(
        parsedText || "새 할일 작성",
        getTodayYmdSafe()
      )
      return NextResponse.json(
        {
          error: "AI 요청 한도를 초과했습니다. 규칙 기반 초안을 생성했습니다.",
          todoDraft: fallbackDraft,
        },
        { status: 429 }
      )
    }

    const fallbackDraft = buildRuleBasedDraft(
      parsedText || "새 할일 작성",
      getTodayYmdSafe()
    )
    console.error("[todos/parse] OpenAI parse failed, fallback draft applied:", message)
    return NextResponse.json(
      {
        error:
          "AI 해석에 실패해 규칙 기반 초안을 생성했습니다. 필요하면 내용을 수정해서 저장해주세요.",
        todoDraft: fallbackDraft,
      },
      { status: 200 }
    )
  }
}

/** 오류 흐름용 오늘 날짜 안전값 */
function getTodayYmdSafe() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`
}
