import { HomeView } from "../views/HomeView.js"
import { showLoading, hideLoading, showMessage } from "../utils/helpers.js"
import { MapManager } from "../utils/maps.js"
import IndexedDBHelper from "../utils/indexedDB.js"

export class HomePresenter {
  constructor(authModel, storyModel) {
    this.authModel = authModel
    this.storyModel = storyModel
    this.view = new HomeView()
    this.mapManager = new MapManager()
    this.viewMode = "grid"
    this.stories = []
  }

  async init() {
    await this.render()
    this.bindEvents()
    await this.loadStories()
  }

  async render() {
    const content = this.view.render()
    document.getElementById("page-content").innerHTML = content
  }

  bindEvents() {
    const gridViewBtn = document.getElementById("grid-view-btn")
    const mapViewBtn = document.getElementById("map-view-btn")
    const myLocationBtn = document.getElementById("my-location-btn")

    gridViewBtn?.addEventListener("click", () => {
      this.switchView("grid")
    })

    mapViewBtn?.addEventListener("click", () => {
      this.switchView("map")
    })

    myLocationBtn?.addEventListener("click", () => {
      this.goToMyLocation()
    })
  }

  switchView(mode) {
    this.viewMode = mode
    const gridView = document.getElementById("grid-view")
    const mapView = document.getElementById("map-view")
    const gridBtn = document.getElementById("grid-view-btn")
    const mapBtn = document.getElementById("map-view-btn")

    // Use CSS classes instead of direct style manipulation to prevent flickering
    if (mode === "grid") {
      gridView.style.display = "block"
      mapView.style.display = "none"
      gridBtn.classList.add("active")
      mapBtn.classList.remove("active")
    } else {
      // Add small delay to prevent flickering during view switch
      gridView.style.display = "none"

      setTimeout(() => {
        mapView.style.display = "block"
        gridBtn.classList.remove("active")
        mapBtn.classList.add("active")

        // Initialize map if not already done
        if (!this.mapManager.map) {
          setTimeout(() => {
            this.initMap()
          }, 100)
        }
      }, 50)
    }
  }

  initMap() {
    try {
      this.mapManager.initMap("stories-map", {
        center: [-2.5489, 118.0149],
        zoom: 5,
      })

      // Always show map, add stories if available
      if (this.stories.length > 0) {
        this.mapManager.addStoryMarkers(this.stories)
      }

      showMessage("Peta berhasil dimuat! 🗺️", "success")
    } catch (error) {
      console.error("Error initializing map:", error)
      showMessage("Gagal memuat peta: " + error.message)
    }
  }

