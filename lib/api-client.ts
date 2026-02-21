import { mockComments, mockIssues, mockResolvedIssues } from "@/lib/mock-data"
import type { Comment, Issue, IssueStatus } from "@/lib/types"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "")
const REQUEST_TIMEOUT_MS = 5000
const SESSION_STORAGE_KEY = "civicLensSession"

interface IssueFilters {
  status?: IssueStatus | "all"
  category?: string
  sort?: "upvotes" | "recent" | "near"
  limit?: number
}

interface StatsResponse {
  totalReports: number
  resolvedThisWeek: number
  activeIssues: number
  topCategory: string
}

interface HealthResponse {
  ok: boolean
  status: string
  timestamp: string
  demo_mode: boolean
  supabase_enabled: boolean
  gemini_enabled: boolean
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getSessionId(): string {
  if (!isBrowser()) {
    return "server-session"
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const created = generateUUID()
  window.localStorage.setItem(SESSION_STORAGE_KEY, created)
  return created
}

async function fetchWithTimeout(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "X-Session-ID": getSessionId(),
        ...(init?.headers || {}),
      },
      cache: "no-store",
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function apiFirst<T>(
  operation: string,
  path: string,
  fallback: () => T,
  init?: RequestInit,
): Promise<T> {
  try {
    const response = await fetchWithTimeout(path, init)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return (await response.json()) as T
  } catch (error) {
    console.warn(`[api-client] Falling back to mock data for ${operation}:`, error)
    return fallback()
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getAllMockIssues(): Issue[] {
  return [...clone(mockIssues), ...clone(mockResolvedIssues)]
}

export async function getIssues(filters?: IssueFilters): Promise<Issue[]> {
  const params = new URLSearchParams()
  if (filters?.status && filters.status !== "all") params.set("status", filters.status)
  if (filters?.category) params.set("category", filters.category)
  if (filters?.sort) params.set("sort", filters.sort)
  if (typeof filters?.limit === "number") params.set("limit", String(filters.limit))

  const query = params.toString() ? `?${params.toString()}` : ""

  return apiFirst<Issue[]>(
    "getIssues",
    `/api/issues${query}`,
    () => {
      let issues = getAllMockIssues()

      if (filters?.status && filters.status !== "all") {
        issues = issues.filter((issue) => issue.status === filters.status)
      }
      if (filters?.category) {
        issues = issues.filter((issue) => issue.category === filters.category)
      }

      const sort = filters?.sort || "upvotes"
      if (sort === "recent") {
        issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      } else {
        issues.sort((a, b) => b.upvotes - a.upvotes)
      }

      if (typeof filters?.limit === "number") {
        issues = issues.slice(0, filters.limit)
      }

      return issues
    },
  )
}

export async function getIssueById(id: string): Promise<Issue | null> {
  return apiFirst<Issue | null>(
    "getIssueById",
    `/api/issues/${encodeURIComponent(id)}`,
    () => getAllMockIssues().find((issue) => issue.id === id) || null,
  )
}

export async function createIssue(formData: FormData): Promise<Issue> {
  return apiFirst<Issue>(
    "createIssue",
    "/api/issues",
    () => {
      const title = String(formData.get("title") || "Untitled issue")
      const description = String(formData.get("description") || "")
      const category = String(formData.get("category") || "other") as Issue["category"]
      const severity = String(formData.get("severity") || "medium") as Issue["severity"]
      const location = String(formData.get("location") || "Unknown location")
      const isAnonymous = String(formData.get("isAnonymous") || "true") === "true"

      return {
        id: `CL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
        title,
        description,
        category,
        severity,
        status: "open",
        location,
        photos: [],
        upvotes: 0,
        commentCount: 0,
        reporter: isAnonymous ? "Anonymous" : "Citizen",
        isAnonymous,
        createdAt: new Date().toISOString(),
        aiConfidence: 50,
        aiCategory: category,
        severityScore: 5,
        resolutionConfirmations: 0,
      }
    },
    {
      method: "POST",
      body: formData,
    },
  )
}

export async function upvoteIssue(id: string): Promise<{ issueId: string; upvotes: number; duplicate: boolean }> {
  return apiFirst<{ issueId: string; upvotes: number; duplicate: boolean }>(
    "upvoteIssue",
    `/api/issues/${encodeURIComponent(id)}/upvote`,
    () => {
      const issue = getAllMockIssues().find((item) => item.id === id)
      return {
        issueId: id,
        upvotes: issue ? issue.upvotes + 1 : 1,
        duplicate: false,
      }
    },
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  )
}

export async function resolveVote(id: string, vote: "yes" | "no"): Promise<{ issueId: string; yes: number; no: number; total: number; duplicate?: boolean }> {
  return apiFirst<{ issueId: string; yes: number; no: number; total: number; duplicate?: boolean }>(
    "resolveVote",
    `/api/issues/${encodeURIComponent(id)}/resolve-vote`,
    () => ({ issueId: id, yes: vote === "yes" ? 1 : 0, no: vote === "no" ? 1 : 0, total: 1, duplicate: false }),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vote }),
    },
  )
}

export async function getComments(id: string): Promise<Comment[]> {
  return apiFirst<Comment[]>(
    "getComments",
    `/api/issues/${encodeURIComponent(id)}/comments`,
    () => clone(mockComments.filter((comment) => comment.issueId === id)),
  )
}

export async function postComment(id: string, text: string, anonymous: boolean): Promise<Comment> {
  return apiFirst<Comment>(
    "postComment",
    `/api/issues/${encodeURIComponent(id)}/comments`,
    () => ({
      id: `c-${Date.now()}`,
      issueId: id,
      text,
      author: anonymous ? "Anonymous" : "Citizen",
      isAnonymous: anonymous,
      createdAt: new Date().toISOString(),
    }),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, anonymous }),
    },
  )
}

export async function getStats(): Promise<StatsResponse> {
  return apiFirst<StatsResponse>(
    "getStats",
    "/api/stats",
    () => {
      const allIssues = getAllMockIssues()
      const counts: Record<string, number> = {}
      allIssues.forEach((issue) => {
        counts[issue.category] = (counts[issue.category] || 0) + 1
      })
      const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "other"

      return {
        totalReports: allIssues.length,
        resolvedThisWeek: clone(mockResolvedIssues).length,
        activeIssues: allIssues.filter((issue) => issue.status !== "resolved").length,
        topCategory,
      }
    },
  )
}

export async function getHealth(): Promise<HealthResponse> {
  return apiFirst<HealthResponse>(
    "getHealth",
    "/api/health",
    () => ({
      ok: false,
      status: "fallback",
      timestamp: new Date().toISOString(),
      demo_mode: true,
      supabase_enabled: false,
      gemini_enabled: false,
    }),
  )
}
