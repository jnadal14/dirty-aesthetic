// Set active navigation
const currentPage = window.location.pathname.split('/').pop() || 'index.html'
const navLinks = document.querySelectorAll('.nav a')
navLinks.forEach(link => {
  const linkHref = link.getAttribute('href')
  if (linkHref === currentPage || (currentPage === '' && linkHref === 'index.html')) {
    link.classList.add('active')
  }
})

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
    li.innerHTML=`
      <span class="show-date">${s.date}</span>
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
