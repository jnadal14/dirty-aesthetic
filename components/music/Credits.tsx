'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import Reveal from '../motion/Reveal'
import { SNAP } from '@/lib/motion'

type Person = { name: string; roles: string[] }
type Track = { position: number; title: string; songwriters: string[]; performers?: Person[]; engineering?: Person[]; firstReleased?: string }
export type Project = { title: string; type: string; releaseDate: string; copyright: string; summary?: string; tracks: Track[] }

const lower = (roles: string[]) => roles.join(', ').toLowerCase()
const year = (iso: string) => iso.slice(0, 4)

function People({ people }: { people: Person[] }) {
  return (
    <>
      {people.map((p, i) => (
        <span key={p.name}>
          {i > 0 && <span aria-hidden className="mx-1.5 text-sand/40">·</span>}
          <span className="text-bone">{p.name}</span> <span className="text-sand/80">{lower(p.roles)}</span>
        </span>
      ))}
    </>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-[.88em] leading-relaxed">
      <span className="mb-0.5 block text-[.72em] uppercase tracking-[.18em] text-accent">{label}</span>
      {children}
    </p>
  )
}

function TrackCredit({ track, numbered = true, meta }: { track: Track; numbered?: boolean; meta?: string }) {
  return (
    <li className="break-inside-avoid border-t border-bone/8 py-4">
      <p className="display text-[1.15em]">
        {numbered && <span className="mr-2 text-[.75em] text-sand/70 tabular-nums">{String(track.position).padStart(2, '0')}</span>}
        {track.title}
        {meta && <span className="ml-2 align-middle text-[.6em] tracking-[.12em] text-accent normal-case">{meta}</span>}
      </p>
      {track.firstReleased && (
        <p className="mt-1 text-[.82em] text-sand/80">First released as a {track.firstReleased.charAt(0).toLowerCase() + track.firstReleased.slice(1)}</p>
      )}
      <Line label="Written by">{track.songwriters.join(', ')}</Line>
      {track.performers?.length ? <Line label="Performed by"><People people={track.performers} /></Line> : null}
      {track.engineering?.length ? <Line label="Production"><People people={track.engineering} /></Line> : null}
    </li>
  )
}

function ProjectCredits({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  const n = project.tracks.length
  return (
    <Reveal className="border-t border-bone/10 py-10">
      <h3 className="display text-huge">
        {project.title} <span className="align-middle text-[.32em] tracking-[.16em] text-accent">{project.type} · {year(project.releaseDate)}</span>
      </h3>
      {project.summary && <p className="mt-3 max-w-2xl text-sand">{project.summary} {project.copyright}.</p>}
      <motion.button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="mt-5 inline-flex items-center gap-2 text-sm uppercase tracking-[.16em] text-accent hover:text-bone"
        whileTap={{ scale: 0.97 }} transition={SNAP}>
        {n} tracks, credit by credit
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={SNAP} aria-hidden>⌄</motion.span>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ol className="mt-4 overflow-hidden md:columns-2 md:gap-12"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            {project.tracks.map(t => <TrackCredit key={t.title} track={t} />)}
          </motion.ol>
        )}
      </AnimatePresence>
    </Reveal>
  )
}

/**
 * Official credits for the whole catalog, from data/credits.json. Albums and
 * EPs open track by track; the early singles are listed together.
 */
export default function Credits({ projects }: { projects: Project[] }) {
  const collections = projects.filter(p => p.type !== 'Single')
  const singles = projects.filter(p => p.type === 'Single')
  const span = singles.length ? `${year(singles[singles.length - 1].releaseDate)}–${year(singles[0].releaseDate)}` : ''
  return (
    <div>
      {collections.map(p => <ProjectCredits key={p.title} project={p} />)}
      {singles.length > 0 && (
        <Reveal className="border-t border-bone/10 py-10">
          <h3 className="display text-huge">Early singles <span className="align-middle text-[.32em] tracking-[.16em] text-accent">{span}</span></h3>
          <ol className="mt-4 md:columns-2 md:gap-12">
            {singles.map(p => p.tracks.map(t => (
              <TrackCredit key={t.title} track={t} numbered={false} meta={`${p.type} · ${year(p.releaseDate)} · ${p.copyright}`} />
            )))}
          </ol>
        </Reveal>
      )}
    </div>
  )
}
