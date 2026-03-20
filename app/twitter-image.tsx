import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "AIFitDay"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Twitter summary_large_image용 — opengraph-image와 동일 비주얼을 유지 */
export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 50%, #312e81 100%)",
          padding: "72px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(255,255,255,0.22)",
              border: "2px solid rgba(255,255,255,0.35)",
            }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "rgba(255,255,255,0.88)",
              letterSpacing: "-0.02em",
            }}
          >
            ai-fit-day.vercel.app
          </span>
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}
        >
          AIFitDay
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 36,
            fontWeight: 600,
            color: "rgba(255,255,255,0.94)",
            maxWidth: 900,
            lineHeight: 1.25,
          }}
        >
          Real-time weather + AI for smarter daily planning
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            fontWeight: 500,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          AIFitDay · smart schedule & todos
        </div>
      </div>
    ),
    { ...size },
  )
}
