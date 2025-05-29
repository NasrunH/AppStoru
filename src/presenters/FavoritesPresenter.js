import { FavoritesView } from "../views/FavoritesView.js"
import { showLoading, hideLoading, showMessage } from "../utils/helpers.js"
import IndexedDBHelper from "../utils/indexedDB.js"

export class FavoritesPresenter {
  constructor(authModel, storyModel) {
    this.authModel = authModel
    this.storyModel = storyModel
    this.view = new FavoritesView()
    this.favorites = []
  }

  async init() {
    await this.render()
    this.bindEvents()
    await this.loadFavorites()
  }

  async render() {
    const content = this.view.render()
    document.getElementById("page-content").innerHTML = content
  }

  bindEvents() {
    const clearFavoritesBtn = document.getElementById("clear-favorites-btn")

    clearFavoritesBtn?.addEventListener("click", async () => {
      if (confirm("Apakah Anda yakin ingin menghapus semua favorit?")) {
        await this.clearAllFavorites()
      }
    })
  }

  async loadFavorites() {
    try {
      showLoading()

      // Get favorites from IndexedDB
      this.favorites = await IndexedDBHelper.getFavorites()

      // Sort by added date (newest first)
      this.favorites.sort((a, b) => {
        return new Date(b.addedAt) - new Date(a.addedAt)
      })

      this.renderFavorites()
    } catch (error) {
      console.error("❌ Error loading favorites:", error)
      this.showErrorState("Gagal memuat favorit")
    } finally {
      hideLoading()
    }
  }

  renderFavorites() {
    const container = document.getElementById("favorites-container")

    if (!container) return

    if (this.favorites.length === 0) {
      container.innerHTML = this.view.renderEmptyState()
      return
    }

    container.innerHTML = this.favorites.map((favorite) => this.view.renderFavoriteCard(favorite)).join("")
  }

  showErrorState(message) {
    const container = document.getElementById("favorites-container")

    if (!container) return

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h3>${message}</h3>
        <p>Terjadi kesalahan saat memuat favorit.</p>
        <button class="btn" onclick="window.app.router.currentPresenter.loadFavorites()">
          🔄 Coba Lagi
        </button>
      </div>
    `
  }

  async addToFavorites(storyId) {
    try {
      // Check if story exists in IndexedDB
      const story = await IndexedDBHelper.getStoryById(storyId)

      if (!story) {
        // If not in IndexedDB, try to get from API
        try {
          const response = await this.storyModel.getStoryDetail(storyId)
          if (response && response.story) {
            await IndexedDBHelper.addToFavorites(response.story)
            showMessage("Cerita berhasil ditambahkan ke favorit! ❤️", "success")
            await this.loadFavorites()
            return true
          }
        } catch (apiError) {
          console.error("Failed to get story from API:", apiError)
          showMessage("Gagal menambahkan ke favorit. Cerita tidak ditemukan.", "error")
          return false
        }
      } else {
        // Story exists in IndexedDB
        await IndexedDBHelper.addToFavorites(story)
        showMessage("Cerita berhasil ditambahkan ke favorit! ❤️", "success")
        await this.loadFavorites()
        return true
      }
    } catch (error) {
      console.error("❌ Error adding to favorites:", error)
      showMessage("Gagal menambahkan ke favorit", "error")
      return false
    }
  }

  async removeFromFavorites(storyId) {
    try {
      await IndexedDBHelper.removeFromFavorites(storyId)
      showMessage("Cerita dihapus dari favorit", "success")
      await this.loadFavorites()
      return true
    } catch (error) {
      console.error("❌ Error removing from favorites:", error)
      showMessage("Gagal menghapus dari favorit", "error")
      return false
    }
  }

  async clearAllFavorites() {
    try {
      // Get all favorites
      const favorites = await IndexedDBHelper.getFavorites()

      // Delete each favorite
      for (const favorite of favorites) {
        await IndexedDBHelper.removeFromFavorites(favorite.storyId)
      }

      showMessage("Semua favorit berhasil dihapus", "success")
      await this.loadFavorites()
      return true
    } catch (error) {
      console.error("❌ Error clearing favorites:", error)
      showMessage("Gagal menghapus semua favorit", "error")
      return false
    }
  }

  async viewStoryDetail(storyId) {
    // Implement view story detail functionality
    // This could navigate to a detail page or show a modal
    console.log("View story detail:", storyId)
  }

  cleanup() {
    // Clean up any resources
  }
}
