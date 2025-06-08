// Offline Manager untuk Story App
import IndexedDBHelper from "./indexedDB.js"

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.syncInProgress = false
    this.init()
  }

  init() {
    console.log("OfflineManager: Initializing...")

    // Listen for online/offline events
    window.addEventListener("online", () => {
      console.log("OfflineManager: Connection restored")
      this.isOnline = true
      this.updateOnlineStatus()
      this.syncPendingActions()
    })

    window.addEventListener("offline", () => {
      console.log("OfflineManager: Connection lost")
      this.isOnline = false
      this.updateOnlineStatus()
    })

    // Listen for service worker messages
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_STORIES") {
          this.syncPendingActions()
        }
      })
    }

    this.updateOnlineStatus()
  }

  updateOnlineStatus() {
    const offlineIndicator = document.getElementById("offline-indicator")

    if (offlineIndicator) {
      if (this.isOnline) {
        offlineIndicator.classList.remove("show")
      } else {
        offlineIndicator.classList.add("show")
      }
    }
  }

  async saveStoryOffline(storyData) {
    try {
      console.log("OfflineManager: Saving story offline", storyData)

      // Add story to IndexedDB
      await IndexedDBHelper.addStory(storyData)

      // Add pending action if offline
      if (!this.isOnline) {
        await IndexedDBHelper.addPendingAction({
          type: "ADD_STORY",
          data: storyData,
        })
        console.log("OfflineManager: Added pending action for story")
      }

      return true
    } catch (error) {
      console.error("OfflineManager: Failed to save story offline:", error)
      return false
    }
  }

  async getStoriesOffline() {
    try {
      const stories = await IndexedDBHelper.getAllStories()
      console.log("OfflineManager: Retrieved offline stories", stories.length)
      return stories || []
    } catch (error) {
      console.error("OfflineManager: Failed to get offline stories:", error)
      return []
    }
  }

  async deleteStoryOffline(storyId) {
    try {
      await IndexedDBHelper.deleteStory(storyId)

      if (!this.isOnline) {
        await IndexedDBHelper.addPendingAction({
          type: "DELETE_STORY",
          data: { id: storyId },
        })
      }

      return true
    } catch (error) {
      console.error("OfflineManager: Failed to delete story offline:", error)
      return false
    }
  }

  async syncPendingActions() {
    if (!this.isOnline || this.syncInProgress) {
      return
    }

    this.syncInProgress = true
    this.showSyncIndicator()

    try {
      console.log("OfflineManager: Starting sync...")

      const pendingActions = await IndexedDBHelper.getPendingActions()
      console.log("OfflineManager: Found pending actions", pendingActions.length)

      for (const action of pendingActions) {
        try {
          await this.executeAction(action)
        } catch (error) {
          console.error("OfflineManager: Failed to sync action:", action, error)
          // Continue with other actions even if one fails
        }
      }

      // Clear pending actions after successful sync
      await IndexedDBHelper.clearPendingActions()
      console.log("OfflineManager: Sync completed successfully")
    } catch (error) {
      console.error("OfflineManager: Sync failed:", error)
    } finally {
      this.syncInProgress = false
      this.hideSyncIndicator()
    }
  }

  async executeAction(action) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No auth token available for sync")
    }

    switch (action.type) {
      case "ADD_STORY":
        await this.syncStoryToServer(action.data, token)
        break
      case "DELETE_STORY":
        await this.syncDeleteToServer(action.data.id, token)
        break
      default:
        console.warn("OfflineManager: Unknown action type:", action.type)
    }
  }

  async syncStoryToServer(storyData, token) {
    try {
      const formData = new FormData()
      formData.append("description", storyData.description)

      // Handle photo data
      if (storyData.photo) {
        if (storyData.photo instanceof File) {
          formData.append("photo", storyData.photo)
        } else if (storyData.photoUrl) {
          // If we have a photo URL, we need to fetch and convert it
          const response = await fetch(storyData.photoUrl)
          const blob = await response.blob()
          formData.append("photo", blob, "story-photo.jpg")
        }
      }

      if (storyData.lat && storyData.lon) {
        formData.append("lat", storyData.lat.toString())
        formData.append("lon", storyData.lon.toString())
      }

      const response = await fetch("https://story-api.dicoding.dev/v1/stories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to sync story: ${response.status}`)
      }

      console.log("OfflineManager: Story synced to server successfully")
    } catch (error) {
      console.error("OfflineManager: Failed to sync story to server:", error)
      throw error
    }
  }

  async syncDeleteToServer(storyId, token) {
    try {
      const response = await fetch(`https://story-api.dicoding.dev/v1/stories/${storyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to sync deletion: ${response.status}`)
      }

      console.log("OfflineManager: Story deletion synced successfully")
    } catch (error) {
      console.error("OfflineManager: Failed to sync deletion:", error)
      throw error
    }
  }

  async cacheStoriesFromAPI(stories) {
    try {
      for (const story of stories) {
        // Only cache if not already exists
        const existing = await IndexedDBHelper.getStoryById(story.id)
        if (!existing) {
          await IndexedDBHelper.addStory({
            ...story,
            isOffline: false,
          })
        }
      }
      console.log("OfflineManager: Stories cached successfully")
    } catch (error) {
      console.error("OfflineManager: Failed to cache stories:", error)
    }
  }

  showSyncIndicator() {
    const syncIndicator = document.getElementById("sync-indicator")
    if (syncIndicator) {
      syncIndicator.style.display = "block"
    }
  }

  hideSyncIndicator() {
    const syncIndicator = document.getElementById("sync-indicator")
    if (syncIndicator) {
      syncIndicator.style.display = "none"
    }
  }

  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    }
  }

  async forcSync() {
    if (this.isOnline) {
      await this.syncPendingActions()
    }
  }
}

export default new OfflineManager()
