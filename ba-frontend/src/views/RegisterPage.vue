<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
// const role = ref('user'); // Default role
const error = ref(null);
const success = ref(null);

async function handleRegister() {
  error.value = null;
  success.value = null;
  if (password.value.length < 4) {
      error.value = 'Password minimal 4 karakter.';
      return;
  }
  try {
    const message = await authStore.register(username.value, password.value);
    success.value = message + " Anda akan diarahkan ke halaman login.";
    setTimeout(() => {
        router.push('/login');
    }, 2000);
  } catch (err) {
    error.value = err.message || 'Registrasi gagal.';
  }
}
</script>

<template>
  <div class="register-container">
    <div class="register-box">
      <h2>Registrasi Akun Baru</h2>
      <form @submit.prevent="handleRegister">
        <div class="input-group">
          <label for="username">Username</label>
          <input id="username" type="text" v-model="username" placeholder="Username unik" required>
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <input id="password" type="password" v-model="password" placeholder="Minimal 4 karakter" required>
        </div>
        <!-- <div class="input-group">
          <label for="role">Role</label>
          <select id="role" v-model="role">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div> -->
        <p v-if="error" class="error-message">{{ error }}</p>
        <p v-if="success" class="success-message">{{ success }}</p>
        <button type="submit" :disabled="authStore.isLoading">
          {{ authStore.isLoading ? 'Mendaftarkan...' : 'Register' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Anda bisa menggunakan style yang mirip dengan LoginPage.vue */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.register-box {
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
.success-message {
  color: #28a745;
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
</style>