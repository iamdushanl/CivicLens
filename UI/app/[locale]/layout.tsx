import type { ReactNode } from "react"

interface LocaleLayoutProps {
  children: ReactNode
  params: {
    locale: string
  }
}

export default function LocaleLayout({ children }: LocaleLayoutProps) {
  return <>{children}</>
}

