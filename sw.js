/* Service worker: precaches the core files, network-first for pages, stale-while-revalidate for the rest. */
const V = 'freecell-v6';
const CORE = ["./", "manifest.webmanifest", "../freecell-game/css/game.min.css", "../freecell-game/js/game.min.js", "../freecell-game/img/favicon.svg", "../freecell-game/img/icon-192.png", "../freecell-game/img/bg-emerald.svg", "../freecell-game/img/bg-royal.svg", "../freecell-game/img/bg-wine.svg", "../freecell-game/img/bg-slate.svg"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.open(V).then(async cache => {
    const hit = await cache.match(r);
    const net = fetch(r).then(res => { if (res.ok) cache.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
