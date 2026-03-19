"use client"

import { useState } from "react"
import { Check, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type TodoPriority = "high" | "medium" | "low"
type Meridiem = "am" | "pm"

export interface TodoFormValues {
  title: string
  description: string
  due_date: string | null
  priority: TodoPriority
  category: string[]
  completed: boolean
}

interface TodoFormProps {
  mode?: "create" | "edit"
  initialValues?: Partial<TodoFormValues>
  isSubmitting?: boolean
  onSubmit: (values: TodoFormValues) => void | Promise<void>
  onCancel?: () => void
  className?: string
}

interface AiParseResponse {
  error?: string
  todo?: TodoFormValues
  todoDraft?: TodoFormValues
  confirmationRequired?: boolean
  question?: string
}

const defaultValues: TodoFormValues = {
  title: "",
  description: "",
  due_date: null,
  priority: "medium",
  category: ["개인"],
  completed: false,
}

const parseCategory = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

const pad2 = (value: number) => value.toString().padStart(2, "0")

const getLocalDateTimeParts = (value?: string | null) => {
  if (!value) {
    return {
      date: "",
      meridiem: "am" as Meridiem,
      hour: "09",
      minute: "00",
      dateTime: "",
    }
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return {
      date: "",
      meridiem: "am" as Meridiem,
      hour: "09",
      minute: "00",
      dateTime: "",
    }
  }

  const year = parsed.getFullYear()
  const month = pad2(parsed.getMonth() + 1)
  const day = pad2(parsed.getDate())
  const hour24 = parsed.getHours()
  const meridiem: Meridiem = hour24 >= 12 ? "pm" : "am"
  const hour12 = hour24 % 12 || 12
  const minute = pad2(parsed.getMinutes())
  const hour = pad2(hour12)
  const date = `${year}-${month}-${day}`
  const dateTime = `${date}T${pad2(hour24)}:${minute}`

  return { date, meridiem, hour, minute, dateTime }
}

const buildDateTimeFromParts = (
  date: string,
  meridiem: Meridiem,
  hour: string,
  minute: string
) => {
  if (!date) return ""
  const normalizedHour = Number(hour)
  if (Number.isNaN(normalizedHour)) return ""

  let hour24 = normalizedHour % 12
  if (meridiem === "pm") {
    hour24 += 12
  }

  return `${date}T${pad2(hour24)}:${minute}`
}

const getTodayDateString = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/** 할일 생성 및 편집에 사용하는 입력 폼을 제공한다. */
export const TodoForm = ({
  mode = "create",
  initialValues,
  isSubmitting = false,
  onSubmit,
  onCancel,
  className,
}: TodoFormProps) => {
  const mergedValues: TodoFormValues = {
    ...defaultValues,
    ...initialValues,
  }
  const initialDateTime = getLocalDateTimeParts(mergedValues.due_date)

  const [title, setTitle] = useState(mergedValues.title)
  const [description, setDescription] = useState(mergedValues.description)
  const [dueDate, setDueDate] = useState(initialDateTime.dateTime)
  const [pendingDate, setPendingDate] = useState(initialDateTime.date)
  const [pendingMeridiem, setPendingMeridiem] = useState<Meridiem>(
    initialDateTime.meridiem
  )
  const [pendingHour, setPendingHour] = useState(initialDateTime.hour)
  const [pendingMinute, setPendingMinute] = useState(initialDateTime.minute)
  const [priority, setPriority] = useState<TodoPriority>(mergedValues.priority)
  const [categoryInput, setCategoryInput] = useState(mergedValues.category.join(", "))
  const [completed, setCompleted] = useState(mergedValues.completed)
  const [errorText, setErrorText] = useState("")
  const [noticeText, setNoticeText] = useState("")
  const [isAiMode, setIsAiMode] = useState(false)
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const pendingDueDate = buildDateTimeFromParts(
    pendingDate,
    pendingMeridiem,
    pendingHour,
    pendingMinute
  )
  const hasPendingDueDateChange = pendingDueDate !== dueDate

  const ensurePendingDate = () => {
    if (pendingDate) return
    setPendingDate(getTodayDateString())
  }

  const submitLabel = mode === "edit" ? "수정하기" : "추가하기"

  const applyAiTodoToForm = (todo: TodoFormValues) => {
    setTitle(todo.title)
    setDescription(todo.description ?? "")
    setPriority(todo.priority)
    setCategoryInput((todo.category ?? ["개인"]).join(", "))
    setCompleted(todo.completed)

    const parsedDueDate = getLocalDateTimeParts(todo.due_date)
    setPendingDate(parsedDueDate.date)
    setPendingMeridiem(parsedDueDate.meridiem)
    setPendingHour(parsedDueDate.hour)
    setPendingMinute(parsedDueDate.minute)
    setDueDate(parsedDueDate.dateTime)
  }

  const handleGenerateByAi = async () => {
    const normalizedInput = naturalLanguageInput.trim()
    if (!normalizedInput) {
      setNoticeText("")
      setErrorText("AI 변환할 문장을 먼저 입력해주세요.")
      return
    }

    setIsAiGenerating(true)
    setErrorText("")
    setNoticeText("")

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 45000)

    try {
      const response = await fetch("/api/todos/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: normalizedInput }),
        cache: "no-store",
        signal: controller.signal,
      })

      let result: AiParseResponse = {}
      const contentType = response.headers.get("content-type") ?? ""

      if (contentType.includes("application/json")) {
        result = (await response.json()) as AiParseResponse
      } else {
        const rawText = await response.text()
        result = { error: rawText || "AI 변환 결과 형식이 올바르지 않습니다." }
      }

      const parsedTodo = result.todo ?? result.todoDraft

      if (response.ok && parsedTodo) {
        applyAiTodoToForm(parsedTodo)
        setNoticeText("AI 분석 결과를 적용했습니다. 필요하면 직접 수정 후 저장하세요.")
        return
      }

      if (result.confirmationRequired && result.todoDraft) {
        const shouldApply = window.confirm(
          result.question ?? "생성된 마감일이 과거입니다. 이 일정으로 적용할까요?"
        )
        if (shouldApply) {
          applyAiTodoToForm(result.todoDraft)
          setNoticeText("확인 후 과거 일정 초안을 적용했습니다.")
        } else {
          setErrorText(result.error ?? "마감일을 다시 지정해주세요.")
        }
        return
      }

      if (response.status === 429 && result.todoDraft) {
        applyAiTodoToForm(result.todoDraft)
        setNoticeText(
          "AI 한도 초과로 규칙 기반 초안을 적용했습니다. 필요하면 수정 후 저장하세요."
        )
        return
      }

      throw new Error(
        result.error ??
          `AI 변환 결과를 불러오지 못했습니다. (HTTP ${response.status})`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ""
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        setErrorText(
          "서버 연결이 일시적으로 끊겼어요. 잠시 후 다시 시도하거나, 계속 발생하면 `npm run dev:clean`으로 서버를 재시작해 주세요."
        )
        return
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        setErrorText(
          "AI 분석 요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
        )
        return
      }

      setErrorText(
        error instanceof Error
          ? error.message
          : "AI 변환 중 오류가 발생했습니다."
      )
    } finally {
      window.clearTimeout(timeoutId)
      setIsAiGenerating(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!title.trim()) {
      setNoticeText("")
      setErrorText("제목은 필수 입력 항목입니다.")
      return
    }

    if (pendingDueDate !== dueDate) {
      setNoticeText("")
      setErrorText("마감일 변경 후 '확인' 버튼을 눌러 적용해주세요.")
      return
    }

    setNoticeText("")
    setErrorText("")

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
      category: parseCategory(categoryInput),
      completed,
    })
  }

  return (
    <form
      className={cn("grid gap-4 rounded-xl border border-border/60 bg-card p-5", className)}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-2">
        <Label htmlFor="todo-title">제목</Label>
        <Input
          id="todo-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="예: 팀 회의 준비"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="todo-description">설명</Label>
        <Textarea
          id="todo-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="할일의 세부 내용을 입력하세요."
          rows={4}
        />
      </div>

      <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-medium">AI 할일 생성 모드</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={isAiMode ? "default" : "outline"}
            onClick={() => setIsAiMode((prev) => !prev)}
          >
            {isAiMode ? "AI 모드 ON" : "AI 모드 OFF"}
          </Button>
        </div>
        {isAiMode ? (
          <>
            <Textarea
              value={naturalLanguageInput}
              onChange={(event) => setNaturalLanguageInput(event.target.value)}
              placeholder="예: 내일 오후 3시까지 중요한 팀 회의 준비하기"
              rows={2}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleGenerateByAi}
                disabled={isAiGenerating}
                className="gap-2"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    AI로 채우기
                  </>
                )}
              </Button>
            </div>
          </>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="todo-due-date">마감일</Label>
        <div className="grid gap-2">
          <Input
            id="todo-due-date"
            type="date"
            value={pendingDate}
            onChange={(event) => setPendingDate(event.target.value)}
            className="w-full min-w-0"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={pendingMeridiem}
              onChange={(event) => {
                ensurePendingDate()
                setPendingMeridiem(event.target.value as Meridiem)
              }}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="am">오전</option>
              <option value="pm">오후</option>
            </select>
            <select
              value={pendingHour}
              onChange={(event) => {
                ensurePendingDate()
                setPendingHour(event.target.value)
              }}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {Array.from({ length: 12 }).map((_, index) => {
                const hour = pad2(index + 1)
                return (
                  <option key={hour} value={hour}>
                    {hour}시
                  </option>
                )
              })}
            </select>
            <select
              value={pendingMinute}
              onChange={(event) => {
                ensurePendingDate()
                setPendingMinute(event.target.value)
              }}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {["00", "15", "30", "45"].map((minute) => (
                <option key={minute} value={minute}>
                  {minute}분
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            className="shrink-0 gap-1"
            disabled={!hasPendingDueDateChange}
            onClick={() => {
              setDueDate(pendingDueDate)
              setErrorText("")
            }}
          >
            <Check className="size-4" />
            확인
          </Button>
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          <p className="text-xs text-muted-foreground">
            선택 중: {pendingDueDate ? pendingDueDate.replace("T", " ") : "미정"}
          </p>
          <p className="text-xs text-muted-foreground sm:text-right">
            적용된 마감일: {dueDate ? dueDate.replace("T", " ") : "미정"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              hasPendingDueDateChange
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            )}
          >
            {hasPendingDueDateChange ? "미적용" : "적용됨"}
          </span>
          {pendingDueDate ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => {
                setPendingDate("")
                setPendingMeridiem("am")
                setPendingHour("09")
                setPendingMinute("00")
                setDueDate("")
                setErrorText("")
              }}
            >
              마감일 지우기
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="todo-priority">우선순위</Label>
        <select
          id="todo-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as TodoPriority)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="high">높음</option>
          <option value="medium">중간</option>
          <option value="low">낮음</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="todo-category">카테고리(쉼표로 구분)</Label>
        <Input
          id="todo-category"
          value={categoryInput}
          onChange={(event) => setCategoryInput(event.target.value)}
          placeholder="업무, 개인, 학습"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="todo-completed"
          checked={completed}
          onCheckedChange={(value) => setCompleted(value === true)}
        />
        <Label htmlFor="todo-completed">완료 상태로 저장</Label>
      </div>

      {errorText ? (
        <p className="text-sm font-medium text-destructive">{errorText}</p>
      ) : null}
      {noticeText ? (
        <p className="text-sm font-medium text-emerald-600">{noticeText}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
