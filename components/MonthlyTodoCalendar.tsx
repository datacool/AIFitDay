"use client"

import { useMemo } from "react"

import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type MonthlyTodoStatus = "completed" | "pending" | "in_progress" | "overdue"

export interface MonthlyTodoEventPreview {
  title: string
  status: MonthlyTodoStatus
}

export interface MonthlyTodoDayStats {
  total: number
  completed: number
  pending: number
  inProgress: number
  overdue: number
  topEvents: MonthlyTodoEventPreview[]
}

interface MonthlyTodoCalendarProps {
  dayStatsByDate: Record<string, MonthlyTodoDayStats>
  holidayDates?: string[]
  selectedDate?: Date
  onSelectDate: (date: Date) => void
  onClearDateFilter?: () => void
  className?: string
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

const toShortTitle = (value: string, maxLength = 6) => {
  const normalized = value.trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const

const statusBadgeClassMap: Record<MonthlyTodoStatus, string> = {
  overdue: "bg-destructive/10 text-destructive",
  in_progress: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100",
}

const statusLabelMap: Record<MonthlyTodoStatus, string> = {
  overdue: "지연",
  in_progress: "진행중",
  pending: "미완료",
  completed: "완료",
}

/** 월간 할일 상태를 한눈에 보여주는 캘린더 컴포넌트. */
export const MonthlyTodoCalendar = ({
  dayStatsByDate,
  holidayDates = [],
  selectedDate,
  onSelectDate,
  onClearDateFilter,
  className,
}: MonthlyTodoCalendarProps) => {
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : ""
  const selectedStats = selectedDateKey ? dayStatsByDate[selectedDateKey] : undefined
  const highlightedDates = useMemo(
    () => Object.keys(dayStatsByDate).map(parseDateKey),
    [dayStatsByDate]
  )
  const holidayDateSet = useMemo(() => new Set(holidayDates), [holidayDates])

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-background/80 p-3", className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">월간 할일 캘린더</p>
          <p className="text-xs text-muted-foreground">
            날짜를 선택하면 해당 일자의 할일 목록이 필터링됩니다.
          </p>
        </div>
        {selectedDate ? (
          <Button type="button" size="sm" variant="outline" onClick={onClearDateFilter}>
            날짜 필터 해제
          </Button>
        ) : null}
      </div>

      <div className="min-w-0 overflow-x-auto">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          className="w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-border/70 bg-background p-0.5 [--cell-size:1.625rem] max-[380px]:[--cell-size:1.5rem] sm:[--cell-size:2.25rem] md:[--cell-size:2.75rem]"
          classNames={{
            root: "w-full max-w-full min-w-0",
            weekday:
              "min-w-0 flex-1 rounded-(--cell-radius) text-[0.58rem] font-semibold text-muted-foreground select-none first:text-red-500 last:text-blue-500 sm:text-[0.72rem]",
          }}
          modifiers={{
            highlighted: highlightedDates,
          }}
          modifiersClassNames={{
            highlighted: "font-semibold text-foreground",
          }}
          formatters={{
            formatWeekdayName: (date) => WEEKDAY_LABELS[date.getDay()],
          }}
          components={{
            DayButton: (props) => {
              const dateKey = toDateKey(props.day.date)
              const stats = dayStatsByDate[dateKey]
              const previewEvents = stats?.topEvents.slice(0, 2) ?? []
              const weekday = props.day.date.getDay()
              const isSunday = weekday === 0
              const isSaturday = weekday === 6
              const isHoliday = holidayDateSet.has(dateKey)
              const dateColorClass = isSunday || isHoliday ? "text-red-500" : isSaturday ? "text-blue-500" : ""

              return (
                <CalendarDayButton
                  {...props}
                  className="h-[52px] min-h-[52px] max-h-[52px] items-start justify-start overflow-hidden px-1 py-1 text-left sm:h-[58px] sm:min-h-[58px] sm:max-h-[58px] sm:px-1.5 sm:py-1.5"
                >
                  <span className={cn("text-xs leading-none", dateColorClass)}>
                    {props.day.date.getDate()}
                  </span>
                  {previewEvents.length > 0 ? (
                    <span className="mt-1 grid w-full gap-0.5">
                      {previewEvents.map((event, index) => (
                        <span
                          key={`${dateKey}-${event.title}-${index}`}
                          className={cn(
                            "block w-full truncate whitespace-nowrap rounded px-1 py-0.5 text-[10px] leading-none",
                            statusBadgeClassMap[event.status]
                          )}
                          title={`${event.title} (${statusLabelMap[event.status]})`}
                        >
                          {toShortTitle(event.title)}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </CalendarDayButton>
              )
            },
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="border-destructive/40 bg-destructive/10">
          지연
        </Badge>
        <Badge variant="outline" className="border-sky-300/60 bg-sky-100/70 dark:bg-sky-900/40">
          진행중
        </Badge>
        <Badge variant="outline" className="border-amber-300/60 bg-amber-100/70 dark:bg-amber-900/40">
          미완료
        </Badge>
        <Badge
          variant="outline"
          className="border-emerald-300/60 bg-emerald-100/70 dark:bg-emerald-900/40"
        >
          완료
        </Badge>
      </div>

      {selectedDate && selectedStats ? (
        <div className="mt-3 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
          <p className="font-semibold">
            {selectedDate.toLocaleDateString("ko-KR")} 요약: 총 {selectedStats.total}개
          </p>
          <p className="mt-1 text-muted-foreground">
            완료 {selectedStats.completed} · 진행중 {selectedStats.inProgress} · 미완료{" "}
            {selectedStats.pending} · 지연 {selectedStats.overdue}
          </p>
          {selectedStats.topEvents.length > 0 ? (
            <p className="mt-1 text-muted-foreground">
              이벤트 축약:{" "}
              {selectedStats.topEvents
                .slice(0, 3)
                .map((event) => `${event.title}(${statusLabelMap[event.status]})`)
                .join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
