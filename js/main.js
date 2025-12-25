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

// Load shows
fetch('data/shows.json', { cache: 'no-store' }).then(r=>r.json()).then(data=>{
  const ul=document.getElementById('upcoming')
  if(!ul)return
  if(!data.upcoming || data.upcoming.length===0){
    const li=document.createElement('li')
    li.textContent='TBA'
    ul.appendChild(li)
    return
  }
  data.upcoming.slice(0,4).forEach(s=>{
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
    ul.appendChild(li)
  })
}).catch(()=>{
  const ul=document.getElementById('upcoming')
  if(!ul)return
  const li=document.createElement('li')
  li.textContent='TBA'
  ul.appendChild(li)
})
