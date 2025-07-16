import { createRouter, createWebHistory } from 'vue-router'
import GeneratorPage from '../views/GeneratorPage.vue'
import HistoryPage from '../views/HistoryPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'generator',
      component: GeneratorPage
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryPage
    }
  ]
})

export default router