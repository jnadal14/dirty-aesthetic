import { preload } from 'react-dom'
import { coverSet } from '@/components/Picture'
import Artwork from '@/components/Artwork'
import Button from '@/components/Button'
import ContactForm from '@/components/ContactForm'
import Footer from '@/components/Footer'
import JsonLd from '@/components/JsonLd'
import SectionBg from '@/components/SectionBg'
import StreamButtons from '@/components/StreamButtons'
import YouTubeFacade from '@/components/YouTubeFacade'
import Hero from '@/components/home/Hero'
import Shows from '@/components/home/Shows'
import Tracklist from '@/components/music/Tracklist'
import Reveal from '@/components/motion/Reveal'
import SplitText from '@/components/motion/SplitText'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { release, upcoming } from '@/lib/data'
import { pageMeta } from '@/lib/meta'
import { showSchema } from '@/lib/shows'
import jsonLd from '@/content/jsonld/home.json'

export const metadata = {
  ...pageMeta({
    title: 'Dirty Aesthetic • Modern Nostalgia',
    description: 'Modern Nostalgia, the debut album from Dirty Aesthetic, is out now. Stream it everywhere and watch the official music video.',
    ogDescription: 'The debut album from Dirty Aesthetic is out now. Stream Modern Nostalgia everywhere.',
    path: '/',
    image: '/assets/images/covers/cover_LP_modern_nostalgia.jpg',
    imageSize: [1200, 1200],
  }),
  title: { absolute: 'Dirty Aesthetic • Modern Nostalgia' },
}

const EP_TRACKS = ['Corduroy', 'Take What You Need', 'Heart Home', 'Sugar Bottom', 'Out of Key', 'White Flag']
const EP_LINKS = {
  spotify: 'https://open.spotify.com/album/2ZwIHEk5AY084OVll4oFLW?si=bvZJXrr0Saeuf6ixCj_jjg',
  apple: 'https://music.apple.com/in/album/sugar-on-the-rocks-ep/1861089782',
}

