// IndexedDB utility untuk Story App
class IndexedDBHelper {
  constructor() {
    this.dbName = "StoryAppDB"
    this.version = 1
    this.db = null
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error("IndexedDB: Error opening database", request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log("IndexedDB: Database opened successfully")
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        console.log("IndexedDB: Upgrading database")
        const db = event.target.result

        // Create stories object store
        if (!db.objectStoreNames.contains("stories")) {
          const storiesStore = db.createObjectStore("stories", { keyPath: "id" })
          storiesStore.createIndex("name", "name", { unique: false })
          storiesStore.createIndex("createdAt", "createdAt", { unique: false })
          storiesStore.createIndex("savedAt", "savedAt", { unique: false })
          console.log("IndexedDB: Stories store created")
        }

        // Create favorites object store
        if (!db.objectStoreNames.contains("favorites")) {
          const favoritesStore = db.createObjectStore("favorites", { keyPath: "id" })
          favoritesStore.createIndex("storyId", "storyId", { unique: false })
          favoritesStore.createIndex("addedAt", "addedAt", { unique: false })
          console.log("IndexedDB: Favorites store created")
        }

        // Create pending actions object store
        if (!db.objectStoreNames.contains("pendingActions")) {
          const actionsStore = db.createObjectStore("pendingActions", { keyPath: "id", autoIncrement: true })
          actionsStore.createIndex("type", "type", { unique: false })
          actionsStore.createIndex("timestamp", "timestamp", { unique: false })
          console.log("IndexedDB: Pending actions store created")
        }

        // Create user preferences object store
        if (!db.objectStoreNames.contains("userPreferences")) {
          const prefsStore = db.createObjectStore("userPreferences", { keyPath: "key" })
          console.log("IndexedDB: User preferences store created")
        }
      }
    })
  }

  async addStory(story) {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readwrite")
      const store = transaction.objectStore("stories")

      const storyWithTimestamp = {
        ...story,
        savedAt: new Date().toISOString(),
        isOffline: true,
      }

      const request = store.put(storyWithTimestamp)

      request.onsuccess = () => {
        console.log("IndexedDB: Story added successfully", story.id)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("IndexedDB: Error adding story", request.error)
        reject(request.error)
      }
    })
  }

  async getAllStories() {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readonly")
      const store = transaction.objectStore("stories")
      const request = store.getAll()

      request.onsuccess = () => {
        console.log("IndexedDB: Retrieved all stories", request.result.length)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("IndexedDB: Error getting stories", request.error)
        reject(request.error)
      }
    })
  }

  async getStoryById(id) {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readonly")
      const store = transaction.objectStore("stories")
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async deleteStory(id) {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readwrite")
      const store = transaction.objectStore("stories")
      const request = store.delete(id)

      request.onsuccess = () => {
        console.log("IndexedDB: Story deleted", id)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("IndexedDB: Error deleting story", request.error)
        reject(request.error)
      }
    })
  }

  async addToFavorites(story) {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["favorites"], "readwrite")
      const store = transaction.objectStore("favorites")

      const favorite = {
        id: `fav_${story.id}`,
        storyId: story.id,
        story: story,
        addedAt: new Date().toISOString(),
      }

      const request = store.put(favorite)

      request.onsuccess = () => {
        console.log("IndexedDB: Added to favorites", story.id)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("IndexedDB: Error adding to favorites", request.error)
        reject(request.error)
      }
    })
  }

  async getFavorites() {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["favorites"], "readonly")
      const store = transaction.objectStore("favorites")
      const request = store.getAll()

      request.onsuccess = () => {
        console.log("IndexedDB: Retrieved favorites", request.result.length)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("IndexedDB: Error getting favorites", request.error)
        reject(request.error)
      }
    })
  }

  async removeFromFavorites(storyId) {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["favorites"], "readwrite")
      const store = transaction.objectStore("favorites")
      const request = store.delete(`fav_${storyId}`)

      request.onsuccess = () => {
        console.log("IndexedDB: Removed from favorites", storyId)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("IndexedDB: Error removing from favorites", request.error)
        reject(request.error)
      }
    })
  }

  async addPendingAction(action) {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["pendingActions"], "readwrite")
      const store = transaction.objectStore("pendingActions")

      const actionWithTimestamp = {
        ...action,
        timestamp: Date.now(),
      }

      const request = store.add(actionWithTimestamp)

      request.onsuccess = () => {
        console.log("IndexedDB: Pending action added", action.type)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error("IndexedDB: Error adding pending action", request.error)
        reject(request.error)
      }
    })
  }

  async getPendingActions() {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["pendingActions"], "readonly")
      const store = transaction.objectStore("pendingActions")
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async clearPendingActions() {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["pendingActions"], "readwrite")
      const store = transaction.objectStore("pendingActions")
      const request = store.clear()

      request.onsuccess = () => {
        console.log("IndexedDB: Pending actions cleared")
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async saveUserPreference(key, value) {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["userPreferences"], "readwrite")
      const store = transaction.objectStore("userPreferences")
      const request = store.put({ key, value })

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async getUserPreference(key) {
    if (!this.db) await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["userPreferences"], "readonly")
      const store = transaction.objectStore("userPreferences")
      const request = store.get(key)

      request.onsuccess = () => {
        resolve(request.result?.value)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async clearAllData() {
    if (!this.db) await this.openDB()

    const stores = ["stories", "favorites", "pendingActions", "userPreferences"]
    const promises = stores.map((storeName) => {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })

    return Promise.all(promises)
  }
}

export default new IndexedDBHelper()
