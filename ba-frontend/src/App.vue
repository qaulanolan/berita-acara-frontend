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
  <div id="app">
    <header class="main-header">
      <div class="header-container">
        <!-- Logo/Brand Section -->
        <div class="brand-section">
          <div class="brand-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="brand-text">PLN Icon Plus</span>
        </div>

        <!-- Navigation Links (Center) -->
        <nav class="main-nav">
          <!-- Tampilkan link ini HANYA jika pengguna sudah login -->
          <template v-if="authStore.isLoggedIn">
            <RouterLink v-if="authStore.isAdmin" to="/admin/templates" class="nav-link admin-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15L12 3M12 3L16 7M12 3L8 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 17L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 21L22 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Admin
            </RouterLink>
            <RouterLink to="/generator" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Generator
            </RouterLink>
            <RouterLink to="/history" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Riwayat
            </RouterLink>
            <RouterLink to="/preview" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
              Preview
            </RouterLink>
          </template>

          <!-- Tampilkan link ini HANYA jika pengguna BELUM login -->
          <template v-else>
            <RouterLink to="/login" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="10,17 15,12 10,7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Login
            </RouterLink>
            <RouterLink to="/register" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 4.17157 16.1716C3.42143 16.9217 3 17.9391 3 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Register
            </RouterLink>
          </template>
        </nav>

        <!-- User Section (Right) -->
        <div class="user-section">
          <div v-if="authStore.isLoggedIn" class="user-info">
            <div class="user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 4.17157 16.1716C3.42143 16.9217 3 17.9391 3 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span v-if="authStore.user" class="user-greeting">{{ authStore.user.username }}</span>
            <button @click="handleLogout" class="logout-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <KeepAlive exclude="HistoryPage">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </KeepAlive>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
/* === GLOBAL APP STYLES === */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 50%, #f8f9fa 100%);
  background-attachment: fixed;
}

/* === HEADER STYLES === */
.main-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 63, 136, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 70px;
  gap: 2rem;
}

/* === BRAND SECTION === */
.brand-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 63, 136, 0.3);
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #003f88;
  letter-spacing: -0.5px;
}

/* === NAVIGATION STYLES === */
.main-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  color: #495057;
  font-weight: 500;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.3s ease;
  position: relative;
  font-size: 0.95rem;
  white-space: nowrap;
}

.nav-link:hover {
  background: rgba(0, 86, 179, 0.1);
  color: #0056b3;
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 63, 136, 0.3);
}

.nav-link.admin-link {
  background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%);
  color: #003f88;
  font-weight: 600;
}

.nav-link.admin-link:hover {
  background: linear-gradient(135deg, #ffb300 0%, #ff8f00 100%);
  color: #003f88;
}

.nav-link.admin-link.router-link-active {
  background: linear-gradient(135deg, #ffb300 0%, #ff8f00 100%);
  color: #003f88;
  box-shadow: 0 4px 12px rgba(255, 179, 0, 0.4);
}

/* === USER SECTION === */
.user-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: rgba(0, 63, 136, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(0, 63, 136, 0.1);
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  border-radius: 8px;
  color: white;
}

.user-greeting {
  font-weight: 600;
  color: #003f88;
  font-size: 0.95rem;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: #dc3545;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

/* === MAIN CONTENT === */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* === PAGE TRANSITIONS === */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* === RESPONSIVE DESIGN === */
@media (max-width: 1024px) {
  .header-container {
    padding: 0 1.5rem;
    gap: 1.5rem;
  }

  .main-nav {
    gap: 0.25rem;
  }

  .nav-link {
    padding: 0.625rem 1rem;
    font-size: 0.9rem;
  }

  .brand-text {
    font-size: 1.25rem;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 1rem;
    gap: 1rem;
    min-height: 60px;
  }

  .brand-section {
    gap: 0.5rem;
  }

  .brand-icon {
    width: 36px;
    height: 36px;
  }

  .brand-text {
    font-size: 1.1rem;
  }

  .main-nav {
    gap: 0.25rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    gap: 0.375rem;
  }

  .nav-link svg {
    width: 14px;
    height: 14px;
  }

  .user-info {
    gap: 0.5rem;
    padding: 0.375rem;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
  }

  .user-greeting {
    font-size: 0.875rem;
    display: none; /* Hide username on mobile to save space */
  }

  .logout-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
    gap: 0.375rem;
  }

  .logout-button svg {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 640px) {
  .header-container {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    min-height: auto;
  }

  .main-nav {
    order: 2;
    width: 100%;
  }

  .user-section {
    order: 3;
  }

  .brand-section {
    order: 1;
  }
}

@media (max-width: 480px) {
  .nav-link span:not(.admin-link span) {
    display: none; /* Show only icons on very small screens */
  }

  .nav-link {
    padding: 0.5rem;
  }

  .logout-button span {
    display: none; /* Show only icon for logout */
  }

  .logout-button {
    padding: 0.5rem;
  }
}
</style>