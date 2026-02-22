"use client"

import { useLanguage } from "@/lib/language-context"
import { Home, PlusCircle, MapPin, Phone, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: "home", icon: Home, labelKey: "home" },
  { id: "report", icon: PlusCircle, labelKey: "report" },
  { id: "map", icon: MapPin, labelKey: "map" },
  { id: "contacts", icon: Phone, labelKey: "contacts" },
  { id: "menu", icon: Menu, labelKey: "menu" },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
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
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>
                {t(item.labelKey)}
              </span>
            </button>
          )
        })}
      </div>
      {/* Safe area for notch devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
