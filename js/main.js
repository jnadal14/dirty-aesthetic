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
    li.textContent=`${s.date} • ${s.city} • ${s.venue}`
    ul.appendChild(li)
  })
}).catch(()=>{
  const ul=document.getElementById('upcoming')
  if(!ul)return
  const li=document.createElement('li')
  li.textContent='TBA'
  ul.appendChild(li)
})
