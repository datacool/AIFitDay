"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type PasswordFieldProps = {
  id: string
  name?: string
  label: string
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  autoComplete: string
  placeholder?: string
  className?: string
}

/** 비밀번호 입력 + 표시/숨김(눈 아이콘) 토글 */
export function PasswordField({
  id,
  name,
  label,
  value,
  onValueChange,
  disabled,
  autoComplete,
  placeholder,
  className,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name ?? id}
          type={visible ? "text" : "password"}
          className="h-10 px-3 pr-11"
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={disabled}
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((previous) => !previous)}
          disabled={disabled}
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </Button>
      </div>
    </div>
  )
}
