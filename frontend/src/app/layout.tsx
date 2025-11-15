import '../styles/globals.css'
import type { ReactNode } from 'react'
import Providers from './providers'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Toast2Host',
  description: 'Find and connect with alumni',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black">
        <Providers>
          <div className="min-h-[80vh]">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
