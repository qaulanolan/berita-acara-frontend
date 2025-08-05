import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import router from './router' // Impor router

import './assets/main.css' // Opsional, untuk styling dasar

const app = createApp(App)

// 1. Buat instance Pinia dan GUNAKAN SEBELUM ROUTER
const pinia = createPinia()
app.use(pinia)

// 2. GUNAKAN ROUTER SETELAH PINIA
app.use(router)


app.mount('#app')