export class HomeView {
  render() {
    return `
      <div class="home-page">
        <div class="stories-header">
          <div class="header-content">
            <h2>📖 Cerita Terbaru</h2>
            <p>Jelajahi cerita menarik dari seluruh Indonesia</p>
          </div>
          <div class="view-controls">
            <button id="grid-view-btn" class="view-btn active">
              📱 Grid
            </button>
            <button id="map-view-btn" class="view-btn">
              🗺️ Peta
            </button>
          </div>
        </div>

        <div class="view-container">
          <!-- Grid View -->
          <div id="grid-view" class="grid-view">
            <div id="stories-container" class="stories-grid">
              <!-- Stories will be loaded here -->
            </div>
          </div>

          <!-- Map View -->
          <div id="map-view" class="map-view" style="display: none;">
            <div class="map-container">
              <div id="stories-map" class="stories-map"></div>
              <div class="map-info">
                <p>📍 Klik marker untuk melihat detail cerita</p>
                <button id="my-location-btn" class="btn btn-small">
                  🎯 Lokasi Saya
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  renderStoryCard(story) {
    const hasLocation = story.lat && story.lon
    const createdDate = this.formatDate(story.createdAt)

    return `
    <div class="story-card" data-story-id="${story.id}">
      <img 
        src="${story.photoUrl}" 
        alt="${story.name}" 
        class="story-image"
        loading="lazy"
        onerror="this.src='/placeholder.svg?height=200&width=300'"
      >
      <div class="story-content">
        <h3 class="story-title">${story.name || "Anonymous"}</h3>
        <p class="story-description">${this.truncateText(story.description, 150)}</p>
        <div class="story-meta">
          <span class="story-date">${createdDate}</span>
          ${hasLocation ? '<span class="story-location">📍 Lokasi tersedia</span>' : ""}
        </div>
        <div class="story-actions">
          <button 
            class="btn btn-small"
            data-action="favorite"
            data-story-id="${story.id}"
            type="button"
          >
            ❤️ Favorit
          </button>
        </div>
      </div>
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
