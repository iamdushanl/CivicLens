"use client"

import { useEffect, useState, useCallback } from "react"
import { useLanguage } from "@/lib/language-context"
import type { Issue, Comment } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft, Heart, MapPin, Send, CheckCircle2, Brain, User, Clock,
  ImageIcon, Share2, Bell, BellOff, Circle, CheckCircle, XCircle,
  ShieldCheck, Copy, MessageCircle, Loader2,
} from "lucide-react"
import { getCategoryIcon, getSeverityColor, getStatusColor, getTimeAgo } from "@/lib/category-helpers"
import { cn } from "@/lib/utils"
import { getComments, postComment, resolveVote, upvoteIssue } from "@/lib/api-client"
import {
  hasUpvoted, toggleUpvote, isFollowing, toggleFollow,
  hasVotedResolve, markResolveVoted,
  addNotification,
} from "@/lib/local-store"

interface IssueDetailScreenProps {
  issue: Issue
  onBack: () => void
}

const categoryGradients: Record<string, string> = {
  potholes: "from-orange-500 to-amber-500",
  streetLights: "from-yellow-500 to-amber-400",
  garbage: "from-lime-500 to-green-500",
  waterSupply: "from-sky-500 to-cyan-500",
  roadDamage: "from-rose-500 to-red-500",
  drainage: "from-blue-500 to-indigo-500",
  publicSafety: "from-violet-500 to-purple-500",
  other: "from-slate-500 to-gray-500",
}

