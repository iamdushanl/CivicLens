"use client"

import { useLanguage } from "@/lib/language-context"
import type { Issue } from "@/lib/types"
import { Heart, MessageCircle, MapPin, Clock } from "lucide-react"
import { getCategoryIcon, getTimeAgo } from "@/lib/category-helpers"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface IssueCardProps {
  issue: Issue
  onClick?: () => void
}

/* SeeClickFix exact status badge styles */
function StatusBadge({ status }: { status: string }) {
  if (status === "resolved") return <span className="scf-status-resolved">Resolved</span>
  if (status === "in-progress") return <span className="scf-status-acknowledged">Acknowledged</span>
  return <span className="scf-status-open">Open</span>
}

/* Category → background color for icon circle */
const categoryColors: Record<string, string> = {
  potholes: "#E65100",
  streetLights: "#F57F17",
  garbage: "#2E7D32",
  waterSupply: "#0277BD",
  roadDamage: "#C62828",
  drainage: "#1565C0",
  publicSafety: "#6A1B9A",
  other: "#546E7A",
}

export function IssueCard({ issue, onClick }: IssueCardProps) {
  const { t } = useLanguage()
  const [upvotes, setUpvotes] = useState(issue.upvotes)
  const [liked, setLiked] = useState(false)
  const CategoryIcon = getCategoryIcon(issue.category)
  const iconBg = categoryColors[issue.category] || "#1EADE3"

  const handleHeart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked((v) => !v)
    setUpvotes((n) => liked ? n - 1 : n + 1)
  }

  return (
    <article
      onClick={onClick}
      className="scf-card-hover flex items-start gap-3 px-4 py-3.5 cursor-pointer animate-fade-in"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {/* Category icon circle — SCF style */}
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
        style={{ width: 42, height: 42, background: iconBg }}
      >
        <CategoryIcon className="h-5 w-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1 flex-1">
            {issue.title}
          </h3>
          <StatusBadge status={issue.status} />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{issue.location}</span>
        </div>

        {/* Description preview */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 mt-0.5">
          {issue.description}
        </p>

        {/* Bottom row: heart + comments + time */}
        <div className="flex items-center gap-4 mt-2">
          {/* Heart/upvote — SCF uses ♡ not thumbs */}
          <button
            onClick={handleHeart}
            className={cn("scf-heart", liked && "active")}
            aria-label={`Like. Count: ${upvotes}`}
          >
            <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
            <span>{upvotes}</span>
          </button>

          {/* Comments */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{issue.commentCount}</span>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Clock className="h-3 w-3" />
            <span>{getTimeAgo(issue.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
