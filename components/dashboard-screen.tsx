"use client"

import { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { StatsBanner } from "./stats-banner"
import { IssueCard } from "./issue-card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Issue, IssueStatus, IssueCategory } from "@/lib/types"
import { ChevronDown, Filter, Sparkles, TrendingUp } from "lucide-react"
import { getIssues } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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
      if (active) { setIssues(result); setLoading(false) }
    }
    loadIssues()
    return () => { active = false }
  }, [])

  const filteredIssues = useMemo(() => {
    let next = [...issues]
    if (statusFilter !== "all") next = next.filter((i) => i.status === statusFilter)
    if (categoryFilter !== "all") next = next.filter((i) => i.category === categoryFilter)
    if (sortBy === "upvotes") next.sort((a, b) => b.upvotes - a.upvotes)
    else if (sortBy === "recent") next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return next
  }, [issues, statusFilter, categoryFilter, sortBy])

  const sortLabel = sortBy === "upvotes" ? t("mostUpvoted") : sortBy === "recent" ? t("mostRecent") : t("nearMe")
  const categoryLabel = categoryFilter === "all" ? t("all") : t(categoryFilter)

  const categories: Array<"all" | IssueCategory> = [
    "all", "potholes", "streetLights", "garbage", "waterSupply",
    "roadDamage", "drainage", "publicSafety", "other",
  ]

  const tabItems = [
    { value: "all", label: t("all") },
    { value: "open", label: t("open") },
    { value: "in-progress", label: t("inProgress") },
    { value: "resolved", label: t("resolved") },
  ]

  return (
    <div className="flex flex-col gap-6 page-shell">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 text-white">
        {/* Decorative blobs */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-indigo-300/20 blur-xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-yellow-300" />
              AI-Powered
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t("dashboard.title")}</h1>
          <p className="mt-1.5 text-sm text-white/75 leading-relaxed">{t("dashboard.subtitle")}</p>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-white/60">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Community impact tracker for Sri Lanka</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsBanner />

      {/* Issues Section */}
      <section className="section-card overflow-hidden">
        <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">{t("dashboard.filters")}</h2>

            {/* Filter controls */}
            <div className="flex gap-2">
              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200",
                    categoryOpen
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted"
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {categoryLabel}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", categoryOpen && "rotate-180")} />
                </button>
                {categoryOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCategoryOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 max-h-[300px] min-w-[170px] overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl shadow-black/10 animate-fade-in-scale">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { setCategoryFilter(cat); setCategoryOpen(false) }}
                          className={cn(
                            "flex w-full items-center rounded-xl px-3 py-2.5 text-xs font-medium transition-all",
                            categoryFilter === cat
                              ? "bg-gradient-to-r from-violet-500/20 to-indigo-500/10 text-primary font-semibold"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          {cat === "all" ? t("all") : t(cat)}
                          {categoryFilter === cat && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
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
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200",
                    sortOpen
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted"
                  )}
                >
                  {sortLabel}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", sortOpen && "rotate-180")} />
                </button>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 min-w-[150px] rounded-2xl border border-border bg-card p-1.5 shadow-xl shadow-black/10 animate-fade-in-scale">
                      {(["upvotes", "recent", "near"] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => { setSortBy(option); setSortOpen(false) }}
                          className={cn(
                            "flex w-full items-center rounded-xl px-3 py-2.5 text-xs font-medium transition-all",
                            sortBy === option
                              ? "bg-gradient-to-r from-violet-500/20 to-indigo-500/10 text-primary font-semibold"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          {option === "upvotes" ? t("mostUpvoted") : option === "recent" ? t("mostRecent") : t("nearMe")}
                          {sortBy === option && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Filter Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as "all" | IssueStatus)}
          >
            <TabsList className="w-full grid grid-cols-4 rounded-xl bg-muted/60 p-1">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground dark:data-[state=active]:bg-card"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={statusFilter} className="mt-5">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border overflow-hidden">
                      <div className="skeleton-shimmer h-1.5 w-full" />
                      <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredIssues.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onClick={() => onIssueClick(issue)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Filter className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-sm font-semibold text-foreground">{t("noIssuesFound")}</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {statusFilter !== "all" || categoryFilter !== "all" ? t("filter") : "Be the first to report an issue in your community."}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
