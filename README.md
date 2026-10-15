# Dirty Aesthetic — Official Website

**[www.dirtyaesthetic.com](https://www.dirtyaesthetic.com)**

Official website for Dirty Aesthetic, an indie garage rock band from Vancouver, BC.

## Pages

- **Home** (`/`): hero timelapse, *Modern Nostalgia* tracklist, video, upcoming shows, *Sugar on the Rocks* EP and contact form
- **Music** (`/music`): discography with streaming links and credits
- **Watch** (`/watch`): music videos and live footage
- **Store** (`/store`): merch preorder
- **EPK** (`/epk`): press kit with bio, lineup, gallery, stage plot and downloads
- **Poster Archive** (`/posters`): past show posters
- **Contact** (`/contact`): contact form (Formspree)
- **Privacy** (`/privacy`): privacy policy

Every page is also published at its old `.html` address (`/music.html` etc.),
which is what ads, bios, search results and the sitemap link to.

## Tech Stack

- Next.js (App Router) + React, exported as a static site (`output: 'export'`)
- Tailwind CSS v4, Motion for animation, Lenis for smooth scroll
- Custom font: Nafta Light (`app/fonts/`, loaded with `next/font`)
- Hosted on GitHub Pages at the custom domain in `public/CNAME`

```
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/
npm run lint && npx tsc --noEmit
```

## Structure

```
app/                         # One folder per page (page.tsx), plus the shared
                             #   layout, global CSS and the font
components/                  # UI, grouped by page (home/, music/, epk/ ...);
                             #   motion/ holds the shared animation pieces
lib/                         # Site config, metadata, typed data readers
content/jsonld/              # Structured data per page
data/                        # Content read at build time (shows, release
                             #   links, gallery order, credits) plus the two
                             #   generated image manifests
public/                      # Copied as-is: CNAME, robots.txt, sitemap.xml,
                             #   and assets/ (a link to the folder below)
assets/                      # Only what the browser loads. All committed.
  video/  downloads/         #   hero timelapse, EPK + stage plot PDFs
  images/
    backgrounds/             #   section and page backdrops (+ -mobile crops)
    covers/   full/          #   grid size + lightbox size
    gallery/  full/
    lineup/   full/
    posters/  archive/  archive/full/
    logos/  merch/           #   plus favicons at the top level
scripts/
  optimize_images.py         # _source/ masters → assets/ + image manifests
  postbuild.mjs              # adds <page>/index.html copies to the export
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

Masters never go in the repo root, `assets/` or `public/`: anything committed
there is published to the live site.

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

Upcoming shows live in `data/shows.json` under `upcoming`. The first entry drives the ticket button in the menu and leads the homepage shows section.

**Past archive:** The same file includes a `past` array. Shows with a `poster` are displayed automatically on `/posters`; keep the newest past dates first. After moving a show into `past`, run `python3 scripts/optimize_images.py` to refresh its poster thumbnail.

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

Push to `main`. `.github/workflows/pages.yml` does a shallow checkout, runs
`npm ci && npm run build`, and publishes `out/`. Content edits in `data/`
deploy the same way; the site is live a minute or two after the build passes
(check the Actions tab). Settings → Pages → Source must be "GitHub Actions". (The full history carries about 1 GB of old camera
originals, too much for GitHub's built-in Pages builder.)
