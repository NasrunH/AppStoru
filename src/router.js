import { HomePresenter } from "./presenters/HomePresenter.js"
import { LoginPresenter } from "./presenters/LoginPresenter.js"
import { AddStoryPresenter } from "./presenters/AddStoryPresenter.js"
import { FavoritesPresenter } from "./presenters/FavoritesPresenter.js"
import { OfflineStoriesPresenter } from "./presenters/OfflineStoriesPresenter.js"

export class Router {
  constructor() {
    this.routes = {
      "#/": "home",
      "#/login": "login",
      "#/add": "addStory",
      "#/favorites": "favorites",
      "#/offline": "offline",
    }
    this.currentPresenter = null
  }

  init() {
    window.addEventListener("hashchange", () => {
      this.handleRouteChange()
    })

    // Handle initial route
    this.handleRouteChange()
  }

  handleRouteChange() {
    const hash = window.location.hash || "#/"
    const route = this.routes[hash]

    // Clean up current presenter if exists
    if (this.currentPresenter && this.currentPresenter.cleanup) {
      this.currentPresenter.cleanup()
    }

    // Get auth model and story model from app
    const authModel = window.app.authModel
    const storyModel = window.app.storyModel

    // Check authentication for protected routes
    if ((route === "addStory" || route === "favorites" || route === "offline") && !authModel.isAuthenticated()) {
      window.location.hash = "#/login"
      return
    }

    // Route to appropriate presenter
    switch (route) {
      case "home":
        this.currentPresenter = new HomePresenter(authModel, storyModel)
        break
      case "login":
        this.currentPresenter = new LoginPresenter(authModel, storyModel)
        break
      case "addStory":
        this.currentPresenter = new AddStoryPresenter(authModel, storyModel)
        break
      case "favorites":
        this.currentPresenter = new FavoritesPresenter(authModel, storyModel)
        break
      case "offline":
        this.currentPresenter = new OfflineStoriesPresenter(authModel, storyModel)
        break
      default:
        // Handle 404 - route not found
        this.handle404()
        return
    }

    // Initialize the presenter
    this.currentPresenter.init()
  }

  handle404() {
    document.getElementById("page-content").innerHTML = `
      <div class="empty-state">
        <h2>404 - Halaman Tidak Ditemukan</h2>
        <p>Maaf, halaman yang Anda cari tidak ditemukan.</p>
        <button class="btn" onclick="window.location.hash='#/'">
          Kembali ke Home
        </button>
      </div>
    `
  }

  navigate(hash) {
    window.location.hash = hash
  }
}
