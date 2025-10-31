import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Automatically update to new version for seamless experience
    updateSW(true)
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

const app = createApp(App)
app.use(router)
app.mount('#app')
