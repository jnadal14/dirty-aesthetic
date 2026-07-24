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

  // Dynamically collapse nav when it overlaps the brand
  const header = document.querySelector('.site-header')
  const brand = document.querySelector('.brand-container')
  function checkNavFit() {
    header.classList.remove('nav-collapsed')
    nav.style.display = ''
    const brandRight = brand.getBoundingClientRect().right
    const navLeft = nav.getBoundingClientRect().left
    if (navLeft < brandRight + 12) {
      header.classList.add('nav-collapsed')
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

// Site-wide parallax scrolling (desktop, reduced-motion aware)
;(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Keep this list small and conservative. Section "inner" containers were
  // removed because their content drifts faster than the page scroll and
  // either escapes overflow:hidden boundaries (heading slipping under the
  // hero) or exposes the CSS-var inheritance bug to revealed children
  // (form/heading stutter). What's left is just the hero text and the
  // gentle whole-page drift on inner pages.
  const contentConfig = [
    { selector: '.hero-inner', speed: 0.08 },
    { selector: '.music-header', speed: 0.04 },
    { selector: '.page', speed: 0.03 }
  ]

  const backgroundConfig = [
    { selector: '.hero', cssVar: '--hero-bg-parallax', speed: 0.045 },
    { selector: '.shows-feature', cssVar: '--shows-bg-parallax', speed: 0.05 },
    { selector: '.ep-release', cssVar: '--ep-bg-parallax', speed: 0.04 }
  ]

  let enabled = false
  let ticking = false
  let contentTargets = []
  let backgroundTargets = []

  function mapTargets(config) {
    const targets = []
    for (let i = 0; i < config.length; i++) {
      const def = config[i]
      const nodes = document.querySelectorAll(def.selector)
      nodes.forEach(node => targets.push({ node, ...def }))
    }
    return targets
  }

  function resetParallax() {
    contentTargets.forEach(({ node }) => node.style.setProperty('--parallax-y', '0px'))
    backgroundTargets.forEach(({ node, cssVar }) => node.style.setProperty(cssVar, '0px'))
  }

  function updateParallax() {
    if (!enabled) {
      resetParallax()
      ticking = false
      return
    }

    const vh = window.innerHeight || document.documentElement.clientHeight

    // Always compute against actual position. The previous activeZone
    // shortcut snapped --parallax-y to 0 for off-screen elements and then
    // jumped to the full calculated offset (often ±20-50px) the instant
    // they re-entered the buffer, which read as a visible jolt.
    contentTargets.forEach(({ node, speed }) => {
      const rect = node.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const offset = (vh / 2 - center) * speed
      node.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`)
    })

    backgroundTargets.forEach(({ node, speed, cssVar }) => {
      const rect = node.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const offset = (vh / 2 - center) * speed
      node.style.setProperty(cssVar, `${offset.toFixed(2)}px`)
    })

    ticking = false
  }

  function scheduleUpdate() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(updateParallax)
  }

  function refreshState() {
    enabled = !reduceMotion.matches
    contentTargets = mapTargets(contentConfig)
    backgroundTargets = mapTargets(backgroundConfig)
    scheduleUpdate()
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true })
  window.addEventListener('resize', refreshState, { passive: true })
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', refreshState)
  }

  refreshState()
})()

// Homepage chapter navigation and section-to-section motion. This keeps the
// existing layouts intact, adding only focus, depth and a persistent index.
;(function homeScrollExperience(){
  const chapters = Array.from(document.querySelectorAll('[data-scroll-chapter]'))
  if (!chapters.length) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const spatialMotion = window.matchMedia('(min-width: 1081px) and (min-height: 680px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
  const cameraPaths = [
    { x:0, y:0, scale:1, rotate:0, origin:'center center' },
    { x:14, y:11, scale:.78, rotate:2.4, origin:'left bottom' },
    { x:-14, y:8, scale:.82, rotate:-2.2, origin:'right bottom' },
    { x:0, y:12, scale:.68, rotate:.4, origin:'center bottom' },
    { x:16, y:-2, scale:.84, rotate:1.8, origin:'left center' },
    { x:-15, y:10, scale:.76, rotate:-1.7, origin:'right bottom' },
    { x:0, y:14, scale:.7, rotate:.7, origin:'center bottom' }
  ]
  const nav = document.createElement('nav')
  nav.className = 'chapter-nav'
  nav.setAttribute('aria-label', 'Homepage sections')

  const links = chapters.map((section, index) => {
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
      const top = index === 0 ? 0 : section.getBoundingClientRect().top + window.scrollY
      if (window.__lenis) {
        window.__lenis.scrollTo(top, { duration: 1.35 })
      } else {
        window.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' })
      }
      window.history.replaceState(null, '', link.hash)
    })

    return link
  })

  document.body.appendChild(nav)
  document.body.classList.add('home-experience')

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
  const ease = value => value * value * (3 - 2 * value)
  let ticking = false
  let spatialEnabled = false

  function refreshSpatialState(){
    spatialEnabled = spatialMotion.matches
    document.body.classList.toggle('spatial-scroll-active', spatialEnabled)
    chapters.forEach((section, index) => {
      section.style.zIndex = spatialEnabled ? String(index + 1) : ''
    })
    scheduleChapterUpdate()
  }

  function updateChapters(){
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const scrollable = Math.max(1, document.documentElement.scrollHeight - viewportHeight)
    const pageProgress = clamp(window.scrollY / scrollable, 0, 1)
    nav.style.setProperty('--page-progress', pageProgress.toFixed(4))

    let activeIndex = 0
    const chapterAnchor = window.scrollY + viewportHeight * .45

    chapters.forEach((section, index) => {
      const rect = section.getBoundingClientRect()
      const viewportCenter = viewportHeight / 2
      const sectionCenter = rect.top + rect.height / 2
      const centerDistance = sectionCenter - viewportCenter
      const normalized = clamp(centerDistance / (viewportHeight * .9), -1, 1)
      if (section.offsetTop <= chapterAnchor) activeIndex = index

      if (!reduceMotion.matches) {
        if (spatialEnabled) {
          const path = cameraPaths[index] || cameraPaths[cameraPaths.length - 1]
          const flowTop = section.offsetTop - window.scrollY
          const nextSection = chapters[index + 1]
          const nextFlowTop = nextSection ? nextSection.offsetTop - window.scrollY : viewportHeight
          const entry = ease(clamp(1 - flowTop / viewportHeight, 0, 1))
          const exit = nextSection ? ease(clamp(1 - nextFlowTop / viewportHeight, 0, 1)) : 0
          const entryRemaining = 1 - entry
          const exitDirection = index % 2 === 0 ? -1 : 1
          const x = path.x * entryRemaining + exitDirection * 8 * exit
          const y = path.y * entryRemaining - 4.5 * exit
          const scale = 1 - (1 - path.scale) * entryRemaining - .13 * exit
          const rotate = path.rotate * entryRemaining + exitDirection * 1.35 * exit
          const blur = 4.5 * entryRemaining + 2.8 * exit
          const brightness = 1 - .22 * entryRemaining - .24 * exit
          const opacity = 1 - .34 * entryRemaining - .26 * exit
          const radius = 44 * entryRemaining + 34 * exit

          section.style.setProperty('--scene-x', `${x.toFixed(3)}vw`)
          section.style.setProperty('--scene-y', `${y.toFixed(3)}vh`)
          section.style.setProperty('--scene-scale', scale.toFixed(4))
          section.style.setProperty('--scene-rotate', `${rotate.toFixed(3)}deg`)
          section.style.setProperty('--scene-blur', `${blur.toFixed(2)}px`)
          section.style.setProperty('--scene-brightness', brightness.toFixed(3))
          section.style.setProperty('--scene-opacity', opacity.toFixed(3))
          section.style.setProperty('--scene-radius', `${radius.toFixed(2)}px`)
          section.style.setProperty('--scene-origin', path.origin)
        } else {
          const distance = Math.abs(normalized)
          const entryProgress = clamp(1 - ((rect.top - viewportHeight * .12) / (viewportHeight * .76)), 0, 1)
          section.style.setProperty('--chapter-drift', `${(normalized * 14).toFixed(2)}px`)
          section.style.setProperty('--chapter-cover-x', `${(normalized * -16).toFixed(2)}px`)
          section.style.setProperty('--chapter-info-x', `${(normalized * 16).toFixed(2)}px`)
          section.style.setProperty('--chapter-cover-rotate', `${(normalized * -.75).toFixed(3)}deg`)
          section.style.setProperty('--chapter-blur', `${(distance * 1.1).toFixed(2)}px`)
          section.style.setProperty('--chapter-opacity', `${(1 - distance * .12).toFixed(3)}`)
          section.style.setProperty('--chapter-wipe-y', `${(-72 * entryProgress).toFixed(2)}%`)
          section.style.setProperty('--chapter-wipe-opacity', `${(.72 * (1 - entryProgress)).toFixed(3)}`)
        }
      }
    })

    links.forEach((link, index) => {
      const active = index === activeIndex
      link.classList.toggle('is-active', active)
      if (active) link.setAttribute('aria-current', 'step')
      else link.removeAttribute('aria-current')
    })

    ticking = false
  }

  function scheduleChapterUpdate(){
    if (ticking) return
    ticking = true
    requestAnimationFrame(updateChapters)
  }

  window.addEventListener('scroll', scheduleChapterUpdate, { passive: true })
  window.addEventListener('resize', refreshSpatialState, { passive: true })
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', refreshSpatialState)
  if (spatialMotion.addEventListener) spatialMotion.addEventListener('change', refreshSpatialState)
  refreshSpatialState()
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
// Loads Lenis from CDN and turns it on for the whole document.
// Hooks all in-page anchor links to use lenis.scrollTo for buttery jumps.
// Disabled when prefers-reduced-motion is set.
;(function loadLenis(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const script = document.createElement('script')
  script.src = 'https://unpkg.com/lenis@1.1.20/dist/lenis.min.js'
  script.async = true
  script.onload = () => {
    if (typeof window.Lenis !== 'function') return

    const lenis = new window.Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false
    })

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
        e.preventDefault()
        lenis.scrollTo(target, { offset: 0, duration: 1.45 })
      })
    })

    bindCenteredSectionScrollLinks()
    bindIrrationalScrollLinks()
    window.__lenis = lenis
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

  const hoverSelector = 'a, button, .btn, .show-row, .show-row-poster, .release, .release-link, .gallery-item, .toggle-btn, input, textarea, label, .ep-stream-btn, .ep-release-cover, .store-product-image, .play-btn, .hamburger, .lightbox-nav, .lightbox-close'

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

  function observeReveal(scope){
    const root = scope || document
    root.querySelectorAll('.reveal,.reveal-fade,.reveal-scale').forEach(el => {
      if (!el.classList.contains('in-view')) observer.observe(el)
    })
  }

  observeReveal()
  window.__observeReveal = observeReveal
})()

// Music service toggle
const toggleButtons = document.querySelectorAll('.toggle-btn')
const releaseLinks = document.querySelectorAll('.release-link')

if (toggleButtons.length > 0 && releaseLinks.length > 0) {
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const service = btn.getAttribute('data-service')
      
      // Update active state
      toggleButtons.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      
      // Update all release links
      releaseLinks.forEach(link => {
        const url = link.getAttribute(`data-${service}`)
        if (url) {
          link.setAttribute('href', url)
        }
      })
    })
  })
}

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

// Load shows
const emptyShowsEditorialHtml = `<div class="show-row show-row-empty" role="status"><span class="show-row-venue">TBA</span></div>`

fetch('data/shows.json', { cache: 'no-store' }).then(r=>r.json()).then(data=>{
  const heroShows = document.getElementById('hero-shows')
  if(heroShows && data.upcoming && data.upcoming.length){
    heroShows.innerHTML = data.upcoming.map(s => {
      const parts = parseDateParts(s.date)
      const dateLabel = parts ? `${parts.month} ${parts.day}` : s.date
      const href = s.link || '#upcoming-section'
      const attrs = s.link ? ' target="_blank" rel="noopener"' : ''
      const label = s.ctaLabel || `${s.venue} ${dateLabel}`
      return `<a class="btn ghost" href="${href}"${attrs}>${label}</a>`
    }).join('')
  }

  const container=document.getElementById('upcoming')
  if(!container)return
  const editorial = container.classList.contains('shows-editorial')

  if(!data.upcoming || data.upcoming.length===0){
    if(editorial){
      container.classList.remove('shows-editorial--solo')
      container.innerHTML = emptyShowsEditorialHtml
    } else {
      const li=document.createElement('li')
      li.className='show-list-tba'
      li.textContent='TBA'
      container.appendChild(li)
    }
    return
  }

  if (editorial) {
    container.classList.toggle('shows-editorial--solo', data.upcoming.length === 1)
  }

  data.upcoming.forEach((s, i)=>{
    if(editorial){
      const parts = parseDateParts(s.date)
      const row = document.createElement('a')
      const solo = data.upcoming.length === 1 ? ' show-row--solo' : ''
      const featured = s.banner ? ' show-row--featured' : ''
      row.className = 'show-row reveal' + solo + featured
      row.style.setProperty('--reveal-delay', `${(i * 0.08).toFixed(2)}s`)
      if(s.link){
        row.href = s.link
        row.target = '_blank'
        row.rel = 'noopener'
      } else {
        row.removeAttribute('href')
      }
      const linkLabel = s.link ? (s.link.includes('cjsf') ? 'Stream Live' : 'Tickets') : ''
      const arrowHtml = s.link ? `<span class="show-row-arrow">${linkLabel} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>` : ''
      const lineupHtml = s.lineup ? `<span class="show-row-lineup">${s.lineupPrefix || 'w/'} ${s.lineup}</span>` : ''
      const title = s.title || s.venue
      const location = s.title
        ? [s.venue, s.city, s.time].filter(Boolean).join(' · ')
        : [s.city, s.time].filter(Boolean).join(' · ')
      const posterHtml = s.poster ? `<div class="show-row-poster" data-poster-src="${s.poster}"><img src="${s.poster}" alt="${title} poster" loading="lazy"></div>` : ''
      const bannerHtml = s.banner ? `<div class="show-row-banner" aria-hidden="true"><img src="${s.banner}" alt="" loading="lazy"></div>` : ''
      row.innerHTML = `
        ${bannerHtml}
        <div class="show-row-date">
          <span class="show-row-month">${parts ? parts.month : s.date}</span>
          <span class="show-row-day">${parts ? parts.dayOrd : ''}</span>
        </div>
        <div class="show-row-info">
          <span class="show-row-venue">${title} ${arrowHtml}</span>
          ${lineupHtml}
          <span class="show-row-city">${location}</span>
        </div>
        ${posterHtml}`
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
  if(container.classList.contains('shows-editorial')){
    container.classList.remove('shows-editorial--solo')
    container.innerHTML = emptyShowsEditorialHtml
  } else {
    const li=document.createElement('li')
    li.className='show-list-tba'
    li.textContent='TBA'
    container.appendChild(li)
  }
})

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
  let current = 0
  let srcs = []

  function show(idx){
    current = (idx + srcs.length) % srcs.length
    lbImg.src = srcs[current]
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
      lbImg.src = fullSrc
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

// EPK — lineup + gallery from data/epk-images.json (supports jpg/png sources)
;(function(){
  const galleryRoot = document.getElementById('epk-gallery')
  const lineupPhotos = document.querySelectorAll('[data-lineup]')
  if(!galleryRoot && !lineupPhotos.length) return

  const GALLERY_EAGER = 6
  const LAZY_ROOT_MARGIN = '500px 0px'
  const IMG_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

  function applyPicture(picture, image){
    if(!picture || !image) return
    const source = picture.querySelector('source[type="image/webp"]')
    const img = picture.querySelector('img')
    if(source) source.srcset = image.webp
    if(img) img.src = image.src
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
    }
    item.dataset.fullSrc = image.full
    if(image.fullWebp) item.dataset.fullWebp = image.fullWebp

    if(eager){
      item.innerHTML = `
        <picture>
          <source type="image/webp" srcset="${image.webp}">
          <img src="${image.src}" alt="Dirty Aesthetic" width="${image.width || ''}" height="${image.height || ''}" loading="eager" decoding="async"${index < 3 ? ' fetchpriority="high"' : ''}>
        </picture>`
    } else {
      item.innerHTML = `
        <picture>
          <source type="image/webp" data-srcset="${image.webp}">
          <img src="${IMG_PLACEHOLDER}" data-src="${image.src}" data-webp="${image.webp}" alt="Dirty Aesthetic" width="${image.width || ''}" height="${image.height || ''}" loading="lazy" decoding="async">
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

  function revealGallery(root){
    root.querySelectorAll('.gallery-item').forEach(el => el.classList.add('in-view'))
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
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' })
    observer.observe(root)
  }

  // Stagger the parallax reveal by visual ROW (vertical position), not DOM
  // order. With CSS multicol the DOM fills column 1 top-to-bottom first, so an
  // index-based delay animates the whole first column in before the rest.
  // Bucketing by offsetTop waves it in top-to-bottom across all columns.
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

  function initGallery(root){
    root.classList.add('is-ready')
    assignRowRevealOrder(root)
    root.querySelectorAll('.gallery-item:not(.gallery-item--lazy) img').forEach(img => {
      bindImageLoaded(img.closest('.gallery-item'), img)
    })
    observeLazyGalleryItems(root)
    watchGalleryReveal(root)
  }

  fetch('data/epk-images.json').then(r => {
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
