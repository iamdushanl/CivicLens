"use client"

import { useState, useRef } from "react"
import { useLanguage } from "@/lib/language-context"
import type { IssueCategory, Severity } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Camera,
  Upload,
  ArrowLeft,
  ArrowRight,
  Brain,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Share2,
  Map,
  X,
  ImageIcon,
} from "lucide-react"
import { getCategoryIcon, getSeverityColor } from "@/lib/category-helpers"
import { cn } from "@/lib/utils"

const categories: { value: IssueCategory; labelKey: string }[] = [
  { value: "potholes", labelKey: "potholes" },
  { value: "streetLights", labelKey: "streetLights" },
  { value: "garbage", labelKey: "garbage" },
  { value: "waterSupply", labelKey: "waterSupply" },
  { value: "roadDamage", labelKey: "roadDamage" },
  { value: "drainage", labelKey: "drainage" },
  { value: "publicSafety", labelKey: "publicSafety" },
  { value: "other", labelKey: "other" },
]

const severities: { value: Severity; labelKey: string }[] = [
  { value: "low", labelKey: "low" },
  { value: "medium", labelKey: "medium" },
  { value: "high", labelKey: "high" },
  { value: "critical", labelKey: "critical" },
]

export function ReportIssueScreen() {
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [aiCategory, setAiCategory] = useState<IssueCategory>("potholes")
  const [aiConfidence, setAiConfidence] = useState(92)
  const [severity, setSeverity] = useState<Severity>("high")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [urgency, setUrgency] = useState<Severity>("medium")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [locationDetected, setLocationDetected] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPhotos: string[] = []
    for (let i = 0; i < Math.min(files.length, 4 - photos.length); i++) {
      newPhotos.push(URL.createObjectURL(files[i]))
    }
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 4))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNextFromPhotos = () => {
    if (photos.length === 0) {
      // Simulate photo for demo
      setPhotos(["demo"])
    }
    setAnalyzing(true)
    setTimeout(() => {
      setAnalyzing(false)
      setStep(2)
    }, 2000)
  }

  const handleDetectLocation = () => {
    setDetecting(true)
    setTimeout(() => {
      setDetecting(false)
      setLocationDetected(true)
    }, 1500)
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const reportId = `CL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`

  // Step indicators
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-4">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
              s === step
                ? "bg-primary text-primary-foreground"
                : s < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
          </div>
          {s < 4 && (
            <div
              className={cn(
                "h-0.5 w-6 rounded-full transition-all",
                s < step ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">
        {t("step")} {step} {t("of")} 4
      </span>
    </div>
  )

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-12">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold text-foreground">{t("reportSubmitted")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("reportId")}: <span className="font-mono font-semibold text-foreground">{reportId}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
            <Share2 className="h-4 w-4" />
            {t("share")}
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Map className="h-4 w-4" />
            {t("viewOnMap")}
          </button>
        </div>
      </div>
    )
  }

  if (analyzing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">{t("aiAnalyzing")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-4 pb-24">
      <StepIndicator />

      {/* Step 1: Photo Capture */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-foreground">{t("capturePhoto")}</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                >
                  {photo === "demo" ? (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  )}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-background transition-opacity"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Camera button */}
          <button
            onClick={handlePhotoCapture}
            disabled={photos.length >= 4}
            className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/50 p-6 transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
          >
            <Camera className="h-10 w-10 text-primary" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold text-foreground">{t("capturePhoto")}</span>
              <span className="text-xs text-muted-foreground">{t("dragDropUpload")}</span>
              <span className="text-xs text-muted-foreground">
                {t("upTo4Photos")} ({photos.length}/4)
              </span>
            </div>
          </button>

          <button
            onClick={handleNextFromPhotos}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("next")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: AI Results */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-foreground">{t("aiResults")}</h2>

          {/* AI Detected Category */}
          <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">{t("detectedCategory")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                {(() => {
                  const Icon = getCategoryIcon(aiCategory)
                  return <Icon className="h-5 w-5 text-primary" />
                })()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{t(aiCategory)}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={aiConfidence} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-primary">{aiConfidence}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Override Category */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-foreground">{t("overrideCategory")}</span>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.value)
                return (
                  <button
                    key={cat.value}
                    onClick={() => setAiCategory(cat.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all",
                      aiCategory === cat.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/30"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(cat.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-foreground">{t("severityScore")}</span>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[70%] rounded-full bg-warning" />
            </div>
            <p className="text-xs text-muted-foreground">{t("severityExplanation")}: Moderate structural damage detected</p>
          </div>

          {/* Duplicate Warning */}
          <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-warning-foreground" />
            <span className="text-xs font-medium text-warning-foreground">{t("duplicateWarning")}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("next")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-foreground">{t("description")}</h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">{t("issueTitle")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("issueTitle")}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{t("issueDescription")}</label>
              <span className="text-xs text-muted-foreground">
                {500 - description.length} {t("charLimit")}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder={t("issueDescription")}
              rows={4}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Urgency selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">{t("urgency")}</label>
            <div className="flex gap-2">
              {severities.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setUrgency(s.value)}
                  className={cn(
                    "flex flex-1 min-h-[44px] items-center justify-center rounded-lg border-2 px-2 py-2 text-xs font-semibold transition-all",
                    urgency === s.value
                      ? cn("border-transparent", getSeverityColor(s.value))
                      : "border-border text-foreground hover:border-primary/30"
                  )}
                >
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{t("anonymousToggle")}</span>
              <span className="text-xs text-muted-foreground">{t("anonymousExplanation")}</span>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("next")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Location */}
      {step === 4 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-foreground">{t("location")}</h2>

          <button
            onClick={handleDetectLocation}
            disabled={detecting}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/5 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
          >
            {detecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
            {detecting ? "Detecting..." : t("detectMyLocation")}
          </button>

          {locationDetected && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Colombo 07, Western Province</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">{t("manualAddress")}</label>
            <input
              type="text"
              placeholder={t("manualAddress")}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Map preview */}
          <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-muted">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <MapPin className="h-6 w-6" />
              <span className="text-xs font-medium">Map Preview</span>
            </div>
          </div>

          {/* Privacy notice */}
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {t("locationPrivacy")}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>
            <button
              onClick={handleSubmit}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("submit")}
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
