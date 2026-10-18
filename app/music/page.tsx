import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import PageBackdrop from '@/components/PageBackdrop'
import StreamButtons from '@/components/StreamButtons'
import Credits, { type Project } from '@/components/music/Credits'
import FlipCover, { type Release } from '@/components/music/FlipCover'
import RecordSleeve from '@/components/music/RecordSleeve'
import Tracklist from '@/components/music/Tracklist'
import Reveal from '@/components/motion/Reveal'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import SplitText from '@/components/motion/SplitText'
import { credits } from '@/lib/data'
import { pageMeta } from '@/lib/meta'
import jsonLd from '@/content/jsonld/music.json'

export const metadata = pageMeta({
  title: 'Music • Dirty Aesthetic',
  description: 'Modern Nostalgia is the debut album from Dirty Aesthetic, eleven tracks, out August 2026. Full tracklist, album notes, and every single and EP from the Vancouver indie garage rock five piece.',
  ogDescription: 'Modern Nostalgia, the debut album from Dirty Aesthetic, is out now.',
  path: '/music',
  image: '/assets/images/covers/cover_LP_modern_nostalgia.jpg',
})

const ord = (d: number, s: string) => <>{d}<sup>{s}</sup></>
const catalog: Release[] = [
  { title: 'Modern Nostalgia (Single)', meta: <>Single, July {ord(23, 'rd')}, 2026</>, href: 'https://open.spotify.com/album/3QDhfee3YZ7DVJ2jWgfAsk?si=I5QxEb1pRBmFr5V6IpASeQ', cover: 'cover_modern_nostalgia', size: 1200, alt: 'Modern Nostalgia single cover' },
  { title: 'Back to Me', meta: <>Single, June {ord(18, 'th')}, 2026</>, href: 'https://open.spotify.com/track/60YsvPN7fAjT2XyJgfB6vx', cover: 'cover_back_to_me', size: 1200, alt: 'Back to Me single cover' },
  { title: 'Irrational', meta: <>Single, May {ord(23, 'rd')}, 2026</>, href: 'https://open.spotify.com/album/7xPxKD8fm8jOE2BbpzGw3K', cover: 'cover_irrational', size: 1200, alt: 'Irrational single cover' },
  { title: 'Sugar on the Rocks', meta: <>EP, January {ord(9, 'th')}, 2026</>, href: 'https://open.spotify.com/album/2ZwIHEk5AY084OVll4oFLW?si=bvZJXrr0Saeuf6ixCj_jjg', cover: 'cover_sugar_on_the_rocks', size: 800, alt: 'Sugar on the Rocks EP cover' },
  { title: 'Sugar Bottom', meta: <>Single, August {ord(29, 'th')}, 2025</>, href: 'https://open.spotify.com/track/4JQE8SO7E9kqkfikmz6Zzc?si=a8c2ee308e8f424c', cover: 'cover_sugar_bottom', size: 800, alt: 'Sugar Bottom cover' },
  { title: 'Blue Roses', meta: <>Single, February {ord(23, 'rd')}, 2025</>, href: 'https://open.spotify.com/track/1d913Z6QvDaaYtTAcfCwWI?si=c221919a150b445b', cover: 'cover_blue_roses', size: 800, alt: 'Blue Roses cover' },
  { title: 'While I Wonder', meta: <>Single, December {ord(5, 'th')}, 2024</>, href: 'https://open.spotify.com/track/6ostKPYA1pmcBByK0Npk1y?si=90d66523104146de', cover: 'cover_while_i_wonder', size: 800, alt: 'While I Wonder cover' },
  { title: 'Run', meta: <>Single, October {ord(18, 'th')}, 2024</>, href: 'https://open.spotify.com/track/13mNifmsvTg9hh5qpG8fyE?si=f34e309009f04cd1', cover: 'cover_run', size: 800, alt: 'Run cover' },
]

function Heading({ text, id }: { text: string; id?: string }) {
  return <SplitText as="h2" text={text} by="char" stagger={0.025} className="display mb-10 text-center text-giant text-accent" {...(id && { id })} />
}

export default function Music() {
  return (
    <div className="pt-32 pb-24 md:pt-40 short:pt-20">
      <JsonLd data={jsonLd} />
      <PageBackdrop image="music-bg" />

      <div className="container-x max-w-6xl">
        <SplitText as="h1" text="Music" onMount className="display text-center text-giant" />

        {/* Featured release */}
        <section className="mt-12 grid items-center gap-[clamp(28px,5vw,72px)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] short:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
          <div className="mx-auto w-full max-w-[420px] md:max-w-none md:pr-[10%] short:max-w-[60svh]"><RecordSleeve /></div>
          <Reveal onMount delay={0.4} className="text-center md:text-left short:text-left">
            <span className="kicker">Out Now</span>
            <SplitText as="h2" onMount delay={0.5} text="Modern Nostalgia" className="display mt-2 text-giant text-accent" />
            <p className="mt-3 text-sand">Debut Album &bull; 11 Tracks &bull; 43:29</p>
            <StreamButtons className="mt-6 justify-center md:justify-start" />
          </Reveal>
        </section>

        {/* About + tracklist */}
        <section className="mt-[clamp(72px,10vw,128px)] grid items-start gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Reveal className="space-y-4 text-bone/90">
            <SplitText as="h2" text="About the Album" className="display mb-6 text-huge text-accent" />
            <p><em>Modern Nostalgia</em> is the debut album from Dirty Aesthetic, released on August 13, 2026, across eleven tracks and 43 minutes. Where the band&rsquo;s first EP, <em>Sugar on the Rocks</em>, followed the excitement and eventual collapse of first love, the album begins in the aftermath.</p>
            <p>Across the record the songs work through grief, longing, strain on mental health, changing relationships, and the decisions people make when they are trying to move forward. The arrangements widen without losing the immediacy of the live show: guitars shift between sharp garage rock movement, melodic surf colour, and quieter passages that leave more room for the songs&rsquo; emotional weight.</p>
            <p>Three songs arrived ahead of the album. &ldquo;Irrational&rdquo; came in May 2026, &ldquo;Back to Me&rdquo; in June, and the title track in July. The official video for &ldquo;Modern Nostalgia&rdquo; went up the night the record landed, and is on the <Link className="prose-link" href="/watch">watch page</Link>.</p>
          </Reveal>
          <Tracklist className="lg:sticky lg:top-28" />
        </section>

        {/* Catalog */}
        <section className="mt-[clamp(72px,10vw,128px)]">
          <Heading text="The Rest of the Catalog" />
          <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-[clamp(14px,2vw,24px)] md:grid-cols-3">
            {catalog.map((r, i) => <FlipCover key={r.title} release={r} index={i} />)}
          </div>
        </section>

        {/* Credits */}
        <section id="credits" className="mt-[clamp(72px,10vw,128px)]">
          <Heading text="Credits" />
          <Credits projects={credits.projects as unknown as Project[]} />
        </section>

        <Reveal className="mt-16">
          <SpotifyEmbed className="h-[380px]" />
        </Reveal>
      </div>
    </div>
  )
}
