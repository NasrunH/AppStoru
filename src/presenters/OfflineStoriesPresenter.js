import { OfflineStoriesView } from "../views/OfflineStoriesView.js"
import { showLoading, hideLoading, showMessage } from "../utils/helpers.js"
import IndexedDBHelper from "../utils/indexedDB.js"
import OfflineManager from "../utils/offlineManager.js"

export class OfflineStoriesPresenter {
  constructor(authModel, storyModel) {
    this.authModel = authModel
    this.storyModel = storyModel
    this.view = new OfflineStoriesView()
    this.stories = []
  }

  async init() {
    await this.render()
    this.bindEvents()
    await this.loadOfflineStories()
  }

  async render() {
    const content = this.view.render()
    document.getElementById("page-content").innerHTML = content
  }

  bindEvents() {
    const syncNowBtn = document.getElementById("sync-now-btn")
    const clearOfflineBtn = document.getElementById("clear-offline-btn")

    syncNowBtn?.addEventListener("click", async () => {
      await this.syncOfflineStories()
    })

    clearOfflineBtn?.addEventListener("click", async () => {
      if (confirm("Apakah Anda yakin ingin menghapus semua data offline?")) {
        await this.clearAllOfflineData()
      }
    })
  }

  async loadOfflineStories() {
    try {
      showLoading()

      // Get stories from IndexedDB
      this.stories = await IndexedDBHelper.getAllStories()

      // Sort by saved date (newest first)
      this.stories.sort((a, b) => {
        return new Date(b.savedAt || b.createdAt) - new Date(a.savedAt || a.createdAt)
      })

      this.renderOfflineStories()
    } catch (error) {
      console.error("❌ Error loading offline stories:", error)
      this.showErrorState("Gagal memuat cerita offline")
    } finally {
      hideLoading()
    }
  }

  renderOfflineStories() {
    const container = document.getElementById("offline-stories-container")

    if (!container) return

    if (this.stories.length === 0) {
      container.innerHTML = this.view.renderEmptyState()
      return
    }

    container.innerHTML = this.stories.map((story) => this.view.renderOfflineStoryCard(story)).join("")
  }

  showErrorState(message) {
    const container = document.getElementById("offline-stories-container")

    if (!container) return

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h3>${message}</h3>
        <p>Terjadi kesalahan saat memuat cerita offline.</p>
        <button class="btn" onclick="window.app.router.currentPresenter.loadOfflineStories()">
          🔄 Coba Lagi
        </button>
      </div>
    `
  }

  async syncOfflineStories() {
    if (!navigator.onLine) {
      showMessage("Tidak dapat sinkronisasi saat offline", "warning")
      return
    }

    try {
      showLoading()

      const syncBtn = document.getElementById("sync-now-btn")
      if (syncBtn) {
        syncBtn.disabled = true
        syncBtn.textContent = "🔄 Menyinkronkan..."
      }

      await OfflineManager.syncPendingActions()

      showMessage("Sinkronisasi berhasil! ✅", "success")

      // Reload stories to reflect changes
      await this.loadOfflineStories()
    } catch (error) {
      console.error("❌ Error syncing offline stories:", error)
      showMessage("Gagal menyinkronkan cerita", "error")
    } finally {
      hideLoading()

      const syncBtn = document.getElementById("sync-now-btn")
      if (syncBtn) {
        syncBtn.disabled = false
        syncBtn.textContent = "🔄 Sinkronkan Sekarang"
      }
    }
  }

  async deleteOfflineStory(storyId) {
    try {
      await IndexedDBHelper.deleteStory(storyId)
      showMessage("Cerita berhasil dihapus", "success")
      await this.loadOfflineStories()
      return true
    } catch (error) {
      console.error("❌ Error deleting offline story:", error)
      showMessage("Gagal menghapus cerita", "error")
      return false
    }
  }

  async addOfflineStoryToFavorites(storyId) {
    try {
      const story = await IndexedDBHelper.getStoryById(storyId)

      if (story) {
        await IndexedDBHelper.addToFavorites(story)
        showMessage("Cerita berhasil ditambahkan ke favorit! ❤️", "success")
        return true
      } else {
        showMessage("Cerita tidak ditemukan", "error")
        return false
      }
    } catch (error) {
      console.error("❌ Error adding offline story to favorites:", error)
      showMessage("Gagal menambahkan ke favorit", "error")
      return false
    }
  }

  async clearAllOfflineData() {
    try {
      showLoading()

      // Clear all data from IndexedDB
      await IndexedDBHelper.clearAllData()

      showMessage("Semua data offline berhasil dihapus", "success")
      await this.loadOfflineStories()
      return true
    } catch (error) {
      console.error("❌ Error clearing offline data:", error)
      showMessage("Gagal menghapus data offline", "error")
      return false
    } finally {
      hideLoading()
    }
  }

  async viewOfflineStoryDetail(storyId) {
    // Implement view story detail functionality
    // This could navigate to a detail page or show a modal
    console.log("View offline story detail:", storyId)
  }

  cleanup() {
    // Clean up any resources
  }
}
