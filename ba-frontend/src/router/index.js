import { createRouter, createWebHistory } from 'vue-router'
import GeneratorPage from '../views/GeneratorPage.vue'
import HistoryPage from '../views/HistoryPage.vue'
import PreviewPage from '../views/PreviewPage.vue'

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
    },
    {
      path: '/preview',
      name: 'preview',
      component: PreviewPage// sesuaikan path
    }
  ]
})

export default router