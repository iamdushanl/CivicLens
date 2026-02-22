"use client"

import { useEffect, useState } from "react"
import { getIssues } from "@/lib/api-client"
import type { Issue } from "@/lib/types"
import { BarChart2, CheckCircle2, TrendingUp, Award, PieChart } from "lucide-react"
import { cn } from "@/lib/utils"

const categoryColors: Record<string, { from: string; to: string; label: string }> = {
    potholes: { from: "from-orange-500", to: "to-amber-400", label: "Potholes" },
    streetLights: { from: "from-yellow-400", to: "to-amber-300", label: "Street Lights" },
    garbage: { from: "from-lime-500", to: "to-green-400", label: "Garbage" },
    waterSupply: { from: "from-sky-500", to: "to-cyan-400", label: "Water Supply" },
    roadDamage: { from: "from-rose-500", to: "to-red-400", label: "Road Damage" },
    drainage: { from: "from-blue-500", to: "to-indigo-400", label: "Drainage" },
    publicSafety: { from: "from-violet-500", to: "to-purple-400", label: "Public Safety" },
    other: { from: "from-slate-500", to: "to-gray-400", label: "Other" },
}

export function AnalyticsScreen() {
    const [issues, setIssues] = useState<Issue[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getIssues().then((data) => { setIssues(data); setLoading(false) })
    }, [])

    const total = issues.length
    const resolved = issues.filter((i) => i.status === "resolved").length
    const inProgress = issues.filter((i) => i.status === "in-progress").length
    const open = issues.filter((i) => i.status === "open").length
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

    // Category breakdown
    const byCat = issues.reduce<Record<string, number>>((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1
        return acc
    }, {})
    const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1])
    const maxCat = catEntries[0]?.[1] || 1

    // Severity breakdown
    const bySeverity = issues.reduce<Record<string, number>>((acc, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1
        return acc
    }, {})

    const severityConfig: Record<string, { color: string; label: string }> = {
        critical: { color: "bg-rose-500", label: "Critical" },
        high: { color: "bg-orange-500", label: "High" },
        medium: { color: "bg-amber-400", label: "Medium" },
        low: { color: "bg-emerald-500", label: "Low" },
    }

    const stats = [
        { label: "Total Reports", value: total, icon: BarChart2, gradient: "from-violet-600 to-indigo-600" },
        { label: "Resolved", value: resolved, icon: CheckCircle2, gradient: "from-emerald-500 to-teal-500" },
        { label: "In Progress", value: inProgress, icon: TrendingUp, gradient: "from-amber-500 to-orange-500" },
        { label: "Resolution Rate", value: `${resolutionRate}%`, icon: Award, gradient: "from-pink-500 to-rose-500" },
    ]

    return (
        <div className="flex flex-col gap-6 page-shell">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 text-white">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                    <div className="mb-3 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold backdrop-blur-sm">
                            <PieChart className="h-3 w-3 text-yellow-300" />
                            Community Analytics
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Civic Impact Dashboard</h1>
                    <p className="mt-1.5 text-sm text-white/75">Real-time breakdown of reported issues across Sri Lanka</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
                    ))
                    : stats.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <div key={stat.label} className="section-card flex flex-col gap-3 p-4">
                                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm", stat.gradient)}>
                                    <Icon className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                                    <div className="text-[11px] text-muted-foreground font-medium">{stat.label}</div>
                                </div>
                            </div>
                        )
                    })}
            </div>

            {/* Resolution Rate Donut */}
            <div className="section-card flex flex-col gap-4 p-5">
                <h2 className="text-sm font-bold text-foreground">Resolution Overview</h2>
                <div className="flex items-center gap-6">
                    {/* Simple visual ring */}
                    <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
                        <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                            <circle
                                cx="18" cy="18" r="15.9" fill="none"
                                stroke="url(#grad)" strokeWidth="3"
                                strokeDasharray={`${resolutionRate} ${100 - resolutionRate}`}
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#14b8a6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="absolute text-lg font-black text-foreground">{resolutionRate}%</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                        {[
                            { label: "Resolved", count: resolved, color: "bg-emerald-500" },
                            { label: "In Progress", count: inProgress, color: "bg-amber-500" },
                            { label: "Open", count: open, color: "bg-violet-500" },
                        ].map(({ label, count, color }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", color)} />
                                <span className="flex-1 text-xs text-muted-foreground">{label}</span>
                                <span className="text-xs font-bold text-foreground">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Category Bar Chart */}
            <div className="section-card flex flex-col gap-4 p-5">
                <h2 className="text-sm font-bold text-foreground">Issues by Category</h2>
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-7 animate-pulse rounded-full bg-muted" />)
                    : catEntries.map(([cat, count]) => {
                        const cfg = categoryColors[cat] || { from: "from-slate-500", to: "to-gray-400", label: cat }
                        const pct = Math.round((count / maxCat) * 100)
                        return (
                            <div key={cat} className="flex items-center gap-3">
                                <span className="w-24 flex-shrink-0 text-[11px] font-medium text-muted-foreground truncate">{cfg.label}</span>
                                <div className="flex-1 overflow-hidden rounded-full bg-muted h-3">
                                    <div
                                        className={cn("h-3 rounded-full bg-gradient-to-r transition-all duration-700", cfg.from, cfg.to)}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="w-6 text-right text-[11px] font-bold text-foreground">{count}</span>
                            </div>
                        )
                    })}
            </div>

            {/* Severity Breakdown */}
            <div className="section-card flex flex-col gap-4 p-5">
                <h2 className="text-sm font-bold text-foreground">Severity Distribution</h2>
                <div className="flex gap-2">
                    {(["critical", "high", "medium", "low"] as const).map((sev) => {
                        const cfg = severityConfig[sev]
                        const count = bySeverity[sev] || 0
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        return (
                            <div key={sev} className="flex flex-1 flex-col items-center gap-2">
                                <div className="flex flex-1 w-full justify-center">
                                    <div className="relative w-10 flex flex-col justify-end" style={{ height: 80 }}>
                                        <div
                                            className={cn("w-full rounded-t-lg transition-all duration-700", cfg.color)}
                                            style={{ height: `${Math.max(pct, 5)}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-lg font-black text-foreground">{count}</span>
                                <span className="text-center text-[10px] font-medium text-muted-foreground capitalize">{sev}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
