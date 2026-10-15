import Artwork from '@/components/Artwork'
import JsonLd from '@/components/JsonLd'
import PageBackdrop from '@/components/PageBackdrop'
import MerchForm from '@/components/store/MerchForm'
import Reveal from '@/components/motion/Reveal'
import SplitText from '@/components/motion/SplitText'
import { pageMeta } from '@/lib/meta'
import jsonLd from '@/content/jsonld/store.json'

export const metadata = pageMeta({
  title: 'Store • Dirty Aesthetic',
  description: 'Dirty Aesthetic merch preorder. First drop tee, $35.',
  path: '/store.html',
  image: '/assets/images/merch/merch-1.jpg',
})

export default function Store() {
  return (
    <div className="flex min-h-svh items-center pt-32 pb-20 md:pt-28 short:pt-20">
      <JsonLd data={jsonLd} />
      <PageBackdrop image="ldean-merch-bg" dir="/assets/images/merch" mobile={false}
        scrim="linear-gradient(180deg,rgba(10,7,5,.88) 0%,rgba(32,23,15,.78) 45%,rgba(10,7,5,.92) 100%)" />
      <section className="container-x grid items-center gap-[clamp(32px,5vw,72px)] md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] short:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] short:items-start">
        <Artwork
          src="assets/images/merch/merch-1.jpg" webp="assets/images/merch/merch-1.webp"
          fullSrc="/assets/images/merch/merch-1.webp" width={1400} height={1414}
          alt="Dirty Aesthetic first merch drop" label="View full merch design"
          sizes="(min-width: 768px) 40vw, 92vw" priority onMount
          className="mx-auto w-full max-w-[460px] short:sticky short:top-20 short:max-w-[70svh]"
        />

        <Reveal onMount delay={0.2} className="rounded-md border border-bone/10 bg-umber/70 p-[clamp(24px,3.5vw,44px)] backdrop-blur-md">
          <header>
            <span className="inline-block rounded-sm bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-[#120c07]">Preorder</span>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4">
              <SplitText as="h1" onMount delay={0.3} text="Dirty Aesthetic Tee" className="display text-huge" />
              <span className="display text-huge text-accent">$35</span>
            </div>
          </header>
          <div className="mt-5 space-y-4 text-[1.05em] text-sand">
            <p>The first merch drop from Dirty Aesthetic. Select the artwork to see the full design.</p>
            <p>This is a preorder rather than a checkout: send your size and quantity below and the band will email you to sort payment and pickup. Pick up in Vancouver at a show, or have it shipped. Choose below, and add an address if you want it mailed.</p>
            <ul className="grid gap-1.5 pt-1">
              {[['Sizes', 'XS, S, M, L, XL, XXL'], ['Price', '$35 CAD each'], ['Delivery', 'Local pickup in Vancouver, or shipping']].map(([k, v]) => (
                <li key={k} className="grid grid-cols-[6rem_1fr]"><strong className="font-normal text-accent">{k}</strong>{v}</li>
              ))}
            </ul>
          </div>
          <MerchForm />
        </Reveal>
      </section>
    </div>
  )
}
