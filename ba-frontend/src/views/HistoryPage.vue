<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import api from '@/services/api'; // Pastikan path ini benar
import { renderAsync } from 'docx-preview';
import { useRouter } from 'vue-router'; // Impor router untuk navigasi

// --- STATE ---
const historyList = ref([]);
const isLoading = ref(true);
const isBlobLoading = ref(false);
const error = ref(null);

const selectedFileBlob = ref(null);
const selectedNomorBA = ref('');
const isPreviewVisible = ref(false);
const docxContainer = ref(null);
const selectedHistoryId = ref(null);

const router = useRouter(); // Buat instance router

// --- METHODS ---
onMounted(async () => {
  try {
    // --- PERBAIKAN UTAMA: Panggil metode API yang benar ---
    const response = await api.getHistory(); 
    historyList.value = response.data;
  } catch (err) {
    console.error("Gagal mengambil histori:", err);
    error.value = "Gagal mengambil data histori. Silakan coba lagi nanti.";
  } finally {
    isLoading.value = false;
  }
});

// Fungsi untuk menavigasi ke halaman preview
function goToPreview(item) {
  router.push({ name: 'Preview', params: { id: item.id } });
}

// Fungsi loadFile dan downloadFile di sini lebih cocok untuk preview di halaman yang sama
// Anda bisa memilih antara menggunakan fungsi di bawah ini atau goToPreview di atas.

async function loadFile(item) {
  isBlobLoading.value = true;
  isPreviewVisible.value = false;
  selectedFileBlob.value = null;
  selectedHistoryId.value = item.id;
  if (docxContainer.value) docxContainer.value.innerHTML = '';
  
  try {
    const response = await api.getHistoryFile(item.id);
    selectedFileBlob.value = response.data;
    selectedNomorBA.value = item.nomorBA;
  } catch (error) {
    console.error("Gagal memuat file:", error);
    alert("Gagal memuat file dokumen.");
  } finally {
    isBlobLoading.value = false;
  }
}

