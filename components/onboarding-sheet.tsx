"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, MapPin, Camera, Share2, Heart } from "lucide-react"
import { hasCompletedOnboarding, completeOnboarding } from "@/lib/local-store"
import { cn } from "@/lib/utils"

/* SeeClickFix splash: solid cyan bg, white logo, city skyline, Register/Sign In */
const steps = [
    {
        icon: Camera,
        title: "Report in 60 seconds",
        description: "Take a photo, let our AI classify the issue, confirm the location, and submit.",
    },
    {
        icon: MapPin,
        title: "Track & follow issues",
        description: "Follow issues to get notified of status updates as your community resolves them.",
    },
    {
        icon: Heart,
        title: "Connect with your community",
        description: "Upvote issues, leave comments, and help officials prioritize what matters most.",
    },
    {
        icon: Share2,
        title: "Amplify with sharing",
        description: "Share issues to WhatsApp or copy a link to spread awareness and get faster resolution.",
    },
]

interface OnboardingSheetProps {
    onDone: () => void
}

function OnboardingSheet({ onDone }: OnboardingSheetProps) {
    const [showSteps, setShowSteps] = useState(false)
    const [step, setStep] = useState(0)

    const handleGetStarted = () => setShowSteps(true)
    const handleSignIn = () => { completeOnboarding(); onDone() }

    const handleNext = () => {
        if (step === steps.length - 1) { completeOnboarding(); onDone() }
        else setStep((s) => s + 1)
    }

    if (showSteps) {
        const current = steps[step]
        const Icon = current.icon
        const isLast = step === steps.length - 1
        return (
            <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "var(--scf-cyan)" }}>
                {/* Skip */}
                <div className="flex items-center justify-between px-6 pt-12 pb-4">
                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 rounded-full bg-white transition-all duration-300",
                                    i === step ? "w-8 opacity-100" : "w-1.5 opacity-40"
                                )}
                            />
                        ))}
                    </div>
                    <button onClick={handleSignIn} className="text-xs font-semibold text-white/80 hover:text-white px-2 py-1">
                        Skip
                    </button>
                </div>

                {/* Icon */}
                <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8 text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Icon className="h-11 w-11 text-white" />
                    </div>
                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-black text-white leading-tight">{current.title}</h2>
                        <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto">{current.description}</p>
                    </div>
                </div>

                {/* Next button */}
                <div className="px-6 pb-12">
                    <button
                        onClick={handleNext}
                        className="w-full rounded-full bg-white py-4 text-sm font-bold transition-all active:scale-[0.98]"
                        style={{ color: "var(--scf-cyan)" }}
                    >
                        {isLast ? "Get Started" : "Next →"}
                    </button>
                </div>
            </div>
        )
    }

    /* SeeClickFix-style splash screen */
    return (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-between" style={{ background: "var(--scf-cyan)" }}>
            {/* City silhouette decoration */}
            <div className="w-full h-40 flex items-end justify-center opacity-20 overflow-hidden mt-8">
                <svg viewBox="0 0 360 120" fill="none" className="w-full">
                    {/* Simplified city skyline */}
                    <rect x="0" y="60" width="40" height="60" rx="2" fill="white" />
                    <rect x="45" y="40" width="30" height="80" rx="2" fill="white" />
                    <rect x="10" y="50" width="20" height="10" fill="var(--scf-cyan)" />
                    <rect x="80" y="70" width="35" height="50" rx="2" fill="white" />
                    <rect x="120" y="30" width="25" height="90" rx="2" fill="white" />
                    <rect x="150" y="50" width="40" height="70" rx="2" fill="white" />
                    <rect x="195" y="20" width="30" height="100" rx="2" fill="white" />
                    <rect x="200" y="10" width="20" height="15" fill="white" />
                    <rect x="230" y="45" width="35" height="75" rx="2" fill="white" />
                    <rect x="270" y="55" width="25" height="65" rx="2" fill="white" />
                    <rect x="300" y="35" width="30" height="85" rx="2" fill="white" />
                    <rect x="335" y="60" width="25" height="60" rx="2" fill="white" />
                </svg>
            </div>

            {/* Logo */}
            <div className="flex flex-col items-center gap-5 px-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <Heart className="h-10 w-10 fill-current" style={{ color: "var(--scf-cyan)" }} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">Welcome To</p>
                    <h1 className="text-4xl font-black text-white tracking-tight">CivicLens</h1>
                    <p className="text-sm text-white/80 mt-3 leading-relaxed max-w-xs">
                        Submit requests, see them get fixed, connect to your neighbors and local officials.
                    </p>
                </div>
            </div>

            {/* Buttons — SCF: Register (outlined) + Sign In (text) */}
            <div className="w-full px-8 pb-16 flex flex-col gap-3">
                <button
                    onClick={handleGetStarted}
                    className="w-full rounded-full border-2 border-white py-4 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                >
                    Get Started
                </button>
                <button
                    onClick={handleSignIn}
                    className="w-full rounded-full bg-white py-4 text-sm font-bold transition-all active:scale-[0.98]"
                    style={{ color: "var(--scf-cyan)" }}
                >
                    Continue as Guest
                </button>
            </div>
        </div>
    )
}

export function OnboardingProvider() {
    const [show, setShow] = useState(false)
    useEffect(() => {
        const timer = setTimeout(() => { if (!hasCompletedOnboarding()) setShow(true) }, 800)
        return () => clearTimeout(timer)
    }, [])
    if (!show) return null
    return <OnboardingSheet onDone={() => setShow(false)} />
}
