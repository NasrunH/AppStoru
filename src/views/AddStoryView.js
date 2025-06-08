export class AddStoryView {
  render() {
    return `
      <div class="add-story-page">
        <div class="form-container">
          <div class="auth-header">
            <h2>✍️ Tambah Cerita Baru</h2>
            <p class="auth-subtitle">Bagikan momen berharga Anda</p>
          </div>

          <form id="add-story-form">
            <div class="form-group">
              <label for="story-description">Deskripsi Cerita *</label>
              <textarea 
                id="story-description" 
                name="description" 
                placeholder="Ceritakan pengalaman menarik Anda..."
                required
                maxlength="1000"
              ></textarea>
              <small>Maksimal 1000 karakter</small>
            </div>

            <div class="form-group">
              <label>Foto Cerita *</label>
              <div class="photo-input-container">
                <input 
                  type="file" 
                  id="story-photo" 
                  accept="image/*" 
                  style="display: none;"
                >
                <div class="photo-input-buttons">
                  <button type="button" id="camera-btn" class="btn btn-secondary">
                    📸 Ambil Foto
                  </button>
                  <button type="button" id="gallery-btn" class="btn btn-secondary">
                    🖼️ Pilih dari Galeri
                  </button>
                </div>
              </div>
              <small>Format: JPG, PNG, WebP. Maksimal 5MB</small>
            </div>

            <div id="photo-preview" class="photo-preview" style="display: none;">
              <!-- Photo preview will be inserted here -->
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="include-location" checked>
                📍 Sertakan lokasi dalam cerita
              </label>
              <small>Lokasi akan membantu orang lain menemukan tempat menarik</small>
            </div>

            <!-- Location Map -->
            <div class="location-map-container">
              <div class="map-header">
                <h4>📍 Pilih Lokasi</h4>
                <div class="map-controls-header">
                  <button type="button" id="use-current-location" class="btn btn-small">
                    🎯 Lokasi Saya
                  </button>
                </div>
              </div>
              <div id="location-map" class="location-map"></div>
              <div class="map-controls">
                <div id="location-info" class="location-info-inline">
                  <p>📍 Lokasi belum dipilih</p>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="window.history.back()">
                ← Batal
              </button>
              <button type="submit" id="submit-btn" class="btn">
                📝 Tambah Cerita
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Camera Modal -->
      <div id="camera-modal" class="camera-modal" style="display: none;">
        <div class="camera-modal-content">
          <div class="camera-header">
            <h3>📸 Ambil Foto</h3>
            <button type="button" id="close-camera" class="close-btn">✕</button>
          </div>
          <div class="camera-container">
            <video id="camera-video" autoplay playsinline></video>
          </div>
          <div class="camera-controls">
            <button type="button" id="switch-camera" class="btn btn-secondary">
              🔄 Ganti Kamera
            </button>
            <button type="button" id="capture-photo" class="btn">
              📸 Ambil Foto
            </button>
          </div>
        </div>
      </div>
    `
  }
}
