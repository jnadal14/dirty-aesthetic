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

  const contentConfig = [
    { selector: '.hero-inner', speed: 0.08 },
    { selector: '.shows-feature-inner', speed: 0.06 },
    { selector: '.ep-release-content', speed: 0.05 },
    { selector: '.home-contact-inner', speed: 0.04 },
    { selector: '.watch-hero', speed: 0.05 },
    { selector: '.music-header', speed: 0.04 },
    { selector: '.page', speed: 0.03 },
    { selector: '.epk-intro-content', speed: 0.06 },
    { selector: '.epk-intro-photo', speed: 0.09 }
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
    const activeZone = 180

    contentTargets.forEach(({ node, speed }) => {
      const rect = node.getBoundingClientRect()
      if (rect.bottom < -activeZone || rect.top > vh + activeZone) {
        node.style.setProperty('--parallax-y', '0px')
        return
      }
      const center = rect.top + rect.height / 2
      const offset = (vh / 2 - center) * speed
      node.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`)
    })

    backgroundTargets.forEach(({ node, speed, cssVar }) => {
      const rect = node.getBoundingClientRect()
      if (rect.bottom < -activeZone || rect.top > vh + activeZone) {
        node.style.setProperty(cssVar, '0px')
        return
      }
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
      if (!href || href.length <= 1) return
      link.addEventListener('click', (e) => {
        const target = document.querySelector(href)
        if (!target) return
        e.preventDefault()
        lenis.scrollTo(target, { offset: 0, duration: 1.45 })
      })
    })

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

  const hoverSelector = 'a, button, .btn, .show-row, .show-row-poster, .release, .release-link, .gallery-item, .toggle-btn, input, textarea, label, .ep-stream-btn, .play-btn, .hamburger, .lightbox-nav, .lightbox-close'

  document.addEventListener('mouseover', (e) => {
    const isHover = !!e.target.closest(hoverSelector)
    dot.classList.toggle('hover', isHover)
  })
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
  const container=document.getElementById('upcoming')
  if(!container)return
  const editorial = container.classList.contains('shows-editorial')

  if(!data.upcoming || data.upcoming.length===0){
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

  data.upcoming.forEach((s, i)=>{
    if(editorial){
      const parts = parseDateParts(s.date)
      const row = document.createElement('a')
      row.className = 'show-row reveal'
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
      const lineupHtml = s.lineup ? `<span class="show-row-lineup">w/ ${s.lineup}</span>` : ''
      const posterHtml = s.poster ? `<div class="show-row-poster" data-poster-src="${s.poster}"><img src="${s.poster}" alt="${s.venue} poster" loading="lazy"></div>` : ''
      row.innerHTML = `
        <div class="show-row-date">
          <span class="show-row-month">${parts ? parts.month : s.date}</span>
          <span class="show-row-day">${parts ? parts.dayOrd : ''}</span>
        </div>
        <div class="show-row-info">
          <span class="show-row-venue">${s.venue} ${arrowHtml}</span>
          ${lineupHtml}
          <span class="show-row-city">${s.city}</span>
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
  const items = document.querySelectorAll('.gallery-item')
  if(items.length){
    srcs = Array.from(items).map(el => el.querySelector('img').src)
    items.forEach((item, i) => {
      item.addEventListener('click', () => {
        show(i)
        overlay.classList.add('active')
        document.body.style.overflow = 'hidden'
      })
    })
  }
})()
