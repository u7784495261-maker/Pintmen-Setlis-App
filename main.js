import './style.css';
let seed=null;

const KEY='pintmen-songbook-v1';
const ADMIN_KEY='pintmen-admin';
let state=load();
let admin=localStorage.getItem(ADMIN_KEY)==='1';
let route={name:'home'};
let search='';
let gig={setlistId:null,index:0};
let wakeLock=null;

function normalize(x){const y=structuredClone(x); y.setlists=(y.setlists||[]).map(l=>({...l,songIds:Array.isArray(l.songIds)?l.songIds:(l.song_ids||[])})); y.songs=(y.songs||[]).map(s=>({...s,id:String(s.id)})); y.setlists.forEach(l=>l.songIds=l.songIds.map(String)); return y}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)); if(x?.songs?.length&&x?.setlists) return normalize(x)}catch{} return null}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function id(){return crypto.randomUUID?.()||Math.random().toString(36).slice(2)}
function esc(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function song(id){return state.songs.find(s=>s.id===id)}
function setlist(id){return state.setlists.find(s=>s.id===id)}
function isAdmin(){return admin}
function toggleAdmin(){admin=!admin;localStorage.setItem(ADMIN_KEY,admin?'1':'0');render();toast(admin?'Edit mode on':'Edit mode off')}
function toast(msg){const x=document.createElement('div');x.className='toast';x.textContent=msg;document.body.appendChild(x);setTimeout(()=>x.remove(),2200)}
function nav(){render()}
function home(){route={name:'home'};nav()}
function openSetlist(id){route={name:'setlist',id};nav()}
function openSong(id,from){route={name:'song',id,from};nav()}
function render(){document.body.className=route.name==='gig'?'gig':'';const app=document.querySelector('#app');app.innerHTML=`<div class="shell"><header class="topbar"><div class="brand"><img src="./pintmen.svg"><div><strong>The Pintmen</strong><small>Songbook</small></div></div><button class="edit-toggle ${isAdmin()?'on':''}" id="toggle-admin">${isAdmin()?'Done':'Edit'}</button>${route.name!=='home'?`<button class="back" id="back">← Back</button>`:''}</header>${view()}</div>`;bind();}
function view(){
 if(route.name==='song') return songView();
 if(route.name==='setlist') return setlistView();
 if(route.name==='gig') return gigView();
 return homeView();
}
function homeView(){const lists=state.setlists||[];return `<main class="content"><section class="hero"><h1>Songbook</h1><p>Setlists and lyrics for The Pintmen.</p></section><div class="tabs"><button class="tab active" data-tab="sets">Setlists</button><button class="tab" data-tab="songs">All Songs</button>${isAdmin()?'<button class="tab" data-tab="admin">Admin</button>':''}</div><section id="home-panel">${setPanel(lists)}</section></main>`}
function setPanel(lists){return `<div class="row" style="margin-bottom:12px"><div class="grow"><span class="pill">${lists.length} setlist${lists.length===1?'':'s'}</span></div>${isAdmin()?'<button class="btn primary" id="new-set">+ Setlist</button>':''}</div><div class="list">${lists.map((x,i)=>`<button class="card row" data-open-set="${esc(x.id)}" style="text-align:left"><div class="num">${i+1}</div><div class="grow"><div class="song-title">${esc(x.name)}</div><div class="song-sub">${x.songIds.length} songs</div></div><span>›</span></button>`).join('')}</div>`}
function songPanel(){const q=search.toLowerCase();const songs=state.songs.filter(s=>s.title.toLowerCase().includes(q)).sort((a,b)=>a.title.localeCompare(b.title));return `<input class="search" id="song-search" value="${esc(search)}" placeholder="Search songs…"><div class="list">${songs.map((s,i)=>`<button class="card song-card" data-open-song="${s.id}" style="text-align:left"><div class="num">♪</div><div class="grow"><div class="song-title">${esc(s.title)}</div><div class="song-sub">${state.setlists.filter(l=>l.songIds.includes(s.id)).length} setlist${state.setlists.filter(l=>l.songIds.includes(s.id)).length===1?'':'s'}</div></div><span>›</span></button>`).join('')}</div>`}
function setlistView(){const l=setlist(route.id);if(!l)return homeView();return `<main class="content"><section class="hero"><div class="row"><div class="grow"><h1>${esc(l.name)}</h1><p>${l.songIds.length} songs</p></div>${isAdmin()?`<button class="iconbtn" id="edit-set">✎</button>`:''}</div></section><div class="row" style="margin-bottom:12px"><button class="btn primary grow" id="start-gig">▶ Gig Mode</button>${isAdmin()?'<button class="btn" id="add-song">+ Song</button>':''}</div><div class="list">${l.songIds.map((sid,i)=>{const s=song(sid);return s?`<div class="card song-card drag" draggable="${isAdmin()}" data-drag="${i}"><div class="num">${i+1}</div><button class="grow" data-open-song="${s.id}" style="background:none;border:0;color:inherit;text-align:left"><div class="song-title">${esc(s.title)}</div></button>${isAdmin()?`<button class="iconbtn" data-remove="${s.id}">×</button>`:''}</div>`:''}).join('')}</div></main>`}
function songView(){const s=song(route.id);if(!s)return homeView();return `<main class="content"><div class="lyrics-head"><div class="grow"><h1>${esc(s.title)}</h1><div class="muted small">${esc(route.from?setlist(route.from)?.name||'':'')}</div></div>${isAdmin()?'<button class="iconbtn" id="edit-song">✎</button>':''}</div><div class="row" style="margin-bottom:12px">${route.from?`<button class="btn primary grow" id="song-gig">▶ Start here</button>`:''}<button class="btn" id="text-plus">A+</button><button class="btn" id="text-minus">A−</button></div><article class="lyrics" id="lyrics">${esc(s.lyrics)}</article></main>`}
function gigView(){const l=setlist(gig.setlistId);const sid=l?.songIds[gig.index];const s=song(sid);if(!l||!s)return homeView();return `<main class="content"><div class="row"><div class="grow"><div class="muted small">${esc(l.name)}</div><h1 style="margin:4px 0 0">${esc(s.title)}</h1></div><button class="iconbtn" id="exit-gig">×</button></div><div class="progress">${gig.index+1} of ${l.songIds.length}</div><article class="lyrics" id="lyrics">${esc(s.lyrics)}</article></main><div class="gig-controls"><button class="btn" id="prev">← Prev</button><button class="btn" id="scroll">↕ Scroll</button><button class="btn primary" id="next">Next →</button></div>`}
function bind(){
 document.querySelector('#toggle-admin')?.addEventListener('click',toggleAdmin);
 document.querySelector('#back')?.addEventListener('click',()=>{if(route.name==='song'&&route.from)openSetlist(route.from);else home()});
 document.querySelectorAll('[data-open-set]').forEach(b=>b.onclick=()=>openSetlist(b.dataset.openSet));
 document.querySelectorAll('[data-open-song]').forEach(b=>b.onclick=()=>openSong(b.dataset.openSong,route.name==='setlist'?route.id:null));
 document.querySelector('[data-tab="songs"]')?.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelector('[data-tab="songs"]').classList.add('active');document.querySelector('#home-panel').innerHTML=songPanel();bind();});
 document.querySelector('[data-tab="sets"]')?.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelector('[data-tab="sets"]').classList.add('active');document.querySelector('#home-panel').innerHTML=setPanel(state.setlists);bind();});
 document.querySelector('[data-tab="admin"]')?.addEventListener('click',adminPanel);
 document.querySelector('#song-search')?.addEventListener('input',e=>{search=e.target.value;document.querySelector('#home-panel').innerHTML=songPanel();bind()});
 document.querySelector('#new-set')?.addEventListener('click',()=>setModal());
 document.querySelector('#edit-set')?.addEventListener('click',()=>setModal(setlist(route.id)));
 document.querySelector('#add-song')?.addEventListener('click',()=>addSongModal());
 document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const l=setlist(route.id);l.songIds=l.songIds.filter(x=>x!==b.dataset.remove);save();render()});
 document.querySelector('#start-gig')?.addEventListener('click',()=>startGig(route.id,0));
 document.querySelector('#song-gig')?.addEventListener('click',()=>startGig(route.from, setlist(route.from).songIds.indexOf(route.id)));
 document.querySelector('#edit-song')?.addEventListener('click',()=>songModal(song(route.id)));
 document.querySelector('#text-plus')?.addEventListener('click',()=>scaleLyrics(1.1)); document.querySelector('#text-minus')?.addEventListener('click',()=>scaleLyrics(.9));
 document.querySelector('#exit-gig')?.addEventListener('click',()=>{releaseWake();route={name:'setlist',id:gig.setlistId};render()});
 document.querySelector('#prev')?.addEventListener('click',()=>moveGig(-1)); document.querySelector('#next')?.addEventListener('click',()=>moveGig(1)); document.querySelector('#scroll')?.addEventListener('click',autoScroll);
 if(route.name==='setlist'&&isAdmin()) dragBind();
 if(route.name==='gig') swipeBind();
}
function adminPanel(){const panel=document.querySelector('#home-panel');panel.innerHTML=`<div class="card admin"><h3>Edit mode</h3><p class="muted">Changes you make here are saved on this device only. Other phones are not changed until you give them the updated songbook.</p><div class="row"><button class="btn" id="export">Export JSON</button><button class="btn" id="import">Import JSON</button><button class="btn" id="reset">Reset to original</button></div><p class="small muted" style="margin-bottom:0">The original <strong>The Pintmen Reloaded</strong> setlist stays in the app. Use new setlists for different gigs.</p></div>`;document.querySelector('#export').onclick=()=>download('pintmen-songbook.json',JSON.stringify(state,null,2),'application/json');document.querySelector('#reset').onclick=()=>{if(confirm('Reset all local changes?')){state=normalize(seed);save();render()}};document.querySelector('#import').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{const f=i.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x.songs||!x.setlists)throw Error();state=normalize(x);save();render();toast('Imported')}catch{toast('Invalid songbook JSON')}};i.click()}}
function setModal(existing){const m=modal(`<h2>${existing?'Edit':'New'} setlist</h2><div class="field"><label>Name</label><input id="m-name" value="${esc(existing?.name||'')}" placeholder="e.g. Wedding Set"></div><div class="row"><button class="btn" id="m-cancel">Cancel</button><button class="btn primary" id="m-save">Save</button></div>`);m.querySelector('#m-cancel').onclick=()=>m.remove();m.querySelector('#m-save').onclick=()=>{const name=m.querySelector('#m-name').value.trim();if(!name)return;if(existing)existing.name=name;else state.setlists.push({id:id(),name,songIds:[]});save();m.remove();render()}}
function addSongModal(){const l=setlist(route.id);const choices=state.songs.filter(s=>!l.songIds.includes(s.id));const m=modal(`<h2>Add songs</h2><input class="search" id="m-q" placeholder="Search…"><div id="choices" class="list">${choices.map(s=>`<label class="card row"><input type="checkbox" value="${s.id}"><span>${esc(s.title)}</span></label>`).join('')}</div><div class="row" style="margin-top:12px"><button class="btn" id="m-cancel">Cancel</button><button class="btn primary" id="m-save">Add selected</button></div>`);m.querySelector('#m-cancel').onclick=()=>m.remove();m.querySelector('#m-save').onclick=()=>{m.querySelectorAll('input[type=checkbox]:checked').forEach(x=>l.songIds.push(x.value));save();m.remove();render()};m.querySelector('#m-q').oninput=e=>{const q=e.target.value.toLowerCase();m.querySelectorAll('#choices label').forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?'flex':'none')}}
function songModal(existing){const m=modal(`<h2>Edit song</h2><div class="field"><label>Title</label><input id="m-title" value="${esc(existing.title)}"></div><div class="field"><label>Lyrics</label><textarea id="m-lyrics">${esc(existing.lyrics)}</textarea></div><div class="row"><button class="btn" id="m-cancel">Cancel</button><button class="btn primary" id="m-save">Save</button></div>`);m.querySelector('#m-cancel').onclick=()=>m.remove();m.querySelector('#m-save').onclick=()=>{existing.title=m.querySelector('#m-title').value.trim()||existing.title;existing.lyrics=m.querySelector('#m-lyrics').value;save();m.remove();render()}}
function modal(html){const x=document.createElement('div');x.className='modal';x.innerHTML=`<div class="modal-inner">${html}</div>`;document.body.appendChild(x);return x}
function startGig(listId,index){gig={setlistId:listId,index};route={name:'gig'};document.body.classList.add('gig');render();requestWake()}
function moveGig(d){const l=setlist(gig.setlistId);gig.index=Math.max(0,Math.min(l.songIds.length-1,gig.index+d));render()}
function swipeBind(){let sx=0;const a=document.querySelector('#lyrics');a?.addEventListener('touchstart',e=>sx=e.changedTouches[0].screenX,{passive:true});a?.addEventListener('touchend',e=>{const dx=e.changedTouches[0].screenX-sx;if(Math.abs(dx)>55)moveGig(dx<0?1:-1)},{passive:true})}
function scaleLyrics(f){const el=document.querySelector('#lyrics');const n=parseFloat(getComputedStyle(el).fontSize)*f;el.style.fontSize=Math.max(14,Math.min(42,n))+'px'}
let scrollTimer=null;function autoScroll(){const el=document.querySelector('#lyrics');if(scrollTimer){clearInterval(scrollTimer);scrollTimer=null;toast('Auto-scroll off');return}toast('Auto-scroll on');scrollTimer=setInterval(()=>window.scrollBy(0,1),70)}
async function requestWake(){try{if('wakeLock' in navigator)wakeLock=await navigator.wakeLock.request('screen')}catch{toast('Screen wake lock unavailable in this browser')}}function releaseWake(){wakeLock?.release?.();wakeLock=null;if(scrollTimer){clearInterval(scrollTimer);scrollTimer=null}}
document.addEventListener('visibilitychange',()=>{if(route.name==='gig'&&document.visibilityState==='visible')requestWake()});
function dragBind(){let from=null;document.querySelectorAll('[data-drag]').forEach(el=>{el.ondragstart=()=>from=+el.dataset.drag;el.ondragover=e=>{e.preventDefault();el.classList.add('drop')};el.ondragleave=()=>el.classList.remove('drop');el.ondrop=e=>{e.preventDefault();el.classList.remove('drop');const to=+el.dataset.drag;const l=setlist(route.id);const [x]=l.songIds.splice(from,1);l.songIds.splice(to,0,x);save();render()}})}
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function init(){
  state=load();
  if(!state){
    try{const r=await fetch('./seed.json',{cache:'no-store'}); if(!r.ok) throw Error(); seed=await r.json(); state=normalize(seed); save();}
    catch{document.querySelector('#app').innerHTML='<div style="padding:24px;font-family:system-ui"><h1>Songbook couldn’t load</h1><p>Refresh the page and try again.</p></div>'; return}
  }
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  render();
}
init();
