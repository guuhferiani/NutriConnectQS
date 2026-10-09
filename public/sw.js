const CACHE_NAME = 'nutriconnect-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/leaf.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// Instalação do Service Worker & Cache de recursos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições com estratégia Stale-While-Revalidate e Fallback Offline
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Não interceptar requisições que não sejam GET
  if (request.method !== 'GET') {
    return;
  }

  // Não interceptar requisições de API de terceiros ou chamadas de backend que precisam de dados vivos
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.hostname.includes('neon.tech') || url.hostname.includes('googleapis.com')) {
    return;
  }

  // Para navegações de página (SPA): Network-First com fallback para cache/index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Para assets estáticos (JS, CSS, imagens, fontes): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Se falhar o fetch e não tiver cache, apenas encerra
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Comunicação com o cliente para atualização imediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
