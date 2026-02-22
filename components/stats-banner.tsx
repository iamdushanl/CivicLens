"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { FileText, CheckCircle2, AlertCircle, TrendingUp, ArrowUpRight } from "lucide-react"
import { getStats } from "@/lib/api-client"
import { cn } from "@/lib/utils"

const statConfig = [
  {
    key: "totalReports",
    icon: FileText,
    gradient: "from-violet-500 to-indigo-500",
    bgGradient: "from-violet-500/10 to-indigo-500/5",
    ringColor: "ring-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    trend: "+12%",
    trendUp: true,
  },
  {
    key: "resolvedThisWeek",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/5",
    ringColor: "ring-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    trend: "+8%",
    trendUp: true,
  },
  {
    key: "activeIssues",
    icon: AlertCircle,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500/10 to-orange-500/5",
    ringColor: "ring-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    trend: "-3%",
    trendUp: false,
  },
  {
    key: "topCategory",
    icon: TrendingUp,
    gradient: "from-sky-500 to-cyan-500",
    bgGradient: "from-sky-500/10 to-cyan-500/5",
    ringColor: "ring-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
    trend: "#1",
    trendUp: true,
  },
]

const defaultValues = ["1,247", "38", "156", "Potholes"]

export function StatsBanner() {
  const { t } = useLanguage()
  const [values, setValues] = useState(defaultValues)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    const loadStats = async () => {
      const result = await getStats()
      if (!active) return
      setValues([
        String(result.totalReports),
        String(result.resolvedThisWeek),
        String(result.activeIssues),
        t(result.topCategory) === result.topCategory ? result.topCategory : t(result.topCategory),
      ])
      setLoaded(true)
    }
    loadStats()
    return () => { active = false }
  }, [t])

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {statConfig.map((stat, i) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className={cn(
              "stat-card animate-fade-in",
              `stagger-${i + 1 as 1 | 2 | 3 | 4}`
            )}
          >
            {/* Background gradient blob */}
            <div className={cn("absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-40 bg-gradient-to-br blur-xl", stat.bgGradient)} />

            <div className="relative flex items-center justify-between">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-2",
                stat.gradient,
                stat.ringColor
              )}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className={cn(
                "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                stat.trendUp
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}>
                <ArrowUpRight className={cn("h-2.5 w-2.5", !stat.trendUp && "rotate-180")} />
                {stat.trend}
              </span>
            </div>

            <div className="relative flex flex-col gap-0.5">
              <p className={cn(
                "text-2xl font-bold tracking-tight text-foreground",
                loaded && "animate-number-up"
              )}>
                {values[i]}
              </p>
              <p className="text-xs font-medium text-muted-foreground">{t(stat.key)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
