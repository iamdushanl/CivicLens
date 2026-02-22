"use client"

/**
 * GAP 10 — Address Autocomplete
 * Uses OpenStreetMap Nominatim (free, no API key needed)
 * Filters to Sri Lanka (countrycodes=lk) for relevance
 */

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Loader2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AddressSuggestion {
    display_name: string
    lat: string
    lon: string
    address: {
        road?: string
        suburb?: string
        city?: string
        town?: string
        village?: string
        state?: string
        postcode?: string
    }
}

interface AddressAutocompleteProps {
    value: string
    onChange: (value: string, coords?: { lat: number; lng: number }) => void
    placeholder?: string
    className?: string
}

export function AddressAutocomplete({ value, onChange, placeholder = "Enter street address…", className }: AddressAutocompleteProps) {
    const [query, setQuery] = useState(value)
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync external value changes
    useEffect(() => { setQuery(value) }, [value])

    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.trim().length < 3) { setSuggestions([]); setOpen(false); return }
        setLoading(true)
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=lk`
            const res = await fetch(url, { headers: { "Accept-Language": "en" } })
            const data: AddressSuggestion[] = await res.json()
            setSuggestions(data)
            setOpen(data.length > 0)
        } catch {
            setSuggestions([])
        } finally {
            setLoading(false)
        }
    }, [])

    const handleInput = (val: string) => {
        setQuery(val)
        onChange(val) // update parent with raw text immediately
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 400)
    }

    const handleSelect = (s: AddressSuggestion) => {
        const shortName = [
            s.address.road,
            s.address.suburb || s.address.village || s.address.town || s.address.city,
            s.address.state,
        ].filter(Boolean).join(", ")
        const label = shortName || s.display_name.split(",").slice(0, 3).join(",").trim()
        setQuery(label)
        setSuggestions([])
        setOpen(false)
        onChange(label, { lat: parseFloat(s.lat), lng: parseFloat(s.lon) })
    }

    const handleClear = () => {
        setQuery("")
        setSuggestions([])
        setOpen(false)
        onChange("")
    }

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <div className={cn(
                "flex items-center gap-2.5 rounded-2xl border bg-card px-4 py-3 transition-all",
                open ? "border-violet-500/60 ring-1 ring-violet-500/20 shadow-sm shadow-violet-500/10" : "border-border"
            )}>
                {loading ? (
                    <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-violet-500" />
                ) : (
                    <Search className={cn("h-4 w-4 flex-shrink-0 transition-colors", open ? "text-violet-500" : "text-muted-foreground")} />
                )}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleInput(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {query && (
                    <button onClick={handleClear} className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {/* Suggestions dropdown */}
            {open && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/10 animate-fade-in-scale">
                    {suggestions.map((s, i) => {
                        const parts = s.display_name.split(",")
                        const main = parts.slice(0, 2).join(",").trim()
                        const sub = parts.slice(2, 4).join(",").trim()
                        return (
                            <button
                                key={i}
                                onClick={() => handleSelect(s)}
                                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 border-b border-border/50 last:border-0"
                            >
                                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                                    <MapPin className="h-3.5 w-3.5 text-violet-500" />
                                </div>
                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                    <span className="truncate text-xs font-semibold text-foreground">{main}</span>
                                    <span className="truncate text-[11px] text-muted-foreground">{sub}</span>
                                </div>
                            </button>
                        )
                    })}
                    <div className="border-t border-border/50 px-4 py-2 text-[10px] text-muted-foreground">
                        📍 Powered by OpenStreetMap
                    </div>
                </div>
            )}
        </div>
    )
}
