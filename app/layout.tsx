import type { Metadata, Viewport } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { InstallPrompt } from '@/components/ui/InstallPrompt'
import { ThemeProvider } from '@/components/theme-provider'
import { CursorGlow } from '@/components/ui/cursor-glow'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: 'ResearchFlow | Collaborate. Discover. Publish.',
  description: 'The premier research collaboration platform for African university students. Connect with peers, find mentors, and bring your research ideas to life.',
  keywords: ['research', 'collaboration', 'African universities', 'students', 'mentorship', 'academic'],
  authors: [{ name: 'ResearchFlow' }],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'ResearchFlow | Collaborate. Discover. Publish.',
    description: 'The premier research collaboration platform for African university students.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ResearchFlow" />
      </head>
      <body className={`${dmSans.variable} ${syne.variable} font-sans antialiased bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <CursorGlow />
          <InstallPrompt />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#0B0117',
                border: '1px solid rgba(124,58,237,0.25)',
                color: '#F5F0E8',
                borderRadius: '12px',
                fontSize: '14px',
              },
              classNames: {
                success: 'border-green-500/30 !bg-green-950/80',
                error: 'border-red-500/30 !bg-red-950/80',
                warning: 'border-yellow-500/30 !bg-yellow-950/80',
              },
            }}
            richColors
            closeButton
          />
          {process.env.NODE_ENV === 'production' && <Analytics />}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker
                    .getRegistrations()
                    .then(function(registrations) {
                      for (let r of registrations) {
                        r.unregister()
                      }
                    })
                }
              `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
