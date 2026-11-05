import { site } from '@/lib/site'

// Google's snippet, with one change in the same spirit as the Meta Pixel:
// dataLayer and gtag() exist at once, so anything pushed early is queued, but
// gtm.js itself is only fetched after `load` so it never competes with the
// page's own scripts, fonts and hero for bandwidth. GA4's enhanced measurement
// picks up client-side route changes from the history API on its own.
const snippet = `window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
(function(w,d){var load=function(){var s=d.createElement('script');s.async=true;
s.src='https://www.googletagmanager.com/gtm.js?id=${site.googleTagId}';d.head.appendChild(s)};
if(d.readyState==='complete')load();else w.addEventListener('load',load)})(window,document);`

export default function GoogleTagHead() {
  return <script id="google-tag" dangerouslySetInnerHTML={{ __html: snippet }} />
}
