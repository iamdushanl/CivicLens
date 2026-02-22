import en from "@/messages/en.json"
import si from "@/messages/si.json"
import ta from "@/messages/ta.json"

export type Language = "en" | "si" | "ta"

type TranslationValue = string | { [key: string]: TranslationValue }
type TranslationObject = { [key: string]: TranslationValue }

export const translations: Record<Language, TranslationObject> = {
  en: en as TranslationObject,
  si: si as TranslationObject,
  ta: ta as TranslationObject,
}

// Helper function to get nested translation value
export function getNestedTranslation(obj: TranslationObject, key: string): string {
  // Support both flat keys and dot-notation keys (e.g., "dashboard.title")
  const parts = key.split(".")
  let current: TranslationValue = obj

  for (const part of parts) {
    if (typeof current === "object" && current !== null && part in current) {
      current = current[part]
    } else {
      return key // Return key if not found
    }
  }

  return typeof current === "string" ? current : key
}
