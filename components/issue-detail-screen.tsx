"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import type { Issue, Comment } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  ThumbsUp,
  MapPin,
  Send,
  CheckCircle2,
  Brain,
  User,
  Clock,
  ImageIcon,
} from "lucide-react"
import { getCategoryIcon, getSeverityColor, getStatusColor, getTimeAgo } from "@/lib/category-helpers"
import { cn } from "@/lib/utils"
import { getComments, postComment, resolveVote } from "@/lib/api-client"

interface IssueDetailScreenProps {
  issue: Issue
  onBack: () => void
}

export function IssueDetailScreen({ issue, onBack }: IssueDetailScreenProps) {
  const { t } = useLanguage()
  const [upvotes, setUpvotes] = useState(issue.upvotes)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [resolveVotes, setResolveVotes] = useState({
    yes: issue.resolutionConfirmations || 0,
    no: 0,
  })
  const [hasVoted, setHasVoted] = useState(false)
  const [voteSubmitting, setVoteSubmitting] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadComments = async () => {
      setCommentsLoading(true)
      setCommentsError(null)
      try {
        const result = await getComments(issue.id)
        if (!active) return
        setComments(result)
      } catch {
        if (!active) return
        setCommentsError("Unable to load comments")
      } finally {
        if (active) {
          setCommentsLoading(false)
        }
      }
    }

    loadComments()

    return () => {
      active = false
    }
  }, [issue.id])

  const CategoryIcon = getCategoryIcon(issue.category)
  const totalVotes = resolveVotes.yes + resolveVotes.no
  const resolveProgress = totalVotes > 0 ? (resolveVotes.yes / 3) * 100 : 0

  const handleUpvote = () => {
    if (!hasUpvoted) {
      setUpvotes((prev) => prev + 1)
      setHasUpvoted(true)
    } else {
      setUpvotes((prev) => prev - 1)
      setHasUpvoted(false)
    }
  }

  const handleResolveVote = async (vote: "yes" | "no") => {
    if (hasVoted || voteSubmitting) return

    setVoteSubmitting(true)
    setVoteError(null)

    try {
      const result = await resolveVote(issue.id, vote)
      setResolveVotes({ yes: result.yes, no: result.no })
      setHasVoted(true)
      if (result.duplicate) {
        setVoteError("Vote already submitted for this issue")
      }
    } catch {
      setVoteError("Unable to submit vote right now")
    } finally {
      setVoteSubmitting(false)
    }
  }

  const handlePostComment = async () => {
    if (!newComment.trim()) return

    setCommentSubmitting(true)
    setCommentsError(null)

    try {
      const created = await postComment(issue.id, newComment.trim(), false)
      setComments((prev) => [created, ...prev])
      setNewComment("")
    } catch {
      setCommentsError("Unable to post comment")
    } finally {
      setCommentSubmitting(false)
    }
  }

  const severityLabel =
    issue.severity === "low"
      ? t("report.low")
      : issue.severity === "medium"
        ? t("report.medium")
        : issue.severity === "high"
          ? t("report.high")
          : t("report.critical")

  const statusLabel =
    issue.status === "open"
      ? t("issue.open")
      : issue.status === "in-progress"
        ? t("issue.inProgress")
        : t("issue.resolved")

  return (
    <div className="flex flex-col gap-6">
      {/* Back button + Title */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="mt-1 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="page-title line-clamp-2">{issue.title}</h1>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6">
        {/* Photo placeholder */}
        <div className="section-card flex aspect-video items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
            <span className="text-xs font-medium">Issue Photo</span>
          </div>
        </div>

        {/* AI Tag */}
        {issue.aiConfidence && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">
              {t("issue.aiClassified")}: {issue.aiCategory} — {issue.aiConfidence}% {t("report.confidence")}
            </span>
          </div>
        )}

        {/* Severity bar */}
        {issue.severityScore && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{t("report.severityScore")}</span>
              <span className="text-xs font-bold text-foreground">{issue.severityScore}/10</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  issue.severityScore >= 8
                    ? "bg-destructive"
                    : issue.severityScore >= 5
                      ? "bg-warning"
                      : "bg-primary"
                )}
                style={{ width: `${issue.severityScore * 10}%` }}
              />
            </div>
          </div>
        )}

        {/* Status + Severity badges */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <CategoryIcon className="h-4 w-4 text-primary" />
          </div>
          <Badge className={cn("text-[10px] font-semibold", getSeverityColor(issue.severity))}>
            {severityLabel}
          </Badge>
          <Badge className={cn("text-[10px] font-medium", getStatusColor(issue.status))}>
            {statusLabel}
          </Badge>
        </div>

        {/* Title + Description */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-foreground text-balance">{issue.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
        </div>

        {/* Location */}
        <div className="section-card flex items-center gap-2 bg-muted/50 px-3 py-3">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">{issue.location}</span>
        </div>

        {/* Map snippet placeholder */}
        <div className="section-card flex h-32 items-center justify-center bg-muted">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span className="text-xs font-medium">Map Preview</span>
          </div>
        </div>

        {/* Upvote button (large) */}
        <button
          onClick={handleUpvote}
          className={cn(
            "flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-6 py-3 text-sm font-semibold transition-all",
            hasUpvoted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          <ThumbsUp className={cn("h-5 w-5", hasUpvoted && "fill-current")} />
          {t("issue.upvote")} ({upvotes})
        </button>

        {/* Resolution voting */}
        {issue.status !== "resolved" && (
          <div className="section-card flex flex-col gap-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t("issue.hasThisBeenResolved")}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleResolveVote("yes")}
                disabled={hasVoted || voteSubmitting}
                className={cn(
                  "flex flex-1 min-h-11 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                  hasVoted && resolveVotes.yes > 0
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:border-primary/50",
                  hasVoted && "cursor-default"
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("common.yes")}
              </button>
              <button
                onClick={() => handleResolveVote("no")}
                disabled={hasVoted || voteSubmitting}
                className={cn(
                  "flex flex-1 min-h-11 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                  hasVoted && resolveVotes.no > 0
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border text-foreground hover:border-destructive/50",
                  hasVoted && "cursor-default"
                )}
              >
                {t("common.no")}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <Progress value={Math.min(resolveProgress, 100)} className="h-2" />
              <p className="text-[10px] text-muted-foreground">
                {resolveVotes.yes} / 3 {t("issue.confirmationsNeeded")}
              </p>
            </div>
            {voteError && (
              <p className="text-[10px] text-muted-foreground">{voteError}</p>
            )}
          </div>
        )}

        {/* Comments Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t("issue.comments")} ({comments.length})
          </h3>

          {/* Comment Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
              placeholder={t("issue.writeAComment")}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handlePostComment}
              disabled={!newComment.trim() || commentSubmitting}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              aria-label="Post comment"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Comment Bubbles */}
          <div className="flex flex-col gap-3">
            {commentsLoading && (
              <p className="text-xs text-muted-foreground">Loading comments...</p>
            )}

            {commentsError && (
              <p className="text-xs text-muted-foreground">{commentsError}</p>
            )}

            {comments.map((comment) => (
              <div
                key={comment.id}
                className="section-card flex flex-col gap-1 bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <User className="h-3 w-3" />
                    {comment.isAnonymous ? t("common.anonymous") : comment.author}
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
      </div>
    </div>
  )
}
