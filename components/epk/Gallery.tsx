'use client'

import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLightbox } from '../Lightbox'
import { SNAP, SPRING } from '@/lib/motion'
import { asset } from '@/lib/data'

export type GalleryImage = {
  webp: string; webpSmall?: string; smallWidth?: number; src: string
  full: string; fullWebp?: string; width: number; height: number; alt?: string
}

/** Each photo, in curated order, goes into whichever column is currently shortest. */
function distribute(images: GalleryImage[], cols: number) {
  const heights = new Array(cols).fill(0)
  const columns: { image: GalleryImage; index: number }[][] = Array.from({ length: cols }, () => [])
  images.forEach((image, index) => {
    let col = 0
    for (let k = 1; k < cols; k++) if (heights[k] < heights[col] - 0.001) col = k
    columns[col].push({ image, index })
    heights[col] += image.height / image.width
  })
  return columns
}

/**
 * Reading-order masonry: three columns on wide screens, two on phones. The
 * DOM order per column follows the curated sequence, and the lightbox steps
 * through the whole sequence from any photo.
 */
export default function Gallery({ images }: { images: GalleryImage[] }) {
  const [cols, setCols] = useState(3)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const { open } = useLightbox()

  useEffect(() => {
    const mq = matchMedia('(max-width: 768px)')
    const sync = () => setCols(mq.matches ? 2 : 3)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const columns = useMemo(() => distribute(images, cols), [images, cols])
  const items = useMemo(() => images.map((img, i) => ({
    src: asset(img.fullWebp || img.full),
    alt: img.alt || `Dirty Aesthetic press photo ${i + 1}`,
    width: img.width,
    height: img.height,
    origin: () => refs.current[i],
  })), [images])

  return (
    <div className="flex gap-[clamp(8px,1.2vw,14px)]">
      {columns.map((column, c) => (
        <div key={`${cols}-${c}`} className="flex min-w-0 flex-1 flex-col gap-[clamp(8px,1.2vw,14px)]">
          {column.map(({ image, index }, row) => (
            <motion.button
              key={image.src}
              ref={el => { refs.current[index] = el }}
              type="button"
              onClick={() => open(items, index)}
              aria-label={`View ${image.alt || `press photo ${index + 1}`}`}
              className="group relative block cursor-zoom-in overflow-hidden rounded-md bg-coal"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '0px 0px -6% 0px' }}
              transition={{ ...SPRING, delay: Math.min(row, 2) * 0.04 + c * 0.08 }}
              whileHover={{ y: -4, transition: SNAP }}
            >
              <picture>
                <source type="image/webp"
                  srcSet={image.webpSmall ? `${asset(image.webpSmall)} ${image.smallWidth || 600}w, ${asset(image.webp)} ${image.width}w` : asset(image.webp)}
                  sizes="(min-width:769px) 31vw, 50vw" />
                <img src={asset(image.src)} alt={image.alt || `Dirty Aesthetic press photo ${index + 1}`}
                  width={image.width} height={image.height} loading="lazy" decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" />
              </picture>
            </motion.button>
          ))}
        </div>
      ))}
    </div>
  )
}
