"use client"

import { useLanguage } from "@/lib/language-context"
import { Home, PlusCircle, MapPin, CheckCircle2, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: "home", icon: Home, labelKey: "home" },
  { id: "report", icon: PlusCircle, labelKey: "report" },
  { id: "map", icon: MapPin, labelKey: "map" },
  { id: "analytics", icon: BarChart2, labelKey: "analytics" },
  { id: "resolved", icon: CheckCircle2, labelKey: "resolved" },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Blur backdrop */}
      <div className="glass border-t border-border/60">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-around px-1 py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "nav-pill relative",
                  isActive ? "active" : ""
                )}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive ? "scale-110 stroke-[2.5px]" : "stroke-2"
                  )}
                />
                <span className={cn(
                  "text-[10px] font-medium transition-all",
                  isActive && "font-semibold"
                )}>
                  {t(item.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
        {/* Safe area for notch devices */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  )
}
