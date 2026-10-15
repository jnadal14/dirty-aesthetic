import Button from './Button'
import { streamLink } from '@/lib/data'

/** The album's Spotify and Apple Music buttons, from data/release.json. An empty URL drops its button. */
export default function StreamButtons({ className = '' }: { className?: string }) {
  const spotify = streamLink('spotify')
  const apple = streamLink('apple')
  if (!spotify && !apple) return null
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`}>
      {spotify && <Button variant="spotify" href={spotify} external>Spotify</Button>}
      {apple && <Button variant="apple" href={apple} external>Apple Music</Button>}
    </div>
  )
}
