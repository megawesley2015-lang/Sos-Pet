/**
 * Service Worker — SOS Pet
 *
 * Estratégia: Network First com fallback para cache.
 * Garante que o app possa abrir mesmo offline (mostra cache),
 * mas sempre tenta buscar dados frescos primeiro.
 *
 * Cache versionado: mude CACHE_NAME para forçar atualização.
 */

const CACHE_NAME = "sos-pet-v1";

// Arquivos essenciais para funcionar offline
const PRECACHE_URLS = [
  "/",
  "/pets",
  "/offline",
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch — Network First ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  // Ignora requisições não-GET e de outros domínios (Supabase, etc.)
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // Ignora rotas de API e Server Actions
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Salva cópia no cache se for uma resposta válida
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() =>
        // Se offline, tenta o cache
        caches.match(event.request).then(
          (cached) =>
            cached ||
            // Se não tem cache, retorna página offline
            caches.match("/offline") ||
            new Response("Você está offline. Abra o app com conexão primeiro.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
        )
      )
  );
});
