// import { defineStore } from 'pinia';
// import api from '@/services/api'; // Pastikan path ini benar
// import { ref, computed } from 'vue';
// import { useRouter } from 'vue-router';

// export const useAuthStore = defineStore('auth', () => {
//   // --- STATE ---
//   const token = ref(localStorage.getItem('token') || null);
  
//   // --- PERUBAHAN: Inisialisasi user dari localStorage ---
//   // Ini penting agar role tetap ada setelah refresh halaman
//   const user = ref(JSON.parse(localStorage.getItem('user')) || { username: null, role: null });
  
//   const isLoading = ref(false);
//   const router = useRouter();

//   // --- GETTERS ---
//   const isLoggedIn = computed(() => !!token.value);
  
//   // --- GETTER BARU: Untuk memeriksa apakah pengguna adalah admin ---
//   const isAdmin = computed(() => user.value?.role === 'ADMIN');

//   // --- ACTIONS ---
//   async function fetchUser() {
//     if (token.value) {
//       try {
//         const response = await api.getMe('/auth/me'); // Gunakan api yang sudah di-setup
//         user.value = response.data; // Responsnya akan berupa { username: '...', role: '...' }
        
//         // --- PERUBAHAN: Simpan data user ke localStorage ---
//         localStorage.setItem('user', JSON.stringify(user.value));
        
//       } catch (error) {
//         console.error("Gagal mengambil data user (token mungkin tidak valid):", error);
//         // Jika gagal (misal token kedaluwarsa), lakukan logout
//         logout();
//       }
//     }
//   }

//   async function login(username, password) {
//     isLoading.value = true;
//     try {
//       const response = await api.post('/auth/login', { username, password });
      
//       // --- PERUBAHAN: Ambil token dari objek JSON ---
//       // Backend sekarang mengembalikan { "token": "..." }
//       const receivedToken = response.data.token;
//       token.value = receivedToken;
//       localStorage.setItem('token', receivedToken);

//       // Panggil fetchUser untuk mendapatkan detail user (termasuk role)
//       await fetchUser(); 

//     } catch (error) {
//       logout(); // Bersihkan state jika login gagal
//       throw error; // Lempar error agar bisa ditangani di komponen
//     } finally {
//       isLoading.value = false;
//     }
//   }

//   function logout() {
//     token.value = null;
    
//     // --- PERUBAHAN: Reset user state ke nilai awal ---
//     user.value = { username: null, role: null };
    
//     localStorage.removeItem('token');
    
//     // --- PERUBAHAN: Hapus juga data user dari localStorage ---
//     localStorage.removeItem('user');
    
//     router.push('/login');
//   }

//   async function register(username, password) {
//     isLoading.value = true;
//     try {
//       const response = await api.post('/auth/register', { username, password });
//       return response.data.message;
//     } catch (error) {
//       // Penanganan error sudah cukup baik
//       if (error.response && error.response.data && error.response.data.error) {
//         throw new Error(error.response.data.error);
//       }
//       throw new Error('Terjadi kesalahan saat registrasi.');
//     } finally {
//       isLoading.value = false;
//     }
//   }

//   return {
//     // State
//     token,
//     user,
//     isLoading,
//     // Getters
//     isLoggedIn,
//     isAdmin, // <-- Export getter baru
//     // Actions
//     login,
//     register,
//     logout,
//     fetchUser, // <-- Export fetchUser agar bisa dipanggil dari luar jika perlu
//   };
// });

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