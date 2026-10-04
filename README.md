# Dirty Aesthetic — Official Website

**[www.dirtyaesthetic.com](https://www.dirtyaesthetic.com)**

Official website for Dirty Aesthetic, an indie garage rock band from Vancouver, BC.

## Pages

- **Home** (`index.html`): hero timelapse, *Modern Nostalgia* tracklist, video, upcoming shows, *Sugar on the Rocks* EP and contact form
- **Music** (`music.html`): discography with streaming links
- **Watch** (`watch.html`): music videos and live footage
- **Store** (`store.html`): merch and physical media
- **EPK** (`epk.html`): press kit with bio, lineup, gallery, stage plot and downloads
- **Poster Archive** (`posters.html`): past show posters
- **Contact** (`contact.html`): contact form (Formspree)
- **Privacy** (`privacy.html`): privacy policy
- `lab.html`: unlisted, noindex animation sandbox, not linked from anywhere

The pages stay at the repo root on purpose: their URLs are linked from ads,
socials and search results, so moving them would break those links.

## Tech Stack

Static site with no framework and no build step.

- HTML / CSS / vanilla JS, one shared `css/styles.css` and `js/main.js`
- Custom font: Nafta Light (`assets/fonts/`)
- Vendored libraries in `vendor/` (Lenis smooth scroll, Motion animations), no runtime CDN
- Hosted on GitHub Pages with the custom domain in `CNAME`

## Structure

```
index.html … privacy.html   # The pages (see above). Must stay at the root.
css/styles.css               # All site styles (lab.css: sandbox only)
js/main.js                   # All site behaviour (lab.js: sandbox only)
vendor/                      # lenis.min.js, motion.min.js
data/                        # Content fetched at runtime (shows, release
                             #   links, gallery order, credits) plus the two
                             #   generated image manifests
assets/                      # Only what the browser loads. All committed.
  fonts/  video/  downloads/ #   woff2, hero timelapse, EPK + stage plot PDFs
  images/
    backgrounds/             #   section and page backdrops (+ -mobile crops)
    covers/   full/          #   grid size + lightbox size
    gallery/  full/
    lineup/   full/
    posters/  archive/  archive/full/
    logos/  merch/           #   plus favicons at the top level
scripts/
  optimize_images.py         # _source/ masters → assets/ + image manifests
  generate_epk_pdf.py        # builds assets/downloads/dirtyaesthetic_epk.pdf
  epk-copy.txt               # plain-text EPK copy (bio also lives in the PDF
                             #   script; keep the two in sync)
.github/workflows/pages.yml  # deploy (shallow checkout, see below)

_source/                     # Full-resolution masters. GITIGNORED, never
                             #   published, NOT backed up by git.
  gallery/                   #   photos currently in the EPK gallery
  gallery-staging/           #   candidates not on the site yet
  gallery-archive/YYYY-MM-*/ #   photos taken off the gallery, by date
  archive/                   #   other retired masters
  backgrounds/  covers/  lineup/  logos/  merch/  misc/
  posters/  press/  social/  video/  fonts/
```

Masters never go in the repo root or `assets/`: anything committed there is
published to the live site.

## Images

Drop full-resolution originals into the matching `_source/` folder, then:

```
python3 scripts/optimize_images.py
```

It writes every web variant into `assets/images/` and regenerates
`data/epk-images.json` and `data/poster-images.json`. Commit `assets/` and the
manifests; `_source/` stays local.

**Taking a photo off the gallery:** move its master from `_source/gallery/` into a
dated folder under `_source/gallery-archive/`, delete its entry from
`data/gallery-order.json`, then run the script. It deletes the built copies that
are no longer used. **Adding one:** drop the master in `_source/gallery/` (named
`photographer-slug__shot-id`), add it to `data/gallery-order.json` where it should
sit and its credit to `data/photo-credits.json`, then run the script.

## Release links

Every streaming URL for the current release lives in `data/release.json`. That is
the only file to touch when platform links arrive:

```json
"links": {
  "spotify": "https://open.spotify.com/album/...",
  "apple":   "https://music.apple.com/...",
  "bandcamp": "https://dirtyaesthetic.bandcamp.com/",
  "youtube": "",
  "soundcloud": ""
}
```

A URL that is filled in renders its button on the homepage and the music page.
One left empty has its button removed rather than shipped pointing nowhere, so
partial link sets are safe to deploy. The `smartLink` (DistroKid HyperFollow) is
the always-present "Listen Now" button and needs no change — it resolves to
streaming services once the release is live.

## Shows

Upcoming shows live in `data/shows.json` under `upcoming`. The homepage only renders `upcoming` (via `js/main.js`).

**Past archive:** The same file includes a `past` array. Shows with a `poster` are displayed automatically on `posters.html`; keep the newest past dates first. After moving a show into `past`, run `python3 scripts/optimize_images.py` to refresh its poster thumbnail.

Each show entry may include:

```json
{
  "date": "Apr 3, 2026",
  "city": "Vancouver",
  "venue": "Red Gate",
  "lineup": "MATH CLUB, Carmine, Ynes",
  "poster": "_source/posters/REDGATE_04:03:26.JPG",
  "link": "https://tickets.example.com",
  "notes": "Optional — e.g. cancelled, radio, etc."
}
```

## Deployment

Push to `main`. `.github/workflows/pages.yml` does a shallow checkout and
publishes the repo root. (The full history carries about 1 GB of old camera
originals, too much for GitHub's built-in Pages builder.)
