import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "mr_r0b01",
  description:
    "Interactive terminal-style portfolio showcasing web-devleopment, penetration testing projects, CTF writeups, and cybersecurity tools. Explore my work through a command-line interface.",
  keywords: [
    "pentester",
    "penetration testing",
    "CTF",
    "cybersecurity",
    "bug bounty",
    "security researcher",
    "portfolio",
    "web developer"
  ],
  authors: [{ name: "mr_r0b01" }],
  creator: "mr_r0b01",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "mr_r0b01",
    description:
      "Interactive terminal-style portfolio showcasing web-development, penetration testing projects, CTF writeups, and cybersecurity tools.",
    siteName: "mr_r0b01",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pentester Portfolio — Interactive Terminal",
    description:
      "Interactive terminal-style portfolio showcasing penetration testing projects, CTF writeups, and cybersecurity tools.",
    creator: "@yourhandle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
