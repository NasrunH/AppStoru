export class AuthModel {
  constructor() {
    this.baseURL = "https://story-api.dicoding.dev/v1"
    this.token = localStorage.getItem("token")
    this.user = this.getCurrentUser()
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      ...options,
    }

    // Add Authorization header if token exists and not skipped
    if (this.token && !options.skipAuth) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
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

  async register(name, email, password) {
    const response = await this.request("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
      skipAuth: true,
    })
    return response
  }

  async login(email, password) {
    const response = await this.request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    })

    if (response.loginResult && response.loginResult.token) {
      this.token = response.loginResult.token
      this.user = response.loginResult
      localStorage.setItem("token", this.token)
      localStorage.setItem("user", JSON.stringify(response.loginResult))
    }

    return response
  }

  logout() {
    this.token = null
    this.user = null
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  isAuthenticated() {
    return !!this.token
  }

  getCurrentUser() {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  }

  getToken() {
    return this.token
  }
}
