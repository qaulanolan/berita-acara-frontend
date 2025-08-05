import { defineStore } from 'pinia';
import apiClient from '@/services/api';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  // Mencoba mengambil token dari localStorage saat store pertama kali dibuat
  const token = ref(localStorage.getItem('token') || null);
  // State untuk menyimpan informasi pengguna, jika diperlukan
  // Bisa diisi dengan data user yang didapat dari endpoint /auth/user
  const user = ref(null); // Bisa diisi dengan info user jika endpoint-nya ada
  const isLoading = ref(false);

  // Inisialisasi router untuk navigasi
  const router = useRouter();

  // --- GETTERS ---
  // Getter untuk memeriksa apakah pengguna sudah login
  const isLoggedIn = computed(() => !!token.value);

  // --- ACTIONS ---

  // Fungsi baru untuk mengambil data user
  async function fetchUser() {
    if (token.value) {
      try {
        // Atur header otorisasi sebelum memanggil endpoint
        // axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
        const response = await apiClient.get('http://localhost:8080/auth/me');
        user.value = response.data;
      } catch (error) {
        // Jika token tidak valid, logout
        console.error("Gagal mengambil data user:", error);
        logout();
      }
    }
  }

  // Fungsi untuk menangani login
  async function login(username, password) {
    isLoading.value = true;
    try {
      // Panggil endpoint /auth/login di backend
      const response = await apiClient.post('http://localhost:8080/auth/login', {
        username: username,
        password: password
      });
      
      const receivedToken = response.data;
      token.value = receivedToken;

      // Simpan token ke localStorage agar tetap login setelah refresh
      localStorage.setItem('token', receivedToken);

      await fetchUser(); // Ambil data user setelah login berhasil

      // Atur header Authorization untuk semua permintaan axios selanjutnya
    //   axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;

    } catch (error) {
      // Jika gagal, bersihkan token dan lempar error agar bisa ditangani di halaman login
      logout();
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  // Fungsi untuk menangani logout
  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    // delete axios.defaults.headers.common['Authorization'];
    // Arahkan kembali ke halaman login
    router.push('/login');
  }

  // Fungsi untuk menangani registrasi
  async function register(username, password) {
    isLoading.value = true;
    try {
      const response = await apiClient.post('http://localhost:8080/auth/register', {
        username: username,
        password: password
      });
      return response.data.message;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Terjadi kesalahan saat registrasi.');
    } finally {
      isLoading.value = false;
    }
  }

  // Return semua state, getter, dan action agar bisa digunakan di komponen lain
  return {
    token,
    user,
    isLoading,
    isLoggedIn,
    login,
    register,
    logout
  };
});