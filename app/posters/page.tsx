import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import PageTitle from '@/components/PageTitle'
import PosterGrid, { type ArchivedPoster } from '@/components/posters/PosterGrid'
import { pastShows, posterImages } from '@/lib/data'
import { pageMeta } from '@/lib/meta'
import jsonLd from '@/content/jsonld/posters.json'

export const metadata = pageMeta({
  title: 'Poster Archive • Dirty Aesthetic',
  description: 'Dirty Aesthetic show poster archive. Past Vancouver shows, venues, dates, and billed artists.',
  ogDescription: 'Past Dirty Aesthetic shows, posters, venues, and billed artists.',
  path: '/posters',
})

// shows.json points at masters under _source/, which are never published.
// Only posters with generated variants are shown; the rest are skipped.
const posters: ArchivedPoster[] = pastShows
  .filter(show => show.poster && posterImages[show.poster])
  .map(show => ({ show, image: posterImages[show.poster!] }))

function Back() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-bone/12 bg-[rgba(5,4,3,.88)] px-4 py-2 text-sm tracking-wide text-bone transition-colors hover:border-accent/60 hover:bg-accent/14">
      <span aria-hidden>←</span> Back to Landing Page
    </Link>
  )
}

export default function Posters() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_14%_5%,rgba(176,122,63,.15),transparent_28rem),radial-gradient(circle_at_88%_28%,rgba(122,54,0,.12),transparent_34rem)]">
      {/* The page's ground colour is fixed, so it runs on behind the layout's footer. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[#050403]" />
      <JsonLd data={jsonLd} />
      <div className="container-x pt-32 pb-24 md:pt-40 short:pt-20 max-sm:px-3">
        <PageTitle
          title="Poster Archive"
          lede={
            <>
              <p>Show posters from Dirty Aesthetic. The archive runs from the <em>Sugar on the Rocks</em> EP release in January 2026.</p>
              <p className="mt-3">For dates still to come, see the <Link className="prose-link" href="/#upcoming-section">upcoming shows</Link>.</p>
            </>
          }
        />
        <section aria-labelledby="poster-archive-heading" className="mt-14">
          <h2 className="sr-only" id="poster-archive-heading">Archived show posters</h2>
          <PosterGrid posters={posters} />
        </section>
        <div className="mt-[clamp(52px,7vw,88px)] text-center"><Back /></div>
      </div>
    </div>
  )
}
