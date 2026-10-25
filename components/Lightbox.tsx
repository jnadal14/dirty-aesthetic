'use client'

import { animate, AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SPRING } from '@/lib/motion'

export type LightboxItem = {
  src: string
  alt: string
  width?: number
  height?: number
  caption?: React.ReactNode
  /** Where the picture flies from on open and back to on close. */
  origin?: () => HTMLElement | null
}

type Ctx = { open: (items: LightboxItem[], index?: number) => void }
const LightboxContext = createContext<Ctx>({ open: () => {} })
export const useLightbox = () => useContext(LightboxContext)

type Box = { x: number; y: number; scale: number }

/** The uniform scale and offset that lay the full picture over its thumbnail. */
function poseOver(el: HTMLElement | null | undefined, w: number, h: number): Box | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (!r.width || r.bottom < 0 || r.top > innerHeight) return null
  const cx = innerWidth / 2
  const cy = innerHeight / 2
  return { x: r.left + r.width / 2 - cx, y: r.top + r.height / 2 - cy, scale: Math.max(r.width / w, r.height / h) }
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<LightboxItem[]>([])
  const [index, setIndex] = useState(-1)
  const lenis = useLenis()
  const reduce = useReducedMotion()
  const imgRef = useRef<HTMLImageElement>(null)
  const isOpen = index >= 0
  const item = isOpen ? items[index] : undefined

  const open = useCallback((list: LightboxItem[], i = 0) => {
    setItems(list)
    setIndex(i)
  }, [])
  const closing = useRef(false)
  // On close the picture flies back into whichever thumbnail it belongs to now
  // (the lightbox may have paged to another one), then the overlay fades.
  const close = useCallback(async () => {
    if (closing.current) return
    const current = items[index]
    const img = imgRef.current
    if (current && img && !reduce) {
      const r = img.getBoundingClientRect()
      const to = poseOver(current.origin?.(), r.width, r.height)
      if (to) {
        closing.current = true
        await animate(img, { x: to.x, y: to.y, scale: to.scale }, { type: 'spring', stiffness: 260, damping: 30 })
        closing.current = false
      }
    }
    setIndex(-1)
  }, [items, index, reduce])
  const step = useCallback((d: number) => setIndex(i => (i + d + items.length) % items.length), [items.length])

  useEffect(() => {
    if (!isOpen) return
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (items.length > 1 && e.key === 'ArrowLeft') step(-1)
      if (items.length > 1 && e.key === 'ArrowRight') step(1)
    }
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      lenis?.start()
    }
  }, [isOpen, items.length, close, step, lenis])

  // Size the picture fits into on screen, so the morph can start from the thumbnail.
  const fit = useMemo(() => {
    if (!item || typeof window === 'undefined') return { w: 1, h: 1 }
    const maxW = innerWidth * (item.caption && innerWidth > 900 ? 0.55 : 0.9)
    const maxH = innerHeight * 0.85
    const ar = (item.width ?? 1) / (item.height ?? 1)
    return maxW / maxH > ar ? { w: maxH * ar, h: maxH } : { w: maxW, h: maxW / ar }
  }, [item])

  const from = !reduce && item ? poseOver(item.origin?.(), fit.w, fit.h) : null
  // Stable, so opening or paging the lightbox doesn't re-render every thumbnail on the page.
  const ctx = useMemo(() => ({ open }), [open])

  return (
    <LightboxContext.Provider value={ctx}>
      {children}
      <AnimatePresence>
        {item && (
          // No backdrop blur: under a 95% fill it barely showed, but the whole
          // screen was re-blurred on every frame of the open and close.
          // touch-none keeps a swipe on the overlay from scrolling the page
          // behind it (phones have no Lenis to stop).
          <motion.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={item.alt}
            className="fixed inset-0 z-[90] flex cursor-zoom-out touch-none overscroll-contain items-center justify-center gap-[clamp(18px,3vw,44px)] bg-umber/95 max-[900px]:flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            onClick={close}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={item.src}
                ref={imgRef}
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                style={{ width: fit.w, height: fit.h }}
                className="rounded-lg object-contain shadow-[0_16px_64px_rgba(0,0,0,.6)] select-none"
                initial={from ?? { opacity: 0, scale: 0.94 }}
                animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
                transition={SPRING}
                drag={items.length > 1 ? 'x' : false}
                dragSnapToOrigin
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 60) step(info.offset.x < 0 ? 1 : -1)
                }}
                onClick={e => e.stopPropagation()}
                draggable={false}
              />
            </AnimatePresence>

            {item.caption && (
              <motion.div
                className="max-w-sm cursor-auto text-left max-[900px]:px-6 max-[900px]:text-center"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                onClick={e => e.stopPropagation()}
              >
                {item.caption}
              </motion.div>
            )}

            <button type="button" aria-label="Close" onClick={close}
              className="absolute top-[max(20px,env(safe-area-inset-top))] right-6 p-2 text-3xl leading-none text-bone/70 transition-opacity hover:text-bone">
              &times;
            </button>
            {items.length > 1 && (
              <>
                <button type="button" aria-label="Previous" onClick={e => { e.stopPropagation(); step(-1) }}
                  className="lightbox-nav left-5">&#8249;</button>
                <button type="button" aria-label="Next" onClick={e => { e.stopPropagation(); step(1) }}
                  className="lightbox-nav right-5">&#8250;</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </LightboxContext.Provider>
  )
}
