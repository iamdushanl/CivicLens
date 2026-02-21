import type { Metadata, Viewport } from "next"
import { Inter, Noto_Sans_Sinhala, Noto_Sans_Tamil } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/lib/language-context"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const notoSinhala = Noto_Sans_Sinhala({ subsets: ["sinhala"], variable: "--font-sinhala", weight: ["400", "500", "600", "700"] })
const notoTamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-tamil", weight: ["400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: 'CivicLens — See it. Report it. Fix it.',
  description: 'A civic issue reporting platform for Sri Lanka. Report potholes, broken street lights, garbage, and more. Available in English, Sinhala, and Tamil.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CivicLens',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSinhala.variable} ${notoTamil.variable} font-sans antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Analytics />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
