export class FavoritesView {
  render() {
    return `
      <div class="favorites-page">
        <div class="page-header">
          <h2>📌 Cerita Favorit</h2>
          <p>Cerita yang telah Anda simpan untuk dibaca nanti</p>
        </div>
        
        <div class="favorites-actions">
          <button id="clear-favorites-btn" class="btn btn-secondary">
            🗑️ Hapus Semua Favorit
          </button>
        </div>
        
        <div id="favorites-container" class="stories-grid">
          <div class="loading-skeleton"></div>
          <div class="loading-skeleton"></div>
          <div class="loading-skeleton"></div>
        </div>
      </div>
    `
  }

  renderFavoriteCard(favorite) {
    const story = favorite.story
    return `
      <div class="story-card favorite-card" data-story-id="${story.id}">
        <div class="story-image">
          <img 
            src="${story.photoUrl}" 
            alt="${story.name}" 
            loading="lazy"
            onerror="this.src='/placeholder.svg?height=200&width=300'"
          >
          <div class="story-favorite-badge">⭐ Favorit</div>
        </div>
        <div class="story-content">
          <div class="story-header">
            <h3 class="story-author">${story.name || "Anonymous"}</h3>
            <small class="story-date">${this.formatDate(story.createdAt)}</small>
          </div>
          <p class="story-description">${this.truncateText(story.description, 100)}</p>
          <div class="story-actions">
            <button 
              class="btn btn-primary btn-small"
              onclick="window.app.viewStoryDetail('${story.id}')"
            >
              👁️ Lihat Detail
            </button>
            <button 
              class="btn btn-secondary btn-small"
              onclick="window.app.removeFromFavorites('${story.id}')"
            >
              ❤️ Hapus Favorit
            </button>
          </div>
          <small class="favorite-date">
            Ditambah ke favorit: ${this.formatDate(favorite.addedAt)}
          </small>
        </div>
      </div>
    `
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">📌</div>
        <h3>Belum Ada Favorit</h3>
        <p>Tambahkan cerita ke favorit dengan menekan tombol ❤️ pada cerita yang Anda sukai</p>
        <button class="btn btn-primary" onclick="window.location.hash='#/'">
          🏠 Kembali ke Home
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
