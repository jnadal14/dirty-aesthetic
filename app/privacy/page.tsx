import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta({
  title: 'Privacy • Dirty Aesthetic',
  description: 'Privacy policy for Dirty Aesthetic website. How we handle your data and privacy.',
  ogDescription: 'Privacy policy for Dirty Aesthetic website.',
  path: '/privacy',
})

// Privacy has no entrance animation on purpose: it should simply be there.
export default function Privacy() {
  return (
    <div className="container-x flex min-h-[80svh] max-w-3xl flex-col items-center justify-center pt-36 pb-24 text-center">
      <h1 className="display text-huge">Privacy policy</h1>
      <div className="mt-8 max-w-[48ch] space-y-5 text-sand">
        <p>We do not run our own analytics or user accounts on this site. Forms on the contact and store pages send what you submit to us by email. Outbound links to platforms like Spotify and Instagram follow their own policies.</p>
        <p>This site uses the Meta (Facebook) pixel, which sets cookies and reports page views to Meta so we can measure how our advertising is performing. You can control this through your browser&rsquo;s cookie settings or your <a className="prose-link" href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener">Meta ad preferences</a>.</p>
      </div>
    </div>
  )
}
