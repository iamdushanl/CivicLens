"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { MapPin, Navigation } from "lucide-react"
import { getCategoryIcon, getSeverityColor } from "@/lib/category-helpers"
import { Badge } from "@/components/ui/badge"
import type { Issue } from "@/lib/types"
import { getIssues } from "@/lib/api-client"

const LeafletIssuesMap = dynamic(
  () => import("@/components/leaflet-issues-map").then((module) => module.LeafletIssuesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
        Loading map...
      </div>
    ),
  }
)

const COLOMBO_CENTER: [number, number] = [6.9271, 79.8612]

function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function MapScreen() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [allIssues, setAllIssues] = useState<Issue[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>(COLOMBO_CENTER)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    let active = true

    const loadIssues = async () => {
      const result = await getIssues({ sort: "upvotes" })
      if (active) {
        setAllIssues(result)
      }
    }

    loadIssues()

    return () => {
      active = false
    }
  }, [])

  const nearbyIssues = useMemo(() => {
    if (!userLocation) {
      return allIssues.slice(0, 5)
    }

    return [...allIssues]
      .filter((issue) => issue.coordinates)
      .sort((a, b) => {
        const aCoord: [number, number] = [a.coordinates!.lat, a.coordinates!.lng]
        const bCoord: [number, number] = [b.coordinates!.lat, b.coordinates!.lng]
        return distanceKm(userLocation, aCoord) - distanceKm(userLocation, bCoord)
      })
      .slice(0, 5)
  }, [allIssues, userLocation])

  const handleNearMe = () => {
    if (!navigator.geolocation || locating) {
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCenter: [number, number] = [position.coords.latitude, position.coords.longitude]
        setUserLocation(nextCenter)
        setMapCenter(nextCenter)
        setLocating(false)
      },
      () => {
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }

  const handleIssueSelect = (issueId: string) => {
    const selected = allIssues.find((issue) => issue.id === issueId)
    if (!selected?.coordinates) {
      return
    }
    setMapCenter([selected.coordinates.lat, selected.coordinates.lng])
  }

  const handleIssueClick = (issueId: string) => {
    router.push(`/${language}/issue/${issueId}`)
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">{t("nav.map")}</h1>
        <button
          onClick={handleNearMe}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Navigation className="h-3.5 w-3.5" />
          {locating ? t("map.locating") : t("dashboard.nearMe")}
        </button>
      </div>

      <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-muted">
        <LeafletIssuesMap
          issues={allIssues}
          center={mapCenter}
          userLocation={userLocation}
          onSelectIssue={handleIssueSelect}
        />
      </div>

      {/* Nearby issues list */}
      <h2 className="text-sm font-semibold text-foreground">{t("map.nearbyIssues")}</h2>
      <div className="flex flex-col gap-2">
        {nearbyIssues.map((issue) => {
          const CategoryIcon = getCategoryIcon(issue.category)
          const severityLabel =
            issue.severity === "low"
              ? t("report.low")
              : issue.severity === "medium"
                ? t("report.medium")
                : issue.severity === "high"
                  ? t("report.high")
                  : t("report.critical")
          return (
            <div
              key={issue.id}
              onClick={() => handleIssueClick(issue.id)}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 cursor-pointer transition-colors hover:bg-accent"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CategoryIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                <p className="text-xs font-semibold text-foreground truncate">{issue.title}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  {issue.location}
                </div>
              </div>
              <Badge className={`text-[9px] font-semibold ${getSeverityColor(issue.severity)}`}>
                {severityLabel}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}
