'use client'

import { motion, type Variants } from 'motion/react'
import { SPRING } from '@/lib/motion'

export const ALBUM_TRACKS: [string, string][] = [
  ['In a Haze', '5:09'], ['Maybe', '3:27'], ['Chariot', '3:27'], ['Defiant', '4:40'],
  ['Modern Nostalgia', '4:06'], ['Limerence Interlude', '1:23'], ['Back to Me', '4:49'],
  ['Jaded', '4:04'], ['Am I Alone?', '4:56'], ['Irrational', '3:19'], ['Used to You', '4:04'],
]

const row: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRING },
}

/** Modern Nostalgia's tracklist panel. Rows rise one after another. */
export default function Tracklist({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-md border border-bone/10 bg-black/45 p-[clamp(16px,2.4vw,28px)] backdrop-blur-sm ${className}`}>
      <p className="mb-2 border-b border-bone/10 pb-3 text-xs uppercase tracking-[.22em] text-sand">Tracklist</p>
      <motion.ol initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ staggerChildren: 0.05, delayChildren: 0.15 }}>
        {ALBUM_TRACKS.map(([title, time], i) => (
          <motion.li key={title} variants={row}
            className="group grid grid-cols-[2.2rem_1fr_auto] items-baseline border-b border-bone/6 py-[.55em] last:border-0 transition-colors hover:text-accent">
            <span className="text-xs text-sand/70 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">{title}</span>
            <span className="text-sm text-sand tabular-nums">{time}</span>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  )
}
