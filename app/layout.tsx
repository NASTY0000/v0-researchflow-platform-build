import type { Metadata, Viewport } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { InstallPrompt } from '@/components/ui/InstallPrompt'
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
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
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
    <html lang="en" className="dark" style={{ backgroundColor: '#05010F' }}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ResearchFlow" />
      </head>
      <body className={`${dmSans.variable} ${syne.variable} font-sans antialiased`} style={{ backgroundColor: '#05010F' }}>
        {children}
        <InstallPrompt />
        <Toaster position="bottom-right" theme="dark" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker
                    .register('/sw.js')
                    .then(function(reg) {
                      console.log('SW registered:', reg.scope)
                    })
                    .catch(function(err) {
                      console.log('SW failed:', err)
                    })
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
