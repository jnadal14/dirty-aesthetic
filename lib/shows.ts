import type { Show } from './data'
import { site } from './site'

const MONTHS: Record<string, [string, string]> = {
  Jan: ['January', '01'], Feb: ['February', '02'], Mar: ['March', '03'], Apr: ['April', '04'],
  May: ['May', '05'], Jun: ['June', '06'], Jul: ['July', '07'], Aug: ['August', '08'],
  Sep: ['September', '09'], Oct: ['October', '10'], Nov: ['November', '11'], Dec: ['December', '12'],
}

export const ordinal = (n: number) =>
  n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'

/** "Mar 6, 2026" → { month: 'March', day: 6, suffix: 'th', iso: '2026-03-06' } */
export function parseShowDate(date: string) {
  const m = /^(\w{3})\w*\s+(\d{1,2}),\s*(\d{4})$/.exec(date)
  if (!m || !MONTHS[m[1]]) return null
  const day = Number(m[2])
  return { month: MONTHS[m[1]][0], day, suffix: ordinal(day), iso: `${m[3]}-${MONTHS[m[1]][1]}-${String(day).padStart(2, '0')}` }
}

/**
 * The upcoming dates as MusicEvent structured data, built from the same
 * shows.json the section draws, so a date can never be announced in one place
 * and stale in the other.
 */
export function showSchema(shows: Show[]) {
  const events = shows.flatMap(s => {
    const d = parseShowDate(s.date)
    if (!d || !s.venue) return []
    // `city` holds a street address for some rooms; a leading digit tells them apart.
    const street = /^\d/.test(s.city || '') ? s.city : null
    return [{
      '@type': 'MusicEvent',
      name: `Dirty Aesthetic at ${s.venue}${s.title ? ', ' + s.title : ''}`,
      startDate: d.iso,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      url: `${site.url}/#upcoming-section`,
      location: {
        '@type': 'MusicVenue',
        name: s.venue,
        address: { '@type': 'PostalAddress', addressLocality: 'Vancouver', addressRegion: 'BC', addressCountry: 'CA', ...(street && { streetAddress: street }) },
      },
      performer: { '@id': `${site.url}/#band` },
      organizer: { '@id': `${site.url}/#band` },
      ...(s.poster && { image: `${site.url}/${s.poster.replace(/^\//, '')}` }),
      ...(s.link && { offers: { '@type': 'Offer', url: s.link, availability: 'https://schema.org/InStock' } }),
    }]
  })
  return events.length ? { '@context': 'https://schema.org', '@graph': events } : null
}
