import { Router } from "./router.js"
import { AuthModel } from "./models/AuthModel.js"
import { StoryModel } from "./models/StoryModel.js"
import { AuthPresenter } from "./presenters/AuthPresenter.js"
import PushNotificationHelper from "./utils/pushNotification.js"
import IndexedDBHelper from "./utils/indexedDB.js"
import OfflineManager from "./utils/offlineManager.js"

class App {
  constructor() {
    this.router = new Router()
    this.authModel = new AuthModel()
    this.storyModel = new StoryModel()
    this.authPresenter = new AuthPresenter(this.authModel)
    this.updateTimeout = null
    this.init()
  }

  async init() {
    console.log("🚀 Initializing Story App with PWA features...")

    // Initialize PWA components first
    await this.initializePWA()

    // Initialize existing components
    this.bindNavigationEvents()
    this.updateAuthState()
    this.handleOffline()

    // Initialize router
    this.router.init()

    console.log("✅ App initialized successfully")
  }

  async initializePWA() {
    try {
      // Register Service Worker
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("📱 Service Worker registered:", registration.scope)

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("🔄 New version available, please refresh")
              this.showUpdateAvailable()
            }
          })
        })
      }

      // Initialize IndexedDB
      await IndexedDBHelper.openDB()
      console.log("💾 IndexedDB initialized")

      // Initialize Offline Manager
      OfflineManager.init()
      console.log("📶 Offline Manager initialized")

      // Initialize Push Notifications (only for authenticated users)
      if (this.authModel.isAuthenticated()) {
        await this.initializePushNotifications()
      }

      // Setup PWA UI
      this.setupPWAUI()
    } catch (error) {
      console.error("❌ Failed to initialize PWA:", error)
    }
  }

  async initializePushNotifications() {
    try {
      const initialized = await PushNotificationHelper.init()
      if (initialized) {
        console.log("🔔 Push notifications initialized")
      }
    } catch (error) {
      console.error("❌ Failed to initialize push notifications:", error)
    }
  }

  setupPWAUI() {
    // Setup install banner
    this.setupInstallBanner()

    // Setup PWA feature buttons
    this.setupPWAFeatureButtons()

    // Update PWA status
    this.updatePWAStatus()

    // Update status periodically
    setInterval(() => {
      this.updatePWAStatus()
    }, 30000) // Every 30 seconds
  }

  setupInstallBanner() {
    let deferredPrompt = null

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      deferredPrompt = e
      this.showInstallBanner()
    })

    // Install button handler
    document.getElementById("install-app-btn")?.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
          console.log("📱 User accepted the install prompt")
        }

        deferredPrompt = null
        this.hideInstallBanner()
      }
    })

    // Dismiss button handler
    document.getElementById("dismiss-install-btn")?.addEventListener("click", () => {
      this.hideInstallBanner()
    })

    // Check if already installed
    window.addEventListener("appinstalled", () => {
      console.log("📱 PWA was installed")
      this.hideInstallBanner()
    })
  }

  setupPWAFeatureButtons() {
    const pushNotificationBtn = document.getElementById("push-notification-btn")
    const offlineModeBtn = document.getElementById("offline-mode-btn")
    const syncDataBtn = document.getElementById("sync-data-btn")

    // Push notification toggle
    pushNotificationBtn?.addEventListener("click", async () => {
      if (!this.authModel.isAuthenticated()) {
        this.showMessage("Silakan login terlebih dahulu untuk mengaktifkan notifikasi", "error")
        return
      }

      const isSubscribed = await PushNotificationHelper.getSubscriptionStatus()

      if (isSubscribed) {
        await PushNotificationHelper.unsubscribe()
        pushNotificationBtn.classList.remove("active")
        this.showMessage("Notifikasi push dinonaktifkan", "success")
      } else {
        const permission = await PushNotificationHelper.requestPermission()
        if (permission) {
          await PushNotificationHelper.subscribe()
          pushNotificationBtn.classList.add("active")
          this.showMessage("Notifikasi push diaktifkan! 🔔", "success")

          // Show test notification
          await PushNotificationHelper.showTestNotification()
        } else {
          this.showMessage("Izin notifikasi ditolak", "error")
        }
      }
    })

    // Offline mode info
    offlineModeBtn?.addEventListener("click", () => {
      this.showOfflineInfo()
    })

    // Sync data manually
    syncDataBtn?.addEventListener("click", async () => {
      if (navigator.onLine) {
        syncDataBtn.textContent = "🔄 Syncing..."
        syncDataBtn.disabled = true

        try {
          await OfflineManager.forcSync()
          this.showMessage("Data berhasil disinkronkan! ✅", "success")
        } catch (error) {
          this.showMessage("Gagal menyinkronkan data", "error")
        } finally {
          syncDataBtn.textContent = "🔄 Sync Data"
          syncDataBtn.disabled = false
        }
      } else {
        this.showMessage("Tidak ada koneksi internet", "error")
      }
    })
  }

  showInstallBanner() {
    const banner = document.getElementById("pwa-install-banner")
    if (banner) {
      banner.classList.add("show")
    }
  }

  hideInstallBanner() {
    const banner = document.getElementById("pwa-install-banner")
    if (banner) {
      banner.classList.remove("show")
    }
  }

  showUpdateAvailable() {
    const updateBanner = document.createElement("div")
    updateBanner.className = "update-banner"
    updateBanner.innerHTML = `
      <p>📦 Versi baru tersedia!</p>
      <button onclick="window.location.reload()">Refresh</button>
      <button onclick="this.parentElement.remove()">Nanti</button>
    `
    updateBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #4CAF50;
      color: white;
      padding: 1rem;
      text-align: center;
      z-index: 1001;
    `
    document.body.prepend(updateBanner)
  }

  showOfflineInfo() {
    const modal = document.createElement("div")
    modal.className = "pwa-modal"
    modal.innerHTML = `
      <div class="modal-content">
        <h3>💾 Mode Offline</h3>
        <p>Fitur yang tersedia saat offline:</p>
        <ul>
          <li>✅ Melihat cerita yang sudah disimpan</li>
          <li>✅ Menambah cerita ke favorit</li>
          <li>✅ Menyimpan cerita baru (akan diupload saat online)</li>
          <li>❌ Mengupload foto baru</li>
          <li>❌ Melihat cerita terbaru dari server</li>
        </ul>
        <button onclick="this.parentElement.parentElement.remove()">Tutup</button>
      </div>
    `
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1002;
    `
    modal.querySelector(".modal-content").style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      margin: 1rem;
    `
    document.body.appendChild(modal)
  }

  bindNavigationEvents() {
    // Navigation buttons
    document.getElementById("home-btn")?.addEventListener("click", () => {
      this.navigate("#/")
    })

    document.getElementById("add-btn")?.addEventListener("click", () => {
      this.navigate("#/add")
    })

    document.getElementById("favorites-btn")?.addEventListener("click", () => {
      this.navigate("#/favorites")
    })

    document.getElementById("offline-stories-btn")?.addEventListener("click", () => {
      this.navigate("#/offline")
    })

    document.getElementById("login-btn")?.addEventListener("click", () => {
      this.navigate("#/login")
    })

    document.getElementById("logout-btn")?.addEventListener("click", () => {
      this.logout()
    })
  }

  navigate(hash) {
    window.location.hash = hash
  }

  updateAuthState() {
    const isAuthenticated = this.authModel.isAuthenticated()
    const loginBtn = document.getElementById("login-btn")
    const logoutBtn = document.getElementById("logout-btn")
    const addBtn = document.getElementById("add-btn")
    const favoritesBtn = document.getElementById("favorites-btn")
    const offlineBtn = document.getElementById("offline-stories-btn")
    const pwaFeatures = document.getElementById("pwa-features")

    if (isAuthenticated) {
      loginBtn.style.display = "none"
      logoutBtn.style.display = "block"
      addBtn.style.display = "block"
      favoritesBtn.style.display = "block"
      offlineBtn.style.display = "block"
      pwaFeatures.style.display = "flex"

      // Initialize push notifications for authenticated users
      this.initializePushNotifications()
    } else {
      loginBtn.style.display = "block"
      logoutBtn.style.display = "none"
      addBtn.style.display = "none"
      favoritesBtn.style.display = "none"
      offlineBtn.style.display = "none"
      pwaFeatures.style.display = "none"
    }

    this.updatePWAFeatureStates()
  }

  async updatePWAFeatureStates() {
    if (!this.authModel.isAuthenticated()) return

    const pushNotificationBtn = document.getElementById("push-notification-btn")

    if (pushNotificationBtn) {
      const isSubscribed = await PushNotificationHelper.getSubscriptionStatus()
      if (isSubscribed) {
        pushNotificationBtn.classList.add("active")
      } else {
        pushNotificationBtn.classList.remove("active")
      }
    }
  }

  // Debounced PWA status update
  updatePWAStatus() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }

    this.updateTimeout = setTimeout(() => {
      const statusElement = document.getElementById("pwa-status")
      if (!statusElement) return

      const isOnline = navigator.onLine
      const isInstalled =
        window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true

      let statusHTML = `
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.8rem;">
          <span>📱 ${isInstalled ? "Installed" : "Not Installed"}</span>
          <span>🌐 ${isOnline ? "Online" : "Offline"}</span>
      `

      if (this.authModel.isAuthenticated()) {
        PushNotificationHelper.getSubscriptionStatus().then((isSubscribed) => {
          statusHTML += `<span>🔔 ${isSubscribed ? "Push ON" : "Push OFF"}</span>`
          statusElement.innerHTML = statusHTML + "</div>"
        })
      } else {
        statusElement.innerHTML = statusHTML + "</div>"
      }
    }, 100)
  }

  logout() {
    if (confirm("Apakah Anda yakin ingin logout?")) {
      // Unsubscribe from push notifications
      PushNotificationHelper.unsubscribe()

      this.authModel.logout()
      this.updateAuthState()
      this.navigate("#/login")
    }
  }

  handleOffline() {
    window.addEventListener("online", () => {
      console.log("🌐 Connection restored")
      this.showMessage("Koneksi internet pulih! 🌐", "success")
    })

    window.addEventListener("offline", () => {
      console.log("📶 Connection lost")
      this.showMessage("Anda sedang offline. Beberapa fitur mungkin terbatas.", "warning")
    })
  }

  // Debounced message showing to prevent flickering
  showMessage(message, type = "info") {
    // Clear existing timeout
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout)
    }

    // Create or update message element
    let messageEl = document.querySelector(".app-message")

    if (!messageEl) {
      messageEl = document.createElement("div")
      messageEl.className = "app-message"
      messageEl.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        color: white;
        font-size: 0.9rem;
        z-index: 1000;
        max-width: 400px;
        text-align: center;
        transition: opacity 0.2s ease;
      `
      document.body.appendChild(messageEl)
    }

    // Set message type colors
    const colors = {
      success: "#4CAF50",
      error: "#f44336",
      warning: "#ff9800",
      info: "#2196F3",
    }

    messageEl.style.backgroundColor = colors[type] || colors.info
    messageEl.textContent = message
    messageEl.style.display = "block"
    messageEl.style.opacity = "1"

    // Auto hide after 4 seconds with fade out
    this.messageTimeout = setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.opacity = "0"
        setTimeout(() => {
          messageEl.style.display = "none"
        }, 200)
      }
    }, 4000)
  }

  async viewStoryDetail(storyId) {
    // Implement story detail view
    console.log("View story detail:", storyId)
    // This could open a modal or navigate to a detail page
  }

  async removeFromFavorites(storyId) {
    if (this.router.currentPresenter && this.router.currentPresenter.removeFromFavorites) {
      return await this.router.currentPresenter.removeFromFavorites(storyId)
    }
  }

  async addOfflineStoryToFavorites(storyId) {
    if (this.router.currentPresenter && this.router.currentPresenter.addOfflineStoryToFavorites) {
      return await this.router.currentPresenter.addOfflineStoryToFavorites(storyId)
    }
  }

  async deleteOfflineStory(storyId) {
    if (confirm("Apakah Anda yakin ingin menghapus cerita ini?")) {
      if (this.router.currentPresenter && this.router.currentPresenter.deleteOfflineStory) {
        return await this.router.currentPresenter.deleteOfflineStory(storyId)
      }
    }
  }

  async viewOfflineStoryDetail(storyId) {
    // Implement offline story detail view
    console.log("View offline story detail:", storyId)
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App()
})