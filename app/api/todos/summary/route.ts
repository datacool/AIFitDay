import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

type SummaryPeriod = "today" | "week"
type TodoPriority = "high" | "medium" | "low"
type WeekdayKo = "월" | "화" | "수" | "목" | "금" | "토" | "일"

interface TodoRow {
  id: string
  title: string
  description: string | null
  priority: TodoPriority
  completed: boolean
  due_date: string | null
  created_date: string
  category: string[] | null
}

const requestSchema = z.object({
  period: z.enum(["today", "week"]),
})

const timeFocusSchema = z.object({
  bucket: z.string().min(1).max(40),
  count: z.number().int().min(0),
})

const weekdayProductivitySchema = z.object({
  day: z.string().min(1).max(4),
  score: z.number().min(0).max(100),
})

const summarySchema = z.object({
  summary: z.string().min(1).max(400),
  urgentTasks: z.array(z.string()).max(5),
  focusNow: z.array(z.string()).max(5),
  insights: z.array(z.string()).max(5),
  recommendation: z.array(z.string()).max(5),
  positiveFeedback: z.array(z.string()).max(4),
  nextWeekPlan: z.array(z.string()).max(5),
  completion: z.object({
    currentRate: z.number().min(0).max(100),
    previousRate: z.number().min(0).max(100),
    improvement: z.number().min(-100).max(100),
  }),
  timeManagement: z.object({
    deadlineAdherenceRate: z.number().min(0).max(100),
    postponedCount: z.number().int().min(0),
    postponedPattern: z.string().min(1).max(180),
    focusDistribution: z.array(timeFocusSchema).max(8),
  }),
  productivityPattern: z.object({
    bestDay: z.string().min(1).max(20),
    bestTimeBucket: z.string().min(1).max(40),
    procrastinatedTypes: z.array(z.string()).max(5),
    easyTaskTraits: z.array(z.string()).max(5),
  }),
  weekdayProductivity: z.array(weekdayProductivitySchema).max(7),
})

const getKstDate = (value: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value)

const parseYmd = (value: string) => {
  const [year, month, day] = value.split("-").map((part) => Number(part))
  return { year, month, day }
}

const addDays = (ymd: string, days: number) => {
  const { year, month, day } = parseYmd(ymd)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return getKstDate(date)
}

const getWeekStart = (ymd: string) => {
  const { year, month, day } = parseYmd(ymd)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  date.setDate(date.getDate() + diff)
  return getKstDate(date)
}

const toKstDateOnly = (isoValue?: string | null) => {
  if (!isoValue) return null
  const parsed = new Date(isoValue)
  if (Number.isNaN(parsed.getTime())) return null
  return getKstDate(parsed)
}

const getTodoTargetYmd = (todo: TodoRow) =>
  toKstDateOnly(todo.due_date) ?? toKstDateOnly(todo.created_date)

const isInRange = (targetYmd: string | null, startYmd: string, endYmd: string) => {
  if (!targetYmd) return false
  return targetYmd >= startYmd && targetYmd <= endYmd
}

const getPeriodRanges = (todayYmd: string, period: SummaryPeriod) => {
  if (period === "today") {
    const previousDay = addDays(todayYmd, -1)
    return {
      currentStart: todayYmd,
      currentEnd: todayYmd,
      previousStart: previousDay,
      previousEnd: previousDay,
    }
  }

  const weekStart = getWeekStart(todayYmd)
  const weekEnd = addDays(weekStart, 6)
  return {
    currentStart: weekStart,
    currentEnd: weekEnd,
    previousStart: addDays(weekStart, -7),
    previousEnd: addDays(weekStart, -1),
  }
}

const getHourBucket = (isoValue?: string | null) => {
  if (!isoValue) return "시간 미정"
  const parsed = new Date(isoValue)
  if (Number.isNaN(parsed.getTime())) return "시간 미정"

  const hour = Number(
    new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      hour12: false,
    }).format(parsed)
  )

  if (hour < 9) return "이른 오전(00-08시)"
  if (hour < 12) return "오전(09-11시)"
  if (hour < 15) return "오후 초반(12-14시)"
  if (hour < 19) return "오후 후반(15-18시)"
  return "저녁/밤(19시 이후)"
}

const getWeekdayKo = (isoValue?: string | null): WeekdayKo => {
  if (!isoValue) return "월"
  const parsed = new Date(isoValue)
  if (Number.isNaN(parsed.getTime())) return "월"

  const weekday = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(parsed)

  if (weekday.startsWith("화")) return "화"
  if (weekday.startsWith("수")) return "수"
  if (weekday.startsWith("목")) return "목"
  if (weekday.startsWith("금")) return "금"
  if (weekday.startsWith("토")) return "토"
  if (weekday.startsWith("일")) return "일"
  return "월"
}

