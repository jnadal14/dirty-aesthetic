// A refresh always starts the current page from its beginning instead of
// restoring the previous scroll position or reapplying a section hash.
;(function resetScrollOnReload(){
  const navigationEntry = typeof performance.getEntriesByType === 'function'
    ? performance.getEntriesByType('navigation')[0]
    : null
  const isReload = navigationEntry
    ? navigationEntry.type === 'reload'
    : performance.navigation && performance.navigation.type === 1

  if (!isReload) return

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  if (window.location.hash) {
    history.replaceState(history.state, '', `${window.location.pathname}${window.location.search}`)
  }

  function resetToTop(){
    const previousScrollBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    document.documentElement.style.scrollBehavior = previousScrollBehavior
  }

  resetToTop()
  document.addEventListener('DOMContentLoaded', resetToTop, { once: true })
  window.addEventListener('load', resetToTop, { once: true })
  window.addEventListener('pageshow', resetToTop, { once: true })
})()

// Set active navigation
const currentPage = window.location.pathname.split('/').pop() || 'index.html'
const navLinks = document.querySelectorAll('.nav a')
navLinks.forEach(link => {
  const linkHref = link.getAttribute('href')
  if (linkHref === currentPage || (currentPage === '' && linkHref === 'index.html')) {
    link.classList.add('active')
  }
})

// Hamburger menu toggle
const hamburger = document.getElementById('hamburger')
const nav = document.getElementById('nav')

if (hamburger && nav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active')
    nav.classList.toggle('active')
  })

  // Close menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active')
      nav.classList.remove('active')
    })
  })

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
      hamburger.classList.remove('active')
      nav.classList.remove('active')
    }
  })

  // Keep the full navigation on regular phones. The compact menu is reserved
  // for exceptionally narrow viewports where the links cannot remain usable.
  const header = document.querySelector('.site-header')
  const ultraNarrowViewport = window.matchMedia('(max-width: 280px)')
  function checkNavFit() {
    const shouldCollapse = ultraNarrowViewport.matches
    header.classList.toggle('nav-collapsed', shouldCollapse)
    if (!shouldCollapse) {
      hamburger.classList.remove('active')
      nav.classList.remove('active')
    }
  }
  checkNavFit()
  window.addEventListener('resize', checkNavFit)
}

// Redirect to EPK page when printing (unless already on EPK page)
document.addEventListener('keydown', (e) => {
  // Check for Cmd+P (Mac) or Ctrl+P (Windows)
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'
    if (currentPage !== 'epk.html') {
      e.preventDefault()
      window.location.href = 'epk.html'
    }
  }
})

// Also handle print from browser menu
window.addEventListener('beforeprint', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html'
  if (currentPage !== 'epk.html') {
    window.location.href = 'epk.html'
  }
})

