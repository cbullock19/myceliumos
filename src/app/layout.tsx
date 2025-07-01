import type { Metadata, Viewport } from 'next'
// import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import "./globals.css"

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mycelium OS - Agency Operations Platform',
  description: 'The complete operations platform for creative agencies. Manage clients, deliverables, and team collaboration in one place.',
  keywords: 'agency management, project management, client portal, deliverables, creative agency',
  authors: [{ name: 'Mycelium OS' }],
  creator: 'Mycelium OS',
  publisher: 'Mycelium OS',
  robots: 'index, follow'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#228B22'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
