export class OfflineStoriesView {
  render() {
    return `
      <div class="offline-stories-page">
        <div class="page-header">
          <h2>💾 Cerita Offline</h2>
          <p>Cerita yang tersimpan di perangkat Anda</p>
        </div>
        
        <div class="offline-info">
          <div class="info-card">
            <h4>ℹ️ Tentang Mode Offline</h4>
            <ul>
              <li>✅ Cerita disimpan di perangkat Anda</li>
              <li>✅ Dapat diakses tanpa internet</li>
              <li>🔄 Akan disinkronkan saat online</li>
              <li>📱 Data aman meski aplikasi ditutup</li>
            </ul>
          </div>
        </div>
        
        <div class="offline-actions">
          <button id="sync-now-btn" class="btn btn-primary">
            🔄 Sinkronkan Sekarang
          </button>
          <button id="clear-offline-btn" class="btn btn-secondary">
            🗑️ Hapus Semua Data Offline
          </button>
        </div>
        
        <div id="offline-stories-container" class="stories-grid">
          <div class="loading-skeleton"></div>
          <div class="loading-skeleton"></div>
          <div class="loading-skeleton"></div>
        </div>
      </div>
    `
  }

  renderOfflineStoryCard(story) {
    const isFailedUpload = story.failedUpload || false
    const statusBadge = story.isOffline ? (isFailedUpload ? "⚠️ Gagal Upload" : "⏳ Menunggu Sync") : "✅ Tersinkron"

    return `
      <div class="story-card offline-card ${isFailedUpload ? "failed-upload" : ""}" data-story-id="${story.id}">
        <div class="story-image">
          <img 
            src="${story.photoUrl}" 
            alt="${story.name}" 
            loading="lazy"
            onerror="this.src='/placeholder.svg?height=200&width=300'"
          >
          <div class="story-status-badge ${story.isOffline ? "offline" : "synced"}">
            ${statusBadge}
          </div>
        </div>
        <div class="story-content">
          <div class="story-header">
            <h3 class="story-author">${story.name || "Anonymous"}</h3>
            <small class="story-date">${this.formatDate(story.createdAt)}</small>
          </div>
          <p class="story-description">${this.truncateText(story.description, 100)}</p>
          
          ${
            story.lat && story.lon
              ? `
            <div class="story-location">
              📍 Lat: ${story.lat.toFixed(6)}, Lon: ${story.lon.toFixed(6)}
            </div>
          `
              : ""
          }
          
          <div class="story-actions">
            <button 
              class="btn btn-primary btn-small"
              onclick="window.app.viewOfflineStoryDetail('${story.id}')"
            >
              👁️ Lihat Detail
            </button>
            <button 
              class="btn btn-secondary btn-small"
              onclick="window.app.addOfflineStoryToFavorites('${story.id}')"
            >
              ❤️ Tambah Favorit
            </button>
            <button 
              class="btn btn-danger btn-small"
              onclick="window.app.deleteOfflineStory('${story.id}')"
            >
              🗑️ Hapus
            </button>
          </div>
          
          <small class="offline-date">
            Disimpan offline: ${this.formatDate(story.savedAt)}
          </small>
        </div>
      </div>
    `
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">💾</div>
        <h3>Belum Ada Cerita Offline</h3>
        <p>Cerita akan tersimpan secara otomatis saat Anda:</p>
        <ul style="text-align: left; max-width: 300px; margin: 1rem auto;">
          <li>Menambah cerita saat offline</li>
          <li>Gagal mengupload cerita</li>
          <li>Menyimpan cerita untuk nanti</li>
        </ul>
        <button class="btn btn-primary" onclick="window.location.hash='#/add'">
          ✍️ Buat Cerita Baru
        </button>
      </div>
    `
  }

  formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Tanggal tidak valid"
    }
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }
}
