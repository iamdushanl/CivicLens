"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { type Language, translations } from "./i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  hasSelectedLanguage: boolean
  setHasSelectedLanguage: (val: boolean) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false)

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
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
