// Fix Leaflet import issue for browser
export class MapManager {
  constructor() {
    this.map = null
    this.markers = []
    this.userLocationMarker = null
  }

  initMap(containerId, options = {}) {
    const defaultOptions = {
      center: [-2.5489, 118.0149], // Indonesia center
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    }

    const mapOptions = { ...defaultOptions, ...options }

    // Initialize map using global L from CDN
    this.map = window.L.map(containerId, {
      zoomControl: mapOptions.zoomControl,
      attributionControl: mapOptions.attributionControl,
    }).setView(mapOptions.center, mapOptions.zoom)

    // Add tile layer (OpenStreetMap)
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map)

    return this.map
  }

  addStoryMarkers(stories) {
    // Clear existing markers
    this.clearMarkers()

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = window.L.marker([story.lat, story.lon]).addTo(this.map).bindPopup(this.createStoryPopup(story))

        // Custom icon for story markers
        const storyIcon = window.L.divIcon({
          className: "story-marker",
          html: '<div class="story-marker-icon">📖</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        marker.setIcon(storyIcon)
        this.markers.push(marker)
      }
    })

    // Fit map to show all markers
    if (this.markers.length > 0) {
      const group = new window.L.featureGroup(this.markers)
      this.map.fitBounds(group.getBounds().pad(0.1))
    }
  }

  createStoryPopup(story) {
    return `
      <div class="story-popup">
        <div class="story-popup-image">
          <img src="${story.photoUrl}" alt="${story.name}" loading="lazy" 
               onerror="this.src='/placeholder.svg?height=100&width=150'">
        </div>
        <div class="story-popup-content">
          <h4>${story.name || "Anonymous"}</h4>
          <p>${story.description.length > 100 ? story.description.substring(0, 100) + "..." : story.description}</p>
          <small>${this.formatDate(story.createdAt)}</small>
        </div>
      </div>
    `
  }

  addUserLocation(lat, lon, options = {}) {
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker)
    }

    const defaultOptions = {
      draggable: false,
      title: "Lokasi Anda",
    }

    const markerOptions = { ...defaultOptions, ...options }

    // Custom icon for user location
    const userIcon = window.L.divIcon({
      className: "user-location-marker",
      html: '<div class="user-location-icon">📍</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    this.userLocationMarker = window.L.marker([lat, lon], markerOptions)
      .setIcon(userIcon)
      .addTo(this.map)
      .bindPopup("📍 Lokasi Anda")

    return this.userLocationMarker
  }

  setUserLocationDraggable(callback) {
    if (this.userLocationMarker) {
      this.userLocationMarker.dragging.enable()
      this.userLocationMarker.on("dragend", (e) => {
        const position = e.target.getLatLng()
        if (callback) {
          callback(position.lat, position.lng)
        }
      })
    }
  }

  centerOnLocation(lat, lon, zoom = 15) {
    if (this.map) {
      this.map.setView([lat, lon], zoom)
    }
  }

  clearMarkers() {
    this.markers.forEach((marker) => {
      this.map.removeLayer(marker)
    })
    this.markers = []
  }

  destroy() {
    if (this.map) {
      this.map.remove()
      this.map = null
    }
    this.markers = []
    this.userLocationMarker = null
  }

  formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      return "Tanggal tidak valid"
    }
  }

  getBounds() {
    if (this.map) {
      return this.map.getBounds()
    }
    return null
  }

  onMapClick(callback) {
    if (this.map) {
      this.map.on("click", (e) => {
        callback(e.latlng.lat, e.latlng.lng)
      })
    }
  }
}
