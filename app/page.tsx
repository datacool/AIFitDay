"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Cloud,
  CloudSun,
  CloudRain,
  Droplets,
  Lightbulb,
  LogOut,
  Loader2,
  Search,
  Smile,
  Sparkles,
  Sun,
  Target,
  Thermometer,
  UserRound,
  Wind,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import { MonthlyTodoCalendar, type MonthlyTodoDayStats } from "@/components/MonthlyTodoCalendar"
import { TodoForm, type TodoFormValues } from "@/components/TodoForm"
import { TodoList } from "@/components/TodoList"
import { type TodoItem, type TodoStatusOption } from "@/components/TodoCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type FilterStatus = "all" | "completed" | "pending" | "in_progress" | "overdue"
type SortBy = "created_date" | "due_date" | "priority" | "title"
type Gender = "boy" | "girl"
type SummaryPeriod = "today" | "week"
type TempBand = "hot" | "warm" | "cool" | "chilly" | "cold"
type WeatherTab = "today" | "tomorrow" | "threeDays" | "outfitGuide"
type WeatherConditionType = "sun" | "cloud" | "rain"

interface WeatherDay {
  date: string
  dayLabel: string
  maxTempC: number
  minTempC: number
  conditionText: string
  chanceOfRain: number
  conditionType: WeatherConditionType
}

interface WeatherHour {
  timeLabel: string
  tempC: number
  chanceOfRain: number
  conditionType: WeatherConditionType
  conditionText: string
}

interface WeatherData {
  location: string
  locationDisplay: string
  current: {
    tempC: number
    feelsLikeC: number
    humidity: number
    windSpeed: number
    conditionText: string
    conditionType: WeatherConditionType
  }
  today: WeatherDay | null
  tomorrow: WeatherDay | null
  weekly: WeatherDay[]
  hourly: WeatherHour[]
  activityScore: number
}

interface AiSummaryData {
  summary: string
  urgentTasks: string[]
  focusNow: string[]
  insights: string[]
  recommendation: string[]
  positiveFeedback: string[]
  nextWeekPlan: string[]
  completion: {
    currentRate: number
    previousRate: number
    improvement: number
  }
  timeManagement: {
    deadlineAdherenceRate: number
    postponedCount: number
    postponedPattern: string
    focusDistribution: Array<{
      bucket: string
      count: number
    }>
  }
  productivityPattern: {
    bestDay: string
    bestTimeBucket: string
    procrastinatedTypes: string[]
    easyTaskTraits: string[]
  }
  weekdayProductivity: Array<{
    day: string
    score: number
  }>
  error?: string
}

const fallbackWeatherData: WeatherData = {
  location: "서울특별시",
  locationDisplay: "북아현동, 서울특별시",
  current: {
    tempC: 18,
    feelsLikeC: 16,
    humidity: 65,
    windSpeed: 3.2,
    conditionText: "구름 조금",
    conditionType: "cloud",
  },
  today: {
    date: "2026-03-18",
    dayLabel: "화",
    maxTempC: 22,
    minTempC: 14,
    conditionText: "구름 조금",
    chanceOfRain: 10,
    conditionType: "cloud",
  },
  tomorrow: {
    date: "2026-03-19",
    dayLabel: "수",
    maxTempC: 21,
    minTempC: 14,
    conditionText: "구름 많음",
    chanceOfRain: 20,
    conditionType: "cloud",
  },
  weekly: [],
  hourly: [
    {
      timeLabel: "9시",
      tempC: 7,
      chanceOfRain: 20,
      conditionType: "cloud",
      conditionText: "구름 많음",
    },
    {
      timeLabel: "12시",
      tempC: 10,
      chanceOfRain: 10,
      conditionType: "sun",
      conditionText: "맑음",
    },
    {
      timeLabel: "15시",
      tempC: 11,
      chanceOfRain: 0,
      conditionType: "sun",
      conditionText: "맑음",
    },
    {
      timeLabel: "18시",
      tempC: 9,
      chanceOfRain: 10,
      conditionType: "cloud",
      conditionText: "구름 조금",
    },
    {
      timeLabel: "21시",
      tempC: 6,
      chanceOfRain: 20,
      conditionType: "rain",
      conditionText: "약한 비",
    },
  ],
  activityScore: 82,
}

const summaryTabs: Array<{ key: SummaryPeriod; label: string }> = [
  { key: "today", label: "오늘의 요약" },
  { key: "week", label: "이번주 요약" },
]

const weatherIconMap = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
} as const

const weatherTabs: Array<{ key: WeatherTab; label: string }> = [
  { key: "today", label: "오늘 날씨" },
  { key: "tomorrow", label: "내일 날씨" },
  { key: "threeDays", label: "3일 날씨" },
  { key: "outfitGuide", label: "옷차림 가이드" },
]

interface RecommendedAction {
  id: "outdoor" | "umbrella" | "overdue" | "dueToday" | "highPriority"
  title: string
  description: string
}

interface TodoQueryOptions {
  searchKeyword?: string
  statusFilter?: FilterStatus
  priorityFilter?: "all" | TodoItem["priority"]
  sortBy?: SortBy
}

const getTempBand = (temp: number): TempBand => {
  if (temp >= 28) return "hot"
  if (temp >= 22) return "warm"
  if (temp >= 16) return "cool"
  if (temp >= 10) return "chilly"
  return "cold"
}

const outfitGuides: Record<TempBand, { tags: string[]; message: string }> = {
  hot: { tags: ["반팔티", "반바지", "시원해"], message: "통풍 좋은 옷차림을 추천해요" },
  warm: { tags: ["반팔티", "면바지", "쾌적해"], message: "가벼운 외출하기 좋은 날씨예요" },
  cool: { tags: ["후드티", "청바지", "적당해"], message: "얇은 겉옷 하나 챙기세요" },
  chilly: { tags: ["가디건", "긴바지", "선선해"], message: "보온되는 상의를 추천해요" },
  cold: { tags: ["패딩", "기모바지", "추워요"], message: "두꺼운 아우터로 체온을 지켜주세요" },
}

/** 상태와 우선순위 기준에 따라 할일 목록을 정렬한다. */
const sortTodos = (todos: TodoItem[], sortBy: SortBy) => {
  const priorityRank: Record<TodoItem["priority"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  }

  return [...todos].sort((left, right) => {
    if (sortBy === "priority") {
      return priorityRank[right.priority] - priorityRank[left.priority]
    }

    if (sortBy === "due_date") {
      const leftDate = left.due_date ? new Date(left.due_date).getTime() : Number.MAX_SAFE_INTEGER
      const rightDate = right.due_date ? new Date(right.due_date).getTime() : Number.MAX_SAFE_INTEGER
      return leftDate - rightDate
    }

    if (sortBy === "title") {
      return left.title.localeCompare(right.title, "ko-KR")
    }

    return new Date(right.created_date).getTime() - new Date(left.created_date).getTime()
  })
}

