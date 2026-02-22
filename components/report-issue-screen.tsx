"use client"

import { useEffect, useState, useRef } from "react"
import { useLanguage } from "@/lib/language-context"
import type { IssueCategory, Severity } from "@/lib/types"
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
  Sparkles,
  Zap,
} from "lucide-react"
import { getCategoryIcon, getSeverityColor } from "@/lib/category-helpers"
import { cn } from "@/lib/utils"
import { createIssue, getIssues } from "@/lib/api-client"
import { CameraCapture } from "@/components/camera-capture"
import { saveReportDraft, getReportDraft, clearReportDraft } from "@/lib/local-store"
import type { Issue } from "@/lib/types"

const categories: { value: IssueCategory; labelKey: string; gradient: string }[] = [
  { value: "potholes", labelKey: "potholes", gradient: "from-orange-500 to-amber-500" },
  { value: "streetLights", labelKey: "streetLights", gradient: "from-yellow-500 to-amber-400" },
  { value: "garbage", labelKey: "garbage", gradient: "from-lime-500 to-green-500" },
  { value: "waterSupply", labelKey: "waterSupply", gradient: "from-sky-500 to-cyan-500" },
  { value: "roadDamage", labelKey: "roadDamage", gradient: "from-rose-500 to-red-500" },
  { value: "drainage", labelKey: "drainage", gradient: "from-blue-500 to-indigo-500" },
  { value: "publicSafety", labelKey: "publicSafety", gradient: "from-violet-500 to-purple-500" },
  { value: "other", labelKey: "other", gradient: "from-slate-500 to-gray-500" },
]

const severities: { value: Severity; labelKey: string; gradient: string; level: number }[] = [
  { value: "low", labelKey: "low", gradient: "from-sky-500 to-cyan-500", level: 1 },
  { value: "medium", labelKey: "medium", gradient: "from-amber-500 to-yellow-500", level: 2 },
  { value: "high", labelKey: "high", gradient: "from-orange-500 to-red-500", level: 3 },
  { value: "critical", labelKey: "critical", gradient: "from-rose-600 to-red-700", level: 4 },
]

const stepLabels = ["Photo", "AI Review", "Details", "Location"]

