"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { IssueDetailScreen } from "@/components/issue-detail-screen"
import { getIssueById } from "@/lib/api-client"
import type { Issue } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface IssueDetailPageProps {
  params: {
    locale: string
    id: string
  }
}

export default function IssueDetailPage({ params }: IssueDetailPageProps) {
  const router = useRouter()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadIssue = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getIssueById(params.id)
        if (!active) return
        if (data) {
          setIssue(data)
        } else {
          setError("Issue not found")
        }
      } catch {
        if (!active) return
        setError("Unable to load issue")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadIssue()

    return () => {
      active = false
    }
  }, [params.id])

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading issue...</p>
        </div>
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-foreground">{error || "Issue not found"}</p>
          <button
            onClick={handleBack}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <IssueDetailScreen issue={issue} onBack={handleBack} />
}

