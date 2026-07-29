const CMS=window.HappyCMS;
const IMG=window.HappyImageStore;
let data=CMS.get();
const $=s=>document.querySelector(s);
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};

function compress(file){
 return new Promise((resolve,reject)=>{
  const r=new FileReader();
  r.onload=()=>{
   const img=new Image();
   img.onload=()=>{
    const max=1400,scale=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(img.width*scale));
    c.height=Math.max(1,Math.round(img.height*scale));
    c.getContext('2d',{alpha:false}).drawImage(img,0,0,c.width,c.height);
    c.toBlob(blob=>blob?resolve(blob):reject(new Error('이미지 압축 실패')),'image/webp',.78);
   };
   img.onerror=reject;img.src=r.result;
  };
  r.onerror=reject;r.readAsDataURL(file);
 });
}
function setPath(o,p,v){const a=p.split('.');let x=o;a.slice(0,-1).forEach(k=>x=x[k]);x[a.at(-1)]=v}
function getPath(o,p){return p.split('.').reduce((x,k)=>x&&x[k],o)}
async function preview(img,ref,fallback='../assets/book-room.jpg'){img.src=await IMG.url(ref)||fallback}

async function bindBasics(){
 heroEyebrow.value=data.hero.eyebrow;heroTitle.value=data.hero.title;heroSubtitle.value=data.hero.subtitle;
 greetingTitle.value=data.greeting.title;greetingLead.value=data.greeting.lead;greetingBody1.value=data.greeting.body1;greetingBody2.value=data.greeting.body2;greetingSignature.value=data.greeting.signature;
 for(const img of document.querySelectorAll('[data-preview]')) await preview(img,getPath(data,img.dataset.preview));
}
function imageField(current,idx,type){return `<label class="wide">사진<input type="file" accept="image/*" data-row-image="${type}" data-index="${idx}"><img class="preview" data-image-ref="${current||''}" src="../assets/book-room.jpg"></label>`}
function actions(type,i){return `<div class="item-actions"><button data-move="up" data-type="${type}" data-i="${i}">↑</button><button data-move="down" data-type="${type}" data-i="${i}">↓</button><button class="delete" data-delete="${type}" data-i="${i}">삭제</button></div>`}
function renderPhilosophy(){philosophyEditor.innerHTML=data.philosophy.map((x,i)=>`<div class="item-card"><div class="item-head"><strong>보육철학 ${i+1}</strong>${actions('philosophy',i)}</div><div class="item-fields"><label>번호<input data-type="philosophy" data-i="${i}" data-k="num" value="${x.num}"></label><label>제목<input data-type="philosophy" data-i="${i}" data-k="title" value="${x.title}"></label><label class="wide">설명<textarea data-type="philosophy" data-i="${i}" data-k="desc">${x.desc}</textarea></label></div></div>`).join('')}
function renderSpecial(){specialEditor.innerHTML=data.special.map((x,i)=>`<div class="item-card"><div class="item-head"><strong>${x.title||'특별활동'}</strong>${actions('special',i)}</div><div class="item-fields"><label>요일/표시<input data-type="special" data-i="${i}" data-k="day" value="${x.day}"></label><label>활동명<input data-type="special" data-i="${i}" data-k="title" value="${x.title}"></label><label class="wide">설명<textarea data-type="special" data-i="${i}" data-k="desc">${x.desc}</textarea></label>${imageField(x.image,i,'special')}</div></div>`).join('')}
function renderSpaces(){spacesEditor.innerHTML=data.spaces.map((x,i)=>`<div class="item-card"><div class="item-head"><strong>${x.title||'공간'}</strong>${actions('spaces',i)}</div><div class="item-fields"><label>번호<input data-type="spaces" data-i="${i}" data-k="num" value="${x.num}"></label><label>공간명<input data-type="spaces" data-i="${i}" data-k="title" value="${x.title}"></label><label class="wide">공간 설명<textarea data-type="spaces" data-i="${i}" data-k="desc">${x.desc}</textarea></label><label><input type="checkbox" data-type="spaces" data-i="${i}" data-k="wide" ${x.wide?'checked':''}> 크게 배치하기</label>${imageField(x.image,i,'spaces')}</div></div>`).join('')}
function renderGallery(){galleryEditor.innerHTML=data.gallery.map((x,i)=>`<div class="item-card"><div class="item-head"><strong>${x.title||'활동사진'}</strong>${actions('gallery',i)}</div><div class="item-fields"><label>분류<select data-type="gallery" data-i="${i}" data-k="category"><option value="food" ${x.category==='food'?'selected':''}>푸드오감</option><option value="forest" ${x.category==='forest'?'selected':''}>숲·자연</option><option value="event" ${x.category==='event'?'selected':''}>행사</option><option value="daily" ${x.category==='daily'?'selected':''}>일상놀이</option></select></label><label>날짜<input data-type="gallery" data-i="${i}" data-k="date" value="${x.date}"></label><label>활동명<input data-type="gallery" data-i="${i}" data-k="title" value="${x.title}"></label><label>짧은 설명<input data-type="gallery" data-i="${i}" data-k="desc" value="${x.desc}"></label>${imageField(x.image,i,'gallery')}</div></div>`).join('')}
async function refreshRowPreviews(){for(const img of document.querySelectorAll('[data-image-ref]')) await preview(img,img.dataset.imageRef)}
async function renderAll(){await bindBasics();renderPhilosophy();renderSpecial();renderSpaces();renderGallery();await refreshRowPreviews()}
function collectBasics(){data.hero.eyebrow=heroEyebrow.value;data.hero.title=heroTitle.value;data.hero.subtitle=heroSubtitle.value;data.greeting.title=greetingTitle.value;data.greeting.lead=greetingLead.value;data.greeting.body1=greetingBody1.value;data.greeting.body2=greetingBody2.value;data.greeting.signature=greetingSignature.value}

