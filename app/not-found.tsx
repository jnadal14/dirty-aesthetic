import Button from '@/components/Button'
import SplitText from '@/components/motion/SplitText'

export const metadata = { title: 'Not Found • Dirty Aesthetic', robots: { index: false } }

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[80svh] flex-col items-center justify-center pt-32 pb-24 text-center">
      <SplitText as="h1" text="Lost the plot" onMount className="display text-giant" />
      <p className="mt-4 text-sand">That page isn&rsquo;t here. Try the music, or head back to the start.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">Home</Button>
        <Button href="/music" variant="ghost">Music</Button>
      </div>
    </div>
  )
}
