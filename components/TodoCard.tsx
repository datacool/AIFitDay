"use client"

import { CalendarClock, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export type TodoPriority = "high" | "medium" | "low"
export type TodoStatusOption = "completed" | "pending" | "in_progress" | "overdue"

export interface TodoItem {
  id: string
  title: string
  description?: string | null
  created_date: string
  due_date?: string | null
  priority: TodoPriority
  category: string[] | string
  completed: boolean
}

interface TodoCardProps {
  todo: TodoItem
  onToggleComplete?: (todoId: string, completed: boolean) => void
  onChangeStatus?: (todo: TodoItem, status: TodoStatusOption) => void
  onEdit?: (todo: TodoItem) => void
  onDelete?: (todoId: string) => void
}

const priorityLabelMap: Record<TodoPriority, string> = {
  high: "높음",
  medium: "중간",
  low: "낮음",
}

const priorityClassMap: Record<TodoPriority, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-accent/15 text-foreground border-accent/40",
  low: "bg-secondary/20 text-secondary-foreground border-secondary/40",
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "미정"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "미정"

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed)
}

const getStatusLabel = (todo: TodoItem) => {
  if (todo.completed) return "완료"
  if (!todo.due_date) return "미완료"

  const dueDate = new Date(todo.due_date)
  return dueDate.getTime() < Date.now() ? "지연" : "진행중"
}

const getCurrentStatusOption = (todo: TodoItem): TodoStatusOption => {
  if (todo.completed) return "completed"
  if (!todo.due_date) return "pending"
  const dueDate = new Date(todo.due_date)
  return dueDate.getTime() < Date.now() ? "overdue" : "in_progress"
}

/** 개별 할일 카드의 표시와 상호작용을 제공한다. */
export const TodoCard = ({
  todo,
  onToggleComplete,
  onChangeStatus,
  onEdit,
  onDelete,
}: TodoCardProps) => {
  const statusLabel = getStatusLabel(todo)
  const categories = Array.isArray(todo.category) ? todo.category : [todo.category]
  const currentStatus = getCurrentStatusOption(todo)

  return (
    <Card className="gap-3">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Checkbox
              id={`todo-${todo.id}`}
              checked={todo.completed}
              onCheckedChange={(checked) =>
                onToggleComplete?.(todo.id, checked === true)
              }
              className="mt-0.5"
            />
            <div>
              <CardTitle
                className={todo.completed ? "line-through text-muted-foreground" : ""}
              >
                {todo.title}
              </CardTitle>
              <CardDescription className="mt-1">
                생성일: {formatDateTime(todo.created_date)}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  {statusLabel}
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={currentStatus}
                onValueChange={(value) =>
                  onChangeStatus?.(todo, value as TodoStatusOption)
                }
              >
                <DropdownMenuRadioItem value="in_progress">
                  진행중
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="overdue">지연</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">완료</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">미완료</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {todo.description ? (
          <p className="text-sm text-muted-foreground">{todo.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">설명이 없습니다.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={priorityClassMap[todo.priority]}>
            우선순위: {priorityLabelMap[todo.priority]}
          </Badge>
          {categories.map((value) => (
            <Badge key={`${todo.id}-${value}`} variant="secondary">
              {value}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="size-4" />
          <span>마감일: {formatDateTime(todo.due_date)}</span>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit?.(todo)}>
          <Pencil className="size-4" />
          편집
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="size-4" />
              삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말로 이 할일을 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                삭제 후에는 되돌릴 수 없습니다.
                <br />
                <span className="font-medium text-foreground">{todo.title}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => onDelete?.(todo.id)}
              >
                삭제하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
