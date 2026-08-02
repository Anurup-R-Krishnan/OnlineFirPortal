import React from "react"
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/sonner"
import { ServiceWorkerRegister } from "@/components/sw-register"
import './globals.css'

// Geist is bundled locally so builds are hermetic and do not depend on a
// Google Fonts fetch at build time.
const geist = localFont({ src: '../public/fonts/geist-regular.woff2', display: 'swap', variable: '--font-geist-sans' });
const geistMono = localFont({ src: '../public/fonts/geist-mono-regular.woff2', display: 'swap', variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'Online FIR Portal | Government of India',
  description: 'File First Information Report (FIR) online. Quick, secure, and accessible digital service for all citizens of India.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <link rel="manifest" href="/manifest.json" />
        {children}
        <Analytics />
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