export function ReportIssueScreen() {
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
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
  const [locationText, setLocationText] = useState("")
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [reportId, setReportId] = useState("")
  const [cameraCaptureEnabled, setCameraCaptureEnabled] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [duplicates, setDuplicates] = useState<Issue[]>([])
  const [showDupWarning, setShowDupWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    const isSecure = window.isSecureContext
    setCameraCaptureEnabled(hasCamera && isSecure)

    // GAP 16 — Restore offline draft
    const draft = getReportDraft()
    if (draft && !draftRestored) {
      setTitle(draft.title)
      setDescription(draft.description)
      setLocationText(draft.locationText)
      setIsAnonymous(draft.isAnonymous)
      if (draft.urgency) setUrgency(draft.urgency as Severity)
      setDraftRestored(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // GAP 16 — Auto-save draft on key field changes
  useEffect(() => {
    if (submitted) return
    saveReportDraft({ step, title, description, category: aiCategory, urgency, locationText, isAnonymous })
  }, [step, title, description, aiCategory, urgency, locationText, isAnonymous, submitted])

  const handlePhotoCapture = () => fileInputRef.current?.click()
  const handleCameraCapture = () => setShowCameraModal(true)

  const handleCameraPhotoCapture = (imageDataUrl: string, file: File) => {
    if (photos.length >= 4) { setShowCameraModal(false); return }
    setPhotos((p) => [...p, imageDataUrl].slice(0, 4))
    setPhotoFiles((p) => [...p, file].slice(0, 4))
    setShowCameraModal(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const remaining = 4 - photos.length
    const selected = Array.from(files).slice(0, remaining)
    setPhotoFiles((p) => [...p, ...selected].slice(0, 4))
    setPhotos((p) => [...p, ...selected.map((f) => URL.createObjectURL(f))].slice(0, 4))
    e.target.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotos((p) => p.filter((_, i) => i !== index))
    setPhotoFiles((p) => p.filter((_, i) => i !== index))
  }

  const handleNextFromPhotos = () => {
    if (photos.length === 0) setPhotos(["demo"])
    setAnalyzing(true)
    setTimeout(() => { setAnalyzing(false); setStep(2) }, 2000)
  }

  // GAP 8 — Duplicate detection: check same category, open status
  const handleNextToLocation = async () => {
    try {
      const all = await getIssues()
      const dups = all.filter((i) => i.category === aiCategory && i.status !== "resolved")
      setDuplicates(dups)
      if (dups.length > 0) setShowDupWarning(true)
    } catch {
      // ignore
    }
    setStep(4)
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) { setLocationDetected(false); return }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude; const lng = pos.coords.longitude
        setDetectedCoords({ lat, lng })
        setLocationText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        setDetecting(false); setLocationDetected(true)
      },
      () => { setDetecting(false); setLocationDetected(false) },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true); setSubmitError(null)
    try {
      const fallbackId = `CL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`
      const fd = new FormData()
      fd.append("title", title.trim() || t("reportIssue"))
      fd.append("description", description.trim() || t("description"))
      fd.append("category", aiCategory)
      fd.append("severity", urgency)
      fd.append("location", locationText.trim() || (locationDetected ? "Detected location" : "Unknown location"))
      fd.append("isAnonymous", String(isAnonymous))
      if (detectedCoords) { fd.append("lat", String(detectedCoords.lat)); fd.append("lng", String(detectedCoords.lng)) }
      photoFiles.forEach((f) => fd.append("photos", f))

      const created = await createIssue(fd)
      setReportId(created.id || fallbackId)
      if (typeof created.aiConfidence === "number") setAiConfidence(created.aiConfidence)
      if (created.aiCategory) {
        const map: Record<string, IssueCategory> = {
          pothole: "potholes", potholes: "potholes", streetlight: "streetLights",
          streetlights: "streetLights", garbage: "garbage", water: "waterSupply",
          watersupply: "waterSupply", tree: "publicSafety", other: "other",
        }
        setAiCategory(map[String(created.aiCategory).toLowerCase()] || aiCategory)
      }
      clearReportDraft() // GAP 16 — clear draft after successful submit
      setSubmitted(true)
    } catch {
      setSubmitError(t("reportIssue"))
    } finally {
      setDetecting(false); setIsSubmitting(false)
    }
  }

  // ---- Submitted ----
  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 page-shell">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30">
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-bold text-foreground">{t("report.reportSubmitted")}</h2>
          <p className="text-sm text-muted-foreground">Your report has been submitted to the community</p>
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{t("report.reportId")}:</span>
            <span className="font-mono font-bold text-foreground">{reportId}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary gap-2">
            <Share2 className="h-4 w-4" />
            {t("common.share")}
          </button>
          <button className="btn-primary gap-2">
            <Map className="h-4 w-4" />
            {t("report.viewOnMap")}
          </button>
        </div>
      </div>
    )
  }

  // ---- AI Analyzing ----
  if (analyzing) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 page-shell">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/30">
          <Brain className="h-10 w-10 text-white animate-pulse" />
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-bold text-foreground">{t("report.analyzing")}</p>
          <p className="text-sm text-muted-foreground">AI is classifying your issue...</p>
        </div>
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
          <div className="h-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500 bg-[length:200%_100%]" />
        </div>
      </div>
    )
  }

  // ---- Step indicator ----
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 pb-6 pt-2">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={cn("step-dot", s === step ? "active" : s < step ? "done" : "pending")}>
              {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            <span className={cn(
              "text-[9px] font-medium hidden sm:block",
              s === step ? "text-primary" : "text-muted-foreground"
            )}>
              {stepLabels[s - 1]}
            </span>
          </div>
          {s < 4 && (
            <div className={cn(
              "h-0.5 w-8 rounded-full transition-all mb-3",
              s < step ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col page-shell">
      {/* Page header */}
      <div className="mb-2 flex flex-col gap-1">
        <h1 className="page-title">{t("reportAnIssue")}</h1>
        <p className="page-subtitle">Help improve your community in 4 simple steps</p>
      </div>

      <StepIndicator />

      {/* ---- Step 1: Photo Capture ---- */}
      {step === 1 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-foreground">{t("report.capturePhoto")}</h2>
            <p className="text-xs text-muted-foreground">Take clear photos to help AI identify the issue</p>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-sm">
                  {photo === "demo" ? (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  )}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-medium text-white">
                    {i + 1}/4
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {cameraCaptureEnabled && (
              <button
                onClick={handleCameraCapture}
                disabled={photos.length >= 4}
                className="relative flex min-h-28 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 p-6 transition-all hover:border-primary/70 hover:from-violet-500/10 hover:to-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/30">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{t("takePhoto")}</span>
                  <span className="text-xs text-muted-foreground">{photos.length}/4 photos</span>
                </div>
              </button>
            )}

            <button
              onClick={handlePhotoCapture}
              disabled={photos.length >= 4}
              className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-6 transition-all hover:border-primary/40 hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-semibold text-foreground">{t("report.uploadFromGallery")}</span>
                <span className="text-xs text-muted-foreground">{photos.length}/4 photos</span>
              </div>
            </button>
          </div>

          <button onClick={handleNextFromPhotos} className="btn-primary min-h-12">
            {t("report.next")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ---- Step 2: AI Results ---- */}
      {step === 2 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-foreground">{t("report.aiResults")}</h2>
            <p className="text-xs text-muted-foreground">Review AI analysis and adjust if needed</p>
          </div>

          {/* AI Detected Category */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/8 to-indigo-500/5 p-5">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-violet-500/10 blur-lg" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/30">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-foreground">{t("report.detectedCategory")}</span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-2.5 w-2.5" /> AI
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getCategoryIcon(aiCategory)
                    const cat = categories.find((c) => c.value === aiCategory)
                    return (
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                        cat?.gradient || "from-violet-500 to-indigo-500"
                      )}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    )
                  })()}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{t(aiCategory)}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={aiConfidence} className="h-2 flex-1" />
                      <span className="text-xs font-bold text-primary">{aiConfidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Override Category */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-foreground">{t("report.overrideCategory")}</span>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.value)
                const isSelected = aiCategory === cat.value
                return (
                  <button
                    key={cat.value}
                    onClick={() => setAiCategory(cat.value)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-xs font-semibold transition-all duration-200",
                      isSelected
                        ? "border-transparent shadow-md"
                        : "border-border text-foreground hover:border-primary/30 hover:bg-muted"
                    )}
                    style={isSelected ? { background: `linear-gradient(135deg, var(--primary) 0%, oklch(0.55 0.20 295) 100%)`, color: "white" } : {}}
                  >
                    <div className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
                      isSelected ? "bg-white/20" : cn("bg-gradient-to-br", cat.gradient)
                    )}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    {t(cat.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-foreground">{t("report.severityScore")}</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <div
                  key={n}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-all",
                    n <= 5 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("report.severityExplanation")}: Moderate structural damage detected</p>
          </div>

          {/* Duplicate Warning */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{t("report.duplicateWarning")}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 min-h-12">
              <ArrowLeft className="h-4 w-4" />
              {t("report.back")}
            </button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1 min-h-12">
              {t("report.next")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---- Step 3: Details ---- */}
      {step === 3 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-foreground">{t("report.description")}</h2>
            <p className="text-xs text-muted-foreground">Describe the issue to help authorities understand it faster</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">{t("report.issueTitle")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("report.issueTitle")}
              className="premium-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">{t("report.issueDescription")}</label>
              <span className={cn(
                "text-[11px] font-medium",
                description.length > 450 ? "text-amber-500" : "text-muted-foreground"
              )}>
                {500 - description.length} {t("report.charLimit")}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder={t("report.descriptionPlaceholder")}
              rows={4}
              className="premium-input resize-none"
            />
          </div>

          {/* Urgency selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">{t("report.urgency")}</label>
            <div className="grid grid-cols-4 gap-2">
              {severities.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setUrgency(s.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-bold transition-all duration-200",
                    urgency === s.value
                      ? "border-transparent text-white shadow-md"
                      : "border-border text-foreground hover:border-primary/30"
                  )}
                  style={urgency === s.value ? {
                    background: `linear-gradient(135deg, ${s.gradient.includes("sky") ? "#0ea5e9" : s.gradient.includes("amber") ? "#f59e0b" : s.gradient.includes("orange") ? "#f97316" : "#e11d48"}, ${s.gradient.includes("sky") ? "#06b6d4" : s.gradient.includes("amber") ? "#eab308" : s.gradient.includes("orange") ? "#ef4444" : "#be123c"})`,
                  } : {}}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: s.level }).map((_, i) => (
                      <div key={i} className={cn("h-1.5 w-1.5 rounded-full", urgency === s.value ? "bg-white/80" : "bg-muted-foreground/40")} />
                    ))}
                  </div>
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous Toggle */}
          <div className="section-card flex items-center justify-between px-4 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{t("report.anonymousToggle")}</span>
              <span className="text-xs text-muted-foreground">{t("report.anonymousExplanation")}</span>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 min-h-12">
              <ArrowLeft className="h-4 w-4" />
              {t("report.back")}
            </button>
            <button onClick={handleNextToLocation} className="btn-primary flex-1 min-h-12">
              {t("report.next")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---- Step 4: Location ---- */}
      {step === 4 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-foreground">{t("common.location")}</h2>
            <p className="text-xs text-muted-foreground">Help authorities pinpoint the exact location</p>
          </div>

          {/* GAP 8 — Duplicate warning banner */}
          {showDupWarning && duplicates.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{t("report.duplicateWarning")}</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">
                  There {duplicates.length === 1 ? "is" : "are"} already {duplicates.length} open {duplicates.length === 1 ? "issue" : "issues"} in the <strong>{duplicates[0]?.category}</strong> category. Consider checking if yours is already reported.
                </p>
              </div>
              <button onClick={() => setShowDupWarning(false)} className="text-amber-500 hover:text-amber-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleDetectLocation}
            disabled={detecting}
            className="btn-primary min-h-12"
          >
            {detecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
            {detecting ? t("report.detecting") : t("report.detectMyLocation")}
          </button>

          {locationDetected && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Location Detected</span>
                <span className="text-sm text-foreground">Colombo 07, Western Province</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">{t("report.manualAddress")}</label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder={t("report.manualAddressPlaceholder")}
              className="premium-input"
            />
          </div>

          {/* Map preview */}
          <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-gradient-to-br from-muted to-muted/50">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <MapPin className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold">Map Preview</span>
              <span className="text-[10px] text-muted-foreground">Select your location above</span>
            </div>
          </div>

          <p className="rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
            {t("report.locationPrivacy")}
          </p>

          {submitError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="btn-secondary flex-1 min-h-12">
              <ArrowLeft className="h-4 w-4" />
              {t("report.back")}
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary flex-1 min-h-12">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{t("common.submit")}</>
              ) : (
                <>{t("common.submit")}<CheckCircle2 className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      )}



      {/* Camera Modal */}
      {showCameraModal && (
        <CameraCapture
          onCapture={handleCameraPhotoCapture}
          onClose={() => setShowCameraModal(false)}
        />
      )}
    </div>
  )
}
