import Button from '@/components/Button'
import JsonLd from '@/components/JsonLd'
import SectionBg from '@/components/SectionBg'
import Gallery, { type GalleryImage } from '@/components/epk/Gallery'
import Members, { type Member } from '@/components/epk/Members'
import TornPhoto from '@/components/epk/TornPhoto'
import Reveal from '@/components/motion/Reveal'
import SplitText from '@/components/motion/SplitText'
import Tilt from '@/components/motion/Tilt'
import { epkImages, type ImageEntry } from '@/lib/data'
import { pageMeta } from '@/lib/meta'
import { site } from '@/lib/site'
import jsonLd from '@/content/jsonld/epk.json'

export const metadata = pageMeta({
  title: 'EPK • Dirty Aesthetic',
  description: 'Official press kit for Dirty Aesthetic, a five piece indie garage rock band from Vancouver BC. Full band bio, lineup, press photo gallery, booking contact, and a downloadable EPK PDF.',
  ogDescription: 'Electronic Press Kit for Dirty Aesthetic, a five piece indie rock band from Vancouver. Debut album Modern Nostalgia out now.',
  path: '/epk.html',
})

const lineup = epkImages.lineup as Record<string, ImageEntry>
const members: Member[] = [
  { key: 'bardia', name: 'Bardia', fullName: 'Bardia Tarjoman', role: 'Lead Guitar' },
  { key: 'dylan', name: 'Dylan', fullName: 'Dylan Iwaschuk', role: 'Lead Vocals' },
  { key: 'jacob', name: 'Jacob', fullName: 'Jacob Nadal', role: 'Rhythm Guitar, Backing Vocals' },
  { key: 'josh-c', name: 'Josh C.', fullName: 'Josh Chapman', role: 'Drums' },
  { key: 'josh-s', name: 'Josh S.', fullName: 'Josh Seaman', role: 'Bass' },
].map(m => ({ ...m, image: lineup[m.key] }))

const gallery = epkImages.gallery as GalleryImage[]

function SectionTitle({ text }: { text: string }) {
  return <SplitText text={text} by="char" stagger={0.03} className="display mb-[clamp(32px,5vw,56px)] text-center text-giant text-accent" />
}

export default function Epk() {
  return (
    <div className="bg-[#0d0906]">
      <JsonLd data={jsonLd} />

      <section className="relative isolate px-[clamp(20px,6vw,80px)] pt-[clamp(120px,14vw,160px)] pb-24">
        <SectionBg image="epk-bg" lazy={false} scrim="linear-gradient(180deg,rgba(32,23,15,.76) 0%,rgba(32,23,15,.82) 50%,rgba(13,9,6,1) 100%)" />
        <div className="mx-auto grid max-w-6xl items-start gap-[clamp(28px,4vw,56px)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div>
            <h1 className="text-center lg:text-left">
              <Tilt className="mx-auto w-[min(80vw,520px)] lg:mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/logos/da-wordmark.png" alt="Dirty Aesthetic" className="w-full drop-shadow-[0_8px_30px_rgba(0,0,0,.5)]" decoding="async" fetchPriority="high" />
              </Tilt>
              <Reveal onMount delay={0.2} className="kicker mt-4 block text-[.85rem]">Press Kit &amp; Band Bio</Reveal>
            </h1>
            <Reveal onMount delay={0.3} className="mt-8 space-y-4 text-[1.05em] text-bone/90">
              <p>Dirty Aesthetic is a five piece indie rock band from Vancouver, British Columbia. Formed in the summer of 2024, the band combines garage and surf energy with alternative and folk textures, moving between volatile live peaks and more exposed, emotionally direct songwriting.</p>
              <p>Their debut EP, <em>Sugar on the Rocks</em>, followed the excitement and eventual collapse of first love. Their debut album, <em>Modern Nostalgia</em>, begins in the aftermath. Across eleven songs, the album explores grief, longing, strain on mental health, changing relationships, and the decisions people make when they are trying to move forward.</p>
              <p>The album expands the band&rsquo;s sound without losing the immediacy of its live show. Guitars shift between sharp garage rock movement, melodic surf colour, and quieter passages that leave more room for the songs&rsquo; emotional weight.</p>
              <p>Dirty Aesthetic have built their audience through Vancouver&rsquo;s independent music community, playing rooms including Green Auto, Red Gate, The Roxy and the Biltmore Cabaret, and festival stages across the region. <em>Modern Nostalgia</em> arrived on August 13, 2026 alongside an official video for the title track, and the band continues to play regularly across the Lower Mainland.</p>
            </Reveal>
          </div>
          {/* On desktop the player is exactly as tall as its ten top tracks (728px:
              the header plus ten fixed-height rows) and follows the bio as you scroll. */}
          <Reveal onMount delay={0.45} className="lg:sticky lg:top-28">
            <iframe className="h-[380px] w-full rounded-xl lg:h-[728px]" src="https://open.spotify.com/embed/artist/6LJB3zSDmtQ3NxA6GjUwlt" title="Dirty Aesthetic on Spotify"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
          </Reveal>
        </div>
      </section>

      <TornPhoto />

      <section className="relative isolate py-[clamp(72px,10vw,128px)]">
        <SectionBg image="members-bg" scrim="linear-gradient(180deg,rgba(13,9,6,.92) 0%,rgba(13,9,6,.8) 50%,rgba(13,9,6,.95) 100%)" />
        <SectionTitle text="Band Members" />
        <Members members={members} />
      </section>

      <section className="px-[clamp(12px,3vw,40px)] py-[clamp(72px,10vw,128px)]">
        <SectionTitle text="Gallery" />
        <div className="mx-auto max-w-[1280px]">
          <Gallery images={gallery} />
          <p className="mt-6 text-center text-sm text-sand/80">Photo credit available on request</p>
        </div>
      </section>

      <section className="px-6 pb-[clamp(72px,10vw,128px)] text-center">
        <SectionTitle text="Contact" />
        <Reveal delay={0.1}>
          <p><a className="link-underline text-[clamp(1.1em,2.4vw,1.5em)] text-bone" href={`mailto:${site.email}`}>{site.email}</a></p>
          <p className="mt-3"><a className="link-underline text-sand hover:text-bone" href="https://linktr.ee/dirtyaesthetic" target="_blank" rel="noopener">All Links</a></p>
        </Reveal>
        <Reveal delay={0.2} className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="ghost" href="/assets/downloads/dirtyaesthetic_epk.pdf" download="DirtyAesthetic-EPK.pdf">Download Press Kit (PDF)</Button>
          <Button variant="ghost" href="/assets/downloads/dirtyaesthetic_stage_plot.pdf" download="DirtyAesthetic-StagePlot-InputList.pdf">Download Stage Plot &amp; Input List (PDF)</Button>
        </Reveal>
      </section>
    </div>
  )
}
