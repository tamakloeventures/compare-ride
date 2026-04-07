// RideCompare Service Worker
// Version — bump this string to force a cache refresh on all users
const CACHE_VERSION = "ridecompare-v3";

// App shell — files that make the app work offline
const APP_SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/uber-logo.svg",
  "/lyft-logo.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/og-image.jpg"
];

// ─── Install ────────────────────────────────────────────────────────────────
// Pre-cache the app shell so the app loads instantly on repeat visits
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Activate the new service worker immediately without waiting
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
// Delete old caches when a new service worker takes over
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
// Strategy:
//   • HTML pages       → Network First (always get fresh content)
//   • Everything else  → Cache First   (fast loads, fall back to network)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests (skip Google Maps, Supabase, GA, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  const isHTML =
    request.headers.get("accept") &&
    request.headers.get("accept").includes("text/html");

  if (isHTML) {
    // Network First for HTML — user always gets the latest version
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Update the cache with the fresh response
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback — serve cached index.html
          return caches.match("/index.html");
        })
    );
  } else {
    // Cache First for CSS, JS, images, fonts
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        // Not in cache — fetch from network and cache for next time
        return fetch(request).then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return networkResponse;
        });
      })
    );
  }
});

// ─── Background Sync (future) ────────────────────────────────────────────────
// Reserved for offline waitlist signups — will retry when connection returns
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-waitlist") {
    // TODO: implement offline waitlist queue
    console.log("[SW] Background sync triggered:", event.tag);
  }
});