// ===== Scroll motion =====
// Everything that reacts to scroll position lives here: one scroll listener,
// one requestAnimationFrame, one cached set of measurements. A frame does
// nothing but write compositor-only custom properties — no layout reads, no
// paint-triggering properties.
//
// On the homepage desktop layout this also takes over the wheel so one gesture
// advances exactly one full-screen section — see the section-navigation block
// below for why that cannot be done with CSS scroll-snap, and for the rule that
// keeps it from repeating the old implementation's lockout.
;(function scrollMotion(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const spatialMotion = window.matchMedia('(min-width: 1081px) and (min-height: 680px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
  // Section snapping (see refreshState): touch screens, but not a phone held
  // sideways, which is too short for a section to fill and still be read.
  const touchScreen = window.matchMedia('(pointer: coarse)')
  const shortLandscape = window.matchMedia('(orientation: landscape) and (max-height: 500px)')

  const chapters = Array.from(document.querySelectorAll('[data-scroll-chapter]'))

  // Content drift only. The section backgrounds used to parallax by animating
  // background-position, which repaints the whole section every frame; at these
  // speeds that bought about 20px of travel and cost a full-viewport repaint.
  const parallaxConfig = [
    { selector: '.hero-inner', speed: 0.08 },
    { selector: 'body:not(.music-page-bg) .page', speed: 0.03 }
  ]

  // Spatial hand-over: the incoming section slides straight up from the bottom
  // with the scroll, over the outgoing one, which is held at the top of the
  // viewport (the scroll underneath still moves, which keeps the wheel engine
  // and anchors honest) and sinks back and darkens as it is covered. Progress
  // comes from the scroll position, so the same pose plays forwards or in
  // reverse.
  const STAGE_OUT = { scale: .9, opacity: .25 }   // where a covered section ends up

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
  const ease = value => value * value * (3 - 2 * value)

  let spatialEnabled = false
  let snapEnabled = false
  let parallaxEnabled = false
  let frame = 0
  let frameRequestedAt = 0
  let viewportHeight = 0
  let scrollable = 1
  let parallaxTargets = []
  let chapterMetrics = []
  let nav = null
  let links = []
  let lastLiveIndex = -1

  // ---- Chapter scaffolding (homepage only) ----

  if (chapters.length) {
    nav = document.createElement('nav')
    nav.className = 'chapter-nav'
    nav.setAttribute('aria-label', 'Homepage sections')

    links = chapters.map((section, index) => {
      if (!section.id) section.id = `chapter-${index + 1}`
      if (index > 0) {
        const wipe = document.createElement('span')
        wipe.className = 'chapter-wipe'
        wipe.setAttribute('aria-hidden', 'true')
        section.appendChild(wipe)
      }

      const link = document.createElement('a')
      link.className = 'chapter-nav-link'
      link.href = `#${section.id}`
      link.setAttribute('aria-label', `Go to ${section.dataset.chapterLabel}`)
      link.innerHTML = `<span class="chapter-nav-number">${String(index + 1).padStart(2, '0')}</span><span class="chapter-nav-label">${section.dataset.chapterLabel}</span>`
      nav.appendChild(link)

      link.addEventListener('click', (event) => {
        event.preventDefault()
        scrollToChapter(index)
        window.history.replaceState(null, '', link.hash)
      })

      return link
    })

    document.body.appendChild(nav)
    document.body.classList.add('home-experience')

    // Sticky stays on the chapter shell; camera motion runs on an inner scene
    // so sticky positioning and transforms don't fight over the same layer.
    chapters.forEach(section => {
      if (section.querySelector(':scope > .chapter-scene')) return
      const scene = document.createElement('div')
      scene.className = 'chapter-scene'
      Array.from(section.childNodes).forEach(child => {
        if (child.nodeType === 1 && child.classList.contains('chapter-wipe')) return
        scene.appendChild(child)
      })
      section.insertBefore(scene, section.firstChild)
    })
  }

  // ---- Section-per-gesture navigation ----
  //
  // CSS scroll-snap alone does not do this. Under `mandatory` snap a single
  // wheel notch moves ~100px of an 800px section, never crosses the halfway
  // point, and the browser snaps straight back — the page appears not to move
  // at all. Snap handles trackpad throws well and a mouse wheel badly, so the
  // transition is animated here instead and CSS snapping is off.
  //
  // The lockout rule that broke the old implementation was requiring a decaying
  // momentum tail followed by a rising one before accepting another gesture,
  // which a uniform mouse wheel can never satisfy. This uses a plain deadline:
  // input is ignored while a transition is in flight and accepted immediately
  // afterwards. Nothing can extend that deadline, so it cannot deadlock.

  const SECTION_DURATION = 620    // ms per transition
  const WHEEL_THRESHOLD = 40      // accumulated delta before advancing
  const WHEEL_TAIL_FLOOR = 5      // below this is momentum decay, not intent
  const GESTURE_GAP = 90          // ms of quiet that marks a genuinely new gesture
  const CONTINUOUS_ADVANCE = 950  // ms; unbroken input still steps at this rate
  const SUSTAIN_RATIO = .5        // vs the gesture's peak: sustained, not decaying
  const SNAP_EPSILON = 4          // px; this close to a target counts as on it
  const SETTLE_DELAY = 140        // ms of scroll quiet before rescuing a stranded page

  const easeInOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

  let sectionTargets = []
  let targetIndex = 0
  let animatingUntil = 0
  let tweenFrame = 0
  let wheelAccum = 0
  let lastWheelTime = 0
  let lastAdvanceAt = 0
  let sawGapSinceAdvance = true
  let gesturePeak = 0
  let settleTimer = 0

  // Which section the page is closest to. This is the right question for "where
  // am I" — the chapter nav, Home/End — but the wrong one for "where does one
  // step go", see stepIndex.
  function currentSectionIndex(){
    const y = window.scrollY
    let nearest = 0
    for (let i = 1; i < sectionTargets.length; i++) {
      if (Math.abs(sectionTargets[i] - y) < Math.abs(sectionTargets[nearest] - y)) nearest = i
    }
    return nearest
  }

  // The section one step along from where the page ACTUALLY is, rather than
  // from whichever section it is nearest.
  //
  // Stepping from the nearest section is what let a gesture skip a whole slide.
  // Anything that scrolls the page without going through this engine leaves it
  // off-target — and the page has such a thing: the video chapter is covered by
  // a cross-origin YouTube iframe, so a wheel with the pointer over it is
  // dispatched inside that frame, never reaches handleWheel, is never
  // preventDefault'ed, and chains natively to the page. Once that drift passed
  // half a viewport the nearest section was already the NEXT one, so
  // nearest + 1 jumped clean over it: measured landing on Sugar on the Rocks
  // from 451px past the video, with Shows never appearing at all.
  //
  // Asking for the first target beyond the current position instead means a
  // gesture lands on the adjacent section no matter how the page got here.
  function stepIndex(direction){
    const y = window.scrollY
    if (direction > 0) {
      for (let i = 0; i < sectionTargets.length; i++) {
        if (sectionTargets[i] > y + SNAP_EPSILON) return i
      }
      return sectionTargets.length - 1
    }
    for (let i = sectionTargets.length - 1; i >= 0; i--) {
      if (sectionTargets[i] < y - SNAP_EPSILON) return i
    }
    return 0
  }

  // Belt and braces for the same class of problem: if the page ends up resting
  // between sections — an iframe chaining its scroll, a focus jump, a trackpad
  // edge case — settle it onto the nearest one rather than leaving it stranded.
  function scheduleSettle(){
    if (!spatialEnabled || reduceMotion.matches) return
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      if (tweenFrame || performance.now() < animatingUntil) return
      const index = currentSectionIndex()
      const top = sectionTargets[index]
      if (top === undefined || Math.abs(top - window.scrollY) <= SNAP_EPSILON) return
      targetIndex = index
      tweenTo(top, false)
    }, SETTLE_DELAY)
  }

  // `arm` decides whether this counts as a transition the wheel has to respect.
  // A user-initiated move does; the settle rescue below must NOT, or the next
  // notch takes the mid-transition branch and steps off a targetIndex the page
  // has never actually reached — which is a two-section jump by another route.
  function tweenTo(top, arm = true){
    if (tweenFrame) cancelAnimationFrame(tweenFrame)
    const from = window.scrollY
    const distance = top - from
    if (!distance) return
    const start = performance.now()
    if (arm) animatingUntil = start + SECTION_DURATION

    // Once Motion has loaded it supplies a spring for the curve (see
    // sectionSpring in the Motion block below): the section lands with a slight
    // settle instead of an even ease. It runs a little longer than
    // SECTION_DURATION, but is visually home by then, so the input deadline
    // stays where it was. Until Motion arrives the original curve is used.
    const spring = window.__sectionSpring
    const duration = spring ? spring.duration : SECTION_DURATION
    const curve = spring ? spring.ease : easeInOutCubic

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      window.scrollTo(0, Math.round(from + distance * curve(t)))
      tweenFrame = t < 1 ? requestAnimationFrame(step) : 0
    }
    tweenFrame = requestAnimationFrame(step)
  }

  function goToSection(index){
    const next = clamp(index, 0, sectionTargets.length - 1)
    // Never arm the deadline for a move that is not happening — at the first or
    // last section that would block input for no reason.
    if (next === targetIndex && performance.now() < animatingUntil) return
    targetIndex = next
    const top = sectionTargets[next]
    if (top === undefined || Math.round(top) === Math.round(window.scrollY)) return
    if (reduceMotion.matches) {
      window.scrollTo(0, top)
      return
    }
    tweenTo(top)
  }

  function handleWheel(event){
    if (!spatialEnabled || reduceMotion.matches || event.ctrlKey || !event.deltaY) return
    event.preventDefault()

    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportHeight : 1
    const delta = event.deltaY * multiplier
    // The event's own timestamp, not when the handler happened to run.
    const now = event.timeStamp || performance.now()

    const magnitude = Math.abs(delta)
    const gap = now - lastWheelTime

    // Mid-transition. Momentum arrives as an unbroken stream and is dropped, so
    // a fling cannot buy itself extra sections. A distinct new gesture — a
    // pause in front of it and real weight behind it — retargets one further
    // along instead, so notches during the animation chain smoothly rather than
    // being thrown away.
    if (now < animatingUntil) {
      lastWheelTime = now
      wheelAccum = 0
      if (gap > GESTURE_GAP && magnitude >= WHEEL_THRESHOLD) {
        gesturePeak = magnitude
        sawGapSinceAdvance = false
        lastAdvanceAt = now
        // Chain from the transition's destination so notches during an
        // animation queue up smoothly — but never name a section further than
        // one step from where the page physically is, or a stale targetIndex
        // turns one notch into a two-section jump.
        const chained = targetIndex + Math.sign(delta)
        goToSection(delta > 0
          ? Math.min(chained, stepIndex(1))
          : Math.max(chained, stepIndex(-1)))
      }
      return
    }

    lastWheelTime = now
    // Only a real pause starts a new gesture — and only then does the peak
    // reset. Keeping the peak across the whole unbroken stream is what lets a
    // decaying tail be told apart from sustained input below.
    if (gap > GESTURE_GAP) {
      sawGapSinceAdvance = true
      wheelAccum = 0
      gesturePeak = 0
    }

    // The tail of a trackpad fling decays toward zero. Real intent — a wheel
    // notch or a fresh push — arrives well above this.
    if (magnitude < WHEEL_TAIL_FLOOR) return

    gesturePeak = Math.max(gesturePeak, magnitude)
    wheelAccum += delta
    if (Math.abs(wheelAccum) < WHEEL_THRESHOLD) return

    // A fling outlives the transition: the tween runs 620ms while momentum
    // keeps firing for a second or more. The tail was accumulating the instant
    // the transition ended and stealing a second step, so a gesture aimed at a
    // section sailed straight past it.
    //
    // An unbroken stream of events is one gesture, however long it runs, so it
    // is held off until either a genuine pause or CONTINUOUS_ADVANCE. Past that
    // window, sustained input still steps — a spun wheel keeps arriving near
    // its own peak — while a decaying tail, which by then is a small fraction
    // of the peak it started from, does not. Judging the magnitude against the
    // gesture's own peak is what separates the two without ever locking out.
    if (!sawGapSinceAdvance) {
      if (now - lastAdvanceAt < CONTINUOUS_ADVANCE) {
        wheelAccum = 0
        return
      }
      if (magnitude < gesturePeak * SUSTAIN_RATIO) {
        wheelAccum = 0
        return
      }
    }

    const direction = Math.sign(wheelAccum)
    wheelAccum = 0
    sawGapSinceAdvance = false
    lastAdvanceAt = now
    goToSection(stepIndex(direction))
  }

  function handleKey(event){
    if (!spatialEnabled) return
    const forward = ['ArrowDown', 'PageDown', ' '].includes(event.key)
    const back = ['ArrowUp', 'PageUp'].includes(event.key)
    const tag = (event.target.tagName || '').toLowerCase()
    if (tag === 'input' || tag === 'textarea' || event.target.isContentEditable) return
    if (!forward && !back && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    if (event.key === 'Home') return goToSection(0)
    if (event.key === 'End') return goToSection(sectionTargets.length - 1)
    goToSection(stepIndex(forward ? 1 : -1))
  }

  // In-page links that point at a chapter (Watch the Video, Tracklist, Name
  // It Yourself Fest) move through the section engine, so targetIndex stays honest
  // and the next wheel gesture continues from where the click landed.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (link.classList.contains('chapter-nav-link')) return
    const id = (link.getAttribute('href') || '').slice(1)
    if (!id) return
    const index = chapters.findIndex(section => section.id === id)
    if (index < 0) return
    link.addEventListener('click', (event) => {
      if (!spatialEnabled) return
      event.preventDefault()
      goToSection(index)
      window.history.replaceState(null, '', `#${id}`)
    })
  })

  // The hero's scroll cue advances one section, same as a wheel gesture.
  const scrollCue = document.querySelector('.scroll-cue')
  if (scrollCue) {
    scrollCue.addEventListener('click', () => {
      if (spatialEnabled) goToSection(stepIndex(1))
      else scrollToChapter(1)
    })
  }

  function scrollToChapter(index){
    if (spatialEnabled) {
      goToSection(clamp(index, 0, sectionTargets.length - 1))
      return
    }
    const section = chapters[clamp(index, 0, chapters.length - 1)]
    if (!section) return
    // Under snapping only the browser's own smooth scroll knows where the snap
    // points are; Lenis animating the scroll position would fight them.
    if (snapEnabled) {
      section.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' })
      return
    }
    const top = index === 0 ? 0 : (chapterMetrics[index]?.top ?? section.offsetTop)
    if (window.__lenis) window.__lenis.scrollTo(top, { duration: 1.05 })
    else window.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' })
  }

  // ---- Measure ----
  // Runs on load, resize and media-query changes. Never during a scroll, so no
  // scroll frame is ever forced to flush layout.

  function measure(){
    viewportHeight = window.innerHeight || document.documentElement.clientHeight
    scrollable = Math.max(1, document.documentElement.scrollHeight - viewportHeight)

    const scrollY = window.scrollY
    parallaxTargets = []
    parallaxConfig.forEach(({ selector, speed }) => {
      document.querySelectorAll(selector).forEach(node => {
        const rect = node.getBoundingClientRect()
        parallaxTargets.push({ node, speed, top: rect.top + scrollY, height: rect.height })
      })
    })

    // The pinned footer's height varies with viewport width (the links wrap),
    // so the space each slide reserves for it is measured rather than guessed.
    const footer = document.querySelector('.site-footer')
    if (footer && chapters.length) {
      document.body.style.setProperty('--home-footer-h',
        spatialEnabled ? `${Math.round(footer.offsetHeight)}px` : '')
    }

    // Same reasoning for the fixed header, minus the spatial condition — it is
    // fixed on the homepage in every mode, so whatever has to clear it needs
    // the real number either way.
    const headerEl = document.querySelector('.site-header')
    if (headerEl && chapters.length) {
      document.body.style.setProperty('--home-header-h', `${Math.round(headerEl.offsetHeight)}px`)
    }

    // Natural positions, not where things currently sit. In the torn-paper
    // layout (Motion block below) sections are sticky, and a stuck element's
    // offsetTop reports where it is pinned — measured mid-page, every link
    // to a section would aim at the wrong place.
    // Margins count too: the torn edges overlap each section onto the one
    // before it with a negative margin.
    const margins = el => {
      const style = getComputedStyle(el)
      return (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0)
    }
    chapterMetrics = chapters.map(section => {
      let top = section.parentElement.offsetTop + (parseFloat(getComputedStyle(section).marginTop) || 0)
      for (let el = section.parentElement.firstElementChild; el && el !== section; el = el.nextElementSibling) {
        top += el.offsetHeight + margins(el)
      }
      return { top, height: section.offsetHeight }
    })

    // Stops the wheel steps between. The footer sits after <main>, so add the
    // page bottom as a final stop or it becomes unreachable once JS owns the
    // wheel.
    sectionTargets = chapterMetrics.map(m => m.top)
    const maxScroll = document.documentElement.scrollHeight - viewportHeight
    const lastChapterTop = sectionTargets[sectionTargets.length - 1] ?? 0
    if (maxScroll > lastChapterTop + 8) sectionTargets.push(maxScroll)
    targetIndex = currentSectionIndex()
  }

  // ---- Per-frame update ----

  function update(){
    frame = 0
    const scrollY = window.scrollY

    for (let i = 0; i < parallaxTargets.length; i++) {
      const target = parallaxTargets[i]
      if (!parallaxEnabled) {
        target.node.style.setProperty('--parallax-y', '0px')
        continue
      }
      const center = target.top - scrollY + target.height / 2
      const offset = (viewportHeight / 2 - center) * target.speed
      target.node.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`)
    }

    if (!chapters.length) return

    nav.style.setProperty('--page-progress', clamp(scrollY / scrollable, 0, 1).toFixed(4))

    let activeIndex = 0
    const chapterAnchor = scrollY + viewportHeight * .45

    for (let index = 0; index < chapters.length; index++) {
      const section = chapters[index]
      const metrics = chapterMetrics[index]
      if (!metrics) continue
      if (metrics.top <= chapterAnchor) activeIndex = index
      if (reduceMotion.matches) continue

      const flowTop = metrics.top - scrollY

      if (spatialEnabled) {
        const hasNext = index + 1 < chapters.length
        const nextFlowTop = hasNext ? chapterMetrics[index + 1].top - scrollY : viewportHeight
        // How far the NEXT section has come up over this one, 0 to 1. The
        // incoming section itself needs nothing: the scroll slides it up.
        const leaving = hasNext && nextFlowTop > 0 && nextFlowTop < viewportHeight
        let scale = 1, opacity = 1, hold = 0

        if (leaving) {
          const covered = ease(1 - nextFlowTop / viewportHeight)
          scale = 1 - (1 - STAGE_OUT.scale) * covered
          opacity = 1 - (1 - STAGE_OUT.opacity) * covered
          hold = -flowTop
        }

        // `hold` cancels the scroll so the covered section stays at the top of
        // the viewport for the whole hand-over. It goes on the section itself,
        // not its inner scene, because the photo backdrops are painted on the
        // section box. One string write per section, compositor-only properties.
        section.style.setProperty('--stage-transform', hold || scale !== 1
          ? `translate3d(0, ${hold.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`
          : 'none')
        section.style.setProperty('--stage-opacity', opacity.toFixed(3))
      } else {
        const sectionCenter = flowTop + metrics.height / 2
        const normalized = clamp((sectionCenter - viewportHeight / 2) / (viewportHeight * .9), -1, 1)
        const distance = Math.abs(normalized)
        const entryProgress = clamp(1 - ((flowTop - viewportHeight * .12) / (viewportHeight * .76)), 0, 1)
        section.style.setProperty('--chapter-drift', `${(normalized * 14).toFixed(2)}px`)
        section.style.setProperty('--chapter-cover-x', `${(normalized * -16).toFixed(2)}px`)
        section.style.setProperty('--chapter-info-x', `${(normalized * 16).toFixed(2)}px`)
        section.style.setProperty('--chapter-cover-rotate', `${(normalized * -.75).toFixed(3)}deg`)
        section.style.setProperty('--chapter-opacity', `${(1 - distance * .12).toFixed(3)}`)
        section.style.setProperty('--chapter-wipe-y', `${(-72 * entryProgress).toFixed(2)}%`)
        section.style.setProperty('--chapter-wipe-opacity', `${(.72 * (1 - entryProgress)).toFixed(3)}`)
      }
    }

    for (let i = 0; i < links.length; i++) {
      const active = i === activeIndex
      links[i].classList.toggle('is-active', active)
      if (active) links[i].setAttribute('aria-current', 'step')
      else links[i].removeAttribute('aria-current')
    }

    // will-change keeps a chapter's whole photo backdrop as its own GPU layer.
    // Doing that for all six at once, permanently, is six full-viewport
    // textures held in video memory for the five the camera isn't anywhere
    // near. Promoting only the active chapter and its immediate neighbours —
    // enough that a mid-transition frame never finds its destination
    // un-promoted — keeps the layer budget to three.
    if (spatialEnabled && activeIndex !== lastLiveIndex) {
      lastLiveIndex = activeIndex
      for (let i = 0; i < chapters.length; i++) {
        chapters[i].classList.toggle('is-scene-live', Math.abs(i - activeIndex) <= 1)
      }
    }
  }

  function schedule(){
    const now = performance.now()
    if (frame) {
      // A frame requested long ago and never delivered means frames were
      // suspended (background tab, throttled renderer). Without this the guard
      // stays armed forever and every later schedule() is a no-op — the whole
      // scroll engine silently stops updating. Re-arm instead of staying stuck.
      if (now - frameRequestedAt < 1000) return
      cancelAnimationFrame(frame)
    }
    frameRequestedAt = now
    frame = requestAnimationFrame(update)
  }

  // A frame queued while the tab is hidden may never be delivered, which would
  // leave `frame` set forever and permanently deadlock every later schedule().
  // Coming back visible, drop any stale request and re-measure — offsets can
  // have changed while we were away.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    measure()

    // Frames stop while hidden, so a transition in flight when the tab went
    // away never finished and the page is parked between two sections. Settle
    // onto the nearest one instead of leaving it stranded.
    if (spatialEnabled) {
      if (tweenFrame) {
        cancelAnimationFrame(tweenFrame)
        tweenFrame = 0
      }
      animatingUntil = 0
      wheelAccum = 0
      targetIndex = currentSectionIndex()
      const top = sectionTargets[targetIndex]
      if (top !== undefined && Math.round(top) !== Math.round(window.scrollY)) window.scrollTo(0, top)
    }

    schedule()
  })

  // ---- State ----

  function refreshState(){
    spatialEnabled = chapters.length > 0 && spatialMotion.matches
    // Spatial chapters own the motion on the homepage; page-level drift on top
    // of them just fights the camera.
    parallaxEnabled = !reduceMotion.matches && !spatialEnabled

    document.body.classList.toggle('spatial-scroll-active', spatialEnabled)

    // On touch screens every other layout snaps section by section: each fills
    // the screen and one swipe moves exactly one, so a hard fling cannot carry
    // past a section unseen. A section longer than the screen (the album's
    // tracklist, the contact form) still scrolls through its content before
    // the next one snaps in — browsers let you scroll freely inside a snap
    // area taller than the screen. CSS does the snapping (styles.css,
    // .snap-sections); the class has to be on <html>, the element that scrolls.
    snapEnabled = chapters.length > 0 && !spatialEnabled && touchScreen.matches && !shortLandscape.matches
    document.documentElement.classList.toggle('snap-sections', snapEnabled)

    // The root element's scroll-behavior has to be auto while the engine owns
    // the wheel. The two-argument window.scrollTo() the tween calls every frame
    // resolves to the computed scroll-behavior, so with `smooth` in effect each
    // frame cancels the browser's own animation and starts a new one toward a
    // new target — the position never converges and the page does not move.
    //
    // The stylesheet tries to handle this with html:has(.spatial-scroll-active),
    // but :has() is Safari 15.4+ / Chrome 105+. An older engine drops that rule,
    // keeps html{scroll-behavior:smooth} and deadlocks: measured on this page,
    // 0 of 5 section steps land instead of 5 of 5. The sibling rule on
    // .spatial-scroll-active cannot help either — that class is on <body>, and
    // scrolling the viewport reads the value off the document element.
    //
    // Setting it here needs no :has() and works on every engine.
    document.documentElement.style.scrollBehavior = spatialEnabled ? 'auto' : ''

    // The section tween owns the wheel in spatial mode; Lenis interpolating the
    // same gesture would fight it. It still drives ordinary scrolling on every
    // other layout and page.
    const lenis = window.__lenis
    if (lenis && lenis.options) lenis.options.smoothWheel = !reduceMotion.matches && !spatialEnabled

    // Leaving spatial mode mid-transition must not strand the deadline.
    if (!spatialEnabled) {
      animatingUntil = 0
      wheelAccum = 0
      clearTimeout(settleTimer)
      if (tweenFrame) { cancelAnimationFrame(tweenFrame); tweenFrame = 0 }
      chapters.forEach(section => section.classList.remove('is-scene-live'))
      lastLiveIndex = -1
    }

    chapters.forEach(section => {
      section.style.zIndex = spatialEnabled ? String(chapters.indexOf(section) + 1) : ''
      if (!spatialEnabled) {
        section.style.removeProperty('--stage-transform')
        section.style.removeProperty('--stage-opacity')
      }
    })

    measure()
    schedule()
  }

  // ---- Snap tail (touch homepage) ----
  // Contact and the footer are longer than a screen. Once the reader comes to
  // rest on them, snapping is switched off for the rest of the page (CSS,
  // html.snap-tail) — the end-of-page snap it replaces moved every time iOS
  // Safari's toolbar showed or hid, and the page jumped at the bottom. Toggled
  // only at rest, never mid-gesture, so it cannot cut a snap animation short;
  // coming back to rest above the contact section turns snapping back on.
  let tailTimer = 0
  function syncSnapTail(){
    const root = document.documentElement
    const last = chapterMetrics[chapterMetrics.length - 1]
    const inTail = snapEnabled && !!last && window.scrollY >= last.top - SNAP_EPSILON
    if (root.classList.contains('snap-tail') !== inTail) root.classList.toggle('snap-tail', inTail)
  }
  function scheduleSnapTail(){
    if (!snapEnabled && !document.documentElement.classList.contains('snap-tail')) return
    clearTimeout(tailTimer)
    tailTimer = setTimeout(syncSnapTail, 160)
  }
  window.__syncSnapTail = syncSnapTail

  window.addEventListener('scroll', () => { schedule(); scheduleSettle(); scheduleSnapTail() }, { passive: true })
  // Only the homepage has chapters for these to drive, and a non-passive wheel
  // listener makes the browser wait for JS before it can scroll — on all eight
  // pages it was doing that for a handler whose first line returns immediately.
  if (chapters.length) {
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKey)
  }
  // A phone's browser resizes the viewport's height, and only its height,
  // each time its toolbar slides in or out — on iOS several times on the way
  // down a page and again at the bottom. Nothing here is sized by that
  // (sections are svh, which ignores the toolbar), so re-measuring then only
  // shifts the hero drift a few pixels mid-scroll. Rotations, window resizes
  // and anything bigger than a toolbar still re-measure.
  let lastWidth = window.innerWidth
  let lastHeight = window.innerHeight
  function onResize(){
    const width = window.innerWidth
    const height = window.innerHeight
    const toolbarOnly = width === lastWidth && Math.abs(height - lastHeight) < 160 && touchScreen.matches
    lastWidth = width
    lastHeight = height
    if (toolbarOnly) return
    refreshState()
    syncSnapTail()
  }
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('load', refreshState)

  // Arriving from another page with a chapter hash — the nav's festival button
  // is "/#upcoming-section" everywhere but the homepage. The browser's own
  // anchor jump happens before the spatial layout exists, so it lands short;
  // re-place it against the measured targets. Registered after refreshState so
  // the targets are already measured when this runs.
  window.addEventListener('load', () => {
    const id = (window.location.hash || '').slice(1)
    if (!id) return
    const index = chapters.findIndex(section => section.id === id)
    if (index < 0) return
    const top = sectionTargets[index]
    if (top === undefined) return
    targetIndex = index
    window.scrollTo(0, top)
    schedule()
  })
  // Hold a fresh arrival where it was meant to land until the visitor touches
  // the page. Opened from an Instagram ad, the page jumped straight to the
  // contact form: Meta's in-app browser injects its own script, which reaches
  // for form fields, and iOS scrolls a focused field into view. Nothing here
  // asked for that move, so for the first moments after landing any scroll
  // the visitor did not make is undone. A reload is already reset to the top
  // (resetScrollOnReload); back/forward keeps the browser's own restore.
  ;(function guardLanding(){
    if (!chapters.length) return
    const entry = typeof performance.getEntriesByType === 'function'
      ? performance.getEntriesByType('navigation')[0]
      : null
    if (entry && entry.type !== 'navigate') return

    const id = (window.location.hash || '').slice(1)
    const index = id ? chapters.findIndex(section => section.id === id) : -1
    // A hash that names no chapter has nothing to land on.
    if (id && index < 0) {
      history.replaceState(history.state, '', `${window.location.pathname}${window.location.search}`)
    }
    const landingTop = () => index > 0 ? (sectionTargets[index] ?? 0) : 0

    const GUARD_MS = 2500
    const inputs = ['touchstart', 'pointerdown', 'wheel', 'keydown']
    let done = false

    function release(){
      if (done) return
      done = true
      inputs.forEach(type => window.removeEventListener(type, release, true))
      window.removeEventListener('scroll', hold)
      window.removeEventListener('load', hold)
      document.removeEventListener('focusin', hold)
    }

    function hold(){
      if (done) return
      const active = document.activeElement
      if (active && active !== document.body && active.closest && active.closest('#contact-section')) active.blur()
      const top = landingTop()
      if (Math.abs(window.scrollY - top) > SNAP_EPSILON) {
        const root = document.documentElement
        const previous = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto'
        window.scrollTo(0, top)
        root.style.scrollBehavior = previous
      }
    }

    inputs.forEach(type => window.addEventListener(type, release, { capture: true, passive: true }))
    window.addEventListener('scroll', hold, { passive: true })
    window.addEventListener('load', hold)
    document.addEventListener('focusin', hold)
    // Counted from load, not from parsing: the injected script runs once the
    // page has loaded, which on a slow connection is well after this point.
    const startTimer = () => setTimeout(release, GUARD_MS)
    if (document.readyState === 'complete') startTimer()
    else window.addEventListener('load', startTimer, { once: true })
  })()

  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', refreshState)
  if (spatialMotion.addEventListener) spatialMotion.addEventListener('change', refreshState)
  if (touchScreen.addEventListener) touchScreen.addEventListener('change', refreshState)
  if (shortLandscape.addEventListener) shortLandscape.addEventListener('change', refreshState)

  // Late-loading images change section offsets; re-measure once they settle
  // rather than re-reading layout on every frame to stay correct.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure)

  window.__remeasureScroll = () => { measure(); schedule() }

  refreshState()
})()

// ===== Keep the reader's place through a rotation =====
// Turning a phone keeps the same scroll offset in pixels, but the page has
// just re-flowed to a new width, so the same offset is somewhere else
// entirely: three sections up on the homepage, a different row of covers on
// the music page. Whenever scrolling comes to rest, this notes which block is
// at the top of the screen and how far into it the reader is; when the width
// changes it puts that block back. The note has to be taken before the
// rotation — by the time `resize` fires the old layout is gone.
;(function keepPlaceOnRotate(){
  const chapters = document.querySelectorAll('main > [data-scroll-chapter]')
  // The homepage is placed by section; other pages by the finest block that
  // is reliably there, so a long page lands on the right row, not just the
  // right half.
  const selector = chapters.length
    ? 'main > [data-scroll-chapter], .site-footer'
    : 'main h1, main h2, main h3, main section, main form, main .release, main .watch-clip, main .member-card, main .gallery-item, main .poster-archive-card, main .contact-aside-block, .site-footer'
  let anchor = null
  let restoring = 0
  let width = window.innerWidth

  // The reading line: just under the header when it is fixed over the page.
  const line = () => {
    const header = document.querySelector('.site-header')
    if (!header || getComputedStyle(header).position !== 'fixed') return 1
    return Math.round(header.getBoundingClientRect().bottom) + 1
  }

  function capture(){
    if (restoring) return
    const y = line()
    let best = null
    let next = null
    document.querySelectorAll(selector).forEach(el => {
      const r = el.getBoundingClientRect()
      if (!r.height) return
      // Smallest block crossing the reading line wins — the most precise.
      if (r.top <= y && r.bottom > y) {
        if (!best || r.height < best.rect.height) best = { el, rect: r }
      } else if (r.top > y && (!next || r.top < next.rect.top)) next = { el, rect: r }
    })
    const pick = best || next
    if (!pick || window.scrollY < 2) { anchor = null; return }
    anchor = { el: pick.el, fraction: Math.max(0, (y - pick.rect.top) / pick.rect.height) }
  }

  function restore(){
    if (!anchor || !anchor.el.isConnected) return
    const root = document.documentElement
    const isChapter = anchor.el.hasAttribute('data-scroll-chapter')
    const snapping = root.classList.contains('snap-sections')
    const lastChapter = chapters[chapters.length - 1]
    // Under section snapping a section is only ever seen from its top, except
    // the last one, which scrolls freely (see .snap-tail).
    let fraction = anchor.fraction
    if (snapping && isChapter && anchor.el !== lastChapter) fraction = 0
    if (snapping) root.classList.toggle('snap-tail', anchor.el === lastChapter || !isChapter)
    const r = anchor.el.getBoundingClientRect()
    const top = Math.max(0, Math.round(window.scrollY + r.top + fraction * r.height - (snapping && isChapter ? 0 : line())))
    if (window.__lenis && typeof window.__lenis.scrollTo === 'function') window.__lenis.scrollTo(top, { immediate: true, force: true })
    window.scrollTo({ top, behavior: 'instant' })
  }

  let restTimer = 0
  window.addEventListener('scroll', () => {
    clearTimeout(restTimer)
    restTimer = setTimeout(capture, 180)
  }, { passive: true })
  window.addEventListener('load', capture)

  window.addEventListener('resize', () => {
    const w = window.innerWidth
    if (w === width) return
    width = w
    if (!anchor) return
    // Re-place now and again as the new layout settles: iOS reports the final
    // size late, and images and the section engine re-measure after this.
    clearTimeout(restoring)
    restoring = setTimeout(() => {
      restore()
      restoring = 0
      capture()
    }, 450)
    requestAnimationFrame(() => requestAnimationFrame(restore))
    setTimeout(restore, 150)
  }, { passive: true })
})()

// Scroll in-page single sections so they land centered in the viewport.
function scrollToCenteredSection(section){
  if(!section) return
  const sectionTop = section.getBoundingClientRect().top + window.scrollY
  const y = Math.max(0, sectionTop + section.offsetHeight / 2 - window.innerHeight / 2)

  if(window.__lenis){
    window.__lenis.scrollTo(y, { duration: 1.45 })
  } else {
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

// Sections that should center in the viewport when linked to in-page.
const CENTERED_SECTION_IDS = ['back-to-me-section', 'modern-nostalgia-section']

// Irrational: desktop centers the section; mobile lands on the video at the bottom.
function scrollToIrrationalSection(){
  const section = document.getElementById('irrational-section')
  if(!section) return

  const mobile = window.matchMedia('(max-width: 768px)').matches
  const sectionTop = section.getBoundingClientRect().top + window.scrollY
  const y = Math.max(0, mobile
    ? sectionTop + section.offsetHeight - window.innerHeight + 32
    : sectionTop + section.offsetHeight / 2 - window.innerHeight / 2
  )

  if(window.__lenis){
    window.__lenis.scrollTo(y, { duration: 1.45 })
  } else {
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

function bindCenteredSectionScrollLinks(){
  const selector = CENTERED_SECTION_IDS.map(id => `a[href="#${id}"]`).join(', ')
  document.querySelectorAll(selector).forEach(link => {
    if(link.classList.contains('chapter-nav-link')) return
    if(link.dataset.centeredScrollBound) return
    link.dataset.centeredScrollBound = 'true'
    link.addEventListener('click', (e) => {
      e.preventDefault()
      scrollToCenteredSection(document.querySelector(link.getAttribute('href')))
    })
  })
}

// Off the spatial layout the video sits inline at the tail of the album section,
// so "Watch the Video" centres it in the viewport. Aligning its top edge — what
// a bare anchor jump does — puts a short section against the header with the
// player low and a screen of nothing under it. On the spatial layout the section
// engine already owns this link, so the handler stands aside.
function bindVideoScrollLink(){
  document.querySelectorAll('a[href="#modern-nostalgia-video-section"]').forEach(link => {
    if(link.classList.contains('chapter-nav-link')) return
    if(link.dataset.videoScrollBound) return
    link.dataset.videoScrollBound = 'true'
    link.addEventListener('click', (e) => {
      // The section engine owns this on the spatial layout, and under
      // snapping the plain anchor jump lands on the video's snap point, which
      // is already the composed screen this handler exists to produce.
      if(document.body.classList.contains('spatial-scroll-active')) return
      if(document.documentElement.classList.contains('snap-sections')) return
      const section = document.getElementById('modern-nostalgia-video-section')
      if(!section) return
      e.preventDefault()
      // Centre in the band the reader can actually see, not the whole viewport:
      // the fixed header covers the top of it, so centring on the viewport puts
      // the player high by half the header.
      const header = document.querySelector('.site-header')
      const headerH = header ? header.getBoundingClientRect().height : 0
      const top = section.getBoundingClientRect().top + window.scrollY
      const y = Math.max(0, top + section.offsetHeight / 2 - (window.innerHeight + headerH) / 2)
      if(window.__lenis) window.__lenis.scrollTo(y, { duration: 1.1 })
      else window.scrollTo({ top: y, behavior: 'smooth' })
    })
  })
}

// Bound here as well as after Lenis loads: the guard above makes it idempotent,
// and this way the link still centres if the smooth-scroll script never arrives.
bindVideoScrollLink()

function bindIrrationalScrollLinks(){
  document.querySelectorAll('a[href="#irrational-section"]').forEach(link => {
    if(link.classList.contains('chapter-nav-link')) return
    if(link.dataset.irrationalScrollBound) return
    link.dataset.irrationalScrollBound = 'true'
    link.addEventListener('click', (e) => {
      e.preventDefault()
      scrollToIrrationalSection()
    })
  })
}

bindCenteredSectionScrollLinks()
bindIrrationalScrollLinks()

// ===== Lenis smooth-scroll =====
// Lenis supplies the same gentle interpolation for programmatic section jumps
// and regular free scrolling on smaller layouts and inner pages.
;(function loadLenis(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // The music grid is a conventional long page. Native scrolling avoids a
  // second interpolator fighting the browser while covers enter the viewport.
  if (document.body.classList.contains('music-page-bg')) return

  // Served from the repo rather than unpkg: a third-party CDN meant scrolling
  // behaved one way before the script landed and another way after, and a slow
  // response left the page on native scroll indefinitely.
  const script = document.createElement('script')
  script.src = 'vendor/lenis.min.js'
  script.async = true
  script.onload = () => {
    if (typeof window.Lenis !== 'function') return

    const lenis = new window.Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false
    })

    // refreshState() is what normally decides this, but it first runs before
    // this script has loaded — window.__lenis is still undefined then, so the
    // assignment there is skipped and Lenis stays on smoothWheel until `load`.
    // On a first visit `load` waits on the hero image and the eager shows
    // banner, so for those seconds Lenis and the section tween were both
    // writing scroll every frame and whichever wrote last won. Publish and
    // sync here, at the only moment that is guaranteed to be after both the
    // instance and the mode exist.
    window.__lenis = lenis
    lenis.options.smoothWheel = !document.body.classList.contains('spatial-scroll-active')

    function raf(time){
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    document.querySelectorAll('a[href^="#"]').forEach(link => {
      const href = link.getAttribute('href')
      if (!href || href.length <= 1 || link.classList.contains('chapter-nav-link') || href === '#irrational-section' || href === '#back-to-me-section' || href === '#modern-nostalgia-section') return
      link.addEventListener('click', (e) => {
        const target = document.querySelector(href)
        if (!target) return
        // Chapter sections are driven by the section engine so the wheel knows
        // where it ended up; two interpolators on one click fight each other.
        if (target.hasAttribute('data-scroll-chapter')) return
        e.preventDefault()
        lenis.scrollTo(target, { offset: 0, duration: 1.45 })
      })
    })

    bindCenteredSectionScrollLinks()
    bindIrrationalScrollLinks()
    bindVideoScrollLink()
  }
  document.head.appendChild(script)
})()

// ===== Custom cursor follower =====
// A single dot lerp-tracks the pointer. It inverts under any background
// via mix-blend-mode and grows + flips color when hovering interactive
// elements. Skipped on touch devices.
;(function customCursor(){
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return

  const dot = document.createElement('div')
  dot.className = 'custom-cursor'
  document.body.appendChild(dot)
  document.body.classList.add('custom-cursor-active')

  let dx = -100, dy = -100, tx = -100, ty = -100
  let raf = null

  function tick(){
    dx += (tx - dx) * 0.45
    dy += (ty - dy) * 0.45
    dot.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) translate(-50%, -50%)`
    // Park the loop once the dot has caught up. It used to run forever after
    // the first mousemove, holding a frame callback open for the whole session.
    if (Math.abs(tx - dx) < 0.1 && Math.abs(ty - dy) < 0.1) {
      raf = null
      return
    }
    raf = requestAnimationFrame(tick)
  }

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX
    ty = e.clientY
    dot.classList.add('visible')
    if (!raf) raf = requestAnimationFrame(tick)
  }, { passive: true })

  document.addEventListener('mouseleave', () => {
    dot.classList.remove('visible')
  })

  const hoverSelector = 'a, button, .btn, .show-row, .show-row-poster, .release, .release-link, .gallery-item, .toggle-btn, input, textarea, label, .ep-stream-btn, .ep-release-cover, .album-tracklist-cover, .store-product-image, .play-btn, .hamburger, .lightbox-nav, .lightbox-close'

  document.addEventListener('mouseover', (e) => {
    const isHover = !!e.target.closest(hoverSelector)
    dot.classList.toggle('hover', isHover)
  })
})()

