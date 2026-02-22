"use client"

import { useLanguage } from "@/lib/language-context"
import type { Language } from "@/lib/i18n"
import { Eye, Globe, Menu } from "lucide-react"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  Home,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Info,
  UserX,
  FileWarning,
} from "lucide-react"
import { useState } from "react"

interface TopNavbarProps {
  onNavigate: (tab: string) => void
}

const menuItems = [
  { id: "home", icon: Home, labelKey: "home" },
  { id: "report", icon: FileWarning, labelKey: "reportAnIssue" },
  { id: "priority", icon: AlertTriangle, labelKey: "priorityIssues" },
  { id: "resolved", icon: CheckCircle2, labelKey: "resolvedIssues" },
  { id: "contacts", icon: Phone, labelKey: "emergencyContacts" },
  { id: "about", icon: Info, labelKey: "about" },
]

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "si", label: "සිං" },
  { code: "ta", label: "த" },
]

export function TopNavbar({ onNavigate }: TopNavbarProps) {
  const { t, language, setLanguage } = useLanguage()
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2"
          aria-label="Go to home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Eye className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground sm:text-lg">CivicLens</span>
        </button>

        <div className="flex items-center gap-1">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Switch language"
            >
              <Globe className="h-5 w-5" />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => {
                        setLanguage(opt.code)
                        setLangOpen(false)
                      }}
                      className={`flex w-full min-w-[60px] items-center justify-center px-4 py-2.5 text-sm font-medium transition-colors ${
                        language === opt.code
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Hamburger Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Eye className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span>CivicLens</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2 pt-4" aria-label="Side navigation">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id === "priority" ? "home" : item.id)
                        setMenuOpen(false)
                      }}
                      className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      {t(item.labelKey)}
                    </button>
                  )
                })}

                {/* Anonymous Mode Toggle */}
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <UserX className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {t("anonymousMode")}
                      </span>
                    </div>
                    <Switch
                      checked={anonymousMode}
                      onCheckedChange={setAnonymousMode}
                      aria-label="Toggle anonymous mode"
                    />
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
