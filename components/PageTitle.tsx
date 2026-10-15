import SplitText from './motion/SplitText'
import Reveal from './motion/Reveal'

/** Inner-page heading: the title rises word by word on first paint, the lede follows. */
export default function PageTitle({ title, lede, className = '' }: { title: string; lede?: React.ReactNode; className?: string }) {
  return (
    <header className={`text-center ${className}`}>
      <SplitText as="h1" text={title} onMount stagger={0.08} className="display text-giant tracking-wide" />
      {lede && (
        <Reveal onMount delay={0.35} className="mx-auto mt-5 max-w-3xl text-[1.1em] text-sand">
          {lede}
        </Reveal>
      )}
    </header>
  )
}
