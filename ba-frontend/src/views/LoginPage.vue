<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
// --- PERUBAHAN: Impor useRoute untuk membaca query parameter ---
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute(); // <-- Dapatkan informasi rute saat ini

const username = ref('');
const password = ref('');
const error = ref(null);

async function handleLogin() {
  error.value = null;
  try {
    await authStore.login(username.value, password.value);

    // --- PERBAIKAN UTAMA: Logika Pengalihan Berdasarkan Peran ---
    
    // Prioritas pertama: Cek apakah ada tujuan redirect dari URL.
    // Ini berguna jika pengguna mencoba mengakses halaman admin sebelum login.
    const redirectPath = route.query.redirect;
    if (redirectPath) {
      router.push(redirectPath);
      return; // Hentikan eksekusi di sini
    }
    
    // Prioritas kedua: Jika tidak ada redirect, cek peran pengguna.
    if (authStore.isAdmin) {
      // Jika pengguna adalah admin, arahkan ke halaman manajemen template.
      router.push({ name: 'AdminTemplateManager' });
    } else {
      // Jika bukan admin (pengguna biasa), arahkan ke halaman generator.
      router.push({ name: 'Generator' });
    }
    
  } catch (err) {
    error.value = 'Username atau password salah.';
    console.error('Login failed:', err);
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <!-- ... (Isi form Anda sudah benar, tidak perlu diubah) ... -->
        <div class="input-group">
          <label for="username">Username</label>
          <input id="username" type="text" v-model="username" required placeholder="Masukkan username">
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <input id="password" type="password" v-model="password" required placeholder="Masukkan password">
        </div>
        <p v-if="error" class="error-message">{{ error }}</p>
        <button type="submit" :disabled="authStore.isLoading">
          {{ authStore.isLoading ? 'Loading...' : 'Login' }}
        </button>
        <div class="register-link">
            <p>Belum punya akun? <router-link to="/register">Registrasi di sini</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f9f9f9;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.login-box {
  background: white;
  padding: 2.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}
.input-group {
  margin-bottom: 1.5rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
}
.error-message {
  color: #dc3545;
  text-align: center;
  margin-bottom: 1rem;
}
button {
  width: 100%;
  padding: 0.8rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
}
button:disabled {
  background-color: #ccc;
}
.register-link {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9em;
}
</style>