"use client"

import { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { StatsBanner } from "./stats-banner"
import { IssueCard } from "./issue-card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Issue, IssueStatus, IssueCategory } from "@/lib/types"
import { ChevronDown, Filter } from "lucide-react"
import { getIssues } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardScreenProps {
  onIssueClick: (issue: Issue) => void
}

export function DashboardScreen({ onIssueClick }: DashboardScreenProps) {
  const { t } = useLanguage()
  const [statusFilter, setStatusFilter] = useState<"all" | IssueStatus>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | IssueCategory>("all")
  const [sortBy, setSortBy] = useState<"upvotes" | "recent" | "near">("upvotes")
  const [sortOpen, setSortOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    const loadIssues = async () => {
      const result = await getIssues()
      if (active) {
        setIssues(result)
        setLoading(false)
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

    if (categoryFilter !== "all") {
      nextIssues = nextIssues.filter((i) => i.category === categoryFilter)
    }

    if (sortBy === "upvotes") {
      nextIssues.sort((a, b) => b.upvotes - a.upvotes)
    } else if (sortBy === "recent") {
      nextIssues.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    return nextIssues
  }, [issues, statusFilter, categoryFilter, sortBy])

  const sortLabel =
    sortBy === "upvotes"
      ? t("mostUpvoted")
      : sortBy === "recent"
        ? t("mostRecent")
        : t("nearMe")

  const categoryLabel = categoryFilter === "all" ? t("all") : t(categoryFilter)

  const categories: Array<"all" | IssueCategory> = [
    "all",
    "potholes",
    "streetLights",
    "garbage",
    "waterSupply",
    "roadDamage",
    "drainage",
    "publicSafety",
    "other",
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-2">
        <h1 className="page-title">{t("dashboard.title")}</h1>
        <p className="page-subtitle">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stats */}
      <StatsBanner />

      {/* Issues Section */}
      <section className="section-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">
            {t("dashboard.filters")}
          </h2>

          {/* Filter controls */}
          <div className="flex gap-2">
            {/* Category Filter */}
            <div className="relative">
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                aria-label={`${t("category")}: ${categoryLabel}`}
              >
                <Filter className="h-3 w-3" />
                {categoryLabel}
                <ChevronDown className="h-3 w-3" />
              </button>
              {categoryOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCategoryOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 max-h-[300px] min-w-[160px] overflow-hidden overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setCategoryFilter(cat)
                          setCategoryOpen(false)
                        }}
                        className={`flex w-full px-3 py-2 text-xs font-medium transition-colors text-left ${
                          categoryFilter === cat
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent"
                        }`}
                      >
                        {cat === "all" ? t("all") : t(cat)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                aria-label={`${t("sort")}: ${sortLabel}`}
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
        </div>

        {/* Filter Tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as "all" | IssueStatus)}
          className="mt-3"
        >
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              {t("all")}
            </TabsTrigger>
            <TabsTrigger value="open" className="text-xs">
              {t("open")}
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs">
              {t("inProgress")}
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">
              {t("resolved")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-4">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-5 w-14" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredIssues.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onClick={() => onIssueClick(issue)}
                  />
                ))}
              </div>
            ) : (
              <div className="col-span-full flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <p className="text-sm font-medium">{t("noIssuesFound")}</p>
                <p className="text-xs">
                  {statusFilter !== "all" || categoryFilter !== "all"
                    ? t("filter")
                    : ""}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
