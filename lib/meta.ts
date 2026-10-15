import type { Metadata } from 'next'
import { site } from './site'

/**
 * Per-page metadata. Canonicals keep the .html URLs the site has always used
 * (and that GitHub Pages still serves), so search results and ad links are
 * unchanged by the rebuild.
 */
export function pageMeta({ title, description, ogDescription, path, image = '/assets/images/backgrounds/header-desktop.jpg', imageSize, robots }: {
  title: string
  description: string
  ogDescription?: string
  path: string
  image?: string
  imageSize?: [number, number]
  robots?: Metadata['robots']
}): Metadata {
  const url = `${site.url}${path}`
  const images = [{ url: `${site.url}${image}`, ...(imageSize && { width: imageSize[0], height: imageSize[1] }) }]
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description: ogDescription ?? description, images },
    twitter: { card: 'summary_large_image', title, description: ogDescription ?? description, images: images.map(i => i.url) },
    ...(robots && { robots }),
  }
}
