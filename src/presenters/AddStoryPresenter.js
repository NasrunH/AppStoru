import { AddStoryView } from "../views/AddStoryView.js"
import { MapManager } from "../utils/maps.js"
import { showLoading, hideLoading, showMessage } from "../utils/helpers.js"

export class AddStoryPresenter {
  constructor(authModel, storyModel) {
    this.authModel = authModel
    this.storyModel = storyModel
    this.view = new AddStoryView()
    this.selectedFile = null
    this.currentLocation = null
    this.stream = null
    this.isCameraMode = false
    this.mapManager = new MapManager()
    this.showMap = false
    this.facingMode = "environment" // Default to back camera
  }

  async init() {
    await this.render()
    // Langsung tampilkan peta lokasi dan ambil lokasi saat ini
    this.showLocationMap()
    this.getCurrentLocation()
    this.bindEvents()
  }

  async render() {
    const content = this.view.render()
    document.getElementById("page-content").innerHTML = content
  }

  bindEvents() {
    const form = document.getElementById("add-story-form")
    const photoInput = document.getElementById("story-photo")
    const cameraBtn = document.getElementById("camera-btn")
    const galleryBtn = document.getElementById("gallery-btn")
    const submitBtn = document.getElementById("submit-btn")

    // Camera controls
    const cameraModal = document.getElementById("camera-modal")
    const closeCameraBtn = document.getElementById("close-camera")
    const switchCameraBtn = document.getElementById("switch-camera")
    const captureBtn = document.getElementById("capture-photo")

    // Map controls
    const closeMapBtn = document.getElementById("close-map")
    const useCurrentLocationBtn = document.getElementById("use-current-location")

    // Gallery button
    galleryBtn?.addEventListener("click", () => {
      photoInput?.click()
    })

    // Camera button
    cameraBtn?.addEventListener("click", () => {
      this.openCamera()
    })

    // Photo input change
    photoInput?.addEventListener("change", (e) => {
      this.handleFileSelect(e.target.files[0])
    })

    // Form submit
    form?.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSubmit()
    })

    // Camera modal controls
    closeCameraBtn?.addEventListener("click", () => {
      this.closeCamera()
    })

    switchCameraBtn?.addEventListener("click", () => {
      this.switchCamera()
    })

    captureBtn?.addEventListener("click", () => {
      this.capturePhoto()
    })

    // Map controls
    closeMapBtn?.addEventListener("click", () => {
      this.hideLocationMap()
    })

    useCurrentLocationBtn?.addEventListener("click", () => {
      this.getCurrentLocation()
    })

    // Close modal when clicking outside
    cameraModal?.addEventListener("click", (e) => {
      if (e.target === cameraModal) {
        this.closeCamera()
      }
    })
  }

  async openCamera() {
    try {
      const cameraModal = document.getElementById("camera-modal")
      const video = document.getElementById("camera-video")

      if (!cameraModal || !video) {
        throw new Error("Camera elements not found")
      }

      // Show modal
      cameraModal.style.display = "flex"

      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      video.srcObject = this.stream
      this.isCameraMode = true

      showMessage("Kamera berhasil diaktifkan! 📸", "success")
    } catch (error) {
      console.error("Error opening camera:", error)

      let errorMessage = "Gagal mengakses kamera"
      if (error.name === "NotAllowedError") {
        errorMessage = "Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser."
      } else if (error.name === "NotFoundError") {
        errorMessage = "Kamera tidak ditemukan di perangkat ini."
      } else if (error.name === "NotSupportedError") {
        errorMessage = "Kamera tidak didukung di browser ini."
      }

      showMessage(errorMessage, "error")
      this.closeCamera()
    }
  }

  closeCamera() {
    const cameraModal = document.getElementById("camera-modal")
    const video = document.getElementById("camera-video")

    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    // Clear video source
    if (video) {
      video.srcObject = null
    }

    // Hide modal
    if (cameraModal) {
      cameraModal.style.display = "none"
    }

    this.isCameraMode = false
  }

  async switchCamera() {
    try {
      // Toggle between front and back camera
      this.facingMode = this.facingMode === "environment" ? "user" : "environment"

      // Close current stream
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop())
      }

      // Open camera with new facing mode
      const video = document.getElementById("camera-video")
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      video.srcObject = this.stream

      const cameraType = this.facingMode === "environment" ? "belakang" : "depan"
      showMessage(`Beralih ke kamera ${cameraType}`, "success")
    } catch (error) {
      console.error("Error switching camera:", error)
      showMessage("Gagal beralih kamera", "error")
    }
  }

  capturePhoto() {
    try {
      const video = document.getElementById("camera-video")
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")

      if (!video || !video.videoWidth || !video.videoHeight) {
        throw new Error("Video not ready")
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create file from blob
            const file = new File([blob], `camera-photo-${Date.now()}.jpg`, {
              type: "image/jpeg",
            })

            this.handleFileSelect(file)
            this.closeCamera()
            showMessage("Foto berhasil diambil! 📸", "success")
          } else {
            throw new Error("Failed to create photo blob")
          }
        },
        "image/jpeg",
        0.8,
      )
    } catch (error) {
      console.error("Error capturing photo:", error)
      showMessage("Gagal mengambil foto", "error")
    }
  }

  handleFileSelect(file) {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showMessage("File harus berupa gambar", "error")
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      showMessage("Ukuran file maksimal 5MB", "error")
      return
    }

    this.selectedFile = file
    this.showPhotoPreview(file)
  }

  showPhotoPreview(file) {
    const previewContainer = document.getElementById("photo-preview")

    if (!previewContainer) return

    const reader = new FileReader()
    reader.onload = (e) => {
      previewContainer.innerHTML = `
        <div class="preview-container">
          <img src="${e.target.result}" alt="Preview" class="preview-image">
          <div class="preview-info">
            <p><strong>File:</strong> ${file.name}</p>
            <p><strong>Ukuran:</strong> ${this.formatFileSize(file.size)}</p>
            <p><strong>Tipe:</strong> ${file.type}</p>
            <button type="button" class="btn btn-secondary btn-small" onclick="window.app.router.currentPresenter.removePhoto()">
              🗑️ Hapus Foto
            </button>
          </div>
        </div>
      `
      previewContainer.style.display = "block"
    }
    reader.readAsDataURL(file)
  }

  removePhoto() {
    this.selectedFile = null
    const previewContainer = document.getElementById("photo-preview")
    const photoInput = document.getElementById("story-photo")

    if (previewContainer) {
      previewContainer.style.display = "none"
      previewContainer.innerHTML = ""
    }

    if (photoInput) {
      photoInput.value = ""
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  showLocationMap() {
    try {
      this.showMap = true

      // Initialize map
      setTimeout(() => {
        this.mapManager.initMap("location-map", {
          center: [-2.5489, 118.0149], // Indonesia center
          zoom: 5,
        })

        // Add click handler for map
        this.mapManager.map.on("click", (e) => {
          const { lat, lng } = e.latlng
          this.setLocation(lat, lng)
        })

        console.log("Location map initialized")
      }, 100)
    } catch (error) {
      console.error("Error showing location map:", error)
      showMessage("Gagal memuat peta lokasi", "error")
    }
  }

  hideLocationMap() {
    this.showMap = false
    if (this.mapManager) {
      this.mapManager.destroy()
    }
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      showMessage("Geolocation tidak didukung di browser ini", "warning")
      return
    }

    showLoading()

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        this.setLocation(latitude, longitude)

        if (this.mapManager.map) {
          this.mapManager.centerOnLocation(latitude, longitude, 15)
          this.mapManager.addUserLocation(latitude, longitude)
        }

        showMessage("Lokasi berhasil ditemukan! 📍", "success")
        hideLoading()
      },
      (error) => {
        console.error("Geolocation error:", error)

        let errorMessage = "Gagal mendapatkan lokasi"
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser."
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Informasi lokasi tidak tersedia."
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Timeout saat mendapatkan lokasi."
        }

        showMessage(errorMessage, "error")
        hideLoading()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    )
  }

  setLocation(lat, lng) {
    this.currentLocation = { lat, lng }

    // Update location info
    const locationInfo = document.getElementById("location-info")
    if (locationInfo) {
      locationInfo.innerHTML = `
        <p>📍 Lokasi: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
      `
    }

    // Add marker to map
    if (this.mapManager.map) {
      this.mapManager.clearMarkers()
      this.mapManager.addUserLocation(lat, lng)
    }
  }

  async handleSubmit() {
    try {
      const description = document.getElementById("story-description")?.value?.trim()
      const includeLocation = document.getElementById("include-location")?.checked

      // Validation
      if (!description) {
        showMessage("Deskripsi cerita harus diisi", "error")
        return
      }

      if (!this.selectedFile) {
        showMessage("Foto harus dipilih", "error")
        return
      }

      showLoading()

      // Prepare location data
      let lat = null
      let lon = null

      if (includeLocation && this.currentLocation) {
        lat = this.currentLocation.lat
        lon = this.currentLocation.lng
      }

      // Submit story
      const response = await this.storyModel.addStory(description, this.selectedFile, lat, lon)

      if (response && !response.error) {
        showMessage("Cerita berhasil ditambahkan! 🎉", "success")

        // Reset form
        this.resetForm()

        // Navigate back to home
        setTimeout(() => {
          window.location.hash = "#/"
        }, 1500)
      } else {
        throw new Error(response?.message || "Gagal menambahkan cerita")
      }
    } catch (error) {
      console.error("Error submitting story:", error)

      let errorMessage = "Gagal menambahkan cerita"

      if (error.message.includes("offline") || error.message.includes("sync")) {
        errorMessage = "Cerita disimpan offline dan akan diupload saat online"
        showMessage(errorMessage, "warning")

        // Reset form and navigate
        this.resetForm()
        setTimeout(() => {
          window.location.hash = "#/"
        }, 1500)
        return
      }

      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        errorMessage = "Sesi Anda telah berakhir. Silakan login kembali."
        this.authModel.logout()
        window.app.updateAuthState()
        window.location.hash = "#/login"
        return
      } else if (error.message.includes("413")) {
        errorMessage = "File terlalu besar. Maksimal 5MB."
      } else if (error.message.includes("400")) {
        errorMessage = "Data tidak valid. Periksa kembali form Anda."
      } else if (error.message.includes("500")) {
        errorMessage = "Server sedang bermasalah. Silakan coba lagi nanti."
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      }

      showMessage(errorMessage, "error")
    } finally {
      hideLoading()
    }
  }

  resetForm() {
    // Reset form fields
    const form = document.getElementById("add-story-form")
    if (form) {
      form.reset()
    }

    // Reset photo
    this.removePhoto()

    // Reset location
    this.currentLocation = null
    const locationInfo = document.getElementById("location-info")
    if (locationInfo) {
      locationInfo.innerHTML = `<p>📍 Lokasi belum dipilih</p>`
    }

    // Clear map markers
    if (this.mapManager.map) {
      this.mapManager.clearMarkers()
    }
  }

  cleanup() {
    // Close camera if open
    this.closeCamera()

    // Destroy map
    if (this.mapManager) {
      this.mapManager.destroy()
    }
  }
}
