// Service Worker untuk PWA Story App
const CACHE_NAME = "story-app-v2"
const STATIC_CACHE = "story-app-static-v2"
const DYNAMIC_CACHE = "story-app-dynamic-v2"

// Static assets to cache - Path yang benar
const STATIC_ASSETS = [
  "/",
  "./index.html",
  "./src/app.js",
  "./src/router.js",
  "./src/styles/main.css",
  "./src/utils/helpers.js",
  "./src/utils/maps.js",
  "./src/utils/indexedDB.js",
  "./src/utils/pushNotification.js",
  "./src/utils/offlineManager.js",
  "./src/models/AuthModel.js",
  "./src/models/StoryModel.js",
  "/manifest.json",
  "/android-icon-192x192.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .catch((error) => console.error("Service Worker: Failed to cache static assets", error)),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("Service Worker: Deleting old cache", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  return self.clients.claim()
})

// Fetch event - cache-first for static, network-first for dynamic
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }
  
  // API requests - Network first, then cache
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Other requests - Cache first, then network
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request).then(networkResponse => {
        const clonedResponse = networkResponse.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, clonedResponse);
        });
        return networkResponse;
      });
    })
  );
});


// Push notification event
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received")

  let notificationData = {
    title: "Story App",
    body: "Ada cerita baru untuk Anda!",
    icon: "/android-icon-192x192.png",
    badge: "/android-icon-72x72.png",
    tag: "story-notification",
    data: {
      url: "/",
    },
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (error) {
      notificationData.body = event.data.text()
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    vibrate: [100, 50, 100],
    actions: [
      {
        action: "view",
        title: "Lihat Cerita",
        icon: "/android-icon-192x192.png",
      },
      {
        action: "close",
        title: "Tutup",
        icon: "/android-icon-192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked")

  event.notification.close()

  const action = event.action
  const data = event.notification.data

  if (action === "view" || !action) {
    const urlToOpen = data?.url || "/"

    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus()
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      }),
    )
  }
})