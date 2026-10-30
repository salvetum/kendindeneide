/* eslint-disable */
/**
 * KendinDeneIDE Service Worker
 * - Shell dosyaları (index.html, CSS, JS) install sırasında cache'lenecektir.
 * - Fetch istekleri cache-first stratejisiyle karşılanır.
 * - Varsayılan olarak tüm sayfa işlemleri SW üzerinden geçmez (scope: ./).
 */

const CACHE_NAME = 'kendindeneide-v1';
const SHELL_ASSETS = ['./', './index.html', './manifest.json', './favicon.ico'];

// Install: shell varlıklarını önceden cache'le.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activate: eski cache'leri temizle.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch: cache-first, ağda yoksa cache'de, yoksa ağda.
self.addEventListener('fetch', (event) => {
  // Sadece GET istekleri ve aynı-origin istekleri.
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Geçerli bir yanıt ise cache'e ekle (runtime caching).
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    }),
  );
});
