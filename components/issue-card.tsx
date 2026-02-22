"use client"

import { useLanguage } from "@/lib/language-context"
import type { Issue } from "@/lib/types"
import { ThumbsUp, MessageCircle, MapPin, Clock, User, ArrowRight } from "lucide-react"
import { getCategoryIcon, getTimeAgo } from "@/lib/category-helpers"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface IssueCardProps {
  issue: Issue
  onClick?: () => void
}

const severityConfig = {
  low: { label: "low", bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400", dot: "bg-sky-500" },
  medium: { label: "medium", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  high: { label: "high", bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  critical: { label: "critical", bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
}

const statusConfig = {
  open: { bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400", dot: "bg-violet-500", pulse: true },
  "in-progress": { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500", pulse: false },
  resolved: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", pulse: false },
}

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

export function IssueCard({ issue, onClick }: IssueCardProps) {
  const { t } = useLanguage()
  const [upvotes, setUpvotes] = useState(issue.upvotes)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const CategoryIcon = getCategoryIcon(issue.category)
  const gradient = categoryGradients[issue.category] || "from-violet-500 to-indigo-500"

  const sev = severityConfig[issue.severity] || severityConfig.medium
  const stat = statusConfig[issue.status] || statusConfig.open

  const statusLabel =
    issue.status === "open" ? t("open")
      : issue.status === "in-progress" ? t("inProgress")
        : t("resolved")

  const severityLabel =
    issue.severity === "low" ? t("low")
      : issue.severity === "medium" ? t("medium")
        : issue.severity === "high" ? t("high")
          : t("critical")

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasUpvoted) {
      setUpvotes((p) => p + 1)
      setHasUpvoted(true)
    } else {
      setUpvotes((p) => p - 1)
      setHasUpvoted(false)
    }
  }

  return (
    <article
      onClick={onClick}
      className="group section-card-hover flex cursor-pointer flex-col gap-0 overflow-hidden"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {/* Gradient header strip */}
      <div className={cn("h-1.5 w-full bg-gradient-to-r", gradient)} />

      <div className="flex flex-col gap-3 p-4">
        {/* Top row: Category icon + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
              gradient
            )}>
              <CategoryIcon className="h-5 w-5 text-white" />
            </div>
            {/* Severity badge */}
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
              sev.bg
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", sev.dot)} />
              {severityLabel}
            </span>
          </div>

          {/* Status badge */}
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold flex-shrink-0",
            stat.bg
          )}>
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              stat.dot,
              stat.pulse && "animate-pulse"
            )} />
            {statusLabel}
          </span>
        </div>

        {/* Title + Description */}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
            {issue.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {issue.description}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{issue.location}</span>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-3">
            {/* Upvote */}
            <button
              onClick={handleUpvote}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200",
                hasUpvoted
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-label={`Upvote. Current count: ${upvotes}`}
            >
              <ThumbsUp className={cn("h-3.5 w-3.5", hasUpvoted && "fill-current")} />
              {upvotes}
            </button>

            {/* Comments */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              {issue.commentCount}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {issue.isAnonymous ? t("anonymous") : issue.reporter}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeAgo(issue.createdAt)}
            </div>
          </div>
        </div>

        {/* View detail affordance */}
        <div className="flex items-center gap-1 text-[10px] font-semibold text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity -mt-1">
          View details <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </article>
  )
}