document.addEventListener('input',e=>{const t=e.target;if(t.dataset.type){data[t.dataset.type][+t.dataset.i][t.dataset.k]=t.type==='checkbox'?t.checked:t.value}});
document.addEventListener('change',async e=>{
 const t=e.target;
 try{
  if(t.dataset.imageInput&&t.files[0]){
   toast('사진을 압축하고 있어요…');
   const old=getPath(data,t.dataset.imageInput);const blob=await compress(t.files[0]);const ref=await IMG.put(blob);
   setPath(data,t.dataset.imageInput,ref);if(old&&old.startsWith('idb:'))await IMG.remove(old);
   await preview(document.querySelector(`[data-preview="${t.dataset.imageInput}"]`),ref);toast('사진 준비 완료. 저장을 눌러주세요.');
  }
  if(t.dataset.rowImage&&t.files[0]){
   toast('사진을 압축하고 있어요…');
   const item=data[t.dataset.rowImage][+t.dataset.index],old=item.image;const blob=await compress(t.files[0]);const ref=await IMG.put(blob);
   item.image=ref;if(old&&old.startsWith('idb:'))await IMG.remove(old);
   await preview(t.parentElement.querySelector('img'),ref);toast('사진 준비 완료. 저장을 눌러주세요.');
  }
 }catch(err){console.error(err);alert('사진 처리 중 오류가 생겼습니다. 다른 사진으로 다시 시도해 주세요.')}
});
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.tab){document.querySelectorAll('aside button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));$('#panel-'+b.dataset.tab).classList.add('active')}
 if(b.dataset.add){const type=b.dataset.add;if(type==='philosophy')data[type].push({num:String(data[type].length+1).padStart(2,'0'),title:'새 보육철학',desc:'설명을 입력하세요.'});if(type==='special')data[type].push({day:'WEEKLY',title:'새 특별활동',desc:'활동 설명을 입력하세요.',image:'../assets/activity.jpg'});if(type==='spaces')data[type].push({num:String(data[type].length+1).padStart(2,'0'),title:'새 공간',desc:'공간 설명을 입력하세요.',image:'../assets/classroom.jpg'});if(type==='gallery')data[type].unshift({category:'daily',title:'새 활동',desc:'활동 설명을 입력하세요.',date:new Date().toISOString().slice(0,7).replace('-','.'),image:'../assets/activity.jpg'});await renderAll()}
 if(b.dataset.delete&&confirm('이 항목을 삭제할까요?')){const item=data[b.dataset.delete][+b.dataset.i];if(item?.image?.startsWith('idb:'))await IMG.remove(item.image);data[b.dataset.delete].splice(+b.dataset.i,1);await renderAll()}
 if(b.dataset.move){const a=data[b.dataset.type],i=+b.dataset.i,j=b.dataset.move==='up'?i-1:i+1;if(j>=0&&j<a.length){[a[i],a[j]]=[a[j],a[i]];await renderAll()}}
});

async function migrateLegacyImages(){
 let changed=false;
 const refs=[['hero','image'],['program','image1'],['program','image2'],['program','image3'],['greeting','image']];
 for(const [a,b] of refs){const v=data[a][b];if(v?.startsWith('data:image')){data[a][b]=await IMG.put(await IMG.dataUrlToBlob(v));changed=true}}
 for(const type of ['special','spaces','gallery'])for(const item of data[type])if(item.image?.startsWith('data:image')){item.image=await IMG.put(await IMG.dataUrlToBlob(item.image));changed=true}
 if(changed){CMS.set(data);toast('기존 사진을 대용량 저장소로 옮겼어요.')}
}
function save(){collectBasics();try{CMS.set(data);toast('저장했습니다. 홈페이지에 반영됐어요.')}catch(e){console.error(e);alert('설정 저장 중 오류가 생겼습니다.') }}
saveTop.onclick=save;

downloadBackup.onclick=async()=>{
 collectBasics();toast('사진까지 백업파일에 담고 있어요…');
 const backup=JSON.parse(JSON.stringify(data));
 for(const p of [['hero','image'],['program','image1'],['program','image2'],['program','image3'],['greeting','image']])backup[p[0]][p[1]]=await IMG.toDataURL(backup[p[0]][p[1]]);
 for(const type of ['special','spaces','gallery'])for(const item of backup[type])item.image=await IMG.toDataURL(item.image);
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='happy-froebel-homepage-backup-with-images.json';a.click();URL.revokeObjectURL(a.href);toast('백업파일을 만들었어요.');
};
restoreFile.onchange=async()=>{try{data=JSON.parse(await restoreFile.files[0].text());await migrateLegacyImages();CMS.set(data);await renderAll();toast('백업을 복원했습니다.')}catch(e){console.error(e);alert('올바른 백업파일이 아닙니다.')}};
resetAll.onclick=()=>{if(confirm('모든 수정 내용을 지우고 처음 상태로 되돌릴까요?'))CMS.reset()};

(async()=>{await migrateLegacyImages();await renderAll()})();
