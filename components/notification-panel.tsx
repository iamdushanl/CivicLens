"use client"

import { useState, useEffect } from "react"
import { Bell, X, CheckCheck, AlertCircle, MessageCircle, ThumbsUp, CheckCircle2 } from "lucide-react"
import { getNotifications, markAllNotificationsRead, markNotificationRead, clearNotifications, getUnreadCount } from "@/lib/local-store"
import type { Notification } from "@/lib/types"
import { getTimeAgo } from "@/lib/category-helpers"
import { cn } from "@/lib/utils"

const typeConfig: Record<Notification["type"], { icon: typeof Bell; color: string; bg: string }> = {
    status_update: { icon: AlertCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
    comment: { icon: MessageCircle, color: "text-sky-500", bg: "bg-sky-500/10" },
    upvote: { icon: ThumbsUp, color: "text-amber-500", bg: "bg-amber-500/10" },
    resolved: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
}

interface NotificationPanelProps {
    onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unread, setUnread] = useState(0)

    const refresh = () => {
        setNotifications(getNotifications())
        setUnread(getUnreadCount())
    }

    useEffect(() => {
        refresh()
    }, [])

    const handleMarkAll = () => {
        markAllNotificationsRead()
        refresh()
    }

    const handleMarkOne = (id: string) => {
        markNotificationRead(id)
        refresh()
    }

    const handleClear = () => {
        clearNotifications()
        refresh()
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative mt-16 mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-bold text-foreground">Notifications</h2>
                        {unread > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-1.5 text-[10px] font-bold text-white">
                                {unread}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {unread > 0 && (
                            <button onClick={handleMarkAll} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted">
                                <CheckCheck className="h-3 w-3" /> Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button onClick={handleClear} className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted">
                                Clear
                            </button>
                        )}
                        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-14">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                                <Bell className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No notifications yet</p>
                            <p className="text-xs text-muted-foreground">Follow issues to get updates here</p>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-border/60">
                            {notifications.map((n) => {
                                const cfg = typeConfig[n.type] || typeConfig.status_update
                                const Icon = cfg.icon
                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleMarkOne(n.id)}
                                        className={cn(
                                            "flex items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50",
                                            !n.read && "bg-violet-500/5"
                                        )}
                                    >
                                        <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl", cfg.bg)}>
                                            <Icon className={cn("h-4 w-4", cfg.color)} />
                                        </div>
                                        <div className="flex flex-col gap-0.5 flex-1">
                                            <p className="text-xs font-bold text-foreground line-clamp-1">{n.issueTitle}</p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                                            <p className="text-[10px] text-muted-foreground">{getTimeAgo(n.createdAt)}</p>
                                        </div>
                                        {!n.read && <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-violet-500" />}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Notification Bell Button (used in TopNavbar) ──
export function NotificationBell({ onClick }: { onClick: () => void }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const update = () => setCount(getUnreadCount())
        update()
        // Poll every 5s for new notifications
        const interval = setInterval(update, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <button
            onClick={onClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
        >
            <Bell className="h-5 w-5" />
            {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-1 text-[9px] font-bold text-white">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </button>
    )
}
