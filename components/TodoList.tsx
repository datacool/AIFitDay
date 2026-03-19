"use client"

import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  TodoCard,
  type TodoItem,
  type TodoStatusOption,
} from "@/components/TodoCard"

interface TodoListProps {
  todos: TodoItem[]
  isLoading?: boolean
  errorMessage?: string | null
  onRetry?: () => void
  onToggleComplete?: (todoId: string, completed: boolean) => void
  onChangeStatus?: (todo: TodoItem, status: TodoStatusOption) => void
  onEdit?: (todo: TodoItem) => void
  onDelete?: (todoId: string) => void
}

/** 할일 목록의 로딩/빈/오류 상태를 포함해 렌더링한다. */
export const TodoList = ({
  todos,
  isLoading = false,
  errorMessage,
  onRetry,
  onToggleComplete,
  onChangeStatus,
  onEdit,
  onDelete,
}: TodoListProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
        할일 목록을 불러오는 중입니다...
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          <span>{errorMessage}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          등록된 할일이 없습니다. 첫 할일을 추가해보세요.
        </p>
      </div>
    )
  }

  return (
    <section className="grid gap-4">
      {todos.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onChangeStatus={onChangeStatus}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  )
}
