'use client'

import { useEffect, useRef, useState } from 'react'

const ARTIST = 'https://open.spotify.com/embed/artist/6LJB3zSDmtQ3NxA6GjUwlt'

/**
 * The Spotify artist player. Its iframe pulls ~700 KB of Spotify scripts and
 * fonts, and on Android it shares the page's process, so it is only created
 * once the page has loaded and the player is about to scroll into view
 * (native lazy loading starts it more than a screen early). Until then a
 * placeholder of the same size holds its place.
 */
export default function SpotifyEmbed({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let io: IntersectionObserver | undefined
    const watch = () => {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setMounted(true); io?.disconnect() } }, { rootMargin: '300px 0px' })
      io.observe(el)
    }
    if (document.readyState === 'complete') watch()
    else addEventListener('load', watch, { once: true })
    return () => { removeEventListener('load', watch); io?.disconnect() }
  }, [])

  return (
    <div ref={ref} className={`overflow-hidden rounded-xl bg-[#282828] ${className}`}>
      {mounted && (
        <iframe className="block h-full w-full" src={ARTIST} title="Dirty Aesthetic on Spotify"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
      )}
    </div>
  )
}
