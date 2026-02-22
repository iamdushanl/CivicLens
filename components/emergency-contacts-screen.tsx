"use client"

import { useState, useMemo } from "react"
import { useLanguage } from "@/lib/language-context"
import { emergencyContacts, nationalHotlines } from "@/lib/mock-data"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Search,
  MapPin,
  Phone,
  Shield,
  Heart,
  Zap,
  Building2,
  Flame,
  Droplets,
  Siren,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const hotlineIcons: Record<string, typeof Shield> = {
  shield: Shield,
  ambulance: Siren,
  flame: Flame,
  zap: Zap,
  droplets: Droplets,
}

const hotlineColors: Record<string, string> = {
  shield: "from-blue-600 to-indigo-600",
  ambulance: "from-rose-500 to-red-600",
  flame: "from-orange-500 to-red-500",
  zap: "from-amber-500 to-yellow-500",
  droplets: "from-sky-500 to-cyan-500",
}

const categoryConfig = {
  police: { icon: Shield, gradient: "from-blue-600 to-indigo-600", label: "police" },
  medical: { icon: Heart, gradient: "from-rose-500 to-pink-500", label: "medical" },
  utilities: { icon: Zap, gradient: "from-amber-500 to-orange-500", label: "utilities" },
  government: { icon: Building2, gradient: "from-violet-500 to-purple-600", label: "government" },
}

export function EmergencyContactsScreen() {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("police")

  const filteredContacts = useMemo(() => {
    return emergencyContacts.filter((c) => {
      const matchesCategory = c.serviceType === activeCategory
      const matchesSearch =
        search === "" ||
        c.organization.toLowerCase().includes(search.toLowerCase()) ||
        c.district.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, search])

  return (
    <div className="flex flex-col gap-6 page-shell">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 p-6 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-rose-300/20 blur-xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold backdrop-blur-sm">
              <AlertTriangle className="h-3 w-3 text-yellow-300" />
              Emergency Ready
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">{t("emergencyContacts")}</h1>
          <p className="mt-1.5 text-sm text-white/75">{t("nationalHotlines")}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchByDistrict")}
          className="premium-input pl-11"
        />
      </div>

      {/* Auto-detected district */}
      <div className="flex items-center gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
          <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <span className="text-sm text-foreground">
          {t("autoDetectedDistrict")}: <span className="font-bold text-violet-600 dark:text-violet-400">Colombo</span>
        </span>
      </div>

      {/* National Hotlines */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-foreground">{t("nationalHotlines")}</h2>
        <div className="flex gap-3 overflow-x-auto pb-3">
          {nationalHotlines.map((hotline) => {
            const Icon = hotlineIcons[hotline.icon] || Phone
            const gradient = hotlineColors[hotline.icon] || "from-violet-600 to-indigo-600"
            return (
              <a
                key={hotline.number}
                href={`tel:${hotline.number}`}
                className="hotline-card group"
              >
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform group-hover:scale-105",
                  gradient
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{hotline.name}</span>
                <span className="text-lg font-bold text-primary">{hotline.number}</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full rounded-xl bg-muted/60 p-1">
          {(["police", "medical", "utilities", "government"] as const).map((cat) => {
            const cfg = categoryConfig[cat]
            const Icon = cfg.icon
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="flex flex-1 items-center gap-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-card"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t(cat)}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredContacts.map((contact) => {
              const cfg = categoryConfig[contact.serviceType as keyof typeof categoryConfig] || categoryConfig.police
              return (
                <article
                  key={contact.id}
                  className="section-card-hover flex flex-col gap-3 overflow-hidden"
                >
                  <div className={cn("h-1 w-full bg-gradient-to-r", cfg.gradient)} />
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug">
                        {contact.organization}
                      </h3>
                      {contact.is247 && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t("available247")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {contact.district}
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all bg-gradient-to-r shadow-md hover:shadow-lg hover:-translate-y-0.5",
                        cfg.gradient
                      )}
                    >
                      <Phone className="h-4 w-4" />
                      {contact.phone}
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
