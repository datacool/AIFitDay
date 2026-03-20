import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import "./globals.css";

const gaMeasurementId = "G-8QRJ4TW4BL";

/** Google AdSense 게시자 ID (adsbygoogle.js client 파라미터) */
const adsenseClientId = "ca-pub-5499985827015012";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-fit-day.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AIFitDay",
    template: "%s | AIFitDay",
  },
  applicationName: "에이핏데이",
  description:
    "실시간 날씨 정보와 AI를 활용하여 스마트하게 나의 일정을 관리해주는 서비스",
  keywords: [
    "AIFitDay",
    "에이핏데이",
    "AI 일정 관리",
    "날씨 기반 할일",
    "Todo",
    "스마트 플래너",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "AIFitDay | 에이핏데이",
    description:
      "실시간 날씨 정보와 AI를 활용하여 스마트하게 나의 일정을 관리해주는 서비스",
    siteName: "AIFitDay",
    locale: "ko_KR",
    type: "website",
    url: "/about",
    // PNG는 app/opengraph-image.tsx가 생성(카카오 등 SVG og:image 미지원 대응)
  },
  twitter: {
    card: "summary_large_image",
    title: "AIFitDay | 에이핏데이",
    description:
      "실시간 날씨 정보와 AI를 활용하여 스마트하게 나의 일정을 관리해주는 서비스",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {isProduction ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
            <Script
              id="google-adsense"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
              strategy="afterInteractive"
              crossOrigin="anonymous"
            />
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
