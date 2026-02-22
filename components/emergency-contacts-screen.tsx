"use client"

import { useState, useMemo } from "react"
import { useLanguage } from "@/lib/language-context"
import { emergencyContacts, nationalHotlines } from "@/lib/mock-data"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"

const hotlineIcons: Record<string, typeof Shield> = {
  shield: Shield,
  ambulance: Siren,
  flame: Flame,
  zap: Zap,
  droplets: Droplets,
}

const categoryIcons = {
  police: Shield,
  medical: Heart,
  utilities: Zap,
  government: Building2,
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-title">{t("emergencyContacts")}</h1>
        <p className="page-subtitle">{t("nationalHotlines")}</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchByDistrict")}
          className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Auto-detected district */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-foreground">
          {t("autoDetectedDistrict")}: <span className="font-semibold">Colombo</span>
        </span>
      </div>

      {/* National Hotlines (always visible) */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-foreground">{t("nationalHotlines")}</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {nationalHotlines.map((hotline) => {
            const Icon = hotlineIcons[hotline.icon] || Phone
            return (
              <a
                key={hotline.number}
                href={`tel:${hotline.number}`}
                className="section-card flex min-w-[100px] flex-col items-center gap-2 p-3 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <Icon className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-xs font-semibold text-foreground">{hotline.name}</span>
                <span className="text-lg font-bold text-primary">{hotline.number}</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full">
          {(["police", "medical", "utilities", "government"] as const).map((cat) => {
            const Icon = categoryIcons[cat]
            return (
              <TabsTrigger key={cat} value={cat} className="flex flex-1 items-center gap-1 text-xs">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t(cat)}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredContacts.map((contact) => (
              <article
                key={contact.id}
                className="section-card flex flex-col gap-2 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {contact.organization}
                  </h3>
                  {contact.is247 && (
                    <Badge className="bg-primary/15 text-primary text-[10px] font-semibold">
                      {t("available247")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {contact.district}
                </div>
                <Badge className="w-fit bg-accent text-accent-foreground text-[10px]">
                  {t(contact.serviceType)}
                </Badge>
                <a
                  href={`tel:${contact.phone}`}
                  className="mt-1 flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Phone className="h-4 w-4" />
                  {contact.phone}
                </a>
              </article>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
