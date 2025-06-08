export class LoginView {
  render(isLoginMode = true) {
    const title = isLoginMode ? "Masuk" : "Daftar"
    const subtitle = isLoginMode ? "Masuk ke akun Anda" : "Buat akun baru"
    const buttonText = isLoginMode ? "🔑 Masuk" : "📝 Daftar"
    const toggleText = isLoginMode ? "Belum punya akun?" : "Sudah punya akun?"
    const toggleButtonText = isLoginMode ? "Daftar di sini" : "Masuk di sini"

    return `
      <div class="auth-page">
        <div class="form-container">
          <div class="auth-header">
            <h2>${title}</h2>
            <p class="auth-subtitle">${subtitle}</p>
          </div>

          <form id="auth-form">
            ${
              !isLoginMode
                ? `
              <div class="form-group">
                <label for="name">Nama Lengkap *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  placeholder="Masukkan nama lengkap Anda"
                  required
                  maxlength="100"
                >
              </div>
            `
                : ""
            }

            <div class="form-group">
              <label for="email">Email *</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="contoh@email.com"
                required
              >
            </div>

            <div class="form-group">
              <label for="password">Password *</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Minimal 8 karakter"
                required
                minlength="8"
              >
              <small>Password minimal 8 karakter</small>
            </div>

            <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">
              ${buttonText}
            </button>
          </form>

          <div class="auth-footer">
            <p>${toggleText}</p>
            <button type="button" id="toggle-mode" class="link-btn">
              ${toggleButtonText}
            </button>
          </div>

          ${
            isLoginMode
              ? `
            <div class="guest-option">
              <p>Atau jelajahi sebagai tamu</p>
              <button type="button" id="guest-btn" class="btn btn-secondary" style="width: 100%;">
                👤 Masuk sebagai Tamu
              </button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `
  }
}
