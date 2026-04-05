# Dirty Aesthetic — Official Website

**[www.dirtyaesthetic.com](https://www.dirtyaesthetic.com)**

Official website for Dirty Aesthetic, an indie garage rock band from Vancouver, BC.

## Pages

- **Home** (`index.html`) — Landing page with hero image, upcoming shows, EP feature, and contact section
- **Music** (`music.html`) — Discography with streaming links (Spotify / Apple Music toggle)
- **Watch** (`watch.html`) — Music videos and live performance footage
- **Store** (`store.html`) — Merch and physical media
- **EPK** (`epk.html`) — Electronic Press Kit with bio, band member photos, gallery, and embedded Spotify player
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
├── assets/
│   ├── fonts/          # Custom typefaces
│   ├── images/
│   │   ├── covers/     # Album / single artwork
│   │   ├── GALLERY/    # EPK photo gallery
│   │   ├── LINEUP/     # Band member photos
│   │   ├── posters/    # Show posters
│   │   └── press/      # Press / promo photos
│   └── logos/           # Band logos (splat, full name variants)
├── css/
│   └── styles.css      # All styles including responsive + print
├── data/
│   └── shows.json      # Upcoming shows + past archive (see below)
├── js/
│   └── main.js         # Nav, shows, lightbox, scroll animations
└── *.html              # Pages
```

## Shows

Upcoming shows live in `data/shows.json` under `upcoming`. The homepage only renders `upcoming` (via `js/main.js`).

**Past archive:** The same file includes a `past` array — full show history reconstructed from git and past site data. It is not shown on the site; use it for records and to re-add shows if needed. When a gig ends, move its object from `upcoming` into `past` (newest past dates first keeps the list easy to read).

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
