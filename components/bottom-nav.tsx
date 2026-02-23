"use client"

import { useLanguage } from "@/lib/language-context"
import { Plus, List, MapPin, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

/* SeeClickFix uses exactly 4 tabs: Report · Issues · Map · Profile */
const navItems = [
  { id: "report", icon: Plus, labelKey: "nav.report", ariaLabel: "Report an issue" },
  { id: "home", icon: List, labelKey: "nav.home", ariaLabel: "Browse issues" },
  { id: "map", icon: MapPin, labelKey: "nav.map", ariaLabel: "View map" },
  { id: "profile", icon: User, labelKey: "nav.profile", ariaLabel: "My profile" },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      role="tablist"
      aria-label="Main navigation"
      style={{ boxShadow: "0 -1px 6px rgba(0,0,0,0.08)" }}
    >
      <div className="mx-auto flex w-full max-w-2xl items-stretch">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          const isReport = item.id === "report"

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-label={item.ariaLabel}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "scf-nav-tab flex-1 min-w-0 flex flex-col items-center justify-center py-2 px-1",
                isActive ? "active" : "",
                isReport && isActive && "text-primary"
              )}
            >
              {/* Report tab gets a special + circle like SCF */}
              {isReport ? (
                <div className={cn(
                  "flex items-center justify-center rounded-full w-10 h-10 transition-all duration-150",
                  isActive
                    ? "bg-primary shadow-md shadow-primary/30"
                    : "bg-muted border border-border"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-white stroke-[2.5px]" : "text-muted-foreground stroke-2"
                  )} />
                </div>
              ) : (
                <Icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "stroke-[2.5px]" : "stroke-[1.75px]"
                )} />
              )}
              <span className={cn(
                "text-[10px] font-medium transition-colors leading-none",
                isActive ? "font-semibold" : ""
              )}>
                {/* Show label as short SCF tab names */}
                {item.id === "report" ? t("nav.report").split(" ")[0] : // "Report"
                  item.id === "home" ? "Issues" :
                    item.id === "map" ? t("nav.map") :
                      item.id === "profile" ? "Profile" : ""}
              </span>
            </button>
          )
        })}
      </div>
      {/* iOS safe-area bottom padding */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background" />
    </nav>
  )
}
