const CACHE_NAME = 'maggi-portal-v2';

self.addEventListener('install', (event) => {
    // Pula a espera para ativar imediatamente
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Deleta TODOS os caches antigos
                    return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Estratégia: Apenas Rede (Desativando Cache)
    event.respondWith(fetch(event.request));
});
