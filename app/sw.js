const CACHE = "webofvlsi-v1";
const PRECACHE = [
  "/webofvlsi-pro/",
  "/webofvlsi-pro/styles/main.css",
  "/webofvlsi-pro/scripts/app.js",
  "/webofvlsi-pro/assets/icons/favicon-192.png"
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const clone = response.clone();
      if (response.ok && request.url.startsWith(self.location.origin)) {
        caches.open(CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    })).catch(() => caches.match("/webofvlsi-pro/404.html"))
  );
});
