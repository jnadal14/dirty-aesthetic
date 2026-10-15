// Site-wide settings shared by every page: nav, footer links, form and pixel ids.
export const site = {
  name: 'Dirty Aesthetic',
  url: 'https://www.dirtyaesthetic.com',
  email: 'dirtyaestheticmusic@gmail.com',
  formspree: 'https://formspree.io/f/xjgvzapo',
  metaPixelId: '1503298771840666',
}

export const nav = [
  { href: '/music', label: 'Music' },
  { href: '/watch', label: 'Watch' },
  { href: '/store', label: 'Store' },
  { href: '/epk', label: 'EPK' },
  { href: '/contact', label: 'Contact' },
]

export const social = [
  { href: 'https://instagram.com/dirtyaestheticband', label: 'Instagram' },
  { href: 'https://tiktok.com/@dirty_aesthetic', label: 'TikTok' },
  { href: 'https://open.spotify.com/artist/6LJB3zSDmtQ3NxA6GjUwlt', label: 'Spotify' },
  { href: 'https://music.apple.com/ca/artist/dirty-aesthetic/1773260865', label: 'Apple Music' },
  { href: 'https://dirtyaesthetic.bandcamp.com/', label: 'Bandcamp' },
  { href: 'https://www.youtube.com/@dirtyaesthetic', label: 'YouTube' },
]

// Nafta lacks some letters of the Nations' names (ə, θ, ɬ, ʷ, ḵ, ú, combining
// marks); those fall back to the system font.
export const landAcknowledgment =
  'We gratefully acknowledge that we live, write, and play music on the traditional, ancestral, and unceded territories of the xʷməθkʷəy̓əm (Musqueam), Sḵwx̱wú7mesh (Squamish), and səlilwətaɬ (Tsleil-Waututh) Nations.'