// Small magnetic response for primary controls on precise pointers.
;(function magneticButtons(){
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return

  let activeButton = null

  document.addEventListener('pointermove', (event) => {
    const button = event.target.closest('.btn')
    if (activeButton && activeButton !== button) {
      activeButton.style.setProperty('--btn-x', '0px')
      activeButton.style.setProperty('--btn-y', '0px')
    }
    activeButton = button
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - .5) * 6
    const y = ((event.clientY - rect.top) / rect.height - .5) * 5 - 2
    button.style.setProperty('--btn-x', `${x.toFixed(2)}px`)
    button.style.setProperty('--btn-y', `${y.toFixed(2)}px`)
  }, { passive: true })

  document.addEventListener('pointerout', (event) => {
    const button = event.target.closest('.btn')
    if (!button || (event.relatedTarget && button.contains(event.relatedTarget))) return
    button.style.setProperty('--btn-x', '0px')
    button.style.setProperty('--btn-y', '0px')
    if (activeButton === button) activeButton = null
  }, { passive: true })
})()

// Scroll-triggered reveal animations.
// Any element marked .reveal / .reveal-fade / .reveal-scale will animate
// into place as it enters the viewport. Exposed globally so dynamically
// inserted elements (e.g. show rows from JSON) can be observed too.
;(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('.reveal,.reveal-fade,.reveal-scale')
      .forEach(el => el.classList.add('in-view'))
    window.__observeReveal = () => {}
    return
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view')
        observer.unobserve(entry.target)
      }
    })
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -8% 0px'
  })

  // Under section snapping a whole screen arrives at once and each section is
  // sized to fit it, so the last rows sit right at the bottom edge. Before
  // its reveal a row is pushed further down, past the section's clipped
  // bottom, where no observer can ever see it — the album's last tracks never
  // appeared. So a snapped section reveals everything in it as it comes in.
  const snapping = document.documentElement.classList.contains('snap-sections')
  const revealAll = section => section.querySelectorAll('.reveal,.reveal-fade,.reveal-scale')
    .forEach(el => el.classList.add('in-view'))
  const shownSections = new WeakSet()
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      shownSections.add(entry.target)
      revealAll(entry.target)
      sectionObserver.unobserve(entry.target)
    })
  }, { threshold: 0.3 })

  function observeReveal(scope){
    const root = scope || document
    root.querySelectorAll('.reveal,.reveal-fade,.reveal-scale').forEach(el => {
      if (el.classList.contains('in-view')) return
      const section = snapping && el.closest('main > [data-scroll-chapter]')
      if (!section) return observer.observe(el)
      // Rows added later (shows from JSON) into a section already on screen.
      if (shownSections.has(section)) el.classList.add('in-view')
      else sectionObserver.observe(section)
    })
  }

  observeReveal()
  window.__observeReveal = observeReveal
})()

