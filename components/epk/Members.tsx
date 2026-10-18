'use client'

import { motion } from 'motion/react'
import Picture from '../Picture'
import { SPRING } from '@/lib/motion'
import { asset, type ImageEntry } from '@/lib/data'

export type Member = { key: string; name: string; fullName: string; role: string; image?: ImageEntry }

// Even cards drop lower than odd ones, so the two columns read as a staggered
// contact sheet rather than a grid.
const drop = ['0', 'clamp(100px,18vw,220px)', '0', 'clamp(80px,14vw,180px)', '0']

/** Band members: cards swing up into place, alternating sides, on the house spring. */
export default function Members({ members }: { members: Member[] }) {
  return (
    <div className="mx-auto grid max-w-[1060px] grid-cols-2 justify-items-center gap-x-[clamp(32px,5vw,72px)] gap-y-[clamp(12px,2vw,20px)] px-[clamp(20px,5vw,64px)]">
      {members.map((m, i) => {
        const even = i % 2 === 1
        // An odd one out spans both columns to sit centred, at one column's width.
        const last = i === members.length - 1 && members.length % 2 === 1
        return (
          <motion.figure
            key={m.key}
            className={`flex max-w-[380px] flex-col ${last ? 'col-span-2 w-[calc((100%-clamp(32px,5vw,72px))/2)]' : 'w-full'}`}
            style={{ paddingTop: drop[i] ?? 0, transformOrigin: even ? 'bottom right' : 'bottom left' }}
            initial={{ opacity: 0, rotate: even ? -8 : 8, y: 60, scale: 0.92 }}
            whileInView={{ opacity: 1, rotate: 0, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ ...SPRING, delay: i * 0.05 }}
          >
            <div className="group overflow-hidden rounded-sm shadow-[0_24px_60px_rgba(0,0,0,.5)]">
              {m.image && (
                <Picture src={m.image.src} webp={m.image.webp} alt={m.fullName} width={m.image.width} height={m.image.height}
                  webpSrcSet={m.image.webpSmall ? `${asset(m.image.webpSmall)} ${m.image.smallWidth}w, ${asset(m.image.webp)} ${m.image.width}w` : undefined}
                  sizes="(min-width: 900px) 380px, 42vw"
                  className="aspect-[4/5] w-full object-cover grayscale-[.15] transition-[transform,filter] duration-700 ease-out-expo group-hover:scale-[1.04] group-hover:grayscale-0" />
              )}
            </div>
            <figcaption className={`mt-3 ${even ? 'text-right' : ''}`}>
              <h3 className="display text-[clamp(1.4em,3vw,2em)]">{m.name}</h3>
              <p className="text-sm uppercase tracking-[.14em] text-accent">{m.role}</p>
            </figcaption>
          </motion.figure>
        )
      })}
    </div>
  )
}
