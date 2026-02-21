"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { LanguageSelection } from "@/components/language-selection"
import { AppShell } from "@/components/app-shell"

export default function HomePage() {
  const { hasSelectedLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-primary">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-foreground/30 border-t-primary-foreground" />
      </div>
    )
  }

  if (!hasSelectedLanguage) {
    return <LanguageSelection />
  }

  return <AppShell />
}
