"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import {
  CheckCircle2,
  MapPin,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Users,
  User,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react"
import { getCategoryIcon } from "@/lib/category-helpers"
import type { Issue } from "@/lib/types"
import { getIssues } from "@/lib/api-client"
import { cn } from "@/lib/utils"

const categoryGradients: Record<string, string> = {
  potholes: "from-orange-500 to-amber-500",
  streetLights: "from-yellow-500 to-amber-400",
  garbage: "from-lime-500 to-green-500",
  waterSupply: "from-sky-500 to-cyan-500",
  roadDamage: "from-rose-500 to-red-500",
  drainage: "from-blue-500 to-indigo-500",
  publicSafety: "from-violet-500 to-purple-500",
  other: "from-slate-500 to-gray-500",
}

export function ResolvedIssuesScreen() {
  const { t } = useLanguage()
  const [resolvedIssues, setResolvedIssues] = useState<Issue[]>([])

  useEffect(() => {
    let active = true
    const loadResolved = async () => {
      const issues = await getIssues({ status: "resolved", sort: "recent" })
      if (active) setResolvedIssues(issues)
    }
    loadResolved()
    return () => { active = false }
  }, [])

  const getResolvedByIcon = (resolvedBy?: string) => {
    switch (resolvedBy) {
      case "community": return Users
      case "reporter": return User
      case "official": return ShieldCheck
      default: return CheckCircle2
    }
  }

  const getResolvedByLabel = (resolvedBy?: string) => {
    switch (resolvedBy) {
      case "community": return t("resolved.communityConfirmed")
      case "reporter": return t("resolved.reporterConfirmed")
      case "official": return t("resolved.official")
      default: return t("dashboard.resolved")
    }
  }

  const getResolvedByGradient = (resolvedBy?: string) => {
    switch (resolvedBy) {
      case "community": return "from-violet-500 to-indigo-500"
      case "reporter": return "from-sky-500 to-cyan-500"
      case "official": return "from-emerald-500 to-teal-500"
      default: return "from-emerald-500 to-green-500"
    }
  }

  return (
    <div className="flex flex-col gap-6 page-shell">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 p-6 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-emerald-300/20 blur-xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Trophy className="h-7 w-7 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("resolved.title")}</h1>
            <p className="mt-1 text-sm text-white/75">
              <span className="font-bold text-white">{resolvedIssues.length}</span> {t("resolved.subtitle")}
            </p>
            <div className="mt-2 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold backdrop-blur-sm w-fit">
              <Sparkles className="h-3 w-3 text-yellow-300" />
              Community Impact
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {resolvedIssues.map((issue, i) => {
          const CategoryIcon = getCategoryIcon(issue.category)
          const ResolvedIcon = getResolvedByIcon(issue.resolvedBy)
          const gradient = categoryGradients[issue.category] || "from-emerald-500 to-teal-500"
          const resolvedGradient = getResolvedByGradient(issue.resolvedBy)

          return (
            <article
              key={issue.id}
              className={cn(
                "section-card-hover flex flex-col gap-0 overflow-hidden animate-fade-in",
                i < 4 ? `stagger-${(i % 4 + 1) as 1 | 2 | 3 | 4}` : ""
              )}
            >
              {/* Gradient Strip */}
              <div className={cn("h-1.5 w-full bg-gradient-to-r", gradient)} />

              <div className="relative flex flex-col gap-3 p-4">
                {/* Celebration blob */}
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

                {/* Category + Resolved badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                      gradient
                    )}>
                      <CategoryIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t("dashboard.resolved")}
                    </span>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>

                {/* Title + Description */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {issue.location}
                </div>

                {/* Resolution info */}
                <div className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 bg-gradient-to-r",
                  resolvedGradient.replace("from-", "from-").replace("to-", "to-"),
                  resolvedGradient.split(" ").map(c => c.replace("from-", "from-").replace("to-", "to-") + "/10").join(" ")
                )}>
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br",
                    resolvedGradient
                  )}>
                    <ResolvedIcon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {getResolvedByLabel(issue.resolvedBy)}
                  </span>
                </div>

                {/* Resolution date */}
                {issue.resolvedAt && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {t("resolved.resolvedOn")}{" "}
                    {new Date(issue.resolvedAt).toLocaleDateString("en-LK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                )}

                {/* Before/After */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-muted/60">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <div className="text-lg">📷</div>
                      <span className="text-[9px] font-semibold">{t("resolved.beforeAfter").split(" ")[0]}</span>
                    </div>
                  </div>
                  <div className={cn(
                    "flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br",
                    resolvedGradient.split(" ").map(c => c + "/10").join(" ")
                  )}>
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">{t("resolved.beforeAfter").split(" ")[2] ?? "After"}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {issue.upvotes}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {issue.commentCount}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
