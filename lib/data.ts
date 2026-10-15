// Typed, build-time readers for data/*.json. The JSON files stay the source of
// truth (and keep their _readme notes); pages import from here instead of
// fetching at runtime, so the content is in the HTML on first paint.
import showsJson from '@/data/shows.json'
import releaseJson from '@/data/release.json'
import creditsJson from '@/data/credits.json'
import galleryOrderJson from '@/data/gallery-order.json'
import photoCreditsJson from '@/data/photo-credits.json'
import epkImagesJson from '@/data/epk-images.json'
import posterImagesJson from '@/data/poster-images.json'

export type Show = {
  date: string
  title?: string
  kicker?: string
  time?: string
  venue?: string
  city?: string
  lineup?: string
  lineupPrefix?: string
  note?: string
  notes?: string
  link?: string
  linkLabel?: string
  poster?: string
  posterWidth?: number
  posterHeight?: number
  logo?: string
  logoAlt?: string
  logoWidth?: number
  logoHeight?: number
  ticketLabel?: string
  ticketLabelShort?: string
  soloBill?: boolean
  posterCardAspect?: string
}

export type ImageEntry = {
  webp: string
  src: string
  full: string
  type: string
  width: number
  height: number
  fullWebp: string
  fullWidth: number
  fullHeight: number
  /** Smaller WebP offered through srcset (posters: 480w). */
  webpSmall?: string
  smallWidth?: number
  credit?: string
  [k: string]: unknown
}

const shows = showsJson as unknown as { upcoming: Show[]; past: Show[] }
export const upcoming: Show[] = shows.upcoming ?? []
export const pastShows: Show[] = shows.past ?? []
export const nextShow: Show | undefined = upcoming[0]

type Links = Record<string, string>
export const release = releaseJson as unknown as {
  album: { title: string; releaseDate: string; trackCount: number; links: Links }
  video: { title: string; youtubeId: string; url: string }
}

/** Streaming links with an empty URL are dropped, never shipped dead. */
export const streamLink = (key: string) => release.album.links[key] || ''

export const credits = creditsJson as unknown as { projects: Record<string, unknown>[] }
export const galleryOrder = galleryOrderJson as unknown as Record<string, unknown>
export const photoCredits = photoCreditsJson as unknown as Record<string, { photographer: string }>
export const epkImages = epkImagesJson as unknown as Record<string, unknown>
export const posterImages = posterImagesJson as unknown as Record<string, ImageEntry>

/** Asset paths in the manifests are root-relative without the leading slash. */
export const asset = (p: string) => (p.startsWith('/') || p.startsWith('http') ? p : `/${p}`)
