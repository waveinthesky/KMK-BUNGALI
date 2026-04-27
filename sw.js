// Service Worker za Maja Karanfil Bungali — offline podrška
// v2.4.2 — single-file deployment (GitHub Pages)
const CACHE_NAME = 'kmk-bungali-v2.4.2';

const CACHE_FILES = [
  './',
  './index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('booking.com') ||
    url.hostname.includes('allorigins') ||
    url.hostname.includes('thingproxy') ||
    url.hostname.includes('corsproxy') ||
    url.hostname.includes('overbridgenet') ||
    url.hostname.includes('workers.dev')
  ) { return; }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)
        .then(cached => cached || caches.match('./index.html'))
      )
  );
});
