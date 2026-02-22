"use client"

import { useLanguage } from "@/lib/language-context"
import type { Language } from "@/lib/i18n"
import { Eye, Globe, Menu, Sparkles, Sun, Moon, UserX, Home, AlertTriangle, CheckCircle2, Phone, Info, FileWarning, BarChart2 } from "lucide-react"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { NotificationBell, NotificationPanel } from "@/components/notification-panel"

interface TopNavbarProps {
  onNavigate: (tab: string) => void
}

const menuItems = [
  { id: "home", icon: Home, labelKey: "home", gradient: "from-violet-500 to-indigo-500" },
  { id: "report", icon: FileWarning, labelKey: "reportAnIssue", gradient: "from-rose-500 to-pink-500" },
  { id: "analytics", icon: BarChart2, labelKey: "analytics", gradient: "from-sky-500 to-cyan-500" },
  { id: "resolved", icon: CheckCircle2, labelKey: "resolvedIssues", gradient: "from-emerald-500 to-teal-500" },
  { id: "contacts", icon: Phone, labelKey: "emergencyContacts", gradient: "from-amber-500 to-orange-500" },
  { id: "about", icon: Info, labelKey: "about", gradient: "from-slate-500 to-gray-500" },
]

const languageOptions: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "EN" },
  { code: "si", label: "සිංහල", flag: "සිං" },
  { code: "ta", label: "தமிழ்", flag: "த" },
]

export function TopNavbar({ onNavigate }: TopNavbarProps) {
  const { t, language, setLanguage } = useLanguage()
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  // GAP 13 — Dark mode toggle
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem("cl_dark_mode")
    if (stored === "true" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
      setDark(true)
    }
  }, [])
  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("cl_dark_mode", String(next))
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 group"
          aria-label="Go to home"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/30 transition-transform group-hover:scale-105">
            <Eye className="h-5 w-5 text-white" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight gradient-text leading-none">CivicLens</span>
            <span className="text-[9px] font-medium text-muted-foreground leading-none mt-0.5">Sri Lanka</span>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {/* GAP 2 — Notification Bell */}
          <NotificationBell onClick={() => setNotifOpen(true)} />
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={cn(
                "flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
                langOpen
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-label="Switch language"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">
                {languageOptions.find((o) => o.code === language)?.flag}
              </span>
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/10 min-w-[140px] animate-fade-in-scale">
                  <div className="p-1.5">
                    {languageOptions.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => {
                          setLanguage(opt.code)
                          setLangOpen(false)
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          language === opt.code
                            ? "bg-gradient-to-r from-violet-500/20 to-indigo-500/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <span className="text-base">{opt.flag}</span>
                        <span className="text-xs">{opt.label}</span>
                        {language === opt.code && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Hamburger Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl transition-all duration-200",
                  menuOpen
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 border-border/60">
              {/* Sidebar Header */}
              <div className="relative overflow-hidden border-b border-border/60 px-6 py-6">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-indigo-500/5 to-transparent" />
                <SheetTitle className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/30">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold gradient-text">CivicLens</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Civic Issue Reporter</p>
                  </div>
                </SheetTitle>
                <div className="relative mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5">
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">AI-Powered Reporting</span>
                </div>
              </div>

              <nav className="flex flex-col gap-1 p-3 pt-4" aria-label="Side navigation">
                {menuItems.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id === "priority" ? "home" : item.id)
                        setMenuOpen(false)
                      }}
                      className={cn(
                        "flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted group",
                        `stagger-${Math.min(i + 1, 4)} animate-slide-up`
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm",
                        item.gradient.replace("from-", "from-").replace("to-", "to-"),
                        item.gradient
                      )}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="flex-1 text-left">{t(item.labelKey)}</span>
                    </button>
                  )
                })}

                {/* Settings Toggles */}
                <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-4">
                  {/* Anonymous Mode */}
                  <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10">
                        <UserX className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">{t("anonymousMode")}</span>
                        <span className="text-[10px] text-muted-foreground">Hide your identity</span>
                      </div>
                    </div>
                    <Switch checked={anonymousMode} onCheckedChange={setAnonymousMode} aria-label="Toggle anonymous mode" />
                  </div>

                  {/* GAP 13 — Dark Mode Toggle */}
                  <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                        {dark ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">Dark Mode</span>
                        <span className="text-[10px] text-muted-foreground">{dark ? "Currently dark" : "Currently light"}</span>
                      </div>
                    </div>
                    <Switch checked={dark} onCheckedChange={toggleDark} aria-label="Toggle dark mode" />
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
