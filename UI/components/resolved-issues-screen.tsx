"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  MapPin,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Users,
  User,
  ShieldCheck,
  ImageIcon,
} from "lucide-react"
import { getCategoryIcon } from "@/lib/category-helpers"
import type { Issue } from "@/lib/types"
import { getIssues } from "@/lib/api-client"

export function ResolvedIssuesScreen() {
  const { t } = useLanguage()
  const [resolvedIssues, setResolvedIssues] = useState<Issue[]>([])

  useEffect(() => {
    let active = true

    const loadResolved = async () => {
      const issues = await getIssues({ status: "resolved", sort: "recent" })
      if (active) {
        setResolvedIssues(issues)
      }
    }

    loadResolved()

    return () => {
      active = false
    }
  }, [])

  const getResolvedByIcon = (resolvedBy?: string) => {
    switch (resolvedBy) {
      case "community":
        return Users
      case "reporter":
        return User
      case "official":
        return ShieldCheck
      default:
        return CheckCircle2
    }
  }

  const getResolvedByLabel = (resolvedBy?: string) => {
    switch (resolvedBy) {
      case "community":
        return t("communityConfirmed")
      case "reporter":
        return t("reporterConfirmed")
      case "official":
        return t("officialConfirmation")
      default:
        return t("resolved")
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">{t("resolvedIssues")}</h1>
          <p className="text-xs text-muted-foreground">
            {resolvedIssues.length} issues resolved
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {resolvedIssues.map((issue) => {
          const CategoryIcon = getCategoryIcon(issue.category)
          const ResolvedIcon = getResolvedByIcon(issue.resolvedBy)

          return (
            <article
              key={issue.id}
              className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-primary/20 bg-card p-4 shadow-sm"
            >
              {/* Celebration corner accent */}
              <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-primary/10" />
              <div className="absolute -right-1 -top-1 h-8 w-8 rounded-full bg-primary/20" />

              {/* Category + Resolved badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <CategoryIcon className="h-4 w-4 text-primary" />
                  </div>
                  <Badge className="bg-primary/15 text-primary text-[10px] font-semibold">
                    {t("resolved")}
                  </Badge>
                </div>
                <CheckCircle2 className="h-5 w-5 text-primary" />
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
                <MapPin className="h-3 w-3" />
                {issue.location}
              </div>

              {/* Resolution info */}
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                <ResolvedIcon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {getResolvedByLabel(issue.resolvedBy)}
                </span>
              </div>

              {/* Resolution date */}
              {issue.resolvedAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {t("resolvedOn")}{" "}
                  {new Date(issue.resolvedAt).toLocaleDateString("en-LK", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}

              {/* Before/After placeholder */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex aspect-video items-center justify-center rounded-lg border border-border bg-muted">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Before</span>
                  </div>
                </div>
                <div className="flex aspect-video items-center justify-center rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex flex-col items-center gap-1 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[9px] font-medium">After</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {issue.upvotes}
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {issue.commentCount}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
