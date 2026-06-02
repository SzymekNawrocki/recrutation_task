import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Portal Zamówień IT',
  description: 'Wewnętrzny portal zamawiania sprzętu IT',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans antialiased">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <nav className="flex items-center gap-1">
              <Link
                href="/orders"
                className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 transition-colors"
              >
                Zamówienia
              </Link>
              <Link
                href="/orders/new"
                className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 transition-colors"
              >
                Nowe zamówienie
              </Link>
              <Link
                href="/admin"
                className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 transition-colors"
              >
                Panel admina
              </Link>
            </nav>
            <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">
              Portal IT
            </span>
          </div>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
