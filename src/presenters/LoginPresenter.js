import { LoginView } from "../views/LoginView.js"
import { showLoading, hideLoading, showMessage } from "../utils/helpers.js"

export class LoginPresenter {
  constructor(authModel, storyModel) {
    this.authModel = authModel
    this.storyModel = storyModel
    this.view = new LoginView()
    this.isLoginMode = true
  }

  async init() {
    // Redirect if already authenticated
    if (this.authModel.isAuthenticated()) {
      window.location.hash = "#/"
      return
    }

    await this.render()
    this.bindEvents()
  }

  async render() {
    const content = this.view.render(this.isLoginMode)
    document.getElementById("page-content").innerHTML = content
  }

  bindEvents() {
    const form = document.getElementById("auth-form")
    const toggleBtn = document.getElementById("toggle-mode")
    const guestBtn = document.getElementById("guest-btn")

    form?.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSubmit()
    })

    toggleBtn?.addEventListener("click", () => {
      this.toggleMode()
    })

    guestBtn?.addEventListener("click", () => {
      this.handleGuestMode()
    })
  }

  async handleSubmit() {
    try {
      const email = document.getElementById("email")?.value?.trim()
      const password = document.getElementById("password")?.value
      const name = document.getElementById("name")?.value?.trim()

      // Validation
      if (!email || !password) {
        showMessage("Email dan password harus diisi", "error")
        return
      }

      if (!this.isLoginMode && !name) {
        showMessage("Nama harus diisi", "error")
        return
      }

      if (!this.isValidEmail(email)) {
        showMessage("Format email tidak valid", "error")
        return
      }

      if (password.length < 8) {
        showMessage("Password minimal 8 karakter", "error")
        return
      }

      showLoading()

      let response
      if (this.isLoginMode) {
        response = await this.authModel.login(email, password)
      } else {
        response = await this.authModel.register(name, email, password)
      }

      if (response && !response.error) {
        const action = this.isLoginMode ? "Login" : "Registrasi"
        showMessage(`${action} berhasil! Selamat datang! 🎉`, "success")

        // Update auth state
        window.app.updateAuthState()

        // Navigate to home
        setTimeout(() => {
          window.location.hash = "#/"
        }, 1500)
      } else {
        throw new Error(response?.message || `Gagal ${this.isLoginMode ? "login" : "registrasi"}`)
      }
    } catch (error) {
      console.error("Auth error:", error)

      let errorMessage = `Gagal ${this.isLoginMode ? "login" : "registrasi"}`

      if (error.message.includes("401") || error.message.includes("Invalid")) {
        errorMessage = "Email atau password salah"
      } else if (error.message.includes("400")) {
        errorMessage = "Data tidak valid. Periksa kembali form Anda."
      } else if (error.message.includes("409") || error.message.includes("already")) {
        errorMessage = "Email sudah terdaftar. Silakan gunakan email lain."
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

  toggleMode() {
    this.isLoginMode = !this.isLoginMode
    this.render()
    this.bindEvents()
  }

  handleGuestMode() {
    // For now, just show a message about guest limitations
    showMessage(
      "Mode tamu: Anda dapat melihat cerita tetapi tidak dapat menambah cerita atau menggunakan fitur PWA",
      "info",
    )

    // Navigate to home without authentication
    window.location.hash = "#/"
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  cleanup() {
    // Clean up any resources
  }
}
