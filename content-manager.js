(function(){
const KEY='happyFroebelCMSv15';
const REMOTE_URL='data/content.json';
const defaults={
 hero:{eyebrow:'포항 북구 · 영아 중심 보육',title:'아이의 첫 시작이<br><strong>행복한 곳</strong>',subtitle:'그림책을 읽고, 만지고, 만들고, 맛보며<br>아이의 하루를 오감으로 채웁니다.',image:'assets/exterior.png'},
 greeting:{title:'아이의 작은 표현도<br><strong>소중히 듣겠습니다</strong>',lead:'아이들이 매일 웃으며 오고, 부모님이 안심하며 맡길 수 있는 어린이집을 만들고자 합니다.',body1:'영아기의 하루는 아주 작아 보이지만, 그 안에는 관계를 배우고 세상을 탐색하며 자신을 표현하는 수많은 성장이 담겨 있습니다. 행복한 어린이집은 아이마다 다른 발달 속도와 생활 리듬을 존중하고, 놀이 속에서 스스로 발견하고 시도할 수 있도록 기다려 줍니다.',body2:'교사와 가정이 아이의 하루를 함께 바라보며, 따뜻하고 안정적인 보육을 이어가겠습니다.',signature:'행복한 어린이집 원장 드림',image:'assets/book-room.jpg'},
 philosophy:[{num:'01',title:'존중받는 아이',desc:'아이의 감정과 표현, 개별적인 생활 리듬을 세심하게 살핍니다.'},{num:'02',title:'놀이로 배우는 아이',desc:'정답을 알려주기보다 충분히 탐색하고 스스로 발견하도록 돕습니다.'},{num:'03',title:'함께 자라는 공동체',desc:'교사와 부모가 신뢰로 연결되어 아이의 성장을 함께 지원합니다.'}],
 special:[{day:'MONDAY',title:'영어 놀이',desc:'노래와 율동, 그림책과 생활 표현을 통해 영어를 즐겁게 만납니다.',image:'assets/activity.jpg'},{day:'TUESDAY',title:'오감 활동',desc:'다양한 재료의 색과 향, 질감을 탐색하며 감각 경험을 넓힙니다.',image:'assets/food-play.jpg'},{day:'FRIDAY',title:'체육 활동',desc:'신체를 자유롭게 움직이고 균형감과 자신감을 기르는 즐거운 시간입니다.',image:'assets/playground.jpg'}],
 spaces:[{num:'01',title:'연령별 보육실',desc:'아이들이 편안하게 머물 수 있도록 연령별 발달에 맞는 놀잇감과 휴식 공간을 구성합니다.',image:'assets/classroom.jpg',wide:true},{num:'02',title:'해피북마루',desc:'아이가 스스로 책을 고르고 편안히 머물 수 있는 그림책 공간입니다.',image:'assets/book-room.jpg'},{num:'03',title:'전용 놀이공간',desc:'날씨와 계절을 느끼며 걷고 뛰고 움직이는 공간입니다.',image:'assets/playground.jpg'},{num:'04',title:'자연 탐색 공간',desc:'식물과 흙, 계절의 변화를 가까이에서 관찰합니다.',image:'assets/garden.jpg'},{num:'05',title:'오감활동 공간',desc:'다양한 감각 재료를 안전하게 탐색하는 공간입니다.',image:'assets/food-play.jpg'}],
 gallery:[]
};
function clone(v){return JSON.parse(JSON.stringify(v))}
function merge(a,b){if(Array.isArray(a))return Array.isArray(b)?b:a;if(a&&typeof a==='object'){const o={...a};Object.keys(b||{}).forEach(k=>o[k]=k in a?merge(a[k],b[k]):b[k]);return o}return b===undefined?a:b}
function local(){try{return merge(clone(defaults),JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('happyFroebelCMSv12')||'{}'))}catch(e){return clone(defaults)}}
let current=local();
async function loadRemote(){try{const r=await fetch(REMOTE_URL+'?v='+Date.now(),{cache:'no-store'});if(r.ok){current=merge(clone(defaults),await r.json());localStorage.setItem(KEY,JSON.stringify(current));return current}}catch(e){console.warn('원격 콘텐츠를 불러오지 못해 로컬 내용을 사용합니다.',e)}return current}
function get(){return clone(current)}
function setLocal(v){current=clone(v);localStorage.setItem(KEY,JSON.stringify(current));window.dispatchEvent(new Event('cms-content-updated'))}
function reset(){localStorage.removeItem(KEY);location.reload()}
function path(obj,p){return p.split('.').reduce((x,k)=>x&&x[k],obj)}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function image(ref){if(!ref)return '';if(/^https?:|^data:|^blob:/.test(ref))return ref;if(location.pathname.includes('/admin/'))return ref.startsWith('../')?ref:'../'+ref;return ref.replace(/^\.\.\//,'')}
async function render(){const c=current;
 document.querySelectorAll('[data-bind]').forEach(el=>{const v=path(c,el.dataset.bind);if(v!==undefined)el.textContent=v});
 document.querySelectorAll('[data-bind-html]').forEach(el=>{const v=path(c,el.dataset.bindHtml);if(v!==undefined)el.innerHTML=v});
 document.querySelectorAll('[data-image-key]').forEach(el=>{const v=path(c,el.dataset.imageKey);if(v)el.src=image(v)});
 const ph=document.getElementById('cms-philosophy-grid');if(ph)ph.innerHTML=c.philosophy.map(x=>`<article class="philosophy reveal on"><span>${esc(x.num)}</span><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></article>`).join('');
 const sp=document.getElementById('cms-special-grid');if(sp)sp.innerHTML=c.special.map(x=>`<article class="special-card reveal on"><img src="${image(x.image)}" alt="${esc(x.title)}"><div><span>${esc(x.day)}</span><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></div></article>`).join('');
 const spaces=document.getElementById('cms-spaces-grid');if(spaces)spaces.innerHTML=c.spaces.map(x=>`<article class="space reveal on"><img src="${image(x.image)}" alt="${esc(x.title)}"><div class="space-copy"><span>${esc(x.num)} · SPACE</span><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></div></article>`).join('');
 const gal=document.getElementById('cms-gallery-grid');if(gal)gal.innerHTML=c.gallery.map(x=>{const src=image(x.image);return `<button class="gallery-item reveal on" data-category="${esc(x.category)}" data-title="${esc(x.title)}" data-date="${esc(x.date)}" data-src="${src}"><img src="${src}" alt="${esc(x.title)}"><span><b>${esc(x.title)}</b><small>${esc(x.desc)}</small></span></button>`}).join('');
 window.dispatchEvent(new CustomEvent('cms-rendered'));
}
window.HappyCMS={KEY,defaults,get,set:setLocal,reset,render,loadRemote,image};
async function start(){await loadRemote();await render()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
window.addEventListener('cms-content-updated',render);
})();
