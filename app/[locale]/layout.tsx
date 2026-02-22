"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { TopNavbar } from "@/components/top-navbar"
import { BottomNav } from "@/components/bottom-nav"

interface LocaleLayoutProps {
  children: ReactNode
  params: {
    locale: string
  }
}

export default function LocaleLayout({ children }: LocaleLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const localeMatch = pathname.match(/^\/([^/]+)/)
  const locale = localeMatch?.[1] || "en"

  const handleNavigate = (tab: string) => {
    const routeMap: Record<string, string> = {
      home: `/${locale}`,
      report: `/${locale}/report`,
      map: `/${locale}/map`,
      contacts: `/${locale}/contacts`,
      menu: `/${locale}/resolved`,
      resolved: `/${locale}/resolved`,
      priority: `/${locale}`,
      about: `/${locale}`,
    }

    router.push(routeMap[tab] || `/${locale}`)
  }

  const getActiveTab = () => {
    if (pathname.includes("/report")) return "report"
    if (pathname.includes("/map")) return "map"
    if (pathname.includes("/contacts")) return "contacts"
    if (pathname.includes("/resolved")) return "menu"
    return "home"
  }

  return (
    <div className="app-frame">
      <TopNavbar onNavigate={handleNavigate} />
      <main className="page-shell pb-24">{children}</main>
      <BottomNav activeTab={getActiveTab()} onTabChange={handleNavigate} />
    </div>
  )
}

