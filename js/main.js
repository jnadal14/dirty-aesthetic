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
fetch('data/shows.json', { cache: 'no-store' }).then(r=>r.json()).then(data=>{
  const container=document.getElementById('upcoming')
  if(!container)return
  const editorial = container.classList.contains('shows-editorial')

  if(!data.upcoming || data.upcoming.length===0){
    if(editorial){
      container.innerHTML='<div class="show-row"><span class="show-row-venue" style="width:100%;text-align:center">TBA</span></div>'
    } else {
      const li=document.createElement('li')
      li.textContent='TBA'
      container.appendChild(li)
    }
    return
  }

  data.upcoming.slice(0,4).forEach((s, i)=>{
    if(editorial){
      const parts = parseDateParts(s.date)
      const row = document.createElement('a')
      row.className = 'show-row'
      row.style.animationDelay = `${i * .12}s`
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
          <span class="show-row-venue">${s.venue}</span>
          ${lineupHtml}
          <span class="show-row-city">${s.city}</span>
        </div>
        ${posterHtml}
        ${arrowHtml}`
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
}).catch(()=>{
  const container=document.getElementById('upcoming')
  if(!container)return
  if(container.classList.contains('shows-editorial')){
    container.innerHTML='<div class="show-row"><span class="show-row-venue" style="width:100%;text-align:center">TBA</span></div>'
  } else {
    const li=document.createElement('li')
    li.textContent='TBA'
    container.appendChild(li)
  }
})

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