const formatPriority = (priority: TodoPriority) => {
  if (priority === "high") return "높음"
  if (priority === "low") return "낮음"
  return "중간"
}

const buildWeekdayProductivity = (todos: TodoRow[]) => {
  const weekdayOrder: WeekdayKo[] = ["월", "화", "수", "목", "금", "토", "일"]
  const stats = weekdayOrder.reduce<Record<WeekdayKo, { total: number; completed: number }>>(
    (acc, day) => {
      acc[day] = { total: 0, completed: 0 }
      return acc
    },
    {
      월: { total: 0, completed: 0 },
      화: { total: 0, completed: 0 },
      수: { total: 0, completed: 0 },
      목: { total: 0, completed: 0 },
      금: { total: 0, completed: 0 },
      토: { total: 0, completed: 0 },
      일: { total: 0, completed: 0 },
    }
  )

  todos.forEach((todo) => {
    const weekday = getWeekdayKo(todo.due_date ?? todo.created_date)
    stats[weekday].total += 1
    if (todo.completed) {
      stats[weekday].completed += 1
    }
  })

  return weekdayOrder.map((day) => {
    const dayStats = stats[day]
    const score = dayStats.total > 0 ? Number(((dayStats.completed / dayStats.total) * 100).toFixed(1)) : 0
    return { day, score }
  })
}

const getCompletionRate = (todos: TodoRow[]) => {
  const total = todos.length
  const completed = todos.filter((todo) => todo.completed).length
  return total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0
}

const buildFallbackSummary = ({
  todos,
  previousTodos,
  period,
  allTodos,
}: {
  todos: TodoRow[]
  previousTodos: TodoRow[]
  period: SummaryPeriod
  allTodos: TodoRow[]
}) => {
  const total = todos.length
  const completionRate = getCompletionRate(todos)
  const previousRate = getCompletionRate(previousTodos)
  const improvement = Number((completionRate - previousRate).toFixed(1))
  const now = new Date()
  const dueTasks = todos.filter((todo) => Boolean(todo.due_date))
  const dueTasksCount = dueTasks.length
  const deadlineAdherenceCount = dueTasks.filter((todo) => {
    if (!todo.due_date) return false
    const dueTime = new Date(todo.due_date).getTime()
    if (Number.isNaN(dueTime)) return false
    return todo.completed || dueTime >= now.getTime()
  }).length
  const deadlineAdherenceRate =
    dueTasksCount > 0 ? Number(((deadlineAdherenceCount / dueTasksCount) * 100).toFixed(1)) : 100
  const postponedTodos = todos.filter(
    (todo) => !todo.completed && todo.due_date && new Date(todo.due_date).getTime() < now.getTime()
  )
  const postponedCount = postponedTodos.length
  const postponedPattern = postponedCount > 0
    ? `지연 작업 ${postponedCount}개는 주로 ${postponedTodos[0]?.category?.[0] ?? "일반"} 카테고리에 몰려 있어요.`
    : "지연 작업이 거의 없어 일정 관리가 안정적입니다."
  const focusDistribution = todos.reduce<Record<string, number>>((acc, todo) => {
    const bucket = getHourBucket(todo.due_date)
    acc[bucket] = (acc[bucket] ?? 0) + 1
    return acc
  }, {})
  const focusDistributionList = Object.entries(focusDistribution).map(([bucket, count]) => ({
    bucket,
    count,
  }))
  const urgentTasks = todos
    .filter((todo) => !todo.completed && todo.priority === "high")
    .slice(0, 3)
    .map((todo) => `[높음] ${todo.title}`)
  const focusNow = todos
    .filter((todo) => !todo.completed)
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 } as const
      return rank[a.priority] - rank[b.priority]
    })
    .slice(0, 3)
    .map((todo) => `[${formatPriority(todo.priority)}] ${todo.title}`)
  const weekdayProductivity = buildWeekdayProductivity(allTodos)
  const bestDayEntry = weekdayProductivity.reduce((best, item) =>
    item.score > best.score ? item : best
  )
  const bestTimeBucket =
    focusDistributionList.sort((a, b) => b.count - a.count)[0]?.bucket ?? "오전(09-11시)"

  return {
    summary:
      period === "today"
        ? `오늘 할 일 ${total}개 중 완료율은 ${completionRate}%예요. 지금은 우선순위 높은 작업부터 처리하면 좋아요.`
        : `이번주 할 일 ${total}개의 완료율은 ${completionRate}%입니다. 이전 기간 대비 ${improvement > 0 ? `+${improvement}%` : `${improvement}%`} 변화가 있었어요.`,
    urgentTasks,
    focusNow,
    insights: [
      `마감일 준수율은 ${deadlineAdherenceRate}%입니다.`,
      postponedPattern,
      `가장 생산적인 요일은 ${bestDayEntry.day}요일로 분석됐어요.`,
    ],
    recommendation: [
      "우선순위 높은 작업을 오전 블록에 먼저 배치해보세요.",
      "작업을 25~40분 단위로 나눠 집중-휴식 리듬을 만들면 부담이 줄어요.",
      "연기된 작업은 2개 이하로 유지하도록 하루 마감 루틴을 정해보세요.",
    ],
    positiveFeedback: [
      "현재도 꾸준히 할 일을 기록하고 있다는 점이 큰 강점입니다.",
      "진행 상태를 확인하며 관리하는 습관이 잘 잡혀 있어요.",
    ],
    nextWeekPlan: [
      "월/화 오전에 핵심 업무를 먼저 배치해 시작 강도를 높이세요.",
      "수요일에는 지연 가능성이 높은 작업을 미리 점검하세요.",
      "금요일 오후에는 다음 주 준비 작업을 1~2개 배치해보세요.",
    ],
    completion: {
      currentRate: completionRate,
      previousRate,
      improvement,
    },
    timeManagement: {
      deadlineAdherenceRate,
      postponedCount,
      postponedPattern,
      focusDistribution: focusDistributionList.slice(0, 6),
    },
    productivityPattern: {
      bestDay: `${bestDayEntry.day}요일`,
      bestTimeBucket,
      procrastinatedTypes: postponedTodos.slice(0, 3).map(
        (todo) => todo.category?.[0] ?? "일반"
      ),
      easyTaskTraits: ["작업 범위가 명확함", "완료 기준이 분명함", "시간이 짧게 드는 작업"],
    },
    weekdayProductivity,
  }
}

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

