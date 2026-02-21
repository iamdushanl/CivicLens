"use client"

import { useLanguage } from "@/lib/language-context"
import type { Issue } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageCircle, MapPin, Clock, User } from "lucide-react"
import { getCategoryIcon, getSeverityColor, getStatusColor, getTimeAgo } from "@/lib/category-helpers"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface IssueCardProps {
  issue: Issue
  onClick?: () => void
}

export function IssueCard({ issue, onClick }: IssueCardProps) {
  const { t } = useLanguage()
  const [upvotes, setUpvotes] = useState(issue.upvotes)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const CategoryIcon = getCategoryIcon(issue.category)

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasUpvoted) {
      setUpvotes((prev) => prev + 1)
      setHasUpvoted(true)
    } else {
      setUpvotes((prev) => prev - 1)
      setHasUpvoted(false)
    }
  }

  const statusLabel =
    issue.status === "open"
      ? t("open")
      : issue.status === "in-progress"
        ? t("inProgress")
        : t("resolved")

  const severityLabel =
    issue.severity === "low"
      ? t("low")
      : issue.severity === "medium"
        ? t("medium")
        : issue.severity === "high"
          ? t("high")
          : t("critical")

  return (
    <article
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {/* Top row: Category + Severity */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <CategoryIcon className="h-4 w-4 text-primary" />
          </div>
          <Badge className={cn("text-[10px] font-semibold", getSeverityColor(issue.severity))}>
            {severityLabel}
          </Badge>
        </div>
        <Badge className={cn("text-[10px] font-medium", getStatusColor(issue.status))}>
          {statusLabel}
        </Badge>
      </div>

      {/* Title + Description */}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1 text-balance">
          {issue.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {issue.description}
        </p>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{issue.location}</span>
      </div>

      {/* Bottom row: Actions + Meta */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-4">
          {/* Upvote */}
          <button
            onClick={handleUpvote}
            className={cn(
              "flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
              hasUpvoted
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
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
          {/* Reporter */}
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {issue.isAnonymous ? t("anonymous") : issue.reporter}
          </div>
          {/* Time */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getTimeAgo(issue.createdAt)}
          </div>
        </div>
      </div>
    </article>
  )
}
