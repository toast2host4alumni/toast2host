import '../styles/globals.css'
import type { ReactNode } from 'react'
import Providers from './providers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Toast2Host - Alumni Connect',
  description: 'Find and connect with university alumni in your area',
  keywords: 'alumni, networking, university, connections',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffc510',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white text-black">
        <Providers>
          <Header />
          <div className="min-h-[80vh]">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
