import { asset } from '@/lib/data'

type Props = {
  src: string
  webp?: string
  /** "path 640w, path 1280w" lists, when the asset has several widths. */
  srcSet?: string
  webpSrcSet?: string
  sizes?: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

/**
 * A <picture> over the images optimize_images.py writes: a WebP source and the
 * JPEG fallback. Paths come from the manifests as written (no leading slash).
 */
export default function Picture({ src, webp, srcSet, webpSrcSet, sizes, alt, width, height, className, priority }: Props) {
  return (
    <picture>
      {(webpSrcSet || webp) && <source type="image/webp" srcSet={webpSrcSet ?? asset(webp!)} sizes={sizes} />}
      <img
        src={asset(src)}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  )
}

/**
 * WebP srcset for a release cover: the 600 optimize_images.py writes beside
 * every cover, then the full display size. Covers draw at 300-420 CSS px, so
 * phones and 1x screens stop at the 600.
 */
export function coverSet(name: string, width: number) {
  return `/assets/images/covers/${name}-600.webp 600w, /assets/images/covers/${name}.webp ${width}w`
}

/** srcset for the music-video covers: assets/images/video/<slug>-{640,1280,1920}.{jpg,webp} */
export function videoCoverSet(slug: string, ext: 'jpg' | 'webp') {
  return [640, 1280, 1920].map(w => `/assets/images/video/${slug}-${w}.${ext} ${w}w`).join(', ')
}
