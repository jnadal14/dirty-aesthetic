'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { site } from '@/lib/site'

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

// The pixel library is 108KB of third-party JavaScript. Only its fetch is
// deferred to `load`: fbq() is defined at once and queues init and PageView,
// and the queue flushes when the library arrives, so no event is lost.
export const metaPixelSnippet = `!function(f,b,e,v,n){
if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
var load=function(){var t=b.createElement(e);t.async=!0;t.src=v;
var s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)};
if(b.readyState==='complete')load();else f.addEventListener('load',load)
}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${site.metaPixelId}');
fbq('track', 'PageView');`

/**
 * Meta Pixel route tracking. The inline snippet in <head> (MetaPixelHead)
 * reports the landing page before any app code runs. App Router navigations
 * don't reload the page, so each later route change sends its own PageView.
 * The ref starts at the landing path, so that page is never counted twice
 * (also under React's double-run of effects in development).
 */
export default function MetaPixel() {
  const path = usePathname()
  const last = useRef(path)
  useEffect(() => {
    if (last.current === path) return
    last.current = path
    window.fbq?.('track', 'PageView')
  }, [path])
  return null
}

/** The snippet itself, rendered into the static HTML's <head> like the old site. */
export function MetaPixelHead() {
  return <script id="meta-pixel" dangerouslySetInnerHTML={{ __html: metaPixelSnippet }} />
}

export function MetaPixelNoScript() {
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img height="1" width="1" style={{ display: 'none' }} alt=""
        src={`https://www.facebook.com/tr?id=${site.metaPixelId}&ev=PageView&noscript=1`} />
    </noscript>
  )
}
