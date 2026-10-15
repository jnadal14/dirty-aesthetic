'use client'

import { motion, type Variants } from 'motion/react'

type Props = {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  id?: string
  /** Animate on mount (above the fold) instead of when scrolled into view. */
  onMount?: boolean
  delay?: number
  stagger?: number
  by?: 'word' | 'char'
}

const parent: Variants = { hidden: {}, show: {} }
const child: Variants = {
  hidden: { y: '110%', rotate: 4 },
  show: { y: '0%', rotate: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
}

/**
 * Each word (or letter) rises out of its own clipping mask. The full string
 * stays in an sr-only span so screen readers read it once, normally.
 * On mount the rise is plain CSS (.enter-rise), so a page's title is moving
 * from the first paint rather than after hydration.
 */
export default function SplitText({ text, as = 'h2', className, id, onMount, delay = 0, stagger = 0.06, by = 'word' }: Props) {
  const words = text.split(' ')
  let n = 0
  // Mask = an overflow-hidden box the piece rises out of. In letter mode each
  // word is a nowrap group so a line can only break between words.
  const mask = (content: string, key: number) => {
    const i = n++
    return (
      <span key={key} className="inline-block overflow-hidden pt-[0.18em] -mt-[0.18em] pb-[0.1em] -mb-[0.1em] px-[0.04em] -mx-[0.04em] align-bottom">
        {onMount
          ? <span className="enter-rise inline-block" style={{ '--d': `${delay + i * stagger}s` } as React.CSSProperties}>{content}</span>
          : <motion.span className="inline-block origin-bottom-left" variants={child}>{content}</motion.span>}
      </span>
    )
  }
  const body = (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) => (
          <span key={i} className="inline-block whitespace-nowrap">
            {by === 'word' ? mask(w, 0) : Array.from(w).map((c, j) => mask(c, j))}
            {i < words.length - 1 && ' '}
          </span>
        ))}
      </span>
    </>
  )
  if (onMount) {
    const Tag = as
    return <Tag id={id} className={className}>{body}</Tag>
  }
  const Tag = motion[as]
  return (
    <Tag
      id={id}
      className={className}
      variants={parent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {body}
    </Tag>
  )
}
