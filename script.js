const io = new IntersectionObserver((entries)=>{
  entries.forEach((entry)=>{ if(entry.isIntersecting) entry.target.classList.add('visible'); });
},{threshold:.13});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

document.querySelectorAll('.placeholder-link').forEach(link=>{
  link.addEventListener('click',(e)=>{
    e.preventDefault();
    const label=link.dataset.label || '링크';
    const toast=document.querySelector('.toast');
    toast.textContent=`${label} 실제 주소를 알려주시면 바로 연결할게요.`;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2300);
  });
});

const btn=document.querySelector('.menu-btn');
const nav=document.querySelector('.main-nav');
btn?.addEventListener('click',()=>{
  const open=btn.getAttribute('aria-expanded')==='true';
  btn.setAttribute('aria-expanded',String(!open));
  nav.style.display=open?'none':'flex';
  if(!open){nav.style.position='absolute';nav.style.top='66px';nav.style.left='0';nav.style.right='0';nav.style.flexDirection='column';nav.style.padding='20px';nav.style.background='#fbf7f0';}
});


// Dynamic gallery filters and lightbox, compatible with CMS updates
function initGallery(){
 const filterButtons=[...document.querySelectorAll('.filter-btn')];
 const items=()=>[...document.querySelectorAll('.gallery-item')];
 filterButtons.forEach(btn=>{btn.onclick=()=>{filterButtons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;items().forEach(item=>item.classList.toggle('is-hidden',f!=='all'&&item.dataset.category!==f));}});
 const lightbox=document.querySelector('.lightbox'); if(!lightbox)return;
 const img=lightbox.querySelector('img'), title=lightbox.querySelector('b'), date=lightbox.querySelector('span'); let current=0;
 const visible=()=>items().filter(x=>!x.classList.contains('is-hidden'));
 const show=item=>{img.src=item.dataset.src;img.alt=item.dataset.title;title.textContent=item.dataset.title;date.textContent=item.dataset.date;lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';current=visible().indexOf(item)};
 items().forEach(item=>item.onclick=()=>show(item));
 const close=()=>{lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');document.body.style.overflow=''};
 lightbox.querySelector('.lightbox-close').onclick=close;
 lightbox.onclick=e=>{if(e.target===lightbox)close()};
 lightbox.querySelector('.lightbox-prev').onclick=()=>{const a=visible();if(!a.length)return;current=(current-1+a.length)%a.length;show(a[current])};
 lightbox.querySelector('.lightbox-next').onclick=()=>{const a=visible();if(!a.length)return;current=(current+1)%a.length;show(a[current])};
}
document.addEventListener('DOMContentLoaded',initGallery);
window.addEventListener('cms-rendered',initGallery);
document.addEventListener('keydown',e=>{const l=document.querySelector('.lightbox');if(!l?.classList.contains('open'))return;if(e.key==='Escape')l.querySelector('.lightbox-close').click();if(e.key==='ArrowRight')l.querySelector('.lightbox-next').click();if(e.key==='ArrowLeft')l.querySelector('.lightbox-prev').click();});
