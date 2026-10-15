'use client'

import { motion, useScroll, useTransform } from 'motion/react'

type Props = {
  /** Base name under /assets/images/backgrounds (…-mobile variants used on phones when `mobile`). */
  image: string
  dir?: string
  mobile?: boolean
  scrim?: string
}

/**
 * The full-screen photograph behind an inner page: one fixed layer that eases
 * in from a slight zoom and drifts a little as the page scrolls.
 */
export default function PageBackdrop({ image, dir = '/assets/images/backgrounds', mobile = true, scrim = 'linear-gradient(180deg,rgba(12,8,6,.93) 0%,rgba(18,12,8,.88) 45%,rgba(8,6,4,.95) 100%)' }: Props) {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-6%'])
  const set = (name: string) => `image-set(url('${dir}/${name}.webp') type('image/webp'), url('${dir}/${name}.jpg') type('image/jpeg'))`
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-umber">
      <motion.div
        className="absolute inset-x-0 -top-[4%] h-[112%] bg-cover bg-center"
        style={{ y, ['--bg-d' as string]: set(image), ['--bg-m' as string]: set(mobile ? `${image}-mobile` : image) }}
      >
        {/* The ease-in is CSS (.enter-backdrop) so the photo shows from the first paint. */}
        <div className="page-backdrop-img enter-backdrop absolute inset-0 bg-cover bg-center" />
      </motion.div>
      <div className="absolute inset-0" style={{ background: scrim }} />
    </div>
  )
}
