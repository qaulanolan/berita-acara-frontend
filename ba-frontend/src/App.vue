<script setup>
import { RouterLink, RouterView } from 'vue-router'
// 1. Impor store otentikasi Anda
import { useAuthStore } from './stores/auth';

// 2. Buat instance dari store
const authStore = useAuthStore();

// 3. Buat fungsi untuk menangani logout
function handleLogout() {
  authStore.logout();
}
</script>

<template>
  <header class="main-header">
    <div class="wrapper">
      <nav>
        <div v-if="authStore.isLoggedIn" class="nav-logout">
          <button @click="handleLogout" class="nav-button">Logout</button>
        </div>
        <!-- Tampilkan link ini HANYA jika pengguna sudah login -->
        <template v-if="authStore.isLoggedIn">
          <RouterLink to="/">Generator</RouterLink>
          <RouterLink to="/history">Riwayat</RouterLink>
          <RouterLink to="/preview">Preview</RouterLink>
          <!-- Tombol Logout -->
          <!-- <button @click="handleLogout" class="nav-button">Logout</button> -->
        </template>
        <div v-if="authStore.isLoggedIn" class="nav-user">
          <span v-if="authStore.user" class="user-greeting">{{ authStore.user.username }}</span>
        </div>

        <!-- Tampilkan link ini HANYA jika pengguna BELUM login -->
        <template v-else>
          <RouterLink to="/login">Login</RouterLink>
          <RouterLink to="/register">Register</RouterLink>
        </template>
      </nav>
    </div>
  </header>

  <div class="content">
  </div>
  <RouterView v-slot="{ Component }">
    <KeepAlive exclude="HistoryPage">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  flex-shrink: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

nav {
  width: 100%;
  font-size: 1rem;
  box-sizing: border-box;
  position: relative; 
  display: flex;
  justify-content: center; /* Membuat .nav-links berada di tengah */
  align-items: center;
}

nav a{
  display: inline-block;
  padding: 0.75rem 1.5rem;
  margin: 0 0.5rem;
  color: #333;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 0.2s, color 0.2s;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: inherit;
}

nav a:hover, .nav-button:hover {
  background-color: #f4f4f4;
}

nav a.router-link-exact-active {
  background-color: #007bff;
  color: white;
}
.nav-logout {
  position: absolute;
  left: 2rem; /* Jarak dari ujung kiri */
  top: 50%;
  transform: translateY(-50%); /* Trik untuk membuatnya pas di tengah vertikal */
}

.nav-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  transition: background-color 0.2s, color 0.2s;
  color: #dc3545;
}

.nav-button:hover {
  background-color: #f4f4f4;
}

.nav-user {
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
}
.user-greeting {
  font-weight: 600;
  color: #555;
}

/* .content {
  flex-grow: 1;
  padding: 1rem;
} */
</style>