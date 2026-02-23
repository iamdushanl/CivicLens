"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useLanguage } from "@/lib/language-context"
import { StatsBanner } from "./stats-banner"
import { IssueCard } from "./issue-card"
import type { Issue, IssueStatus, IssueCategory } from "@/lib/types"
import { ChevronDown, Filter, Search, X, MapPin, Loader2 } from "lucide-react"
import { getIssues } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface DashboardScreenProps {
  onIssueClick: (issue: Issue) => void
}

const STATUS_TABS: Array<{ value: "all" | IssueStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
]

const CATEGORIES: Array<"all" | IssueCategory> = [
  "all", "potholes", "streetLights", "garbage",
  "waterSupply", "roadDamage", "drainage", "publicSafety", "other",
]
const CATEGORY_LABELS: Record<string, string> = {
  all: "All Categories", potholes: "Potholes", streetLights: "Street Lights",
  garbage: "Garbage", waterSupply: "Water Supply", roadDamage: "Road Damage",
  drainage: "Drainage", publicSafety: "Public Safety", other: "Other",
}
const SORT_OPTIONS = [
  { value: "upvotes", label: "Most Voted" },
  { value: "recent", label: "Most Recent" },
  { value: "near", label: "Near Me" },
] as const

export function DashboardScreen({ onIssueClick }: DashboardScreenProps) {
  const { t } = useLanguage()
  const [statusFilter, setStatusFilter] = useState<"all" | IssueStatus>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | IssueCategory>("all")
  const [sortBy, setSortBy] = useState<"upvotes" | "recent" | "near">("recent")
  const [sortOpen, setSortOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    getIssues().then((result) => { if (active) { setIssues(result); setLoading(false) } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (sortBy === "near" && !userCoords && !locating) {
      setLocating(true)
      navigator.geolocation?.getCurrentPosition(
        (pos) => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
        () => { setLocating(false) }
      )
    }
  }, [sortBy, userCoords, locating])

  const filteredIssues = useMemo(() => {
    let next = [...issues]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      next = next.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.location.toLowerCase().includes(q))
    }
    if (statusFilter !== "all") next = next.filter((i) => i.status === statusFilter)
    if (categoryFilter !== "all") next = next.filter((i) => i.category === categoryFilter)
    if (sortBy === "upvotes") next.sort((a, b) => b.upvotes - a.upvotes)
    else if (sortBy === "recent") next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else if (sortBy === "near" && userCoords) {
      next.sort((a, b) => {
        const dA = a.coordinates ? haversineKm(userCoords.lat, userCoords.lng, a.coordinates.lat, a.coordinates.lng) : 999
        const dB = b.coordinates ? haversineKm(userCoords.lat, userCoords.lng, b.coordinates.lat, b.coordinates.lng) : 999
        return dA - dB
      })
    }
    return next
  }, [issues, statusFilter, categoryFilter, sortBy, searchQuery, userCoords])

  return (
    <div className="flex flex-col bg-background min-h-screen">

      {/* ── SCF-style Search Bar (below header) ── */}
      <div className="bg-background border-b border-border px-4 py-3">
        <div className={cn(
          "flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2.5 transition-all",
          searchFocused ? "border-primary ring-1 ring-primary/20 bg-white dark:bg-card" : "border-border"
        )}>
          <Search className={cn("h-4 w-4 flex-shrink-0", searchFocused ? "text-primary" : "text-muted-foreground")} />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search issues…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); searchRef.current?.focus() }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Banner ── */}
      <StatsBanner />

      {/* ── SCF Filter Strip: status tabs + filter/sort buttons ── */}
      <div className="bg-background border-b border-border">
        {/* Status tabs — horizontal scroll, SCF exact style */}
        <div className="flex overflow-x-auto px-4 gap-0 border-b border-border scrollbar-none">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                statusFilter === tab.value
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter + Sort row */}
        <div className="flex items-center justify-between px-4 py-2.5 gap-3">
          {/* Result count */}
          <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
            {loading ? "Loading…" : `${filteredIssues.length} issue${filteredIssues.length !== 1 ? "s" : ""}`}
          </span>

          <div className="flex items-center gap-2">
            {/* Category filter */}
            <div className="relative">
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  categoryFilter !== "all"
                    ? "bg-primary border-primary text-white"
                    : "border-border text-foreground bg-white dark:bg-card hover:border-primary/50"
                )}
              >
                <Filter className="h-3 w-3" />
                {CATEGORY_LABELS[categoryFilter]}
                <ChevronDown className={cn("h-3 w-3 transition-transform", categoryOpen && "rotate-180")} />
              </button>
              {categoryOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCategoryOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1.5 max-h-[260px] min-w-[160px] overflow-y-auto rounded-lg border border-border bg-card shadow-lg animate-fade-in">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setCategoryFilter(cat); setCategoryOpen(false) }}
                        className={cn(
                          "flex w-full items-center px-3.5 py-2.5 text-sm transition-colors",
                          categoryFilter === cat
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        {CATEGORY_LABELS[cat]}
                        {categoryFilter === cat && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  "border-border text-foreground bg-white dark:bg-card hover:border-primary/50"
                )}
              >
                {locating && <Loader2 className="h-3 w-3 animate-spin" />}
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort"}
                <ChevronDown className={cn("h-3 w-3 transition-transform", sortOpen && "rotate-180")} />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] rounded-lg border border-border bg-card shadow-lg animate-fade-in">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                        className={cn(
                          "flex w-full items-center gap-2 px-3.5 py-2.5 text-sm transition-colors",
                          sortBy === opt.value
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        {opt.value === "near" && <MapPin className="h-3.5 w-3.5" />}
                        {opt.label}
                        {sortBy === opt.value && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Issue List — SCF vertical list style ── */}
      <div className="flex-1 divide-y divide-border">
        {loading ? (
          /* Skeleton loading — SCF list style */
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3.5">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))
        ) : filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick(issue)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-4 py-20 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              {searchQuery
                ? <Search className="h-7 w-7 text-muted-foreground" />
                : <Filter className="h-7 w-7 text-muted-foreground" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {searchQuery ? `No results for "${searchQuery}"` : "No issues found"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term." : "Be the first to report an issue!"}
              </p>
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
