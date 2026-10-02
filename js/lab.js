// Motion Lab demos. Loaded only by lab.html, after vendor/motion.min.js.
//
// Each demo has a mount(ctx) that sets it up and returns a cleanup. They are
// all torn down and remounted whenever the conditions they depend on change —
// rotating a phone into a short landscape screen, turning reduced motion on,
// plugging in a mouse — so every demo can be tried in every orientation
// without reloading.
//
// Rules every demo keeps to:
//  - Only transform, opacity and clip-path are animated.
//  - Nothing hijacks touch scrolling. Scroll-linked effects read the page's
//    native scroll position, so iOS and Android keep their own physics.
//  - Under reduced motion, everything is shown in its finished state.
;(function lab(){
  const M = window.Motion
  const html = document.documentElement
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)')
  const shortQuery = matchMedia('(orientation: landscape) and (max-height: 500px)')
  const fineQuery = matchMedia('(hover: hover) and (pointer: fine)')

  // If Motion never arrived, leave every demo in its plain, readable state.
  if (!M) {
    html.classList.add('lab-flow')
    console.error('[lab] vendor/motion.min.js did not load')
    return
  }
  const { animate, scroll, inView, stagger, press, motionValue, springValue } = M

  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))
  const rand = (min, max) => min + Math.random() * (max - min)
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
  const spring = (visualDuration, bounce) => ({ type: 'spring', visualDuration, bounce })

  // Hands an element back to the stylesheet. Remounting starts every animation
  // from explicit keyframes, so nothing depends on what was left behind.
  function reset(els){
    els.forEach(el => {
      if (!el) return
      el.style.transform = ''
      el.style.opacity = ''
      el.style.clipPath = ''
    })
  }

  // ---- Split text ----
  // Motion's own splitText is part of the paid Motion+ tier, and this needs
  // very little of it. Screen readers get the sentence once, from a hidden
  // copy; the per-letter spans are hidden from them, because read out as
  // separate elements a headline comes across letter by letter.
  function split(el){
    if (el._units) return el._units
    const text = el.textContent.trim().replace(/\s+/g, ' ')
    const byWord = el.dataset.split === 'words'
    el.textContent = ''
    const label = document.createElement('span')
    label.className = 'lab-sr'
    label.textContent = text
    el.appendChild(label)
    const units = []
    text.split(' ').forEach((word, i, words) => {
      const w = document.createElement('span')
      w.className = 'split-word'
      w.setAttribute('aria-hidden', 'true')
      for (const piece of byWord ? [word] : Array.from(word)) {
        const c = document.createElement('span')
        c.className = 'split-char'
        c.textContent = piece
        w.appendChild(c)
        units.push(c)
      }
      el.appendChild(w)
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '))
    })
    el._units = units
    return units
  }

  const demos = []

  // ---- 01 Spring scene transitions ----------------------------------------
  // A stand-in for the homepage's section engine: one wheel gesture, arrow key
  // or swipe moves exactly one scene. What is being judged is the move itself.
  demos.push({ name: 'scenes', mount(ctx){
    const stage = $('.scene-stage')
    const scenes = $$('.scene', stage)
    const count = $('.scene-count', stage)
    let index = Math.max(0, scenes.findIndex(s => s.classList.contains('is-active')))
    let busyUntil = 0
    let wheelSum = 0
    let lastWheel = 0
    let lastStep = 0
    let gestureUsed = false

    function show(next, dir){
      if (next < 0 || next >= scenes.length || next === index) return
      const out = scenes[index]
      const inn = scenes[next]
      index = next
      count.textContent = `${next + 1} / ${scenes.length}`
      scenes.forEach(s => s.classList.toggle('is-active', s === inn))
      inn.hidden = false
      inn.style.zIndex = '2'
      out.style.zIndex = '1'

      if (ctx.reduced) { out.hidden = true; return }
      busyUntil = performance.now() + 650

      // The old scene falls back and away from the direction of travel...
      animate(out, { opacity: [1, 0], scale: [1, .84], x: ['0%', `${-dir * 12}%`], rotate: [0, -dir * 2.5] }, spring(.55, 0))
        .then(() => { if (scenes[index] !== out) { out.hidden = true; reset([out]) } })

      // ...while the new one arrives in layers: the frame, then its photo
      // settling, then the kicker, the headline letter by letter, the buttons.
      const chars = split($('.scene-title', inn))
      animate(inn, { opacity: [0, 1], scale: [1.08, 1], x: [`${dir * 28}%`, '0%'], rotate: [dir * 3, 0] }, spring(.7, .2))
      animate($('.scene-bg', inn), { scale: [1.25, 1] }, { duration: 1.1, ease: [.16, 1, .3, 1] })
      animate($('.scene-kicker', inn), { opacity: [0, 1], y: [20, 0] }, { ...spring(.5, .2), delay: .12 })
      animate(chars, { opacity: [0, 1], y: ['110%', '0%'], rotate: [dir * 12, 0] }, { ...spring(.55, .35), delay: stagger(.025, { startDelay: .16 }) })
      animate(Array.from($('.scene-cta', inn).children), { opacity: [0, 1], y: [24, 0] }, { ...spring(.5, .3), delay: stagger(.06, { startDelay: .38 }) })
    }

    const step = dir => {
      if (performance.now() < busyUntil) return
      lastStep = performance.now()
      show(index + dir, dir)
    }

    // Same rule as the homepage engine: a gesture moves one scene, a pause
    // starts a new gesture, and holding the wheel still steps at a steady rate.
    // At either end the wheel is let go so the page scrolls on past the demo.
    function onWheel(e){
      if (!e.deltaY || e.ctrlKey) return
      const dir = Math.sign(e.deltaY)
      if ((dir > 0 && index === scenes.length - 1) || (dir < 0 && index === 0)) return
      e.preventDefault()
      const now = performance.now()
      if (now - lastWheel > 150) { gestureUsed = false; wheelSum = 0 }
      lastWheel = now
      wheelSum += e.deltaY
      const held = now - lastStep > 900
      if (Math.abs(wheelSum) >= 40 && (!gestureUsed || held) && now >= busyUntil) {
        step(dir)
        gestureUsed = true
        wheelSum = 0
      }
    }
    function onKey(e){
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
      if (!dir) return
      e.preventDefault()
      step(dir)
    }
    let downX = 0, downY = 0
    const onDown = e => { downX = e.clientX; downY = e.clientY }
    function onUp(e){
      if (e.target.closest('button')) return
      const dx = e.clientX - downX, dy = e.clientY - downY
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1)
    }
    const buttons = $$('[data-scene-step]', stage)
    const onButton = e => step(Number(e.currentTarget.dataset.sceneStep))

    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('keydown', onKey)
    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointerup', onUp)
    buttons.forEach(b => b.addEventListener('click', onButton))
    return () => {
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('keydown', onKey)
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointerup', onUp)
      buttons.forEach(b => b.removeEventListener('click', onButton))
    }
  }})

  // ---- 02 Split-text headlines ---------------------------------------------
  demos.push({ name: 'split', mount(ctx){
    const stage = $('.split-stage')
    const title = $('.split-title', stage)
    const sub = $('.split-sub', stage)
    const buttons = $$('[data-split-variant]')
    if (ctx.reduced) return () => {}

    const chars = split(title)
    const words = split(sub)
    let variant = (buttons.find(b => b.getAttribute('aria-pressed') === 'true') || buttons[0]).dataset.splitVariant

    function play(){
      title.classList.toggle('split-mask', variant === 'rise')
      if (variant === 'rise') {
        animate(chars, { opacity: [1, 1], y: ['115%', '0%'] }, { ...spring(.7, .3), delay: stagger(.035) })
      } else if (variant === 'scatter') {
        chars.forEach((c, i) => animate(c,
          { opacity: [0, 1], x: [rand(-160, 160), 0], y: [rand(-140, 140), 0], rotate: [rand(-90, 90), 0], scale: [rand(.4, 1.6), 1] },
          { ...spring(.9, .35), delay: i * .025 }))
      } else {
        animate(chars, { opacity: [0, 1], x: [-120, 0], scaleX: [3, 1], skewX: [-30, 0] }, { ...spring(.6, .15), delay: stagger(.03) })
      }
      animate(words, { opacity: [0, 1], y: [18, 0] }, { duration: .5, ease: 'easeOut', delay: stagger(.04, { startDelay: .3 }) })
    }

    animate([...chars, ...words], { opacity: 0 }, { duration: 0 })
    const stopView = inView(stage, () => { play() }, { amount: .5 })
    const onPick = e => {
      variant = e.currentTarget.dataset.splitVariant
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget)))
      play()
    }
    buttons.forEach(b => b.addEventListener('click', onPick))
    return () => {
      stopView()
      buttons.forEach(b => b.removeEventListener('click', onPick))
      reset([...chars, ...words])
    }
  }})

  // ---- 03 Pointer depth -----------------------------------------------------
  demos.push({ name: 'depth', mount(ctx){
    const card = $('.depth-card')
    const layers = $$('[data-depth]', card)
    const magnet = $('.depth-magnet', card)
    if (ctx.reduced) return () => {}

    // Pointer position in -1..1 across the card, eased by a spring so the
    // layers trail the hand instead of being bolted to it.
    const px = motionValue(0), py = motionValue(0)
    const sx = springValue(px, { stiffness: 120, damping: 20, mass: .6 })
    const sy = springValue(py, { stiffness: 120, damping: 20, mass: .6 })
    const mx = motionValue(0), my = motionValue(0)
    const smx = springValue(mx, { stiffness: 220, damping: 14 })
    const smy = springValue(my, { stiffness: 220, damping: 14 })

    const render = () => {
      const x = sx.get(), y = sy.get()
      card.style.transform = `rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`
      for (const layer of layers) {
        const d = Number(layer.dataset.depth)
        layer.style.transform = `translate3d(${(x * d).toFixed(1)}px, ${(y * d).toFixed(1)}px, 0)`
      }
    }
    const renderMagnet = () => { magnet.style.transform = `translate3d(${smx.get().toFixed(1)}px, ${smy.get().toFixed(1)}px, 0)` }
    const unsubs = [sx.on('change', render), sy.on('change', render), smx.on('change', renderMagnet), smy.on('change', renderMagnet)]

    let rect = null
    function onMove(e){
      rect ||= card.getBoundingClientRect()
      px.set(clamp((e.clientX - rect.left) / rect.width * 2 - 1, -1, 1))
      py.set(clamp((e.clientY - rect.top) / rect.height * 2 - 1, -1, 1))
      // The button leans toward a pointer within reach, up to 30px.
      const b = magnet.getBoundingClientRect()
      const dx = e.clientX - (b.left + b.width / 2)
      const dy = e.clientY - (b.top + b.height / 2)
      const near = Math.hypot(dx, dy) < 170
      mx.set(near ? clamp(dx * .3, -30, 30) : 0)
      my.set(near ? clamp(dy * .3, -30, 30) : 0)
    }
    function onLeave(){ rect = null; px.set(0); py.set(0); mx.set(0); my.set(0) }
    card.addEventListener('pointermove', onMove)
    card.addEventListener('pointerleave', onLeave)
    card.addEventListener('pointercancel', onLeave)
    card.addEventListener('pointerup', onLeave)
    window.addEventListener('scroll', onLeave, { passive: true })
    return () => {
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerleave', onLeave)
      card.removeEventListener('pointercancel', onLeave)
      card.removeEventListener('pointerup', onLeave)
      window.removeEventListener('scroll', onLeave)
      unsubs.forEach(u => u())
      ;[sx, sy, smx, smy, px, py, mx, my].forEach(v => v.destroy())
      reset([card, magnet, ...layers])
    }
  }})

  // ---- 04 Stacked card deck -------------------------------------------------
  // Every card is sticky; the browser does the pinning. Motion only shrinks and
  // darkens the card underneath as the next one comes up. Each card's move
  // is one keyframed `transform` string over the whole deck's scroll range, so
  // in browsers with native scroll timelines (Chrome, Safari 26) it runs on the
  // compositor rather than in JavaScript.
  demos.push({ name: 'deck', mount(ctx){
    const deck = $('.deck')
    const cards = $$('.deck-card', deck)
    const inners = cards.map(c => $('.deck-card-inner', c))
    const shades = cards.map(c => $('.deck-shade', c))
    if (ctx.flow) return () => {}

    const segment = 1 / (cards.length - 1)
    const range = { target: deck, offset: ['start start', 'end end'] }
    const stops = []
    for (let i = 0; i < cards.length - 1; i++) {
      const times = [0, i * segment, (i + 1) * segment, 1]
      const tilt = i % 2 ? 1.2 : -1.2
      const rest = 'translateY(0%) scale(1) rotate(0deg)'
      const sunk = `translateY(-3%) scale(.88) rotate(${tilt}deg)`
      stops.push(scroll(animate(inners[i], { transform: [rest, rest, sunk, sunk] }, { times, ease: 'linear' }), range))
      if (shades[i]) stops.push(scroll(animate(shades[i], { opacity: [0, 0, .7, .7] }, { times, ease: 'linear' }), range))
    }
    return () => { stops.forEach(s => s()); reset([...inners, ...shades]) }
  }})

  // ---- 05 Kinetic typography -----------------------------------------------
  demos.push({ name: 'kinetic', mount(ctx){
    const root = $('.kinetic')
    const lines = $$('.k-line', root)
    const wraps = $$('.k-marquee-wrap', root)
    const marquees = $$('.k-marquee', root)
    if (ctx.reduced) return () => {}

    const stops = []
    const allChars = []

    // Letters slam up into place, each with its own tilt, as a line arrives.
    // Leaving resets them so the next arrival plays again.
    lines.forEach(line => {
      const chars = split(line)
      allChars.push(...chars)
      animate(chars, { opacity: 0 }, { duration: 0 })
      stops.push(inView(line, () => {
        chars.forEach((c, i) => animate(c,
          { opacity: [0, 1], y: ['100%', '0%'], rotate: [rand(-25, 25), 0] },
          { ...spring(.5, .45), delay: i * .04 }))
        return () => animate(chars, { opacity: 0 }, { duration: 0 })
      }, { amount: .6 }))
    })

    // The banners slide sideways with scroll position.
    marquees.forEach((m, i) => {
      const keys = i % 2 ? ['translateX(-50%)', 'translateX(0%)'] : ['translateX(0%)', 'translateX(-50%)']
      stops.push(scroll(animate(m, { transform: keys }, { ease: 'linear' }), { target: root, offset: ['start end', 'end start'] }))
    })

    // Scroll speed leans the words and stretches the banners. The spring is
    // what brings them back upright once scrolling stops; the velocity is
    // zeroed explicitly because no scroll event arrives to report a stop.
    const velocity = motionValue(0)
    const eased = springValue(velocity, { stiffness: 180, damping: 26 })
    let idle = 0
    let visible = false
    stops.push(inView(root, () => { visible = true; return () => { visible = false; velocity.set(0) } }, { amount: 0 }))
    stops.push(scroll((_, info) => {
      if (!visible) return
      velocity.set(info.y.velocity)
      clearTimeout(idle)
      idle = setTimeout(() => velocity.set(0), 90)
    }))
    const unsub = eased.on('change', v => {
      const lean = clamp(v / 400, -12, 12)
      for (const line of lines) line.style.transform = `skewY(${(-lean * .4).toFixed(2)}deg) skewX(${(-lean).toFixed(2)}deg)`
      const stretch = 1 + Math.min(Math.abs(v) / 6000, .6)
      for (const w of wraps) w.style.transform = `scaleY(${stretch.toFixed(3)})`
    })

    return () => {
      stops.forEach(s => s())
      clearTimeout(idle)
      unsub()
      velocity.destroy()
      eased.destroy()
      reset([...lines, ...wraps, ...marquees, ...allChars])
    }
  }})

  // ---- 06 Gritty transitions -----------------------------------------------
  // The panels are stacked inside one pinned screen. Scrolling through the
  // section tears each next panel open from the bottom along a ragged edge,
  // while the one underneath pushes in slightly, like a camera leaning in.
  demos.push({ name: 'grit', mount(ctx){
    const grit = $('.grit')
    const panels = $$('.grit-panel', grit)
    const titles = panels.map(p => $('.grit-title', p))
    if (ctx.flow) return () => {}

    const POINTS = 24
    // A fixed ragged profile per panel, so the edge keeps its shape as it
    // travels instead of flickering.
    const edges = panels.map(() => Array.from({ length: POINTS + 1 }, () => rand(-1, 1)))
    function tear(progress, edge){
      const base = 108 - progress * 116 // from just below the panel to just above it
      const pts = ['0% 100%', '100% 100%']
      for (let k = POINTS; k >= 0; k--) {
        const y = base + edge[k] * 4 + Math.sin(k * 1.7) * 1.5
        pts.push(`${(k / POINTS * 100).toFixed(2)}% ${y.toFixed(2)}%`)
      }
      return `polygon(${pts.join(',')})`
    }

    function glitch(title){
      title.classList.add('is-glitching')
      animate(title, { x: [0, -8, 6, -4, 3, 0], skewX: [0, -10, 8, 0, 0, 0], opacity: [1, .6, 1, .8, 1, 1] }, { duration: .45, ease: 'linear' })
        .then(() => title.classList.remove('is-glitching'))
    }

    const last = panels.map(() => -1)
    const landed = panels.map(() => false)
    panels.slice(1).forEach((p, j) => { p.style.clipPath = tear(0, edges[j + 1]) })

    const stopFirst = inView(panels[0], () => { glitch(titles[0]) }, { amount: .6 })
    const stopScroll = scroll(progress => {
      const n = panels.length - 1
      for (let j = 1; j <= n; j++) {
        const local = clamp(progress * n - (j - 1), 0, 1)
        if (Math.abs(local - last[j]) < .001) continue
        last[j] = local
        panels[j].style.clipPath = tear(local, edges[j])
        panels[j - 1].style.transform = `scale(${(1 + local * .08).toFixed(4)})`
        if (local > .92 && !landed[j]) { landed[j] = true; glitch(titles[j]) }
        if (local < .5) landed[j] = false
      }
    }, { target: grit, offset: ['start start', 'end end'] })

    return () => { stopFirst(); stopScroll(); reset([...panels, ...titles]) }
  }})

  // ---- 07 Record pull-out ---------------------------------------------------
  demos.push({ name: 'record', mount(ctx){
    const lp = $('.lp')
    const object = $('.lp-object', lp)
    const sleeve = $('.lp-sleeve', lp)
    const disc = $('.lp-disc', lp)
    const copy = $('.lp-copy', lp)
    const touched = [object, sleeve, disc, copy]

    if (ctx.reduced) {
      disc.style.transform = 'translateX(46%)'
      object.style.transform = 'translateX(-22%)'
      return () => reset(touched)
    }

    // No room to pin on a short landscape screen: the record slides out once,
    // when the cover comes into view.
    if (ctx.flow) {
      const stop = inView(lp, () => {
        animate(sleeve, { rotate: [-8, 0], scale: [.85, 1] }, spring(.7, .25))
        animate(object, { x: ['0%', '-22%'] }, { ...spring(1, .15), delay: .2 })
        animate(disc, { x: ['0%', '46%'], rotate: [0, 300] }, { ...spring(1.1, .2), delay: .2 })
      }, { amount: .4 })
      return () => { stop(); reset(touched) }
    }

    // Pinned: the cover settles first, then the record slides out spinning
    // while the pair shifts left to stay centred.
    const range = { target: lp, offset: ['start end', 'end end'] }
    const stops = [
      scroll(animate(sleeve, { transform: ['rotate(-8deg) scale(.82)', 'rotate(0deg) scale(1)', 'rotate(0deg) scale(1)'] }, { times: [0, .45, 1], ease: 'linear' }), range),
      scroll(animate(object, { transform: ['translateX(0%)', 'translateX(0%)', 'translateX(-22%)'] }, { times: [0, .4, 1], ease: 'linear' }), range),
      scroll(animate(disc, { transform: ['translateX(0%) rotate(0deg)', 'translateX(0%) rotate(0deg)', 'translateX(46%) rotate(540deg)'] }, { times: [0, .4, 1], ease: 'linear' }), range),
      scroll(animate(copy, { opacity: [0, 0, 1, 1], transform: ['translateY(30px)', 'translateY(30px)', 'translateY(0px)', 'translateY(0px)'] }, { times: [0, .35, .6, 1], ease: 'linear' }), range)
    ]
    return () => { stops.forEach(s => s()); reset(touched) }
  }})

  // ---- 08 Cover flip grid ---------------------------------------------------
  const RELEASES = [
    ['Modern Nostalgia (Single)', 'Single · July 23, 2026', 'cover_modern_nostalgia', 'https://open.spotify.com/album/3QDhfee3YZ7DVJ2jWgfAsk', 1200],
    ['Back to Me', 'Single · June 18, 2026', 'cover_back_to_me', 'https://open.spotify.com/track/60YsvPN7fAjT2XyJgfB6vx', 1200],
    ['Irrational', 'Single · May 23, 2026', 'cover_irrational', 'https://open.spotify.com/album/7xPxKD8fm8jOE2BbpzGw3K', 1200],
    ['Sugar on the Rocks', 'EP · January 9, 2026', 'cover_sugar_on_the_rocks', 'https://open.spotify.com/album/2ZwIHEk5AY084OVll4oFLW', 800],
    ['Sugar Bottom', 'Single · August 29, 2025', 'cover_sugar_bottom', 'https://open.spotify.com/track/4JQE8SO7E9kqkfikmz6Zzc', 800],
    ['Blue Roses', 'Single · February 23, 2025', 'cover_blue_roses', 'https://open.spotify.com/track/1d913Z6QvDaaYtTAcfCwWI', 800],
    ['While I Wonder', 'Single · December 5, 2024', 'cover_while_i_wonder', 'https://open.spotify.com/track/6ostKPYA1pmcBByK0Npk1y', 800],
    ['Run', 'Single · October 18, 2024', 'cover_run', 'https://open.spotify.com/track/13mNifmsvTg9hh5qpG8fyE', 800]
  ]
  const grid = $('.flip-grid')
  RELEASES.forEach(([title, meta, file, url, size]) => {
    const card = document.createElement('div')
    card.className = 'flip-card'
    card.innerHTML = `
      <div class="flip-tilt">
        <div class="flip-inner">
          <button class="flip-face flip-front" type="button" aria-pressed="false" aria-label="Show details for ${title}">
            <img src="assets/images/covers/${file}.webp" alt="" loading="lazy" decoding="async" width="${size}" height="${size}">
          </button>
          <div class="flip-face flip-back" inert>
            <h3>${title}</h3>
            <p>${meta}</p>
            <a href="${url}" target="_blank" rel="noopener">Listen on Spotify</a>
            <button class="flip-close" type="button">Flip back</button>
          </div>
        </div>
      </div>
      <p class="flip-caption">${title}</p>`
    grid.appendChild(card)
  })

  demos.push({ name: 'flip', mount(ctx){
    const cards = $$('.flip-card', grid)
    const cleanups = []

    cards.forEach(card => {
      const tilt = $('.flip-tilt', card)
      const inner = $('.flip-inner', card)
      const front = $('.flip-front', card)
      const back = $('.flip-back', card)
      const close = $('.flip-close', card)

      // The face pointing away is hidden by script as the card passes 90°,
      // not left to backface-visibility. WebKit builds disagree about that
      // property (Playwright's WebKit ignores it outright and shows the back
      // mirrored through the front), and in-app browsers are the last place
      // to bet on an edge case.
      const angle = motionValue(0)
      let focusNext = null
      const unsub = angle.on('change', v => {
        inner.style.transform = `rotateY(${v.toFixed(2)}deg)`
        const backUp = Math.abs(v % 360) > 90 && Math.abs(v % 360) < 270
        front.style.visibility = backUp ? 'hidden' : ''
        back.style.visibility = backUp ? 'visible' : 'hidden'
        // A hidden element cannot take focus, so focus follows the card over
        // at the moment the new face turns toward the viewer.
        if (focusNext && (focusNext === front) !== backUp) {
          focusNext.focus({ preventScroll: true })
          focusNext = null
        }
      })
      back.style.visibility = 'hidden'

      // inert keeps the hidden face out of the tab order and away from screen
      // readers, so keyboard focus only ever lands on the side facing up.
      function flip(open){
        front.setAttribute('aria-pressed', String(open))
        back.inert = !open
        front.inert = open
        focusNext = open ? $('a', back) : front
        animate(angle, open ? 180 : 0, ctx.reduced ? { duration: 0 } : { type: 'spring', stiffness: 170, damping: 18 })
      }
      cleanups.push(() => {
        unsub()
        angle.destroy()
        front.inert = false
        back.inert = true
        front.setAttribute('aria-pressed', 'false')
        front.style.visibility = ''
        back.style.visibility = ''
        reset([inner])
      })
      const onOpen = () => flip(true)
      const onClose = () => flip(false)
      front.addEventListener('click', onOpen)
      close.addEventListener('click', onClose)
      cleanups.push(() => { front.removeEventListener('click', onOpen); close.removeEventListener('click', onClose) })

      if (ctx.reduced) return

      // A squash on press, felt under a thumb as much as seen.
      cleanups.push(press(card, () => {
        animate(tilt, { scale: .95 }, spring(.2, .3))
        return () => animate(tilt, { scale: 1 }, spring(.35, .5))
      }))

      // With a mouse, the cover leans toward the cursor.
      if (ctx.fine) {
        const onMove = e => {
          const r = card.getBoundingClientRect()
          const x = (e.clientX - r.left) / r.width - .5
          const y = (e.clientY - r.top) / r.height - .5
          animate(tilt, { rotateY: x * 18, rotateX: -y * 18 }, { type: 'spring', stiffness: 300, damping: 25 })
        }
        const onLeave = () => animate(tilt, { rotateY: 0, rotateX: 0 }, { type: 'spring', stiffness: 200, damping: 18 })
        card.addEventListener('pointermove', onMove)
        card.addEventListener('pointerleave', onLeave)
        cleanups.push(() => { card.removeEventListener('pointermove', onMove); card.removeEventListener('pointerleave', onLeave) })
      }
    })

    if (!ctx.reduced) {
      // Covers toss in as they arrive, staggered across each row.
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 1
      cards.forEach((card, i) => {
        if (card._tossed) return
        animate(card, { opacity: 0 }, { duration: 0 })
        cleanups.push(inView(card, () => {
          card._tossed = true
          animate(card,
            { opacity: [0, 1], y: [60, 0], rotate: [rand(-12, 12), 0], scale: [.7, 1] },
            { ...spring(.7, .35), delay: (i % columns) * .07 })
        }, { amount: .3 }))
      })
    }
    return () => { cleanups.forEach(c => c()); cards.forEach(c => { if (!c._tossed) reset([c]) }) }
  }})

  // ---- Mounting -------------------------------------------------------------
  let cleanups = []
  function mountAll(){
    cleanups.forEach(fn => { try { fn && fn() } catch (e) { console.error('[lab] cleanup', e) } })
    cleanups = []
    const ctx = {
      reduced: reduceQuery.matches,
      flow: reduceQuery.matches || shortQuery.matches,
      fine: fineQuery.matches
    }
    html.classList.toggle('lab-flow', ctx.flow)
    $('.lab-reduced-note').hidden = !ctx.reduced
    for (const demo of demos) {
      try { cleanups.push(demo.mount(ctx)) } catch (e) { console.error(`[lab] ${demo.name}`, e) }
    }
  }
  ;[reduceQuery, shortQuery, fineQuery].forEach(q => q.addEventListener('change', mountAll))

  // The pinned demos clear the fixed header by its measured height.
  const header = $('.site-header')
  const measureHeader = () => document.body.style.setProperty('--lab-header-h', `${header.offsetHeight}px`)
  measureHeader()
  window.addEventListener('resize', measureHeader, { passive: true })

  mountAll()

  // ---- Frame meter ----------------------------------------------------------
  // Frames per second, and a running count of frames that took over 34ms —
  // long enough to be seen as a hitch at 60Hz. Turn on with ?fps or the button.
  const meter = $('.fps-meter')
  const toggle = $('[data-fps-toggle]')
  let meterFrame = 0
  function startMeter(){
    meter.hidden = false
    toggle.setAttribute('aria-pressed', 'true')
    toggle.textContent = 'Hide frame meter'
    const fpsEl = $('[data-fps]', meter), dropEl = $('[data-drops]', meter)
    let last = performance.now(), windowStart = last, frames = 0, drops = 0
    const tick = now => {
      const dt = now - last
      last = now
      frames++
      if (dt > 34 && dt < 1000) drops++
      if (now - windowStart >= 500) {
        const fps = Math.round(frames * 1000 / (now - windowStart))
        fpsEl.textContent = fps
        dropEl.textContent = drops
        meter.classList.toggle('is-bad', fps < 50)
        frames = 0
        windowStart = now
      }
      meterFrame = requestAnimationFrame(tick)
    }
    meterFrame = requestAnimationFrame(tick)
  }
  function stopMeter(){
    cancelAnimationFrame(meterFrame)
    meter.hidden = true
    toggle.setAttribute('aria-pressed', 'false')
    toggle.textContent = 'Show frame meter'
  }
  toggle.addEventListener('click', () => (meter.hidden ? startMeter() : stopMeter()))
  if (/[?&]fps\b/.test(location.search)) startMeter()
})()
