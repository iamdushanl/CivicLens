"use client"

import type { Issue } from "@/lib/types"
import { DashboardScreen } from "@/components/dashboard-screen"

export default function LocaleDashboardPage() {
  const handleIssueClick = (_issue: Issue) => {
    // Navigation to issue detail will be wired up in Task 6
  }

  return <DashboardScreen onIssueClick={handleIssueClick} />
}

