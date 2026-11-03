import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { ViewTransition } from 'react'
import Providers from '@/components/motion/Providers'
import Nav from '@/components/nav/Nav'
import LayoutFooter from '@/components/LayoutFooter'
import MetaPixel, { MetaPixelHead, MetaPixelNoScript } from '@/components/MetaPixel'
import { LightboxProvider } from '@/components/Lightbox'
import { site } from '@/lib/site'
import './globals.css'

const nafta = localFont({ src: './fonts/NaftaLight-Regular.woff2', variable: '--font-nafta', display: 'swap' })

const icon = (file: string, sizes: string, media: string) => ({ url: `/assets/images/${file}?v=6`, sizes, type: 'image/png', media })

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'Dirty Aesthetic • Vancouver Indie Rock Band', template: '%s' },
  openGraph: { type: 'website', siteName: site.name },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [
      icon('favicon-32-dark.png', '32x32', '(prefers-color-scheme: dark)'),
      icon('favicon-dark.png', '180x180', '(prefers-color-scheme: dark)'),
      icon('favicon-32.png', '32x32', '(prefers-color-scheme: light)'),
      icon('favicon.png', '180x180', '(prefers-color-scheme: light)'),
    ],
    apple: '/assets/images/apple-touch-icon.png?v=6',
  },
}

export const viewport: Viewport = { themeColor: '#0a0705', colorScheme: 'dark', viewportFit: 'cover' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nafta.variable}>
      <head>
        <MetaPixelHead />
      </head>
      <body>
        <MetaPixelNoScript />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-bone focus:px-4 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <Providers>
          <LightboxProvider>
            <Nav />
            <ViewTransition>
              <main id="main" className="overflow-x-clip">{children}</main>
            </ViewTransition>
            <LayoutFooter />
          </LightboxProvider>
        </Providers>
        <div className="grain" aria-hidden />
        <MetaPixel />
        {/* Cloudflare Web Analytics (cookieless). Added by hand because the zone's
            automatic install never reaches pages a Worker serves. It follows
            client-side route changes on its own. */}
        <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "53b01d069c114097bb7635dd33b665d0"}' />
      </body>
    </html>
  )
}