  async goToMyLocation() {
    if (!navigator.geolocation) {
      showMessage("Geolocation tidak didukung di browser ini")
      return
    }

    showLoading()

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        if (this.mapManager.map) {
          this.mapManager.centerOnLocation(latitude, longitude, 15)
          this.mapManager.addUserLocation(latitude, longitude)
          showMessage("Lokasi Anda ditemukan! 📍", "success")
        }

        hideLoading()
      },
      (error) => {
        console.error("Geolocation error:", error)
        showMessage("Gagal mendapatkan lokasi: " + error.message)
        hideLoading()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    )
  }

  async loadStories(retryCount = 0) {
    const maxRetries = 2

    try {
      showLoading()

      console.log("📡 Loading stories...")

      // Try to get stories from API first
      if (navigator.onLine) {
        try {
          const response = await this.storyModel.getStories(1, 20, 1)

          if (response && response.data && response.data.listStory) {
            this.stories = response.data.listStory
            console.log(`✅ Successfully loaded ${this.stories.length} stories from API`)

            // Cache stories to IndexedDB for offline access
            if (this.stories.length > 0) {
              try {
                for (const story of this.stories) {
                  await IndexedDBHelper.addStory({ // Changed from saveStory to addStory
                    ...story,
                    isOffline: false,
                  })
                }
                console.log("✅ Stories cached to IndexedDB")
              } catch (cacheError) {
                console.error("Failed to cache stories:", cacheError)
              }
            }
          } else {
            console.warn("⚠️ No stories found in API response")
            this.stories = []
          }
        } catch (apiError) {
          console.error("❌ Error loading stories from API:", apiError)

          // If API fails, try to load from IndexedDB
          this.stories = await this.loadStoriesFromIndexedDB()
        }
      } else {
        // If offline, load from IndexedDB
        console.log("📶 Offline mode - loading stories from IndexedDB")
        this.stories = await this.loadStoriesFromIndexedDB()
      }

      this.renderStories()

      // Update map if in map view
      if (this.viewMode === "map" && this.mapManager.map) {
        this.mapManager.addStoryMarkers(this.stories)
      }
    } catch (error) {
      console.error("❌ Error loading stories:", error)

      if (
        retryCount < maxRetries &&
        (error.message.includes("fetch") ||
          error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("terhubung"))
      ) {
        console.log(`🔄 Retrying... Attempt ${retryCount + 1}`)
        setTimeout(
          () => {
            this.loadStories(retryCount + 1)
          },
          1000 * (retryCount + 1),
        )
        return
      }

      this.stories = []

      let errorMessage = "Gagal memuat cerita"

      if (error.message.includes("terhubung")) {
        errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        errorMessage = "Sesi Anda telah berakhir. Silakan login kembali."
        this.authModel.logout()
        window.app.updateAuthState()
        window.location.hash = "#/login"
        return
      } else if (error.message.includes("500")) {
        errorMessage = "Server sedang bermasalah. Silakan coba lagi nanti."
      } else {
        errorMessage = `Gagal memuat cerita: ${error.message}`
      }

      showMessage(errorMessage)
      this.renderEmptyState("Gagal memuat cerita")
    } finally {
      hideLoading()
    }
  }

  async loadStoriesFromIndexedDB() {
    try {
      const stories = await IndexedDBHelper.getAllStories()
      console.log(`✅ Successfully loaded ${stories.length} stories from IndexedDB`)

      if (stories.length === 0) {
        showMessage("Tidak ada cerita tersimpan secara offline", "warning")
      } else {
        showMessage("Memuat cerita dari penyimpanan offline", "info")
      }

      return stories
    } catch (error) {
      console.error("❌ Error loading stories from IndexedDB:", error)
      showMessage("Gagal memuat cerita dari penyimpanan offline", "error")
      return []
    }
  }

  renderStories() {
    const container = document.getElementById("stories-container")

    if (!container) return

    // Prevent flickering by using DocumentFragment
    const fragment = document.createDocumentFragment()

    if (this.stories.length === 0) {
      this.renderEmptyState()
      return
    }

    // Create all story cards in memory first
    this.stories.forEach((story) => {
      const cardElement = document.createElement("div")
      cardElement.innerHTML = this.view.renderStoryCard(story)
      fragment.appendChild(cardElement.firstElementChild)
    })

    // Single DOM update to prevent flickering
    container.innerHTML = ""
    container.appendChild(fragment)

    // Add event listeners after DOM update
    this.bindStoryCardEvents()
  }

  bindStoryCardEvents() {
    // Add event listeners to story cards to prevent inline onclick flickering
    const favoriteButtons = document.querySelectorAll('[data-action="favorite"]')

    favoriteButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault()
        e.stopPropagation()

        const storyId = button.getAttribute("data-story-id")
        if (storyId) {
          // Disable button during action to prevent double-clicks
          button.disabled = true
          button.textContent = "⏳ Loading..."

          try {
            await this.addToFavorites(storyId)
          } finally {
            button.disabled = false
            button.textContent = "❤️ Favorit"
          }
        }
      })
    })
  }

  renderEmptyState(message = "Belum ada cerita") {
    const container = document.getElementById("stories-container")
    if (!container) return

    const isError = message.includes("Gagal")

    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3>📖 ${message}</h3>
        <p>${isError ? "Terjadi kesalahan saat memuat cerita." : "Yuk, bagikan cerita pertama Anda!"}</p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          ${isError ? '<button class="btn btn-secondary" onclick="window.location.reload()">🔄 Muat Ulang</button>' : ""}
          ${isError ? '<button class="btn btn-secondary" onclick="window.app.router.currentPresenter.loadStories()">🔄 Coba Lagi</button>' : ""}
          <button class="btn" onclick="window.location.hash = \'#/add\'">Tambah Cerita</button>
        </div>
      </div>
    `
  }

  async addToFavorites(storyId) {
    try {
      const story = this.stories.find((s) => s.id === storyId)

      if (story) {
        await IndexedDBHelper.addToFavorites(story)
        showMessage("Cerita berhasil ditambahkan ke favorit! ❤️", "success")
        return true
      } else {
        showMessage("Cerita tidak ditemukan", "error")
        return false
      }
    } catch (error) {
      console.error("❌ Error adding to favorites:", error)
      showMessage("Gagal menambahkan ke favorit", "error")
      return false
    }
  }

  cleanup() {
    if (this.mapManager) {
      this.mapManager.destroy()
    }
  }
}