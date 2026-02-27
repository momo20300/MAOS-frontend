const CACHE_NAME = 'maos-v1';
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
self.addEventListener('fetch', (event) => {
  // Network-first strategy (real-time data must be fresh)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
