(function(){
  const DB_NAME='happyFroebelImages';
  const DB_VERSION=1;
  const STORE='images';
  const urlCache=new Map();

  function openDB(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }

  async function put(blob,key){
    const db=await openDB();
    const finalKey=key||('img_'+Date.now()+'_'+Math.random().toString(36).slice(2));
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(blob,finalKey);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
    });
    if(urlCache.has(finalKey)){URL.revokeObjectURL(urlCache.get(finalKey));urlCache.delete(finalKey)}
    return 'idb:'+finalKey;
  }

  async function get(ref){
    if(!ref||!String(ref).startsWith('idb:')) return null;
    const key=String(ref).slice(4);
    const db=await openDB();
    return await new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readonly').objectStore(STORE).get(key);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }

  async function url(ref){
    if(!ref) return '';
    if(!String(ref).startsWith('idb:')) return ref;
    const key=String(ref).slice(4);
    if(urlCache.has(key)) return urlCache.get(key);
    const blob=await get(ref);
    if(!blob) return '';
    const objectUrl=URL.createObjectURL(blob);
    urlCache.set(key,objectUrl);
    return objectUrl;
  }

  async function remove(ref){
    if(!ref||!String(ref).startsWith('idb:')) return;
    const key=String(ref).slice(4);
    const db=await openDB();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
    });
    if(urlCache.has(key)){URL.revokeObjectURL(urlCache.get(key));urlCache.delete(key)}
  }

  async function dataUrlToBlob(dataUrl){
    const r=await fetch(dataUrl);return await r.blob();
  }

  async function toDataURL(ref){
    if(!ref) return '';
    if(String(ref).startsWith('data:')) return ref;
    if(!String(ref).startsWith('idb:')) return ref;
    const blob=await get(ref);
    if(!blob) return '';
    return await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=reject;
      reader.readAsDataURL(blob);
    });
  }

  window.HappyImageStore={put,get,url,remove,dataUrlToBlob,toDataURL};
})();
