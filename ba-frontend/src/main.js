import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Impor router

import './assets/main.css' // Opsional, untuk styling dasar

const app = createApp(App)

app.use(router) // Gunakan router

app.mount('#app')