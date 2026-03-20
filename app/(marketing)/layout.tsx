import { PublicMarketingFooter, PublicMarketingNav } from "@/components/public-marketing-nav"

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicMarketingNav />
      <div className="flex flex-1 flex-col">{children}</div>
      <PublicMarketingFooter />
    </div>
  )
}
