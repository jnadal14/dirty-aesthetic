# Dirty Aesthetic — Official Website

**[www.dirtyaesthetic.com](https://www.dirtyaesthetic.com)**

Official website for Dirty Aesthetic, an indie garage rock band from Vancouver, BC.

## Pages

- **Home** (`index.html`) — Modern Nostalgia announcement and partial tracklist, upcoming shows, Sugar on the Rocks EP, and contact section
- **Music** (`music.html`) — Discography with streaming links (Spotify / Apple Music toggle)
- **Watch** (`watch.html`) — Music videos and live performance footage
- **Store** (`store.html`) — Merch and physical media
- **EPK** (`epk.html`) — Electronic Press Kit with bio, band member photos, gallery, and embedded Spotify player
- **Poster Archive** (`posters.html`) — Past show posters with dates, venues, and billed artists
- **Contact** (`contact.html`) — Contact form powered by Formspree
- **Privacy** (`privacy.html`) — Privacy policy

## Tech Stack

Static site — no frameworks, no build step.

- **HTML5 / CSS3 / Vanilla JS**
- Custom font: Nafta Light
- Google Fonts: Bebas Neue
- Hosted on **GitHub Pages** with custom domain via CNAME

## Structure

```
_source/             # Full-resolution masters — GITIGNORED, never published.
                     #   Inputs to scripts/optimize_images.py only.
                     #   NOT backed up by git — keep a copy elsewhere.
  gallery/  gallery-archive/  gallery-staging/  archive/
  lineup/  covers/  posters/  backgrounds/  merch/  press/
  logos/  fonts/  misc/  social/

assets/              # Only what the browser loads. All committed.
  fonts/             #   woff2 the pages actually request
  downloads/         #   EPK pdf
  images/
    covers/   full/  #   grid size + lightbox size
    gallery/  full/
    lineup/   full/
    posters/  archive/  archive/full/
    backgrounds/  logos/  merch/
css/styles.css
js/main.js
vendor/lenis.min.js  # vendored, not a CDN dependency at runtime
data/                # shows.json + generated image manifests
scripts/             # optimize_images.py, generate_epk_pdf.py
```

## Images

Drop full-resolution originals into the matching `_source/` folder, then:

```
python3 scripts/optimize_images.py
```

It writes every web variant into `assets/images/` and regenerates
`data/epk-images.json` and `data/poster-images.json`. Commit `assets/` and the
manifests; `_source/` stays local.

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
  "poster": "assets/images/posters/REDGATE_04:03:26.JPG",
  "link": "https://tickets.example.com",
  "notes": "Optional — e.g. cancelled, radio, etc."
}
```

## Deployment

Push to `main` — GitHub Pages deploys automatically.