// ===== Hero timelapse =====
// The homepage hero's background is a 1.9s looping timelapse. What paints
// first is its first frame (the section's CSS background, preloaded in
// index.html), and the video only starts once the page has loaded, so it never
// competes with that first paint or with the logo. It fades in only once it is
// actually playing, over an identical frame, so the switch is invisible except
// for the motion starting.
//
// Left as the still: under reduced motion; when the visitor has asked to save
// data or is on a 2G-class connection (a looping video is pure decoration);
// and whenever the browser refuses to autoplay — iOS low power mode does — in
// which case play() rejects and nothing else happens. Off screen it pauses,
// so it costs nothing while the rest of the page is being read.
;(function heroVideo(){
  const video = document.querySelector('.hero-video')
  if (!video) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const connection = navigator.connection
  if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))) return

  const phone = window.matchMedia('(max-width: 640px)')
  const hero = video.closest('section') || video.parentElement
  let started = false
  let onScreen = true

  const sourceFor = () => (phone.matches ? video.dataset.srcMobile : video.dataset.src)
  const play = () => { if (onScreen) video.play().catch(() => {}) }

  video.addEventListener('playing', () => video.classList.add('is-playing'))

  function start(){
    if (started) return
    started = true
    video.src = sourceFor()
    video.preload = 'auto'
    play()
  }

  // Load, or 2.5s in, whichever comes first: on a slow phone `load` also waits
  // for images further down the page, and the hero should not wait for those.
  if (document.readyState === 'complete') start()
  else {
    window.addEventListener('load', start, { once: true })
    setTimeout(start, 2500)
  }

  // Rotating past the phone breakpoint swaps to the matching cut.
  phone.addEventListener('change', () => {
    if (!started) return
    video.classList.remove('is-playing')
    video.src = sourceFor()
    play()
  })

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting
      if (!started) return
      if (onScreen) play()
      else video.pause()
    }).observe(hero)
  }
})()

// ===== Deferred section backgrounds =====
// A CSS background on a section downloads as soon as the stylesheet applies,
// however far down the page the section is — every visitor would pay for the
// video section's photo while still looking at the hero. Elements marked
// data-lazy-bg get .bg-ready, which is what the stylesheet hangs the image on,
// once they are within three quarters of a screen of the viewport, so the
// photo is fetched in time to be there when the section arrives and never
// sooner. Not a full screen: on the desktop slides every section is exactly
// one screen tall, so a full screen of margin touches the section two slides
// down at load, and a touching edge counts as intersecting.
;(function lazyBackgrounds(){
  const targets = document.querySelectorAll('[data-lazy-bg]')
  if (!targets.length) return
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('bg-ready'))
    return
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('bg-ready')
      observer.unobserve(entry.target)
    })
  }, { rootMargin: '75% 0px' })
  targets.forEach(el => observer.observe(el))
})()

// ===== Release streaming links =====
// Every platform URL for the current release lives in data/release.json, so
// adding one the day it goes live is a single-file edit with no markup change.
// A button whose URL is still empty is removed rather than shipped pointing
// nowhere, and the buttons start hidden so none of them flash in first.
;(function releaseLinks(){
  const buttons = document.querySelectorAll('[data-stream]')
  if(!buttons.length) return

  const drop = () => buttons.forEach(button => button.remove())

  fetch('data/release.json', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => {
      const links = (data.album && data.album.links) || {}
      buttons.forEach(button => {
        const url = links[button.dataset.stream]
        if(!url){ button.remove(); return }
        button.href = url
        button.hidden = false
      })
    })
    .catch(drop)
})()


// Add ordinal suffix to dates
function addOrdinal(dateStr) {
  return dateStr.replace(/\b(\d+)(,)/g, (match, num, comma) => {
    const n = parseInt(num)
    const suffix = n % 10 === 1 && n !== 11 ? 'st' :
                   n % 10 === 2 && n !== 12 ? 'nd' :
                   n % 10 === 3 && n !== 13 ? 'rd' : 'th'
    return `${num}<sup>${suffix}</sup>${comma}`
  })
}