const generateAiSummary = async ({
  todos,
  previousTodos,
  allTodos,
  period,
}: {
  todos: TodoRow[]
  previousTodos: TodoRow[]
  allTodos: TodoRow[]
  period: SummaryPeriod
}) => {
  const total = todos.length
  const completed = todos.filter((todo) => todo.completed).length
  const completionRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0
  const previousCompletionRate = getCompletionRate(previousTodos)
  const improvement = Number((completionRate - previousCompletionRate).toFixed(1))
  const overdueCount = todos.filter(
    (todo) => !todo.completed && todo.due_date && new Date(todo.due_date) < new Date()
  ).length
  const priorityDistribution = {
    high: todos.filter((todo) => todo.priority === "high").length,
    medium: todos.filter((todo) => todo.priority === "medium").length,
    low: todos.filter((todo) => todo.priority === "low").length,
  }

  const timeFocus = todos.reduce<Record<string, number>>((acc, todo) => {
    const bucket = getHourBucket(todo.due_date)
    acc[bucket] = (acc[bucket] ?? 0) + 1
    return acc
  }, {})

  const deadlineTodos = todos.filter((todo) => Boolean(todo.due_date))
  const deadlineAdherenceCount = deadlineTodos.filter((todo) => {
    if (!todo.due_date) return false
    const dueTime = new Date(todo.due_date).getTime()
    if (Number.isNaN(dueTime)) return false
    return todo.completed || dueTime >= Date.now()
  }).length
  const deadlineAdherenceRate =
    deadlineTodos.length > 0
      ? Number(((deadlineAdherenceCount / deadlineTodos.length) * 100).toFixed(1))
      : 100

  const postponedTodos = todos.filter(
    (todo) => !todo.completed && todo.due_date && new Date(todo.due_date).getTime() < Date.now()
  )
  const postponedByCategory = postponedTodos.reduce<Record<string, number>>((acc, todo) => {
    const key = todo.category?.[0] ?? "일반"
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const weekdayProductivity = buildWeekdayProductivity(allTodos)

  const listForPrompt = todos.slice(0, 50).map((todo) => ({
    title: todo.title,
    completed: todo.completed,
    priority: formatPriority(todo.priority),
    due_date: todo.due_date,
    category: todo.category ?? [],
  }))

  const modelCandidates = ["gpt-4.1-mini", "gpt-4o-mini", "gpt-4o"] as const
  const apiKeys = getOpenAiApiKeys()

  let lastError: unknown = null

  for (const apiKey of apiKeys) {
    const openai = createOpenAI({ apiKey })
    for (const modelName of modelCandidates) {
      try {
        const { object } = await generateObject({
          model: openai(modelName),
          schema: summarySchema,
          system: `
당신은 한국어 생산성 코치입니다.
사용자가 바로 실행할 수 있는 분석 결과를 제공합니다.

반드시 지켜야 할 분석 원칙:
1) 완료율 분석: 일일/주간 완료율, 우선순위별 완료 패턴, 이전 기간 대비 개선도 비교
2) 시간 관리 분석: 마감일 준수율, 연기된 할 일 빈도/패턴, 시간대별 집중도 분포
3) 생산성 패턴: 가장 생산적인 요일/시간대, 자주 미루는 작업 유형, 완료 쉬운 작업 특징
4) 실행 가능한 추천: 시간 관리 팁, 우선순위 조정/일정 재배치, 과부하 분산 전략
5) 긍정 피드백: 잘한 점 강조 + 동기부여 메시지
6) 기간 차별화:
   - today: 당일 집중도 + 남은 할 일 우선순위 강조
   - week: 주간 패턴 + 다음주 계획 제안
7) 결과 문장은 자연스러운 한국어로, 짧고 실천 가능한 형태로 작성

응답은 반드시 schema에 맞는 JSON으로만 출력합니다.
`,
          prompt: JSON.stringify(
            {
              period,
              metrics: {
                total,
                completed,
                completionRate,
                previousCompletionRate,
                improvement,
                overdueCount,
                priorityDistribution,
                timeFocus,
                deadlineAdherenceRate,
                postponedByCategory,
                weekdayProductivity,
              },
              todos: listForPrompt,
              guide: {
                periodLabel: period === "today" ? "오늘의 요약" : "이번주 요약",
                mustInclude: [
                  "완료율과 이전 기간 대비 개선도",
                  "마감일 준수율과 연기 패턴 분석",
                  "우선순위별 완료 패턴 및 남은 고우선순위 작업",
                  "시간대/요일별 생산성 패턴",
                  "지금 바로 실행 가능한 추천과 긍정적 피드백",
                ],
              },
            },
            null,
            2
          ),
        })
        return object
      } catch (error) {
        lastError = error
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("요약 생성 모델 호출에 실패했습니다.")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "분석 기간(period)은 today 또는 week만 가능합니다." },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인 상태를 확인할 수 없습니다. 다시 로그인해주세요." },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from("todos")
      .select(
        "id, title, description, priority, completed, due_date, created_date, category"
      )
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_date", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "할 일 데이터를 불러오지 못했습니다." },
        { status: 500 }
      )
    }

    const allTodos = (data ?? []) as TodoRow[]
    const todayYmd = getKstDate(new Date())
    const ranges = getPeriodRanges(todayYmd, parsed.data.period)

    const periodTodos = allTodos.filter((todo) =>
      isInRange(getTodoTargetYmd(todo), ranges.currentStart, ranges.currentEnd)
    )
    const previousPeriodTodos = allTodos.filter((todo) =>
      isInRange(getTodoTargetYmd(todo), ranges.previousStart, ranges.previousEnd)
    )

    if (periodTodos.length === 0) {
      const emptySummary = buildFallbackSummary({
        todos: [],
        previousTodos: previousPeriodTodos,
        period: parsed.data.period,
        allTodos,
      })
      return NextResponse.json(
        {
          ...emptySummary,
          summary: "선택한 기간에 분석할 할 일이 없습니다.",
          insights: ["새로운 할 일을 추가하면 AI 요약을 더 정확하게 제공할 수 있어요."],
          recommendation: ["작은 할 일 1개를 먼저 등록해 보세요."],
        },
        { status: 200 }
      )
    }

    if (getOpenAiApiKeys().length === 0) {
      return NextResponse.json(
        {
          ...buildFallbackSummary({
            todos: periodTodos,
            previousTodos: previousPeriodTodos,
            period: parsed.data.period,
            allTodos,
          }),
          error: "OPENAI_API_KEY가 설정되지 않아 규칙 기반 요약을 제공했습니다.",
        },
        { status: 200 }
      )
    }

    try {
      const aiSummary = await generateAiSummary({
        todos: periodTodos,
        previousTodos: previousPeriodTodos,
        allTodos,
        period: parsed.data.period,
      })

      return NextResponse.json(aiSummary, { status: 200 })
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ""
      const isRateLimited =
        message.includes("429") || message.includes("quota") || message.includes("rate")

      if (isRateLimited) {
        return NextResponse.json(
          {
            ...buildFallbackSummary({
              todos: periodTodos,
              previousTodos: previousPeriodTodos,
              period: parsed.data.period,
              allTodos,
            }),
            error: "AI 호출 한도를 초과해 규칙 기반 요약을 제공했습니다.",
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        buildFallbackSummary({
          todos: periodTodos,
          previousTodos: previousPeriodTodos,
          period: parsed.data.period,
          allTodos,
        }),
        { status: 200 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: "AI 요약 요청을 처리하지 못했습니다." },
      { status: 500 }
    )
  }
}
