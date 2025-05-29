import { showLoading, hideLoading, showMessage } from "../utils/helpers.js"

export class AuthPresenter {
  constructor(authModel) {
    this.authModel = authModel
  }

  async login(email, password) {
    try {
      showLoading()
      const response = await this.authModel.login(email, password)
      showMessage(`Selamat datang, ${response.loginResult.name}! 🎉`, "success")
      return response
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      hideLoading()
    }
  }

  async register(name, email, password) {
    try {
      showLoading()
      const response = await this.authModel.register(name, email, password)
      showMessage("Pendaftaran berhasil! Silakan masuk dengan akun Anda.", "success")
      return response
    } catch (error) {
      console.error("Register error:", error)
      throw error
    } finally {
      hideLoading()
    }
  }

  logout() {
    this.authModel.logout()
  }

  isAuthenticated() {
    return this.authModel.isAuthenticated()
  }

  getCurrentUser() {
    return this.authModel.getCurrentUser()
  }
}
