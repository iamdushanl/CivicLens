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

/* SeeClickFix exact status text — plain text on list, NOT pill badges */
function StatusText({ status }: { status: string }) {
  if (status === "resolved")
    return <span className="text-xs font-semibold" style={{ color: "#34A853" }}>Resolved</span>
  if (status === "in-progress")
    return <span className="text-xs font-semibold" style={{ color: "#34A853" }}>Acknowledged</span>
  return <span className="text-xs font-semibold text-muted-foreground">Open</span>
}

/* Category → exact SCF app icon background colors */
const categoryColors: Record<string, string> = {
  potholes: "#F4511E",  /* deep orange — road damage */
  streetLights: "#F5A623",  /* amber — lights */
  garbage: "#34A853",  /* green — environment */
  waterSupply: "#00AEDF",  /* cyan — water */
  roadDamage: "#EA4335",  /* red — road */
  drainage: "#1A73E8",  /* blue — drainage */
  publicSafety: "#9C27B0",  /* purple — safety */
  other: "#78909C",  /* blue-grey */
}

export function IssueCard({ issue, onClick }: IssueCardProps) {
  const { t } = useLanguage()
  const [upvotes, setUpvotes] = useState(issue.upvotes)
  const [liked, setLiked] = useState(false)
  const CategoryIcon = getCategoryIcon(issue.category)
  const iconBg = categoryColors[issue.category] || "#00AEDF"

  const handleHeart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked((v) => !v)
    setUpvotes((n) => liked ? n - 1 : n + 1)
  }

  return (
    <article
      onClick={onClick}
      className="flex items-start gap-3 px-4 py-3.5 bg-white cursor-pointer border-b border-border transition-colors hover:bg-muted/40 animate-fade-in"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {/* Category icon circle — exact SCF style with category-specific color */}
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
        style={{ width: 42, height: 42, background: iconBg }}
      >
        <CategoryIcon className="h-5 w-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row with status right-aligned */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1 flex-1">
            {issue.title}
          </h3>
          <StatusText status={issue.status} />
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
          {/* Heart/upvote */}
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
