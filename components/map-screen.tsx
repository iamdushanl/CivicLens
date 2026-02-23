"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { MapPin, List, Navigation, Filter } from "lucide-react"
import { getCategoryIcon } from "@/lib/category-helpers"
import type { Issue } from "@/lib/types"
import { getIssues } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { IssueCard } from "@/components/issue-card"

const LeafletIssuesMap = dynamic(
  () => import("@/components/leaflet-issues-map").then((mod) => mod.LeafletIssuesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
)

const COLOMBO_CENTER: [number, number] = [6.9271, 79.8612]

function distKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLon = ((b[1] - a[1]) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function MapScreen() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [allIssues, setAllIssues] = useState<Issue[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>(COLOMBO_CENTER)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)

  /* SCF: Map / List toggle at top center exactly like screenshot */
  const [view, setView] = useState<"map" | "list">("map")

  useEffect(() => {
    let active = true
    getIssues({ sort: "upvotes" }).then((result) => { if (active) setAllIssues(result) })
    return () => { active = false }
  }, [])

  const nearbyIssues = useMemo(() => {
    if (!userLocation) return allIssues.slice(0, 8)
    return [...allIssues]
      .filter((i) => i.coordinates)
      .sort((a, b) => {
        const aC: [number, number] = [a.coordinates!.lat, a.coordinates!.lng]
        const bC: [number, number] = [b.coordinates!.lat, b.coordinates!.lng]
        return distKm(userLocation, aC) - distKm(userLocation, bC)
      })
      .slice(0, 8)
  }, [allIssues, userLocation])

  const handleNearMe = () => {
    if (!navigator.geolocation || locating) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(c); setMapCenter(c); setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  const handleIssueClick = (issueId: string) => router.push(`/${language}/issue/${issueId}`)

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* SCF-style top strip: Map / List toggle LEFT + Filter button RIGHT */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-background border-b border-border gap-3">
        {/* Map/List toggle — the most recognizable SCF UI element */}
        <div className="scf-toggle">
          <button
            onClick={() => setView("map")}
            className={cn("scf-toggle-btn flex items-center gap-1.5", view === "map" && "active")}
          >
            <MapPin className="h-3.5 w-3.5" />
            Map
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("scf-toggle-btn flex items-center gap-1.5", view === "list" && "active")}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>

        {/* Near Me + Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNearMe}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Navigation className={cn("h-3.5 w-3.5", locating && "animate-spin")} />
            {locating ? "Locating…" : "Near Me"}
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "map" ? (
        /* Full-bleed map — SCF style */
        <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 130px)" }}>
          <LeafletIssuesMap
            issues={allIssues}
            center={mapCenter}
            userLocation={userLocation}
            onSelectIssue={(id) => {
              const found = allIssues.find((i) => i.id === id)
              if (found?.coordinates) setMapCenter([found.coordinates.lat, found.coordinates.lng])
            }}
          />
        </div>
      ) : (
        /* List view — same SCF issue list */
        <div className="flex-1 divide-y divide-border">
          {nearbyIssues.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              No issues found
            </div>
          ) : (
            nearbyIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onClick={() => handleIssueClick(issue.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