// Parse "Mar 6, 2026" into parts
function parseDateParts(dateStr) {
  const match = dateStr.match(/^(\w+)\s+(\d+),\s*(\d{4})$/)
  if (!match) return null
  const months = {Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May',Jun:'June',Jul:'July',Aug:'August',Sep:'September',Oct:'October',Nov:'November',Dec:'December'}
  const n = parseInt(match[2])
  const suffix = n % 10 === 1 && n !== 11 ? 'st' :
                 n % 10 === 2 && n !== 12 ? 'nd' :
                 n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return { month: months[match[1]] || match[1], day: match[2], dayOrd: n + suffix, year: match[3] }
}

// Publish the announced dates as MusicEvent structured data. Search engines only
// see the shows section after this script renders it, and the markup is built
// from the same shows.json the page draws, so a date can never be announced in
// one place and stale in the other. Only the page that actually lists the shows
// emits it, so the markup is never duplicated across the site.
const SITE_ORIGIN = 'https://www.dirtyaesthetic.com'
const MONTH_INDEX = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'}

function isoShowDate(dateStr){
  const match = /^(\w{3})\w*\s+(\d{1,2}),\s*(\d{4})$/.exec(dateStr || '')
  if(!match) return null
  const month = MONTH_INDEX[match[1]]
  if(!month) return null
  return `${match[3]}-${month}-${String(match[2]).padStart(2,'0')}`
}

function publishShowSchema(shows){
  const events = shows.map(s => {
    const startDate = isoShowDate(s.date)
    if(!startDate || !s.venue) return null
    // shows.json carries a street address in `city` for some rooms and a plain
    // city name for others; a leading digit is what separates the two.
    const street = /^\d/.test(s.city || '') ? s.city : null
    const event = {
      '@type': 'MusicEvent',
      name: `Dirty Aesthetic at ${s.venue}${s.title ? ', ' + s.title : ''}`,
      startDate,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      url: `${SITE_ORIGIN}/#upcoming-section`,
      location: {
        '@type': 'MusicVenue',
        name: s.venue,
        address: Object.assign(
          { '@type': 'PostalAddress', addressLocality: 'Vancouver', addressRegion: 'BC', addressCountry: 'CA' },
          street ? { streetAddress: street } : {}
        )
      },
      performer: { '@id': `${SITE_ORIGIN}/#band` },
      organizer: { '@id': `${SITE_ORIGIN}/#band` }
    }
    if(s.poster) event.image = `${SITE_ORIGIN}/${s.poster.replace(/^\//,'')}`
    if(s.link) event.offers = { '@type': 'Offer', url: s.link, availability: 'https://schema.org/InStock' }
    return event
  }).filter(Boolean)

  if(!events.length) return
  const tag = document.createElement('script')
  tag.type = 'application/ld+json'
  tag.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': events })
  document.head.appendChild(tag)
}

// Load shows
const emptyShowsEditorialHtml = `<div class="show-row show-row-empty" role="status"><span class="show-row-venue">TBA</span></div>`
// Show posters are replaced in place under the same filename whenever a bill
// changes, so every one is versioned rather than only whichever show happened
// to be featured when this was written. Bump it when artwork is swapped.
const showsAssetVersion = '20260928'

function showMediaUrl(path){
  if(!path) return path
  return `${path}${path.includes('?') ? '&' : '?'}v=${showsAssetVersion}`
}

// Width of the -sm thumbnail optimize_images.py writes beside every poster.
const POSTER_SMALL_W = 400
// The media condition the scroll engine enables itself on, repeated here so the
// browser can be told how wide the poster really lands in that layout.
const SPATIAL_QUERY = '(min-width:1081px) and (min-height:680px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)'
// What the row actually paints a poster at, mirroring the stylesheet: the
// spatial homepage sizes it by height and keeps it small, the phone layout by
// viewport width, everything else by the 30vw/10vw rules. Told nothing, the
// browser assumes an image fills the page and always fetches the largest file —
// which is how a 66px slot ended up decoding a 900px picture.
const posterSizes = isNext => isNext
  ? `${SPATIAL_QUERY} 160px, (max-width:820px) 25vw, 30vw`
  : `${SPATIAL_QUERY} 120px, (max-width:820px) 25vw, 10vw`

fetch('data/shows.json', { cache: 'no-store' }).then(r=>r.json()).then(data=>{
  const showsHeading = document.getElementById('shows-feature-heading')
  const showsKicker = document.getElementById('shows-feature-kicker')
  // Index 0 is the next show and always leads; anything after it is listed
  // compactly underneath, and gets promoted simply by the one above expiring.
  const featuredSingle = data.upcoming && data.upcoming[0] && data.upcoming[0].title

  if(featuredSingle && showsHeading){
    showsHeading.textContent = data.upcoming[0].title
    if(showsKicker){
      // A festival slot is not "one night only", so the lead-in comes from the
      // show itself. Only the fallback carries the date, because the card
      // prints it in 40px type a few lines below.
      showsKicker.textContent = data.upcoming[0].kicker
        || `One Night Only · ${data.upcoming[0].date}`
      showsKicker.hidden = false
    }
  } else {
    if(showsHeading) showsHeading.textContent = 'Upcoming Shows'
    if(showsKicker) showsKicker.hidden = true
  }

  // The header button and the hero link name the same show this section does,
  // so they read it from the same place. This runs on every page — the early
  // return below is only for the homepage-only listing — which is what keeps
  // eight headers in step without eight hand-edits per show.
  const nextShow = data.upcoming && data.upcoming[0]
  if (nextShow) {
    const long = nextShow.ticketLabel || nextShow.title || nextShow.venue
    const short = nextShow.ticketLabelShort || long
    document.querySelectorAll('[data-show-label]').forEach(el => { el.textContent = long })
    document.querySelectorAll('[data-show-label-short]').forEach(el => { el.textContent = short })

    // The header button sells the next show, so it goes where that show is
    // sold. A date with no ticket link yet falls back to the section, which is
    // the only place left that says anything useful about it.
    document.querySelectorAll('[data-show-ticket]').forEach(el => {
      if (nextShow.link) {
        el.href = nextShow.link
        el.target = '_blank'
        el.rel = 'noopener'
      } else {
        el.href = '/#upcoming-section'
        el.removeAttribute('target')
        el.removeAttribute('rel')
      }
    })
  }

  const container=document.getElementById('upcoming')
  if(!container)return
  const editorial = container.classList.contains('shows-editorial')

  publishShowSchema(data.upcoming || [])

  if(!data.upcoming || data.upcoming.length===0){
    container.innerHTML = ''
    if(editorial){
      container.innerHTML = emptyShowsEditorialHtml
    } else {
      const li=document.createElement('li')
      li.className='show-list-tba'
      li.textContent='TBA'
      container.appendChild(li)
    }
    return
  }

  // Replace the static August 14 fallback only after the live show data has
  // loaded successfully, so a failed request never erases the promotion.
  container.innerHTML = ''
  if (editorial) {
  }

  data.upcoming.forEach((s, i)=>{
    if(editorial){
      const parts = parseDateParts(s.date)
      const row = document.createElement('a')
      const isNext = i === 0
      // Every date is the same kind of row. The next one is marked so it can be
      // given weight by type and scale, rather than by being lifted onto a card
      // of its own that hides the section behind it.
      row.className = 'show-row reveal' + (isNext ? ' show-row--next' : '')
      row.style.setProperty('--reveal-delay', `${(i * 0.08).toFixed(2)}s`)
      if(s.link){
        row.href = s.link
        row.target = '_blank'
        row.rel = 'noopener'
      } else {
        row.removeAttribute('href')
      }
      const linkLabel = s.link ? (s.linkLabel || (s.link.includes('cjsf') ? 'Stream Live' : 'Tickets')) : ''
      const arrowHtml = s.link ? `<span class="show-row-arrow">${linkLabel} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>` : ''
      const lineupHtml = s.lineup ? `<span class="show-row-lineup">${s.lineupPrefix || 'w/'} ${s.lineup}</span>` : ''
      // Where the show itself has not been fully announced yet.
      const noteHtml = s.note ? `<span class="show-row-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>${s.note}</span>` : ''
      const title = isNext && s.title
        ? [s.venue, s.time].filter(Boolean).join(' · ')
        : (s.title || s.venue)
      const location = isNext && s.title
        ? s.city
        : [s.venue, s.city, s.time].filter(Boolean).join(' · ')
      const posterSrc = showMediaUrl(s.poster)
      const posterDimensions = s.posterWidth && s.posterHeight ? ` width="${s.posterWidth}" height="${s.posterHeight}"` : ''
      const mediaLoading = i === 0 ? 'eager' : 'lazy'
      const posterName = s.title || s.venue
      // The box is shaped by the poster, not the other way round. Without this
      // a landscape poster was letterboxed into a portrait box and painted at
      // 205x102 inside 205x253 — 60% of it empty.
      const posterAspect = s.posterWidth && s.posterHeight
        ? ` style="--poster-ar:${s.posterWidth} / ${s.posterHeight}"`
        : ''
      // A date with no poster can still carry the room's own mark. It is a logo,
      // not artwork: no frame, no shadow, and nothing to open in the lightbox,
      // so it deliberately skips the poster chrome and the data-poster-src hook.
      const logoSrc = !posterSrc && s.logo ? showMediaUrl(s.logo) : ''
      const logoDimensions = s.logoWidth && s.logoHeight ? ` width="${s.logoWidth}" height="${s.logoHeight}"` : ''
      // The lightbox keeps the full-size file through data-poster-src; only the
      // thumbnail in the row gets to pick a smaller one.
      const posterSmallSrc = s.poster && /\.webp$/i.test(s.poster)
        ? showMediaUrl(s.poster.replace(/\.webp$/i, '-sm.webp'))
        : ''
      const posterResponsive = posterSrc && posterSmallSrc && s.posterWidth
        ? ` srcset="${posterSmallSrc} ${POSTER_SMALL_W}w, ${posterSrc} ${s.posterWidth}w" sizes="${posterSizes(isNext)}"`
        : ''
      const mediaHtml = posterSrc
        ? `<div class="show-row-poster"${posterAspect} data-poster-src="${posterSrc}"><img src="${posterSrc}"${posterResponsive} alt="${posterName} poster" loading="${mediaLoading}" decoding="async"${posterDimensions}></div>`
        : (logoSrc
          ? `<div class="show-row-poster show-row-poster--logo"><img src="${logoSrc}" alt="${s.logoAlt || posterName}" loading="${mediaLoading}" decoding="async"${logoDimensions}></div>`
          : '')
      row.innerHTML = `
        <div class="show-row-date">
          <span class="show-row-month">${parts ? parts.month : s.date}</span>
          <span class="show-row-day">${parts ? parts.dayOrd : ''}</span>
        </div>
        <div class="show-row-info">
          <span class="show-row-venue">${title} ${arrowHtml}</span>
          ${lineupHtml}
          ${location ? `<span class="show-row-city">${location}</span>` : ''}
          ${noteHtml}
        </div>
        ${mediaHtml}`
      // A quiet rule between the show that is next and the ones behind it, so
      // the second card reads as "also coming up" rather than as a rival to it.
      if(!isNext && !container.querySelector('.shows-more-label')){
        const label = document.createElement('p')
        label.className = 'shows-more-label reveal'
        label.textContent = 'Also Coming Up'
        container.appendChild(label)
      }
      container.appendChild(row)

      const posterEl = row.querySelector('.show-row-poster')
      if (posterEl) {
        posterEl.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          const overlay = document.getElementById('lightbox')
          if (!overlay) return
          const lbImg = overlay.querySelector('img')
          lbImg.src = posterEl.dataset.posterSrc
          overlay.classList.add('active')
          document.body.style.overflow = 'hidden'
        })
      }
    } else {
      const li=document.createElement('li')
      if(s.link){
        li.style.cursor='pointer'
        li.addEventListener('click', () => {
          window.open(s.link, '_blank', 'noopener,noreferrer')
        })
      }
      li.innerHTML=`
        <span class="show-date">${addOrdinal(s.date)}</span>
        <span class="show-venue">${s.venue}</span>
        <span class="show-city">${s.city}</span>
      `
      container.appendChild(li)
    }
  })
  if (typeof window.__observeReveal === 'function') window.__observeReveal(container)
}).catch(()=>{
  const container=document.getElementById('upcoming')
  if(!container)return
  if(container.children.length) return
  if(container.classList.contains('shows-editorial')){
    container.innerHTML = emptyShowsEditorialHtml
  } else {
    const li=document.createElement('li')
    li.className='show-list-tba'
    li.textContent='TBA'
    container.appendChild(li)
  }
})

// Poster archive — builds the gallery from the same past-show records used by
// the homepage, with optimized thumbnails and full originals in the lightbox.
;(function(){
  const grid = document.getElementById('poster-archive-grid')
  if(!grid) return

  const showsRequest = fetch('data/shows.json', { cache: 'no-store' }).then(response => {
    if(!response.ok) throw new Error('Shows archive missing')
    return response.json()
  })
  const imagesRequest = fetch('data/poster-images.json?v=20260802', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : {})
    .catch(() => ({}))

  Promise.all([showsRequest, imagesRequest]).then(([data, posterImages]) => {
    const archivedShows = Array.isArray(data.past)
      ? data.past.filter(show => show.poster)
      : []

    grid.innerHTML = ''
    if(!archivedShows.length){
      const empty = document.createElement('p')
      empty.className = 'poster-archive-empty'
      empty.textContent = 'The poster archive is being assembled.'
      grid.appendChild(empty)
      return
    }

    archivedShows.forEach((show, index) => {
      // shows.json points at the master under _source/, which is a build input
      // and never published. Only the generated variants may be shown, so a
      // poster with no manifest entry is skipped rather than 404ing.
      const optimized = posterImages[show.poster]
      if(!optimized || !(optimized.webp || optimized.src)) return
      const title = show.title || show.venue
      const card = document.createElement('article')
      card.className = 'poster-archive-card reveal-scale'
      card.style.setProperty('--reveal-delay', `${Math.min(index * 0.06, 0.36).toFixed(2)}s`)

      const artwork = document.createElement('button')
      artwork.className = 'poster-archive-art gallery-item'
      artwork.type = 'button'
      // Prefer the lightbox-sized derivative; the raw poster scans run several
      // megabytes each and were being handed straight to the overlay.
      artwork.dataset.fullSrc = optimized.full || optimized.src
      if(optimized.fullWebp) artwork.dataset.fullWebp = optimized.fullWebp
      artwork.setAttribute('aria-label', `View ${title} poster from ${show.date}`)

      const image = document.createElement('img')
      image.src = optimized.webp || optimized.src
      image.alt = `${title} show poster, ${show.date}`
      image.loading = index < 10 ? 'eager' : 'lazy'
      image.decoding = 'async'
      if(index < 5) image.fetchPriority = 'high'
      if(optimized.width && optimized.height){
        image.width = optimized.width
        image.height = optimized.height
      }
      artwork.appendChild(image)

      const details = document.createElement('div')
      details.className = 'poster-archive-details'

      const date = document.createElement('p')
      date.className = 'poster-archive-date'
      date.textContent = show.date

      const heading = document.createElement('h2')
      heading.textContent = title

      const location = document.createElement('p')
      location.className = 'poster-archive-location'
      location.textContent = show.city || 'Vancouver'

      details.append(date, heading, location)

      // A night with no support acts is not a night whose bill went unrecorded,
      // so it gets no line at all rather than "details unavailable". Shows that
      // simply have no lineup on file keep the fallback.
      if(!show.soloBill){
        const lineup = document.createElement('p')
        lineup.className = 'poster-archive-lineup'
        const lineupLabel = document.createElement('span')
        lineupLabel.textContent = show.lineupPrefix === 'with' ? 'With' : 'On the bill'
        const lineupNames = document.createElement('strong')
        lineupNames.textContent = show.lineup || 'Lineup details unavailable'
        lineup.append(lineupLabel, lineupNames)
        details.appendChild(lineup)
      }
      if(show.notes){
        const note = document.createElement('span')
        note.className = 'poster-archive-note'
        note.textContent = show.notes
        details.appendChild(note)
      }

      card.append(artwork, details)
      grid.appendChild(card)
    })

    if(typeof window.__observeReveal === 'function') window.__observeReveal(grid)
    if(typeof window.__bindGalleryLightbox === 'function') window.__bindGalleryLightbox()
  }).catch(() => {
    grid.innerHTML = '<p class="poster-archive-empty">The poster archive could not be loaded. Please try again.</p>'
  })
})()

