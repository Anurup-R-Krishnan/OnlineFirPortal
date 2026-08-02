import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/sonner"
import { ServiceWorkerRegister } from "@/components/sw-register"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

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
      <body className={`font-sans antialiased`}>
        <link rel="manifest" href="/manifest.json" />
        {children}
        <Analytics />
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
