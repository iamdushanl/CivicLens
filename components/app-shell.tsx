"use client"

import { useState, useCallback } from "react"
import { useLanguage } from "@/lib/language-context"
import type { Issue } from "@/lib/types"
import { TopNavbar } from "./top-navbar"
import { BottomNav } from "./bottom-nav"
import { DashboardScreen } from "./dashboard-screen"
import { IssueDetailScreen } from "./issue-detail-screen"
import { ReportIssueScreen } from "./report-issue-screen"
import { EmergencyContactsScreen } from "./emergency-contacts-screen"
import { ResolvedIssuesScreen } from "./resolved-issues-screen"
import { MapScreen } from "./map-screen"
import { AnalyticsScreen } from "./analytics-screen"
import { OnboardingProvider } from "./onboarding-sheet"

export function AppShell() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("home")
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab)
    setSelectedIssue(null)
  }, [])

  const handleIssueClick = useCallback((issue: Issue) => {
    setSelectedIssue(issue)
  }, [])

  const handleBackFromDetail = useCallback(() => {
    setSelectedIssue(null)
  }, [])

  const renderContent = () => {
    if (selectedIssue) {
      return <IssueDetailScreen issue={selectedIssue} onBack={handleBackFromDetail} />
    }
    switch (activeTab) {
      case "home": return <DashboardScreen onIssueClick={handleIssueClick} />
      case "report": return <ReportIssueScreen />
      case "map": return <MapScreen />
      case "contacts": return <EmergencyContactsScreen />
      case "resolved": return <ResolvedIssuesScreen />
      case "analytics": return <AnalyticsScreen />
      default: return <DashboardScreen onIssueClick={handleIssueClick} />
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <TopNavbar onNavigate={handleNavigate} />
      <main className="mx-auto w-full max-w-5xl flex-1 pb-28">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={handleNavigate} />
      {/* GAP 17 — Onboarding (first launch only) */}
      <OnboardingProvider />
    </div>
  )
}
