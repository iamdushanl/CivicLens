"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { FileText, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"
import { getStats } from "@/lib/api-client"

/* SeeClickFix stats: horizontal scrollable row of clean white bordered cards */
const statConfig = [
  { key: "totalReports", icon: FileText, color: "#1A73E8", label: "Total Reports" },
  { key: "resolvedThisWeek", icon: CheckCircle2, color: "#34A853", label: "Resolved" },
  { key: "activeIssues", icon: AlertCircle, color: "#F5A623", label: "Active" },
  { key: "topCategory", icon: TrendingUp, color: "#9C27B0", label: "Top Issue" },
]

const CATEGORY_NAMES: Record<string, string> = {
  potholes: "Potholes",
  streetLights: "Street Lights",
  garbage: "Garbage",
  waterSupply: "Water Supply",
  roadDamage: "Road Damage",
  drainage: "Drainage",
  publicSafety: "Public Safety",
  other: "Other",
}

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
        CATEGORY_NAMES[result.topCategory] ?? result.topCategory,
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
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 flex-shrink-0 min-w-[90px]"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full mb-1"
              style={{ background: stat.color + "22", color: stat.color }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xl font-black text-foreground leading-none">{values[i]}</p>
            <p className="text-[10px] font-bold text-muted-foreground text-center leading-tight uppercase tracking-wider">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}
