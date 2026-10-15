// After `next build`: give every exported route a folder index too.
//
// The export writes out/music.html, which serves /music.html (the URL ads,
// bios and search results already use) and /music. It also writes an
// out/music/ folder holding the router's prefetch data, and a host that
// prefers a folder over the .html file would send /music to /music/ and 404.
// A copy at out/music/index.html makes that path work as well.
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = fileURLToPath(new URL('../out/', import.meta.url))
let n = 0
for (const name of readdirSync(out)) {
  if (!name.endsWith('.html') || name === 'index.html' || name === '404.html') continue
  const dir = join(out, name.slice(0, -5))
  if (existsSync(dir) && statSync(dir).isDirectory()) {
    copyFileSync(join(out, name), join(dir, 'index.html'))
    n++
  }
}
console.log(`postbuild: wrote ${n} folder index pages`)