function downloadFile() {
  if (!selectedFileBlob.value) return;
  const url = window.URL.createObjectURL(selectedFileBlob.value);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `BA-${selectedNomorBA.value}.docx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

async function previewFile() {
  isPreviewVisible.value = !isPreviewVisible.value;
  if (isPreviewVisible.value && selectedFileBlob.value) {
    await nextTick();
    if (docxContainer.value && docxContainer.value.innerHTML === '') {
      await renderAsync(selectedFileBlob.value, docxContainer.value);
    }
  }
}
</script>

<template>
  <div class="history-page">
    <div class="history-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="header-text">
            <h1>Riwayat Berita Acara</h1>
            <p>Kelola dan unduh dokumen berita acara yang telah dibuat</p>
          </div>
        </div>
      </div>

      <!-- Content Section -->
      <div class="content-wrapper">
        <!-- Loading State -->
        <div v-if="isLoading" class="state-card loading-state">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <h3>Memuat Data</h3>
          <p>Sedang mengambil riwayat berita acara...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="state-card error-state">
          <div class="state-icon error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h3>Gagal Memuat Data</h3>
          <p>{{ error }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="historyList.length === 0" class="state-card empty-state">
          <div class="state-icon empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3>Belum Ada Riwayat</h3>
          <p>Anda belum membuat dokumen berita acara. Mulai buat dokumen pertama Anda!</p>
          <button @click="$router.push('/generator')" class="primary-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Buat Dokumen
          </button>
        </div>

        <!-- History Table -->
        <div v-else class="table-container">
          <div class="table-wrapper">
            <table class="history-table">
              <thead>
                <tr>
                  <th>
                    <div class="th-content">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Nomor BA
                    </div>
                  </th>
                  <th>
                    <div class="th-content">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" stroke-width="2"/>
                      </svg>
                      Jenis Template
                    </div>
                  </th>
                  <th>
                    <div class="th-content">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V4.5C4 3.11929 5.11929 2 6.5 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Judul Pekerjaan
                    </div>
                  </th>
                  <th>
                    <div class="th-content">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                      </svg>
                      Tanggal Generate
                    </div>
                  </th>
                  <th>
                    <div class="th-content">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2573 9.77251 19.9887C9.5799 19.7201 9.31074 19.5176 9 19.41C8.69838 19.2769 8.36381 19.2372 8.03941 19.296C7.71502 19.3548 7.41568 19.5095 7.18 19.74L7.12 19.8C6.93425 19.986 6.71368 20.1335 6.47088 20.2341C6.22808 20.3348 5.96783 20.3866 5.705 20.3866C5.44217 20.3866 5.18192 20.3348 4.93912 20.2341C4.69632 20.1335 4.47575 19.986 4.29 19.8C4.10405 19.6143 3.95653 19.3937 3.85588 19.1509C3.75523 18.9081 3.70343 18.6478 3.70343 18.385C3.70343 18.1222 3.75523 17.8619 3.85588 17.6191C3.95653 17.3763 4.10405 17.1557 4.29 16.97L4.35 16.91C4.58054 16.6743 4.73519 16.375 4.794 16.0506C4.85282 15.7262 4.81312 15.3916 4.68 15.09C4.55324 14.7942 4.34276 14.542 4.07447 14.3643C3.80618 14.1866 3.49179 14.0913 3.17 14.09H3C2.46957 14.09 1.96086 13.8793 1.58579 13.5042C1.21071 13.1291 1 12.6204 1 12.09C1 11.5596 1.21071 11.0509 1.58579 10.6758C1.96086 10.3007 2.46957 10.09 3 10.09H3.09C3.42099 10.0823 3.742 9.97512 4.01062 9.78251C4.27925 9.5899 4.48167 9.32074 4.59 9.01C4.72312 8.70838 4.76282 8.37381 4.704 8.04941C4.64519 7.72502 4.49054 7.42568 4.26 7.19L4.2 7.13C4.01405 6.94425 3.86653 6.72368 3.76588 6.48088C3.66523 6.23808 3.61343 5.97783 3.61343 5.715C3.61343 5.45217 3.66523 5.19192 3.76588 4.94912C3.86653 4.70632 4.01405 4.48575 4.2 4.3C4.38575 4.11405 4.60632 3.96653 4.84912 3.86588C5.09192 3.76523 5.35217 3.71343 5.615 3.71343C5.87783 3.71343 6.13808 3.76523 6.38088 3.86588C6.62368 3.96653 6.84425 4.11405 7.03 4.3L7.09 4.36C7.32568 4.59054 7.62502 4.74519 7.94941 4.804C8.27381 4.86282 8.60838 4.82312 8.91 4.69H9C9.29577 4.56324 9.54802 4.35276 9.72569 4.08447C9.90337 3.81618 9.99872 3.50179 10 3.18V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Aksi
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in historyList" :key="item.id" class="history-row">
                  <td>
                    <div class="cell-content nomor-ba">
                      <div class="ba-badge">BA</div>
                      <span class="ba-number">{{ item.nomorBA }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="cell-content template-type">
                      <div class="template-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </div>
                      <span>{{ item.jenisBeritaAcara }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="cell-content work-title">
                      {{ item.judulPekerjaan }}
                    </div>
                  </td>
                  <td>
                    <div class="cell-content date-time">
                      <div class="date">
                        {{ new Date(item.generationTimestamp).toLocaleDateString('id-ID', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        }) }}
                      </div>
                      <div class="time">
                        {{ new Date(item.generationTimestamp).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="cell-content actions">
                      <button @click="goToPreview(item)" class="action-button view-download">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>Lihat & Download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === PAGE LAYOUT === */
.history-page {
  min-height: calc(100vh - 70px);
  padding: 2rem 0;
  background: transparent; /* Inherit from App.vue background */
}

.history-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* === HEADER SECTION === */
.page-header {
  margin-bottom: 2.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 63, 136, 0.1);
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  border-radius: 16px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(0, 63, 136, 0.3);
}

.header-text h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #003f88;
  letter-spacing: -0.5px;
}

.header-text p {
  margin: 0;
  font-size: 1.1rem;
  color: #6c757d;
  line-height: 1.5;
}

/* === CONTENT WRAPPER === */
.content-wrapper {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 63, 136, 0.1);
  overflow: hidden;
}

/* === STATE CARDS === */
.state-card {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.state-card h3 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #495057;
}

.state-card p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
}

/* Loading State */
.loading-state {
  background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
}

.loading-spinner {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e3f2fd;
  border-top: 4px solid #0056b3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%);
}

.error-state h3 {
  color: #d32f2f;
}

.error-icon {
  color: #d32f2f;
}

/* Empty State */
.empty-state {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.state-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty-icon {
  color: #adb5bd;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 63, 136, 0.3);
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 63, 136, 0.4);
}

/* === TABLE STYLES === */
.table-container {
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.history-table thead {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 2px solid rgba(0, 63, 136, 0.1);
}

.history-table th {
  padding: 1.5rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: #495057;
  text-align: left;
  border-bottom: 1px solid rgba(0, 63, 136, 0.1);
  white-space: nowrap;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #003f88;
}

.th-content svg {
  opacity: 0.7;
}

.history-table tbody tr {
  transition: all 0.3s ease;
}

.history-table tbody tr:hover {
  background: rgba(0, 86, 179, 0.05);
  transform: translateX(4px);
}

.history-table td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid rgba(0, 63, 136, 0.08);
  vertical-align: middle;
}

.cell-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* === TABLE CELL STYLES === */
.nomor-ba {
  font-weight: 600;
}

.ba-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 28px;
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.ba-number {
  color: #003f88;
  font-size: 0.95rem;
}

.template-type {
  align-items: flex-start;
}

.template-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%);
  color: #003f88;
  border-radius: 8px;
  flex-shrink: 0;
}

.work-title {
  font-weight: 500;
  color: #495057;
  line-height: 1.4;
  max-width: 300px;
}

.date-time {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.date {
  font-weight: 600;
  color: #003f88;
  font-size: 0.95rem;
}

.time {
  font-size: 0.85rem;
  color: #6c757d;
}

.actions {
  justify-content: flex-end;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #0056b3 0%, #003f88 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 63, 136, 0.2);
}

.action-button:hover {
  background: linear-gradient(135deg, #003f88 0%, #002558 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 63, 136, 0.3);
}

.action-button svg {
  flex-shrink: 0;
}

/* === RESPONSIVE DESIGN === */
@media (max-width: 1024px) {
  .history-container {
    padding: 0 1.5rem;
  }

  .header-content {
    padding: 1.5rem;
  }

  .header-text h1 {
    font-size: 2rem;
  }

  .header-text p {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .history-page {
    padding: 1rem 0;
  }

  .history-container {
    padding: 0 1rem;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
    gap: 1rem;
  }

  .header-icon {
    width: 56px;
    height: 56px;
  }

  .header-text h1 {
    font-size: 1.75rem;
  }

  .header-text p {
    font-size: 0.95rem;
  }

  .state-card {
    padding: 3rem 1.5rem;
  }

  /* Mobile table scrolling */
  .table-wrapper {
    margin: 0 -1rem;
    padding: 0 1rem;
  }

  .history-table th,
  .history-table td {
    padding: 1rem 0.75rem;
  }

  .work-title {
    max-width: 200px;
  }

  .action-button span {
    display: none;
  }

  .action-button {
    padding: 0.75rem;
  }
}

@media (max-width: 640px) {
  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-content {
    padding: 1rem;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }

  .header-text h1 {
    font-size: 1.5rem;
  }

  .header-text p {
    font-size: 0.875rem;
  }

  .state-card {
    padding: 2rem 1rem;
  }

  .state-card h3 {
    font-size: 1.25rem;
  }

  /* Stack table cells for mobile */
  .history-table,
  .history-table thead,
  .history-table tbody,
  .history-table th,
  .history-table td,
  .history-table tr {
    display: block;
  }

  .history-table thead tr {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }

  .history-table tr {
    background: white;
    border: 1px solid rgba(0, 63, 136, 0.1);
    border-radius: 12px;
    margin-bottom: 1rem;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .history-table tr:hover {
    transform: none;
    background: rgba(0, 86, 179, 0.05);
  }

  .history-table td {
    border: none;
    border-bottom: 1px solid rgba(0, 63, 136, 0.05);
    position: relative;
    padding: 0.75rem 0;
  }

  .history-table td:last-child {
    border-bottom: none;
    padding-top: 1rem;
  }

  .history-table td::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    width: 45%;
    padding-right: 10px;
    white-space: nowrap;
    font-weight: 600;
    color: #003f88;
    font-size: 0.875rem;
  }

  .cell-content {
    margin-left: 45%;
    justify-content: flex-start;
  }

  .actions .cell-content {
    justify-content: flex-end;
    margin-left: 0;
  }

  .work-title {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .history-container {
    padding: 0 0.75rem;
  }

  .ba-number {
    font-size: 0.85rem;
  }

  .action-button {
    padding: 0.625rem;
  }
}
</style>

<script>
// Add data attributes for mobile labels
import { nextTick } from 'vue';

export default {
  mounted() {
    this.addMobileLabels();
  },
  updated() {
    this.addMobileLabels();
  },
  methods: {
    addMobileLabels() {
      nextTick(() => {
        const rows = this.$el.querySelectorAll('.history-table tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          const labels = ['Nomor BA', 'Jenis Template', 'Judul Pekerjaan', 'Tanggal Generate', 'Aksi'];
          cells.forEach((cell, index) => {
            cell.setAttribute('data-label', labels[index]);
          });
        });
      });
    }
  }
}
</script>