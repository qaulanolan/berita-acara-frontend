import { createRouter, createWebHistory } from 'vue-router';
import GeneratorPage from '../views/GeneratorPage.vue';
import HistoryPage from '../views/HistoryPage.vue';
import PreviewPage from '../views/PreviewPage.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';

import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    name: 'generator',
    component: GeneratorPage,
    meta: { requiresAuth: true } 
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryPage,
    meta: { requiresAuth: true } 
  },
  {
    path: '/preview',
    name: 'preview',
    component: PreviewPage,
    meta: { requiresAuth: true } 
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;