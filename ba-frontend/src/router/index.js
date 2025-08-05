import { createRouter, createWebHistory } from 'vue-router';
import GeneratorPage from '../views/GeneratorPage.vue';
import HistoryPage from '../views/HistoryPage.vue';
import PreviewPage from '../views/PreviewPage.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';

// 1. Impor store otentikasi Anda
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    name: 'generator',
    component: GeneratorPage,
    meta: { requiresAuth: true } // Tandai halaman ini memerlukan login
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryPage,
    meta: { requiresAuth: true } // Tandai halaman ini memerlukan login
  },
  {
    path: '/preview',
    name: 'preview',
    component: PreviewPage,
    meta: { requiresAuth: true } // Tandai halaman ini memerlukan login
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

// --- PENERAPAN router.beforeEach DI SINI ---
router.beforeEach((to, _from, next) => {
  // 2. Dapatkan akses ke auth store
  const authStore = useAuthStore();

  // 3. Cek apakah halaman yang dituju (to) memerlukan otentikasi
  //    DAN apakah pengguna belum login
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Jika ya, arahkan ke halaman login
    next({ name: 'login' });
  } else {
    // Jika tidak, izinkan navigasi
    next();
  }
});

export default router;