// Swing-in animation for band member cards on scroll
;(function(){
  const cards = document.querySelectorAll('.member-card')
  if(!cards.length) return
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.02 })
  cards.forEach(card => observer.observe(card))
})()

// Lightbox — close/nav logic (always set up if #lightbox exists)
;(function(){
  const overlay = document.getElementById('lightbox')
  if(!overlay) return
  const lbImg = overlay.querySelector('img')
  const prevBtn = overlay.querySelector('.lightbox-prev')
  const nextBtn = overlay.querySelector('.lightbox-next')
  const closeBtn = overlay.querySelector('.lightbox-close')
  // Optional details panel (posters.html): filled with a copy of the card's
  // details for whichever poster is showing.
  const caption = overlay.querySelector('.lightbox-caption')
  let current = 0
  let srcs = []
  let captions = []
  let alts = []

  function show(idx){
    current = (idx + srcs.length) % srcs.length
    lbImg.src = srcs[current]
    if(alts[current]) lbImg.alt = alts[current]
    if(!caption) return
    const details = captions[current]
    caption.replaceChildren(...(details ? [details.cloneNode(true)] : []))
    overlay.classList.toggle('has-caption', !!details)
  }

  function close(){
    overlay.classList.remove('active')
    document.body.style.overflow = ''
  }

  closeBtn.addEventListener('click', close)
  overlay.addEventListener('click', (e) => {
    if(e.target === overlay || e.target === lbImg) close()
  })
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); show(current - 1) })
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); show(current + 1) })

  document.addEventListener('keydown', (e) => {
    if(!overlay.classList.contains('active')) return
    if(e.key === 'Escape') close()
    if(e.key === 'ArrowLeft') show(current - 1)
    if(e.key === 'ArrowRight') show(current + 1)
  })

  // Gallery items (EPK page)
  function bindGalleryLightbox(){
    const items = document.querySelectorAll('.gallery-item')
    if(!items.length) return
    srcs = Array.from(items).map(el =>
      el.dataset.fullWebp || el.dataset.fullSrc || el.querySelector('img')?.src || ''
    )
    captions = Array.from(items).map(el =>
      el.closest('.poster-archive-card')?.querySelector('.poster-archive-details') || null
    )
    alts = Array.from(items).map(el => el.querySelector('img')?.alt || '')
    items.forEach((item, i) => {
      if(item.dataset.lightboxBound) return
      item.dataset.lightboxBound = 'true'
      item.addEventListener('click', () => {
        show(i)
        overlay.classList.add('active')
        document.body.style.overflow = 'hidden'
      })
    })
  }
  bindGalleryLightbox()
  window.__bindGalleryLightbox = bindGalleryLightbox

  // Release cover art & merch teaser (data-lightbox-src on any element)
  document.querySelectorAll('[data-lightbox-src]').forEach(el => {
    const img = el.querySelector('img')
    const fullSrc = el.dataset.lightboxSrc
    if (!fullSrc) return

    function openLightbox() {
      lbImg.src = el.dataset.lightboxWebp || fullSrc
      lbImg.alt = (img && img.alt) || 'Preview'
      overlay.classList.add('active')
      document.body.style.overflow = 'hidden'
    }

    el.addEventListener('click', openLightbox)
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openLightbox()
      }
    })
  })
})()

// Merch preorder form (store.html): emails the band via Formspree and packs
// each preorder into a single CSV row so it's easy to track in a spreadsheet.
;(function(){
  const form = document.getElementById('merch-order-form')
  if(!form) return
  const status = document.getElementById('merch-order-status')
  const shippingField = document.getElementById('merch-shipping-field')
  const addressInput = document.getElementById('merch-address')
  const deliveryRadios = form.querySelectorAll('input[name="delivery"]')

  function syncShippingField(){
    const ship = [...deliveryRadios].some(r => r.checked && r.value === 'Ship to me')
    if(shippingField) shippingField.hidden = !ship
    if(addressInput) addressInput.required = ship
  }
  deliveryRadios.forEach(r => r.addEventListener('change', syncShippingField))
  syncShippingField()

  function csvCell(v){
    const s = (v == null ? '' : String(v)).trim()
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = new FormData(form)

    const cols = ['Timestamp','Name','Email','Item','Price','Size','Quantity','Delivery','Address']
    const vals = [
      new Date().toISOString(),
      data.get('name'), data.get('email'),
      data.get('item'), data.get('price'), data.get('size'), data.get('quantity'),
      data.get('delivery'), data.get('address')
    ]
    data.set('order_csv', cols.map(csvCell).join(',') + '\n' + vals.map(csvCell).join(','))

    const btn = form.querySelector('button[type="submit"]')
    const originalText = btn ? btn.textContent : ''
    if(btn){ btn.disabled = true; btn.textContent = 'Sending…' }
    if(status){ status.hidden = true; status.classList.remove('form-status--error') }

    try{
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
      if(!res.ok) throw new Error('Bad response')
      form.hidden = true
      if(status){
        status.hidden = false
        status.textContent = "Preorder received. We'll email you soon. Thank you!"
      }
    } catch(err){
      if(btn){ btn.disabled = false; btn.textContent = originalText }
      if(status){
        status.hidden = false
        status.classList.add('form-status--error')
        status.innerHTML = 'Something went wrong. Please try again or email us at <a href="mailto:dirtyaestheticmusic@gmail.com">dirtyaestheticmusic@gmail.com</a>.'
      }
    }
  })
})()

// Embeds load only where they are actually displayed.
//
// Chrome exempts hidden iframes from loading="lazy" — a display:none frame is
// the shape of an analytics beacon, so it is fetched straight away. Two embeds
// on this site were paying that toll for nothing: the Spotify player, which the
// stylesheet hides below 768px, and a full YouTube player inside
// #recent-singles-section, a section that is `hidden` and that nothing ever
// unhides — measured, it downloaded a player on every single homepage visit.
//
// Holding the URL in data-src is the only thing that actually stops the
// request. Asking the computed style rather than restating any breakpoints
// means the rule lives in one place, the stylesheet, and an embed that becomes
// visible later — a section un-hidden, a window widened — loads by itself.
;(function deferredEmbeds(){
  const frames = [...document.querySelectorAll('iframe[data-src]')]
  if (!frames.length) return

  function sync(){
    for (const frame of frames) {
      if (frame.src) continue
      if (!frame.getClientRects().length) continue
      frame.src = frame.dataset.src
    }
  }

  sync()
  window.addEventListener('resize', sync, { passive: true })
})()

