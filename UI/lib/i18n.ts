import en from "@/messages/en.json"
import si from "@/messages/si.json"
import ta from "@/messages/ta.json"

export type Language = "en" | "si" | "ta"

export const translations: Record<Language, Record<string, string>> = {
  en,
  si,
  ta,
}
