/* Mein Rezeptbuch · Landingpage — Service Worker (Offline + Installierbarkeit)
   Cache-Name als Versionsstempel: bei jeder Auslieferung +1.
   HTML = Network-First (frische Seite, sonst Cache), Assets = Cache-First. */
const CACHE = 'rezeptbuch-page-v10';
const ASSETS = [
  './', 'index.html', 'impressum.html', 'effects.js', 'manifest.webmanifest',
  'assets/mycel-bg.js', 'vendor/three.module.min.js',
  'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'assets/book-emblem.png', 'assets/demo-poster.jpg',
  /* demo.webm/.mp4 bewusst NICHT precachen (~23 MB) — laden bei Klick in den Laufzeit-Cache */
  'img/dumplings.jpg', 'img/casserole.jpg', 'img/soup.jpg', 'img/pizzatoast.jpg',
  'img/cocktail.jpg', 'img/smoothie.jpg', 'img/ratatouille.jpg',
  'img/zine-gyoza.jpg', 'img/zine-wuerzfleisch.jpg', 'img/zine-ratatouille.jpg', 'img/zine-bolognese.jpg',
  'img/ui-folders.jpg', 'img/ui-planner.jpg', 'img/ui-edit.jpg', 'img/ui-settings.jpg',
  'img/theme-spektral.jpg', 'img/theme-atelier.jpg', 'img/theme-neon.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isNavigation(req) {
  return req.mode === 'navigate' ||
    (req.method === 'GET' && (req.headers.get('accept') || '').includes('text/html'));
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  if (isNavigation(e.request)) {
    e.respondWith(
      fetch(e.request).then(resp => {
        try { const copy = resp.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); } catch (_) {}
        return resp;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      try { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } catch (_) {}
      return resp;
    }).catch(() => caches.match('index.html')))
  );
});
