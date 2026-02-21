"use client"

import { useLanguage } from "@/lib/language-context"
import type { Language } from "@/lib/i18n"
import { SriLankaMap } from "./sri-lanka-map"
import { Eye } from "lucide-react"

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
]

export function LanguageSelection() {
  const { setLanguage, setHasSelectedLanguage } = useLanguage()

  const handleSelect = (lang: Language) => {
    setLanguage(lang)
    setHasSelectedLanguage(true)
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-primary px-6 py-12">
      {/* Animated background map */}
      <div className="absolute inset-0 flex items-center justify-center">
        <SriLankaMap className="h-[500px] w-[400px] animate-pulse text-primary-foreground opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
            <Eye className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">
            CivicLens
          </h1>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-medium text-primary-foreground/80">
              See Your City. Shape Its Future.
            </p>
            <p className="text-sm text-primary-foreground/60">
              ඔබේ නගරය බලන්න. එහි අනාගතය හැඩගස්වන්න.
            </p>
            <p className="text-sm text-primary-foreground/60">
              உங்கள் நகரத்தைப் பாருங்கள். அதன் எதிர்காலத்தை வடிவமையுங்கள்.
            </p>
          </div>
        </div>

        {/* Language buttons */}
        <div className="flex w-full flex-col gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="group flex w-full items-center justify-center gap-3 rounded-xl border-2 border-primary-foreground/20 bg-primary-foreground/10 px-6 py-4 backdrop-blur-sm transition-all hover:border-primary-foreground/40 hover:bg-primary-foreground/20 active:scale-[0.98]"
            >
              <span className="text-lg font-semibold text-primary-foreground">
                {lang.nativeName}
              </span>
            </button>
          ))}
        </div>

        {/* Powered by */}
        <p className="text-center text-xs text-primary-foreground/50">
          Powered by BCS Student Chapter — KDU
        </p>
      </div>
    </div>
  )
}
