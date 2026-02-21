"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { type Language, translations } from "./i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  hasSelectedLanguage: boolean
  setHasSelectedLanguage: (val: boolean) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)
const LANGUAGE_STORAGE_KEY = "civicLensLanguage"
const LANGUAGE_SELECTED_KEY = "civicLensLanguageSelected"

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
      const selectedFlag = localStorage.getItem(LANGUAGE_SELECTED_KEY) === "true"
      
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "si" || savedLanguage === "ta")) {
        setLanguageState(savedLanguage)
      }
      
      if (selectedFlag) {
        setHasSelectedLanguage(true)
      }
    }
    setMounted(true)
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
      localStorage.setItem(LANGUAGE_SELECTED_KEY, "true")
      // Also set cookie for next-intl if it's ever used
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`
    }
  }, [])

  const t = useCallback(
    (key: string) => {
      return translations[language]?.[key] || translations.en[key] || key
    },
    [language]
  )

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, hasSelectedLanguage, setHasSelectedLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
