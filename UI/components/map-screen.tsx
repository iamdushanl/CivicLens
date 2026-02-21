"use client"

import { useLanguage } from "@/lib/language-context"
import { MapPin, Navigation } from "lucide-react"
import { mockIssues } from "@/lib/mock-data"
import { getCategoryIcon, getSeverityColor } from "@/lib/category-helpers"
import { Badge } from "@/components/ui/badge"

export function MapScreen() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">{t("map")}</h1>
        <button className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent">
          <Navigation className="h-3.5 w-3.5" />
          {t("nearMe")}
        </button>
      </div>

      {/* Map placeholder */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-primary)_1px,_transparent_1px)] bg-[length:24px_24px] opacity-5" />
        {/* Simulated pins */}
        <div className="absolute left-[30%] top-[35%]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive shadow-md">
            <MapPin className="h-3 w-3 text-card" />
          </div>
        </div>
        <div className="absolute left-[55%] top-[25%]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning shadow-md">
            <MapPin className="h-3 w-3 text-card" />
          </div>
        </div>
        <div className="absolute left-[45%] top-[55%]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-md">
            <MapPin className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
        <div className="absolute left-[70%] top-[45%]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive shadow-md">
            <MapPin className="h-3 w-3 text-card" />
          </div>
        </div>
        <div className="absolute left-[20%] top-[60%]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning shadow-md">
            <MapPin className="h-3 w-3 text-card" />
          </div>
        </div>
        <p className="relative z-10 text-sm font-medium text-muted-foreground">
          Interactive Map View
        </p>
      </div>

      {/* Nearby issues list */}
      <h2 className="text-sm font-semibold text-foreground">{t("nearMe")}</h2>
      <div className="flex flex-col gap-2">
        {mockIssues.slice(0, 5).map((issue) => {
          const CategoryIcon = getCategoryIcon(issue.category)
          const severityLabel =
            issue.severity === "low"
              ? t("low")
              : issue.severity === "medium"
                ? t("medium")
                : issue.severity === "high"
                  ? t("high")
                  : t("critical")
          return (
            <div
              key={issue.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
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