export default function Home() {
  // The hero's first paint is the timelapse's first frame, one per screen
  // shape, so a phone never fetches the desktop cut it will not paint.
  preload('/assets/images/backgrounds/hero-timelapse-poster.webp', { as: 'image', type: 'image/webp', media: '(min-width: 641px)', fetchPriority: 'high' })
  preload('/assets/images/backgrounds/hero-timelapse-poster-mobile.webp', { as: 'image', type: 'image/webp', media: '(max-width: 640px)', fetchPriority: 'high' })
  preload('/assets/images/logos/da-wordmark.png', { as: 'image' })
  const events = showSchema(upcoming)

  return (
    <>
      <JsonLd data={jsonLd} />
      {events && <JsonLd data={events} />}

      <Hero />

      {/* Everything after the hero rises over it. */}
      <div className="relative z-10 bg-ink shadow-[0_-40px_80px_rgba(0,0,0,.6)]">

        <section id="modern-nostalgia-album-section" className="relative isolate overflow-clip py-[clamp(80px,12vw,150px)]">
          <SectionBg image="modern-nostalgia-album-bg" scrim="linear-gradient(180deg,rgba(6,4,3,.82) 0%,rgba(6,4,3,.7) 50%,rgba(6,4,3,.9) 100%)" />
          <div className="container-x grid max-w-6xl items-center gap-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,.85fr)_minmax(0,1fr)] short:grid-cols-2">
            <div className="mx-auto w-full max-w-[460px] lg:mx-0 short:max-w-[70svh]">
              <Artwork src="assets/images/covers/cover_LP_modern_nostalgia.jpg" webp="assets/images/covers/cover_LP_modern_nostalgia.webp" webpSrcSet={coverSet('cover_LP_modern_nostalgia', 1200)}
                fullSrc="/assets/images/covers/full/cover_LP_modern_nostalgia.webp" width={1200} height={1200}
                alt="Modern Nostalgia album cover by Dirty Aesthetic" label="View full Modern Nostalgia album artwork"
                sizes="(min-width: 1024px) 420px, 80vw" />
              <Reveal delay={0.15} className="mt-7 text-center lg:text-left">
                <span className="kicker">Out Now</span>
                <SplitText text="Modern Nostalgia" by="char" stagger={0.03} className="display mt-1 text-giant" />
                <p className="mt-2 text-sand">Debut Album &bull; 11 Tracks &bull; 43:29</p>
                <StreamButtons className="mt-5 justify-center lg:justify-start" />
              </Reveal>
            </div>
            <Tracklist />
          </div>
        </section>

        <section id="modern-nostalgia-video-section" className="relative isolate overflow-clip py-[clamp(80px,12vw,150px)]">
          <SectionBg image="video-bg" scrim="linear-gradient(180deg,rgba(4,4,8,.75),rgba(4,4,8,.55) 50%,rgba(4,4,8,.85))" />
          <div className="mx-auto max-w-[1000px] px-[clamp(16px,4vw,32px)] text-center">
            <Reveal><span className="kicker tracking-[.3em]">Official Music Video</span></Reveal>
            <SplitText text={release.video.title} by="char" stagger={0.03} className="display mt-2 mb-8 text-giant" />
            <Reveal delay={0.15} scale={0.94}>
              <YouTubeFacade id={release.video.youtubeId} cover="modern-nostalgia" sizes="(min-width: 1100px) 1000px, 92vw"
                title="Dirty Aesthetic, Modern Nostalgia (Official Music Video)" label="Play the Modern Nostalgia music video" />
            </Reveal>
          </div>
        </section>

        <section id="upcoming-section" className="relative isolate overflow-clip py-[clamp(72px,10vw,120px)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent_5%,rgba(234,57,42,.5)_30%,rgba(226,1,191,.5)_70%,transparent_95%)]">
          <SectionBg image="shows-bg" scrim="linear-gradient(180deg,rgba(9,4,5,.90) 0%,rgba(12,5,7,.84) 42%,rgba(5,2,3,.94) 100%),radial-gradient(ellipse 70% 60% at 20% 24%,rgba(234,57,42,.22) 0%,transparent 60%),radial-gradient(ellipse 58% 50% at 84% 76%,rgba(226,1,191,.18) 0%,transparent 62%)" />
          <Shows shows={upcoming} />
        </section>

        <section id="sugar-on-the-rocks-section" className="relative isolate overflow-clip py-[clamp(80px,12vw,150px)]">
          <SectionBg image="back-ep" mobile={false} scrim="linear-gradient(180deg,rgba(6,8,5,.82),rgba(6,8,5,.7) 50%,rgba(6,8,5,.9))" />
          <div className="container-x grid max-w-6xl items-center gap-[clamp(32px,5vw,72px)] md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] short:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
            <Artwork src="assets/images/covers/cover_sugar_on_the_rocks.jpg" webp="assets/images/covers/cover_sugar_on_the_rocks.webp" webpSrcSet={coverSet('cover_sugar_on_the_rocks', 800)}
              fullSrc="/assets/images/covers/full/cover_sugar_on_the_rocks.webp" width={800} height={800}
              alt="Sugar on the Rocks EP" label="View full Sugar on the Rocks artwork" sizes="(min-width: 768px) 380px, 80vw"
              className="mx-auto w-full max-w-[400px]" />
            <div>
              <Reveal delay={0.15} className="flex gap-2.5">
                <Button variant="spotify" href={EP_LINKS.spotify} external aria-label="Listen to Sugar on the Rocks on Spotify">Spotify</Button>
                <Button variant="apple" href={EP_LINKS.apple} external aria-label="Listen to Sugar on the Rocks on Apple Music">Apple Music</Button>
              </Reveal>
              <SplitText text="Sugar on the Rocks" by="char" stagger={0.03} className="display mt-5 text-giant" />
              <Reveal delay={0.2}><p className="mt-1 text-sand">6 tracks &bull; 22 minutes</p></Reveal>
              <Stagger className="mt-7 grid gap-x-10 sm:grid-cols-2" delay={0.25}>
                {EP_TRACKS.map((t, i) => (
                  <StaggerItem key={t} className="flex items-baseline gap-4 border-b border-bone/8 py-3">
                    <span className="text-sm text-accent tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span>{t}</span>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </section>

        {/* The contact photo runs on behind the footer (the layout skips its own here). */}
        <div className="relative isolate overflow-clip">
          <SectionBg image="contact-bg" scrim="linear-gradient(180deg,rgba(6,4,8,.9) 0%,rgba(8,5,10,.82) 40%,rgba(4,3,5,.9) 100%)" />
          <section id="contact-section" className="py-[clamp(80px,12vw,150px)]">
            <div className="container-x text-center">
              <SplitText text="Get In Touch" by="char" stagger={0.03} className="display text-giant text-accent" />
              <Reveal delay={0.1}><p className="mt-3 text-sand">Bookings, collaborations, and general inquiries.</p></Reveal>
              <ContactForm className="mt-10" />
            </div>
          </section>
          <Footer />
        </div>
      </div>
    </>
  )
}
