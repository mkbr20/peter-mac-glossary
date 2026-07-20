const CACHE_NAME = "pm-glossary-v1";
const ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.json",
  "data/entries.json",
  "data/languages.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "pages/zh/page-4.jpg",
  "pages/zh/page-5.jpg",
  "pages/zh/page-6.jpg",
  "pages/zh/page-7.jpg",
  "pages/zh/page-8.jpg",
  "pages/zh/page-9.jpg",
  "pages/zh/page-10.jpg",
  "pages/zh/page-11.jpg",
  "pages/zh/page-12.jpg",
  "pages/zh/page-13.jpg",
  "pages/zh/page-14.jpg",
  "pages/zh/page-15.jpg",
  "pages/zh/page-16.jpg",
  "pages/zh/page-17.jpg",
  "pages/zh/page-18.jpg",
  "pages/zh/page-19.jpg",
  "pages/zh/page-20.jpg",
  "pages/zh/page-21.jpg",
  "pages/zh/page-22.jpg",
  "pages/zh/page-23.jpg",
  "pages/zh/page-24.jpg",
  "pages/zh/page-25.jpg",
  "pages/zh/page-26.jpg",
  "pages/zh/page-27.jpg",
  "pages/zh/page-28.jpg",
  "pages/zh/page-29.jpg",
  "pages/zh/page-30.jpg",
  "pages/zh/page-31.jpg",
  "pages/zh/page-32.jpg",
  "pages/zh/page-33.jpg",
  "pages/zh/page-34.jpg",
  "pages/zh/page-35.jpg",
  "pages/zh/page-36.jpg",
  "pages/zh/page-37.jpg",
  "pages/zh/page-38.jpg",
  "pages/zh/page-39.jpg",
  "pages/zh/page-40.jpg",
  "pages/zh/page-41.jpg",
  "pages/zh/page-42.jpg",
  "pages/zh/page-43.jpg",
  "pages/zh/page-44.jpg",
  "pages/zh/page-45.jpg",
  "pages/zh/page-46.jpg",
  "pages/zh/page-47.jpg",
  "pages/zh/page-48.jpg",
  "pages/zh/page-49.jpg",
  "pages/zh/page-50.jpg",
  "pages/zh/page-51.jpg",
  "pages/zh/page-52.jpg",
  "pages/zh/page-53.jpg",
  "pages/zh/page-54.jpg",
  "pages/zh/page-55.jpg",
  "pages/zh/page-56.jpg",
  "pages/zh/page-58.jpg",
  "pages/zh/page-59.jpg",
  "pages/zh/page-60.jpg",
  "pages/zh/page-61.jpg",
  "pages/zh/page-62.jpg",
  "pages/zh/page-63.jpg",
  "pages/zh/page-64.jpg",
  "pages/zh/page-65.jpg",
  "pages/zh/page-66.jpg",
  "pages/zh/page-67.jpg",
  "pages/zh/page-68.jpg",
  "pages/zh/page-69.jpg",
  "pages/zh/page-70.jpg",
  "pages/zh/page-71.jpg",
  "pages/zh/page-72.jpg",
  "pages/zh/page-73.jpg",
  "pages/zh/page-74.jpg",
  "pages/zh/page-75.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      }).catch(() => cached);
    })
  );
});
