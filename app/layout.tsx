import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aifitday.app"),
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
    canonical: "/",
  },
  openGraph: {
    title: "AIFitDay | 에이핏데이",
    description:
      "실시간 날씨 정보와 AI를 활용하여 스마트하게 나의 일정을 관리해주는 서비스",
    siteName: "AIFitDay",
    locale: "ko_KR",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AIFitDay 대표 썸네일",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIFitDay | 에이핏데이",
    description:
      "실시간 날씨 정보와 AI를 활용하여 스마트하게 나의 일정을 관리해주는 서비스",
    images: ["/og-image.svg"],
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
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
