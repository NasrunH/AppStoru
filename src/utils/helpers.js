export const formatDate = (dateString) => {
  try {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString("id-ID", options)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Tanggal tidak valid"
  }
}

export const showLoading = () => {
  const loading = document.getElementById("loading")
  if (loading) loading.style.display = "block"
}

export const hideLoading = () => {
  const loading = document.getElementById("loading")
  if (loading) loading.style.display = "none"
}

export const showMessage = (message, type = "error") => {
  const existingMessage = document.querySelector(".message")
  if (existingMessage) {
    existingMessage.remove()
  }

  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.textContent = message

  const container = document.querySelector(".container")
  if (container) {
    container.insertBefore(messageDiv, container.firstChild)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove()
      }
    }, 5000)
  }
}

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validateFile = (file) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
  const maxSize = 1024 * 1024 // 1MB

  console.log("🔍 Validating file:", {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeKB: (file.size / 1024).toFixed(1),
  })

  if (!allowedTypes.includes(file.type)) {
    throw new Error("File harus berupa gambar (JPEG, JPG, PNG)")
  }

  if (file.size > maxSize) {
    throw new Error(`Ukuran file terlalu besar (${(file.size / 1024).toFixed(1)} KB). Maksimal 1MB.`)
  }

  if (file.size < 1024) {
    // Less than 1KB might be corrupted
    throw new Error("File terlalu kecil atau rusak")
  }

  return true
}
