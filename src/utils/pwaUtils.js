// PWA utilities untuk installable dan offline functionality
class PWAUtils {
  constructor() {
    this.deferredPrompt = null
    this.isInstalled = false
    this.isOnline = navigator.onLine

    this.init()
  }

  init() {
    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      this.deferredPrompt = e
      this.showInstallButton()
    })

    // Listen for appinstalled event
    window.addEventListener("appinstalled", () => {
      this.isInstalled = true
      this.hideInstallButton()
      console.log("PWA was installed")
    })

    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true
      this.updateOnlineStatus()
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
      this.updateOnlineStatus()
    })

    // Check if app is already installed
    this.checkIfInstalled()
  }

  async installApp() {
    if (!this.deferredPrompt) {
      return false
    }

    this.deferredPrompt.prompt()
    const { outcome } = await this.deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("User accepted the install prompt")
    } else {
      console.log("User dismissed the install prompt")
    }

    this.deferredPrompt = null
    return outcome === "accepted"
  }

  showInstallButton() {
    const installButton = document.getElementById("install-button")
    if (installButton) {
      installButton.style.display = "block"
      installButton.addEventListener("click", () => this.installApp())
    } else {
      // Create install button if it doesn't exist
      this.createInstallButton()
    }
  }

  hideInstallButton() {
    const installButton = document.getElementById("install-button")
    if (installButton) {
      installButton.style.display = "none"
    }
  }

  createInstallButton() {
    const button = document.createElement("button")
    button.id = "install-button"
    button.innerHTML = "📱 Install App"
    button.className = "install-btn"
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2196F3;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      font-size: 14px;
      font-weight: bold;
    `

    button.addEventListener("click", () => this.installApp())
    document.body.appendChild(button)
  }

  checkIfInstalled() {
    // Check if running in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      this.isInstalled = true
    }

    // Check for iOS Safari
    if (window.navigator.standalone === true) {
      this.isInstalled = true
    }
  }

  updateOnlineStatus() {
    const statusElement = document.getElementById("online-status")

    if (!statusElement) {
      this.createOnlineStatusIndicator()
      return
    }

    if (this.isOnline) {
      statusElement.textContent = "Online"
      statusElement.className = "status-online"
      statusElement.style.display = "none"
    } else {
      statusElement.textContent = "Offline - Some features may be limited"
      statusElement.className = "status-offline"
      statusElement.style.display = "block"
    }
  }

  createOnlineStatusIndicator() {
    const statusDiv = document.createElement("div")
    statusDiv.id = "online-status"
    statusDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f44336;
      color: white;
      text-align: center;
      padding: 8px;
      z-index: 1001;
      font-size: 14px;
      display: none;
    `

    document.body.insertBefore(statusDiv, document.body.firstChild)
    this.updateOnlineStatus()
  }

  async cacheImportantData() {
    // Cache important data when going offline
    if ("caches" in window) {
      const cache = await caches.open("story-app-data")
      // Add important API responses to cache
    }
  }

  getInstallStatus() {
    return {
      isInstallable: !!this.deferredPrompt,
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
    }
  }
}

export default new PWAUtils()
