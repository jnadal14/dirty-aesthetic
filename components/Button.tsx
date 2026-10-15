'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import Magnetic from './motion/Magnetic'
import { AppleMusicIcon, SpotifyIcon } from './icons'
import { SNAP } from '@/lib/motion'

type Variant = 'accent' | 'ghost' | 'spotify' | 'apple'

type Props = {
  children: React.ReactNode
  variant?: Variant
  href?: string
  external?: boolean
  download?: boolean | string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  className?: string
  'aria-label'?: string
}

const variantClass: Record<Variant, string> = {
  accent: '',
  ghost: 'btn-ghost',
  spotify: 'btn-spotify',
  apple: 'btn-apple',
}

const brandIcon: Partial<Record<Variant, React.ReactNode>> = {
  spotify: <SpotifyIcon className="btn-brand-icon" />,
  apple: <AppleMusicIcon className="btn-brand-icon" />,
}

const MotionLink = motion.create(Link)

/**
 * The DA button: clipped corners, a highlight that sweeps in on hover and an
 * arrow tail that stretches. It leans toward the cursor and presses on the
 * stiff SNAP spring.
 */
export default function Button({ children, variant = 'accent', href, external, download, type = 'button', disabled, onClick, className = '', ...aria }: Props) {
  const cls = `btn ${variantClass[variant]} ${className}`
  const press = { whileHover: { y: -2 }, whileTap: { scale: 0.96, y: 0 }, transition: SNAP }
  const content = <>{brandIcon[variant]}{children}</>

  let el: React.ReactNode
  if (!href) {
    el = <motion.button type={type} disabled={disabled} onClick={onClick} className={cls} {...press} {...aria}>{content}</motion.button>
  } else if (external || download || href.startsWith('#') || href.startsWith('mailto:')) {
    el = (
      <motion.a href={href} className={cls} {...press} {...aria}
        {...(external && { target: '_blank', rel: 'noopener' })} {...(download && { download: download === true ? '' : download })}>
        {content}
      </motion.a>
    )
  } else {
    el = <MotionLink href={href} className={cls} {...press} {...aria}>{content}</MotionLink>
  }
  return <Magnetic strength={0.2}>{el}</Magnetic>
}
