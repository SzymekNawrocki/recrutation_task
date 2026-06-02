import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import { cookies } from 'next/headers'
import LanguageProvider from './_components/LanguageProvider'
import LanguageSwitcher from './_components/LanguageSwitcher'
import { getDict, LANG_COOKIE, type Lang } from '@/lib/i18n'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = (cookieStore.get(LANG_COOKIE)?.value ?? 'pl') as Lang
  const t = getDict(lang)
  return { title: t.app.title, description: t.app.description }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = (cookieStore.get(LANG_COOKIE)?.value ?? 'pl') as Lang
  const t = getDict(lang)

  return (
    <html lang={lang} className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        <LanguageProvider lang={lang}>
          <header className="bg-slate-900 sticky top-0 z-10 shadow-lg">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-sm font-semibold text-white tracking-tight">
                  {t.app.title}
                </span>
                <div className="w-px h-4 bg-slate-700" />
                <nav className="flex items-center gap-1">
                  <Link
                    href="/orders"
                    className="px-3 py-1.5 text-sm font-medium text-slate-300 rounded hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    {t.nav.orders}
                  </Link>
                  <Link
                    href="/orders/new"
                    className="px-3 py-1.5 text-sm font-medium text-slate-300 rounded hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    {t.nav.newOrder}
                  </Link>
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 text-sm font-medium text-slate-300 rounded hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    {t.nav.admin}
                  </Link>
                </nav>
              </div>
              <LanguageSwitcher current={lang} />
            </div>
          </header>
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  )
}
