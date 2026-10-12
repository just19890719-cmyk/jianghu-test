/* 人在江湖殺 — 1012-K 整理版；核心檔案離線預載，其餘素材按需快取 */
const CACHE = 'jianghu-v15-art-integrated-20261013';
const CORE = ['./','index.html','config.js','font.js','assets.js','game.js','legal.js','manifest.json','icon-192.png','icon-512.png','v15_forest_day.png','v15_forest_night.png','v15_frame_win.png','v15_frame_lose.png','v15_coin.png','v15_ingot.png','v15_crystal.png','v15_flower.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('jianghu-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
 if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
 e.respondWith(fetch(e.request).then(r => {
   if (r.ok && r.type === 'basic') { const copy = r.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {})); }
   return r;
 }).catch(() => caches.match(e.request, {ignoreSearch:true})));
});
