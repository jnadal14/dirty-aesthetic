'use client'

import { motion } from 'motion/react'
import { useRef } from 'react'
import { useLightbox } from '../Lightbox'
import { SNAP, SPRING } from '@/lib/motion'
import { asset, type ImageEntry, type Show } from '@/lib/data'

/** Cards that can be on screen at load: two rows of the 5-column desktop grid. */
const ABOVE_FOLD = 10

export type ArchivedPoster = { show: Show; image: ImageEntry }

function Details({ show, large }: { show: Show; large?: boolean }) {
  const title = show.title || show.venue
  return (
    <div className={large ? '' : 'px-3 pt-3 pb-3.5 max-sm:px-2 max-sm:pt-2 max-sm:pb-2.5'}>
      <p className={`mb-1 uppercase tracking-[.12em] text-accent ${large ? 'text-sm' : 'text-[.66em] max-sm:text-[.56em]'}`}>{show.date}</p>
      <h2 className={`leading-tight text-bone ${large ? 'display text-[clamp(1.3em,2.2vw,1.8em)]' : 'text-[clamp(.9em,1.1vw,1.05em)] max-sm:text-[.76em] [overflow-wrap:anywhere]'}`}>{title}</h2>
      {large && (
        <>
          <p className="mt-1 mb-3 text-sand">{show.venue && show.title ? `${show.venue} · ` : ''}{show.city || 'Vancouver'}</p>
          {!show.soloBill && (
            <p className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-[.16em] text-sand/80">{show.lineupPrefix === 'with' ? 'With' : 'On the bill'}</span>
              <strong className="font-normal text-bone">{show.lineup || 'Lineup details unavailable'}</strong>
            </p>
          )}
          {show.notes && <span className="mt-3 block text-sm text-sand/80">{show.notes}</span>}
          {show.link && <a href={show.link} target="_blank" rel="noopener" className="prose-link mt-4 inline-block text-sm">Event page</a>}
        </>
      )}
    </div>
  )
}

/**
 * Archived posters, newest first. Cards settle in one after another, reflow
 * with a layout animation when the column count changes, and open into the
 * lightbox with the show's details beside the poster.
 */
export default function PosterGrid({ posters }: { posters: ArchivedPoster[] }) {
  const { open } = useLightbox()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const items = posters.map(({ show, image }, i) => ({
    src: asset(image.fullWebp || image.full || image.webp || image.src),
    alt: `${show.title || show.venue} show poster, ${show.date}`,
    width: image.fullWidth || image.width,
    height: image.fullHeight || image.height,
    caption: <Details show={show} large />,
    origin: () => refs.current[i],
  }))

  if (!posters.length) return <p className="py-16 text-center text-sand">The poster archive is being assembled.</p>

  return (
    <div className="grid grid-cols-5 gap-x-3.5 gap-y-5 max-[1180px]:grid-cols-4 max-[820px]:grid-cols-3 max-[820px]:gap-x-2.5 max-[820px]:gap-y-3.5 max-sm:gap-x-2 max-sm:gap-y-3">
      {posters.map(({ show, image }, i) => {
        const delay = Math.min((i % 5) * 0.08, 0.36)
        // The first rows are on screen at load: they enter in CSS from the
        // first paint (on the wrapper, so Motion's hover and layout transforms
        // on the card never fight the animation). The rest enter on scroll.
        const first = i < ABOVE_FOLD
        return (
        <div key={show.poster} className={first ? 'enter-up' : undefined}
          style={first ? { '--d': `${0.15 + delay}s`, '--y': '36px', '--s': 0.96 } as React.CSSProperties : undefined}>
        <motion.article
          layout
          className="group h-full overflow-hidden rounded-[10px] border border-bone/8 bg-[linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.018))] max-sm:rounded-lg"
          {...(!first && {
            initial: { opacity: 0, y: 36, scale: 0.96 },
            whileInView: { opacity: 1, y: 0, scale: 1 },
            viewport: { once: true, margin: '0px 0px -8% 0px' },
            transition: { ...SPRING, delay },
          })}
          whileHover={{ y: -6, transition: SNAP }}
        >
          <button
            ref={el => { refs.current[i] = el }}
            type="button"
            onClick={() => open(items, i)}
            aria-label={`View ${show.title || show.venue} poster from ${show.date}`}
            className="block w-full cursor-zoom-in overflow-hidden bg-[#080706]"
            style={{ aspectRatio: show.posterCardAspect || `${image.width} / ${image.height}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(image.webp || image.src)}
              srcSet={image.webpSmall ? `${asset(image.webpSmall)} ${image.smallWidth}w, ${asset(image.webp)} ${image.width}w` : undefined}
              sizes="(max-width: 820px) 33vw, (max-width: 1180px) 25vw, 20vw"
              alt={`${show.title || show.venue} show poster, ${show.date}`}
              width={image.width}
              height={image.height}
              loading={first ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
            />
          </button>
          <Details show={show} />
        </motion.article>
        </div>
        )
      })}
    </div>
  )
}
