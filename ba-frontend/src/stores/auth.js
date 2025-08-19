import { defineStore } from 'pinia';
import api from '@/services/api'; // 'api' adalah objek kita, bukan axios
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user')) || { username: null, role: null });
  const isLoading = ref(false);
  const router = useRouter();
  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  async function fetchUser() {
    if (token.value) {
      try {
        // PERBAIKAN: Panggil metode getMe() dari objek api
        const response = await api.getMe();
        user.value = response.data;
        localStorage.setItem('user', JSON.stringify(user.value));
      } catch (error) {
        console.error("Gagal mengambil data user (token mungkin tidak valid):", error);
        logout();
      }
    }
  }

  async function login(username, password) {
    isLoading.value = true;
    try {
      // PERBAIKAN: Panggil metode login() dari objek api
      const response = await api.login({ username, password });
      
      const receivedToken = response.data.token;
      token.value = receivedToken;
      localStorage.setItem('token', receivedToken);
      await fetchUser();
    } catch (error) {
      logout();
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = { username: null, role: null };
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  async function register(username, password) {
    isLoading.value = true;
    try {
      // PERBAIKAN: Panggil metode register() dari objek api
      const response = await api.register({ username, password });
      return response.data.message;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Terjadi kesalahan saat registrasi.');
    } finally {
      isLoading.value = false;
    }
  }

  return {
    token,
    user,
    isLoading,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    fetchUser,
  };
});