import Link from 'next/link'
import ContactForm from '@/components/ContactForm'
import JsonLd from '@/components/JsonLd'
import PageBackdrop from '@/components/PageBackdrop'
import PageTitle from '@/components/PageTitle'
import Reveal from '@/components/motion/Reveal'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { pageMeta } from '@/lib/meta'
import { site } from '@/lib/site'
import jsonLd from '@/content/jsonld/contact.json'

export const metadata = pageMeta({
  title: 'Contact • Dirty Aesthetic',
  description: "Contact Dirty Aesthetic. Get in touch with Vancouver's indie garage rock band for bookings and inquiries.",
  ogDescription: "Get in touch with Vancouver's indie garage rock band for bookings and inquiries.",
  path: '/contact',
})

export default function Contact() {
  return (
    <div className="container-x pt-32 pb-24 md:pt-40 short:pt-20">
      <JsonLd data={jsonLd} />
      <PageBackdrop image="contact-bg" scrim="linear-gradient(180deg,rgba(6,4,8,.9) 0%,rgba(8,5,10,.82) 45%,rgba(4,3,5,.94) 100%)" />
      <PageTitle title="Inquiries" lede={<span className="text-bone">We&apos;d love to work with you.</span>} />
      <Reveal onMount delay={0.45} className="mx-auto mt-4 max-w-2xl text-center text-sand">
        <p>Dirty Aesthetic is a five piece indie garage rock band based in Vancouver, British Columbia, playing venues, festivals, and events across the Lower Mainland. Use the form for bookings, festival submissions, support slots, press, or anything else. It reaches the whole band.</p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-6xl items-start gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ContactForm />
        <Stagger as="section" className="grid gap-5" delay={0.3}>
          {[
            ['What to include', <>Date, venue and city, set length, load in and set times, who else is on the bill, and what the offer looks like. The more of that arrives in the first message, the faster we can confirm.</>],
            ['Stage & input list', <>Five players: lead vocals, lead guitar, rhythm guitar with backing vocals, bass, and drums. A standard advance covers two vocal mics, two electric guitars, one acoustic, one bass, and a full kit.</>],
            ['Prefer email?', <><a className="prose-link" href={`mailto:${site.email}`}>{site.email}</a>. Bio, lineup, and press photos in full resolution live in the <Link className="prose-link" href="/epk">press kit</Link>; past bills are in the <Link className="prose-link" href="/posters">poster archive</Link>.</>],
          ].map(([h, body]) => (
            <StaggerItem key={h as string} as="article" className="rounded-sm border border-bone/10 bg-ink/55 p-6 desktop:bg-ink/40 desktop:backdrop-blur-sm">
              <h2 className="kicker mb-3 text-[.85rem]">{h}</h2>
              <p className="text-sand">{body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  )
}
