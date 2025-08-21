import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

// Impor semua komponen halaman (views) Anda
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import GeneratorPage from '../views/GeneratorPage.vue';
import HistoryPage from '../views/HistoryPage.vue';
import PreviewPage from '../views/PreviewPage.vue';
// --- Impor halaman baru untuk admin ---
import AdminTemplateManager from '../views/admin/AdminTemplateManager.vue';

// Definisikan semua rute aplikasi
const routes = [
  {
    path: '/',
    redirect: '/generator' // Arahkan halaman utama ke generator
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  {
    path: '/generator',
    name: 'Generator',
    component: GeneratorPage,
    meta: { requiresAuth: true } // Halaman ini butuh login
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryPage,
    meta: { requiresAuth: true } // Halaman ini butuh login
  },
  {
    path: '/preview/:id?', // Asumsi preview butuh ID
    name: 'Preview',
    component: PreviewPage,
    props: true, // Mengirimkan 'id' sebagai prop ke komponen
    meta: { requiresAuth: true } // Halaman ini butuh login
  },
  // --- RUTE BARU UNTUK ADMIN ---
  {
    path: '/admin/templates',
    name: 'AdminTemplateManager',
    component: AdminTemplateManager,
    // Meta ini memberitahu navigation guard aturan untuk halaman ini
    meta: { 
      requiresAuth: true,    // Harus login
      requiresAdmin: true    // Harus menjadi admin
    }
  },
];

// Buat instance router
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// --- NAVIGATION GUARD ---
// Ini adalah "satpam" yang akan berjalan setiap kali pengguna mencoba pindah halaman.
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Cek apakah data user sudah ada di state. Jika belum (misalnya karena refresh),
  // dan ada token, coba ambil data user dari backend.
  if (authStore.token && !authStore.user.username) {
    try {
      await authStore.fetchUser();
    } catch (error) {
      // fetchUser sudah menangani logout jika token tidak valid
      // jadi tidak perlu melakukan apa-apa di sini.
    }
  }

  const isAuthenticated = authStore.isLoggedIn;
  const isAdmin = authStore.isAdmin;

  // 1. Cek rute yang membutuhkan login
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Jika pengguna belum login, lempar ke halaman Login.
    // Simpan halaman tujuan agar bisa kembali setelah login berhasil.
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // 2. Cek rute yang membutuhkan peran admin
  if (to.meta.requiresAdmin && !isAdmin) {
    // Jika pengguna sudah login tapi bukan admin,
    // lempar ke halaman utama (generator) atau halaman "Akses Ditolak".
    console.warn('Akses ditolak: Rute ini hanya untuk admin.');
    return next({ name: 'Generator' }); 
  }

  // 3. Jika semua aturan terpenuhi, izinkan pengguna melanjutkan.
  next();
});

export default router;