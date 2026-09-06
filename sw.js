const CACHE_NAME = 'oakberry-flujo-caja-v1';
const SHELL_FILES = ['./index.html', './carga.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation & data (Supabase, CDNs) so figures are always fresh;
// fall back to cache only when offline. Cache-first for the shell files themselves.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isShellFile = url.origin === self.location.origin;

  if (isShellFile) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  } else {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});
