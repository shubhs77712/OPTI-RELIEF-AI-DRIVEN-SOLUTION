/* ==========================================================================
   OptiRelief — Service Worker (SIH 26002 Compliant)
   --------------------------------------------------------------------------
   Offline resilience for field deployment:
     • Precache the app shell so the console boots with no connectivity.
     • Stale-while-revalidate for CDN vendor libraries.
     • Network-first with cache fallback for app shell and table API reads.
     • Background Sync trigger that tells the page to drain its Dexie outbox.
   ========================================================================== */

const VERSION = 'optirelief-v6-apple-clarity';
const SHELL_CACHE = VERSION + '-shell';
const VENDOR_CACHE = VERSION + '-vendor';
const DATA_CACHE = VERSION + '-data';

const SHELL_ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'js/i18n.js',
  'js/providers.js',
  'js/tracking.js',
  'js/rbac.js',
  'js/districts.js',
  'js/sih_compliance.js',
  'js/app.js',
  'js/ui.js',
  'js/store.js',
  'js/solver.js',
  'js/viz3d.js',
  'js/views/dashboard.js',
  'js/views/optimizer.js',
  'js/views/zonemap.js',
  'js/views/resources.js',
  'js/views/dispatch.js',
  'js/views/system.js',
  'manifest.webmanifest'
];

/* ------------------------------------------------------------- lifecycle */

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[sw] partial precache', err);
      }))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== VENDOR_CACHE && k !== DATA_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ----------------------------------------------------------------- fetch */

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 1. Table API reads — network first, fall back to the last good response.
  if (url.pathname.includes('/tables/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || new Response(
          JSON.stringify({ data: [], total: 0, offline: true }),
          { headers: { 'Content-Type': 'application/json' }, status: 200 }
        )))
    );
    return;
  }

  // 2. CDN vendor assets — stale-while-revalidate.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.open(VENDOR_CACHE).then((cache) =>
        cache.match(req).then((hit) => {
          const network = fetch(req)
            .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
            .catch(() => hit);
          return hit || network;
        })
      )
    );
    return;
  }

  // 3. App shell — Network-first with cache fallback (ensures latest changes load immediately)
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});

/* -------------------------------------------------------- background sync */

self.addEventListener('sync', (event) => {
  if (event.tag === 'optirelief-sync') {
    event.waitUntil(notifyClientsToSync());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'PING_SYNC') notifyClientsToSync();
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach((c) => c.postMessage({ type: 'RUN_SYNC' }));
}
