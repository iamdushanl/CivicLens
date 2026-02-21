"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const PWA_PROMPT_SHOWN_KEY = "civiclens-pwa-prompt-shown"

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const alreadyShown = sessionStorage.getItem(PWA_PROMPT_SHOWN_KEY)
    if (alreadyShown === "true") return

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setOpen(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  }, [mounted])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      sessionStorage.setItem(PWA_PROMPT_SHOWN_KEY, "true")
    }
    setDeferredPrompt(null)
    setOpen(false)
  }

  const handleDismiss = () => {
    sessionStorage.setItem(PWA_PROMPT_SHOWN_KEY, "true")
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t px-6 pb-8 pt-6"
      >
        <SheetHeader>
          <SheetTitle className="text-center text-lg">
            Add CivicLens to your home screen for quick access
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={handleInstall}
            className="w-full"
          >
            Install
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full"
          >
            Dismiss
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
