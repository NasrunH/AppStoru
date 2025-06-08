export class StoryModel {
  constructor() {
    this.baseURL = "https://story-api.dicoding.dev/v1"
    this.stories = []
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      ...options,
    }

    // Add Authorization header if token exists and not skipped
    const token = localStorage.getItem("token")
    if (token && !options.skipAuth) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    // Add Content-Type for JSON requests
    if (options.body && typeof options.body === "string") {
      config.headers = {
        "Content-Type": "application/json",
        ...config.headers,
      }
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()

      if (data.error === true) {
        throw new Error(data.message || "API returned an error")
      }

      return data
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.")
      }

      if (error.name === "SyntaxError") {
        throw new Error("Server mengembalikan response yang tidak valid.")
      }

      throw error
    }
  }

  async getStories(page = 1, size = 20, location = 1) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        location: location.toString(),
      })

      const response = await this.request(`/stories?${params}`)

      if (response && response.listStory) {
        this.stories = response.listStory

        // Cache stories to IndexedDB for offline access
        if (window.OfflineManager) {
          await window.OfflineManager.cacheStoriesFromAPI(response.listStory)
        }

        return {
          error: false,
          message: "Stories fetched successfully",
          data: {
            listStory: response.listStory,
          },
        }
      }

      this.stories = []
      return {
        error: false,
        message: "Stories fetched successfully",
        data: {
          listStory: [],
        },
      }
    } catch (error) {
      console.error("❌ Error in getStories:", error)

      // If offline, try to get from IndexedDB
      if (!navigator.onLine && window.IndexedDBHelper) {
        try {
          const offlineStories = await window.IndexedDBHelper.getAllStories()
          return {
            error: false,
            message: "Stories loaded from offline storage",
            data: {
              listStory: offlineStories,
            },
          }
        } catch (dbError) {
          console.error("Failed to load offline stories:", dbError)
        }
      }

      throw error
    }
  }

  async getStoryDetail(id) {
    try {
      const response = await this.request(`/stories/${id}`)
      return response
    } catch (error) {
      console.error("❌ Error in getStoryDetail:", error)

      // If offline, try to get from IndexedDB
      if (!navigator.onLine && window.IndexedDBHelper) {
        try {
          const story = await window.IndexedDBHelper.getStoryById(id)
          if (story) {
            return {
              error: false,
              message: "Story loaded from offline storage",
              story: story,
            }
          }
        } catch (dbError) {
          console.error("Failed to load offline story:", dbError)
        }
      }

      throw error
    }
  }

  async addStory(description, photo, lat = null, lon = null) {
    try {
      const formData = new FormData()
      formData.append("description", description)
      formData.append("photo", photo)

      if (lat !== null && lon !== null) {
        formData.append("lat", lat.toString())
        formData.append("lon", lon.toString())
      }

      // Try to add to server first
      if (navigator.onLine) {
        const response = await this.request("/stories", {
          method: "POST",
          body: formData,
        })

        console.log("✅ Story uploaded to server successfully")
        return response
      } else {
        // If offline, save to IndexedDB for later sync
        const storyData = {
          id: `offline_${Date.now()}`,
          description: description,
          photo: photo,
          lat: lat,
          lon: lon,
          createdAt: new Date().toISOString(),
          name: JSON.parse(localStorage.getItem("user"))?.name || "Anonymous",
          photoUrl: URL.createObjectURL(photo), // Temporary URL for preview
          isOffline: true,
        }

        if (window.OfflineManager) {
          await window.OfflineManager.saveStoryOffline(storyData)
        }

        console.log("💾 Story saved offline for later sync")
        return {
          error: false,
          message: "Story saved offline. Will sync when online.",
        }
      }
    } catch (error) {
      console.error("❌ Error in addStory:", error)

      // If upload failed but we have data, save offline
      if (navigator.onLine) {
        try {
          const storyData = {
            id: `offline_${Date.now()}`,
            description: description,
            photo: photo,
            lat: lat,
            lon: lon,
            createdAt: new Date().toISOString(),
            name: JSON.parse(localStorage.getItem("user"))?.name || "Anonymous",
            photoUrl: URL.createObjectURL(photo),
            isOffline: true,
            failedUpload: true,
          }

          if (window.OfflineManager) {
            await window.OfflineManager.saveStoryOffline(storyData)
          }

          console.log("💾 Story saved offline due to upload failure")
          return {
            error: false,
            message: "Upload failed. Story saved offline for retry.",
          }
        } catch (dbError) {
          console.error("Failed to save story offline:", dbError)
        }
      }

      throw error
    }
  }

  async addStoryGuest(description, photo, lat = null, lon = null) {
    try {
      const formData = new FormData()
      formData.append("description", description)
      formData.append("photo", photo)

      if (lat !== null && lon !== null) {
        formData.append("lat", lat.toString())
        formData.append("lon", lon.toString())
      }

      return await this.request("/stories/guest", {
        method: "POST",
        body: formData,
        skipAuth: true,
      })
    } catch (error) {
      console.error("❌ Error in addStoryGuest:", error)
      throw error
    }
  }

  async testConnection() {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(this.baseURL + "/stories", {
        method: "HEAD",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  getStoriesData() {
    return this.stories
  }
}
