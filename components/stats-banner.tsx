"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { FileText, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"
import { getStats } from "@/lib/api-client"

const stats = [
  { key: "totalReports", value: "1,247", icon: FileText },
  { key: "resolvedThisWeek", value: "38", icon: CheckCircle2 },
  { key: "activeIssues", value: "156", icon: AlertCircle },
  { key: "topCategory", value: "Potholes", icon: TrendingUp },
]

export function StatsBanner() {
  const { t } = useLanguage()
  const [values, setValues] = useState(stats)

  useEffect(() => {
    let active = true

    const loadStats = async () => {
      const result = await getStats()
      if (!active) return

      setValues([
        { key: "totalReports", value: String(result.totalReports), icon: FileText },
        { key: "resolvedThisWeek", value: String(result.resolvedThisWeek), icon: CheckCircle2 },
        { key: "activeIssues", value: String(result.activeIssues), icon: AlertCircle },
        {
          key: "topCategory",
          value: t(result.topCategory) === result.topCategory ? result.topCategory : t(result.topCategory),
          icon: TrendingUp,
        },
      ])
    }

    loadStats()

    return () => {
      active = false
    }
  }, [t])

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {values.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs font-medium text-muted-foreground">{t(stat.key)}</p>
          </div>
        )
      })}
    </div>
  )
}
