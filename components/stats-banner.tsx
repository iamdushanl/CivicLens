"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { FileText, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"
import { getStats } from "@/lib/api-client"

/* SeeClickFix stats: horizontal scrollable row of clean white bordered cards */
const statConfig = [
  { key: "totalReports", icon: FileText, color: "#1EADE3", label: "Total Reports" },
  { key: "resolvedThisWeek", icon: CheckCircle2, color: "#4CAF50", label: "Resolved" },
  { key: "activeIssues", icon: AlertCircle, color: "#F7941D", label: "Active" },
  { key: "topCategory", icon: TrendingUp, color: "#9C27B0", label: "Top Issue" },
]

const defaultValues = ["1,247", "38", "156", "Potholes"]

export function StatsBanner() {
  const { t } = useLanguage()
  const [values, setValues] = useState(defaultValues)

  useEffect(() => {
    let active = true
    getStats().then((result) => {
      if (!active) return
      setValues([
        String(result.totalReports),
        String(result.resolvedThisWeek),
        String(result.activeIssues),
        t(result.topCategory) !== result.topCategory ? t(result.topCategory) : result.topCategory,
      ])
    })
    return () => { active = false }
  }, [t])

  return (
    <div className="flex overflow-x-auto gap-3 px-4 py-3 bg-background border-b border-border scrollbar-none">
      {statConfig.map((stat, i) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-white dark:bg-card px-4 py-3 flex-shrink-0 min-w-[90px]"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: stat.color + "18", color: stat.color }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-foreground leading-none">{values[i]}</p>
            <p className="text-[10px] text-muted-foreground text-center leading-tight">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}
