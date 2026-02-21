"use client"

import { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { StatsBanner } from "./stats-banner"
import { IssueCard } from "./issue-card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Issue, IssueStatus } from "@/lib/types"
import { ChevronDown } from "lucide-react"
import { getIssues } from "@/lib/api-client"

interface DashboardScreenProps {
  onIssueClick: (issue: Issue) => void
}

export function DashboardScreen({ onIssueClick }: DashboardScreenProps) {
  const { t } = useLanguage()
  const [statusFilter, setStatusFilter] = useState<"all" | IssueStatus>("all")
  const [sortBy, setSortBy] = useState<"upvotes" | "recent" | "near">("upvotes")
  const [sortOpen, setSortOpen] = useState(false)
  const [issues, setIssues] = useState<Issue[]>([])

  useEffect(() => {
    let active = true

    const loadIssues = async () => {
      const result = await getIssues()
      if (active) {
        setIssues(result)
      }
    }

    loadIssues()

    return () => {
      active = false
    }
  }, [])

  const filteredIssues = useMemo(() => {
    let nextIssues = [...issues]

    if (statusFilter !== "all") {
      nextIssues = nextIssues.filter((i) => i.status === statusFilter)
    }

    if (sortBy === "upvotes") {
      nextIssues.sort((a, b) => b.upvotes - a.upvotes)
    } else if (sortBy === "recent") {
      nextIssues.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    return nextIssues
  }, [issues, statusFilter, sortBy])

  const sortLabel =
    sortBy === "upvotes"
      ? t("mostUpvoted")
      : sortBy === "recent"
        ? t("mostRecent")
        : t("nearMe")

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Stats */}
      <StatsBanner />

      {/* Priority Issues Section */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground text-balance">
            {t("topPriorityIssues")}
          </h2>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              {sortLabel}
              <ChevronDown className="h-3 w-3" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  {(["upvotes", "recent", "near"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option)
                        setSortOpen(false)
                      }}
                      className={`flex w-full px-3 py-2 text-xs font-medium transition-colors ${
                        sortBy === option
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      {option === "upvotes"
                        ? t("mostUpvoted")
                        : option === "recent"
                          ? t("mostRecent")
                          : t("nearMe")}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as "all" | IssueStatus)}
          className="mt-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">
              {t("all")}
            </TabsTrigger>
            <TabsTrigger value="open" className="flex-1 text-xs">
              {t("open")}
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="flex-1 text-xs">
              {t("inProgress")}
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex-1 text-xs">
              {t("resolved")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onClick={() => onIssueClick(issue)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <p className="text-sm font-medium">{t("noIssuesFound")}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
