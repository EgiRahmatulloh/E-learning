const CACHE_NAME = 'elearning-pkbm-cache-v1';

// Daftar aset statis yang ingin di-cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icons/icon-192x192.png',
  '/pwa-icons/icon-512x512.png',
  // Kami tidak me-listing semua asset vite, karena vite menggunakan hash name.
  // Tapi service worker akan secara otomatis men-cache file statis saat diakses.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Hanya menghandle request GET
  if (event.request.method !== 'GET') return;
  
  // Jangan cache API calls
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Jika ada di cache, kembalikan dari cache
      if (response) {
        return response;
      }

      // Jika tidak ada di cache, fetch dari network
      return fetch(event.request).then((networkResponse) => {
        // Jangan cache jika tidak valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Simpan ke cache untuk akses berikutnya
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
