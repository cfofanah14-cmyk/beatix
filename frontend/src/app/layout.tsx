import type { Metadata, Viewport } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import '../styles/globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Beatix — Access Every Event, Effortlessly',
  description: 'Buy tickets to events in Sierra Leone instantly. Mobile money payments, QR code delivery.',
  keywords: ['events', 'tickets', 'Sierra Leone', 'Freetown', 'Afrimoney', 'Orange Money'],
  openGraph: {
    title: 'Beatix — Access Every Event, Effortlessly',
    description: 'Buy tickets to events in Sierra Leone instantly.',
    type: 'website',
  },
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D0B2B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className={dmSans.className}>
        {children}
      </body>
    </html>
  )
}