const toLocalDateKey = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getTodoRelevantDate = (todo: TodoItem) => {
  const base = todo.due_date ?? todo.created_date
  const parsed = new Date(base)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

const getTodoDateKey = (todo: TodoItem) => {
  const parsed = getTodoRelevantDate(todo)
  if (!parsed) return ""
  return toLocalDateKey(parsed)
}

const getTodoStatus = (
  todo: TodoItem
): "completed" | "pending" | "in_progress" | "overdue" => {
  if (todo.completed) return "completed"
  if (!todo.due_date) return "pending"
  const dueDate = new Date(todo.due_date)
  if (Number.isNaN(dueDate.getTime())) return "pending"
  return dueDate.getTime() < Date.now() ? "overdue" : "in_progress"
}

/** 메인 페이지의 기본 레이아웃과 mock 할일/날씨 기능을 제공한다. */
const Home = () => {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [authError, setAuthError] = useState("")
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [isTodosLoading, setIsTodosLoading] = useState(false)
  const [todoError, setTodoError] = useState("")
  const [isTodoSubmitting, setIsTodoSubmitting] = useState(false)
  const [totalTodoCount, setTotalTodoCount] = useState(0)
  const [todoFormVersion, setTodoFormVersion] = useState(0)
  const [activeSummaryPeriod, setActiveSummaryPeriod] = useState<SummaryPeriod>("today")
  const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false)
  const [aiSummaryError, setAiSummaryError] = useState("")
  const [aiSummaryData, setAiSummaryData] = useState<AiSummaryData | null>(null)
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | TodoItem["priority"]>("all")
  const [sortBy, setSortBy] = useState<SortBy>("created_date")
  const [selectedGender, setSelectedGender] = useState<Gender>("boy")
  const [weather, setWeather] = useState<WeatherData>(fallbackWeatherData)
  const [isWeatherLoading, setIsWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState("")
  const [weatherQuery, setWeatherQuery] = useState("Seoul")
  const [activeWeatherTab, setActiveWeatherTab] = useState<WeatherTab>("today")
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined)
  const [isCalendarSummaryOpen, setIsCalendarSummaryOpen] = useState(false)
  const todoSectionRef = useRef<HTMLElement | null>(null)
  const currentTempBand = getTempBand(weather.current.tempC)
  const currentOutfit = outfitGuides[currentTempBand]
  const characterImagePath = `/characters/${selectedGender}-${currentTempBand}.jpg`
  const TodayConditionIcon = weatherIconMap[weather.current.conditionType]
  const tomorrowIcon = weather.tomorrow
    ? weatherIconMap[weather.tomorrow.conditionType]
    : Cloud

  useEffect(() => {
    const syncAuthUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        setAuthError("사용자 정보를 불러오지 못했습니다.")
        router.replace("/login")
        setIsAuthChecking(false)
        return
      }

      if (!session?.user) {
        router.replace("/login")
        setIsAuthChecking(false)
        return
      }

      setCurrentUser(session.user)
      setIsAuthChecking(false)
    }

    syncAuthUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null
      setCurrentUser(user)

      if (event === "SIGNED_OUT") {
        router.replace("/login")
        setIsAuthChecking(false)
      }

      if (event === "SIGNED_IN" && user) {
        setIsAuthChecking(false)
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [router, supabase])

  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    const successCallback = (position: GeolocationPosition) => {
      const latitude = position.coords.latitude.toFixed(4)
      const longitude = position.coords.longitude.toFixed(4)
      setWeatherQuery(`${latitude},${longitude}`)
    }

    const errorCallback = () => {
      // 위치 권한이 없거나 실패한 경우 기본값(Seoul)로 유지한다.
    }

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
      enableHighAccuracy: false,
      timeout: 7000,
      maximumAge: 1000 * 60 * 5,
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const fetchWeather = async () => {
      setIsWeatherLoading(true)
      setWeatherError("")

      try {
        const response = await fetch(
          `/api/weather?location=${encodeURIComponent(weatherQuery)}`,
          {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error("날씨 정보를 불러오지 못했습니다.")
        }

        const data = (await response.json()) as WeatherData
        setWeather(data)
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        setWeatherError("실시간 날씨를 불러오지 못해 기본 데이터를 표시합니다.")
      } finally {
        setIsWeatherLoading(false)
      }
    }

    fetchWeather()

    return () => controller.abort()
  }, [weatherQuery])

  const getTodoErrorMessage = (message: string) => {
    const normalized = message.toLowerCase()
    if (
      normalized.includes("jwt") ||
      normalized.includes("expired") ||
      normalized.includes("auth")
    ) {
      return "인증이 만료되었습니다. 다시 로그인해주세요."
    }

    return "할일 데이터를 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  }

  const getAiSummaryErrorMessage = (message: string) => {
    const normalized = message.toLowerCase()

    if (
      normalized.includes("failed to fetch") ||
      normalized.includes("networkerror") ||
      normalized.includes("json이 아닌 응답")
    ) {
      return "서버가 잠시 불안정합니다. [재시도]를 누르거나 10초 후 다시 시도해 주세요."
    }

    if (normalized.includes("timeout") || normalized.includes("초과")) {
      return "응답이 지연되고 있어요. 잠시 후 [재시도]해 주세요."
    }

    if (normalized.includes("429") || normalized.includes("quota") || normalized.includes("rate")) {
      return "AI 호출 한도에 도달했습니다. 잠시 후 다시 시도해 주세요."
    }

    return "AI 요약 생성 중 일시적인 오류가 발생했습니다. [재시도]해 주세요."
  }

  /** 현재 사용자 기준으로 할일 목록을 조회한다. */
  const fetchTodos = useCallback(async (options?: TodoQueryOptions) => {
    if (!currentUser) return

    setIsTodosLoading(true)
    setTodoError("")

    try {
      const keyword = options?.searchKeyword ?? searchKeyword
      const status = options?.statusFilter ?? statusFilter
      const priority = options?.priorityFilter ?? priorityFilter
      const sort = options?.sortBy ?? sortBy

      let query = supabase
        .from("todos")
        .select("id, title, description, created_date, due_date, priority, category, completed")
        .eq("user_id", currentUser.id)
        .eq("is_deleted", false)

      const normalizedKeyword = keyword.trim()
      if (normalizedKeyword) {
        query = query.ilike("title", `%${normalizedKeyword}%`)
      }

      if (status === "completed") {
        query = query.eq("completed", true)
      } else if (status === "pending") {
        query = query.eq("completed", false)
      } else if (status === "in_progress") {
        const nowIso = new Date().toISOString()
        query = query
          .eq("completed", false)
          .or(`due_date.is.null,due_date.gte.${nowIso}`)
      } else if (status === "overdue") {
        const nowIso = new Date().toISOString()
        query = query
          .eq("completed", false)
          .not("due_date", "is", null)
          .lt("due_date", nowIso)
      }

      if (priority !== "all") {
        query = query.eq("priority", priority)
      }

      if (sort === "created_date") {
        query = query.order("created_date", { ascending: false })
      } else if (sort === "due_date") {
        query = query.order("due_date", { ascending: true, nullsFirst: false })
      } else if (sort === "title") {
        query = query.order("title", { ascending: true })
      } else {
        query = query.order("created_date", { ascending: false })
      }

      const [{ data, error }, { count, error: countError }] = await Promise.all([
        query,
        supabase
          .from("todos")
          .select("id", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .eq("is_deleted", false),
      ])

      if (error) {
        setTodoError(getTodoErrorMessage(error.message))
        return
      }

      if (!countError) {
        setTotalTodoCount(count ?? 0)
      }

      const nextTodos = (data ?? []) as TodoItem[]
      setTodos(sort === "priority" ? sortTodos(nextTodos, "priority") : nextTodos)
    } catch (error) {
      setTodoError(getTodoErrorMessage(error instanceof Error ? error.message : "unknown"))
    } finally {
      setIsTodosLoading(false)
    }
  }, [currentUser, priorityFilter, searchKeyword, sortBy, statusFilter, supabase])

  const hasNarrowingCondition =
    searchKeyword.trim().length > 0 ||
    statusFilter !== "all" ||
    priorityFilter !== "all"
  const hasFilteredOutItems =
    hasNarrowingCondition &&
    !isTodosLoading &&
    !todoError &&
    totalTodoCount > todos.length

  /** 검색/필터/정렬을 기본값으로 초기화하고 목록을 재조회한다. */
  const resetTodoControls = async () => {
    const resetOptions: TodoQueryOptions = {
      searchKeyword: "",
      statusFilter: "all",
      priorityFilter: "all",
      sortBy: "created_date",
    }

    setSearchKeyword(resetOptions.searchKeyword ?? "")
    setStatusFilter(resetOptions.statusFilter ?? "all")
    setPriorityFilter(resetOptions.priorityFilter ?? "all")
    setSortBy(resetOptions.sortBy ?? "created_date")
    setSelectedCalendarDate(undefined)
    await fetchTodos(resetOptions)
  }

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const scrollToTodoSection = () => {
    requestAnimationFrame(() => {
      todoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  /** 추천 액션 클릭 시 필터를 자동 적용하고 할일 섹션으로 이동한다. */
  const applyActionAndScroll = (actionId: RecommendedAction["id"]) => {
    setSelectedCalendarDate(undefined)

    switch (actionId) {
      case "outdoor":
        setStatusFilter("pending")
        setPriorityFilter("all")
        setSortBy("created_date")
        setSearchKeyword("산책")
        break
      case "umbrella":
        setStatusFilter("pending")
        setPriorityFilter("all")
        setSortBy("due_date")
        setSearchKeyword("우산")
        break
      case "overdue":
        setStatusFilter("pending")
        setPriorityFilter("all")
        setSortBy("due_date")
        setSearchKeyword("")
        break
      case "dueToday":
        setStatusFilter("pending")
        setPriorityFilter("all")
        setSortBy("due_date")
        setSearchKeyword("")
        break
      case "highPriority":
        setStatusFilter("pending")
        setPriorityFilter("high")
        setSortBy("priority")
        setSearchKeyword("")
        break
      default:
        break
    }

    scrollToTodoSection()
  }

  const todayTodoSummary = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    const pendingTodos = todos.filter((todo) => !todo.completed)
    const overdueTodos = pendingTodos.filter(
      (todo) => todo.due_date && new Date(todo.due_date).getTime() < now.getTime()
    )
    const dueTodayTodos = pendingTodos.filter((todo) => {
      if (!todo.due_date) return false
      const dueTime = new Date(todo.due_date).getTime()
      return dueTime >= startOfToday.getTime() && dueTime < endOfToday.getTime()
    })
    const highPriorityTodos = pendingTodos.filter((todo) => todo.priority === "high")

    return {
      total: todos.length,
      pending: pendingTodos.length,
      overdue: overdueTodos.length,
      dueToday: dueTodayTodos.length,
      highPriority: highPriorityTodos.length,
    }
  }, [todos])

  const umbrellaAction = useMemo<RecommendedAction | null>(() => {
    if ((weather.today?.chanceOfRain ?? 0) >= 40 || weather.current.conditionType === "rain") {
      return {
        id: "umbrella",
        title: "우산 챙기기",
        description: `강수확률이 ${weather.today?.chanceOfRain ?? 0}%라서 우산을 챙기는 것이 좋아요.`,
      }
    }
    return null
  }, [weather])

  const overdueAction = useMemo<RecommendedAction | null>(() => {
    if (todayTodoSummary.overdue > 0) {
      return {
        id: "overdue",
        title: "지연 할일 우선 처리",
        description: `지연된 할일이 ${todayTodoSummary.overdue}개 있어요. 먼저 정리해 보세요.`,
      }
    }
    return null
  }, [todayTodoSummary.overdue])

  const recommendedActions = useMemo<RecommendedAction[]>(() => {
    const actions: RecommendedAction[] = []

    if (!umbrellaAction && weather.activityScore >= 80) {
      actions.push({
        id: "outdoor",
        title: "야외활동 추천",
        description: "활동지수가 높아 산책/러닝 같은 야외 일정을 넣기 좋아요.",
      })
    }

    if (todayTodoSummary.highPriority > 0) {
      actions.push({
        id: "highPriority",
        title: "핵심 업무 집중",
        description: `높은 우선순위 할일 ${todayTodoSummary.highPriority}개를 먼저 끝내보세요.`,
      })
    }

    return actions.slice(0, 3)
  }, [
    umbrellaAction,
    todayTodoSummary.highPriority,
    weather,
  ])

  const monthlyTodoStats = useMemo<Record<string, MonthlyTodoDayStats>>(() => {
    const nextStats: Record<string, MonthlyTodoDayStats> = {}

    todos.forEach((todo) => {
      const dateKey = getTodoDateKey(todo)
      if (!dateKey) return

      if (!nextStats[dateKey]) {
        nextStats[dateKey] = {
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          overdue: 0,
          topEvents: [],
        }
      }

      const dayStats = nextStats[dateKey]
      dayStats.total += 1

      const status = getTodoStatus(todo)
      if (status === "completed") dayStats.completed += 1
      if (status === "pending") dayStats.pending += 1
      if (status === "in_progress") dayStats.inProgress += 1
      if (status === "overdue") dayStats.overdue += 1

      if (dayStats.topEvents.length < 4) {
        dayStats.topEvents.push({
          title: todo.title.trim(),
          status,
        })
      }
    })

    return nextStats
  }, [todos])

  const selectedCalendarDateKey = useMemo(
    () => (selectedCalendarDate ? toLocalDateKey(selectedCalendarDate) : ""),
    [selectedCalendarDate]
  )

  const selectedCalendarStats = selectedCalendarDateKey
    ? monthlyTodoStats[selectedCalendarDateKey]
    : undefined

  const filteredTodosByCalendar = useMemo(() => {
    if (!selectedCalendarDateKey) return todos
    return todos.filter((todo) => getTodoDateKey(todo) === selectedCalendarDateKey)
  }, [selectedCalendarDateKey, todos])

  const holidayDates = useMemo(
    () => [
      "2026-01-01",
      "2026-03-01",
      "2026-05-05",
      "2026-06-06",
      "2026-08-15",
      "2026-10-03",
      "2026-10-09",
      "2026-12-25",
    ],
    []
  )

  const handleSelectCalendarDate = async (date: Date) => {
    setSelectedCalendarDate(date)
    setIsCalendarSummaryOpen(true)

    const nextQuery: TodoQueryOptions = {
      searchKeyword: "",
      statusFilter: "all",
      priorityFilter: "all",
      sortBy: "due_date",
    }

    setSearchKeyword(nextQuery.searchKeyword ?? "")
    setStatusFilter(nextQuery.statusFilter ?? "all")
    setPriorityFilter(nextQuery.priorityFilter ?? "all")
    setSortBy(nextQuery.sortBy ?? "due_date")
    await fetchTodos(nextQuery)
    scrollToTodoSection()
  }

  const clearCalendarDateFilter = () => {
    setSelectedCalendarDate(undefined)
    setIsCalendarSummaryOpen(false)
  }

  /** 할일 추가 또는 수정 제출을 처리한다. */
  const handleSubmitTodo = async (values: TodoFormValues) => {
    if (!currentUser) {
      setTodoError("로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.")
      return
    }

    setIsTodoSubmitting(true)
    setTodoError("")

    const payload = {
      title: values.title,
      description: values.description || null,
      due_date: values.due_date,
      priority: values.priority,
      category: values.category.length > 0 ? values.category : ["개인"],
      completed: values.completed,
    }

    if (editingTodo) {
      const { error } = await supabase
        .from("todos")
        .update(payload)
        .eq("id", editingTodo.id)
        .eq("user_id", currentUser.id)
        .eq("is_deleted", false)

      if (error) {
        setTodoError(getTodoErrorMessage(error.message))
        setIsTodoSubmitting(false)
        return
      }

      setEditingTodo(null)
      setTodoFormVersion((prev) => prev + 1)
      await fetchTodos()
      setIsTodoSubmitting(false)
      return
    }

    const { error } = await supabase.from("todos").insert({
      ...payload,
      user_id: currentUser.id,
    })

    if (error) {
      setTodoError(getTodoErrorMessage(error.message))
      setIsTodoSubmitting(false)
      return
    }

    setTodoFormVersion((prev) => prev + 1)
    await resetTodoControls()
    setIsTodoSubmitting(false)
  }

  /** 할일 완료 상태를 토글한다. */
  const handleToggleComplete = async (todoId: string, completed: boolean) => {
    if (!currentUser) return

    setTodoError("")
    const { error } = await supabase
      .from("todos")
      .update({ completed })
      .eq("id", todoId)
      .eq("user_id", currentUser.id)
      .eq("is_deleted", false)

    if (error) {
      setTodoError(getTodoErrorMessage(error.message))
      return
    }

    await fetchTodos()
  }

  /** 카드 상태 메뉴에서 선택한 상태를 반영한다. */
  const handleChangeTodoStatus = async (
    todo: TodoItem,
    nextStatus: TodoStatusOption
  ) => {
    if (!currentUser) return

    const now = new Date()
    const nextHourIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    const previousHourIso = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const dueDateTime = todo.due_date ? new Date(todo.due_date).getTime() : null
    const isOverdue = dueDateTime !== null && dueDateTime < now.getTime()

    let payload: { completed: boolean; due_date?: string | null } = {
      completed: todo.completed,
    }

    if (nextStatus === "completed") {
      payload = { completed: true }
    } else if (nextStatus === "pending") {
      // "미완료"는 지연/진행중과 구분되는 기본 상태로 본다.
      payload = { completed: false, due_date: null }
    } else if (nextStatus === "in_progress") {
      payload = {
        completed: false,
        due_date: !todo.due_date || isOverdue ? nextHourIso : todo.due_date,
      }
    } else if (nextStatus === "overdue") {
      payload = {
        completed: false,
        due_date: !todo.due_date || !isOverdue ? previousHourIso : todo.due_date,
      }
    }

    setTodoError("")
    const { error } = await supabase
      .from("todos")
      .update(payload)
      .eq("id", todo.id)
      .eq("user_id", currentUser.id)
      .eq("is_deleted", false)

    if (error) {
      setTodoError(getTodoErrorMessage(error.message))
      return
    }

    await fetchTodos()
  }

  /** 선택한 할일을 편집 모드로 전환한다. */
  const handleEditTodo = (todo: TodoItem) => setEditingTodo(todo)

  /** 할일 항목을 목록에서 삭제한다. */
  const handleDeleteTodo = async (todoId: string) => {
    if (!currentUser) return

    setTodoError("")
    const { error } = await supabase
      .from("todos")
      .update({ is_deleted: true })
      .eq("id", todoId)
      .eq("user_id", currentUser.id)
      .eq("is_deleted", false)

    if (error) {
      setTodoError(getTodoErrorMessage(error.message))
      return
    }

    if (editingTodo?.id === todoId) {
      setEditingTodo(null)
      setTodoFormVersion((prev) => prev + 1)
    }

    await fetchTodos()
  }

  /** 선택한 기간 기준 AI 요약을 생성한다. */
  const handleGenerateAiSummary = async () => {
    setIsAiSummaryLoading(true)
    setAiSummaryError("")

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 90000)

    try {
      const response = await fetch("/api/todos/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period: activeSummaryPeriod }),
        cache: "no-store",
        signal: controller.signal,
      })

      const contentType = response.headers.get("content-type") ?? ""
      let result: (AiSummaryData & { error?: string }) | null = null

      if (contentType.includes("application/json")) {
        result = (await response.json()) as AiSummaryData & { error?: string }
      } else {
        const rawText = await response.text()
        throw new Error(
          rawText
            ? `서버가 JSON이 아닌 응답을 반환했습니다: ${rawText.slice(0, 120)}`
            : "서버 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요."
        )
      }

      if (!result || (!response.ok && !result.summary)) {
        throw new Error(result.error ?? "AI 요약을 불러오지 못했습니다.")
      }

      setAiSummaryData({
        summary: result.summary,
        urgentTasks: result.urgentTasks ?? [],
        focusNow: result.focusNow ?? [],
        insights: result.insights ?? [],
        recommendation: result.recommendation ?? [],
        positiveFeedback: result.positiveFeedback ?? [],
        nextWeekPlan: result.nextWeekPlan ?? [],
        completion: result.completion ?? {
          currentRate: 0,
          previousRate: 0,
          improvement: 0,
        },
        timeManagement: result.timeManagement ?? {
          deadlineAdherenceRate: 0,
          postponedCount: 0,
          postponedPattern: "분석 데이터가 충분하지 않습니다.",
          focusDistribution: [],
        },
        productivityPattern: result.productivityPattern ?? {
          bestDay: "-",
          bestTimeBucket: "-",
          procrastinatedTypes: [],
          easyTaskTraits: [],
        },
        weekdayProductivity: result.weekdayProductivity ?? [],
        error: result.error,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setAiSummaryError("응답이 지연되고 있어요. 잠시 후 [재시도]해 주세요.")
        return
      }

      const rawMessage = error instanceof Error ? error.message : ""
      setAiSummaryError(getAiSummaryErrorMessage(rawMessage))
    } finally {
      window.clearTimeout(timeoutId)
      setIsAiSummaryLoading(false)
    }
  }

  /** 현재 로그인 사용자를 로그아웃한다. */
  const handleSignOut = async () => {
    setAuthError("")
    setIsSigningOut(true)

    try {
      const signOutPromise = supabase.auth.signOut({ scope: "local" })
      const timeoutPromise = new Promise<{ error: null; timeout: true }>((resolve) =>
        setTimeout(() => resolve({ error: null, timeout: true }), 2500)
      )
      const result = await Promise.race([signOutPromise, timeoutPromise])

      if ("error" in result && result.error) {
        setAuthError("로그아웃에 실패했습니다. 잠시 후 다시 시도해주세요.")
        return
      }

      setCurrentUser(null)
      window.location.assign("/login")
    } catch {
      setAuthError("로그아웃 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsSigningOut(false)
    }
  }

  if (isAuthChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          인증 상태를 확인하는 중입니다...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-lg font-bold">AIFitDay</p>
              <p className="text-xs text-muted-foreground">
                AI를 이용해서 여러분의 데일리 루틴을 스마트하게 관리하세요
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8 gap-1.5 px-3">
              <UserRound className="size-3.5" />
              {(currentUser?.user_metadata?.name as string | undefined) ?? "사용자"} (
              {currentUser?.email})
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="size-4" />
              {isSigningOut ? "로그아웃 중..." : "로그아웃"}
            </Button>
          </div>
        </div>
      </header>

      {authError ? (
        <section className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
          <p className="text-sm font-medium text-destructive">{authError}</p>
        </section>
      ) : null}

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 md:grid-cols-12 md:px-6">
        <Card className="overflow-hidden md:col-span-8">
          <CardHeader className="border-b border-border/70 bg-muted/30 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {weatherTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveWeatherTab(tab.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    activeWeatherTab === tab.key
                      ? "border-secondary/40 bg-secondary/20 text-secondary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-5 md:p-6">
            {isWeatherLoading ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                실시간 날씨를 불러오는 중입니다...
              </div>
            ) : null}

            {weatherError ? (
              <p className="text-xs font-medium text-destructive">{weatherError}</p>
            ) : null}

            {activeWeatherTab === "today" ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold tracking-tight md:text-4xl">
                      {weather.locationDisplay || weather.location}
                    </p>
                    <div className="mt-3 flex items-end gap-1">
                      <p className="text-6xl leading-none font-bold md:text-8xl">
                        {weather.current.tempC}
                      </p>
                      <span className="pb-2 text-2xl font-semibold">°</span>
                    </div>
                    <p className="mt-2 text-lg text-muted-foreground">
                      {weather.current.conditionText}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      최고{" "}
                      <span className="font-semibold text-destructive">
                        {weather.today?.maxTempC ?? "-"}°
                      </span>{" "}
                      · 최저{" "}
                      <span className="font-semibold text-primary">
                        {weather.today?.minTempC ?? "-"}°
                      </span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/10 p-4 text-secondary">
                    <TodayConditionIcon className="size-16 md:size-20" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Thermometer className="size-4" />
                      체감온도
                    </p>
                    <p className="mt-1 text-lg font-semibold">{weather.current.feelsLikeC}°</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Droplets className="size-4" />
                      습도
                    </p>
                    <p className="mt-1 text-lg font-semibold">{weather.current.humidity}%</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Wind className="size-4" />
                      바람
                    </p>
                    <p className="mt-1 text-lg font-semibold">{weather.current.windSpeed}m/s</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <p className="text-sm font-semibold">내일 요약 프리뷰</p>
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {weather.tomorrow?.conditionText ?? "데이터 없음"}
                        </p>
                        <p className="mt-1 text-lg font-bold">
                          {weather.tomorrow?.maxTempC ?? "-"}° /{" "}
                          {weather.tomorrow?.minTempC ?? "-"}°
                        </p>
                        <p className="text-xs text-muted-foreground">
                          강수확률 {weather.tomorrow?.chanceOfRain ?? 0}%
                        </p>
                      </div>
                      <div className="rounded-xl bg-secondary/10 p-2 text-secondary">
                        {(() => {
                          const TomorrowIcon = tomorrowIcon
                          return <TomorrowIcon className="size-6" />
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <p className="text-sm font-semibold">오늘 할일 요약</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {overdueAction
                        ? overdueAction.description
                        : "오늘 할일을 우선순위에 맞춰 정리하면 완료율을 높일 수 있어요."}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                        전체 {todayTodoSummary.total}개
                      </div>
                      <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                        미완료 {todayTodoSummary.pending}개
                      </div>
                      <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                        오늘마감 {todayTodoSummary.dueToday}개
                      </div>
                      <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                        지연 {todayTodoSummary.overdue}개
                      </div>
                    </div>
                  </div>
                </div>

                <MonthlyTodoCalendar
                  dayStatsByDate={monthlyTodoStats}
                  holidayDates={holidayDates}
                  selectedDate={selectedCalendarDate}
                  onSelectDate={handleSelectCalendarDate}
                  onClearDateFilter={clearCalendarDateFilter}
                />
              </>
            ) : null}

            {activeWeatherTab === "tomorrow" ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4 md:min-h-[176px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">내일 날씨 브리핑</p>
                      <p className="mt-1 text-2xl font-bold">
                        최고 {weather.tomorrow?.maxTempC ?? "-"}° / 최저{" "}
                        {weather.tomorrow?.minTempC ?? "-"}°
                      </p>
                      <p className="mt-2 text-base text-muted-foreground">
                        {weather.tomorrow?.conditionText ?? "데이터 없음"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        강수확률 {weather.tomorrow?.chanceOfRain ?? 0}%
                      </p>
                    </div>
                    <div className="rounded-2xl bg-secondary/10 p-4 text-secondary">
                      {(() => {
                        const TomorrowIcon = tomorrowIcon
                        return <TomorrowIcon className="size-14 md:size-16" />
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:min-h-[102px]">
                    <p className="text-xs text-muted-foreground">내일 체감 전략</p>
                    <p className="mt-1 text-lg font-semibold">
                      {weather.tomorrow && weather.tomorrow.maxTempC >= 20
                        ? "가벼운 겉옷"
                        : "보온 레이어"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:min-h-[102px]">
                    <p className="text-xs text-muted-foreground">출근 준비도</p>
                    <p className="mt-1 text-lg font-semibold">
                      {(weather.tomorrow?.chanceOfRain ?? 0) >= 40 ? "우산 필요" : "쾌적"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:min-h-[102px]">
                    <p className="text-xs text-muted-foreground">Todo 집중 권장</p>
                    <p className="mt-1 text-lg font-semibold">
                      {todayTodoSummary.highPriority > 0 ? "우선순위 높음 처리" : "루틴 유지"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">내일 체크리스트</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => applyActionAndScroll("dueToday")}
                      className="rounded-xl border border-border/70 px-3 py-3 text-left hover:bg-muted/40 md:min-h-[92px]"
                    >
                      <p className="text-sm font-semibold">내일 전 오늘마감 정리</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        미완료 + 오늘마감 작업부터 확인해요.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyActionAndScroll("umbrella")}
                      className="rounded-xl border border-border/70 px-3 py-3 text-left hover:bg-muted/40 md:min-h-[92px]"
                    >
                      <p className="text-sm font-semibold">우천 대비 메모 확인</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        우산/이동 관련 할일을 빠르게 찾아볼 수 있어요.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {activeWeatherTab === "threeDays" ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:min-h-[102px]">
                    <p className="text-xs text-muted-foreground">3일 평균 최고</p>
                    <p className="mt-1 text-lg font-semibold">
                      {weather.weekly.length > 0
                        ? Math.round(
                            weather.weekly
                              .slice(0, 3)
                              .reduce((sum, day) => sum + day.maxTempC, 0) /
                              Math.min(weather.weekly.length, 3)
                          )
                        : "-"}
                      °
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:min-h-[102px]">
                    <p className="text-xs text-muted-foreground">3일 평균 강수확률</p>
                    <p className="mt-1 text-lg font-semibold">
                      {weather.weekly.length > 0
                        ? Math.round(
                            weather.weekly
                              .slice(0, 3)
                              .reduce((sum, day) => sum + day.chanceOfRain, 0) /
                              Math.min(weather.weekly.length, 3)
                          )
                        : "-"}
                      %
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:min-h-[102px]">
                    <p className="text-xs text-muted-foreground">일정 난이도</p>
                    <p className="mt-1 text-lg font-semibold">
                      {(weather.weekly[0]?.chanceOfRain ?? 0) >= 50 ? "실내 우선" : "외출 가능"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">3일 날씨 카드</p>
                  {weather.weekly.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {weather.weekly.slice(0, 3).map((item) => {
                        const DayIcon = weatherIconMap[item.conditionType]

                        return (
                          <div
                            key={item.date}
                            className="rounded-xl border border-border/70 bg-background/80 p-4 md:min-h-[144px]"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{item.dayLabel}요일</p>
                              <DayIcon className="size-5 text-secondary" />
                            </div>
                            <p className="mt-2 text-xl font-bold">
                              {item.maxTempC}° / {item.minTempC}°
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.conditionText}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              강수확률 {item.chanceOfRain}%
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">예보 데이터를 불러오는 중입니다.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">체크리스트</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => applyActionAndScroll("outdoor")}
                      className="rounded-xl border border-border/70 px-3 py-3 text-left hover:bg-muted/40 md:min-h-[96px]"
                    >
                      <p className="text-sm font-semibold">날씨 좋은 날 일정 추가</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        야외활동 관련 할일을 빠르게 확인합니다.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyActionAndScroll("highPriority")}
                      className="rounded-xl border border-border/70 px-3 py-3 text-left hover:bg-muted/40 md:min-h-[96px]"
                    >
                      <p className="text-sm font-semibold">핵심 일정 우선 배치</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        높은 우선순위 + 미완료 작업 필터를 적용합니다.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {activeWeatherTab === "outfitGuide" ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4 md:min-h-[208px]">
                  <p className="text-base font-semibold">오늘의 옷차림 가이드</p>
                  <p className="mt-1 text-sm text-muted-foreground">{currentOutfit.message}</p>
                  <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <Image
                      src={characterImagePath}
                      alt={`오늘 추천 ${selectedGender === "boy" ? "남자" : "여자"} 코디`}
                      width={128}
                      height={128}
                      className="h-28 w-28 rounded-xl object-contain"
                    />
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {currentOutfit.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={
                              tag === "적당해" || tag === "쾌적해" || tag === "시원해"
                                ? "default"
                                : "outline"
                            }
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        아침과 저녁의 일교차를 고려해 얇은 레이어를 함께 준비하세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:min-h-[110px]">
                    <p className="text-sm font-semibold">출근/등교 추천</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {weather.current.tempC <= 10
                        ? "기모/패딩 위주로 보온을 우선하세요."
                        : "가벼운 아우터 + 편한 하의 조합이 적당해요."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:min-h-[110px]">
                    <p className="text-sm font-semibold">퇴근/저녁 추천</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {(weather.today?.chanceOfRain ?? 0) >= 40
                        ? "방수 가능한 신발/아우터를 준비해 주세요."
                        : "통풍성 좋은 소재로 활동성을 높여보세요."}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">체크리스트</p>
                  <button
                    type="button"
                    onClick={scrollToTodoSection}
                    className="mt-3 w-full rounded-xl border border-border/70 px-4 py-3 text-left hover:bg-muted/40 md:min-h-[96px]"
                  >
                    <p className="text-sm font-semibold">옷차림 관련 할일 추가하기</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Todo 섹션으로 이동해서 준비물 체크리스트를 바로 작성할 수 있어요.
                    </p>
                  </button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-end justify-between">
                <CardTitle className="text-base">활동지수</CardTitle>
                <p className="text-4xl font-bold text-primary">
                  {weather.activityScore}
                  <span className="text-xl text-muted-foreground">/100</span>
                </p>
              </div>
              <Progress value={weather.activityScore} className="h-2 bg-secondary/20" />
              <CardDescription className="pt-1">
                {weather.activityScore >= 80
                  ? "완벽한 야외활동 날씨! 산책, 피크닉, 운동하기 좋아요."
                  : "실내활동하기 좋은 날씨예요. 카페나 실내 운동을 추천해요."}
              </CardDescription>
              {activeWeatherTab === "today" && umbrellaAction ? (
                <button
                  type="button"
                  onClick={() => applyActionAndScroll("umbrella")}
                  className="mt-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-left transition-colors hover:bg-muted/40"
                >
                  <p className="text-sm font-semibold">{umbrellaAction.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {umbrellaAction.description}
                  </p>
                </button>
              ) : null}

              {activeWeatherTab === "today" ? (
                <div className="mt-3">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    추천 액션 카드
                  </p>
                  {recommendedActions.length > 0 ? (
                    <div className="grid gap-2">
                      {recommendedActions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => applyActionAndScroll(action.id)}
                          className="rounded-xl border border-border/70 bg-background/80 px-3 py-3 text-left transition-colors hover:bg-muted/40"
                        >
                          <p className="text-sm font-semibold">{action.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {action.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/70 bg-background/70 px-3 py-4 text-xs text-muted-foreground">
                      오늘은 추가 액션 추천이 없습니다.
                    </div>
                  )}
                </div>
              ) : null}
            </CardHeader>
          </Card>

          {activeWeatherTab === "today" ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">오늘 시간대별 날씨</CardTitle>
                <CardDescription>현재 시점 기준 8시간 예보</CardDescription>
              </CardHeader>
              <CardContent>
                {weather.hourly.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {weather.hourly.slice(0, 8).map((item) => {
                      const HourIcon = weatherIconMap[item.conditionType]
                      return (
                        <div
                          key={`${item.timeLabel}-${item.tempC}`}
                          className="rounded-lg border border-border/70 bg-background px-2 py-2 text-center"
                        >
                          <p className="text-[11px] text-muted-foreground">{item.timeLabel}</p>
                          <div className="mt-1 flex justify-center text-secondary">
                            <HourIcon className="size-4" />
                          </div>
                          <p className="mt-1 text-xs font-semibold">{item.tempC}°</p>
                          <p className="text-[10px] text-muted-foreground">
                            비 {item.chanceOfRain}%
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    시간대별 예보 데이터를 불러오는 중입니다.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CloudSun className="size-4 text-secondary" />
                오늘의 옷차림
              </CardTitle>
              <CardDescription>{currentOutfit.message}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="inline-flex rounded-full bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setSelectedGender("boy")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    selectedGender === "boy"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted-foreground/10"
                  )}
                >
                  남자
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGender("girl")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    selectedGender === "girl"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted-foreground/10"
                  )}
                >
                  여자
                </button>
              </div>

              <div className="flex items-center justify-center rounded-2xl bg-muted/40 py-8">
                <div className="text-center">
                  <Image
                    src={characterImagePath}
                    alt={`오늘 추천 ${selectedGender === "boy" ? "남자" : "여자"} 캐릭터`}
                    width={180}
                    height={180}
                    className="mx-auto h-40 w-40 rounded-xl object-contain md:h-44 md:w-44"
                  />
                </div>
              </div>

              <p className="text-sm text-foreground">{currentOutfit.message}</p>
              <div className="flex flex-wrap gap-2">
                {currentOutfit.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={tag === "적당해" || tag === "쾌적해" || tag === "시원해" ? "default" : "outline"}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        ref={todoSectionRef}
        className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-8 md:grid-cols-12 md:px-6"
      >
          {todoError ? (
            <div className="md:col-span-12">
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
                {todoError}
              </p>
            </div>
          ) : null}

          <Card className="md:col-span-12">
            <CardContent className="grid gap-3 pt-5 md:grid-cols-12">
              <div className="relative md:col-span-5">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="제목 또는 설명으로 검색"
                  className="h-10 pl-9"
                />
              </div>

              <div className="md:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">상태: 전체</option>
                  <option value="completed">상태: 완료</option>
                  <option value="pending">상태: 미완료</option>
                  <option value="in_progress">상태: 진행중</option>
                  <option value="overdue">상태: 지연</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value as "all" | TodoItem["priority"])
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">우선순위: 전체</option>
                  <option value="high">우선순위: 높음</option>
                  <option value="medium">우선순위: 중간</option>
                  <option value="low">우선순위: 낮음</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortBy)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="created_date">정렬: 생성일순</option>
                  <option value="due_date">정렬: 마감일순</option>
                  <option value="priority">정렬: 우선순위순</option>
                  <option value="title">정렬: 제목순</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {selectedCalendarDate ? (
            <div className="md:col-span-12">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                <p>
                  날짜 필터 적용 중:{" "}
                  <span className="font-semibold">
                    {selectedCalendarDate.toLocaleDateString("ko-KR")}
                  </span>
                </p>
                <Button type="button" variant="outline" size="sm" onClick={clearCalendarDateFilter}>
                  날짜 필터 해제
                </Button>
              </div>
            </div>
          ) : null}

          {hasFilteredOutItems ? (
            <div className="md:col-span-12">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <p>
                  필터 때문에 일부 항목이 숨겨져 있어요. 현재{" "}
                  <span className="font-semibold">{todos.length}개</span> / 전체{" "}
                  <span className="font-semibold">{totalTodoCount}개</span>가 표시 중입니다.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={resetTodoControls}>
                  필터 초기화
                </Button>
              </div>
            </div>
          ) : null}

          <Card className="md:col-span-12">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">AI 요약 및 분석</CardTitle>
                  <CardDescription>
                    AI가 할 일 목록을 분석하여 지금 당장 해야할 일과, 실행가능한
                    인사이트를 제공합니다.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-full bg-muted p-1">
                    {summaryTabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveSummaryPeriod(tab.key)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                          activeSummaryPeriod === tab.key
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted-foreground/10"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={handleGenerateAiSummary}
                    disabled={isAiSummaryLoading}
                    className="gap-2"
                  >
                    {isAiSummaryLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        AI 분석 중...
                      </>
                    ) : (
                      "AI 요약 보기"
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiSummaryError ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <p className="text-sm font-medium text-destructive">{aiSummaryError}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAiSummary}
                  >
                    재시도
                  </Button>
                </div>
              ) : null}
              {aiSummaryData?.error ? (
                <p className="text-xs font-medium text-amber-700">{aiSummaryData.error}</p>
              ) : null}
              {isAiSummaryLoading ? (
                <div className="flex h-40 items-center justify-center rounded-xl border border-border/70 bg-background/70">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    AI가 할일 패턴을 분석하고 있어요...
                  </div>
                </div>
              ) : aiSummaryData ? (
                <>
                  <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm">
                    {aiSummaryData.summary}
                  </div>

                  {activeSummaryPeriod === "today" ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="rounded-lg border border-border/70 bg-background/80 p-3 md:col-span-4">
                          <p className="text-sm font-semibold">오늘 완료율</p>
                          <p className="mt-2 text-3xl font-bold text-primary">
                            {aiSummaryData.completion.currentRate.toFixed(1)}%
                          </p>
                          <Progress
                            value={aiSummaryData.completion.currentRate}
                            className="mt-2 h-2 bg-secondary/20"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            마감일 준수율 {aiSummaryData.timeManagement.deadlineAdherenceRate.toFixed(1)}%
                          </p>
                        </div>

                        <div className="rounded-lg border border-border/70 bg-background/80 p-3 md:col-span-8">
                          <p className="text-sm font-semibold">오늘 집중해야 할 작업</p>
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {(aiSummaryData.focusNow.length > 0
                              ? aiSummaryData.focusNow
                              : aiSummaryData.urgentTasks
                            ).slice(0, 5).map((task) => (
                              <li
                                key={task}
                                className="rounded-md bg-muted/30 px-2 py-1"
                              >
                                🎯 {task}
                              </li>
                            ))}
                            {aiSummaryData.focusNow.length === 0 &&
                            aiSummaryData.urgentTasks.length === 0 ? (
                              <li>- 남은 핵심 작업이 없습니다.</li>
                            ) : null}
                          </ul>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                          <p className="text-sm font-semibold">남은 할 일 / 우선순위</p>
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {aiSummaryData.urgentTasks.length > 0 ? (
                              aiSummaryData.urgentTasks.map((task) => (
                                <li key={task}>- {task}</li>
                              ))
                            ) : (
                              <li>- 우선 처리 작업이 없습니다.</li>
                            )}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                          <p className="text-sm font-semibold">시간대별 집중 분포</p>
                          <div className="mt-2 space-y-2">
                            {aiSummaryData.timeManagement.focusDistribution.length > 0 ? (
                              aiSummaryData.timeManagement.focusDistribution.map((item) => (
                                <div key={item.bucket}>
                                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{item.bucket}</span>
                                    <span>{item.count}건</span>
                                  </div>
                                  <Progress
                                    value={Math.min(100, item.count * 20)}
                                    className="h-1.5 bg-secondary/20"
                                  />
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                분석할 시간대 데이터가 부족합니다.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="rounded-lg border border-border/70 bg-background/80 p-3 md:col-span-4">
                          <p className="text-sm font-semibold">주간 완료율</p>
                          <p className="mt-2 text-3xl font-bold text-primary">
                            {aiSummaryData.completion.currentRate.toFixed(1)}%
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            지난 기간 {aiSummaryData.completion.previousRate.toFixed(1)}%
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-sm font-semibold",
                              aiSummaryData.completion.improvement >= 0
                                ? "text-emerald-600"
                                : "text-destructive"
                            )}
                          >
                            추세 {aiSummaryData.completion.improvement >= 0 ? "+" : ""}
                            {aiSummaryData.completion.improvement.toFixed(1)}%
                          </p>
                        </div>

                        <div className="rounded-lg border border-border/70 bg-background/80 p-3 md:col-span-8">
                          <p className="text-sm font-semibold">요일별 생산성 패턴</p>
                          {aiSummaryData.weekdayProductivity.length > 0 ? (
                            (() => {
                              const maxScore = Math.max(
                                1,
                                ...aiSummaryData.weekdayProductivity.map((day) => day.score)
                              )
                              const avgScore =
                                aiSummaryData.weekdayProductivity.reduce(
                                  (sum, day) => sum + day.score,
                                  0
                                ) / aiSummaryData.weekdayProductivity.length

                              return (
                                <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                                  <div className="flex h-36 items-end justify-between gap-2">
                                    {aiSummaryData.weekdayProductivity.map((item) => {
                                      const barHeightPercent = Math.max(
                                        8,
                                        Math.round((item.score / maxScore) * 100)
                                      )
                                      const gapFromMax = item.score - maxScore
                                      const gapFromAverage = item.score - avgScore

                                      return (
                                        <div
                                          key={item.day}
                                          className="group relative flex flex-1 flex-col items-center justify-end gap-1"
                                        >
                                          <span className="text-[10px] text-muted-foreground">
                                            {item.score.toFixed(0)}
                                          </span>
                                          <div className="relative flex h-24 w-full items-end justify-center rounded-md bg-background/80">
                                            <div
                                              className={cn(
                                                "w-5/6 rounded-t-md",
                                                item.day === aiSummaryData.productivityPattern.bestDay.replace(
                                                  "요일",
                                                  ""
                                                )
                                                  ? "bg-primary"
                                                  : "bg-primary/40"
                                              )}
                                              style={{ height: `${barHeightPercent}%` }}
                                            />
                                          </div>
                                          <div className="pointer-events-none absolute -top-16 left-1/2 z-10 hidden -translate-x-1/2 rounded-md border border-border/70 bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-md group-hover:block">
                                            <p className="whitespace-nowrap">
                                              {item.day}요일 생산성 {item.score.toFixed(1)}점
                                            </p>
                                            <p className="whitespace-nowrap text-[10px] text-muted-foreground">
                                              최고 대비 {gapFromMax.toFixed(1)}점, 평균 대비{" "}
                                              {gapFromAverage >= 0 ? "+" : ""}
                                              {gapFromAverage.toFixed(1)}점
                                            </p>
                                          </div>
                                          <span className="text-xs font-medium text-muted-foreground">
                                            {item.day}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                  <p className="mt-2 text-[11px] text-muted-foreground">
                                    가장 높은 막대는 이번 주 기준 상대적으로 생산성이 높았던 요일입니다.
                                  </p>
                                </div>
                              )
                            })()
                          ) : (
                            <p className="mt-2 text-xs text-muted-foreground">
                              요일 패턴 데이터를 불러오는 중입니다.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                          <p className="text-sm font-semibold">생산성 패턴 분석</p>
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <li>- 최고 요일: {aiSummaryData.productivityPattern.bestDay}</li>
                            <li>- 집중 시간: {aiSummaryData.productivityPattern.bestTimeBucket}</li>
                            {aiSummaryData.productivityPattern.procrastinatedTypes.length > 0 ? (
                              <li>
                                - 자주 미루는 유형:{" "}
                                {aiSummaryData.productivityPattern.procrastinatedTypes.join(", ")}
                              </li>
                            ) : null}
                            {aiSummaryData.productivityPattern.easyTaskTraits.length > 0 ? (
                              <li>
                                - 완료 쉬운 특징:{" "}
                                {aiSummaryData.productivityPattern.easyTaskTraits.join(", ")}
                              </li>
                            ) : null}
                          </ul>
                        </div>

                        <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                          <p className="text-sm font-semibold">다음 주 계획 제안</p>
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {aiSummaryData.nextWeekPlan.length > 0 ? (
                              aiSummaryData.nextWeekPlan.map((item) => (
                                <li key={item}>- {item}</li>
                              ))
                            ) : (
                              <li>- 다음 주 계획 제안 데이터가 없습니다.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Lightbulb className="size-4 text-amber-500" />
                        💡 인사이트
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {aiSummaryData.insights.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Target className="size-4 text-primary" />
                        🎯 실행 추천
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {aiSummaryData.recommendation.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Smile className="size-4 text-emerald-600" />
                        ✅ 긍정 피드백
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {aiSummaryData.positiveFeedback.length > 0 ? (
                          aiSummaryData.positiveFeedback.map((item) => (
                            <li key={item}>- {item}</li>
                          ))
                        ) : (
                          <li>- 지금도 충분히 잘하고 있어요. 이 페이스를 유지해보세요.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  [AI 요약 보기] 버튼을 눌러 {activeSummaryPeriod === "today" ? "오늘" : "이번주"}{" "}
                  분석 결과를 확인해보세요.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="md:col-span-4">
            <TodoForm
              key={`${editingTodo?.id ?? "create"}-${todoFormVersion}`}
              mode={editingTodo ? "edit" : "create"}
              initialValues={
                editingTodo
                  ? {
                      title: editingTodo.title,
                      description: editingTodo.description ?? "",
                      due_date: editingTodo.due_date ?? null,
                      priority: editingTodo.priority,
                      category: Array.isArray(editingTodo.category)
                        ? editingTodo.category
                        : [editingTodo.category],
                      completed: editingTodo.completed,
                    }
                  : undefined
              }
              isSubmitting={isTodoSubmitting}
              onSubmit={handleSubmitTodo}
              onCancel={editingTodo ? () => setEditingTodo(null) : undefined}
            />
          </div>

          <div className="md:col-span-8">
            <TodoList
              todos={filteredTodosByCalendar}
              isLoading={isTodosLoading}
              errorMessage={todoError || null}
              onRetry={fetchTodos}
              onToggleComplete={handleToggleComplete}
              onChangeStatus={handleChangeTodoStatus}
              onEdit={handleEditTodo}
              onDelete={handleDeleteTodo}
            />
          </div>

          <Dialog open={isCalendarSummaryOpen} onOpenChange={setIsCalendarSummaryOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedCalendarDate
                    ? `${selectedCalendarDate.toLocaleDateString("ko-KR")} 할일 요약`
                    : "날짜 요약"}
                </DialogTitle>
                <DialogDescription>
                  선택한 날짜의 상태 분포와 주요 할일을 확인할 수 있어요.
                </DialogDescription>
              </DialogHeader>

              {selectedCalendarStats ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                      전체 {selectedCalendarStats.total}개
                    </div>
                    <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                      완료 {selectedCalendarStats.completed}개
                    </div>
                    <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                      진행중 {selectedCalendarStats.inProgress}개
                    </div>
                    <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                      지연 {selectedCalendarStats.overdue}개
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                    <p className="text-sm font-semibold">주요 할일</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {selectedCalendarStats.topEvents.length > 0 ? (
                        selectedCalendarStats.topEvents.map((event, index) => (
                          <li key={`${selectedCalendarDateKey}-${event.title}-${index}`}>
                            - {event.title}
                            {event.status === "completed"
                              ? "(완)"
                              : event.status === "in_progress"
                                ? "(진)"
                                : event.status === "overdue"
                                  ? "(지)"
                                  : "(미)"}
                          </li>
                        ))
                      ) : (
                        <li>- 등록된 할일이 없습니다.</li>
                      )}
                    </ul>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setIsCalendarSummaryOpen(false)
                        scrollToTodoSection()
                      }}
                    >
                      목록으로 이동
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  선택한 날짜의 할일 데이터가 없습니다.
                </p>
              )}
            </DialogContent>
          </Dialog>
      </section>
    </main>
  )
}

export default Home