// YouTube's player bundle is 500KB+ of JS that starts running the moment an
// iframe with a real src exists, whether or not anyone ever presses play —
// watch.html alone was paying that four times over on a single page load.
// A thumbnail image and a button are same-origin, so nothing downloads and
// nothing can steal an owned wheel gesture (see the homepage scroll engine)
// until the click that actually means "play this".
;(function youtubeFacades(){
  document.querySelectorAll('.yt-facade[data-yt-id]').forEach(box => {
    const id = box.dataset.ytId
    const play = () => {
      const iframe = document.createElement('iframe')
      const params = box.dataset.ytParams || ''
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1${params ? '&' + params : ''}`
      iframe.title = box.dataset.ytTitle || 'YouTube video player'
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
      iframe.allowFullscreen = true
      box.replaceChildren(iframe)
    }
    box.querySelector('.yt-facade-play').addEventListener('click', play, { once: true })
  })
})()

// Every full-viewport backdrop here is a multi-megapixel photo, and a browser
// does not decode one until the frame it first becomes visible. In the homepage
// section engine that frame lands mid-transition: measured, each first reveal
// blocked the main thread for 200-240ms, while scrolling back through those same
// chapters afterwards cost nothing. The decode is the stall, and there is no
// reason for it to happen during the animation.
//
// So once the page has loaded and the browser goes idle, each backdrop is
// fetched and decoded off the critical path. decode() settles only when the
// bitmap is ready, and they run one at a time deliberately — the point is to
// spend idle time, not to trade one stall for a burst of them.
;(function primeBackdrops(){
  const stem = url => url.split('?')[0].replace(/\.[a-z0-9]+$/i, '')
  const isWebp = url => /\.webp(\?|$)/i.test(url)

  // A computed background can stack several layers, and image-set() lists the
  // same picture as WebP and as JPEG. Keeping the WebP wherever both appear
  // means priming never pulls a fallback the browser would not have used.
  function backdropUrls(el){
    const value = getComputedStyle(el).backgroundImage
    if (!value || value === 'none') return []
    const all = [...value.matchAll(/url\(\s*"?([^")]+?)"?\s*\)/g)].map(m => m[1])
    const haveWebp = new Set(all.filter(isWebp).map(stem))
    return all.filter(url => isWebp(url) || !haveWebp.has(stem(url)))
  }

  function collect(){
    const urls = []
    const seen = new Set()
    document.querySelectorAll('*').forEach(el => {
      const found = backdropUrls(el)
      if (!found.length) return
      const box = el.getBoundingClientRect()
      // Backdrops only. A collapsed or thumbnail-sized box is either not on the
      // page yet or small enough that priming it costs more than it saves.
      if (box.width * box.height < 40000) return
      found.forEach(url => {
        if (seen.has(url)) return
        seen.add(url)
        urls.push(url)
      })
    })
    return urls
  }

  async function prime(){
    for (const url of collect()) {
      const img = new Image()
      img.decoding = 'async'
      img.src = url
      // A backdrop that will not decode is already the page's problem; failing
      // to prime it just leaves the old behaviour rather than breaking the rest.
      try { await img.decode() } catch (err) { /* keep priming the others */ }
    }
  }

  const start = () => {
    if (window.requestIdleCallback) requestIdleCallback(prime, { timeout: 2000 })
    else setTimeout(prime, 200)
  }
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
})()

// EPK — lineup + gallery from data/epk-images.json (supports jpg/png sources)
;(function(){
  const galleryRoot = document.getElementById('epk-gallery')
  const lineupPhotos = document.querySelectorAll('[data-lineup]')
  if(!galleryRoot && !lineupPhotos.length) return

  const EPK_ASSET_VERSION = '20260914-small'
  // No photo is fetched with the page. The gallery sits far below the fold,
  // and the six "eager" ones (three at high priority) were competing with the
  // top of the page for bandwidth on every visit, including the ones that
  // never scroll that far. Each photo starts loading once it is a screen and
  // a half away, measured from the viewport rather than a fixed 500px, so it
  // is ready by the time it arrives on a phone or a large monitor alike.
  const GALLERY_EAGER = 0
  const GALLERY_SIZES = '(min-width:769px) 31vw, 50vw'
  const LAZY_ROOT_MARGIN = '150% 0px'
  const IMG_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

  function versionAsset(path){
    if(!path) return path
    return `${path}${path.includes('?') ? '&' : '?'}v=${EPK_ASSET_VERSION}`
  }

  function applyPicture(picture, image){
    if(!picture || !image) return
    const source = picture.querySelector('source[type="image/webp"]')
    const img = picture.querySelector('img')
    if(source) source.srcset = versionAsset(image.webp)
    if(img) img.src = versionAsset(image.src)
  }

  function markImageLoaded(item, img){
    item.classList.add('is-loaded')
    if(img && img.decode){
      img.decode().catch(() => {}).finally(() => item.classList.add('is-decoded'))
    } else {
      item.classList.add('is-decoded')
    }
  }

  function bindImageLoaded(item, img){
    if(img.complete && img.naturalWidth){
      markImageLoaded(item, img)
      return
    }
    img.addEventListener('load', () => markImageLoaded(item, img), { once: true })
    img.addEventListener('error', () => item.classList.add('is-loaded'), { once: true })
  }

  function buildGalleryItem(image, index){
    const eager = index < GALLERY_EAGER
    const item = document.createElement('div')
    item.className = 'gallery-item reveal-scale' + (eager ? '' : ' gallery-item--lazy')
    item.dataset.galleryIndex = String(index)
    item.style.setProperty('--reveal-delay', '0s')
    if(image.width && image.height){
      item.style.aspectRatio = `${image.width} / ${image.height}`
      item.dataset.ratio = String(image.width / image.height)
    }
    item.dataset.fullSrc = image.full
    if(image.fullWebp) item.dataset.fullWebp = image.fullWebp
    // Every gallery photo used to carry the same two-word alt, which tells a
    // screen reader and an image crawler nothing about any individual shot.
    // Set `alt` on an entry in epk-images.json to describe that photo; the
    // numbered fallback at least keeps them distinguishable.
    const alt = image.alt || `Dirty Aesthetic press photo ${index + 1}`
    // Phones get the 600px WebP, everything wider the 800px one.
    const webpSet = image.webpSmall
      ? `${image.webpSmall} ${image.smallWidth || 600}w, ${image.webp} ${image.width || 800}w`
      : image.webp

    if(eager){
      item.innerHTML = `
        <picture>
          <source type="image/webp" srcset="${webpSet}" sizes="${GALLERY_SIZES}">
          <img src="${image.src}" alt="${alt}" width="${image.width || ''}" height="${image.height || ''}" loading="eager" decoding="async"${index < 3 ? ' fetchpriority="high"' : ''}>
        </picture>`
    } else {
      item.innerHTML = `
        <picture>
          <source type="image/webp" data-srcset="${webpSet}" sizes="${GALLERY_SIZES}">
          <img src="${IMG_PLACEHOLDER}" data-src="${image.src}" data-webp="${image.webp}" alt="${alt}" width="${image.width || ''}" height="${image.height || ''}" loading="lazy" decoding="async">
        </picture>`
    }
    return item
  }

  function hydrateGalleryItem(item){
    if(!item.classList.contains('gallery-item--lazy')) return
    const picture = item.querySelector('picture')
    const source = picture?.querySelector('source[type="image/webp"]')
    const img = picture?.querySelector('img')
    if(!img || !img.dataset.src) return

    if(source?.dataset.srcset){
      source.srcset = source.dataset.srcset
      source.removeAttribute('data-srcset')
    }
    img.src = img.dataset.src
    img.removeAttribute('data-src')
    item.classList.remove('gallery-item--lazy')
    bindImageLoaded(item, img)
  }

  // Only the photos near the screen play the reveal. The rest switch on with no
  // transition, otherwise all 52 tiles animate at once, mostly offscreen, and
  // the browser builds a layer for each of them while the wave plays.
  function revealGallery(root){
    const limit = window.innerHeight * 1.5
    const rootTop = root.getBoundingClientRect().top
    const quiet = []
    root.querySelectorAll('.gallery-item').forEach(el => {
      if(rootTop + el.offsetTop > limit){
        el.style.transition = 'none'
        quiet.push(el)
      }
      el.classList.add('in-view')
    })
    if(quiet.length){
      requestAnimationFrame(() => requestAnimationFrame(() => {
        quiet.forEach(el => { el.style.transition = '' })
      }))
    }
  }

  function watchGalleryReveal(root){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      revealGallery(root)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(!entry.isIntersecting) return
        revealGallery(root)
        observer.disconnect()
      })
    // As soon as the top edge of the gallery reaches the screen. A threshold
    // here is a fraction of the WHOLE gallery — about 8,000px tall — so the
    // old 8% left roughly 640px of empty space under the heading before
    // anything appeared.
    }, { threshold: 0, rootMargin: '0px 0px -5% 0px' })
    observer.observe(root)
  }

  // Stagger the reveal by visual ROW (vertical position), not DOM order, so the
  // gallery waves in top to bottom across all columns rather than one column at
  // a time. Bucketing by offsetTop works for any layout the items end up in.
  function assignRowRevealOrder(root){
    const items = [...root.querySelectorAll('.gallery-item')]
    if(!items.length) return
    const positioned = items.map(el => ({ el, top: el.offsetTop, left: el.offsetLeft }))
    positioned.sort((a, b) => a.top - b.top || a.left - b.left)

    let rowIndex = -1
    let lastTop = -Infinity
    positioned.forEach(({ el, top }) => {
      if(top - lastTop > 40){
        rowIndex++
        lastTop = top
      }
      el.style.setProperty('--reveal-delay', `${Math.min(rowIndex * 0.08, 0.6).toFixed(2)}s`)
    })
  }

  function observeLazyGalleryItems(root){
    const lazyItems = root.querySelectorAll('.gallery-item--lazy')
    if(!lazyItems.length) return

    if(!('IntersectionObserver' in window)){
      lazyItems.forEach(item => hydrateGalleryItem(item))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(!entry.isIntersecting) return
        hydrateGalleryItem(entry.target)
        observer.unobserve(entry.target)
      })
    }, { rootMargin: LAZY_ROOT_MARGIN })

    lazyItems.forEach(item => observer.observe(item))
  }

  // Reading-order masonry. CSS columns fill the first column top to bottom
  // before starting the second, so a curated sequence only ever held down each
  // column and never across a row. Here each photo, in sequence, goes into
  // whichever column is currently shortest and is positioned there absolutely.
  // Heights come from each photo's known aspect ratio, so nothing waits on an
  // image to load, and the DOM keeps the curated order, which is also the order
  // the lightbox steps through. This used to be a grid of 1px rows, but the
  // gallery is about 8,000px tall at 1440 wide and grows with the screen, and
  // Firefox stops a grid at 10,000 lines, piling the last photos on each other.
  let lastGalleryLayout = ''
  function layoutGallery(root, force){
    const cs = getComputedStyle(root)
    const cols = parseInt(cs.getPropertyValue('--gallery-cols'), 10) || 2
    const gap = parseFloat(cs.columnGap) || 0
    const width = root.clientWidth
    const key = `${cols}|${gap}|${width}`
    if(!force && key === lastGalleryLayout) return
    lastGalleryLayout = key
    const colWidth = (width - gap * (cols - 1)) / cols
    const heights = new Array(cols).fill(0)
    root.querySelectorAll('.gallery-item').forEach(item => {
      const ratio = parseFloat(item.dataset.ratio) || 1
      let col = 0
      for(let k = 1; k < cols; k++) if(heights[k] < heights[col] - 0.5) col = k
      const height = colWidth / ratio
      item.style.width = `${colWidth}px`
      item.style.left = `${col * (colWidth + gap)}px`
      item.style.top = `${heights[col]}px`
      heights[col] += height + gap
    })
    root.style.height = `${Math.max(0, Math.max(...heights) - gap)}px`
  }

  function initGallery(root){
    root.classList.add('is-ready', 'is-grid')
    layoutGallery(root, true)
    assignRowRevealOrder(root)
    root.querySelectorAll('.gallery-item:not(.gallery-item--lazy) img').forEach(img => {
      bindImageLoaded(img.closest('.gallery-item'), img)
    })
    observeLazyGalleryItems(root)
    watchGalleryReveal(root)
    if(!root.dataset.layoutBound){
      root.dataset.layoutBound = 'true'
      let pending = false
      const relayout = () => {
        if(pending) return
        pending = true
        requestAnimationFrame(() => {
          pending = false
          layoutGallery(root)
        })
      }
      // Watching the gallery itself also catches the page scrollbar appearing
      // once the photos make the page tall, which narrows it without a resize.
      if('ResizeObserver' in window) new ResizeObserver(relayout).observe(root)
      else window.addEventListener('resize', relayout, { passive: true })
    }
  }

  fetch(`data/epk-images.json?v=${EPK_ASSET_VERSION}`).then(r => {
    if(!r.ok) throw new Error('manifest missing')
    return r.json()
  }).then(data => {
    if(data.lineup){
      lineupPhotos.forEach(photo => {
        const image = data.lineup[photo.dataset.lineup]
        if(!image) return
        applyPicture(photo.querySelector('picture'), image)
      })
    }

    if(galleryRoot && Array.isArray(data.gallery)){
      galleryRoot.innerHTML = ''
      galleryRoot.classList.remove('is-ready')
      data.gallery.forEach((image, i) => galleryRoot.appendChild(buildGalleryItem(image, i)))
      initGallery(galleryRoot)
      if(typeof window.__bindGalleryLightbox === 'function') window.__bindGalleryLightbox()
    }
  }).catch(() => {
    if(galleryRoot) galleryRoot.innerHTML = '<p class="epk-gallery-fallback">Gallery photos loading soon.</p>'
  })
})()

// ===== Motion =====
// vendor/motion.min.js (motion.dev, MIT) drives the effects below. It is 48 KB
// gzipped, so it is fetched only on pages that use it, and only after the
// page's own `load` — it never competes with the hero image for bandwidth.
// Everything here is an enhancement: until Motion arrives, or if it never
// does, the page looks and works exactly as it did without it. Under reduced
// motion none of it runs.
//
// What lives here, and where it applies:
//  - the spring the desktop section engine eases with   (homepage, spatial)
//  - scatter-in section headlines, once each            (home, music, EPK)
//  - pointer depth on the wordmark logo                  (home hero, EPK intro; mouse only)
//  - record sliding out of the album sleeve              (music)
//  - covers that toss in and flip over for details      (music)
//  - torn edges on the EPK divider photo                 (EPK)
//  - cards tossed in as they arrive                      (posters, watch, contact)
//  - lean toward the cursor / squash under the thumb     (store tee, watch videos)
;(function motionEffects(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const wanted = document.querySelector('[data-scroll-chapter], .music-feature, .release-grid, .epk-page, #poster-archive-grid, .watch-clips, .store-product, .contact-aside')
  if (!wanted) return

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
  const rand = (min, max) => min + Math.random() * (max - min)
  const spring = (visualDuration, bounce) => ({ type: 'spring', visualDuration, bounce })
  // Entrances animate one `transform` string rather than separate x / y /
  // rotate / scale values. Motion runs a transform string through the
  // browser's own animation engine (the spring becomes a linear() easing), so
  // it plays on the compositor and cannot hold up scrolling; separate values
  // are recomputed in JavaScript on every frame.
  const pose = (x, y, rotate, scale) => `translate(${x}, ${y}) rotate(${rotate}deg) scale(${scale})`
  const REST = pose('0px', '0px', 0, 1)
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')

  function loadMotion(){
    if (window.Motion) return Promise.resolve(window.Motion)
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'vendor/motion.min.js'
      script.async = true
      script.onload = () => (window.Motion ? resolve(window.Motion) : reject(new Error('Motion missing')))
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // A deterministic ragged edge, so the EPK divider keeps the same tear every
  // visit and every resize rather than reshuffling.
  function raggedEdge(seed, points, depth){
    let s = seed * 9301 + 49297
    const next = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
    return Array.from({ length: points + 1 }, (_, k) => ({ x: k / points * 100, y: next() * depth }))
  }
  const bothTears = (seed, depth = 16) => {
    const top = raggedEdge(seed, 28, depth).map(p => `${p.x.toFixed(2)}% ${p.y.toFixed(1)}px`)
    const bottom = raggedEdge(seed + 7, 28, depth).reverse().map(p => `${p.x.toFixed(2)}% calc(100% - ${p.y.toFixed(1)}px)`)
    return `polygon(${top.join(',')},${bottom.join(',')})`
  }

  // Splits a heading into per-letter spans. Screen readers get the text once
  // from a visually hidden copy; the letters are hidden from them, because read
  // as separate elements a headline is spelled out letter by letter. Motion's
  // own splitText is part of its paid tier, and this needs very little of it.
  function splitLetters(el){
    const text = el.textContent.trim().replace(/\s+/g, ' ')
    el.textContent = ''
    const label = document.createElement('span')
    label.className = 'visually-hidden'
    label.textContent = text
    el.appendChild(label)
    const letters = []
    text.split(' ').forEach((word, i, words) => {
      const w = document.createElement('span')
      w.className = 'split-word'
      w.setAttribute('aria-hidden', 'true')
      for (const ch of Array.from(word)) {
        const c = document.createElement('span')
        c.className = 'split-char'
        c.textContent = ch
        w.appendChild(c)
        letters.push(c)
      }
      el.appendChild(w)
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '))
    })
    return letters
  }

  const features = []

  // ---- Section engine spring (desktop homepage) ----
  // Sampled once into a plain easing function the engine can call per frame.
  // No bounce: any overshoot carries the whole page a few pixels past the
  // section and back, which reads as a jolt on landing, not as weight.
  features.push(M => {
    if (!document.querySelector('[data-scroll-chapter]')) return
    const generator = M.spring({ keyframes: [0, 1], visualDuration: .62, bounce: 0 })
    const duration = M.calcGeneratorDuration ? M.calcGeneratorDuration(generator) : 1000
    window.__sectionSpring = {
      duration,
      ease: t => (t >= 1 ? 1 : generator.next(t * duration).value)
    }
  })

  // ---- Scatter-in headlines (once each) ----
  // Only the main heading of each section. Body copy, buttons and track lists
  // keep their quieter fades, so the page never has everything flying at once.
  features.push(M => {
    const headings = Array.from(document.querySelectorAll([
      '.album-tracklist-copy h2', '.video-feature-title', '#shows-feature-heading',
      '.ep-release-title', '.home-contact h2',
      '.music-header h1', '.music-catalog-heading',
      '.epk-section-title',
      '.watch-clips-heading', '.contact-aside-block h2'
    ].join(',')))
    headings.forEach(heading => {
      // Already on screen by the time Motion arrived: it has had its
      // entrance, so leave it alone rather than make it play twice.
      const box = heading.getBoundingClientRect()
      if (box.top < window.innerHeight && box.bottom > 0) return
      // Take the heading over from the CSS fade so the two do not fight.
      heading.classList.remove('reveal')
      heading.style.opacity = '0'
      M.inView(heading, () => {
        // Split at the last moment: the shows heading's text comes from data
        // and may have changed since the page loaded.
        const letters = splitLetters(heading)
        letters.forEach(c => { c.style.opacity = '0' })
        heading.style.opacity = ''
        letters.forEach((c, i) => M.animate(c,
          { opacity: [0, 1], transform: [pose(`${rand(-90, 90).toFixed(0)}px`, `${rand(-70, 70).toFixed(0)}px`, rand(-70, 70).toFixed(0), rand(.5, 1.5).toFixed(2)), REST] },
          { ...spring(.8, .3), delay: i * .022 }))
      }, { amount: .6 })
    })
  })

  // ---- Wordmark depth (mouse only) ----
  // Only the logo moves — the photo behind it stays put. It tilts toward the
  // cursor and drifts a few pixels, eased by a spring so it trails the hand.
  features.push(M => {
    if (!finePointer.matches) return
    const pairs = [['.hero-logo', '.hero'], ['.epk-logo', '.epk-intro']]
    pairs.forEach(([logoSel, areaSel]) => {
      const logo = document.querySelector(logoSel)
      const area = document.querySelector(areaSel)
      if (!logo || !area) return
      const px = M.motionValue(0), py = M.motionValue(0)
      const sx = M.springValue(px, { stiffness: 110, damping: 18, mass: .7 })
      const sy = M.springValue(py, { stiffness: 110, damping: 18, mass: .7 })
      const render = () => {
        const x = sx.get(), y = sy.get()
        logo.style.transform = `perspective(900px) translate3d(${(x * 14).toFixed(1)}px, ${(y * 10).toFixed(1)}px, 0) rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg)`
      }
      sx.on('change', render)
      sy.on('change', render)
      area.addEventListener('pointermove', e => {
        const r = area.getBoundingClientRect()
        px.set(clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1))
        py.set(clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1))
      })
      area.addEventListener('pointerleave', () => { px.set(0); py.set(0) })
    })
  })

  // ---- Record pull-out (music page) ----
  // The record is added here rather than in the HTML: it is pure decoration,
  // and without Motion the cover stands on its own as it always has. It slides
  // out of the sleeve once, then turns with the page as you scroll.
  features.push(M => {
    const art = document.querySelector('.music-feature-art')
    if (!art) return
    const cover = art.querySelector('img')
    const stage = document.createElement('div')
    stage.className = 'record-stage'
    const disc = document.createElement('div')
    disc.className = 'record-disc'
    disc.setAttribute('aria-hidden', 'true')
    const vinyl = document.createElement('div')
    vinyl.className = 'record-vinyl'
    const label = document.createElement('img')
    label.className = 'record-label'
    label.src = cover.currentSrc || cover.src
    label.alt = ''
    label.decoding = 'async'
    vinyl.appendChild(label)
    disc.appendChild(vinyl)

    // The cover already has its own entrance (the stylesheet's reveal), so it
    // is not animated again here: re-posing it after it had landed read as
    // the cover popping in a second time. The record waits for that entrance
    // to finish completely, too. Wrapping the cover in the stage mid-fade
    // cancels the fade, and on a phone the cover jumped straight from
    // invisible to shown.
    function revealSettled(){
      const revealed = art.classList.contains('in-view') || !art.classList.contains('reveal-scale')
      const running = typeof art.getAnimations === 'function' && art.getAnimations().length > 0
      return revealed && !running
    }
    const startedAt = performance.now()
    function whenSettled(cb){
      if (revealSettled() || performance.now() - startedAt > 4000) return cb()
      setTimeout(() => whenSettled(cb), 80)
    }

    whenSettled(() => {
      art.parentNode.insertBefore(stage, art)
      stage.append(disc, art)
      M.animate(stage, { transform: ['translateX(0%)', 'translateX(-16%)'] }, { ...spring(1.1, .15), delay: .1 })
      M.animate(disc, { transform: ['translateX(0%)', 'translateX(40%)'] }, { ...spring(1.1, .18), delay: .1 })
      M.animate(vinyl, { transform: ['rotate(0deg)', 'rotate(320deg)'] }, { duration: 1.6, ease: [.16, 1, .3, 1], delay: .1 })
        .then(() => {
          // Then the record keeps turning with the page.
          M.scroll(M.animate(vinyl, { transform: ['rotate(320deg)', 'rotate(860deg)'] }, { ease: 'linear' }),
            { target: stage, offset: ['start start', 'end start'] })
        })
    })
  })

  // ---- Cover flips (music page) ----
  // Each release cover becomes a card that turns over to show the release
  // date and a listen link. The caption under the cover stays exactly as it
  // was. Without Motion the cover is still the plain link it always was.
  features.push(M => {
    const releases = Array.from(document.querySelectorAll('.release-grid .release'))
    if (!releases.length) return

    releases.forEach(release => {
      const link = release.querySelector('.release-link')
      const picture = link && link.querySelector('picture')
      const title = release.querySelector('h3')
      const meta = release.querySelector('p')
      if (!link || !picture || !title) return
      const name = title.textContent.trim()
      const service = /spotify/.test(link.hostname) ? 'Spotify' : link.hostname.replace(/^www\./, '')

      const tilt = document.createElement('div')
      tilt.className = 'flip-tilt'
      const inner = document.createElement('div')
      inner.className = 'flip-inner'
      const front = document.createElement('button')
      front.type = 'button'
      front.className = 'flip-face flip-front'
      front.setAttribute('aria-pressed', 'false')
      front.setAttribute('aria-label', `Show details for ${name}`)
      front.appendChild(picture)
      const back = document.createElement('div')
      back.className = 'flip-face flip-back'
      back.inert = true
      back.innerHTML = `<p class="flip-back-title"></p><p class="flip-back-meta"></p><a target="_blank" rel="noopener"></a><button type="button" class="flip-close visually-hidden">Flip back</button>`
      // The back is the same cover, dimmed, under the details. A copy of the
      // front's <picture> picks the same source the browser already has, so
      // nothing new downloads.
      const art = picture.cloneNode(true)
      art.classList.add('flip-back-art')
      art.setAttribute('aria-hidden', 'true')
      const artImg = art.querySelector('img')
      if (artImg) { artImg.alt = ''; artImg.loading = 'lazy' }
      back.prepend(art)
      back.querySelector('.flip-back-title').textContent = name
      back.querySelector('.flip-back-meta').innerHTML = meta ? meta.innerHTML : ''
      const listen = back.querySelector('a')
      listen.href = link.href
      listen.textContent = `Listen on ${service}`
      inner.append(front, back)
      tilt.appendChild(inner)
      link.replaceWith(tilt)
      release.classList.add('flip-card')

      // The face turned away is hidden by script as the card passes 90°.
      // backface-visibility alone is not reliable across WebKit builds — some
      // show the back mirrored straight through the front.
      const angle = M.motionValue(0)
      let focusNext = null
      back.style.visibility = 'hidden'
      angle.on('change', v => {
        inner.style.transform = `rotateY(${v.toFixed(2)}deg)`
        const backUp = Math.abs(v % 360) > 90 && Math.abs(v % 360) < 270
        front.style.visibility = backUp ? 'hidden' : ''
        back.style.visibility = backUp ? 'visible' : 'hidden'
        // Focus follows the card over once the new face is showing; a hidden
        // element cannot take it.
        if (focusNext && (focusNext === front) !== backUp) {
          focusNext.focus({ preventScroll: true })
          focusNext = null
        }
      })
      function flip(open){
        front.setAttribute('aria-pressed', String(open))
        back.inert = !open
        front.inert = open
        focusNext = open ? listen : front
        M.animate(angle, open ? 180 : 0, { type: 'spring', stiffness: 170, damping: 18 })
      }
      front.addEventListener('click', () => flip(true))
      back.querySelector('.flip-close').addEventListener('click', () => flip(false))
      // Tapping anywhere on the back turns it over again, except the link.
      back.addEventListener('click', e => {
        if (e.target.closest('a, .flip-close')) return
        flip(false)
      })

      // A squash under the thumb on press.
      M.press(tilt, () => {
        M.animate(tilt, { scale: .95 }, spring(.2, .3))
        return () => M.animate(tilt, { scale: 1 }, spring(.35, .5))
      })

      // With a mouse, the cover leans toward the cursor.
      if (finePointer.matches) {
        release.addEventListener('pointermove', e => {
          const r = tilt.getBoundingClientRect()
          const x = (e.clientX - r.left) / r.width - .5
          const y = (e.clientY - r.top) / r.height - .5
          M.animate(tilt, { rotateY: x * 16, rotateX: -y * 16 }, { type: 'spring', stiffness: 300, damping: 25 })
        })
        release.addEventListener('pointerleave', () => {
          M.animate(tilt, { rotateY: 0, rotateX: 0 }, { type: 'spring', stiffness: 200, damping: 18 })
        })
      }
    })

    // Covers still below the fold toss in as they arrive, staggered across
    // each row. Ones already revealed are left as they are.
    const grid = document.querySelector('.release-grid')
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 1
    releases.forEach((release, i) => {
      if (release.classList.contains('in-view')) return
      release.classList.remove('reveal-scale')
      release.style.opacity = '0'
      M.inView(release, () => {
        M.animate(release,
          { opacity: [0, 1], transform: [pose('0px', '60px', rand(-10, 10).toFixed(1), .75), REST] },
          { ...spring(.7, .35), delay: (i % columns) * .07 })
      }, { amount: .25 })
    })
  })

  // ---- Torn divider photo (EPK) ----
  // The band photo between the bio and the members gets ragged top and bottom
  // edges, and pushes in slightly as it crosses the screen.
  features.push(M => {
    const divider = document.querySelector('.epk-divider-photo')
    if (!divider) return
    divider.style.clipPath = bothTears(3)
    divider.classList.add('is-torn')
    const img = divider.querySelector('img')
    if (img) M.scroll(M.animate(img, { transform: ['scale(1.18)', 'scale(1)'] }, { ease: 'linear' }),
      { target: divider, offset: ['start end', 'end start'] })
  })

  // ---- Toss-in cards (posters, watch, contact) ----
  // The same arrival the music page's covers make: each card still below the
  // fold drops in from a little lower, tilted, and settles with a spring,
  // staggered across its row. Anything already revealed is left alone. Once
  // settled the inline pose is cleared so the stylesheet's hover lift works.
  function tossIn(M, items, columnsOf){
    items.forEach((item, i) => {
      if (item.dataset.tossed) return
      item.dataset.tossed = '1'
      const box = item.getBoundingClientRect()
      if (item.classList.contains('in-view') || (box.top < window.innerHeight && box.bottom > 0)) return
      // The cards' own CSS transitions (opacity, transform) would otherwise
      // restart underneath when the inline pose is handed back, and the card
      // would dip and fade in a second time after it landed.
      // Same for a CSS entrance of its own (the watch clips' fadeUp): its
      // filled end state outranks the inline opacity, so the card showed,
      // vanished when its turn came, and popped in a second time.
      item.style.transition = 'none'
      item.style.animation = 'none'
      item.classList.remove('reveal-scale', 'reveal')
      item.style.opacity = '0'
      M.inView(item, () => {
        const columns = Math.max(1, columnsOf ? columnsOf() : 1)
        // A lazy image that lands mid-entrance is a second pop of its own, so
        // wait for the card's pictures to be ready, but never more than 600ms.
        const images = Array.from(item.querySelectorAll('img')).map(img => img.decode().catch(() => {}))
        const ready = Promise.race([Promise.all(images), new Promise(r => setTimeout(r, 600))])
        ready.then(() => M.animate(item,
          { opacity: [0, 1], transform: [pose('0px', '60px', rand(-8, 8).toFixed(1), .8), REST] },
          { ...spring(.7, .35), delay: (i % columns) * .07 })
          .then(() => {
            item.style.transform = ''
            item.style.opacity = ''
            item.classList.add('in-view')
            void getComputedStyle(item).opacity
            item.style.transition = ''
          }))
      }, { amount: .2 })
    })
  }
  const columnCount = grid => () => getComputedStyle(grid).gridTemplateColumns.split(' ').length || 1

  features.push(M => {
    // Poster cards are built from shows.json, so they may arrive after Motion.
    const posters = document.getElementById('poster-archive-grid')
    if (posters) {
      const run = () => tossIn(M, Array.from(posters.querySelectorAll('.poster-archive-card')), columnCount(posters))
      run()
      new MutationObserver(run).observe(posters, { childList: true })
    }
    const clips = document.querySelector('.watch-clips-grid')
    if (clips) tossIn(M, Array.from(clips.querySelectorAll('.watch-clip')), columnCount(clips))
    const aside = document.querySelector('.contact-aside')
    if (aside) {
      // The aside fades in as one block; hand its blocks the entrance instead.
      const blocks = Array.from(aside.querySelectorAll('.contact-aside-block'))
      const box = aside.getBoundingClientRect()
      if (blocks.length && !(box.top < window.innerHeight && box.bottom > 0)) {
        aside.classList.remove('reveal')
        aside.classList.add('in-view')
        tossIn(M, blocks, () => getComputedStyle(aside).gridTemplateColumns.split(' ').length || 1)
      }
    }
  })

  // ---- Lean and squash (store tee, watch videos) ----
  // With a mouse the piece leans toward the cursor; under a thumb it gives a
  // little on press. Rotation only, on the element's own layer.
  features.push(M => {
    const targets = Array.from(document.querySelectorAll('.store-product-image, .watch-feature .video-embed-large, .watch-clip .video-embed'))
    targets.forEach(el => {
      // Their stylesheet transition on transform would chase every spring
      // frame and turn it to mush; the spring is the easing now.
      el.style.transitionProperty = 'box-shadow, opacity'
      M.press(el, () => {
        M.animate(el, { scale: .97 }, spring(.2, .3))
        return () => M.animate(el, { scale: 1 }, spring(.35, .5))
      })
      if (!finePointer.matches) return
      const strength = el.classList.contains('store-product-image') ? 14 : 6
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - .5
        const y = (e.clientY - r.top) / r.height - .5
        M.animate(el, { rotateY: x * strength, rotateX: -y * strength, transformPerspective: 900 }, { type: 'spring', stiffness: 300, damping: 25 })
      })
      el.addEventListener('pointerleave', () => {
        M.animate(el, { rotateY: 0, rotateX: 0 }, { type: 'spring', stiffness: 200, damping: 18 })
      })
    })
  })

  function start(){
    loadMotion().then(M => {
      features.forEach(feature => {
        try { feature(M) } catch (err) { console.error('[motion]', err) }
      })
    }).catch(err => console.error('[motion] not loaded', err))
  }
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
})()
