// Service Worker untuk PWA Story App
const CACHE_NAME = "story-app-v1"
const STATIC_CACHE = "story-app-static-v1"
const DYNAMIC_CACHE = "story-app-dynamic-v1"

// Static assets to cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/app.js",
  "/src/router.js",
  "/src/styles/main.css",
  "/src/utils/helpers.js",
  "/src/utils/maps.js",
  "/src/utils/indexedDB.js",
  "/src/utils/pushNotification.js",
  "/src/utils/offlineManager.js",
  "/src/models/AuthModel.js",
  "/src/models/StoryModel.js",
  "/manifest.json",
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
      .catch((error) => {
        console.error("Service Worker: Failed to cache static assets", error)
      }),
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

  self.clients.claim()
})

// Fetch event - serve from cache with network fallback
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Handle API requests
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets
  if (STATIC_ASSETS.some((asset) => request.url.includes(asset))) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // Handle other requests
  event.respondWith(handleDynamicRequest(request))
})

// Handle API requests with cache-first strategy for GET requests
async function handleApiRequest(request) {
  const url = new URL(request.url)

  // Only cache GET requests to stories endpoint
  if (url.pathname.includes("/stories") && request.method === "GET") {
    try {
      // Try network first for fresh data
      const networkResponse = await fetch(request)

      if (networkResponse.ok) {
        // Cache successful response
        const cache = await caches.open(DYNAMIC_CACHE)
        cache.put(request, networkResponse.clone())
        return networkResponse
      }

      throw new Error("Network response not ok")
    } catch (error) {
      // Fallback to cache
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }

      // Return offline response
      return new Response(
        JSON.stringify({
          error: true,
          message: "Offline - Data tidak tersedia",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  }

  // For non-cacheable API requests, just try network
  return fetch(request)
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error("Failed to fetch static asset:", error)

    // Return fallback for images
    if (request.url.includes(".png") || request.url.includes(".jpg") || request.url.includes(".svg")) {
      return new Response("", { status: 404 })
    }

    throw error
  }
}

// Handle dynamic requests
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const offlineResponse = await caches.match("/")
      return offlineResponse || new Response("Offline", { status: 503 })
    }

    throw error
  }
}

// Push notification event
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received")

  let notificationData = {
    title: "Story App",
    body: "Ada cerita baru untuk Anda!",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
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
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Tutup",
        icon: "/icon-192x192.png",
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

// Background sync event
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered")

  if (event.tag === "story-sync") {
    event.waitUntil(syncStories())
  }
})

// Sync stories function
async function syncStories() {
  try {
    // This would typically sync with IndexedDB
    console.log("Service Worker: Syncing stories...")

    // Send message to main thread to handle sync
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_STORIES",
      })
    })
  } catch (error) {
    console.error("Service Worker: Sync failed", error)
  }
}

// Message event - handle messages from main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
