'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useRef } from 'react'
import { useLightbox } from '../Lightbox'
import SplitText from '../motion/SplitText'
import { InstagramIcon } from '../icons'
import { SNAP, SPRING } from '@/lib/motion'
import { asset, type Show } from '@/lib/data'
import { parseShowDate } from '@/lib/shows'

// Show posters are replaced in place whenever a bill changes, so they are versioned.
const POSTER_VERSION = '20260928'
// Width of the -sm thumbnail optimize_images.py writes beside every poster.
const POSTER_SMALL_W = 400
const v = (p: string) => `${asset(p)}${p.includes('?') ? '&' : '?'}v=${POSTER_VERSION}`

function Row({ show, isNext, index }: { show: Show; isNext: boolean; index: number }) {
  const { open } = useLightbox()
  const posterRef = useRef<HTMLButtonElement>(null)
  const d = parseShowDate(show.date)
  const title = isNext && show.title ? [show.venue, show.time].filter(Boolean).join(' · ') : show.title || show.venue
  const location = isNext && show.title ? show.city : [show.venue, show.city, show.time].filter(Boolean).join(' · ')
  const linkLabel = show.link ? show.linkLabel || (show.link.includes('cjsf') ? 'Stream Live' : 'Tickets') : ''
  const posterSmall = show.poster && /\.webp$/i.test(show.poster) ? show.poster.replace(/\.webp$/i, '-sm.webp') : ''
  const Tag = show.link ? motion.a : motion.div
  const linkProps = show.link ? { href: show.link, target: '_blank', rel: 'noopener' } : {}

  return (
    <Tag
      {...linkProps}
      className={`group relative -mx-4 grid grid-cols-[auto_1fr_auto] items-center gap-[clamp(16px,3vw,36px)] rounded border-b border-bone/5 px-[clamp(16px,2vw,24px)] py-[clamp(18px,3vw,28px)] transition-colors hover:border-accent/15 hover:bg-accent/[.03] ${isNext ? 'border-b-sun/30 before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded before:bg-[linear-gradient(180deg,var(--color-sun),var(--color-flame))]' : ''}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ ...SPRING, delay: 0.15 + index * 0.08 }}
    >
      <div className="flex min-w-[clamp(110px,20vw,220px)] flex-col gap-0.5">
        <span className={`display text-[clamp(1.6em,4vw,2.6em)] leading-none tracking-[2px] transition-colors ${isNext ? 'text-sun' : 'text-accent group-hover:text-[#d4943f]'}`}>{d ? d.month : show.date}</span>
        {d && <span className={`text-[clamp(1.1em,2.5vw,1.7em)] leading-none tracking-wide ${isNext ? 'text-bone' : 'text-sand group-hover:text-bone'}`}>{d.day}<sup>{d.suffix}</sup></span>}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className={`${isNext ? 'display text-[clamp(1.3em,3vw,2em)]' : 'text-[clamp(1.15em,2.5vw,1.6em)]'} tracking-wide`}>
          {title}
          {show.link && <span className="ml-3 align-middle text-[.45em] uppercase tracking-[1.5px] text-accent group-hover:text-bone">{linkLabel} →</span>}
        </span>
        {show.lineup && <span className="text-[clamp(.8em,1.4vw,.92em)] italic leading-snug text-white/55">{show.lineupPrefix || 'w/'} {show.lineup}</span>}
        {location && <span className="text-[clamp(.85em,1.5vw,1em)] uppercase tracking-wide text-white/50">{location}</span>}
        {show.note && <span className="inline-flex items-center gap-1.5 text-sm text-sand"><InstagramIcon className="size-4" />{show.note}</span>}
      </div>
      {show.poster ? (
        <motion.button
          ref={posterRef}
          type="button"
          aria-label={`View ${show.title || show.venue} poster`}
          onClick={e => {
            e.preventDefault(); e.stopPropagation()
            open([{ src: v(show.poster!), alt: `${show.title || show.venue} poster`, width: show.posterWidth, height: show.posterHeight, origin: () => posterRef.current }])
          }}
          className={`${isNext ? 'w-[clamp(72px,12vw,130px)]' : 'w-[clamp(60px,10vw,90px)]'} cursor-zoom-in overflow-hidden rounded-md shadow-[0_6px_22px_rgba(0,0,0,.55),0_0_0_1px_rgba(255,255,255,.12)]`}
          style={show.posterWidth && show.posterHeight ? { aspectRatio: `${show.posterWidth} / ${show.posterHeight}` } : undefined}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SNAP}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v(show.poster)} alt={`${show.title || show.venue} poster`} width={show.posterWidth} height={show.posterHeight}
            loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="block w-full"
            {...(posterSmall && show.posterWidth && { srcSet: `${v(posterSmall)} ${POSTER_SMALL_W}w, ${v(show.poster)} ${show.posterWidth}w`, sizes: isNext ? '(max-width:820px) 25vw, 160px' : '(max-width:820px) 25vw, 120px' })} />
        </motion.button>
      ) : show.logo ? (
        // A room's own mark: a logo, not artwork, so no frame and no lightbox.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v(show.logo)} alt={show.logoAlt || show.title || show.venue || ''} width={show.logoWidth} height={show.logoHeight} className="w-[clamp(60px,10vw,90px)]" loading="lazy" decoding="async" />
      ) : <span />}
    </Tag>
  )
}

/** Upcoming dates from data/shows.json. Index 0 is the next show and always leads. */
export default function Shows({ shows }: { shows: Show[] }) {
  const lead = shows[0]
  const featured = lead?.title
  return (
    <div className="relative z-[1] mx-auto max-w-[clamp(1000px,62vw,1280px)] px-[clamp(24px,5vw,64px)]">
      {featured && (
        <p className="mb-1 text-[clamp(.74em,1.3vw,.9em)] font-bold uppercase tracking-[3px] text-sun [text-shadow:0_2px_12px_rgba(0,0,0,.85)]">
          {lead.kicker || `One Night Only · ${lead.date}`}
        </p>
      )}
      <SplitText as="h2" by="char" stagger={0.03} text={featured ? lead.title! : 'Upcoming Shows'}
        className="display relative mb-[clamp(24px,4vw,40px)] pb-5 text-left text-[clamp(2.2em,5.5vw,3.6em)] tracking-[4px] [text-shadow:0_2px_16px_rgba(0,0,0,.82)] after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-12 after:rounded after:bg-accent" />
      <div className="flex flex-col border-t border-bone/5">
        {shows.length === 0 ? (
          <div role="status" className="py-10 text-center text-[1.4em]">TBA</div>
        ) : shows.map((s, i) => (
          <div key={`${s.date}-${s.venue}`}>
            {i === 1 && <p className="mt-6 mb-1 text-xs uppercase tracking-[.24em] text-sand/80">Also Coming Up</p>}
            <Row show={s} isNext={i === 0} index={i} />
          </div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: 0.3 }}>
        <Link href="/posters" className="group mt-[clamp(28px,4vw,44px)] flex items-center gap-4 rounded border border-bone/10 bg-black/35 px-5 py-4 backdrop-blur-sm transition-colors hover:border-accent/40">
          <span className="text-xs uppercase tracking-[.2em] text-accent">Past Shows</span>
          <strong className="font-normal">Explore the Poster Archive</strong>
          <span aria-hidden className="ml-auto transition-transform duration-300 group-hover:translate-x-1.5">→</span>
        </Link>
      </motion.div>
    </div>
  )
}
