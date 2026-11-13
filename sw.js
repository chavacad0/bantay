/* Shield Quest service worker: lets the hosted app open offline. Never touches Google requests. */
const CACHE='shield-quest-0ea187ca14';
const ASSETS=['./','./index.html','./config.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return; // Google sign-in / Drive go straight to the network
  // stale-while-revalidate: open instantly from cache, refresh the cache in the background
  e.respondWith(caches.open(CACHE).then(async c=>{
    const key=req.mode==='navigate'?'./index.html':req;
    const hit=await c.match(key,{ignoreSearch:true});
    const net=fetch(req).then(r=>{if(r&&r.ok&&r.type==='basic')c.put(key,r.clone());return r}).catch(()=>null);
    return hit||(await net)||new Response('Offline',{status:503});
  }));
});
