// Push Notification utility dengan VAPID key yang benar
class PushNotificationHelper {
  constructor() {
    // VAPID public key dari dokumentasi API Dicoding
    this.vapidPublicKey = "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"
    this.isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    this.subscription = null
  }

  async init() {
    console.log("🔔 PushNotification: Initializing...")

    if (!this.isSupported) {
      console.warn("🔔 PushNotification: Not supported in this browser")
      return false
    }

    try {
      // Register service worker if not already registered
      if (!navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("🔔 PushNotification: Service Worker registered")
      }

      return true
    } catch (error) {
      console.error("🔔 PushNotification: Failed to initialize:", error)
      return false
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      console.log("🔔 PushNotification: Permission status:", permission)
      return permission === "granted"
    } catch (error) {
      console.error("🔔 PushNotification: Error requesting permission:", error)
      return false
    }
  }

  async subscribe() {
    if (!this.isSupported || !this.vapidPublicKey) {
      console.warn("🔔 PushNotification: Cannot subscribe - not supported or no VAPID key")
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        console.log("🔔 PushNotification: Already subscribed")
        this.subscription = existingSubscription

        // Still send to server in case it's not registered there
        await this.sendSubscriptionToServer(existingSubscription)
        return existingSubscription
      }

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      })

      console.log("🔔 PushNotification: New subscription created")
      this.subscription = subscription

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)

      return subscription
    } catch (error) {
      console.error("🔔 PushNotification: Failed to subscribe:", error)
      return null
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("🔔 PushNotification: No auth token for sending subscription")
        return false
      }

      // Convert subscription to the format expected by the API
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      }

      const response = await fetch("https://story-api.dicoding.dev/v1/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptionData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("🔔 PushNotification: Subscription sent to server successfully", data)
        return true
      } else {
        const errorData = await response.text()
        console.warn("🔔 PushNotification: Failed to send subscription to server:", response.status, errorData)
        return false
      }
    } catch (error) {
      console.error("🔔 PushNotification: Error sending subscription to server:", error)
      return false
    }
  }

  async unsubscribe() {
    if (!this.isSupported) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from server first
        await this.unsubscribeFromServer(subscription)

        // Then unsubscribe locally
        await subscription.unsubscribe()
        this.subscription = null
        console.log("🔔 PushNotification: Unsubscribed successfully")
        return true
      }

      return false
    } catch (error) {
      console.error("🔔 PushNotification: Failed to unsubscribe:", error)
      return false
    }
  }

  async unsubscribeFromServer(subscription) {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("🔔 PushNotification: No auth token for unsubscribing")
        return
      }

      const response = await fetch("https://story-api.dicoding.dev/v1/notifications/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      })

      if (response.ok) {
        console.log("🔔 PushNotification: Unsubscribed from server successfully")
      } else {
        console.warn("🔔 PushNotification: Failed to unsubscribe from server:", response.status)
      }
    } catch (error) {
      console.error("🔔 PushNotification: Error unsubscribing from server:", error)
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  async getSubscriptionStatus() {
    if (!this.isSupported) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      return !!subscription
    } catch (error) {
      console.error("🔔 PushNotification: Failed to get subscription status:", error)
      return false
    }
  }

  async showTestNotification() {
    if (!this.isSupported) {
      console.warn("🔔 PushNotification: Notifications not supported")
      return
    }

    const permission = await this.requestPermission()
    if (!permission) {
      console.warn("🔔 PushNotification: Permission denied")
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready

      await registration.showNotification("Story App - Notifikasi Aktif! 🎉", {
        body: "Push notifications berhasil diaktifkan untuk Story App Dicoding",
        icon: "/android-icon-192x192.png",
        badge: "/android-icon-72x72.png",
        tag: "test-notification",
        vibrate: [100, 50, 100],
        data: {
          url: "/",
        },
        actions: [
          {
            action: "view",
            title: "Buka App",
            icon: "/android-icon-192x192.png",
          },
          {
            action: "close",
            title: "Tutup",
            icon: "/android-icon-192x192.png",
          },
        ],
      })

      console.log("🔔 PushNotification: Test notification shown")
    } catch (error) {
      console.error("🔔 PushNotification: Failed to show test notification:", error)
    }
  }
}

export default new PushNotificationHelper()
