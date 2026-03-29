// Service Worker za Maja Karanfil Bungali — offline podrška
// Verzija keša — promijeni ovo svaki put kad se uploaduje nova verzija index.html
const CACHE_NAME = 'kmk-bungali-v1.3.7';

// Fajlovi koji se keširaju pri instalaciji
const CACHE_FILES = [
  '/KMK-BUNGALI/',
  '/KMK-BUNGALI/index.html'
];

// Instalacija — kešira aplikaciju
self.addEventListener('install', event => {
  console.log('[SW] Installing v1.2.0...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app files');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => self.skipWaiting()) // Aktiviraj odmah bez čekanja
  );
});

// Aktivacija — briše stare keše
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME) // Obriši sve osim trenutnog
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim()) // Preuzmi kontrolu odmah
  );
});

// Fetch — network first, fallback na keš
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase, Booking.com i ostali API pozivi — uvijek network, nikad keš
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('booking.com') ||
    url.hostname.includes('allorigins') ||
    url.hostname.includes('codetabs') ||
    url.hostname.includes('thingproxy') ||
    url.hostname.includes('yacdn') ||
    url.hostname.includes('corsproxy') ||
    url.hostname.includes('overbridgenet')
  ) {
    return; // Pusti normalno, ne presreći
  }

  // Za aplikacijske fajlove — network first, keš fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Uspješan network odgovor — ažuriraj keš
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network nije dostupan — uzmi iz keša
        console.log('[SW] Network failed, serving from cache:', event.request.url);
        return caches.match(event.request)
          .then(cached => {
            if (cached) return cached;
            // Fallback na index.html za sve stranice
            return caches.match('/KMK-BUNGALI/index.html');
          });
      })
  );
});
