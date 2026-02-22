"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, MapPin, Camera, Share2, X, Eye } from "lucide-react"
import { hasCompletedOnboarding, completeOnboarding } from "@/lib/local-store"
import { cn } from "@/lib/utils"

const steps = [
    {
        icon: Eye,
        gradient: "from-violet-600 to-indigo-600",
        title: "See community issues",
        description: "View all reported civic issues near you on the map or in the list. Upvote issues that you've also noticed.",
    },
    {
        icon: Camera,
        gradient: "from-rose-500 to-pink-500",
        title: "Report in 60 seconds",
        description: "Take a photo, let our AI classify the issue, confirm the location, and submit. It's that simple.",
    },
    {
        icon: MapPin,
        gradient: "from-emerald-500 to-teal-500",
        title: "Track & follow",
        description: "Follow issues to get notified of status updates. Watch as your community resolves reported problems.",
    },
    {
        icon: Share2,
        gradient: "from-amber-500 to-orange-500",
        title: "Amplify with sharing",
        description: "Share issues to WhatsApp or copy a link to spread awareness and get faster resolution.",
    },
]

interface OnboardingSheetProps {
    onDone: () => void
}

function OnboardingSheet({ onDone }: OnboardingSheetProps) {
    const [step, setStep] = useState(0)
    const isLast = step === steps.length - 1
    const current = steps[step]
    const Icon = current.icon

    const handleNext = () => {
        if (isLast) {
            completeOnboarding()
            onDone()
        } else {
            setStep((s) => s + 1)
        }
    }

    const handleSkip = () => {
        completeOnboarding()
        onDone()
    }

    return (
        <div className="fixed inset-0 z-[300] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-card pb-safe animate-slide-up">
                {/* Skip button */}
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    i === step ? "w-6 bg-gradient-to-r from-violet-600 to-indigo-600" : "w-1.5 bg-muted"
                                )}
                            />
                        ))}
                    </div>
                    <button onClick={handleSkip} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center gap-6 px-6 py-8 text-center">
                    <div className={cn(
                        "flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br shadow-lg",
                        current.gradient,
                        "shadow-violet-500/20"
                    )}>
                        <Icon className="h-9 w-9 text-white" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-black text-foreground">{current.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{current.description}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 px-6 pb-8">
                    <button
                        onClick={handleNext}
                        className={cn(
                            "flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r text-sm font-bold text-white shadow-md transition-all hover:shadow-lg",
                            current.gradient,
                            "shadow-violet-500/25"
                        )}
                    >
                        {isLast ? (
                            <><CheckCircle2 className="mr-2 h-4 w-4" /> Get Started</>
                        ) : "Next →"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Auto-shows on first visit ──
export function OnboardingProvider() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // Small delay to let the app render first
        const t = setTimeout(() => {
            if (!hasCompletedOnboarding()) setShow(true)
        }, 800)
        return () => clearTimeout(t)
    }, [])

    if (!show) return null
    return <OnboardingSheet onDone={() => setShow(false)} />
}