export function IssueDetailScreen({ issue, onBack }: IssueDetailScreenProps) {
  const { t } = useLanguage()

  // ── Upvote state (persisted)
  const [upvotes, setUpvotes] = useState(issue.upvotes)
  const [voted, setVoted] = useState(false)

  // ── Follow state (persisted)
  const [following, setFollowing] = useState(false)

  // ── Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentAnon, setCommentAnon] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentCount, setCommentCount] = useState(issue.commentCount)

  // ── GAP 12: Official Response
  const [showOfficialPanel, setShowOfficialPanel] = useState(false)
  const [officialRole, setOfficialRole] = useState("Municipal Council")
  const [officialText, setOfficialText] = useState("")
  const [officialSent, setOfficialSent] = useState(false)

  // ── Resolution vote
  const [resolveVotes, setResolveVotes] = useState({
    yes: issue.resolutionConfirmations || 0,
    no: 0,
  })
  const [hasVotedRes, setHasVotedRes] = useState(false)
  const [voteSubmitting, setVoteSubmitting] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)

  // ── Share toast
  const [shareToast, setShareToast] = useState(false)

  const gradient = categoryGradients[issue.category] || "from-violet-500 to-indigo-500"
  const CategoryIcon = getCategoryIcon(issue.category)
  const totalVotes = resolveVotes.yes + resolveVotes.no
  const resolveProgress = totalVotes > 0 ? (resolveVotes.yes / 3) * 100 : 0

  // Load persisted state
  useEffect(() => {
    setVoted(hasUpvoted(issue.id))
    setFollowing(isFollowing(issue.id))
    setHasVotedRes(hasVotedResolve(issue.id))
  }, [issue.id])

  // Load comments
  useEffect(() => {
    let active = true
    setCommentsLoading(true)
    getComments(issue.id)
      .then((result) => { if (active) setComments(result) })
      .finally(() => { if (active) setCommentsLoading(false) })
    return () => { active = false }
  }, [issue.id])

  // ── Handlers
  const handleUpvote = useCallback(async () => {
    const nowVoted = toggleUpvote(issue.id)
    setVoted(nowVoted)
    setUpvotes((prev) => nowVoted ? prev + 1 : prev - 1)
    // Also fire API (fire-and-forget)
    try { await upvoteIssue(issue.id) } catch { /* ignore */ }
  }, [issue.id])

  const handleFollow = useCallback(() => {
    const nowFollowing = toggleFollow(issue.id)
    setFollowing(nowFollowing)
    if (nowFollowing) {
      addNotification({
        id: `notif-${issue.id}-${Date.now()}`,
        issueId: issue.id,
        issueTitle: issue.title,
        message: `You're now following "${issue.title}"`,
        type: "status_update",
        read: false,
        createdAt: new Date().toISOString(),
      })
    }
  }, [issue.id, issue.title])

  const handleShare = useCallback(async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/issue/${issue.id}`
    const text = `🚨 Civic Issue: ${issue.title}\n📍 ${issue.location}\n\nReport on CivicLens: ${url}`

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: issue.title, text, url })
        return
      } catch { /* user cancelled */ }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2500)
    } catch { /* ignore */ }
  }, [issue.id, issue.title, issue.location])

  const handleResolveVote = useCallback(async (vote: "yes" | "no") => {
    if (hasVotedRes || voteSubmitting) return
    setVoteSubmitting(true)
    setVoteError(null)
    try {
      const result = await resolveVote(issue.id, vote)
      setResolveVotes({ yes: result.yes, no: result.no })
      setHasVotedRes(true)
      markResolveVoted(issue.id)
    } catch {
      setVoteError("Unable to submit vote right now")
    } finally {
      setVoteSubmitting(false)
    }
  }, [issue.id, hasVotedRes, voteSubmitting])

  const handlePostComment = useCallback(async () => {
    if (!newComment.trim() || commentSubmitting) return
    setCommentSubmitting(true)
    try {
      const created = await postComment(issue.id, newComment.trim(), commentAnon)
      setComments((prev) => [created, ...prev])
      setCommentCount((c) => c + 1) // optimistic increment
      setNewComment("")
    } catch { /* ignore */ } finally {
      setCommentSubmitting(false)
    }
  }, [issue.id, newComment, commentAnon, commentSubmitting])

  // ── Status labels
  const statusConfig: Record<string, { label: string; icon: typeof Circle; color: string; dot: string; badgeClass: string }> = {
    open: { label: "Open", icon: Circle, color: "text-slate-600", dot: "bg-slate-400", badgeClass: "scf-status-open" },
    "in-progress": { label: "Acknowledged", icon: CheckCircle, color: "text-green-700", dot: "bg-green-500", badgeClass: "scf-status-acknowledged" },
    resolved: { label: "Resolved", icon: CheckCircle2, color: "text-green-700", dot: "bg-green-500", badgeClass: "scf-status-resolved" },
  }

  // ── Status history (use real or synthesise fallback)
  const statusHistory = issue.statusHistory || [
    { status: "open" as const, timestamp: issue.createdAt, note: "Issue reported by community", updatedBy: "system" as const },
    ...(issue.status === "in-progress" || issue.status === "resolved"
      ? [{ status: "in-progress" as const, timestamp: issue.createdAt, note: "Assigned to municipal team", updatedBy: "official" as const }]
      : []),
    ...(issue.status === "resolved"
      ? [{ status: "resolved" as const, timestamp: issue.resolvedAt || issue.createdAt, note: issue.resolvedBy === "official" ? "Official confirmation" : "Community confirmed resolved", updatedBy: (issue.resolvedBy || "community") as "official" | "community" | "system" }]
      : []),
  ]

  const severityLabel = issue.severity === "low" ? t("report.low")
    : issue.severity === "medium" ? t("report.medium")
      : issue.severity === "high" ? t("report.high")
        : t("report.critical")

  const statusLabel = issue.status === "open" ? t("issue.open")
    : issue.status === "in-progress" ? t("issue.inProgress")
      : t("issue.resolved")

  return (
    <div className="flex flex-col gap-0 bg-background">

      {/* SCF-style top bar: back arrow + title + share/follow */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-background">
        <button
          onClick={onBack}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {/* SCF breadcrumb: Category > Title */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{issue.category.replace(/([A-Z])/g, ' $1').trim()}</p>
          <h1 className="text-sm font-bold text-foreground line-clamp-1">{issue.title}</h1>
        </div>
        {/* Share */}
        <button
          onClick={handleShare}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
          {shareToast && (
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-[10px] font-semibold text-background shadow-lg">
              Copied!
            </span>
          )}
        </button>
        {/* Follow */}
        <button
          onClick={handleFollow}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
            following
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
          aria-label={following ? "Unfollow" : "Follow"}
        >
          {following ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-col gap-5 px-4 py-4">

        {/* Photo */}
        {issue.photos && issue.photos.length > 0 && issue.photos[0] !== "demo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={issue.photos[0]} alt="Issue photo" className="w-full aspect-video object-cover rounded-2xl" />
        ) : (
          <div className={cn("flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br opacity-60", gradient)}>
            <CategoryIcon className="h-16 w-16 text-white/60" />
          </div>
        )}

        {/* AI Badge */}
        {issue.aiConfidence && (
          <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/8 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-xs font-bold text-foreground">AI Classification</span>
              <div className="flex items-center gap-2">
                <Progress value={issue.aiConfidence} className="h-1.5 flex-1" />
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">{issue.aiConfidence}% confident</span>
              </div>
            </div>
          </div>
        )}

        {/* SCF Badges row: icon circle + status badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="scf-icon-circle">
            <CategoryIcon className="h-5 w-5 text-white" />
          </div>
          {/* SCF-exact status badge — green for resolved/acknowledged, grey for open */}
          <span className={statusConfig[issue.status]?.badgeClass ?? "scf-status-open"}>
            {statusLabel}
          </span>
          {following && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
              <Bell className="h-2.5 w-2.5" /> Following
            </span>
          )}
        </div>

        {/* Title + Description */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-foreground">{issue.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
        </div>

        {/* Location */}
        <div className="section-card flex items-center gap-2.5 px-4 py-3">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground">{issue.location}</span>
        </div>

        {/* Severity bar */}
        {issue.severityScore && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{t("report.severityScore")}</span>
              <span className="text-xs font-bold text-foreground">{issue.severityScore}/10</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all bg-gradient-to-r", gradient)}
                style={{ width: `${issue.severityScore * 10}%` }}
              />
            </div>
          </div>
        )}

        {/* ── STATUS TIMELINE (GAP 3) ── */}
        <div className="section-card flex flex-col gap-0 overflow-hidden">
          <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
            <h3 className="text-sm font-bold text-foreground">Status Timeline</h3>
          </div>
          <div className="flex flex-col px-4 py-4">
            {statusHistory.map((entry, i) => {
              const cfg = statusConfig[entry.status] || statusConfig.open
              const StatusIcon = cfg.icon
              const isLast = i === statusHistory.length - 1
              return (
                <div key={i} className="flex gap-3">
                  {/* Dot + line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                      isLast ? "bg-gradient-to-br from-violet-600 to-indigo-600" : "bg-muted"
                    )}>
                      <StatusIcon className={cn("h-3.5 w-3.5", isLast ? "text-white" : cfg.color)} />
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-border my-1" />}
                  </div>
                  {/* Content */}
                  <div className={cn("flex flex-col gap-0.5 pb-4", isLast && "pb-0")}>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</span>
                      {entry.updatedBy === "official" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-2.5 w-2.5" /> Official
                        </span>
                      )}
                    </div>
                    {entry.note && <p className="text-[11px] text-muted-foreground">{entry.note}</p>}
                    <p className="text-[10px] text-muted-foreground">{getTimeAgo(entry.timestamp)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── UPVOTE (GAP 6 — persisted) ── */}
        <button
          onClick={handleUpvote}
          className={cn(
            "flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200",
            voted
              ? "border-red-300 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              : "border-border bg-card text-muted-foreground hover:border-red-300 hover:text-red-500"
          )}
        >
          <Heart className={cn("h-4 w-4 transition-transform", voted && "fill-current scale-110")} />
          {voted ? "Liked" : t("issue.upvote")} · {upvotes}
        </button>

        {/* ── RESOLUTION VOTE ── */}
        {issue.status !== "resolved" && (
          <div className="scf-card flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-foreground">{t("issue.hasThisBeenResolved")}</h3>
              <p className="text-[11px] text-muted-foreground">Community confirms when at least 3 people say yes</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleResolveVote("yes")}
                disabled={hasVotedRes || voteSubmitting}
                className={cn(
                  "flex flex-1 min-h-11 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all",
                  hasVotedRes && resolveVotes.yes > 0
                    ? "border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    : "border-border text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5",
                  (hasVotedRes || voteSubmitting) && "cursor-default"
                )}
              >
                {voteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Yes ({resolveVotes.yes})
              </button>
              <button
                onClick={() => handleResolveVote("no")}
                disabled={hasVotedRes || voteSubmitting}
                className={cn(
                  "flex flex-1 min-h-11 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all",
                  hasVotedRes && resolveVotes.no > 0
                    ? "border-transparent bg-gradient-to-r from-rose-500 to-red-500 text-white"
                    : "border-border text-foreground hover:border-rose-500/40 hover:bg-rose-500/5",
                  (hasVotedRes || voteSubmitting) && "cursor-default"
                )}
              >
                <XCircle className="h-4 w-4" />
                No ({resolveVotes.no})
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <Progress value={Math.min(resolveProgress, 100)} className="h-2" />
              <p className="text-[10px] text-muted-foreground">
                {resolveVotes.yes} / 3 {t("issue.confirmationsNeeded")}
              </p>
            </div>
            {voteError && <p className="text-[10px] text-amber-600">{voteError}</p>}
          </div>
        )}

        {/* ── SHARE ACTIONS (GAP 7) ── */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="section-card flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-muted"
          >
            <Share2 className="h-4 w-4 text-primary" />
            Share on WhatsApp
          </button>
          <button
            onClick={async () => {
              const url = `${typeof window !== "undefined" ? window.location.origin : ""}/issue/${issue.id}`
              try {
                await navigator.clipboard.writeText(url)
                setShareToast(true)
                setTimeout(() => setShareToast(false), 2000)
              } catch { /**/ }
            }}
            className="section-card flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-muted"
          >
            <Copy className="h-4 w-4 text-primary" />
            Copy Link
          </button>
        </div>

        {/* ── COMMENTS (GAP 4 — optimistic count) ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              {t("issue.comments")} ({commentCount})
            </h3>
          </div>

          {/* Comment input */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                placeholder={t("issue.writeAComment")}
                className="premium-input flex-1"
              />
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim() || commentSubmitting}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md transition-all hover:shadow-violet-500/30 disabled:opacity-50"
                aria-label="Post comment"
              >
                {commentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={commentAnon}
                onChange={(e) => setCommentAnon(e.target.checked)}
                className="rounded"
              />
              Post anonymously
            </label>
          </div>

          {/* Comment list */}
          <div className="flex flex-col gap-3">
            {commentsLoading && (
              <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading comments...
              </div>
            )}
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border px-4 py-3",
                  comment.isOfficial
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    {comment.isOfficial
                      ? <><ShieldCheck className="h-3 w-3 text-emerald-500" /> Official Response</>
                      : <><User className="h-3 w-3" /> {comment.isAnonymous ? t("common.anonymous") : comment.author}</>
                    }
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(comment.createdAt)}
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── GAP 12: Official Response Channel ── */}
        <div className="section-card overflow-hidden">
          <button
            onClick={() => setShowOfficialPanel((v) => !v)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Official Authority Response</p>
              <p className="text-xs text-muted-foreground">Post an official update from your department</p>
            </div>
            <span className={cn("text-xs font-bold", showOfficialPanel ? "text-primary" : "text-muted-foreground")}>
              {showOfficialPanel ? "Hide" : "Respond"}
            </span>
          </button>

          {showOfficialPanel && (
            <div className="border-t border-border/60 px-5 pb-5 pt-4">
              {officialSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Official response posted!</p>
                  <p className="text-xs text-muted-foreground">Your response is now visible to the community.</p>
                  <button
                    onClick={() => { setOfficialSent(false); setOfficialText("") }}
                    className="text-xs text-primary underline"
                  >Post another</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Department/role selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Your Department</label>
                    <select
                      value={officialRole}
                      onChange={(e) => setOfficialRole(e.target.value)}
                      className="premium-input text-sm"
                    >
                      {[
                        "Municipal Council",
                        "Road Development Authority",
                        "National Water Supply & Drainage Board",
                        "Ceylon Electricity Board",
                        "Ministry of Local Government",
                        "Divisional Secretariat",
                        "Police Department",
                        "Other Government Department",
                      ].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Response text */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Official Response</label>
                    <textarea
                      value={officialText}
                      onChange={(e) => setOfficialText(e.target.value.slice(0, 500))}
                      placeholder="e.g. We have noted this issue and scheduled a repair crew for next week…"
                      rows={4}
                      className="premium-input resize-none text-sm"
                    />
                    <span className="text-right text-[11px] text-muted-foreground">{500 - officialText.length} chars remaining</span>
                  </div>

                  {/* Info note */}
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      This response will be marked as an official authority update and visible to all citizens.
                    </p>
                  </div>

                  <button
                    disabled={!officialText.trim()}
                    onClick={() => {
                      const officialComment: Comment = {
                        id: `official-${Date.now()}`,
                        issueId: issue.id,
                        text: `[${officialRole}] ${officialText.trim()}`,
                        author: officialRole,
                        isAnonymous: false,
                        isOfficial: true,
                        createdAt: new Date().toISOString(),
                      }
                      setComments((prev) => [officialComment, ...prev])
                      setCommentCount((c) => c + 1)
                      setShowOfficialPanel(false)
                      setOfficialSent(true)
                    }}
                    className="btn-primary min-h-11 disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Post Official Response
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
