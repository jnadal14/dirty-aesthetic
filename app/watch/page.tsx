import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import PageBackdrop from '@/components/PageBackdrop'
import PageTitle from '@/components/PageTitle'
import YouTubeFacade from '@/components/YouTubeFacade'
import Reveal from '@/components/motion/Reveal'
import SplitText from '@/components/motion/SplitText'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { pageMeta } from '@/lib/meta'
import { streamLink } from '@/lib/data'
import jsonLd from '@/content/jsonld/watch.json'

export const metadata = pageMeta({
  title: 'Watch • Dirty Aesthetic',
  description: "Watch Dirty Aesthetic's music videos and live performances. Vancouver indie garage rock band.",
  ogDescription: "Watch Dirty Aesthetic's music videos and live performances.",
  path: '/watch',
})

const clips = [
  {
    id: 'wYlm0XSz5B4', cover: 'irrational', name: 'Irrational', kind: 'Official Video',
    title: 'Dirty Aesthetic, Irrational (Official Music Video)', label: 'Play the Irrational music video',
    note: <>Released as a single on May 23, 2026 and later sequenced as track ten on <em>Modern Nostalgia</em>. Video published May 31, 2026.</>,
  },
  {
    id: '80EybU7D6Jk', name: 'Bardia Blues', kind: 'Clip',
    title: 'Dirty Aesthetic, Bardia Blues', label: 'Play the Bardia Blues clip',
    note: <>Bardia showing off between songs at the Roxy.</>,
  },
  {
    id: '2PJ36_icZkM', name: 'Take What You Need', kind: 'Behind the Scenes',
    title: 'Dirty Aesthetic, Take What You Need (Behind the Scenes)', label: 'Play the Take What You Need behind the scenes clip',
    note: <>Behind the recording of &ldquo;Take What You Need&rdquo; from their EP, <em>Sugar on the Rocks</em>.</>,
  },
]

export default function Watch() {
  const spotify = streamLink('spotify')
  return (
    <div className="pt-32 pb-24 md:pt-40 short:pt-20">
      <JsonLd data={jsonLd} />
      <PageBackdrop image="watch-bg" scrim="linear-gradient(180deg,rgba(32,23,15,.92) 0%,rgba(32,23,15,.85) 50%,rgba(32,23,15,.92) 100%)" />
      <div className="container-x">
        <PageTitle title="Watch" lede="Official music videos, live footage, and clips from behind the scenes from Dirty Aesthetic, a five piece indie garage rock band from Vancouver, British Columbia." />
      </div>

      <section className="mx-auto mt-12 max-w-[1000px] px-[clamp(16px,4vw,48px)]">
        <Reveal onMount delay={0.5} scale={0.94}>
          <YouTubeFacade id="WUQRlII35Ow" cover="modern-nostalgia" priority sizes="(min-width: 1100px) 1000px, 94vw"
            title="Dirty Aesthetic, Modern Nostalgia (Official Music Video)" label="Play the Modern Nostalgia music video" />
        </Reveal>
        <Reveal onMount delay={0.6} className="text-center">
          <p className="mt-6 text-[clamp(1.05em,2vw,1.3em)] tracking-wide">Official Music Video for &ldquo;Modern Nostalgia&rdquo;</p>
          <p className="mx-auto mt-3 max-w-[64ch] text-sand">
            The title track from <em>Modern Nostalgia</em>, the band&rsquo;s debut album. Track five of eleven. The video landed on the night of August 12, 2026, a few hours ahead of the album itself.
            {' '}Stream the album on {spotify ? <a className="prose-link" href={spotify} target="_blank" rel="noopener">Spotify</a> : 'Spotify'} or read more on the <Link className="prose-link" href="/music">music page</Link>.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto mt-24 max-w-[900px] px-[clamp(16px,4vw,48px)]">
        <SplitText text="More Videos" className="display mb-10 text-center text-huge" />
        <Stagger className="grid gap-x-[clamp(16px,3vw,28px)] gap-y-12 sm:grid-cols-2">
          {clips.map(c => (
            <StaggerItem key={c.id} as="article">
              <YouTubeFacade id={c.id} cover={c.cover} title={c.title} label={c.label} rounded="rounded-xl"
                sizes="(min-width: 900px) 410px, (min-width: 640px) 46vw, 92vw" />
              <h3 className="display mt-4 mb-1 text-[clamp(1.2em,2.2vw,1.45em)]">{c.name}</h3>
              <p className="text-[.92em] text-sand">
                <span className="mb-1 block text-[.78em] uppercase tracking-[.16em] text-accent">{c.kind}</span>
                {c.note}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  )
}
