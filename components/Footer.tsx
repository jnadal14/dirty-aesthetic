import Link from 'next/link'
import { landAcknowledgment, social } from '@/lib/site'

/** `transparent` drops the black ground so a background behind it shows through. */
export default function Footer({ transparent = false }: { transparent?: boolean }) {
  return (
    <footer className={`relative z-10 flex flex-col items-center gap-4 border-t border-bone/6 ${transparent ? '' : 'bg-ink'} px-4 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-center`}>
      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
        {social.map(s => (
          <li key={s.href}>
            <a href={s.href} target="_blank" rel="noopener" className="link-underline py-1 tracking-wide text-sand hover:text-bone">{s.label}</a>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-center gap-4 text-sand">
        <Link href="/privacy" className="hover:text-bone">Privacy</Link>
        <span className="inline-flex items-center gap-1.5">
          ©
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/logos/da-wordmark.png" alt="Dirty Aesthetic" loading="lazy" decoding="async" className="relative -top-1 h-7 w-auto opacity-70" />
        </span>
      </div>
      <p className="m-0 max-w-[640px] text-[.62rem] leading-relaxed tracking-[.04em] text-bone/50 text-balance">{landAcknowledgment}</p>
    </footer>
  )
}
