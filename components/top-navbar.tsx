"use client"

import { useLanguage } from "@/lib/language-context"
import type { Language } from "@/lib/i18n"
import { Globe, Menu, Sun, Moon, UserX, Home, AlertTriangle, CheckCircle2, Phone, Info, FileWarning, BarChart2, Heart } from "lucide-react"
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
  { id: "home", icon: Home, label: "Issues", color: "bg-slate-100 text-slate-600" },
  { id: "report", icon: FileWarning, label: "Report an Issue", color: "bg-primary/10 text-primary" },
  { id: "resolved", icon: CheckCircle2, label: "Resolved Issues", color: "bg-green-50 text-green-700" },
  { id: "analytics", icon: BarChart2, label: "Analytics", color: "bg-sky-50 text-sky-700" },
  { id: "contacts", icon: Phone, label: "Emergency Contacts", color: "bg-orange-50 text-orange-700" },
  { id: "about", icon: Info, label: "About CivicLens", color: "bg-slate-50 text-slate-600" },
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
    <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between px-4">

        {/* Left: Hamburger menu */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>

          {/* SCF-style sidebar */}
          <SheetContent side="left" className="w-72 p-0 border-r border-border">
            {/* Sidebar header — SCF cyan */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border" style={{ background: "var(--scf-blue)" }}>
              <SheetTitle className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Heart className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-white leading-none">CivicLens</p>
                  <p className="text-[10px] text-white/80 font-medium mt-0.5">Sri Lanka</p>
                </div>
              </SheetTitle>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col py-2" aria-label="Side navigation">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMenuOpen(false) }}
                    className="flex items-center gap-3.5 px-5 py-3.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg", item.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Settings */}
            <div className="border-t border-border mx-4 pt-3 flex flex-col gap-2">
              {/* Anonymous Mode */}
              <div className="flex items-center justify-between px-1 py-2.5">
                <div className="flex items-center gap-2.5">
                  <UserX className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground leading-none">{t("report.anonymousToggle")}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t("report.anonymousExplanation")}</p>
                  </div>
                </div>
                <Switch checked={anonymousMode} onCheckedChange={setAnonymousMode} aria-label="Toggle anonymous mode" />
              </div>
              {/* Dark Mode */}
              <div className="flex items-center justify-between px-1 py-2.5">
                <div className="flex items-center gap-2.5">
                  {dark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                  <p className="text-sm font-medium text-foreground">Dark Mode</p>
                </div>
                <Switch checked={dark} onCheckedChange={toggleDark} aria-label="Toggle dark mode" />
              </div>
              <span className="text-[10px] text-white/50 absolute bottom-1 right-1">v1.2.1-deploy-fix</span>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: App title — SCF shows city name / screen title */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 group"
          aria-label="Go to home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--scf-blue)" }}>
            <Heart className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">CivicLens</span>
        </button>

        {/* Right: Language + Notification */}
        <div className="flex items-center gap-1">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Switch language"
            >
              <Globe className="h-4 w-4" />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-border bg-card shadow-lg min-w-[130px] animate-fade-in">
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => { setLanguage(opt.code); setLangOpen(false) }}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors",
                        language === opt.code
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="text-xs font-bold w-6">{opt.flag}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notification Bell */}
          <NotificationBell onClick={() => setNotifOpen(true)} />
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>
      </div>
    </header>
  )
}
