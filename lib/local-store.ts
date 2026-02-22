/**
 * CivicLens — Client-side persistence utilities
 * Handles: upvote dedup, follow/subscribe, notifications, report drafts
 * All data stored in localStorage for privacy (no account needed)
 */

import type { Notification } from "./types"

// ---- Keys ----
const UPVOTED_KEY = "cl_upvoted_issues"
const FOLLOWED_KEY = "cl_followed_issues"
const NOTIFICATIONS_KEY = "cl_notifications"
const DRAFT_KEY = "cl_report_draft"
const ONBOARDED_KEY = "cl_onboarded"
const VOTED_RESOLVE_KEY = "cl_resolve_votes"

function isBrowser() {
    return typeof window !== "undefined"
}

function readJSON<T>(key: string, fallback: T): T {
    if (!isBrowser()) return fallback
    try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
        return fallback
    }
}

function writeJSON<T>(key: string, value: T): void {
    if (!isBrowser()) return
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch { /* quota exceeded — ignore */ }
}

// ---- Upvotes ----
export function getUpvotedIssues(): string[] {
    return readJSON<string[]>(UPVOTED_KEY, [])
}

export function hasUpvoted(issueId: string): boolean {
    return getUpvotedIssues().includes(issueId)
}

export function toggleUpvote(issueId: string): boolean {
    const list = getUpvotedIssues()
    const already = list.includes(issueId)
    if (already) {
        writeJSON(UPVOTED_KEY, list.filter((id) => id !== issueId))
        return false
    } else {
        writeJSON(UPVOTED_KEY, [...list, issueId])
        return true
    }
}

// ---- Follow / Subscribe ----
export function getFollowedIssues(): string[] {
    return readJSON<string[]>(FOLLOWED_KEY, [])
}

export function isFollowing(issueId: string): boolean {
    return getFollowedIssues().includes(issueId)
}

export function toggleFollow(issueId: string): boolean {
    const list = getFollowedIssues()
    const already = list.includes(issueId)
    if (already) {
        writeJSON(FOLLOWED_KEY, list.filter((id) => id !== issueId))
        return false
    } else {
        writeJSON(FOLLOWED_KEY, [...list, issueId])
        // Add a notification when following
        addNotification({
            id: `notif-follow-${issueId}-${Date.now()}`,
            issueId,
            issueTitle: `Issue ${issueId}`,
            message: "You are now following this issue. You'll be notified when it's updated.",
            type: "status_update",
            read: false,
            createdAt: new Date().toISOString(),
        })
        return true
    }
}

// ---- Resolve votes ----
export function getResolveVotes(): string[] {
    return readJSON<string[]>(VOTED_RESOLVE_KEY, [])
}

export function hasVotedResolve(issueId: string): boolean {
    return getResolveVotes().includes(issueId)
}

export function markResolveVoted(issueId: string): void {
    const list = getResolveVotes()
    if (!list.includes(issueId)) {
        writeJSON(VOTED_RESOLVE_KEY, [...list, issueId])
    }
}

// ---- Notifications ----
export function getNotifications(): Notification[] {
    return readJSON<Notification[]>(NOTIFICATIONS_KEY, [])
}

export function addNotification(notif: Notification): void {
    const list = getNotifications()
    writeJSON(NOTIFICATIONS_KEY, [notif, ...list].slice(0, 50)) // keep last 50
}

export function markNotificationRead(notifId: string): void {
    const list = getNotifications().map((n) => n.id === notifId ? { ...n, read: true } : n)
    writeJSON(NOTIFICATIONS_KEY, list)
}

export function markAllNotificationsRead(): void {
    const list = getNotifications().map((n) => ({ ...n, read: true }))
    writeJSON(NOTIFICATIONS_KEY, list)
}

export function getUnreadCount(): number {
    return getNotifications().filter((n) => !n.read).length
}

export function clearNotifications(): void {
    writeJSON(NOTIFICATIONS_KEY, [])
}

// Add notification when an issue you follow gets updated (called from detail screen)
export function notifyFollowedIssueUpdate(issueId: string, issueTitle: string, newStatus: string): void {
    if (!isFollowing(issueId)) return
    addNotification({
        id: `notif-update-${issueId}-${Date.now()}`,
        issueId,
        issueTitle,
        message: `Issue status updated to "${newStatus}". Check it out!`,
        type: "status_update",
        read: false,
        createdAt: new Date().toISOString(),
    })
}

// ---- Report Draft ----
export interface ReportDraft {
    step: number
    title: string
    description: string
    category: string
    urgency: string
    locationText: string
    isAnonymous: boolean
    savedAt: string
}

export function getReportDraft(): ReportDraft | null {
    return readJSON<ReportDraft | null>(DRAFT_KEY, null)
}

export function saveReportDraft(draft: Omit<ReportDraft, "savedAt">): void {
    writeJSON(DRAFT_KEY, { ...draft, savedAt: new Date().toISOString() })
}

export function clearReportDraft(): void {
    if (isBrowser()) localStorage.removeItem(DRAFT_KEY)
}

// ---- Onboarding ----
export function hasCompletedOnboarding(): boolean {
    return readJSON<boolean>(ONBOARDED_KEY, false)
}

export function completeOnboarding(): void {
    writeJSON(ONBOARDED_KEY, true)
}
