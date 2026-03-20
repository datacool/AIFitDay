import { NextResponse } from "next/server"
import { z } from "zod"

import { createServiceRoleClient } from "@/lib/supabase/service-role"

const MAX_MESSAGE_LEN = 1000
const MAX_ATTACHMENTS = 3
const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  category: z.enum([
    "general",
    "bug",
    "account",
    "partnership",
    "privacy",
    "other",
  ]),
  message: z.string().trim().min(10).max(MAX_MESSAGE_LEN),
  website: z.string().optional(),
})

const BUCKET = "contact-attachments"

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").slice(0, 120)
  return base.replace(/[^\w.\-가-힣]/g, "_") || "image"
}

/** multipart 또는 JSON 본문에서 공통 필드 검증 */
function parseContactFields(body: Record<string, unknown>) {
  return contactSchema.safeParse({
    name: body.name,
    email: body.email,
    category: body.category,
    message: body.message,
    website: body.website,
  })
}

/**
 * 공개 문의 접수. Supabase `contact_submissions` + (선택) Storage 첨부.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""
  let raw: Record<string, unknown>
  let files: File[] = []

  if (contentType.includes("multipart/form-data")) {
    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 })
    }
    const attachments = form.getAll("attachments")
    files = attachments.filter((item): item is File => item instanceof File && item.size > 0)

    raw = {
      name: form.get("name"),
      email: form.get("email"),
      category: form.get("category"),
      message: form.get("message"),
      website: form.get("website"),
    }
  } else {
    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 })
    }
    raw = (json ?? {}) as Record<string, unknown>
    files = []
  }

  const parsed = parseContactFields(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값을 확인해 주세요.", details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { name, email, category, message, website } = parsed.data
  if (website && String(website).trim().length > 0) {
    return NextResponse.json({ ok: true })
  }

  if (files.length > MAX_ATTACHMENTS) {
    return NextResponse.json(
      { error: `첨부는 최대 ${MAX_ATTACHMENTS}장까지 가능합니다.` },
      { status: 422 },
    )
  }

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "첨부 파일 한 장은 5MB를 넘을 수 없습니다." },
        { status: 422 },
      )
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "첨부는 JPG, PNG, WebP, GIF 이미지만 가능합니다." },
        { status: 422 },
      )
    }
  }

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "접수 시스템을 준비 중입니다. 잠시 후 다시 시도해 주시거나 FAQ를 참고해 주세요.",
      },
      { status: 503 },
    )
  }

  const { data: row, error: insertError } = await supabase
    .from("contact_submissions")
    .insert({
      name,
      email,
      category,
      message,
      attachment_paths: [],
      status: "received",
    })
    .select("id")
    .single()

  if (insertError || !row) {
    console.error("[contact insert]", insertError?.message)
    return NextResponse.json(
      { error: "접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    )
  }

  const submissionId = row.id as string
  const storedPaths: string[] = []

  try {
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]
      const safeName = sanitizeFilename(file.name)
      const path = `${submissionId}/${i}-${safeName}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, {
          contentType: file.type,
          upsert: false,
        })
      if (upErr) {
        console.error("[contact upload]", upErr.message)
        throw new Error(upErr.message)
      }
      storedPaths.push(path)
    }

    if (storedPaths.length > 0) {
      const { error: updateErr } = await supabase
        .from("contact_submissions")
        .update({ attachment_paths: storedPaths })
        .eq("id", submissionId)
      if (updateErr) {
        console.error("[contact update paths]", updateErr.message)
        throw new Error(updateErr.message)
      }
    }
  } catch {
    await supabase.from("contact_submissions").delete().eq("id", submissionId)
    return NextResponse.json(
      {
        error:
          "첨부 파일 저장에 실패했습니다. 이미지를 줄이거나 장수를 줄인 뒤 다시 시도해 주세요.",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    referenceId: submissionId,
  })
}
