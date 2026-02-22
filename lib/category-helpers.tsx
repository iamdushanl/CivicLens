import {
  CircleAlert,
  Lightbulb,
  Trash2,
  Droplets,
  Construction,
  Waves,
  ShieldAlert,
  HelpCircle,
} from "lucide-react"
import type { IssueCategory, Severity } from "./types"

export function getCategoryIcon(category: IssueCategory) {
  const map = {
    potholes: CircleAlert,
    streetLights: Lightbulb,
    garbage: Trash2,
    waterSupply: Droplets,
    roadDamage: Construction,
    drainage: Waves,
    publicSafety: ShieldAlert,
    other: HelpCircle,
  }
  return map[category] || HelpCircle
}

export function getSeverityColor(severity: Severity) {
  const map = {
    low: "bg-chart-5 text-foreground",
    medium: "bg-warning text-warning-foreground",
    high: "bg-chart-1 text-primary-foreground",
    critical: "bg-destructive text-card",
  }
  return map[severity]
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    open: "bg-destructive/15 text-destructive",
    "in-progress": "bg-warning/20 text-warning-foreground",
    resolved: "bg-primary/15 text-primary",
  }
  return map[status] || ""
}

export function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}
