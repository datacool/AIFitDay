"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

const MAX_MESSAGE_LEN = 1000
const MAX_IMAGES = 3
const MAX_IMAGE_MB = 5
const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/gif"

const categoryLabels: Record<string, string> = {
  general: "일반 문의",
  bug: "기능 오류·버그",
  account: "계정·로그인",
  partnership: "제휴·협력",
  privacy: "개인정보",
  other: "기타",
}

/** 온사이트 1:1 문의 → POST /api/contact (multipart 지원) */
export function ContactForm() {
  const [fileInputKey, setFileInputKey] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [category, setCategory] = useState<keyof typeof categoryLabels>("general")
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [honeypot, setHoneypot] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successReferenceId, setSuccessReferenceId] = useState<string | null>(null)

  const onFilesSelected = (list: FileList | null) => {
    if (!list?.length) return
    const next: File[] = [...attachments]
    for (let i = 0; i < list.length && next.length < MAX_IMAGES; i += 1) {
      const f = list.item(i)
      if (f && f.size > 0) next.push(f)
    }
    setAttachments(next.slice(0, MAX_IMAGES))
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")
    setSuccessReferenceId(null)
    setIsSubmitting(true)

    try {
      const fd = new FormData()
      fd.append("name", name)
      fd.append("email", email)
      fd.append("category", category)
      fd.append("message", message)
      fd.append("website", honeypot)
      attachments.forEach((file) => {
        fd.append("attachments", file)
      })

      const response = await fetch("/api/contact", {
        method: "POST",
        body: fd,
      })

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        referenceId?: string
      }

      if (!response.ok) {
        setErrorMessage(data.error ?? "접수에 실패했습니다. 잠시 후 다시 시도해 주세요.")
        return
      }

      if (data.referenceId) {
        setSuccessReferenceId(data.referenceId)
        setName("")
        setEmail("")
        setCategory("general")
        setMessage("")
        setAttachments([])
        setFileInputKey((k) => k + 1)
      } else {
        setSuccessReferenceId("ok")
      }
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다. 연결을 확인해 주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const messageLen = message.length

  if (successReferenceId) {
    return (
      <Card className="border-border/70 border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <CardHeader>
          <CardTitle className="text-lg text-emerald-800 dark:text-emerald-200">
            문의가 접수되었습니다
          </CardTitle>
          <CardDescription className="text-emerald-900/80 dark:text-emerald-200/80">
            소중한 의견을 남겨 주셔서 감사합니다. 가능한 빠르게 확인한 뒤, 남겨 주신
            이메일로 답변 드리겠습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-emerald-900/90 dark:text-emerald-100/90">
          {successReferenceId !== "ok" ? (
            <p>
              <span className="font-medium">접수 번호:</span>{" "}
              <code className="rounded bg-emerald-100/80 px-1.5 py-0.5 text-xs dark:bg-emerald-900/40">
                {successReferenceId}
              </code>
              <span className="mt-2 block text-xs text-muted-foreground">
                추가 문의 시 이 번호를 알려 주시면 확인에 도움이 됩니다.
              </span>
            </p>
          ) : null}
          <p className="text-muted-foreground">
            보통 며칠 안에 남겨 주신 이메일로 답변드립니다. 주말·공휴일에
            주신 문의는 다음 영업일에 차례로 확인합니다. 긴급한 보안 관련
            사항은 이메일 제목에「보안」을 적어 주시면 검토를 우선하겠습니다.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() => setSuccessReferenceId(null)}
          >
            다른 문의 남기기
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">도움이 필요하신가요?</CardTitle>
        <CardDescription>
          서비스를 이용하시면서 궁금하시거나 불편한 점, 오류 등을 남겨 주시면
          담당자가 검토한 뒤 이메일로 답변드립니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="contact-name">이름</Label>
            <Input
              id="contact-name"
              name="name"
              autoComplete="name"
              className="h-10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
              maxLength={120}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-email">답변 받을 이메일</Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              className="h-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              maxLength={254}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-category">문의 유형</Label>
            <NativeSelect
              id="contact-category"
              name="category"
              className="w-full max-w-md"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as keyof typeof categoryLabels)
              }
              disabled={isSubmitting}
              required
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="contact-message">내용</Label>
              <span
                className={`text-xs tabular-nums ${messageLen > MAX_MESSAGE_LEN ? "text-destructive" : "text-muted-foreground"}`}
                aria-live="polite"
              >
                {messageLen.toLocaleString()} / {MAX_MESSAGE_LEN.toLocaleString()}자
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              최대 {MAX_MESSAGE_LEN.toLocaleString()}자까지 입력할 수 있습니다(공백 포함).
              최소 10자 이상 적어 주세요.
            </p>
            <Textarea
              id="contact-message"
              name="message"
              className="min-h-32 resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              required
              minLength={10}
              maxLength={MAX_MESSAGE_LEN}
              placeholder="사용 시 궁금한 점이나 불편한 점을 최대한 자세히 적어주세요."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-attachments">
              캡처·스크린샷 첨부 (선택, 이미지 최대 {MAX_IMAGES}장, 장당 {MAX_IMAGE_MB}MB)
            </Label>
            <Input
              key={fileInputKey}
              id="contact-attachments"
              name="attachments"
              type="file"
              accept={ACCEPT_IMAGES}
              multiple
              className="cursor-pointer"
              disabled={isSubmitting}
              onChange={(e) => onFilesSelected(e.target.files)}
            />
            {attachments.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {attachments.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-2 py-1.5"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0"
                      onClick={() => removeAttachment(index)}
                      disabled={isSubmitting}
                    >
                      제거
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          {errorMessage ? (
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
          ) : null}
          <Button
            type="submit"
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "접수 중…" : "문의 접수하기"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
